'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { Activity, Ban, CircleDollarSign, Copy, KeyRound, Plus, RefreshCw, Server, ShieldCheck, WalletCards } from 'lucide-react';

type ApiClient = {
  id: string;
  name: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  mobile: string | null;
  status: 'active' | 'suspended';
  created_at: string;
};

type ApiProduct = {
  id: string;
  code: string;
  name: string;
  default_price: number;
  default_sandbox_credits: number;
  is_active: boolean;
};

type ApiKey = {
  id: string;
  client_id: string;
  product_id: string;
  label: string | null;
  key_prefix: string;
  environment: 'sandbox' | 'live';
  status: 'active' | 'revoked';
  rate_limit_per_minute: number;
  last_used_at: string | null;
  created_at: string;
};

type ApiWallet = {
  id: string;
  client_id: string;
  live_balance: number;
  sandbox_credits: number;
  low_balance_threshold: number;
};

type ApiUsageLog = {
  id: string;
  client_id: string;
  product_id: string;
  environment: 'sandbox' | 'live';
  request_id: string;
  status: 'pending' | 'success' | 'failed';
  charged: boolean;
  amount_charged: number;
  sandbox_credits_charged: number;
  masked_pan: string | null;
  masked_mobile: string | null;
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
};

type ApiHubData = {
  clients: ApiClient[];
  products: ApiProduct[];
  keys: ApiKey[];
  wallets: ApiWallet[];
  logs: ApiUsageLog[];
  gateway: { gateway_base_url: string; status: string; last_health_message: string | null } | null;
};

const emptyData: ApiHubData = {
  clients: [],
  products: [],
  keys: [],
  wallets: [],
  logs: [],
  gateway: null,
};

