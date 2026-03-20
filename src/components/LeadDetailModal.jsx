import { useState } from 'react';
import { activatePortal, convertLead, deleteLead, updateLeadStatus } from '../services/leadsApi';
import { useAuth } from '../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

export function LeadDetailModal({ lead, onClose, onChanged }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [portalCreds, setPortalCreds] = useState(null);

  const canConvert = lead?.lead_status === 'new' || lead?.lead_status === 'under_review';

  const handleStatus = async (status) => {
    if (!lead?.id) return;
    setBusy(true);
    setError('');
    try {
      await updateLeadStatus(token, lead.id, status);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const handleConvert = async () => {
    if (!lead?.id) return;
    setBusy(true);
    setError('');
    try {
      await convertLead(token, lead.id);
      setPortalCreds(null);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Failed to convert lead');
    } finally {
      setBusy(false);
    }
  };

  const handleActivatePortal = async () => {
    if (!lead?.id) return;
    setBusy(true);
    setError('');
    setPortalCreds(null);
    try {
      const res = await activatePortal(token, lead.id);
      setPortalCreds(res);
    } catch (e) {
      setError(e.message || 'Failed to activate portal');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!lead?.id) return;
    if (!window.confirm(`Delete lead #${lead.id}? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteLead(token, lead.id);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Failed to delete lead');
    } finally {
      setBusy(false);
    }
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Lead #{lead.id}</h2>
            <p className="text-xs text-gray-500">
              Status: <span className="font-semibold">{lead.lead_status}</span>
              {lead.converted_case_id ? (
                <span className="ml-2">· Converted case: CASE-{lead.converted_case_id}</span>
              ) : null}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {error ? (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </div>
          ) : null}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</p>
              <p className="text-sm font-medium text-gray-900">{lead.full_name || '—'}</p>
              <p className="text-xs text-gray-600 mt-1">
                {lead.phone ? `Phone: ${lead.phone}` : 'Phone: —'}
                {lead.email ? ` · Email: ${lead.email}` : ' · Email: —'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accident</p>
              <p className="text-sm text-gray-800">Type: {lead.accident_type || '—'}</p>
              <p className="text-sm text-gray-800">Date: {formatDate(lead.date_of_loss)}</p>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {lead.accident_type_description || '—'}
            </div>
          </section>

          {portalCreds ? (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Portal credentials</p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-sm text-gray-900">
                  Email: <span className="font-semibold">{portalCreds.claimantEmail}</span>
                </p>
                {portalCreds.syncedFromExistingPortal ? (
                  <p className="text-sm text-gray-800 mt-2">
                    {portalCreds.message ||
                      'This person already has portal access for another case with the same email. They should sign in with their existing password — no new temp password was created.'}
                  </p>
                ) : (
                  <>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-sm text-gray-900">
                        Temp password:{' '}
                        <span className="font-mono font-semibold">{portalCreds.tempPassword}</span>
                      </p>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(portalCreds.tempPassword);
                          } catch (_e) {
                            // ignore
                          }
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Share this temp password with the claimant. They can set a new password at{' '}
                      <span className="font-mono">/portal/login</span>.
                    </p>
                  </>
                )}
              </div>
            </section>
          ) : null}

          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI evaluation</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blue-900">Viability score</p>
                  <p className="text-xs text-blue-800">{lead.ai_viability_score != null ? `${lead.ai_viability_score}/100` : '—'}</p>
                </div>
                <div className="w-40">
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, Number(lead.ai_viability_score || 0)))}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-900 mt-3 whitespace-pre-wrap">{lead.ai_summary || '—'}</p>
            </div>
          </section>

          {lead.notes ? (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap">
                {lead.notes}
              </div>
            </section>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold"
            disabled={busy}
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl border border-red-200 bg-white text-red-700 hover:bg-red-50 text-sm font-semibold disabled:opacity-60"
            disabled={busy}
          >
            Delete lead
          </button>

          {lead.lead_status === 'new' ? (
            <button
              type="button"
              onClick={() => handleStatus('under_review')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-sm font-semibold disabled:opacity-60"
              disabled={busy}
            >
              Move to review
            </button>
          ) : null}

          {(lead.lead_status === 'new' || lead.lead_status === 'under_review') ? (
            <button
              type="button"
              onClick={() => handleStatus('rejected')}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-semibold disabled:opacity-60"
              disabled={busy}
            >
              Reject
            </button>
          ) : null}

          {canConvert ? (
            <button
              type="button"
              onClick={handleConvert}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm font-semibold disabled:opacity-60"
              disabled={busy}
            >
              Convert to case
            </button>
          ) : null}

          {lead.lead_status === 'converted' ? (
            <button
              type="button"
              onClick={handleActivatePortal}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold disabled:opacity-60"
              disabled={busy}
            >
              Activate portal (temp password)
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

