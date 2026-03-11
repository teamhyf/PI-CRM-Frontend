/**
 * Chat intake API – talks to backend for session, message, submit, transcribe.
 * Uses VITE_API_BASE_URL (e.g. http://localhost:4000) or same origin if unset.
 */

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

/**
 * Fetch all cases from the backend (dynamic list from MySQL).
 */
export async function getCases() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/cases`);
  if (!res.ok) throw new Error('Failed to load cases');
  return res.json();
}

/**
 * Start a chat session. Optionally pass initial contact (name, phone, email) to skip those questions.
 */
export async function startSession(initialContact = null) {
  const base = getBaseUrl();
  const body = initialContact && typeof initialContact === 'object'
    ? { contact: { fullName: initialContact.fullName || '', phone: initialContact.phone || '', email: initialContact.email || '' } }
    : {};
  const res = await fetch(`${base}/api/chat/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = 'Failed to start chat session';
    try {
      const data = JSON.parse(text);
      if (data && typeof data.error === 'string') message = data.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json();
}

export async function sendMessage(sessionId, messageText) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: Number(sessionId), messageText }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Failed to send message');
  }
  return res.json();
}

/**
 * Get AI viability score and summary for the current draft (preview before submit).
 * Returns { summary, score, viabilityLabel, keyFactors }.
 */
export async function getPreviewScore(sessionId) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/chat/preview-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: Number(sessionId) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to get preview score');
  }
  return res.json();
}

export async function submitCase(sessionId) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/chat/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: Number(sessionId) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to submit case');
  }
  return res.json();
}

export async function uploadAudio(sessionId, file) {
  const base = getBaseUrl();
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('sessionId', sessionId);
  const res = await fetch(`${base}/api/chat/transcribe`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const notImplemented =
      res.status === 501 ||
      (data.error && String(data.error).toLowerCase().includes('not yet implemented'));
    const message = notImplemented
      ? 'Audio upload is not available yet. Please type your message or use the microphone (Chrome or Edge).'
      : (data.error || 'Transcription failed.');
    throw new Error(message);
  }

  // Return the transcript from the successful response
  const transcript = (data && data.transcript) || '';

  // If transcript is empty but there was no error, it might be a graceful fallback message
  if (!transcript || transcript.startsWith('[Audio')) {
    throw new Error(transcript || 'No transcription available. Please try again.');
  }

  return transcript;
}
