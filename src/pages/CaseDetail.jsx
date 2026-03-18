import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CaseParticipantsTab from '../components/CaseParticipantsTab';
import CaseInjuriesTab from '../components/CaseInjuriesTab';
import CaseInsuranceTab from '../components/CaseInsuranceTab';
import CaseDocumentsTab from '../components/CaseDocumentsTab';
import CaseRedFlagsTab from '../components/CaseRedFlagsTab';
import CaseTimelineTab from '../components/CaseTimelineTab';
import ReferralPanel from '../components/ReferralPanel';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

function CaseOverviewTab({ data }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Jurisdiction State</label>
          <p className="text-gray-900 mt-1">{data.jurisdiction_state || 'Not set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Statute Deadline</label>
          <p className="text-gray-900 mt-1">
            {data.statute_deadline ? new Date(data.statute_deadline).toLocaleDateString() : 'Not set'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estimated Severity</label>
          <p className="text-gray-900 mt-1">{data.estimated_severity_score}/100</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Risk Score</label>
          <p className="text-gray-900 mt-1">{data.risk_score}/100</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Liability Summary</label>
        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
          {data.liability_summary || 'No summary'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Injury Summary</label>
        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
          {data.injury_summary || 'No summary'}
        </p>
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCaseDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/cases/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load case');
      }
      setCaseData(data);
    } catch (err) {
      console.error('Error loading case detail:', err);
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !caseData) {
    return <div className="p-6">Loading...</div>;
  }

  if (error && !caseData) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  if (!caseData) return <div className="p-6">No case found.</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'participants', label: 'Participants' },
    { id: 'injuries', label: 'Injuries' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'documents', label: 'Documents' },
    { id: 'red-flags', label: 'Red Flags' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'treatment-routing', label: 'Treatment Routing' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Case #{caseData.id}</h1>
            <p className="text-gray-600 mt-1">
              {caseData.accident_type} |{' '}
              {caseData.date_of_loss ? new Date(caseData.date_of_loss).toLocaleDateString() : 'No date'}
            </p>

            {/* Claimant info */}
            {caseData.claimant && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">
                    {[caseData.claimant.first_name, caseData.claimant.last_name].filter(Boolean).join(' ') || '—'}
                  </span>
                </div>
                {caseData.claimant.phone && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {caseData.claimant.phone}
                  </div>
                )}
                {caseData.claimant.email && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {caseData.claimant.email}
                  </div>
                )}
              </div>
            )}
          </div>

          <span
            className={`flex-shrink-0 px-3 py-1 rounded-full font-semibold text-sm ${
              (typeof caseData.status === 'string' && caseData.status.trim() ? caseData.status : 'new') === 'qualified'
                ? 'bg-indigo-100 text-indigo-800'
                : (typeof caseData.status === 'string' && caseData.status.trim() ? caseData.status : 'new') === 'accepted'
                ? 'bg-green-100 text-green-800'
                : (typeof caseData.status === 'string' && caseData.status.trim() ? caseData.status : 'new') === 'docs_pending'
                ? 'bg-yellow-100 text-yellow-800'
                : (typeof caseData.status === 'string' && caseData.status.trim() ? caseData.status : 'new') === 'in_treatment'
                ? 'bg-blue-100 text-blue-800'
                : (typeof caseData.status === 'string' && caseData.status.trim() ? caseData.status : 'new') === 'demand_ready'
                ? 'bg-orange-100 text-orange-800'
                : (typeof caseData.status === 'string' && caseData.status.trim() ? caseData.status : 'new') === 'settled'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {String(
              typeof caseData.status === 'string' && caseData.status.trim() ? caseData.status : 'new'
            ).replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'overview' && <CaseOverviewTab data={caseData} />}
        {activeTab === 'participants' && (
          <CaseParticipantsTab
            caseId={caseData.id}
            participants={caseData.participants || []}
            onChanged={fetchCaseDetail}
          />
        )}
        {activeTab === 'injuries' && (
          <CaseInjuriesTab
            caseId={caseData.id}
            injuries={caseData.injuries || []}
            onChanged={fetchCaseDetail}
          />
        )}
        {activeTab === 'insurance' && (
          <CaseInsuranceTab
            caseId={caseData.id}
            policies={caseData.policies || []}
            onChanged={fetchCaseDetail}
          />
        )}
        {activeTab === 'documents' && (
          <CaseDocumentsTab
            caseId={caseData.id}
          />
        )}
        {activeTab === 'red-flags' && (
          <CaseRedFlagsTab
            caseId={caseData.id}
            flags={caseData.redFlags || []}
          />
        )}
        {activeTab === 'timeline' && (
          <CaseTimelineTab caseId={caseData.id} />
        )}
        {activeTab === 'treatment-routing' && (
          <ReferralPanel caseId={caseData.id} injuries={caseData.injuries || []} />
        )}
      </div>
    </div>
  );
}

