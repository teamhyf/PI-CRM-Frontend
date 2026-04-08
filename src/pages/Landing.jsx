/**
 * Landing Page — public marketing + AI intake entry points
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AISparklesIcon, AIBadge } from '../components/AIIcon';
import { AICaseIntakeModal } from '../components/AICaseIntakeModal';

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
    subtitle: 'Clients stay informed without calling the office',
    items: [
      { title: 'Case status', desc: 'Real-time view of where the matter stands.' },
      { title: 'Documents', desc: 'Upload police reports, bills, photos, and records securely.' },
      { title: 'Treatment pathway', desc: 'Injury-based guidance on suggested care and next steps.' },
      { title: 'Case closure', desc: 'Final summary when the case resolves.' },
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

export function Landing() {
  const { isAuthenticated } = useAuth();
  const [caseSubmitted, setCaseSubmitted] = useState(false);
  const [intakeOutcome, setIntakeOutcome] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Subtle grid + gradient */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-950/80 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 min-h-16 py-3">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                PI CRM
              </span>
              <AIBadge size="sm" />
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                Features
              </a>
              <button
                type="button"
                onClick={openAIIntake}
                className="text-slate-400 hover:text-white transition-colors"
              >
                AI intake
              </button>
              <Link to="/portal/login" className="text-slate-400 hover:text-white transition-colors">
                Claimant portal
              </Link>
              <Link to="/provider-portal/login" className="text-slate-400 hover:text-white transition-colors">
                Provider portal
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95"
                >
                  Staff login
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="text-sky-400 text-sm font-semibold tracking-wide uppercase mb-4">
                  Personal injury · AI-native CRM
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                  Run your PI practice with{' '}
                  <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    intelligence
                  </span>{' '}
                  at every step
                </h1>
                <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
                  From first contact through settlement: AI-assisted intake, structured case files, claimant and provider
                  portals, and tools your firm already expects—leads, documents, insurance, referrals, and more.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={openAIIntake}
                    className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <AISparklesIcon className="w-7 h-7" />
                    </span>
                    Start AI case intake
                  </button>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
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
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 blur-2xl" />
                <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-sm shadow-2xl">
                  <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-6">Who it’s for</h3>
                  <ul className="space-y-5">
                    {[
                      { k: 'Firm staff', v: 'Attorneys, admins, intake—full CRM on /dashboard after login.' },
                      { k: 'Claimants', v: 'Client portal for status, uploads, and pathway guidance.' },
                      { k: 'Medical providers', v: 'Secure portal for records tied to referrals and visits.' },
                    ].map((row) => (
                      <li key={row.k} className="flex gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                          ✓
                        </span>
                        <div>
                          <p className="font-semibold text-white">{row.k}</p>
                          <p className="text-sm text-slate-400 mt-0.5">{row.v}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {caseSubmitted && (
              <div className="mt-12 max-w-lg mx-auto lg:mx-0 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-6 py-5 text-center text-emerald-200 animate-fade-in space-y-3">
                {intakeOutcome?.autoConverted ? (
                  <>
                    <p className="font-semibold text-emerald-100 text-base">
                      Your case was created.
                    </p>
                    <p className="text-sm text-emerald-200/95 leading-relaxed">
                      We sent an email to the address you provided with a link to the claimant
                      portal and how to sign in. Check your inbox and spam folder for next
                      steps.
                    </p>
                    <Link
                      to="/portal/login"
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 transition-colors"
                    >
                      Claimant portal login
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-emerald-100 text-base">
                      Thank you — we received your submission.
                    </p>
                    <p className="text-sm text-emerald-200/95 leading-relaxed">
                      Our team will review your inquiry and follow up by phone or email.
                    </p>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Feature catalog */}
          <section id="features" className="scroll-mt-24 border-t border-white/10 bg-slate-900/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Everything in one platform</h2>
                <p className="mt-4 text-slate-400 text-lg">
                  Built for high-volume PI firms: intake, case building, collaboration with clients and providers, and
                  operational visibility.
                </p>
              </div>

              <div className="space-y-24">
                {FEATURE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="mb-10">
                      <h3 className="text-2xl font-bold text-white">{group.title}</h3>
                      <p className="text-slate-500 mt-1">{group.subtitle}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.items.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 hover:border-sky-500/30 hover:bg-slate-900 transition-colors"
                        >
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to open a matter?</h2>
              <p className="mt-3 text-slate-400 max-w-xl mx-auto">
                Start with AI intake from this page, or sign in as staff to manage the full CRM.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={openAIIntake}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg hover:opacity-95"
                >
                  Start AI case intake
                </button>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/20 px-8 py-3 font-semibold text-white hover:bg-white/5"
                  >
                    Staff login
                  </Link>
                )}
              </div>
            </div>
          </section>

          <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} AI Personal Injury CRM. Case management tooling—not legal advice.</p>
          </footer>
        </main>
      </div>

      <AICaseIntakeModal isOpen={intakeOpen} onClose={closeAIIntake} onSuccess={handleIntakeSuccess} />
    </div>
  );
}
