'use client';

import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/crm/components/AppLayout';

type CreditTransaction = {
  id: string;
  type: 'credit' | 'debit';
  credits: number;
  description: string;
  status: string;
  invoice_number?: string;
  created_at: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  credits_added: number;
  status: string;
  issued_at: string;
  notes: string;
};

type CreditStore = {
  eligibility_credits: {
    balance: number;
    total_added: number;
    total_used: number;
    per_check_cost: number;
  };
  credit_transactions?: CreditTransaction[];
  invoices?: Invoice[];
  reports: unknown[];
};

const tabs = ['Eligibility Credits', 'Wallet Ledger', 'Invoices'] as const;

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

export default function CrmSetupPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Eligibility Credits');
  const [store, setStore] = useState<CreditStore | null>(null);
  const [credits, setCredits] = useState('100');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/eligibility-check', { cache: 'no-store' });
      const json = await response.json();
      if (json.success) setStore(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStore();
  }, []);

  const addCredits = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/crm/eligibility-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'add_credits',
          credits: Number(credits || 0),
          note,
        }),
      });
      const json = await response.json();
      if (json.success) {
        setStore(json.data);
        setNote('');
      }
    } finally {
      setSaving(false);
    }
  };

  const wallet = store?.eligibility_credits;
  const transactions = useMemo(() => store?.credit_transactions || [], [store]);
  const invoices = useMemo(() => store?.invoices || [], [store]);

  return (
    <AppLayout>
      <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Setup</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Eligibility credits, wallet ledger, and invoices for the CRM.
            </p>
          </div>
          <button
            onClick={loadStore}
            className="h-8 px-3 rounded-sm border border-border bg-card text-xs font-600 text-foreground hover:bg-muted transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'h-9 px-3 rounded-sm border text-xs font-700 transition-colors',
                activeTab === tab
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            ['Available Credits', loading ? '-' : (wallet?.balance ?? 0), 'text-success'],
            ['Total Added', loading ? '-' : (wallet?.total_added ?? 0), 'text-primary'],
            ['Total Used', loading ? '-' : (wallet?.total_used ?? 0), 'text-warning'],
            ['Per Check Cost', loading ? '-' : (wallet?.per_check_cost ?? 1), 'text-foreground'],
          ].map(([label, value, color]) => (
            <div
              key={String(label)}
              className="bg-card rounded-lg border border-border shadow-card px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-700 mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {activeTab === 'Eligibility Credits' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <section className="lg:col-span-2 bg-card rounded-lg border border-border shadow-card p-5">
              <h2 className="text-base font-700 text-foreground">Add Eligibility Credits</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Credits are deducted automatically after successful eligibility checks.
              </p>
              <div className="mt-5 space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-600 text-foreground">Credits</label>
                  <input
                    type="number"
                    value={credits}
                    onChange={(event) => setCredits(event.target.value)}
                    className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-600 text-foreground">Note</label>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Payment reference or internal note"
                    className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <button
                  onClick={addCredits}
                  disabled={saving}
                  className="w-full h-10 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
                >
                  {saving ? 'Adding...' : 'Add Credits & Generate Invoice'}
                </button>
              </div>
            </section>

            <section className="lg:col-span-3 bg-card rounded-lg border border-border shadow-card p-5">
              <h2 className="text-base font-700 text-foreground">Recent Eligibility Usage</h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-4 bg-muted/40 px-4 py-2 text-[11px] font-600 uppercase tracking-wide text-muted-foreground">
                  <span>Report</span>
                  <span>Customer</span>
                  <span>Credits</span>
                  <span>Date</span>
                </div>
                {(store?.reports || []).slice(0, 8).map((item: any) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 border-t border-border px-4 py-3 text-xs"
                  >
                    <span className="font-700 text-foreground">{item.request_id}</span>
                    <span className="text-muted-foreground">{item.borrower_name}</span>
                    <span className="font-700 text-warning">{item.credits_deducted}</span>
                    <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
                  </div>
                ))}
                {!store?.reports?.length && (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No eligibility usage yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Wallet Ledger' && (
          <section className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Wallet Ledger</h2>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Date', 'Type', 'Description', 'Credits', 'Status', 'Invoice'].map((col) => (
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
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(txn.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-700 capitalize',
                            txn.type === 'credit'
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning',
                          ].join(' ')}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-600">{txn.description}</td>
                      <td className="px-4 py-3 font-700 tabular-nums">
                        {txn.type === 'credit' ? '+' : '-'}
                        {txn.credits}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{txn.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {txn.invoice_number || '-'}
                      </td>
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
          </section>
        )}

        {activeTab === 'Invoices' && (
          <section className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-700 text-foreground">Invoices</h2>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Invoice', 'Date', 'Credits', 'Amount', 'Status', 'Notes'].map((col) => (
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
                      <td className="px-4 py-3 font-700 text-foreground">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(invoice.issued_at)}
                      </td>
                      <td className="px-4 py-3 font-700">{invoice.credits_added}</td>
                      <td className="px-4 py-3 font-700 tabular-nums">₹{invoice.amount}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-700 text-success capitalize">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{invoice.notes || '-'}</td>
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
          </section>
        )}
      </div>
    </AppLayout>
  );
}
