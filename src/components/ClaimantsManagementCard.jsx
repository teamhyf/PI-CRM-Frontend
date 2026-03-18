import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

const statusPillClass = (isActive) => {
  if (isActive) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function ClaimantsManagementCard() {
  const { token, user } = useAuth();

  const [claimants, setClaimants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activatingId, setActivatingId] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [tempPassword, setTempPassword] = useState(null); // string or null
  const [showPassword, setShowPassword] = useState(false);

  const canRender = useMemo(() => user?.role === 'admin' || user?.role === 'attorney', [user]);

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

      setTempPassword(data.tempPassword || null);
      setShowPassword(true);
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

  if (!canRender) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Claimants</h2>
          <p className="text-sm text-gray-600 mt-1">Manage claimant portal activation status</p>
        </div>
        <div className="text-sm text-gray-500">{claimants.length} total</div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Loading claimants…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Claimant</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Case</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Portal</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claimants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-600">
                    No claimants found.
                  </td>
                </tr>
              ) : (
                claimants.map((c) => {
                  const portalReady = Boolean(c.portal_activated_at) && Boolean(c.is_active);
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{`${c.first_name || ''} ${c.last_name || ''}`.trim() || '—'}</div>
                        <div className="text-xs text-gray-500">{c.phone || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        #{c.case_id} <div className="text-xs text-gray-500">{c.case_accident_type || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.email || '—'}</td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold ${statusPillClass(c.is_active)}`}>
                          {portalReady ? 'ACTIVE' : c.portal_activated_at ? 'INACTIVE' : 'NOT ACTIVATED'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Activated: {formatDate(c.portal_activated_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                            disabled={activatingId === c.id || Boolean(c.portal_activated_at)}
                            onClick={() => activatePortal(c)}
                            title={c.portal_activated_at ? 'Portal already activated' : 'Activate portal'}
                          >
                            {activatingId === c.id ? 'Activating…' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
                            disabled={deactivatingId === c.id}
                            onClick={() => setActive(c, !c.is_active)}
                            title="Toggle active"
                          >
                            {deactivatingId === c.id ? 'Updating…' : c.is_active ? 'Deactivate' : 'Re-activate'}
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
      )}

      {showPassword && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="text-sm font-semibold text-indigo-900 mb-2">Temp password generated</div>
          <div className="text-sm text-indigo-900 break-all">
            {tempPassword || '—'}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              onClick={() => setShowPassword(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

