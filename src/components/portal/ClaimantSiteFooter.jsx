import { Link } from 'react-router-dom';

function PortalFooterLinks({ linkClassName }) {
  return (
    <p className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-sm">
      <Link to="/provider-portal/login" className={`${linkClassName} hover:underline`}>
        Provider portal
      </Link>
      <span className="opacity-40 select-none" aria-hidden>
        |
      </span>
      <Link to="/login" className={`${linkClassName} hover:underline`}>
        Staff login
      </Link>
    </p>
  );
}

/**
 * Shared footer for claimant portal pages (legal disclaimer + secondary portal links).
 * @param {'dark' | 'light'} tone — dark matches Landing; light for minimal contrast on pale pages
 */
export function ClaimantSiteFooter({ tone = 'dark' }) {
  const year = new Date().getFullYear();

  if (tone === 'light') {
    return (
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-600 space-y-4">
          <p>
            This portal is a case management tool only. It does not provide legal advice or create an
            attorney-client relationship.
          </p>
          <PortalFooterLinks linkClassName="text-slate-600" />
          <p className="text-xs text-slate-500">
            © {year} PI CRM ·{' '}
            <Link to="/" className="text-indigo-600 hover:underline">
              Website home
            </Link>
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-500 space-y-4">
        <p>
          This portal is a case management tool only. It does not provide legal advice or create an
          attorney-client relationship.
        </p>
        <PortalFooterLinks linkClassName="text-slate-400 hover:text-slate-200" />
        <p className="text-xs text-slate-600">
          © {year} PI CRM — Case management tooling, not legal advice.{' '}
          <Link to="/" className="text-sky-400/90 hover:text-sky-300">
            Website home
          </Link>
        </p>
      </div>
    </footer>
  );
}
