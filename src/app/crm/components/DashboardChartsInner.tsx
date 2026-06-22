'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const disbursalTrend = [
  { date: '24 May', amount: 18.4, target: 20 },
  { date: '27 May', amount: 22.1, target: 20 },
  { date: '30 May', amount: 15.8, target: 20 },
  { date: '02 Jun', amount: 28.3, target: 22 },
  { date: '05 Jun', amount: 31.2, target: 22 },
  { date: '08 Jun', amount: 19.6, target: 22 },
  { date: '11 Jun', amount: 35.4, target: 25 },
  { date: '14 Jun', amount: 41.8, target: 25 },
  { date: '17 Jun', amount: 29.3, target: 25 },
  { date: '20 Jun', amount: 48.2, target: 28 },
  { date: '22 Jun', amount: 38.7, target: 28 },
];

const lenderData = [
  { lender: 'HDFC Bank', disbursed: 142, approved: 168, id: 'lender-hdfc' },
  { lender: 'ICICI Bank', disbursed: 98, approved: 124, id: 'lender-icici' },
  { lender: 'Bajaj Finserv', disbursed: 87, approved: 103, id: 'lender-bajaj' },
  { lender: 'Axis Bank', disbursed: 63, approved: 79, id: 'lender-axis' },
  { lender: 'Kotak Mahindra', disbursed: 54, approved: 71, id: 'lender-kotak' },
  { lender: 'Tata Capital', disbursed: 48, approved: 58, id: 'lender-tata' },
];

const CustomTooltipDisbursal = ({
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
        <p key={`tp-${i}`} className="text-muted-foreground">
          {p.name}: <span className="font-600 text-foreground">₹{p.value}L</span>
        </p>
      ))}
    </div>
  );
};

const CustomTooltipLender = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; fill: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-card-hover text-xs">
      <p className="font-700 text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={`ltp-${i}`} className="text-muted-foreground">
          {p.name}: <span className="font-600 text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardChartsInner() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
      {/* Disbursal trend — 3 cols */}
      <div className="xl:col-span-3 bg-card rounded-lg border border-border p-5 shadow-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-700 text-foreground">Disbursal Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last 30 days — actual vs target (₹ Lakhs)
            </p>
          </div>
          <span className="text-xs text-success font-600 bg-success-bg px-2 py-0.5 rounded-full border border-success/20">
            +12.4% MTD
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={disbursalTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradDisbursal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.08} />
                <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltipDisbursal />} />
            <Area
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#gradTarget)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="Disbursed"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#gradDisbursal)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--primary)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lender disbursal — 2 cols */}
      <div className="xl:col-span-2 bg-card rounded-lg border border-border p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-sm font-700 text-foreground">Lender-wise Disbursals</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applications approved vs disbursed (MTD)
          </p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={lenderData}
            layout="vertical"
            margin={{ top: 0, right: 4, bottom: 0, left: -10 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="lender"
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              width={68}
            />
            <Tooltip content={<CustomTooltipLender />} />
            <Bar dataKey="approved" name="Approved" fill="var(--secondary)" radius={[0, 3, 3, 0]} />
            <Bar dataKey="disbursed" name="Disbursed" fill="var(--primary)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
