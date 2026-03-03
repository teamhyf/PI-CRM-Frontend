/**
 * AI Helper Text Component
 * Displays contextual AI-like helper messages based on form state
 */

import { useIntake } from '../context/IntakeContext';
import { AISparklesIcon } from './AIIcon';

export function AIHelperText({ step, field, message }) {
  const { formData } = useIntake();

  // If a specific message is provided, use it
  if (message) {
    return (
      <div className="mt-2 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-l-4 border-violet-500 rounded-r-lg">
        <p className="text-sm text-gray-800 flex items-start gap-2">
          <AISparklesIcon className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
          <span><span className="font-semibold text-violet-800">AI Assistant:</span> {message}</span>
        </p>
      </div>
    );
  }

  // Dynamic messages based on form state
  let helperMessage = null;

  if (step === 'accident') {
    if (field === 'noInjury' && formData.accident?.accidentType) {
      helperMessage =
        'Cases without injury may be more difficult to pursue. Please confirm that no injuries occurred.';
    }
    if (field === 'noPoliceReport' && formData.accident?.policeReport === 'No') {
      helperMessage =
        'Police documentation can strengthen a case. Do you plan to obtain one? Consider filing a report if possible.';
    }
  }

  if (step === 'injury') {
    if (field === 'noTreatment' && formData.injury?.injured === 'Yes' && !formData.injury?.treatmentLocation) {
      helperMessage =
        'It looks like treatment information is missing. Medical documentation is crucial for personal injury cases. Can you provide treatment details?';
    }
    if (field === 'treatmentNotStarted' && formData.injury?.treatmentLocation === 'None yet') {
      helperMessage =
        'Seeking medical attention promptly after an accident is important. Consider scheduling an appointment with a healthcare provider.';
    }
  }

  if (step === 'insurance') {
    if (
      field === 'noInsurance' &&
      formData.insurance?.clientAutoInsurance === 'No' &&
      formData.insurance?.otherPartyInsurance === 'No'
    ) {
      helperMessage =
        'Cases without insurance coverage on either side can be challenging. We may need to explore alternative options.';
    }
  }

  if (!helperMessage) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-l-4 border-violet-500 rounded-r-lg animate-fade-in">
      <p className="text-sm text-gray-800 flex items-start gap-2">
        <AISparklesIcon className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
        <span><span className="font-semibold text-violet-800">AI Assistant:</span> {helperMessage}</span>
      </p>
    </div>
  );
}
