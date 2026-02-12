/**
 * AI Case Summary Generator
 * Generates a natural language summary of the case based on collected data
 */

/**
 * Generates an AI-style case summary paragraph
 * @param {Object} caseData - Complete case data object
 * @returns {string} Generated summary text
 */
export function generateCaseSummary(caseData) {
  const { contact, accident, insurance, injury, propertyDamage } = caseData;
  const parts = [];

  // Opening with name and date
  const clientName = contact?.fullName || 'The client';
  const accidentDate = accident?.dateOfLoss
    ? new Date(accident.dateOfLoss).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'an unspecified date';

  parts.push(`${clientName} reports`);

  // Accident type and details
  const accidentType = accident?.accidentType || 'an accident';
  let accidentDescription = '';

  switch (accidentType) {
    case 'Motor vehicle accident':
      accidentDescription = 'a motor vehicle collision';
      if (accident?.collisionType) {
        accidentDescription += ` (${accident.collisionType.toLowerCase()})`;
      }
      break;
    case 'Pedestrian':
      accidentDescription = 'a pedestrian accident';
      break;
    case 'Bicycle':
      accidentDescription = 'a bicycle accident';
      break;
    case 'Motorcycle':
      accidentDescription = 'a motorcycle accident';
      break;
    case 'Slip and fall':
      accidentDescription = 'a slip and fall incident';
      break;
    default:
      accidentDescription = accident?.accidentTypeDescription
        ? `a ${accident.accidentTypeDescription.toLowerCase()}`
        : 'an accident';
  }

  parts.push(accidentDescription);
  parts.push(`on ${accidentDate}.`);

  // At-fault and police report
  const faultInfo = [];
  if (accident?.atFaultIdentified === 'Yes') {
    faultInfo.push('The at-fault party was identified');
  } else if (accident?.atFaultIdentified === 'No') {
    faultInfo.push('The at-fault party was not identified');
  }

  if (accident?.policeReport === 'Yes') {
    faultInfo.push('a police report was taken');
  } else if (accident?.policeReport === 'No') {
    faultInfo.push('no police report was taken');
  }

  if (faultInfo.length > 0) {
    parts.push(faultInfo.join(' and') + '.');
  }

  // Injury and treatment
  if (injury?.injured === 'Yes') {
    const treatmentInfo = [];
    if (injury?.treatmentLocation && injury.treatmentLocation !== 'None yet') {
      const treatmentLocations = {
        ER: 'emergency room',
        'Urgent Care': 'urgent care',
        Primary: 'primary care',
      };
      treatmentInfo.push(
        `received ${treatmentLocations[injury.treatmentLocation] || injury.treatmentLocation.toLowerCase()} treatment`
      );
    }

    if (injury?.stillTreating === 'Yes') {
      treatmentInfo.push('reports ongoing injuries');
    } else if (injury?.stillTreating === 'No' && injury?.treatmentLocation) {
      treatmentInfo.push('has completed treatment');
    }

    if (treatmentInfo.length > 0) {
      parts.push(`The client ${treatmentInfo.join(' and')}.`);
    } else {
      parts.push('The client reports injuries but has not yet received treatment.');
    }

    if (injury?.knownInjuries) {
      parts.push(`Reported injuries include: ${injury.knownInjuries}.`);
    }
  } else {
    parts.push('No injuries were reported.');
  }

  // Insurance status
  const insuranceInfo = [];
  if (insurance?.clientAutoInsurance === 'Yes') {
    insuranceInfo.push('client has active insurance');
  } else if (insurance?.clientAutoInsurance === 'No') {
    insuranceInfo.push('client does not have insurance');
  }

  if (insurance?.otherPartyInsurance === 'Yes') {
    insuranceInfo.push('the other party appears to be insured');
  } else if (insurance?.otherPartyInsurance === 'No') {
    insuranceInfo.push('the other party does not appear to be insured');
  }

  if (insuranceInfo.length > 0) {
    parts.push(`Insurance status: ${insuranceInfo.join(', ')}.`);
  }

  // Property damage
  if (propertyDamage?.hasDamage === 'Yes' && propertyDamage?.severity) {
    const severityDescriptions = {
      Minor: 'minor',
      Moderate: 'moderate',
      Severe: 'severe',
      'Total Loss': 'total loss',
    };
    parts.push(
      `Property damage was reported as ${severityDescriptions[propertyDamage.severity] || propertyDamage.severity.toLowerCase()}.`
    );
  }

  // Additional notes if significant
  if (caseData.additionalNotes && caseData.additionalNotes.length > 20) {
    const notesPreview = caseData.additionalNotes.substring(0, 100);
    parts.push(`Additional context: ${notesPreview}...`);
  }

  // Closing assessment
  const hasStrongIndicators =
    (injury?.injured === 'Yes' && injury?.treatmentLocation) ||
    accident?.atFaultIdentified === 'Yes' ||
    insurance?.otherPartyInsurance === 'Yes';

  if (hasStrongIndicators) {
    parts.push('This case appears to have strong indicators for liability and damages.');
  } else {
    parts.push('This case may require further investigation to assess viability.');
  }

  return parts.join(' ');
}
