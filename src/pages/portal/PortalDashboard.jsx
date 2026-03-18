import { useEffect, useState } from 'react';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

function formatISODate(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

const providerTypeLabel = (t) =>
  String(t || '')
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

export function PortalDashboard() {
  const { token, claimant } = useClaimantAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [caseData, setCaseData] = useState(null);

  const [pathwayLoading, setPathwayLoading] = useState(false);
  const [pathwayError, setPathwayError] = useState('');
  const [pathway, setPathway] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/case`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load case');
        if (!cancelled) setCaseData(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load case');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token || !caseData?.caseId) return;

      const caseIdNum = String(caseData.caseId).replace(/^CASE-/, '');
      if (!caseIdNum) return;

      setPathwayLoading(true);
      setPathwayError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/cases/${caseIdNum}/treatment-pathway`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load treatment pathway');
        if (!cancelled) setPathway(data);
      } catch (e) {
        if (!cancelled) setPathwayError(e.message || 'Failed to load treatment pathway');
      } finally {
        if (!cancelled) setPathwayLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token, caseData]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-600 mt-1">
          {claimant?.fullName ? `${claimant.fullName} · ` : ''}{claimant?.email || ''}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Case Status</h2>

        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        ) : caseData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Case</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{caseData.caseId}</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Status</p>
              <p className="text-lg font-bold text-indigo-900 mt-1">{caseData.status}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accident type</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{caseData.accidentType || '—'}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of loss</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{formatISODate(caseData.dateOfLoss)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No case found.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Treatment Pathway</h2>
            <p className="text-sm text-gray-600">Based on your documented injuries.</p>
          </div>
          {pathway?.urgencyLevel && pathway.urgencyLevel !== 'routine' && (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                pathway.urgencyLevel === 'urgent'
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              {String(pathway.urgencyLevel).toUpperCase()}
            </span>
          )}
        </div>

        {pathwayLoading && <p className="text-sm text-gray-600 mt-3">Loading treatment pathway…</p>}
        {pathwayError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mt-3">{pathwayError}</p>}

        {!pathwayLoading && !pathwayError && pathway && (
          <div className="mt-4 space-y-4">
            {pathway.introText ? (
              <>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{pathway.introText}</div>
                <div className="space-y-3">
                  {(pathway.suggestedProviderTypeList || []).map((t) => (
                    <div key={t} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="text-sm font-semibold text-gray-900">{providerTypeLabel(t)}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {pathway.providerDescriptions?.[t] || '—'}
                      </div>
                    </div>
                  ))}
                </div>
                {pathway.closingNote && (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap font-medium">
                    {pathway.closingNote}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-900">
                Suggested providers:{' '}
                <span className="font-semibold">
                  {(pathway.suggestedProviderTypeList || []).map(providerTypeLabel).join(', ') || '—'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

