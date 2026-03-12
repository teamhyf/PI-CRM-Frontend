import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { evaluateCase } from '../utils/caseQualificationEngine';
import { generateCaseSummary } from '../utils/generateCaseSummary';
import { getCases } from '../services/chatApi';

const IntakeContext = createContext();

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) {
    throw new Error('useIntake must be used within IntakeProvider');
  }
  return context;
}

export function IntakeProvider({ children }) {
  const { token } = useAuth();
  // Start with empty cases list, fetched from backend API
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [formData, setFormData] = useState({
    contact: {},
    accident: {},
    insurance: {},
    injury: {},
    propertyDamage: {},
    additionalNotes: '',
  });

  // Load cases from backend API on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getCases(token)
      .then((apiCases) => {
        if (!cancelled) {
          setCases(Array.isArray(apiCases) ? apiCases : []);
        }
      })
      .catch((error) => {
        console.error('Error loading cases from API:', error);
        if (!cancelled) {
          setCases([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  const updateFormData = useCallback((step, data) => {
    setFormData((prev) => ({
      ...prev,
      [step]: data,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 7));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const createCaseFromData = useCallback((data) => {
    // Generate case ID based on total cases (including samples)
    const totalCases = cases.length;
    const caseId = `CASE-${new Date().getFullYear()}-${String(totalCases + 1).padStart(3, '0')}`;

    const aiEvaluation = evaluateCase(data);
    const aiSummary = generateCaseSummary(data);

    return {
      caseId,
      ...data,
      aiEvaluation,
      aiSummary,
      status: 'Pending Attorney Review',
      createdAt: new Date().toISOString(),
    };
  }, [cases.length]);

  const submitCase = useCallback(async () => {
    // Simulate async submission using current formData
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCase = createCaseFromData(formData);

        // Add new case to the list
        setCases((prev) => [...prev, newCase]);
        
        // Reset form
        setFormData({
          contact: {},
          accident: {},
          insurance: {},
          injury: {},
          propertyDamage: {},
          additionalNotes: '',
        });
        setCurrentStep(1);
        setEditingCaseId(null);

        resolve(newCase);
      }, 1500); // Simulate API delay
    });
  }, [formData, createCaseFromData]);

  const submitDraftCase = useCallback(async (draftData) => {
    // Add case to local list (used when backend submit succeeded but we need to show it before refetch)
    const newCase = createCaseFromData(draftData);
    setCases((prev) => [...prev, newCase]);
    return newCase;
  }, [createCaseFromData]);

  /** Refetch cases from backend (e.g. after chat submit) so the list stays in sync with MySQL. */
  const refreshCasesFromApi = useCallback(async () => {
    try {
      const apiCases = await getCases(token);
      if (Array.isArray(apiCases)) setCases(apiCases);
    } catch (_e) {
      // Keep current cases if refetch fails
    }
  }, [token]);

  const updateCase = useCallback(async (caseId, updatedData) => {
    // Update via API endpoint if the case came from the backend (has numeric ID)
    // Otherwise update locally for form-submitted cases
    const numericId = caseId.replace(/\D/g, '');

    if (numericId) {
      try {
        // Call backend PATCH endpoint to update status
        const status = updatedData.status ? updatedData.status.toLowerCase().replace(/\s+/g, '_') : 'new';
        await fetch(`/api/cases/${caseId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } catch (error) {
        console.error('Error updating case via API:', error);
      }
    }

    // Update local state
    const aiEvaluation = evaluateCase(updatedData);
    const aiSummary = generateCaseSummary(updatedData);

    setCases((prev) =>
      prev.map((c) => {
        if (c.caseId === caseId) {
          return {
            ...c,
            ...updatedData,
            aiEvaluation,
            aiSummary,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    // Reset form
    setFormData({
      contact: {},
      accident: {},
      insurance: {},
      injury: {},
      propertyDamage: {},
      additionalNotes: '',
    });
    setCurrentStep(1);
    setEditingCaseId(null);

    return { caseId, ...updatedData, aiEvaluation, aiSummary };
  }, []);

  const deleteCase = useCallback(async (caseId) => {
    // Delete via API endpoint if the case has a numeric ID (backend case)
    const numericId = caseId.replace(/\D/g, '');

    if (numericId) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${baseUrl}/api/cases/${caseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete case');
        }
      } catch (error) {
        console.error('Error deleting case via API:', error);
        throw error;
      }
    }

    // Remove from local state
    setCases((prev) => prev.filter((c) => c.caseId !== caseId));
  }, [token]);

  const loadCaseForEdit = useCallback((caseData) => {
    setFormData({
      contact: caseData.contact || {},
      accident: caseData.accident || {},
      insurance: caseData.insurance || {},
      injury: caseData.injury || {},
      propertyDamage: caseData.propertyDamage || {},
      additionalNotes: caseData.additionalNotes || '',
    });
    setEditingCaseId(caseData.caseId);
    setCurrentStep(1);
  }, []);

  const resetForNewCase = useCallback(() => {
    setFormData({
      contact: {},
      accident: {},
      insurance: {},
      injury: {},
      propertyDamage: {},
      additionalNotes: '',
    });
    setCurrentStep(1);
    setEditingCaseId(null);
  }, []);

  const submitOrUpdateCase = useCallback(async () => {
    if (editingCaseId) {
      return await updateCase(editingCaseId, formData);
    } else {
      return await submitCase();
    }
  }, [editingCaseId, formData, submitCase, updateCase]);

  const value = {
    cases,
    isLoading,
    currentStep,
    formData,
    editingCaseId,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    submitCase,
    submitDraftCase,
    submitOrUpdateCase,
    updateCase,
    deleteCase,
    loadCaseForEdit,
    resetForNewCase,
    refreshCasesFromApi,
  };

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}
