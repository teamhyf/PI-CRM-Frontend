import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProviderAuth } from '../../context/ProviderAuthContext';
import { LoadingBlock, LoadingInline } from '../../components/LoadingSpinner';

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

const DOC_TYPES = [
  { value: 'treatment_note', label: 'Treatment note' },
  { value: 'MRI_report', label: 'MRI report' },
  { value: 'bill', label: 'Bill' },
  { value: 'hospital_records', label: 'Hospital records' },
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

export function ProviderCaseDetail() {
  const { caseId: caseIdParam } = useParams();
  const targetCaseId = Number(caseIdParam);

  const { token, provider } = useProviderAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [caseData, setCaseData] = useState(null);

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState('other');
  const [uploadNote, setUploadNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  const [standaloneNote, setStandaloneNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteSuccess, setNoteSuccess] = useState('');

  const canLoad =
    token && Number.isFinite(targetCaseId) && targetCaseId > 0;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!canLoad) return;
      setLoading(true);
      setError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/provider-portal/cases/${targetCaseId}`, {
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
    load();
    return () => {
      cancelled = true;
    };
  }, [token, canLoad, targetCaseId]);

  const fetchDocs = async () => {
    if (!token || !canLoad) return;
    setDocsLoading(true);
    setDocsError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/provider-portal/cases/${targetCaseId}/documents`, {
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

  const fetchNotes = async () => {
    if (!token || !canLoad) return;
    setNotesLoading(true);
    setNotesError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/provider-portal/cases/${targetCaseId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load notes');
      setNotes(Array.isArray(data.notes) ? data.notes : []);
    } catch (e) {
      setNotesError(e.message || 'Failed to load notes');
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (canLoad && caseData) {
      fetchDocs();
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canLoad, targetCaseId, caseData?.caseId]);

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
      if (uploadNote.trim()) form.append('note', uploadNote.trim());
      const res = await fetch(`${base}/api/provider-portal/cases/${targetCaseId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadSuccess(`"${data.file_name}" uploaded successfully.`);
      setUploadFile(null);
      setUploadNote('');
      setUploadDocType('other');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocs();
      await fetchNotes();
    } catch (e) {
      setUploadError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleStandaloneNote = async (e) => {
    e.preventDefault();
    const body = standaloneNote.trim();
    if (!body) return;
    setNoteSaving(true);
    setNoteError('');
    setNoteSuccess('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/provider-portal/cases/${targetCaseId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send note');
      setStandaloneNote('');
      setNoteSuccess('Note sent to the case file.');
      await fetchNotes();
    } catch (e) {
      setNoteError(e.message || 'Failed to send note');
    } finally {
      setNoteSaving(false);
    }
  };

  if (!Number.isFinite(targetCaseId) || targetCaseId <= 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-red-800 font-medium">Invalid case link.</p>
        <Link to="/provider-portal/dashboard" className="inline-block mt-4 text-sm font-semibold text-indigo-700 hover:underline">
          ← Back to assigned cases
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <LoadingBlock message="Loading…" />
      </div>
    );
  }

  const normalizedCaseStatus =
    typeof caseData?.status === 'string' && caseData.status.trim() ? caseData.status : 'new';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          to="/provider-portal/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline w-fit"
        >
          <span aria-hidden>←</span> Assigned cases
        </Link>
        <p className="text-sm text-gray-600">Case #{targetCaseId}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-600 mt-1">
          {provider?.name ? `${provider.name} · ` : ''}
          {provider?.email || ''}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Case summary</h2>

        {loading ? (
          <LoadingInline message="Loading case details…" />
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
        ) : caseData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Case</p>
              <p className="text-lg font-bold text-gray-900 mt-1">#{caseData.caseId}</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Status</p>
              <p className="text-lg font-bold text-indigo-900 mt-1">
                {String(normalizedCaseStatus).replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Claimant</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{caseData.claimantDisplayName || '—'}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accident type</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {caseData.accidentType ? String(caseData.accidentType).replace(/_/g, ' ') : '—'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 md:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of loss</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{formatISODate(caseData.dateOfLoss)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No case found.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Upload documents</h2>
        <p className="text-sm text-gray-600 mb-5">Upload medical or billing records. Staff will review uploads.</p>

        <form onSubmit={handleUpload} className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Document type</label>
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Optional note (upload)</label>
            <textarea
              value={uploadNote}
              onChange={(e) => setUploadNote(e.target.value)}
              rows={2}
              placeholder="Short context for staff (optional)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {uploadError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
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
            {uploading ? 'Uploading…' : 'Upload document'}
          </button>
        </form>

        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Your uploads</h3>
        {docsLoading ? (
          <LoadingInline message="Loading documents…" />
        ) : docsError ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{docsError}</p>
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
                  </p>
                  {doc.ai_summary && <p className="text-xs text-gray-600 mt-1 italic">{doc.ai_summary}</p>}
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Notes to the case file</h2>
        <p className="text-sm text-gray-600 mb-4">Send a message without attaching a file. Visible to staff on the case.</p>

        <form onSubmit={handleStandaloneNote} className="space-y-3 mb-6">
          <textarea
            value={standaloneNote}
            onChange={(e) => setStandaloneNote(e.target.value)}
            rows={3}
            placeholder="Write a note…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {noteError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{noteError}</p>
          )}
          {noteSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {noteSuccess}
            </p>
          )}
          <button
            type="submit"
            disabled={!standaloneNote.trim() || noteSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {noteSaving ? 'Sending…' : 'Send note'}
          </button>
        </form>

        {notesLoading ? (
          <LoadingInline message="Loading notes…" />
        ) : notesError ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{notesError}</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                <p className="text-xs text-gray-500 mb-1">{formatISODate(n.sentAt)}</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
