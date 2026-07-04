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
  Server,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

const navItems = ['Overview', 'Clients', 'Environments', 'API Keys', 'IP Whitelist', 'Credits', 'Logs', 'Docs'] as const;

const clients = [
  {
    name: 'Ketav Global Finance',
    country: 'UAE',
    status: 'Production',
    uatCredits: 240,
    liveCredits: 1840,
    ips: ['103.82.44.18', '185.64.112.90'],
    apis: ['Bureau Standard', 'Bureau Advanced'],
    successRate: '98.7%',
  },
  {
    name: 'Northstar Capital',
    country: 'Singapore',
    status: 'UAT',
    uatCredits: 85,
    liveCredits: 0,
    ips: ['152.58.91.10'],
    apis: ['Bureau Advanced'],
    successRate: '96.2%',
  },
  {
    name: 'Atlas Credit Labs',
    country: 'UK',
    status: 'Review',
    uatCredits: 25,
    liveCredits: 0,
    ips: [],
    apis: ['Mobile Prefill'],
    successRate: '-',
  },
];

const logs = [
  ['ct_req_20260704_9121', 'Ketav Global Finance', 'Production', 'Bureau Advanced', 'Success', '812 ms', '1 credit'],
  ['ct_req_20260704_9120', 'Ketav Global Finance', 'Production', 'Bureau Standard', 'Success', '684 ms', '1 credit'],
  ['ct_req_20260704_9118', 'Northstar Capital', 'UAT', 'Bureau Advanced', 'Failed', '431 ms', '0 credit'],
  ['ct_req_20260704_9114', 'Ketav Global Finance', 'Production', 'Mobile Prefill', 'Success', '390 ms', '1 credit'],
];

