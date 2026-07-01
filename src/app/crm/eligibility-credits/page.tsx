'use client';

import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/crm/components/AppLayout';
import { crmFetch } from '@/lib/crm/api';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Receipt,
  Send,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

type WalletTransaction = {
  id: string;
  created_at: string;
  type: 'credit' | 'debit' | string;
  amount: number | string;
  description?: string | null;
  transaction_type?: string | null;
  running_balance?: number | string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

type Invoice = {
  id: string;
  invoice_number?: string | null;
  amount?: number | string | null;
  credits_added?: number | string | null;
  status?: string | null;
  issued_at?: string | null;
  payment_mode?: string | null;
  transaction_ref?: string | null;
  notes?: string | null;
};

type Commercials = {
  pricing_plan?: string | null;
  subscription_type?: string | null;
  consumer_credit_rate?: number | string | null;
  commercial_credit_rate?: number | string | null;
  credit_rate?: number | string | null;
  credit_limit?: number | string | null;
};

type CrmCreditsContext = {
  partner: {
    id: string;
    name?: string | null;
    company_name?: string | null;
    partner_code?: string | null;
  };
  scope: {
    partnerId: string | null;
    userId: string | null;
    isDemo: boolean;
  };
  wallet: {
    balance: number;
    adminBalance: number;
    totalRecharged: number;
    totalDeducted: number;
    transactions: WalletTransaction[];
  };
  invoices: Invoice[];
  commercials: Commercials | null;
};

type TabType = 'recharges' | 'statement' | 'invoices';

const LOW_BALANCE_THRESHOLD = 200;

const money = (value?: number | string | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value)
      .toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(',', '');
  } catch {
    return value;
  }
};

