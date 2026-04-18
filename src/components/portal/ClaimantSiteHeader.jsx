import { Link, useLocation } from 'react-router-dom';
import { AIBadge } from '../AIIcon';

/**
 * Shared marketing-style header for claimant portal (login + authenticated).
 * @param {'public' | 'authenticated'} variant
 * @param {string} [email] — shown when authenticated
 * @param {() => void} [onLogout]
 */
export function ClaimantSiteHeader({ variant = 'public', email, onLogout }) {
  const location = useLocation();
  const path = location.pathname;

  const linkClass = (active) =>
    `text-sm transition-colors ${
      active ? 'text-white font-medium' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 min-h-16 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            PI CRM
          </span>
          <AIBadge size="sm" />
          <span className="hidden sm:inline text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Claimant
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
          <Link to="/" className={linkClass(path === '/')}>
            Home
          </Link>
          <a href="/#features" className={linkClass(false)}>
            Features
          </a>

          {variant === 'authenticated' ? (
            <>
              <Link
                to="/portal/dashboard"
                className={linkClass(path.startsWith('/portal/dashboard'))}
              >
                My cases
              </Link>
            </>
          ) : (
            <Link
              to="/portal/login"
              className={linkClass(path.startsWith('/portal/login'))}
            >
              Claimant portal
            </Link>
          )}

          <Link
            to="/provider-portal/login"
            className={linkClass(path.startsWith('/provider-portal'))}
          >
            Provider portal
          </Link>
          <Link to="/login" className={linkClass(path === '/login')}>
            Staff login
          </Link>

          {variant === 'authenticated' && email ? (
            <span className="hidden sm:inline text-slate-500 text-xs max-w-[12rem] truncate" title={email}>
              {email}
            </span>
          ) : null}

          {variant === 'authenticated' && onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-sm font-semibold text-white border border-white/10"
            >
              Log out
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
