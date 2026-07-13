'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';
import { usePartnerDashboardData } from './PartnerDashboardDataContext';

type StatCard = {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string; positive?: boolean };
};

export default function PartnerStatCards() {
  const { user } = useAuth();
  const { data, loading } = usePartnerDashboardData();
  const walletBalance = data?.balance ?? null;
  const reportsPulled = data?.reportsPulled ?? null;
  const reportsPulledToday = data?.reportsPulledToday ?? null;

  const stats: StatCard[] = [
    {
      id: 'stat-wallet-balance',
      label: 'Wallet Balance',
      value: loading || walletBalance === null ? '—' : `₹${walletBalance.toLocaleString('en-IN')}`,
      subValue: 'Available credit',
      icon: 'WalletIcon',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: { direction: 'neutral', label: 'Contact admin to recharge', positive: true },
    },
    {
      id: 'stat-partner-code',
      label: 'Partner Code',
      value: user?.partnerCode ?? '—',
      subValue: 'Your partner code',
      icon: 'IdentificationIcon',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: { direction: 'neutral', label: 'Use this for all transactions' },
    },
    {
      id: 'stat-reports-today',
      label: 'Reports Pulled Today',
      value: loading || reportsPulledToday === null ? '—' : reportsPulledToday.toString(),
      subValue: 'Today\'s activity',
      icon: 'ClipboardDocumentCheckIcon',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: { direction: 'up', label: 'Since midnight', positive: true },
    },
    {
      id: 'stat-reports-total',
      label: 'Total Reports Pulled',
      value: loading || reportsPulled === null ? '—' : reportsPulled.toString(),
      subValue: 'Lifetime total',
      icon: 'DocumentMagnifyingGlassIcon',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: { direction: 'up', label: 'All time', positive: true },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.id} className="stat-card relative">
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

          {loading && stat.id !== 'stat-partner-code' ? (
            <div className="h-8 w-24 bg-slate-100 rounded animate-pulse mb-2" />
          ) : (
            <p className="text-3xl font-bold text-foreground font-tabular leading-none mb-2">
              {stat.value}
            </p>
          )}

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
        </div>
      ))}
    </div>
  );
}
