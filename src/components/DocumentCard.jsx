import { useState } from 'react';

const DOC_TYPE_LABELS = {
  police_report: 'Police Report',
  vehicle_photos: 'Vehicle Photos',
  hospital_records: 'Hospital Records',
  declaration_page: 'Declaration Page',
  MRI_report: 'MRI Report',
  bill: 'Bill',
  treatment_note: 'Treatment Note',
  demand_packet: 'Demand Packet',
  correspondence: 'Correspondence',
  other: 'Other',
};

const STATUS_COLORS = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-green-100 text-green-800',
  incomplete: 'bg-red-100 text-red-800',
};

function formatStatusLabel(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DocTypeIcon({ docType }) {
  const icons = {
    police_report: '🚔',
    vehicle_photos: '🚗',
    hospital_records: '🏥',
    declaration_page: '📄',
    MRI_report: '🧠',
    bill: '💵',
    treatment_note: '📋',
    demand_packet: '📦',
    correspondence: '✉️',
    other: '📎',
  };
  return <span className="text-2xl">{icons[docType] || '📎'}</span>;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path
        d="M12 4v10m0 0 4-4m-4 4-4-4M4 19h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5h6v2m-8 0 1 12h8l1-12M10 11v5m4-5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DocumentCard({
  doc,
  onDelete,
  onStatusChange,
  onAiSummaryReview,
  onView,
  onDownload,
  actionLoading = false,
  showStatusDropdown = true,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [summaryReviewLoading, setSummaryReviewLoading] = useState(false);
  const [editSummaryMode, setEditSummaryMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState(doc.ai_summary_final || doc.ai_summary || '');

  const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type;
  const statusColorClass = STATUS_COLORS[doc.document_status] || 'bg-gray-100 text-gray-700';
  const uploadedAt = doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—';

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await onStatusChange(doc.id, newStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleApproveSummary = async () => {
    if (!onAiSummaryReview) return;
    setSummaryReviewLoading(true);
    try {
      await onAiSummaryReview(doc.id, { status: 'approved' });
      setEditSummaryMode(false);
    } finally {
      setSummaryReviewLoading(false);
    }
  };

  const handleSaveEditedSummary = async () => {
    if (!onAiSummaryReview) return;
    const value = String(editedSummary || '').trim();
    if (!value) return;
    setSummaryReviewLoading(true);
    try {
      await onAiSummaryReview(doc.id, { status: 'edited', reviewedSummary: value });
      setEditSummaryMode(false);
    } finally {
      setSummaryReviewLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <DocTypeIcon docType={doc.document_type} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">{doc.file_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label} · {uploadedAt}</div>
          {doc.ai_summary && (
            <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded px-2 py-1">
              <span className="font-semibold text-blue-700">AI: </span>{doc.ai_summary_final || doc.ai_summary}
              {showStatusDropdown && (
                <span className="ml-2 inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {formatStatusLabel(doc.ai_summary_review_status || 'pending_review')}
                </span>
              )}
            </div>
          )}
          {doc.ai_summary && showStatusDropdown && (
            <div className="mt-2 space-y-2">
              {editSummaryMode ? (
                <div className="space-y-2">
                  <textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="Edit AI summary (key findings only)"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEditedSummary}
                      disabled={summaryReviewLoading || actionLoading || !String(editedSummary || '').trim()}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditSummaryMode(false);
                        setEditedSummary(doc.ai_summary_final || doc.ai_summary || '');
                      }}
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApproveSummary}
                    disabled={summaryReviewLoading || actionLoading}
                    className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSummaryMode(true)}
                    disabled={summaryReviewLoading || actionLoading}
                    className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Edit AI
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColorClass}`}>
          {formatStatusLabel(doc.document_status)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {showStatusDropdown ? (
          <select
            value={doc.document_status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusLoading}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="pending_review">Pending Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="incomplete">Incomplete</option>
          </select>
        ) : (
          <div className="text-xs text-gray-500"> </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onView?.(doc)}
            aria-label="View document"
            title="View"
            className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            <EyeIcon />
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => onDownload?.(doc)}
            aria-label="Download document"
            title="Download"
            className="inline-flex items-center justify-center text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <DownloadIcon />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Delete?</span>
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete document"
              title="Delete"
              className="inline-flex items-center justify-center text-red-500 hover:text-red-600"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
