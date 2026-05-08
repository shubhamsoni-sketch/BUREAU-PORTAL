'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

type StatCard = {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string; positive?: boolean };
  alert?: boolean;
  alertMessage?: string;
};

const stats: StatCard[] = [
  {
    id: 'stat-wallet-balance',
    label: 'Wallet Balance',
    value: '₹12,450',
    subValue: 'Available credit',
    icon: 'WalletIcon',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    trend: { direction: 'neutral', label: 'Last topped up 3 days ago', positive: true },
    alert: false,
  },
  {
    id: 'stat-reports-month',
    label: 'Reports This Month',
    value: '47',
    subValue: 'Apr 2026',
    icon: 'DocumentMagnifyingGlassIcon',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    trend: { direction: 'up', label: '+12 from last month', positive: true },
  },
  {
    id: 'stat-reports-today',
    label: 'Reports Today',
    value: '6',
    subValue: '01 Apr 2026',
    icon: 'CalendarDaysIcon',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    trend: { direction: 'neutral', label: 'Last pull: 2 hrs ago' },
  },
  {
    id: 'stat-reports-total',
    label: 'Total Reports Pulled',
    value: '384',
    subValue: 'Since Jan 2024',
    icon: 'ChartBarSquareIcon',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    trend: { direction: 'up', label: 'Lifetime total', positive: true },
  },
];

export default function PartnerStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`stat-card relative ${stat.alert ? 'border-amber-300 bg-amber-50/40' : ''}`}
        >
          {stat.alert && (
            <div className="absolute top-3 right-3">
              <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-500" />
            </div>
          )}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
              <Icon name={stat.icon as Parameters<typeof Icon>[0]['name']} size={20} className={stat.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{stat.label}</p>
              {stat.subValue && (
                <p className="text-xs text-muted-foreground">{stat.subValue}</p>
              )}
            </div>
          </div>

          <p className="text-3xl font-bold text-foreground font-tabular leading-none mb-2">
            {stat.value}
          </p>

          {stat.trend && (
            <div className="flex items-center gap-1">
              {stat.trend.direction === 'up' && (
                <Icon name="ArrowTrendingUpIcon" size={12} className={stat.trend.positive ? 'text-emerald-500' : 'text-red-500'} />
              )}
              {stat.trend.direction === 'down' && (
                <Icon name="ArrowTrendingDownIcon" size={12} className={stat.trend.positive ? 'text-emerald-500' : 'text-red-500'} />
              )}
              <span className="text-xs text-muted-foreground">{stat.trend.label}</span>
            </div>
          )}

          {stat.alert && stat.alertMessage && (
            <p className="text-xs text-amber-700 font-medium mt-1">{stat.alertMessage}</p>
          )}
        </div>
      ))}
    </div>
  );
}