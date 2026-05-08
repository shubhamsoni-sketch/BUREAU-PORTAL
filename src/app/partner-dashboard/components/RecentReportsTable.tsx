'use client';

import React, { useState } from 'react';
import { Eye, Download, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Backend integration point: replace with GET /api/partner/recent-reports
const RECENT_REPORTS = [
  {
    id: 'rpt-001',
    customerName: 'Amit Sharma',
    pan: 'ABCPS1234D',
    aadhaarMasked: 'XXXX-XXXX-7823',
    creditScore: 742,
    scoreLabel: 'Very Good',
    scoreBg: 'bg-emerald-50',
    scoreText: 'text-emerald-700',
    reportType: 'Full CIBIL',
    creditsUsed: 35,
    status: 'Success',
    pulledAt: '01 Apr 2026, 07:12',
    pdfReady: true,
  },
  {
    id: 'rpt-002',
    customerName: 'Neha Patel',
    pan: 'DFGPN5678K',
    aadhaarMasked: 'XXXX-XXXX-4491',
    creditScore: 618,
    scoreLabel: 'Good',
    scoreBg: 'bg-yellow-50',
    scoreText: 'text-yellow-700',
    reportType: 'Full CIBIL',
    creditsUsed: 35,
    status: 'Success',
    pulledAt: '01 Apr 2026, 06:45',
    pdfReady: true,
  },
  {
    id: 'rpt-003',
    customerName: 'Vikas Malhotra',
    pan: 'HJKVM9012X',
    aadhaarMasked: 'XXXX-XXXX-2267',
    creditScore: 0,
    scoreLabel: 'Failed',
    scoreBg: 'bg-red-50',
    scoreText: 'text-red-700',
    reportType: 'Full CIBIL',
    creditsUsed: 0,
    status: 'Failed',
    pulledAt: '31 Mar 2026, 18:30',
    pdfReady: false,
  },
  {
    id: 'rpt-004',
    customerName: 'Sunita Rao',
    pan: 'LMNSR3456P',
    aadhaarMasked: 'XXXX-XXXX-9034',
    creditScore: 789,
    scoreLabel: 'Excellent',
    scoreBg: 'bg-cyan-50',
    scoreText: 'text-cyan-700',
    reportType: 'Full CIBIL',
    creditsUsed: 35,
    status: 'Success',
    pulledAt: '31 Mar 2026, 15:22',
    pdfReady: true,
  },
  {
    id: 'rpt-005',
    customerName: 'Deepak Joshi',
    pan: 'PQRDJ7890W',
    aadhaarMasked: 'XXXX-XXXX-1156',
    creditScore: 541,
    scoreLabel: 'Fair',
    scoreBg: 'bg-orange-50',
    scoreText: 'text-orange-700',
    reportType: 'Full CIBIL',
    creditsUsed: 35,
    status: 'Success',
    pulledAt: '31 Mar 2026, 11:05',
    pdfReady: true,
  },
  {
    id: 'rpt-006',
    customerName: 'Kavita Singh',
    pan: 'STUKS4321Q',
    aadhaarMasked: 'XXXX-XXXX-6678',
    creditScore: 812,
    scoreLabel: 'Exceptional',
    scoreBg: 'bg-indigo-50',
    scoreText: 'text-indigo-700',
    reportType: 'Full CIBIL',
    creditsUsed: 35,
    status: 'Success',
    pulledAt: '30 Mar 2026, 16:48',
    pdfReady: true,
  },
  {
    id: 'rpt-007',
    customerName: 'Rajan Tiwari',
    pan: 'VWXRT6543M',
    aadhaarMasked: 'XXXX-XXXX-3312',
    creditScore: 0,
    scoreLabel: 'OTP Timeout',
    scoreBg: 'bg-amber-50',
    scoreText: 'text-amber-700',
    reportType: 'Full CIBIL',
    creditsUsed: 0,
    status: 'OTP Timeout',
    pulledAt: '30 Mar 2026, 14:10',
    pdfReady: false,
  },
  {
    id: 'rpt-008',
    customerName: 'Meena Desai',
    pan: 'YZCMD8765T',
    aadhaarMasked: 'XXXX-XXXX-8843',
    creditScore: 663,
    scoreLabel: 'Good',
    scoreBg: 'bg-yellow-50',
    scoreText: 'text-yellow-700',
    reportType: 'Full CIBIL',
    creditsUsed: 35,
    status: 'Success',
    pulledAt: '30 Mar 2026, 09:37',
    pdfReady: true,
  },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  Success: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  Failed: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
  'OTP Timeout': { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle },
};

function ScoreMeter({ score }: { score: number }) {
  if (score === 0) return <span className="text-xs text-slate-400 font-mono">—</span>;
  const pct = Math.max(0, Math.min(100, ((score - 300) / (900 - 300)) * 100));
  const color = score >= 750 ? '#22c55e' : score >= 700 ? '#84cc16' : score >= 600 ? '#eab308' : score >= 500 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold font-mono tabular-nums text-slate-900">{score}</span>
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function RecentReportsTable() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Reports refreshed');
    }, 1200);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Recent Bureau Pulls</h3>
          <p className="text-xs text-slate-500 mt-0.5">Last 8 report requests — click any row to view full analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            View All Reports
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PAN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Aadhaar</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Credit Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Score Band</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Credits Used</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Pulled At</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {RECENT_REPORTS.map((r) => {
              const sc = STATUS_CONFIG[r.status];
              const StatusIcon = sc.icon;
              return (
                <tr key={r.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer">
                  {/* Customer */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {r.customerName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{r.customerName}</span>
                    </div>
                  </td>

                  {/* PAN */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-600 tracking-wider">{r.pan}</span>
                  </td>

                  {/* Aadhaar (masked) */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-500">{r.aadhaarMasked}</span>
                  </td>

                  {/* Credit Score */}
                  <td className="px-4 py-3">
                    <ScoreMeter score={r.creditScore} />
                  </td>

                  {/* Score Band */}
                  <td className="px-4 py-3">
                    {r.creditScore > 0 ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.scoreBg} ${r.scoreText}`}>
                        {r.scoreLabel}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Credits Used */}
                  <td className="px-4 py-3">
                    {r.creditsUsed > 0 ? (
                      <span className="text-sm font-semibold font-mono text-slate-700 tabular-nums">₹{r.creditsUsed}</span>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">₹0</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
                      <StatusIcon size={11} />
                      {r.status}
                    </span>
                  </td>

                  {/* Pulled At */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500">{r.pulledAt}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="View full Bureau analysis"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <Eye size={14} />
                      </button>
                      {r.pdfReady && (
                        <button
                          title="Download PDF report"
                          onClick={() => toast.success(`Downloading report for ${r.customerName}`)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      {r.status !== 'Success' && (
                        <button
                          title="Retry Bureau pull"
                          onClick={() => toast.info(`Retrying pull for ${r.customerName}`)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Last updated: 01 Apr 2026, 07:27 IST
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            6 Successful
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            1 Failed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            1 Timeout
          </span>
        </div>
      </div>
    </div>
  );
}