function invoiceStatusClass(status?: string | null) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (normalized === 'raised') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (normalized === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function CrmEligibilityCreditsPage() {
  const [context, setContext] = useState<CrmCreditsContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('recharges');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditAmountError, setCreditAmountError] = useState('');
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState(false);

  const loadCreditsData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await crmFetch('/api/crm/context', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setMessage(json.error || 'Unable to load eligibility credits');
        setContext(null);
        return;
      }
      setContext(json.data);
      setMessage(json.message || '');
    } catch {
      setMessage('Unable to load eligibility credits');
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreditsData();
  }, []);

  const wallet = context?.wallet;
  const transactions = useMemo(() => wallet?.transactions || [], [wallet]);
  const rechargeTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'credit'),
    [transactions]
  );
  const debitTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'debit'),
    [transactions]
  );
  const invoices = useMemo(() => context?.invoices || [], [context]);
  const commercials = context?.commercials;
  const perCheckRate =
    commercials?.consumer_credit_rate ??
    commercials?.credit_rate ??
    commercials?.commercial_credit_rate ??
    null;
  const balance = Number(wallet?.balance || 0);
  const isLowBalance = !loading && balance < LOW_BALANCE_THRESHOLD;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'recharges',
      label: 'Credit Recharges',
      icon: <ArrowUpCircle size={14} />,
      count: rechargeTransactions.length,
    },
    {
      id: 'statement',
      label: 'Usage Statement',
      icon: <Receipt size={14} />,
      count: transactions.length,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: <FileText size={14} />,
      count: invoices.length,
    },
  ];

  const handleCreditRequest = async () => {
    setCreditAmountError('');
    const amount = Number(creditAmount);
    if (!creditAmount || Number.isNaN(amount) || amount < 10000) {
      setCreditAmountError('Minimum credit request amount is ₹10,000');
      return;
    }
    if (!context?.scope.userId && !context?.scope.partnerId) {
      setCreditAmountError('Partner account is not linked yet');
      return;
    }

    setCreditSubmitting(true);
    try {
      const response = await crmFetch('/api/request-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: context.scope.userId,
          partner_id: context.scope.partnerId,
          amount,
          note: creditNote,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setCreditAmountError(json.error || 'Failed to submit request. Please try again.');
        return;
      }
      setCreditSuccess(true);
      setCreditAmount('');
      setCreditNote('');
      setTimeout(() => setCreditSuccess(false), 6000);
      await loadCreditsData();
    } catch {
      setCreditAmountError('Network error. Please try again.');
    } finally {
      setCreditSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-800 uppercase tracking-[0.18em] text-primary">Setup</p>
            <h1 className="text-3xl font-800 text-foreground mt-1">Eligibility Credits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Request credits, track admin invoices, and monitor eligibility-check usage from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={[
                'flex items-center gap-2 rounded-lg border px-3 py-2',
                isLowBalance ? 'border-red-200 bg-red-50' : 'border-border bg-card',
              ].join(' ')}
            >
              <Wallet size={15} className={isLowBalance ? 'text-red-500' : 'text-muted-foreground'} />
              <span className="text-xs text-muted-foreground">Available:</span>
              <span className={`text-sm font-800 tabular-nums ${isLowBalance ? 'text-red-600' : 'text-foreground'}`}>
                {money(balance)}
              </span>
            </div>
            <button
              onClick={loadCreditsData}
              className="h-9 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-800 text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-700 text-amber-700">
            {message}
          </div>
        )}

        {isLowBalance && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle size={18} className="text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-800 text-red-700">Low Eligibility Credit Balance</p>
              <p className="text-xs text-red-600 mt-0.5">
                Request credits before running more eligibility checks. Admin will approve, raise invoice, and credit your balance after payment.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard
                title="Available Credits"
                value={money(balance)}
                icon={<Wallet size={15} />}
                tone={isLowBalance ? 'danger' : 'dark'}
                note={isLowBalance ? 'Low balance' : 'Ready to use'}
              />
              <MetricCard
                title="Credits Recharged"
                value={money(wallet?.totalRecharged)}
                icon={<ArrowUpCircle size={15} />}
                tone="success"
                note={`${rechargeTransactions.filter((txn) => txn.status !== 'pending').length} credited recharge${rechargeTransactions.length === 1 ? '' : 's'}`}
              />
              <MetricCard
                title="Usage Deducted"
                value={money(wallet?.totalDeducted)}
                icon={<ArrowDownCircle size={15} />}
                tone="warning"
                note={`${debitTransactions.length} eligibility check${debitTransactions.length === 1 ? '' : 's'}`}
              />
              <MetricCard
                title="Per Check Rate"
                value={perCheckRate === null ? '-' : money(perCheckRate)}
                icon={<ShieldCheck size={15} />}
                tone="primary"
                note={commercials?.pricing_plan ? `${commercials.pricing_plan} plan` : 'Admin configured'}
              />
            </div>

            <section className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 pt-4 border-b border-border">
                <div className="pb-4">
                  <h2 className="text-base font-800 text-foreground">Eligibility Credit Account</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Same CreditTrust admin flow: request, invoice, payment mark, then balance update.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-xs font-800 transition-colors',
                        activeTab === tab.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                      ].join(' ')}
                    >
                      {tab.icon}
                      {tab.label}
                      <span
                        className={[
                          'rounded-full px-1.5 py-0.5 text-[10px] font-800',
                          activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                        ].join(' ')}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                {activeTab === 'recharges' && (
                  <RechargeTable loading={loading} transactions={rechargeTransactions} />
                )}
                {activeTab === 'statement' && (
                  <StatementTable loading={loading} transactions={transactions} />
                )}
                {activeTab === 'invoices' && <InvoiceTable loading={loading} invoices={invoices} />}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="bg-card rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Send size={17} />
                </div>
                <div>
                  <h2 className="text-base font-800 text-foreground">Request Credits</h2>
                  <p className="text-xs text-muted-foreground">Sent to CreditTrust admin for approval</p>
                </div>
              </div>

              {creditSuccess ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-800 text-emerald-800">Request Submitted</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Admin will approve the request, raise invoice, and credit balance after payment is marked paid.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-700 text-foreground mb-1.5">
                      Amount Requested <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-800 text-muted-foreground">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={10000}
                        step={1000}
                        value={creditAmount}
                        onChange={(event) => {
                          setCreditAmount(event.target.value);
                          setCreditAmountError('');
                        }}
                        placeholder="10000"
                        className={[
                          'w-full rounded-lg border bg-background py-2.5 pl-7 pr-3 text-sm font-700 text-foreground outline-none transition-all focus:ring-2',
                          creditAmountError
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-border focus:border-primary focus:ring-primary/20',
                        ].join(' ')}
                      />
                    </div>
                    {creditAmountError ? (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-700 text-red-600">
                        <AlertTriangle size={11} />
                        {creditAmountError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">Minimum request: ₹10,000</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-700 text-foreground mb-1.5">Note for admin</label>
                    <textarea
                      value={creditNote}
                      onChange={(event) => setCreditNote(event.target.value)}
                      rows={3}
                      placeholder="Example: Need credits for this week's eligibility checks"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleCreditRequest}
                    disabled={creditSubmitting || loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-800 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
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
            </section>

            <section className="bg-card rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Receipt size={16} className="text-primary" />
                <h2 className="text-base font-800 text-foreground">How Credits Are Added</h2>
              </div>
              <div className="space-y-3">
                {[
                  'You submit an eligibility credit request.',
                  'CreditTrust admin approves it and raises invoice.',
                  'After payment is received, admin marks invoice paid.',
                  'Credits are added automatically to this account.',
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-900 text-primary">
                      {index + 1}
                    </span>
                    <p className="text-xs font-600 leading-relaxed text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({
  title,
  value,
  icon,
  tone,
  note,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: 'dark' | 'success' | 'warning' | 'primary' | 'danger';
  note: string;
}) {
  const toneMap = {
    dark: 'bg-slate-900 text-white border-slate-900',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    primary: 'bg-blue-50 text-blue-700 border-blue-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className={`rounded-xl border p-5 ${toneMap[tone]}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-current">
          {icon}
        </div>
        <span className={`text-xs font-800 uppercase tracking-wide ${tone === 'dark' ? 'text-slate-300' : 'text-current/70'}`}>
          {title}
        </span>
      </div>
      <p className="text-2xl font-900 tabular-nums">{value}</p>
      <p className={`mt-1 text-xs font-700 ${tone === 'dark' ? 'text-slate-300' : 'text-current/70'}`}>{note}</p>
    </div>
  );
}

function RechargeTable({ loading, transactions }: { loading: boolean; transactions: WalletTransaction[] }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/60 px-5 py-3">
        <ArrowUpCircle size={13} className="text-emerald-600" />
        <p className="text-xs font-800 text-emerald-700">
          Credits added by admin after invoice payment is marked paid.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Date', 'Description', 'Status', 'Credits Added', 'Balance After'].map((header) => (
              <th key={header} className="px-5 py-3 text-left text-[10px] font-800 uppercase tracking-wide text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <LoadingRow colSpan={5} />
          ) : transactions.length === 0 ? (
            <EmptyRow colSpan={5} label="No eligibility credit recharges yet." />
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(transaction.created_at)}</td>
                <td className="px-5 py-3.5 text-sm font-700 text-foreground max-w-[260px] truncate">{transaction.description || '-'}</td>
                <td className="px-5 py-3.5">
                  {transaction.status === 'pending' ? (
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-800 text-amber-700">
                      Payment Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-800 text-emerald-700">
                      <ArrowUpCircle size={10} />
                      Credits Added
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-900 tabular-nums text-emerald-600">
                  +{money(transaction.amount)}
                </td>
                <td className="px-5 py-3.5 text-right text-xs font-700 tabular-nums text-muted-foreground">
                  {transaction.status === 'pending' || transaction.running_balance === null || transaction.running_balance === undefined
                    ? '-'
                    : money(transaction.running_balance)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

function StatementTable({ loading, transactions }: { loading: boolean; transactions: WalletTransaction[] }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-3">
        <BarChart3 size={13} className="text-muted-foreground" />
        <p className="text-xs font-800 text-muted-foreground">
          Complete statement for eligibility credit recharges and eligibility-check deductions.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Date', 'Description', 'Type', 'Credit', 'Debit', 'Balance'].map((header) => (
              <th key={header} className="px-5 py-3 text-left text-[10px] font-800 uppercase tracking-wide text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <LoadingRow colSpan={6} />
          ) : transactions.length === 0 ? (
            <EmptyRow colSpan={6} label="No eligibility credit transactions yet." />
          ) : (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(transaction.created_at)}</td>
                <td className="px-5 py-3.5 text-sm font-700 text-foreground max-w-[240px] truncate">{transaction.description || transaction.transaction_type || '-'}</td>
                <td className="px-5 py-3.5">
                  {transaction.type === 'credit' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-800 text-emerald-700">
                      <ArrowUpCircle size={10} />
                      Recharge
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-800 text-red-700">
                      <ArrowDownCircle size={10} />
                      Eligibility Check
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-900 tabular-nums text-emerald-600">
                  {transaction.type === 'credit' ? `+${money(transaction.amount)}` : '-'}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-900 tabular-nums text-red-600">
                  {transaction.type === 'debit' ? `-${money(transaction.amount)}` : '-'}
                </td>
                <td className="px-5 py-3.5 text-right text-xs font-700 tabular-nums text-muted-foreground">
                  {transaction.status === 'pending' || transaction.running_balance === null || transaction.running_balance === undefined
                    ? '-'
                    : money(transaction.running_balance)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

function InvoiceTable({ loading, invoices }: { loading: boolean; invoices: Invoice[] }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/50 px-5 py-3">
        <FileText size={13} className="text-blue-600" />
        <p className="text-xs font-800 text-blue-700">
          Invoices are generated from the same CreditTrust admin approval workflow.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Invoice', 'Date', 'Credits', 'Amount', 'Status', 'Reference'].map((header) => (
              <th key={header} className="px-5 py-3 text-left text-[10px] font-800 uppercase tracking-wide text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <LoadingRow colSpan={6} />
          ) : invoices.length === 0 ? (
            <EmptyRow colSpan={6} label="No invoices generated yet." />
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5 text-sm font-900 text-foreground">{invoice.invoice_number || '-'}</td>
                <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">{formatDate(invoice.issued_at)}</td>
                <td className="px-5 py-3.5 text-sm font-800 tabular-nums">{invoice.credits_added ?? '-'}</td>
                <td className="px-5 py-3.5 text-sm font-900 tabular-nums">{money(invoice.amount)}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-800 capitalize ${invoiceStatusClass(invoice.status)}`}>
                    {invoice.status || '-'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">
                  {invoice.transaction_ref || invoice.payment_mode || invoice.notes || '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm font-700 text-muted-foreground">
        <RefreshCw size={16} className="animate-spin inline mr-2" />
        Loading...
      </td>
    </tr>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm font-700 text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}
