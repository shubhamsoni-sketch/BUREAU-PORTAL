'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import {
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Filter,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

type PromotionLead = {
  id: string;
  name?: string | null;
  mobile: string;
  email?: string | null;
  city?: string | null;
  business_name?: string | null;
  source?: string | null;
  status?: string | null;
  opt_in?: boolean | null;
  created_at?: string | null;
};

type PromotionCampaign = {
  id: string;
  name: string;
  template_name: string;
  language_code?: string | null;
  status: string;
  sent_count?: number | null;
  failed_count?: number | null;
  created_at?: string | null;
};

type Recipient = {
  id: string;
  status: string;
  message_id?: string | null;
  error?: string | null;
  created_at?: string | null;
  promotion_leads?: {
    name?: string | null;
    mobile?: string | null;
    business_name?: string | null;
    city?: string | null;
  } | null;
};

type InboxMessage = {
  id: string;
  event_type: string;
  recipient_phone: string;
  status?: string | null;
  created_at: string;
  metadata?: {
    text?: string;
    message_type?: string;
    campaign_id?: string;
  } | null;
};

type AnalyticsSummary = {
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  click_count: number;
  reply_count: number;
  delivered_rate: number;
  read_rate: number;
  reply_rate: number;
};

type LeadFinderSummary = {
  total?: number;
  total_records?: number;
  sales_ready?: number;
  valid_mobile?: number;
  unique_businesses?: number;
};

type AiPlan = {
  campaign_name: string;
  audience_filter: string;
  template_goal: string;
  message_preview: string;
  variables: string[];
  followups: string[];
  guardrails: string[];
};

const tabs = ['Dashboard', 'Audiences', 'Campaigns', 'Inbox', 'Analytics', 'Settings'] as const;
type Tab = (typeof tabs)[number];

const defaultGoal =
  'Create a DSA partner onboarding campaign for sales-ready loan agents with valid mobile numbers.';

