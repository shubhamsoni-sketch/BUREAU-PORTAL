'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch, downloadAuthenticatedFile } from '@/lib/supabase/auth-fetch';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Eye,
  Filter,
  History,
  Phone,
  Play,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
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
  validMobile: number;
  fixedLine: number;
  missingPhone: number;
  duplicateDetailsCallsAvoided: number;
  estimatedCostUsd: number;
};

type Prospect = {
  id: string;
  business_name: string | null;
  raw_phone: string | null;
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
  status: 'running' | 'complete' | 'failed';
  created_at: string;
  error_message: string | null;
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
  validMobile: 0,
  fixedLine: 0,
  missingPhone: 0,
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

function formatMoney(value: number) {
  const usd = Number(value || 0);
  const inr = usd * 83;
  if (inr > 0 && inr < 1) return `≈₹${inr.toFixed(2)}`;
  return `≈₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(inr)}`;
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

export default function AdminLeadFinderPage() {
  const [tab, setTab] = useState<'data' | 'settings'>('data');
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
      setSummary(json.summary || emptySummary);
      setProspects(json.prospects || []);
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

  async function runSearch() {
    if (
      forceRefresh &&
      !window.confirm('Force Refresh bypasses cache and can create new Google API cost. Continue?')
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
      setView('sales_ready');
      setTab('data');
      setNotice(
        `Run complete. Text ${json.summary?.textSearchCalls || 0}, Details ${json.summary?.placeDetailsCalls || 0}, Cost ${formatMoney(json.summary?.estimatedCostUsd || 0)}.`
      );
      await loadResults('sales_ready');
      await loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      await loadRuns();
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
    { label: 'Raw Results', value: summary.rawResults, icon: Database },
    { label: 'Unique Businesses', value: summary.uniqueBusinesses, icon: BarChart3 },
    { label: 'Sales Ready', value: summary.salesReady, icon: Target },
    { label: 'Priority A', value: summary.priorityA, icon: Zap },
    { label: 'Priority B', value: summary.priorityB, icon: Zap },
    { label: 'Valid Mobile', value: summary.validMobile, icon: Phone },
    { label: 'Google Calls Saved', value: summary.duplicateDetailsCallsAvoided, icon: ShieldCheck },
    { label: 'Approx API Cost', value: formatMoney(summary.estimatedCostUsd), icon: WalletCards },
  ];
  const costPreview = Math.min(Number(count || 100), 1000) * 0.006;

  return (
    <AdminLayout title="DSA Lead Finder">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-6 xl:px-8">
        <Header tab={tab} setTab={setTab} />

        {(error || notice) && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          >
            {error || notice}
          </div>
        )}

        {tab === 'data' ? (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-lg font-900 text-slate-950">Results</h2>
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
                        '/api/admin-lead-finder/export?sales_ready=true',
                        'dsa-sales-ready.csv'
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
              <LeadTable loading={loading} prospects={prospects} onWhy={setWhy} />
            </div>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_440px]">
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
                    disabled={saving}
                    onClick={runSearch}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-950 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Play size={17} /> {saving ? 'Running...' : 'Start Find Run'}
                  </button>
                  <button
                    disabled={saving}
                    onClick={reclassify}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-900 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <Settings2 size={17} /> Reclassify Existing Data
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-lg font-900 text-slate-950">Cost Guardrails</h2>
                </div>
                <div className="space-y-4">
                  <Guardrail
                    icon={Clock3}
                    title="30-day TTL"
                    text="Fresh city + state + keyword coverage reuses DB results."
                    status="Active"
                  />
                  <Guardrail
                    icon={ShieldCheck}
                    title="Server-side Google key"
                    text="Google keys are never exposed in browser code."
                    status="Secure"
                  />
                  <Guardrail
                    icon={Zap}
                    title="Duplicate-safe"
                    text="Existing place_id records skip paid Details calls."
                    status="Enabled"
                  />
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-900 uppercase text-amber-700">
                      Worst-case Place Details estimate
                    </p>
                    <p className="mt-1 text-2xl font-950 text-slate-950">
                      {formatMoney(costPreview)}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Backend budget cap stops runs before excess paid calls.
                    </p>
                  </div>
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
      </div>
    </AdminLayout>
  );
}

function Header({
  tab,
  setTab,
}: {
  tab: 'data' | 'settings';
  setTab: (tab: 'data' | 'settings') => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Search size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-900 text-slate-950">Lead Finder</h1>
          <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setTab('data')}
              className={`rounded-lg px-5 py-2 text-sm font-900 ${tab === 'data' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Data
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`rounded-lg px-5 py-2 text-sm font-900 ${tab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Find & Settings
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-800 text-emerald-700">
          <Clock3 size={14} /> 30-day cache Active
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-800 text-blue-700">
          <ShieldCheck size={14} /> Server key Connected
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-800 text-slate-600">
          <Zap size={14} /> Duplicate-safe
        </span>
      </div>
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

function Guardrail({
  icon: Icon,
  title,
  text,
  status,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
  status: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
      <Icon className="mt-0.5 text-emerald-600" size={18} />
      <div className="min-w-0 flex-1">
        <p className="font-900 text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{text}</p>
      </div>
      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-900 text-emerald-700">
        {status}
      </span>
    </div>
  );
}

function LeadTable({
  loading,
  prospects,
  onWhy,
}: {
  loading: boolean;
  prospects: Prospect[];
  onWhy: (prospect: Prospect) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {[
              'Business',
              'Phone',
              'Segment',
              'Score',
              'Priority',
              'City',
              'Rating',
              'Keywords',
              'Why',
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
              <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                Loading...
              </td>
            </tr>
          ) : prospects.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                No records in this view yet.
              </td>
            </tr>
          ) : (
            prospects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-slate-50">
                <td className="min-w-[260px] px-4 py-3">
                  <p className="font-900 text-slate-900">{prospect.business_name || '-'}</p>
                  <p className="max-w-xs truncate text-xs text-slate-500">
                    {prospect.google_maps_url}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{prospect.raw_phone || '-'}</td>
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
