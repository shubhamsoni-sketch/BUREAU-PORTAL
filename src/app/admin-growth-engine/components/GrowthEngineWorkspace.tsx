'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  FileCheck2,
  Filter,
  Play,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import { audienceFields, audienceOperators } from '@/lib/credit-audience/catalog';
import { audienceUseCases, rulesForUseCase } from '@/lib/credit-audience/use-cases';

type ViewMode =
  | 'overview'
  | 'audience-master'
  | 'audience-builder'
  | 'audience-orders'
  | 'cibil-enrichment';

type AudienceMasterRow = {
  id: number;
  source_file: string | null;
  zip_member: string | null;
  row_index: number | null;
  sequence_no: string | null;
  account_no: string | null;
  adviser_transaction_no: string | null;
  member_reference: string | null;
  total_features: number | null;
  cibiltusc3_score_value: string | null;
  cibiltusc3_score_reason_code_set: string | null;
  cibiltusc3_score_error_code_set: string | null;
  score_value_numeric: number | null;
  created_at: string | null;
};

type AudienceMasterData = {
  success: boolean;
  generatedAt: string;
  stats: {
    totalRows: number;
    filteredRows: number;
    scoreAvailable: number;
    scoreMissing: number;
    score700Plus: number;
    score650699: number;
    scoreBelow650: number;
    errorRows: number;
    filesSeen: number;
    completedFiles: number;
    failedFiles: number;
    minScore: number | null;
    maxScore: number | null;
  };
  sourceFiles: Array<{ value: string; label: string }>;
  rows: AudienceMasterRow[];
  page: number;
  pageSize: number;
};

type AudiencePreviewData = {
  matchingRecords: number;
  matchingSample: number;
  sampleRecords: number;
  populationRecords: number;
  isEstimate: boolean;
  filters: Array<{
    filterIndex: number;
    code: string;
    description: string;
    operator: string;
    value: number | null;
    matchingRecords: number;
  }>;
};

type AudienceFilterRow = {
  field: string;
  operator: string;
  value: string;
};

const navigation = [
  { id: 'overview', label: 'Growth Engine', href: '/admin-growth-engine', icon: Rocket },
  {
    id: 'audience-master',
    label: 'Audience Master',
    href: '/admin-growth-engine/audience-master',
    icon: DatabaseZap,
  },
  {
    id: 'audience-builder',
    label: 'Audience Builder',
    href: '/admin-growth-engine/audience-builder',
    icon: SlidersHorizontal,
  },
  {
    id: 'audience-orders',
    label: 'Audience Orders',
    href: '/admin-growth-engine/audience-orders',
    icon: ClipboardList,
  },
  {
    id: 'cibil-enrichment',
    label: 'CIBIL Enrichment',
    href: '/admin-growth-engine/cibil-enrichment',
    icon: Sparkles,
  },
] as const;

