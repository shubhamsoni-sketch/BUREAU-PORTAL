'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { Activity, Ban, Copy, KeyRound, Play, Plus, RefreshCw, Save, Server, ShieldCheck } from 'lucide-react';

type ApiClient = {
  id: string;
  name: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  mobile: string | null;
  status: 'active' | 'suspended';
};

type ApiProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  vendor_name: string | null;
  endpoint_url: string | null;
  http_method: string | null;
  auth_header_name: string | null;
  has_auth_secret?: boolean;
  request_template?: Record<string, unknown> | null;
  sandbox_enabled: boolean;
  live_enabled: boolean;
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
  last_used_at: string | null;
};

type ApiUsageLog = {
  id: string;
  client_id: string;
  product_id: string;
  environment: 'sandbox' | 'live';
  request_id: string;
  status: 'pending' | 'success' | 'failed';
  masked_pan: string | null;
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
};

type ApiHubData = {
  clients: ApiClient[];
  products: ApiProduct[];
  keys: ApiKey[];
  logs: ApiUsageLog[];
};

const emptyData: ApiHubData = {
  clients: [],
  products: [],
  keys: [],
  logs: [],
};

const tabs = ['APIs', 'Test API', 'Clients', 'Client Keys', 'Usage Logs'] as const;

