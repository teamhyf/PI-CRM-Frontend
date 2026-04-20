import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';
import { LoadingInline } from '../../components/LoadingSpinner';

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
    <div className="space-y-10">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-xs font-bold text-lime-800 uppercase tracking-[0.15em]">Case closure</p>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Closure summary</h1>
            <p className="mt-2 text-slate-600 max-w-2xl leading-relaxed">
              {claimant?.fullName ? (
                <>
                  Record for <span className="font-medium text-slate-800">{claimant.fullName}</span>.
                </>
              ) : (
                'Final organization record for your matter.'
              )}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {claimant?.id ? (
              <Link
                to={`/portal/case/${claimant.id}`}
                className="text-sm font-semibold text-lime-800 hover:text-lime-950"
              >
                ← Back to case
              </Link>
            ) : null}
            <Link to="/portal/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              My cases
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <LoadingInline message="Loading closure summary…" />
        </div>
      ) : null}
      {error ? (
        <div className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl p-4">{error}</div>
      ) : null}

      {!loading && !error && closure ? (
        <div className="space-y-8 max-w-3xl">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Closure narrative</h2>
            <div className="mt-4 text-slate-700 whitespace-pre-wrap leading-relaxed">
              {closure.closureSummary || '—'}
            </div>
          </section>

          {Array.isArray(closure.keyHighlights) && closure.keyHighlights.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Key highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {closure.keyHighlights.map((x, idx) => (
                  <div key={`${x}-${idx}`} className="border border-slate-100 rounded-xl p-4 bg-slate-50/80">
                    <p className="text-sm text-slate-800 leading-relaxed">{x}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {closure.financialSummary ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Financial summary</h2>
              <div className="mt-4 text-slate-700 whitespace-pre-wrap leading-relaxed">{closure.financialSummary}</div>
            </section>
          ) : null}

          {Array.isArray(closure.nextSteps) && closure.nextSteps.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Next steps</h2>
              <ul className="list-disc ml-5 mt-4 text-slate-700 space-y-2 leading-relaxed">
                {closure.nextSteps.map((x, idx) => (
                  <li key={`${x}-${idx}`}>{x}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-lime-200/80 bg-lime-50/90 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Compliance disclaimer</h2>
            <div className="mt-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {closure.complianceDisclaimer || ''}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