const topFields = audienceFields.slice(0, 32);

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function metricTone(tone: 'blue' | 'emerald' | 'amber' | 'red' | 'violet') {
  const map = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  };
  return map[tone];
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Rocket;
  tone: 'blue' | 'emerald' | 'amber' | 'red' | 'violet';
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${metricTone(tone)}`}
        >
          <Icon size={18} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      <p className="mt-4 truncate text-2xl font-bold text-slate-950" title={value}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function EmptyState({ title, helper }: { title: string; helper: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function GrowthHeader({ view }: { view: ViewMode }) {
  const current = navigation.find((item) => item.id === view) || navigation[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Growth Engine
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{current.label}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Audience inventory, signal filters, order intent and enrichment controls for the Bureau
            Portal.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          <ShieldCheck size={17} />
          Identity-safe admin workspace
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.id === view;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AudienceMasterView() {
  const [data, setData] = useState<AudienceMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    sourceFile: 'all',
    scoreStatus: 'all',
    errorStatus: 'all',
    minScore: '',
    maxScore: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '50', ...appliedFilters });
      const response = await authFetch(
        `/api/admin-growth-engine/audience-master?${params.toString()}`,
        {
          cache: 'no-store',
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || 'Unable to load audience master');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load audience master');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilter = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const clearFilter = () => {
    const cleared = {
      search: '',
      sourceFile: 'all',
      scoreStatus: 'all',
      errorStatus: 'all',
      minScore: '',
      maxScore: '',
    };
    setPage(1);
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total rows"
          value={formatNumber(data?.stats.totalRows)}
          helper="Verified audience inventory"
          icon={DatabaseZap}
          tone="blue"
        />
        <MetricCard
          label="Filtered"
          value={formatNumber(data?.stats.filteredRows)}
          helper="Current selected audience"
          icon={Filter}
          tone="violet"
        />
        <MetricCard
          label="Score available"
          value={formatNumber(data?.stats.scoreAvailable)}
          helper={`${formatNumber(data?.stats.score700Plus)} rows at 700+`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <MetricCard
          label="Data errors"
          value={formatNumber(data?.stats.errorRows)}
          helper={`${formatNumber(data?.stats.completedFiles)} completed files`}
          icon={AlertCircle}
          tone={data?.stats.errorRows ? 'red' : 'amber'}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Audience Filters</h2>
              <p className="text-sm text-slate-500">
                Run filters against verified rows without exposing customer identity.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Search reference
            </span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Member ref, account, transaction"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Batch</span>
            <select
              value={filters.sourceFile}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sourceFile: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="all">All batches</option>
              {data?.sourceFiles.map((file) => (
                <option key={file.value} value={file.value}>
                  {file.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Score</span>
            <select
              value={filters.scoreStatus}
              onChange={(event) =>
                setFilters((current) => ({ ...current, scoreStatus: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="all">All</option>
              <option value="with_score">Available</option>
              <option value="missing_score">Missing</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Min score
            </span>
            <input
              type="number"
              value={filters.minScore}
              onChange={(event) =>
                setFilters((current) => ({ ...current, minScore: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Max score
            </span>
            <input
              type="number"
              value={filters.maxScore}
              onChange={(event) =>
                setFilters((current) => ({ ...current, maxScore: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Error</span>
            <select
              value={filters.errorStatus}
              onChange={(event) =>
                setFilters((current) => ({ ...current, errorStatus: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="all">All</option>
              <option value="without_error">Clean only</option>
              <option value="with_error">Errors only</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={applyFilter}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Filter size={16} />
              Run
            </button>
            <button
              type="button"
              onClick={clearFilter}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Filtered Audience Rows</h2>
            <p className="text-sm text-slate-500">
              Showing identity-safe records. Matched count: {formatNumber(data?.stats.filteredRows)}
              .
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm font-semibold text-slate-500">Page {page}</span>
            <button
              type="button"
              disabled={!data?.rows.length || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
        {error ? (
          <div className="p-4">
            <EmptyState title="Audience data unavailable" helper={error} />
          </div>
        ) : loading ? (
          <div className="p-4">
            <EmptyState
              title="Loading audience inventory"
              helper="Fetching verified Supabase rows."
            />
          </div>
        ) : !data?.rows.length ? (
          <div className="p-4">
            <EmptyState title="No rows matched" helper="Change filters and run again." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Member Ref</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Features</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Error</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.member_reference || row.sequence_no || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.score_value_numeric ?? row.cibiltusc3_score_value ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatNumber(row.total_features)}</td>
                    <td
                      className="max-w-xs truncate px-4 py-3 text-slate-500"
                      title={row.cibiltusc3_score_reason_code_set || ''}
                    >
                      {row.cibiltusc3_score_reason_code_set || '-'}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-3 text-slate-500"
                      title={row.cibiltusc3_score_error_code_set || ''}
                    >
                      {row.cibiltusc3_score_error_code_set || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.source_file ? 'Audience Batch' : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AudienceBuilderView() {
  const defaultRules = useMemo(() => rulesForUseCase(audienceUseCases[0].id), []);
  const [selectedUseCase, setSelectedUseCase] = useState(audienceUseCases[0].id);
  const [filters, setFilters] = useState<AudienceFilterRow[]>(defaultRules);
  const [preview, setPreview] = useState<AudiencePreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const groupedUseCases = useMemo(() => {
    return audienceUseCases.reduce<Record<string, typeof audienceUseCases>>((acc, item) => {
      acc[item.industry] = [...(acc[item.industry] || []), item];
      return acc;
    }, {});
  }, []);

  const runPreview = async () => {
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const response = await authFetch('/api/admin-growth-engine/audience-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || 'Unable to run audience preview');
      setPreview(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run audience preview');
    } finally {
      setLoading(false);
    }
  };

  const chooseUseCase = (id: string) => {
    setSelectedUseCase(id);
    setFilters(rulesForUseCase(id));
    setPreview(null);
    setError('');
  };

  const updateFilter = (index: number, patch: Partial<AudienceFilterRow>) => {
    setFilters((current) =>
      current.map((filter, idx) => (idx === index ? { ...filter, ...patch } : filter))
    );
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Use Case Presets</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick an industry intent. The private signal logic stays inside the system.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {audienceUseCases.length} presets
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(groupedUseCases).map(([industry, items]) =>
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseUseCase(item.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selectedUseCase === item.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {industry}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-bold text-slate-950">Audience Conditions</h2>
            <p className="text-sm text-slate-500">
              Add up to five conditions. Preview returns counts only.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {filters.map((filter, index) => {
              const selectedOperator = audienceOperators.find(
                (operator) => operator.value === filter.operator
              );
              return (
                <div
                  key={`${filter.field}-${index}`}
                  className="grid gap-3 p-4 lg:grid-cols-[44px_minmax(220px,1fr)_180px_160px_44px]"
                >
                  <div className="flex items-center text-sm font-bold text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Signal
                    </span>
                    <select
                      value={filter.field}
                      onChange={(event) => updateFilter(index, { field: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
                    >
                      {topFields.map((field) => (
                        <option key={field.code} value={field.code}>
                          {field.description}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Comparison
                    </span>
                    <select
                      value={filter.operator}
                      onChange={(event) => updateFilter(index, { operator: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
                    >
                      {audienceOperators.map((operator) => (
                        <option key={operator.value} value={operator.value}>
                          {operator.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Value
                    </span>
                    <input
                      type="number"
                      value={filter.value}
                      disabled={!selectedOperator?.needsValue}
                      onChange={(event) => updateFilter(index, { value: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={filters.length <= 1}
                    onClick={() =>
                      setFilters((current) => current.filter((_, idx) => idx !== index))
                    }
                    className="mt-5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    title="Remove condition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
            <button
              type="button"
              disabled={filters.length >= 5}
              onClick={() =>
                setFilters((current) => [
                  ...current,
                  { field: 'SCORE', operator: 'gte', value: '700' },
                ])
              }
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Add condition
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={runPreview}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              <Play size={16} />
              {loading ? 'Running preview' : 'Run preview'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Audience Result</h2>
          <p className="mt-1 text-sm text-slate-500">
            Aggregate count only. Identity fields are not returned here.
          </p>
          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : preview ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Estimated audience
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">
                  {formatNumber(preview.matchingRecords)}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Sample {formatNumber(preview.matchingSample)} of{' '}
                  {formatNumber(preview.sampleRecords)}
                </p>
              </div>
              {preview.filters.map((filter) => (
                <div key={filter.filterIndex} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">{filter.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Match: {formatNumber(filter.matchingRecords)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState title="Run preview" helper="Select filters and preview audience size." />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-emerald-600" size={18} />
            <div>
              <p className="font-bold text-slate-950">Protected by design</p>
              <p className="mt-1 text-sm text-slate-500">
                Sales users see business-ready segments. Admin delivery approval can be wired next
                for paid data movement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewView() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {navigation.slice(1).map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700">
                <Icon size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Admin
              </span>
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-950">{item.label}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {item.id === 'audience-master' &&
                'Live audience inventory, filters and identity-safe row review.'}
              {item.id === 'audience-builder' &&
                'Build marketable use-case segments from verified signals.'}
              {item.id === 'audience-orders' &&
                'Track audience delivery requests, approvals and fulfilment state.'}
              {item.id === 'cibil-enrichment' &&
                'Monitor enrichment readiness and data quality operations.'}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function OrdersView() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Open orders"
          value="0"
          helper="Approval workflow ready"
          icon={ClipboardList}
          tone="blue"
        />
        <MetricCard
          label="Delivery queues"
          value="0"
          helper="No live partner export active"
          icon={FileCheck2}
          tone="emerald"
        />
        <MetricCard
          label="Blocked"
          value="0"
          helper="No unresolved order issue"
          icon={AlertCircle}
          tone="amber"
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <EmptyState
          title="Audience order workflow is ready for wiring"
          helper="Next pass can connect pricing, approval, masked export, and delivery logs without changing Audience Master."
        />
      </div>
    </div>
  );
}

function EnrichmentView() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Input batches"
          value="Ready"
          helper="Unique reference matching planned"
          icon={Sparkles}
          tone="violet"
        />
        <MetricCard
          label="Validation"
          value="Safe"
          helper="No direct identity sale view here"
          icon={ShieldCheck}
          tone="emerald"
        />
        <MetricCard
          label="Output"
          value="Pending"
          helper="Approval workflow to be wired"
          icon={BarChart3}
          tone="blue"
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <EmptyState
          title="CIBIL enrichment control shell is live"
          helper="Use this route for future unique-number enrichment jobs, file audits, and verification counts."
        />
      </div>
    </div>
  );
}

export default function GrowthEngineWorkspace({ view }: { view: ViewMode }) {
  const pageTitle = useMemo(
    () => navigation.find((item) => item.id === view)?.label || 'Growth Engine',
    [view]
  );

  return (
    <AdminLayout title={pageTitle}>
      <div className="space-y-5 p-6">
        <GrowthHeader view={view} />
        {view === 'overview' && <OverviewView />}
        {view === 'audience-master' && <AudienceMasterView />}
        {view === 'audience-builder' && <AudienceBuilderView />}
        {view === 'audience-orders' && <OrdersView />}
        {view === 'cibil-enrichment' && <EnrichmentView />}
      </div>
    </AdminLayout>
  );
}
