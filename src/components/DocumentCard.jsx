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

export function DocumentCard({ doc, onDelete, onStatusChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

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

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <DocTypeIcon docType={doc.document_type} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">{doc.file_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label} · {uploadedAt}</div>
          {doc.ai_summary && (
            <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded px-2 py-1">
              <span className="font-semibold text-blue-700">AI: </span>{doc.ai_summary}
            </div>
          )}
        </div>
        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColorClass}`}>
          {doc.document_status?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
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
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
