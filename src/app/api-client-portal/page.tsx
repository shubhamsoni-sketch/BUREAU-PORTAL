'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  LifeBuoy,
  LockKeyhole,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Ticket,
  WalletCards,
} from 'lucide-react';

type ClientPortalData = {
  client: {
    name: string;
    legal_name: string;
    email: string | null;
    uat_credits: number;
    live_credits: number;
    allowed_ips: string[];
  };
  key: {
    environment: string;
    label: string;
    prefix: string;
    last_used_at: string | null;
  };
  metrics: {
    total_requests: number;
    page_success: number;
    page_failed: number;
    open_tickets: number;
  };
  usage: Array<Record<string, any>>;
  tickets: Array<Record<string, any>>;
};

const categories = [
  ['api_issue', 'API issue'],
  ['auth_access', 'Authentication / access'],
  ['response_mismatch', 'Response mismatch'],
  ['credits_billing', 'Credits / billing'],
  ['ip_certificate', 'IP / certificate'],
  ['other', 'Other'],
] as const;

const priorities = [
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['critical', 'Critical'],
] as const;

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusTone(status?: string) {
  if (status === 'success' || status === 'resolved' || status === 'closed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'failed' || status === 'critical') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'in_progress' || status === 'high') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={classNames('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black capitalize', tone || 'border-slate-200 bg-slate-50 text-slate-600')}>
      {children}
    </span>
  );
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{helper}</p>
        </div>
        <div className={classNames('flex h-12 w-12 items-center justify-center rounded-2xl', tone)}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function LoginPanel({
  onLogin,
  loading,
  error,
}: {
  onLogin: (username: string, password: string) => void;
  loading: boolean;
  error: string;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="min-h-screen bg-[#07111f] px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-[#07111f] p-8 lg:p-12">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-300 text-xl font-black text-slate-950">CT</div>
              <p className="mt-10 text-xs font-black uppercase tracking-[0.35em] text-emerald-300">CreditTrust Bridge</p>
              <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight tracking-tight">Binta API Client Portal</h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-slate-300">
                View API consumption, request logs, IP status and raise support tickets without accessing the internal FinCoopers control plane.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  [Activity, 'Usage logs'],
                  [ShieldCheck, 'IP gated'],
                  [LifeBuoy, 'Support desk'],
                ].map(([Icon, text]) => {
                  const IconComponent = Icon as React.ComponentType<{ size?: number; className?: string }>;
                  return (
                    <div key={String(text)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <IconComponent className="text-emerald-300" size={20} />
                      <p className="mt-3 text-sm font-black text-white">{String(text)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onLogin(username, password);
            }}
            className="bg-slate-50 p-8 text-slate-950 lg:p-12"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Secure Access</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Client portal login</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              Use the login ID and password shared by CreditTrust. API keys stay secured in the backend and are never exposed here.
            </p>
            {error ? <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
            <label className="mt-6 block">
              <span className="text-sm font-black text-slate-700">Login ID</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
                <ShieldCheck size={18} className="text-slate-400" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                  placeholder="binta-uat"
                  autoComplete="username"
                  type="text"
                />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-black text-slate-700">Password</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  type="password"
                />
              </div>
            </label>
            <button
              disabled={loading}
              className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Open Client Portal'}
              <ArrowRight size={18} />
            </button>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
              This portal is read-only for API controls. For key changes, production promotion or credit allocation, raise a support ticket.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ApiClientPortalPage() {
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [ticketForm, setTicketForm] = useState({
    category: 'api_issue',
    priority: 'medium',
    request_id: '',
    subject: '',
    message: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/api-client-portal?page_size=25');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to open client portal');
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Unable to open client portal');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    if (!username.trim() || !password) {
      setError('Login ID and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/api-client-portal-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Invalid client portal credentials');
      await loadData();
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Unable to login');
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/api-client-portal-auth/logout', { method: 'POST' }).catch(() => null);
    setData(null);
    setNotice('');
    setError('');
  };

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch('/api/api-client-portal-auth/session');
        const json = await response.json();
        if (!cancelled && json.authenticated) await loadData();
      } finally {
        if (!cancelled) setCheckedSession(true);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsage = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data?.usage || [];
    return (data?.usage || []).filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [data, search]);

  const raiseTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/api-client-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketForm),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to raise support ticket');
      setNotice(`Ticket ${json.ticket?.ticket_number || ''} raised successfully.`);
      setTicketForm({ category: 'api_issue', priority: 'medium', request_id: '', subject: '', message: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to raise support ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!checkedSession && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
      </div>
    );
  }

  if (!data) return <LoginPanel onLogin={login} loading={loading} error={error} />;

  return (
    <div className="min-h-screen bg-[#f5f8fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-emerald-300">CT</div>
            <div>
              <p className="text-sm font-black text-slate-950">CreditTrust Bridge</p>
              <p className="text-xs font-bold text-slate-500">Binta Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <button
              onClick={logout}
              className="inline-flex h-10 items-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">Client Workspace</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{data.client.name}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
                Monitor usage, check failed requests, track credit consumption and raise support tickets directly with the CreditTrust operations team.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Active key</p>
                <p className="mt-2 font-mono text-sm font-black text-white">{data.key.prefix}******************</p>
                <p className="mt-1 text-xs font-bold capitalize text-emerald-300">{data.key.environment}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Allowed IPs</p>
                <p className="mt-2 text-sm font-black text-white">{data.client.allowed_ips.length || 0}</p>
                <p className="mt-1 text-xs font-bold text-slate-300">{data.client.allowed_ips[0] || 'Not configured'}</p>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
        {notice ? <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{notice}</div> : null}

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Requests" value={data.metrics.total_requests.toLocaleString('en-IN')} helper="all-time API ledger" icon={Server} tone="bg-blue-50 text-blue-700" />
          <MetricCard label="UAT Credits" value={data.client.uat_credits.toLocaleString('en-IN')} helper="sandbox balance" icon={WalletCards} tone="bg-emerald-50 text-emerald-700" />
          <MetricCard label="Failed On Page" value={data.metrics.page_failed.toString()} helper="latest loaded logs" icon={AlertCircle} tone="bg-red-50 text-red-700" />
          <MetricCard label="Open Tickets" value={data.metrics.open_tickets.toString()} helper="support desk" icon={LifeBuoy} tone="bg-amber-50 text-amber-700" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight">Request Logs</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">Search request IDs, masked PAN/mobile, status and provider references.</p>
              </div>
              <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-64 bg-transparent text-sm font-bold outline-none"
                  placeholder="Search logs..."
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-slate-50">
                  <tr>
                    {['Time', 'Request ID', 'API', 'Status', 'HTTP', 'Credits', 'Ref', 'Latency'].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-400">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsage.map((row) => (
                    <tr key={String(row.id || row.request_id)} className="text-sm">
                      <td className="px-4 py-3 font-bold text-slate-500">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs font-black text-slate-800">{row.request_id || '-'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{row.api_code || row.api_id || '-'}</td>
                      <td className="px-4 py-3"><Badge tone={statusTone(row.status)}>{row.status || '-'}</Badge></td>
                      <td className="px-4 py-3 font-bold text-slate-700">{row.http_status || '-'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{row.credits_deducted || 0}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{row.provider_ref || '-'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{row.response_time_ms ? `${row.response_time_ms}ms` : '-'}</td>
                    </tr>
                  ))}
                  {!filteredUsage.length ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">No request logs found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <form onSubmit={raiseTicket} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Ticket size={20} /></div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Raise Support Ticket</h2>
                  <p className="text-sm font-bold text-slate-500">Our team gets an email alert.</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Category</span>
                  <select value={ticketForm.category} onChange={(event) => setTicketForm({ ...ticketForm, category: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                    {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Priority</span>
                  <select value={ticketForm.priority} onChange={(event) => setTicketForm({ ...ticketForm, priority: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                    {priorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>
              <label className="mt-3 block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Request ID optional</span>
                <input value={ticketForm.request_id} onChange={(event) => setTicketForm({ ...ticketForm, request_id: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none" placeholder="ct_req_..." />
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Subject</span>
                <input value={ticketForm.subject} onChange={(event) => setTicketForm({ ...ticketForm, subject: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none" placeholder="Short issue summary" />
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Message</span>
                <textarea value={ticketForm.message} onChange={(event) => setTicketForm({ ...ticketForm, message: event.target.value })} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none" placeholder="Explain what happened..." />
              </label>
              <button disabled={loading} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white disabled:opacity-60">
                Raise Ticket
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-tight">Recent Tickets</h2>
                <Badge>{data.tickets.length}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {data.tickets.slice(0, 6).map((ticket) => (
                  <div key={String(ticket.id)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{ticket.subject}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{ticket.ticket_number} · {formatDate(ticket.updated_at)}</p>
                      </div>
                      <Badge tone={statusTone(ticket.status)}>{String(ticket.status || '').replace(/_/g, ' ')}</Badge>
                    </div>
                    {ticket.last_response ? <p className="mt-3 rounded-xl bg-white p-3 text-xs font-bold leading-5 text-slate-600">{ticket.last_response}</p> : null}
                  </div>
                ))}
                {!data.tickets.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-bold text-slate-400">No support tickets yet.</div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <LockKeyhole className="text-emerald-700" size={20} />
                <p className="font-black text-slate-900">Security status</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold text-slate-600">API key prefix</span>
                  <span className="font-mono text-xs font-black">{data.key.prefix}****</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold text-slate-600">Last used</span>
                  <span className="text-xs font-black">{formatDate(data.key.last_used_at)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold text-slate-600">IP policy</span>
                  <CheckCircle2 className="text-emerald-600" size={18} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <FileText className="text-blue-700" size={22} />
            <p className="mt-3 font-black">API Documentation</p>
            <p className="mt-1 text-sm font-bold text-slate-500">Use the UAT documentation shared by CreditTrust for request schema and response format.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Clock3 className="text-amber-600" size={22} />
            <p className="mt-3 font-black">Support SLA</p>
            <p className="mt-1 text-sm font-bold text-slate-500">Critical API issues are reviewed first. Add request ID for faster triage.</p>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(data.key.prefix)}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm"
          >
            <Copy className="text-slate-700" size={22} />
            <p className="mt-3 font-black">Copy Key Prefix</p>
            <p className="mt-1 text-sm font-bold text-slate-500">Share prefix only when asking for support. Never send full API key over email.</p>
          </button>
        </section>
      </main>
    </div>
  );
}
