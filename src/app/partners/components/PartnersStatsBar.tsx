import React from 'react';
import { Users, UserCheck, Wallet, AlertTriangle, TrendingUp } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const stats = [
  {
    id: 'stat-total',
    label: 'Total Partners',
    value: '147',
    sub: '+3 this week',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    trend: 'up',
  },
  {
    id: 'stat-active',
    label: 'Active Partners',
    value: '118',
    sub: '80.3% of total',
    icon: UserCheck,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    trend: 'up',
  },
  {
    id: 'stat-pending',
    label: 'Pending Activation',
    value: '4',
    sub: 'Awaiting KYC/agreement',
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    trend: 'warn',
  },
  {
    id: 'stat-wallets',
    label: 'Low Wallet Alerts',
    value: '9',
    sub: 'Balance under ₹500',
    icon: Wallet,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    trend: 'down',
  },
  {
    id: 'stat-reports',
    label: 'Reports Today',
    value: '284',
    sub: '↑ 12% vs yesterday',
    icon: TrendingUp,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    trend: 'up',
  },
];

export default function PartnersStatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {stats?.map((s) => {
        const Icon = s?.icon;
        return (
          <div key={s?.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s?.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={17} className={s?.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 truncate">{s?.label}</p>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums leading-tight">{s?.value}</p>
              <p className={`text-[10px] font-medium truncate ${
                s?.trend === 'warn' ? 'text-amber-600' :
                s?.trend === 'down'? 'text-red-500' : 'text-emerald-600'
              }`}>{s?.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}