/**
 * Intake Modal
 * Full 7-step case intake inside a popup (for landing page AI Assistant)
 */

import { useIntake } from '../context/IntakeContext';
import { IntakeStepper } from './IntakeStepper';
import { StepContactInfo } from './StepContactInfo';
import { StepAccidentDetails } from './StepAccidentDetails';
import { StepInsurance } from './StepInsurance';
import { StepInjuryTreatment } from './StepInjuryTreatment';
import { StepPropertyDamage } from './StepPropertyDamage';
import { StepAdditionalNotes } from './StepAdditionalNotes';
import { ReviewSubmit } from './ReviewSubmit';
import { AISparklesIcon } from './AIIcon';

export function IntakeModal({ isOpen, onClose, onSuccess }) {
  const { currentStep } = useIntake();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepContactInfo />;
      case 2:
        return <StepAccidentDetails />;
      case 3:
        return <StepInsurance />;
      case 4:
        return <StepInjuryTreatment />;
      case 5:
        return <StepPropertyDamage />;
      case 6:
        return <StepAdditionalNotes />;
      case 7:
        return <ReviewSubmit onSuccessCallback={() => { onSuccess?.(); onClose?.(); }} />;
      default:
        return <StepContactInfo />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intake-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b border-indigo-500/30">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20">
              <AISparklesIcon className="w-5 h-5" />
            </span>
            <h2 id="intake-modal-title" className="text-lg font-bold">
              AI Assistant – Case Intake
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper - compact */}
        <div className="shrink-0 px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-200">
          <IntakeStepper />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
