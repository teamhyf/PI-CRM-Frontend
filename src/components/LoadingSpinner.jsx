/**
 * Shared loading UI: spinner + layout helpers. Prefer these over raw "Loading…" text.
 */

const SIZE_CLASSES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-11 w-11 border-[3px]',
};

/**
 * Accessible spinning indicator (no text).
 */
export function Spinner({ size = 'md', className = '' }) {
  const dim = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  return (
    <span
      className={`inline-block rounded-full border-gray-200 border-t-blue-600 animate-spin ${dim} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Full-viewport centered load (auth gate, route guards).
 */
export function LoadingScreen({ message }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size="lg" />
      {message ? <p className="text-sm font-medium text-gray-600">{message}</p> : null}
    </div>
  );
}

/**
 * Centered block for page sections or modals (optional min height).
 */
export function LoadingBlock({
  message,
  size = 'md',
  className = '',
  minHeight = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${minHeight ? 'min-h-[40vh]' : 'py-10'} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={size} />
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
    </div>
  );
}

/**
 * Horizontal row: spinner + label (subsections, cards).
 */
export function LoadingInline({ message, size = 'sm', className = '' }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={size} />
      {message ? <span className="text-sm text-gray-600">{message}</span> : null}
    </div>
  );
}

/**
 * Table body row with centered spinner (list pages).
 */
export function TableLoadingRow({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12">
        <div
          className="flex flex-col items-center justify-center gap-3"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner size="md" />
          {message ? <span className="text-sm text-gray-600">{message}</span> : null}
        </div>
      </td>
    </tr>
  );
}
