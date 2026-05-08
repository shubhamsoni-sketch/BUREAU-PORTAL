'use client';

import React, { useEffect, useState } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart,  } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface DayData {
  day: string;
  pulls: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <div className="flex items-center gap-1.5 text-blue-600">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-slate-500">Pulls:</span>
        <span className="font-bold">{payload[0]?.value ?? 0}</span>
      </div>
    </div>
  );
};

export default function BureauPullsChart() {
  const { user } = useAuth();
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // Build last 7 days range
        const days: DayData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          days.push({ day: label, pulls: 0 });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data: pulls } = await supabase
          .from('bureau_pulls')
          .select('created_at')
          .eq('partner_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString());

        if (pulls) {
          pulls.forEach((p) => {
            const d = new Date(p.created_at);
            const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const idx = days.findIndex((x) => x.day === label);
            if (idx !== -1) days[idx].pulls += 1;
          });
        }

        setData(days);
      } catch (err) {
        console.error('[BureauPullsChart] fetch error:', err);
        // Fallback: empty 7 days
        const days: DayData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push({
            day: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            pulls: 0,
          });
        }
        setData(days);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const totalPulls = data.reduce((s, d) => s + d.pulls, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Bureau Pulls — Last 7 Days</h3>
          <p className="text-xs text-slate-500 mt-0.5">Daily pull activity</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600 tabular-nums">{loading ? '—' : totalPulls}</p>
          <p className="text-[11px] text-slate-400">total this week</p>
        </div>
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="pulls" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Line
              type="monotone"
              dataKey="pulls"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
