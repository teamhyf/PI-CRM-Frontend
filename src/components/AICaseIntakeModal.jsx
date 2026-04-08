import { useState, useRef } from 'react';
import { AISparklesIcon, AIBadge } from './AIIcon';
import { IntakeVoiceButton } from './IntakeVoiceButton';
import {
  transcribeIntakeAudio,
  analyzeCase,
  scoreCase,
  submitIntakeCase,
} from '../services/intakeApi';

function createEmptyDraft() {
  return {
    contact: { fullName: '', phone: '', email: '' },
    accident: {
      dateOfLoss: '',
      accidentType: '',
      accidentTypeDescription: '',
      collisionType: '',
      atFaultIdentified: '',
      policeReport: '',
      pedestrianInvolvement: '',
      driverStayed: '',
      possibleVideo: '',
      bicycleType: '',
      bicycleCollisionWith: '',
      otherPartyStayed: '',
      fallLocationType: '',
      hazardType: '',
      warningSignPresent: '',
      incidentReported: '',
      incidentLocationFreeText: '',
      believedResponsibleParty: '',
      officialReportType: '',
    },
    insurance: { clientAutoInsurance: '', otherPartyInsurance: '' },
    injury: {
      injured: '',
      treatmentLocation: '',
      treatmentDates: { start: '', end: '' },
      knownInjuries: '',
      stillTreating: '',
    },
    propertyDamage: { hasDamage: '', severity: '' },
    additionalNotes: '',
  };
}

function buildAiFilledPaths(draft, prefix = '', result = new Set()) {
  Object.entries(draft).forEach(([key, val]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      buildAiFilledPaths(val, path, result);
    } else if (typeof val === 'string' && val.trim() !== '') {
      result.add(path);
    }
  });
  return result;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const copy = JSON.parse(JSON.stringify(obj));
  let cur = copy;
  for (let i = 0; i < keys.length - 1; i += 1) {
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return copy;
}

