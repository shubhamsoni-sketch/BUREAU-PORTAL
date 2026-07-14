'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/crm/components/ui/MetricCard';
import { crmFetch } from '@/lib/crm/api';

type CrmLead = {
  stage?: string;
};

type CrmApplication = {
  status?: string;
  loanAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type AnalyticsStore = {
  leads?: CrmLead[];
  applications?: CrmApplication[];
};

const formatAmount = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

const daysBetween = (start?: string, end?: string) => {
  const from = start ? Date.parse(start) : NaN;
  const to = end ? Date.parse(end) : NaN;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
  return Math.max(0, Math.round((to - from) / 86400000));
};

export default function ReportsMetrics() {
  const [store, setStore] = useState<AnalyticsStore>({});

  useEffect(() => {
    let cancelled = false;
    crmFetch('/api/crm/eligibility-check', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        if (!cancelled && json?.success) setStore(json.data || {});
      })
      .catch(() => {
        if (!cancelled) setStore({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const leads = Array.isArray(store.leads) ? store.leads : [];
  const applications = Array.isArray(store.applications) ? store.applications : [];
  const disbursed = applications.filter((application) => application.status === 'disbursed');
  const totalDisbursed = disbursed.reduce(
    (sum, application) => sum + Number(application.loanAmount || 0),
    0
  );
  const conversion = leads.length ? Math.round((disbursed.length / leads.length) * 1000) / 10 : 0;
  const tatValues = disbursed
    .map((application) => daysBetween(application.createdAt, application.updatedAt))
    .filter((value): value is number => value !== null);
  const avgTat = tatValues.length
    ? Math.round((tatValues.reduce((sum, value) => sum + value, 0) / tatValues.length) * 10) / 10
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <MetricCard
        label="Total Disbursed"
        value={formatAmount(totalDisbursed)}
        subtext={`Across ${disbursed.length} applications`}
        trend={{ value: applications.length ? `${applications.length} total files` : 'No files yet', positive: true }}
        variant="success"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
      <MetricCard
        label="Overall Conversion Rate"
        value={`${conversion}%`}
        subtext={`${leads.length} leads -> ${disbursed.length} disbursals`}
        trend={{ value: leads.length ? 'Live CRM data' : 'No leads yet', positive: true }}
        variant="info"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        }
      />
      <MetricCard
        label="Avg Disbursal TAT"
        value={avgTat ? `${avgTat} days` : '-'}
        subtext="From file creation to disbursal"
        trend={{ value: tatValues.length ? `${tatValues.length} completed files` : 'Awaiting disbursals', positive: true }}
        variant="default"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        }
      />
    </div>
  );
}
