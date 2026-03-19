import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export function CaseClosure() {
  const { token, claimant } = useClaimantAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closure, setClosure] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/case-closure`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load case closure');
        if (!cancelled) setClosure(data || null);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load case closure');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Case Closure Summary</h2>
            <p className="text-sm text-gray-600 mt-1">
              {claimant?.fullName ? `${claimant.fullName} · ` : ''}final case organization record
            </p>
          </div>
          <Link to="/portal/dashboard" className="text-sm font-semibold text-indigo-700 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-600">Loading closure summary…</p> : null}
      {error ? <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div> : null}

      {!loading && !error && closure ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900">Closure Narrative</h3>
            <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {closure.closureSummary || '—'}
            </div>
          </div>

          {Array.isArray(closure.keyHighlights) && closure.keyHighlights.length ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900">Key Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {closure.keyHighlights.map((x, idx) => (
                  <div key={`${x}-${idx}`} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-sm text-gray-800">{x}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {closure.financialSummary ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900">Financial Summary</h3>
              <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {closure.financialSummary}
              </div>
            </div>
          ) : null}

          {Array.isArray(closure.nextSteps) && closure.nextSteps.length ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900">Next Steps</h3>
              <ul className="list-disc ml-5 mt-3 text-sm text-gray-800 space-y-1">
                {closure.nextSteps.map((x, idx) => (
                  <li key={`${x}-${idx}`}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-indigo-900">Compliance Disclaimer</h3>
            <div className="mt-3 text-sm text-indigo-900/90 whitespace-pre-wrap leading-relaxed">
              {closure.complianceDisclaimer || ''}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

