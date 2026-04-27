const BODY_PART_HINTS = [
  ['neck', ['neck', 'cervical', 'c4', 'c5', 'c6', 'c7']],
  ['low_back', ['low back', 'lower back', 'lumbar', 'l4', 'l5', 's1']],
  ['mid_back', ['mid back', 'thoracic', 'upper back']],
  ['shoulder', ['shoulder', 'rotator cuff']],
  ['knee', ['knee', 'meniscus', 'acl', 'pcl']],
  ['head', ['head', 'concussion', 'migraine', 'headache']],
  ['wrist', ['wrist', 'carpal']],
  ['ankle', ['ankle', 'achilles']],
  ['hip', ['hip', 'pelvis']],
];

const SYMPTOM_HINTS = [
  ['pain', ['pain', 'ache', 'sore', 'herniation', 'bulge', 'strain', 'sprain', 'impingement']],
  ['numbness', ['numbness', 'numb']],
  ['tingling', ['tingling', 'pins and needles']],
  ['headaches', ['headache', 'headaches', 'migraine']],
  ['weakness', ['weakness', 'weak']],
  ['limited_motion', ['limited motion', 'limited range', 'stiff', 'stiffness', 'reduced range']],
  ['loss_of_consciousness', ['loss of consciousness', 'passed out', 'blackout']],
];

function detectFirstMatch(text, hints, fallback) {
  const source = String(text || '').toLowerCase();
  for (const [value, keywords] of hints) {
    if (keywords.some((k) => source.includes(k))) return value;
  }
  return fallback;
}

function detectSeverity(text) {
  const source = String(text || '').toLowerCase();
  if (source.includes('severe') || source.includes('8/10') || source.includes('9/10') || source.includes('10/10')) {
    return 'severe';
  }
  if (source.includes('moderate') || source.includes('5/10') || source.includes('6/10') || source.includes('7/10')) {
    return 'moderate';
  }
  return 'mild';
}

export function parseQuickInjuryInput(inputText, currentForm = {}) {
  const text = String(inputText || '').trim();
  if (!text) return null;

  const bodyPart = detectFirstMatch(text, BODY_PART_HINTS, currentForm.bodyPart || 'other');
  const symptomType = detectFirstMatch(text, SYMPTOM_HINTS, currentForm.symptomType || 'pain');
  const severityLevel = detectSeverity(text) || currentForm.severityLevel || 'mild';

  return {
    ...currentForm,
    bodyPart,
    symptomType,
    severityLevel,
    notes: text,
  };
}
