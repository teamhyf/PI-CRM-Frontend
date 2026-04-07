import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';
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

export function PortalCaseDetail() {
  const { claimantId: claimantIdParam } = useParams();
  const targetClaimantId = Number(claimantIdParam);

  const { token, claimant, switchCase, loading: authLoading, cases } = useClaimantAuth();
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(true);

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

  const [fullDetail, setFullDetail] = useState(null);
  const [fullDetailLoading, setFullDetailLoading] = useState(false);
  const [fullDetailError, setFullDetailError] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editInjury, setEditInjury] = useState('');
  const [editLiability, setEditLiability] = useState('');
  const [savingCase, setSavingCase] = useState(false);
  const [saveCaseError, setSaveCaseError] = useState('');
  const [saveCaseOk, setSaveCaseOk] = useState(false);

  useEffect(() => {
    setCaseData(null);
    setPathway(null);
    setPathwayError('');
    setError('');
    setDocs([]);
  }, [targetClaimantId]);

  useEffect(() => {
    let cancelled = false;
    setSyncError('');

    if (!Number.isFinite(targetClaimantId) || targetClaimantId <= 0) {
      setSyncing(false);
      setSyncError('Invalid case link.');
      return undefined;
    }

    if (!token) {
      setSyncing(false);
      return undefined;
    }

    const allowed = new Set((cases || []).map((c) => c.claimantId));
    if (cases.length > 0 && !allowed.has(targetClaimantId)) {
      setSyncing(false);
      setSyncError('You do not have access to this case.');
      return undefined;
    }

    (async () => {
      if (claimant?.id === targetClaimantId) {
        if (!cancelled) setSyncing(false);
        return;
      }
      try {
        setSyncing(true);
        await switchCase(targetClaimantId);
      } catch (e) {
        if (!cancelled) setSyncError(e.message || 'Unable to open this case.');
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // switchCase is stable enough for effect; omit from deps to avoid identity churn loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, targetClaimantId, claimant?.id, cases]);

  const normalizedCaseStatus =
    typeof caseData?.status === 'string' && caseData.status.trim()
      ? caseData.status
      : 'new';

  const closureAvailable = ['settled', 'referred_out', 'closed'].includes(normalizedCaseStatus);

  const canLoadCase =
    token &&
    !syncError &&
    !syncing &&
    !authLoading &&
    claimant?.id === targetClaimantId &&
    Number.isFinite(targetClaimantId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!canLoadCase) return;
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
    load();
    return () => {
      cancelled = true;
    };
  }, [token, canLoadCase]);

  useEffect(() => {
    let cancelled = false;
    if (!canLoadCase) return undefined;
    (async () => {
      setFullDetailLoading(true);
      setFullDetailError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/full-detail`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load full case');
        if (!cancelled) {
          setFullDetail(data);
          setEditNotes(data.notes ?? '');
          setEditInjury(data.injury_summary ?? '');
          setEditLiability(data.liability_summary ?? '');
        }
      } catch (e) {
        if (!cancelled) setFullDetailError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setFullDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, canLoadCase]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!canLoadCase || !caseData?.caseId) return;

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
  }, [token, canLoadCase, caseData]);

  const fetchDocs = async () => {
    if (!token || !canLoadCase) return;
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
    if (canLoadCase) fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canLoadCase]);

  const handleSaveCaseInfo = async (e) => {
    e.preventDefault();
    if (!fullDetail?.id) return;
    setSavingCase(true);
    setSaveCaseError('');
    setSaveCaseOk(false);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${fullDetail.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: editNotes,
          injury_summary: editInjury,
          liability_summary: editLiability,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaveCaseOk(true);
      setFullDetail((prev) =>
        prev
          ? {
              ...prev,
              notes: editNotes,
              injury_summary: editInjury,
              liability_summary: editLiability,
            }
          : prev
      );
    } catch (err) {
      setSaveCaseError(err.message || 'Save failed');
    } finally {
      setSavingCase(false);
    }
  };

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

  if (syncError) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <p className="text-sm text-red-800 font-medium">{syncError}</p>
          <Link
            to="/portal/dashboard"
            className="inline-block mt-4 text-sm font-semibold text-indigo-700 hover:underline"
          >
            ← Back to my cases
          </Link>
        </div>
      </div>
    );
  }

  if (syncing || authLoading || !claimant || claimant.id !== targetClaimantId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <LoadingBlock message="Loading case…" />
      </div>
    );
  }

  const activeCaseRow = cases.find((c) => c.claimantId === targetClaimantId);
  const activeCaseLabel =
    activeCaseRow?.caseId != null ? `Case #${activeCaseRow.caseId}` : 'Case details';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          to="/portal/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline w-fit"
        >
          <span aria-hidden>←</span> All my cases
        </Link>
        <p className="text-sm text-gray-600">{activeCaseLabel}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-600 mt-1">
          {claimant?.fullName ? `${claimant.fullName} · ` : ''}
          {claimant?.email || ''}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Case Status</h2>

        {loading ? (
          <LoadingInline message="Loading case details…" />
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">Case record</h2>
        <p className="text-sm text-gray-600 mb-4">
          Same information your legal team sees for this matter. Update the narrative fields below as your situation
          changes.
        </p>

        {fullDetailLoading ? (
          <LoadingInline message="Loading case record…" />
        ) : fullDetailError ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">{fullDetailError}</p>
        ) : fullDetail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">AI viability</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {fullDetail.ai_viability_score != null ? `${fullDetail.ai_viability_score}/100` : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Risk score</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {fullDetail.risk_score != null ? `${fullDetail.risk_score}/100` : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Severity (est.)</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {fullDetail.estimated_severity_score != null ? `${fullDetail.estimated_severity_score}/100` : '—'}
                </p>
              </div>
            </div>

            {fullDetail.ai_summary ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">AI summary</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap border border-gray-100 rounded-xl p-3 bg-gray-50/80">
                  {fullDetail.ai_summary}
                </p>
              </div>
            ) : null}

            {Array.isArray(fullDetail.injuries) && fullDetail.injuries.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Injuries on file</p>
                <ul className="space-y-2">
                  {fullDetail.injuries.map((inj) => (
                    <li key={inj.id} className="text-sm border border-gray-100 rounded-lg p-3 bg-white">
                      <span className="font-medium text-gray-900">
                        {[inj.body_part, inj.symptom_type].filter(Boolean).join(' · ') || 'Injury'}
                      </span>
                      {inj.severity_level ? (
                        <span className="text-gray-600"> · {String(inj.severity_level).replace(/_/g, ' ')}</span>
                      ) : null}
                      {inj.notes ? <p className="text-gray-600 mt-1 text-xs">{inj.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(fullDetail.policies) && fullDetail.policies.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Insurance policies</p>
                <ul className="space-y-2 text-sm text-gray-800">
                  {fullDetail.policies.map((p) => (
                    <li key={p.id} className="border border-gray-100 rounded-lg p-3">
                      {p.carrier_name || 'Policy'} {p.policy_number ? `· #${p.policy_number}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <form onSubmit={handleSaveCaseInfo} className="space-y-4 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Liability / accident narrative</label>
                <textarea
                  value={editLiability}
                  onChange={(e) => setEditLiability(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injury narrative</label>
                <textarea
                  value={editInjury}
                  onChange={(e) => setEditInjury(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {saveCaseError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveCaseError}</p>
              ) : null}
              {saveCaseOk ? (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  Saved. Your legal team can review updates.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={savingCase}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingCase ? 'Saving…' : 'Save updates'}
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No extended record available.</p>
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

        {pathwayLoading && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
            <LoadingInline message="Loading treatment pathway…" />
          </div>
        )}
        {pathwayError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mt-3">{pathwayError}</p>
        )}

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
                  <div className="text-sm text-gray-900 whitespace-pre-wrap font-medium">{pathway.closingNote}</div>
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">My Documents</h2>
        <p className="text-sm text-gray-600 mb-5">Upload documents related to your case. Staff will review them.</p>

        <form onSubmit={handleUpload} className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Document Type</label>
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
            {uploading ? 'Uploading…' : 'Upload Document'}
          </button>
        </form>

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
                    {' · '}
                    <span
                      className={doc.uploaded_by === 'user' ? 'text-indigo-600 font-medium' : 'text-gray-400'}
                    >
                      {doc.uploaded_by === 'user' ? 'Uploaded by you' : 'Added by staff'}
                    </span>
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

      {closureAvailable ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Case Closure Summary</h2>
          <p className="text-sm text-gray-600 mb-4">Your final case organization record is available for review.</p>
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
