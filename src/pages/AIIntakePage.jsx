import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AICaseIntakeModal } from '../components/AICaseIntakeModal';
import { AISparklesIcon, AIBadge } from '../components/AIIcon';

export function AIIntakePage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex flex-col items-center justify-start pt-10 px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="relative inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shadow-blue-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shadow">
              <AISparklesIcon className="w-3 h-3 text-white" />
            </span>
          </div>
          <AIBadge size="sm" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1 flex items-center justify-center gap-2">
          AI Case Intake
          <AISparklesIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
        </h1>
        <p className="text-sm text-gray-600">
          Describe the accident in your own words. We’ll structure it into a lead automatically.
        </p>
      </div>

      <AICaseIntakeModal
        isOpen={open}
        onClose={handleClose}
        onSuccess={handleClose}
      />
    </div>
  );
}

