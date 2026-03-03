/**
 * AI Icon Component
 * Reusable AI-themed icons to indicate AI-powered features
 */

/** Sparkles icon - common AI/assistant visual */
export function AISparklesIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

/** AI badge pill - "AI" text in a gradient pill */
export function AIBadge({ size = "sm", className = "" }) {
  const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0.5" : size === "md" ? "text-xs px-2 py-1" : "text-sm px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center font-bold rounded-md bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm ${sizeClasses} ${className}`}
      title="AI-Powered"
    >
      AI
    </span>
  );
}

/** Combined icon + badge for headers */
export function AIBrandBadge({ showLabel = false, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
        <AISparklesIcon className="w-4 h-4" />
      </span>
      {showLabel && (
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Powered by AI</span>
      )}
    </div>
  );
}
