'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Copy,
  Database,
  Globe2,
  KeyRound,
  LockKeyhole,
  Network,
  PlugZap,
  Plus,
  Server,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';

type NavItem = 'Overview' | 'Clients' | 'Environments' | 'API Keys' | 'IP Whitelist' | 'Credits' | 'Logs' | 'Docs';
type Environment = 'UAT' | 'Production';
type ClientStatus = 'Production' | 'UAT' | 'Review' | 'Suspended';
type ApiProduct = 'Bureau Standard' | 'Bureau Advanced' | 'Mobile Prefill';

type Client = {
  id: string;
  name: string;
  country: string;
  status: ClientStatus;
  contactEmail: string;
  uatCredits: number;
  liveCredits: number;
  ipWhitelistingRequired: boolean;
  ips: string[];
  apis: ApiProduct[];
  successRate: string;
};

type ApiKeyRecord = {
  id: string;
  clientId: string;
  environment: Environment;
  api: ApiProduct;
  label: string;
  prefix: string;
  status: 'Active' | 'Revoked';
  createdAt: string;
};

type UsageLog = {
  id: string;
  clientId: string;
  environment: Environment;
  api: ApiProduct;
  status: 'Success' | 'Failed';
  latency: string;
  charge: string;
  ip: string;
};

const navItems: NavItem[] = ['Overview', 'Clients', 'Environments', 'API Keys', 'IP Whitelist', 'Credits', 'Logs', 'Docs'];
const apiProducts: ApiProduct[] = ['Bureau Standard', 'Bureau Advanced', 'Mobile Prefill'];
const environments: Environment[] = ['UAT', 'Production'];

const initialClients: Client[] = [
  {
    id: 'client-ketav',
    name: 'Ketav Global Finance',
    country: 'UAE',
    status: 'Production',
    contactEmail: 'tech@ketavglobal.com',
    uatCredits: 240,
    liveCredits: 1840,
    ipWhitelistingRequired: true,
    ips: ['103.82.44.18', '185.64.112.90'],
    apis: ['Bureau Standard', 'Bureau Advanced'],
    successRate: '98.7%',
  },
  {
    id: 'client-northstar',
    name: 'Northstar Capital',
    country: 'Singapore',
    status: 'UAT',
    contactEmail: 'api@northstar.sg',
    uatCredits: 85,
    liveCredits: 0,
    ipWhitelistingRequired: true,
    ips: ['152.58.91.10'],
    apis: ['Bureau Advanced'],
    successRate: '96.2%',
  },
  {
    id: 'client-atlas',
    name: 'Atlas Credit Labs',
    country: 'UK',
    status: 'Review',
    contactEmail: 'ops@atlascredit.co.uk',
    uatCredits: 25,
    liveCredits: 0,
    ipWhitelistingRequired: false,
    ips: [],
    apis: ['Mobile Prefill'],
    successRate: '-',
  },
];

const initialKeys: ApiKeyRecord[] = [
  {
    id: 'key-1',
    clientId: 'client-ketav',
    environment: 'UAT',
    api: 'Bureau Advanced',
    label: 'Ketav UAT advanced',
    prefix: 'ctuat_x9f4a8d1',
    status: 'Active',
    createdAt: '04 Jul 2026',
  },
  {
    id: 'key-2',
    clientId: 'client-ketav',
    environment: 'Production',
    api: 'Bureau Advanced',
    label: 'Ketav live advanced',
    prefix: 'ctlive_81aa9c42',
    status: 'Active',
    createdAt: '04 Jul 2026',
  },
  {
    id: 'key-3',
    clientId: 'client-northstar',
    environment: 'UAT',
    api: 'Bureau Advanced',
    label: 'Northstar sandbox',
    prefix: 'ctuat_771e09bd',
    status: 'Active',
    createdAt: '04 Jul 2026',
  },
];

