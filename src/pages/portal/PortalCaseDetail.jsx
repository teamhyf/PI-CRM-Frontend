import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useClaimantAuth } from '../../context/ClaimantAuthContext';
import { LoadingBlock, LoadingInline } from '../../components/LoadingSpinner';
import VisitsTimeline from '../../components/VisitsTimeline';
import CaseDocumentsTab from '../../components/CaseDocumentsTab';
import CaseRedFlagsTab from '../../components/CaseRedFlagsTab';
import ClaimDocumentBuilder from '../../components/ClaimDocumentBuilder';

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

const statusBadgeClasses = (status) => {
  switch (status) {
    case 'suggested':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'no_response':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

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

const CASE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'participants', label: 'Participants' },
  { id: 'injuries', label: 'Injuries' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'treatment', label: 'Treatment Routing' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'documents', label: 'Documents' },
  { id: 'red_flags', label: 'Red Flags' },
  { id: 'documentation_summary', label: 'Documentation Summary' },
  { id: 'settlement', label: 'Settlement' },
];

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
        active
          ? 'border-indigo-600 text-indigo-700'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function statutePlanningReference(dateOfLoss) {
  if (!dateOfLoss) return null;
  const d = new Date(dateOfLoss);
  if (Number.isNaN(d.getTime())) return null;
  const ref = new Date(d);
  ref.setFullYear(ref.getFullYear() + 2);
  return ref;
}

