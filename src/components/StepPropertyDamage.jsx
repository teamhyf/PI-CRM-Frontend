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
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Property Damage</h2>
      <p className="text-sm text-gray-600 mb-4">Tell us about any property damage</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Was there property damage? <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center text-sm">
              <input type="radio" value="Yes" {...register('hasDamage', { required: true })} className="mr-1.5" />
              Yes
            </label>
            <label className="flex items-center text-sm">
              <input type="radio" value="No" {...register('hasDamage', { required: true })} className="mr-1.5" />
              No
            </label>
          </div>
        </div>

        {showDamageFields && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-gray-900 text-sm">Damage Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Photos (Mock Upload)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Photo upload will be available in Phase 2</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
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
