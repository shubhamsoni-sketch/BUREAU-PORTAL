'use client';

import { useEffect, useMemo, useState } from 'react';
import { crmFetch } from '@/lib/crm/api';

type Lead = {
  stage?: string;
  nextFollowUp?: string;
  createdAt?: string;
};

type Application = {
  status?: string;
  loanAmount?: number;
  createdAt?: string;
};

type Report = {
  status?: string;
  score?: number | null;
  createdAt?: string;
  created_at?: string;
};

type Store = {
  leads?: Lead[];
  applications?: Application[];
  reports?: Report[];
};

function today(date?: string) {
  if (!date) return false;
  const parsed = new Date(date);
  const now = new Date();
  return (
    parsed.getDate() === now.getDate() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getFullYear() === now.getFullYear()
  );
}

function thisMonth(date?: string) {
  if (!date) return false;
  const parsed = new Date(date);
  const now = new Date();
  return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
}

function shortINR(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return value ? `₹${value.toLocaleString('en-IN')}` : '₹0';
}

function dayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function DashboardHero() {
  const [store, setStore] = useState<Store>({ leads: [], applications: [], reports: [] });
  const [userName, setUserName] = useState('Team');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('crm_current_user');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.name) setUserName(String(parsed.name).split(' ')[0]);
    } catch {}

    let active = true;
    crmFetch('/api/crm/eligibility-check', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        if (active && json?.success) {
          setStore({
            leads: Array.isArray(json.data?.leads) ? json.data.leads : [],
            applications: Array.isArray(json.data?.applications) ? json.data.applications : [],
            reports: Array.isArray(json.data?.reports) ? json.data.reports : [],
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const leads = store.leads || [];
    const applications = store.applications || [];
    const reports = store.reports || [];
    const filesToday = applications.filter((app) => today(app.createdAt)).length;
    const reportsToday = reports.filter((report) => today(report.createdAt || report.created_at)).length;
    const successfulReports = reports.filter((report) => report.score || report.status === 'score_pulled').length;
    const lenderLogins = applications.filter((app) =>
      ['login_pending', 'case_sent_to_lender', 'under_review', 'credit_check'].includes(
        String(app.status || '')
      )
    ).length;
    const disbursedMtd = applications
      .filter((app) => app.status === 'disbursed' && thisMonth(app.createdAt))
      .reduce((sum, app) => sum + Number(app.loanAmount || 0), 0);
    const pendingLeads = leads.filter((lead) =>
      ['new', 'contacted', 'eligibility_pending'].includes(String(lead.stage || ''))
    ).length;
    const docsPending = applications.filter((app) =>
      ['login_pending', 'case_sent_to_lender', 'submitted', 'under_review'].includes(
        String(app.status || '')
      )
    ).length;
    const tatBreaches = applications.filter((app) => {
      const created = app.createdAt ? new Date(app.createdAt).getTime() : 0;
      const days = created ? Math.floor((Date.now() - created) / 86400000) : 0;
      return !['disbursed', 'rejected'].includes(String(app.status || '')) && days >= 7;
    }).length;
    const followUpMissing = leads.filter((lead) => !lead.nextFollowUp || lead.nextFollowUp === '-').length;

    return {
      cards: [
        ['Files Today', String(filesToday), `${applications.length} total files`, 'bg-blue-500'],
        ['Eligibility Pulls', String(reports.length), `${successfulReports} successful`, 'bg-emerald-500'],
        ['Lender Logins', String(lenderLogins), `${docsPending} action pending`, 'bg-violet-500'],
        ['Disbursal MTD', shortINR(disbursedMtd), 'Live from file status', 'bg-orange-500'],
      ],
      priorities: [
        ['Overdue Callbacks', `${followUpMissing} leads`, 'text-blue-600 bg-blue-50'],
        ['Docs Pending', `${docsPending} files`, 'text-amber-600 bg-amber-50'],
        ['Lender TAT Breach', `${tatBreaches} files`, 'text-red-600 bg-red-50'],
        ['Fresh Eligibility Queue', `${pendingLeads} leads`, 'text-emerald-600 bg-emerald-50'],
      ],
      urgent: followUpMissing + docsPending + tatBreaches,
    };
  }, [store]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden mb-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px]">
        <div className="p-5 lg:p-6 bg-[linear-gradient(135deg,rgba(37,99,235,0.10),rgba(16,185,129,0.08)_45%,rgba(245,158,11,0.10))] border-b xl:border-b-0 xl:border-r border-border">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-800 uppercase tracking-wide text-primary mb-3">
            CreditTrust CRM Command Center
          </div>
          <h1 className="text-2xl lg:text-3xl font-800 text-foreground">
            Good Morning, {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Live CRM numbers from leads, eligibility reports, and lender files.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {stats.cards.map(([label, value, subtext, color]) => (
              <div key={label} className="rounded-lg border border-border bg-card/85 px-4 py-3 shadow-sm">
                <div className={`w-7 h-1 rounded-full ${color} mb-3`} />
                <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="text-xl font-800 text-foreground mt-0.5 tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{subtext}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-800 text-foreground">Today&apos;s Priorities</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{dayLabel()}</p>
            </div>
            <span className="rounded-full bg-danger/10 px-2 py-1 text-[10px] font-800 text-danger">
              {stats.urgent} urgent
            </span>
          </div>
          <div className="space-y-2">
            {stats.priorities.map(([label, value, tone]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-sm border border-border bg-muted/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-800 text-foreground truncate">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{value}</p>
                </div>
                <span className={`h-7 w-7 rounded-sm flex items-center justify-center text-xs font-900 ${tone}`}>
                  &gt;
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
