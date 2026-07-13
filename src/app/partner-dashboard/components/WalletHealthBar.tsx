'use client';

import React, { useMemo } from 'react';
import { usePartnerDashboardData } from './PartnerDashboardDataContext';

interface WalletHealth {
  balance: number;
  pricePerPull: number;
  estimatedPulls: number;
  maxPulls: number; // for bar scale (e.g. 100 or based on last recharge)
}

export default function WalletHealthBar() {
  const { data, loading } = usePartnerDashboardData();

  const health = useMemo<WalletHealth | null>(() => {
    if (!data) return null;

    const balance = data.balance ?? 0;
    const comm = data.commercials;
    const pricePerPull =
      Number(comm?.consumer_credit_rate) ||
      Number(comm?.credit_rate) ||
      Number(comm?.commercial_credit_rate) ||
      35;

    const estimatedPulls = pricePerPull > 0 ? Math.floor(balance / pricePerPull) : 0;
    const maxPulls =
      data.totalRecharged > 0 && pricePerPull > 0
        ? Math.floor(data.totalRecharged / pricePerPull)
        : Math.max(estimatedPulls * 2, 100);

    return { balance, pricePerPull, estimatedPulls, maxPulls };
  }, [data]);

  const pct =
    health && health.maxPulls > 0
      ? Math.min(100, Math.round((health.estimatedPulls / health.maxPulls) * 100))
      : 0;

  const barColor =
    pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500';

  const statusLabel =
    pct > 50 ? 'Healthy' : pct > 20 ? 'Low' : 'Critical';

  const statusTextColor =
    pct > 50 ? 'text-emerald-600' : pct > 20 ? 'text-amber-600' : 'text-red-600';

  const statusBg =
    pct > 50 ? 'bg-emerald-50' : pct > 20 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Wallet Health</h3>
          <p className="text-xs text-slate-500 mt-0.5">Balance vs. estimated pulls remaining</p>
        </div>
        {!loading && health && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBg} ${statusTextColor}`}>
            {statusLabel}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : health ? (
        <>
          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-500">Wallet Balance</p>
              <p className="font-bold text-slate-800 text-sm tabular-nums">
                ₹{health.balance.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-500">Price / Pull</p>
              <p className="font-bold text-slate-800 text-sm tabular-nums">
                ₹{health.pricePerPull}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Est. Pulls Left</p>
              <p className={`font-bold text-sm tabular-nums ${statusTextColor}`}>
                ~{health.estimatedPulls.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400">Unable to load wallet data.</p>
      )}
    </div>
  );
}
