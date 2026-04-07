import { Link, Outlet, useLocation } from 'react-router-dom';
import { useClaimantAuth } from '../context/ClaimantAuthContext';

export function PortalLayout() {
  const { claimant, logout } = useClaimantAuth();
  const location = useLocation();
  const onCaseDetail = /^\/portal\/case\/\d+/.test(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              My Case
              <span className="ml-2 align-middle inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                Claimant Portal
              </span>
            </h1>
            <p className="text-sm text-gray-600">Track your case, treatment, and documents.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {onCaseDetail ? (
              <span className="text-sm text-gray-600">Viewing case details</span>
            ) : null}
            <span className="hidden sm:inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700">
              {claimant?.email || ''}
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 self-start sm:self-auto"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <nav className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4">
        <div className="flex gap-3">
          <Link
            to="/portal/dashboard"
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50 shadow-sm"
          >
            My cases
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-10">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-gray-200 py-4 text-center bg-white/60 backdrop-blur">
        <p className="text-xs text-gray-500 max-w-2xl mx-auto px-4">
          This portal is a case management tool only. It does not provide legal advice or create an attorney-client
          relationship.
        </p>
      </footer>
    </div>
  );
}