const initialLogs: UsageLog[] = [
  { id: 'ct_req_20260704_9121', clientId: 'client-ketav', environment: 'Production', api: 'Bureau Advanced', status: 'Success', latency: '812 ms', charge: '1 credit', ip: '103.82.44.18' },
  { id: 'ct_req_20260704_9120', clientId: 'client-ketav', environment: 'Production', api: 'Bureau Standard', status: 'Success', latency: '684 ms', charge: '1 credit', ip: '185.64.112.90' },
  { id: 'ct_req_20260704_9118', clientId: 'client-northstar', environment: 'UAT', api: 'Bureau Advanced', status: 'Failed', latency: '431 ms', charge: '0 credit', ip: '152.58.91.10' },
  { id: 'ct_req_20260704_9114', clientId: 'client-ketav', environment: 'Production', api: 'Mobile Prefill', status: 'Success', latency: '390 ms', charge: '1 credit', ip: '103.82.44.18' },
];

const pipelineSteps: Array<[string, string, React.ElementType]> = [
  ['Auth', 'API key, environment, and client status checked', LockKeyhole],
  ['Network', 'Client IP whitelist policy verified when enabled', Network],
  ['Credits', 'Per-hit credit balance reserved before vendor call', WalletCards],
  ['Normalize', 'Raw Jaadugar/CIBIL JSON converted to CreditTrust format', Database],
];

