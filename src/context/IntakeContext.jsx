import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { evaluateCase } from '../utils/caseQualificationEngine';
import { generateCaseSummary } from '../utils/generateCaseSummary';
import { sampleCases } from '../data/sampleCases';

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
  const [formData, setFormData] = useState({
    contact: {},
    accident: {},
    insurance: {},
    injury: {},
    propertyDamage: {},
    additionalNotes: '',
  });

  // Save cases to localStorage whenever cases change
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

  const submitCase = useCallback(async () => {
    // Simulate async submission
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate case ID based on total cases (including samples)
        const totalCases = cases.length;
        const caseId = `CASE-${new Date().getFullYear()}-${String(totalCases + 1).padStart(3, '0')}`;
        
        const aiEvaluation = evaluateCase(formData);
        const aiSummary = generateCaseSummary(formData);

        const newCase = {
          caseId,
          ...formData,
          aiEvaluation,
          aiSummary,
          status: 'Pending Attorney Review',
          createdAt: new Date().toISOString(),
        };

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

        resolve(newCase);
      }, 1500); // Simulate API delay
    });
  }, [formData, cases.length]);

  const value = {
    cases,
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    submitCase,
  };

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}
