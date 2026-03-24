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

const actionIconBtn =
  'inline-flex items-center justify-center rounded-lg p-2 border border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1';

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

/** Cryptographically random password for portal regenerate (client-generated; sent once to the API). */
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

export function Providers() {
  const { token, user } = useAuth();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | inactive
  const [filterPortal, setFilterPortal] = useState('all'); // all | enabled | not_enabled
  const [filterLien, setFilterLien] = useState('all'); // all | yes | no

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

  const [portalTarget, setPortalTarget] = useState(null);
  const [portalForm, setPortalForm] = useState({ portal_email: '', password: '' });
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalModalShowPassword, setPortalModalShowPassword] = useState(false);
  /** Shown after successful "Regenerate password" in the portal modal */
  const [portalRegeneratedPassword, setPortalRegeneratedPassword] = useState(null);
  const [portalCopiedRegenerated, setPortalCopiedRegenerated] = useState(false);

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

  const visibleProviders = useMemo(() => {
    let list = providers;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const phone = String(p.phone || '').toLowerCase();
        const email = String(p.email || '').toLowerCase();
        const portalEmail = String(p.portal_email || '').toLowerCase();
        const address = String(p.address || '').toLowerCase();
        const typeLabel = providerTypeLabel(p.provider_type).toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          portalEmail.includes(q) ||
          address.includes(q) ||
          typeLabel.includes(q)
        );
      });
    }
    if (filterStatus === 'active') {
      list = list.filter((p) => Boolean(p.is_active));
    } else if (filterStatus === 'inactive') {
      list = list.filter((p) => !p.is_active);
    }
    if (filterPortal === 'enabled') {
      list = list.filter((p) => Boolean(p.portal_activated_at || p.password_hash));
    } else if (filterPortal === 'not_enabled') {
      list = list.filter((p) => !p.portal_activated_at && !p.password_hash);
    }
    if (filterLien === 'yes') {
      list = list.filter((p) => Boolean(p.lien_friendly));
    } else if (filterLien === 'no') {
      list = list.filter((p) => !p.lien_friendly);
    }
    return list;
  }, [providers, searchQuery, filterStatus, filterPortal, filterLien]);

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

  const openPortalActivate = (p, e) => {
    if (e) e.stopPropagation();
    setLoadError('');
    setPortalRegeneratedPassword(null);
    setPortalCopiedRegenerated(false);
    setPortalModalShowPassword(false);
    setPortalTarget(p);
    setPortalForm({
      portal_email: String(p.portal_email || p.email || '').trim(),
      password: '',
    });
  };

  const regenerateAndSavePortalPassword = async () => {
    if (!portalTarget) return;
    const id = Number(portalTarget.id);
    const base = getBaseUrl();
    const portal_email = String(portalForm.portal_email || '').trim().toLowerCase();
    if (!portal_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portal_email)) {
      setLoadError('Enter a valid portal email first.');
      return;
    }
    const newPassword = generateRandomPortalPassword(16);
    setPortalBusy(true);
    setLoadError('');
    setPortalRegeneratedPassword(null);
    setPortalCopiedRegenerated(false);
    try {
      const res = await fetch(`${base}/api/providers/${id}/activate-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ portal_email, password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update portal password');
      setPortalRegeneratedPassword(newPassword);
      setPortalForm((prev) => ({ ...prev, password: newPassword }));
      setPortalModalShowPassword(true);
      await fetchProviders();
    } catch (err) {
      setLoadError(err.message || 'Failed to regenerate password');
    } finally {
      setPortalBusy(false);
    }
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
      setPortalRegeneratedPassword(null);
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
    <div className="w-full max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex-1 min-w-[14rem]">
            <label htmlFor="providers-search" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Search
            </label>
            <input
              id="providers-search"
              type="search"
              placeholder="Name, email, phone, address, portal email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="text-sm text-gray-600 shrink-0">
            {visibleProviders.length === providers.length
              ? `${providers.length} providers`
              : `Showing ${visibleProviders.length} of ${providers.length}`}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Provider type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[11rem]"
            >
              <option value="all">All types</option>
              {providerTypes.map((t) => (
                <option key={t} value={t}>
                  {providerTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[10rem]"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Portal</label>
            <select
              value={filterPortal}
              onChange={(e) => setFilterPortal(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[11rem]"
            >
              <option value="all">All</option>
              <option value="enabled">Portal enabled</option>
              <option value="not_enabled">Portal not set</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lien-friendly</label>
            <select
              value={filterLien}
              onChange={(e) => setFilterLien(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[9rem]"
            >
              <option value="all">All</option>
              <option value="yes">Yes only</option>
              <option value="no">No only</option>
            </select>
          </div>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[1%] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <TableLoadingRow colSpan={7} message="Loading providers…" />
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-600">
                    No providers found.
                  </td>
                </tr>
              ) : visibleProviders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-600">
                    No providers match your search or filters.
                  </td>
                </tr>
              ) : (
                visibleProviders.map((p) => (
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
                      {!p.is_active ? (
                        <span className="inline-flex rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          Inactive
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex w-fit rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-800">
                            Active
                          </span>
                          {p.portal_activated_at || p.password_hash ? (
                            <span className="text-xs text-emerald-700">Portal enabled</span>
                          ) : (
                            <span className="text-xs text-amber-700">Portal not set</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`${actionIconBtn} text-indigo-600 hover:text-indigo-800`}
                          onClick={(e) => openPortalActivate(p, e)}
                          title="Change password"
                          aria-label="Change password"
                        >
                          <IconKey />
                        </button>
                        <button
                          type="button"
                          className={`${actionIconBtn} text-gray-700 hover:text-gray-900`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(p);
                          }}
                          title="Edit"
                          aria-label="Edit provider"
                        >
                          <IconPencil />
                        </button>
                        <button
                          type="button"
                          className={`${actionIconBtn} text-red-600 hover:text-red-800`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(p);
                          }}
                          title="Delete"
                          aria-label="Delete provider"
                        >
                          <IconTrash />
                        </button>
                      </div>
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
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!portalBusy) {
                setPortalTarget(null);
                setPortalRegeneratedPassword(null);
              }
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh] animate-modal-in">
            <div className="h-1 w-full bg-indigo-500" />
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Edit provider portal</h2>
              <p className="text-sm text-gray-600">
                Set the email and password this organization uses to sign in at{' '}
                <span className="font-mono text-gray-800">/provider-portal</span>.
                {portalTarget && portalAlreadyActive(portalTarget) ? (
                  <span className="block mt-2 text-gray-500">
                    To change only the login email, leave the password field blank. Enter a new password (8+ characters)
                    to replace the current one, or use Regenerate password.
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

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Regenerate password</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Creates a secure random password and saves it immediately.
                    </p>
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

