'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface ReportRow {
  id: string;
  customerName: string;
  reportType: string;
  score: number | null;
  date: string;
}

function scoreColor(score: number | null) {
  if (!score) return 'text-slate-400';
  if (score >= 750) return 'text-emerald-600';
  if (score >= 700) return 'text-lime-600';
  if (score >= 600) return 'text-amber-600';
  return 'text-red-500';
}

export default function MiniRecentReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('bureau_pulls')
          .select('id, customer_name, bureau, credit_score, created_at, report_type')
          .eq('partner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (data) {
          setReports(
            data.map((r) => ({
              id: r.id,
              customerName: r.customer_name ?? '—',
              reportType: r.report_type ?? r.bureau ?? 'Bureau',
              score: r.credit_score ?? null,
              date: new Date(r.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
              }),
            }))
          );
        }
      } catch (err) {
        console.error('[MiniRecentReports] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user?.id]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Recent Reports</h3>
        <p className="text-xs text-slate-500 mt-0.5">Last 5 bureau pulls</p>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-slate-400">
          No reports pulled yet.
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500">Customer</th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Type</th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Score</th>
              <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                      {r.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <span className="font-medium text-slate-800 truncate max-w-[110px]">{r.customerName}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium text-[11px]">
                    {r.reportType}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`font-bold tabular-nums ${scoreColor(r.score)}`}>
                    {r.score ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
