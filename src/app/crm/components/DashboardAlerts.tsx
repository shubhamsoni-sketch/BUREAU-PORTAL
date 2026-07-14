'use client';

import { useEffect, useMemo, useState } from 'react';
import { crmFetch } from '@/lib/crm/api';

type Lead = { stage?: string; nextFollowUp?: string };
type Application = { status?: string; daysPending?: number; createdAt?: string };
type Store = { leads?: Lead[]; applications?: Application[] };

function daysSince(date?: string) {
  if (!date) return 0;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86400000));
}

export default function DashboardAlerts() {
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

  const alerts = useMemo(() => {
    const leads = store?.leads || [];
    const applications = store?.applications || [];
    const tatBreaches = applications.filter((app) => {
      const status = String(app.status || '');
      return !['disbursed', 'rejected'].includes(status) && daysSince(app.createdAt) >= 7;
    }).length;
    const followUpGaps = leads.filter((lead) => !lead.nextFollowUp || lead.nextFollowUp === '-').length;
    const eligibilityQueue = leads.filter((lead) =>
      ['new', 'contacted', 'eligibility_pending'].includes(String(lead.stage || ''))
    ).length;

    return [
      {
        id: 'alert-1',
        title: 'Lender SLA Breach',
        text: `${tatBreaches} files are pending beyond 7 days`,
        action: 'Open Files',
        tone: 'border-red-200 bg-red-50 text-red-700',
      },
      {
        id: 'alert-2',
        title: 'Follow-up Gap',
        text: `${followUpGaps} leads have no next activity`,
        action: 'Review Leads',
        tone: 'border-amber-200 bg-amber-50 text-amber-700',
      },
      {
        id: 'alert-3',
        title: 'Eligibility Queue',
        text: `${eligibilityQueue} leads ready for bureau checks`,
        action: 'Run Checks',
        tone: 'border-blue-200 bg-blue-50 text-blue-700',
      },
    ];
  }, [store]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border ${alert.tone} px-4 py-3 flex items-center justify-between gap-3 shadow-sm`}
        >
          <div className="min-w-0">
            <p className="text-xs font-900 text-foreground">{alert.title}</p>
            <p className="text-xs font-600 opacity-80 mt-0.5 truncate">{alert.text}</p>
          </div>
          <button className="h-7 shrink-0 rounded-sm bg-white/80 px-2.5 text-[10px] font-900 shadow-sm hover:bg-white transition-colors">
            {alert.action}
          </button>
        </div>
      ))}
    </div>
  );
}
