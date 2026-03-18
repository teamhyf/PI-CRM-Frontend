export function RedFlagBadge({ severity, count }) {
  const normalized = String(severity || '').toLowerCase();

  const labelBase =
    normalized === 'high' ? 'High' : normalized === 'medium' ? 'Medium' : normalized === 'low' ? 'Low' : '—';

  const label = typeof count === 'number' ? `${count} ${labelBase}` : labelBase;

  const className =
    normalized === 'high'
      ? 'bg-red-600 text-white font-semibold'
      : normalized === 'medium'
        ? 'bg-amber-200 text-amber-900 font-semibold'
        : normalized === 'low'
          ? 'bg-blue-600 text-white font-semibold'
          : 'bg-gray-200 text-gray-700 font-medium';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${className}`}>
      {label}
    </span>
  );
}

