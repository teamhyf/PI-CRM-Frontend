import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export default function CaseInsuranceTab({ caseId, policies, onChanged }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    participantId: '',
    policyType: 'bodily_injury',
    carrierName: '',
    policyNumber: '',
    claimNumber: '',
    adjusterName: '',
    adjusterEmail: '',
    adjusterPhone: '',
    policyLimitPerPerson: '',
    policyLimitPerOccurrence: '',
    coverageVerified: false,
    verificationSource: '',
    verificationDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const base = getBaseUrl();
      const body = {
        ...form,
        participantId: form.participantId ? Number(form.participantId) : null,
        policyLimitPerPerson: form.policyLimitPerPerson
          ? Number(form.policyLimitPerPerson)
          : null,
        policyLimitPerOccurrence: form.policyLimitPerOccurrence
          ? Number(form.policyLimitPerOccurrence)
          : null,
      };
      const res = await fetch(`${base}/api/cases/${caseId}/insurance-policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create policy');
      }
      setForm({
        participantId: '',
        policyType: 'bodily_injury',
        carrierName: '',
        policyNumber: '',
        claimNumber: '',
        adjusterName: '',
        adjusterEmail: '',
        adjusterPhone: '',
        policyLimitPerPerson: '',
        policyLimitPerOccurrence: '',
        coverageVerified: false,
        verificationSource: '',
        verificationDate: '',
      });
      onChanged?.();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this policy?')) return;
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/cases/${caseId}/insurance-policies/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete policy');
      }
      onChanged?.();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete policy');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Policy Type</label>
            <select
              name="policyType"
              value={form.policyType}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="bodily_injury">Bodily Injury</option>
              <option value="property_damage">Property Damage</option>
              <option value="medpay">MedPay</option>
              <option value="uim_um">UIM / UM</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Carrier</label>
            <input
              name="carrierName"
              value={form.carrierName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Policy #</label>
            <input
              name="policyNumber"
              value={form.policyNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Claim #</label>
            <input
              name="claimNumber"
              value={form.claimNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Adjuster Name</label>
            <input
              name="adjusterName"
              value={form.adjusterName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Adjuster Email</label>
            <input
              name="adjusterEmail"
              value={form.adjusterEmail}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Adjuster Phone</label>
            <input
              name="adjusterPhone"
              value={form.adjusterPhone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Limit / Person</label>
            <input
              name="policyLimitPerPerson"
              value={form.policyLimitPerPerson}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="e.g. 25000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Limit / Occurrence</label>
            <input
              name="policyLimitPerOccurrence"
              value={form.policyLimitPerOccurrence}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="e.g. 50000"
            />
          </div>
          <div className="flex items-center mt-6">
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                name="coverageVerified"
                checked={form.coverageVerified}
                onChange={handleChange}
                className="mr-2"
              />
              Coverage verified
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Verification Source</label>
            <input
              name="verificationSource"
              value={form.verificationSource}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="e.g. phone call with adjuster"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Verification Date</label>
            <input
              type="datetime-local"
              name="verificationDate"
              value={form.verificationDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add Policy'}
        </button>
      </form>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Policies</h3>
        {policies.length === 0 ? (
          <p className="text-sm text-gray-500">No policies recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Carrier</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Policy / Claim</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Limits</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Verification</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2">{p.policy_type}</td>
                    <td className="px-4 py-2">{p.carrier_name}</td>
                    <td className="px-4 py-2">
                      <div>{p.policy_number}</div>
                      <div className="text-xs text-gray-500">{p.claim_number}</div>
                    </td>
                    <td className="px-4 py-2">
                      {p.policy_limit_per_person != null && (
                        <div>Per person: ${Number(p.policy_limit_per_person).toLocaleString()}</div>
                      )}
                      {p.policy_limit_per_occurrence != null && (
                        <div>Per occ.: ${Number(p.policy_limit_per_occurrence).toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        {p.coverage_verified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not verified
                          </span>
                        )}
                      </div>
                      {p.verification_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(p.verification_date).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

