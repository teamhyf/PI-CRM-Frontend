import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentCard } from './DocumentCard';
import { LoadingInline } from './LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const VALID_DOC_TYPES = [
  { value: 'police_report', label: 'Police Report' },
  { value: 'vehicle_photos', label: 'Vehicle Photos' },
  { value: 'hospital_records', label: 'Hospital Records' },
  { value: 'declaration_page', label: 'Declaration Page' },
  { value: 'MRI_report', label: 'MRI Report' },
  { value: 'bill', label: 'Bill' },
  { value: 'treatment_note', label: 'Treatment Note' },
  { value: 'demand_packet', label: 'Demand Packet' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' },
];

function CompletenessBar({ score }) {
  const pct = Math.max(0, Math.min(100, Number(score || 0)));
  const colorClass =
    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-500';
  const labelClass =
    pct >= 80 ? 'text-green-700' : pct >= 60 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-800">Document Completeness</span>
        <span className={`text-sm font-bold ${labelClass}`}>{pct}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-3 ${colorClass} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-1">Green ≥ 80%, Yellow 60–79%, Red &lt; 60%</div>
    </div>
  );
}

export default function CaseDocumentsTab({
  caseId,
  apiPrefix = '/api',
  token: tokenOverride,
  allowStatusChange = true,
}) {
  const { token } = useAuth();
  const authToken = tokenOverride || token;
  const [documents, setDocuments] = useState([]);
  const [completenessScore, setCompletenessScore] = useState(0);
  const [missing, setMissing] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [nextActionPrompt, setNextActionPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('other');
  const [dragOver, setDragOver] = useState(false);
  const [suggestedValues, setSuggestedValues] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const base = getBaseUrl();
      const res = await fetch(`${base}${apiPrefix}/cases/${caseId}/documents`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load documents');

      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setCompletenessScore(Number(data.completenessScore || 0));
      setMissing(Array.isArray(data.missing) ? data.missing : []);
      setChecklist(data.checklist || null);
      setNextActionPrompt(data.nextActionPrompt || '');
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, authToken, caseId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setSuggestedValues(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', selectedDocType);

    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}${apiPrefix}/cases/${caseId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (data.suggestedValues) {
        setSuggestedValues(data.suggestedValues);
        if (
          data.suggestedValues &&
          (selectedDocType === 'declaration_page' || selectedDocType === 'correspondence') &&
          (data.suggestedValues.policyLimitPerPerson != null || data.suggestedValues.carrierName)
        ) {
          // Let CaseInsuranceTab pre-fill its "Add Policy" form.
          window.dispatchEvent(
            new CustomEvent('insuranceSuggestedValues', {
              detail: { caseId, suggestedValues: data.suggestedValues },
            })
          );
        }

        if (
          data.suggestedValues &&
          (selectedDocType === 'treatment_note' || selectedDocType === 'hospital_records') &&
          (data.suggestedValues.visitDate != null || data.suggestedValues.visitType != null)
        ) {
          // Let VisitsTimeline pre-fill its "Add Medical Visit" form.
          window.dispatchEvent(
            new CustomEvent('medicalVisitSuggestedValues', {
              detail: { caseId, suggestedValues: data.suggestedValues },
            })
          );
        }
      }
      await fetchDocuments();
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleStatusChange = async (docId, newStatus) => {
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}${apiPrefix}/documents/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      await fetchDocuments();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (docId) => {
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}${apiPrefix}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete document');
      }
      await fetchDocuments();
    } catch (err) {
      alert(err.message || 'Failed to delete document');
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Completeness bar */}
      <CompletenessBar score={completenessScore} />

      {/* Next action prompt (LLM-generated) */}
      {nextActionPrompt && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-200/70">
          <span className="text-blue-500 mt-0.5">💡</span>
          <span>{nextActionPrompt}</span>
        </div>
      )}

      {/* Missing docs alert */}
      {missing.length > 0 && (
        <div className="bg-red-50 rounded-lg px-4 py-3 ring-1 ring-red-200/70">
          <div className="text-sm font-semibold text-red-800 mb-1">Missing required documents</div>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
            {missing.map((m) => (
              <li key={m}>{m.replace(/_/g, ' ')}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI-suggested values banner */}
      {suggestedValues && (
        <div className="bg-amber-50 rounded-lg px-4 py-3 ring-1 ring-amber-200/70">
          <div className="text-sm font-semibold text-amber-800 mb-1">
            AI extracted the following from your document (confidence {suggestedValues.confidence}%)
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-amber-900">
            {suggestedValues.providerName && (
              <div><span className="font-medium">Provider:</span> {suggestedValues.providerName}</div>
            )}
            {suggestedValues.incidentDate && (
              <div><span className="font-medium">Incident date:</span> {suggestedValues.incidentDate}</div>
            )}
            {suggestedValues.billedAmount != null && (
              <div><span className="font-medium">Billed amount:</span> ${suggestedValues.billedAmount}</div>
            )}
            {suggestedValues.policyNumber && (
              <div><span className="font-medium">Policy #:</span> {suggestedValues.policyNumber}</div>
            )}
            {suggestedValues.diagnoses?.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium">Diagnoses:</span> {suggestedValues.diagnoses.join(', ')}
              </div>
            )}
            {suggestedValues.visitDate && (
              <div><span className="font-medium">Visit date:</span> {suggestedValues.visitDate}</div>
            )}
            {suggestedValues.visitType && (
              <div><span className="font-medium">Visit type:</span> {suggestedValues.visitType}</div>
            )}
            {suggestedValues.diagnosisSummary && (
              <div className="col-span-2">
                <span className="font-medium">Diagnosis summary:</span> {suggestedValues.diagnosisSummary}
              </div>
            )}
          </div>
          <div className="text-xs text-amber-700 mt-2 italic">
            Review these values with the claimant before saving to the case.
          </div>
          <button
            type="button"
            onClick={() => setSuggestedValues(null)}
            className="mt-1 text-xs text-amber-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload zone */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 bg-white ring-1 ring-slate-200/90 focus:outline-none focus:ring-2 focus:ring-lime-400/45"
          >
            {VALID_DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Choose File'}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-3xl mb-1">📁</div>
          <div className="text-sm text-gray-600">
            Drag and drop a file here, or click to browse
          </div>
          <div className="text-xs text-gray-400 mt-1">Max 25 MB</div>
        </div>

        {uploadError && (
          <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 ring-1 ring-red-200/70">
            {uploadError}
          </div>
        )}
      </div>

      {/* Errors */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 ring-1 ring-red-200/70">
          {error}
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="py-4">
          <LoadingInline message="Loading documents…" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">No documents uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              showStatusDropdown={allowStatusChange}
            />
          ))}
        </div>
      )}

      {/* LLM checklist */}
      {checklist?.requiredDocuments?.length > 0 && (
        <div className="rounded-xl bg-white p-3.5 space-y-2 shadow-sm ring-1 ring-slate-100/90">
          <div className="text-sm font-semibold text-gray-900 mb-2">Recommended Documents</div>
          {checklist.requiredDocuments
            .filter((d) => !d.alreadyUploaded)
            .map((d) => (
              <div key={d.documentType} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                  d.priority === 'critical'
                    ? 'bg-red-500'
                    : d.priority === 'important'
                      ? 'bg-amber-400'
                      : 'bg-blue-400'
                }`} />
                <div>
                  <span className="font-medium capitalize">{d.documentType.replace(/_/g, ' ')}</span>
                  {d.reason && <span className="text-gray-500"> — {d.reason}</span>}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
