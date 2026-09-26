'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Image,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react';

type Contact = {
  id: string;
  email: string;
  full_name?: string | null;
  mobile?: string | null;
  company_name?: string | null;
  city?: string | null;
  source: string;
  status: string;
  opt_in: boolean;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  subject: string;
  preview_text?: string | null;
  html_body: string;
  text_body?: string | null;
  audience_status: string;
  status: string;
  sent_count: number;
  failed_count: number;
  reply_count: number;
  created_at: string;
  sent_at?: string | null;
};

type Message = {
  id: string;
  campaign_id?: string | null;
  contact_id?: string | null;
  parent_message_id?: string | null;
  direction: 'outbound' | 'inbound' | 'admin_reply';
  sender_email: string;
  recipient_email: string;
  subject: string;
  html_body?: string | null;
  text_body?: string | null;
  status: string;
  error?: string | null;
  read_at?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  created_at: string;
  email_marketing_contacts?: {
    full_name?: string | null;
    email?: string | null;
    company_name?: string | null;
    city?: string | null;
  } | null;
};

type Config = {
  fromEmail: string;
  replyTo: string;
  sendLimit: number;
  resendConfigured: boolean;
};

type StatItem = [label: string, value: number, Icon: LucideIcon];

type UploadedAttachment = {
  filename: string;
  content: string;
  content_type: string;
  size: number;
};

const sampleCsv = `full_name,email,mobile,company_name,city,source
Rajesh Mehta,rajesh@example.com,9876543210,Mehta Finance,Indore,manual
Priya Sharma,priya@example.com,9893332647,Sharma Loans,Bhopal,manual`;

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = cells[index] || '';
      return row;
    }, {});
  });
}

async function parseContactFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    return parseCsv(await file.text());
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const XLSX = await import('xlsx');
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    return XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName], {
      defval: '',
      raw: false,
    });
  }

  throw new Error('Only CSV, XLS, and XLSX contact files are supported.');
}