const defaultPayload = `{
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

function productName(product?: ApiProduct | null) {
  if (!product) return 'Bureau API';
  return product.code === 'cibil.consumer_score' ? 'Bureau API' : product.name;
}

function templateToText(product?: ApiProduct | null) {
  return JSON.stringify(product?.request_template || JSON.parse(defaultPayload), null, 2);
}

export default function AdminApiHubPage() {
  const [data, setData] = useState<ApiHubData>(emptyData);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('APIs');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [latestKey, setLatestKey] = useState('');
  const [testResponse, setTestResponse] = useState('');

  const [apiForm, setApiForm] = useState({
    product_id: '',
    name: 'Bureau API',
    vendor_name: 'Bureau API Gateway',
    description: 'Credit bureau report and score API through the whitelisted gateway.',
    endpoint_url: '',
    http_method: 'POST',
    auth_header_name: 'x-api-key',
    auth_secret: '',
    request_template: defaultPayload,
    is_active: true,
    sandbox_enabled: true,
    live_enabled: true,
  });
  const [testForm, setTestForm] = useState({
    product_id: '',
    payload: defaultPayload,
  });
  const [clientForm, setClientForm] = useState({
    name: '',
    company_name: '',
    contact_name: '',
    email: '',
    mobile: '',
  });
  const [keyForm, setKeyForm] = useState({
    client_id: '',
    product_id: '',
    environment: 'live',
    label: '',
    rate_limit_per_minute: '60',
  });

  const productById = useMemo(() => new Map(data.products.map((product) => [product.id, product])), [data.products]);
  const clientById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const activeClients = data.clients.filter((client) => client.status === 'active');
  const activeProducts = data.products.filter((product) => product.is_active !== false && product.status !== 'inactive');
  const bureauProduct = data.products.find((product) => product.code === 'cibil.consumer_score') || data.products[0];

  const syncProductForms = (product: ApiProduct) => {
    const requestTemplate = templateToText(product);
    setApiForm((prev) => ({
      ...prev,
      product_id: product.id,
      name: productName(product),
      vendor_name: product.vendor_name || 'Bureau API Gateway',
      description: product.description || '',
      endpoint_url: product.endpoint_url || '',
      http_method: product.http_method || 'POST',
      auth_header_name: product.auth_header_name || 'x-api-key',
      auth_secret: '',
      request_template: requestTemplate,
      is_active: product.is_active !== false,
      sandbox_enabled: product.sandbox_enabled !== false,
      live_enabled: product.live_enabled !== false,
    }));
    setTestForm((prev) => ({
      ...prev,
      product_id: prev.product_id || product.id,
      payload: prev.payload || requestTemplate,
    }));
    setKeyForm((prev) => ({ ...prev, product_id: prev.product_id || product.id }));
  };

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
        logs: json.logs || [],
      });
      const product = products.find((item: ApiProduct) => item.code === 'cibil.consumer_score') || products[0];
      if (product) syncProductForms(product);
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

  const saveApiConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'save_api_config', ...apiForm });
    if (json?.success) setNotice('API configuration saved.');
  };

  const testVendorApi = async (event: React.FormEvent) => {
    event.preventDefault();
    setTesting(true);
    setError('');
    setNotice('');
    setTestResponse('');
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
        body: JSON.stringify({ action: 'test_vendor_api', ...testForm }),
      });
      const json = await res.json();
      setTestResponse(JSON.stringify(json, null, 2));
      if (!res.ok) throw new Error(json.error || 'Vendor API test failed');
      setNotice('Vendor API response received.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vendor API test failed');
    } finally {
      setTesting(false);
    }
  };

  const createClientRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'create_client', ...clientForm, sandbox_credits: 0 });
    if (json?.success) {
      setNotice('Client created.');
      setClientForm({ name: '', company_name: '', contact_name: '', email: '', mobile: '' });
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
      setNotice('Client API key generated. This full key is shown only once.');
      setActiveTab('Client Keys');
    }
  };

  const revokeKey = async (keyId: string) => {
    const json = await authPost({ action: 'revoke_key', key_id: keyId });
    if (json?.success) setNotice('API key revoked.');
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
                <p className="text-sm font-semibold text-amber-900">New Client API Key</p>
                <p className="font-mono text-xs text-amber-800 break-all mt-1">{latestKey}</p>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(latestKey)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700">
                <Copy size={15} />
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Server} label="Configured APIs" value={String(data.products.length)} />
          <StatCard icon={ShieldCheck} label="Clients" value={String(data.clients.length)} />
          <StatCard icon={KeyRound} label="Active Keys" value={String(data.keys.filter((key) => key.status === 'active').length)} />
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

        {activeTab === 'APIs' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add / Configure API</h2>
              <form onSubmit={saveApiConfig} className="space-y-3">
                <Select label="API" value={apiForm.product_id} onChange={(value) => {
                  const product = productById.get(value);
                  if (product) syncProductForms(product);
                }} required>
                  {data.products.map((product) => <option key={product.id} value={product.id}>{productName(product)}</option>)}
                </Select>
                <Input label="API name" value={apiForm.name} onChange={(value) => setApiForm((prev) => ({ ...prev, name: value }))} required />
                <Input label="Vendor name" value={apiForm.vendor_name} onChange={(value) => setApiForm((prev) => ({ ...prev, vendor_name: value }))} />
                <Input label="Master API endpoint" value={apiForm.endpoint_url} onChange={(value) => setApiForm((prev) => ({ ...prev, endpoint_url: value }))} required />
                <Select label="Method" value={apiForm.http_method} onChange={(value) => setApiForm((prev) => ({ ...prev, http_method: value }))}>
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </Select>
                <Input label="Auth header" value={apiForm.auth_header_name} onChange={(value) => setApiForm((prev) => ({ ...prev, auth_header_name: value }))} />
                <Input label={bureauProduct?.has_auth_secret ? 'Secret key / token (leave blank to keep saved)' : 'Secret key / token'} value={apiForm.auth_secret} onChange={(value) => setApiForm((prev) => ({ ...prev, auth_secret: value }))} />
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Request template</span>
                  <textarea value={apiForm.request_template} onChange={(event) => setApiForm((prev) => ({ ...prev, request_template: event.target.value }))} className="mt-1 w-full min-h-44 rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <PrimaryButton disabled={saving} icon={Save}>Save API</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Configured APIs</h2>
              <div className="space-y-3">
                {data.products.map((product) => (
                  <div key={product.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{productName(product)}</h3>
                        <p className="text-sm text-slate-500 mt-1">{product.vendor_name || 'Vendor not set'}</p>
                      </div>
                      <StatusPill value={product.is_active === false ? 'inactive' : 'active'} />
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <InfoLine label="Endpoint" value={product.endpoint_url || 'Not configured'} />
                      <InfoLine label="Method" value={product.http_method || 'POST'} />
                      <InfoLine label="Auth" value={product.auth_header_name || 'No header'} />
                      <InfoLine label="Secret" value={product.has_auth_secret ? 'Saved' : 'Missing'} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Test API' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Vendor API Test</h2>
              <form onSubmit={testVendorApi} className="space-y-3">
                <Select label="API" value={testForm.product_id} onChange={(value) => {
                  const product = productById.get(value);
                  setTestForm((prev) => ({ ...prev, product_id: value, payload: templateToText(product) }));
                }} required>
                  {activeProducts.map((product) => <option key={product.id} value={product.id}>{productName(product)}</option>)}
                </Select>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Payload JSON</span>
                  <textarea value={testForm.payload} onChange={(event) => setTestForm((prev) => ({ ...prev, payload: event.target.value }))} className="mt-1 w-full min-h-72 rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <PrimaryButton disabled={testing} icon={Play}>{testing ? 'Testing...' : 'Hit Master API'}</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Response</h2>
              <pre className="min-h-[440px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
                {testResponse || 'Hit the configured master API to preview the response.'}
              </pre>
            </section>
          </div>
        )}

        {activeTab === 'Clients' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add client</h2>
              <form onSubmit={createClientRecord} className="space-y-3">
                <Input label="Client name" value={clientForm.name} onChange={(value) => setClientForm((prev) => ({ ...prev, name: value }))} required />
                <Input label="Company" value={clientForm.company_name} onChange={(value) => setClientForm((prev) => ({ ...prev, company_name: value }))} />
                <Input label="Contact person" value={clientForm.contact_name} onChange={(value) => setClientForm((prev) => ({ ...prev, contact_name: value }))} />
                <Input label="Email" value={clientForm.email} onChange={(value) => setClientForm((prev) => ({ ...prev, email: value }))} />
                <Input label="Mobile" value={clientForm.mobile} onChange={(value) => setClientForm((prev) => ({ ...prev, mobile: value }))} />
                <PrimaryButton disabled={saving} icon={Plus}>Add Client</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Clients</h2>
              <SimpleClientsTable clients={data.clients} />
            </section>
          </div>
        )}

        {activeTab === 'Client Keys' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Generate client key</h2>
              <form onSubmit={generateKey} className="space-y-3">
                <Select label="Client" value={keyForm.client_id} onChange={(value) => setKeyForm((prev) => ({ ...prev, client_id: value }))} required>
                  <option value="">Select client</option>
                  {activeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Select label="API" value={keyForm.product_id} onChange={(value) => setKeyForm((prev) => ({ ...prev, product_id: value }))} required>
                  {activeProducts.map((product) => <option key={product.id} value={product.id}>{productName(product)}</option>)}
                </Select>
                <Select label="Environment" value={keyForm.environment} onChange={(value) => setKeyForm((prev) => ({ ...prev, environment: value }))}>
                  <option value="live">Live</option>
                  <option value="sandbox">Sandbox</option>
                </Select>
                <Input label="Label" value={keyForm.label} onChange={(value) => setKeyForm((prev) => ({ ...prev, label: value }))} />
                <Input label="Rate limit/min" type="number" value={keyForm.rate_limit_per_minute} onChange={(value) => setKeyForm((prev) => ({ ...prev, rate_limit_per_minute: value }))} />
                <PrimaryButton disabled={saving || !keyForm.product_id} icon={KeyRound}>Generate Key</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Client API keys</h2>
              <KeysTable keys={data.keys} clientById={clientById} productById={productById} revokeKey={revokeKey} />
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
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}

function Select({ label, value, onChange, children, required = false }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white">
        {children}
      </select>
    </label>
  );
}

function PrimaryButton({ children, disabled, icon: IconComponent }: { children: React.ReactNode; disabled?: boolean; icon: React.ElementType }) {
  return (
    <button disabled={disabled} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
      <IconComponent size={16} />
      {children}
    </button>
  );
}

function StatusPill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    live: 'bg-violet-50 text-violet-700 border-violet-200',
    sandbox: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    suspended: 'bg-amber-50 text-amber-700 border-amber-200',
    revoked: 'bg-slate-100 text-slate-600 border-slate-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold capitalize ${styles[value] || styles.pending}`}>{value}</span>;
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 break-words">{value}</p>
    </div>
  );
}