const normalizedResponse = `{
  "success": true,
  "request_id": "ct_req_20260704_9121",
  "environment": "production",
  "data": {
    "score": 742,
    "status": "hit",
    "customer": {
      "name": "SHUBHAM SONI",
      "pan": "EID****4M",
      "mobile": "******6989"
    },
    "bureau": {
      "provider": "CIBIL",
      "report_id": "ct_rpt_81f4",
      "pulled_at": "2026-07-04T10:30:00Z"
    },
    "summary": {
      "active_accounts": 4,
      "closed_accounts": 8,
      "total_outstanding": 125000,
      "overdue_amount": 0,
      "enquiries_30_days": 2
    },
    "risk": {
      "band": "low",
      "remarks": "Good repayment behavior"
    }
  }
}`;

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function keyPrefix(environment: Environment) {
  const random = Math.random().toString(16).slice(2, 10);
  return environment === 'Production' ? `ctlive_${random}` : `ctuat_${random}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: React.ElementType; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-800 uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-900 tracking-normal text-foreground">{value}</p>
          <p className="mt-1 text-xs font-600 text-muted-foreground">{helper}</p>
        </div>
        <span className={classNames('flex h-10 w-10 items-center justify-center rounded-lg', tone)}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={classNames('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-800', tones[tone])}>
      {children}
    </span>
  );
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-900 text-foreground">{title}</h3>
          {subtitle ? <p className="text-xs font-600 text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-900 uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <h2 className="text-lg font-900 text-foreground">{title}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-slate-600">
            <X size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ClientsTable({
  clients,
  onManage,
  onCreateKey,
}: {
  clients: Client[];
  onManage: (clientId: string) => void;
  onCreateKey: (clientId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead className="bg-slate-50">
          <tr>
            {['Client', 'Status', 'APIs', 'Credits', 'IP Policy', 'Whitelisted IPs', 'Success', 'Action'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.map((client) => (
            <tr key={client.id} className="bg-white">
              <td className="px-4 py-4">
                <p className="text-sm font-900 text-foreground">{client.name}</p>
                <p className="text-xs font-600 text-muted-foreground">{client.country} - {client.contactEmail}</p>
              </td>
              <td className="px-4 py-4">
                <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : client.status === 'Suspended' ? 'red' : 'amber'}>
                  {client.status}
                </StatusPill>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {client.apis.map((api) => <StatusPill key={api} tone="slate">{api}</StatusPill>)}
                </div>
              </td>
              <td className="px-4 py-4 text-sm font-900 text-foreground">
                <span className="block">UAT {client.uatCredits}</span>
                <span className="block text-xs text-muted-foreground">Live {client.liveCredits}</span>
              </td>
              <td className="px-4 py-4">
                <StatusPill tone={client.ipWhitelistingRequired ? 'green' : 'amber'}>
                  {client.ipWhitelistingRequired ? 'Required' : 'Optional'}
                </StatusPill>
              </td>
              <td className="px-4 py-4 text-xs font-700 text-muted-foreground">
                {client.ips.length ? client.ips.join(', ') : 'No IPs added'}
              </td>
              <td className="px-4 py-4 text-sm font-900 text-foreground">{client.successRate}</td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <button onClick={() => onManage(client.id)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-900 text-foreground">Manage</button>
                  <button
                    onClick={() => onCreateKey(client.id)}
                    aria-label={`Generate key for ${client.name}`}
                    className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-900 text-white"
                  >
                    Key
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTable({ logs, clients }: { logs: UsageLog[]; clients: Client[] }) {
  const clientById = new Map(clients.map((client) => [client.id, client.name]));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <thead className="bg-slate-50">
          <tr>
            {['Request ID', 'Client', 'Env', 'API', 'Source IP', 'Status', 'Latency', 'Charge'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 text-sm font-800 text-foreground">{log.id}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{clientById.get(log.clientId) || 'Unknown'}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.environment}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.api}</td>
              <td className="px-4 py-3 text-sm font-700 text-muted-foreground">{log.ip}</td>
              <td className="px-4 py-3"><StatusPill tone={log.status === 'Success' ? 'green' : 'red'}>{log.status}</StatusPill></td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.latency}</td>
              <td className="px-4 py-3 text-sm font-700 text-foreground">{log.charge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApiKeysPanel({ keys, clients }: { keys: ApiKeyRecord[]; clients: Client[] }) {
  const latest = keys.slice(0, 4);
  const clientById = new Map(clients.map((client) => [client.id, client.name]));
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-900 text-foreground">Environment Keys</h3>
          <p className="text-xs font-600 text-muted-foreground">Keys are client-specific and environment-specific.</p>
        </div>
        <KeyRound className="text-blue-700" size={20} />
      </div>
      <div className="space-y-3">
        {latest.map((key) => (
          <div key={key.id} className="rounded-lg border border-border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-900 text-foreground">{clientById.get(key.clientId)}</p>
                <p className="text-xs font-700 text-muted-foreground">{key.environment} - {key.api}</p>
              </div>
              <StatusPill tone={key.environment === 'Production' ? 'green' : 'blue'}>{key.status}</StatusPill>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-800 text-muted-foreground">
              <span>{key.prefix}........</span>
              <Copy size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NormalizedResponsePanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Server className="text-emerald-700" size={18} />
        <h3 className="text-base font-900 text-foreground">Normalized Response</h3>
      </div>
      <p className="mb-3 text-xs font-600 text-muted-foreground">
        Raw vendor JSON remains internal. Clients receive CreditTrust stable schema.
      </p>
      <pre className="max-h-[420px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100 scrollbar-thin">
        {normalizedResponse}
      </pre>
    </div>
  );
}

function ClientForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    country: '',
    contactEmail: '',
    status: 'UAT' as ClientStatus,
    uatCredits: '10',
    liveCredits: '0',
    ipWhitelistingRequired: true,
    ips: '',
    apis: ['Bureau Advanced'] as ApiProduct[],
  });

  const toggleApi = (api: ApiProduct) => {
    setForm((prev) => ({
      ...prev,
      apis: prev.apis.includes(api) ? prev.apis.filter((item) => item !== api) : [...prev.apis, api],
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name || !form.country.trim()) return;
    onSubmit({
      id: randomId('client'),
      name,
      country: form.country.trim(),
      contactEmail: form.contactEmail.trim() || 'tech@example.com',
      status: form.status,
      uatCredits: Math.max(0, Number(form.uatCredits || 0)),
      liveCredits: Math.max(0, Number(form.liveCredits || 0)),
      ipWhitelistingRequired: form.ipWhitelistingRequired,
      ips: form.ips.split(',').map((ip) => ip.trim()).filter(Boolean),
      apis: form.apis.length ? form.apis : ['Bureau Advanced'],
      successRate: '-',
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Client name">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input-base" placeholder="Ketav Global Finance" />
        </Field>
        <Field label="Country">
          <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="input-base" placeholder="UAE" />
        </Field>
        <Field label="Technical email">
          <input value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} className="input-base" placeholder="tech@client.com" />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })} className="input-base">
            <option>UAT</option>
            <option>Production</option>
            <option>Review</option>
            <option>Suspended</option>
          </select>
        </Field>
        <Field label="UAT credits">
          <input value={form.uatCredits} onChange={(event) => setForm({ ...form, uatCredits: event.target.value })} className="input-base" type="number" min="0" />
        </Field>
        <Field label="Production credits">
          <input value={form.liveCredits} onChange={(event) => setForm({ ...form, liveCredits: event.target.value })} className="input-base" type="number" min="0" />
        </Field>
      </div>

      <div className="rounded-lg border border-border bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-900 text-foreground">IP whitelisting required</p>
            <p className="text-xs font-700 text-muted-foreground">Disable only for UAT/demo clients or approved internal testing.</p>
          </div>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, ipWhitelistingRequired: !prev.ipWhitelistingRequired }))}
            className={classNames('h-9 rounded-lg px-4 text-xs font-900 text-white', form.ipWhitelistingRequired ? 'bg-emerald-600' : 'bg-amber-500')}
          >
            {form.ipWhitelistingRequired ? 'Required' : 'Optional'}
          </button>
        </div>
        <div className="mt-4">
          <Field label="Allowed IPs">
            <input value={form.ips} onChange={(event) => setForm({ ...form, ips: event.target.value })} className="input-base" placeholder="103.82.44.18, 185.64.112.90" />
          </Field>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-900 uppercase tracking-wide text-slate-500">API access</p>
        <div className="flex flex-wrap gap-2">
          {apiProducts.map((api) => (
            <button
              key={api}
              type="button"
              onClick={() => toggleApi(api)}
              className={classNames('rounded-lg border px-3 py-2 text-xs font-900', form.apis.includes(api) ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-border bg-white text-slate-600')}
            >
              {api}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-900 text-foreground">Cancel</button>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-900 text-white">Create Client</button>
      </div>
    </form>
  );
}

function KeyForm({
  clients,
  initialClientId,
  onSubmit,
  onCancel,
}: {
  clients: Client[];
  initialClientId?: string;
  onSubmit: (key: ApiKeyRecord) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    clientId: initialClientId || clients[0]?.id || '',
    environment: 'UAT' as Environment,
    api: 'Bureau Advanced' as ApiProduct,
    label: '',
  });
  const selectedClient = clients.find((client) => client.id === form.clientId);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.clientId) return;
    onSubmit({
      id: randomId('key'),
      clientId: form.clientId,
      environment: form.environment,
      api: form.api,
      label: form.label.trim() || `${selectedClient?.name || 'Client'} ${form.environment} ${form.api}`,
      prefix: keyPrefix(form.environment),
      status: 'Active',
      createdAt: todayLabel(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Client">
          <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })} className="input-base">
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </Field>
        <Field label="Environment">
          <select value={form.environment} onChange={(event) => setForm({ ...form, environment: event.target.value as Environment })} className="input-base">
            {environments.map((env) => <option key={env}>{env}</option>)}
          </select>
        </Field>
        <Field label="API">
          <select value={form.api} onChange={(event) => setForm({ ...form, api: event.target.value as ApiProduct })} className="input-base">
            {apiProducts.map((api) => <option key={api}>{api}</option>)}
          </select>
        </Field>
        <Field label="Label">
          <input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className="input-base" placeholder="Production bureau key" />
        </Field>
      </div>
      {selectedClient ? (
        <div className="rounded-lg border border-border bg-slate-50 p-4">
          <p className="text-sm font-900 text-foreground">{selectedClient.name}</p>
          <p className="text-xs font-700 text-muted-foreground">
            IP policy: {selectedClient.ipWhitelistingRequired ? 'Required' : 'Optional'} - APIs: {selectedClient.apis.join(', ')}
          </p>
        </div>
      ) : null}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-900 text-foreground">Cancel</button>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-900 text-white">Generate Key</button>
      </div>
    </form>
  );
}

function ManageClientModal({
  client,
  onClose,
  onUpdate,
  onAddIp,
  onRemoveIp,
  onAddCredits,
  onCreateKey,
}: {
  client: Client;
  onClose: () => void;
  onUpdate: (client: Client) => void;
  onAddIp: (clientId: string, ip: string) => void;
  onRemoveIp: (clientId: string, ip: string) => void;
  onAddCredits: (clientId: string, environment: Environment, credits: number) => void;
  onCreateKey: (clientId: string) => void;
}) {
  const [ip, setIp] = useState('');
  const [credits, setCredits] = useState('10');
  const [creditEnv, setCreditEnv] = useState<Environment>('UAT');

  return (
    <Modal title={`Manage ${client.name}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard label="UAT Credits" value={String(client.uatCredits)} helper="sandbox balance" icon={WalletCards} tone="bg-blue-50 text-blue-700" />
          <MetricCard label="Live Credits" value={String(client.liveCredits)} helper="production balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
          <MetricCard label="API Keys" value={client.apis.length.toString()} helper={client.apis.join(', ')} icon={KeyRound} tone="bg-violet-50 text-violet-700" />
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-900 text-foreground">IP whitelisting policy</p>
              <p className="text-xs font-700 text-muted-foreground">When required, requests from non-listed IPs should be blocked before vendor call.</p>
            </div>
            <button
              onClick={() => onUpdate({ ...client, ipWhitelistingRequired: !client.ipWhitelistingRequired })}
              className={classNames('h-9 rounded-lg px-4 text-xs font-900 text-white', client.ipWhitelistingRequired ? 'bg-emerald-600' : 'bg-amber-500')}
            >
              {client.ipWhitelistingRequired ? 'Required' : 'Optional'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {client.ips.length ? client.ips.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-800 text-slate-700">
                {item}
                <button onClick={() => onRemoveIp(client.id, item)} className="text-slate-500"><X size={12} /></button>
              </span>
            )) : <StatusPill tone="amber">No IPs added</StatusPill>}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={ip} onChange={(event) => setIp(event.target.value)} className="input-base" placeholder="Add IP address" />
            <button
              onClick={() => {
                onAddIp(client.id, ip);
                setIp('');
              }}
              className="rounded-lg bg-slate-950 px-4 text-sm font-900 text-white"
            >
              Add
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-900 text-foreground">Add credits</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select value={creditEnv} onChange={(event) => setCreditEnv(event.target.value as Environment)} className="input-base">
              <option>UAT</option>
              <option>Production</option>
            </select>
            <input value={credits} onChange={(event) => setCredits(event.target.value)} className="input-base" type="number" min="1" />
            <button
              onClick={() => {
                onAddCredits(client.id, creditEnv, Math.max(1, Number(credits || 1)));
              }}
              className="rounded-lg bg-blue-600 px-4 text-sm font-900 text-white"
            >
              Add Credits
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button onClick={() => onCreateKey(client.id)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-900 text-white">Generate API Key</button>
          <button onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-900 text-foreground">Done</button>
        </div>
      </div>
    </Modal>
  );
}

