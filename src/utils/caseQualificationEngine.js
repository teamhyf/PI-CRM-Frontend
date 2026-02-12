/**
 * Case Qualification Engine
 * Rule-based scoring system to evaluate case viability
 */

/**
 * Evaluates case data and returns qualification score, viability level, priority, and flags
 * @param {Object} caseData - Complete case data object
 * @returns {Object} Evaluation result with score, viabilityLevel, priorityLevel, and flags
 */
export function evaluateCase(caseData) {
  let score = 0;
  const flags = [];

  const { accident, insurance, injury, propertyDamage } = caseData;

  // Injury scoring
  if (injury?.injured === 'Yes') {
    score += 25;
    if (injury?.treatmentLocation && injury.treatmentLocation !== 'None yet') {
      score += 20;
    } else {
      flags.push('Treatment Not Started');
    }
    if (injury?.stillTreating === 'Yes') {
      score += 5; // Bonus for ongoing treatment
    }
  } else {
    score -= 20;
    flags.push('No Injury Reported');
  }

  // Accident details scoring
  if (accident?.atFaultIdentified === 'Yes') {
    score += 15;
  } else if (accident?.atFaultIdentified === 'No') {
    flags.push('At-Fault Party Not Identified');
  }

  if (accident?.policeReport === 'Yes') {
    score += 10;
  } else if (accident?.policeReport === 'No') {
    flags.push('No Police Report');
  }

  // Insurance scoring
  const hasClientInsurance = insurance?.clientAutoInsurance === 'Yes';
  const hasOtherPartyInsurance = insurance?.otherPartyInsurance === 'Yes';

  if (hasOtherPartyInsurance) {
    score += 15;
  } else if (insurance?.otherPartyInsurance === 'No') {
    flags.push('Other Party Not Insured');
  }

  if (!hasClientInsurance && !hasOtherPartyInsurance) {
    score -= 15;
    flags.push('No Insurance Identified');
  }

  // Property damage scoring
  if (propertyDamage?.hasDamage === 'Yes') {
    const severity = propertyDamage?.severity;
    if (severity === 'Severe' || severity === 'Total Loss') {
      score += 10;
    } else if (severity === 'Moderate') {
      score += 5;
    }
  }

  // Date of loss recency bonus (within last 30 days)
  if (accident?.dateOfLoss) {
    const lossDate = new Date(accident.dateOfLoss);
    const daysSinceLoss = Math.floor((Date.now() - lossDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLoss <= 30) {
      score += 5; // Recent case bonus
    }
  }

  // Determine viability level
  let viabilityLevel;
  if (score >= 70) {
    viabilityLevel = 'High Viability';
  } else if (score >= 40) {
    viabilityLevel = 'Moderate Viability';
  } else {
    viabilityLevel = 'Low Viability';
  }

  // Determine priority level
  let priorityLevel;
  if (score >= 70) {
    priorityLevel = 'Immediate Attorney Review';
  } else if (score >= 40) {
    priorityLevel = 'Standard Review';
  } else {
    priorityLevel = 'Manual Screening Required';
  }

  return {
    score: Math.max(0, Math.min(100, score)), // Clamp between 0-100
    viabilityLevel,
    priorityLevel,
    flags: flags.length > 0 ? flags : ['No Flags'],
  };
}
