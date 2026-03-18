import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    // Mark as exiting for animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 350);
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, type, title, message, exiting: false }]);
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback((message, title = 'Success') => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((message, title = 'Error')   => toast({ type: 'error',   title, message, duration: 6000 }), [toast]);
  const warning = useCallback((message, title = 'Warning') => toast({ type: 'warning', title, message }), [toast]);
  const info    = useCallback((message, title = 'Info')    => toast({ type: 'info',    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconSuccess() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}
function IconError() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

const STYLES = {
  success: { bar: 'bg-green-500',  icon: 'text-green-500',  bg: 'bg-white', iconEl: <IconSuccess /> },
  error:   { bar: 'bg-red-500',    icon: 'text-red-500',    bg: 'bg-white', iconEl: <IconError />   },
  warning: { bar: 'bg-yellow-500', icon: 'text-yellow-500', bg: 'bg-white', iconEl: <IconWarning /> },
  info:    { bar: 'bg-blue-500',   icon: 'text-blue-500',   bg: 'bg-white', iconEl: <IconInfo />    },
};

function ToastItem({ toast, dismiss }) {
  const s = STYLES[toast.type] || STYLES.info;

  return (
    <div
      className={`
        flex items-start gap-3 w-80 rounded-xl shadow-xl border border-gray-100
        ${s.bg} overflow-hidden pointer-events-auto
        transition-all duration-350 ease-in-out
        ${toast.exiting
          ? 'opacity-0 translate-x-10'
          : 'opacity-100 translate-x-0'}
      `}
    >
      {/* Accent bar */}
      <div className={`w-1 self-stretch flex-shrink-0 ${s.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className={`mt-3.5 flex-shrink-0 ${s.icon}`}>{s.iconEl}</div>

      {/* Text */}
      <div className="flex-1 py-3 pr-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-800 leading-tight">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-sm text-gray-500 mt-0.5 break-words">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => dismiss(toast.id)}
        className="mt-2.5 mr-2.5 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}
