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

  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState('');
  const [visits, setVisits] = useState([]);
  const [visitTotals, setVisitTotals] = useState({ totalBilled: 0, totalReceived: 0 });
  const [treatmentTimelineLoading, setTreatmentTimelineLoading] = useState(false);
  const [treatmentTimelineError, setTreatmentTimelineError] = useState('');
  const [treatmentTimeline, setTreatmentTimeline] = useState(null);

  const [claimSummaryLoading, setClaimSummaryLoading] = useState(false);
  const [claimSummaryError, setClaimSummaryError] = useState('');
  const [claimSummary, setClaimSummary] = useState(null);

  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState('');
  const [settlement, setSettlement] = useState(null);

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

  // Additional tab data loads (must stay above any early returns to keep hook order stable)
  useEffect(() => {
    let cancelled = false;
    if (!token || !caseIdNum) return undefined;
    (async () => {
      setVisitsLoading(true);
      setVisitsError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/medical-visits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load medical visits');
        if (!cancelled) {
          setVisits(Array.isArray(data.visits) ? data.visits : []);
          setVisitTotals({
            totalBilled: Number(data.totalBilled || 0),
            totalReceived: Number(data.totalReceived || 0),
          });
        }
      } catch (e) {
        if (!cancelled) setVisitsError(e.message || 'Failed to load medical visits');
      } finally {
        if (!cancelled) setVisitsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, caseIdNum]);

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
    } catch (e) {
      alert(e.message || 'Failed to delete');
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!token || !caseIdNum) return undefined;
    (async () => {
      setTreatmentTimelineLoading(true);
      setTreatmentTimelineError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/portal/cases/${caseIdNum}/treatment-timeline`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load treatment timeline');
        if (!cancelled) setTreatmentTimeline(data || null);
      } catch (e) {
        if (!cancelled) setTreatmentTimelineError(e.message || 'Failed to load treatment timeline');
      } finally {
        if (!cancelled) setTreatmentTimelineLoading(false);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {String(normalizedCaseStatus).replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accident type</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{caseData.accidentType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of loss</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatISODate(caseData.dateOfLoss)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatISODate(caseData.createdAt)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No case found.</p>
              )}

              {/* Overview should include the case record (admin parity) */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Case record</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Same information your legal team sees for this matter. Update the narrative fields below as your
                  situation changes.
                </p>

                {fullDetailLoading ? (
                  <LoadingInline message="Loading case record…" />
                ) : fullDetailError ? (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {fullDetailError}
                  </p>
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

                    <form onSubmit={handleSaveCaseInfo} className="space-y-4">
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
                  <p className="text-sm text-gray-600">No extended record available.</p>
                )}
              </div>
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
              <form onSubmit={createInjury} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Body part</label>
                    <input
                      value={injuryForm.bodyPart}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, bodyPart: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Symptom</label>
                    <input
                      value={injuryForm.symptomType}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, symptomType: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Severity</label>
                    <select
                      value={injuryForm.severityLevel}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, severityLevel: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="mild">mild</option>
                      <option value="moderate">moderate</option>
                      <option value="severe">severe</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">First reported</label>
                    <input
                      type="date"
                      value={injuryForm.firstReportedDate}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, firstReportedDate: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
                    <input
                      type="checkbox"
                      checked={!!injuryForm.ongoing}
                      onChange={(e) => setInjuryForm((p) => ({ ...p, ongoing: e.target.checked }))}
                    />
                    Ongoing
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
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
                  {injurySaving ? 'Adding…' : 'Add injury'}
                </button>
              </form>

              {injuriesLoading ? (
                <LoadingInline message="Loading injuries…" />
              ) : injuriesList.length === 0 ? (
                <p className="text-sm text-gray-600">No injuries on file yet.</p>
              ) : (
                <ul className="space-y-2">
                  {injuriesList.map((inj) => (
                    <li key={inj.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {[inj.body_part, inj.symptom_type].filter(Boolean).join(' · ') || 'Injury'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {[inj.severity_level, inj.first_reported_date].filter(Boolean).join(' · ') || '—'}
                          </p>
                          {inj.notes ? <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">{inj.notes}</p> : null}
                        </div>
                        <button type="button" onClick={() => deleteInjury(inj.id)} className="text-xs font-semibold text-red-700 hover:underline">
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {activeTab === 'insurance' ? (
            <div className="space-y-3">
              <form onSubmit={createPolicy} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                </div>
                {policiesError ? (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{policiesError}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={policySaving}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {policySaving ? 'Adding…' : 'Add policy'}
                </button>
              </form>

              {policiesLoading ? (
                <LoadingInline message="Loading insurance…" />
              ) : policiesList.length === 0 ? (
                <p className="text-sm text-gray-600">No insurance policies on file.</p>
              ) : (
                <ul className="space-y-2">
                  {policiesList.map((p) => (
                    <li key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {p.carrier_name || 'Policy'}{' '}
                            {p.policy_type ? (
                              <span className="text-xs font-semibold text-gray-500">· {String(p.policy_type).replace(/_/g, ' ')}</span>
                            ) : null}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {[p.policy_number ? `#${p.policy_number}` : null, p.claim_number ? `Claim ${p.claim_number}` : null]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </p>
                        </div>
                        <button type="button" onClick={() => deletePolicy(p.id)} className="text-xs font-semibold text-red-700 hover:underline">
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {activeTab === 'treatment' ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                This is a suggested routing based on your documented injuries and insurance coverage.
              </div>

              {pathwayLoading ? (
                <LoadingInline message="Loading treatment pathway…" />
              ) : pathwayError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{pathwayError}</p>
              ) : pathway ? (
                <div className="space-y-4">
                  {pathway.introText ? <div className="text-sm text-gray-900 whitespace-pre-wrap">{pathway.introText}</div> : null}
                  {(pathway.suggestedProviderTypeList || []).map((t) => (
                    <div key={t} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="text-sm font-semibold text-gray-900">{providerTypeLabel(t)}</div>
                      <div className="text-sm text-gray-700 mt-1">{pathway.providerDescriptions?.[t] || '—'}</div>
                    </div>
                  ))}
                  {pathway.closingNote ? <div className="text-sm text-gray-900 whitespace-pre-wrap font-medium">{pathway.closingNote}</div> : null}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No pathway available.</p>
              )}
            </div>
          ) : null}

          {activeTab === 'timeline' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Totals</p>
                <p className="text-sm text-gray-700 mt-1">
                  Total billed: <span className="font-semibold">${Number(visitTotals.totalBilled || 0).toLocaleString()}</span>
                  {' · '}
                  Bills received: <span className="font-semibold">${Number(visitTotals.totalReceived || 0).toLocaleString()}</span>
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Narrative timeline</p>
                {treatmentTimelineLoading ? (
                  <div className="mt-2">
                    <LoadingInline message="Loading narrative timeline…" />
                  </div>
                ) : treatmentTimelineError ? (
                  <p className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {treatmentTimelineError}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                    {treatmentTimeline?.timelineText || treatmentTimeline?.narrative || '—'}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Visits</p>
                {visitsLoading ? (
                  <div className="mt-2">
                    <LoadingInline message="Loading visits…" />
                  </div>
                ) : visitsError ? (
                  <p className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {visitsError}
                  </p>
                ) : visits.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">No visits on file.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {visits.map((v) => (
                      <li key={v.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatISODate(v.visit_date)}{' '}
                          <span className="text-xs font-semibold text-gray-500">
                            · {String(v.visit_type || 'visit').replace(/_/g, ' ')}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {v.provider_name || v.provider_name_override || '—'}
                          {v.billed_amount != null ? ` · $${Number(v.billed_amount).toLocaleString()}` : ''}
                        </p>
                        {v.diagnosis_summary ? (
                          <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">{v.diagnosis_summary}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'documents' ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Documents</h3>

              <form onSubmit={handleUpload} className="space-y-3">
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
                          <span className={doc.uploaded_by === 'user' ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
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
          ) : null}

          {activeTab === 'red_flags' ? (
            <div className="space-y-3">
              {fullDetailLoading ? (
                <LoadingInline message="Loading red flags…" />
              ) : fullDetailError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {fullDetailError}
                </p>
              ) : (fullDetail?.redFlags || []).length === 0 ? (
                <p className="text-sm text-gray-600">No red flags detected.</p>
              ) : (
                <ul className="space-y-2">
                  {fullDetail.redFlags.map((f) => (
                    <li key={f.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {String(f.flag_type || 'flag').replace(/_/g, ' ')}
                        {f.severity ? (
                          <span className="text-xs font-semibold text-gray-500"> · {String(f.severity)}</span>
                        ) : null}
                      </p>
                      {f.explanation ? (
                        <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">{f.explanation}</p>
                      ) : null}
                      {f.recommended_action ? (
                        <p className="text-xs text-gray-600 mt-2">
                          <span className="font-semibold">Recommended:</span> {f.recommended_action}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {activeTab === 'documentation_summary' ? (
            <div className="space-y-4">
              {claimSummaryLoading ? (
                <LoadingInline message="Loading documentation summary…" />
              ) : claimSummaryError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {claimSummaryError}
                </p>
              ) : claimSummary ? (
                <>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Accident summary</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap mt-2">
                      {claimSummary.accidentSummary?.markdown || claimSummary.accidentSummary?.text || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Treatment timeline</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap mt-2">
                      {claimSummary.treatmentTimeline?.markdown || claimSummary.treatmentTimeline?.text || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Documentation index</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap mt-2">
                      {claimSummary.documentationIndex?.markdown || claimSummary.documentationIndex?.text || '—'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">No documentation summary found.</p>
              )}
            </div>
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
