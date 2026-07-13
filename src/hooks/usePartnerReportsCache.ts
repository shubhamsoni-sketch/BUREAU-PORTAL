'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/supabase/auth-fetch';

export interface CachedBureauPull {
  id: string;
  partner_id: string;
  report_type: string;
  status: string;
  member_ref: string | null;
  pan: string | null;
  customer_name: string | null;
  credit_score: number | null;
  occupation_code: string | null;
  gender: string | null;
  state: string | null;
  dob: string | null;
  income: string | null;
  total_trades: number | null;
  active_trade_lines: number | null;
  loan_types: string | null;
  dpd_tag: string | null;
  current_balance: number | null;
  overdue_amount: number | null;
  total_enquiries: number | null;
  amount_deducted: number | null;
  report_id: string | null;
  bureau: string | null;
  error_message: string | null;
  raw_json: Record<string, unknown>;
  created_at: string;
}

interface ReportsCacheEntry {
  partnerId: string | null;
  pulls: CachedBureauPull[];
  fetchedAt: number;
}

const memoryCache = new Map<string, ReportsCacheEntry>();
const inFlight = new Map<string, Promise<ReportsCacheEntry>>();
const listeners = new Map<string, Set<(entry: ReportsCacheEntry) => void>>();

function cacheKey(userId: string, dateFrom = '', dateTo = '') {
  return `${userId}|${dateFrom}|${dateTo}`;
}

function storageKey(key: string) {
  return `credittrust_reports_${key}`;
}

function readStored(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    return raw ? (JSON.parse(raw) as ReportsCacheEntry) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, entry: ReportsCacheEntry) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // Ignore private mode/quota failures.
  }
}

function getCached(key: string) {
  const cached = memoryCache.get(key) ?? readStored(key);
  if (cached) memoryCache.set(key, cached);
  return cached ?? null;
}

function notify(key: string, entry: ReportsCacheEntry) {
  listeners.get(key)?.forEach((listener) => listener(entry));
}

export async function prefetchPartnerReports(userId: string, dateFrom = '', dateTo = '') {
  const key = cacheKey(userId, dateFrom, dateTo);
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);

    const res = await authFetch(`/api/bureau-pulls?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json?.success) {
      throw new Error(json?.error || 'Unable to load reports');
    }

    const entry: ReportsCacheEntry = {
      partnerId: json.partnerId ?? null,
      pulls: (json.pulls ?? []) as CachedBureauPull[],
      fetchedAt: Date.now(),
    };
    memoryCache.set(key, entry);
    writeStored(key, entry);
    notify(key, entry);
    return entry;
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

export function usePartnerReportsCache(dateFrom = '', dateTo = '') {
  const { user } = useAuth();
  const key = useMemo(() => user?.id ? cacheKey(user.id, dateFrom, dateTo) : null, [user?.id, dateFrom, dateTo]);
  const initial = key ? getCached(key) : null;
  const [entry, setEntry] = useState<ReportsCacheEntry | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (forceSpinner = false) => {
    if (!user?.id || !key) return null;
    const cached = getCached(key);
    if (forceSpinner || !cached) setLoading(true);
    setError(null);
    try {
      return await prefetchPartnerReports(user.id, dateFrom, dateTo);
    } catch (err: any) {
      setError(err?.message || 'Unable to load reports');
      return null;
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, key, user?.id]);

  useEffect(() => {
    if (!key || !user?.id) {
      setEntry(null);
      setLoading(false);
      return;
    }

    const cached = getCached(key);
    setEntry(cached);
    setLoading(!cached);

    const keyListeners = listeners.get(key) ?? new Set<(entry: ReportsCacheEntry) => void>();
    const listener = (next: ReportsCacheEntry) => {
      setEntry(next);
      setLoading(false);
    };
    keyListeners.add(listener);
    listeners.set(key, keyListeners);

    void refresh(false);

    return () => {
      keyListeners.delete(listener);
      if (keyListeners.size === 0) listeners.delete(key);
    };
  }, [key, refresh, user?.id]);

  return {
    pulls: entry?.pulls ?? [],
    partnerId: entry?.partnerId ?? null,
    loading,
    error,
    refresh,
  };
}
