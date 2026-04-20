import { Link, useLocation } from 'react-router-dom';
import { AIBadge } from '../AIIcon';

/**
 * Shared marketing-style header for claimant-facing pages (website chrome, not admin).
 * @param {'public' | 'authenticated'} variant
 * @param {string} [email] — used for accessible label when authenticated
 * @param {() => void} [onLogout]
 */
export function ClaimantSiteHeader({ variant = 'public', email, onLogout }) {
  const location = useLocation();
  const path = location.pathname;

  const linkClass = (active) =>
    `text-sm transition-colors ${
      active ? 'text-white font-medium' : 'text-slate-400 hover:text-white'
    }`;

  const isCasesArea =
    path.startsWith('/portal/dashboard') ||
    path.startsWith('/portal/case') ||
    path.startsWith('/portal/case-closure');
  const isProfile = path.startsWith('/portal/profile');

  const menuLinkClass = (active) =>
    `block w-full px-4 py-2.5 text-left text-sm transition-colors ${
      active
        ? 'bg-white/10 text-white font-medium'
        : 'text-slate-200 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 min-h-16 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            PI CRM
          </span>
          <AIBadge size="sm" />
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
          <Link to="/" className={linkClass(path === '/')}>
            Home
          </Link>
          <a href="/#features" className={linkClass(false)}>
            Features
          </a>
          <Link
            to={{ pathname: '/', search: '?intake=open' }}
            className={linkClass(path === '/' && new URLSearchParams(location.search).get('intake') === 'open')}
          >
            AI intake
          </Link>

          {variant === 'authenticated' && onLogout ? (
            <div className="relative pl-1 group/menu">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/80"
                aria-label={email ? `Account menu (${email})` : 'Account menu'}
                aria-haspopup="true"
                aria-expanded="false"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </button>

              {/* pt-2 bridge keeps hover path from button to menu */}
              <div
                className="pointer-events-none absolute right-0 top-full z-50 pt-2 opacity-0 invisible transition-[opacity,visibility] duration-150 group-hover/menu:pointer-events-auto group-hover/menu:visible group-hover/menu:opacity-100 group-focus-within/menu:pointer-events-auto group-focus-within/menu:visible group-focus-within/menu:opacity-100"
                role="presentation"
              >
                <div
                  className="min-w-[12rem] overflow-hidden rounded-xl border border-white/10 bg-slate-900 py-1 shadow-2xl"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <Link
                    to="/portal/dashboard"
                    role="menuitem"
                    className={menuLinkClass(isCasesArea)}
                  >
                    My Cases
                  </Link>
                  <Link to="/portal/profile" role="menuitem" className={menuLinkClass(isProfile)}>
                    My Profile
                  </Link>
                  <div className="my-1 border-t border-white/10" role="separator" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onLogout}
                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-red-500/15 hover:text-red-100"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          ) : variant === 'public' ? (
            <Link to="/portal/login" className={linkClass(path.startsWith('/portal/login'))}>
              Login
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