const tabs = ['Overview', 'Clients', 'Keys', 'Sandbox', 'Usage'] as const;

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function money(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function AdminApiHubPage() {
  const [data, setData] = useState<ApiHubData>(emptyData);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [latestKey, setLatestKey] = useState('');

  const [clientForm, setClientForm] = useState({
    name: '',
    company_name: '',
    contact_name: '',
    email: '',
    mobile: '',
    sandbox_credits: '10',
  });
  const [keyForm, setKeyForm] = useState({
    client_id: '',
    environment: 'sandbox',
    label: '',
    rate_limit_per_minute: '60',
  });
  const [creditForm, setCreditForm] = useState({
    client_id: '',
    environment: 'sandbox',
    sandbox_credits: '10',
    amount: '1000',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/admin-api-hub', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to load API Hub');
      setData({
        clients: json.clients || [],
        products: json.products || [],
        keys: json.keys || [],
        wallets: json.wallets || [],
        logs: json.logs || [],
        gateway: json.gateway || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load API Hub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const authPost = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/admin-api-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'API Hub action failed');
      await loadData();
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API Hub action failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const product = data.products.find((item) => item.code === 'cibil.consumer_score') || data.products[0];
  const walletByClient = useMemo(() => new Map(data.wallets.map((wallet) => [wallet.client_id, wallet])), [data.wallets]);
  const clientById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const activeClients = data.clients.filter((client) => client.status === 'active');
  const successHits = data.logs.filter((log) => log.status === 'success').length;
  const failedHits = data.logs.filter((log) => log.status === 'failed').length;
  const sandboxCredits = data.wallets.reduce((sum, wallet) => sum + Number(wallet.sandbox_credits || 0), 0);
  const liveBalance = data.wallets.reduce((sum, wallet) => sum + Number(wallet.live_balance || 0), 0);

  const createClientRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'create_client', ...clientForm, sandbox_credits: Number(clientForm.sandbox_credits || 10) });
    if (json?.success) {
      setNotice('Client created with sandbox wallet.');
      setClientForm({ name: '', company_name: '', contact_name: '', email: '', mobile: '', sandbox_credits: '10' });
      setActiveTab('Clients');
    }
  };

  const generateKey = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({
      action: 'generate_key',
      ...keyForm,
      product_id: product?.id,
      rate_limit_per_minute: Number(keyForm.rate_limit_per_minute || 60),
    });
    if (json?.success) {
      setLatestKey(json.secret_key);
      setNotice('API key generated. This full key is shown only once.');
      setActiveTab('Keys');
    }
  };

  const addCredits = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({
      action: 'add_credits',
      ...creditForm,
      amount: Number(creditForm.amount || 0),
      sandbox_credits: Number(creditForm.sandbox_credits || 0),
    });
    if (json?.success) {
      setNotice('Credits updated.');
    }
  };

  const revokeKey = async (keyId: string) => {
    const json = await authPost({ action: 'revoke_key', key_id: keyId });
    if (json?.success) setNotice('API key revoked.');
  };

  return (
    <AdminLayout title="API Hub">
      <div className="p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Control Plane</p>
            <h1 className="text-2xl font-bold text-slate-900">API Reselling Hub</h1>
            <p className="text-sm text-slate-500 mt-1">Clients, API keys, sandbox demo credits, live wallet and CIBIL gateway usage in one section.</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {(error || notice) && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice}
          </div>
        )}

        {latestKey && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-900">New API key</p>
                <p className="font-mono text-xs text-amber-800 break-all mt-1">{latestKey}</p>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(latestKey)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
              >
                <Copy size={15} />
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={ShieldCheck} label="Active clients" value={String(activeClients.length)} />
          <StatCard icon={KeyRound} label="Active keys" value={String(data.keys.filter((key) => key.status === 'active').length)} />
          <StatCard icon={WalletCards} label="Sandbox credits" value={String(sandboxCredits)} />
          <StatCard icon={CircleDollarSign} label="Live balance" value={money(liveBalance)} />
        </div>

        <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Recent usage</h2>
                <span className="text-xs text-slate-500">{successHits} success / {failedHits} failed</span>
              </div>
              <UsageTable logs={data.logs.slice(0, 8)} clientById={clientById} />
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Server size={18} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Gateway</h2>
              </div>
              <div className="space-y-3 text-sm">
                <InfoLine label="Endpoint" value={data.gateway?.gateway_base_url || 'Configured via API_HUB_GATEWAY_URL'} />
                <InfoLine label="Status" value={data.gateway?.status || 'Env based'} />
                <InfoLine label="Product" value={product?.name || 'CIBIL Consumer Score'} />
                <InfoLine label="Live price" value={money(product?.default_price)} />
                <InfoLine label="Default sandbox" value={`${product?.default_sandbox_credits ?? 10} credits`} />
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Clients' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Create client</h2>
              <form onSubmit={createClientRecord} className="space-y-3">
                <Input label="Client name" value={clientForm.name} onChange={(value) => setClientForm((prev) => ({ ...prev, name: value }))} required />
                <Input label="Company" value={clientForm.company_name} onChange={(value) => setClientForm((prev) => ({ ...prev, company_name: value }))} />
                <Input label="Contact person" value={clientForm.contact_name} onChange={(value) => setClientForm((prev) => ({ ...prev, contact_name: value }))} />
                <Input label="Email" value={clientForm.email} onChange={(value) => setClientForm((prev) => ({ ...prev, email: value }))} />
                <Input label="Mobile" value={clientForm.mobile} onChange={(value) => setClientForm((prev) => ({ ...prev, mobile: value }))} />
                <Input label="Sandbox credits" type="number" value={clientForm.sandbox_credits} onChange={(value) => setClientForm((prev) => ({ ...prev, sandbox_credits: value }))} />
                <PrimaryButton disabled={saving} icon={Plus}>Create Client</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Clients</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 pr-4">Client</th>
                      <th className="py-2 pr-4">Contact</th>
                      <th className="py-2 pr-4">Sandbox</th>
                      <th className="py-2 pr-4">Live Wallet</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients.map((client) => {
                      const wallet = walletByClient.get(client.id);
                      return (
                        <tr key={client.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4">
                            <p className="font-semibold text-slate-900">{client.name}</p>
                            <p className="text-xs text-slate-500">{client.company_name || 'No company'}</p>
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            <p>{client.email || '-'}</p>
                            <p className="text-xs">{client.mobile || '-'}</p>
                          </td>
                          <td className="py-3 pr-4 font-semibold">{wallet?.sandbox_credits ?? 0}</td>
                          <td className="py-3 pr-4 font-semibold">{money(wallet?.live_balance)}</td>
                          <td className="py-3"><StatusPill value={client.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Keys' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Generate key</h2>
              <form onSubmit={generateKey} className="space-y-3">
                <Select label="Client" value={keyForm.client_id} onChange={(value) => setKeyForm((prev) => ({ ...prev, client_id: value }))} required>
                  <option value="">Select client</option>
                  {activeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Select label="Environment" value={keyForm.environment} onChange={(value) => setKeyForm((prev) => ({ ...prev, environment: value }))}>
                  <option value="sandbox">Sandbox</option>
                  <option value="live">Live</option>
                </Select>
                <Input label="Label" value={keyForm.label} onChange={(value) => setKeyForm((prev) => ({ ...prev, label: value }))} />
                <Input label="Rate limit/min" type="number" value={keyForm.rate_limit_per_minute} onChange={(value) => setKeyForm((prev) => ({ ...prev, rate_limit_per_minute: value }))} />
                <PrimaryButton disabled={saving || !product} icon={KeyRound}>Generate Key</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">API keys</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 pr-4">Client</th>
                      <th className="py-2 pr-4">Prefix</th>
                      <th className="py-2 pr-4">Env</th>
                      <th className="py-2 pr-4">Last Used</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.keys.map((key) => (
                      <tr key={key.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{clientById.get(key.client_id)?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{key.label || 'API key'}</p>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs">{key.key_prefix}...</td>
                        <td className="py-3 pr-4"><StatusPill value={key.environment} /></td>
                        <td className="py-3 pr-4 text-slate-600">{formatDate(key.last_used_at)}</td>
                        <td className="py-3">
                          {key.status === 'active' ? (
                            <button onClick={() => revokeKey(key.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700">
                              <Ban size={13} />
                              Revoke
                            </button>
                          ) : (
                            <StatusPill value="revoked" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Sandbox' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add credits</h2>
              <form onSubmit={addCredits} className="space-y-3">
                <Select label="Client" value={creditForm.client_id} onChange={(value) => setCreditForm((prev) => ({ ...prev, client_id: value }))} required>
                  <option value="">Select client</option>
                  {data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Select label="Environment" value={creditForm.environment} onChange={(value) => setCreditForm((prev) => ({ ...prev, environment: value }))}>
                  <option value="sandbox">Sandbox demo credits</option>
                  <option value="live">Live wallet balance</option>
                </Select>
                {creditForm.environment === 'sandbox' ? (
                  <Input label="Credits" type="number" value={creditForm.sandbox_credits} onChange={(value) => setCreditForm((prev) => ({ ...prev, sandbox_credits: value }))} />
                ) : (
                  <Input label="Amount" type="number" value={creditForm.amount} onChange={(value) => setCreditForm((prev) => ({ ...prev, amount: value }))} />
                )}
                <Input label="Description" value={creditForm.description} onChange={(value) => setCreditForm((prev) => ({ ...prev, description: value }))} />
                <PrimaryButton disabled={saving} icon={WalletCards}>Add Credits</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Client wallets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.wallets.map((wallet) => (
                  <div key={wallet.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{clientById.get(wallet.client_id)?.name || 'Unknown client'}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <InfoLine label="Sandbox" value={`${wallet.sandbox_credits} credits`} />
                      <InfoLine label="Live" value={money(wallet.live_balance)} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Usage' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Usage logs</h2>
            <UsageTable logs={data.logs} clientById={clientById} />
          </section>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: IconComponent, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <IconComponent size={20} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, children, required = false }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
      >
        {children}
      </select>
    </label>
  );
}

function PrimaryButton({ children, disabled, icon: IconComponent }: { children: React.ReactNode; disabled?: boolean; icon: React.ElementType }) {
  return (
    <button
      disabled={disabled}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
    >
      <IconComponent size={16} />
      {children}
    </button>
  );
}

function StatusPill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sandbox: 'bg-sky-50 text-sky-700 border-sky-200',
    live: 'bg-violet-50 text-violet-700 border-violet-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    suspended: 'bg-amber-50 text-amber-700 border-amber-200',
    revoked: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold capitalize ${styles[value] || styles.pending}`}>
      {value}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 break-words">{value}</p>
    </div>
  );
}

function UsageTable({ logs, clientById }: { logs: ApiUsageLog[]; clientById: Map<string, ApiClient> }) {
  if (!logs.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        No API hits yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th className="py-2 pr-4">Request</th>
            <th className="py-2 pr-4">Client</th>
            <th className="py-2 pr-4">Env</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Charge</th>
            <th className="py-2 pr-4">PAN</th>
            <th className="py-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4">
                <p className="font-mono text-xs text-slate-900">{log.request_id}</p>
                {log.error_message && <p className="text-xs text-red-600 mt-1">{log.error_message}</p>}
              </td>
              <td className="py-3 pr-4 font-semibold text-slate-700">{clientById.get(log.client_id)?.name || 'Unknown'}</td>
              <td className="py-3 pr-4"><StatusPill value={log.environment} /></td>
              <td className="py-3 pr-4"><StatusPill value={log.status} /></td>
              <td className="py-3 pr-4 text-slate-700">
                {log.environment === 'sandbox' ? `${log.sandbox_credits_charged || 0} credit` : money(log.amount_charged)}
              </td>
              <td className="py-3 pr-4 font-mono text-xs">{log.masked_pan || '-'}</td>
              <td className="py-3 text-slate-600">
                <div className="flex items-center gap-1">
                  <Activity size={13} />
                  <span>{log.response_time_ms ? `${log.response_time_ms}ms` : formatDate(log.created_at)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
