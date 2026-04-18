import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';
import { AISparklesIcon, AIBadge } from '../../components/AIIcon';
import { ClaimantSiteHeader } from '../../components/portal/ClaimantSiteHeader';
import { ClaimantSiteFooter } from '../../components/portal/ClaimantSiteFooter';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function PortalLogin() {
  const navigate = useNavigate();
  const { login, loading } = useClaimantAuth();
  const [error, setError] = useState('');

  const [setupOpen, setSetupOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [setupBusy, setSetupBusy] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const setupEmail = useWatch({ control, name: 'email' });

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data.email.trim(), data.password);
      navigate('/portal/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');
    setSetupBusy(true);
    try {
      const emailVal = String(setupEmail || '').trim();
      if (!emailVal) {
        setSetupError('Enter your email in the form above first.');
        setSetupBusy(false);
        return;
      }
      if (!tempPassword.trim() || newPassword.length < 8) {
        setSetupError('Temp password and a new password (8+ characters) are required.');
        setSetupBusy(false);
        return;
      }
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailVal,
          tempPassword: tempPassword.trim(),
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to set password');
      setTempPassword('');
      setNewPassword('');
      setSetupSuccess('Password set! You can now sign in with your new password.');
    } catch (err) {
      setSetupError(err.message || 'Failed to set password');
    } finally {
      setSetupBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ClaimantSiteHeader variant="public" />

      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-600 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <AIBadge size="md" className="self-start mt-1" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              User Login
            </h1>
            <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
              Sign in to view your case status, documents, and treatment information.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              ) : null}

              <div>
                <label htmlFor="portal-email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  id="portal-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="input-field"
                  {...register('email')}
                />
                {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
              </div>

              <div>
                <label htmlFor="portal-password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="portal-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-field"
                  {...register('password')}
                />
                {errors.password ? (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="ml-2 text-sm text-slate-600">Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-sm text-indigo-600 hover:text-indigo-700 shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  title="Contact your attorney if you need help accessing the portal"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                type="button"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                onClick={() => setSetupOpen((v) => !v)}
              >
                <AISparklesIcon className="w-4 h-4 text-indigo-500" />
                {setupOpen ? 'Hide first-time setup' : 'First time here? Set your password'}
              </button>

              {setupOpen ? (
                <form onSubmit={handleSetPassword} className="mt-4 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Use the temporary password from your attorney, then choose a new password (min. 8 characters).
                  </p>
                  {setupError ? (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="text-sm font-medium text-red-800">{setupError}</p>
                    </div>
                  ) : null}
                  {setupSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-sm font-medium text-emerald-900">{setupSuccess}</p>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Temp password (from staff)
                    </label>
                    <input
                      className="input-field"
                      type="text"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Paste temp password"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">New password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 rounded-xl"
                    disabled={setupBusy}
                  >
                    {setupBusy ? 'Saving…' : 'Set password'}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <ClaimantSiteFooter tone="light" />
    </div>
  );
}
