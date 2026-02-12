/**
 * Case Summary Modal
 * Displays full case details in a modal overlay
 */

export function CaseSummaryModal({ caseData, isOpen, onClose }) {
  if (!isOpen || !caseData) return null;

  const getViabilityBadgeClass = (level) => {
    if (level.includes('High')) return 'badge-high';
    if (level.includes('Moderate')) return 'badge-moderate';
    return 'badge-low';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Case Details: {caseData.caseId}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* AI Summary */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">🤖</span> AI Case Summary
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{caseData.aiSummary}</p>
              </div>

              {/* AI Evaluation */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">AI Evaluation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Viability Level</p>
                    <span className={getViabilityBadgeClass(caseData.aiEvaluation?.viabilityLevel)}>
                      {caseData.aiEvaluation?.viabilityLevel || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Priority Level</p>
                    <p className="font-semibold text-gray-900">{caseData.aiEvaluation?.priorityLevel || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Case Score</p>
                    <p className="text-xl font-bold text-gray-900">
                      {caseData.aiEvaluation?.score || 0}/100
                    </p>
                  </div>
                </div>
                {caseData.aiEvaluation?.flags && caseData.aiEvaluation.flags.length > 0 && caseData.aiEvaluation.flags[0] !== 'No Flags' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Flags:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {caseData.aiEvaluation.flags.map((flag, index) => (
                        <li key={index} className="text-xs text-amber-700">{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{caseData.contact?.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{caseData.contact?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{caseData.contact?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Accident Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Accident Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Date of Loss</p>
                    <p className="font-medium text-gray-900">
                      {caseData.accident?.dateOfLoss
                        ? new Date(caseData.accident.dateOfLoss).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Accident Type</p>
                    <p className="font-medium text-gray-900">{caseData.accident?.accidentType || 'N/A'}</p>
                  </div>
                  {caseData.accident?.collisionType && (
                    <div>
                      <p className="text-gray-600">Collision Type</p>
                      <p className="font-medium text-gray-900">{caseData.accident.collisionType}</p>
                    </div>
                  )}
                  {caseData.accident?.atFaultIdentified && (
                    <div>
                      <p className="text-gray-600">At-Fault Identified</p>
                      <p className="font-medium text-gray-900">{caseData.accident.atFaultIdentified}</p>
                    </div>
                  )}
                  {caseData.accident?.policeReport && (
                    <div>
                      <p className="text-gray-600">Police Report</p>
                      <p className="font-medium text-gray-900">{caseData.accident.policeReport}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insurance */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Insurance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Client Insurance</p>
                    <p className="font-medium text-gray-900">
                      {caseData.insurance?.clientAutoInsurance || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Other Party Insurance</p>
                    <p className="font-medium text-gray-900">
                      {caseData.insurance?.otherPartyInsurance || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Injury & Treatment */}
              {caseData.injury && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Injury & Treatment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Injured</p>
                      <p className="font-medium text-gray-900">{caseData.injury?.injured || 'N/A'}</p>
                    </div>
                    {caseData.injury?.treatmentLocation && (
                      <div>
                        <p className="text-gray-600">Treatment Location</p>
                        <p className="font-medium text-gray-900">{caseData.injury.treatmentLocation}</p>
                      </div>
                    )}
                    {caseData.injury?.treatmentDates && (
                      <div>
                        <p className="text-gray-600">Treatment Dates</p>
                        <p className="font-medium text-gray-900">{caseData.injury.treatmentDates}</p>
                      </div>
                    )}
                    {caseData.injury?.knownInjuries && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600">Known Injuries</p>
                        <p className="font-medium text-gray-900">{caseData.injury.knownInjuries}</p>
                      </div>
                    )}
                    {caseData.injury?.stillTreating && (
                      <div>
                        <p className="text-gray-600">Still Treating</p>
                        <p className="font-medium text-gray-900">{caseData.injury.stillTreating}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Damage */}
              {caseData.propertyDamage && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Property Damage</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Has Damage</p>
                      <p className="font-medium text-gray-900">{caseData.propertyDamage?.hasDamage || 'N/A'}</p>
                    </div>
                    {caseData.propertyDamage?.severity && (
                      <div>
                        <p className="text-gray-600">Severity</p>
                        <p className="font-medium text-gray-900">{caseData.propertyDamage.severity}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {caseData.additionalNotes && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.additionalNotes}</p>
                </div>
              )}

              {/* Status */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Status</h4>
                <p className="text-sm font-medium text-gray-900">{caseData.status || 'Pending Attorney Review'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
