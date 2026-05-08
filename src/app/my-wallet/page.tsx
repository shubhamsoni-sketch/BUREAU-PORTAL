'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useWallet } from '@/context/WalletContext';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  CreditCard,
  Package,
  Zap,
  TrendingUp,
} from 'lucide-react';

const PRESET_AMOUNTS = [1000, 5000, 10000];

export default function MyWalletPage() {
  const { balance, totalCredits, creditsUsed, transactions, recharge, LOW_BALANCE_THRESHOLD, CREDIT_COST } = useWallet();

  const [inputAmount, setInputAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState('');
  const [rechargeError, setRechargeError] = useState('');

  const isLowBalance = balance < LOW_BALANCE_THRESHOLD;
  const last10 = transactions.slice(0, 10);

  function handlePreset(amount: number) {
    setInputAmount(String(amount));
    setRechargeError('');
    setRechargeSuccess('');
  }

  function handleRecharge() {
    const amt = parseInt(inputAmount, 10);
    if (!inputAmount || isNaN(amt) || amt <= 0) {
      setRechargeError('Please enter a valid amount.');
      return;
    }
    if (amt < 100) {
      setRechargeError('Minimum recharge amount is ₹100.');
      return;
    }
    setRechargeError('');
    setRecharging(true);
    // Mock payment success after 1.2s
    setTimeout(() => {
      recharge(amt);
      setRechargeSuccess(`₹${amt.toLocaleString('en-IN')} added to your wallet successfully!`);
      setInputAmount('');
      setRecharging(false);
      setTimeout(() => setRechargeSuccess(''), 4000);
    }, 1200);
  }

  return (
    <AppLayout role="partner">
      <Topbar
        title="My Wallet"
        subtitle="Manage your credits and transaction history"
        role="partner"
        actions={
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isLowBalance ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-border'}`}>
            <Wallet size={14} className={isLowBalance ? 'text-red-500' : 'text-muted-foreground'} />
            <span className="text-xs text-muted-foreground">Balance:</span>
            <span className={`text-sm font-semibold font-mono ${isLowBalance ? 'text-red-600' : 'text-foreground'}`}>
              ₹{balance.toLocaleString('en-IN')}
            </span>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto space-y-6 fade-in">

        {/* ── Low Balance Alert ── */}
        {isLowBalance && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Low Wallet Balance</p>
              <p className="text-xs text-red-600 mt-0.5">
                Your balance (₹{balance}) is below the threshold of ₹{LOW_BALANCE_THRESHOLD}. Each CIBIL pull costs ₹{CREDIT_COST}. Please recharge to continue pulling reports.
              </p>
            </div>
          </div>
        )}

        {/* ── Wallet Overview ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Wallet size={14} className="text-white" />
                </div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current Balance</span>
              </div>
              <p className={`text-3xl font-bold font-mono tabular-nums ${isLowBalance ? 'text-red-400' : 'text-white'}`}>
                ₹{balance.toLocaleString('en-IN')}
              </p>
              {isLowBalance && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle size={11} className="text-amber-400" />
                  <span className="text-xs text-amber-300">Low balance</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Credits */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Credits</span>
            </div>
            <p className="text-3xl font-bold font-mono tabular-nums text-foreground">
              ₹{totalCredits.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime credits purchased</p>
          </div>

          {/* Credits Used */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <ArrowDownCircle size={14} className="text-amber-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits Used</span>
            </div>
            <p className="text-3xl font-bold font-mono tabular-nums text-foreground">
              ₹{creditsUsed.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total deductions so far</p>
          </div>
        </div>

        {/* ── Recharge Section ── */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Recharge Wallet</h2>
          <p className="text-sm text-muted-foreground mb-5">Add credits to your wallet using mock payment flow.</p>

          {/* Success */}
          {rechargeSuccess && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 mb-4">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700">{rechargeSuccess}</p>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => handlePreset(amt)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150
                  ${inputAmount === String(amt)
                    ? 'bg-primary text-white border-primary' :'bg-slate-50 text-foreground border-border hover:border-primary hover:text-primary'
                  }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="flex items-start gap-3">
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                <input
                  type="number"
                  className="input-base pl-7 font-mono"
                  placeholder="Enter custom amount"
                  min={100}
                  value={inputAmount}
                  onChange={(e) => {
                    setInputAmount(e.target.value);
                    setRechargeError('');
                    setRechargeSuccess('');
                  }}
                />
              </div>
              {rechargeError && <p className="text-xs text-red-500 mt-1">{rechargeError}</p>}
              <p className="text-xs text-muted-foreground mt-1">Minimum recharge: ₹100</p>
            </div>
            <button
              onClick={handleRecharge}
              disabled={recharging}
              className="btn-primary disabled:opacity-60 flex items-center gap-2"
            >
              {recharging ? (
                <><RefreshCw size={14} className="animate-spin" /> Processing...</>
              ) : (
                <><ArrowUpCircle size={14} /> Recharge</>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
            <Zap size={11} className="text-amber-500" />
            Mock payment flow — no real transaction will occur.
          </p>
        </div>

        {/* ── Transaction History ── */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">Transaction History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last 10 transactions</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {last10.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  last10.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">{txn.date}</td>
                      <td className="px-6 py-3.5 text-sm text-foreground max-w-[220px] truncate">{txn.description}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
                          ${txn.type === 'Recharge' ?'bg-emerald-50 text-emerald-700 border border-emerald-200' :'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                          {txn.type === 'Recharge'
                            ? <ArrowUpCircle size={11} />
                            : <ArrowDownCircle size={11} />
                          }
                          {txn.type}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 text-sm font-semibold font-mono text-right whitespace-nowrap
                        ${txn.type === 'Recharge' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {txn.type === 'Recharge' ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
                          ${txn.status === 'Success' ?'bg-emerald-50 text-emerald-700'
                            : txn.status === 'Pending' ?'bg-amber-50 text-amber-700' :'bg-red-50 text-red-700'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${txn.status === 'Success' ? 'bg-emerald-500' : txn.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Placeholder: Subscription Plans ── */}
        <div className="bg-white rounded-xl border border-dashed border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <CreditCard size={16} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Subscription Plans</h2>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Monthly and annual subscription plans with discounted per-report pricing will be available here. Upgrade to save more on bulk CIBIL pulls.
          </p>
        </div>

        {/* ── Placeholder: Add-on Credits ── */}
        <div className="bg-white rounded-xl border border-dashed border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Add-on Credits</h2>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Purchase bulk credit packs at discounted rates. Add-on credit bundles (₹500, ₹2000, ₹5000) with bonus credits will be available here.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
