/**
 * Step 5: Property Damage Information
 */

import { useForm } from 'react-hook-form';
import { useIntake } from '../context/IntakeContext';

export function StepPropertyDamage() {
  const { formData, updateFormData, nextStep, prevStep } = useIntake();

  const {
    register,
    handleSubmit,
    watch,
  } = useForm({
    defaultValues: formData.propertyDamage,
  });

  const hasDamage = watch('hasDamage');
  const showDamageFields = hasDamage === 'Yes';

  const onSubmit = (data) => {
    updateFormData('propertyDamage', data);
    nextStep();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Damage</h2>
      <p className="text-gray-600 mb-6">Tell us about any property damage</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Was there property damage? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Yes"
                {...register('hasDamage', { required: true })}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="No"
                {...register('hasDamage', { required: true })}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        {showDamageFields && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-gray-900">Damage Details</h3>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                Damage Severity
              </label>
              <select id="severity" {...register('severity')} className="input-field">
                <option value="">Select severity</option>
                <option value="Minor">Minor</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Total Loss">Total Loss</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Mock Upload)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">Photo upload functionality will be available in Phase 2</p>
                <p className="text-sm text-gray-400 mt-2">This will connect to cloud storage</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button type="button" onClick={prevStep} className="btn-secondary">
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Next: Additional Notes →
          </button>
        </div>
      </form>
    </div>
  );
}
