'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  IndianRupee,
  Clock3,
  FileText,
  Network,
  RefreshCw,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';

type DashboardData = {
  generatedAt: string;
  summary: {
    totalPartners: number;
    activePartners: number;
    newPartners: number;
    monthPulls: number;
    todayPulls: number;
    successfulPulls: number;
    failedPulls: number;
    successRate: number;
    walletBalance: number;
    collections: number;
    pendingInvoiceAmount: number;
  };
  attention: {
    pendingPartnerRequests: number;
    pendingInvoices: number;
    lowBalancePartners: number;
    failedPulls: number;
  };
  activity: Array<{ date: string; label: string; total: number; success: number; failed: number }>;
  recentPulls: Array<{
    id: string;
    partnerName: string;
    partnerCode: string;
    customerName: string;
    memberRef: string;
    reportType: string;
    status: string;
    score: number | null;
    amount: number;
    error: string;
    createdAt: string;
  }>;
  topPartners: Array<{ id: string; name: string; code: string; pulls: number; walletBalance: number }>;
  recentPartners: Array<{
    id: string;
    name: string;
    code: string;
    email: string;
    status: string;
    productAccess: string;
    walletBalance: number;
    createdAt: string;
  }>;
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const statusStyle = (status: string) =>
  status.toLowerCase() === 'success'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-red-50 text-red-700 border-red-200';

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  tone: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="min-h-36 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tones[tone]}`}>
          <Icon size={19} />
        </div>
        <Activity size={16} className="text-slate-300" />
      </div>
      <p className="mt-5 text-2xl font-bold text-slate-900">{value}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="text-xs text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-14 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 rounded-lg bg-white border border-slate-200" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="h-80 rounded-lg bg-white border border-slate-200 xl:col-span-2" />
        <div className="h-80 rounded-lg bg-white border border-slate-200" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin-dashboard', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load dashboard');
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <AdminLayout title="Control Panel">
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-600">Live operations</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Business overview</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data ? `Updated ${formatTime(data.generatedAt)}` : 'Loading current platform activity'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin-partners" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <UserPlus size={15} /> Add partner
            </Link>
            <Link href="/admin-api-hub" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Network size={15} /> API Hub
            </Link>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              title="Refresh dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : error || !data ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-red-200 bg-white px-6 text-center">
            <AlertCircle size={30} className="text-red-500" />
            <h2 className="mt-3 text-lg font-bold text-slate-900">Dashboard could not load</h2>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button onClick={() => loadDashboard()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Try again</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total partners"
                value={data.summary.totalPartners.toLocaleString('en-IN')}
                detail={`${data.summary.activePartners} active`}
                icon={Users}
                tone="blue"
              />
              <MetricCard
                label="Bureau pulls"
                value={data.summary.monthPulls.toLocaleString('en-IN')}
                detail={`${data.summary.todayPulls} today`}
                icon={FileText}
                tone="emerald"
              />
              <MetricCard
                label="Partner wallet balance"
                value={currency.format(data.summary.walletBalance)}
                detail="Across partners"
                icon={Wallet}
                tone="violet"
              />
              <MetricCard
                label="Collections"
                value={currency.format(data.summary.collections)}
                detail="This month"
                icon={IndianRupee}
                tone="amber"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Bureau activity</h2>
                    <p className="mt-1 text-xs text-slate-500">Successful and failed pulls over the last 7 days</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" /> Successful</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Failed</span>
                  </div>
                </div>
                <div className="mt-5 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.activity} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Area type="monotone" dataKey="success" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
                      <Area type="monotone" dataKey="failed" stroke="#f87171" fill="#fee2e2" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-100 pt-4 text-center">
                  <div><p className="text-lg font-bold text-slate-900">{data.summary.successfulPulls}</p><p className="text-xs text-slate-500">Successful</p></div>
                  <div><p className="text-lg font-bold text-slate-900">{data.summary.failedPulls}</p><p className="text-xs text-slate-500">Failed</p></div>
                  <div><p className="text-lg font-bold text-slate-900">{data.summary.successRate}%</p><p className="text-xs text-slate-500">Success rate</p></div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-base font-bold text-slate-900">Needs attention</h2>
                  <p className="mt-1 text-xs text-slate-500">Open operational items</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: 'Partner applications', value: data.attention.pendingPartnerRequests, href: '/admin-partners', icon: Building2, tone: 'text-blue-600 bg-blue-50' },
                    { label: 'Pending invoices', value: data.attention.pendingInvoices, href: '/admin-invoices', icon: Clock3, tone: 'text-amber-600 bg-amber-50' },
                    { label: 'Low wallet balance', value: data.attention.lowBalancePartners, href: '/admin-wallet', icon: Wallet, tone: 'text-violet-600 bg-violet-50' },
                    { label: 'Failed pulls this month', value: data.attention.failedPulls, href: '/admin-b2c-reports', icon: AlertCircle, tone: 'text-red-600 bg-red-50' },
                  ].map((item) => (
                    <Link key={item.label} href={item.href} className="flex min-h-16 items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}><item.icon size={17} /></span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-lg font-bold text-slate-900">{item.value}</span>
                      <ArrowRight size={14} className="text-slate-300" />
                    </Link>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-4">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 size={15} /> System data connected</span>
                    <span className="text-xs text-emerald-700">Live</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid gap-5 2xl:grid-cols-3">
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm 2xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent bureau pulls</h2>
                    <p className="mt-1 text-xs text-slate-500">Latest partner activity</p>
                  </div>
                  <Link href="/admin-b2c-reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View reports</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">Partner</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">Score</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 text-right font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recentPulls.length ? data.recentPulls.map((pull) => (
                        <tr key={pull.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5"><p className="text-sm font-semibold text-slate-800">{pull.customerName}</p><p className="mt-0.5 text-xs text-slate-400">{pull.memberRef || 'No reference'}</p></td>
                          <td className="px-4 py-3.5"><p className="text-sm text-slate-700">{pull.partnerName}</p><p className="mt-0.5 text-xs text-slate-400">{pull.partnerCode}</p></td>
                          <td className="px-4 py-3.5 text-sm capitalize text-slate-600">{pull.reportType}</td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{pull.score ?? 'No hit'}</td>
                          <td className="px-4 py-3.5"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${statusStyle(pull.status)}`}>{pull.status}</span></td>
                          <td className="px-5 py-3.5 text-right text-xs text-slate-500">{formatTime(pull.createdAt)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">No bureau activity this month</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-base font-bold text-slate-900">Top partners</h2>
                  <p className="mt-1 text-xs text-slate-500">By bureau pulls this month</p>
                </div>
                <div className="divide-y divide-slate-100 px-5">
                  {data.topPartners.map((partner, index) => (
                    <div key={partner.id} className="flex min-h-16 items-center gap-3 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{partner.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{partner.code || 'Partner'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{partner.pulls}</p>
                        <p className="text-[11px] text-slate-400">pulls</p>
                      </div>
                    </div>
                  ))}
                  {!data.topPartners.length && <p className="py-10 text-center text-sm text-slate-400">No partner activity yet</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
