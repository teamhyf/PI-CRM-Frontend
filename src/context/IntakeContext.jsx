import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { evaluateCase } from '../utils/caseQualificationEngine';
import { generateCaseSummary } from '../utils/generateCaseSummary';
import { sampleCases } from '../data/sampleCases';
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
  // Load cases from localStorage on mount, combine with sample cases
  const [cases, setCases] = useState(() => {
    try {
      const storedCases = localStorage.getItem('crm_cases');
      if (storedCases) {
        const parsedCases = JSON.parse(storedCases);
        // Merge with sample cases, avoiding duplicates
        const sampleIds = new Set(sampleCases.map(c => c.caseId));
        const uniqueStoredCases = parsedCases.filter(c => !sampleIds.has(c.caseId));
        return [...sampleCases, ...uniqueStoredCases];
      }
      return sampleCases;
    } catch (error) {
      console.error('Error loading cases from localStorage:', error);
      return sampleCases;
    }
  });

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

  // Load cases from backend API when available (dynamic list from MySQL)
  useEffect(() => {
    let cancelled = false;
    getCases()
      .then((apiCases) => {
        if (!cancelled && Array.isArray(apiCases) && apiCases.length >= 0) {
          setCases(apiCases);
        }
      })
      .catch(() => {
        // Keep initial state (samples + localStorage) when API is unavailable
      });
    return () => { cancelled = true; };
  }, []);

  // Save cases to localStorage whenever cases change (backup when API is down)
  useEffect(() => {
    try {
      // Only save non-sample cases to localStorage
      const nonSampleCases = cases.filter(c => {
        return !sampleCases.some(sc => sc.caseId === c.caseId);
      });
      localStorage.setItem('crm_cases', JSON.stringify(nonSampleCases));
    } catch (error) {
      console.error('Error saving cases to localStorage:', error);
    }
  }, [cases]);

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
      const apiCases = await getCases();
      if (Array.isArray(apiCases)) setCases(apiCases);
    } catch (_e) {
      // Keep current cases if refetch fails
    }
  }, []);

  const updateCase = useCallback(async (caseId, updatedData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
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

        resolve({ caseId, ...updatedData, aiEvaluation, aiSummary });
      }, 500);
    });
  }, []);

  const deleteCase = useCallback(async (caseId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setCases((prev) => prev.filter((c) => c.caseId !== caseId));
        resolve();
      }, 300);
    });
  }, []);

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