function number(value: unknown) {
  return Number(value || 0);
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat('en-IN').format(number(value));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status?: string | null) {
  const value = String(status || '').toLowerCase();
  if (['sent', 'delivered', 'read', 'complete', 'completed'].includes(value)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (value.includes('fail') || value.includes('error'))
    return 'bg-red-50 text-red-700 border-red-200';
  if (value.includes('draft') || value.includes('pending'))
    return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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

export default function AdminGrowthCampaignsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [leads, setLeads] = useState<PromotionLead[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [leadFinder, setLeadFinder] = useState<LeadFinderSummary | null>(null);
  const [activePhone, setActivePhone] = useState('');
  const [replyText, setReplyText] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('valid_mobile');
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    template_name: '',
    language_code: 'en',
    body_values: '{name}\n{city}',
  });
  const [csvText, setCsvText] = useState(
    'name,mobile,email,city,business_name,source\nDemo Lead,919999999999,demo@example.com,Indore,Demo Finance,manual'
  );
  const [goal, setGoal] = useState(defaultGoal);
  const [aiPlan, setAiPlan] = useState<AiPlan | null>(null);
  const refreshInFlight = useRef(false);

  async function loadData(options: { silent?: boolean } = {}) {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    if (!options.silent) setLoading(true);
    setError('');
    try {
      const [promotionsRes, analyticsRes, leadFinderRes] = await Promise.all([
        authFetch('/api/admin-promotions'),
        authFetch('/api/admin-whatsapp-analytics?days=30'),
        authFetch('/api/admin-lead-finder/results?leadType=all&view=all'),
      ]);

      const promotionsJson = await promotionsRes.json();
      const analyticsJson = await analyticsRes.json();
      const leadFinderJson = await leadFinderRes.json();

      if (!promotionsRes.ok || promotionsJson.success === false) {
        throw new Error(promotionsJson.error || 'Unable to load campaign workspace');
      }

      setLeads(promotionsJson.leads || []);
      setCampaigns(promotionsJson.campaigns || []);
      setRecipients(promotionsJson.recipients || []);
      setInbox(promotionsJson.inboundMessages || []);
      if (analyticsJson.success !== false) setAnalytics(analyticsJson.summary || null);
      if (leadFinderJson.success !== false) setLeadFinder(leadFinderJson.summary || null);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Growth Campaigns');
    } finally {
      setLoading(false);
      refreshInFlight.current = false;
    }
  }

  useEffect(() => {
    loadData();
    const interval = window.setInterval(() => loadData({ silent: true }), 8000);
    return () => window.clearInterval(interval);
  }, []);

  const activeLeads = useMemo(
    () => leads.filter((lead) => lead.status === 'active' && lead.opt_in !== false),
    [leads]
  );

  const conversations = useMemo(() => {
    const byPhone = new Map<string, InboxMessage[]>();
    inbox.forEach((message) => {
      const phone = message.recipient_phone || 'unknown';
      byPhone.set(phone, [...(byPhone.get(phone) || []), message]);
    });
    return Array.from(byPhone.entries())
      .map(([phone, messages]) => {
        const sorted = messages.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return { phone, messages: sorted, last: sorted[sorted.length - 1] };
      })
      .sort(
        (a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime()
      );
  }, [inbox]);

  useEffect(() => {
    if (!activePhone && conversations[0]) setActivePhone(conversations[0].phone);
  }, [activePhone, conversations]);

  const activeConversation =
    conversations.find((conversation) => conversation.phone === activePhone) || conversations[0];

  const cards = [
    {
      label: 'Lead Library',
      value: leadFinder?.total || leadFinder?.total_records || 0,
      Icon: Users,
    },
    { label: 'Campaign Leads', value: activeLeads.length, Icon: Target },
    {
      label: 'Sent',
      value: analytics?.sent_count || campaigns.reduce((sum, c) => sum + number(c.sent_count), 0),
      Icon: Send,
    },
    {
      label: 'Replies',
      value: analytics?.reply_count || conversations.length,
      Icon: MessageCircle,
    },
    { label: 'Read Rate', value: `${analytics?.read_rate || 0}%`, Icon: CheckCircle2 },
    { label: 'Clicks', value: analytics?.click_count || 0, Icon: MousePointerClick },
  ];

  async function runAction(payload: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const res = await authFetch('/api/admin-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Action failed');
      setNotice(successMessage);
      await loadData({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  async function generateAiPlan() {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const res = await authFetch('/api/growth-campaigns/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'AI Assist failed');
      setAiPlan(json.plan);
      setCampaignForm((prev) => ({
        ...prev,
        name: json.plan?.campaign_name || prev.name,
        body_values: Array.isArray(json.plan?.variables)
          ? json.plan.variables.map((item: string) => `{${item}}`).join('\n')
          : prev.body_values,
      }));
      setNotice('AI Assist prepared the campaign draft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI Assist failed');
    } finally {
      setSaving(false);
    }
  }

  function importLeads() {
    const rows = parseCsv(csvText);
    runAction({ action: 'import_leads', leads: rows }, 'Audience imported.');
  }

  function createCampaign() {
    runAction(
      {
        action: 'create_campaign',
        name: campaignForm.name,
        template_name: campaignForm.template_name,
        language_code: campaignForm.language_code,
        body_values: campaignForm.body_values
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean),
      },
      'Campaign draft saved.'
    );
  }

  function sendReply() {
    if (!activeConversation || !replyText.trim()) return;
    runAction(
      { action: 'reply_inbox', to: activeConversation.phone, text: replyText.trim() },
      'Reply sent.'
    );
    setReplyText('');
  }

  return (
    <AdminLayout title="Growth Campaigns">
      <div className="space-y-5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Growth Campaigns</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Audience, WhatsApp campaigns, inbox and conversion tracking in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              <ShieldCheck size={16} /> Existing setup safe
            </span>
            <button
              onClick={() => loadData()}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {notice}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'Dashboard' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {cards.map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Icon className="mb-4 text-blue-600" size={24} />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {typeof value === 'number' ? formatNumber(value) : value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950">AI Assist</h2>
                  <Sparkles className="text-violet-600" size={22} />
                </div>
                <textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400"
                />
                <button
                  onClick={generateAiPlan}
                  disabled={saving}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Bot size={17} /> Prepare Draft
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">Draft Preview</h2>
                {aiPlan ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <InfoRow label="Campaign" value={aiPlan.campaign_name} />
                    <InfoRow label="Audience" value={aiPlan.audience_filter} />
                    <InfoRow label="Template" value={aiPlan.template_goal} />
                    <div className="rounded-xl bg-slate-50 p-4 font-semibold text-slate-800">
                      {aiPlan.message_preview}
                    </div>
                  </div>
                ) : (
                  <EmptyState text="Prepare a campaign draft to preview it here." />
                )}
              </section>
            </div>

            <QuickTable
              title="Recent Campaigns"
              rows={campaigns
                .slice(0, 6)
                .map((campaign) => [
                  campaign.name,
                  campaign.template_name,
                  campaign.status,
                  `${formatNumber(campaign.sent_count)} sent`,
                  formatDate(campaign.created_at),
                ])}
              headers={['Campaign', 'Template', 'Status', 'Sent', 'Created']}
            />
          </div>
        )}

        {activeTab === 'Audiences' && (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Audience Import</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                CSV: name, mobile, email, city, business_name, source
              </p>
              <textarea
                value={csvText}
                onChange={(event) => setCsvText(event.target.value)}
                className="mt-4 min-h-72 w-full rounded-xl border border-slate-200 p-4 font-mono text-xs outline-none focus:border-blue-400"
              />
              <button
                onClick={importLeads}
                disabled={saving}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Import Audience
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-950">Audience Library</h2>
                <select
                  value={audienceFilter}
                  onChange={(event) => setAudienceFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                >
                  <option value="valid_mobile">Valid mobile</option>
                  <option value="all">All</option>
                  <option value="opted_in">Opted-in</option>
                </select>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {['Name', 'Mobile', 'City', 'Source', 'Status'].map((head) => (
                        <th key={head} className="px-3 py-3 text-left font-black">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.slice(0, 200).map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-3 py-3 font-bold text-slate-900">
                          {lead.name || lead.business_name || '-'}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs">{lead.mobile}</td>
                        <td className="px-3 py-3">{lead.city || '-'}</td>
                        <td className="px-3 py-3">{lead.source || '-'}</td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            status={lead.opt_in === false ? 'opt-out' : lead.status || 'active'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!leads.length && (
                  <EmptyState text={loading ? 'Loading audience...' : 'No audience yet.'} />
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Campaigns' && (
          <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">New Campaign</h2>
              <div className="mt-4 space-y-3">
                <Input
                  label="Campaign name"
                  value={campaignForm.name}
                  onChange={(value) => setCampaignForm((prev) => ({ ...prev, name: value }))}
                />
                <Input
                  label="Approved template name"
                  value={campaignForm.template_name}
                  onChange={(value) =>
                    setCampaignForm((prev) => ({ ...prev, template_name: value }))
                  }
                />
                <Input
                  label="Language"
                  value={campaignForm.language_code}
                  onChange={(value) =>
                    setCampaignForm((prev) => ({ ...prev, language_code: value }))
                  }
                />
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Template variables
                  </span>
                  <textarea
                    value={campaignForm.body_values}
                    onChange={(event) =>
                      setCampaignForm((prev) => ({ ...prev, body_values: event.target.value }))
                    }
                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-blue-400"
                  />
                </label>
                <button
                  onClick={createCampaign}
                  disabled={saving}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Save Campaign
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Campaigns</h2>
              <div className="mt-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {['Campaign', 'Template', 'Status', 'Sent', 'Failed', 'Action'].map(
                        (head) => (
                          <th key={head} className="px-3 py-3 text-left font-black">
                            {head}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="px-3 py-3 font-bold text-slate-900">{campaign.name}</td>
                        <td className="px-3 py-3 font-mono text-xs">{campaign.template_name}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={campaign.status} />
                        </td>
                        <td className="px-3 py-3">{formatNumber(campaign.sent_count)}</td>
                        <td className="px-3 py-3">{formatNumber(campaign.failed_count)}</td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() =>
                              runAction(
                                { action: 'send_campaign', campaign_id: campaign.id },
                                'Campaign send completed.'
                              )
                            }
                            disabled={saving || !campaign.template_name}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Send
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!campaigns.length && <EmptyState text="No campaigns yet." />}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Inbox' && (
          <section className="grid min-h-[620px] gap-5 xl:grid-cols-[380px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <h2 className="text-xl font-black text-slate-950">Inbox</h2>
                <p className="text-sm font-semibold text-slate-500">
                  {formatNumber(conversations.length)} conversations
                </p>
              </div>
              <div className="max-h-[560px] overflow-auto">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.phone}
                    onClick={() => setActivePhone(conversation.phone)}
                    className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${
                      activeConversation?.phone === conversation.phone ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                      {conversation.phone.slice(-2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black text-slate-900">
                        +{conversation.phone}
                      </span>
                      <span className="block truncate text-sm text-slate-500">
                        {conversation.last.metadata?.text || '[Media message]'}
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                ))}
                {!conversations.length && <EmptyState text="No conversations yet." />}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              {activeConversation ? (
                <>
                  <div className="border-b border-slate-100 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                      WhatsApp conversation
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      +{activeConversation.phone}
                    </h2>
                  </div>
                  <div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-5">
                    {activeConversation.messages.map((message) => {
                      const outgoing = message.event_type !== 'whatsapp_inbound_message';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm ${
                              outgoing ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'
                            }`}
                          >
                            <p>{message.metadata?.text || '[Media message]'}</p>
                            <p
                              className={`mt-1 text-[10px] ${outgoing ? 'text-blue-100' : 'text-slate-400'}`}
                            >
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 p-4">
                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Type reply..."
                      className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-blue-400"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={sendReply}
                        disabled={saving || !replyText.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Send size={16} /> Send Reply
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState text="Select a conversation." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'Analytics' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              {[
                ['Sent', analytics?.sent_count],
                ['Delivered', analytics?.delivered_count],
                ['Read', analytics?.read_count],
                ['Failed', analytics?.failed_count],
                ['Clicks', analytics?.click_count],
                ['Replies', analytics?.reply_count],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(value)}</p>
                </div>
              ))}
            </div>
            <QuickTable
              title="Recent Sends"
              headers={['Lead', 'Status', 'Message ID', 'Time']}
              rows={recipients
                .slice(0, 20)
                .map((recipient) => [
                  recipient.promotion_leads?.name || recipient.promotion_leads?.mobile || '-',
                  recipient.status,
                  recipient.message_id || recipient.error || '-',
                  formatDate(recipient.created_at),
                ])}
            />
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Settings size={20} /> Plug & Play Checklist
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  'Approved WhatsApp templates added',
                  'Webhook receiving inbound messages',
                  'Status tracking enabled',
                  'Lead Finder audience available',
                  'AI Assist server-side only',
                  'Daily send limit enabled',
                  'Opt-out handling required before scale',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <CheckCircle2 className="text-emerald-600" size={18} />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Filter size={20} /> Safe Sending Rules
              </h2>
              <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                <p>Use only approved template names.</p>
                <p>Keep first campaigns small until delivery/reply rates are stable.</p>
                <p>Never send to opt-out or invalid numbers.</p>
                <p>Review AI suggestions before sending.</p>
              </div>
            </section>
          </div>
        )}

        {lastUpdatedAt && (
          <p className="text-right text-xs font-bold text-slate-400">
            Updated{' '}
            {lastUpdatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-400"
      />
    </label>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusTone(status)}`}>
      {status || 'unknown'}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-[130px_1fr]">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-bold text-slate-800">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm font-bold text-slate-400">{text}</div>;
}

function QuickTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {headers.map((head) => (
                <th key={head} className="px-3 py-3 text-left font-black">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className="px-3 py-3 font-semibold text-slate-700"
                  >
                    {cell || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="No records yet." />}
      </div>
    </section>
  );
}
