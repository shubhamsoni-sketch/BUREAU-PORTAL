'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

// Backend integration point: replace with GET /api/partner/score-distribution
const data = [
  { band: '300–499', count: 8, label: 'Poor', color: '#ef4444' },
  { band: '500–599', count: 14, label: 'Fair', color: '#f97316' },
  { band: '600–699', count: 31, label: 'Good', color: '#eab308' },
  { band: '700–749', count: 38, label: 'Very Good', color: '#22c55e' },
  { band: '750–799', count: 19, label: 'Excellent', color: '#06b6d4' },
  { band: '800+', count: 8, label: 'Exceptional', color: '#6366f1' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = data.find((d) => d.band === label);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mb-1">{item?.label}</p>
      <p className="font-bold" style={{ color: item?.color }}>{payload[0]?.value} reports</p>
    </div>
  );
};

export default function CreditScoreDistChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={16} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-800">Credit Score Distribution</h3>
      </div>
      <p className="text-xs text-slate-500 mb-5">This month's 118 reports by score band</p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="band"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-score-${index}`} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {data.map((d) => (
          <div key={`legend-${d.band}`} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-slate-500 truncate">{d.label}</span>
            <span className="text-[10px] font-semibold text-slate-700 ml-auto font-mono">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}