async function toAttachment(file: File): Promise<UploadedAttachment> {
  const bytes = await file.arrayBuffer();
  let binary = '';
  const chunkSize = 0x8000;
  const array = new Uint8Array(bytes);
  for (let index = 0; index < array.length; index += chunkSize) {
    binary += String.fromCharCode(...array.subarray(index, index + chunkSize));
  }

  return {
    filename: file.name,
    content: btoa(binary),
    content_type: file.type || 'application/octet-stream',
    size: file.size,
  };
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusClass(status: string) {
  if (['sent', 'received', 'completed'].includes(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['failed', 'completed_with_errors'].includes(status)) return 'bg-red-50 text-red-700 border-red-200';
  if (['sending', 'pending'].includes(status)) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function AdminEmailCampaignsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [activeView, setActiveView] = useState<'campaigns' | 'inbox' | 'contacts'>('campaigns');
  const [activeThreadKey, setActiveThreadKey] = useState('');
  const [csvText, setCsvText] = useState(sampleCsv);
  const [contactFileName, setContactFileName] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<UploadedAttachment | null>(null);
  const [imageFile, setImageFile] = useState<UploadedAttachment | null>(null);
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [schemaReady, setSchemaReady] = useState(true);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    preview_text: '',
    text_body: 'Hi {name},\n\nCreditTrust se aapke liye ek quick update hai.\n\nRegards,\nCreditTrust Team',
    audience_status: 'active',
  });

  const stats = useMemo(() => {
    return {
      contacts: contacts.length,
      optedIn: contacts.filter((contact) => contact.opt_in && contact.status === 'active').length,
      sent: campaigns.reduce((sum, campaign) => sum + Number(campaign.sent_count || 0), 0),
      replies: campaigns.reduce((sum, campaign) => sum + Number(campaign.reply_count || 0), 0),
      unread: messages.filter((message) => message.direction === 'inbound' && !message.read_at).length,
    };
  }, [campaigns, contacts, messages]);

  const threads = useMemo(() => {
    const byKey = new Map<string, Message[]>();
    messages.forEach((message) => {
      const customer = message.direction === 'inbound' ? message.sender_email : message.recipient_email;
      const key = `${message.campaign_id || 'direct'}:${customer}`;
      byKey.set(key, [...(byKey.get(key) || []), message]);
    });

    return [...byKey.entries()]
      .map(([key, threadMessages]) => {
        const sorted = [...threadMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const last = sorted[sorted.length - 1];
        const customer = last.direction === 'inbound' ? last.sender_email : last.recipient_email;
        const campaign = campaigns.find((item) => item.id === last.campaign_id);
        return { key, customer, campaign, last, messages: sorted, unread: sorted.some((item) => item.direction === 'inbound' && !item.read_at) };
      })
      .filter((thread) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
          thread.customer.toLowerCase().includes(query) ||
          thread.last.subject.toLowerCase().includes(query) ||
          (thread.campaign?.name || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime());
  }, [campaigns, messages, search]);

  const activeThread = threads.find((thread) => thread.key === activeThreadKey) || threads[0];

  useEffect(() => {
    if (!activeThreadKey && threads[0]) setActiveThreadKey(threads[0].key);
  }, [activeThreadKey, threads]);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const response = await authFetch('/api/admin-email-campaigns', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to load email marketing');
      setSchemaReady(json.schemaReady !== false);
      setContacts(json.contacts || []);
      setCampaigns(json.campaigns || []);
      setMessages(json.messages || []);
      setConfig(json.config || null);
      if (json.warning) setNotice(json.warning);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load email marketing');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function runAction(payload: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await authFetch('/api/admin-email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Action failed');
      setContacts(json.contacts || contacts);
      setCampaigns(json.campaigns || campaigns);
      setMessages(json.messages || messages);
      setConfig(json.config || config);
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function importContacts() {
    const parsed = parseCsv(csvText);
    runAction({ action: 'import_contacts', contacts: parsed }, `${parsed.length} contacts processed`);
  }

  async function importContactFile(file?: File) {
    if (!file) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const parsed = await parseContactFile(file);
      setContactFileName(file.name);
      if (!parsed.length) throw new Error('No rows found in the selected file.');
      await runAction(
        { action: 'import_contacts', source: `file_${file.name}`, contacts: parsed },
        `${parsed.length} contact rows processed from ${file.name}`,
      );
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'Unable to import contact file');
      setSaving(false);
    }
  }

  function importLeadFunnel() {
    runAction({ action: 'import_lead_funnel' }, 'Lead funnel contacts imported');
  }

  function createCampaign() {
    runAction({
      action: 'create_campaign',
      name: form.name,
      subject: form.subject,
      preview_text: form.preview_text,
      text_body: form.text_body,
      audience_status: form.audience_status,
      attachments: [attachmentFile].filter(Boolean),
      inline_image: imageFile,
    }, 'Email campaign draft created');
  }

  async function replyToThread() {
    if (!activeThread || !replyText.trim()) return;
    const parent = activeThread.messages[activeThread.messages.length - 1];
    await runAction({ action: 'reply_message', parent_message_id: parent.id, text: replyText }, 'Reply sent');
    setReplyText('');
  }

  return (
    <AdminLayout title="Email Campaigns">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Email marketing</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Campaigns, inbox and replies</h1>
            <p className="mt-1 text-sm text-slate-500">
              Send campaigns through Resend, capture inbound replies, and respond from the admin panel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <span className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${config?.resendConfigured ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {config?.resendConfigured ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              Resend {config?.resendConfigured ? 'ready' : 'env missing'}
            </span>
          </div>
        </div>

        {(notice || error || !schemaReady) && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${error || !schemaReady ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice || 'Email marketing schema is not ready.'}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {([
            ['Contacts', stats.contacts, Users],
            ['Opted in', stats.optedIn, CheckCircle2],
            ['Sent', stats.sent, Send],
            ['Replies', stats.replies, Reply],
            ['Unread', stats.unread, Inbox],
          ] as StatItem[]).map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{label as string}</p>
                <Icon size={17} className="text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{Number(value).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200">
          {[
            ['campaigns', 'Campaigns', Mail],
            ['inbox', 'Inbox', Inbox],
            ['contacts', 'Contacts', Users],
          ].map(([id, label, Icon]) => (
            <button
              key={String(id)}
              type="button"
              onClick={() => setActiveView(id as typeof activeView)}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${activeView === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Icon size={16} /> {label as string}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading email marketing...</div>
        ) : activeView === 'campaigns' ? (
          <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Plus size={17} className="text-blue-600" />
                <h2 className="font-bold text-slate-900">Create campaign</h2>
              </div>
              <div className="mt-4 space-y-3">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject, supports {name}" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <input value={form.preview_text} onChange={(e) => setForm({ ...form, preview_text: e.target.value })} placeholder="Preview text" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <textarea value={form.text_body} onChange={(e) => setForm({ ...form, text_body: e.target.value })} rows={9} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50">
                    <span className="inline-flex items-center gap-2 font-bold text-slate-800">
                      <FileSpreadsheet size={16} className="text-blue-600" /> Attach Excel
                    </span>
                    <span className="truncate text-xs text-slate-500">{attachmentFile?.filename || 'XLS, XLSX, CSV, PDF'}</span>
                    <input
                      type="file"
                      accept=".xls,.xlsx,.csv,.pdf"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setAttachmentFile(await toAttachment(file));
                      }}
                    />
                  </label>
                  <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50">
                    <span className="inline-flex items-center gap-2 font-bold text-slate-800">
                      <Image size={16} className="text-blue-600" /> Inline promo image
                    </span>
                    <span className="truncate text-xs text-slate-500">{imageFile?.filename || 'Shows inside email body'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setImageFile(await toAttachment(file));
                      }}
                    />
                  </label>
                </div>
                {(attachmentFile || imageFile) && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    <Paperclip size={13} className="mr-1 inline" />
                    {[attachmentFile?.filename, imageFile ? `inline image: ${imageFile.filename}` : ''].filter(Boolean).join(', ')}
                  </div>
                )}
                <button disabled={saving || !schemaReady} onClick={createCampaign} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                  <Plus size={16} /> Save draft
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                From: {config?.fromEmail || '-'}<br />Reply-to: {config?.replyTo || '-'}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold text-slate-900">Campaign list</h2>
                <p className="text-sm text-slate-500">Send limit per click: {config?.sendLimit ?? 100}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sent</th>
                      <th className="px-4 py-3">Replies</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="align-top hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{campaign.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{campaign.subject}</p>
                          <p className="mt-1 text-[11px] text-slate-400">Created {formatDate(campaign.created_at)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(campaign.status)}`}>{campaign.status}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{campaign.sent_count} sent<br /><span className="text-xs text-red-600">{campaign.failed_count} failed</span></td>
                        <td className="px-4 py-4 text-slate-700">{campaign.reply_count}</td>
                        <td className="px-4 py-4">
                          <button disabled={saving || !schemaReady} onClick={() => runAction({ action: 'send_campaign', campaign_id: campaign.id }, 'Campaign send completed')} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                            <Send size={13} /> Send
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!campaigns.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No email campaigns yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeView === 'inbox' ? (
          <div className="grid min-h-[620px] gap-5 xl:grid-cols-[360px_1fr]">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inbox" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" />
                </div>
              </div>
              <div className="max-h-[560px] overflow-y-auto">
                {threads.map((thread) => (
                  <button key={thread.key} onClick={() => setActiveThreadKey(thread.key)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${activeThread?.key === thread.key ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-900">{thread.customer}</p>
                      {thread.unread && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{thread.campaign?.name || thread.last.subject}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDate(thread.last.received_at || thread.last.sent_at || thread.last.created_at)}</p>
                  </button>
                ))}
                {!threads.length && <div className="p-8 text-center text-sm text-slate-500">No replies yet.</div>}
              </div>
            </div>

            <div className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {activeThread ? (
                <>
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="font-bold text-slate-900">{activeThread.customer}</p>
                    <p className="text-sm text-slate-500">{activeThread.campaign?.name || activeThread.last.subject}</p>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
                    {activeThread.messages.map((message) => (
                      <div key={message.id} className={`max-w-3xl rounded-lg border p-4 shadow-sm ${message.direction === 'inbound' ? 'border-blue-100 bg-white' : 'ml-auto border-emerald-100 bg-emerald-50'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{message.direction.replace('_', ' ')}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass(message.status)}`}>{message.status}</span>
                        </div>
                        <p className="mt-2 font-semibold text-slate-900">{message.subject}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{message.text_body || 'HTML email content saved.'}</p>
                        {message.error && <p className="mt-2 text-xs font-semibold text-red-600">{message.error}</p>}
                        <p className="mt-3 text-[11px] text-slate-400">{formatDate(message.received_at || message.sent_at || message.created_at)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 p-4">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} placeholder="Write reply..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <div className="mt-3 flex justify-end">
                      <button disabled={saving || !replyText.trim()} onClick={replyToThread} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                        <Reply size={16} /> Reply
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Select a conversation</div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Upload size={17} className="text-blue-600" />
                <h2 className="font-bold text-slate-900">Import contacts</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">Upload Excel/CSV or paste CSV. Headers: full_name/name, email, mobile, company_name, city, source.</p>
              <div className="mt-4 grid gap-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm hover:border-blue-300 hover:bg-blue-50">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <FileSpreadsheet size={16} className="text-blue-600" />
                    <span className="truncate font-bold text-slate-800">{contactFileName || 'Choose Excel / CSV contact file'}</span>
                  </span>
                  <span className="text-xs font-semibold text-blue-700">Browse</span>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="hidden"
                    onChange={(event) => importContactFile(event.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  disabled={saving || !schemaReady}
                  onClick={importLeadFunnel}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                >
                  <Users size={16} /> Import from Lead Funnel
                </button>
              </div>
              <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={12} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" />
              <button disabled={saving || !schemaReady} onClick={importContacts} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                <Upload size={16} /> Import / update contacts
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-bold text-slate-900">Audience</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{contact.full_name || '-'}</p>
                          <p className="text-xs text-slate-500">{contact.email}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{contact.company_name || '-'}<br /><span className="text-xs text-slate-400">{contact.city || ''}</span></td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(contact.status)}`}>{contact.opt_in ? contact.status : 'opted_out'}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-500">{contact.source}</td>
                      </tr>
                    ))}
                    {!contacts.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No contacts imported.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
