'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import {
  Activity,
  Ban,
  BookOpenCheck,
  CircleDollarSign,
  Copy,
  KeyRound,
  Play,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

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
  description: string | null;
  default_price: number;
  default_sandbox_credits: number;
  is_active: boolean;
  status?: 'active' | 'inactive';
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

const tabs = ['Overview', 'APIs', 'Clients', 'API Keys', 'Sandbox', 'Wallet', 'Usage Logs'] as const;

const plannedApis = [
  { name: 'Aadhaar API', category: 'Identity', status: 'Planned' },
  { name: 'PAN API', category: 'KYC', status: 'Planned' },
  { name: 'Name Fetch API', category: 'Verification', status: 'Planned' },
  { name: 'Bank Account Verification', category: 'Banking', status: 'Planned' },
];

const bureauSamplePayload = `{
  "firstName": "HARSHAL",
  "middleName": "ARUN",
  "lastName": "PAWAR",
  "birthDate": "13122000",
  "gender": "2",
  "idNumber": "GEAPP1589H",
  "stateCode": "23",
  "pinCode": "450221",
  "telephoneNumber": "7067384810"
}`;

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function money(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function displayProductName(product?: ApiProduct | null) {
  if (!product) return 'Bureau API';
  return product.code === 'cibil.consumer_score' ? 'Bureau API' : product.name;
}

export default function AdminApiHubPage() {
  const [data, setData] = useState<ApiHubData>(emptyData);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [latestKey, setLatestKey] = useState('');
  const [sandboxResponse, setSandboxResponse] = useState('');

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
    product_id: '',
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
  const [sandboxForm, setSandboxForm] = useState({
    product_id: '',
    client_id: '',
    api_key: '',
    payload: bureauSamplePayload,
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
      const products = json.products || [];
      setData({
        clients: json.clients || [],
        products,
        keys: json.keys || [],
        wallets: json.wallets || [],
        logs: json.logs || [],
        gateway: json.gateway || null,
      });
      const bureauProduct = products.find((item: ApiProduct) => item.code === 'cibil.consumer_score') || products[0];
      setKeyForm((prev) => ({ ...prev, product_id: prev.product_id || bureauProduct?.id || '' }));
      setSandboxForm((prev) => ({ ...prev, product_id: prev.product_id || bureauProduct?.id || '' }));
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

  const productById = useMemo(() => new Map(data.products.map((product) => [product.id, product])), [data.products]);
  const bureauProduct = data.products.find((item) => item.code === 'cibil.consumer_score') || data.products[0];
  const walletByClient = useMemo(() => new Map(data.wallets.map((wallet) => [wallet.client_id, wallet])), [data.wallets]);
  const clientById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const activeClients = data.clients.filter((client) => client.status === 'active');
  const activeProducts = data.products.filter((product) => product.is_active !== false && product.status !== 'inactive');
  const successHits = data.logs.filter((log) => log.status === 'success').length;
  const failedHits = data.logs.filter((log) => log.status === 'failed').length;
  const sandboxCredits = data.wallets.reduce((sum, wallet) => sum + Number(wallet.sandbox_credits || 0), 0);
  const liveBalance = data.wallets.reduce((sum, wallet) => sum + Number(wallet.live_balance || 0), 0);

  const createClientRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'create_client', ...clientForm, sandbox_credits: Number(clientForm.sandbox_credits || 10) });
    if (json?.success) {
      setNotice('Client created.');
      setClientForm({ name: '', company_name: '', contact_name: '', email: '', mobile: '', sandbox_credits: '10' });
      setActiveTab('Clients');
    }
  };

  const generateKey = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({
      action: 'generate_key',
      ...keyForm,
      product_id: keyForm.product_id || bureauProduct?.id,
      rate_limit_per_minute: Number(keyForm.rate_limit_per_minute || 60),
    });
    if (json?.success) {
      setLatestKey(json.secret_key);
      setSandboxForm((prev) => ({ ...prev, api_key: json.secret_key, client_id: keyForm.client_id, product_id: keyForm.product_id }));
      setNotice('API key generated. This full key is shown only once.');
      setActiveTab('API Keys');
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
    if (json?.success) setNotice('Credits updated.');
  };

  const revokeKey = async (keyId: string) => {
    const json = await authPost({ action: 'revoke_key', key_id: keyId });
    if (json?.success) setNotice('API key revoked.');
  };

  const testSandbox = async (event: React.FormEvent) => {
    event.preventDefault();
    setTesting(true);
    setError('');
    setNotice('');
    setSandboxResponse('');
    try {
      const selectedProduct = productById.get(sandboxForm.product_id);
      if (!selectedProduct || selectedProduct.code !== 'cibil.consumer_score') {
        throw new Error('Only Bureau API sandbox is active right now.');
      }
      if (!sandboxForm.api_key.trim()) throw new Error('Sandbox API key is required.');
      const payload = JSON.parse(sandboxForm.payload);
      const res = await fetch('/api/v1/cibil/consumer-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': sandboxForm.api_key.trim(),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setSandboxResponse(JSON.stringify(json, null, 2));
      if (!res.ok) throw new Error(json.error || 'Sandbox test failed');
      setNotice('Sandbox response received.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sandbox test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout title="Control Panel">
      <div className="p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Control Panel</p>
            <h1 className="text-2xl font-bold text-slate-900">API Hub</h1>
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
          <StatCard icon={BookOpenCheck} label="Active APIs" value={String(activeProducts.length)} />
          <StatCard icon={ShieldCheck} label="Active Clients" value={String(activeClients.length)} />
          <StatCard icon={KeyRound} label="Active Keys" value={String(data.keys.filter((key) => key.status === 'active').length)} />
          <StatCard icon={CircleDollarSign} label="Live Balance" value={money(liveBalance)} />
        </div>

        <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
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
              <UsageTable logs={data.logs.slice(0, 8)} clientById={clientById} productById={productById} />
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Server size={18} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Gateway</h2>
              </div>
              <div className="space-y-3 text-sm">
                <InfoLine label="Status" value={data.gateway?.status || 'Configured'} />
                <InfoLine label="Primary API" value={displayProductName(bureauProduct)} />
                <InfoLine label="Live price" value={money(bureauProduct?.default_price)} />
                <InfoLine label="Sandbox pool" value={`${sandboxCredits} credits`} />
              </div>
            </section>
          </div>
        )}

        {activeTab === 'APIs' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">List of APIs</h2>
              <span className="text-xs font-semibold text-slate-500">{activeProducts.length} active</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.products.map((product) => (
                <div key={product.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{displayProductName(product)}</h3>
                      <p className="text-sm text-slate-500 mt-1">{product.description || 'API product'}</p>
                    </div>
                    <StatusPill value={product.is_active === false || product.status === 'inactive' ? 'inactive' : 'active'} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <InfoLine label="Category" value={product.code === 'cibil.consumer_score' ? 'Credit Bureau' : 'Verification'} />
                    <InfoLine label="Sandbox" value={`${product.default_sandbox_credits ?? 10} credits`} />
                    <InfoLine label="Live Price" value={money(product.default_price)} />
                    <InfoLine label="Code" value={product.code} />
                  </div>
                </div>
              ))}
              {plannedApis.map((item) => (
                <div key={item.name} className="rounded-lg border border-dashed border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.category}</p>
                    </div>
                    <StatusPill value="planned" />
                  </div>
                </div>
              ))}
            </div>
          </section>
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
              <ClientsTable clients={data.clients} walletByClient={walletByClient} />
            </section>
          </div>
        )}

        {activeTab === 'API Keys' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Generate key</h2>
              <form onSubmit={generateKey} className="space-y-3">
                <Select label="Client" value={keyForm.client_id} onChange={(value) => setKeyForm((prev) => ({ ...prev, client_id: value }))} required>
                  <option value="">Select client</option>
                  {activeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Select label="API" value={keyForm.product_id} onChange={(value) => setKeyForm((prev) => ({ ...prev, product_id: value }))} required>
                  <option value="">Select API</option>
                  {activeProducts.map((product) => <option key={product.id} value={product.id}>{displayProductName(product)}</option>)}
                </Select>
                <Select label="Environment" value={keyForm.environment} onChange={(value) => setKeyForm((prev) => ({ ...prev, environment: value }))}>
                  <option value="sandbox">Sandbox</option>
                  <option value="live">Live</option>
                </Select>
                <Input label="Label" value={keyForm.label} onChange={(value) => setKeyForm((prev) => ({ ...prev, label: value }))} />
                <Input label="Rate limit/min" type="number" value={keyForm.rate_limit_per_minute} onChange={(value) => setKeyForm((prev) => ({ ...prev, rate_limit_per_minute: value }))} />
                <PrimaryButton disabled={saving || !keyForm.product_id} icon={KeyRound}>Generate Key</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">API keys</h2>
              <KeysTable keys={data.keys} clientById={clientById} productById={productById} revokeKey={revokeKey} />
            </section>
          </div>
        )}

        {activeTab === 'Sandbox' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Sandbox Console</h2>
              <form onSubmit={testSandbox} className="space-y-3">
                <Select label="API" value={sandboxForm.product_id} onChange={(value) => setSandboxForm((prev) => ({ ...prev, product_id: value }))} required>
                  <option value="">Select API</option>
                  {activeProducts.map((product) => <option key={product.id} value={product.id}>{displayProductName(product)}</option>)}
                </Select>
                <Select label="Client" value={sandboxForm.client_id} onChange={(value) => setSandboxForm((prev) => ({ ...prev, client_id: value }))}>
                  <option value="">Select client</option>
                  {activeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Input label="Sandbox API key" value={sandboxForm.api_key} onChange={(value) => setSandboxForm((prev) => ({ ...prev, api_key: value }))} required />
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Payload JSON</span>
                  <textarea
                    value={sandboxForm.payload}
                    onChange={(event) => setSandboxForm((prev) => ({ ...prev, payload: event.target.value }))}
                    className="mt-1 w-full min-h-64 rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <PrimaryButton disabled={testing} icon={Play}>{testing ? 'Testing...' : 'Run Sandbox Test'}</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Response</h2>
              <pre className="min-h-[420px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
                {sandboxResponse || 'Run a sandbox test to preview the API response.'}
              </pre>
            </section>
          </div>
        )}

        {activeTab === 'Wallet' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add credits</h2>
              <form onSubmit={addCredits} className="space-y-3">
                <Select label="Client" value={creditForm.client_id} onChange={(value) => setCreditForm((prev) => ({ ...prev, client_id: value }))} required>
                  <option value="">Select client</option>
                  {data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Select label="Environment" value={creditForm.environment} onChange={(value) => setCreditForm((prev) => ({ ...prev, environment: value }))}>
                  <option value="sandbox">Sandbox credits</option>
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

        {activeTab === 'Usage Logs' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Usage logs</h2>
            <UsageTable logs={data.logs} clientById={clientById} productById={productById} />
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
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-slate-100 text-slate-600 border-slate-200',
    planned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
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

function ClientsTable({ clients, walletByClient }: { clients: ApiClient[]; walletByClient: Map<string, ApiWallet> }) {
  return (
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
          {clients.map((client) => {
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
  );
}

function KeysTable({
  keys,
  clientById,
  productById,
  revokeKey,
}: {
  keys: ApiKey[];
  clientById: Map<string, ApiClient>;
  productById: Map<string, ApiProduct>;
  revokeKey: (keyId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th className="py-2 pr-4">Client</th>
            <th className="py-2 pr-4">API</th>
            <th className="py-2 pr-4">Prefix</th>
            <th className="py-2 pr-4">Env</th>
            <th className="py-2 pr-4">Last Used</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4">
                <p className="font-semibold text-slate-900">{clientById.get(key.client_id)?.name || 'Unknown'}</p>
                <p className="text-xs text-slate-500">{key.label || 'API key'}</p>
              </td>
              <td className="py-3 pr-4 font-semibold text-slate-700">{displayProductName(productById.get(key.product_id))}</td>
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
  );
}

function UsageTable({ logs, clientById, productById }: { logs: ApiUsageLog[]; clientById: Map<string, ApiClient>; productById: Map<string, ApiProduct> }) {
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
            <th className="py-2 pr-4">API</th>
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
              <td className="py-3 pr-4 text-slate-700">{displayProductName(productById.get(log.product_id))}</td>
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
