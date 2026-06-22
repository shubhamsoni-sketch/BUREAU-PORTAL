'use client';
import React from 'react';
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

const disbursalTrend90 = [
  { week: 'W1 Apr', amount: 38.2, applications: 12 },
  { week: 'W2 Apr', amount: 52.6, applications: 16 },
  { week: 'W3 Apr', amount: 44.1, applications: 14 },
  { week: 'W4 Apr', amount: 61.8, applications: 19 },
  { week: 'W1 May', amount: 48.3, applications: 15 },
  { week: 'W2 May', amount: 72.4, applications: 22 },
  { week: 'W3 May', amount: 58.9, applications: 18 },
  { week: 'W4 May', amount: 84.2, applications: 26 },
  { week: 'W1 Jun', amount: 69.5, applications: 21 },
  { week: 'W2 Jun', amount: 91.3, applications: 28 },
  { week: 'W3 Jun', amount: 78.6, applications: 24 },
  { week: 'W4 Jun', amount: 48.2, applications: 15 },
];

const productMix = [
  { product: 'Home Loan', amount: 682, count: 58 },
  { product: 'Personal Loan', amount: 312, count: 48 },
  { product: 'Business Loan', amount: 428, count: 24 },
  { product: 'LAP', amount: 284, count: 12 },
  { product: 'Car Loan', amount: 98, count: 18 },
];

const leadSourceData = [
  { name: 'Reference', value: 38, color: 'var(--success)' },
  { name: 'Web / Online', value: 28, color: 'var(--primary)' },
  { name: 'Campaign', value: 18, color: 'var(--accent)' },
  { name: 'Walk-in', value: 10, color: 'var(--info)' },
  { name: 'Social Media', value: 6, color: 'var(--muted-foreground)' },
];

const agentProductivity = [
  { agent: 'Priya S.', leads: 42, disbursed: 18, rejected: 5 },
  { agent: 'Anil M.', leads: 38, disbursed: 14, rejected: 7 },
  { agent: 'Sunita R.', leads: 31, disbursed: 11, rejected: 4 },
  { agent: 'Vikram J.', leads: 28, disbursed: 9, rejected: 6 },
  { agent: 'Kavitha N.', leads: 24, disbursed: 7, rejected: 3 },
];

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
            {typeof p.value === 'number' && p.name === 'amount' ? `₹${p.value}L` : p.value}
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

export default function ReportsChartsInner() {
  return (
    <div className="space-y-5 mb-6">
      {/* Row 1: Disbursal trend + Product mix */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-700 text-foreground">Weekly Disbursal Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last 90 days — disbursed amount (₹ Lakhs)
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={disbursalTrend90} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradRep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                name="amount"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#gradRep)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--primary)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-2 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-700 text-foreground">Product-wise Volume</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disbursed amount by loan type (₹ Lakhs)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productMix} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="product"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Lead source pie + Agent productivity bar */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-700 text-foreground">Lead Source Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Where leads are coming from (% share)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-src-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {leadSourceData.map((item, i) => (
                <div key={`ls-legend-${i}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-700 text-foreground tabular-nums">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 bg-card rounded-lg border border-border p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-700 text-foreground">Agent Productivity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Leads assigned vs disbursed vs rejected (MTD)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={agentProductivity} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="agent"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }} />
              <Bar dataKey="leads" name="Leads" fill="var(--secondary)" radius={[3, 3, 0, 0]} />
              <Bar
                dataKey="disbursed"
                name="Disbursed"
                fill="var(--success)"
                radius={[3, 3, 0, 0]}
              />
              <Bar dataKey="rejected" name="Rejected" fill="var(--danger)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
