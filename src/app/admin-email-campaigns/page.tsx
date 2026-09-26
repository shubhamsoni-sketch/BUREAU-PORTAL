'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Image,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  X,
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

type Audience = {
  id: string;
  name: string;
  source: string;
  status: string;
  contact_count: number;
  created_at: string;
  contacts?: Contact[];
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

type InlineImage = {
  filename: string;
  url: string;
  content_type: string;
  size: number;
};

const sampleCsv = `name,email
Shubham Soni,shubhamsoni@fincoopers.com
Ketav,ketav@fincoopers.com`;

function normalizeContactRows(rows: Array<Record<string, unknown>>) {
  return rows
    .map((row) => ({
      name: String(row.name || row.full_name || row.customer_name || '').trim(),
      email: String(row.email || row.mail || row.email_id || '').trim().toLowerCase(),
    }))
    .filter((row) => row.email);
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  return normalizeContactRows(lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = cells[index] || '';
      return row;
    }, {});
  }));
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
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName], {
      defval: '',
      raw: false,
    });
    return normalizeContactRows(rows);
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

async function parseApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: text };
  }
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
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [activeView, setActiveView] = useState<'campaigns' | 'inbox' | 'audiences'>('campaigns');
  const [activeThreadKey, setActiveThreadKey] = useState('');
  const [activeAudienceId, setActiveAudienceId] = useState('');
  const [showAudienceForm, setShowAudienceForm] = useState(false);
  const [audienceName, setAudienceName] = useState('New audience');
  const [csvText, setCsvText] = useState(sampleCsv);
  const [contactFileName, setContactFileName] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedAudienceId, setSelectedAudienceId] = useState('');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [imageFile, setImageFile] = useState<InlineImage | null>(null);
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

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const aActive = a.opt_in && a.status === 'active' ? 0 : 1;
      const bActive = b.opt_in && b.status === 'active' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (a.full_name || a.email).localeCompare(b.full_name || b.email);
    });
  }, [contacts]);

  const stats = useMemo(() => {
    return {
      contacts: contacts.length,
      audiences: audiences.length,
      optedIn: contacts.filter((contact) => contact.opt_in && contact.status === 'active').length,
      sent: campaigns.reduce((sum, campaign) => sum + Number(campaign.sent_count || 0), 0),
      replies: campaigns.reduce((sum, campaign) => sum + Number(campaign.reply_count || 0), 0),
      unread: messages.filter((message) => message.direction === 'inbound' && !message.read_at).length,
    };
  }, [audiences.length, campaigns, contacts, messages]);

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
  const activeAudience = audiences.find((audience) => audience.id === activeAudienceId) || audiences[0];
  const activeAudienceContacts = useMemo(() => {
    return [...(activeAudience?.contacts || [])].sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));
  }, [activeAudience]);

  useEffect(() => {
    if (!activeThreadKey && threads[0]) setActiveThreadKey(threads[0].key);
  }, [activeThreadKey, threads]);

  useEffect(() => {
    if (!activeAudienceId && audiences[0]) setActiveAudienceId(audiences[0].id);
  }, [activeAudienceId, audiences]);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const response = await authFetch('/api/admin-email-campaigns', { cache: 'no-store' });
      const json = await parseApiResponse(response);
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to load email marketing');
      setSchemaReady(json.schemaReady !== false);
      setContacts(json.contacts || []);
      setCampaigns(json.campaigns || []);
      setAudiences(json.audiences || []);
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
      const json = await parseApiResponse(response);
      if (!response.ok || !json.success) throw new Error(json.error || 'Action failed');
      setContacts(json.contacts || contacts);
      setCampaigns(json.campaigns || campaigns);
      setAudiences(json.audiences || audiences);
      setMessages(json.messages || messages);
      setConfig(json.config || config);
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  async function uploadInlineImage(file: File) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', 'email campaign inline image');
      const response = await authFetch('/api/marketing/assets/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await parseApiResponse(response);
      if (!response.ok || !json?.success) throw new Error(json?.error || 'Unable to upload image');
      setImageFile({
        filename: file.name,
        url: json.file_url,
        content_type: file.type,
        size: file.size,
      });
      setNotice('Promotional image uploaded and will appear inside the email body');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload promotional image');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function createAudienceFromText() {
    const parsed = parseCsv(csvText);
    runAction({ action: 'create_audience', name: audienceName, contacts: parsed }, `${parsed.length} contacts saved in audience`);
    setShowAudienceForm(false);
  }

  async function downloadSampleExcel() {
    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.json_to_sheet([
      { name: 'Shubham Soni', email: 'shubhamsoni@fincoopers.com' },
      { name: 'Ketav', email: 'ketav@fincoopers.com' },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Contacts');
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email-contact-sample.xlsx';
    link.click();
    URL.revokeObjectURL(url);
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
        { action: 'create_audience', name: audienceName || file.name.replace(/\.(csv|xls|xlsx)$/i, ''), source: `file_${file.name}`, contacts: parsed },
        `${parsed.length} contacts saved in audience`,
      );
      setShowAudienceForm(false);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'Unable to import contact file');
      setSaving(false);
    }
  }

  function importLeadFunnel() {
    runAction({ action: 'import_lead_funnel', name: audienceName || `Lead funnel ${new Date().toLocaleDateString('en-IN')}` }, 'Lead funnel audience created');
    setShowAudienceForm(false);
  }

  function createCampaign() {
    runAction({
      action: 'create_campaign',
      name: form.name,
      subject: form.subject,
      preview_text: form.preview_text,
      text_body: form.text_body,
      audience_status: form.audience_status,
      attachments,
      inline_image: imageFile,
    }, 'Email campaign draft created');
  }

  function resetCampaignForm() {
    setForm({
      name: '',
      subject: '',
      preview_text: '',
      text_body: 'Hi {name},\n\nCreditTrust se aapke liye ek quick update hai.\n\nRegards,\nCreditTrust Team',
      audience_status: 'active',
    });
    setAttachments([]);
    setImageFile(null);
  }

  function sendSelectedCampaign() {
    runAction(
      { action: 'send_campaign', campaign_id: selectedCampaignId, audience_id: selectedAudienceId },
      'Campaign send completed',
    );
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
            ['Audiences', stats.audiences, Users],
            ['Opted in', stats.optedIn, CheckCircle2],
            ['Sent', stats.sent, Send],
            ['Replies', stats.replies, Reply],
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
            ['audiences', 'Audiences', Users],
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
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:order-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Plus size={17} className="text-blue-600" />
                  <h2 className="font-bold text-slate-900">Create campaign</h2>
                </div>
                <button
                  type="button"
                  onClick={resetCampaignForm}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                >
                  <Plus size={14} /> New
                </button>
              </div>
              <div className="mt-4 space-y-2.5">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject, supports {name}" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
                <input value={form.preview_text} onChange={(e) => setForm({ ...form, preview_text: e.target.value })} placeholder="Preview text" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
                <textarea value={form.text_body} onChange={(e) => setForm({ ...form, text_body: e.target.value })} rows={5} className="max-h-44 min-h-32 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <div className="grid gap-2">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50">
                    <span className="inline-flex items-center gap-2 font-bold text-slate-800">
                      <Paperclip size={16} className="text-blue-600" /> Attach files
                    </span>
                    <span className="truncate text-xs text-slate-500">{attachments.length ? `${attachments.length} selected` : 'Any format'}</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={async (event) => {
                        const files = Array.from(event.target.files || []);
                        if (!files.length) return;
                        const uploaded = await Promise.all(files.map((file) => toAttachment(file)));
                        setAttachments((current) => [...current, ...uploaded]);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50">
                    <span className="inline-flex items-center gap-2 font-bold text-slate-800">
                      <Image size={16} className="text-blue-600" /> Inline promo image
                    </span>
                    <span className="truncate text-xs text-slate-500">{imageFile?.filename || 'Email body'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          await uploadInlineImage(file);
                          event.target.value = '';
                        }}
                      />
                  </label>
                </div>
                {(attachments.length > 0 || imageFile) && (
                  <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <button
                            key={`${file.filename}-${index}`}
                            type="button"
                            onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                            className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-1 text-blue-800"
                            title="Remove attachment"
                          >
                            <Paperclip size={12} />
                            <span className="truncate">{file.filename}</span>
                            <X size={12} />
                          </button>
                        ))}
                      </div>
                    )}
                    {imageFile && (
                      <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-emerald-800">
                        <Image size={12} />
                        <span className="truncate">inline image: {imageFile.filename}</span>
                      </div>
                    )}
                  </div>
                )}
                <button disabled={saving || !schemaReady} onClick={createCampaign} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                  <Plus size={16} /> Save draft
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                From: {config?.fromEmail || '-'}<br />Reply-to: {config?.replyTo || '-'}
              </p>
            </div>

            <div className="space-y-4 xl:order-1">
              <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Send size={17} className="text-blue-600" />
                  <h2 className="font-bold text-slate-900">Run campaign</h2>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)_140px]">
                  <select value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                    <option value="">Select campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name} - {campaign.subject}</option>
                    ))}
                  </select>
                  <select value={selectedAudienceId} onChange={(event) => setSelectedAudienceId(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                    <option value="">Select audience</option>
                    {audiences.map((audience) => (
                      <option key={audience.id} value={audience.id}>{audience.name} ({audience.contact_count})</option>
                    ))}
                  </select>
                  <button disabled={saving || !schemaReady || !selectedCampaignId || !selectedAudienceId} onClick={sendSelectedCampaign} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                    <Send size={16} /> Send
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <h2 className="font-bold text-slate-900">Saved campaigns</h2>
                  <p className="text-xs font-semibold text-slate-500">Limit: {config?.sendLimit ?? 100}/click</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Campaign</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Sent</th>
                        <th className="px-4 py-2.5">Replies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="align-top hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{campaign.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{campaign.subject}</p>
                            <p className="mt-1 text-[11px] text-slate-400">Created {formatDate(campaign.created_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(campaign.status)}`}>{campaign.status}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{campaign.sent_count} sent<br /><span className="text-xs text-red-600">{campaign.failed_count} failed</span></td>
                          <td className="px-4 py-3 text-slate-700">{campaign.reply_count}</td>
                        </tr>
                      ))}
                      {!campaigns.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No email campaigns yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
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
          <div className="grid min-h-[620px] gap-5 xl:grid-cols-[340px_1fr]">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-900">Audiences</h2>
                  <p className="mt-1 text-xs text-slate-500">Saved contact groups</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAudienceName('New audience');
                    setContactFileName('');
                    setCsvText(sampleCsv);
                    setShowAudienceForm(true);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Plus size={14} /> New
                </button>
              </div>
              <div className="max-h-[560px] overflow-y-auto">
                {audiences.map((audience) => (
                  <button
                    key={audience.id}
                    type="button"
                    onClick={() => {
                      setActiveAudienceId(audience.id);
                      setShowAudienceForm(false);
                    }}
                    className={`block w-full border-b border-slate-100 px-5 py-4 text-left hover:bg-slate-50 ${activeAudience?.id === audience.id && !showAudienceForm ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-900">{audience.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{audience.contact_count}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Created {formatDate(audience.created_at)}</p>
                  </button>
                ))}
                {!audiences.length && <div className="p-8 text-center text-sm text-slate-500">No audiences yet.</div>}
              </div>
            </div>

            {showAudienceForm ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Upload size={17} className="text-blue-600" />
                    <h2 className="font-bold text-slate-900">Create new audience</h2>
                  </div>
                  <button
                    type="button"
                    onClick={downloadSampleExcel}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                  >
                    <Download size={14} /> Sample
                  </button>
                </div>
                <div className="mt-4 max-w-xl space-y-3">
                  <input value={audienceName} onChange={(event) => setAudienceName(event.target.value)} placeholder="Audience name" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
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
                  <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={8} className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" />
                  <div className="flex flex-wrap gap-3">
                    <button disabled={saving || !schemaReady} onClick={createAudienceFromText} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                      <Upload size={16} /> Save audience
                    </button>
                    <button
                      type="button"
                      disabled={saving || !schemaReady}
                      onClick={importLeadFunnel}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                    >
                      <Users size={16} /> Create from Lead Funnel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-900">{activeAudience?.name || 'Audience detail'}</h2>
                    <p className="mt-1 text-xs text-slate-500">{activeAudience ? `${activeAudience.contact_count} contacts` : 'Select an audience from the list'}</p>
                  </div>
                  {activeAudience && <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(activeAudience.status)}`}>{activeAudience.status}</span>}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeAudienceContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900">{contact.full_name || '-'}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-700">{contact.email}</td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(contact.status)}`}>{contact.opt_in ? contact.status : 'opted_out'}</span>
                          </td>
                        </tr>
                      ))}
                      {!activeAudienceContacts.length && <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500">No contacts in this audience.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
