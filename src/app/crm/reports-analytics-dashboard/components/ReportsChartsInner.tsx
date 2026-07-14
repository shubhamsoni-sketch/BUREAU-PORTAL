'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { crmFetch } from '@/lib/crm/api';

type CrmLead = {
  name?: string;
  product?: string;
  loanAmount?: number;
  source?: string;
  assignedAgent?: string;
  stage?: string;
};

type CrmApplication = {
  customerName?: string;
  product?: string;
  loanAmount?: number;
  status?: string;
  updatedAt?: string;
};

type AnalyticsStore = {
  leads?: CrmLead[];
  applications?: CrmApplication[];
};

const colors = ['var(--success)', 'var(--primary)', 'var(--accent)', 'var(--info)', 'var(--muted-foreground)'];

const labelize = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim() || 'Unknown';

const amountInLakhs = (value: number) => Math.round((value / 100000) * 10) / 10;

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-card-hover text-xs">
      <p className="font-700 text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={`ctt-${i}`} className="text-muted-foreground">
          {p.name}:{' '}
          <span className="font-600 text-foreground">
            {p.name.toLowerCase().includes('amount') ? `₹${p.value}L` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-card-hover text-xs">
      <p className="font-700 text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">
        Share: <span className="font-600 text-foreground">{payload[0].value}%</span>
      </p>
    </div>
  );
};

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-[180px] flex items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
      {text}
    </div>
  );
}

export default function ReportsChartsInner() {
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

  const analytics = useMemo(() => {
    const leads = Array.isArray(store.leads) ? store.leads : [];
    const applications = Array.isArray(store.applications) ? store.applications : [];
    const disbursed = applications.filter((application) => application.status === 'disbursed');

    const weeklyMap = new Map<string, { week: string; amount: number; applications: number }>();
    disbursed.forEach((application) => {
      const date = application.updatedAt ? new Date(application.updatedAt) : new Date();
      const week = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const current = weeklyMap.get(week) || { week, amount: 0, applications: 0 };
      current.amount += amountInLakhs(Number(application.loanAmount || 0));
      current.applications += 1;
      weeklyMap.set(week, current);
    });

    const productMap = new Map<string, { product: string; amount: number; count: number }>();
    const productSource = applications.length ? applications : leads;
    productSource.forEach((item) => {
      const product = labelize(String(item.product || 'unknown'));
      const current = productMap.get(product) || { product, amount: 0, count: 0 };
      current.amount += amountInLakhs(Number(item.loanAmount || 0));
      current.count += 1;
      productMap.set(product, current);
    });

    const sourceCount = new Map<string, number>();
    leads.forEach((lead) => {
      const source = labelize(String(lead.source || 'unknown'));
      sourceCount.set(source, (sourceCount.get(source) || 0) + 1);
    });
    const leadSourceTotal = Math.max(1, leads.length);
    const leadSourceData = Array.from(sourceCount.entries()).map(([name, count], index) => ({
      name,
      value: Math.round((count / leadSourceTotal) * 100),
      color: colors[index % colors.length],
    }));

    const agentMap = new Map<string, { agent: string; leads: number; disbursed: number; rejected: number }>();
    leads.forEach((lead) => {
      const agent = lead.assignedAgent && lead.assignedAgent !== 'Unassigned' ? lead.assignedAgent : 'Unassigned';
      const current = agentMap.get(agent) || { agent, leads: 0, disbursed: 0, rejected: 0 };
      current.leads += 1;
      if (lead.stage === 'disbursed') current.disbursed += 1;
      if (lead.stage === 'rejected') current.rejected += 1;
      agentMap.set(agent, current);
    });

    return {
      weekly: Array.from(weeklyMap.values()).slice(-12),
      products: Array.from(productMap.values()).slice(0, 8),
      sources: leadSourceData.slice(0, 6),
      agents: Array.from(agentMap.values()).sort((a, b) => b.leads - a.leads).slice(0, 8),
    };
  }, [store]);

  return (
    <div className="space-y-5 mb-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-700 text-foreground">Weekly Disbursal Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live disbursed amount in rupee lakhs
              </p>
            </div>
          </div>
          {analytics.weekly.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.weekly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradRep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" name="Amount" stroke="var(--primary)" strokeWidth={2} fill="url(#gradRep)" dot={false} activeDot={{ r: 4, fill: 'var(--primary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="No disbursed files yet" />
          )}
        </div>

        <div className="xl:col-span-2 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-700 text-foreground">Product-wise Volume</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Live amount by loan type</p>
          </div>
          {analytics.products.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.products} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="product" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="No lead or file volume yet" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-700 text-foreground">Lead Source Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Live source share</p>
          </div>
          {analytics.sources.length ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={analytics.sources} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {analytics.sources.map((entry, index) => (
                      <Cell key={`cell-src-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {analytics.sources.map((item, i) => (
                  <div key={`ls-legend-${i}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-xs font-700 text-foreground tabular-nums">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart text="No lead source data yet" />
          )}
        </div>

        <div className="xl:col-span-3 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-700 text-foreground">Agent Productivity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Live leads vs outcomes</p>
          </div>
          {analytics.agents.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.agents} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="agent" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }} />
                <Bar dataKey="leads" name="Leads" fill="var(--secondary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="disbursed" name="Disbursed" fill="var(--success)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="var(--danger)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart text="No agent activity yet" />
          )}
        </div>
      </div>
    </div>
  );
}
