import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingInline } from '../components/LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export function Settings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [threshold, setThreshold] = useState(80);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load settings');
        if (!cancelled) {
          const v = Number(data.leadAutoConvertScoreThreshold);
          setThreshold(Number.isFinite(v) ? v : 80);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSavedOk(false);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/settings/lead-auto-convert-threshold`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: threshold }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setThreshold(Number(data.leadAutoConvertScoreThreshold) || threshold);
      setSavedOk(true);
    } catch (e2) {
      setSaveError(e2.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Admin-only configuration for automation and notifications.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900">AI lead auto-conversion</h2>
        <p className="text-sm text-gray-600 mt-1">
          If a case lead’s AI viability score is at or above this value, it will automatically convert into a case.
        </p>

        {loading ? (
          <div className="mt-4">
            <LoadingInline message="Loading settings…" />
          </div>
        ) : error ? (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        ) : (
          <form onSubmit={save} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-convert threshold (0–100)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Current behavior: convert when score ≥ <span className="font-semibold">{threshold}</span>.
              </p>
            </div>

            {saveError ? (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
            ) : null}
            {savedOk ? (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                Saved.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

