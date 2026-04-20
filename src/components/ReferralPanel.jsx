import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingInline } from './LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const providerTypeLabel = (t) => {
  if (!t) return '';
  return String(t)
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
};

const statusBadgeClasses = (status) => {
  switch (status) {
    case 'suggested':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'no_response':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ReferralPanel({ caseId, injuries = [] }) {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [referrals, setReferrals] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [providers, setProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');

  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedInjuryIds, setSelectedInjuryIds] = useState([]);
  const [notes, setNotes] = useState('');

  const injuryById = useMemo(() => {
    const map = new Map();
    for (const inj of injuries) map.set(Number(inj.id), inj);
    return map;
  }, [injuries]);

  const selectedProvider = useMemo(
    () => providers.find((p) => Number(p.id) === Number(selectedProviderId)) || null,
    [providers, selectedProviderId]
  );

  const filteredProviders = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) => {
      const n = String(p.name || '').toLowerCase();
      const t = String(p.provider_type || '').toLowerCase();
      return n.includes(q) || t.includes(q);
    });
  }, [providers, providerSearch]);

  const injuryLabels = (injuryIds) => {
    if (!Array.isArray(injuryIds) || injuryIds.length === 0) return '—';
    return injuryIds
      .map((id) => injuryById.get(Number(id)))
      .filter(Boolean)
      .map((inj) => {
        const body = providerTypeLabel(inj.body_part || inj.bodyPart);
        const symptom = inj.symptom_type ? String(inj.symptom_type) : '';
        const sev = inj.severity_level ? String(inj.severity_level) : '';
        const parts = [body, symptom, sev].filter(Boolean);
        return parts.join(' • ');
      })
      .join(', ');
  };

  const fetchProviders = async () => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/providers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to load providers');
    setProviders(Array.isArray(data.providers) ? data.providers : []);
  };

  const fetchReferrals = async () => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/cases/${caseId}/referrals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to load referrals');
    setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
    setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await fetchProviders();
        await fetchReferrals();
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load referral data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const patchReferralStatus = async (referralId, nextStatus) => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/referrals/${referralId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ referral_status: nextStatus }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to update referral');
    return data;
  };

  const handleScheduleSuggested = async (referralId) => {
    try {
      await patchReferralStatus(referralId, 'scheduled');
      await fetchReferrals();
    } catch (err) {
      alert(err.message || 'Failed to schedule');
    }
  };

  const toggleSelectedInjury = (injId) => {
    const id = Number(injId);
    setSelectedInjuryIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const handleCreateManualReferral = async () => {
    if (!selectedProviderId) {
      alert('Select a provider first.');
      return;
    }
    if (!Array.isArray(selectedInjuryIds) || selectedInjuryIds.length === 0) {
      alert('Select at least one injury to map to the referral.');
      return;
    }

    const base = getBaseUrl();
    const res = await fetch(`${base}/api/cases/${caseId}/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider_id: Number(selectedProviderId),
        injury_ids: selectedInjuryIds.map((x) => Number(x)),
        notes: notes ? String(notes) : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Failed to create referral');
      return;
    }

    // Reset form and refresh.
    setSelectedProviderId(null);
    setSelectedInjuryIds([]);
    setNotes('');
    setProviderSearch('');
    await fetchReferrals();
  };

  const handleStatusDropdown = async (referralId, nextStatus) => {
    try {
      await patchReferralStatus(referralId, nextStatus);
      await fetchReferrals();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
          <LoadingInline message="Loading referral data…" />
        </div>
      )}
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">{error}</div>}

      {!loading && (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Suggested Referrals</h2>
            <p className="text-sm text-gray-600">Auto-mapped based on documented injuries.</p>

            {suggestions.length === 0 ? (
              <div className="mt-4 text-sm text-gray-600">No suggestions available yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {suggestions.map((s) => (
                  <div key={s.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {s.provider_name} <span className="text-gray-500 font-normal">({providerTypeLabel(s.provider_type)})</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Injury mapping: {injuryLabels(s.injury_ids)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScheduleSuggested(s.id)}
                        className="px-3 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Manual Referral</h2>
            <p className="text-sm text-gray-600">Create a referral and map it to one or more injuries.</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <input
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  placeholder="Search by name or type..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                />
                <select
                  value={selectedProviderId || ''}
                  onChange={(e) => setSelectedProviderId(e.target.value ? Number(e.target.value) : null)}
                  className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                >
                  <option value="">Select a provider...</option>
                  {filteredProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({providerTypeLabel(p.provider_type)})
                    </option>
                  ))}
                </select>

                {selectedProvider?.lien_friendly && (
                  <div className="mt-2 inline-flex items-center rounded-full bg-lime-50 border border-lime-200 px-3 py-1 text-xs font-semibold text-lime-900">
                    Lien-friendly
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any scheduling preferences or internal notes..."
                  className="w-full min-h-[92px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Injury Mapping</label>
              {injuries.length === 0 ? (
                <div className="text-sm text-gray-600">No injuries on this case.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {injuries.map((inj) => {
                    const id = Number(inj.id);
                    const checked = selectedInjuryIds.includes(id);
                    const label = `${providerTypeLabel(inj.body_part)}${inj.symptom_type ? ` • ${inj.symptom_type}` : ''}${inj.severity_level ? ` • ${inj.severity_level}` : ''}`;
                    return (
                      <label
                        key={inj.id}
                        className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${
                          checked ? 'bg-lime-50 border-lime-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectedInjury(id)}
                          className="mt-1"
                        />
                        <div className="text-sm text-gray-900">{label}</div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCreateManualReferral}
                className="px-5 py-2 text-sm font-semibold bg-lime-400 text-slate-900 rounded-full shadow-md shadow-lime-400/25 hover:bg-lime-300"
              >
                Create Referral
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Referral Status Tracker</h2>
            <p className="text-sm text-gray-600">Track suggested → scheduled → completed referral outcomes.</p>

            {referrals.length === 0 ? (
              <div className="mt-4 text-sm text-gray-600">No referrals created yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {referrals.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {r.provider_name} <span className="text-gray-500 font-normal">({providerTypeLabel(r.provider_type)})</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Injury mapping: {injuryLabels(r.injury_ids)}
                        </div>
                        {r.notes && (
                          <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                            <span className="font-semibold">Notes: </span>
                            {String(r.notes)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClasses(r.referral_status)}`}>
                          {String(r.referral_status).replace(/_/g, ' ').toUpperCase()}
                        </span>

                        <select
                          value={r.referral_status}
                          onChange={(e) => handleStatusDropdown(r.id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                        >
                          {Array.from(ALLOWED_REFERRAL_STATUSES).map((st) => (
                            <option key={st} value={st}>
                              {st.replace(/_/g, ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Mirror allowed values from backend for UI safety.
const ALLOWED_REFERRAL_STATUSES = new Set([
  'suggested',
  'scheduled',
  'completed',
  'declined',
  'no_response',
]);

