/**
 * Sample Cases Data
 * Mock cases for dashboard display
 */

export const sampleCases = [
  {
    caseId: 'CASE-2026-001',
    contact: {
      fullName: 'John Doe',
      phone: '(555) 123-4567',
      email: 'john.doe@email.com',
    },
    accident: {
      dateOfLoss: '2026-01-15',
      accidentType: 'Motor vehicle accident',
      collisionType: 'Rear-end',
      atFaultIdentified: 'Yes',
      policeReport: 'Yes',
    },
    insurance: {
      clientAutoInsurance: 'Yes',
      otherPartyInsurance: 'Yes',
    },
    injury: {
      injured: 'Yes',
      treatmentLocation: 'ER',
      treatmentDates: '2026-01-15 to 2026-01-20',
      knownInjuries: 'Neck strain, lower back pain',
      stillTreating: 'Yes',
    },
    propertyDamage: {
      hasDamage: 'Yes',
      severity: 'Severe',
    },
    additionalNotes: 'Client was rear-ended at a stoplight. Other driver admitted fault.',
    aiEvaluation: {
      score: 85,
      viabilityLevel: 'High Viability',
      priorityLevel: 'Immediate Attorney Review',
      flags: ['No Flags'],
    },
    aiSummary:
      'John Doe reports a motor vehicle collision (rear-end) on January 15, 2026. The at-fault party was identified and a police report was taken. The client received emergency room treatment and reports ongoing injuries. Reported injuries include: Neck strain, lower back pain. Insurance status: client has active insurance, the other party appears to be insured. Property damage was reported as severe. This case appears to have strong indicators for liability and damages.',
    status: 'Pending Attorney Review',
  },
  {
    caseId: 'CASE-2026-002',
    contact: {
      fullName: 'Jane Smith',
      phone: '(555) 234-5678',
      email: 'jane.smith@email.com',
    },
    accident: {
      dateOfLoss: '2026-01-20',
      accidentType: 'Slip and fall',
      atFaultIdentified: 'No',
      policeReport: 'No',
    },
    insurance: {
      clientAutoInsurance: 'Unsure',
      otherPartyInsurance: 'Yes',
    },
    injury: {
      injured: 'Yes',
      treatmentLocation: 'Urgent Care',
      treatmentDates: '2026-01-21',
      knownInjuries: 'Ankle sprain',
      stillTreating: 'No',
    },
    propertyDamage: {
      hasDamage: 'No',
    },
    additionalNotes: 'Slipped on wet floor at grocery store.',
    aiEvaluation: {
      score: 45,
      viabilityLevel: 'Moderate Viability',
      priorityLevel: 'Standard Review',
      flags: ['At-Fault Party Not Identified', 'No Police Report'],
    },
    aiSummary:
      'Jane Smith reports a slip and fall incident on January 20, 2026. The at-fault party was not identified and no police report was taken. The client received urgent care treatment and has completed treatment. Reported injuries include: Ankle sprain. Insurance status: the other party appears to be insured. This case may require further investigation to assess viability.',
    status: 'Pending Attorney Review',
  },
  {
    caseId: 'CASE-2026-003',
    contact: {
      fullName: 'Robert Johnson',
      phone: '(555) 345-6789',
      email: 'robert.j@email.com',
    },
    accident: {
      dateOfLoss: '2026-02-01',
      accidentType: 'Motor vehicle accident',
      collisionType: 'Side-impact',
      atFaultIdentified: 'Yes',
      policeReport: 'Unknown',
    },
    insurance: {
      clientAutoInsurance: 'No',
      otherPartyInsurance: 'No',
    },
    injury: {
      injured: 'No',
    },
    propertyDamage: {
      hasDamage: 'Yes',
      severity: 'Minor',
    },
    additionalNotes: 'Minor fender bender, no injuries reported.',
    aiEvaluation: {
      score: 15,
      viabilityLevel: 'Low Viability',
      priorityLevel: 'Manual Screening Required',
      flags: ['No Injury Reported', 'No Insurance Identified'],
    },
    aiSummary:
      'Robert Johnson reports a motor vehicle collision (side-impact) on February 1, 2026. The at-fault party was identified. No injuries were reported. Insurance status: client does not have insurance, the other party does not appear to be insured. Property damage was reported as minor. This case may require further investigation to assess viability.',
    status: 'Pending Attorney Review',
  },
];
