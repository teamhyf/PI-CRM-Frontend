// Utility to extract structured case fields from free text for chat intake

function parseYesNo(value) {
  if (!value) return null;
  const text = value.toLowerCase();
  if (/(^|\b)(yes|yeah|yep|of course|sure)(\b|$)/.test(text)) return 'Yes';
  if (/(^|\b)(no|nope|nah)(\b|$)/.test(text)) return 'No';
  if (/(^|\b)(unsure|not sure|don\'t know|dont know|maybe)(\b|$)/.test(text)) return 'Unsure';
  return null;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigitsRegex = /(\+?\d[\d\-\s().]{6,}\d)/;
const isoLikeDateRegex = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/;
const usDateRegex = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/;

function normalizeDateToISO(raw) {
  if (!raw) return null;
  let m = raw.match(isoLikeDateRegex);
  if (m) {
    const [, y, mo, d] = m;
    return `${y.padStart(4, '0')}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  m = raw.match(usDateRegex);
  if (m) {
    let [, mo, d, y] = m;
    if (y.length === 2) y = `20${y}`;
    return `${y.padStart(4, '0')}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

function detectAccidentType(text) {
  const t = text.toLowerCase();
  if (/(car|auto|vehicle|truck|rear[- ]end|t[- ]bone|collision|crash)/.test(t)) {
    return 'Motor vehicle accident';
  }
  if (/pedestrian/.test(t)) return 'Pedestrian';
  if (/bicycle|bike/.test(t)) return 'Bicycle';
  if (/motorcycle|motor bike|motorbike/.test(t)) return 'Motorcycle';
  if (/slip|trip|fall/.test(t)) return 'Slip and fall';
  return null;
}

function detectName(text) {
  const m = text.match(/\b(my name is|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i);
  return m ? m[2].trim() : null;
}

export function extractCaseFields(messageText) {
  const patches = [];
  if (!messageText) return patches;

  const text = messageText.trim();

  const emailMatch = text.match(/[^\s]+@[^\s]+/);
  if (emailMatch && emailRegex.test(emailMatch[0])) {
    patches.push({ path: 'contact.email', value: emailMatch[0], confidence: 0.95 });
  }

  // Phone detection – handle normal and unicode separators
  const phoneMatch = text.match(phoneDigitsRegex);
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/[^\d+]/g, '');
    if (digits.length >= 10) {
      patches.push({ path: 'contact.phone', value: digits, confidence: 0.9 });
    }
  } else if (/(phone|call|reach|contact)/i.test(text)) {
    // Fallback: grab all digits when user is clearly talking about phone
    const rawDigits = messageText.replace(/[^\d+]/g, '');
    if (rawDigits.length >= 10) {
      patches.push({ path: 'contact.phone', value: rawDigits, confidence: 0.85 });
    }
  }

  const name = detectName(text);
  if (name) {
    patches.push({ path: 'contact.fullName', value: name, confidence: 0.8 });
  }

  const dateMatch = text.match(isoLikeDateRegex) || text.match(usDateRegex);
  if (dateMatch) {
    const iso = normalizeDateToISO(dateMatch[0]);
    if (iso) {
      patches.push({ path: 'accident.dateOfLoss', value: iso, confidence: 0.9 });
    }
  }

  const accType = detectAccidentType(text);
  if (accType) {
    patches.push({ path: 'accident.accidentType', value: accType, confidence: 0.8 });
  }

  // Injury description – if user is talking about pain/injuries, capture it
  if (/(injur|pain|hurt|twist|sprain|fracture|broke|broken|whiplash|bruise|ankle|back|neck|shoulder)/i.test(text)) {
    patches.push({
      path: 'injury.knownInjuries',
      value: messageText.trim(),
      confidence: 0.7,
    });
  }

  const yn = parseYesNo(text);
  if (yn) {
    if (/your (auto )?insurance|my insurance|i have insurance/i.test(text)) {
      patches.push({ path: 'insurance.clientAutoInsurance', value: yn, confidence: 0.8 });
    }
    if (/other (driver|party).*insurance|their insurance/i.test(text)) {
      patches.push({ path: 'insurance.otherPartyInsurance', value: yn, confidence: 0.8 });
    }
    if (/were you injured|i was injured|any injuries/i.test(text)) {
      patches.push({ path: 'injury.injured', value: yn, confidence: 0.8 });
    }
    if (/property damage|car damage|vehicle damage|was there damage/i.test(text)) {
      patches.push({ path: 'propertyDamage.hasDamage', value: yn, confidence: 0.8 });
    }
  }

  return patches;
}

