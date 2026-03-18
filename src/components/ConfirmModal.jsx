import { useEffect, useRef } from 'react';

/**
 * ConfirmModal — replaces window.confirm with a styled dialog.
 *
 * Props:
 *   open         boolean   — whether to show
 *   title        string    — bold heading
 *   message      string    — body text (supports \n)
 *   confirmLabel string    — confirm button text  (default "Confirm")
 *   cancelLabel  string    — cancel button text   (default "Cancel")
 *   variant      "danger" | "warning" | "info"    (default "danger")
 *   onConfirm    () => void
 *   onCancel     () => void
 */
export function ConfirmModal({
  open,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  // Focus the cancel button when opened (safer default)
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => confirmBtnRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Keyboard: Escape → cancel
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const variantStyles = {
    danger:  { btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',    icon: 'bg-red-100 text-red-600' },
    warning: { btn: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400', icon: 'bg-yellow-100 text-yellow-600' },
    info:    { btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',  icon: 'bg-blue-100 text-blue-600' },
  };
  const vs = variantStyles[variant] || variantStyles.danger;

  const lines = message.split('\n').filter(Boolean);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in">
        {/* Top accent stripe */}
        <div className={`h-1 w-full ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-yellow-400' : 'bg-blue-500'}`} />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 rounded-full p-2.5 ${vs.icon}`}>
              {variant === 'danger' ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ) : variant === 'warning' ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h3 id="confirm-modal-title" className="text-lg font-semibold text-gray-900 leading-snug">
                {title}
              </h3>
            </div>
          </div>

          {/* Message */}
          {lines.length > 0 && (
            <div className="ml-[3.5rem] mb-6 space-y-1.5">
              {lines.map((line, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${vs.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
