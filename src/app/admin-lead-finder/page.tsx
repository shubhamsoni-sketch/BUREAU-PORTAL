'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  HelpCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';

type Summary = {
  rawResults: number;
  uniqueBusinesses: number;
  salesReady: number;
  priorityA: number;
  priorityB: number;
  enterpriseDsa: number;
  bankNbfcLender: number;
  irrelevant: number;
  needsReview: number;
  validMobile: number;
  fixedLine: number;
  missingPhone: number;
  textSearchCalls: number;
  placeDetailsCalls: number;
  cachedRecordsReused: number;
  duplicateDetailsCallsAvoided: number;
  estimatedCostUsd: number;
};

type Prospect = {
  id: string;
  business_name: string | null;
  raw_phone: string | null;
  e164_phone: string | null;
  phone_type: string;
  business_segment: string;
  prospect_score: number;
  sales_priority: string;
  detected_city: string | null;
  rating: number | null;
  review_count: number | null;
  website: string | null;
  google_maps_url: string | null;
  matched_keywords: string[] | null;
  score_reasons: Array<{ label: string; points: number; type: string }> | null;
};

const defaultKeywords = [
  'Loan Agent',
  'Loan DSA',
  'Loan Consultant',
  'Personal Loan Agent',
  'Business Loan Agent',
  'Home Loan Agent',
  'Mortgage Consultant',
  'Financial Consultant',
  'Finance Services',
];

const emptySummary: Summary = {
  rawResults: 0,
  uniqueBusinesses: 0,
  salesReady: 0,
  priorityA: 0,
  priorityB: 0,
  enterpriseDsa: 0,
  bankNbfcLender: 0,
  irrelevant: 0,
  needsReview: 0,
  validMobile: 0,
  fixedLine: 0,
  missingPhone: 0,
  textSearchCalls: 0,
  placeDetailsCalls: 0,
  cachedRecordsReused: 0,
  duplicateDetailsCallsAvoided: 0,
  estimatedCostUsd: 0,
};

const views = [
  ['sales_ready', 'Sales Ready'],
  ['priority_a', 'Priority A'],
  ['priority_b', 'Priority B'],
  ['enterprise', 'Enterprise DSA'],
  ['bank_lender', 'Bank/NBFC/Lender'],
  ['irrelevant', 'Irrelevant'],
  ['review', 'Needs Review'],
  ['all', 'All Data'],
] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function kpiTone(index: number) {
  return [
    'border-blue-100 bg-blue-50',
    'border-emerald-100 bg-emerald-50',
    'border-amber-100 bg-amber-50',
    'border-slate-200 bg-white',
  ][index % 4];
}

