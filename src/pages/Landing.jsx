/**
 * Landing Page — public marketing + AI intake entry points
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClaimantAuth } from '../context/ClaimantAuthContext';
import { AISparklesIcon, AIBadge } from '../components/AIIcon';
import { AICaseIntakeModal } from '../components/AICaseIntakeModal';
import { ClaimantSiteHeader } from '../components/portal/ClaimantSiteHeader';
import { ClaimantSiteFooter } from '../components/portal/ClaimantSiteFooter';

const FEATURE_GROUPS = [
  {
    title: 'Firm workspace',
    subtitle: 'Everything your team needs in one place',
    items: [
      { title: 'Dashboard & analytics', desc: 'Case pipeline, workload, and firm-level visibility.' },
      { title: 'Cases & matter files', desc: 'Full case lifecycle, injuries, participants, and timelines.' },
      { title: 'Leads & intake', desc: 'Capture and qualify leads before they become cases.' },
      { title: 'AI-guided intake', desc: 'Voice and guided forms turn conversations into structured case data.' },
      { title: 'Documents & completeness', desc: 'Uploads, AI summaries, and smart checklists for what is missing.' },
      { title: 'Insurance & policies', desc: 'Track carriers, policies, and verification workflows.' },
      { title: 'Referrals & providers', desc: 'Medical provider directory, referrals, and visit tracking.' },
      { title: 'Settlement & closure', desc: 'Settlement tracking, attorney referrals, and closure summaries.' },
      { title: 'Red flags & compliance', desc: 'Automated risk signals and case messaging in one thread.' },
    ],
  },
  {
    title: 'Claimant portal',
    subtitle:
      'Full case visibility in one place. When a matter opens, clients get a secure login link by email—no extra signup on this site.',
    items: [
      {
        title: 'Overview, injuries & insurance',
        desc: 'Accident summary, documented injuries, participants, and policy details aligned with your case file.',
      },
      {
        title: 'Documents',
        desc: 'Upload police reports, bills, photos, and records securely; staff see the same document list.',
      },
      {
        title: 'Treatment routing',
        desc: 'Suggested referrals and injury-based pathway guidance—mirrors what your legal team sees.',
      },
      {
        title: 'Timeline',
        desc: 'Medical visits and treatment milestones so you can follow care in order.',
      },
      {
        title: 'Red flags & documentation summary',
        desc: 'Important alerts plus a clear view of what records or steps may still be outstanding.',
      },
      {
        title: 'Settlement',
        desc: 'Settlement-oriented details, resolution readiness, and closure information when the matter wraps up.',
      },
    ],
  },
  {
    title: 'Provider portal',
    subtitle: 'Clinics and records partners',
    items: [
      { title: 'Assigned cases', desc: 'See matters linked by referral or documented visits.' },
      { title: 'Medical uploads', desc: 'Send treatment notes, imaging, and bills to the file.' },
      { title: 'Secure notes', desc: 'Leave staff-visible messages on the case without email chains.' },
    ],
  },
];

function FeatureCardIcon({ groupTitle, itemTitle }) {
  const cls =
    groupTitle === 'Firm workspace'
      ? 'bg-lime-100 text-lime-800 border border-lime-200/80'
      : groupTitle === 'Claimant portal'
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
        : 'bg-violet-50 text-violet-700 border border-violet-100';

  const icon = (() => {
    switch (itemTitle) {
      case 'Dashboard & analytics':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3.75h16.5v16.5H3.75V3.75zm4.5 10.5v3m4.5-7.5v7.5m4.5-4.5v4.5"
          />
        );
      case 'Cases & matter files':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 6.75A2.25 2.25 0 016.75 4.5h4.086a2.25 2.25 0 011.591.659l1.914 1.914a2.25 2.25 0 001.591.659H17.25A2.25 2.25 0 0119.5 10.5v6.75A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25V6.75z"
          />
        );
      case 'Leads & intake':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h9m-9 0l3-3m-3 3l3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25h3.75v13.5h-3.75" />
          </>
        );
      case 'AI-guided intake':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        );
      case 'Documents & completeness':
        return (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3.75h7.5l3 3v12a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-13.5a1.5 1.5 0 011.5-1.5z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 11.25" />
          </>
        );
      case 'Insurance & policies':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l6.75 3v5.25c0 4.07-2.75 7.73-6.75 8.75-4-1.02-6.75-4.68-6.75-8.75V6L12 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75h4.5" />
          </>
        );
      case 'Referrals & providers':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 9.75h3m-1.5-1.5v3" />
          </>
        );
      case 'Settlement & closure':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h9m-9 3.75h5.25" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25h15v13.5h-15V5.25z" />
          </>
        );
      case 'Red flags & compliance':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25l8.25 13.5H3.75L12 5.25z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v3.75m0 2.25h.008v.008H12v-.008z" />
          </>
        );
      case 'Overview, injuries & insurance':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15v10.5h-15V6.75z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 11.25h7.5m-7.5 3h4.5" />
          </>
        );
      case 'Documents':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3.75h7.5l3 3v12a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-13.5a1.5 1.5 0 011.5-1.5zM10.5 9.75h3"
          />
        );
      case 'Treatment routing':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h6m0 0l-2.25-2.25M10.5 12l-2.25 2.25" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6h6m0 0l-2.25-2.25M19.5 6l-2.25 2.25M13.5 18h6m0 0l-2.25-2.25M19.5 18l-2.25 2.25" />
          </>
        );
      case 'Timeline':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75h12M6 12h12M6 17.25h12" />
            <circle cx="4.5" cy="6.75" r="0.75" />
            <circle cx="4.5" cy="12" r="0.75" />
            <circle cx="4.5" cy="17.25" r="0.75" />
          </>
        );
      case 'Red flags & documentation summary':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75l7.5 4.5v7.5l-7.5 4.5-7.5-4.5v-7.5l7.5-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 2.25h.008v.008H12v-.008z" />
          </>
        );
      case 'Settlement':
        return (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 6h7.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 018.25 6z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 10.5h4.5m-4.5 3h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 9H6a1.5 1.5 0 00-1.5 1.5v6A1.5 1.5 0 006 18h.75" />
          </>
        );
      case 'Assigned cases':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25h13.5v13.5H5.25V5.25z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9h7.5m-7.5 3h7.5" />
          </>
        );
      case 'Medical uploads':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V7.5m0 0l-3 3m3-3l3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5v1.5A2.25 2.25 0 006.75 20.25h10.5A2.25 2.25 0 0019.5 18v-1.5" />
          </>
        );
      case 'Secure notes':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h6m-6 3h4.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.5h12a1.5 1.5 0 011.5 1.5v12L15 15h-9A1.5 1.5 0 014.5 13.5V6A1.5 1.5 0 016 4.5z" />
          </>
        );
      default:
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        );
    }
  })();
  return (
    <div
      className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${cls}`}
      aria-hidden
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        {icon}
      </svg>
    </div>
  );
}

function SectionHeadingIcon({ title }) {
  const cls = 'h-6 w-6 shrink-0 text-slate-700';
  if (title === 'Firm workspace') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 21h16.5M5.25 21V7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m4.5 0V4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21"
        />
      </svg>
    );
  }
  if (title === 'Claimant portal') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75a17.9 17.9 0 01-7.5-1.632z"
        />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 7.5h16.5M6.75 3v3m10.5-3v3M6 21h12a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 7.5v11.25A2.25 2.25 0 006 21zm3.75-8.25h4.5m-4.5 3h4.5"
      />
    </svg>
  );
}

export function Landing() {
  const location = useLocation();
  const { isAuthenticated: staffAuth, user, logout: staffLogout } = useAuth();
  const { isAuthenticated: claimantAuth, claimant, logout: claimantLogout } = useClaimantAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseSubmitted, setCaseSubmitted] = useState(false);
  const [intakeOutcome, setIntakeOutcome] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('intake') !== 'open') return;
    setCaseSubmitted(false);
    setIntakeOutcome(null);
    setIntakeOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('intake');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openAIIntake = () => {
    setCaseSubmitted(false);
    setIntakeOutcome(null);
    setIntakeOpen(true);
  };
  const closeAIIntake = () => setIntakeOpen(false);
  const handleIntakeSuccess = (result) => {
    setIntakeOutcome(result ?? {});
    setCaseSubmitted(true);
    setIntakeOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Subtle grid (light) */}
      <div
        className="fixed inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-70 pointer-events-none"
        aria-hidden
      />
      <div
        className="fixed inset-0 bg-gradient-to-b from-slate-50/90 via-white to-white pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10">
        {claimantAuth ? (
          <ClaimantSiteHeader
            variant="authenticated"
            tone="light"
            email={claimant?.email}
            onLogout={claimantLogout}
          />
        ) : staffAuth ? (
          <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4 min-h-16 py-3">
              <div className="flex justify-start min-w-0">
                <Link to="/" className="flex items-center gap-2 shrink-0">
                  <span className="text-xl font-bold text-slate-900 tracking-tight">PI CRM</span>
                  <AIBadge size="sm" />
                </Link>
              </div>
              <nav
                className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1 text-sm"
                aria-label="Primary navigation"
              >
                <Link
                  to="/"
                  className={
                    location.pathname === '/'
                      ? 'font-semibold text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 transition-colors'
                  }
                >
                  Home
                </Link>
                <Link
                  to="/how-it-works"
                  className={
                    location.pathname.startsWith('/how-it-works')
                      ? 'font-semibold text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 transition-colors'
                  }
                >
                  How it Works
                </Link>
                <a href="/#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                  Features
                </a>
                <Link
                  to={{ pathname: '/', search: '?intake=open' }}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  AI intake
                </Link>
                <Link
                  to="/dashboard"
                  className={
                    location.pathname.startsWith('/dashboard')
                      ? 'font-semibold text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 transition-colors'
                  }
                >
                  Dashboard
                </Link>
              </nav>
              <div className="flex justify-end items-center gap-2 sm:gap-3 min-w-0">
                {user?.email ? (
                  <span
                    className="hidden sm:inline text-xs text-slate-500 max-w-[10rem] md:max-w-[12rem] truncate"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => staffLogout()}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 shrink-0"
                >
                  Log out
                </button>
              </div>
            </div>
          </header>
        ) : (
          <ClaimantSiteHeader variant="public" tone="light" />
        )}

        <main>
          {/* Hero */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 md:pt-20 md:pb-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-lime-700 text-xs font-bold tracking-[0.2em] uppercase mb-4">
                  Personal injury · AI-native CRM
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
                  Run your PI practice with{' '}
                  <span className="bg-gradient-to-r from-lime-700 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                    intelligence
                  </span>{' '}
                  at every step
                </h1>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                  From first contact through settlement: AI-assisted intake, structured case files, claimant and provider
                  portals, and tools your firm already expects—leads, documents, insurance, referrals, and more.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={openAIIntake}
                    className="inline-flex items-center gap-3 rounded-full bg-lime-400 px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-lime-400/25 hover:bg-lime-300 transition-all hover:-translate-y-0.5"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/10">
                      <AISparklesIcon className="w-6 h-6 text-slate-900" />
                    </span>
                    Start AI case intake
                  </button>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    Explore features
                  </a>
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  No account required to submit from this page. Claimants and clinics use dedicated portals when your team
                  invites them.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-lime-200/40 via-indigo-100/50 to-violet-100/60 blur-2xl opacity-90" />
                <div className="relative rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-900/5">
                  <h3 className="text-xs font-bold text-lime-800 uppercase tracking-[0.15em] mb-6">Who it’s for</h3>
                  <ul className="space-y-5">
                    {[
                      { k: 'Firm staff', v: 'Attorneys, admins, intake—full CRM on /dashboard after login.' },
                      { k: 'Claimants', v: 'Client portal for status, uploads, and pathway guidance.' },
                      { k: 'Medical providers', v: 'Secure portal for records tied to referrals and visits.' },
                    ].map((row, i) => (
                      <li key={row.k} className="flex gap-4">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            i === 0
                              ? 'bg-lime-100 text-lime-800 border border-lime-200'
                              : i === 1
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}
                        >
                          ✓
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{row.k}</p>
                          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{row.v}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {caseSubmitted && (
              <div className="mt-12 max-w-lg mx-auto lg:mx-0 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-6 py-5 text-center text-emerald-950 animate-fade-in space-y-3 shadow-sm">
                {intakeOutcome?.autoConverted ? (
                  <>
                    <p className="font-semibold text-emerald-900 text-base">Your case was created.</p>
                    <p className="text-sm text-emerald-800/95 leading-relaxed">
                      We sent an email to the address you provided with a link to the claimant portal and how to sign in.
                      Check your inbox and spam folder for next steps.
                    </p>
                    <Link
                      to="/portal/login"
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Client login
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-emerald-900 text-base">Thank you — we received your submission.</p>
                    <p className="text-sm text-emerald-800/95 leading-relaxed">
                      Our team will review your inquiry and follow up by phone or email.
                    </p>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Feature catalog */}
          <section id="features" className="scroll-mt-24 border-t border-slate-200 bg-slate-50/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
              <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  Everything in one platform
                </h2>
                <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                  Built for high-volume PI firms: intake, case building, collaboration with clients and providers, and
                  operational visibility.
                </p>
              </div>

              <div className="space-y-24 md:space-y-28">
                {FEATURE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="mb-10 md:mb-12 text-center sm:text-left max-w-2xl">
                      <h3 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
                        <SectionHeadingIcon title={group.title} />
                        <span>{group.title}</span>
                      </h3>
                      <p className="text-slate-600 mt-2 leading-relaxed">{group.subtitle}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                      {group.items.map((item) => (
                          <div
                            key={item.title}
                            className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md hover:border-lime-200/70 transition-all duration-200"
                          >
                            <FeatureCardIcon groupTitle={group.title} itemTitle={item.title} />
                            <h4 className="font-semibold text-slate-900 leading-snug">{item.title}</h4>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
                          </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA band */}
          <section className="px-4 sm:px-6 py-12 md:py-16">
            <div className="max-w-6xl mx-auto rounded-3xl bg-slate-900 px-6 py-14 md:px-12 md:py-16 text-center shadow-xl shadow-slate-900/20">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Ready to open a matter?</h2>
              <p className="mt-3 text-slate-400 max-w-xl mx-auto leading-relaxed">
                Start with AI intake from this page, or sign in as staff to manage the full CRM.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={openAIIntake}
                  className="rounded-full bg-lime-400 px-8 py-3.5 font-semibold text-slate-900 shadow-lg shadow-lime-400/20 hover:bg-lime-300 transition-colors"
                >
                  Start AI case intake
                </button>
                {!staffAuth && (
                  <Link
                    to="/portal/login"
                    className="rounded-full border-2 border-white/25 bg-transparent px-8 py-3.5 font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    User login
                  </Link>
                )}
              </div>
            </div>
          </section>

          <ClaimantSiteFooter staffAuthenticated={staffAuth} />
        </main>
      </div>

      <AICaseIntakeModal isOpen={intakeOpen} onClose={closeAIIntake} onSuccess={handleIntakeSuccess} />
    </div>
  );
}
