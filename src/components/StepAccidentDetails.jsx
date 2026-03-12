/**
 * Step 2: Accident Details
 */

import { useRef } from 'react';
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
  fallLocationType: z.string().optional(),
  hazardType: z.string().optional(),
  warningSignPresent: z.string().optional(),
  incidentReported: z.string().optional(),
  incidentLocationFreeText: z.string().optional(),
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

  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        // Use native date picker programmatically when supported
        dateInputRef.current.showPicker();
      } else {
        // Fallback: focus so the browser shows its controls
        dateInputRef.current.focus();
      }
    }
  };

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
  const isSlipAndFall = currentAccidentType === 'Slip and fall';

  const onSubmit = (data) => {
    // Clean up empty strings and undefined values
    const cleanedData = {
      dateOfLoss: data.dateOfLoss,
      accidentType: data.accidentType,
      ...(data.collisionType && data.collisionType.trim() && { collisionType: data.collisionType }),
      ...(data.atFaultIdentified && { atFaultIdentified: data.atFaultIdentified }),
      ...(data.policeReport && { policeReport: data.policeReport }),
      ...(data.accidentTypeDescription && data.accidentTypeDescription.trim() && { accidentTypeDescription: data.accidentTypeDescription }),
      ...(data.fallLocationType && { fallLocationType: data.fallLocationType }),
      ...(data.hazardType && { hazardType: data.hazardType }),
      ...(data.warningSignPresent && { warningSignPresent: data.warningSignPresent }),
      ...(data.incidentReported && { incidentReported: data.incidentReported }),
      ...(data.incidentLocationFreeText && data.incidentLocationFreeText.trim() && { incidentLocationFreeText: data.incidentLocationFreeText }),
    };
    updateFormData('accident', cleanedData);
    nextStep();
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Accident Details</h2>
      <p className="text-sm text-gray-600 mb-4">Tell us about the incident</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateOfLoss" className="block text-sm font-medium text-gray-700 mb-1.5">
              Date of Loss <span className="text-red-500">*</span>
            </label>
            <input
              ref={dateInputRef}
              id="dateOfLoss"
              type="date"
              {...register('dateOfLoss')}
              className="input-field"
              max={new Date().toISOString().split('T')[0]}
              onClick={openDatePicker}
            />
            {errors.dateOfLoss && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfLoss.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="accidentType" className="block text-sm font-medium text-gray-700 mb-1.5">
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
        </div>

        {currentAccidentType === 'Other' && (
          <div className="animate-fade-in">
            <label htmlFor="accidentTypeDescription" className="block text-sm font-medium text-gray-700 mb-1.5">
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
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-gray-900 text-sm">Motor Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="collisionType" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  At-fault party identified?
                </label>
                <div className="flex flex-wrap gap-3 pt-1">
                  <label className="flex items-center text-sm">
                    <input type="radio" value="Yes" {...register('atFaultIdentified')} className="mr-1.5" />
                    Yes
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="radio" value="No" {...register('atFaultIdentified')} className="mr-1.5" />
                    No
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="radio" value="Unknown" {...register('atFaultIdentified')} className="mr-1.5" />
                    Unknown
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Police report filed?
                </label>
                <div className="flex flex-wrap gap-3 pt-1">
                  <label className="flex items-center text-sm">
                    <input type="radio" value="Yes" {...register('policeReport')} className="mr-1.5" />
                    Yes
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="radio" value="No" {...register('policeReport')} className="mr-1.5" />
                    No
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="radio" value="Unknown" {...register('policeReport')} className="mr-1.5" />
                    Unknown
                  </label>
                </div>
                <AIHelperText step="accident" field="noPoliceReport" />
              </div>
            </div>
          </div>
        )}

        {isSlipAndFall && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg animate-fade-in">
            <h3 className="font-semibold text-gray-900 text-sm">Slip & Fall Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fallLocationType" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Where did it happen?
                </label>
                <select id="fallLocationType" {...register('fallLocationType')} className="input-field">
                  <option value="">Select location type</option>
                  <option value="Store / retail">Store / Retail</option>
                  <option value="Sidewalk / public">Sidewalk / Public</option>
                  <option value="Parking lot">Parking Lot</option>
                  <option value="Private property">Private Property</option>
                  <option value="Stairs">Stairs</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="hazardType" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type of hazard
                </label>
                <select id="hazardType" {...register('hazardType')} className="input-field">
                  <option value="">Select hazard type</option>
                  <option value="Wet floor">Wet Floor</option>
                  <option value="Uneven surface">Uneven Surface</option>
                  <option value="Ice / snow">Ice / Snow</option>
                  <option value="Poor lighting">Poor Lighting</option>
                  <option value="Debris / obstruction">Debris / Obstruction</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Warning sign present?</label>
                <div className="flex gap-3 pt-1">
                  {['Yes', 'No', 'Unknown'].map((v) => (
                    <label key={v} className="flex items-center text-sm">
                      <input type="radio" value={v} {...register('warningSignPresent')} className="mr-1.5" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Incident reported to owner?</label>
                <div className="flex gap-3 pt-1">
                  {['Yes', 'No', 'Unknown'].map((v) => (
                    <label key={v} className="flex items-center text-sm">
                      <input type="radio" value={v} {...register('incidentReported')} className="mr-1.5" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="incidentLocationFreeText" className="block text-sm font-medium text-gray-700 mb-1.5">
                Location details (optional)
              </label>
              <input
                id="incidentLocationFreeText"
                type="text"
                {...register('incidentLocationFreeText')}
                className="input-field"
                placeholder="e.g., Walmart on Main St, aisle 5"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
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
