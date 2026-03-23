import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { TableLoadingRow } from '../components/LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

export function Cases() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [cases, setCases] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }

  useEffect(() => {
    fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, page]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const base = getBaseUrl();
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      params.set('limit', '20');
      params.set('offset', String((page - 1) * 20));
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`${base}/api/cases${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error(data.error || 'Failed to load cases');
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading cases:', err);
      setLoadError(err.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const filtered = cases.filter((c) =>
    !searchTerm ||
    c.accident_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDeleteConfirm = (caseId, accidentType) => {
    setConfirmDelete({ id: caseId, label: accidentType || `#${caseId}` });
  };

  const executeDelete = async () => {
    const caseId = confirmDelete?.id;
    setConfirmDelete(null);
    if (!caseId) return;

    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/cases/${caseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete case');
      setCases((prev) => prev.filter((c) => c.id !== caseId));
      success(`Case #${caseId} has been permanently deleted.`, 'Case Deleted');
    } catch (err) {
      console.error('Error deleting case:', err);
      toastError(err.message || 'Failed to delete case', 'Delete Failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="mt-1 text-gray-600">View and manage all PI cases.</p>
        </div>
        <Link to="/intake" className="btn-primary">
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Case Intake
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by accident type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Statuses</option>
          <option value="qualified">Qualified</option>
          <option value="accepted">Accepted</option>
          <option value="docs_pending">Docs Pending</option>
          <option value="in_treatment">In Treatment</option>
          <option value="demand_ready">Demand Ready</option>
          <option value="settled">Settled</option>
        </select>
      </div>

      {loadError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">
          {loadError}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete case "${confirmDelete?.label}"?`}
        message={`This permanently removes the case, all documents, participants, injuries, and uploaded files.\nThe original lead will be restored to "new" status.\n\nThis cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Case ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Client</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Accident Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Severity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Risk</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableLoadingRow colSpan={8} message="Loading cases…" />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-6 text-center text-gray-500">
                  No cases found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">#{c.id}</td>
                  <td className="px-6 py-4 text-sm">
                    {c.claimant_first_name || c.claimant_last_name
                      ? `${c.claimant_first_name || ''} ${c.claimant_last_name || ''}`.trim()
                      : <span className="text-gray-400">—</span>}
                    {c.claimant_phone && (
                      <p className="text-xs text-gray-400 mt-0.5">{c.claimant_phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{c.accident_type}</td>
                  <td className="px-6 py-4 text-sm">
                    {c.date_of_loss ? new Date(c.date_of_loss).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {(() => {
                      const rawEstimated = Number(c.estimated_severity_score);
                      const rawRisk = Number(c.risk_score);

                      // If estimated severity is missing/0, fall back to risk_score for a non-empty bar.
                      const sevPct =
                        Number.isFinite(rawEstimated) && rawEstimated > 0
                          ? Math.max(0, Math.min(100, rawEstimated))
                          : Math.max(0, Math.min(100, Number.isFinite(rawRisk) ? rawRisk : 0));

                      return (
                        <div className="space-y-1">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${sevPct}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">{sevPct}%</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        (c.risk_score || 0) > 150
                          ? 'bg-red-100 text-red-800'
                          : (c.risk_score || 0) > 100
                            ? 'bg-orange-100 text-orange-800'
                            : (c.risk_score || 0) >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {c.risk_score || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {(() => {
                      const normalizedStatus =
                        typeof c.status === 'string' && c.status.trim() ? c.status : 'new';

                      return (
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        normalizedStatus === 'qualified'
                          ? 'bg-indigo-100 text-indigo-800'
                          : normalizedStatus === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : normalizedStatus === 'docs_pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : normalizedStatus === 'in_treatment'
                          ? 'bg-blue-100 text-blue-800'
                          : normalizedStatus === 'demand_ready'
                          ? 'bg-orange-100 text-orange-800'
                          : normalizedStatus === 'settled'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {String(normalizedStatus).replace(/_/g, ' ').toUpperCase()}
                    </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/cases/${c.id}`)}
                        title="View case"
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(c.id, c.accident_type)}
                        title="Delete case"
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Previous
        </button>
        <span className="px-4 py-2">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Next
        </button>
      </div>
    </div>
  );
}

