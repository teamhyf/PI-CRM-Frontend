import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

function formatISODate(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

const providerTypeLabel = (t) =>
  String(t || '')
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

const DOC_TYPES = [
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

const STATUS_STYLES = {
  pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
  reviewed: 'bg-green-100 text-green-800 border-green-200',
  incomplete: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS = {
  pending_review: 'Pending Review',
  reviewed: 'Reviewed',
  incomplete: 'Incomplete',
};

export function PortalDashboard() {
  const { token, claimant } = useClaimantAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [caseData, setCaseData] = useState(null);

  const [pathwayLoading, setPathwayLoading] = useState(false);
  const [pathwayError, setPathwayError] = useState('');
  const [pathway, setPathway] = useState(null);

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  const normalizedCaseStatus =
    typeof caseData?.status === 'string' && caseData.status.trim()
      ? caseData.status
      : 'new';

  const closureAvailable = ['settled', 'referred_out', 'closed'].includes(normalizedCaseStatus);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/case`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load case');
        if (!cancelled) setCaseData(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load case');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token || !caseData?.caseId) return;

      const caseIdNum = String(caseData.caseId).replace(/^CASE-/, '');
      if (!caseIdNum) return;

      setPathwayLoading(true);
      setPathwayError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/cases/${caseIdNum}/treatment-pathway`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load treatment pathway');
        if (!cancelled) setPathway(data);
      } catch (e) {
        if (!cancelled) setPathwayError(e.message || 'Failed to load treatment pathway');
      } finally {
        if (!cancelled) setPathwayLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token, caseData]);

  const fetchDocs = async () => {
    if (!token) return;
    setDocsLoading(true);
    setDocsError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load documents');
      setDocs(Array.isArray(data.documents) ? data.documents : []);
    } catch (e) {
      setDocsError(e.message || 'Failed to load documents');
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const base = getBaseUrl();
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('docType', uploadDocType);
      const res = await fetch(`${base}/api/portal/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadSuccess(`"${data.file_name}" uploaded successfully.`);
      setUploadFile(null);
      setUploadDocType('other');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocs();
    } catch (e) {
      setUploadError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-600 mt-1">
          {claimant?.fullName ? `${claimant.fullName} · ` : ''}{claimant?.email || ''}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Case Status</h2>

        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        ) : caseData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Case</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{caseData.caseId}</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Status</p>
              <p className="text-lg font-bold text-indigo-900 mt-1">
                {String(normalizedCaseStatus).replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accident type</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{caseData.accidentType || '—'}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of loss</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{formatISODate(caseData.dateOfLoss)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No case found.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Treatment Pathway</h2>
            <p className="text-sm text-gray-600">Based on your documented injuries.</p>
          </div>
          {pathway?.urgencyLevel && pathway.urgencyLevel !== 'routine' && (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                pathway.urgencyLevel === 'urgent'
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              {String(pathway.urgencyLevel).toUpperCase()}
            </span>
          )}
        </div>

        {pathwayLoading && <p className="text-sm text-gray-600 mt-3">Loading treatment pathway…</p>}
        {pathwayError && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mt-3">{pathwayError}</p>}

        {!pathwayLoading && !pathwayError && pathway && (
          <div className="mt-4 space-y-4">
            {pathway.introText ? (
              <>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{pathway.introText}</div>
                <div className="space-y-3">
                  {(pathway.suggestedProviderTypeList || []).map((t) => (
                    <div key={t} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="text-sm font-semibold text-gray-900">{providerTypeLabel(t)}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {pathway.providerDescriptions?.[t] || '—'}
                      </div>
                    </div>
                  ))}
                </div>
                {pathway.closingNote && (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap font-medium">
                    {pathway.closingNote}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-900">
                Suggested providers:{' '}
                <span className="font-semibold">
                  {(pathway.suggestedProviderTypeList || []).map(providerTypeLabel).join(', ') || '—'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* My Documents */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">My Documents</h2>
        <p className="text-sm text-gray-600 mb-5">
          Upload documents related to your case. Staff will review them.
        </p>

        {/* Upload form */}
        <form onSubmit={handleUpload} className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Document Type
              </label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                File <span className="text-gray-400">(max 25 MB)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          {uploadError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {uploadError}
            </p>
          )}
          {uploadSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {uploadSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={!uploadFile || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Document
              </>
            )}
          </button>
        </form>

        {/* Document list */}
        {docsLoading ? (
          <p className="text-sm text-gray-600">Loading documents…</p>
        ) : docsError ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {docsError}
          </p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {DOC_TYPES.find((t) => t.value === doc.document_type)?.label || doc.document_type}
                    {' · '}
                    {formatISODate(doc.uploaded_at)}
                    {' · '}
                    <span className={doc.uploaded_by === 'user' ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
                      {doc.uploaded_by === 'user' ? 'Uploaded by you' : 'Added by staff'}
                    </span>
                  </p>
                  {doc.ai_summary && (
                    <p className="text-xs text-gray-600 mt-1 italic">{doc.ai_summary}</p>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_STYLES[doc.document_status] || 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {STATUS_LABELS[doc.document_status] || doc.document_status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {closureAvailable ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Case Closure Summary</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your final case organization record is available for review.
          </p>
          <Link
            to="/portal/case-closure"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            View Closure Summary
          </Link>
        </div>
      ) : null}
    </div>
  );
}

