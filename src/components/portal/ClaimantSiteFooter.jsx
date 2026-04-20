import { Link } from 'react-router-dom';

/**
 * Marketing site footer — same layout as the home page.
 * Background: #174049
 *
 * @param {boolean} [staffAuthenticated] — when true, show “Staff dashboard”; otherwise “Staff login”
 */
export function ClaimantSiteFooter({ staffAuthenticated = false }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black/10 bg-[#174049]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-14">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10 text-center sm:text-left">
          <div>
            <p className="text-lg font-bold text-white">PI CRM</p>
            <p className="mt-2 text-sm text-slate-400 max-w-xs leading-relaxed">
              Case management tooling—not legal advice.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-4 text-sm">
            <p className="text-slate-400">© {year} AI Personal Injury CRM</p>
            <p className="flex flex-wrap justify-center sm:justify-end items-center gap-x-4 gap-y-2 text-slate-300">
              <Link to="/provider-portal/login" className="hover:text-white transition-colors">
                Provider portal
              </Link>
              <span className="opacity-30 select-none text-slate-500" aria-hidden>
                |
              </span>
              {staffAuthenticated ? (
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Staff dashboard
                </Link>
              ) : (
                <Link to="/login" className="hover:text-white transition-colors">
                  Staff login
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
