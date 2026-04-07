import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AttorneyReferralPanel from './AttorneyReferralPanel';
import { LoadingInline } from './LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const DEMAND_STATUS_OPTIONS = [
  { value: 'not_started', label: 'not_started' },
  { value: 'demand_sent', label: 'demand_sent' },
  { value: 'negotiating', label: 'negotiating' },
  { value: 'settled', label: 'settled' },
  { value: 'litigation', label: 'litigation' },
  { value: 'closed', label: 'closed' },
];

const StatusCheck = ({ ok }) => (
  <span className={ok ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
    {ok ? '✓' : '✗'}
  </span>
);

function parseMaybeJson(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (_) {
      return null;
    }
  }
  return val;
}

export default function SettlementTab({
  caseId,
  onChanged,
  apiPrefix = '/api',
  token: tokenOverride,
  readOnly = false,
}) {
  const { token } = useAuth();
  const authToken = tokenOverride || token;
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [tracker, setTracker] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [medicalCosts, setMedicalCosts] = useState(0);
  const [treatmentDays, setTreatmentDays] = useState(0);

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patchingStatus, setPatchingStatus] = useState(false);

  const [form, setForm] = useState({
    demand_status: 'not_started',
    demand_amount: '',
    claimed_medicals: '',
    negotiated_medicals: '',
    final_settlement: '',
    notes: '',
  });

  const offerHistory = useMemo(() => {
    if (!tracker?.offer_history_json) return [];
    const parsed = parseMaybeJson(tracker.offer_history_json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  }, [tracker?.offer_history_json]);

  const negotiation = useMemo(() => {
    const raw = tracker?.negotiation_summary_json;
    if (!raw) return null;
    const parsed = parseMaybeJson(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.negotiationSummary === 'string') return parsed;
    return null;
  }, [tracker?.negotiation_summary_json]);

  const netToClient = useMemo(() => {
    const finalN = form.final_settlement !== '' ? Number(form.final_settlement) : null;
    const negN = form.negotiated_medicals !== '' ? Number(form.negotiated_medicals) : null;
    if (finalN != null && Number.isFinite(finalN) && negN != null && Number.isFinite(negN)) {
      return finalN - negN;
    }
    const backendNet = tracker?.net_to_client != null ? Number(tracker.net_to_client) : null;
    if (backendNet != null && Number.isFinite(backendNet)) return backendNet;
    return null;
  }, [form.final_settlement, form.negotiated_medicals, tracker?.net_to_client]);

  const fetchSettlement = async () => {
    if (!authToken || !caseId) return;
    setLoading(true);
    setLoadError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}${apiPrefix}/cases/${caseId}/settlement`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load settlement');

      setTracker(data.tracker || null);
      setReadiness(data.readiness || null);
      setMedicalCosts(Number(data.medicalCosts || 0));
      setTreatmentDays(Number(data.treatmentDays || 0));

      // Sync form with tracker once loaded.
      if (data.tracker) {
        setForm({
          demand_status: data.tracker.demand_status || 'not_started',
          demand_amount: data.tracker.demand_amount != null ? String(data.tracker.demand_amount) : '',
          claimed_medicals: data.tracker.claimed_medicals != null ? String(data.tracker.claimed_medicals) : '',
          negotiated_medicals: data.tracker.negotiated_medicals != null ? String(data.tracker.negotiated_medicals) : '',
          final_settlement: data.tracker.final_settlement != null ? String(data.tracker.final_settlement) : '',
          notes: data.tracker.notes || '',
        });
      }
    } catch (e) {
      setLoadError(e.message || 'Failed to load settlement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, authToken, apiPrefix]);

  const createTracker = async () => {
    if (readOnly) return;
    if (!authToken || !caseId || creating) return;
    setCreating(true);
    try {
      const base = getBaseUrl();
      if (apiPrefix !== '/api') throw new Error('Settlement tracker creation is not enabled for this portal.');
      const res = await fetch(`${base}${apiPrefix}/cases/${caseId}/settlement`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create settlement tracker');

      success('Settlement tracker created', 'You can now record settlement status and amounts.');
      await fetchSettlement();
      if (onChanged) await onChanged();
    } catch (e) {
      error(e.message || 'Failed to create settlement tracker');
    } finally {
      setCreating(false);
    }
  };

  const saveSettlement = async () => {
    if (!tracker?.id) return;
    if (readOnly) return;
    if (saving) return;
    setSaving(true);
    try {
      const base = getBaseUrl();
      if (apiPrefix !== '/api') throw new Error('Settlement editing is not enabled for this portal.');
      const payload = {
        demand_status: form.demand_status,
        demand_amount: form.demand_amount === '' ? null : Number(form.demand_amount),
        claimed_medicals: form.claimed_medicals === '' ? null : Number(form.claimed_medicals),
        negotiated_medicals: form.negotiated_medicals === '' ? null : Number(form.negotiated_medicals),
        final_settlement: form.final_settlement === '' ? null : Number(form.final_settlement),
        notes: form.notes || null,
      };

      const res = await fetch(`${base}${apiPrefix}/settlement/${tracker.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save settlement');

      success('Settlement saved', 'Settlement information updated successfully.');
      await fetchSettlement();
      if (onChanged) await onChanged();
    } catch (e) {
      error(e.message || 'Failed to save settlement');
    } finally {
      setSaving(false);
    }
  };

  const patchDemandStatus = async (nextStatus) => {
    if (!tracker?.id) return;
    if (readOnly) return;
    if (patchingStatus) return;
    setPatchingStatus(true);
    setForm((f) => ({ ...f, demand_status: nextStatus }));
    try {
      const base = getBaseUrl();
      if (apiPrefix !== '/api') throw new Error('Settlement editing is not enabled for this portal.');
      const res = await fetch(`${base}${apiPrefix}/settlement/${tracker.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ demand_status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update demand status');

      success('Status updated', `Demand status set to ${nextStatus}.`);
      await fetchSettlement();
      if (onChanged) await onChanged();
    } catch (e) {
      error(e.message || 'Failed to update demand status');
    } finally {
      setPatchingStatus(false);
    }
  };

  const checklist = readiness?.checklist || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settlement</h2>
          <p className="text-sm text-gray-600 mt-1">Track resolution progress and attorney referral readiness.</p>
        </div>
        {tracker?.id ? (
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Tracker #{tracker.id}
          </span>
        ) : (
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            No tracker yet
          </span>
        )}
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
          <LoadingInline message="Loading settlement…" />
        </div>
      ) : null}
      {loadError ? <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</div> : null}

      {!loading && !tracker ? (
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <p className="text-sm font-semibold text-gray-900">Settlement tracker not created</p>
          <p className="text-sm text-gray-600 mt-1">
            {readOnly
              ? 'A settlement tracker has not been created yet.'
              : 'Create it to start recording settlement and readiness.'}
          </p>
          {!readOnly ? (
            <button
              onClick={createTracker}
              disabled={creating}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating…' : 'Create Settlement Tracker'}
            </button>
          ) : null}
        </div>
      ) : null}

      {readiness ? (
        <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Resolution Readiness Checklist</p>
              <p className="text-xs text-gray-500 mt-1">Gate checks required before settlement / referral transitions.</p>
            </div>
            <div
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                readiness.ready ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {readiness.ready ? 'Case Ready for Settlement' : 'Blockers Remain'}
            </div>
          </div>

          {Array.isArray(readiness.blockers) && readiness.blockers.length ? (
            <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-900 mb-1">Blockers</p>
              <ul className="list-disc ml-5">
                {readiness.blockers.map((b, idx) => (
                  <li key={`${b}-${idx}`}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Documents Complete</p>
                <p className="text-xs text-gray-600">Completeness: {checklist.documentCompleteness ?? '—'}%</p>
              </div>
              <StatusCheck ok={!!checklist.documentsComplete} />
            </div>
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Red Flags Resolved</p>
                <p className="text-xs text-gray-600">Open high flags: {checklist.openHighFlags ?? '—'}</p>
              </div>
              <StatusCheck ok={!!checklist.redFlagsResolved} />
            </div>
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Medical Visits Recorded</p>
                <p className="text-xs text-gray-600">Visits count: {checklist.medicalVisitsCount ?? '—'}</p>
              </div>
              <StatusCheck ok={!!checklist.medicalVisitsRecorded} />
            </div>
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Settlement Tracker Created</p>
                <p className="text-xs text-gray-600">Setup status: {tracker ? 'Created' : 'Missing'}</p>
              </div>
              <StatusCheck ok={!!checklist.settlementTrackerCreated} />
            </div>
          </div>
        </div>
      ) : null}

      {tracker?.id ? (
        <>
          <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Settlement Status</p>
              <p className="text-xs text-gray-500 mt-1">
                {readOnly ? 'Current settlement status and amounts.' : 'Update demand status and financial records.'}
              </p>
            </div>

            {readOnly ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Demand Status</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {String(form.demand_status || '—').replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Treatment Days</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {Number.isFinite(treatmentDays) ? `${treatmentDays} days` : '—'}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Demand Amount</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {form.demand_amount !== '' ? `$${Number(form.demand_amount).toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Claimed Medicals</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {form.claimed_medicals !== '' ? `$${Number(form.claimed_medicals).toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Negotiated Medicals</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {form.negotiated_medicals !== '' ? `$${Number(form.negotiated_medicals).toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Final Settlement</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {form.final_settlement !== '' ? `$${Number(form.final_settlement).toLocaleString()}` : '—'}
                  </p>
                </div>

                <div className="md:col-span-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600">Net to Client</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {netToClient != null && Number.isFinite(netToClient)
                      ? `$${Number(netToClient).toLocaleString()}`
                      : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">(final_settlement - negotiated_medicals)</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-gray-600">Notes</p>
                  <div className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                    {form.notes ? form.notes : '—'}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Demand Status</label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={form.demand_status}
                      disabled={patchingStatus}
                      onChange={(e) => patchDemandStatus(e.target.value)}
                    >
                      {DEMAND_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Treatment Days</label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
                      {Number.isFinite(treatmentDays) ? treatmentDays : '—'} days
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Demand Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.demand_amount}
                      onChange={(e) => setForm((f) => ({ ...f, demand_amount: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Claimed Medicals</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.claimed_medicals}
                      onChange={(e) => setForm((f) => ({ ...f, claimed_medicals: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Negotiated Medicals</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.negotiated_medicals}
                      onChange={(e) => setForm((f) => ({ ...f, negotiated_medicals: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Final Settlement</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.final_settlement}
                      onChange={(e) => setForm((f) => ({ ...f, final_settlement: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Net to Client</label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
                      {netToClient != null && Number.isFinite(netToClient)
                        ? `$${Number(netToClient).toLocaleString()}`
                        : '—'}
                      <span className="text-xs text-gray-500 font-normal ml-2">(final_settlement - negotiated_medicals)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {!readOnly ? (
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={saveSettlement}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save Settlement Info'}
                </button>
              </div>
            ) : null}
          </div>

          {negotiation?.negotiationSummary ? (
            <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Offer Negotiation Summary</p>
                  <p className="text-xs text-gray-500 mt-1">Staff-only narrative generated when settlement is finalized.</p>
                </div>
                {typeof negotiation.offerCount === 'number' ? (
                  <span className="text-xs font-semibold text-indigo-700">
                    {negotiation.offerCount} offer round{negotiation.offerCount === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-100 rounded-lg bg-gray-50 p-3">
                {negotiation.negotiationSummary}
              </div>
            </div>
          ) : null}

          <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Offer History</p>
              <p className="text-xs text-gray-500 mt-1">If present, shows prior settlement demand rounds.</p>
            </div>
            {offerHistory.length ? (
              <div className="space-y-3">
                {offerHistory.map((o, idx) => (
                  <div key={`${o.offer_number || 'offer'}-${idx}`} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Offer #{o.offer_number ?? idx + 1}
                      </p>
                      <p className="text-sm font-semibold text-indigo-700">
                        {o.offer_amount != null ? `$${Number(o.offer_amount).toLocaleString()}` : '—'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Offered at: {o.offered_at ? String(o.offered_at).slice(0, 10) : '—'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Responded: {o.responded ? 'Yes' : 'No'}
                      {o.response_date ? ` · ${String(o.response_date).slice(0, 10)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No offer history recorded yet.</p>
            )}
          </div>
        </>
      ) : null}

      {!readOnly ? (
        <AttorneyReferralPanel
          caseId={caseId}
          onChanged={async () => {
            // Refresh settlement readiness and tracker values after referral updates.
            await fetchSettlement();
            if (onChanged) await onChanged();
          }}
        />
      ) : null}
    </div>
  );
}

