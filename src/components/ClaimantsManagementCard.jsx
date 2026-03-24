import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TableLoadingRow } from './LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const formatDate = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleDateString();
};

const actionIconBtn =
  'inline-flex items-center justify-center rounded-lg p-2 border border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent';

function IconKey({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function IconPencil({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function IconTrash({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function IconSpinner({ className = 'w-5 h-5' }) {
  return (
    <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function generateRandomPortalPassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export default function ClaimantsManagementCard() {
  const { token, user } = useAuth();

  const [claimants, setClaimants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loadError, setLoadError] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    is_active: true,
  });
  const [editSaving, setEditSaving] = useState(false);

  const [portalTarget, setPortalTarget] = useState(null);
  const [portalForm, setPortalForm] = useState({ email: '', password: '' });
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalModalShowPassword, setPortalModalShowPassword] = useState(false);
  const [portalRegeneratedPassword, setPortalRegeneratedPassword] = useState(null);
  const [portalCopiedRegenerated, setPortalCopiedRegenerated] = useState(false);
  /** After first activation with server-generated temp password */
  const [portalTempPassword, setPortalTempPassword] = useState(null);
  const [portalSyncedMessage, setPortalSyncedMessage] = useState(null);

  const canRender = useMemo(() => user?.role === 'admin', [user]);

  const fetchClaimants = async () => {
    const base = getBaseUrl();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${base}/api/claimants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await res.text().catch(() => '');
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (!res.ok) {
        throw new Error(data?.error || raw || `Failed to load claimants (HTTP ${res.status})`);
      }
      const list = Array.isArray(data?.claimants) ? data.claimants : [];
      setClaimants(list);
      return list;
    } catch (err) {
      setError(err.message || 'Failed to load claimants');
      setClaimants([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const portalAlreadyActive = (c) => Boolean(c?.portal_activated_at);

  const openPortalModal = (c, e) => {
    if (e) e.stopPropagation();
    setLoadError('');
    setPortalRegeneratedPassword(null);
    setPortalCopiedRegenerated(false);
    setPortalTempPassword(null);
    setPortalSyncedMessage(null);
    setPortalModalShowPassword(false);
    setPortalTarget(c);
    setPortalForm({
      email: String(c.email || '').trim(),
      password: '',
    });
  };

  const openEdit = (c, e) => {
    if (e) e.stopPropagation();
    setLoadError('');
    setEditId(c.id);
    setEditForm({
      first_name: c.first_name || '',
      last_name: c.last_name || '',
      phone: c.phone || '',
      email: c.email || '',
      is_active: Boolean(c.is_active),
    });
    setEditorOpen(true);
  };

  const submitEdit = async () => {
    if (editId == null) return;
    const base = getBaseUrl();
    setEditSaving(true);
    setLoadError('');
    try {
      const payload = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim(),
        is_active: Boolean(editForm.is_active),
      };
      const res = await fetch(`${base}/api/claimants/${editId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save claimant');
      setEditorOpen(false);
      setEditId(null);
      await fetchClaimants();
    } catch (err) {
      setLoadError(err.message || 'Failed to save claimant');
    } finally {
      setEditSaving(false);
    }
  };

  const regenerateAndSavePortalPassword = async () => {
    if (!portalTarget) return;
    const id = Number(portalTarget.id);
    const base = getBaseUrl();
    const email = String(portalForm.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoadError('Enter a valid portal email first.');
      return;
    }
    const newPassword = generateRandomPortalPassword(16);
    setPortalBusy(true);
    setLoadError('');
    setPortalRegeneratedPassword(null);
    setPortalCopiedRegenerated(false);
    setPortalTempPassword(null);
    setPortalSyncedMessage(null);
    try {
      const res = await fetch(`${base}/api/claimants/${id}/activate-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update portal password');
      if (data.syncedFromExistingPortal && data.message) {
        setPortalSyncedMessage(data.message);
        setPortalRegeneratedPassword(null);
      } else {
        setPortalRegeneratedPassword(newPassword);
        setPortalForm((prev) => ({ ...prev, password: newPassword }));
        setPortalModalShowPassword(true);
      }
      const list = await fetchClaimants();
      if (portalTarget) {
        const refreshed = list.find((row) => Number(row.id) === Number(portalTarget.id));
        if (refreshed) {
          setPortalTarget(refreshed);
          setPortalForm((prev) => ({ ...prev, email: String(refreshed.email || '').trim() }));
        }
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to regenerate password');
    } finally {
      setPortalBusy(false);
    }
  };

  const submitPortalActivate = async () => {
    if (!portalTarget) return;
    const id = Number(portalTarget.id);
    const base = getBaseUrl();
    const email = String(portalForm.email || '').trim().toLowerCase();
    const password = portalForm.password;
    const already = portalAlreadyActive(portalTarget);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoadError('Enter a valid portal email.');
      return;
    }

    if (!already) {
      if (password && password.length > 0 && password.length < 8) {
        setLoadError('Password must be at least 8 characters, or leave blank for a generated temporary password.');
        return;
      }
    } else if (password && password.length > 0 && password.length < 8) {
      setLoadError('New password must be at least 8 characters, or leave blank to keep the current password.');
      return;
    }

    setPortalBusy(true);
    setLoadError('');
    setPortalTempPassword(null);
    setPortalSyncedMessage(null);
    try {
      const body = { email };
      if (!already) {
        if (password && password.length >= 8) body.password = password;
      } else if (password && password.length >= 8) {
        body.password = password;
      }

      const res = await fetch(`${base}/api/claimants/${id}/activate-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save portal');

      if (data.syncedFromExistingPortal && data.message) {
        setPortalSyncedMessage(data.message);
        setPortalRegeneratedPassword(null);
        setPortalTempPassword(null);
      } else if (data.tempPassword) {
        setPortalTempPassword(data.tempPassword);
        setPortalRegeneratedPassword(null);
        setPortalSyncedMessage(null);
      } else {
        setPortalRegeneratedPassword(null);
        setPortalTempPassword(null);
        setPortalSyncedMessage(null);
      }

      const list = await fetchClaimants();

      const showCopyUi = Boolean(data.syncedFromExistingPortal && data.message) || Boolean(data.tempPassword);
      if (showCopyUi && portalTarget) {
        const refreshed = list.find((row) => Number(row.id) === Number(portalTarget.id));
        if (refreshed) {
          setPortalTarget(refreshed);
          setPortalForm((prev) => ({ ...prev, email: String(refreshed.email || '').trim() }));
        }
      }
      if (!showCopyUi) {
        setPortalTarget(null);
        setPortalForm({ email: '', password: '' });
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to save portal');
    } finally {
      setPortalBusy(false);
    }
  };

  if (!canRender) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Claimant directory</h2>
            <p className="text-sm text-gray-600 mt-0.5">Portal activation and claimant record status</p>
          </div>
          <div className="text-sm text-gray-600">{claimants.length} claimants</div>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border-b border-red-100 px-6 py-3">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <TableLoadingRow colSpan={6} message="Loading claimants…" />
              ) : claimants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-600">
                    No claimants found.
                  </td>
                </tr>
              ) : (
                claimants.map((c) => {
                  const displayName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || '—';
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openEdit(c)}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">{displayName}</td>
                      <td className="px-6 py-4 text-gray-700">
                        <span className="font-medium">#{c.case_id}</span>
                        {c.case_accident_type ? (
                          <div className="text-xs text-gray-500 mt-0.5">{c.case_accident_type}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.phone || '—'}</td>
                      <td className="px-6 py-4 text-gray-700">{c.email || '—'}</td>
                      <td className="px-6 py-4">
                        {!c.is_active ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                              Inactive
                            </span>
                            {c.portal_activated_at ? (
                              <span className="text-xs text-gray-500">Portal since {formatDate(c.portal_activated_at)}</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex w-fit rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-800">
                              Active
                            </span>
                            {c.portal_activated_at ? (
                              <span className="text-xs text-emerald-700">Portal enabled</span>
                            ) : (
                              <span className="text-xs text-amber-700">Portal not set</span>
                            )}
                            {c.portal_activated_at ? (
                              <span className="text-xs text-gray-500">Activated: {formatDate(c.portal_activated_at)}</span>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={`${actionIconBtn} text-indigo-600 hover:text-indigo-800`}
                            disabled={portalBusy}
                            onClick={(e) => openPortalModal(c, e)}
                            title="Portal login & password"
                            aria-label="Portal login and password"
                          >
                            <IconKey />
                          </button>
                          <button
                            type="button"
                            className={`${actionIconBtn} text-gray-700 hover:text-gray-900`}
                            disabled={editSaving}
                            onClick={(e) => openEdit(c, e)}
                            title="Edit claimant"
                            aria-label="Edit claimant"
                          >
                            {editSaving && editId === c.id ? <IconSpinner className="w-5 h-5 text-gray-600" /> : <IconPencil />}
                          </button>
                          <button
                            type="button"
                            className={`${actionIconBtn} text-gray-400 cursor-not-allowed`}
                            disabled
                            title="Delete is not available for claimants"
                            aria-label="Delete unavailable"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {portalTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!portalBusy) {
                setPortalTarget(null);
                setPortalRegeneratedPassword(null);
                setPortalTempPassword(null);
                setPortalSyncedMessage(null);
              }
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] animate-modal-in">
            <div className="h-1 w-full bg-indigo-500" />
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Claimant portal</h2>
              <p className="text-sm text-gray-600">
                Login email and password for the claimant portal at <span className="font-mono text-gray-800">/portal</span>.
                {portalTarget && portalAlreadyActive(portalTarget) ? (
                  <span className="block mt-2 text-gray-500">
                    To change only the login email, save with the password field blank. Enter a new password (8+ characters) to
                    replace the current one, or use Regenerate password.
                  </span>
                ) : (
                  <span className="block mt-2 text-gray-500">
                    Leave password blank to generate a temporary password, or set one (8+ characters) before saving.
                  </span>
                )}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portal email</label>
                <input
                  type="email"
                  value={portalForm.email}
                  onChange={(e) => setPortalForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoComplete="off"
                />
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Regenerate password</p>
                    <p className="text-xs text-gray-600 mt-0.5">Creates a secure random password and saves it immediately.</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    onClick={regenerateAndSavePortalPassword}
                    disabled={portalBusy}
                  >
                    {portalBusy ? 'Working…' : 'Regenerate password'}
                  </button>
                </div>
                {portalRegeneratedPassword ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                    <p className="text-xs font-semibold text-emerald-900">New password — copy and share securely</p>
                    <p className="font-mono text-sm text-emerald-950 break-all">{portalRegeneratedPassword}</p>
                    <button
                      type="button"
                      className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(portalRegeneratedPassword);
                          setPortalCopiedRegenerated(true);
                          window.setTimeout(() => setPortalCopiedRegenerated(false), 2000);
                        } catch {
                          alert('Could not copy to clipboard.');
                        }
                      }}
                    >
                      {portalCopiedRegenerated ? 'Copied!' : 'Copy password'}
                    </button>
                  </div>
                ) : null}
                {portalTempPassword ? (
                  <div className="rounded-lg border border-indigo-200 bg-white p-3 space-y-2">
                    <p className="text-xs font-semibold text-indigo-900">Temporary password — copy and share securely</p>
                    <p className="font-mono text-sm text-indigo-950 break-all">{portalTempPassword}</p>
                    <button
                      type="button"
                      className="text-sm font-semibold text-indigo-800 hover:text-indigo-950"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(portalTempPassword);
                          setPortalCopiedRegenerated(true);
                          window.setTimeout(() => setPortalCopiedRegenerated(false), 2000);
                        } catch {
                          alert('Could not copy to clipboard.');
                        }
                      }}
                    >
                      {portalCopiedRegenerated ? 'Copied!' : 'Copy password'}
                    </button>
                  </div>
                ) : null}
                {portalSyncedMessage ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{portalSyncedMessage}</div>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {portalTarget && portalAlreadyActive(portalTarget)
                      ? 'Password (optional — blank keeps current)'
                      : 'Password (optional — blank generates a temporary password)'}
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={portalModalShowPassword}
                      onChange={(e) => setPortalModalShowPassword(e.target.checked)}
                    />
                    Show password
                  </label>
                </div>
                <input
                  type={portalModalShowPassword ? 'text' : 'password'}
                  value={portalForm.password}
                  onChange={(e) => setPortalForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={portalTarget && portalAlreadyActive(portalTarget) ? 'Leave blank to keep current' : ''}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoComplete="new-password"
                />
              </div>
              {loadError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">{loadError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setPortalTarget(null);
                    setPortalRegeneratedPassword(null);
                    setPortalTempPassword(null);
                    setPortalSyncedMessage(null);
                  }}
                  disabled={portalBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  onClick={submitPortalActivate}
                  disabled={portalBusy}
                >
                  {portalBusy
                    ? 'Saving…'
                    : portalTarget && portalAlreadyActive(portalTarget)
                      ? 'Save'
                      : 'Save & activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !editSaving && setEditorOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-in">
            <div className="h-1 w-full bg-indigo-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit claimant</h2>
                  <p className="text-sm text-gray-600 mt-1">Update contact details and listing status.</p>
                </div>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => !editSaving && setEditorOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="claimant-active"
                    checked={Boolean(editForm.is_active)}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <label htmlFor="claimant-active" className="text-sm font-medium text-gray-700">
                    Active (listed)
                  </label>
                </div>
              </div>

              {loadError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">{loadError}</div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setEditorOpen(false)}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  onClick={submitEdit}
                  disabled={editSaving}
                >
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
