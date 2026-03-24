import { Link } from 'react-router-dom';

/**
 * Link to public landing page (/) — use on login screens.
 */
export function BackToHomeLink({ className = '' }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors ${className}`}
    >
      <span aria-hidden>←</span>
      Back to home
    </Link>
  );
}
