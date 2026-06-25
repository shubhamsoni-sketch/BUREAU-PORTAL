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

type SetupTab = 'onboarding' | 'access' | 'bureau';
type OnboardingSection = 'profile' | 'wallet' | 'invoices' | 'agreement';

const setupTabs: { id: SetupTab; label: string; description: string }[] = [
  {
    id: 'onboarding',
    label: 'Onboarding',
    description: 'DSA profile, wallet, invoices, accounting, and agreement',
  },
  {
    id: 'access',
    label: 'Access Control',
    description: 'Team users and module permissions',
  },
  {
    id: 'bureau',
    label: 'Bureau Setup',
    description: 'Eligibility engine and lender workflow settings',
  },
];

const onboardingSections: {
  id: OnboardingSection;
  label: string;
  helper: string;
}[] = [
  {
    id: 'profile',
    label: 'DSA Profile',
    helper: 'Company and owner identity created from CreditTrust admin onboarding',
  },
  {
    id: 'wallet',
    label: 'Wallet Management',
    helper: 'Eligibility credits, usage, and recharge ledger',
  },
  {
    id: 'invoices',
    label: 'Invoice & Accounting',
    helper: 'Invoices generated against wallet credits and payments',
  },
  {
    id: 'agreement',
    label: 'Agreement',
    helper: 'Partner agreement status and compliance handoff',
  },
];

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

export default function CrmSetupPage() {
  const [activeTab, setActiveTab] = useState<SetupTab>('onboarding');
  const [activeSection, setActiveSection] = useState<OnboardingSection>('profile');
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
  const latestInvoice = invoices[0];

  return (
    <AppLayout>
      <div className="px-4 lg:px-6 xl:px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Setup</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Control center for partner onboarding, access, credits, accounting, and bureau setup.
            </p>
          </div>
          <button
            onClick={loadStore}
            className="h-8 px-3 rounded-sm border border-border bg-card text-xs font-600 text-foreground hover:bg-muted transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
          {setupTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-lg border p-4 text-left transition-colors',
                activeTab === tab.id
                  ? 'border-primary bg-primary/5 shadow-card'
                  : 'border-border bg-card hover:bg-muted/30',
              ].join(' ')}
            >
              <p
                className={[
                  'text-sm font-800',
                  activeTab === tab.id ? 'text-primary' : 'text-foreground',
                ].join(' ')}
              >
                {tab.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tab.description}
              </p>
            </button>
          ))}
        </div>

        {activeTab === 'onboarding' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
            <aside className="xl:col-span-1 bg-card rounded-lg border border-border shadow-card p-3 h-fit">
              {onboardingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={[
                    'w-full rounded-sm px-3 py-3 text-left transition-colors mb-1',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(' ')}
                >
                  <p className="text-xs font-800">{section.label}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed">{section.helper}</p>
                </button>
              ))}
            </aside>

            <div className="xl:col-span-3 space-y-5">
              {activeSection === 'profile' && (
                <section className="bg-card rounded-lg border border-border shadow-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-800 text-foreground">DSA Profile</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        This profile should come from the approved CreditTrust partner onboarding
                        record. CRM users and files will sit under this workspace.
                      </p>
                    </div>
                    <span className="rounded-full bg-warning/10 px-2 py-1 text-[10px] font-800 text-warning">
                      Admin Linked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                    {[
                      ['Company Name', 'From partners.company_name'],
                      ['Authorised Person', 'From partners.name'],
                      ['Partner Code', 'From partners.partner_code'],
                      ['Partner Status', 'Approved / Disabled from admin'],
                      ['Pricing Plan', 'From partner commercials'],
                      ['Workspace Scope', 'Leads, team, files, reports'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-sm border border-border bg-muted/20 p-3">
                        <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-700 text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeSection === 'wallet' && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    <section className="lg:col-span-2 bg-card rounded-lg border border-border shadow-card p-5">
                      <h2 className="text-base font-800 text-foreground">
                        Add Eligibility Credits
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Credits are deducted after successful eligibility checks.
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

                    <section className="lg:col-span-3 bg-card rounded-lg border border-border shadow-card overflow-hidden">
                      <div className="px-5 py-4 border-b border-border">
                        <h2 className="text-base font-800 text-foreground">Wallet Ledger</h2>
                      </div>
                      <LedgerTable transactions={transactions} />
                    </section>
                  </div>
                </>
              )}

              {activeSection === 'invoices' && (
                <section className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-800 text-foreground">Invoice & Accounting</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Invoices generated for eligibility credits and wallet recharges.
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
                </section>
              )}

              {activeSection === 'agreement' && (
                <section className="bg-card rounded-lg border border-border shadow-card p-5">
                  <h2 className="text-base font-800 text-foreground">Agreement</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agreement assignment and signature are controlled from CreditTrust admin. CRM
                    should only show the workspace compliance state here.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                    {[
                      ['Agreement Assigned', 'Admin Agreements'],
                      ['Signature Status', 'Pending / Signed'],
                      ['Portal Access', 'Blocked until signed when enforced'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-sm border border-border bg-muted/20 p-3">
                        <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-700 text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <section className="bg-card rounded-lg border border-border shadow-card p-5">
            <h2 className="text-base font-800 text-foreground">Access Control</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Team users, role permissions, and active/inactive access are managed from Team
              Management. Credentials will be connected to the approved partner workspace.
            </p>
            <a
              href="/crm/team-management"
              className="inline-flex mt-4 h-9 items-center rounded-sm bg-primary px-4 text-sm font-700 text-primary-foreground hover:bg-primary/90"
            >
              Open Team Management
            </a>
          </section>
        )}

        {activeTab === 'bureau' && (
          <section className="bg-card rounded-lg border border-border shadow-card p-5">
            <h2 className="text-base font-800 text-foreground">Bureau Setup</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Eligibility checker, lender policy, and bureau consumption settings will stay here.
              Credits and accounting remain inside Onboarding.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
              {[
                ['Eligibility Engine', 'Active'],
                ['Lender Policy', 'Configured from Lender Management'],
                ['Report Usage', `${store?.reports?.length || 0} checks`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-sm border border-border bg-muted/20 p-3">
                  <p className="text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-800 text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

function LedgerTable({ transactions }: { transactions: CreditTransaction[] }) {
  return (
    <>
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
            {transactions.slice(0, 10).map((txn) => (
              <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{formatDate(txn.created_at)}</td>
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
                <td className="px-4 py-3 text-muted-foreground">{txn.invoice_number || '-'}</td>
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
                <td className="px-4 py-3 font-700 text-foreground">{invoice.invoice_number}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.issued_at)}</td>
                <td className="px-4 py-3 font-700">{invoice.credits_added}</td>
                <td className="px-4 py-3 font-700 tabular-nums">Rs {invoice.amount}</td>
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
    </>
  );
}
