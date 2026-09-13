'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch, downloadAuthenticatedFile } from '@/lib/supabase/auth-fetch';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Eye,
  Filter,
  History,
  Loader2,
  Phone,
  Play,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  WalletCards,
  Zap,
} from 'lucide-react';

type Summary = {
  rawResults: number;
  uniqueBusinesses: number;
  salesReady: number;
  priorityA: number;
  priorityB: number;
  emailsFound: number;
  validMobile: number;
  fixedLine: number;
  missingPhone: number;
  duplicateDetailsCallsAvoided: number;
  estimatedCostUsd: number;
  estimatedCostInr?: number;
};

type Prospect = {
  id: string;
  business_name: string | null;
  raw_phone: string | null;
  website: string | null;
  phone_type: string;
  business_segment: string;
  prospect_score: number;
  sales_priority: string;
  detected_city: string | null;
  rating: number | null;
  review_count: number | null;
  google_maps_url: string | null;
  matched_keywords: string[] | null;
  score_reasons: Array<{ label: string; points: number; type: string }> | null;
};

type RunHistory = {
  id: string;
  searched_city: string;
  searched_state: string;
  keywords: string[];
  requested_count: number;
  raw_results_count: number;
  unique_businesses_count: number;
  new_details_calls: number;
  cached_records_reused: number;
  duplicates_skipped: number;
  estimated_cost_usd: number;
  actual_text_search_calls: number;
  actual_place_details_calls: number;
  force_refresh: boolean;
  status: 'running' | 'complete' | 'failed' | 'stopped_by_budget';
  created_at: string;
  error_message: string | null;
};

type UniversalPlan = {
  lead_type: string;
  search_intent: string;
  locations: Array<{ city: string; state: string }>;
  keywords: string[];
  required_fields: string[];
  exclude_rules: string[];
  confidence_rules: string[];
  score_rules: string[];
  recommended_count: number;
  risk_warnings: string[];
  recommendation: string;
};

type UniversalForecast = {
  existing_db_matches: number;
  fresh_coverage_matches: number;
  estimated_raw_results_min: number;
  estimated_raw_results_max: number;
  estimated_unique_leads_min: number;
  estimated_unique_leads_max: number;
  estimated_valid_mobile_min: number;
  estimated_valid_mobile_max: number;
  estimated_high_confidence_min: number;
  estimated_high_confidence_max: number;
  duplicate_risk: 'low' | 'medium' | 'high';
  fresh_google_text_search_calls_needed: number;
  worst_case_place_details_calls: number;
  approx_cost_inr: number;
  confidence: 'low' | 'medium' | 'high';
  recommendation: string;
};

const defaultKeywords = [
  'Loan DSA',
  'Loan Agent',
  'Personal Loan Agent',
  'Business Loan Agent',
  'Home Loan Agent',
  'Mortgage Consultant',
];

