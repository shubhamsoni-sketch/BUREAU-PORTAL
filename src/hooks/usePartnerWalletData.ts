'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/supabase/auth-fetch';

export interface PartnerWalletTransaction {
  id: string;
  created_at: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  transaction_type: string;
  running_balance: number | null;
  status?: string;
  metadata?: Record<string, any>;
}

export interface PartnerWalletCommercials {
  pricing_plan?: string | null;
  subscription_type?: string | null;
  consumer_credit_rate?: number | string | null;
  commercial_credit_rate?: number | string | null;
  bundled_credits?: number | null;
  credit_limit?: number | null;
  credit_rate?: number | string | null;
}

export interface PartnerWalletData {
  partnerId: string;
  balance: number;
  totalRecharged: number;
  totalDeducted: number;
  transactions: PartnerWalletTransaction[];
  commercials: PartnerWalletCommercials | null;
  reportsPulled: number;
  reportsPulledToday: number;
  weeklyPulls: { created_at: string }[];
  recentReports: {
    id: string;
    customer_name?: string | null;
    bureau?: string | null;
    credit_score?: number | null;
    created_at: string;
    report_type?: string | null;
  }[];
}

type Listener = (data: PartnerWalletData | null) => void;

const memoryCache = new Map<string, PartnerWalletData>();
const inFlight = new Map<string, Promise<PartnerWalletData>>();
const listeners = new Map<string, Set<Listener>>();

function storageKey(userId: string) {
  return `credittrust_partner_wallet_${userId}`;
}

function readStored(userId: string): PartnerWalletData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as PartnerWalletData) : null;
  } catch {
    return null;
  }
}

function writeStored(userId: string, data: PartnerWalletData) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    // Ignore storage quota/private mode failures.
  }
}

function normalizeWalletData(json: any): PartnerWalletData {
  return {
    partnerId: String(json.partnerId),
    balance: Number(json.balance ?? 0),
    totalRecharged: Number(json.totalRecharged ?? 0),
    totalDeducted: Number(json.totalDeducted ?? 0),
    transactions: Array.isArray(json.transactions) ? json.transactions : [],
    commercials: json.commercials ?? null,
    reportsPulled: Number(json.reportsPulled ?? 0),
    reportsPulledToday: Number(json.reportsPulledToday ?? 0),
    weeklyPulls: Array.isArray(json.weeklyPulls) ? json.weeklyPulls : [],
    recentReports: Array.isArray(json.recentReports) ? json.recentReports : [],
  };
}

function notify(userId: string, data: PartnerWalletData | null) {
  listeners.get(userId)?.forEach((listener) => listener(data));
}

export function getCachedPartnerWalletData(userId?: string | null) {
  if (!userId) return null;
  const cached = memoryCache.get(userId) ?? readStored(userId);
  if (cached) memoryCache.set(userId, cached);
  return cached ?? null;
}

export async function refreshPartnerWalletData(userId: string) {
  const existing = inFlight.get(userId);
  if (existing) return existing;

  const promise = authFetch('/api/partner-wallet-data')
    .then(async (res) => {
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Unable to load wallet data');
      }
      const data = normalizeWalletData(json);
      memoryCache.set(userId, data);
      writeStored(userId, data);
      notify(userId, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(userId);
    });

  inFlight.set(userId, promise);
  return promise;
}

export function updateCachedPartnerWalletData(
  userId: string | undefined,
  updater: (data: PartnerWalletData | null) => PartnerWalletData | null
) {
  if (!userId) return;
  const next = updater(getCachedPartnerWalletData(userId));
  if (!next) return;
  memoryCache.set(userId, next);
  writeStored(userId, next);
  notify(userId, next);
}

export function usePartnerWalletData() {
  const { user } = useAuth();
  const userId = user?.id;
  const initialData = useMemo(() => getCachedPartnerWalletData(userId), [userId]);
  const [data, setData] = useState<PartnerWalletData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return null;
    setError(null);
    if (!getCachedPartnerWalletData(userId)) setLoading(true);

    try {
      return await refreshPartnerWalletData(userId);
    } catch (err: any) {
      setError(err?.message || 'Unable to load wallet data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = getCachedPartnerWalletData(userId);
    setData(cached);
    setLoading(!cached);

    const userListeners = listeners.get(userId) ?? new Set<Listener>();
    const listener: Listener = (next) => {
      setData(next);
      setLoading(false);
    };
    userListeners.add(listener);
    listeners.set(userId, userListeners);

    void refresh();

    return () => {
      userListeners.delete(listener);
      if (userListeners.size === 0) listeners.delete(userId);
    };
  }, [refresh, userId]);

  return { data, loading, error, refresh };
}
