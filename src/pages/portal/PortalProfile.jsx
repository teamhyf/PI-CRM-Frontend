import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';
import { useToast } from '../../context/ToastContext';
import { LoadingBlock } from '../../components/LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export function PortalProfile() {
  const { token, updateSession } = useClaimantAuth();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadError('');
      setLoading(true);
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load profile');
        if (cancelled) return;
        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/auth/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      updateSession({
        token: data.token,
        claimant: data.claimant,
      });
      success('Profile saved');
    } catch (err) {
      showError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    setPwdSaving(true);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not change password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      success('Password updated');
    } catch (err) {
      showError(err.message || 'Could not change password');
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return <LoadingBlock message="Loading profile…" className="py-16 rounded-2xl border border-slate-200 bg-white" />;
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {loadError}
        <div className="mt-4">
          <Link to="/portal/dashboard" className="font-semibold text-lime-900 hover:underline">
            ← Back to my cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-200/80 pb-8">
        <p className="text-xs font-bold text-lime-800 uppercase tracking-[0.15em]">Account</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">My profile</h1>
        <p className="mt-3 text-slate-600 max-w-2xl leading-relaxed">
          Update how we reach you and manage your portal password.
        </p>
      </header>

      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">Contact information</h2>
        <div className="grid gap-6 max-w-lg">
          <div>
            <label htmlFor="profile-fullname" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="profile-fullname"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-md shadow-lime-400/25 hover:bg-lime-300 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link to="/portal/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
        </div>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
          <p className="mt-1 text-sm text-slate-600">Use at least 8 characters for your new password.</p>
        </div>
        <div className="grid gap-6 max-w-lg">
          <div>
            <label htmlFor="pwd-current" className="block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              id="pwd-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
            />
          </div>
          <div>
            <label htmlFor="pwd-new" className="block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="pwd-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
            />
          </div>
          <div>
            <label htmlFor="pwd-confirm" className="block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              id="pwd-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pwdSaving || !currentPassword || !newPassword}
          className="inline-flex items-center rounded-full border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
        >
          {pwdSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
