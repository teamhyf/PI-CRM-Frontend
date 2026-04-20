import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClaimantAuth } from '../context/ClaimantAuthContext';
import { AIBadge } from '../components/AIIcon';
import { ClaimantSiteHeader } from '../components/portal/ClaimantSiteHeader';
import { ClaimantSiteFooter } from '../components/portal/ClaimantSiteFooter';

const FLOW_STEPS = [
  {
    step: '1',
    title: 'AI case intake',
    bullets: [
      'Submit accident facts through guided AI intake.',
      'The system converts your story into structured case data.',
      'Initial case record is prepared for legal review.',
    ],
  },
  {
    step: '2',
    title: 'Overview',
    bullets: [
      'View core case details and status in one place.',
      'Track claim progress from intake to closure.',
      'See the latest case snapshot anytime.',
    ],
  },
  {
    step: '3',
    title: 'Participants',
    bullets: [
      'Add other drivers, passengers, and witnesses.',
      'Capture police/emergency and other vehicle details.',
      'Keep involved-party information complete and current.',
    ],
  },
  {
    step: '4',
    title: 'Injuries',
    bullets: [
      'Document injury types, severity, and updates.',
      'Maintain a consistent medical impact record.',
      'Help legal and care teams stay aligned.',
    ],
  },
  {
    step: '5',
    title: 'Insurance',
    bullets: [
      'Store policy and carrier information.',
      'Support coverage and liability validation.',
      'Reduce delays from missing insurance data.',
    ],
  },
  {
    step: '6',
    title: 'Treatment',
    bullets: [
      'Track visits, referrals, and treatment progression.',
      'Keep recovery milestones visible across teams.',
      'Align medical updates with case strategy.',
    ],
  },
  {
    step: '7',
    title: 'Timeline',
    bullets: [
      'Organize milestones in chronological order.',
      'See legal and medical events in one timeline.',
      'Improve readiness with complete event history.',
    ],
  },
  {
    step: '8',
    title: 'Documents',
    bullets: [
      'Upload records, photos, bills, and evidence.',
      'Keep files centralized and easy to access.',
      'Maintain clean document history for the case.',
    ],
  },
  {
    step: '9',
    title: 'Red flags & documentation summary',
    bullets: [
      'AI flags blockers, risks, and missing items.',
      'Review documentation completeness before negotiation.',
      'Resolve issues early to avoid settlement delays.',
    ],
  },
  {
    step: '10',
    title: 'Settlement and closure',
    bullets: [
      'Track offers, negotiation updates, and outcomes.',
      'Finalize settlement details and closure records.',
      'Share final case status through the portal.',
    ],
  },
];

export function HowItWorks() {
  const location = useLocation();
  const { isAuthenticated: staffAuth, user, logout: staffLogout } = useAuth();
  const { isAuthenticated: claimantAuth, claimant, logout: claimantLogout } = useClaimantAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <div
        className="fixed inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-70 pointer-events-none"
        aria-hidden
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-50/90 via-white to-white pointer-events-none" aria-hidden />

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
                <Link to={{ pathname: '/', search: '?intake=open' }} className="text-slate-600 hover:text-slate-900 transition-colors">
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
                  <span className="hidden sm:inline text-xs text-slate-500 max-w-[10rem] md:max-w-[12rem] truncate" title={user.email}>
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
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-14 md:pt-14 md:pb-18">
            <div className="rounded-3xl bg-[#c9e5dc] px-4 py-8 sm:px-6 md:px-8 md:py-10 ring-1 ring-[#9bc5b7]/70 shadow-sm">
              <div className="flex justify-center">
                <div className="inline-flex rounded-2xl bg-[#5a3a97] px-5 py-3 text-center shadow-sm">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide text-white">
                    HOW IT WORKS: FROM AI INTAKE TO SETTLEMENT
                  </h1>
                </div>
              </div>

              <p className="mx-auto mt-4 max-w-4xl text-center text-sm sm:text-base text-slate-700">
                A 10-step claimant journey mapped directly to the case view side-menu workflow.
              </p>

              <div className="mt-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {FLOW_STEPS.slice(0, 5).map((step) => (
                    <article key={step.step} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 min-h-[15.5rem]">
                      <h2 className="text-[1.05rem] font-bold leading-tight text-slate-900">{step.title}</h2>
                      <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed text-slate-700">
                        {step.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a3a97]" aria-hidden />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
                <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {FLOW_STEPS.slice(0, 5).map((step) => (
                    <div key={`top-num-${step.step}`} className="hidden lg:flex items-center justify-center">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#5a3a97] text-2xl font-bold ring-2 ring-[#5a3a97]/50 shadow-sm">
                        {step.step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 hidden lg:block">
                <div className="relative h-12">
                  <div className="absolute left-[2%] right-[2%] top-5 border-t-2 border-[#5a3a97]/70" />
                  <div className="absolute right-[2%] top-5 h-12 w-12 rounded-br-full border-b-2 border-r-2 border-[#5a3a97]/70" />
                </div>
              </div>

              <div className="mt-2">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[...FLOW_STEPS.slice(5)].reverse().map((step) => (
                    <article key={step.step} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 min-h-[15.5rem]">
                      <h2 className="text-[1.05rem] font-bold leading-tight text-slate-900">{step.title}</h2>
                      <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed text-slate-700">
                        {step.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a3a97]" aria-hidden />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
                <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[...FLOW_STEPS.slice(5)].reverse().map((step) => (
                    <div key={`bottom-num-${step.step}`} className="hidden lg:flex items-center justify-center">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#5a3a97] text-2xl font-bold ring-2 ring-[#5a3a97]/50 shadow-sm">
                        {step.step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 hidden lg:block">
                <div className="relative h-8">
                  <div className="absolute left-[2%] right-[2%] top-1 border-t-2 border-[#5a3a97]/70" />
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <div className="inline-flex rounded-lg bg-[#5a3a97] px-4 py-2 text-white text-sm font-medium">
                  Claimant portal case workflow
                </div>
              </div>
            </div>
          </section>

          <ClaimantSiteFooter staffAuthenticated={staffAuth} />
        </main>
      </div>
    </div>
  );
}
