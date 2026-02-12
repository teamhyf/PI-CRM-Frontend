/**
 * Step 4: Injury & Treatment Information
 */

import { useForm } from 'react-hook-form';
import { useIntake } from '../context/IntakeContext';
import { AIHelperText } from './AIHelperText';

export function StepInjuryTreatment() {
  const { formData, updateFormData, nextStep, prevStep } = useIntake();

  const {
    register,
    handleSubmit,
    watch,
  } = useForm({
    defaultValues: formData.injury,
  });

  const injured = watch('injured');
  const showTreatmentFields = injured === 'Yes';

  const onSubmit = (data) => {
    updateFormData('injury', data);
    nextStep();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Injury & Treatment</h2>
      <p className="text-gray-600 mb-6">Tell us about any injuries and medical treatment</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Were you injured? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Yes"
                {...register('injured', { required: true })}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="No"
                {...register('injured', { required: true })}
                className="mr-2"
              />
              No
            </label>
          </div>
          {injured === 'No' && (
            <AIHelperText
              step="accident"
              field="noInjury"
              message="Cases without injury may be more difficult to pursue. Please confirm that no injuries occurred."
            />
          )}
        </div>

        {showTreatmentFields && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-gray-900">Treatment Details</h3>

            <div>
              <label htmlFor="treatmentLocation" className="block text-sm font-medium text-gray-700 mb-2">
                Where did you receive treatment?
              </label>
              <select id="treatmentLocation" {...register('treatmentLocation')} className="input-field">
                <option value="">Select treatment location</option>
                <option value="ER">Emergency Room</option>
                <option value="Urgent Care">Urgent Care</option>
                <option value="Primary">Primary Care Physician</option>
                <option value="None yet">None yet</option>
              </select>
              <AIHelperText step="injury" field="noTreatment" />
              <AIHelperText step="injury" field="treatmentNotStarted" />
            </div>

            <div>
              <label htmlFor="treatmentDates" className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Dates
              </label>
              <input
                id="treatmentDates"
                type="text"
                {...register('treatmentDates')}
                className="input-field"
                placeholder="e.g., Jan 15, 2026 to Jan 20, 2026"
              />
            </div>

            <div>
              <label htmlFor="knownInjuries" className="block text-sm font-medium text-gray-700 mb-2">
                Known Injuries
              </label>
              <textarea
                id="knownInjuries"
                {...register('knownInjuries')}
                className="input-field"
                rows="3"
                placeholder="Describe your injuries (e.g., neck strain, lower back pain)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Are you still receiving treatment?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    {...register('stillTreating')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    {...register('stillTreating')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button type="button" onClick={prevStep} className="btn-secondary">
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Next: Property Damage →
          </button>
        </div>
      </form>
    </div>
  );
}
