'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/context/AuthContext';
import { usePartnerWalletData } from '@/hooks/usePartnerWalletData';
import { authFetch } from '@/lib/supabase/auth-fetch';
import { Wallet, AlertTriangle, ArrowDownCircle, ArrowUpCircle, TrendingUp, Users, RefreshCw, Receipt, BarChart3, Send, CheckCircle2, Clock } from 'lucide-react';

interface WalletTransaction {
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

interface Commercials {
  pricing_plan: string;
  subscription_type: string;
  consumer_credit_rate: number;
  commercial_credit_rate: number;
  bundled_credits: number;
  credit_limit: number;
}

const PLAN_COLORS: Record<string, string> = {
  Basic: 'bg-slate-100 text-slate-700 border-slate-200',
  Standard: 'bg-blue-50 text-blue-700 border-blue-200',
  Premium: 'bg-purple-50 text-purple-700 border-purple-200',
  Custom: 'bg-amber-50 text-amber-700 border-amber-200',
};

const SUB_LABELS: Record<string, string> = {
  prepaid: 'Prepaid',
  monthly_fixed: 'Monthly Fixed',
  hybrid: 'Hybrid',
};

type TabType = 'recharges' | 'statement';

export default function MyWalletPage() {
  const { user } = useAuth();
  const { data: walletData, loading, refresh } = usePartnerWalletData();

  const [activeTab, setActiveTab] = useState<TabType>('recharges');

  // Credit request state
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditAmountError, setCreditAmountError] = useState('');
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState(false);

  const LOW_BALANCE_THRESHOLD = 200;
  const balance = walletData?.balance ?? 0;
  const totalDeducted = walletData?.totalDeducted ?? 0;
  const totalRecharged = walletData?.totalRecharged ?? 0;
  const transactions = (walletData?.transactions ?? []) as WalletTransaction[];
  const rawCommercials = walletData?.commercials;
  const commercials: Commercials | null = rawCommercials
    ? {
        pricing_plan: rawCommercials.pricing_plan ?? 'Basic',
        subscription_type: rawCommercials.subscription_type ?? 'prepaid',
        consumer_credit_rate: Number(rawCommercials.consumer_credit_rate ?? rawCommercials.credit_rate ?? 10),
        commercial_credit_rate: Number(rawCommercials.commercial_credit_rate ?? rawCommercials.credit_rate ?? 15),
        bundled_credits: rawCommercials.bundled_credits ?? 0,
        credit_limit: rawCommercials.credit_limit ?? 1000,
      }
    : null;
  const hasWalletData = Boolean(walletData);
  const isLowBalance = hasWalletData && balance < LOW_BALANCE_THRESHOLD;

