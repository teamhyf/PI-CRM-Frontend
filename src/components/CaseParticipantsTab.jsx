import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

const EMPTY_PARTICIPANT_DRAFT = () => ({
  fullName: '',
  phone: '',
  email: '',
  insuranceCarrier: '',
  policyNumber: '',
  vehicleInfo: '',
  notes: '',
});

const PARTICIPANT_SECTIONS = [
  {
    id: 'adverse_driver',
    role: 'adverse_driver',
    title: 'The Other Driver',
    subtitle: 'Person who hit you',
    nameLabel: 'Full name',
    showInsurance: true,
  },
  {
    id: 'passenger',
    role: 'passenger',
    title: 'People in Your Car',
    subtitle: 'Passengers riding with you',
    nameLabel: 'Full name',
    showInsurance: false,
  },
  {
    id: 'witness',
    role: 'witness',
    title: 'Witnesses',
    subtitle: 'People who saw what happened',
    nameLabel: 'Full name',
    showInsurance: false,
  },
  {
    id: 'police_emergency',
    role: 'police_emergency',
    title: 'Police / Emergency Response',
    subtitle: 'If applicable - officer, agency, fire, or EMS',
    nameLabel: 'Name or unit / badge #',
    showInsurance: false,
  },
  {
    id: 'other_vehicle',
    role: 'other_vehicle',
    title: 'Other Vehicles Involved',
    subtitle: 'Additional vehicles or parties (description, plate if known)',
    nameLabel: 'Vehicle or party description',
    showInsurance: false,
  },
];

const SECTION_ROLE_SET = new Set(PARTICIPANT_SECTIONS.map((s) => s.role));

function getSectionConfig(role) {
  return (
    PARTICIPANT_SECTIONS.find((s) => s.role === role) || {
      role,
      title: 'Participant',
      subtitle: '',
      nameLabel: 'Full name',
      showInsurance: false,
    }
  );
}

function rowToDraft(p) {
  return {
    fullName: p.full_name || '',
    phone: p.phone != null ? String(p.phone) : '',
    email: p.email != null ? String(p.email) : '',
    insuranceCarrier: p.insurance_carrier != null ? String(p.insurance_carrier) : '',
    policyNumber: p.policy_number != null ? String(p.policy_number) : '',
    vehicleInfo: p.vehicle_info != null ? String(p.vehicle_info) : '',
    notes: p.notes != null ? String(p.notes) : '',
  };
}

function ParticipantSectionIcon({ role }) {
  const iconClass = 'h-5 w-5 shrink-0 text-lime-700';
  if (role === 'adverse_driver' || role === 'other_vehicle') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2.1} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l1.2-3.6A2.25 2.25 0 017.08 8.25h9.84a2.25 2.25 0 012.13 1.65l1.2 3.6M4.5 16.5h15m-13.5 0V18a.75.75 0 00.75.75h.75A.75.75 0 008.25 18v-1.5m7.5 0V18a.75.75 0 00.75.75h.75A.75.75 0 0018 18v-1.5M6.75 12h.008v.008H6.75V12zm10.5 0h.008v.008h-.008V12z"
        />
      </svg>
    );
  }
  if (role === 'passenger') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2.1} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM3.75 19.5a8.25 8.25 0 0116.5 0"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    );
  }
  if (role === 'witness') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2.1} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12s3.75-6 9.75-6 9.75 6 9.75 6-3.75 6-9.75 6-9.75-6-9.75-6z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
      </svg>
    );
  }
  if (role === 'police_emergency') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2.1} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l6.75 3v5.25c0 4.07-2.75 7.73-6.75 8.75-4-1.02-6.75-4.68-6.75-8.75V6L12 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v6m-3-3h6" />
      </svg>
    );
  }
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2.1} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275"
      />
    </svg>
  );
}