export function AICaseIntakeModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('describe');
  const [description, setDescription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState('');
  const [analyzeError, setAnalyzeError] = useState('');
  const [caseData, setCaseData] = useState(createEmptyDraft());
  const [aiFilledPaths, setAiFilledPaths] = useState(new Set());
  const [formError, setFormError] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [scoreResult, setScoreResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsTranscribing(true);
    setTranscribeError('');
    try {
      const { transcript } = await transcribeIntakeAudio(file);
      if (transcript) {
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    } catch (err) {
      setTranscribeError(err.message || 'Transcription failed');
    } finally {
      setIsTranscribing(false);
      // reset input so same file can be reselected
      // eslint-disable-next-line no-param-reassign
      e.target.value = '';
    }
  };

  const handleVoiceTranscript = (transcript) => {
    if (transcript) {
      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setAnalyzeError('');
    setStep('analyzing');
    try {
      const draft = await analyzeCase(description.trim());
      const paths = buildAiFilledPaths(draft);
      setCaseData(draft);
      setAiFilledPaths(paths);
      setStep('form');
    } catch (err) {
      setAnalyzeError(err.message || 'Analysis failed');
      setStep('describe');
    }
  };

  const handleFieldChange = (path, value) => {
    setCaseData((prev) => setNestedValue(prev, path, value));
    setAiFilledPaths((prev) => {
      const next = new Set(prev);
      next.delete(path);
      return next;
    });
  };

  const getFieldStyle = (path) =>
    aiFilledPaths.has(path)
      ? 'border-l-2 border-violet-400 bg-violet-50'
      : '';

  const handleScore = async () => {
    const missing = [];
    if (!caseData.contact.fullName) missing.push('Full Name');
    if (!caseData.contact.phone) missing.push('Phone');
    if (!caseData.contact.email) missing.push('Email');
    if (!caseData.accident.dateOfLoss) missing.push('Date of Loss');
    if (!caseData.accident.accidentType) missing.push('Accident Type');
    if (!caseData.injury.injured) missing.push('Injured?');
    if (!caseData.propertyDamage.hasDamage) missing.push('Property Damage?');
    if (missing.length > 0) {
      setFormError(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    setFormError('');
    setScoreError('');
    setStep('scoring');
    try {
      const result = await scoreCase(caseData);
      setScoreResult(result);
      setStep('result');
    } catch (err) {
      setScoreError(err.message || 'Scoring failed');
      setStep('form');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      // Persist the user's original narrative so staff can review it in Leads.
      // The AI analyzer may not always populate accidentTypeDescription for non-"Other" accident types.
      const narrative = description.trim();
      const nextCaseData =
        narrative && !caseData.accident.accidentTypeDescription
          ? {
              ...caseData,
              accident: {
                ...caseData.accident,
                accidentTypeDescription: narrative,
              },
            }
          : caseData;

      await submitIntakeCase(nextCaseData);
      setSaveSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setSaveError(err.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep('describe');
    setDescription('');
    setIsTranscribing(false);
    setTranscribeError('');
    setAnalyzeError('');
    setCaseData(createEmptyDraft());
    setAiFilledPaths(new Set());
    setFormError('');
    setScoreError('');
    setScoreResult(null);
    setIsSaving(false);
    setSaveError('');
    setSaveSuccess(false);
    onClose();
  };

  const renderDescribeStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Describe your accident and injuries in your own words. You can type,
        upload an audio file, or record a voice note — or combine all three.
      </p>

      <textarea
        className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[120px]"
        placeholder="e.g. I was rear-ended on January 5th on the highway. The other driver ran a red light. I went to the ER the same day with neck and back pain..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {isTranscribing && (
        <div
          className="flex items-start gap-3 rounded-xl border-2 border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <svg
            className="w-5 h-5 shrink-0 text-violet-600 animate-spin mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-violet-950">
              Transcribing your audio…
            </p>
            <p className="text-xs text-violet-900/90 mt-1 leading-snug">
              {
                'Please wait — this usually takes a few seconds. "Analyze My Case" stays disabled until transcription finishes so you do not run analysis twice by accident.'
              }
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isTranscribing}
          className={
            isTranscribing
              ? 'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-violet-400 text-sm font-semibold text-violet-900 bg-violet-100 cursor-wait shadow-sm'
              : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50'
          }
        >
          {isTranscribing ? (
            <svg
              className="w-4 h-4 shrink-0 text-violet-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          )}
          {isTranscribing ? 'Transcribing…' : 'Upload Audio'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <IntakeVoiceButton
          onTranscript={handleVoiceTranscript}
          onError={setTranscribeError}
          isLoading={isTranscribing}
        />
        <span
          className={
            isTranscribing
              ? 'text-xs font-medium text-violet-800'
              : 'text-xs text-gray-500'
          }
        >
          {isTranscribing
            ? 'Voice recording is paused while we transcribe.'
            : 'or record a voice note'}
        </span>
      </div>

      {transcribeError && (
        <p className="text-xs text-red-500">{transcribeError}</p>
      )}
      {analyzeError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {analyzeError}
        </p>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!description.trim() || isTranscribing}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-busy={isTranscribing}
      >
        {isTranscribing
          ? 'Transcribing audio — please wait…'
          : 'Analyze My Case'}
      </button>
    </div>
  );

  const renderAnalyzingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center animate-pulse">
        <AISparklesIcon className="w-6 h-6 text-violet-600" />
      </div>
      <p className="text-gray-700 font-medium">
        AI is analyzing your case...
      </p>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Extracting all relevant details from your description. This takes just a
        moment.
      </p>
    </div>
  );

  const renderFormSectionContact = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">
        Contact Information
      </h3>
      <div className="space-y-1">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          Full Name <span className="text-red-500">*</span>
          {aiFilledPaths.has('contact.fullName') && <AIBadge size="sm" />}
        </label>
        <input
          type="text"
          value={caseData.contact.fullName}
          onChange={(e) =>
            handleFieldChange('contact.fullName', e.target.value)
          }
          className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('contact.fullName')}`}
          placeholder="John Smith"
        />
      </div>
      <div className="space-y-1">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          Phone <span className="text-red-500">*</span>
          {aiFilledPaths.has('contact.phone') && <AIBadge size="sm" />}
        </label>
        <input
          type="tel"
          value={caseData.contact.phone}
          onChange={(e) => handleFieldChange('contact.phone', e.target.value)}
          className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('contact.phone')}`}
          placeholder="5551234567"
        />
      </div>
      <div className="space-y-1">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
          {aiFilledPaths.has('contact.email') && <AIBadge size="sm" />}
        </label>
        <input
          type="email"
          value={caseData.contact.email}
          onChange={(e) => handleFieldChange('contact.email', e.target.value)}
          className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('contact.email')}`}
          placeholder="you@example.com"
        />
      </div>
    </div>
  );

  const renderAccidentConditionalFields = () => {
    const { accidentType } = caseData.accident;
    if (!accidentType) return null;

    if (
      accidentType === 'Motor vehicle accident' ||
      accidentType === 'Motorcycle'
    ) {
      return (
        <>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Collision Type
              {aiFilledPaths.has('accident.collisionType') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.collisionType}
              onChange={(e) =>
                handleFieldChange('accident.collisionType', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.collisionType')}`}
            >
              <option value="">Select...</option>
              <option value="Rear-end">Rear-end</option>
              <option value="T-bone">T-bone</option>
              <option value="Head-on">Head-on</option>
              <option value="Sideswipe">Sideswipe</option>
              <option value="Multi-vehicle">Multi-vehicle</option>
              <option value="Hit while parked">Hit while parked</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              At Fault Identified
              {aiFilledPaths.has('accident.atFaultIdentified') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.atFaultIdentified}
              onChange={(e) =>
                handleFieldChange(
                  'accident.atFaultIdentified',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.atFaultIdentified')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Police Report
              {aiFilledPaths.has('accident.policeReport') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.policeReport}
              onChange={(e) =>
                handleFieldChange('accident.policeReport', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.policeReport')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </>
      );
    }

    if (accidentType === 'Pedestrian') {
      return (
        <>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Pedestrian Involvement
              {aiFilledPaths.has('accident.pedestrianInvolvement') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.pedestrianInvolvement}
              onChange={(e) =>
                handleFieldChange(
                  'accident.pedestrianInvolvement',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.pedestrianInvolvement')}`}
            >
              <option value="">Select...</option>
              <option value="Hit by a car">Hit by a car</option>
              <option value="Hit by a truck/bus">Hit by a truck/bus</option>
              <option value="Hit by motorcycle/bicycle">
                Hit by motorcycle/bicycle
              </option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Driver Stayed
              {aiFilledPaths.has('accident.driverStayed') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.driverStayed}
              onChange={(e) =>
                handleFieldChange('accident.driverStayed', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.driverStayed')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Police Report
              {aiFilledPaths.has('accident.policeReport') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.policeReport}
              onChange={(e) =>
                handleFieldChange('accident.policeReport', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.policeReport')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Possible Video
              {aiFilledPaths.has('accident.possibleVideo') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.possibleVideo}
              onChange={(e) =>
                handleFieldChange('accident.possibleVideo', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.possibleVideo')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unsure">Unsure</option>
            </select>
          </div>
        </>
      );
    }

    if (accidentType === 'Bicycle') {
      return (
        <>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Bicycle Type
              {aiFilledPaths.has('accident.bicycleType') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.bicycleType}
              onChange={(e) =>
                handleFieldChange('accident.bicycleType', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.bicycleType')}`}
            >
              <option value="">Select...</option>
              <option value="Regular bicycle">Regular bicycle</option>
              <option value="E-bike">E-bike</option>
              <option value="Scooter">Scooter</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Collision With
              {aiFilledPaths.has('accident.bicycleCollisionWith') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.bicycleCollisionWith}
              onChange={(e) =>
                handleFieldChange(
                  'accident.bicycleCollisionWith',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.bicycleCollisionWith')}`}
            >
              <option value="">Select...</option>
              <option value="Motor vehicle">Motor vehicle</option>
              <option value="Another bicycle/scooter">
                Another bicycle/scooter
              </option>
              <option value="Pedestrian">Pedestrian</option>
              <option value="Fixed object">Fixed object</option>
              <option value="Road defect">Road defect</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Other Party Stayed
              {aiFilledPaths.has('accident.otherPartyStayed') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.otherPartyStayed}
              onChange={(e) =>
                handleFieldChange('accident.otherPartyStayed', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.otherPartyStayed')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Police Report
              {aiFilledPaths.has('accident.policeReport') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.policeReport}
              onChange={(e) =>
                handleFieldChange('accident.policeReport', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.policeReport')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </>
      );
    }

    if (accidentType === 'Slip and fall') {
      return (
        <>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Fall Location Type
              {aiFilledPaths.has('accident.fallLocationType') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.fallLocationType}
              onChange={(e) =>
                handleFieldChange('accident.fallLocationType', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.fallLocationType')}`}
            >
              <option value="">Select...</option>
              <option value="Store/supermarket">Store/supermarket</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Workplace">Workplace</option>
              <option value="Apartment building">Apartment building</option>
              <option value="Private home">Private home</option>
              <option value="Parking lot/sidewalk">Parking lot/sidewalk</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Hazard Type
              {aiFilledPaths.has('accident.hazardType') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.hazardType}
              onChange={(e) =>
                handleFieldChange('accident.hazardType', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.hazardType')}`}
            >
              <option value="">Select...</option>
              <option value="Wet/slippery floor">Wet/slippery floor</option>
              <option value="Ice/snow">Ice/snow</option>
              <option value="Uneven ground">Uneven ground</option>
              <option value="Loose rug/mat">Loose rug/mat</option>
              <option value="Poor lighting">Poor lighting</option>
              <option value="Object on ground">Object on ground</option>
              <option value="Unknown">Unknown</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Warning Sign Present
              {aiFilledPaths.has('accident.warningSignPresent') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.warningSignPresent}
              onChange={(e) =>
                handleFieldChange(
                  'accident.warningSignPresent',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.warningSignPresent')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unsure">Unsure</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Incident Reported
              {aiFilledPaths.has('accident.incidentReported') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.incidentReported}
              onChange={(e) =>
                handleFieldChange('accident.incidentReported', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.incidentReported')}`}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </>
      );
    }

    if (accidentType === 'Other') {
      return (
        <>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Accident Description
              {aiFilledPaths.has('accident.accidentTypeDescription') && (
                <AIBadge size="sm" />
              )}
            </label>
            <textarea
              value={caseData.accident.accidentTypeDescription}
              onChange={(e) =>
                handleFieldChange(
                  'accident.accidentTypeDescription',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.accidentTypeDescription')}`}
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Incident Location
              {aiFilledPaths.has('accident.incidentLocationFreeText') && (
                <AIBadge size="sm" />
              )}
            </label>
            <input
              type="text"
              value={caseData.accident.incidentLocationFreeText}
              onChange={(e) =>
                handleFieldChange(
                  'accident.incidentLocationFreeText',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.incidentLocationFreeText')}`}
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Believed Responsible Party
              {aiFilledPaths.has('accident.believedResponsibleParty') && (
                <AIBadge size="sm" />
              )}
            </label>
            <input
              type="text"
              value={caseData.accident.believedResponsibleParty}
              onChange={(e) =>
                handleFieldChange(
                  'accident.believedResponsibleParty',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.believedResponsibleParty')}`}
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Official Report Type
              {aiFilledPaths.has('accident.officialReportType') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.officialReportType}
              onChange={(e) =>
                handleFieldChange(
                  'accident.officialReportType',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.officialReportType')}`}
            >
              <option value="">Select...</option>
              <option value="Police">Police</option>
              <option value="Workplace report">Workplace report</option>
              <option value="Store/business report">Store/business report</option>
              <option value="No">No</option>
              <option value="Unsure">Unsure</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </>
      );
    }

    return null;
  };

  const renderFormStep = () => (
    <div className="space-y-6">
      <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 text-sm text-violet-900">
        <span className="font-semibold">
          {aiFilledPaths.size} field(s) pre-filled by AI
        </span>{' '}
        — review and complete the remaining fields.
      </div>

      {renderFormSectionContact()}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Accident Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Date of Loss <span className="text-red-500">*</span>
              {aiFilledPaths.has('accident.dateOfLoss') && (
                <AIBadge size="sm" />
              )}
            </label>
            <input
              type="date"
              value={caseData.accident.dateOfLoss}
              onChange={(e) =>
                handleFieldChange('accident.dateOfLoss', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.dateOfLoss')}`}
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Accident Type <span className="text-red-500">*</span>
              {aiFilledPaths.has('accident.accidentType') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.accident.accidentType}
              onChange={(e) =>
                handleFieldChange('accident.accidentType', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('accident.accidentType')}`}
            >
              <option value="">Select...</option>
              <option value="Motor vehicle accident">
                Motor vehicle accident
              </option>
              <option value="Pedestrian">Pedestrian</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Slip and fall">Slip and fall</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderAccidentConditionalFields()}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Insurance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Your Auto Insurance
              {aiFilledPaths.has('insurance.clientAutoInsurance') && (
                <AIBadge size="sm" />
              )}
            </label>
            <input
              type="text"
              value={caseData.insurance.clientAutoInsurance}
              onChange={(e) =>
                handleFieldChange(
                  'insurance.clientAutoInsurance',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('insurance.clientAutoInsurance')}`}
              placeholder="Company name, or Yes / No / Unsure"
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Other Party Insurance
              {aiFilledPaths.has('insurance.otherPartyInsurance') && (
                <AIBadge size="sm" />
              )}
            </label>
            <input
              type="text"
              value={caseData.insurance.otherPartyInsurance}
              onChange={(e) =>
                handleFieldChange(
                  'insurance.otherPartyInsurance',
                  e.target.value
                )
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('insurance.otherPartyInsurance')}`}
              placeholder="Company name, or Yes / No / Unsure"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Injury &amp; Treatment
        </h3>
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
            Injured? <span className="text-red-500">*</span>
            {aiFilledPaths.has('injury.injured') && <AIBadge size="sm" />}
          </label>
          <select
            value={caseData.injury.injured}
            onChange={(e) => handleFieldChange('injury.injured', e.target.value)}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('injury.injured')}`}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unsure">Unsure</option>
          </select>
        </div>

        {caseData.injury.injured === 'Yes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                Treatment Location
                {aiFilledPaths.has('injury.treatmentLocation') && (
                  <AIBadge size="sm" />
                )}
              </label>
              <select
                value={caseData.injury.treatmentLocation}
                onChange={(e) =>
                  handleFieldChange(
                    'injury.treatmentLocation',
                    e.target.value
                  )
                }
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('injury.treatmentLocation')}`}
              >
                <option value="">Select...</option>
                <option value="Emergency room">Emergency room</option>
                <option value="Urgent care">Urgent care</option>
                <option value="Chiropractor">Chiropractor</option>
                <option value="Primary care">Primary care</option>
                <option value="Hospital">Hospital</option>
                <option value="No treatment yet">No treatment yet</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                Treatment Start Date
                {aiFilledPaths.has('injury.treatmentDates.start') && (
                  <AIBadge size="sm" />
                )}
              </label>
              <input
                type="date"
                value={caseData.injury.treatmentDates?.start || ''}
                onChange={(e) =>
                  handleFieldChange(
                    'injury.treatmentDates.start',
                    e.target.value
                  )
                }
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('injury.treatmentDates.start')}`}
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                Treatment End Date (optional)
                {aiFilledPaths.has('injury.treatmentDates.end') && (
                  <AIBadge size="sm" />
                )}
              </label>
              <input
                type="date"
                value={caseData.injury.treatmentDates?.end || ''}
                onChange={(e) =>
                  handleFieldChange(
                    'injury.treatmentDates.end',
                    e.target.value
                  )
                }
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('injury.treatmentDates.end')}`}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                Known Injuries
                {aiFilledPaths.has('injury.knownInjuries') && (
                  <AIBadge size="sm" />
                )}
              </label>
              <textarea
                value={caseData.injury.knownInjuries}
                onChange={(e) =>
                  handleFieldChange(
                    'injury.knownInjuries',
                    e.target.value
                  )
                }
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('injury.knownInjuries')}`}
                placeholder="e.g. Neck pain, lower back pain, right ankle sprain"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                Still Treating?
                {aiFilledPaths.has('injury.stillTreating') && (
                  <AIBadge size="sm" />
                )}
              </label>
              <select
                value={caseData.injury.stillTreating}
                onChange={(e) =>
                  handleFieldChange('injury.stillTreating', e.target.value)
                }
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('injury.stillTreating')}`}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unsure">Unsure</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Property Damage
        </h3>
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
            Has Damage? <span className="text-red-500">*</span>
            {aiFilledPaths.has('propertyDamage.hasDamage') && (
              <AIBadge size="sm" />
            )}
          </label>
          <select
            value={caseData.propertyDamage.hasDamage}
            onChange={(e) =>
              handleFieldChange('propertyDamage.hasDamage', e.target.value)
            }
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('propertyDamage.hasDamage')}`}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unsure">Unsure</option>
          </select>
        </div>

        {caseData.propertyDamage.hasDamage === 'Yes' && (
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
              Severity
              {aiFilledPaths.has('propertyDamage.severity') && (
                <AIBadge size="sm" />
              )}
            </label>
            <select
              value={caseData.propertyDamage.severity}
              onChange={(e) =>
                handleFieldChange('propertyDamage.severity', e.target.value)
              }
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('propertyDamage.severity')}`}
            >
              <option value="">Select...</option>
              <option value="Minor">Minor</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Total loss">Total loss</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Additional Notes
        </h3>
        <textarea
          value={caseData.additionalNotes}
          onChange={(e) =>
            handleFieldChange('additionalNotes', e.target.value)
          }
          className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-violet-400 ${getFieldStyle('additionalNotes')}`}
          placeholder="Anything else we should know?"
        />
      </div>

      {formError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {formError}
        </p>
      )}
      {scoreError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {scoreError}
        </p>
      )}
      <button
        type="button"
        onClick={handleScore}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow hover:shadow-md transition-all mt-4"
      >
        Calculate Viability Score
      </button>
    </div>
  );

  const renderScoringStep = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
        <AISparklesIcon className="w-6 h-6 text-indigo-600" />
      </div>
      <p className="text-gray-700 font-medium">
        Evaluating case viability...
      </p>
    </div>
  );

  const renderResultStep = () => {
    if (!scoreResult) return null;
    const score = scoreResult.score ?? 50;
    const label = scoreResult.viabilityLabel || 'Medium';

    return (
      <div className="space-y-5">
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold mb-2 ${
              score >= 70
                ? 'bg-green-100 text-green-700'
                : score >= 40
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {score}
          </div>
          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              label === 'High'
                ? 'bg-green-100 text-green-700'
                : label === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {label} Viability
          </div>
        </div>

        {scoreResult.summary && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700">{scoreResult.summary}</p>
          </div>
        )}

        {scoreResult.keyFactors?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Key Factors
            </p>
            <ul className="space-y-1">
              {scoreResult.keyFactors.map((f, i) => (
                <li
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {saveError}
          </p>
        )}

        {saveSuccess ? (
          <div className="text-center py-4">
            <p className="text-green-700 font-medium">
              Case saved successfully!
            </p>
            <p className="text-sm text-gray-500 mt-1">
              A team member will review your case shortly.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 px-6 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow hover:shadow-md disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Case'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full sm:max-w-2xl bg-white text-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <AISparklesIcon className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-gray-900">
              {step === 'describe' && 'AI Case Intake'}
              {step === 'analyzing' && 'Analyzing Your Case...'}
              {step === 'form' && 'Review & Complete Your Case'}
              {step === 'scoring' && 'Evaluating Case Viability...'}
              {step === 'result' && 'Case Viability Score'}
            </span>
            <AIBadge size="sm" />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'describe' && renderDescribeStep()}
          {step === 'analyzing' && renderAnalyzingStep()}
          {step === 'form' && renderFormStep()}
          {step === 'scoring' && renderScoringStep()}
          {step === 'result' && renderResultStep()}
        </div>
      </div>
    </div>
  );
}