  const handleCreditRequest = async () => {
    setCreditAmountError('');
    const amt = Number(creditAmount);
    if (!creditAmount || isNaN(amt) || amt < 10000) {
      setCreditAmountError('Minimum credit request amount is ₹10,000');
      return;
    }
    if (!user?.id) return;
    setCreditSubmitting(true);
    try {
      const res = await authFetch('/api/request-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, note: creditNote }),
      });
      const json = await res.json();
      if (!json.success) {
        setCreditAmountError(json.error || 'Failed to submit request. Please try again.');
        return;
      }
      setCreditSuccess(true);
      setCreditAmount('');
      setCreditNote('');
      setTimeout(() => setCreditSuccess(false), 5000);
    } catch {
      setCreditAmountError('Network error. Please try again.');
    } finally {
      setCreditSubmitting(false);
    }
  };

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).replace(',', '');
    } catch {
      return iso;
    }
  }

  // Separate transactions
  const rechargeTransactions = transactions.filter((t) => t.type === 'credit');
  const allStatementTransactions = transactions; // all — credits + debits

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'recharges',
      label: 'Wallet Recharges',
      icon: <ArrowUpCircle size={14} />,
      count: rechargeTransactions.length,
    },
    {
      id: 'statement',
      label: 'Full Statement',
      icon: <Receipt size={14} />,
      count: allStatementTransactions.length,
    },
  ];

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
              {loading && !hasWalletData ? '—' : `₹${balance.toLocaleString('en-IN')}`}
            </span>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto space-y-6 fade-in">

        {/* Low Balance Alert */}
        {isLowBalance && !loading && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Low Wallet Balance</p>
              <p className="text-xs text-red-600 mt-0.5">
                Your balance (₹{balance}) is below ₹{LOW_BALANCE_THRESHOLD}. Contact your admin to recharge.
              </p>
            </div>
          </div>
        )}

        {/* Wallet Overview — 3 separate account cards */}
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
                {loading && !hasWalletData ? '—' : `₹${balance.toLocaleString('en-IN')}`}
              </p>
              {isLowBalance && (
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle size={11} className="text-amber-400" />
                  <span className="text-xs text-amber-300">Low balance</span>
                </div>
              )}
            </div>
          </div>

          {/* Recharge Account */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ArrowUpCircle size={14} className="text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recharge Account</span>
            </div>
            <p className="text-3xl font-bold font-mono tabular-nums text-emerald-600">
              ₹{totalRecharged.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {rechargeTransactions.filter(t => t.status !== 'pending').length} recharge{rechargeTransactions.filter(t => t.status !== 'pending').length !== 1 ? 's' : ''} credited
            </p>
          </div>

          {/* Deduction Account */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <ArrowDownCircle size={14} className="text-amber-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deduction Account</span>
            </div>
            <p className="text-3xl font-bold font-mono tabular-nums text-amber-600">
              ₹{totalDeducted.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter(t => t.type === 'debit').length} Bureau pull{transactions.filter(t => t.type === 'debit').length !== 1 ? 's' : ''} deducted
            </p>
          </div>
        </div>

        {/* Plan Details */}
        {commercials && (
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Your Plan Details</h2>
                <p className="text-xs text-muted-foreground">Rates set by your admin</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-muted-foreground mb-1">Pricing Plan</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[commercials.pricing_plan] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {commercials.pricing_plan}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-muted-foreground mb-1">Subscription</p>
                <p className="text-sm font-semibold text-foreground">{SUB_LABELS[commercials.subscription_type] ?? commercials.subscription_type}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users size={10} /> Consumer Rate</p>
                <p className="text-sm font-bold text-blue-700">₹{commercials.consumer_credit_rate}<span className="text-xs font-normal text-muted-foreground">/pull</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Recharge Wallet — Credit Request Form */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wallet size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Request Wallet Credits</h2>
              <p className="text-xs text-muted-foreground">Submit a credit request to your admin</p>
            </div>
          </div>

          {creditSuccess ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Request Submitted!</p>
                <p className="text-xs text-emerald-700 mt-0.5">Your credit request has been sent to the admin. You will be notified once it is processed.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Amount Requested <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">₹</span>
                  <input
                    type="number"
                    min={10000}
                    step={1000}
                    value={creditAmount}
                    onChange={(e) => { setCreditAmount(e.target.value); setCreditAmountError(''); }}
                    placeholder="10000"
                    className={`w-full pl-7 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all
                      ${creditAmountError
                        ? 'border-red-300 focus:ring-red-200 bg-red-50' :'border-slate-200 focus:ring-blue-200 focus:border-blue-400 bg-white'
                      }`}
                  />
                </div>
                {creditAmountError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    {creditAmountError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Minimum request: ₹10,000</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Note (optional)</label>
                <textarea
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Any additional information for the admin..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                />
              </div>

              <button
                onClick={handleCreditRequest}
                disabled={creditSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {creditSubmitting ? (
                  <>
                    <Clock size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Submit Credit Request
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tabbed Transaction Section */}
        <div className="bg-white rounded-xl border border-border">
          {/* Tab Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-0 border-b border-border">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-150 -mb-px
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono
                    ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pb-2">
            <button
                onClick={() => void refresh()}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-x-auto">
            {activeTab === 'recharges' && (
              <>
                {/* Recharges tab — credits only */}
                <div className="px-6 py-3 bg-emerald-50/40 border-b border-emerald-100 flex items-center gap-2">
                  <ArrowUpCircle size={13} className="text-emerald-600" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Showing all wallet recharges — credits added by admin when invoice is paid
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount Credited</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          <RefreshCw size={16} className="animate-spin inline mr-2" />Loading...
                        </td>
                      </tr>
                    ) : rechargeTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No wallet recharges yet.
                        </td>
                      </tr>
                    ) : (
                      rechargeTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(txn.created_at)}</td>
                          <td className="px-6 py-3.5 text-sm text-foreground max-w-[220px] truncate">{txn.description}</td>
                          <td className="px-6 py-3.5">
                            {txn.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Payment Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowUpCircle size={10} />
                                Wallet Recharged
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-semibold font-mono text-right whitespace-nowrap text-emerald-600">
                            +₹{Number(txn.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono text-right">
                            {txn.status === 'pending' ? '—' : txn.running_balance != null ? `₹${Number(txn.running_balance).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}

            {activeTab === 'statement' && (
              <>
                {/* Full Statement tab — all transactions */}
                <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2">
                  <BarChart3 size={13} className="text-slate-500" />
                  <p className="text-xs text-slate-600 font-medium">
                    Complete account statement — all credits (recharges) and debits (Bureau pulls) in chronological order
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credit</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Debit</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          <RefreshCw size={16} className="animate-spin inline mr-2" />Loading...
                        </td>
                      </tr>
                    ) : allStatementTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      allStatementTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(txn.created_at)}</td>
                          <td className="px-6 py-3.5 text-sm text-foreground max-w-[200px] truncate">{txn.description}</td>
                          <td className="px-6 py-3.5">
                            {txn.type === 'credit' ? (
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
                                ${txn.status === 'pending' ?'bg-amber-50 text-amber-700 border border-amber-200' :'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                <ArrowUpCircle size={10} />
                                {txn.status === 'pending' ? 'Pending' : 'Recharge'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                                <ArrowDownCircle size={10} />
                                Bureau Pull
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-semibold font-mono text-right whitespace-nowrap text-emerald-600">
                            {txn.type === 'credit' ? `+₹${Number(txn.amount).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-semibold font-mono text-right whitespace-nowrap text-red-600">
                            {txn.type === 'debit' ? `-₹${Number(txn.amount).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono text-right">
                            {txn.status === 'pending' ? '—' : txn.running_balance != null ? `₹${Number(txn.running_balance).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