export default function CaseParticipantsTab({ caseId, participants, onChanged }) {
  const { token } = useAuth();
  const [error, setError] = useState('');
  const [claimantCredentials, setClaimantCredentials] = useState(null);
  const [credCopied, setCredCopied] = useState(false);
  const [participantModal, setParticipantModal] = useState(null);
  const [participantDraft, setParticipantDraft] = useState(EMPTY_PARTICIPANT_DRAFT());
  const [saving, setSaving] = useState(false);

  const openParticipantModal = (mode, role, id) => {
    setError('');
    if (mode === 'create') {
      setParticipantModal({ mode: 'create', role });
      setParticipantDraft(EMPTY_PARTICIPANT_DRAFT());
      return;
    }
    const p = participants.find((x) => Number(x.id) === Number(id));
    if (!p) return;
    setParticipantModal({ mode: 'edit', role: String(p.role), id: p.id });
    setParticipantDraft(rowToDraft(p));
  };

  const closeParticipantModal = () => {
    setParticipantModal(null);
    setParticipantDraft(EMPTY_PARTICIPANT_DRAFT());
    setSaving(false);
  };

  const handleCreateOrEdit = async (e) => {
    e.preventDefault();
    if (!participantModal) return;
    setSaving(true);
    setError('');
    const draft = participantDraft;
    if (!String(draft.fullName || '').trim()) {
      setError('Name is required');
      setSaving(false);
      return;
    }
    if (
      participantModal.mode === 'create' &&
      participantModal.role === 'claimant' &&
      !String(draft.email || '').trim()
    ) {
      setError('Email is required for claimant participants');
      setSaving(false);
      return;
    }

    try {
      const base = getBaseUrl();
      const payload = {
        fullName: String(draft.fullName || '').trim(),
        phone: String(draft.phone || '').trim(),
        email: String(draft.email || '').trim(),
        insuranceCarrier: String(draft.insuranceCarrier || '').trim(),
        policyNumber: String(draft.policyNumber || '').trim(),
        vehicleInfo: String(draft.vehicleInfo || '').trim(),
        notes: String(draft.notes || '').trim(),
      };

      let res;
      if (participantModal.mode === 'create') {
        res = await fetch(`${base}/api/cases/${caseId}/participants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: participantModal.role, ...payload }),
        });
      } else {
        res = await fetch(`${base}/api/cases/${caseId}/participants/${participantModal.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save participant');

      if (
        participantModal.mode === 'create' &&
        participantModal.role === 'claimant' &&
        (data.tempPassword || data.syncedFromExistingPortal || data.portalAlreadyActive)
      ) {
        setClaimantCredentials({
          claimantId: data.claimantId,
          portalEmail: data.portalEmail,
          tempPassword: data.tempPassword || null,
          syncedFromExistingPortal: Boolean(data.syncedFromExistingPortal),
          portalAlreadyActive: Boolean(data.portalAlreadyActive),
          syncedMessage: data.syncedMessage || null,
        });
      }

      closeParticipantModal();
      onChanged?.();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save participant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this participant?')) return;
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/cases/${caseId}/participants/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete participant');
      if (participantModal?.mode === 'edit' && Number(participantModal.id) === Number(id)) {
        closeParticipantModal();
      }
      onChanged?.();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete participant');
    }
  };

  return (
    <div className="space-y-4 p-3 sm:p-4">
      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200/70">{error}</div>
      ) : null}

      {claimantCredentials ? (
        <div className="mb-2 space-y-2 rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-200/70">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-900">
              {claimantCredentials.portalAlreadyActive && !claimantCredentials.tempPassword
                ? 'Claimant linked - portal already active'
                : 'Claimant portal created - share securely with the client'}
            </p>
            <button
              type="button"
              onClick={() => setClaimantCredentials(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-emerald-800">
            Email: <span className="font-mono">{claimantCredentials.portalEmail}</span>
          </p>
          {claimantCredentials.tempPassword ? (
            <>
              <p className="text-xs text-emerald-800">
                Temporary password: <span className="font-mono break-all">{claimantCredentials.tempPassword}</span>
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                onClick={async () => {
                  await navigator.clipboard.writeText(claimantCredentials.tempPassword);
                  setCredCopied(true);
                  setTimeout(() => setCredCopied(false), 2000);
                }}
              >
                {credCopied ? 'Copied!' : 'Copy password'}
              </button>
            </>
          ) : null}
          {(claimantCredentials.syncedFromExistingPortal || claimantCredentials.portalAlreadyActive) &&
          claimantCredentials.syncedMessage ? (
            <div className="rounded bg-amber-50 p-2 text-xs text-amber-950 ring-1 ring-amber-200/70">
              {claimantCredentials.syncedMessage}
            </div>
          ) : null}
        </div>
      ) : null}

      {participants.some((p) => String(p.role) === 'claimant') ? (
        <div className="rounded-lg bg-emerald-50/90 px-3 py-2 text-sm text-emerald-950 ring-1 ring-emerald-200/60">
          <span className="font-semibold">Claimant on record: </span>
          {participants
            .filter((p) => String(p.role) === 'claimant')
            .map((p) => p.full_name)
            .filter(Boolean)
            .join(', ') || '-'}
        </div>
      ) : null}

      {PARTICIPANT_SECTIONS.map((section) => {
        const inSection = participants.filter((p) => String(p.role) === section.role);
        return (
          <section key={section.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-slate-100/70 px-4 py-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-lime-100 ring-1 ring-lime-200/80">
                    <ParticipantSectionIcon role={section.role} />
                  </span>
                  <span>{section.title}</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">{section.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => openParticipantModal('create', section.role)}
                className="shrink-0 rounded-full bg-lime-400 px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm shadow-lime-400/35 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-500/45"
              >
                + Add New
              </button>
            </div>

            {inSection.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">No entries yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 bg-white">
                {inSection.map((p) => (
                  <li key={p.id} className="px-4 py-3 transition-colors hover:bg-slate-50/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{p.full_name || '-'}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{[p.phone, p.email].filter(Boolean).join(' - ') || '-'}</p>
                        {p.vehicle_info ? (
                          <p className="mt-1.5 text-xs text-slate-700">
                            <span className="font-semibold text-slate-600">Vehicle: </span>
                            {p.vehicle_info}
                          </p>
                        ) : null}
                        {p.insurance_carrier || p.policy_number ? (
                          <p className="mt-0.5 text-xs text-slate-700">
                            <span className="font-semibold text-slate-600">Insurance: </span>
                            {[p.insurance_carrier, p.policy_number].filter(Boolean).join(' - ') || '-'}
                          </p>
                        ) : null}
                        {p.notes ? <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-700">{p.notes}</p> : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <button
                          type="button"
                          onClick={() => openParticipantModal('edit', section.role, p.id)}
                          className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-semibold text-lime-900 ring-1 ring-lime-200/70 hover:bg-lime-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200/70 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {participants.some((p) => !SECTION_ROLE_SET.has(String(p.role)) && String(p.role) !== 'claimant') ? (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-amber-200/70">
          <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50/85 to-amber-100/60 px-4 py-3">
            <h3 className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 ring-1 ring-amber-200/80">
                <ParticipantSectionIcon role="other" />
              </span>
              <span>Other contacts on file</span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">From older data. Edit or remove duplicates here.</p>
          </div>
          <ul className="divide-y divide-amber-100/80 bg-white">
            {participants
              .filter((p) => !SECTION_ROLE_SET.has(String(p.role)) && String(p.role) !== 'claimant')
              .map((p) => (
                <li key={p.id} className="px-4 py-3 transition-colors hover:bg-amber-50/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {p.full_name || '-'}{' '}
                        <span className="text-xs font-semibold text-slate-500">- {String(p.role || '').replace(/_/g, ' ')}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">{[p.phone, p.email].filter(Boolean).join(' - ') || '-'}</p>
                      {p.notes ? <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-700">{p.notes}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <button
                        type="button"
                        onClick={() => openParticipantModal('edit', String(p.role), p.id)}
                        className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-semibold text-lime-900 ring-1 ring-lime-200/70 hover:bg-lime-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200/70 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {participantModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeParticipantModal();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/70"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-participant-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const section = getSectionConfig(participantModal.role);
              const fieldClass =
                'w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200/90 focus:outline-none focus:ring-2 focus:ring-lime-400/45';
              return (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <h2 id="admin-participant-modal-title" className="text-lg font-bold text-slate-900">
                      {participantModal.mode === 'create' ? 'Add' : 'Edit'} - {section.title}
                    </h2>
                    <button
                      type="button"
                      onClick={closeParticipantModal}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      aria-label="Close"
                    >
                      <span className="text-xl leading-none" aria-hidden>
                        x
                      </span>
                    </button>
                  </div>
                  <form onSubmit={handleCreateOrEdit} className="space-y-3 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">{section.nameLabel}</label>
                        <input
                          value={participantDraft.fullName}
                          onChange={(e) => setParticipantDraft((d) => ({ ...d, fullName: e.target.value }))}
                          className={fieldClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
                        <input
                          value={participantDraft.phone}
                          onChange={(e) => setParticipantDraft((d) => ({ ...d, phone: e.target.value }))}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                        <input
                          value={participantDraft.email}
                          onChange={(e) => setParticipantDraft((d) => ({ ...d, email: e.target.value }))}
                          className={fieldClass}
                        />
                      </div>
                      {section.showInsurance ? (
                        <>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Insurance carrier</label>
                            <input
                              value={participantDraft.insuranceCarrier}
                              onChange={(e) =>
                                setParticipantDraft((d) => ({ ...d, insuranceCarrier: e.target.value }))
                              }
                              className={fieldClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Policy number</label>
                            <input
                              value={participantDraft.policyNumber}
                              onChange={(e) => setParticipantDraft((d) => ({ ...d, policyNumber: e.target.value }))}
                              className={fieldClass}
                            />
                          </div>
                        </>
                      ) : null}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {section.role === 'other_vehicle' ? 'Plate, color, or extra vehicle details' : 'Vehicle info'}
                        </label>
                        <input
                          value={participantDraft.vehicleInfo}
                          onChange={(e) => setParticipantDraft((d) => ({ ...d, vehicleInfo: e.target.value }))}
                          className={fieldClass}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
                        <textarea
                          value={participantDraft.notes}
                          onChange={(e) => setParticipantDraft((d) => ({ ...d, notes: e.target.value }))}
                          rows={2}
                          className={fieldClass}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={closeParticipantModal}
                        className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200/80 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center rounded-full bg-lime-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-lime-400/25 hover:bg-lime-300 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : participantModal.mode === 'create' ? 'Add' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}

