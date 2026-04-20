import { Link, useLocation } from 'react-router-dom';
import { AIBadge } from '../AIIcon';

/**
 * Shared marketing-style header for claimant-facing pages (website chrome, not admin).
 * Layout: logo left · Home / Features / AI intake centered · Login or account menu right.
 *
 * @param {'public' | 'authenticated'} variant
 * @param {'dark' | 'light'} [tone] — light = marketing / landing (default dark = portal shell)
 * @param {string} [email] — used for accessible label when authenticated
 * @param {() => void} [onLogout]
 */
export function ClaimantSiteHeader({ variant = 'public', tone = 'dark', email, onLogout }) {
  const location = useLocation();
  const path = location.pathname;
  const isLight = tone === 'light';

  const linkClass = (active) => {
    if (isLight) {
      return active
        ? 'text-sm font-semibold text-slate-900'
        : 'text-sm text-slate-600 hover:text-slate-900 transition-colors';
    }
    return `text-sm transition-colors ${
      active ? 'text-white font-medium' : 'text-slate-400 hover:text-white'
    }`;
  };

  const isCasesArea =
    path.startsWith('/portal/dashboard') ||
    path.startsWith('/portal/case') ||
    path.startsWith('/portal/case-closure');
  const isProfile = path.startsWith('/portal/profile');

  const menuLinkClass = (active) => {
    if (isLight) {
      return `block w-full px-4 py-2.5 text-left text-sm transition-colors ${
        active
          ? 'bg-lime-50 text-slate-900 font-medium'
          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
      }`;
    }
    return `block w-full px-4 py-2.5 text-left text-sm transition-colors ${
      active
        ? 'bg-white/10 text-white font-medium'
        : 'text-slate-200 hover:bg-white/5 hover:text-white'
    }`;
  };

  const headerShell = isLight
    ? 'border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-[0_1px_0_rgba(15,23,42,0.04)]'
    : 'border-b border-white/10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40';

  const logoClass = isLight
    ? 'text-xl font-bold text-slate-900 tracking-tight'
    : 'text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent';

  const userBtnClass = isLight
    ? 'flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-400/80'
    : 'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/80';

  const dropdownClass = isLight
    ? 'min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10'
    : 'min-w-[12rem] overflow-hidden rounded-xl border border-white/10 bg-slate-900 py-1 shadow-2xl';

  const sepClass = isLight ? 'my-1 border-t border-slate-100' : 'my-1 border-t border-white/10';

  const logoutBtnClass = isLight
    ? 'block w-full px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50'
    : 'block w-full px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-red-500/15 hover:text-red-100';

  const loginIsActive = path.startsWith('/portal/login');

  const centerNav = (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1 text-sm"
      aria-label="Primary navigation"
    >
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
    </nav>
  );

  const rightSlot =
    variant === 'authenticated' && onLogout ? (
      <div className="relative flex justify-end group/menu">
        <button
          type="button"
          className={userBtnClass}
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

        <div
          className="pointer-events-none absolute right-0 top-full z-50 pt-2 opacity-0 invisible transition-[opacity,visibility] duration-150 group-hover/menu:pointer-events-auto group-hover/menu:visible group-hover/menu:opacity-100 group-focus-within/menu:pointer-events-auto group-focus-within/menu:visible group-focus-within/menu:opacity-100"
          role="presentation"
        >
          <div className={dropdownClass} role="menu" aria-orientation="vertical">
            <Link to="/portal/dashboard" role="menuitem" className={menuLinkClass(isCasesArea)}>
              My Cases
            </Link>
            <Link to="/portal/profile" role="menuitem" className={menuLinkClass(isProfile)}>
              My Profile
            </Link>
            <div className={sepClass} role="separator" />
            <button type="button" role="menuitem" onClick={onLogout} className={logoutBtnClass}>
              Log out
            </button>
          </div>
        </div>
      </div>
    ) : variant === 'public' ? (
      <Link
        to="/portal/login"
        className={
          isLight
            ? `inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition shrink-0 ${
                loginIsActive
                  ? 'bg-lime-400 text-slate-900 ring-2 ring-lime-500/30'
                  : 'bg-lime-400 text-slate-900 hover:bg-lime-300'
              }`
            : linkClass(loginIsActive)
        }
      >
        Login
      </Link>
    ) : null;

  return (
    <header className={headerShell}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4 min-h-16 py-3">
        <div className="flex justify-start min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className={logoClass}>PI CRM</span>
            <AIBadge size="sm" />
          </Link>
        </div>

        <div className="flex justify-center min-w-0">{centerNav}</div>

        <div className="flex justify-end items-center gap-2 sm:gap-3 min-w-0">{rightSlot}</div>
      </div>
    </header>
  );
}
