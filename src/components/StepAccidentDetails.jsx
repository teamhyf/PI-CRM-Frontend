/**
 * Step 2: Accident Details
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useIntake } from '../context/IntakeContext';
import { AIHelperText } from './AIHelperText';

// Base schema - all fields optional except required ones
const accidentSchema = z.object({
  dateOfLoss: z.string().min(1, 'Date of loss is required'),
  accidentType: z.string().min(1, 'Accident type is required'),
  collisionType: z.string().optional(),
  atFaultIdentified: z.string().optional(),
  policeReport: z.string().optional(),
  accidentTypeDescription: z.string().optional(),
}).refine((data) => {
  // If accident type is "Other", description is required
  if (data.accidentType === 'Other') {
    return data.accidentTypeDescription && data.accidentTypeDescription.trim().length > 0;
  }
  return true;
}, {
  message: 'Please describe the accident type',
  path: ['accidentTypeDescription'],
});

export function StepAccidentDetails() {
  const { formData, updateFormData, nextStep, prevStep } = useIntake();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accidentSchema),
    defaultValues: formData.accident || {},
    mode: 'onBlur',
  });

  const currentAccidentType = watch('accidentType');
  const isMotorVehicle = currentAccidentType === 'Motor vehicle accident';

  const onSubmit = (data) => {
    // Clean up empty strings and undefined values
    const cleanedData = {
      dateOfLoss: data.dateOfLoss,
      accidentType: data.accidentType,
      ...(data.collisionType && data.collisionType.trim() && { collisionType: data.collisionType }),
      ...(data.atFaultIdentified && { atFaultIdentified: data.atFaultIdentified }),
      ...(data.policeReport && { policeReport: data.policeReport }),
      ...(data.accidentTypeDescription && data.accidentTypeDescription.trim() && { accidentTypeDescription: data.accidentTypeDescription }),
    };
    updateFormData('accident', cleanedData);
    nextStep();
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Accident Details</h2>
      <p className="text-gray-600 mb-6">Tell us about the incident</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="dateOfLoss" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Loss <span className="text-red-500">*</span>
          </label>
          <input
            id="dateOfLoss"
            type="date"
            {...register('dateOfLoss')}
            className="input-field"
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfLoss && (
            <p className="mt-1 text-sm text-red-600">{errors.dateOfLoss.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="accidentType" className="block text-sm font-medium text-gray-700 mb-2">
            Type of Accident <span className="text-red-500">*</span>
          </label>
          <select
            id="accidentType"
            {...register('accidentType')}
            className="input-field"
          >
            <option value="">Select accident type</option>
            <option value="Motor vehicle accident">Motor vehicle accident</option>
            <option value="Pedestrian">Pedestrian</option>
            <option value="Bicycle">Bicycle</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Slip and fall">Slip and fall</option>
            <option value="Other">Other</option>
          </select>
          {errors.accidentType && (
            <p className="mt-1 text-sm text-red-600">{errors.accidentType.message}</p>
          )}
        </div>

        {currentAccidentType === 'Other' && (
          <div className="animate-fade-in">
            <label htmlFor="accidentTypeDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Please describe the accident type <span className="text-red-500">*</span>
            </label>
            <input
              id="accidentTypeDescription"
              type="text"
              {...register('accidentTypeDescription')}
              className="input-field"
              placeholder="Describe the accident type"
            />
            {errors.accidentTypeDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.accidentTypeDescription.message}</p>
            )}
          </div>
        )}

        {isMotorVehicle && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-gray-900">Motor Vehicle Details</h3>

            <div>
              <label htmlFor="collisionType" className="block text-sm font-medium text-gray-700 mb-2">
                Collision Type
              </label>
              <select id="collisionType" {...register('collisionType')} className="input-field">
                <option value="">Select collision type</option>
                <option value="Rear-end">Rear-end</option>
                <option value="Front-end">Front-end</option>
                <option value="Side-impact">Side-impact</option>
                <option value="T-bone">T-bone</option>
                <option value="Head-on">Head-on</option>
                <option value="Sideswipe">Sideswipe</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Was the at-fault party identified?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    {...register('atFaultIdentified')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    {...register('atFaultIdentified')}
                    className="mr-2"
                  />
                  No
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Unknown"
                    {...register('atFaultIdentified')}
                    className="mr-2"
                  />
                  Unknown
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Was a police report filed?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    {...register('policeReport')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    {...register('policeReport')}
                    className="mr-2"
                  />
                  No
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Unknown"
                    {...register('policeReport')}
                    className="mr-2"
                  />
                  Unknown
                </label>
              </div>
              <AIHelperText step="accident" field="noPoliceReport" />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button type="button" onClick={prevStep} className="btn-secondary">
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Next: Insurance →
          </button>
        </div>
      </form>
    </div>
  );
}
