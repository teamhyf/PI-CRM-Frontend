import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { TableLoadingRow } from '../components/LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const providerTypes = [
  'chiropractor',
  'physical_therapy',
  'orthopedic',
  'neurology',
  'pain_management',
  'imaging',
  'emergency',
  'other',
];

const providerTypeLabel = (t) =>
  String(t || '')
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

/** Server stores bcrypt only — we keep plaintext in sessionStorage after a successful save in Edit (this browser tab). */
const SESSION_PW_PREFIX = 'ai_crm_provider_portal_pw_';

function getStoredPortalPassword(providerId) {
  try {
    return sessionStorage.getItem(SESSION_PW_PREFIX + providerId) || '';
  } catch {
    return '';
  }
}

function setStoredPortalPassword(providerId, password) {
  try {
    if (password) {
      sessionStorage.setItem(SESSION_PW_PREFIX + providerId, password);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function Providers() {
  const { token, user } = useAuth();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [filterType, setFilterType] = useState('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create'); // 'create' | 'edit'
  const [editorId, setEditorId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    provider_type: 'chiropractor',
    address: '',
    phone: '',
    email: '',
    lien_friendly: false,
    is_active: true,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [portalTarget, setPortalTarget] = useState(null);
  const [portalForm, setPortalForm] = useState({ portal_email: '', password: '' });
  const [portalBusy, setPortalBusy] = useState(false);
  /** List-page preference: reveal portal password field while typing in the modal */
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  /** Re-render after writing sessionStorage password */
  const [pwSessionTick, setPwSessionTick] = useState(0);
  /** Which rows show plaintext vs bullets (session password only) */
  const [passwordRevealedById, setPasswordRevealedById] = useState({});
  const [copiedPasswordId, setCopiedPasswordId] = useState(null);

  const canRender = useMemo(() => user?.role === 'admin', [user]);

  const fetchProviders = async () => {
    const base = getBaseUrl();
    setLoading(true);
    setLoadError('');
    try {
      const qs = filterType !== 'all' ? `?type=${encodeURIComponent(filterType)}` : '';
      const res = await fetch(`${base}/api/providers${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Read body as text first so we can surface non-JSON (DB errors, HTML, etc).
      const rawText = await res.text().catch(() => '');
      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            rawText ||
            `Failed to load providers (HTTP ${res.status})`
        );
      }
      setProviders(Array.isArray(data?.providers) ? data.providers : []);
    } catch (err) {
      setLoadError(err.message || 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const providersWithSessionPw = useMemo(
    () =>
      providers.map((p) => ({
        ...p,
        sessionPortalPassword: getStoredPortalPassword(p.id),
      })),
    [providers, pwSessionTick]
  );

  const openCreate = () => {
    setEditorMode('create');
    setEditorId(null);
    setForm({
      name: '',
      provider_type: 'chiropractor',
      address: '',
      phone: '',
      email: '',
      lien_friendly: false,
      is_active: true,
    });
    setEditorOpen(true);
  };

  const openEdit = (p) => {
    setEditorMode('edit');
    setEditorId(Number(p.id));
    setForm({
      name: String(p.name || ''),
      provider_type: String(p.provider_type || 'chiropractor'),
      address: String(p.address || ''),
      phone: String(p.phone || ''),
      email: String(p.email || ''),
      lien_friendly: Boolean(p.lien_friendly),
      is_active: Boolean(p.is_active),
    });
    setEditorOpen(true);
  };

  const submit = async () => {
    const base = getBaseUrl();
    setSaving(true);
    setLoadError('');
    try {
      const payload = {
        name: form.name.trim(),
        provider_type: form.provider_type,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        lien_friendly: Boolean(form.lien_friendly),
        is_active: Boolean(form.is_active),
      };

      let res;
      if (editorMode === 'create') {
        res = await fetch(`${base}/api/providers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${base}/api/providers/${editorId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...payload,
            is_active: Boolean(form.is_active),
          }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save provider');

      setEditorOpen(false);
      await fetchProviders();
    } catch (err) {
      setLoadError(err.message || 'Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, nextVal) => {
    const base = getBaseUrl();
    setTogglingId(id);
    try {
      const res = await fetch(`${base}/api/providers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: Boolean(nextVal) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update provider');
      await fetchProviders();
    } catch (err) {
      alert(err.message || 'Failed to toggle active');
    } finally {
      setTogglingId(null);
    }
  };

  const openPortalActivate = (p, e) => {
    if (e) e.stopPropagation();
    setLoadError('');
    setPortalTarget(p);
    setPortalForm({
      portal_email: String(p.portal_email || p.email || '').trim(),
      password: '',
    });
  };

  const portalAlreadyActive = (p) => Boolean(p?.portal_activated_at || p?.password_hash);

  const submitPortalActivate = async () => {
    if (!portalTarget) return;
    const id = Number(portalTarget.id);
    const base = getBaseUrl();
    const portal_email = String(portalForm.portal_email || '').trim().toLowerCase();
    const password = portalForm.password;
    const already = portalAlreadyActive(portalTarget);

    if (!portal_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portal_email)) {
      setLoadError('Enter a valid portal email.');
      return;
    }
    if (!already) {
      if (!password || password.length < 8) {
        setLoadError('Password must be at least 8 characters.');
        return;
      }
    } else if (password && password.length < 8) {
      setLoadError('New password must be at least 8 characters, or leave blank to keep the current password.');
      return;
    }
    setPortalBusy(true);
    setLoadError('');
    try {
      const body = { portal_email };
      if (!already) {
        body.password = password;
      } else if (password && password.length >= 8) {
        body.password = password;
      }
      const res = await fetch(`${base}/api/providers/${id}/activate-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to activate portal');
      if (body.password) {
        setStoredPortalPassword(id, body.password);
        setPwSessionTick((t) => t + 1);
      }
      setPortalTarget(null);
      setPortalForm({ portal_email: '', password: '' });
      await fetchProviders();
    } catch (err) {
      setLoadError(err.message || 'Failed to activate portal');
    } finally {
      setPortalBusy(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const id = Number(deleteTarget.id);
    const base = getBaseUrl();
    setLoadError('');
    try {
      const res = await fetch(`${base}/api/providers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete provider');
      }
      setDeleteTarget(null);
      await fetchProviders();
    } catch (err) {
      setLoadError(err.message || 'Failed to delete provider');
    }
  };

  if (!canRender) {
    return <div className="p-6 text-sm text-gray-600">Admin access required.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Providers</h1>
          <p className="text-gray-600 mt-2">Manage provider directory used for treatment routing.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Add Provider
        </button>
      </div>

      {loadError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">{loadError}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter by type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All types</option>
                {providerTypes.map((t) => (
                  <option key={t} value={t}>
                    {providerTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={showPortalPassword}
                onChange={(e) => setShowPortalPassword(e.target.checked)}
              />
              Show password when editing portal
            </label>
          </div>
          <div className="text-sm text-gray-600">{providers.length} providers</div>
        </div>
        <p className="text-xs text-gray-500">
          Portal passwords in the table are only available in this browser tab after you save them in Edit—the server
          stores hashes, not plaintext.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Provider Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lien-friendly</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[14rem]"
                  title="Password shown only for this browser session after you save in Edit"
                >
                  Password <span className="text-gray-400 font-normal normal-case">(session)</span>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <TableLoadingRow colSpan={9} message="Loading providers…" />
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-600">
                    No providers found.
                  </td>
                </tr>
              ) : (
                providersWithSessionPw.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openEdit(p)}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{providerTypeLabel(p.provider_type)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.email || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {p.lien_friendly ? (
                        <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(p.is_active)}
                        disabled={togglingId === p.id}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleActive(p.id, e.target.checked);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {p.portal_activated_at || p.password_hash ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-800">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm"
                          onClick={(e) => openPortalActivate(p, e)}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                    <td
                      className="px-6 py-4 text-sm align-top"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.sessionPortalPassword ? (
                        <div className="flex flex-col gap-2 max-w-[14rem]">
                          <label className="inline-flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={Boolean(passwordRevealedById[p.id])}
                              onChange={(e) => {
                                e.stopPropagation();
                                setPasswordRevealedById((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.checked,
                                }));
                              }}
                            />
                            Show password
                          </label>
                          {passwordRevealedById[p.id] ? (
                            <div className="flex flex-col gap-1.5">
                              <span className="font-mono text-xs text-gray-900 break-all bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
                                {p.sessionPortalPassword}
                              </span>
                              <button
                                type="button"
                                className="self-start text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await navigator.clipboard.writeText(p.sessionPortalPassword);
                                    setCopiedPasswordId(p.id);
                                    window.setTimeout(() => setCopiedPasswordId(null), 2000);
                                  } catch {
                                    alert('Could not copy to clipboard.');
                                  }
                                }}
                              >
                                {copiedPasswordId === p.id ? 'Copied!' : 'Copy password'}
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-gray-400 tracking-widest select-none">••••••••</span>
                          )}
                        </div>
                      ) : p.portal_activated_at || p.password_hash ? (
                        <span className="text-xs text-gray-500" title="Save a new password in Edit to store it here for this session">
                          —
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-900 mr-3 font-semibold"
                        onClick={(e) => openPortalActivate(p, e)}
                        title="Edit portal email and password"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(p);
                        }}
                        title="Delete provider"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {portalTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !portalBusy && setPortalTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in">
            <div className="h-1 w-full bg-indigo-500" />
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Edit provider portal</h2>
              <p className="text-sm text-gray-600">
                Set the email and password this organization uses to sign in at{' '}
                <span className="font-mono text-gray-800">/provider-portal</span>.
                {portalTarget && portalAlreadyActive(portalTarget) ? (
                  <span className="block mt-2 text-gray-500">
                    To change only the login email, leave the password field blank. Enter a new password (8+ characters)
                    to replace the current one.
                  </span>
                ) : null}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portal email</label>
                <input
                  type="email"
                  value={portalForm.portal_email}
                  onChange={(e) => setPortalForm((prev) => ({ ...prev, portal_email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoComplete="off"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {portalTarget && portalAlreadyActive(portalTarget)
                      ? 'Password (optional — blank keeps current)'
                      : 'Password (min. 8 characters)'}
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={showPortalPassword}
                      onChange={(e) => setShowPortalPassword(e.target.checked)}
                    />
                    Show password
                  </label>
                </div>
                <input
                  type={showPortalPassword ? 'text' : 'password'}
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
                  onClick={() => setPortalTarget(null)}
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

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete provider "${deleteTarget?.name || ''}"?`}
        message="This will soft-delete the provider (set it inactive)."
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-modal-in">
            <div className="h-1 w-full bg-indigo-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editorMode === 'create' ? 'Add Provider' : 'Edit Provider'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Used by treatment routing suggestions.</p>
                </div>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => setEditorOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider Type</label>
                  <select
                    value={form.provider_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, provider_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {providerTypes.map((t) => (
                      <option key={t} value={t}>
                        {providerTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.lien_friendly)}
                    onChange={(e) => setForm((prev) => ({ ...prev, lien_friendly: e.target.checked }))}
                  />
                  <label className="text-sm font-medium text-gray-700">Lien-friendly</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_active)}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
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
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  onClick={submit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editorMode === 'create' ? 'Create Provider' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

