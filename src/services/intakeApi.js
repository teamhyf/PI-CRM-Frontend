const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function getBaseUrl() {
  return BASE_URL.replace(/\/$/, '');
}

export async function transcribeIntakeAudio(file) {
  const formData = new FormData();
  formData.append('audio', file);
  const res = await fetch(`${getBaseUrl()}/api/intake/transcribe`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Transcription failed');
  return data; // { transcript: string }
}

export async function analyzeCase(text) {
  const res = await fetch(`${getBaseUrl()}/api/intake/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Analysis failed');
  return data; // full caseDraft object
}

export async function scoreCase(caseData) {
  const res = await fetch(`${getBaseUrl()}/api/intake/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Scoring failed');
  return data; // { summary, score, viabilityLabel, keyFactors }
}

export async function submitIntakeCase(caseData) {
  const res = await fetch(`${getBaseUrl()}/api/intake/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Submit failed');
  return data; // { success: true, caseId: number }
}

