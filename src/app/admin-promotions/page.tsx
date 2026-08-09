'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import {
  Check,
  CheckCheck,
  Mail,
  Megaphone,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  business_name?: string | null;
  source: string;
  status: string;
  opt_in: boolean;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  template_name: string;
  language_code: string;
  body_values: string[];
  audience_status: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

type Recipient = {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: string;
  message_id?: string | null;
  error?: string | null;
  sent_at?: string | null;
  created_at: string;
  promotion_leads?: {
    name?: string | null;
    mobile?: string | null;
    business_name?: string | null;
    city?: string | null;
  } | null;
};

type InboundMessage = {
  id: string;
  event_type?: string | null;
  recipient_phone: string;
  status: string;
  message_id?: string | null;
  error?: string | null;
  created_at: string;
  metadata?: {
    text?: string | null;
    message_type?: string | null;
    display_phone_number?: string | null;
  } | null;
};

type StatCard = [label: string, value: number, Icon: LucideIcon];

const INBOX_REFRESH_MS = 5000;

const sampleCsv = `name,mobile,email,city,business_name,source
Rajesh Mehta,9876543210,rajesh@example.com,Indore,Mehta Finance,facebook
Priya Sharma,9893332647,priya@example.com,Bhopal,Sharma Loans,manual`;

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

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminPromotionsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [inboundMessages, setInboundMessages] = useState<InboundMessage[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [csvText, setCsvText] = useState(sampleCsv);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    template_name: '',
    language_code: 'en',
    body_values: '{name}',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const refreshInFlight = useRef(false);
  const [activePhone, setActivePhone] = useState('');
  const [chatSearch, setChatSearch] = useState('');

  const stats = useMemo(() => {
    const optedIn = leads.filter((lead) => lead.opt_in && lead.status === 'active').length;
    const sent = campaigns.reduce((sum, campaign) => sum + Number(campaign.sent_count || 0), 0);
    const failed = campaigns.reduce((sum, campaign) => sum + Number(campaign.failed_count || 0), 0);
    return { optedIn, sent, failed };
  }, [campaigns, leads]);

  const conversations = useMemo(() => {
    const byPhone = new Map<string, InboundMessage[]>();
    inboundMessages.forEach((message) => {
      const phone = message.recipient_phone || 'unknown';
      byPhone.set(phone, [...(byPhone.get(phone) || []), message]);
    });

    return [...byPhone.entries()]
      .map(([phone, messages]) => {
        const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const last = sorted[sorted.length - 1];
        return { phone, messages: sorted, last };
      })
      .filter(({ phone, last }) => {
        const query = chatSearch.trim().toLowerCase();
        if (!query) return true;
        return phone.includes(query) || (last.metadata?.text || '').toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime());
  }, [chatSearch, inboundMessages]);

  const activeConversation = conversations.find((conversation) => conversation.phone === activePhone) || conversations[0];
  const activeDraft = activeConversation ? replyDrafts[activeConversation.phone] || '' : '';

  useEffect(() => {
    if (!activePhone && conversations[0]) setActivePhone(conversations[0].phone);
    if (activePhone && !conversations.some((conversation) => conversation.phone === activePhone)) {
      setActivePhone(conversations[0]?.phone || '');
    }
  }, [activePhone, conversations]);

  async function authHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  async function loadData(options: { silent?: boolean } = {}) {
    const silent = options.silent ?? false;
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const res = await fetch('/api/admin-promotions', { headers: await authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to load promotions');
      setLeads(json.leads || []);
      setCampaigns(json.campaigns || []);
      setRecipients(json.recipients || []);
      setInboundMessages(json.inboundMessages || []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Unable to load promotions');
    } finally {
      if (!silent) setLoading(false);
      refreshInFlight.current = false;
    }
  }

  async function runAction(payload: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/admin-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      setLeads(json.leads || leads);
      setCampaigns(json.campaigns || campaigns);
      setRecipients(json.recipients || recipients);
      setInboundMessages(json.inboundMessages || inboundMessages);
      setNotice(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();

    const refresh = () => {
      if (document.visibilityState === 'visible') loadData({ silent: true });
    };
    const interval = window.setInterval(refresh, INBOX_REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const importLeads = () => {
    const parsed = parseCsv(csvText);
    runAction({ action: 'import_leads', leads: parsed }, `${parsed.length} lead rows processed`);
  };

  const createCampaign = () => {
    runAction({
      action: 'create_campaign',
      name: campaignForm.name,
      template_name: campaignForm.template_name,
      language_code: campaignForm.language_code,
      body_values: campaignForm.body_values.split('\n').map((line) => line.trim()).filter(Boolean),
      audience_status: 'active',
    }, 'Campaign created');
  };

  return (
    <AdminLayout title="Promotions">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">WhatsApp Marketing</p>
            <h1 className="text-3xl font-bold text-slate-900">Promotions</h1>
            <p className="text-sm text-slate-500 mt-1">Manage opted-in leads, approved templates, campaign sends, and WhatsApp logs.</p>
          </div>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : undefined} /> Refresh
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500" aria-live="polite">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Live inbox sync · {lastUpdatedAt ? `updated ${lastUpdatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'connecting...'}
        </div>

        {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          {([
            ['Total leads', leads.length, Users],
            ['Opted-in leads', stats.optedIn, Users],
            ['Messages sent', stats.sent, Send],
            ['Failed sends', stats.failed, Megaphone],
          ] satisfies StatCard[]).map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <Icon size={18} className="text-blue-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{String(value)}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Import Leads</h2>
              <p className="text-sm text-slate-500">CSV columns: name, mobile, email, city, business_name, source.</p>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="min-h-[210px] w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                disabled={saving}
                onClick={importLeads}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Upload size={16} /> Import / Update Leads
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Create Campaign</h2>
              <p className="text-sm text-slate-500">Use only approved Meta WhatsApp template names.</p>
            </div>
            <div className="p-5 space-y-4">
              <input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Campaign name"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <input
                value={campaignForm.template_name}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, template_name: e.target.value }))}
                placeholder="Meta template name, e.g. credittrust_follow_up"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <input
                value={campaignForm.language_code}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, language_code: e.target.value }))}
                placeholder="Language code"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <textarea
                value={campaignForm.body_values}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, body_values: e.target.value }))}
                placeholder="Template variables, one per line. Use {name}, {business_name}, {city}"
                className="min-h-[96px] w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <button
                disabled={saving}
                onClick={createCampaign}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Megaphone size={16} /> Save Campaign
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-900">Campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Template</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sent</th>
                  <th className="px-5 py-3">Failed</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900">{campaign.name}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{campaign.template_name}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{campaign.status}</span></td>
                    <td className="px-5 py-4">{campaign.sent_count || 0}</td>
                    <td className="px-5 py-4">{campaign.failed_count || 0}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(campaign.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        disabled={saving}
                        onClick={() => runAction({ action: 'send_campaign', campaign_id: campaign.id }, 'Campaign send completed')}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Send size={14} /> Send Now
                      </button>
                    </td>
                  </tr>
                ))}
                {!campaigns.length && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">{loading ? 'Loading campaigns...' : 'No campaigns yet.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-900">Recent Leads</h2></div>
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 8).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{lead.name}</p>
                    <p className="text-xs text-slate-500 truncate">{lead.mobile} · {lead.city || '-'} · {lead.business_name || '-'}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lead.opt_in ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {lead.opt_in ? 'Opted in' : 'No opt-in'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-900">Recent Sends</h2></div>
            <div className="divide-y divide-slate-100">
              {recipients.slice(0, 8).map((recipient) => (
                <div key={recipient.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{recipient.promotion_leads?.name || 'Lead'}</p>
                      <p className="text-xs text-slate-500 truncate">{recipient.promotion_leads?.mobile || '-'} · {formatDate(recipient.sent_at || recipient.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${recipient.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : recipient.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {recipient.status}
                    </span>
                  </div>
                  {recipient.error && <p className="mt-2 text-xs text-red-600">{recipient.error}</p>}
                </div>
              ))}
              {!recipients.length && <p className="p-6 text-sm text-slate-500">No sends yet.</p>}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><MessageCircle size={19} className="text-emerald-600" /> WhatsApp Inbox</h2>
              <p className="text-sm text-slate-500">Chat with incoming enquiries from one workspace.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{inboundMessages.length} messages</span>
          </div>

          <div className="grid min-h-[560px] md:grid-cols-[280px_1fr]">
            <aside className="border-b border-slate-100 bg-slate-50/70 md:border-b-0 md:border-r">
              <div className="border-b border-slate-100 p-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={chatSearch}
                    onChange={(event) => setChatSearch(event.target.value)}
                    placeholder="Search chats"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="max-h-[480px] overflow-y-auto">
                {conversations.map((conversation) => {
                  const preview = conversation.last.metadata?.text || '[Media message]';
                  const isActive = activeConversation?.phone === conversation.phone;
                  return (
                    <button
                      key={conversation.phone}
                      type="button"
                      onClick={() => setActivePhone(conversation.phone)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${isActive ? 'bg-emerald-50' : 'bg-transparent hover:bg-white'}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">{conversation.phone.slice(-2)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">+{conversation.phone}</span>
                          <span className="shrink-0 text-[10px] text-slate-400">{new Date(conversation.last.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">{preview}</span>
                      </span>
                    </button>
                  );
                })}
                {!conversations.length && <p className="p-6 text-center text-sm text-slate-500">No chats yet.</p>}
              </div>
            </aside>

            <div className="flex min-h-[560px] flex-col bg-[#efeae2]">
              {activeConversation ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{activeConversation.phone.slice(-2)}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">+{activeConversation.phone}</p>
                        <p className="text-xs text-emerald-600">WhatsApp conversation</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto p-5">
                    {activeConversation.messages.map((message) => {
                      const outgoing = message.event_type !== 'whatsapp_inbound_message';
                      const text = message.metadata?.text || '[Media message]';
                      return (
                        <div key={message.id} className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[82%] rounded-lg px-3 py-2 shadow-sm ${outgoing ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white'}`}>
                            <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{text}</p>
                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                              <span>{new Date(message.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              {outgoing && (message.status === 'sent' ? <CheckCheck size={13} className="text-blue-500" /> : <Check size={13} />)}
                            </div>
                            {message.error && <p className="mt-1 text-[10px] text-red-600">{message.error}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-200 bg-white p-3">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={activeDraft}
                        onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [activeConversation.phone]: event.target.value }))}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            if (activeDraft.trim() && !saving) {
                              runAction({ action: 'reply_inbox', to: activeConversation.phone, text: activeDraft.trim() }, 'WhatsApp reply sent');
                              setReplyDrafts((prev) => ({ ...prev, [activeConversation.phone]: '' }));
                            }
                          }
                        }}
                        rows={1}
                        placeholder="Type a message"
                        className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={saving || !activeDraft.trim()}
                        onClick={() => {
                          runAction({ action: 'reply_inbox', to: activeConversation.phone, text: activeDraft.trim() }, 'WhatsApp reply sent');
                          setReplyDrafts((prev) => ({ ...prev, [activeConversation.phone]: '' }));
                        }}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        title="Send message"
                      >
                        <Send size={17} />
                      </button>
                    </div>
                    <p className="mt-1 pl-1 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
                  <MessageCircle size={42} className="mb-3 text-emerald-500" />
                  <p className="font-semibold text-slate-700">Select a chat to start replying</p>
                  <p className="mt-1 text-sm">Incoming WhatsApp messages will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
