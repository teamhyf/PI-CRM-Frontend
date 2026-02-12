/**
 * Step 3: Insurance Information
 */

import { useForm } from 'react-hook-form';
import { useIntake } from '../context/IntakeContext';
import { AIHelperText } from './AIHelperText';

export function StepInsurance() {
  const { formData, updateFormData, nextStep, prevStep } = useIntake();

  const {
    register,
    handleSubmit,
    watch,
  } = useForm({
    defaultValues: formData.insurance,
  });

  const onSubmit = (data) => {
    updateFormData('insurance', data);
    nextStep();
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Insurance Information</h2>
      <p className="text-gray-600 mb-6">Tell us about insurance coverage</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Do you have auto insurance? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Yes"
                {...register('clientAutoInsurance', { required: true })}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="No"
                {...register('clientAutoInsurance', { required: true })}
                className="mr-2"
              />
              No
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="Unsure"
                {...register('clientAutoInsurance', { required: true })}
                className="mr-2"
              />
              Unsure
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Does the other party have insurance? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Yes"
                {...register('otherPartyInsurance', { required: true })}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="No"
                {...register('otherPartyInsurance', { required: true })}
                className="mr-2"
              />
              No
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="Unsure"
                {...register('otherPartyInsurance', { required: true })}
                className="mr-2"
              />
              Unsure
            </label>
          </div>
          <AIHelperText step="insurance" field="noInsurance" />
        </div>

        <div className="flex justify-between pt-4">
          <button type="button" onClick={prevStep} className="btn-secondary">
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Next: Injury & Treatment →
          </button>
        </div>
      </form>
    </div>
  );
}