export default function AdminLeadFinderPage() {
  const [city, setCity] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [count, setCount] = useState('100');
  const [keywordsText, setKeywordsText] = useState(defaultKeywords.join('\n'));
  const [forceRefresh, setForceRefresh] = useState(false);
  const [refreshExisting, setRefreshExisting] = useState(false);
  const [view, setView] = useState<(typeof views)[number][0]>('sales_ready');
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [why, setWhy] = useState<Prospect | null>(null);

  const keywords = useMemo(
    () =>
      keywordsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [keywordsText]
  );

  async function loadResults(nextView = view) {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/admin-lead-finder/results?view=${nextView}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || json.success === false)
        throw new Error(json.error || 'Unable to load Lead Finder');
      if (json.schemaReady === false) setError(json.warning || 'Lead Finder schema is not ready');
      setSummary(json.summary || emptySummary);
      setProspects(json.prospects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Lead Finder');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch() {
    if (
      forceRefresh &&
      !window.confirm('Force Refresh may call Google again and increase API cost. Continue?')
    )
      return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await authFetch('/api/admin-lead-finder/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          state,
          count: Number(count || 100),
          keywords,
          forceRefresh,
          refreshExisting,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Search failed');
      setSummary(json.summary || emptySummary);
      setProspects(json.prospects || []);
      setView('sales_ready');
      setNotice(
        `Search complete. Google calls: Text ${json.summary?.textSearchCalls || 0}, Details ${json.summary?.placeDetailsCalls || 0}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSaving(false);
    }
  }

  async function reclassify() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await authFetch('/api/admin-lead-finder/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwriteManual: false }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Reclassify failed');
      setNotice(json.message || 'Reclassified with zero Google API calls');
      await loadResults('sales_ready');
      setView('sales_ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reclassify failed');
    } finally {
      setSaving(false);
    }
  }

  async function changeView(nextView: typeof view) {
    setView(nextView);
    await loadResults(nextView);
  }

  const kpis = [
    ['Raw Results', summary.rawResults],
    ['Unique Businesses', summary.uniqueBusinesses],
    ['Sales Ready', summary.salesReady],
    ['Priority A', summary.priorityA],
    ['Priority B', summary.priorityB],
    ['Enterprise DSA', summary.enterpriseDsa],
    ['Bank / NBFC / Lender', summary.bankNbfcLender],
    ['Irrelevant', summary.irrelevant],
    ['Needs Review', summary.needsReview],
    ['Valid Mobile', summary.validMobile],
    ['Fixed Line', summary.fixedLine],
    ['No Phone', summary.missingPhone],
    ['Google Calls Saved', summary.duplicateDetailsCallsAvoided],
    ['Estimated Cost', `$${Number(summary.estimatedCostUsd || 0).toFixed(4)}`],
  ];

  return (
    <AdminLayout title="DSA Lead Finder">
      <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs font-800 tracking-[0.2em] uppercase text-blue-600">
              Marketing · Prospect Discovery
            </p>
            <h1 className="text-2xl font-800 text-slate-950 mt-1">DSA Lead Finder</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              City + count se Google Places public data ko clean, dedupe, classify aur score karke
              sirf sales-ready DSA prospects dikhao.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-700 text-emerald-700">
              <ShieldCheck size={14} /> Server-side Google key only
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-700 text-blue-700">
              <Zap size={14} /> 30-day search coverage cache
            </span>
          </div>
        </div>

        {(error || notice) && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          >
            {error || notice}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Search className="text-blue-600" size={18} />
              <h2 className="font-800 text-slate-900">Find Leads</h2>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-700 text-slate-500">City</span>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-700 text-slate-500">State</span>
                <input
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-700 text-slate-500">Count</span>
                <select
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="100">100</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-700 text-slate-500">Keywords, one per line</span>
                <textarea
                  value={keywordsText}
                  onChange={(event) => setKeywordsText(event.target.value)}
                  rows={8}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-800 text-slate-600">Advanced cost controls</p>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={forceRefresh}
                    onChange={(event) => setForceRefresh(event.target.checked)}
                  />
                  Force Refresh
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={refreshExisting}
                    onChange={(event) => setRefreshExisting(event.target.checked)}
                  />
                  Refresh existing records
                </label>
                {forceRefresh && (
                  <p className="flex items-start gap-2 text-xs text-amber-700">
                    <AlertTriangle size={14} /> Fresh coverage will be ignored and Google API cost
                    may increase.
                  </p>
                )}
              </div>
              <button
                disabled={saving}
                onClick={runSearch}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-800 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Running...' : 'Find Leads'}
              </button>
              <button
                disabled={saving}
                onClick={reclassify}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-800 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Reclassify Existing Data
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/api/admin-lead-finder/export?sales_ready=true"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-800 text-slate-700 hover:bg-slate-50"
                >
                  <Download size={14} className="inline mr-1" /> Sales CSV
                </a>
                <a
                  href="/api/admin-lead-finder/export?sales_ready=false"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-800 text-slate-700 hover:bg-slate-50"
                >
                  <Download size={14} className="inline mr-1" /> All CSV
                </a>
              </div>
            </div>
          </section>

          <section className="space-y-5 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
              {kpis.map(([label, value], index) => (
                <div key={label} className={`rounded-xl border p-3 ${kpiTone(index)}`}>
                  <p className="text-[11px] font-800 uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="text-xl font-900 text-slate-950 mt-1">
                    {typeof value === 'number' ? formatNumber(value) : value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 p-3 flex flex-wrap items-center gap-2">
                {views.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => changeView(key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-800 ${view === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => loadResults(view)}
                  className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-800 text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw size={13} className="inline mr-1" /> Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {[
                        'Business',
                        'Phone',
                        'Type',
                        'Segment',
                        'Score',
                        'Priority',
                        'City',
                        'Rating',
                        'Website',
                        'Keywords',
                        'Why',
                      ].map((head) => (
                        <th key={head} className="px-4 py-3 text-left font-800">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                          Loading...
                        </td>
                      </tr>
                    ) : prospects.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                          No records in this view yet.
                        </td>
                      </tr>
                    ) : (
                      prospects.map((prospect) => (
                        <tr key={prospect.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 min-w-[220px]">
                            <p className="font-800 text-slate-900">
                              {prospect.business_name || '-'}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-xs">
                              {prospect.google_maps_url}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {prospect.raw_phone || '-'}
                          </td>
                          <td className="px-4 py-3">{prospect.phone_type}</td>
                          <td className="px-4 py-3">{prospect.business_segment}</td>
                          <td className="px-4 py-3 font-900">{prospect.prospect_score}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-900">
                              {prospect.sales_priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">{prospect.detected_city || '-'}</td>
                          <td className="px-4 py-3">
                            {prospect.rating
                              ? `${prospect.rating} (${prospect.review_count || 0})`
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {prospect.website ? (
                              <a
                                href={prospect.website}
                                target="_blank"
                                className="text-blue-600 hover:underline"
                              >
                                Open
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[180px] truncate">
                            {(prospect.matched_keywords || []).join(', ')}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setWhy(prospect)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-800 text-slate-700 hover:bg-slate-50"
                            >
                              <HelpCircle size={13} /> Why?
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {why && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/40 flex justify-end"
            onClick={() => setWhy(null)}
          >
            <div
              className="h-full w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-900 text-slate-950">{why.business_name}</h3>
                  <p className="text-sm text-slate-500">
                    {why.business_segment} · Priority {why.sales_priority}
                  </p>
                </div>
                <button
                  onClick={() => setWhy(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-800 text-slate-500 uppercase">Prospect Score</p>
                <p className="text-3xl font-900 text-slate-950 mt-1">{why.prospect_score}/100</p>
              </div>
              <div className="mt-5 space-y-2">
                {(why.score_reasons || []).map((reason, index) => (
                  <div
                    key={`${reason.label}-${index}`}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${reason.points >= 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-800'}`}
                  >
                    {reason.points >= 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span className="flex-1">{reason.label}</span>
                    <span className="font-900">
                      {reason.points > 0 ? `+${reason.points}` : reason.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
