// Validation helpers for chat-based case draft

const REQUIRED_FIELDS = [
  'contact.fullName',
  'contact.phone',
  'contact.email',
  'accident.dateOfLoss',
  'accident.accidentType',
  'insurance.clientAutoInsurance',
  'insurance.otherPartyInsurance',
  'injury.injured',
  'propertyDamage.hasDamage',
];

// Important but optional details we still want to ask about in chat
const OPTIONAL_FIELDS = [
  'accident.atFaultIdentified',
  'accident.policeReport',
  'injury.treatmentLocation',
  'injury.treatmentDates',
  'injury.knownInjuries',
  'injury.stillTreating',
  'propertyDamage.severity',
];

function getValue(draft, path) {
  return path.split('.').reduce((val, key) => (val && val[key] != null ? val[key] : undefined), draft || {});
}

export function getMissingFields(draft) {
  const missing = [];

  for (const path of REQUIRED_FIELDS) {
    const value = getValue(draft, path);
    if (!value || String(value).trim() === '') {
      missing.push(path);
    }
  }

  if (
    getValue(draft, 'accident.accidentType') === 'Other' &&
    (!getValue(draft, 'accident.accidentTypeDescription') ||
      !String(getValue(draft, 'accident.accidentTypeDescription')).trim())
  ) {
    missing.push('accident.accidentTypeDescription');
  }

  return missing;
}

export function getOptionalMissingFields(draft) {
  const missing = [];

  for (const path of OPTIONAL_FIELDS) {
    const value = getValue(draft, path);
    if (value == null || String(value).trim() === '') {
      missing.push(path);
    }
  }

  return missing;
}

export function getNextQuestionForField(fieldPath) {
  switch (fieldPath) {
    case 'contact.fullName':
      return 'What is your full name?';
    case 'contact.phone':
      return 'What is the best phone number to reach you?';
    case 'contact.email':
      return 'What is your email address?';
    case 'accident.dateOfLoss':
      return 'When did the accident happen? (You can share the date.)';
    case 'accident.accidentType':
      return 'What kind of accident was it? For example, car crash, slip and fall, pedestrian, or something else?';
    case 'accident.accidentTypeDescription':
      return 'Please describe the type of accident in a few words.';
    case 'insurance.clientAutoInsurance':
      return 'Do you have auto insurance? (Yes, No, or Unsure)';
    case 'insurance.otherPartyInsurance':
      return 'Does the other party have insurance, as far as you know? (Yes, No, or Unsure)';
    case 'injury.injured':
      return 'Were you injured in the accident? (Yes or No)';
    case 'propertyDamage.hasDamage':
      return 'Was there any damage to your vehicle or other property? (Yes or No)';
    case 'accident.atFaultIdentified':
      return 'Was the at-fault party identified? (Yes, No, or Unknown)';
    case 'accident.policeReport':
      return 'Was a police report filed for this accident? (Yes, No, or Unknown)';
    case 'injury.treatmentLocation':
      return 'Where did you receive treatment, if any? For example, emergency room, urgent care, primary doctor, or not yet.';
    case 'injury.treatmentDates':
      return 'When did you receive treatment? You can mention approximate dates.';
    case 'injury.knownInjuries':
      return 'Can you briefly describe the injuries you suffered?';
    case 'injury.stillTreating':
      return 'Are you still receiving treatment now? (Yes or No)';
    case 'propertyDamage.severity':
      return 'How severe is the property damage? For example, minor, moderate, severe, or total loss.';
    default:
      return 'Please share any additional details that might help with your case.';
  }
}

