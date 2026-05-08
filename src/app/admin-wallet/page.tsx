'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Minus, X, AlertTriangle, Wallet, BarChart3, ChevronDown, Edit2, Check, RefreshCw, Loader2, Clock, CheckCircle2 } from 'lucide-react';




// ─── Types ────────────────────────────────────────────────────────────────────

interface LivePartner {
  id: string;
  partnerCode: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  walletBalance: number;
  reportsPulled: number;
  pricingPlan: string;
}

interface LiveTransaction {
  id: string;
  partnerId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  transactionType: string;
  status: string;
  runningBalance: number | null;
  createdAt: string;
}

interface LiveCommercial {
  partnerId: string;
  pricingPlan: string;
  subscriptionType: string;
  consumerRate: number;
  commercialRate: number;
  bundledCredits: number;
  creditLimit: number;
  notes: string;
}

interface CreditRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerCode: string;
  amount: number;
  note: string;
  status: string;
  createdAt: string;
}

type BillingModelType = 'Credit-Based' | 'Subscription' | 'Monthly Fixed' | 'Hybrid';

const BILLING_MODEL_TYPES: BillingModelType[] = ['Credit-Based', 'Subscription', 'Monthly Fixed', 'Hybrid'];

const MODEL_COLORS: Record<BillingModelType, string> = {
  'Credit-Based': 'bg-blue-50 text-blue-700 border-blue-200',
  'Subscription': 'bg-purple-50 text-purple-700 border-purple-200',
  'Monthly Fixed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Hybrid': 'bg-amber-50 text-amber-700 border-amber-200',
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Wallet },
  { id: 'pending_requests', label: 'Pending Requests', icon: Clock },
  { id: 'commercials', label: 'Commercials', icon: BarChart3 },
] as const;

type TabId = typeof TABS[number]['id'];

