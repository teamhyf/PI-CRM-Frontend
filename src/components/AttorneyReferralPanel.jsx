import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const STATUS_BADGE = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  referred: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
};

export default function AttorneyReferralPanel({ caseId, onChanged }) {
  const { token } = useAuth();
  const { success, error } = useToast();

  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [form, setForm] = useState({
    attorney_name: '',
    law_firm: '',
    attorney_phone: '',
    attorney_email: '',
    referral_reason: 'complexity',
    referral_notes: '',
    claimant_consented: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReferrals = async () => {
    if (!token || !caseId) return;
    setLoading(true);
    setFetchError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/cases/${caseId}/attorney-referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load referrals');
      setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
    } catch (e) {
      setFetchError(e.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, token]);

  const readyToSubmit = useMemo(() => form.claimant_consented && form.attorney_name.trim(), [form]);

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!readyToSubmit || submitting) return;

    setSubmitting(true);
    try {
      const base = getBaseUrl();
      const payload = {
        ...form,
        // Backend requires claimant_consented=true; we enforce it here too.
        claimant_consented: true,
      };

      const res = await fetch(`${base}/api/cases/${caseId}/attorney-referrals`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create referral');

      success('Referral submitted', `Referral created for ${data.attorney_name || 'attorney'}.`);
      setForm({
        attorney_name: '',
        law_firm: '',
        attorney_phone: '',
        attorney_email: '',
        referral_reason: 'complexity',
        referral_notes: '',
        claimant_consented: false,
      });
      await fetchReferrals();
      if (onChanged) await onChanged();
    } catch (err) {
      error(err.message || 'Failed to create referral');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (referralId, nextStatus) => {
    if (!nextStatus) return;
    if (!token) return;
    if (updatingId) return;

    setUpdatingId(referralId);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/attorney-referrals/${referralId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update referral status');

      success('Referral updated', `Status updated to ${nextStatus}.`);
      await fetchReferrals();
      if (onChanged) await onChanged();
    } catch (e) {
      error(e.message || 'Failed to update referral status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Attorney Referral Panel</h3>
          <p className="text-sm text-gray-600 mt-1">Create and track attorney referral requests with consent.</p>
        </div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Consent required
        </span>
      </div>

      {fetchError ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fetchError}</div>
      ) : null}

      {loading ? <p className="text-sm text-gray-600">Loading referrals…</p> : null}

      {referrals.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-800">Referral List</p>
            <p className="text-xs text-gray-500">{referrals.length} total</p>
          </div>
          <div className="divide-y divide-gray-100">
            {referrals.map((r) => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {r.attorney_name}
                      {r.law_firm ? ` · ${r.law_firm}` : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {r.attorney_email ? `${r.attorney_email}` : null}
                      {r.attorney_phone ? `${r.attorney_email ? ' · ' : ''}${r.attorney_phone}` : null}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      STATUS_BADGE[r.referral_status] || STATUS_BADGE.pending
                    }`}
                  >
                    {r.referral_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    <div>
                      Reason: <span className="font-semibold text-gray-800">{r.referral_reason}</span>
                    </div>
                    <div className="mt-1">
                      Referred at: <span className="font-semibold text-gray-800">{r.referred_at ? String(r.referred_at).slice(0, 10) : '—'}</span>
                    </div>
                    <div className="mt-1">
                      Responded at:{' '}
                      <span className="font-semibold text-gray-800">
                        {r.responded_at ? String(r.responded_at).slice(0, 10) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-700">Update status</label>
                    <select
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={r.referral_status}
                      disabled={updatingId === r.id}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="referred">referred</option>
                      <option value="accepted">accepted</option>
                      <option value="declined">declined</option>
                    </select>
                  </div>
                </div>

                {r.referral_notes ? (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    Notes: <span className="text-gray-900">{r.referral_notes}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">No attorney referrals created yet.</p>
      )}

      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <form onSubmit={handleCreateReferral} className="space-y-4">
          <p className="text-sm font-semibold text-gray-900">Add Referral</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Attorney Name</label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.attorney_name}
                onChange={(e) => setForm((f) => ({ ...f, attorney_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Law Firm</label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.law_firm}
                onChange={(e) => setForm((f) => ({ ...f, law_firm: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Attorney Phone</label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.attorney_phone}
                onChange={(e) => setForm((f) => ({ ...f, attorney_phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Attorney Email</label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.attorney_email}
                onChange={(e) => setForm((f) => ({ ...f, attorney_email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Referral Reason</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.referral_reason}
                onChange={(e) => setForm((f) => ({ ...f, referral_reason: e.target.value }))}
              >
                <option value="complexity">complexity</option>
                <option value="policy_limit_exceeded">policy_limit_exceeded</option>
                <option value="liability_dispute">liability_dispute</option>
                <option value="claimant_request">claimant_request</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={form.claimant_consented}
                  onChange={(e) => setForm((f) => ({ ...f, claimant_consented: e.target.checked }))}
                />
                <span>I confirm the claimant was informed of this attorney referral and the 20% fee arrangement.</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Referral Notes</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              value={form.referral_notes}
              onChange={(e) => setForm((f) => ({ ...f, referral_notes: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={!readyToSubmit || submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Referral'}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            Attorney referrals are made at a pre-negotiated fee of 20% of settlement proceeds.
          </p>
        </form>
      </div>
    </div>
  );
}

