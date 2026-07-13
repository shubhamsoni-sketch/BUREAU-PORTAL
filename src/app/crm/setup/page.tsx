'use client';

import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/crm/components/AppLayout';
import { crmFetch } from '@/lib/crm/api';

type Partner = {
  id: string;
  user_id?: string | null;
  partner_code?: string | null;
  name?: string | null;
  company_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  city?: string | null;
  status?: string | null;
  wallet_balance?: number | null;
  reports_pulled?: number | null;
  pricing_plan?: string | null;
  created_at?: string | null;
};

type WalletTransaction = {
  id: string;
  type: 'credit' | 'debit' | string;
  amount: number;
  description?: string | null;
  transaction_type?: string | null;
  running_balance?: number | null;
  status?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

type Invoice = {
  id: string;
  invoice_number?: string | null;
  amount?: number | null;
  credits_added?: number | null;
  status?: string | null;
  issued_at?: string | null;
  notes?: string | null;
  payment_mode?: string | null;
  transaction_ref?: string | null;
};

type Agreement = {
  id: string;
  status?: string | null;
  file_name?: string | null;
  signed_at?: string | null;
  created_at?: string | null;
  uploaded_at?: string | null;
  signer_name?: string | null;
};

type Commercials = {
  pricing_plan?: string | null;
  subscription_type?: string | null;
  consumer_credit_rate?: number | null;
  commercial_credit_rate?: number | null;
  bundled_credits?: number | null;
  credit_limit?: number | null;
  credit_rate?: number | null;
  notes?: string | null;
};

type CrmContext = {
  partner: Partner;
  scope?: {
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
  agreement: Agreement | null;
  commercials: Commercials | null;
};

type OnboardingTab = 'profile' | 'wallet' | 'invoice' | 'agreement';

const onboardingTabs: { id: OnboardingTab; label: string }[] = [
  { id: 'profile', label: 'DSA Profile' },
  { id: 'wallet', label: 'Wallet Management' },
  { id: 'invoice', label: 'Invoice & Accounting' },
  { id: 'agreement', label: 'Agreement' },
];

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const money = (value?: number | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const text = (value?: string | number | null) => (value === null || value === undefined || value === '' ? '-' : String(value));

export default function CrmSetupPage() {
  const [activeTab, setActiveTab] = useState<OnboardingTab>('profile');
  const [context, setContext] = useState<CrmContext | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditError, setCreditError] = useState('');
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState(false);

  const loadContext = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await crmFetch('/api/crm/context', { cache: 'no-store' });
      const json = await response.json();
      if (json.success) {
        setContext(json.data);
        setMessage(json.message || '');
      } else {
        setMessage(json.error || 'Unable to load onboarding setup');
      }
    } catch (error) {
      setMessage('Unable to load onboarding setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'wallet') {
      setActiveTab('wallet');
    }
    loadContext();
  }, []);

  const partner = context?.partner;
  const wallet = context?.wallet;
  const commercials = context?.commercials;
  const transactions = useMemo(() => wallet?.transactions || [], [wallet]);
  const invoices = useMemo(() => context?.invoices || [], [context]);
  const latestInvoice = invoices[0];
  const agreement = context?.agreement;
  const perCheckRate =
    commercials?.consumer_credit_rate ??
    commercials?.credit_rate ??
    commercials?.commercial_credit_rate ??
    null;

  const submitCreditRequest = async () => {
    setCreditError('');
    const amount = Number(creditAmount);
    if (!creditAmount || Number.isNaN(amount) || amount < 10000) {
      setCreditError('Minimum credit request amount is ₹10,000');
      return;
    }
    if (!context?.scope?.userId && !context?.scope?.partnerId) {
      setCreditError('Partner account is not linked yet');
      return;
    }

    setCreditSubmitting(true);
    try {
      const response = await crmFetch('/api/request-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: context.scope?.userId,
          partner_id: context.scope?.partnerId || partner?.id,
          amount,
          note: creditNote,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setCreditError(json.error || 'Failed to submit request');
        return;
      }
      setCreditSuccess(true);
      setCreditAmount('');
      setCreditNote('');
      setTimeout(() => setCreditSuccess(false), 5000);
      await loadContext();
    } catch {
      setCreditError('Network error. Please try again.');
    } finally {
      setCreditSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Setup</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              CreditTrust admin linked onboarding, wallet, invoice, and agreement setup.
            </p>
          </div>
          <button
            onClick={loadContext}
            className="h-8 px-3 rounded-sm border border-border bg-card text-xs font-600 text-foreground hover:bg-muted transition-colors"
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-600 text-warning">
            {message}
          </div>
        )}

        <section className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-800 text-foreground">Onboarding Setup</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Data is synced from the existing CreditTrust admin partner record.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {onboardingTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'h-8 rounded-sm border px-3 text-xs font-700 transition-colors',
                      activeTab === tab.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5">
            {loading && (
              <div className="rounded-sm border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Loading onboarding setup...
              </div>
            )}

            {!loading && !context && (
              <div className="rounded-sm border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No partner onboarding data found yet.
              </div>
            )}

            {!loading && context && activeTab === 'profile' && (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-800 text-foreground">DSA Profile</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created from the approved CreditTrust partner onboarding record.
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-800 text-success">
                    {text(partner?.status || 'Admin Linked')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
                  {[
                    ['Company Name', partner?.company_name],
                    ['Authorised Person', partner?.name],
                    ['Partner Code', partner?.partner_code],
                    ['Email', partner?.email],
                    ['Mobile', partner?.mobile],
                    ['City', partner?.city],
                    ['Pricing Plan', commercials?.pricing_plan || partner?.pricing_plan],
                    ['Subscription', commercials?.subscription_type],
                    ['Created On', formatDate(partner?.created_at)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-sm border border-border bg-muted/20 p-3">
                      <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-700 text-foreground">{text(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && context && activeTab === 'wallet' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ['Available Balance', money(wallet?.balance), 'text-success'],
                    ['Total Recharged', money(wallet?.totalRecharged), 'text-primary'],
                    ['Total Deducted', money(wallet?.totalDeducted), 'text-warning'],
                    ['Per Check Rate', perCheckRate === null ? '-' : money(perCheckRate), 'text-foreground'],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-sm border border-border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-xl font-800 mt-1 ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-800 text-foreground">Request Eligibility Credits</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Request goes to CreditTrust admin. Admin approves, raises invoice, marks payment, then credits are added.
                      </p>
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-800 text-success">
                      Existing Admin Flow
                    </span>
                  </div>
                  <div className="p-5">
                    {creditSuccess ? (
                      <div className="rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm font-700 text-success">
                        Credit request submitted. Admin will process approval and invoice.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_auto] gap-3 items-start">
                        <div>
                          <label className="block text-[10px] font-700 uppercase tracking-wide text-muted-foreground mb-1.5">
                            Amount
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
                                setCreditError('');
                              }}
                              placeholder="10000"
                              className="h-10 w-full rounded-sm border border-border bg-card pl-7 pr-3 text-sm font-700 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <p className="mt-1 text-[10px] font-600 text-muted-foreground">Minimum ₹10,000</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-700 uppercase tracking-wide text-muted-foreground mb-1.5">
                            Note
                          </label>
                          <input
                            value={creditNote}
                            onChange={(event) => setCreditNote(event.target.value)}
                            placeholder="Optional note for admin"
                            className="h-10 w-full rounded-sm border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                          {creditError && <p className="mt-1 text-[10px] font-700 text-danger">{creditError}</p>}
                        </div>
                        <button
                          onClick={submitCreditRequest}
                          disabled={creditSubmitting}
                          className="h-10 rounded-sm bg-primary px-4 text-xs font-800 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 lg:mt-5"
                        >
                          {creditSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-800 text-foreground">Wallet Ledger</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recharge, deduction, and running balance from CreditTrust admin.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-800 text-primary">
                      Admin Controlled
                    </span>
                  </div>
                  <LedgerTable transactions={transactions} />
                </div>
              </div>
            )}

            {!loading && context && activeTab === 'invoice' && (
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-800 text-foreground">Invoice & Accounting</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Invoices generated from the existing CreditTrust admin billing flow.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                      Latest Invoice
                    </p>
                    <p className="text-xs font-800 text-foreground">
                      {latestInvoice?.invoice_number || '-'}
                    </p>
                  </div>
                </div>
                <InvoiceTable invoices={invoices} />
              </div>
            )}

            {!loading && context && activeTab === 'agreement' && (
              <div>
                <h3 className="text-sm font-800 text-foreground">Agreement</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Agreement assignment and signature are controlled from CreditTrust admin.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                  {[
                    ['Agreement File', agreement?.file_name],
                    ['Signature Status', agreement?.status],
                    ['Signer Name', agreement?.signer_name],
                    ['Assigned On', formatDate(agreement?.created_at || agreement?.uploaded_at)],
                    ['Signed On', formatDate(agreement?.signed_at)],
                    ['Partner Code', partner?.partner_code],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-sm border border-border bg-muted/20 p-3">
                      <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-700 text-foreground">{text(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function LedgerTable({ transactions }: { transactions: WalletTransaction[] }) {
  return (
    <>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {['Date', 'Type', 'Description', 'Amount', 'Balance', 'Status'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-[10px] font-600 uppercase tracking-wide text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.slice(0, 20).map((txn) => (
              <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{formatDate(txn.created_at)}</td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex rounded-full px-2 py-0.5 text-[10px] font-700 capitalize',
                      txn.type === 'credit' ?'bg-success/10 text-success' :'bg-warning/10 text-warning',
                    ].join(' ')}
                  >
                    {txn.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground font-600">
                  {txn.description || txn.transaction_type || '-'}
                </td>
                <td className="px-4 py-3 font-700 tabular-nums">
                  {txn.type === 'credit' ? '+' : '-'}
                  {money(txn.amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {txn.running_balance === null || txn.running_balance === undefined
                    ? '-'
                    : money(txn.running_balance)}
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{txn.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!transactions.length && (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          No wallet transactions yet.
        </div>
      )}
    </>
  );
}

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {['Invoice', 'Date', 'Credits', 'Amount', 'Status', 'Reference'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-[10px] font-600 uppercase tracking-wide text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-700 text-foreground">{invoice.invoice_number || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.issued_at)}</td>
                <td className="px-4 py-3 font-700">{invoice.credits_added ?? '-'}</td>
                <td className="px-4 py-3 font-700 tabular-nums">{money(invoice.amount)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-700 text-success capitalize">
                    {invoice.status || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {invoice.transaction_ref || invoice.payment_mode || invoice.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!invoices.length && (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          No invoices generated yet.
        </div>
      )}
    </>
  );
}
