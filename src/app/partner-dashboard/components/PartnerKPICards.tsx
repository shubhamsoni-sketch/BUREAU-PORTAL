import React from 'react';
import { FileText, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const kpis = [
  {
    id: 'kpi-today',
    label: 'Reports Today',
    value: '8',
    sub: '↑ 2 vs yesterday',
    icon: FileText,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    subColor: 'text-emerald-600',
  },
  {
    id: 'kpi-month',
    label: 'Reports This Month',
    value: '118',
    sub: '↑ 14% vs last month',
    icon: TrendingUp,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    subColor: 'text-emerald-600',
  },
  {
    id: 'kpi-success',
    label: 'Pull Success Rate',
    value: '96.6%',
    sub: '4 failed this month',
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    subColor: 'text-slate-500',
  },
  {
    id: 'kpi-pending',
    label: 'Avg. Score (Month)',
    value: '674',
    sub: 'Across 118 reports',
    icon: Clock,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    subColor: 'text-slate-500',
  },
];

export default function PartnerKPICards() {
  return (
    <>
      {kpis?.map((k) => {
        const Icon = k?.icon;
        return (
          <div key={k?.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k?.label}</p>
              <div className={`w-8 h-8 rounded-lg ${k?.iconBg} flex items-center justify-center`}>
                <Icon size={15} className={k?.iconColor} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{k?.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${k?.subColor}`}>{k?.sub}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}