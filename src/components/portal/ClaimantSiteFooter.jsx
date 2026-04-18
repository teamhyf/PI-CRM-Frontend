import { Link } from 'react-router-dom';

/**
 * Shared footer for claimant portal pages (legal disclaimer + home link).
 * @param {'dark' | 'light'} tone — dark matches Landing; light for minimal contrast on pale pages
 */
export function ClaimantSiteFooter({ tone = 'dark' }) {
  const year = new Date().getFullYear();

  if (tone === 'light') {
    return (
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-600 space-y-2">
          <p>
            This portal is a case management tool only. It does not provide legal advice or create an
            attorney-client relationship.
          </p>
          <p className="text-xs text-slate-500">
            © {year} PI CRM ·{' '}
            <Link to="/" className="text-indigo-600 hover:underline">
              Marketing home
            </Link>
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-500 space-y-2">
        <p>
          This portal is a case management tool only. It does not provide legal advice or create an
          attorney-client relationship.
        </p>
        <p className="text-xs text-slate-600">
          © {year} PI CRM — Case management tooling, not legal advice.{' '}
          <Link to="/" className="text-sky-400/90 hover:text-sky-300">
            Home
          </Link>
        </p>
      </div>
    </footer>
  );
}
