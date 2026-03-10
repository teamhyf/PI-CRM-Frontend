import { useEffect, useRef, useState } from 'react';
import { useIntake } from '../context/IntakeContext';
import { AISparklesIcon, AIBadge } from './AIIcon';
import { VoiceInputButton } from './VoiceInputButton';
import { evaluateCase } from '../utils/caseQualificationEngine';
import { generateCaseSummary } from '../utils/generateCaseSummary';
import { sendMessage, submitCase, uploadAudio, startSession } from '../services/chatApi';

function mapBackendMessages(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) => ({
    id: `msg-${i}-${row.created_at || Date.now()}`,
    sender: row.role === 'user' ? 'user' : 'assistant',
    text: row.content || '',
    createdAt: row.created_at || new Date().toISOString(),
  }));
}

const emptyDraft = () => ({
  contact: { fullName: '', phone: '', email: '' },
  accident: { dateOfLoss: '', accidentType: '', accidentTypeDescription: '', atFaultIdentified: '', policeReport: '' },
  insurance: { clientAutoInsurance: '', otherPartyInsurance: '' },
  injury: { injured: '', treatmentLocation: '', treatmentDates: { start: '', end: '' }, knownInjuries: '', stillTreating: '' },
  propertyDamage: { hasDamage: '', severity: '' },
  additionalNotes: '',
});

