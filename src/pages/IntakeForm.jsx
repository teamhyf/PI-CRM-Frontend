/**
 * Intake Form Page
 * Multi-step form for case intake
 */

import { useIntake } from '../context/IntakeContext';
import { IntakeStepper } from '../components/IntakeStepper';
import { StepContactInfo } from '../components/StepContactInfo';
import { StepAccidentDetails } from '../components/StepAccidentDetails';
import { StepInsurance } from '../components/StepInsurance';
import { StepInjuryTreatment } from '../components/StepInjuryTreatment';
import { StepPropertyDamage } from '../components/StepPropertyDamage';
import { StepAdditionalNotes } from '../components/StepAdditionalNotes';
import { ReviewSubmit } from '../components/ReviewSubmit';

export function IntakeForm() {
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
        return <ReviewSubmit />;
      default:
        return <StepContactInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">AI-Powered Case Intake</h1>
          <p className="mt-2 text-gray-600 font-medium">Our intelligent system will guide you through the intake process</p>
        </div>

        {/* Stepper */}
        <div className="mb-8 animate-slide-up">
          <IntakeStepper />
        </div>

        {/* Form Content */}
        <div className="mt-8 bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20 animate-scale-in">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
