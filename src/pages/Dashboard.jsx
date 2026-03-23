/**
 * Admin dashboard — live PI case / lead metrics and charts from the API.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AISparklesIcon, AIBadge } from '../components/AIIcon';
import { AICaseIntakeModal } from '../components/AICaseIntakeModal';
import ClaimantsManagementCard from '../components/ClaimantsManagementCard';
import { DashboardAnalytics } from '../components/DashboardAnalytics';
import { LoadingInline } from '../components/LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

function formatDate(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

function claimantName(c) {
  const n = [c.claimant_first_name, c.claimant_last_name].filter(Boolean).join(' ').trim();
  return n || '—';
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (['settled', 'closed'].includes(s)) return 'bg-emerald-100 text-emerald-800';
  if (['new', 'docs_pending'].includes(s)) return 'bg-slate-100 text-slate-800';
  if (['demand_ready', 'under_review', 'in_treatment'].includes(s)) return 'bg-indigo-100 text-indigo-800';
  if (['referred_out'].includes(s)) return 'bg-violet-100 text-violet-800';
  return 'bg-amber-100 text-amber-800';
}

export function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [aiIntakeOpen, setAiIntakeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        const base = getBaseUrl();
        const res = await fetch(`${base}/api/dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to load dashboard');
        if (!cancelled) setOverview(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLoadError(e.message || 'Failed to load dashboard');
          setOverview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const t = overview?.totals;

  return (
    <div className="w-full px-6">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <AIBadge size="sm" />
            </div>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <AISparklesIcon className="w-4 h-4 text-violet-500 flex-shrink-0" />
              Live metrics for PI cases, leads, and claimant portal activity
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/cases"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              All cases
            </Link>
            <Link
              to="/leads"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Leads
            </Link>
            <button type="button" onClick={() => setAiIntakeOpen(true)} className="btn-primary">
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              AI Case Intake
            </button>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{loadError}</div>
      ) : null}

      {loading ? (
        <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-4">
          <LoadingInline message="Loading dashboard…" />
        </div>
      ) : null}

      {/* KPI cards — from database totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card border-l-4 border-blue-500 hover:border-blue-600 animate-fade-in group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">PI cases</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                {t?.totalCases ?? '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">All statuses in CRM</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 shadow-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-amber-500 hover:border-amber-600 animate-fade-in group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Open leads</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 group-hover:text-amber-600 transition-colors">
                {t?.openLeads ?? '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">New + under review</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-4 shadow-lg">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-green-500 hover:border-green-600 animate-fade-in group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Portal users</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 group-hover:text-green-600 transition-colors">
                {t?.portalClaimants ?? '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Claimants with portal access</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-4 shadow-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-purple-500 hover:border-purple-600 animate-fade-in group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg. AI score</p>
              <p className="text-4xl font-bold text-gray-900 mt-2 group-hover:text-purple-600 transition-colors">
                {t?.avgViabilityScore ?? '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Viability (cases with score)</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-4 shadow-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <DashboardAnalytics overview={overview} />

      {/* High risk */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Highest risk scores</h2>
            <p className="text-sm text-gray-600 mt-1">Prioritize review for cases with elevated risk.</p>
          </div>
          <Link to="/cases" className="text-sm font-semibold text-blue-600 hover:underline">
            View all cases
          </Link>
        </div>

        {!overview?.highRiskCases?.length ? (
          <div className="text-sm text-gray-600">No cases in the database yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Case</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Claimant</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Accident</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Risk</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {overview.highRiskCases.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-900">#{c.id}</td>
                    <td className="px-4 py-3 text-gray-700">{claimantName(c)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(c.status)}`}
                      >
                        {String(c.status || '—').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.accident_type || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          (c.risk_score || 0) > 150
                            ? 'bg-red-100 text-red-800'
                            : (c.risk_score || 0) > 100
                              ? 'bg-orange-100 text-orange-800'
                              : (c.risk_score || 0) >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {c.risk_score ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClaimantsManagementCard />

      {/* Recent activity */}
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100 mb-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-900">Recently updated cases</h2>
          <Link to="/cases" className="text-sm font-semibold text-blue-600 hover:underline">
            Full list →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claimant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accident</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!overview?.recentCases?.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    No cases yet. Convert a lead or use AI intake to create one.
                  </td>
                </tr>
              ) : (
                overview.recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-semibold text-gray-900">#{c.id}</td>
                    <td className="px-4 py-3 text-gray-800">{claimantName(c)}</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]">{c.claimant_email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(c.status)}`}
                      >
                        {String(c.status || '—').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{c.accident_type || '—'}</td>
                    <td className="px-4 py-3 text-gray-800">{c.ai_viability_score != null ? `${c.ai_viability_score}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(c.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AICaseIntakeModal isOpen={aiIntakeOpen} onClose={() => setAiIntakeOpen(false)} onSuccess={() => setAiIntakeOpen(false)} />
    </div>
  );
}
