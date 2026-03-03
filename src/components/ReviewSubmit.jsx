/**
 * Step 7: Review & Submit
 * Displays AI evaluation and case summary before submission
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntake } from '../context/IntakeContext';
import { evaluateCase } from '../utils/caseQualificationEngine';
import { generateCaseSummary } from '../utils/generateCaseSummary';
import { AISparklesIcon, AIBadge } from './AIIcon';

export function ReviewSubmit() {
  const { formData, prevStep, submitOrUpdateCase, editingCaseId } = useIntake();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const aiEvaluation = evaluateCase(formData);
  const aiSummary = generateCaseSummary(formData);

  const getViabilityBadgeClass = (level) => {
    if (level.includes('High')) return 'badge-high';
    if (level.includes('Moderate')) return 'badge-moderate';
    return 'badge-low';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitOrUpdateCase();
      navigate('/cases');
    } catch (error) {
      console.error('Submission error:', error);
      alert(`There was an error ${editingCaseId ? 'updating' : 'submitting'} your case. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {editingCaseId ? 'Review & Update Case' : 'Review & Submit'}
      </h2>
      <p className="text-gray-600 mb-6">
        {editingCaseId ? 'Please review your changes before updating' : 'Please review your information before submitting'}
      </p>

      <div className="space-y-6">
        {/* AI Case Summary */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-violet-500 p-6 rounded-2xl shadow-lg animate-fade-in">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
              <AISparklesIcon className="w-5 h-5" />
            </span>
            <span>AI Case Summary</span>
            <AIBadge size="sm" />
          </h3>
          <p className="text-gray-700 leading-relaxed text-base">{aiSummary}</p>
        </div>

        {/* AI Evaluation */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AISparklesIcon className="w-5 h-5 text-violet-500" />
            AI Case Evaluation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Viability Level</p>
              <span className={getViabilityBadgeClass(aiEvaluation.viabilityLevel)}>
                {aiEvaluation.viabilityLevel}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Priority Level</p>
              <p className="font-semibold text-gray-900">{aiEvaluation.priorityLevel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Case Score</p>
              <p className="text-2xl font-bold text-gray-900">{aiEvaluation.score}/100</p>
            </div>
          </div>
          {aiEvaluation.flags.length > 0 && aiEvaluation.flags[0] !== 'No Flags' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Flags:</p>
              <ul className="list-disc list-inside space-y-1">
                {aiEvaluation.flags.map((flag, index) => (
                  <li key={index} className="text-sm text-amber-700">{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Case Details Summary */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{formData.contact?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{formData.contact?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{formData.contact?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Loss</p>
              <p className="font-medium text-gray-900">
                {formData.accident?.dateOfLoss
                  ? new Date(formData.accident.dateOfLoss).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Accident Type</p>
              <p className="font-medium text-gray-900">{formData.accident?.accidentType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Injured</p>
              <p className="font-medium text-gray-900">{formData.injury?.injured || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button type="button" onClick={prevStep} className="btn-secondary" disabled={isSubmitting}>
            ← Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editingCaseId ? 'Updating...' : 'Submitting...'}
              </span>
            ) : (
              editingCaseId ? 'Update Case' : 'Submit Case'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
