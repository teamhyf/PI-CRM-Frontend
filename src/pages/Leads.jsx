import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeads } from '../services/leadsApi';
import { LeadDetailModal } from '../components/LeadDetailModal';

function formatISO(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

function badge(status) {
  if (status === 'new') return 'bg-yellow-100 text-yellow-800';
  if (status === 'under_review') return 'bg-blue-100 text-blue-800';
  if (status === 'converted') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

export function Leads() {
  const { token } = useAuth();
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLeads(token, filter);
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const name = (l.full_name || '').toLowerCase();
      const email = (l.email || '').toLowerCase();
      const type = (l.accident_type || '').toLowerCase();
      return name.includes(q) || email.includes(q) || type.includes(q) || String(l.id).includes(q);
    });
  }, [leads, query]);

  return (
    <div className="w-full px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Leads</h1>
          <p className="mt-2 text-gray-600 text-sm">
            Intake submissions appear here first. Convert a lead to create a real case.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLeads}
          className="btn-primary text-sm px-4 py-2"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex gap-2 flex-wrap">
            {['new', 'under_review', 'converted', 'rejected', 'all'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  filter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex-1 md:max-w-sm">
            <input
              className="input-field w-full"
              placeholder="Search by lead id, name, email, type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </div>
      ) : null}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Leads ({filtered.length})
          </h2>
        </div>
        <div className="w-full">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="w-56 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="w-52 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accident type</th>
                <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of loss</th>
                <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI score</th>
                <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-28 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(lead)}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">#{lead.id}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">{lead.full_name || '—'}</div>
                      <div className="text-xs text-gray-500 truncate">{lead.email || ''}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 truncate">{lead.accident_type || '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 truncate">{formatISO(lead.date_of_loss)}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.ai_viability_score != null ? `${lead.ai_viability_score}/100` : '—'}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full bg-blue-600"
                          style={{ width: `${Math.max(0, Math.min(100, Number(lead.ai_viability_score || 0)))}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge(lead.lead_status)}`}>
                        {lead.lead_status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline text-sm font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(lead);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await fetchLeads();
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}