function OverviewSection({
  clients,
  keys,
  logs,
  onNewClient,
  onCreateKey,
  onManage,
}: {
  clients: Client[];
  keys: ApiKeyRecord[];
  logs: UsageLog[];
  onNewClient: () => void;
  onCreateKey: (clientId?: string) => void;
  onManage: (clientId: string) => void;
}) {
  const activeClients = clients.filter((client) => client.status !== 'Review' && client.status !== 'Suspended').length;
  const liveCredits = clients.reduce((sum, client) => sum + client.liveCredits, 0);
  return (
    <>
      <section className="mb-5 rounded-lg border border-border bg-card shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-border p-5 xl:border-b-0 xl:border-r">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-900 uppercase tracking-wide text-blue-700">
              <ShieldCheck size={13} />
              UAT + Production Gateway
            </div>
            <h2 className="max-w-3xl text-2xl font-900 tracking-normal text-foreground">
              Manage international API clients with optional IP whitelist policy, credits, keys, audit logs, and normalized response.
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label="Clients" value={`${activeClients}`} helper={`${clients.length} total onboarded`} icon={Globe2} tone="bg-blue-50 text-blue-700" />
              <MetricCard label="Live Credits" value={liveCredits.toLocaleString('en-IN')} helper="available balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
              <MetricCard label="API Keys" value={keys.length.toString()} helper="issued keys" icon={KeyRound} tone="bg-violet-50 text-violet-700" />
              <MetricCard label="Requests Today" value={logs.length.toString()} helper="demo activity" icon={Activity} tone="bg-amber-50 text-amber-700" />
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-sm font-900 text-foreground">Request Pipeline</h3>
            <div className="mt-4 space-y-3">
              {pipelineSteps.map(([title, text, Icon]) => (
                <div key={String(title)} className="flex gap-3 rounded-lg border border-border bg-slate-50 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
                    {React.createElement(Icon, { size: 17 })}
                  </span>
                  <div>
                    <p className="text-sm font-900 text-foreground">{title}</p>
                    <p className="text-xs font-600 text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Panel
            title="Enterprise Clients"
            subtitle="Each client has separate keys, credits, API access, and IP policy."
            action={<button onClick={onNewClient} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Plus size={15} />New Client</button>}
          >
            <ClientsTable clients={clients} onManage={onManage} onCreateKey={onCreateKey} />
          </Panel>

          <Panel title="Request Logs" subtitle="Every hit stores environment, IP, credit, vendor request id, and response timing.">
            <LogsTable logs={logs} clients={clients} />
          </Panel>
        </div>

        <div className="space-y-5">
          <ApiKeysPanel keys={keys} clients={clients} />
          <NormalizedResponsePanel />
        </div>
      </section>
    </>
  );
}

function ActiveSection({
  activeNav,
  clients,
  keys,
  logs,
  onNewClient,
  onCreateKey,
  onManage,
  onRemoveIp,
  onAddIp,
  onUpdateClient,
  onAddCredits,
}: {
  activeNav: NavItem;
  clients: Client[];
  keys: ApiKeyRecord[];
  logs: UsageLog[];
  onNewClient: () => void;
  onCreateKey: (clientId?: string) => void;
  onManage: (clientId: string) => void;
  onRemoveIp: (clientId: string, ip: string) => void;
  onAddIp: (clientId: string, ip: string) => void;
  onUpdateClient: (client: Client) => void;
  onAddCredits: (clientId: string, environment: Environment, credits: number) => void;
}) {
  if (activeNav === 'Overview') return <OverviewSection clients={clients} keys={keys} logs={logs} onNewClient={onNewClient} onCreateKey={onCreateKey} onManage={onManage} />;

  if (activeNav === 'Clients') {
    return (
      <Panel
        title="Client Management"
        subtitle="Create enterprise clients, assign API access, configure IP policy, and manage per-client keys."
        action={<button onClick={onNewClient} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Plus size={15} />New Client</button>}
      >
        <ClientsTable clients={clients} onManage={onManage} onCreateKey={onCreateKey} />
      </Panel>
    );
  }

  if (activeNav === 'Environments') {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {environments.map((environment) => {
          const totalCredits = clients.reduce((sum, client) => sum + (environment === 'Production' ? client.liveCredits : client.uatCredits), 0);
          const keyCount = keys.filter((key) => key.environment === environment).length;
          return (
            <div key={environment} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-900 text-foreground">{environment} Environment</h3>
                  <p className="mt-1 text-sm font-600 text-muted-foreground">
                    {environment === 'Production' ? 'Live billing, strict controls, real vendor hits.' : 'Sandbox testing, sample credits, technical validation.'}
                  </p>
                </div>
                <StatusPill tone={environment === 'Production' ? 'green' : 'blue'}>Active</StatusPill>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricCard label="Credits" value={totalCredits.toLocaleString('en-IN')} helper="available" icon={WalletCards} tone={environment === 'Production' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'} />
                <MetricCard label="Keys" value={keyCount.toString()} helper="issued keys" icon={KeyRound} tone="bg-violet-50 text-violet-700" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (activeNav === 'API Keys') {
    const clientById = new Map(clients.map((client) => [client.id, client]));
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <ApiKeysPanel keys={keys} clients={clients} />
        <Panel
          title="Issued Keys"
          subtitle="Generate separate keys per client, environment, and API product."
          action={<button onClick={() => onCreateKey()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><KeyRound size={15} />Generate Key</button>}
        >
          <div className="divide-y divide-border">
            {keys.map((key) => {
              const client = clientById.get(key.clientId);
              return (
                <div key={key.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-900 text-foreground">{client?.name || 'Unknown client'}</p>
                    <p className="text-xs font-700 text-muted-foreground">{key.label}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={key.environment === 'Production' ? 'green' : 'blue'}>{key.environment}</StatusPill>
                    <StatusPill tone="slate">{key.api}</StatusPill>
                    <StatusPill tone="green">{key.prefix}........</StatusPill>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    );
  }

  if (activeNav === 'IP Whitelist') {
    return (
      <Panel title="IP Whitelist" subtitle="Per-client choice: require whitelist for strict clients, or keep optional for UAT/demo clients.">
        <div className="divide-y divide-border">
          {clients.map((client) => (
            <div key={client.id} className="p-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[0.9fr_0.8fr_1.4fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-900 text-foreground">{client.name}</p>
                  <p className="text-xs font-700 text-muted-foreground">{client.country}</p>
                </div>
                <button
                  onClick={() => onUpdateClient({ ...client, ipWhitelistingRequired: !client.ipWhitelistingRequired })}
                  className={classNames('h-9 rounded-lg px-3 text-xs font-900 text-white', client.ipWhitelistingRequired ? 'bg-emerald-600' : 'bg-amber-500')}
                >
                  {client.ipWhitelistingRequired ? 'Required' : 'Optional'}
                </button>
                <div className="flex flex-wrap gap-2">
                  {client.ips.length ? client.ips.map((ip) => (
                    <span key={ip} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-800 text-slate-700">
                      {ip}
                      <button onClick={() => onRemoveIp(client.id, ip)}><X size={12} /></button>
                    </span>
                  )) : <StatusPill tone="amber">No IPs added</StatusPill>}
                </div>
                <button onClick={() => onManage(client.id)} className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground">Update IPs</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (activeNav === 'Credits') {
    const uatCredits = clients.reduce((sum, client) => sum + client.uatCredits, 0);
    const liveCredits = clients.reduce((sum, client) => sum + client.liveCredits, 0);
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="UAT Credits" value={uatCredits.toLocaleString('en-IN')} helper="across clients" icon={WalletCards} tone="bg-blue-50 text-blue-700" />
          <MetricCard label="Live Credits" value={liveCredits.toLocaleString('en-IN')} helper="production balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
          <MetricCard label="Used Today" value={logs.filter((log) => log.status === 'Success').length.toString()} helper="successful calls" icon={Activity} tone="bg-violet-50 text-violet-700" />
          <MetricCard label="Failed Charges" value="0" helper="no failed deductions" icon={ShieldCheck} tone="bg-amber-50 text-amber-700" />
        </div>
        <Panel title="Client Credit Control" subtitle="Add credits client-wise for UAT or Production from each client manage panel.">
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <div key={client.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-900 text-foreground">{client.name}</p>
                  <p className="text-xs font-700 text-muted-foreground">UAT {client.uatCredits} - Production {client.liveCredits}</p>
                </div>
                <button onClick={() => onManage(client.id)} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white">Manage Credits</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  if (activeNav === 'Logs') {
    return (
      <Panel title="Request Logs" subtitle="Searchable audit trail for every API request, including client, environment, source IP, status, and charge.">
        <LogsTable logs={logs} clients={clients} />
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="API Documentation" subtitle="Client-facing docs expose CreditTrust endpoints, headers, payload, and normalized response only.">
        <div className="divide-y divide-border">
          {[
            ['Bureau API Standard', 'POST /api/v1/bureau', 'Full customer details to bureau response.'],
            ['Bureau API Advanced', 'POST /api/v1/bureau-advanced', 'Mobile number and consent to bureau response.'],
            ['Mobile Prefill API', 'POST /api/v1/mobile-prefill', 'Mobile number to normalized profile data.'],
          ].map(([title, endpoint, text]) => (
            <div key={title} className="p-4">
              <p className="text-sm font-900 text-foreground">{title}</p>
              <p className="mt-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-800 text-white">{endpoint}</p>
              <p className="mt-2 text-xs font-700 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Panel>
      <NormalizedResponsePanel />
    </div>
  );
}

export default function ApiConsolePage() {
  const [activeNav, setActiveNav] = useState<NavItem>('Overview');
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [keys, setKeys] = useState<ApiKeyRecord[]>(initialKeys);
  const [logs, setLogs] = useState<UsageLog[]>(initialLogs);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [keyModalClientId, setKeyModalClientId] = useState<string | undefined>();
  const [managedClientId, setManagedClientId] = useState<string | null>(null);
  const [latestSecret, setLatestSecret] = useState('');

  const managedClient = clients.find((client) => client.id === managedClientId) || null;

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev]);
    setClientModalOpen(false);
    setActiveNav('Clients');
  };

  const updateClient = (client: Client) => {
    setClients((prev) => prev.map((item) => item.id === client.id ? client : item));
  };

  const addIp = (clientId: string, ip: string) => {
    const cleanIp = ip.trim();
    if (!cleanIp) return;
    setClients((prev) => prev.map((client) => client.id === clientId && !client.ips.includes(cleanIp)
      ? { ...client, ips: [...client.ips, cleanIp] }
      : client));
  };

  const removeIp = (clientId: string, ip: string) => {
    setClients((prev) => prev.map((client) => client.id === clientId
      ? { ...client, ips: client.ips.filter((item) => item !== ip) }
      : client));
  };

  const addCredits = (clientId: string, environment: Environment, credits: number) => {
    setClients((prev) => prev.map((client) => {
      if (client.id !== clientId) return client;
      return environment === 'Production'
        ? { ...client, liveCredits: client.liveCredits + credits }
        : { ...client, uatCredits: client.uatCredits + credits };
    }));
    setLogs((prev) => [{
      id: `ct_credit_${Date.now()}`,
      clientId,
      environment,
      api: 'Bureau Advanced',
      status: 'Success',
      latency: '-',
      charge: `+${credits} credits`,
      ip: 'admin',
    }, ...prev]);
  };

  const createKey = (key: ApiKeyRecord) => {
    setKeys((prev) => [key, ...prev]);
    setLatestSecret(`${key.prefix}_${Math.random().toString(36).slice(2, 18)}`);
    setKeyModalClientId(undefined);
    setActiveNav('API Keys');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] border-r border-slate-800 bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-base font-900">CT</div>
          <div>
            <p className="text-base font-900 leading-tight">CreditTrust</p>
            <p className="text-xs font-600 text-slate-400">API Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={classNames(
                'flex h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-700 transition',
                activeNav === item ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white',
              )}
            >
              <span>{item}</span>
              {activeNav === item && <ArrowRight size={15} />}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs font-800 uppercase tracking-wide text-slate-400">Gateway Health</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-800 text-emerald-300">
              <CheckCircle2 size={16} />
              Operational
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-[260px]">
        <header className="sticky top-0 z-10 border-b border-border bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-900 uppercase tracking-wide text-blue-700">api.credittrust.in</p>
              <h1 className="text-2xl font-900 tracking-normal text-foreground">Enterprise API Access Console</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setActiveNav('Docs')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-800 text-foreground shadow-sm">
                <BookOpen size={16} />
                API Docs
              </button>
              <button onClick={() => setClientModalOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-800 text-white shadow-sm">
                <KeyRound size={16} />
                Create Client
              </button>
            </div>
          </div>
          {latestSecret ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-800 text-emerald-800">
              New key generated: <span className="font-900">{latestSecret}</span>
            </div>
          ) : null}
        </header>

        <div className="px-4 py-6 lg:px-8">
          <ActiveSection
            activeNav={activeNav}
            clients={clients}
            keys={keys}
            logs={logs}
            onNewClient={() => setClientModalOpen(true)}
            onCreateKey={(clientId) => setKeyModalClientId(clientId || '')}
            onManage={setManagedClientId}
            onRemoveIp={removeIp}
            onAddIp={addIp}
            onUpdateClient={updateClient}
            onAddCredits={addCredits}
          />
        </div>
      </main>

      {clientModalOpen ? (
        <Modal title="Create New API Client" onClose={() => setClientModalOpen(false)}>
          <ClientForm onSubmit={addClient} onCancel={() => setClientModalOpen(false)} />
        </Modal>
      ) : null}

      {keyModalClientId !== undefined ? (
        <Modal title="Generate Client API Key" onClose={() => setKeyModalClientId(undefined)}>
          <KeyForm clients={clients} initialClientId={keyModalClientId || undefined} onSubmit={createKey} onCancel={() => setKeyModalClientId(undefined)} />
        </Modal>
      ) : null}

      {managedClient ? (
        <ManageClientModal
          client={managedClient}
          onClose={() => setManagedClientId(null)}
          onUpdate={updateClient}
          onAddIp={addIp}
          onRemoveIp={removeIp}
          onAddCredits={addCredits}
          onCreateKey={(clientId) => setKeyModalClientId(clientId)}
        />
      ) : null}
    </div>
  );
}
