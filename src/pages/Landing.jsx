/**
 * Landing Page
 * Public page with AI Assistant CTA – submit a case from the popup without logging in.
 * Cases appear in the portal case list; users can log in later to review.
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIntake } from '../context/IntakeContext';
import { IntakeModal } from '../components/IntakeModal';
import { ChatIntakeModal } from '../components/ChatIntakeModal';
import { AISparklesIcon, AIBadge } from '../components/AIIcon';
import { startSession } from '../services/chatApi';

export function Landing() {
  const { isAuthenticated } = useAuth();
  const { resetForNewCase } = useIntake();
  const [modalOpen, setModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [chatSessionError, setChatSessionError] = useState('');
  const [caseSubmitted, setCaseSubmitted] = useState(false);

  const openAssistant = () => {
    setCaseSubmitted(false);
    resetForNewCase();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmitSuccess = () => {
    setCaseSubmitted(true);
    setModalOpen(false);
  };

  const openChatAssistant = useCallback(() => {
    setCaseSubmitted(false);
    setChatSessionError('');
    setChatOpen(true);
    setChatSession(null);
  }, []);

  const handleStartChatWithContact = useCallback(async (contact) => {
    setChatSessionError('');
    try {
      const session = await startSession(contact);
      setChatSession(session);
    } catch (err) {
      setChatSessionError(err.message || 'Failed to start chat');
    }
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    setChatSession(null);
    setChatSessionError('');
  }, []);

  const handleChatSuccess = () => {
    setCaseSubmitted(true);
    setChatOpen(false);
    setChatSession(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50">
      {/* Nav */}
      <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PI CRM
            </span>
            <AIBadge size="sm" />
          </div>
          <nav className="flex items-center gap-4">
            <button
              type="button"
              onClick={openAssistant}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Submit a case
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-sm py-2 px-4">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4">
                Log in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Personal injury support,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              powered by AI
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Submit your case in minutes. Our AI Assistant guides you through the intake—no account needed.
            Log in later to review status and manage your case.
          </p>

          {/* AI Assistant CTAs */}
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={openAssistant}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                <AISparklesIcon className="w-7 h-7" />
              </span>
              Start with AI Assistant (Form)
            </button>

            <button
              type="button"
              onClick={openChatAssistant}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-blue-700 font-semibold text-sm border border-blue-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <AISparklesIcon className="w-5 h-5 text-blue-600" />
              Chat with AI Assistant
            </button>
          </div>

          {/* Success message (after submit from modal) */}
          {caseSubmitted && (
            <div className="mt-8 p-4 rounded-xl bg-green-50 border border-green-200 text-center max-w-md mx-auto animate-fade-in">
              <p className="text-green-800 font-medium">
                Thank you for submitting your case. We will get back to you soon.
              </p>
            </div>
          )}
        </div>

        {/* Value points */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/80 border border-gray-200/60 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <AISparklesIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">AI-guided intake</h3>
            <p className="text-sm text-gray-600">Answer a few questions; our assistant builds your case summary.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/80 border border-gray-200/60 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No signup required</h3>
            <p className="text-sm text-gray-600">Submit from here, then log in when you’re ready to review.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/80 border border-gray-200/60 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">One case list</h3>
            <p className="text-sm text-gray-600">All submissions appear in the portal; log in to see and manage them.</p>
          </div>
        </div>
      </main>

      <IntakeModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSuccess={handleSubmitSuccess}
      />

      <ChatIntakeModal
        isOpen={chatOpen}
        onClose={closeChat}
        onSuccess={handleChatSuccess}
        sessionId={chatSession?.sessionId ?? null}
        initialDraft={chatSession?.draft ?? null}
        initialMessages={chatSession?.messages ?? null}
        initialStatus={chatSession?.status ?? 'collecting'}
        sessionError={chatSessionError}
        onStartChatWithContact={handleStartChatWithContact}
        onRetrySession={async () => {
          setChatSessionError('');
          try {
            const session = await startSession();
            setChatSession(session);
          } catch (err) {
            setChatSessionError(err.message || 'Failed to start chat');
          }
        }}
        onStartOver={() => {
          setChatSession(null);
          setChatSessionError('');
        }}
      />
    </div>
  );
}