export function ChatIntakeModal({
  isOpen,
  onClose,
  onSuccess,
  sessionId: propsSessionId,
  initialDraft,
  initialMessages,
  initialStatus,
  sessionError,
  onStartChatWithContact,
  onRetrySession,
}) {
  const { submitDraftCase, refreshCasesFromApi } = useIntake();

  const [sessionId, setSessionId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('collecting');
  const [lastAskedField, setLastAskedField] = useState(null);

  const [contactForm, setContactForm] = useState({ fullName: '', phone: '', email: '' });
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [datePick, setDatePick] = useState('');
  const [treatmentStart, setTreatmentStart] = useState('');
  const [treatmentEnd, setTreatmentEnd] = useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync from parent when backend session is ready
  useEffect(() => {
    if (propsSessionId != null && initialMessages != null) {
      setSessionId(propsSessionId);
      setDraft(initialDraft ?? emptyDraft());
      setMessages(mapBackendMessages(initialMessages));
      setStatus(initialStatus ?? 'collecting');
      setLastAskedField(null);
    }
  }, [propsSessionId, initialDraft, initialMessages, initialStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, messages?.length, status]);

  if (!isOpen) return null;

  const handleUserMessage = async (text) => {
    if (!text.trim() || !sessionId) return;
    setSending(true);
    setAudioError('');
    try {
      const result = await sendMessage(sessionId, text.trim());
      setDraft(result.draft ?? draft);
      setMessages(mapBackendMessages(result.messages ?? []));
      setStatus(result.status ?? status);
      setLastAskedField(result.nextField ?? null);
    } catch (err) {
      setAudioError(err.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const t = input.trim();
    if (!t || sending) return;
    setInput('');
    handleUserMessage(t);
  };

  const handleVoiceTranscript = (t) => {
    setInput((prev) => (prev ? `${prev} ${t}` : t));
  };

  const handleAudioFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !sessionId) return;
    setAudioError('');
    setUploadingAudio(true);
    try {
      const text = await uploadAudio(sessionId, file);
      await handleUserMessage(text);
    } catch (err) {
      setAudioError(err.message || 'Unable to transcribe that audio. Try typing your message.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSubmitCase = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await submitCase(sessionId);
      try {
        await refreshCasesFromApi();
      } catch (_e) {
        await submitDraftCase(draft);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setAudioError(err.message || 'Failed to submit case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartOver = async () => {
    setDatePick('');
    setTreatmentStart('');
    setTreatmentEnd('');
    setInput('');
    setAudioError('');
    try {
      const session = await startSession();
      setSessionId(session.sessionId);
      setDraft(session.draft ?? emptyDraft());
      setMessages(mapBackendMessages(session.messages ?? []));
      setStatus(session.status ?? 'collecting');
      setLastAskedField(null);
    } catch (err) {
      setAudioError(err.message || 'Failed to start over.');
    }
  };

  const isLoading = isOpen && sessionId == null && !sessionError && !onStartChatWithContact;
  const showContactForm = sessionId == null && !sessionError && !!onStartChatWithContact;
  const showChat = sessionId != null;
  const evaluation = evaluateCase(draft);
  const summary = generateCaseSummary(draft);

  const clearPickers = () => {
    setDatePick('');
    setTreatmentStart('');
    setTreatmentEnd('');
  };

  // Only show quick-option chips for questions that have a fixed set of answers.
  // Open-ended questions (name, phone, email, date, accident type, insurance company name) get no chips – user types in the input.
  const renderQuickOptions = () => {
    const baseBtn =
      'px-3 py-1.5 text-xs md:text-[13px] rounded-full border font-semibold transition-colors';

    const freeTextFields = [
      'contact.fullName',
      'contact.phone',
      'contact.email',
      'accident.dateOfLoss',
      'accident.accidentType',
      'accident.accidentTypeDescription',
      'insurance.clientAutoInsurance',   // "Who is your auto insurance company?" – type company name
      'insurance.otherPartyInsurance',   // Other party's insurance – type company name or "I don't know"
      'injury.knownInjuries',
      'additionalNotes',
    ];
    if (freeTextFields.includes(lastAskedField)) {
      return null; // No chips; user types in the text input
    }

    if (lastAskedField === 'injury.injured' || lastAskedField === 'injury.stillTreating') {
      return (
        <>
          <button
            type="button"
            className={`${baseBtn} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`}
            onClick={() => handleUserMessage('Yes')}
          >
            Yes
          </button>
          <button
            type="button"
            className={`${baseBtn} bg-white text-gray-700 border-gray-200 hover:bg-gray-50`}
            onClick={() => handleUserMessage('No')}
          >
            No
          </button>
        </>
      );
    }

    if (lastAskedField === 'propertyDamage.hasDamage') {
      return (
        <>
          <button
            type="button"
            className={`${baseBtn} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`}
            onClick={() => handleUserMessage('Yes')}
          >
            Yes
          </button>
          <button
            type="button"
            className={`${baseBtn} bg-white text-gray-700 border-gray-200 hover:bg-gray-50`}
            onClick={() => handleUserMessage('No')}
          >
            No
          </button>
        </>
      );
    }

    if (lastAskedField === 'injury.treatmentLocation') {
      return (
        <>
          {[
            { label: 'Emergency Room', value: 'ER' },
            { label: 'Urgent Care', value: 'Urgent Care' },
            { label: 'Primary Doctor', value: 'Primary Care Physician' },
            { label: 'None yet', value: 'None yet' },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={`${baseBtn} bg-white text-gray-700 border-gray-200 hover:bg-gray-50`}
              onClick={() => handleUserMessage(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </>
      );
    }

    if (
      lastAskedField === 'accident.atFaultIdentified' ||
      lastAskedField === 'accident.policeReport'
    ) {
      return (
        <>
          <button
            type="button"
            className={`${baseBtn} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`}
            onClick={() => handleUserMessage('Yes')}
          >
            Yes
          </button>
          <button
            type="button"
            className={`${baseBtn} bg-white text-gray-700 border-gray-200 hover:bg-gray-50`}
            onClick={() => handleUserMessage('No')}
          >
            No
          </button>
          <button
            type="button"
            className={`${baseBtn} bg-white text-gray-700 border-gray-200 hover:bg-gray-50`}
            onClick={() => handleUserMessage('Unknown')}
          >
            Unknown
          </button>
        </>
      );
    }

    if (lastAskedField === 'propertyDamage.severity') {
      return (
        <>
          {['Minor', 'Moderate', 'Severe', 'Total Loss'].map((label) => (
            <button
              key={label}
              type="button"
              className={`${baseBtn} bg-white text-gray-700 border-gray-200 hover:bg-gray-50`}
              onClick={() => handleUserMessage(label)}
            >
              {label}
            </button>
          ))}
        </>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-5xl h-[70vh] max-h-[96vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20">
              <AISparklesIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Chat with AI Assistant</h2>
              <p className="text-xs text-blue-100">
                Describe your accident, and I’ll build your case details.
              </p>
            </div>
            <AIBadge size="sm" />
          </div>
          {showChat && (
            <button
              type="button"
              onClick={handleStartOver}
              className="mr-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-white/40 text-white/90 hover:bg-white/10"
            >
              Start over
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
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

        <div className="flex flex-1 min-h-0">
          <div
            className={`flex flex-col ${
              status === 'ready_for_preview'
                ? 'flex-[2] border-r border-gray-200'
                : 'flex-1'
            }`}
          >
            {isLoading && (
              <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
                Starting chat…
              </div>
            )}
            {sessionError && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
                <p className="text-red-600 text-sm">{sessionError}</p>
                {onRetrySession && (
                  <button type="button" onClick={onRetrySession} className="btn-primary text-sm py-2 px-4">
                    Try again
                  </button>
                )}
              </div>
            )}
            {showContactForm && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-4">
                  Share your contact details first. Then we’ll ask about the accident.
                </p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="pre-fullName" className="block text-xs font-semibold text-gray-700 mb-1">Full name *</label>
                    <input
                      id="pre-fullName"
                      type="text"
                      className="input-field w-full py-2 text-sm"
                      placeholder="e.g. John Smith"
                      value={contactForm.fullName}
                      onChange={(e) => setContactForm((p) => ({ ...p, fullName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="pre-phone" className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                    <input
                      id="pre-phone"
                      type="tel"
                      className="input-field w-full py-2 text-sm"
                      placeholder="e.g. 5551234567"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="pre-email" className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                    <input
                      id="pre-email"
                      type="email"
                      className="input-field w-full py-2 text-sm"
                      placeholder="e.g. you@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    className="btn-primary w-full py-2.5 text-sm"
                    disabled={contactFormSubmitting || !contactForm.fullName.trim() || !contactForm.phone.trim() || !contactForm.email.trim()}
                    onClick={async () => {
                      setContactFormSubmitting(true);
                      try {
                        await onStartChatWithContact({
                          fullName: contactForm.fullName.trim(),
                          phone: contactForm.phone.trim(),
                          email: contactForm.email.trim(),
                        });
                      } finally {
                        setContactFormSubmitting(false);
                      }
                    }}
                  >
                    {contactFormSubmitting ? 'Starting chat…' : 'Start chat'}
                  </button>
                </div>
              </div>
            )}
            {showChat && (
            <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* Quick option chips for objective questions */}
            {renderQuickOptions() && (
              <div className="px-4 pt-2 pb-1 border-t border-gray-100 bg-white flex flex-wrap gap-2">
                {renderQuickOptions()}
              </div>
            )}

            {/* Quick date pickers for date questions */}
            {(lastAskedField === 'accident.dateOfLoss' || lastAskedField === 'injury.treatmentDates') && (
              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                {lastAskedField === 'accident.dateOfLoss' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">Pick date:</span>
                      <input
                        type="date"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        value={datePick}
                        onChange={(e) => setDatePick(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!datePick) return;
                        setInput(datePick);
                      }}
                      className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                      disabled={!datePick}
                    >
                      Use date
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const iso = today.toISOString().split('T')[0];
                        setDatePick(iso);
                        setInput(iso);
                      }}
                      className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        const iso = d.toISOString().split('T')[0];
                        setDatePick(iso);
                        setInput(iso);
                      }}
                      className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    >
                      Yesterday
                    </button>
                  </div>
                )}

                {lastAskedField === 'injury.treatmentDates' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-gray-700">Treatment dates:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          value={treatmentStart}
                          onChange={(e) => setTreatmentStart(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                        <span className="text-xs text-gray-500">to</span>
                        <input
                          type="date"
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          value={treatmentEnd}
                          onChange={(e) => setTreatmentEnd(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!treatmentStart && !treatmentEnd) return;
                          const text = treatmentStart && treatmentEnd ? `${treatmentStart} to ${treatmentEnd}` : (treatmentStart || treatmentEnd);
                          setInput(text);
                        }}
                        className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        disabled={!treatmentStart && !treatmentEnd}
                      >
                        Use dates
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Tip: you can also type something like “Jan 5 to Jan 10, 2026”.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1 px-4 py-3 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                {/* Audio upload button */}
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAudio}
                    title="Upload audio file"
                  >
                    {uploadingAudio ? (
                      <span className="text-[10px] font-semibold">...</span>
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
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4m0 0l4 4m-4-4v12"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.m4a,.mp3,.wav,.webm"
                    className="hidden"
                    onChange={handleAudioFileChange}
                  />
                </div>

                <VoiceInputButton onTranscript={handleVoiceTranscript} />
                <input
                  type="text"
                  className="flex-1 input-field py-2 text-sm"
                  placeholder="Type your message here…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              {audioError && (
                <p className="text-[11px] text-red-500 mt-0.5">
                  {audioError}
                </p>
              )}
            </div>
          </>
            )}
          </div>

          {status === 'ready_for_preview' && showChat && (
            <div className="flex flex-col flex-[1.4] bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <AISparklesIcon className="w-4 h-4 text-violet-500" />
                Case Draft
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Review everything before you submit.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Contact</p>
                <p className="text-sm font-medium text-gray-900">
                  {draft.contact.fullName || 'Name: —'}
                </p>
                <p className="text-xs text-gray-700">
                  {draft.contact.phone && `Phone: ${draft.contact.phone}`}
                  {draft.contact.email &&
                    ` ${draft.contact.phone ? ' · ' : ''}Email: ${
                      draft.contact.email
                    }`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Accident</p>
                <p className="text-sm text-gray-800">
                  Date: {draft.accident.dateOfLoss || '—'}
                </p>
                <p className="text-sm text-gray-800">
                  Type: {draft.accident.accidentType || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Insurance</p>
                <p className="text-sm text-gray-800">
                  Your auto insurance:{' '}
                  {draft.insurance.clientAutoInsurance || '—'}
                </p>
                <p className="text-sm text-gray-800">
                  Other party insurance:{' '}
                  {draft.insurance.otherPartyInsurance || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Injury &amp; Damage</p>
                <p className="text-sm text-gray-800">
                  Injured: {draft.injury.injured || '—'}
                </p>
                {draft.injury.treatmentLocation && (
                  <p className="text-sm text-gray-800">
                    Treatment: {draft.injury.treatmentLocation}
                  </p>
                )}
                {(draft.injury.treatmentDates?.start || draft.injury.treatmentDates?.end || (typeof draft.injury.treatmentDates === 'string' && draft.injury.treatmentDates)) && (
                  <p className="text-sm text-gray-800">
                    Treatment dates: {typeof draft.injury.treatmentDates === 'string'
                      ? draft.injury.treatmentDates
                      : [draft.injury.treatmentDates?.start, draft.injury.treatmentDates?.end].filter(Boolean).join(' – ')}
                  </p>
                )}
                {draft.injury.knownInjuries && (
                  <p className="text-sm text-gray-800">
                    Known injuries: {draft.injury.knownInjuries}
                  </p>
                )}
                {draft.injury.stillTreating && (
                  <p className="text-sm text-gray-800">
                    Still treating: {draft.injury.stillTreating}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-800">
                  Property damage: {draft.propertyDamage.hasDamage || '—'}
                </p>
                {draft.propertyDamage.severity && (
                  <p className="text-sm text-gray-800">
                    Damage severity: {draft.propertyDamage.severity}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Extra accident details</p>
                {draft.accident.atFaultIdentified && (
                  <p className="text-sm text-gray-800">
                    At-fault identified: {draft.accident.atFaultIdentified}
                  </p>
                )}
                {draft.accident.policeReport && (
                  <p className="text-sm text-gray-800">
                    Police report filed: {draft.accident.policeReport}
                  </p>
                )}
                {draft.accident.accidentTypeDescription && (
                  <p className="text-sm text-gray-800">
                    Type description: {draft.accident.accidentTypeDescription}
                  </p>
                )}
                {draft.additionalNotes && (
                  <p className="text-sm text-gray-800">
                    Notes: {draft.additionalNotes}
                  </p>
                )}
              </div>

              {status === 'ready_for_preview' && (
                <div className="mt-2 p-3 rounded-xl bg-white border border-violet-200 shadow-sm">
                  <p className="text-xs font-semibold text-violet-700 mb-1">
                    AI Case Summary
                  </p>
                  <p className="text-xs text-gray-800 mb-2">{summary}</p>
                  <p className="text-xs text-gray-600">
                    Viability: {evaluation.viabilityLevel} · Score:{' '}
                    {evaluation.score}/100
                  </p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <button
                type="button"
                className="btn-primary w-full text-sm py-2.5"
                disabled={submitting}
                onClick={handleSubmitCase}
              >
                {submitting ? 'Submitting…' : 'Submit Case'}
              </button>
              <p className="mt-1 text-[11px] text-gray-500 text-center">
                You’ll see a confirmation message on the landing page after
                submission.
              </p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

