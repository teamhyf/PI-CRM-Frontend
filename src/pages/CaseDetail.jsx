import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CaseParticipantsTab from '../components/CaseParticipantsTab';
import CaseInjuriesTab from '../components/CaseInjuriesTab';
import CaseInsuranceTab from '../components/CaseInsuranceTab';
import CaseDocumentsTab from '../components/CaseDocumentsTab';
import CaseRedFlagsTab from '../components/CaseRedFlagsTab';
import CaseTimelineTab from '../components/CaseTimelineTab';

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
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Case #{caseData.id}</h1>
          <span
            className={`px-3 py-1 rounded-full font-semibold text-sm ${
              caseData.status === 'accepted'
                ? 'bg-green-100 text-green-800'
                : caseData.status === 'new'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {caseData.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        <p className="text-gray-600 mt-1">
          {caseData.accident_type} |{' '}
          {caseData.date_of_loss ? new Date(caseData.date_of_loss).toLocaleDateString() : 'No date'}
        </p>
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
      </div>
    </div>
  );
}

