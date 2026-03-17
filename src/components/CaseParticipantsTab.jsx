import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export default function CaseParticipantsTab({ caseId, participants, onChanged }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    role: 'claimant',
    fullName: '',
    phone: '',
    email: '',
    insuranceCarrier: '',
    policyNumber: '',
    vehicleInfo: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/cases/${caseId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create participant');
      }
      setForm({
        role: 'claimant',
        fullName: '',
        phone: '',
        email: '',
        insuranceCarrier: '',
        policyNumber: '',
        vehicleInfo: '',
        notes: '',
      });
      onChanged?.();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create participant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this participant?')) return;
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/cases/${caseId}/participants/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete participant');
      }
      onChanged?.();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete participant');
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="claimant">Claimant</option>
              <option value="driver">Driver</option>
              <option value="passenger">Passenger</option>
              <option value="adverse_driver">Adverse Driver</option>
              <option value="witness">Witness</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Insurance Carrier</label>
            <input
              name="insuranceCarrier"
              value={form.insuranceCarrier}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Policy Number</label>
            <input
              name="policyNumber"
              value={form.policyNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle Info</label>
            <textarea
              name="vehicleInfo"
              value={form.vehicleInfo}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add Participant'}
        </button>
      </form>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Existing Participants</h3>
        {participants.length === 0 ? (
          <p className="text-sm text-gray-500">No participants added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Role</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Contact</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Insurance</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2 capitalize">{p.role.replace('_', ' ')}</td>
                    <td className="px-4 py-2">{p.full_name}</td>
                    <td className="px-4 py-2">
                      <div>{p.phone}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div>{p.insurance_carrier}</div>
                      <div className="text-xs text-gray-500">{p.policy_number}</div>
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

