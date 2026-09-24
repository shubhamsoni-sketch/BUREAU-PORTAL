'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LifeBuoy,
  LockKeyhole,
  Search,
  Settings,
  Server,
  ShieldCheck,
  Ticket,
  WalletCards,
  X,
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
    value: string;
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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
        </div>
        <div className={classNames('flex h-10 w-10 items-center justify-center rounded-2xl', tone)}>
          <Icon size={18} />
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
              <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight tracking-tight">Client Workspace</h1>
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
            <style>{`
              .client-login-field input:-webkit-autofill,
              .client-login-field input:-webkit-autofill:hover,
              .client-login-field input:-webkit-autofill:focus {
                -webkit-text-fill-color: #020617;
                box-shadow: 0 0 0 1000px #ffffff inset;
                transition: background-color 9999s ease-out 0s;
              }
            `}</style>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Secure Access</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Client portal login</h2>
            {error ? <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
            <label className="mt-6 block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Login ID</span>
              <div className="client-login-field mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
                <ShieldCheck size={16} className="shrink-0 text-slate-400" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  placeholder="binta-uat"
                  autoComplete="username"
                  type="text"
                />
              </div>
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Password</span>
              <div className="client-login-field mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100">
                <LockKeyhole size={16} className="shrink-0 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
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
  const [activeView, setActiveView] = useState<'logs' | 'support'>('logs');
  const [supportOpen, setSupportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showKeyCard, setShowKeyCard] = useState(false);
  const [showIpCard, setShowIpCard] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [ticketActionDrafts, setTicketActionDrafts] = useState<Record<string, { action: 'remind_ticket' | 'reopen_ticket'; message: string }>>({});
  const [threadTicketId, setThreadTicketId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [ticketForm, setTicketForm] = useState({
    category: 'api_issue',
    priority: 'medium',
    request_id: '',
    subject: '',
    message: '',
  });

  const loadData = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    if (!options?.silent) setError('');
    try {
      const response = await fetch('/api/api-client-portal?page_size=25');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to open client portal');
      setData(json);
    } catch (err) {
      if (options?.silent) {
        console.warn('[api-client-portal] auto refresh failed:', err);
      } else {
        setData(null);
        setError(err instanceof Error ? err.message : 'Unable to open client portal');
      }
    } finally {
      if (!options?.silent) setLoading(false);
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

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/api-client-portal-auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to change password');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setSettingsOpen(false);
      setNotice('Password changed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (!data) return;
    const intervalId = window.setInterval(() => {
      loadData({ silent: true });
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [data?.client?.name]);

  const filteredUsage = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data?.usage || [];
    return (data?.usage || []).filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [data, search]);
  const activeKeyValue = data?.key.value || '';
  const logPageSize = 10;
  const logPageCount = Math.max(1, Math.ceil(filteredUsage.length / logPageSize));
  const currentLogPage = Math.min(logPage, logPageCount);
  const paginatedUsage = filteredUsage.slice((currentLogPage - 1) * logPageSize, currentLogPage * logPageSize);

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
      setSupportOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to raise support ticket');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketFromClient = async (ticketId: string, action: 'remind_ticket' | 'reopen_ticket', message = '') => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/api-client-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ticket_id: ticketId, message }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Unable to update support ticket');
      setNotice(action === 'reopen_ticket' ? 'Ticket reopened and sent to CreditTrust support.' : 'Reminder sent to CreditTrust support.');
      setTicketActionDrafts((current) => {
        const next = { ...current };
        delete next[ticketId];
        return next;
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update support ticket');
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

  const selectedThreadTicket = threadTicketId ? data.tickets.find((ticket) => String(ticket.id) === threadTicketId) : null;
  const selectedThreadEntries = (() => {
    if (!selectedThreadTicket) return [];
    const baseEntries = Array.isArray(selectedThreadTicket.thread) && selectedThreadTicket.thread.length
      ? selectedThreadTicket.thread
      : [{
          id: `${selectedThreadTicket.id || selectedThreadTicket.ticket_number}-initial`,
          author: 'client',
          message: selectedThreadTicket.message || '-',
          created_at: selectedThreadTicket.created_at || selectedThreadTicket.updated_at,
        }];
    const hasLastResponse = Boolean(selectedThreadTicket.last_response);
    const lastResponseAlreadyInThread = baseEntries.some((entry: Record<string, any>) => (
      entry.author === 'operator' && String(entry.message || '').trim() === String(selectedThreadTicket.last_response || '').trim()
    ));
    if (!hasLastResponse || lastResponseAlreadyInThread) return baseEntries;
    return [
      ...baseEntries,
      {
        id: `${selectedThreadTicket.id || selectedThreadTicket.ticket_number}-last-response`,
        author: 'operator',
        message: selectedThreadTicket.last_response,
        created_at: selectedThreadTicket.updated_at,
      },
    ];
  })();

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
              onClick={() => setActiveView('support')}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-sm shadow-blue-600/20"
            >
              <LifeBuoy size={15} />
              Support
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              aria-label="Open settings"
              title="Settings"
            >
              <Settings size={16} />
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
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">Client Workspace</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{data.client.name}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)]">
              <button
                type="button"
                onClick={() => setShowKeyCard((value) => !value)}
                className="min-h-20 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-emerald-300/30 hover:bg-white/[0.07]"
                aria-pressed={showKeyCard}
              >
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Active key</p>
                <p className="mt-2 break-all font-mono text-[13px] font-extrabold leading-5 text-white">
                  {showKeyCard
                    ? (activeKeyValue || 'Full key unavailable. Please request key regeneration.')
                    : `${data.key.prefix.slice(0, 8)}****`}
                </p>
                <p className="mt-1 text-[11px] font-bold capitalize text-emerald-300">{data.key.environment}</p>
              </button>
              <button
                type="button"
                onClick={() => setShowIpCard((value) => !value)}
                className="min-h-20 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-blue-300/30 hover:bg-white/[0.07]"
                aria-pressed={showIpCard}
              >
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Allowed IPs</p>
                <p className="mt-2 break-all text-[13px] font-extrabold leading-5 text-white">
                  {showIpCard ? (data.client.allowed_ips.join(', ') || 'Not configured') : `${data.client.allowed_ips.length || 0} IP${data.client.allowed_ips.length === 1 ? '' : 's'}`}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-300">{showIpCard ? 'Whitelisted access' : 'Click to reveal'}</p>
              </button>
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

        <section className="mt-5 flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-sm">
          {[
            ['logs', 'Request Logs'],
            ['support', 'Support Tickets'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveView(value as 'logs' | 'support')}
              className={classNames(
                'inline-flex h-10 items-center rounded-xl px-4 text-xs font-black transition',
                activeView === value ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {label}
            </button>
          ))}
        </section>

        {activeView === 'logs' ? (
          <>
        <section className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Request Logs</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">Search request IDs, masked PAN/mobile, status and provider references.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setLogPage(1);
                  }}
                  className="w-64 bg-transparent text-sm font-bold outline-none"
                  placeholder="Search logs..."
                />
              </div>
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
                {paginatedUsage.map((row) => (
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
                {!paginatedUsage.length ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">No request logs found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-slate-500">
              Showing {paginatedUsage.length ? (currentLogPage - 1) * logPageSize + 1 : 0}-{Math.min(currentLogPage * logPageSize, filteredUsage.length)} of {filteredUsage.length} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogPage((page) => Math.max(1, page - 1))}
                disabled={currentLogPage <= 1}
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Page {currentLogPage} / {logPageCount}</span>
              <button
                onClick={() => setLogPage((page) => Math.min(logPageCount, page + 1))}
                disabled={currentLogPage >= logPageCount}
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <LockKeyhole className="text-emerald-700" size={20} />
              <p className="font-black text-slate-900">Security status</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
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
        </section>
          </>
        ) : (
          <section className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">Support Tickets</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">Track raised tickets and CreditTrust operations responses in one place.</p>
              </div>
              <button onClick={() => setSupportOpen(true)} className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-sm shadow-blue-600/20">
                New Ticket
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.tickets.map((ticket) => {
                const canRemind = ticket.status === 'open' || ticket.status === 'in_progress';
                const canReopen = ticket.status === 'resolved' || ticket.status === 'closed';
                const ticketId = String(ticket.id);
                const draft = ticketActionDrafts[ticketId];
                return (
                <div key={ticketId} className="flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm transition hover:border-blue-100 hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{ticket.subject}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge tone={statusTone(ticket.status)}>{String(ticket.status || '').replace(/_/g, ' ')}</Badge>
                        <Badge tone={statusTone(ticket.priority)}>{String(ticket.priority || 'medium')}</Badge>
                      </div>
                      <p className="mt-2 text-[11px] font-bold text-slate-500">{ticket.ticket_number}</p>
                      <p className="text-[11px] font-bold text-slate-400">{formatDate(ticket.updated_at)}</p>
                      {ticket.request_id ? <p className="mt-1 font-mono text-[11px] font-black text-blue-700">Request ID: {ticket.request_id}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setThreadTicketId(ticketId)}
                      className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-700 hover:border-blue-200 hover:text-blue-700"
                    >
                      View
                    </button>
                  </div>
                  <p className="mt-3 h-12 overflow-hidden rounded-xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">{ticket.message || '-'}</p>
                  {draft ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-black text-slate-700">{draft.action === 'reopen_ticket' ? 'Add reopen message' : 'Add reminder message optional'}</p>
                      <textarea
                        value={draft.message}
                        onChange={(event) => setTicketActionDrafts((current) => ({ ...current, [ticketId]: { ...draft, message: event.target.value } }))}
                        className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none"
                        placeholder={draft.action === 'reopen_ticket' ? 'Explain why this ticket needs to be reopened...' : 'Add any extra details for CreditTrust support...'}
                      />
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTicketActionDrafts((current) => {
                            const next = { ...current };
                            delete next[ticketId];
                            return next;
                          })}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTicketFromClient(ticketId, draft.action, draft.message)}
                          disabled={loading || (draft.action === 'reopen_ticket' && !draft.message.trim())}
                          className="inline-flex h-9 items-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white disabled:opacity-50"
                        >
                          {draft.action === 'reopen_ticket' ? 'Reopen with Message' : 'Send Reminder'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    {canRemind ? (
                      <button
                        onClick={() => setTicketActionDrafts((current) => ({ ...current, [ticketId]: { action: 'remind_ticket', message: '' } }))}
                        disabled={loading}
                        className="inline-flex h-9 items-center rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700 disabled:opacity-50"
                      >
                        Send Reminder
                      </button>
                    ) : null}
                    {canReopen ? (
                      <button
                        onClick={() => setTicketActionDrafts((current) => ({ ...current, [ticketId]: { action: 'reopen_ticket', message: '' } }))}
                        disabled={loading}
                        className="inline-flex h-9 items-center rounded-xl border border-amber-100 bg-amber-50 px-3 text-xs font-black text-amber-700 disabled:opacity-50"
                      >
                        Reopen Ticket
                      </button>
                    ) : null}
                  </div>
                </div>
                );
              })}
              {!data.tickets.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">No support tickets yet.</div>
              ) : null}
            </div>
          </section>
        )}
        {selectedThreadTicket ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-950">{selectedThreadTicket.subject}</h2>
                    <Badge tone={statusTone(selectedThreadTicket.status)}>{String(selectedThreadTicket.status || '').replace(/_/g, ' ')}</Badge>
                    <Badge tone={statusTone(selectedThreadTicket.priority)}>{String(selectedThreadTicket.priority || 'medium')}</Badge>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{selectedThreadTicket.ticket_number} · Updated {formatDate(selectedThreadTicket.updated_at)}</p>
                  {selectedThreadTicket.request_id ? <p className="mt-1 font-mono text-xs font-black text-blue-700">Request ID: {selectedThreadTicket.request_id}</p> : null}
                </div>
                <button
                  onClick={() => setThreadTicketId(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close ticket thread"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[calc(92vh-6rem)] overflow-y-auto p-5">
                <div className="space-y-3">
                  {selectedThreadEntries.map((entry: Record<string, any>) => (
                    <div
                      key={String(entry.id)}
                      className={classNames(
                        'rounded-2xl border p-4 text-sm font-bold leading-6',
                        entry.author === 'client'
                          ? 'border-blue-100 bg-blue-50 text-blue-950'
                          : entry.author === 'operator'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-950'
                            : 'border-slate-100 bg-slate-50 text-slate-700',
                      )}
                    >
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-black uppercase tracking-wide opacity-70">
                        <span>{entry.author === 'client' ? 'You' : entry.author === 'operator' ? 'CreditTrust' : 'System'}</span>
                        <span>{formatDate(entry.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{entry.message || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {supportOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Ticket size={20} /></div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Raise Support Ticket</h2>
                    <p className="text-xs font-bold text-slate-500">Add request ID if this is linked to a failed API call.</p>
                  </div>
                </div>
                <button
                  onClick={() => setSupportOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close support modal"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={raiseTicket} className="max-h-[calc(92vh-5rem)] overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3">
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
                  <textarea value={ticketForm.message} onChange={(event) => setTicketForm({ ...ticketForm, message: event.target.value })} className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none" placeholder="Explain what happened..." />
                </label>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSupportOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700"
                  >
                    Cancel
                  </button>
                  <button disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-60">
                    Raise Ticket
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {settingsOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Settings size={20} /></div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Settings</h2>
                    <p className="text-xs font-bold text-slate-500">Change client portal password securely.</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close settings"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={changePassword} className="p-5">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Current Password</span>
                  <input
                    value={passwordForm.current_password}
                    onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter current password"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">New Password</span>
                  <input
                    value={passwordForm.new_password}
                    onChange={(event) => setPasswordForm({ ...passwordForm, new_password: event.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 10 characters"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-400">Confirm New Password</span>
                  <input
                    value={passwordForm.confirm_password}
                    onChange={(event) => setPasswordForm({ ...passwordForm, confirm_password: event.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                  />
                </label>
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-800">
                  Password must include uppercase, lowercase and number. We never show passwords again after saving.
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700"
                  >
                    Cancel
                  </button>
                  <button disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60">
                    Change Password
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

