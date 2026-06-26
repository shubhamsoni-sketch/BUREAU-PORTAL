'use client';

import { useEffect, useMemo, useState } from 'react';
import { crmFetch } from '@/lib/crm/api';

type DashboardStore = {
  leads?: { stage?: string; createdAt?: string }[];
  applications?: { status?: string; loanAmount?: number; createdAt?: string }[];
  reports?: { status?: string; score?: number | null; created_at?: string }[];
};

const fallbackMetrics = [
  ['Lead Queue', '286', '41 fresh leads waiting', '+18 today', 'border-blue-200 bg-blue-50 text-blue-700', 'bg-blue-500'],
  ['Eligibility Checked', '124', '93 bureau reports success', '75% hit rate', 'border-emerald-200 bg-emerald-50 text-emerald-700', 'bg-emerald-500'],
  ['Files In Process', '58', '31 sent to lenders', '9 urgent', 'border-violet-200 bg-violet-50 text-violet-700', 'bg-violet-500'],
  ['Login Pending', '7', 'Lender action required', '3 ageing', 'border-amber-200 bg-amber-50 text-amber-700', 'bg-amber-500'],
  ['Disbursed MTD', '₹4.82 Cr', '₹6.00 Cr monthly target', '80% achieved', 'border-green-200 bg-green-50 text-green-700', 'bg-green-500'],
  ['Rejections', '11', '4 can be rerouted', 'Review', 'border-rose-200 bg-rose-50 text-rose-700', 'bg-rose-500'],
];

function currencyShort(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function thisMonth(date?: string) {
  if (!date) return false;
  const parsed = new Date(date);
  const now = new Date();
  return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
}

export default function DashboardMetrics() {
  const [store, setStore] = useState<DashboardStore | null>(null);

  useEffect(() => {
    let active = true;
    crmFetch('/api/crm/eligibility-check', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        if (active && json?.success) setStore(json.data || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!store) return fallbackMetrics;
    const leads = store.leads || [];
    const applications = store.applications || [];
    const reports = store.reports || [];
    const pendingLeads = leads.filter((lead) =>
      ['new', 'contacted', 'eligibility_pending'].includes(String(lead.stage || ''))
    ).length;
    const checked = reports.length;
    const successfulReports = reports.filter((report) => report.score || report.status === 'score_pulled').length;
    const inProcess = applications.filter((app) => !['rejected', 'disbursed'].includes(String(app.status || ''))).length;
    const loginPending = applications.filter((app) => app.status === 'login_pending').length;
    const disbursed = applications.filter((app) => app.status === 'disbursed');
    const disbursedMtd = disbursed
      .filter((app) => thisMonth(app.createdAt))
      .reduce((sum, app) => sum + Number(app.loanAmount || 0), 0);
    const rejected = applications.filter((app) => app.status === 'rejected').length;
    const hitRate = checked ? Math.round((successfulReports / checked) * 100) : 0;

    return [
      ['Lead Queue', String(leads.length), `${pendingLeads} ready for eligibility`, `${pendingLeads} pending`, 'border-blue-200 bg-blue-50 text-blue-700', 'bg-blue-500'],
      ['Eligibility Checked', String(checked), `${successfulReports} bureau reports success`, `${hitRate}% hit rate`, 'border-emerald-200 bg-emerald-50 text-emerald-700', 'bg-emerald-500'],
      ['Files In Process', String(inProcess), `${applications.length} total lender files`, `${inProcess} active`, 'border-violet-200 bg-violet-50 text-violet-700', 'bg-violet-500'],
      ['Login Pending', String(loginPending), 'Lender action required', `${loginPending} ageing`, 'border-amber-200 bg-amber-50 text-amber-700', 'bg-amber-500'],
      ['Disbursed MTD', currencyShort(disbursedMtd), `${disbursed.length} disbursed files`, 'MTD', 'border-green-200 bg-green-50 text-green-700', 'bg-green-500'],
      ['Rejections', String(rejected), 'Can be rerouted to another lender', 'Review', 'border-rose-200 bg-rose-50 text-rose-700', 'bg-rose-500'],
    ];
  }, [store]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 mb-5">
      {metrics.map(([label, value, subtext, change, tone, bar]) => (
        <div key={label} className={`rounded-lg border ${tone} px-4 py-3 shadow-sm`}>
          <div className={`h-1 w-10 rounded-full ${bar} mb-3`} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-800 uppercase tracking-wide opacity-80">{label}</p>
              <p className="text-2xl font-900 text-foreground mt-1 tabular-nums">{value}</p>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-800 shadow-sm">
              {change}
            </span>
          </div>
          <p className="text-xs font-600 mt-2 opacity-80">{subtext}</p>
        </div>
      ))}
    </div>
  );
}
