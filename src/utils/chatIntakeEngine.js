// Chat intake engine: merges user messages into a case draft and asks follow-ups

import { extractCaseFields } from './extractCaseFields';
import { getMissingFields, getOptionalMissingFields, getNextQuestionForField } from './caseDraftValidation';

export function createEmptyDraft() {
  return {
    contact: {},
    accident: {},
    insurance: {},
    injury: {},
    propertyDamage: {},
    additionalNotes: '',
  };
}

export function applyPatchesToDraft(draft, patches) {
  const next = { ...draft };
  for (const { path, value } of patches) {
    const keys = path.split('.');
    let cursor = next;
    keys.forEach((key, idx) => {
      if (idx === keys.length - 1) {
        cursor[key] = value;
      } else {
        cursor[key] = cursor[key] || {};
        cursor = cursor[key];
      }
    });
  }
  return next;
}

function parseYesNoShort(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  if (t === 'y' || t === 'yes' || t === 'yeah' || t === 'yep') return 'Yes';
  if (t === 'n' || t === 'no' || t === 'nope' || t === 'nah') return 'No';
  if (t === 'unknown' || t === 'idk' || t === 'dont know' || t === "don't know") return 'Unknown';
  if (t === 'unsure' || t === 'not sure' || t === 'maybe') return 'Unsure';
  return null;
}

function patchFromLastAskedField(lastAskedField, userText) {
  if (!lastAskedField) return [];

  const yn = parseYesNoShort(userText);
  if (yn) {
    const ynFields = new Set([
      'insurance.clientAutoInsurance',
      'insurance.otherPartyInsurance',
      'injury.injured',
      'propertyDamage.hasDamage',
      'accident.atFaultIdentified',
      'accident.policeReport',
    ]);
    if (ynFields.has(lastAskedField)) {
      return [{ path: lastAskedField, value: yn, confidence: 0.9 }];
    }
  }

  // If we just asked for the user's name and they replied with any non-empty text,
  // treat that reply as the full name.
  if (lastAskedField === 'contact.fullName') {
    const cleanedName = String(userText || '').trim();
    if (cleanedName.length > 0) {
      return [{ path: lastAskedField, value: cleanedName, confidence: 0.8 }];
    }
  }

  if (lastAskedField === 'contact.phone') {
    const digits = String(userText || '').replace(/[^\d+]/g, '');
    if (digits.length >= 10) {
      return [{ path: lastAskedField, value: digits, confidence: 0.95 }];
    }
  }

  if (lastAskedField === 'injury.treatmentLocation') {
    const t = String(userText || '').trim().toLowerCase();
    if (!t) return [];
    if (t.includes('er') || t.includes('emergency')) return [{ path: lastAskedField, value: 'ER', confidence: 0.85 }];
    if (t.includes('urgent')) return [{ path: lastAskedField, value: 'Urgent Care', confidence: 0.85 }];
    if (t.includes('primary') || t.includes('doctor') || t.includes('physician')) return [{ path: lastAskedField, value: 'Primary', confidence: 0.75 }];
    if (t.includes('none') || t.includes('not yet') || t.includes('no')) return [{ path: lastAskedField, value: 'None yet', confidence: 0.85 }];
    // fallback: store raw text
    return [{ path: lastAskedField, value: String(userText || '').trim(), confidence: 0.6 }];
  }

  if (lastAskedField === 'injury.treatmentDates') {
    const cleaned = String(userText || '').trim();
    if (cleaned.length > 0) return [{ path: lastAskedField, value: cleaned, confidence: 0.6 }];
  }

  if (lastAskedField === 'injury.knownInjuries') {
    const cleaned = String(userText || '').trim();
    if (cleaned.length > 0) return [{ path: lastAskedField, value: cleaned, confidence: 0.65 }];
  }

  if (lastAskedField === 'injury.stillTreating') {
    const val = parseYesNoShort(userText);
    if (val === 'Yes' || val === 'No') return [{ path: lastAskedField, value: val, confidence: 0.9 }];
  }

  if (lastAskedField === 'propertyDamage.severity') {
    const t = String(userText || '').trim().toLowerCase();
    if (!t) return [];
    if (t.includes('total') || t.includes('tot')) return [{ path: lastAskedField, value: 'Total Loss', confidence: 0.85 }];
    if (t.includes('severe') || t.includes('major')) return [{ path: lastAskedField, value: 'Severe', confidence: 0.8 }];
    if (t.includes('moderate') || t.includes('medium')) return [{ path: lastAskedField, value: 'Moderate', confidence: 0.8 }];
    if (t.includes('minor') || t.includes('small') || t.includes('light')) return [{ path: lastAskedField, value: 'Minor', confidence: 0.8 }];
    return [{ path: lastAskedField, value: String(userText || '').trim(), confidence: 0.55 }];
  }

  if (lastAskedField === 'accident.accidentTypeDescription') {
    const cleaned = String(userText || '').trim();
    if (cleaned.length > 0) {
      return [{ path: lastAskedField, value: cleaned, confidence: 0.7 }];
    }
  }

  // Free-text fallback: if we asked for name/phone/email, let the extractor handle it.
  return [];
}

export function processUserMessage(state, userText) {
  const userMessage = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    text: userText,
    createdAt: new Date().toISOString(),
  };

  const messages = [...(state.messages || []), userMessage];
  const extracted = extractCaseFields(userText) || [];
  const fieldSpecific = patchFromLastAskedField(state.lastAskedField, userText) || [];

  // Merge patches, letting field-specific ones override extractor for the same path
  const byPath = new Map();
  extracted.forEach((p) => {
    if (p && p.path) byPath.set(p.path, p);
  });
  fieldSpecific.forEach((p) => {
    if (p && p.path) byPath.set(p.path, p);
  });

  const patches = Array.from(byPath.values());
  const draft = applyPatchesToDraft(state.draft || createEmptyDraft(), patches);

  const requiredMissing = getMissingFields(draft);
  const optionalMissing = requiredMissing.length === 0 ? getOptionalMissingFields(draft) : [];

  // When all required and optional questions have been addressed, we are ready for preview.
  if (requiredMissing.length === 0 && optionalMissing.length === 0) {
    const assistantMessage = {
      id: `msg-${Date.now()}-assistant`,
      sender: 'assistant',
      text:
        'Thank you, I have enough information to build your case summary. You can review the details and submit your case when you are ready.',
      createdAt: new Date().toISOString(),
    };
    return {
      draft,
      messages: [...messages, assistantMessage],
      status: 'ready_for_preview',
      lastAskedField: null,
    };
  }

  // Prefer required fields first; once they are done, move through optional fields.
  const nextField = requiredMissing.length > 0 ? requiredMissing[0] : optionalMissing[0];
  const question = getNextQuestionForField(nextField);
  const lastAssistant = [...messages].reverse().find((m) => m.sender === 'assistant');
  const shouldAsk = !(lastAssistant && lastAssistant.text === question);
  const assistantMessage = shouldAsk
    ? {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: question,
        createdAt: new Date().toISOString(),
      }
    : null;

  return {
    draft,
    messages: assistantMessage ? [...messages, assistantMessage] : messages,
    status: 'collecting',
    lastAskedField: nextField,
  };
}

