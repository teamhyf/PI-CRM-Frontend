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

export default function ClaimantsManagementCard() {
  const { token, user } = useAuth();

  const [claimants, setClaimants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activatingId, setActivatingId] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [tempPassword, setTempPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedTemp, setCopiedTemp] = useState(false);

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
      setClaimants(Array.isArray(data?.claimants) ? data.claimants : []);
    } catch (err) {
      setError(err.message || 'Failed to load claimants');
      setClaimants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activatePortal = async (claimant) => {
    setActivatingId(claimant.id);
    setTempPassword(null);
    setShowPassword(false);
    setCopiedTemp(false);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/claimants/${claimant.id}/activate-portal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const raw = await res.text().catch(() => '');
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || raw || `Failed to activate (HTTP ${res.status})`);
      }

      if (data.syncedFromExistingPortal) {
        setTempPassword(null);
        setShowPassword(false);
        alert(
          data.message ||
            'Portal linked to existing password for this email. Claimant should use their current portal password.'
        );
      } else {
        setTempPassword(data.tempPassword || null);
        setShowPassword(true);
      }
      await fetchClaimants();
    } catch (err) {
      alert(err.message || 'Failed to activate portal');
    } finally {
      setActivatingId(null);
    }
  };

  const setActive = async (claimant, nextIsActive) => {
    setDeactivatingId(claimant.id);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/claimants/${claimant.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: nextIsActive }),
      });
      const raw = await res.text().catch(() => '');
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (!res.ok) throw new Error(data?.error || raw || `Failed to update (HTTP ${res.status})`);
      await fetchClaimants();
    } catch (err) {
      alert(err.message || 'Failed to update claimant');
    } finally {
      setDeactivatingId(null);
    }
  };

  const copyTempPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopiedTemp(true);
      window.setTimeout(() => setCopiedTemp(false), 2000);
    } catch {
      alert('Could not copy to clipboard.');
    }
  };

  if (!canRender) return null;

  return (
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
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
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
                          <span className="text-xs text-gray-500">Activated: {formatDate(c.portal_activated_at)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          className={`${actionIconBtn} text-indigo-600 hover:text-indigo-800`}
                          disabled={activatingId === c.id || Boolean(c.portal_activated_at)}
                          onClick={() => activatePortal(c)}
                          title={
                            c.portal_activated_at ? 'Portal already activated' : 'Activate portal / set password'
                          }
                          aria-label="Activate portal"
                        >
                          {activatingId === c.id ? <IconSpinner className="w-5 h-5 text-indigo-600" /> : <IconKey />}
                        </button>
                        <button
                          type="button"
                          className={`${actionIconBtn} text-gray-700 hover:text-gray-900`}
                          disabled={deactivatingId === c.id}
                          onClick={() => setActive(c, !c.is_active)}
                          title={c.is_active ? 'Deactivate claimant' : 'Activate claimant'}
                          aria-label={c.is_active ? 'Deactivate claimant' : 'Activate claimant'}
                        >
                          {deactivatingId === c.id ? <IconSpinner className="w-5 h-5 text-gray-600" /> : <IconPencil />}
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

      {showPassword && tempPassword ? (
        <div className="border-t border-indigo-100 bg-indigo-50/80 px-6 py-4">
          <div className="text-sm font-semibold text-indigo-900 mb-2">Temporary password generated</div>
          <div className="font-mono text-sm text-indigo-950 break-all bg-white border border-indigo-100 rounded-lg px-3 py-2">
            {tempPassword}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-indigo-300 bg-white text-indigo-800 hover:bg-indigo-50"
              onClick={copyTempPassword}
            >
              {copiedTemp ? 'Copied!' : 'Copy password'}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              onClick={() => {
                setShowPassword(false);
                setTempPassword(null);
              }}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
