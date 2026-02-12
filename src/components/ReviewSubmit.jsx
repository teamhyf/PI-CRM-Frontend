/**
 * Step 7: Review & Submit
 * Displays AI evaluation and case summary before submission
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntake } from '../context/IntakeContext';
import { evaluateCase } from '../utils/caseQualificationEngine';
import { generateCaseSummary } from '../utils/generateCaseSummary';

export function ReviewSubmit() {
  const { formData, prevStep, submitCase } = useIntake();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
      await submitCase();
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('There was an error submitting your case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12 animate-scale-in">
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20 animate-scale-in">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Case Submitted Successfully!</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Your case has been received and is pending attorney review. You will be contacted shortly.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary text-lg px-8 py-4">
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
      <p className="text-gray-600 mb-6">Please review your information before submitting</p>

      <div className="space-y-6">
        {/* AI Case Summary */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-blue-500 p-6 rounded-2xl shadow-lg animate-fade-in">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3 text-2xl">🤖</span> AI Case Summary
          </h3>
          <p className="text-gray-700 leading-relaxed text-base">{aiSummary}</p>
        </div>

        {/* AI Evaluation */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Case Evaluation</h3>
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
                Submitting...
              </span>
            ) : (
              'Submit Case'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
