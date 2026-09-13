'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeIndianRupee,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
  Gauge,
  IndianRupee,
  Network,
  RefreshCw,
  Route,
  Shield,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import { useAuth } from '@/context/AuthContext';
import { hasLenderIntelligenceClientPermission } from '@/lib/lender-intelligence/client-access';

type ViewMode = 'overview' | 'routing' | 'performance' | 'compliance';
type RateMetric = {
  numerator: number;
  denominator: number;
  value: number | null;
  sufficientSample: boolean;
};

type LenderIntelData = {
  generatedAt: string;
  summary: {
    totalLenders: number;
    activeLenders: number;
    mappedProducts: number;
    reportsChecked: number;
    matchedReports: number;
    matchRate: number | null;
    sentFiles: number;
    approvalRate: number;
    rejectionRate: number;
    pendingInvoiceAmount: number;
    pendingInvoices: number;
  };
  lenders: Array<{
    id: string;
    name: string;
    type: string;
    products: string[];
    status: string;
    approvalRate: number;
    activeApps: number;
    scoreCutoff: number;
    minIncome: number;
    maxLoan: number;
    avgTat: string;
    rm: string;
    updatedAt: string | null;
  }>;
  routing: {
    productVolume: Array<{ product: string; count: number }>;
    latestReports: Array<{
      id: string;
      product: string;
      score: number | null;
      status: string;
      matchedCount: number;
      createdAt: string | null;
    }>;
  };
  performance: {
    lenderVolume: Array<{
      lender: string;
      files: number;
      amount: number;
      approved: number;
      rejected: number;
    }>;
    rejectionReasons: Array<{ reason: string; count: number }>;
    latestApplications: Array<{
      id: string;
      lender: string;
      product: string;
      amount: number;
      status: string;
      updatedAt: string | null;
    }>;
  };
  compliance: {
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      partnerName: string;
      amount: number;
      status: string;
      issuedAt: string | null;
    }>;
  };
  intelligence: {
    cohort: { from: string; to: string; maturityDays: number; minimumSampleSize: number };
    kpis: {
      loginRate: RateMetric;
      approvalRate: RateMetric;
      rejectionRate: RateMetric;
      disbursalRate: RateMetric;
      overrideRate: RateMetric;
      matchRate: RateMetric;
      policyFreshness: RateMetric;
    };
    breakdown: Array<{
      dimension: 'lender' | 'program' | 'product' | 'partner';
      dimensionId: string;
      label: string;
      sentFiles: number;
      pendingFiles: number;
      applicationIds: string[];
      loginRate: RateMetric;
      approvalRate: RateMetric;
      rejectionRate: RateMetric;
      disbursalRate: RateMetric;
      sanctionTatHours: {
        sampleSize: number;
        median: number;
        p90: number;
        sufficientSample: boolean;
      };
      disbursalTatHours: {
        sampleSize: number;
        median: number;
        p90: number;
        sufficientSample: boolean;
      };
    }>;
    profilePerformance: {
      cohort: {
        from: string;
        to: string;
        minimumSampleSize: number;
        modelVersion: string | null;
        mode: string;
        fallback: string;
      };
      rows: Array<{
        dimension: 'score_band' | 'income_band' | 'loan_band' | 'employment';
        segmentId: string;
        label: string;
        sampleSize: number;
        terminalDecisions: number;
        applicationIds: string[];
        approvalRate: RateMetric;
        rejectionRate: RateMetric;
        overrideRate: RateMetric;
        disbursedFiles: number;
      }>;
    };
    pendingDecisions: number;
    terminalDecisions: number;
    approvalRate: number;
    rejectionRate: number;
    disbursedFiles: number;
    overrideRate: number;
    policyFreshness: number;
    publishedPolicies: number;
    openQualityIssues: number;
    criticalQualityIssues: number;
    expectedPayout: number;
    receivedPayout: number;
    outstandingPayout: number;
    sanctionTatHours: { sampleSize: number; median: number; p75: number; p90: number };
    disbursalTatHours: { sampleSize: number; median: number; p75: number; p90: number };
  };
};

