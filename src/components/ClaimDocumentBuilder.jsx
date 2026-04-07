import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingBlock } from './LoadingSpinner';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, '');
  return '';
};

function SectionProgress({ items }) {
  const total = Array.isArray(items) ? items.length : 0;
  const completeCount = (items || []).filter((i) => i?.status === 'complete').length;
  const pct = total > 0 ? Math.round((completeCount / total) * 100) : 0;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>{pct}% complete</span>
        <span>
          {completeCount}/{total}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-2 bg-indigo-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ClaimDocumentBuilder({
  caseId,
  apiPrefix = '/api',
  token: tokenOverride,
}) {
  const { token } = useAuth();
  const authToken = tokenOverride || token;
  const base = getBaseUrl();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const combinedMarkdown = useMemo(() => {
    const accident = data?.accidentSummary?.markdown || '';
    const timeline = data?.treatmentTimeline?.markdown || '';
    const index = data?.documentationIndex?.markdown || '';
    return `${accident}\n\n${timeline}\n\n${index}`.trim();
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!authToken || !caseId) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${base}${apiPrefix}/cases/${caseId}/claim-summary`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Failed to load claim summary');
        if (!cancelled) setData(json || null);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load claim summary');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [authToken, caseId, base, apiPrefix]);

  const copyAll = async () => {
    if (!combinedMarkdown) return;
    try {
      await navigator.clipboard.writeText(combinedMarkdown);
      alert('Copied all claim documentation to clipboard.');
    } catch (e) {
      alert('Copy failed. Your browser may block clipboard access.');
    }
  };

  const downloadAsText = () => {
    const content = combinedMarkdown || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-${caseId}-claim-summary.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingBlock message="Loading claim documentation…" className="p-6" minHeight />;
  }
  if (error) return <div className="p-6 text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>;
  if (!data) return <div className="p-6 text-sm text-gray-600">No data found.</div>;

  const accidentSummary = data.accidentSummary || {};
  const treatmentTimeline = data.treatmentTimeline || {};
  const documentationIndex = data.documentationIndex || {};

  const sections = documentationIndex.documentationIndex || documentationIndex.sections || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Claim Documentation Summary</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organized, claimant-ready summaries for insurers and legal counsel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyAll}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Copy All
          </button>
          <button
            type="button"
            onClick={downloadAsText}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Download as Text
          </button>
        </div>
      </div>

      {documentationIndex.missingCriticalItems?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-red-800">Missing critical items</div>
          <div className="text-sm text-red-700 mt-2">
            {documentationIndex.missingCriticalItems.join(', ')}
          </div>
        </div>
      )}

      {/* Accident Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900">Accident Summary</h3>
        {accidentSummary.keyFacts?.length > 0 && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-800">Key Facts</div>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
              {accidentSummary.keyFacts.map((f, idx) => (
                <li key={`${idx}`}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-900 whitespace-pre-wrap">{accidentSummary.accidentSummary || accidentSummary.markdown}</div>
        {accidentSummary.documentationStatus ? (
          <div className="mt-4 text-sm text-gray-700">
            <span className="font-semibold">Documentation Status:</span> {accidentSummary.documentationStatus}
          </div>
        ) : null}
      </div>

      {/* Treatment Timeline */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900">Treatment Timeline</h3>
        <div className="mt-2 text-sm text-gray-700">
          Total billed: ${Number(treatmentTimeline.totalBilled || 0).toLocaleString()} • Total received:{' '}
          ${Number(treatmentTimeline.totalReceived || 0).toLocaleString()}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Provider</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Charges</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Paid</th>
              </tr>
            </thead>
            <tbody>
              {(treatmentTimeline.visits || []).map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2">{v.visit_date || '—'}</td>
                  <td className="px-3 py-2">{v.provider_name || '—'}</td>
                  <td className="px-3 py-2">{v.visit_type || 'other'}</td>
                  <td className="px-3 py-2">
                    {v.billed_amount != null ? `$${Number(v.billed_amount).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2">{v.bill_received ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documentation Index */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900">Documentation Index</h3>
        <div className="mt-2 text-sm text-gray-700">
          Completeness Score: {documentationIndex.completenessScore != null ? `${documentationIndex.completenessScore}%` : '—'}
        </div>
        {documentationIndex.readinessStatement ? (
          <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{documentationIndex.readinessStatement}</div>
        ) : null}

        <div className="mt-4 space-y-6">
          {sections.map((s) => (
            <div key={s.category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">{s.category}</div>
              </div>
              <SectionProgress items={s.items || []} />

              <ul className="mt-3 space-y-2 text-sm">
                {(s.items || []).map((it) => {
                  const status = it?.status;
                  const color =
                    status === 'complete'
                      ? 'text-green-700'
                      : status === 'pending'
                        ? 'text-amber-700'
                        : 'text-red-700';
                  const icon = status === 'complete' ? '✓' : status === 'pending' ? '•' : '✗';
                  return (
                    <li key={it.itemName} className={`flex items-start gap-2 ${color}`}>
                      <span className="font-semibold">{icon}</span>
                      <div className="min-w-0">
                        <div className="font-medium">{it.itemName}</div>
                        {it.notes ? <div className="text-xs text-gray-600 mt-0.5">{it.notes}</div> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