function mapDbStatus(s: string): string {
  switch (s) {
    case 'approved': return 'Active';
    case 'pending': return 'Pending';
    case 'suspended': return 'Suspended';
    case 'terminated': return 'Terminated';
    case 'rejected': return 'Terminated';
    default: return 'Pending';
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminWalletPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Partners + transactions state
  const [partners, setPartners] = useState<LivePartner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [transactions, setTransactions] = useState<LiveTransaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add credits modal
  const [addModal, setAddModal] = useState<{ partnerId: string; partnerName: string } | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Commercials state
  const [commercials, setCommercials] = useState<LiveCommercial[]>([]);
  const [commercialsLoading, setCommercialsLoading] = useState(false);
  const [editingCommercialId, setEditingCommercialId] = useState<string | null>(null);
  const [commercialDraft, setCommercialDraft] = useState<LiveCommercial | null>(null);
  const [savingCommercial, setSavingCommercial] = useState(false);

  // Pending credit requests state
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [creditRequestsLoading, setCreditRequestsLoading] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load partners from Supabase ──────────────────────────────────────────────
  const loadPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const res = await fetch('/api/admin-partners-list');
      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setPartners(result.data.map((row: any) => ({
          id: row.id,
          partnerCode: row.partner_code ?? '',
          fullName: row.name ?? '',
          email: row.email ?? '',
          phone: row.mobile ?? '',
          city: row.city ?? '',
          status: mapDbStatus(row.status),
          walletBalance: Number(row.wallet_balance ?? 0),
          reportsPulled: Number(row.reports_pulled ?? 0),
          pricingPlan: row.pricing_plan ?? 'Basic',
        })));
      } else {
        console.error('[AdminWallet] loadPartners error:', result.error);
      }
    } catch (err) {
      console.error('[AdminWallet] loadPartners error:', err);
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  // ── Load transactions for selected partner ───────────────────────────────────
  const loadTransactions = useCallback(async (partnerId: string) => {
    setTxnLoading(true);
    try {
      const res = await fetch(`/api/admin-wallet-transactions?partner_id=${partnerId}`);
      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setTransactions(result.data.map((row: any) => ({
          id: row.id,
          partnerId: row.partner_id,
          type: row.type as 'credit' | 'debit',
          amount: Number(row.amount),
          description: row.description ?? '',
          transactionType: row.transaction_type ?? '',
          status: row.status ?? '',
          runningBalance: row.running_balance != null ? Number(row.running_balance) : null,
          createdAt: row.created_at ?? '',
        })));
      } else {
        console.error('[AdminWallet] loadTransactions error:', result.error);
        setTransactions([]);
      }
    } catch (err) {
      console.error('[AdminWallet] loadTransactions error:', err);
      setTransactions([]);
    } finally {
      setTxnLoading(false);
    }
  }, []);

  // ── Load commercials ─────────────────────────────────────────────────────────
  const loadCommercials = useCallback(async () => {
    setCommercialsLoading(true);
    try {
      const res = await fetch('/api/admin-commercials-list');
      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setCommercials(result.data.map((row: any) => ({
          partnerId: row.partner_id,
          pricingPlan: row.pricing_plan ?? 'Basic',
          subscriptionType: row.subscription_type ?? 'prepaid',
          consumerRate: Number(row.consumer_credit_rate ?? 10),
          commercialRate: Number(row.commercial_credit_rate ?? 15),
          bundledCredits: Number(row.bundled_credits ?? 0),
          creditLimit: Number(row.credit_limit ?? 1000),
          notes: row.notes ?? '',
        })));
      } else {
        console.error('[AdminWallet] loadCommercials error:', result.error);
      }
    } catch (err) {
      console.error('[AdminWallet] loadCommercials error:', err);
    } finally {
      setCommercialsLoading(false);
    }
  }, []);

  // ── Load pending credit requests ─────────────────────────────────────────────
  const loadCreditRequests = useCallback(async () => {
    setCreditRequestsLoading(true);
    try {
      const res = await fetch('/api/approve-credit-request?status=pending');
      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setCreditRequests(result.data.map((row: any) => ({
          id: row.id,
          partnerId: row.partner_id,
          partnerName: row.partner_name ?? 'Unknown',
          partnerEmail: row.partner_email ?? '',
          partnerCode: row.partner_code ?? '',
          amount: Number(row.amount),
          note: row.note ?? '',
          status: row.status,
          createdAt: row.created_at ?? '',
        })));
      } else {
        console.error('[AdminWallet] loadCreditRequests error:', result.error);
        setCreditRequests([]);
      }
    } catch (err) {
      console.error('[AdminWallet] loadCreditRequests error:', err);
      setCreditRequests([]);
    } finally {
      setCreditRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
    loadCreditRequests();
  }, [loadPartners, loadCreditRequests]);

  useEffect(() => {
    if (activeTab === 'commercials') {
      loadCommercials();
    }
    if (activeTab === 'pending_requests') {
      loadCreditRequests();
    }
  }, [activeTab, loadCommercials, loadCreditRequests]);

  useEffect(() => {
    if (selectedPartnerId) {
      loadTransactions(selectedPartnerId);
    } else {
      setTransactions([]);
    }
  }, [selectedPartnerId, loadTransactions]);

  // ── Add Credits ──────────────────────────────────────────────────────────────
  const handleAddCredits = async () => {
    if (!addModal || !addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) return;
    setAddLoading(true);
    try {
      const res = await fetch('/api/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: addModal.partnerId,
          amount: Number(addAmount),
          note: addNote || null,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSelectedPartnerId(addModal.partnerId);
        loadTransactions(addModal.partnerId);
        showToast(
          `₹${Number(addAmount).toLocaleString('en-IN')} added to ${addModal.partnerName}'s wallet${result.invoice_number ? ` — Draft invoice ${result.invoice_number} created` : ''}`,
          'success'
        );
        setAddModal(null);
        setAddAmount('');
        setAddNote('');
      } else {
        showToast(result.error || 'Failed to add credits', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Approve Credit Request ───────────────────────────────────────────────────
  const handleApproveRequest = async (request: CreditRequest) => {
    setApprovingRequestId(request.id);
    try {
      const res = await fetch('/api/approve-credit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credit_request_id: request.id }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(
          `Approved ₹${request.amount.toLocaleString('en-IN')} for ${request.partnerName}${result.invoice_number ? ` — Draft invoice ${result.invoice_number} created` : ''}`,
          'success'
        );
        // Remove from pending list
        setCreditRequests((prev) => prev.filter((r) => r.id !== request.id));
      } else {
        showToast(result.error || 'Failed to approve request', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setApprovingRequestId(null);
    }
  };

  // ── Save Commercials ─────────────────────────────────────────────────────────
  const saveCommercial = async (partnerId: string) => {
    if (!commercialDraft) return;
    setSavingCommercial(true);
    try {
      const res = await fetch('/api/save-partner-commercials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          pricing_plan: commercialDraft.pricingPlan,
          subscription_type: commercialDraft.subscriptionType,
          consumer_credit_rate: commercialDraft.consumerRate,
          commercial_credit_rate: commercialDraft.commercialRate,
          bundled_credits: commercialDraft.bundledCredits,
          credit_limit: commercialDraft.creditLimit,
          notes: commercialDraft.notes,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setCommercials((prev) =>
          prev.map((c) => c.partnerId === partnerId ? { ...commercialDraft } : c)
        );
        setEditingCommercialId(null);
        setCommercialDraft(null);
        showToast('Commercial rates updated successfully', 'success');
      } else {
        showToast(result.error || 'Failed to save commercials', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSavingCommercial(false);
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────
  const filteredPartners = useMemo(() =>
    partners.filter((p) =>
      !search ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.partnerCode.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    ),
    [partners, search]
  );

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);
  const totalWalletValue = partners.reduce((sum, p) => sum + p.walletBalance, 0);
  const activePartners = partners.filter((p) => p.status === 'Active');
  const lowBalancePartners = activePartners.filter((p) => p.walletBalance < 500);

  const getPartnerName = (id: string) => partners.find((p) => p.id === id)?.fullName ?? id;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Wallet Management">
      <div className="p-6 space-y-5">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-sm ${toastType === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>
            {toast}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isPendingTab = tab.id === 'pending_requests';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <TabIcon size={15} />
                {tab.label}
                {isPendingTab && creditRequests.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {creditRequests.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">Total Wallet Value</p>
                  <button onClick={loadPartners} className="text-slate-400 hover:text-slate-600 transition-colors" title="Refresh">
                    <RefreshCw size={13} />
                  </button>
                </div>
                <p className="text-2xl font-bold text-slate-800">₹{totalWalletValue.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Active Partners</p>
                <p className="text-2xl font-bold text-emerald-600">{activePartners.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-1">Low Balance Alerts</p>
                <p className="text-2xl font-bold text-red-500">{lowBalancePartners.length}</p>
              </div>
            </div>

            {lowBalancePartners.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Low Balance Partners</p>
                  <p className="text-xs text-amber-600 mt-0.5">{lowBalancePartners.map((p) => p.fullName).join(', ')} — balance below ₹500</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Partner Wallets List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <h3 className="font-semibold text-slate-800 text-sm flex-1">Partner Wallets</h3>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-40"
                    />
                  </div>
                </div>

                {partnersLoading ? (
                  <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={22} className="animate-spin" />
                    <p className="text-sm">Loading partners...</p>
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">No partners found</div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                    {filteredPartners.map((partner) => (
                      <div
                        key={partner.id}
                        onClick={() => setSelectedPartnerId(partner.id === selectedPartnerId ? null : partner.id)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selectedPartnerId === partner.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {partner.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{partner.fullName}</p>
                          <p className="text-xs text-slate-400">{partner.partnerCode} · {partner.status}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${partner.walletBalance < 500 ? 'text-red-500' : 'text-slate-800'}`}>
                            ₹{partner.walletBalance.toLocaleString('en-IN')}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddModal({ partnerId: partner.id, partnerName: partner.fullName });
                            }}
                            className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors text-xs font-medium"
                            title="Add Credits"
                          >
                            <Plus size={11} /> Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">
                    {selectedPartner ? `Transactions — ${selectedPartner.fullName}` : 'Select a partner to view transactions'}
                  </h3>
                  {selectedPartner && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Current balance: <span className="font-semibold text-slate-700">₹{selectedPartner.walletBalance.toLocaleString('en-IN')}</span>
                    </p>
                  )}
                </div>

                {!selectedPartnerId ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    <ChevronDown size={24} className="mx-auto mb-2 opacity-40" />
                    Click a partner to view their transaction history
                  </div>
                ) : txnLoading ? (
                  <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={20} className="animate-spin" />
                    <p className="text-sm">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">No transactions found</div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${txn.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          {txn.type === 'credit' ? <Plus size={13} className="text-emerald-600" /> : <Minus size={13} className="text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{txn.description}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {txn.type === 'credit' ? '+' : '-'}₹{(txn.amount ?? 0).toLocaleString('en-IN')}
                          </p>
                          {txn.runningBalance != null && (
                            <p className="text-[10px] text-slate-400">Bal: ₹{(txn.runningBalance ?? 0).toLocaleString('en-IN')}</p>
                          )}
                          {txn.status === 'pending' && (
                            <span className="px-2 py-1 text-xs text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                              Payment Pending
                            </span>
                          )}
                          {txn.status === 'confirmed' && (
                            <span className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                              Wallet Recharged
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING REQUESTS TAB ── */}
        {activeTab === 'pending_requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Pending Credit Requests</h3>
                <p className="text-xs text-slate-500 mt-0.5">Partners who have requested wallet credits — approve to auto-create a pending transaction and draft invoice</p>
              </div>
              <button
                onClick={loadCreditRequests}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {creditRequestsLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-3 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-sm">Loading requests...</p>
              </div>
            ) : creditRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-3 text-slate-400">
                <CheckCircle2 size={32} className="opacity-30" />
                <p className="text-sm font-medium">No pending credit requests</p>
                <p className="text-xs text-slate-400">All partner credit requests have been processed</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partner</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requested Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Note</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requested On</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {creditRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {req.partnerName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{req.partnerName}</p>
                              <p className="text-xs text-slate-400">{req.partnerCode} · {req.partnerEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-base font-bold text-slate-800">₹{req.amount.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-500">{req.note || <span className="italic text-slate-300">—</span>}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            disabled={approvingRequestId === req.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors ml-auto"
                          >
                            {approvingRequestId === req.id ? (
                              <><Loader2 size={12} className="animate-spin" /> Approving...</>
                            ) : (
                              <><Check size={12} /> Approve</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── COMMERCIALS TAB ── */}
        {activeTab === 'commercials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Per-Partner Report Pricing</h3>
                <p className="text-xs text-slate-500 mt-0.5">Set custom Consumer and Commercial Bureau report rates per partner — synced with Partner Management</p>
              </div>
              <button onClick={loadCommercials} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {commercialsLoading ? (
                <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={22} className="animate-spin" />
                  <p className="text-sm">Loading commercials...</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Partner</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Consumer Rate (₹)</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commercial Rate (₹)</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commercials.map((c) => {
                      const isEditing = editingCommercialId === c.partnerId;
                      const draft = isEditing ? commercialDraft : c;
                      return (
                        <tr key={c.partnerId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{getPartnerName(c.partnerId)}</p>
                            <p className="text-xs text-slate-400">{partners.find((p) => p.id === c.partnerId)?.partnerCode}</p>
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={draft?.pricingPlan ?? 'Basic'}
                                onChange={(e) => setCommercialDraft((prev) => prev ? { ...prev, pricingPlan: e.target.value } : null)}
                                className="text-xs border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                              >
                                {['Basic', 'Standard', 'Premium', 'Custom'].map((p) => <option key={p} value={p}>{p}</option>)}
                              </select>
                            ) : (
                              <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{c.pricingPlan}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={draft?.consumerRate ?? ''}
                                onChange={(e) => setCommercialDraft((prev) => prev ? { ...prev, consumerRate: Number(e.target.value) } : null)}
                                className="w-24 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            ) : (
                              <span className="font-semibold text-slate-800">₹{c.consumerRate}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={draft?.commercialRate ?? ''}
                                onChange={(e) => setCommercialDraft((prev) => prev ? { ...prev, commercialRate: Number(e.target.value) } : null)}
                                className="w-24 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            ) : (
                              <span className="font-semibold text-slate-800">₹{c.commercialRate}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => saveCommercial(c.partnerId)}
                                  disabled={savingCommercial}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                                >
                                  {savingCommercial ? <Loader2 size={11} className="animate-spin" /> : <Check size={12} />} Save
                                </button>
                                <button
                                  onClick={() => { setEditingCommercialId(null); setCommercialDraft(null); }}
                                  className="px-2.5 py-1 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingCommercialId(c.partnerId); setCommercialDraft({ ...c }); }}
                                className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors ml-auto"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {commercials.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No commercial rates configured yet. Set them from Partner Management.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Credits Modal ── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-800">Add Credits</h3>
                <p className="text-xs text-slate-500 mt-0.5">A draft invoice will be auto-created</p>
              </div>
              <button onClick={() => setAddModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Partner: <span className="font-medium text-slate-700">{addModal.partnerName}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="Reason or reference"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setAddModal(null)}
                className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredits}
                disabled={addLoading || !addAmount || Number(addAmount) <= 0}
                className="flex-1 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {addLoading ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : 'Add Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