function summarizeInjuriesFromRecords(injuries) {
  if (!Array.isArray(injuries) || injuries.length === 0) return '';
  const fmt = (s) => (s == null ? '' : String(s).replace(/_/g, ' '));
  return injuries
    .map((i) => {
      const parts = [
        fmt(i.body_part),
        fmt(i.symptom_type),
        i.severity_level ? `${fmt(i.severity_level)} severity` : null,
        i.first_reported_date ? `first reported ${String(i.first_reported_date).slice(0, 10)}` : null,
        i.ongoing === 1 || i.ongoing === true ? 'ongoing' : null,
      ].filter(Boolean);
      const line = parts.join(' · ');
      const note = i.notes
        ? ` — ${String(i.notes).trim().slice(0, 160)}${String(i.notes).length > 160 ? '…' : ''}`
        : '';
      return line ? `• ${line}${note}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

function getBandColor(band) {
  if (band === '100k_plus') return 'bg-green-100 text-green-800 border-green-200';
  if (band === '50k' || band === '25k') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (band === 'under_25k') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatCurrency(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return `$${num.toLocaleString()}`;
}

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
  const [activeTab, setActiveTab] = useState('overview');

  const [claimSummaryLoading, setClaimSummaryLoading] = useState(false);
  const [claimSummaryError, setClaimSummaryError] = useState('');
  const [claimSummary, setClaimSummary] = useState(null);

  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState('');
  const [settlement, setSettlement] = useState(null);

  const [insuranceSummary, setInsuranceSummary] = useState(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [insuranceError, setInsuranceError] = useState('');

  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [participantsList, setParticipantsList] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState('');
  const [participantForm, setParticipantForm] = useState({
    role: 'claimant',
    fullName: '',
    phone: '',
    email: '',
    insuranceCarrier: '',
    policyNumber: '',
    vehicleInfo: '',
    notes: '',
  });
  const [participantSaving, setParticipantSaving] = useState(false);

  const [injuriesList, setInjuriesList] = useState([]);
  const [injuriesLoading, setInjuriesLoading] = useState(false);
  const [injuriesError, setInjuriesError] = useState('');
  const [injuryForm, setInjuryForm] = useState({
    bodyPart: 'neck',
    symptomType: 'pain',
    severityLevel: 'mild',
    firstReportedDate: '',
    ongoing: true,
    priorSimilarInjury: false,
    notes: '',
  });
  const [injurySaving, setInjurySaving] = useState(false);

  const [policiesList, setPoliciesList] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState('');
  const [policyForm, setPolicyForm] = useState({
    policyType: 'bodily_injury',
    carrierName: '',
    policyNumber: '',
    claimNumber: '',
    adjusterName: '',
    adjusterEmail: '',
    adjusterPhone: '',
    policyLimitPerPerson: '',
    policyLimitPerOccurrence: '',
  });
  const [policySaving, setPolicySaving] = useState(false);

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalMode, setPolicyModalMode] = useState('create'); // create | edit
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [policyModalError, setPolicyModalError] = useState('');

  const caseIdNum =
    fullDetail?.id ||
    (caseData?.caseId ? Number(String(caseData.caseId).replace(/^CASE-/, '')) : null);

  useEffect(() => {
    setCaseData(null);
    setPathway(null);
    setPathwayError('');
    setError('');
    setDocs([]);
    setActiveTab('overview');
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
        const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/treatment-pathway`, {
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

  // Additional tab data loads (must stay above any early returns to keep hook order stable)

  const loadInsuranceSummary = async () => {
    if (!token || !caseIdNum) return;
    setInsuranceLoading(true);
    setInsuranceError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/insurance-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `Failed to load insurance summary (${res.status})`;
        throw new Error(msg);
      }
      setInsuranceSummary(data || null);
    } catch (e) {
      setInsuranceError(e.message || 'Failed to load insurance summary');
    } finally {
      setInsuranceLoading(false);
    }
  };

  useEffect(() => {
    loadInsuranceSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, caseIdNum]);

  const loadReferrals = async () => {
    if (!token || !caseIdNum) return;
    setReferralsLoading(true);
    setReferralsError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load referrals');
      setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (e) {
      setReferralsError(e.message || 'Failed to load referrals');
    } finally {
      setReferralsLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, caseIdNum]);

  const patchReferralStatus = async (referralId, nextStatus) => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/portal/referrals/${referralId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_status: nextStatus }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to update referral');
    return data;
  };

  const loadParticipants = async () => {
    if (!token || !caseIdNum) return;
    setParticipantsLoading(true);
    setParticipantsError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load participants');
      setParticipantsList(Array.isArray(data) ? data : []);
    } catch (e) {
      setParticipantsError(e.message || 'Failed to load participants');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const loadInjuries = async () => {
    if (!token || !caseIdNum) return;
    setInjuriesLoading(true);
    setInjuriesError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/injuries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load injuries');
      setInjuriesList(Array.isArray(data) ? data : []);
    } catch (e) {
      setInjuriesError(e.message || 'Failed to load injuries');
    } finally {
      setInjuriesLoading(false);
    }
  };

  const loadPolicies = async () => {
    if (!token || !caseIdNum) return;
    setPoliciesLoading(true);
    setPoliciesError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/insurance-policies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load insurance policies');
      setPoliciesList(Array.isArray(data) ? data : []);
    } catch (e) {
      setPoliciesError(e.message || 'Failed to load insurance policies');
    } finally {
      setPoliciesLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !caseIdNum) return;
    loadParticipants();
    loadInjuries();
    loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, caseIdNum]);

  const createParticipant = async (e) => {
    e.preventDefault();
    if (!token || !caseIdNum) return;
    setParticipantSaving(true);
    setParticipantsError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/participants`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(participantForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create participant');
      setParticipantForm({
        role: 'claimant',
        fullName: '',
        phone: '',
        email: '',
        insuranceCarrier: '',
        policyNumber: '',
        vehicleInfo: '',
        notes: '',
      });
      await loadParticipants();
      await loadPolicies();
      await loadInjuries();
      // refresh overview detail to keep parity
      const base2 = getBaseUrl();
      fetch(`${base2}/api/portal/full-detail`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((j) => setFullDetail(j))
        .catch(() => {});
    } catch (err) {
      setParticipantsError(err.message || 'Failed to create participant');
    } finally {
      setParticipantSaving(false);
    }
  };

  const deleteParticipant = async (id) => {
    if (!token || !caseIdNum) return;
    if (!window.confirm('Delete this participant?')) return;
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/participants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete participant');
      await loadParticipants();
    } catch (e) {
      alert(e.message || 'Failed to delete');
    }
  };

  const createInjury = async (e) => {
    e.preventDefault();
    if (!token || !caseIdNum) return;
    setInjurySaving(true);
    setInjuriesError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/injuries`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(injuryForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create injury');
      setInjuryForm({
        bodyPart: 'neck',
        symptomType: 'pain',
        severityLevel: 'mild',
        firstReportedDate: '',
        ongoing: true,
        priorSimilarInjury: false,
        notes: '',
      });
      await loadInjuries();
    } catch (e) {
      setInjuriesError(e.message || 'Failed to create injury');
    } finally {
      setInjurySaving(false);
    }
  };

  const deleteInjury = async (id) => {
    if (!token || !caseIdNum) return;
    if (!window.confirm('Delete this injury?')) return;
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/injuries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete injury');
      await loadInjuries();
    } catch (e) {
      alert(e.message || 'Failed to delete');
    }
  };

  const createPolicy = async (e) => {
    e.preventDefault();
    if (!token || !caseIdNum) return;
    setPolicySaving(true);
    setPoliciesError('');
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/insurance-policies`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(policyForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create policy');
      setPolicyForm({
        policyType: 'bodily_injury',
        carrierName: '',
        policyNumber: '',
        claimNumber: '',
        adjusterName: '',
        adjusterEmail: '',
        adjusterPhone: '',
        policyLimitPerPerson: '',
        policyLimitPerOccurrence: '',
      });
      await loadPolicies();
      await loadInsuranceSummary();
    } catch (e) {
      setPoliciesError(e.message || 'Failed to create policy');
    } finally {
      setPolicySaving(false);
    }
  };

  const deletePolicy = async (id) => {
    if (!token || !caseIdNum) return;
    if (!window.confirm('Delete this policy?')) return;
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/insurance-policies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete policy');
      await loadPolicies();
      await loadInsuranceSummary();
    } catch (e) {
      alert(e.message || 'Failed to delete');
    }
  };

  const openCreatePolicyModal = () => {
    setPolicyModalMode('create');
    setEditingPolicyId(null);
    setPolicyModalError('');
    setPolicyForm({
      policyType: 'bodily_injury',
      carrierName: '',
      policyNumber: '',
      claimNumber: '',
      adjusterName: '',
      adjusterEmail: '',
      adjusterPhone: '',
      policyLimitPerPerson: '',
      policyLimitPerOccurrence: '',
    });
    setPolicyModalOpen(true);
  };

  const openEditPolicyModal = (p) => {
    setPolicyModalMode('edit');
    setEditingPolicyId(p.id);
    setPolicyModalError('');
    setPolicyForm({
      policyType: p.policy_type || 'bodily_injury',
      carrierName: p.carrier_name || '',
      policyNumber: p.policy_number || '',
      claimNumber: p.claim_number || '',
      adjusterName: p.adjuster_name || '',
      adjusterEmail: p.adjuster_email || '',
      adjusterPhone: p.adjuster_phone || '',
      policyLimitPerPerson: p.policy_limit_per_person != null ? String(p.policy_limit_per_person) : '',
      policyLimitPerOccurrence: p.policy_limit_per_occurrence != null ? String(p.policy_limit_per_occurrence) : '',
    });
    setPolicyModalOpen(true);
  };

  const savePolicyModal = async (e) => {
    e.preventDefault();
    if (!token || !caseIdNum) return;
    setPolicySaving(true);
    setPolicyModalError('');
    try {
      const base = getBaseUrl();
      const body = {
        policyType: policyForm.policyType,
        carrierName: policyForm.carrierName || null,
        policyNumber: policyForm.policyNumber || null,
        claimNumber: policyForm.claimNumber || null,
        adjusterName: policyForm.adjusterName || null,
        adjusterEmail: policyForm.adjusterEmail || null,
        adjusterPhone: policyForm.adjusterPhone || null,
        policyLimitPerPerson: policyForm.policyLimitPerPerson !== '' ? Number(policyForm.policyLimitPerPerson) : null,
        policyLimitPerOccurrence:
          policyForm.policyLimitPerOccurrence !== '' ? Number(policyForm.policyLimitPerOccurrence) : null,
      };

      if (policyModalMode === 'edit' && editingPolicyId) {
        const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/insurance-policies/${editingPolicyId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update policy');
      } else {
        const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/insurance-policies`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to create policy');
      }

      setPolicyModalOpen(false);
      await loadPolicies();
      await loadInsuranceSummary();
    } catch (err) {
      setPolicyModalError(err.message || 'Failed to save policy');
    } finally {
      setPolicySaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!token || !caseIdNum) return undefined;
    (async () => {
      setClaimSummaryLoading(true);
      setClaimSummaryError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/claim-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load documentation summary');
        if (!cancelled) setClaimSummary(data || null);
      } catch (e) {
        if (!cancelled) setClaimSummaryError(e.message || 'Failed to load documentation summary');
      } finally {
        if (!cancelled) setClaimSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, caseIdNum]);

  useEffect(() => {
    let cancelled = false;
    if (!token || !caseIdNum) return undefined;
    (async () => {
      setSettlementLoading(true);
      setSettlementError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/settlement`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load settlement');
        if (!cancelled) setSettlement(data || null);
      } catch (e) {
        if (!cancelled) setSettlementError(e.message || 'Failed to load settlement');
      } finally {
        if (!cancelled) setSettlementLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, caseIdNum]);

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
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/portal/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline w-fit"
              >
                <span aria-hidden>←</span> My cases
              </Link>
            </div>
            <h1 className="text-3xl font-bold mt-2">
              {caseIdNum ? `Case #${caseIdNum}` : activeCaseLabel}
            </h1>
            <p className="text-gray-600 mt-1">
              {caseData?.accidentType || '—'} | {caseData?.dateOfLoss ? formatISODate(caseData.dateOfLoss) : 'No date'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-700">
                <span className="font-medium">{claimant?.fullName || '—'}</span>
              </div>
              {claimant?.email ? <div className="text-gray-600">{claimant.email}</div> : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <label className="text-xs font-medium text-gray-500">Case status</label>
            <div
              className={`min-w-[12rem] rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm ${normalizedCaseStatus === 'accepted'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
            >
              {String(normalizedCaseStatus).replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {CASE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {activeTab === 'overview' ? (
            <>
              {loading ? (
                <LoadingInline message="Loading case details…" />
              ) : error ? (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
              ) : caseData ? (
                (() => {
                  const statuteRefDate = !fullDetail?.statute_deadline
                    ? statutePlanningReference(fullDetail?.date_of_loss || caseData.dateOfLoss)
                    : null;
                  const fromRecords = summarizeInjuriesFromRecords(fullDetail?.injuries || []);
                  const injuryNarrative =
                    (fullDetail?.injury_summary && String(fullDetail.injury_summary).trim()) || fromRecords;
                  const showCompiledNote = !(fullDetail?.injury_summary && String(fullDetail.injury_summary).trim()) && !!fromRecords;

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Jurisdiction State</label>
                          <p className="text-gray-900 mt-1">{fullDetail?.jurisdiction_state || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Statute Deadline</label>
                          {fullDetail?.statute_deadline ? (
                            <p className="text-gray-900 mt-1 font-medium">
                              {new Date(fullDetail.statute_deadline).toLocaleDateString()}
                            </p>
                          ) : (
                            <div className="mt-1">
                              <p className="text-gray-600">Not set on file</p>
                              {statuteRefDate ? (
                                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950">
                                  <span className="font-semibold">Planning reference only:</span>{' '}
                                  {statuteRefDate.toLocaleDateString()} (2 years after date of loss). Limitations law
                                  varies by state and claim type — confirm with counsel and save the official deadline on
                                  the case when known.
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Estimated Severity</label>
                          <p className="text-gray-900 mt-1">
                            {fullDetail?.estimated_severity_score != null ? `${fullDetail.estimated_severity_score}/100` : '—'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                          <p className="text-gray-900 mt-1">{fullDetail?.risk_score != null ? `${fullDetail.risk_score}/100` : '—'}</p>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Insurance Coverage Note</label>
                          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            {insuranceLoading ? (
                              <LoadingInline message="Loading coverage note…" className="py-2" />
                            ) : insuranceError ? (
                              <p className="text-sm text-red-700">{insuranceError}</p>
                            ) : (
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {insuranceSummary?.coverageNote || 'No insurance summary yet.'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Liability Summary</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{fullDetail?.liability_summary || 'No summary'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Injury Summary</label>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                          {injuryNarrative || 'No summary — add injuries on the Injuries tab or enter a narrative.'}
                        </p>
                        {showCompiledNote ? (
                          <p className="text-xs text-gray-500 mt-2">
                            Compiled from structured injury records (the narrative field on the case is still empty).
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-gray-600">No case found.</p>
              )}
            </>
          ) : null}

          {activeTab === 'participants' ? (
            <div className="space-y-3">
              <form onSubmit={createParticipant} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                    <select
                      value={participantForm.role}
                      onChange={(e) => setParticipantForm((p) => ({ ...p, role: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="claimant">Claimant</option>
                      <option value="driver">Driver</option>
                      <option value="passenger">Passenger</option>
                      <option value="witness">Witness</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full name</label>
                    <input
                      value={participantForm.fullName}
                      onChange={(e) => setParticipantForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                    <input
                      value={participantForm.phone}
                      onChange={(e) => setParticipantForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input
                      value={participantForm.email}
                      onChange={(e) => setParticipantForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle info</label>
                    <input
                      value={participantForm.vehicleInfo}
                      onChange={(e) => setParticipantForm((p) => ({ ...p, vehicleInfo: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                  <textarea
                    value={participantForm.notes}
                    onChange={(e) => setParticipantForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                {participantsError ? (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{participantsError}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={participantSaving}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {participantSaving ? 'Adding…' : 'Add participant'}
                </button>
              </form>

              {participantsLoading ? (
                <LoadingInline message="Loading participants…" />
              ) : participantsList.length === 0 ? (
                <p className="text-sm text-gray-600">No participants on file.</p>
              ) : (
                <ul className="space-y-2">
                  {participantsList.map((p) => (
                    <li key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {p.full_name || 'Participant'}{' '}
                            <span className="text-xs font-semibold text-gray-500">
                              {p.role ? `· ${String(p.role).replace(/_/g, ' ')}` : ''}
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{[p.phone, p.email].filter(Boolean).join(' · ') || '—'}</p>
                          {p.notes ? <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">{p.notes}</p> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteParticipant(p.id)}
                          className="text-xs font-semibold text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {activeTab === 'injuries' ? (
            <div className="space-y-3">
              <form onSubmit={createInjury} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Body Part</label>
                    <select
                      value={injuryForm.bodyPart}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, bodyPart: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="neck">Neck</option>
                      <option value="low_back">Low Back</option>
                      <option value="mid_back">Mid Back</option>
                      <option value="shoulder">Shoulder</option>
                      <option value="knee">Knee</option>
                      <option value="head">Head</option>
                      <option value="wrist">Wrist</option>
                      <option value="ankle">Ankle</option>
                      <option value="hip">Hip</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Symptom</label>
                    <select
                      value={injuryForm.symptomType}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, symptomType: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="pain">Pain</option>
                      <option value="numbness">Numbness</option>
                      <option value="tingling">Tingling</option>
                      <option value="headaches">Headaches</option>
                      <option value="weakness">Weakness</option>
                      <option value="limited_motion">Limited Motion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Severity</label>
                    <select
                      value={injuryForm.severityLevel}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, severityLevel: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Reported</label>
                    <input
                      type="date"
                      value={injuryForm.firstReportedDate}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, firstReportedDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!injuryForm.ongoing}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, ongoing: e.target.checked }))}
                    />
                    Ongoing
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!injuryForm.priorSimilarInjury}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, priorSimilarInjury: e.target.checked }))}
                    />
                    Prior similar injury
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                  <textarea
                    value={injuryForm.notes}
                    onChange={(e) => setInjuryForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>

                {injuriesError ? (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{injuriesError}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={injurySaving}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {injurySaving ? 'Adding…' : 'Add Injury'}
                </button>
              </form>

              {injuriesLoading ? (
                <LoadingInline message="Loading injuries…" />
              ) : injuriesList.length === 0 ? (
                <p className="text-sm text-gray-600">No injuries on file yet.</p>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Injuries</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <th className="px-4 py-3">Body Part</th>
                          <th className="px-4 py-3">Symptom</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">First Reported</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {injuriesList.map((inj) => {
                          const status = inj.ongoing === 1 || inj.ongoing === true ? 'Ongoing' : 'Resolved';
                          const first = inj.first_reported_date ? String(inj.first_reported_date).slice(0, 10) : '';
                          return (
                            <tr key={inj.id} className="hover:bg-gray-50/60">
                              <td className="px-4 py-3 text-gray-900">{inj.body_part || '—'}</td>
                              <td className="px-4 py-3 text-gray-700">{inj.symptom_type || '—'}</td>
                              <td className="px-4 py-3 text-gray-700">{inj.severity_level ? String(inj.severity_level).replace(/_/g, ' ') : '—'}</td>
                              <td className="px-4 py-3 text-gray-700">{first || '—'}</td>
                              <td className="px-4 py-3 text-gray-700">{status}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => deleteInjury(inj.id)}
                                  className="text-xs font-semibold text-red-700 hover:underline"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'insurance' ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Primary BI Coverage</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">
                      {formatCurrency(insuranceSummary?.primaryBodyilyInjury?.totalBiLimitPerPerson)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Med-Pay Available:</span>{' '}
                      {insuranceSummary?.medpayAvailable ? 'Yes' : 'No'}
                      {' · '}
                      <span className="font-semibold">Verification Status:</span>{' '}
                      {Number(insuranceSummary?.verifiedCount || 0)} of {Number(insuranceSummary?.totalPolicies || 0)} policies verified
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getBandColor(
                      insuranceSummary?.primaryBodyilyInjury?.policy_band || 'unknown'
                    )}`}
                  >
                    {String(insuranceSummary?.primaryBodyilyInjury?.policy_band || 'unknown').replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  {(() => {
                    const total = Number(insuranceSummary?.totalPolicies || 0);
                    const verified = Number(insuranceSummary?.verifiedCount || 0);
                    const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
                    return (
                      <div className="h-3 bg-indigo-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                    );
                  })()}
                </div>

                {insuranceLoading ? (
                  <div className="pt-1">
                    <LoadingInline message="Loading coverage note…" />
                  </div>
                ) : insuranceError ? (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {insuranceError}
                  </div>
                ) : insuranceSummary?.coverageNote ? (
                  <div className="text-sm text-gray-800 whitespace-pre-wrap pt-1">{insuranceSummary.coverageNote}</div>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-gray-900">Policies</div>
                <button
                  type="button"
                  onClick={openCreatePolicyModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  + Add Policy
                </button>
              </div>

              {policiesError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{policiesError}</p>
              ) : null}

              {policiesLoading ? (
                <LoadingInline message="Loading policies…" />
              ) : policiesList.length === 0 ? (
                <p className="text-sm text-gray-600">No insurance policies on file.</p>
              ) : (
                <div className="space-y-4">
                  {policiesList.map((p) => {
                    const band = p.policy_band || insuranceSummary?.primaryBodyilyInjury?.policy_band || 'unknown';
                    return (
                      <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-700 rounded-full border border-gray-200 px-2 py-0.5 bg-gray-50">
                                {String(p.policy_type || 'policy').replace(/_/g, ' ')}
                              </span>
                              <span className={`text-[10px] font-bold rounded-full border px-2 py-0.5 ${getBandColor(band)}`}>
                                {String(band).replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-gray-900">
                              {p.carrier_name || 'Policy'} {p.policy_number ? `(${p.policy_number})` : ''}
                            </div>
                            <div className="text-xs text-gray-600">
                              Limits: {p.policy_limit_per_person != null ? formatCurrency(p.policy_limit_per_person) : '—'} per person,{' '}
                              {p.policy_limit_per_occurrence != null ? formatCurrency(p.policy_limit_per_occurrence) : '—'} per occurrence
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                              <input
                                type="checkbox"
                                checked={!!p.coverage_verified}
                                onChange={async (e) => {
                                  try {
                                    const base = getBaseUrl();
                                    const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/insurance-policies/${p.id}`, {
                                      method: 'PATCH',
                                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ coverageVerified: e.target.checked }),
                                    });
                                    const data = await res.json().catch(() => ({}));
                                    if (!res.ok) throw new Error(data.error || 'Failed to update verification');
                                    await loadPolicies();
                                    await loadInsuranceSummary();
                                  } catch (err) {
                                    alert(err.message || 'Failed to update');
                                  }
                                }}
                              />
                              Verified
                            </label>
                            <div className="flex items-center gap-3 text-xs">
                              <button
                                type="button"
                                onClick={() => openEditPolicyModal(p)}
                                className="font-semibold text-indigo-700 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePolicy(p.id)}
                                className="font-semibold text-red-700 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {policyModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">
                        {policyModalMode === 'edit' ? 'Edit Policy' : 'Add Policy'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPolicyModalOpen(false)}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                      >
                        Close
                      </button>
                    </div>

                    <form onSubmit={savePolicyModal} className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Policy type</label>
                          <select
                            value={policyForm.policyType}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, policyType: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          >
                            <option value="bodily_injury">Bodily Injury</option>
                            <option value="property_damage">Property Damage</option>
                            <option value="medpay">Med-Pay</option>
                            <option value="uim_um">UIM / UM</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Carrier</label>
                          <input
                            value={policyForm.carrierName}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, carrierName: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Policy #</label>
                          <input
                            value={policyForm.policyNumber}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, policyNumber: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Claim #</label>
                          <input
                            value={policyForm.claimNumber}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, claimNumber: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Adjuster name</label>
                          <input
                            value={policyForm.adjusterName}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, adjusterName: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Adjuster email</label>
                          <input
                            value={policyForm.adjusterEmail}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, adjusterEmail: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Limit per person</label>
                          <input
                            value={policyForm.policyLimitPerPerson}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, policyLimitPerPerson: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Limit per occurrence</label>
                          <input
                            value={policyForm.policyLimitPerOccurrence}
                            onChange={(e) => setPolicyForm((p) => ({ ...p, policyLimitPerOccurrence: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      {policyModalError ? (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {policyModalError}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setPolicyModalOpen(false)}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={policySaving}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {policySaving ? 'Saving…' : policyModalMode === 'edit' ? 'Save Changes' : 'Save Policy'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'treatment' ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Suggested Referrals</h2>
                <p className="text-sm text-gray-600">Auto-mapped based on documented injuries.</p>

                {referralsLoading ? (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <LoadingInline message="Loading referral data…" />
                  </div>
                ) : referralsError ? (
                  <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-4 py-2">
                    {referralsError}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="mt-4 text-sm text-gray-600">No suggestions available yet.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {suggestions.map((s) => (
                      <div key={s.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {s.provider_name}{' '}
                              <span className="text-gray-500 font-normal">
                                ({providerTypeLabel(s.provider_type)})
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Injury mapping:{' '}
                              {(s.injury_ids || [])
                                .map((id) => (injuriesList || []).find((x) => Number(x.id) === Number(id)))
                                .filter(Boolean)
                                .map((inj) =>
                                  [providerTypeLabel(inj.body_part), inj.symptom_type, inj.severity_level]
                                    .filter(Boolean)
                                    .join(' • ')
                                )
                                .join(', ') || '—'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await patchReferralStatus(s.id, 'scheduled');
                                await loadReferrals();
                              } catch (e) {
                                alert(e.message || 'Failed to schedule');
                              }
                            }}
                            className="px-3 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                          >
                            Schedule
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Referral Status Tracker</h2>
                <p className="text-sm text-gray-600">Track suggested → scheduled → completed referral outcomes.</p>

                {referralsLoading ? (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <LoadingInline message="Loading referrals…" />
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="mt-4 text-sm text-gray-600">No referrals yet.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {referrals.map((r) => (
                      <div key={r.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {r.provider_name}{' '}
                              <span className="text-gray-500 font-normal">
                                ({providerTypeLabel(r.provider_type)})
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Injury mapping:{' '}
                              {(r.injury_ids || [])
                                .map((id) => (injuriesList || []).find((x) => Number(x.id) === Number(id)))
                                .filter(Boolean)
                                .map((inj) =>
                                  [providerTypeLabel(inj.body_part), inj.symptom_type, inj.severity_level]
                                    .filter(Boolean)
                                    .join(' • ')
                                )
                                .join(', ') || '—'}
                            </div>
                            {r.notes ? (
                              <div className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">{r.notes}</div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClasses(
                                r.referral_status
                              )}`}
                            >
                              {String(r.referral_status || 'suggested').replace(/_/g, ' ')}
                            </span>
                            <select
                              value={r.referral_status || 'suggested'}
                              onChange={async (e) => {
                                try {
                                  await patchReferralStatus(r.id, e.target.value);
                                  await loadReferrals();
                                } catch (err) {
                                  alert(err.message || 'Failed to update');
                                }
                              }}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold"
                            >
                              {['suggested', 'scheduled', 'completed', 'declined', 'no_response'].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'timeline' ? (
            <VisitsTimeline caseId={caseIdNum} apiPrefix="/api/portal" token={token} />
          ) : null}

          {activeTab === 'documents' ? (
            <CaseDocumentsTab caseId={caseIdNum} apiPrefix="/api/portal" token={token} allowStatusChange={false} />
          ) : null}

          {activeTab === 'red_flags' ? (
            <CaseRedFlagsTab caseId={caseIdNum} apiPrefix="/api/portal" token={token} />
          ) : null}

          {activeTab === 'documentation_summary' ? (
            <ClaimDocumentBuilder caseId={caseIdNum} apiPrefix="/api/portal" token={token} />
          ) : null}

          {activeTab === 'settlement' ? (
            <div className="space-y-4">
              {settlementLoading ? (
                <LoadingInline message="Loading settlement…" />
              ) : settlementError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {settlementError}
                </p>
              ) : settlement ? (
                <>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">Readiness</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {settlement.readiness?.ready ? (
                        <span className="font-semibold text-green-700">Ready</span>
                      ) : (
                        <span className="font-semibold text-amber-700">Not ready</span>
                      )}
                    </p>
                    {Array.isArray(settlement.readiness?.blockers) && settlement.readiness.blockers.length > 0 ? (
                      <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
                        {settlement.readiness.blockers.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Settlement tracker</p>
                    {settlement.tracker ? (
                      <div className="mt-2 text-sm text-gray-800 space-y-1">
                        <div>
                          Status: <span className="font-semibold">{settlement.tracker.demand_status || '—'}</span>
                        </div>
                        <div>
                          Demand: <span className="font-semibold">{settlement.tracker.demand_amount ?? '—'}</span>
                        </div>
                        <div>
                          Final: <span className="font-semibold">{settlement.tracker.final_settlement ?? '—'}</span>
                        </div>
                        {settlement.tracker.notes ? (
                          <div className="pt-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Notes</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">{settlement.tracker.notes}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600">No settlement tracker has been created yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">No settlement data.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Note: Case record, Treatment Pathway, and Documents are now shown only inside their tabs. */}

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
