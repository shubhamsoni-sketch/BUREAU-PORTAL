'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/crm/components/AppLayout';

type CreditStore = {
  eligibility_credits: {
    balance: number;
    total_added: number;
    total_used: number;
    per_check_cost: number;
  };
  reports: unknown[];
};

export default function EligibilityCreditsPage() {
  const [store, setStore] = useState<CreditStore | null>(null);
  const [credits, setCredits] = useState('100');
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
        body: JSON.stringify({ action: 'add_credits', credits: Number(credits || 0) }),
      });
      const json = await response.json();
      if (json.success) setStore(json.data);
    } finally {
      setSaving(false);
    }
  };

  const wallet = store?.eligibility_credits;

  return (
    <AppLayout>
      <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Eligibility Credits</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Wallet setup for Bureau eligibility checks.
            </p>
          </div>
          <button
            onClick={loadStore}
            className="h-8 px-3 rounded-sm border border-border bg-card text-xs font-600 text-foreground hover:bg-muted transition-colors"
          >
            Refresh
          </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 bg-card rounded-lg border border-border shadow-card p-5">
            <h2 className="text-base font-700 text-foreground">Add Credits</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Credits are deducted automatically when a bureau eligibility check succeeds.
            </p>
            <div className="mt-5 space-y-2">
              <label className="block text-sm font-600 text-foreground">Credits</label>
              <input
                type="number"
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={addCredits}
                disabled={saving}
                className="w-full h-10 rounded-sm bg-primary text-primary-foreground text-sm font-700 hover:bg-primary/90 active:scale-95 transition-all duration-150 disabled:opacity-60"
              >
                {saving ? 'Adding...' : 'Add Eligibility Credits'}
              </button>
            </div>
          </section>

          <section className="lg:col-span-3 bg-card rounded-lg border border-border shadow-card p-5">
            <h2 className="text-base font-700 text-foreground">Usage Summary</h2>
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
                  <span className="text-muted-foreground">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '-'}
                  </span>
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
      </div>
    </AppLayout>
  );
}
