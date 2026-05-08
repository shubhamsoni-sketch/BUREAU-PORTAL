'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/context/AuthContext';
import { useInvoice, Invoice } from '@/context/InvoiceContext';
import {
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  RefreshCw,
  Eye,
  Download,
  X,
  Calendar,
  CreditCard,
  Hash,
  Building2,
  User,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Clock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

type TabType = 'pending' | 'invoices' | 'recharges' | 'statement';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    raised: { label: 'Pending Payment', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    Pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    Cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[status] ?? config['raised'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${c.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {c.label}
    </span>
  );
}

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────

function InvoiceDetailModal({
  invoice,
  settings,
  onClose,
}: {
  invoice: Invoice;
  settings: { companyName: string; companyAddress: string; gstNumber: string | null } | null;
  onClose: () => void;
}) {
  const formattedDate = new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  function handleDownload() {
    const content = `
INVOICE
=======================================================
Invoice No : ${invoice.invoiceNumber}
Date       : ${formattedDate}
Status     : ${invoice.status === 'paid' || invoice.status === 'Paid' ? 'PAID' : 'RAISED'}
=======================================================

FROM:
${settings?.companyName ?? 'Insight'}
${settings?.companyAddress ?? ''}
${settings?.gstNumber ? `GST: ${settings.gstNumber}` : ''}

TO:
${invoice.partnerName}
${invoice.partnerEmail}
Partner ID : ${invoice.partnerId}

=======================================================
DESCRIPTION                          AMOUNT
-------------------------------------------------------
Wallet Credit Addition               ₹${invoice.amount.toLocaleString('en-IN')}
Credits Added                        ${invoice.creditsAdded.toLocaleString('en-IN')} credits
Payment Mode                         ${invoice.paymentMode}
Transaction Ref                      ${invoice.transactionRef ?? 'N/A'}
${invoice.notes ? `Notes                                ${invoice.notes}` : ''}
=======================================================
TOTAL AMOUNT                         ₹${invoice.amount.toLocaleString('en-IN')}
=======================================================

Thank you for your business!
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Invoice Preview</h2>
              <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Download size={14} />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6 space-y-6">
          {/* Company Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">{settings?.companyName ?? 'Insight'}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{settings?.companyAddress ?? ''}</p>
              {settings?.gstNumber && (
                <p className="text-xs text-muted-foreground mt-1">GST: {settings.gstNumber}</p>
              )}
            </div>
            <div className="text-right">
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Invoice Number</p>
                  <p className="text-sm font-semibold text-foreground font-mono">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Invoice Date</p>
                  <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Payment Mode</p>
                  <p className="text-sm font-medium text-foreground">{invoice.paymentMode}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Billed To</p>
                  <p className="text-sm font-semibold text-foreground">{invoice.partnerName}</p>
                  <p className="text-xs text-muted-foreground">{invoice.partnerEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Partner ID</p>
                  <p className="text-sm font-mono text-foreground">{invoice.partnerId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Description
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">Wallet Credit Addition</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {invoice.creditsAdded.toLocaleString('en-IN')} credits added to wallet
                    </p>
                    {invoice.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">Note: {invoice.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold font-mono text-foreground">
                    ₹{invoice.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
                {invoice.transactionRef && (
                  <tr className="border-b border-border bg-slate-50/50">
                    <td className="px-4 py-2 text-xs text-muted-foreground" colSpan={2}>
                      Transaction Ref: <span className="font-mono">{invoice.transactionRef}</span>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-foreground">Total Amount</td>
                  <td className="px-4 py-3 text-right font-bold text-lg font-mono text-foreground">
                    ₹{invoice.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This is a computer-generated invoice. No signature required.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({
  pendingCount,
  pendingAmount,
  paidAmount,
  walletBalance,
}: {
  pendingCount: number;
  pendingAmount: number;
  paidAmount: number;
  walletBalance: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Pending */}
      <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Clock size={20} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Pending</p>
          <p className="text-xl font-bold text-amber-600 font-mono mt-0.5">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendingCount} invoice{pendingCount !== 1 ? 's' : ''} awaiting payment
          </p>
        </div>
      </div>

      {/* Total Paid */}
      <div className="bg-white rounded-xl border border-emerald-200 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={20} className="text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Paid</p>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">
            ₹{paidAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Confirmed payments received</p>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="bg-white rounded-xl border border-blue-200 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Wallet size={20} className="text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Wallet Balance</p>
          <p className="text-xl font-bold text-blue-600 font-mono mt-0.5">
            ₹{walletBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Available credits in wallet</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { user } = useAuth();
  const { fetchPartnerInvoices, settings, fetchSettings } = useInvoice();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  // Resolve partner ID from user_id
  useEffect(() => {
    if (!user?.id) return;
    async function resolvePartner() {
      try {
        const res = await fetch(`/api/partner-wallet-data?user_id=${user!.id}`);
        const json = await res.json();
        if (json.success) {
          setTransactions((json.transactions ?? []) as WalletTransaction[]);
          setWalletBalance(json.balance ?? 0);
          if (json.partnerId) {
            setPartnerId(json.partnerId);
          }
        }
      } catch (err) {
        console.error('[Accounts] wallet data error:', err);
      }
    }
    resolvePartner();
  }, [user?.id]);

  // Fetch invoices once partnerId is resolved
  useEffect(() => {
    if (!partnerId) return;
    async function loadInvoices() {
      setLoading(true);
      try {
        const [invs] = await Promise.all([
          fetchPartnerInvoices(partnerId!),
          fetchSettings(),
        ]);
        setInvoices(invs);
      } catch (err) {
        console.error('[Accounts] invoice load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [partnerId]);

  async function handleRefresh() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const walletRes = await fetch(`/api/partner-wallet-data?user_id=${user.id}`).then((r) => r.json());
      if (walletRes.success) {
        setTransactions((walletRes.transactions ?? []) as WalletTransaction[]);
        setWalletBalance(walletRes.balance ?? 0);
        if (walletRes.partnerId) setPartnerId(walletRes.partnerId);
      }
      const currentPartnerId = walletRes.partnerId ?? partnerId;
      const invs = currentPartnerId ? await fetchPartnerInvoices(currentPartnerId) : [];
      setInvoices(invs);
    } catch (err) {
      console.error('[Accounts] refresh error:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  const isPaid = (inv: Invoice) => inv.status === 'paid' || inv.status === 'Paid';
  const isPending = (inv: Invoice) => inv.status === 'raised' || inv.status === 'Pending';

  const pendingInvoices = invoices.filter(isPending);
  const allInvoices = invoices.filter((inv) => isPending(inv) || isPaid(inv));
  const rechargeTransactions = transactions.filter((t) => t.type === 'credit');

  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(isPaid).reduce((sum, inv) => sum + inv.amount, 0);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    {
      id: 'pending',
      label: 'Pending Payments',
      icon: <AlertCircle size={14} />,
      count: pendingInvoices.length,
      color: pendingInvoices.length > 0 ? 'amber' : 'slate',
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: <FileText size={14} />,
      count: allInvoices.length,
      color: 'blue',
    },
    {
      id: 'recharges',
      label: 'Wallet Recharges',
      icon: <ArrowUpCircle size={14} />,
      count: rechargeTransactions.length,
      color: 'emerald',
    },
    {
      id: 'statement',
      label: 'Full Statement',
      icon: <Receipt size={14} />,
      count: transactions.length,
      color: 'slate',
    },
  ];

  const tabActiveClass = (color: string) => {
    if (color === 'amber') return 'border-amber-500 text-amber-600 bg-amber-50/50';
    if (color === 'emerald') return 'border-emerald-600 text-emerald-600 bg-emerald-50/50';
    if (color === 'blue') return 'border-blue-600 text-blue-600 bg-blue-50/50';
    return 'border-slate-500 text-slate-700 bg-slate-50/50';
  };

  const tabBadgeClass = (color: string, active: boolean) => {
    if (!active) return 'bg-slate-100 text-slate-500';
    if (color === 'amber') return 'bg-amber-100 text-amber-700';
    if (color === 'emerald') return 'bg-emerald-100 text-emerald-700';
    if (color === 'blue') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-200 text-slate-600';
  };

  return (
    <AppLayout role="partner">
      <Topbar
        title="Accounts"
        subtitle="Manage your invoices, payments and wallet transactions"
        role="partner"
        actions={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      <div className="max-w-6xl mx-auto space-y-6 fade-in">

        {/* Summary Cards */}
        <SummaryCards
          pendingCount={pendingInvoices.length}
          pendingAmount={pendingAmount}
          paidAmount={paidAmount}
          walletBalance={walletBalance}
        />

        {/* Tabbed Section */}
        <div className="bg-white rounded-xl border border-border">
          {/* Tab Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-0 border-b border-border overflow-x-auto">
            <div className="flex items-center gap-1 flex-shrink-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-150 -mb-px whitespace-nowrap
                      ${isActive
                        ? tabActiveClass(tab.color)
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${tabBadgeClass(tab.color, isActive)}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-x-auto">

            {/* ── PENDING PAYMENTS TAB ── */}
            {activeTab === 'pending' && (
              <>
                {pendingInvoices.length > 0 ? (
                  <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-100 flex items-center gap-2">
                    <AlertCircle size={13} className="text-amber-600" />
                    <p className="text-xs text-amber-700 font-medium">
                      You have <strong>{pendingInvoices.length}</strong> pending invoice{pendingInvoices.length !== 1 ? 's' : ''} totalling{' '}
                      <strong>₹{pendingAmount.toLocaleString('en-IN')}</strong> — please make payment to recharge your wallet
                    </p>
                  </div>
                ) : null}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Invoice No.
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount Due
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Credits
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          <RefreshCw size={16} className="animate-spin inline mr-2" />
                          Loading...
                        </td>
                      </tr>
                    ) : pendingInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                              <CheckCircle2 size={24} className="text-emerald-500" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No pending payments</p>
                            <p className="text-xs text-muted-foreground">You're all clear — no outstanding invoices</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pendingInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-mono font-medium text-foreground">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(inv.issuedAt)}
                          </td>
                          <td className="px-6 py-3.5 text-right whitespace-nowrap">
                            <span className="text-sm font-bold font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                              ₹{inv.amount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sm font-mono text-right whitespace-nowrap text-blue-700">
                            {inv.creditsAdded.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                              <Eye size={12} />
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}

            {/* ── INVOICES TAB ── */}
            {activeTab === 'invoices' && (
              <>
                <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100 flex items-center gap-2">
                  <FileText size={13} className="text-blue-600" />
                  <p className="text-xs text-blue-700 font-medium">
                    All raised and paid invoices — click View Invoice to open details or download
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Invoice No.
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Credits
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          <RefreshCw size={16} className="animate-spin inline mr-2" />
                          Loading invoices...
                        </td>
                      </tr>
                    ) : allInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No invoices found. Invoices will appear here once your admin raises them.
                        </td>
                      </tr>
                    ) : (
                      allInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-mono font-medium text-foreground">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(inv.issuedAt)}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-semibold font-mono text-right whitespace-nowrap text-foreground">
                            ₹{inv.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-mono text-right whitespace-nowrap text-blue-700">
                            {inv.creditsAdded.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <Eye size={12} />
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}

            {/* ── WALLET RECHARGES TAB ── */}
            {activeTab === 'recharges' && (
              <>
                <div className="px-6 py-3 bg-emerald-50/40 border-b border-emerald-100 flex items-center gap-2">
                  <ArrowUpCircle size={13} className="text-emerald-600" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Showing all wallet recharges — credits added to your wallet after payment confirmation
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Description
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount Credited
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          <RefreshCw size={16} className="animate-spin inline mr-2" />
                          Loading...
                        </td>
                      </tr>
                    ) : rechargeTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No wallet recharges yet.
                        </td>
                      </tr>
                    ) : (
                      rechargeTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                            {formatDate(txn.created_at)}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-foreground max-w-[260px] truncate">
                            {txn.description}
                          </td>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}

            {/* ── FULL STATEMENT TAB ── */}
            {activeTab === 'statement' && (
              <>
                <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2">
                  <BarChart3 size={13} className="text-slate-500" />
                  <p className="text-xs text-slate-600 font-medium">
                    Complete account statement — all credits (recharges) and debits (Bureau pulls) in chronological order
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Description
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Type
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Credit
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Debit
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          <RefreshCw size={16} className="animate-spin inline mr-2" />
                          Loading...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                            {formatDate(txn.created_at)}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-foreground max-w-[200px] truncate">
                            {txn.description}
                          </td>
                          <td className="px-6 py-3.5">
                            {txn.type === 'credit' ? (
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
                                ${
                                  txn.status === 'pending' ?'bg-amber-50 text-amber-700 border border-amber-200' :'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
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
                            {txn.status === 'pending' ?'—'
                              : txn.running_balance != null
                              ? `₹${Number(txn.running_balance).toLocaleString('en-IN')}`
                              : '—'}
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </AppLayout>
  );
}