const navigation = [
  {
    id: 'overview',
    label: 'Lender Intelligence',
    href: '/admin-lender-intelligence',
    icon: Brain,
    permission: 'intelligence.read',
  },
  {
    id: 'routing',
    label: 'Lender Routing',
    href: '/admin-lender-intelligence/routing',
    icon: Route,
    permission: 'intelligence.read',
  },
  {
    id: 'performance',
    label: 'Lender Performance',
    href: '/admin-lender-intelligence/performance',
    icon: BarChart3,
    permission: 'intelligence.read',
  },
  {
    id: 'compliance',
    label: 'Finance & Reconciliation',
    href: '/admin-lender-intelligence/invoicing-compliance',
    icon: BadgeIndianRupee,
    permission: 'finance.read',
  },
  {
    id: 'complianceEvidence',
    label: 'Compliance Evidence',
    href: '/admin-lender-intelligence/compliance',
    icon: Shield,
    permission: 'compliance.read',
  },
] as const;

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function rateValue(metric: RateMetric) {
  return metric.value === null ? '—' : `${metric.value}%`;
}

function rateHelper(metric: RateMetric, minimumSampleSize: number) {
  const evidence = `${formatNumber(metric.numerator)} / ${formatNumber(metric.denominator)}`;
  return metric.sufficientSample ? evidence : `${evidence} · hidden until n≥${minimumSampleSize}`;
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (['active', 'approved', 'success', 'paid', 'disbursed'].includes(value))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['rejected', 'declined', 'failed'].includes(value))
    return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
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
  icon: typeof Brain;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tone}`}>
          <Icon size={19} />
        </div>
        <TrendingUp size={15} className="text-slate-300" />
      </div>
      <p className="mt-5 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

export default function LenderIntelligenceWorkspace({ view }: { view: ViewMode }) {
  const { user } = useAuth();
  const [data, setData] = useState<LenderIntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [breakdownDimension, setBreakdownDimension] = useState<
    'lender' | 'program' | 'product' | 'partner'
  >('lender');
  const [expandedBreakdown, setExpandedBreakdown] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin-lender-intelligence', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || !json.success)
        throw new Error(json.error || 'Unable to load lender intelligence');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load lender intelligence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pageTitle = useMemo(() => {
    return navigation.find((item) => item.id === view)?.label || 'Lender Intelligence';
  }, [view]);
  const visibleNavigation = navigation.filter((item) =>
    hasLenderIntelligenceClientPermission(user, item.permission)
  );

  return (
    <AdminLayout title={pageTitle}>
      <div className="space-y-5 p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Lender Intelligence
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">{pageTitle}</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                One admin control room for lender master, policy routing, partner performance,
                invoicing and compliance readiness.
              </p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-5">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const active = item.id === view;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Active lenders"
                value={`${formatNumber(data.summary.activeLenders)} / ${formatNumber(data.summary.totalLenders)}`}
                helper="CRM lender master"
                icon={Network}
                tone="border-blue-100 bg-blue-50 text-blue-600"
              />
              <MetricCard
                label="Mapped products"
                value={formatNumber(data.summary.mappedProducts)}
                helper="Across lender policies"
                icon={FileText}
                tone="border-violet-100 bg-violet-50 text-violet-600"
              />
              <MetricCard
                label="Routing match rate"
                value={rateValue(data.intelligence.kpis.matchRate)}
                helper={rateHelper(
                  data.intelligence.kpis.matchRate,
                  data.intelligence.cohort.minimumSampleSize
                )}
                icon={Gauge}
                tone="border-emerald-100 bg-emerald-50 text-emerald-600"
              />
              <MetricCard
                label="Pending invoice exposure"
                value={money.format(data.summary.pendingInvoiceAmount)}
                helper={`${formatNumber(data.summary.pendingInvoices)} invoices pending`}
                icon={IndianRupee}
                tone="border-amber-100 bg-amber-50 text-amber-600"
              />
            </div>

            {view === 'overview' && (
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm xl:col-span-2">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-bold text-slate-900">Lender Master</h2>
                    <p className="text-sm text-slate-500">
                      Live lenders currently available to the CRM routing stack.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 text-left">Lender</th>
                          <th className="px-5 py-3 text-left">Products</th>
                          <th className="px-5 py-3 text-left">Policy</th>
                          <th className="px-5 py-3 text-left">Owner</th>
                          <th className="px-5 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.lenders.slice(0, 12).map((lender) => (
                          <tr key={lender.id}>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">{lender.name}</p>
                              <p className="text-xs uppercase text-slate-400">{lender.type}</p>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {lender.products.length ? lender.products.join(', ') : '-'}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              Score {lender.scoreCutoff || '-'} · Income{' '}
                              {lender.minIncome ? money.format(lender.minIncome) : '-'}
                            </td>
                            <td className="px-5 py-4 text-slate-600">{lender.rm}</td>
                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(lender.status)}`}
                              >
                                {lender.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <ShieldCheck size={17} className="text-emerald-600" />
                      Operating notes
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>
                        Policies should be maintained at lender-product level before routing rules
                        go fully automatic.
                      </p>
                      <p>
                        Routing and performance tabs are reading live CRM files and eligibility
                        reports.
                      </p>
                      <p>
                        Published policy evaluation, immutable decisions and outcome feedback use
                        this governed workspace.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Last refreshed
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDate(data.generatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {view === 'routing' && (
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">Product Routing Demand</h2>
                  <div className="mt-4 space-y-3">
                    {data.routing.productVolume.length ? (
                      data.routing.productVolume.map((item) => (
                        <div
                          key={item.product}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                        >
                          <span className="font-medium capitalize text-slate-700">
                            {item.product}
                          </span>
                          <span className="text-sm font-bold text-slate-950">
                            {formatNumber(item.count)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <EmptyState text="No routing demand captured in the current 90-day cohort." />
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-bold text-slate-900">Latest Eligibility Runs</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {data.routing.latestReports.length ? (
                      data.routing.latestReports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between gap-4 px-5 py-4"
                        >
                          <div>
                            <p className="font-semibold capitalize text-slate-900">
                              {report.product}
                            </p>
                            <p className="text-xs text-slate-400">
                              Score {report.score ?? '-'} · {formatDate(report.createdAt)}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {report.matchedCount} matches
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-5">
                        <EmptyState text="No eligibility runs available." />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {view === 'performance' && (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Terminal approval rate"
                    value={rateValue(data.intelligence.kpis.approvalRate)}
                    helper={`${rateHelper(data.intelligence.kpis.approvalRate, data.intelligence.cohort.minimumSampleSize)} · ${data.intelligence.pendingDecisions} pending`}
                    icon={CheckCircle2}
                    tone="border-emerald-100 bg-emerald-50 text-emerald-600"
                  />
                  <MetricCard
                    label="Routing override rate"
                    value={rateValue(data.intelligence.kpis.overrideRate)}
                    helper={rateHelper(
                      data.intelligence.kpis.overrideRate,
                      data.intelligence.cohort.minimumSampleSize
                    )}
                    icon={Route}
                    tone="border-amber-100 bg-amber-50 text-amber-600"
                  />
                  <MetricCard
                    label="Median sanction TAT"
                    value={
                      data.intelligence.sanctionTatHours.sampleSize >=
                      data.intelligence.cohort.minimumSampleSize
                        ? `${data.intelligence.sanctionTatHours.median}h`
                        : '—'
                    }
                    helper={`n=${data.intelligence.sanctionTatHours.sampleSize} · P90 ${data.intelligence.sanctionTatHours.p90}h · minimum n=${data.intelligence.cohort.minimumSampleSize}`}
                    icon={Gauge}
                    tone="border-blue-100 bg-blue-50 text-blue-600"
                  />
                  <MetricCard
                    label="Policy freshness"
                    value={rateValue(data.intelligence.kpis.policyFreshness)}
                    helper={rateHelper(data.intelligence.kpis.policyFreshness, 1)}
                    icon={ShieldCheck}
                    tone="border-violet-100 bg-violet-50 text-violet-600"
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-bold text-slate-900">KPI evidence contract</p>
                    <p className="text-xs text-slate-500">
                      Sent-date cohort {formatDate(data.intelligence.cohort.from)} to{' '}
                      {formatDate(data.intelligence.cohort.to)} · minimum n=
                      {data.intelligence.cohort.minimumSampleSize}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md bg-blue-50 p-3">
                      <p className="text-xs font-bold uppercase text-blue-600">Login rate</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {rateValue(data.intelligence.kpis.loginRate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rateHelper(
                          data.intelligence.kpis.loginRate,
                          data.intelligence.cohort.minimumSampleSize
                        )}
                      </p>
                    </div>
                    <div className="rounded-md bg-red-50 p-3">
                      <p className="text-xs font-bold uppercase text-red-600">
                        Terminal rejection rate
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {rateValue(data.intelligence.kpis.rejectionRate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rateHelper(
                          data.intelligence.kpis.rejectionRate,
                          data.intelligence.cohort.minimumSampleSize
                        )}
                      </p>
                    </div>
                    <div className="rounded-md bg-emerald-50 p-3">
                      <p className="text-xs font-bold uppercase text-emerald-600">
                        Matured disbursal rate
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {rateValue(data.intelligence.kpis.disbursalRate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rateHelper(
                          data.intelligence.kpis.disbursalRate,
                          data.intelligence.cohort.minimumSampleSize
                        )}{' '}
                        · {data.intelligence.cohort.maturityDays}d
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900">Evidence drill-down</h2>
                      <p className="text-sm text-slate-500">
                        Same cohort and sample rules, grouped to operational dimensions.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(['lender', 'program', 'product', 'partner'] as const).map((dimension) => (
                        <button
                          key={dimension}
                          type="button"
                          onClick={() => {
                            setBreakdownDimension(dimension);
                            setExpandedBreakdown('');
                          }}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${breakdownDimension === dimension ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}
                        >
                          {dimension}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3 text-left">{breakdownDimension}</th>
                          <th className="px-5 py-3 text-right">Sent / pending</th>
                          <th className="px-5 py-3 text-right">Login</th>
                          <th className="px-5 py-3 text-right">Approval</th>
                          <th className="px-5 py-3 text-right">Disbursal</th>
                          <th className="px-5 py-3 text-right">Sanction TAT</th>
                          <th className="px-5 py-3 text-right">Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.intelligence.breakdown
                          .filter((item) => item.dimension === breakdownDimension)
                          .map((item) => {
                            const rowKey = `${item.dimension}:${item.dimensionId}`;
                            return (
                              <Fragment key={rowKey}>
                                <tr>
                                  <td className="px-5 py-3 font-semibold text-slate-900">
                                    {item.label}
                                  </td>
                                  <td className="px-5 py-3 text-right text-slate-600">
                                    {item.sentFiles} / {item.pendingFiles}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    {rateValue(item.loginRate)}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    {rateValue(item.approvalRate)}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    {rateValue(item.disbursalRate)}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    {item.sanctionTatHours.sufficientSample
                                      ? `${item.sanctionTatHours.median}h`
                                      : '—'}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedBreakdown(
                                          expandedBreakdown === rowKey ? '' : rowKey
                                        )
                                      }
                                      className="text-xs font-semibold text-blue-600"
                                    >
                                      {expandedBreakdown === rowKey
                                        ? 'Hide files'
                                        : `View files (${item.applicationIds.length})`}
                                    </button>
                                  </td>
                                </tr>
                                {expandedBreakdown === rowKey && (
                                  <tr>
                                    <td colSpan={7} className="bg-slate-50 px-5 py-3">
                                      <div className="flex flex-wrap gap-2">
                                        {item.applicationIds.map((id) => (
                                          <Link
                                            key={id}
                                            href={`/crm/loan-application-tracking?application=${encodeURIComponent(id)}`}
                                            className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-blue-700 hover:border-blue-300"
                                          >
                                            {id}
                                          </Link>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        {!data.intelligence.breakdown.some(
                          (item) => item.dimension === breakdownDimension
                        ) && (
                          <tr>
                            <td colSpan={7} className="p-5">
                              <EmptyState text="No dimension data in this cohort." />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-bold text-slate-900">Similar-profile performance</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Descriptive borrower bands only. Rates stay hidden below n=
                      {data.intelligence.profilePerformance.cohort.minimumSampleSize}; deterministic
                      policy routing remains authoritative.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3 text-left">Profile band</th>
                          <th className="px-5 py-3 text-right">Sample / terminal</th>
                          <th className="px-5 py-3 text-right">Approval</th>
                          <th className="px-5 py-3 text-right">Rejection</th>
                          <th className="px-5 py-3 text-right">Override</th>
                          <th className="px-5 py-3 text-right">Disbursed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.intelligence.profilePerformance.rows.map((row) => (
                          <tr key={`${row.dimension}:${row.segmentId}`}>
                            <td className="px-5 py-3">
                              <p className="font-semibold text-slate-900">{row.label}</p>
                              <p className="text-xs capitalize text-slate-500">
                                {row.dimension.replace(/_/g, ' ')}
                              </p>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-600">
                              {row.sampleSize} / {row.terminalDecisions}
                            </td>
                            <td className="px-5 py-3 text-right">{rateValue(row.approvalRate)}</td>
                            <td className="px-5 py-3 text-right">{rateValue(row.rejectionRate)}</td>
                            <td className="px-5 py-3 text-right">{rateValue(row.overrideRate)}</td>
                            <td className="px-5 py-3 text-right">{row.disbursedFiles}</td>
                          </tr>
                        ))}
                        {!data.intelligence.profilePerformance.rows.length && (
                          <tr>
                            <td colSpan={6} className="p-5">
                              <EmptyState text="No application-bound routing samples are available in this cohort." />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="grid gap-5 xl:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm xl:col-span-2">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="text-base font-bold text-slate-900">
                        Lender File Performance
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-3 text-left">Lender</th>
                            <th className="px-5 py-3 text-right">Files</th>
                            <th className="px-5 py-3 text-right">Amount</th>
                            <th className="px-5 py-3 text-right">Approved</th>
                            <th className="px-5 py-3 text-right">Rejected</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.performance.lenderVolume.length ? (
                            data.performance.lenderVolume.map((row) => (
                              <tr key={row.lender}>
                                <td className="px-5 py-4 font-semibold text-slate-900">
                                  {row.lender}
                                </td>
                                <td className="px-5 py-4 text-right text-slate-600">
                                  {formatNumber(row.files)}
                                </td>
                                <td className="px-5 py-4 text-right text-slate-600">
                                  {money.format(row.amount)}
                                </td>
                                <td className="px-5 py-4 text-right text-emerald-700">
                                  {formatNumber(row.approved)}
                                </td>
                                <td className="px-5 py-4 text-right text-red-700">
                                  {formatNumber(row.rejected)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-5">
                                <EmptyState text="No lender files captured in the current 90-day cohort." />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900">Rejection Reasons</h2>
                    <div className="mt-4 space-y-3">
                      {data.performance.rejectionReasons.length ? (
                        data.performance.rejectionReasons.map((item) => (
                          <div key={item.reason} className="rounded-lg bg-red-50 px-4 py-3">
                            <p className="text-sm font-semibold text-red-800">{item.reason}</p>
                            <p className="text-xs text-red-500">{formatNumber(item.count)} files</p>
                          </div>
                        ))
                      ) : (
                        <EmptyState text="No rejection reason data yet." />
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Matured disbursal rate
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {rateValue(data.intelligence.kpis.disbursalRate)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {rateHelper(
                        data.intelligence.kpis.disbursalRate,
                        data.intelligence.cohort.minimumSampleSize
                      )}{' '}
                      · {data.intelligence.cohort.maturityDays}-day maturity
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">Outstanding payout</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {money.format(data.intelligence.outstandingPayout)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Expected {money.format(data.intelligence.expectedPayout)} · Received{' '}
                      {money.format(data.intelligence.receivedPayout)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">Data quality</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {data.intelligence.openQualityIssues} open
                    </p>
                    <p className="text-xs text-slate-500">
                      {data.intelligence.criticalQualityIssues} critical issues
                    </p>
                  </div>
                </div>
              </div>
            )}

            {view === 'compliance' && (
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Invoicing & Compliance</h2>
                    <p className="text-sm text-slate-500">
                      Partner invoice exposure linked to lender operations.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    {formatNumber(data.summary.pendingInvoices)} pending invoices
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 text-left">Invoice</th>
                        <th className="px-5 py-3 text-left">Partner</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Issued</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.compliance.invoices.length ? (
                        data.compliance.invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="px-5 py-4 text-slate-600">{invoice.partnerName}</td>
                            <td className="px-5 py-4 text-right text-slate-600">
                              {money.format(invoice.amount)}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(invoice.status)}`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-500">
                              {formatDate(invoice.issuedAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-5">
                            <EmptyState text="No invoice data available." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Same Supabase
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Reads Bureau Portal CRM and finance tables directly.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Route size={16} className="text-blue-600" />
              Routing ready
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Published policy waterfall, governed overrides and outcome feedback are connected
              here.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck size={16} className="text-violet-600" />
              Admin controlled
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Visible only inside Bureau Portal admin routes.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
