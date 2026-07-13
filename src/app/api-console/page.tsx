'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Copy, Download, Globe2, KeyRound, Plus, ShieldCheck, WalletCards, X,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type NavItem = 'Overview' | 'Clients' | 'Environments' | 'API Keys' | 'IP Whitelist' | 'Credits' | 'Docs';
type Environment = 'UAT' | 'Production';
type ClientStatus = 'Production' | 'UAT' | 'Review' | 'Suspended';
type ApiProduct = 'Bureau Standard' | 'Bureau Advanced' | 'Mobile Prefill';
type ResponseMode = 'Full JSON' | 'CreditTrust Standard' | 'Custom';

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
  responseMode: ResponseMode;
  responseFields: string[];
  successRate: string;
};

type ApiKeyRecord = {
  id: string;
  clientId: string;
  environment: Environment;
  api: ApiProduct;
  label: string;
  prefix: string;
  secret?: string;
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

const navItems: NavItem[] = ['Overview', 'Clients', 'Environments', 'API Keys', 'IP Whitelist', 'Credits', 'Docs'];
const apiProducts: ApiProduct[] = ['Bureau Standard', 'Bureau Advanced', 'Mobile Prefill'];
const environments: Environment[] = ['UAT', 'Production'];
const standardResponseFields = ['success', 'request_id', 'score', 'status', 'report_id', 'customer_name', 'bureau_summary'];
const responseFieldOptions = [
  ['success', 'Request success'],
  ['request_id', 'CreditTrust request id'],
  ['score', 'Bureau score'],
  ['status', 'Hit/no-hit status'],
  ['report_id', 'Report id'],
  ['customer_name', 'Customer name'],
  ['pan_masked', 'Masked PAN'],
  ['mobile_masked', 'Masked mobile'],
  ['bureau_summary', 'Bureau summary'],
  ['accounts_summary', 'Accounts summary'],
  ['enquiries_summary', 'Enquiries summary'],
  ['risk_band', 'Risk band'],
  ['raw_report', 'Raw provider report'],
] as const;

const sampleFieldValues: Record<string, unknown> = {
  success: true,
  request_id: 'ct_req_20260706_1021',
  score: 742,
  status: 'hit',
  report_id: 'ct_rpt_81f4',
  customer_name: 'CUSTOMER NAME',
  pan_masked: 'ABCDE****F',
  mobile_masked: '98******10',
  bureau_summary: { active_accounts: 4, overdue_amount: 0 },
  accounts_summary: { total_accounts: 12, live_accounts: 4 },
  enquiries_summary: { last_30_days: 2, last_90_days: 5 },
  risk_band: 'low',
  raw_report: { provider: 'cibil', response: 'full provider json' },
};

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
    responseMode: 'CreditTrust Standard',
    responseFields: ['score', 'status', 'report_id', 'customer_name', 'accounts_summary'],
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
    responseMode: 'Full JSON',
    responseFields: ['full_response'],
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
    responseMode: 'Custom',
    responseFields: ['full_name', 'dob', 'pan', 'addresses', 'emails'],
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
    secret: 'ctuat_x9f4a8d1_demo_key_7f42b91c',
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
    secret: 'ctlive_81aa9c42_demo_key_51ca7d22',
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
    secret: 'ctuat_771e09bd_demo_key_a9f4d017',
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

const normalizedResponse = `{
  "success": true,
  "request_id": "ct_req_20260704_9121",
  "data": {
    "score": 742,
    "status": "hit",
    "bureau": {
      "provider": "CIBIL",
      "report_id": "ct_rpt_81f4"
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

function keyValue(key: ApiKeyRecord) {
  return key.secret || `${key.prefix}_full_key`;
}

function endpointFor(api: ApiProduct, environment: Environment) {
  const envQuery = environment === 'UAT' ? '?env=uat' : '';
  if (api === 'Bureau Standard') return `POST https://api.credittrust.in/api/v1/bureau${envQuery}`;
  if (api === 'Bureau Advanced') return `POST https://api.credittrust.in/api/v1/bureau-advanced${envQuery}`;
  return `POST https://api.credittrust.in/api/v1/mobile-prefill${envQuery}`;
}

