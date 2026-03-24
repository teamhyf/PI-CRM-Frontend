import { Link } from 'react-router-dom';
import { useProviderAuth } from '../../context/ProviderAuthContext';
import { LoadingBlock } from '../../components/LoadingSpinner';

function formatISODate(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

function statusLabel(status) {
  if (!status) return '—';
  return String(status).replace(/_/g, ' ');
}

export function ProviderDashboard() {
  const { provider, cases, loading, fetchCases } = useProviderAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-600 mt-1">
          {provider?.name ? `${provider.name} · ` : ''}
          {provider?.email || ''}
        </p>
        <p className="text-sm text-gray-600 mt-3">
          Cases listed here are assigned to your organization via referrals or visits. Select a case to upload records
          or leave a note.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assigned cases</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {cases.length === 1 ? '1 case assigned.' : `${cases.length} cases assigned.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchCases()}
            className="text-sm font-semibold text-indigo-700 hover:underline self-start"
          >
            Refresh list
          </button>
        </div>

        {loading ? (
          <LoadingBlock message="Loading cases…" className="p-8" />
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-600">
            No cases are assigned yet. When the firm links you to a referral or visit, cases will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Case</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 hidden sm:table-cell">Claimant</th>
                  <th className="px-6 py-3 hidden sm:table-cell">Accident type</th>
                  <th className="px-6 py-3 hidden md:table-cell">Date of loss</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((c) => (
                  <tr key={c.caseId} className="hover:bg-gray-50/80">
                    <td className="px-6 py-4 font-semibold text-gray-900">#{c.caseId}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100 px-2.5 py-1 text-xs font-semibold capitalize">
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 hidden sm:table-cell">
                      {c.claimantDisplayName || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 hidden sm:table-cell">
                      {c.accidentType ? String(c.accidentType).replace(/_/g, ' ') : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 hidden md:table-cell">
                      {formatISODate(c.dateOfLoss)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/provider-portal/case/${c.caseId}`}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                      >
                        View
                      </Link>
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