function SimpleClientsTable({ clients }: { clients: ApiClient[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr><th className="py-2 pr-4">Client</th><th className="py-2 pr-4">Contact</th><th className="py-2">Status</th></tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4"><p className="font-semibold text-slate-900">{client.name}</p><p className="text-xs text-slate-500">{client.company_name || 'No company'}</p></td>
              <td className="py-3 pr-4 text-slate-600"><p>{client.email || '-'}</p><p className="text-xs">{client.mobile || '-'}</p></td>
              <td className="py-3"><StatusPill value={client.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeysTable({ keys, clientById, productById, revokeKey }: { keys: ApiKey[]; clientById: Map<string, ApiClient>; productById: Map<string, ApiProduct>; revokeKey: (keyId: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr><th className="py-2 pr-4">Client</th><th className="py-2 pr-4">API</th><th className="py-2 pr-4">Prefix</th><th className="py-2 pr-4">Env</th><th className="py-2 pr-4">Last Used</th><th className="py-2">Action</th></tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4"><p className="font-semibold text-slate-900">{clientById.get(key.client_id)?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{key.label || 'Client key'}</p></td>
              <td className="py-3 pr-4 font-semibold text-slate-700">{productName(productById.get(key.product_id))}</td>
              <td className="py-3 pr-4 font-mono text-xs">{key.key_prefix}...</td>
              <td className="py-3 pr-4"><StatusPill value={key.environment} /></td>
              <td className="py-3 pr-4 text-slate-600">{formatDate(key.last_used_at)}</td>
              <td className="py-3">
                {key.status === 'active' ? (
                  <button onClick={() => revokeKey(key.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"><Ban size={13} />Revoke</button>
                ) : <StatusPill value="revoked" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageTable({ logs, clientById, productById }: { logs: ApiUsageLog[]; clientById: Map<string, ApiClient>; productById: Map<string, ApiProduct> }) {
  if (!logs.length) return <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No API hits yet.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr><th className="py-2 pr-4">Request</th><th className="py-2 pr-4">Client</th><th className="py-2 pr-4">API</th><th className="py-2 pr-4">Env</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">PAN</th><th className="py-2">Time</th></tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4"><p className="font-mono text-xs text-slate-900">{log.request_id}</p>{log.error_message && <p className="text-xs text-red-600 mt-1">{log.error_message}</p>}</td>
              <td className="py-3 pr-4 font-semibold text-slate-700">{clientById.get(log.client_id)?.name || 'Unknown'}</td>
              <td className="py-3 pr-4 text-slate-700">{productName(productById.get(log.product_id))}</td>
              <td className="py-3 pr-4"><StatusPill value={log.environment} /></td>
              <td className="py-3 pr-4"><StatusPill value={log.status} /></td>
              <td className="py-3 pr-4 font-mono text-xs">{log.masked_pan || '-'}</td>
              <td className="py-3 text-slate-600"><div className="flex items-center gap-1"><Activity size={13} /><span>{log.response_time_ms ? `${log.response_time_ms}ms` : formatDate(log.created_at)}</span></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
