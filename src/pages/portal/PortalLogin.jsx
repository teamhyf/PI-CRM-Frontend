import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export function PortalLogin() {
  const navigate = useNavigate();
  const { login, loading } = useClaimantAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [setupOpen, setSetupOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [setupBusy, setSetupBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email.trim(), password);
      navigate('/portal/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');
    setSetupBusy(true);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b bg-gray-50">
          <h1 className="text-xl font-bold text-gray-900">Claimant Portal Login</h1>
          <p className="text-sm text-gray-600 mt-1">Access your case status.</p>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                className="input-field w-full"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                className="input-field w-full"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full py-2.5 text-sm" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              className="text-sm font-semibold text-indigo-700 hover:underline"
              onClick={() => setSetupOpen((v) => !v)}
            >
              First time here? Set your password
            </button>

            {setupOpen ? (
              <form onSubmit={handleSetPassword} className="mt-3 space-y-3">
                {setupError ? (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                    {setupError}
                  </div>
                ) : null}
                {setupSuccess ? (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                    {setupSuccess}
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Temp password (from staff)</label>
                  <input
                    className="input-field w-full"
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New password</label>
                  <input
                    className="input-field w-full"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <button className="btn-primary w-full py-2.5 text-sm" disabled={setupBusy}>
                  {setupBusy ? 'Saving…' : 'Set password'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