function payloadFor(api: ApiProduct) {
  if (api === 'Bureau Standard') {
    return `{
  "firstName": "",
  "lastName": "",
  "dob": "YYYY-MM-DD",
  "gender": "male",
  "pan": "",
  "mobile": "",
  "address": "",
  "state": "MADHYA PRADESH",
  "pincode": "",
  "consent": true
}`;
  }
  if (api === 'Bureau Advanced') {
    return `{
  "mobile": "",
  "consent": true
}`;
  }
  return `{
  "mobile_number": ""
  }`;
}

function fieldsForMode(mode: ResponseMode, fields: string[]) {
  if (mode === 'Full JSON') return ['raw_report'];
  if (mode === 'CreditTrust Standard') return standardResponseFields;
  return fields.length ? fields : ['success', 'request_id', 'status'];
}

function responsePreview(mode: ResponseMode, fields: string[]) {
  const selectedFields = fieldsForMode(mode, fields);
  return selectedFields.reduce<Record<string, unknown>>((preview, field) => {
    preview[field] = sampleFieldValues[field] ?? 'value';
    return preview;
  }, {});
}

function buildApiDoc(client: Client, key: ApiKeyRecord) {
  const responseFields = fieldsForMode(client.responseMode, client.responseFields);
  return `CreditTrust API Documentation

Client: ${client.name}
Environment: ${key.environment}
API: ${key.api}
Response: ${client.responseMode}
Fields: ${responseFields.join(', ')}
Endpoint: ${endpointFor(key.api, key.environment)}

Headers:
content-type: application/json
accept: application/json
x-api-key: ${keyValue(key)}

Payload:
${payloadFor(key.api)}
`;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
  selectedClientId,
  onSelect,
  onManage,
  onCreateKey,
}: {
  clients: Client[];
  selectedClientId?: string;
  onSelect?: (clientId: string) => void;
  onManage: (clientId: string) => void;
  onCreateKey: (clientId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead className="bg-slate-50">
          <tr>
            {['Client', 'Status', 'APIs', 'Response', 'Credits', 'IP Policy', 'Whitelisted IPs', 'Action'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.map((client) => (
            <tr
              key={client.id}
              onClick={() => onSelect?.(client.id)}
              className={classNames('cursor-pointer bg-white transition hover:bg-slate-50', selectedClientId === client.id && 'bg-blue-50/60')}
            >
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
              <td className="px-4 py-4">
                <div className="flex flex-col gap-1">
                  <StatusPill tone={client.responseMode === 'Full JSON' ? 'amber' : client.responseMode === 'Custom' ? 'blue' : 'green'}>{client.responseMode}</StatusPill>
                  <span className="text-xs font-700 text-muted-foreground">{fieldsForMode(client.responseMode, client.responseFields).length} fields</span>
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
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onManage(client.id);
                    }}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-900 text-foreground"
                  >
                    Manage
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onCreateKey(client.id);
                    }}
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

function ClientKeyDirectory({
  keys,
  clients,
  onCreateKey,
}: {
  keys: ApiKeyRecord[];
  clients: Client[];
  onCreateKey: (clientId?: string) => void;
}) {
  const copyKey = (key: ApiKeyRecord) => {
    navigator.clipboard?.writeText(keyValue(key));
  };

  return (
    <Panel
      title="Client API Keys"
      action={<button onClick={() => onCreateKey()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><KeyRound size={15} />Generate Key</button>}
    >
      <div className="divide-y divide-border">
        {clients.map((client) => {
          const clientKeys = keys.filter((key) => key.clientId === client.id);
          const uatKeys = clientKeys.filter((key) => key.environment === 'UAT');
          const productionKeys = clientKeys.filter((key) => key.environment === 'Production');
          return (
            <div key={client.id} className="p-4">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-900 text-foreground">{client.name}</p>
                  <p className="text-xs font-700 text-muted-foreground">{client.country} - {client.contactEmail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : client.status === 'Suspended' ? 'red' : 'amber'}>{client.status}</StatusPill>
                  <StatusPill tone={client.responseMode === 'Full JSON' ? 'amber' : client.responseMode === 'Custom' ? 'blue' : 'green'}>{client.responseMode}</StatusPill>
                  <button onClick={() => onCreateKey(client.id)} className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground">Generate Key</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {([
                  ['UAT', uatKeys],
                  ['Production', productionKeys],
                ] as Array<[Environment, ApiKeyRecord[]]>).map(([environment, environmentKeys]) => (
                  <div key={environment} className="rounded-lg border border-border bg-slate-50">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <p className="text-sm font-900 text-foreground">{environment}</p>
                      <StatusPill tone={environment === 'Production' ? 'green' : 'blue'}>{environmentKeys.length} Keys</StatusPill>
                    </div>
                    <div className="space-y-3 p-4">
                      {environmentKeys.length ? environmentKeys.map((key) => (
                        <div key={key.id} className="rounded-lg border border-border bg-white p-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <StatusPill tone="slate">{key.api}</StatusPill>
                            <StatusPill tone={key.status === 'Active' ? 'green' : 'red'}>{key.status}</StatusPill>
                            <span className="text-xs font-800 text-muted-foreground">{key.createdAt}</span>
                          </div>
                          <div className="rounded-lg bg-slate-950 px-3 py-3 font-mono text-xs font-800 leading-5 text-white">
                            <span className="break-all">{keyValue(key)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button onClick={() => copyKey(key)} className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground">
                              <Copy size={13} />
                              Copy
                            </button>
                            <button
                              onClick={() => downloadTextFile(`${client.name.replace(/\s+/g, '-').toLowerCase()}-${key.environment.toLowerCase()}-${key.api.replace(/\s+/g, '-').toLowerCase()}-api-doc.txt`, buildApiDoc(client, key))}
                              className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground"
                            >
                              <Download size={13} />
                              Doc
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-lg border border-dashed border-border bg-white px-4 py-6 text-sm font-800 text-muted-foreground">No {environment} key</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ProductCatalog() {
  const products = [
    ['Bureau Standard', 'POST /api/v1/bureau', 'Live-ready'],
    ['Bureau Advanced', 'POST /api/v1/bureau-advanced', 'Priority'],
    ['Mobile Prefill', 'POST /api/v1/mobile-prefill', 'UAT'],
  ];
  return (
    <Panel title="API Products">
      <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
        {products.map(([name, endpoint, status]) => (
          <div key={name} className="rounded-lg border border-border bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-900 text-foreground">{name}</p>
                <p className="mt-1 text-xs font-800 text-muted-foreground">{endpoint}</p>
              </div>
              <StatusPill tone={status === 'Priority' ? 'green' : status === 'UAT' ? 'blue' : 'slate'}>{status}</StatusPill>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ClientDetailPanel({
  client,
  keys,
  onManage,
  onCreateKey,
}: {
  client?: Client;
  keys: ApiKeyRecord[];
  onManage: (clientId: string) => void;
  onCreateKey: (clientId: string) => void;
}) {
  if (!client) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Globe2 size={20} />
        </div>
        <p className="text-sm font-900 text-foreground">Select a client</p>
      </div>
    );
  }

  const clientKeys = keys.filter((key) => key.clientId === client.id);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-900 text-foreground">{client.name}</p>
            <p className="text-xs font-700 text-muted-foreground">{client.country} - {client.contactEmail}</p>
          </div>
          <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : client.status === 'Suspended' ? 'red' : 'amber'}>{client.status}</StatusPill>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">UAT Credits</p>
            <p className="mt-1 text-xl font-900 text-foreground">{client.uatCredits}</p>
          </div>
          <div className="rounded-lg border border-border bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Live Credits</p>
            <p className="mt-1 text-xl font-900 text-foreground">{client.liveCredits}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {client.apis.map((api) => <StatusPill key={api} tone="slate">{api}</StatusPill>)}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => onManage(client.id)} className="h-9 rounded-lg border border-border bg-white text-xs font-900 text-foreground">Manage Setup</button>
          <button onClick={() => onCreateKey(client.id)} className="h-9 rounded-lg bg-blue-600 text-xs font-900 text-white">Generate Key</button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-900 text-foreground">Client Summary</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">IP Policy</p>
            <p className="mt-1 text-sm font-900 text-foreground">{client.ipWhitelistingRequired ? 'Required' : 'Optional'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">IPs</p>
            <p className="mt-1 text-sm font-900 text-foreground">{client.ips.length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Keys</p>
            <p className="mt-1 text-sm font-900 text-foreground">{clientKeys.length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Response</p>
            <p className="mt-1 text-sm font-900 text-foreground">{client.responseMode}</p>
            <p className="mt-1 text-xs font-700 text-muted-foreground">{fieldsForMode(client.responseMode, client.responseFields).length} fields</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NormalizedResponsePanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="text-emerald-700" size={18} />
        <h3 className="text-base font-900 text-foreground">Response Format</h3>
      </div>
      <pre className="max-h-[260px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100 scrollbar-thin">
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
      responseMode: 'CreditTrust Standard',
      responseFields: ['score', 'status', 'report_id', 'customer_name', 'accounts_summary'],
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
  const effectiveFields = fieldsForMode(client.responseMode, client.responseFields);
  const preview = responsePreview(client.responseMode, client.responseFields);

  const updateResponseMode = (mode: ResponseMode) => {
    onUpdate({
      ...client,
      responseMode: mode,
      responseFields: mode === 'Full JSON' ? ['raw_report'] : mode === 'CreditTrust Standard' ? standardResponseFields : client.responseFields,
    });
  };

  const toggleResponseField = (field: string) => {
    const nextFields = client.responseFields.includes(field)
      ? client.responseFields.filter((item) => item !== field)
      : [...client.responseFields, field];
    onUpdate({ ...client, responseMode: 'Custom', responseFields: nextFields });
  };

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

        <div className="rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-900 text-foreground">Response builder</p>
            <p className="mt-1 text-xs font-700 text-muted-foreground">Is client ko API hit ke baad kya JSON milega yahan set karo.</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {(['CreditTrust Standard', 'Full JSON', 'Custom'] as ResponseMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateResponseMode(mode)}
                className={classNames(
                  'rounded-lg border p-3 text-left transition',
                  client.responseMode === mode ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-border bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                <p className="text-sm font-900">{mode}</p>
                <p className="mt-1 text-xs font-700">
                  {mode === 'CreditTrust Standard' ? 'Safe fixed schema' : mode === 'Full JSON' ? 'Provider response pass-through' : 'Choose exact fields'}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
            <div className={classNames('rounded-lg border border-border bg-slate-50 p-4', client.responseMode !== 'Custom' && 'opacity-60')}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Allowed fields</p>
                <StatusPill tone={client.responseMode === 'Custom' ? 'blue' : 'slate'}>{effectiveFields.length}</StatusPill>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {responseFieldOptions.map(([field, label]) => {
                  const checked = effectiveFields.includes(field);
                  return (
                    <label key={field} className={classNames('flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs font-800', checked ? 'border-blue-200 bg-white text-blue-800' : 'border-transparent bg-white text-slate-600')}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={client.responseMode !== 'Custom'}
                        onChange={() => toggleResponseField(field)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block font-900">{field}</span>
                        <span className="block text-muted-foreground">{label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Response preview</p>
              <pre className="mt-3 max-h-[320px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {effectiveFields.map((field) => <StatusPill key={field} tone="slate">{field}</StatusPill>)}
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
  selectedClientId,
  onNewClient,
  onCreateKey,
  onManage,
  onSelectClient,
}: {
  clients: Client[];
  keys: ApiKeyRecord[];
  selectedClientId?: string;
  onNewClient: () => void;
  onCreateKey: (clientId?: string) => void;
  onManage: (clientId: string) => void;
  onSelectClient: (clientId: string) => void;
}) {
  const activeClients = clients.filter((client) => client.status !== 'Review' && client.status !== 'Suspended').length;
  const uatCredits = clients.reduce((sum, client) => sum + client.uatCredits, 0);
  const liveCredits = clients.reduce((sum, client) => sum + client.liveCredits, 0);
  const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
  return (
    <>
      <section className="mb-5 rounded-lg border border-border bg-card shadow-sm">
        <div className="p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-900 uppercase tracking-wide text-blue-700">
            <ShieldCheck size={13} />
            Control Panel
          </div>
          <h2 className="text-2xl font-900 tracking-normal text-foreground">Client setup and API access</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Clients" value={`${activeClients}`} helper={`${clients.length} total`} icon={Globe2} tone="bg-blue-50 text-blue-700" />
            <MetricCard label="UAT Credits" value={uatCredits.toLocaleString('en-IN')} helper="available" icon={WalletCards} tone="bg-blue-50 text-blue-700" />
            <MetricCard label="Live Credits" value={liveCredits.toLocaleString('en-IN')} helper="available" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
            <MetricCard label="API Keys" value={keys.length.toString()} helper="issued" icon={KeyRound} tone="bg-violet-50 text-violet-700" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_380px]">
        <Panel
          title="Clients"
          action={<button onClick={onNewClient} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Plus size={15} />New Client</button>}
        >
          <ClientsTable clients={clients} selectedClientId={selectedClient?.id} onSelect={onSelectClient} onManage={onManage} onCreateKey={onCreateKey} />
        </Panel>
        <div className="space-y-5">
          <ClientDetailPanel client={selectedClient} keys={keys} onManage={onManage} onCreateKey={onCreateKey} />
        </div>
      </section>
    </>
  );
}

function DocsPanel({ clients, keys }: { clients: Client[]; keys: ApiKeyRecord[] }) {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const downloadableKeys = keys.filter((key) => clientById.has(key.clientId));

  const downloadAllDocs = () => {
    const content = downloadableKeys
      .map((key) => buildApiDoc(clientById.get(key.clientId)!, key))
      .join('\n\n----------------------------------------\n\n');
    downloadTextFile('credittrust-api-docs-all-clients.txt', content || 'No API keys created yet.');
  };

  return (
    <div className="space-y-5">
      <Panel
        title="API Docs"
        action={<button onClick={downloadAllDocs} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Download size={15} />Download All</button>}
      >
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
          {apiProducts.map((api) => (
            <div key={api} className="rounded-lg border border-border bg-slate-50 p-4">
              <p className="text-sm font-900 text-foreground">{api}</p>
              <div className="mt-3 space-y-2">
                {environments.map((environment) => (
                  <div key={environment} className="rounded-lg bg-white px-3 py-2">
                    <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">{environment}</p>
                    <p className="mt-1 break-all text-xs font-900 text-foreground">{endpointFor(api, environment)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Client Keys">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50">
              <tr>
                {['Client', 'Environment', 'API', 'Key', 'Doc'].map((head) => (
                  <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {downloadableKeys.map((key) => {
                const client = clientById.get(key.clientId)!;
                return (
                  <tr key={key.id} className="bg-white">
                    <td className="px-4 py-4">
                      <p className="text-sm font-900 text-foreground">{client.name}</p>
                      <p className="text-xs font-700 text-muted-foreground">{client.contactEmail}</p>
                    </td>
                    <td className="px-4 py-4"><StatusPill tone={key.environment === 'Production' ? 'green' : 'blue'}>{key.environment}</StatusPill></td>
                    <td className="px-4 py-4"><StatusPill tone="slate">{key.api}</StatusPill></td>
                    <td className="px-4 py-4">
                      <div className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-800 text-white">
                        {keyValue(key)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => downloadTextFile(`${client.name.replace(/\s+/g, '-').toLowerCase()}-${key.environment.toLowerCase()}-${key.api.replace(/\s+/g, '-').toLowerCase()}-api-doc.txt`, buildApiDoc(client, key))}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!downloadableKeys.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm font-800 text-muted-foreground">No keys created yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ActiveSection({
  activeNav,
  clients,
  keys,
  selectedClientId,
  onNewClient,
  onCreateKey,
  onManage,
  onSelectClient,
  onRemoveIp,
  onAddIp,
  onUpdateClient,
  onAddCredits,
}: {
  activeNav: NavItem;
  clients: Client[];
  keys: ApiKeyRecord[];
  selectedClientId?: string;
  onNewClient: () => void;
  onCreateKey: (clientId?: string) => void;
  onManage: (clientId: string) => void;
  onSelectClient: (clientId: string) => void;
  onRemoveIp: (clientId: string, ip: string) => void;
  onAddIp: (clientId: string, ip: string) => void;
  onUpdateClient: (client: Client) => void;
  onAddCredits: (clientId: string, environment: Environment, credits: number) => void;
}) {
  if (activeNav === 'Overview') {
    return (
      <OverviewSection
        clients={clients}
        keys={keys}
        selectedClientId={selectedClientId}
        onNewClient={onNewClient}
        onCreateKey={onCreateKey}
        onManage={onManage}
        onSelectClient={onSelectClient}
      />
    );
  }

  if (activeNav === 'Clients') {
    const selectedClient = clients.find((client) => client.id === selectedClientId) || clients[0];
    return (
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_420px]">
        <Panel
          title="Client Management"
          action={<button onClick={onNewClient} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><Plus size={15} />New Client</button>}
        >
          <ClientsTable clients={clients} selectedClientId={selectedClient?.id} onSelect={onSelectClient} onManage={onManage} onCreateKey={onCreateKey} />
        </Panel>
        <ClientDetailPanel client={selectedClient} keys={keys} onManage={onManage} onCreateKey={onCreateKey} />
      </div>
    );
  }

  if (activeNav === 'Environments') {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {environments.map((environment) => {
          const totalCredits = clients.reduce((sum, client) => sum + (environment === 'Production' ? client.liveCredits : client.uatCredits), 0);
          const environmentKeys = keys.filter((key) => key.environment === environment);
          const environmentClients = clients.filter((client) =>
            environment === 'Production'
              ? client.status === 'Production'
              : client.status === 'UAT' || client.status === 'Review' || client.uatCredits > 0,
          );
          const docs = environment === 'Production'
            ? [
              ['Base URL', 'https://api.credittrust.in'],
              ['Standard', 'POST /api/v1/bureau'],
              ['Advanced', 'POST /api/v1/bureau-advanced'],
            ]
            : [
              ['Base URL', 'https://api.credittrust.in'],
              ['Standard UAT', 'POST /api/v1/bureau?env=uat'],
              ['Advanced UAT', 'POST /api/v1/bureau-advanced?env=uat'],
            ];
          return (
            <div key={environment} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-900 text-foreground">{environment} Environment</h3>
                </div>
                <StatusPill tone={environment === 'Production' ? 'green' : 'blue'}>Active</StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-slate-50 p-3">
                  <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Credits</p>
                  <p className="mt-2 text-2xl font-900 text-foreground">{totalCredits.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-lg border border-border bg-slate-50 p-3">
                  <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Keys</p>
                  <p className="mt-2 text-2xl font-900 text-foreground">{environmentKeys.length}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-slate-50 p-3">
                <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">{environment} Docs</p>
                <div className="mt-3 space-y-2">
                  {docs.map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1 rounded-lg bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-900 text-muted-foreground">{label}</span>
                      <span className="break-all text-xs font-900 text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-white">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Clients</p>
                  <StatusPill tone="slate">{environmentClients.length}</StatusPill>
                </div>
                <div className="divide-y divide-border">
                  {environmentClients.length ? environmentClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between gap-3 px-3 py-3">
                      <div>
                        <p className="text-sm font-900 text-foreground">{client.name}</p>
                        <p className="text-xs font-700 text-muted-foreground">{client.country}</p>
                      </div>
                      <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : 'amber'}>{client.status}</StatusPill>
                    </div>
                  )) : (
                    <div className="px-3 py-4 text-sm font-800 text-muted-foreground">No clients</div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-white">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <p className="text-xs font-900 uppercase tracking-wide text-muted-foreground">Keys</p>
                  <StatusPill tone="slate">{environmentKeys.length}</StatusPill>
                </div>
                <div className="divide-y divide-border">
                  {environmentKeys.length ? environmentKeys.map((key) => {
                    const client = clients.find((item) => item.id === key.clientId);
                    return (
                      <div key={key.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-900 text-foreground">{client?.name || 'Unknown client'}</p>
                          <p className="text-xs font-700 text-muted-foreground">{key.api}</p>
                        </div>
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-900 text-slate-700 break-all">{keyValue(key)}</span>
                      </div>
                    );
                  }) : (
                    <div className="px-3 py-4 text-sm font-800 text-muted-foreground">No keys</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (activeNav === 'API Keys') {
    return <ClientKeyDirectory keys={keys} clients={clients} onCreateKey={onCreateKey} />;
  }

  if (activeNav === 'IP Whitelist') {
    return (
      <Panel title="IP Whitelist">
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
        </div>
        <Panel title="Client Credit Control">
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

  if (activeNav === 'Docs') {
    return <DocsPanel clients={clients} keys={keys} />;
  }

  return null;
}

export default function ApiConsolePage() {
  const [activeNav, setActiveNav] = useState<NavItem>('Overview');
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [keys, setKeys] = useState<ApiKeyRecord[]>(initialKeys);
  const [logs, setLogs] = useState<UsageLog[]>(initialLogs);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [keyModalClientId, setKeyModalClientId] = useState<string | undefined>();
  const [managedClientId, setManagedClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id);
  const [latestSecret, setLatestSecret] = useState('');

  const managedClient = clients.find((client) => client.id === managedClientId) || null;

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev]);
    setSelectedClientId(client.id);
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
    const secret = `${key.prefix}_${Math.random().toString(36).slice(2, 18)}`;
    setKeys((prev) => [{ ...key, secret }, ...prev]);
    setLatestSecret(secret);
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
            <p className="text-xs font-800 uppercase tracking-wide text-slate-400">Gateway</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-800 text-emerald-300">
              <CheckCircle2 size={16} />
              Live
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-[260px]">
        <header className="sticky top-0 z-10 border-b border-border bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-900 uppercase tracking-wide text-blue-700">api.credittrust.in</p>
              <h1 className="text-2xl font-900 tracking-normal text-foreground">API Console</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setClientModalOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-800 text-white shadow-sm">
                <KeyRound size={16} />
                Create Client
              </button>
            </div>
          </div>
          {latestSecret ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-800 text-emerald-800">
              Key generated: <span className="font-900">{latestSecret}</span>
            </div>
          ) : null}
        </header>

        <div className="px-4 py-6 lg:px-8">
          <ActiveSection
            activeNav={activeNav}
            clients={clients}
            keys={keys}
            selectedClientId={selectedClientId}
            onNewClient={() => setClientModalOpen(true)}
            onCreateKey={(clientId) => setKeyModalClientId(clientId || '')}
            onManage={(clientId) => {
              setSelectedClientId(clientId);
              setManagedClientId(clientId);
            }}
            onSelectClient={setSelectedClientId}
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
