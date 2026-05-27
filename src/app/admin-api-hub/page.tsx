'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { Activity, Ban, Copy, KeyRound, Play, Plus, RefreshCw, Save, Server, ShieldCheck, WalletCards } from 'lucide-react';

type ApiConfig = {
  id: string;
  name: string;
  code: string;
  master_url: string;
  method: 'POST' | 'GET';
  auth_header: string;
  has_auth_token: boolean;
  per_hit_credits: number;
  test_payload: Record<string, unknown>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

type ApiClient = {
  id: string;
  name: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  mobile: string | null;
  credits: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

type ApiKey = {
  id: string;
  client_id: string;
  api_id: string;
  label: string;
  key_prefix: string;
  status: 'active' | 'revoked';
  last_used_at: string | null;
  created_at: string;
};

type UsageLog = {
  id: string;
  request_id: string;
  client_id: string;
  api_id: string;
  key_id: string;
  status: 'success' | 'failed';
  credits_deducted: number;
  masked_pan?: string;
  masked_mobile?: string;
  response_time_ms?: number;
  error_message?: string;
  created_at: string;
};

type ApiHubData = {
  apis: ApiConfig[];
  clients: ApiClient[];
  keys: ApiKey[];
  usage: UsageLog[];
};

const tabs = ['APIs', 'Clients', 'API Keys', 'Credits', 'Usage'] as const;

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

const emptyData: ApiHubData = {
  apis: [],
  clients: [],
  keys: [],
  usage: [],
};

function formatDate(value?: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function jsonText(value: unknown) {
  return JSON.stringify(value || JSON.parse(defaultPayload), null, 2);
}

export default function AdminApiHubPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('APIs');
  const [data, setData] = useState<ApiHubData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [latestKey, setLatestKey] = useState('');
  const [testResponse, setTestResponse] = useState('');

  const [apiForm, setApiForm] = useState({
    api_id: 'bureau-api',
    name: 'Bureau API',
    code: 'bureau',
    master_url: '',
    method: 'POST',
    auth_header: 'x-api-key',
    auth_token: '',
    per_hit_credits: '1',
    test_payload: defaultPayload,
    status: 'active',
  });
  const [clientForm, setClientForm] = useState({
    name: '',
    company_name: '',
    contact_name: '',
    email: '',
    mobile: '',
    credits: '10',
  });
  const [keyForm, setKeyForm] = useState({
    client_id: '',
    api_id: '',
    label: '',
  });
  const [creditForm, setCreditForm] = useState({
    client_id: '',
    credits: '10',
  });

  const apiById = useMemo(() => new Map(data.apis.map((api) => [api.id, api])), [data.apis]);
  const clientById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const activeApis = data.apis.filter((api) => api.status === 'active');
  const activeClients = data.clients.filter((client) => client.status === 'active');
  const totalCredits = data.clients.reduce((sum, client) => sum + Number(client.credits || 0), 0);

  const syncApiForm = (api: ApiConfig) => {
    setApiForm({
      api_id: api.id,
      name: api.name,
      code: api.code,
      master_url: api.master_url || '',
      method: api.method || 'POST',
      auth_header: api.auth_header || 'x-api-key',
      auth_token: '',
      per_hit_credits: String(api.per_hit_credits || 1),
      test_payload: jsonText(api.test_payload),
      status: api.status || 'active',
    });
    setKeyForm((prev) => ({ ...prev, api_id: prev.api_id || api.id }));
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
      if (!res.ok) throw new Error(json.error || 'Unable to load API Hub data');
      const nextData = {
        apis: json.apis || [],
        clients: json.clients || [],
        keys: json.keys || [],
        usage: json.usage || [],
      };
      setData(nextData);
      if (nextData.apis[0]) syncApiForm(nextData.apis[0]);
      setKeyForm((prev) => ({
        ...prev,
        client_id: prev.client_id || nextData.clients[0]?.id || '',
        api_id: prev.api_id || nextData.apis[0]?.id || '',
      }));
      setCreditForm((prev) => ({ ...prev, client_id: prev.client_id || nextData.clients[0]?.id || '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load API Hub data');
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

  const saveApi = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'save_api', ...apiForm, per_hit_credits: Number(apiForm.per_hit_credits || 1) });
    if (json?.success) setNotice('API saved. Master token is kept internal.');
  };

  const testApi = async () => {
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
        body: JSON.stringify({ action: 'test_api', api_id: apiForm.api_id, payload: apiForm.test_payload }),
      });
      const json = await res.json();
      setTestResponse(JSON.stringify(json, null, 2));
      if (!res.ok) throw new Error(json.error || 'Master API test failed');
      setNotice('Master API response received.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Master API test failed');
    } finally {
      setTesting(false);
    }
  };

  const createClientRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'create_client', ...clientForm, credits: Number(clientForm.credits || 0) });
    if (json?.success) {
      setNotice('Client created.');
      setClientForm({ name: '', company_name: '', contact_name: '', email: '', mobile: '', credits: '10' });
      setActiveTab('Clients');
    }
  };

  const generateKey = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'generate_key', ...keyForm });
    if (json?.success) {
      setLatestKey(json.secret_key);
      setNotice('Client API key generated. Full key is shown only once.');
      setActiveTab('API Keys');
    }
  };

  const addCredits = async (event: React.FormEvent) => {
    event.preventDefault();
    const json = await authPost({ action: 'add_credits', client_id: creditForm.client_id, credits: Number(creditForm.credits || 0) });
    if (json?.success) setNotice('Credits added.');
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
          <button onClick={loadData} disabled={loading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
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
                <p className="text-sm font-semibold text-amber-900">New CreditTrust API Key</p>
                <p className="font-mono text-xs text-amber-800 break-all mt-1">{latestKey}</p>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(latestKey)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700">
                <Copy size={15} />
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard icon={Server} label="APIs" value={String(data.apis.length)} />
          <StatCard icon={ShieldCheck} label="Clients" value={String(data.clients.length)} />
          <StatCard icon={KeyRound} label="Active Keys" value={String(data.keys.filter((key) => key.status === 'active').length)} />
          <StatCard icon={WalletCards} label="Credits" value={String(totalCredits)} />
        </div>

        <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'APIs' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Master API</h2>
              <form onSubmit={saveApi} className="space-y-3">
                <Select label="API" value={apiForm.api_id} onChange={(value) => {
                  const api = apiById.get(value);
                  if (api) syncApiForm(api);
                }}>
                  {data.apis.map((api) => <option key={api.id} value={api.id}>{api.name}</option>)}
                </Select>
                <Input label="API name" value={apiForm.name} onChange={(value) => setApiForm((prev) => ({ ...prev, name: value }))} required />
                <Input label="Code" value={apiForm.code} onChange={(value) => setApiForm((prev) => ({ ...prev, code: value }))} required />
                <Input label="Master API URL" value={apiForm.master_url} onChange={(value) => setApiForm((prev) => ({ ...prev, master_url: value }))} required />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Method" value={apiForm.method} onChange={(value) => setApiForm((prev) => ({ ...prev, method: value }))}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </Select>
                  <Input label="Per-hit credits" type="number" value={apiForm.per_hit_credits} onChange={(value) => setApiForm((prev) => ({ ...prev, per_hit_credits: value }))} />
                </div>
                <Input label="Auth header" value={apiForm.auth_header} onChange={(value) => setApiForm((prev) => ({ ...prev, auth_header: value }))} />
                <Input label="Master token (blank keeps saved)" type="password" value={apiForm.auth_token} onChange={(value) => setApiForm((prev) => ({ ...prev, auth_token: value }))} />
                <Select label="Status" value={apiForm.status} onChange={(value) => setApiForm((prev) => ({ ...prev, status: value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <JsonArea label="Test payload" value={apiForm.test_payload} onChange={(value) => setApiForm((prev) => ({ ...prev, test_payload: value }))} rows={10} />
                <div className="grid grid-cols-2 gap-3">
                  <PrimaryButton disabled={saving} icon={Save}>Save</PrimaryButton>
                  <button type="button" onClick={testApi} disabled={testing || !apiForm.master_url} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
                    <Play size={16} />
                    {testing ? 'Testing' : 'Test'}
                  </button>
                </div>
              </form>
            </section>

            <section className="xl:col-span-2 space-y-5">
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-4">List of APIs</h2>
                <div className="space-y-3">
                  {data.apis.map((api) => (
                    <button key={api.id} onClick={() => syncApiForm(api)} className="w-full text-left rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{api.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">{api.master_url || 'Master URL not configured'}</p>
                        </div>
                        <StatusPill value={api.status} />
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <InfoLine label="Code" value={api.code} />
                        <InfoLine label="Method" value={api.method} />
                        <InfoLine label="Auth" value={api.has_auth_token ? `${api.auth_header} saved` : 'Missing'} />
                        <InfoLine label="Cost" value={`${api.per_hit_credits} credit`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Test Response</h2>
                <pre className="min-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{testResponse || 'Save master API details, then test from here.'}</pre>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Clients' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add Client</h2>
              <form onSubmit={createClientRecord} className="space-y-3">
                <Input label="Client name" value={clientForm.name} onChange={(value) => setClientForm((prev) => ({ ...prev, name: value }))} required />
                <Input label="Company" value={clientForm.company_name} onChange={(value) => setClientForm((prev) => ({ ...prev, company_name: value }))} />
                <Input label="Contact person" value={clientForm.contact_name} onChange={(value) => setClientForm((prev) => ({ ...prev, contact_name: value }))} />
                <Input label="Email" value={clientForm.email} onChange={(value) => setClientForm((prev) => ({ ...prev, email: value }))} />
                <Input label="Mobile" value={clientForm.mobile} onChange={(value) => setClientForm((prev) => ({ ...prev, mobile: value }))} />
                <Input label="Initial credits" type="number" value={clientForm.credits} onChange={(value) => setClientForm((prev) => ({ ...prev, credits: value }))} />
                <PrimaryButton disabled={saving} icon={Plus}>Add Client</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Clients</h2>
              <ClientsTable clients={data.clients} />
            </section>
          </div>
        )}

        {activeTab === 'API Keys' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Generate Key</h2>
              <form onSubmit={generateKey} className="space-y-3">
                <Select label="Client" value={keyForm.client_id} onChange={(value) => setKeyForm((prev) => ({ ...prev, client_id: value }))} required>
                  <option value="">Select client</option>
                  {activeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Select label="API" value={keyForm.api_id} onChange={(value) => setKeyForm((prev) => ({ ...prev, api_id: value }))} required>
                  <option value="">Select API</option>
                  {activeApis.map((api) => <option key={api.id} value={api.id}>{api.name}</option>)}
                </Select>
                <Input label="Label" value={keyForm.label} onChange={(value) => setKeyForm((prev) => ({ ...prev, label: value }))} />
                <PrimaryButton disabled={saving} icon={KeyRound}>Generate Key</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Keys</h2>
              <KeysTable keys={data.keys} clientById={clientById} apiById={apiById} revokeKey={revokeKey} />
            </section>
          </div>
        )}

        {activeTab === 'Credits' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add Credits</h2>
              <form onSubmit={addCredits} className="space-y-3">
                <Select label="Client" value={creditForm.client_id} onChange={(value) => setCreditForm((prev) => ({ ...prev, client_id: value }))} required>
                  <option value="">Select client</option>
                  {activeClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </Select>
                <Input label="Credits" type="number" value={creditForm.credits} onChange={(value) => setCreditForm((prev) => ({ ...prev, credits: value }))} required />
                <PrimaryButton disabled={saving} icon={WalletCards}>Add Credits</PrimaryButton>
              </form>
            </section>
            <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Credit Balances</h2>
              <CreditsTable clients={data.clients} />
            </section>
          </div>
        )}

        {activeTab === 'Usage' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Usage</h2>
            <UsageTable usage={data.usage} clientById={clientById} apiById={apiById} />
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

function JsonArea({ label, value, onChange, rows = 8 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
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
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    revoked: 'bg-slate-100 text-slate-600 border-slate-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold capitalize ${styles[value] || styles.inactive}`}>{value}</span>;
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 break-words">{value}</p>
    </div>
  );
}

function ClientsTable({ clients }: { clients: ApiClient[] }) {
  if (!clients.length) return <EmptyState text="No clients yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr><th className="py-2 pr-4">Client</th><th className="py-2 pr-4">Contact</th><th className="py-2 pr-4">Credits</th><th className="py-2">Status</th></tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4"><p className="font-semibold text-slate-900">{client.name}</p><p className="text-xs text-slate-500">{client.company_name || 'No company'}</p></td>
              <td className="py-3 pr-4 text-slate-600"><p>{client.email || '-'}</p><p className="text-xs">{client.mobile || '-'}</p></td>
              <td className="py-3 pr-4 font-bold text-slate-900">{client.credits}</td>
              <td className="py-3"><StatusPill value={client.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeysTable({ keys, clientById, apiById, revokeKey }: { keys: ApiKey[]; clientById: Map<string, ApiClient>; apiById: Map<string, ApiConfig>; revokeKey: (keyId: string) => void }) {
  if (!keys.length) return <EmptyState text="No keys generated yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr><th className="py-2 pr-4">Client</th><th className="py-2 pr-4">API</th><th className="py-2 pr-4">Prefix</th><th className="py-2 pr-4">Last Used</th><th className="py-2 pr-4">Status</th><th className="py-2">Action</th></tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4"><p className="font-semibold text-slate-900">{clientById.get(key.client_id)?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{key.label || 'Client key'}</p></td>
              <td className="py-3 pr-4 font-semibold text-slate-700">{apiById.get(key.api_id)?.name || 'Unknown API'}</td>
              <td className="py-3 pr-4 font-mono text-xs">{key.key_prefix}...</td>
              <td className="py-3 pr-4 text-slate-600">{formatDate(key.last_used_at)}</td>
              <td className="py-3 pr-4"><StatusPill value={key.status} /></td>
              <td className="py-3">
                {key.status === 'active' ? (
                  <button onClick={() => revokeKey(key.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"><Ban size={13} />Revoke</button>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreditsTable({ clients }: { clients: ApiClient[] }) {
  if (!clients.length) return <EmptyState text="No client credits to show." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {clients.map((client) => (
        <div key={client.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">{client.name}</p>
              <p className="text-xs text-slate-500 mt-1">{client.company_name || client.email || 'Client'}</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{client.credits}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsageTable({ usage, clientById, apiById }: { usage: UsageLog[]; clientById: Map<string, ApiClient>; apiById: Map<string, ApiConfig> }) {
  if (!usage.length) return <EmptyState text="No API usage yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr><th className="py-2 pr-4">Request</th><th className="py-2 pr-4">Client</th><th className="py-2 pr-4">API</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Credits</th><th className="py-2 pr-4">PAN</th><th className="py-2 pr-4">Mobile</th><th className="py-2">Time</th></tr>
        </thead>
        <tbody>
          {usage.map((log) => (
            <tr key={log.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-4"><p className="font-mono text-xs text-slate-900">{log.request_id}</p>{log.error_message && <p className="text-xs text-red-600 mt-1">{log.error_message}</p>}</td>
              <td className="py-3 pr-4 font-semibold text-slate-700">{clientById.get(log.client_id)?.name || 'Unknown'}</td>
              <td className="py-3 pr-4 text-slate-700">{apiById.get(log.api_id)?.name || 'Unknown API'}</td>
              <td className="py-3 pr-4"><StatusPill value={log.status} /></td>
              <td className="py-3 pr-4 font-bold text-slate-900">{log.credits_deducted}</td>
              <td className="py-3 pr-4 font-mono text-xs">{log.masked_pan || '-'}</td>
              <td className="py-3 pr-4 font-mono text-xs">{log.masked_mobile || '-'}</td>
              <td className="py-3 text-slate-600"><div className="flex items-center gap-1"><Activity size={13} /><span>{log.response_time_ms ? `${log.response_time_ms}ms` : formatDate(log.created_at)}</span></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">{text}</div>;
}
