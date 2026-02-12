/**
 * Intake Stepper Component
 * Displays progress indicator for multi-step form
 */

import { useIntake } from '../context/IntakeContext';

const steps = [
  { number: 1, title: 'Contact Info' },
  { number: 2, title: 'Accident Details' },
  { number: 3, title: 'Insurance' },
  { number: 4, title: 'Injury & Treatment' },
  { number: 5, title: 'Property Damage' },
  { number: 6, title: 'Additional Notes' },
  { number: 7, title: 'Review & Submit' },
];

export function IntakeStepper() {
  const { currentStep } = useIntake();

  return (
    <div className="w-full py-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1 relative">
              {/* Step Circle */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 relative z-10 ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/40 scale-110 ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-400 shadow-sm'
                }`}
              >
                {currentStep > step.number ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              {/* Step Title */}
              <div
                className={`mt-3 text-xs font-semibold text-center max-w-[80px] ${
                  currentStep >= step.number 
                    ? 'text-blue-600 font-bold' 
                    : 'text-gray-500'
                }`}
              >
                {step.title}
              </div>
            </div>
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="relative flex-1 mx-2 h-1">
                <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ${
                    currentStep > step.number ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
