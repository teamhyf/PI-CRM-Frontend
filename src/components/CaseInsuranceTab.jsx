import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingInline } from './LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const POLICY_TYPE_OPTIONS = [
  { value: 'bodily_injury', label: 'Bodily Injury' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'medpay', label: 'Med-Pay' },
  { value: 'uim_um', label: 'UIM / UM' },
];

function formatCurrency(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return `$${num.toLocaleString()}`;
}

function getBandColor(band) {
  if (band === '100k_plus') return 'bg-green-100 text-green-800 border-green-200';
  if (band === '50k' || band === '25k') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (band === 'under_25k') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

export default function CaseInsuranceTab({ caseId, policies, onChanged }) {
  const { token, user } = useAuth();

  const [insuranceSummary, setInsuranceSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [autoDetected, setAutoDetected] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  const [form, setForm] = useState({
    policyType: 'bodily_injury',
    carrierName: '',
    policyNumber: '',
    claimNumber: '',
    adjusterName: '',
    adjusterEmail: '',
    adjusterPhone: '',
    policyLimitPerPerson: '',
    policyLimitPerOccurrence: '',
  });

  const base = getBaseUrl();

  const fetchInsuranceSummary = useCallback(async () => {
    if (!token || !caseId) return;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await fetch(`${base}/api/cases/${caseId}/insurance-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load insurance summary');
      setInsuranceSummary(data || null);
    } catch (e) {
      setSummaryError(e.message || 'Failed to load insurance summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [token, caseId, base]);

  useEffect(() => {
    fetchInsuranceSummary();
  }, [fetchInsuranceSummary]);

  const policyTypeLabel = useMemo(() => {
    const map = {};
    for (const t of POLICY_TYPE_OPTIONS) map[t.value] = t.label;
    return map;
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingPolicyId(null);
    setAutoDetected(false);
    setForm({
      policyType: 'bodily_injury',
      carrierName: '',
      policyNumber: '',
      claimNumber: '',
      adjusterName: '',
      adjusterEmail: '',
      adjusterPhone: '',
      policyLimitPerPerson: '',
      policyLimitPerOccurrence: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setModalMode('edit');
    setEditingPolicyId(p.id);
    setAutoDetected(false);
    setForm({
      policyType: p.policy_type || 'bodily_injury',
      carrierName: p.carrier_name || '',
      policyNumber: p.policy_number || '',
      claimNumber: p.claim_number || '',
      adjusterName: p.adjuster_name || '',
      adjusterEmail: p.adjuster_email || '',
      adjusterPhone: p.adjuster_phone || '',
      policyLimitPerPerson:
        p.policy_limit_per_person != null ? String(p.policy_limit_per_person) : '',
      policyLimitPerOccurrence:
        p.policy_limit_per_occurrence != null ? String(p.policy_limit_per_occurrence) : '',
    });
    setModalOpen(true);
  };

  const openFromSuggestedValues = (suggestedValues) => {
    if (!suggestedValues) return;
    setModalMode('create');
    setEditingPolicyId(null);
    setAutoDetected(true);

    // Map LLM insurance extraction schema -> policy form schema
    setForm({
      policyType: suggestedValues.coverageType || 'bodily_injury',
      carrierName: suggestedValues.carrierName || '',
      policyNumber: suggestedValues.policyNumber || '',
      claimNumber: suggestedValues.claimNumber || '',
      adjusterName: suggestedValues.adjusterName || '',
      adjusterEmail: suggestedValues.adjusterEmail || '',
      adjusterPhone: suggestedValues.adjusterPhone || '',
      policyLimitPerPerson:
        suggestedValues.policyLimitPerPerson != null
          ? String(suggestedValues.policyLimitPerPerson)
          : '',
      policyLimitPerOccurrence:
        suggestedValues.policyLimitPerOccurrence != null
          ? String(suggestedValues.policyLimitPerOccurrence)
          : '',
    });

    setModalOpen(true);
  };

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail;
      if (!detail) return;
      const evtCaseId = detail.caseId;
      if (evtCaseId != String(caseId)) return;
      const suggestedValues = detail.suggestedValues;

      // Only open if the extraction looks like an insurance policy parse.
      const looksLikeInsurance =
        suggestedValues &&
        (suggestedValues.policyLimitPerPerson != null ||
          suggestedValues.carrierName ||
          suggestedValues.policyNumber);

      if (looksLikeInsurance) openFromSuggestedValues(suggestedValues);
    };

    window.addEventListener('insuranceSuggestedValues', handler);
    return () => window.removeEventListener('insuranceSuggestedValues', handler);
  }, [caseId]);

  const handleVerifyPolicy = async (policyId) => {
    try {
      setError('');
      const res = await fetch(`${base}/api/insurance-policies/${policyId}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to verify policy');
      await fetchInsuranceSummary();
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to verify policy');
    }
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!token) return;
    setModalSaving(true);
    setError('');
    try {
      const body = {
        policyType: form.policyType,
        carrierName: form.carrierName || null,
        policyNumber: form.policyNumber || null,
        claimNumber: form.claimNumber || null,
        adjusterName: form.adjusterName || null,
        adjusterEmail: form.adjusterEmail || null,
        adjusterPhone: form.adjusterPhone || null,
        policyLimitPerPerson:
          form.policyLimitPerPerson !== '' ? Number(form.policyLimitPerPerson) : null,
        policyLimitPerOccurrence:
          form.policyLimitPerOccurrence !== '' ? Number(form.policyLimitPerOccurrence) : null,
      };

      if (modalMode === 'edit' && editingPolicyId) {
        const res = await fetch(
          `${base}/api/cases/${caseId}/insurance-policies/${editingPolicyId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update policy');
      } else {
        const res = await fetch(`${base}/api/cases/${caseId}/insurance-policies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to create policy');
      }

      setModalOpen(false);
      onChanged?.();
      await fetchInsuranceSummary();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save policy');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm('Delete this policy?')) return;
    try {
      setError('');
      const res = await fetch(`${base}/api/cases/${caseId}/insurance-policies/${policyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete policy');
      onChanged?.();
      await fetchInsuranceSummary();
    } catch (err) {
      setError(err.message || 'Failed to delete policy');
    }
  };

  const policiesList =
    insuranceSummary && Array.isArray(insuranceSummary.policies)
      ? insuranceSummary.policies
      : Array.isArray(policies)
        ? policies
        : [];

  const primaryBand = insuranceSummary?.primaryBodyilyInjury?.policy_band || 'unknown';
  const primaryTotalBi = insuranceSummary?.primaryBodyilyInjury?.totalBiLimitPerPerson || 0;

  const verifiedCount = insuranceSummary?.verifiedCount ?? 0;
  const totalPolicies = insuranceSummary?.totalPolicies ?? policiesList.length;
  const pctVerified = totalPolicies > 0 ? (verifiedCount / totalPolicies) * 100 : 0;

  const coverageNote = insuranceSummary?.coverageNote || '';

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">
          {error}
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Primary BI Coverage</div>
            <div className="text-lg font-bold text-gray-900 mt-1">
              {formatCurrency(primaryTotalBi)}
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getBandColor(
              primaryBand
            )}`}
          >
            {primaryBand.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Med-Pay Available:</span>{' '}
            {insuranceSummary?.medpayAvailable ? 'Yes' : 'No'}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Verification Status:</span>{' '}
            {verifiedCount} of {totalPolicies} policies verified
          </div>
        </div>

        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-3 bg-indigo-600 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, pctVerified))}%` }}
          />
        </div>

        {summaryLoading ? (
          <div className="pt-1">
            <LoadingInline message="Loading coverage note…" />
          </div>
        ) : summaryError ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {summaryError}
          </div>
        ) : coverageNote ? (
          <div className="text-sm text-gray-800 whitespace-pre-wrap pt-1">{coverageNote}</div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Policies</h3>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <span>+</span> Add Policy
        </button>
      </div>

      {/* Policies */}
      {policiesList.length === 0 ? (
        <p className="text-sm text-gray-500">No policies recorded.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {policiesList.map((p) => {
            const verified = !!p.coverage_verified;
            const band = p.policy_band || 'unknown';
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold bg-gray-50 text-gray-800">
                        {policyTypeLabel[p.policy_type] || p.policy_type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getBandColor(
                          band
                        )}`}
                      >
                        {band.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-gray-900 mt-2">
                      {p.carrier_name || '—'}{' '}
                      {p.policy_number ? <span className="text-gray-600 font-medium">({p.policy_number})</span> : null}
                    </div>

                    <div className="text-sm text-gray-700 mt-1">
                      Limits: {formatCurrency(p.policy_limit_per_person)} per person, {formatCurrency(p.policy_limit_per_occurrence)} per occurrence
                    </div>

                    {p.claim_number ? (
                      <div className="text-sm text-gray-600 mt-1">
                        Claim #: <span className="font-medium">{p.claim_number}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={verified}
                        disabled={verified}
                        onChange={() => handleVerifyPolicy(p.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {verified ? 'Verified' : 'Verify'}
                      </span>
                    </label>
                  </div>
                </div>

                {p.coverage_verified ? (
                  <div className="text-xs text-gray-500 mt-2">
                    Verified at {p.verification_date ? new Date(p.verification_date).toLocaleString() : '—'}{' '}
                    {p.verification_source ? `• Source: ${p.verification_source}` : ''}
                  </div>
                ) : null}

                {(p.adjuster_name || p.adjuster_phone || p.adjuster_email) && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Adjuster Contact
                    </div>
                    <div className="text-sm text-gray-800 mt-1">
                      {p.adjuster_name || '—'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-3">
                      {p.adjuster_phone ? (
                        <a className="text-indigo-700 hover:underline" href={`tel:${p.adjuster_phone}`}>
                          {p.adjuster_phone}
                        </a>
                      ) : null}
                      {p.adjuster_email ? (
                        <a className="text-indigo-700 hover:underline" href={`mailto:${p.adjuster_email}`}>
                          {p.adjuster_email}
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="text-indigo-700 hover:underline text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePolicy(p.id)}
                    className="text-red-600 hover:underline text-sm font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {modalMode === 'edit' ? 'Edit Policy' : 'Add Policy'}
                </h3>
                {autoDetected ? (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    Auto-detected from document. Review and adjust before saving.
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy Type</label>
                  <select
                    value={form.policyType}
                    onChange={(e) => setForm((prev) => ({ ...prev, policyType: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {POLICY_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Carrier</label>
                  <input
                    value={form.carrierName}
                    onChange={(e) => setForm((prev) => ({ ...prev, carrierName: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy #</label>
                  <input
                    value={form.policyNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, policyNumber: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Claim #</label>
                  <input
                    value={form.claimNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, claimNumber: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adjuster Name</label>
                  <input
                    value={form.adjusterName}
                    onChange={(e) => setForm((prev) => ({ ...prev, adjusterName: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adjuster Email</label>
                  <input
                    value={form.adjusterEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, adjusterEmail: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adjuster Phone</label>
                  <input
                    value={form.adjusterPhone}
                    onChange={(e) => setForm((prev) => ({ ...prev, adjusterPhone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limit / Person</label>
                  <input
                    value={form.policyLimitPerPerson}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, policyLimitPerPerson: e.target.value }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g. 25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limit / Occurrence</label>
                  <input
                    value={form.policyLimitPerOccurrence}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, policyLimitPerOccurrence: e.target.value }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalSaving ? 'Saving…' : modalMode === 'edit' ? 'Save Changes' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

