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
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Injury & Treatment</h2>
      <p className="text-sm text-gray-600 mb-4">Tell us about any injuries and medical treatment</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Were you injured? <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center text-sm">
              <input type="radio" value="Yes" {...register('injured', { required: true })} className="mr-1.5" />
              Yes
            </label>
            <label className="flex items-center text-sm">
              <input type="radio" value="No" {...register('injured', { required: true })} className="mr-1.5" />
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
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-gray-900 text-sm">Treatment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="treatmentLocation" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Where did you receive treatment?
                </label>
                <select id="treatmentLocation" {...register('treatmentLocation')} className="input-field">
                  <option value="">Select treatment location</option>
                  <option value="Emergency room">Emergency Room</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Urgent Care">Urgent Care</option>
                  <option value="Doctor">Doctor / Primary Care</option>
                  <option value="Chiropractor">Chiropractor</option>
                  <option value="Physical therapy">Physical Therapy</option>
                  <option value="None yet">None yet</option>
                </select>
                <AIHelperText step="injury" field="noTreatment" />
                <AIHelperText step="injury" field="treatmentNotStarted" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Treatment Start Date</label>
                <input
                  type="date"
                  {...register('treatmentDates.start')}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Treatment End Date</label>
                <input
                  type="date"
                  {...register('treatmentDates.end')}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div>
              <label htmlFor="knownInjuries" className="block text-sm font-medium text-gray-700 mb-1.5">
                Known Injuries
              </label>
              <textarea
                id="knownInjuries"
                {...register('knownInjuries')}
                className="input-field"
                rows="2"
                placeholder="Describe your injuries (e.g., neck strain, lower back pain)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Still receiving treatment?
              </label>
              <div className="flex gap-3">
                <label className="flex items-center text-sm">
                  <input type="radio" value="Yes" {...register('stillTreating')} className="mr-1.5" />
                  Yes
                </label>
                <label className="flex items-center text-sm">
                  <input type="radio" value="No" {...register('stillTreating')} className="mr-1.5" />
                  No
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
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