const emptySummary: Summary = {
  rawResults: 0,
  uniqueBusinesses: 0,
  salesReady: 0,
  priorityA: 0,
  priorityB: 0,
  emailsFound: 0,
  validMobile: 0,
  fixedLine: 0,
  missingPhone: 0,
  duplicateDetailsCallsAvoided: 0,
  estimatedCostUsd: 0,
  estimatedCostInr: 0,
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

function formatMoney(value: number) {
  const usd = Number(value || 0);
  const inr = usd * 83;
  if (inr > 0 && inr < 1) return `≈₹${inr.toFixed(2)}`;
  return `≈₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(inr)}`;
}

function formatApiCost(summary: Summary) {
  const inr = Number(summary.estimatedCostInr || 0);
  if (inr > 0) {
    if (inr < 1) return `≈₹${inr.toFixed(2)}`;
    return `≈₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(inr)}`;
  }
  return formatMoney(summary.estimatedCostUsd || 0);
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

function priorityClass(priority: string) {
  if (priority === 'A') return 'bg-red-50 text-red-700';
  if (priority === 'B') return 'bg-amber-50 text-amber-700';
  if (priority === 'exclude') return 'bg-slate-100 text-slate-500';
  return 'bg-blue-50 text-blue-700';
}

function prospectEmail(prospect: Prospect) {
  return (prospect.score_reasons || [])
    .map((reason) => reason.label || '')
    .find((label) => label.startsWith('Email: '))
    ?.replace('Email: ', '');
}

export default function AdminLeadFinderPage() {
  const [tab, setTab] = useState<'dsa' | 'fintech' | 'universal' | 'library' | 'settings'>('dsa');
  const [city, setCity] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [count, setCount] = useState('100');
  const [keywordsText, setKeywordsText] = useState(defaultKeywords.join('\n'));
  const [forceRefresh, setForceRefresh] = useState(false);
  const [refreshExisting, setRefreshExisting] = useState(false);
  const [view, setView] = useState<(typeof views)[number][0]>('sales_ready');
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [runs, setRuns] = useState<RunHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [runsLoading, setRunsLoading] = useState(true);
  const [runningSearch, setRunningSearch] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [why, setWhy] = useState<Prospect | null>(null);
  const [lastDataRefreshAt, setLastDataRefreshAt] = useState<Date | null>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

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
      const leadType = tab === 'library' ? 'all' : tab === 'fintech' ? 'fintech' : 'dsa';
      const res = await authFetch(
        `/api/admin-lead-finder/results?view=${nextView}&leadType=${leadType}`,
        {
          cache: 'no-store',
        }
      );
      const json = await res.json();
      if (!res.ok || json.success === false)
        throw new Error(json.error || 'Unable to load Lead Finder');
      setSummary(json.summary || emptySummary);
      setProspects(json.prospects || []);
      setLastDataRefreshAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Lead Finder');
    } finally {
      setLoading(false);
    }
  }

  async function loadRuns() {
    setRunsLoading(true);
    try {
      const res = await authFetch('/api/admin-lead-finder/runs?limit=50', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Unable to load runs');
      setRuns(json.runs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load runs');
    } finally {
      setRunsLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'dsa' || tab === 'fintech' || tab === 'library') {
      loadResults(view);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function runSearch() {
    if (runningSearch || reclassifying) return;
    if (
      forceRefresh &&
      !window.confirm('Force Refresh bypasses cache and can create new Google API cost. Continue?')
    )
      return;
    setRunningSearch(true);
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
      if (json.summary) setSummary(json.summary);
      if (json.prospects) setProspects(json.prospects);
      setLastDataRefreshAt(new Date());
      setView('sales_ready');
      setTab('dsa');
      setNotice(
        `Run complete. Text ${json.summary?.textSearchCalls || 0}, Details ${json.summary?.placeDetailsCalls || 0}, Cost ${formatMoney(json.summary?.estimatedCostUsd || 0)}.`
      );
      await loadResults('sales_ready');
      await loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      await loadRuns();
    } finally {
      setRunningSearch(false);
    }
  }

  async function reclassify() {
    if (runningSearch || reclassifying) return;
    setReclassifying(true);
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
      if (json.summary) setSummary(json.summary);
      setNotice(json.message || 'Reclassified with zero Google API calls');
      await loadResults('sales_ready');
      setView('sales_ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reclassify failed');
    } finally {
      setReclassifying(false);
    }
  }

  async function changeView(nextView: typeof view) {
    setView(nextView);
    await loadResults(nextView);
  }

  const kpis = [
    {
      label: tab === 'fintech' ? 'Total Fintech' : 'Total DSA',
      value: summary.rawResults,
      icon: Database,
    },
    { label: 'Unique Businesses', value: summary.uniqueBusinesses, icon: BarChart3 },
    { label: 'Sales Ready', value: summary.salesReady, icon: Target },
    { label: 'Priority A', value: summary.priorityA, icon: Zap },
    { label: 'Priority B', value: summary.priorityB, icon: Zap },
    {
      label: tab === 'fintech' ? 'Emails Found' : 'Valid Mobile',
      value: tab === 'fintech' ? summary.emailsFound : summary.validMobile,
      icon: tab === 'fintech' ? CheckCircle2 : Phone,
    },
    {
      label: tab === 'fintech' ? 'Valid Mobile' : 'Google Calls Saved',
      value: tab === 'fintech' ? summary.validMobile : summary.duplicateDetailsCallsAvoided,
      icon: ShieldCheck,
    },
    { label: 'Fixed Line', value: summary.fixedLine, icon: Phone },
    { label: 'Missing Phone', value: summary.missingPhone, icon: AlertTriangle },
    { label: 'Emails Found', value: summary.emailsFound, icon: CheckCircle2 },
    { label: 'Approx API Cost', value: formatApiCost(summary), icon: WalletCards },
  ];
  const latestRun = runs.find((run) => {
    const isFintechRun =
      (run.keywords || []).includes('Fintech Lead') ||
      (run.keywords || []).includes('fintech_import');
    return tab === 'fintech' ? isFintechRun : !isFintechRun;
  });

  return (
    <AdminLayout title="Lead Finder">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-6 xl:px-8">
        <Header tab={tab} setTab={setTab} onOpenAi={() => setAiDrawerOpen(true)} />

        {(error || notice) && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          >
            {error || notice}
          </div>
        )}

        {tab === 'dsa' || tab === 'fintech' || tab === 'library' ? (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {kpis.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Icon size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-800 text-slate-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-950 text-slate-950">
                          {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-900 uppercase tracking-[0.18em] text-blue-700">
                    Data tab refreshed
                  </p>
                  <p className="mt-1 text-sm font-800 text-slate-700">
                    {lastDataRefreshAt
                      ? new Intl.DateTimeFormat('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(lastDataRefreshAt)
                      : 'Not refreshed yet'}
                  </p>
                </div>
                {latestRun ? (
                  <div className="grid flex-1 grid-cols-2 gap-3 text-sm md:grid-cols-4 xl:max-w-4xl">
                    <div>
                      <p className="text-xs font-800 text-slate-500">Latest run</p>
                      <p className="font-950 text-slate-950">
                        {latestRun.searched_city} {latestRun.searched_state}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-800 text-slate-500">Raw / Unique</p>
                      <p className="font-950 text-slate-950">
                        {formatNumber(latestRun.raw_results_count)} /{' '}
                        {formatNumber(latestRun.unique_businesses_count)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-800 text-slate-500">Google calls</p>
                      <p className="font-950 text-slate-950">
                        Text {formatNumber(latestRun.actual_text_search_calls)} · Details{' '}
                        {formatNumber(latestRun.actual_place_details_calls)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-800 text-slate-500">Cost / Cache</p>
                      <p className="font-950 text-slate-950">
                        {formatMoney(latestRun.estimated_cost_usd)} · saved{' '}
                        {formatNumber(latestRun.cached_records_reused)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-800 text-slate-600">No run history loaded yet.</p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-lg font-900 text-slate-950">
                    {tab === 'library'
                      ? 'Lead Library'
                      : tab === 'fintech'
                        ? 'Fintech Results'
                        : 'DSA Results'}
                  </h2>
                  <p className="text-xs font-700 text-slate-500">
                    Showing {prospects.length ? `1-${Math.min(prospects.length, 500)}` : '0'}{' '}
                    records
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
                  <button
                    onClick={() => changeView('sales_ready')}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-800 text-slate-700 hover:bg-slate-50"
                  >
                    <Filter size={16} /> Sales Ready
                  </button>
                  <button
                    onClick={() => loadResults(view)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-800 text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                  <button
                    onClick={() =>
                      downloadAuthenticatedFile(
                        `/api/admin-lead-finder/export?sales_ready=true&leadType=${tab === 'fintech' ? 'fintech' : 'dsa'}`,
                        `${tab === 'fintech' ? 'fintech' : 'dsa'}-sales-ready.csv`
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-900 text-white hover:bg-blue-700"
                  >
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {views.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => changeView(key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-900 ${view === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <LeadTable
                loading={loading}
                prospects={prospects}
                onWhy={setWhy}
                leadType={tab === 'fintech' ? 'fintech' : 'dsa'}
              />
            </div>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Play size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-900 text-slate-950">New Run</h2>
                    <p className="text-sm text-slate-500">
                      Cached coverage is reused by default to stop repeat cost.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField label="City" value={city} onChange={setCity} />
                  <TextField label="State" value={state} onChange={setState} />
                  <div>
                    <span className="text-xs font-800 text-slate-500">Count</span>
                    <div className="mt-1 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200">
                      {['100', '500', '1000'].map((item) => (
                        <button
                          key={item}
                          onClick={() => setCount(item)}
                          className={`px-3 py-2.5 text-sm font-900 ${count === item ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <label className="mt-4 block">
                  <span className="text-xs font-800 text-slate-500">Keywords</span>
                  <textarea
                    value={keywordsText}
                    onChange={(event) => setKeywordsText(event.target.value)}
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                </label>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Toggle label="Force Refresh" checked={forceRefresh} onChange={setForceRefresh} />
                  <Toggle
                    label="Refresh Existing"
                    checked={refreshExisting}
                    onChange={setRefreshExisting}
                  />
                </div>
                {forceRefresh && (
                  <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle size={18} />
                    Force Refresh bypasses cache. Backend budget guardrails still stop excess paid
                    calls.
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={runningSearch || reclassifying}
                    onClick={runSearch}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-950 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Play size={17} /> {runningSearch ? 'Running...' : 'Start Find Run'}
                  </button>
                  <button
                    type="button"
                    disabled={runningSearch || reclassifying}
                    onClick={reclassify}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-900 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Settings2 size={17} />{' '}
                    {reclassifying ? 'Reclassifying...' : 'Reclassify Existing Data'}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center">
                <div className="flex items-center gap-3">
                  <History className="text-blue-600" size={22} />
                  <div>
                    <h2 className="text-lg font-900 text-slate-950">Run History</h2>
                    <p className="text-sm text-slate-500">Every run is saved for API-cost audit.</p>
                  </div>
                </div>
                <button
                  onClick={loadRuns}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-800 text-slate-700 hover:bg-slate-50 xl:ml-auto"
                >
                  <RefreshCw size={16} /> Refresh History
                </button>
              </div>
              <RunHistoryTable loading={runsLoading} runs={runs} />
            </div>
          </section>
        )}

        {why && <WhyDrawer prospect={why} onClose={() => setWhy(null)} />}
        <AIFinderDrawer
          open={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          onRunComplete={async () => {
            setTab('library');
            setView('sales_ready');
            await loadResults('sales_ready');
            await loadRuns();
          }}
        />
      </div>
    </AdminLayout>
  );
}

function Header({
  tab,
  setTab,
  onOpenAi,
}: {
  tab: 'dsa' | 'fintech' | 'universal' | 'library' | 'settings';
  setTab: (tab: 'dsa' | 'fintech' | 'universal' | 'library' | 'settings') => void;
  onOpenAi: () => void;
}) {
  const tabs = [
    ['dsa', 'DSA Data'],
    ['fintech', 'Fintech Data'],
    ['library', 'Lead Library'],
    ['settings', 'Runs & Cost'],
  ] as const;

  return (
    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Search size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-900 text-slate-950">Lead Finder</h1>
          <div className="mt-3 flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-900 ${tab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onOpenAi}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-950 text-white shadow-sm hover:bg-blue-700"
        >
          <Zap size={17} /> Find with AI
        </button>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 font-800 text-emerald-700">
          <Clock3 size={14} /> 30-day cache
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 font-800 text-blue-700">
          <ShieldCheck size={14} /> Server key
        </span>
      </div>
    </div>
  );
}

function AIFinderDrawer({
  open,
  onClose,
  onRunComplete,
}: {
  open: boolean;
  onClose: () => void;
  onRunComplete: () => Promise<void> | void;
}) {
  const [prompt, setPrompt] = useState(
    'Find loan distribution fintech and DSA partners in Indore, Bhopal, Ahmedabad, and Surat. Exclude software companies, payment apps, and stock brokers.'
  );
  const [plan, setPlan] = useState<UniversalPlan | null>(null);
  const [forecast, setForecast] = useState<UniversalForecast | null>(null);
  const [planSource, setPlanSource] = useState<'ai' | 'fallback' | null>(null);
  const [schemaReady, setSchemaReady] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);
  const [count, setCount] = useState('100');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  async function generatePlan() {
    setLoadingPlan(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch('/api/admin-lead-finder/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false)
        throw new Error(json.error || 'Unable to generate plan');
      setPlan(json.plan);
      setForecast(json.forecast || null);
      setPlanSource(json.source || 'fallback');
      setSchemaReady(json.schemaReady !== false);
      setSetupChecked(true);
      setCount(String(json.plan?.recommended_count || 100));
      if (json.warning) setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate plan');
    } finally {
      setLoadingPlan(false);
    }
  }

  async function approveAndRun() {
    if (!plan || running) return;
    if (
      forceRefresh &&
      !window.confirm(
        'Force Refresh bypasses fresh coverage and can create Google API cost. Continue?'
      )
    )
      return;
    setRunning(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch('/api/admin-lead-finder/universal-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          plan,
          approvedPlan: plan,
          planSource,
          count: Number(count || plan.recommended_count || 100),
          forceRefresh,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Universal run failed');
      setMessage(
        `Run complete. Records ${formatNumber(json.metrics?.recordsFound || 0)}, Text ${formatNumber(json.metrics?.textSearchCalls || 0)}, Details ${formatNumber(json.metrics?.placeDetailsCalls || 0)}, Cost ≈₹${formatNumber(json.metrics?.estimatedCostInr || 0)}.`
      );
      await onRunComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Universal run failed');
    } finally {
      setRunning(false);
    }
  }

  const setupComplete = setupChecked && schemaReady && Boolean(forecast);
  const canRun = Boolean(plan) && setupComplete && !running && !loadingPlan;
  const setupStatus = !setupChecked ? 'Check required' : schemaReady ? 'Ready' : 'Setup required';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-950 text-slate-950">Find with AI</h2>
            <p className="text-sm font-700 text-slate-500">Plan first. Run only after approval.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-900 text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 p-5">
          {setupChecked && !schemaReady && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-950 text-amber-950">
                      Setup required before live runs
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm font-700 leading-6 text-amber-800">
                      The master lead database migration is still pending. You can prepare and
                      review a search, but paid Google Places runs are disabled until the database
                      is active.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-950 uppercase tracking-wide text-amber-700">
                  Run locked
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-base font-950 text-slate-950">Search brief</h3>
              {(error || message) && (
                <div
                  className={`mb-4 rounded-xl border px-4 py-3 text-sm font-800 ${
                    error
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {error || message}
                </div>
              )}
              <label className="block">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Find loan DSAs working with Andromeda and RU Loans in MP and Gujarat. Exclude software companies and payment apps."
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-700 leading-6 text-slate-800 outline-none focus:border-blue-400"
                />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-[120px_150px_1fr] sm:items-end">
                <div>
                  <span className="text-xs font-900 uppercase tracking-wide text-slate-500">
                    Count
                  </span>
                  <input
                    value={count}
                    onChange={(event) => setCount(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <Toggle label="Force Refresh" checked={forceRefresh} onChange={setForceRefresh} />
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={loadingPlan || running}
                    onClick={generatePlan}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-950 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loadingPlan ? (
                      <Loader2 className="animate-spin" size={17} />
                    ) : (
                      <Zap size={17} />
                    )}
                    {loadingPlan ? 'Preparing plan...' : 'Prepare'}
                  </button>
                  <button
                    type="button"
                    disabled={!canRun}
                    onClick={approveAndRun}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-950 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <Play size={17} /> {running ? 'Running...' : 'Run'}
                  </button>
                </div>
              </div>
              {forceRefresh && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-800 text-amber-800">
                  Force refresh ignores cache and can create Google API cost.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-950 text-slate-950">Plan & cost</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-950 text-slate-600">
                  No charge until Run
                </span>
              </div>
              {loadingPlan ? (
                <PreparingPlanCard />
              ) : !plan ? (
                <div className="flex min-h-[174px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <div>
                    <Search className="mx-auto text-slate-400" size={28} />
                    <p className="mt-2 text-sm font-900 text-slate-600">
                      Click Prepare to estimate leads, calls and cost.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {forecast ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <MetricBox
                        label="Unique leads"
                        value={`${formatNumber(forecast.estimated_unique_leads_min)}-${formatNumber(forecast.estimated_unique_leads_max)}`}
                        tone="blue"
                      />
                      <MetricBox
                        label="Valid mobile"
                        value={`${formatNumber(forecast.estimated_valid_mobile_min)}-${formatNumber(forecast.estimated_valid_mobile_max)}`}
                        tone="green"
                      />
                      <MetricBox
                        label="Google calls"
                        value={`Text ${formatNumber(forecast.fresh_google_text_search_calls_needed)} · Details ${formatNumber(forecast.worst_case_place_details_calls)}`}
                        tone="slate"
                      />
                      <MetricBox
                        label="Worst-case cost"
                        value={`≈₹${formatNumber(forecast.approx_cost_inr)}`}
                        tone="amber"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-950 text-amber-950">Setup required</p>
                      <p className="mt-1 text-sm font-700 leading-6 text-amber-800">
                        The search setup can be reviewed now, but the run button stays disabled
                        until the master database migration is applied.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <CollapsibleSection title="Geography" defaultOpen>
                      <div className="flex flex-wrap gap-2">
                        {plan.locations.map((item) => (
                          <span
                            key={`${item.city}-${item.state}`}
                            className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-900 text-blue-700"
                          >
                            {item.city}, {item.state}
                          </span>
                        ))}
                      </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Audience type" defaultOpen>
                      <InfoBox label="Type" value={plan.lead_type} />
                      <div className="mt-2">
                        <InfoBox label="Intent" value={plan.search_intent} />
                      </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Search keywords">
                      <div className="flex flex-wrap gap-2">
                        {plan.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-900 text-slate-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Rules & exclusions">
                      <ul className="space-y-2 text-sm font-700 leading-6 text-slate-700">
                        {[...plan.exclude_rules, ...plan.risk_warnings].map((rule) => (
                          <li key={rule} className="rounded-lg bg-slate-50 px-3 py-2">
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone: 'green' | 'blue' | 'amber' | 'slate';
}) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="mb-3 flex items-center gap-2 text-xs font-950 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p className="text-xl font-950 text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-700 leading-5 text-slate-600">{note}</p>
    </div>
  );
}

function MetricBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'green' | 'blue' | 'amber' | 'slate';
}) {
  const tones = {
    green: 'border-emerald-100 bg-emerald-50',
    blue: 'border-blue-100 bg-blue-50',
    amber: 'border-amber-100 bg-amber-50',
    slate: 'border-slate-100 bg-slate-50',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-900 uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-950 text-slate-950">{value || '-'}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-950 text-slate-900 hover:bg-slate-50"
      >
        {title}
        <ChevronDown
          size={17}
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}

function PreparingPlanCard() {
  const steps = ['Reading brief', 'Finding cities & keywords', 'Checking saved data', 'Estimating cost'];

  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5">
      <div className="absolute -right-12 -top-12 h-36 w-36 animate-pulse rounded-full bg-blue-200/40 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 animate-pulse rounded-full bg-violet-200/40 blur-2xl" />
      <div className="relative flex h-full min-h-[220px] flex-col items-center justify-center text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-blue-500 opacity-25" />
          <Loader2 className="relative animate-spin" size={28} />
        </div>
        <h4 className="text-lg font-950 text-slate-950">Preparing your AI search plan</h4>
        <p className="mt-2 max-w-sm text-sm font-800 leading-6 text-slate-600">
          AI is turning your brief into cities, keywords, duplicate checks and an estimated run
          cost. No Google Places charge yet.
        </p>
        <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-left text-xs font-900 text-slate-700 shadow-sm"
              style={{ animation: `pulse 1.8s ease-in-out ${index * 0.18}s infinite` }}
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-900 uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-900 text-slate-900">{value || '-'}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-800 text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-800 text-slate-700">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function LeadTable({
  loading,
  prospects,
  onWhy,
  leadType,
}: {
  loading: boolean;
  prospects: Prospect[];
  onWhy: (prospect: Prospect) => void;
  leadType: 'dsa' | 'fintech';
}) {
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('all');

  const cities = useMemo(
    () =>
      Array.from(new Set(prospects.map((item) => item.detected_city).filter(Boolean))).sort() as string[],
    [prospects]
  );
  const segments = useMemo(
    () =>
      Array.from(new Set(prospects.map((item) => item.business_segment).filter(Boolean))).sort(),
    [prospects]
  );
  const priorities = useMemo(
    () =>
      Array.from(new Set(prospects.map((item) => item.sales_priority).filter(Boolean))).sort(),
    [prospects]
  );
  const phoneTypes = useMemo(
    () => Array.from(new Set(prospects.map((item) => item.phone_type).filter(Boolean))).sort(),
    [prospects]
  );

  const filteredProspects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return prospects.filter((prospect) => {
      const haystack = [
        prospect.business_name,
        prospect.raw_phone,
        prospect.website,
        prospect.business_segment,
        prospect.sales_priority,
        prospect.detected_city,
        ...(prospect.matched_keywords || []),
        prospectEmail(prospect),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        (!needle || haystack.includes(needle)) &&
        (cityFilter === 'all' || prospect.detected_city === cityFilter) &&
        (segmentFilter === 'all' || prospect.business_segment === segmentFilter) &&
        (priorityFilter === 'all' || prospect.sales_priority === priorityFilter) &&
        (phoneFilter === 'all' || prospect.phone_type === phoneFilter)
      );
    });
  }, [cityFilter, phoneFilter, priorityFilter, prospects, query, segmentFilter]);

  const heads =
    leadType === 'fintech'
      ? [
          'Business',
          'Map',
          'Phone',
          'Email',
          'Website',
          'Segment',
          'Score',
          'Priority',
          'City',
          'Rating',
          'Keywords',
          'Why',
        ]
      : [
          'Business',
          'Map',
          'Phone',
          'Segment',
          'Score',
          'Priority',
          'City',
          'Rating',
          'Keywords',
          'Why',
        ];
  return (
    <div>
      <div className="border-b border-slate-100 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-950 uppercase tracking-wide text-slate-500">
          <SlidersHorizontal size={15} /> Table filters
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search like Excel..."
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-700 outline-none focus:border-blue-400"
          />
          <TableSelect label="City" value={cityFilter} onChange={setCityFilter} options={cities} />
          <TableSelect
            label="Type"
            value={segmentFilter}
            onChange={setSegmentFilter}
            options={segments}
          />
          <TableSelect
            label="Priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorities}
          />
          <TableSelect
            label="Phone"
            value={phoneFilter}
            onChange={setPhoneFilter}
            options={phoneTypes}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-800 text-slate-500">
          <span>
            Showing {formatNumber(filteredProspects.length)} of {formatNumber(prospects.length)}
          </span>
          {(query ||
            cityFilter !== 'all' ||
            segmentFilter !== 'all' ||
            priorityFilter !== 'all' ||
            phoneFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCityFilter('all');
                setSegmentFilter('all');
                setPriorityFilter('all');
                setPhoneFilter('all');
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-900 text-slate-700 hover:bg-slate-100"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {heads.map((head) => (
              <th key={head} className="px-4 py-3 text-left font-900">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={heads.length} className="px-4 py-10 text-center text-slate-500">
                Loading...
              </td>
            </tr>
          ) : filteredProspects.length === 0 ? (
            <tr>
              <td colSpan={heads.length} className="px-4 py-10 text-center text-slate-500">
                No records in this view yet.
              </td>
            </tr>
          ) : (
            filteredProspects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-slate-50">
                <td className="min-w-[260px] px-4 py-3">
                  <p className="font-900 text-slate-900">{prospect.business_name || '-'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {prospect.google_maps_url ? (
                    <a
                      href={prospect.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-900 text-blue-700 hover:bg-blue-50"
                    >
                      Open Map
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{prospect.raw_phone || '-'}</td>
                {leadType === 'fintech' && (
                  <>
                    <td className="whitespace-nowrap px-4 py-3">
                      {prospectEmail(prospect) || '-'}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3">
                      {prospect.website ? (
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-800 text-blue-700 hover:underline"
                        >
                          {prospect.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </>
                )}
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-900 text-blue-700">
                    {prospect.business_segment}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-950 text-emerald-700">
                    {prospect.prospect_score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-950 ${priorityClass(prospect.sales_priority)}`}
                  >
                    {prospect.sales_priority}
                  </span>
                </td>
                <td className="px-4 py-3">{prospect.detected_city || '-'}</td>
                <td className="px-4 py-3">
                  {prospect.rating ? `${prospect.rating} (${prospect.review_count || 0})` : '-'}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3">
                  {(prospect.matched_keywords || []).join(', ')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onWhy(prospect)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-900 text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={13} /> Why
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function TableSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-800 text-slate-700 outline-none focus:border-blue-400"
      >
        <option value="all">All {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RunHistoryTable({ loading, runs }: { loading: boolean; runs: RunHistory[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1280px] text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              'Run Time',
              'City',
              'Keywords',
              'Requested',
              'Raw',
              'Unique',
              'Google Calls',
              'API Cost (approx)',
              'Cache Saved',
              'Status',
              'Actions',
            ].map((head) => (
              <th key={head} className="px-4 py-3 text-left font-900">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                Loading run history...
              </td>
            </tr>
          ) : runs.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                No runs yet.
              </td>
            </tr>
          ) : (
            runs.map((run) => (
              <tr key={run.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-800 text-slate-700">
                  {formatDateTime(run.created_at)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-900 text-slate-900">{run.searched_city}</p>
                  <p className="text-xs text-slate-500">{run.searched_state}</p>
                </td>
                <td className="max-w-[220px] truncate px-4 py-3">
                  {(run.keywords || []).join(', ')}
                </td>
                <td className="px-4 py-3">{formatNumber(run.requested_count)}</td>
                <td className="px-4 py-3">{formatNumber(run.raw_results_count)}</td>
                <td className="px-4 py-3">{formatNumber(run.unique_businesses_count)}</td>
                <td className="px-4 py-3">
                  <p>Text: {run.actual_text_search_calls}</p>
                  <p>Details: {run.actual_place_details_calls}</p>
                </td>
                <td className="px-4 py-3 font-900">{formatMoney(run.estimated_cost_usd)}</td>
                <td className="px-4 py-3">
                  {formatNumber(run.duplicates_skipped || run.cached_records_reused)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-950 ${run.status === 'complete' ? (run.actual_text_search_calls === 0 && run.actual_place_details_calls === 0 ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700') : run.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}
                  >
                    {run.status === 'complete' &&
                    run.actual_text_search_calls === 0 &&
                    run.actual_place_details_calls === 0
                      ? 'Cached'
                      : run.status === 'stopped_by_budget'
                        ? 'Budget stopped'
                        : run.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    title={run.error_message || run.id}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-900 text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function WhyDrawer({ prospect, onClose }: { prospect: Prospect; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-900 text-slate-950">{prospect.business_name}</h3>
            <p className="text-sm text-slate-500">
              {prospect.business_segment} · Priority {prospect.sales_priority}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            Close
          </button>
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-800 uppercase text-slate-500">Prospect Score</p>
          <p className="mt-1 text-3xl font-900 text-slate-950">{prospect.prospect_score}/100</p>
        </div>
        <div className="mt-5 space-y-2">
          {(prospect.score_reasons || []).map((reason, index) => (
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
  );
}