const pipelineSteps: Array<[string, string, React.ElementType]> = [
  ['Auth', 'API key, environment, and client status checked', LockKeyhole],
  ['Network', 'Static IP whitelist and rate policy verified', Network],
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

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone: string;
}) {
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

function ClientsTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className={classNames('w-full', compact ? 'min-w-[760px]' : 'min-w-[860px]')}>
        <thead className="bg-slate-50">
          <tr>
            {['Client', 'Environment', 'APIs', 'Credits', 'Whitelisted IPs', 'Success', 'Action'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.map((client) => (
            <tr key={client.name} className="bg-white">
              <td className="px-4 py-4">
                <p className="text-sm font-900 text-foreground">{client.name}</p>
                <p className="text-xs font-600 text-muted-foreground">{client.country}</p>
              </td>
              <td className="px-4 py-4">
                <StatusPill tone={client.status === 'Production' ? 'green' : client.status === 'UAT' ? 'blue' : 'amber'}>{client.status}</StatusPill>
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
              <td className="px-4 py-4 text-xs font-700 text-muted-foreground">
                {client.ips.length ? client.ips.join(', ') : 'Pending'}
              </td>
              <td className="px-4 py-4 text-sm font-900 text-foreground">{client.successRate}</td>
              <td className="px-4 py-4">
                <button className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-900 text-white">Manage</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px]">
        <thead className="bg-slate-50">
          <tr>
            {['Request ID', 'Client', 'Env', 'API', 'Status', 'Latency', 'Charge'].map((head) => (
              <th key={head} className="px-4 py-3 text-left text-[11px] font-900 uppercase tracking-wide text-slate-500">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => (
            <tr key={log[0]}>
              {log.map((cell, index) => (
                <td key={`${log[0]}-${cell}`} className="px-4 py-3 text-sm font-700 text-foreground">
                  {index === 4 ? <StatusPill tone={cell === 'Success' ? 'green' : 'red'}>{cell}</StatusPill> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function OverviewSection({ activeClients }: { activeClients: number }) {
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
              Manage international API clients with IP whitelist, credits, audit logs, and normalized bureau response.
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label="Clients" value={`${activeClients}`} helper="2 live, 1 onboarding" icon={Globe2} tone="bg-blue-50 text-blue-700" />
              <MetricCard label="Live Credits" value="1,840" helper="available balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
              <MetricCard label="Requests Today" value="428" helper="98.7% success" icon={Activity} tone="bg-violet-50 text-violet-700" />
              <MetricCard label="Avg Latency" value="812 ms" helper="production bureau" icon={BarChart3} tone="bg-amber-50 text-amber-700" />
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
            subtitle="UAT and production access are separated per client."
            action={<button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground"><PlugZap size={15} />Add API Product</button>}
          >
            <ClientsTable />
          </Panel>

          <Panel title="Request Logs" subtitle="Every hit stores environment, IP, credit, vendor request id, and response timing.">
            <LogsTable />
          </Panel>
        </div>

        <div className="space-y-5">
          <ApiKeysPanel />
          <NormalizedResponsePanel />
        </div>
      </section>
    </>
  );
}

function ApiKeysPanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-900 text-foreground">Environment Keys</h3>
          <p className="text-xs font-600 text-muted-foreground">Separate secrets for UAT and production.</p>
        </div>
        <KeyRound className="text-blue-700" size={20} />
      </div>
      <div className="space-y-3">
        {[
          ['UAT', 'ctuat_x9f4..............', 'Active'],
          ['Production', 'ctlive_81aa............', 'Active'],
        ].map(([env, key, status]) => (
          <div key={env} className="rounded-lg border border-border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-900 text-foreground">{env}</p>
              <StatusPill tone="green">{status}</StatusPill>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-800 text-muted-foreground">
              <span>{key}</span>
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

function ActiveSection({ activeNav, activeClients }: { activeNav: (typeof navItems)[number]; activeClients: number }) {
  if (activeNav === 'Overview') return <OverviewSection activeClients={activeClients} />;

  if (activeNav === 'Clients') {
    return (
      <Panel
        title="Client Management"
        subtitle="Create enterprise clients, assign country, environment access, API products, credits, and client status."
        action={<button className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-900 text-white"><KeyRound size={15} />New Client</button>}
      >
        <ClientsTable />
      </Panel>
    );
  }

  if (activeNav === 'Environments') {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {[
          ['UAT Environment', 'Sandbox testing, sample credits, technical validation, non-production keys.', '240 test credits', 'ctuat_x9f4..............'],
          ['Production Environment', 'Live billing, strict IP whitelist, production keys, real vendor hits.', '1,840 live credits', 'ctlive_81aa............'],
        ].map(([title, text, credits, key]) => (
          <div key={title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-900 text-foreground">{title}</h3>
                <p className="mt-1 text-sm font-600 text-muted-foreground">{text}</p>
              </div>
              <StatusPill tone={title.startsWith('Production') ? 'green' : 'blue'}>Active</StatusPill>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-slate-50 p-4">
                <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Credits</p>
                <p className="mt-2 text-xl font-900 text-foreground">{credits}</p>
              </div>
              <div className="rounded-lg border border-border bg-slate-50 p-4">
                <p className="text-[10px] font-900 uppercase tracking-wide text-muted-foreground">Primary Key</p>
                <p className="mt-2 text-sm font-900 text-foreground">{key}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeNav === 'API Keys') {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <ApiKeysPanel />
        <Panel title="Issued Keys" subtitle="Every client gets separate UAT and production keys. Secrets are shown only once on generation.">
          <div className="divide-y divide-border">
            {clients.slice(0, 2).map((client) => (
              <div key={client.name} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-900 text-foreground">{client.name}</p>
                  <p className="text-xs font-700 text-muted-foreground">{client.apis.join(', ')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="blue">UAT key active</StatusPill>
                  <StatusPill tone={client.status === 'Production' ? 'green' : 'amber'}>{client.status === 'Production' ? 'Live key active' : 'Live pending'}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  if (activeNav === 'IP Whitelist') {
    return (
      <Panel title="IP Whitelist" subtitle="Production requests will pass only when the source IP is whitelisted for that client and environment.">
        <div className="divide-y divide-border">
          {clients.map((client) => (
            <div key={client.name} className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-900 text-foreground">{client.name}</p>
                <p className="text-xs font-700 text-muted-foreground">{client.country}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {client.ips.length ? client.ips.map((ip) => <StatusPill key={ip} tone="slate">{ip}</StatusPill>) : <StatusPill tone="amber">IP pending</StatusPill>}
              </div>
              <button className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-900 text-foreground">Update IPs</button>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (activeNav === 'Credits') {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="UAT Credits" value="350" helper="across clients" icon={WalletCards} tone="bg-blue-50 text-blue-700" />
          <MetricCard label="Live Credits" value="1,840" helper="production balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
          <MetricCard label="Used Today" value="428" helper="successful calls" icon={Activity} tone="bg-violet-50 text-violet-700" />
          <MetricCard label="Failed Charges" value="0" helper="no failed deductions" icon={ShieldCheck} tone="bg-amber-50 text-amber-700" />
        </div>
        <Panel title="Credit Ledger" subtitle="Every credit addition and deduction should be stored as an immutable ledger entry.">
          <LogsTable />
        </Panel>
      </div>
    );
  }

  if (activeNav === 'Logs') {
    return (
      <Panel title="Request Logs" subtitle="Searchable audit trail for every API request, including client, environment, source IP, status, and charge.">
        <LogsTable />
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="API Documentation" subtitle="Client-facing docs will expose CreditTrust endpoints, headers, payload, and normalized response only.">
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
  const [activeNav, setActiveNav] = useState<(typeof navItems)[number]>('Overview');
  const activeClients = useMemo(() => clients.filter((client) => client.status !== 'Review').length, []);

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
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-800 text-foreground shadow-sm">
                <BookOpen size={16} />
                API Docs
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-800 text-white shadow-sm">
                <KeyRound size={16} />
                Create Client
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-8">
          <ActiveSection activeNav={activeNav} activeClients={activeClients} />
        </div>
      </main>
    </div>
  );
}
