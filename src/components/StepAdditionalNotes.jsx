/**
 * Step 6: Additional Notes
 */

import { useForm } from 'react-hook-form';
import { useIntake } from '../context/IntakeContext';

export function StepAdditionalNotes() {
  const { formData, updateFormData, nextStep, prevStep } = useIntake();

  const {
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      additionalNotes: formData.additionalNotes || '',
    },
  });

  const onSubmit = (data) => {
    updateFormData('additionalNotes', data.additionalNotes);
    nextStep();
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Additional Notes</h2>
      <p className="text-sm text-gray-600 mb-4">Any additional information you'd like to share?</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1.5">
            Additional Information
          </label>
          <textarea
            id="additionalNotes"
            {...register('additionalNotes')}
            className="input-field"
            rows="4"
            placeholder="Additional details about the incident, witnesses, or other relevant information..."
          />
          <p className="mt-1 text-xs text-gray-500">Included in your case summary</p>
        </div>

        <div className="flex justify-between pt-2">
          <button type="button" onClick={prevStep} className="btn-secondary">
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Review & Submit →
          </button>
        </div>
      </form>
    </div>
  );
}
