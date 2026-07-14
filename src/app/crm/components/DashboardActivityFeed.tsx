'use client';

import { useEffect, useMemo, useState } from 'react';
import { crmFetch } from '@/lib/crm/api';

type Lead = {
  id?: string;
  name?: string;
  product?: string;
  loanAmount?: number;
  createdAt?: string;
};

type Application = {
  id?: string;
  customerName?: string;
  lenderName?: string;
  status?: string;
  loanAmount?: number;
  createdAt?: string;
};

type Store = {
  leads?: Lead[];
  applications?: Application[];
};

function timeAgo(date?: string) {
  if (!date) return 'recently';
  const parsed = new Date(date).getTime();
  if (!Number.isFinite(parsed)) return 'recently';
  const minutes = Math.max(1, Math.floor((Date.now() - parsed) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

function amount(value?: number) {
  const n = Number(value || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return n ? `₹${n.toLocaleString('en-IN')}` : 'amount pending';
}

export default function DashboardActivityFeed() {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    let active = true;
    crmFetch('/api/crm/eligibility-check', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        if (active && json?.success) setStore(json.data || null);
      })
      .catch(() => {
        if (active) setStore({ leads: [], applications: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const activities = useMemo(() => {
    const leads = (store?.leads || []).slice(0, 5).map((lead) => ({
      id: `lead-${lead.id}`,
      text: `Lead captured - ${lead.name || 'Customer'} (${String(lead.product || 'loan').replace(/_/g, ' ')}) ${amount(lead.loanAmount)}`,
      time: timeAgo(lead.createdAt),
      color: 'bg-info',
      sortAt: new Date(lead.createdAt || 0).getTime(),
    }));
    const applications = (store?.applications || []).slice(0, 5).map((app) => ({
      id: `app-${app.id}`,
      text: `${String(app.status || 'file').replace(/_/g, ' ')} - ${app.customerName || 'Customer'} via ${app.lenderName || 'lender'} ${amount(app.loanAmount)}`,
      time: timeAgo(app.createdAt),
      color:
        app.status === 'disbursed'
          ? 'bg-success'
          : app.status === 'rejected'
            ? 'bg-danger'
            : 'bg-primary',
      sortAt: new Date(app.createdAt || 0).getTime(),
    }));
    return [...leads, ...applications].sort((a, b) => b.sortAt - a.sortAt).slice(0, 8);
  }, [store]);

  return (
    <div className="bg-card rounded-lg border border-border shadow-card h-full overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(37,99,235,0.06))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-800 text-foreground">Live Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Updates across agents and files</p>
          </div>
          <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-800 text-success">
            Live
          </span>
        </div>
      </div>
      <div className="divide-y divide-border overflow-y-auto scrollbar-thin" style={{ maxHeight: '340px' }}>
        {activities.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No CRM activity yet
          </div>
        ) : activities.map((act) => (
          <div
            key={act.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
          >
            <div className={['w-2 h-2 rounded-full mt-1.5 shrink-0', act.color].join(' ')} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground leading-relaxed capitalize">{act.text}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
