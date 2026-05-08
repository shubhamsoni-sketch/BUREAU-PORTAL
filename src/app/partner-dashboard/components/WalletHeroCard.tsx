'use client';

import React from 'react';
import { Wallet, Plus, AlertTriangle, RefreshCw } from 'lucide-react';

export default function WalletHeroCard() {
  return (
    <div className="md:col-span-1 xl:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Wallet</span>
          </div>
          <button className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <RefreshCw size={12} className="text-slate-300" />
          </button>
        </div>

        {/* Balance */}
        <div className="mb-1">
          <p className="text-3xl font-bold font-mono tabular-nums text-white">₹350</p>
          <p className="text-xs text-slate-400 mt-0.5">Available Credits</p>
        </div>

        {/* Low balance warning */}
        <div className="flex items-center gap-1.5 mt-3 mb-4 px-3 py-2 bg-amber-500/20 border border-amber-400/30 rounded-lg">
          <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300 font-medium">Low balance — recharge to continue pulling reports</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Used Today</p>
            <p className="text-sm font-bold font-mono text-slate-200">₹280</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">This Month</p>
            <p className="text-sm font-bold font-mono text-slate-200">₹4,120</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Per Report</p>
            <p className="text-sm font-bold font-mono text-slate-200">₹35</p>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors active:scale-95">
          <Plus size={14} />
          Recharge Wallet
        </button>
      </div>
    </div>
  );
}