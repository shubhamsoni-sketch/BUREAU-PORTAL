'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// Backend integration point: replace with GET /api/partner/report-volume?days=14
const data = [
  { date: '19 Mar', reports: 4, credits: 140 },
  { date: '20 Mar', reports: 7, credits: 245 },
  { date: '21 Mar', reports: 3, credits: 105 },
  { date: '22 Mar', reports: 9, credits: 315 },
  { date: '23 Mar', reports: 6, credits: 210 },
  { date: '24 Mar', reports: 11, credits: 385 },
  { date: '25 Mar', reports: 5, credits: 175 },
  { date: '26 Mar', reports: 8, credits: 280 },
  { date: '27 Mar', reports: 12, credits: 420 },
  { date: '28 Mar', reports: 7, credits: 245 },
  { date: '29 Mar', reports: 10, credits: 350 },
  { date: '30 Mar', reports: 6, credits: 210 },
  { date: '31 Mar', reports: 9, credits: 315 },
  { date: '01 Apr', reports: 8, credits: 280 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800 mb-2">{label}</p>
      <div className="flex items-center gap-2 text-blue-600">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-slate-600 text-xs">Reports:</span>
        <span className="font-bold">{payload[0]?.value}</span>
      </div>
      <div className="flex items-center gap-2 text-indigo-600 mt-1">
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="text-slate-600 text-xs">Credits used:</span>
        <span className="font-bold">₹{payload[1]?.value}</span>
      </div>
    </div>
  );
};

export default function ReportVolumeChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Report Pull Volume</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Last 14 days — daily pulls and credit usage</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] text-slate-500">Reports</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-[11px] text-slate-500">Credits (₹)</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradReports" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCredits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="reports"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#gradReports)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
          <Area
            type="monotone"
            dataKey="credits"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradCredits)"
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
