const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const getAuthHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export async function getLeads(token, status = null) {
  const base = getBaseUrl();
  const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${base}/api/leads${qs}`, { headers: getAuthHeaders(token) });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized. Please login.');
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load leads');
  }
  return res.json();
}

export async function updateLeadStatus(token, leadId, status) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update lead status');
  return data;
}

export async function convertLead(token, leadId) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/leads/${leadId}/convert`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to convert lead');
  return data;
}

