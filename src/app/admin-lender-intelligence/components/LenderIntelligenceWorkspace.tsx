'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';

type ViewMode = 'overview' | 'routing' | 'performance' | 'compliance';

type LenderIntelData = {
  generatedAt: string;
  summary: {
    totalLenders: number;
    activeLenders: number;
    mappedProducts: number;
    reportsChecked: number;
    matchedReports: number;
    matchRate: number;
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
};

const navigation = [
  { id: 'overview', label: 'Lender Intelligence', href: '/admin-lender-intelligence', icon: Brain },
  {
    id: 'routing',
    label: 'Lender Routing',
    href: '/admin-lender-intelligence/routing',
    icon: Route,
  },
  {
    id: 'performance',
    label: 'Lender Performance',
    href: '/admin-lender-intelligence/performance',
    icon: BarChart3,
  },
  {
    id: 'compliance',
    label: 'Invoicing & Compliance',
    href: '/admin-lender-intelligence/invoicing-compliance',
    icon: BadgeIndianRupee,
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
  const [data, setData] = useState<LenderIntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

          <div className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-4">
            {navigation.map((item) => {
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
                value={`${data.summary.matchRate}%`}
                helper={`${formatNumber(data.summary.matchedReports)} matched reports`}
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
                        Next phase: migrate advanced prototype policy engine into this same
                        workspace.
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
                      <EmptyState text="No routing demand captured this month." />
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
              <div className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm xl:col-span-2">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-bold text-slate-900">Lender File Performance</h2>
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
                              <EmptyState text="No lender files captured this month." />
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
              Next step is to migrate prototype policy waterfall rules here.
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
