import { Link, Outlet, useLocation } from 'react-router-dom';
import { useProviderAuth } from '../context/ProviderAuthContext';

export function ProviderPortalLayout() {
  const { provider, logout } = useProviderAuth();
  const location = useLocation();
  const onCaseDetail = /^\/provider-portal\/case\/\d+/.test(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Provider Portal</h1>
            <p className="text-sm text-gray-600">Assigned cases &amp; document uploads</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {onCaseDetail ? (
              <span className="text-sm text-gray-700">Viewing case</span>
            ) : null}
            <span className="text-sm text-gray-600 hidden sm:inline">{provider?.email || ''}</span>
            <button type="button" onClick={logout} className="btn-primary text-sm px-4 py-2 self-start sm:self-auto">
              Log out
            </button>
          </div>
        </div>
      </header>

      <nav className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4">
        <div className="flex gap-3">
          <Link
            to="/provider-portal/dashboard"
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Assigned cases
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-10">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-gray-200 py-4 text-center bg-white/60">
        <p className="text-xs text-gray-500 max-w-2xl mx-auto px-4">
          This portal is for secure exchange of case-related documents. It does not provide legal advice.
        </p>
      </footer>
    </div>
  );
}
