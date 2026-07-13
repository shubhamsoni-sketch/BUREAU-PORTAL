'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { prefetchPartnerInvoices } from '@/context/InvoiceContext';
import { prefetchPartnerReports } from '@/hooks/usePartnerReportsCache';
import { usePartnerWalletData } from '@/hooks/usePartnerWalletData';

export interface DashboardCommercials {
  pricing_plan?: string | null;
  subscription_type?: string | null;
  consumer_credit_rate?: number | string | null;
  commercial_credit_rate?: number | string | null;
  bundled_credits?: number | null;
  credit_limit?: number | null;
  credit_rate?: number | string | null;
}

export interface DashboardPullDate {
  created_at: string;
}

export interface DashboardRecentReport {
  id: string;
  customer_name?: string | null;
  bureau?: string | null;
  credit_score?: number | null;
  created_at: string;
  report_type?: string | null;
}

export interface PartnerDashboardData {
  partnerId: string;
  balance: number;
  totalRecharged: number;
  totalDeducted: number;
  commercials: DashboardCommercials | null;
  reportsPulled: number;
  reportsPulledToday: number;
  weeklyPulls: DashboardPullDate[];
  recentReports: DashboardRecentReport[];
}

interface PartnerDashboardDataValue {
  data: PartnerDashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<PartnerDashboardData | null>;
}

const PartnerDashboardDataContext = createContext<PartnerDashboardDataValue | null>(null);

export function PartnerDashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data, loading, error, refresh } = usePartnerWalletData();

  useEffect(() => {
    if (!user?.id || !data?.partnerId) return;
    void prefetchPartnerReports(user.id).catch((err) => {
      console.warn('[PartnerDashboardData] reports prefetch failed:', err);
    });
    void prefetchPartnerInvoices(data.partnerId).catch((err) => {
      console.warn('[PartnerDashboardData] invoices prefetch failed:', err);
    });
  }, [data?.partnerId, user?.id]);

  const value = useMemo(
    () => ({ data, loading, error, refresh }),
    [data, loading, error]
  );

  return (
    <PartnerDashboardDataContext.Provider value={value}>
      {children}
    </PartnerDashboardDataContext.Provider>
  );
}

export function usePartnerDashboardData() {
  const context = useContext(PartnerDashboardDataContext);
  if (!context) {
    throw new Error('usePartnerDashboardData must be used inside PartnerDashboardDataProvider');
  }
  return context;
}
