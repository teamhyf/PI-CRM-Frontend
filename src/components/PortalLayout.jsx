import { Link, Outlet } from 'react-router-dom';
import { useClaimantAuth } from '../context/ClaimantAuthContext';

export function PortalLayout() {
  const { claimant, cases, logout, switchCase, loading } = useClaimantAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">My Case</h1>
            <p className="text-sm text-gray-600">Case Status Portal</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {cases.length > 1 ? (
              <label className="flex flex-col gap-0.5 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Active case</span>
                <select
                  className="input-field text-sm min-w-[220px]"
                  value={claimant?.id ?? ''}
                  disabled={loading}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v && v !== claimant?.id) {
                      switchCase(v).catch(() => {
                        /* toast optional */
                      });
                    }
                  }}
                >
                  {cases.map((c) => (
                    <option key={c.claimantId} value={c.claimantId}>
                      Case #{c.caseId}
                      {c.status ? ` — ${String(c.status).replace(/_/g, ' ')}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : cases.length === 1 ? (
              <span className="text-sm text-gray-700">
                Case #{cases[0].caseId}
                {cases[0].status ? (
                  <span className="text-gray-500"> · {String(cases[0].status).replace(/_/g, ' ')}</span>
                ) : null}
              </span>
            ) : null}
            <span className="text-sm text-gray-600 hidden sm:inline">{claimant?.email || ''}</span>
            <button type="button" onClick={logout} className="btn-primary text-sm px-4 py-2 self-start sm:self-auto">
              Log out
            </button>
          </div>
        </div>
      </header>

      <nav className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4">
        <div className="flex gap-3">
          <Link to="/portal/dashboard" className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-10">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-gray-200 py-4 text-center bg-white/60">
        <p className="text-xs text-gray-500 max-w-2xl mx-auto px-4">
          This portal is a case management tool only. It does not provide legal advice or create an attorney-client relationship.
        </p>
      </footer>
    </div>
  );
}

