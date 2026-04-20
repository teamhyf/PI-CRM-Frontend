import { Link } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';
import { LoadingBlock } from '../../components/LoadingSpinner';

function formatISODate(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

function statusLabel(status) {
  if (!status) return '—';
  return String(status).replace(/_/g, ' ');
}

export function PortalDashboard() {
  const { claimant, cases, loading } = useClaimantAuth();

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-200/80 pb-8">
        <p className="text-xs font-bold text-lime-800 uppercase tracking-[0.15em]">Your account</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">My cases</h1>
        <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed">
          {claimant?.fullName ? (
            <>
              Signed in as <span className="font-medium text-slate-800">{claimant.fullName}</span>
              {claimant?.email ? (
                <>
                  {' '}
                  <span className="text-slate-400">·</span> {claimant.email}
                </>
              ) : null}
              .{' '}
            </>
          ) : null}
          Open a case below to see status, treatment routing, documents, and more.
        </p>
      </header>

      <section aria-labelledby="case-list-heading">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
          <h2 id="case-list-heading" className="text-lg font-semibold text-slate-900">
            {cases.length === 0
              ? 'No cases yet'
              : cases.length === 1
                ? '1 case on file'
                : `${cases.length} cases on file`}
          </h2>
        </div>

        {loading ? (
          <LoadingBlock message="Loading your cases…" className="py-16 rounded-2xl border border-slate-200 bg-white" />
        ) : cases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              No cases found for this account. If you believe this is an error, contact your attorney.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {cases.map((c) => (
              <li key={c.claimantId}>
                <article className="group h-full rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-lime-200/80">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">#{c.caseId}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-50 text-emerald-900 border border-emerald-100 px-3 py-1 text-xs font-semibold capitalize">
                      {statusLabel(c.status)}
                    </span>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 shrink-0">Accident type</dt>
                      <dd className="text-slate-800 text-right font-medium">
                        {c.accidentType ? String(c.accidentType).replace(/_/g, ' ') : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 shrink-0">Date of loss</dt>
                      <dd className="text-slate-800 text-right">{formatISODate(c.dateOfLoss)}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <Link
                      to={`/portal/case/${c.claimantId}`}
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-lime-400 px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-md shadow-lime-400/25 hover:bg-lime-300 transition-colors"
                    >
                      View case
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
