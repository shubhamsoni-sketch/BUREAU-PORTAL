'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '@/lib/supabase/auth-fetch';
import {
  Bot,
  Database,
  Mail,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

type SettingsRow = {
  ai_auto_reply_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  product_context: string;
  reply_tone: string;
  knowledge_base: string;
  max_auto_replies_per_thread: number;
};

type Conversation = {
  id: string;
  channel: 'whatsapp' | 'email';
  contact_key: string;
  contact_name?: string | null;
  phone_number?: string | null;
  email?: string | null;
  status: string;
  intent: string;
  priority: string;
  ai_enabled: boolean;
  auto_reply_count: number;
  last_message_at?: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_text?: string | null;
  status: string;
  ai_generated: boolean;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  template_name: string;
  status: string;
  sent_count?: number | null;
  failed_count?: number | null;
};

type Summary = {
  totalLeads: number;
  campaigns: number;
  conversations: number;
  callbackRequired: number;
  doNotContact: number;
  aiReplies: number;
};

type AiPlan = {
  campaign_name: string;
  audience_filter: string;
  template_goal: string;
  message_preview: string;
  variables: string[];
};

const tabs = [
  'Overview',
  'Build Campaign',
  'AI Conversations',
  'Knowledge Base',
  'Settings',
] as const;
type Tab = (typeof tabs)[number];

const defaultKnowledge = `CreditTrust/RUPIQA product context:
- Product: DSA portal for CIBIL/bureau report pulls.
- Target users: DSA partners, loan agents, finance consultants, loan channel partners.
- Main value: partner onboarding, wallet/recharge, bureau pull, report history, customer master, API access and admin controls.
- Qualify every interested lead with: business name, city, monthly report pull volume, products handled and callback preference.
- Never promise loan approval, guaranteed CIBIL score improvement or guaranteed credit changes.
- If asked pricing: commercials depend on volume and onboarding; ask expected monthly usage.
- If asked documents: ask business name, GST/PAN if applicable, contact person, mobile and city.
- If not interested or asks to stop: acknowledge and mark do-not-contact.`;

const defaultGoal =
  'Create a DSA partner onboarding campaign for loan agents who need a portal for CIBIL report pulls.';

function fmt(value: unknown) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function dt(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tone(status: string) {
  if (
    ['qualified', 'callback_required', 'sent', 'read', 'delivered', 'active', 'high'].includes(
      status
    )
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (['do_not_contact', 'not_interested', 'failed', 'urgent'].includes(status)) {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  if (['open', 'draft', 'sending', 'normal'].includes(status))
    return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function Status({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black capitalize ${tone(value)}`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function Card({
  label,
  value,
  Icon,
}: {
  label: string;
  value: React.ReactNode;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon size={22} />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400"
      />
    </label>
  );
}

export default function GrowthAddons() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [schemaReady, setSchemaReady] = useState(true);
  const [settings, setSettings] = useState<SettingsRow>({
    ai_auto_reply_enabled: true,
    whatsapp_enabled: true,
    email_enabled: false,
    product_context: 'DSA Portal and CIBIL Pull',
    reply_tone: 'clear_professional',
    knowledge_base: defaultKnowledge,
    max_auto_replies_per_thread: 20,
  });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [goal, setGoal] = useState(defaultGoal);
  const [plan, setPlan] = useState<AiPlan | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    template_name: '',
    language_code: 'en',
    body_values: '{name}\n{city}',
  });
  const refreshLock = useRef(false);

  async function load(silent = false) {
    if (refreshLock.current) return;
    refreshLock.current = true;
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/growth-campaigns/workspace');
      const json = await res.json();
      if (!res.ok || json.success === false)
        throw new Error(json.error || 'Unable to load Growth Campaigns');
      setSchemaReady(json.schemaReady !== false);
      if (json.settings) setSettings((prev) => ({ ...prev, ...json.settings }));
      setSummary(json.summary || null);
      setCampaigns(json.campaigns || []);
      setConversations(json.conversations || []);
      setMessages(json.messages || []);
      if (!activeConversationId && json.conversations?.[0])
        setActiveConversationId(json.conversations[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Growth Campaigns');
    } finally {
      setLoading(false);
      refreshLock.current = false;
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 10000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeConversation =
    conversations.find((item) => item.id === activeConversationId) || conversations[0];
  const activeMessages = useMemo(
    () =>
      messages
        .filter((item) => item.conversation_id === activeConversation?.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [activeConversation?.id, messages]
  );

  async function post(url: string, payload: Record<string, unknown>, success: string) {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Action failed');
      setNotice(success);
      await load(true);
      return json;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function preparePlan() {
    const json = await post('/api/growth-campaigns/ai', { goal }, 'Campaign draft prepared.');
    if (!json?.plan) return;
    setPlan(json.plan);
    setCampaignForm((prev) => ({
      ...prev,
      name: json.plan.campaign_name || prev.name,
      body_values: Array.isArray(json.plan.variables)
        ? json.plan.variables.map((item: string) => `{${item}}`).join('\n')
        : prev.body_values,
    }));
  }

  function saveCampaign() {
    post(
      '/api/admin-promotions',
      {
        action: 'create_campaign',
        name: campaignForm.name,
        template_name: campaignForm.template_name,
        language_code: campaignForm.language_code,
        body_values: campaignForm.body_values
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      },
      'Campaign saved.'
    );
  }

  function sendCampaign(campaignId: string) {
    post(
      '/api/admin-promotions',
      { action: 'send_campaign', campaign_id: campaignId },
      'Campaign send completed.'
    );
  }

  function saveSettings() {
    post(
      '/api/growth-campaigns/workspace',
      { action: 'save_settings', ...settings },
      'AI communication settings saved.'
    );
  }

  function updateConversation(id: string, patch: Record<string, unknown>) {
    post(
      '/api/growth-campaigns/workspace',
      { action: 'update_conversation', id, ...patch },
      'Conversation updated.'
    );
  }

  const topCards = [
    ['Total Leads', summary?.totalLeads || 0, Database],
    ['Campaigns', summary?.campaigns || 0, Send],
    ['Conversations', summary?.conversations || 0, MessageCircle],
    ['AI Replies', summary?.aiReplies || 0, Bot],
    ['Callback Required', summary?.callbackRequired || 0, Target],
    ['Do Not Contact', summary?.doNotContact || 0, ShieldCheck],
  ] as const;

  return (
    <>
      <div className="space-y-5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">AI Growth Add-ons</h1>
            <p className="mt-2 text-sm font-bold text-slate-500">
              AI-led conversations, campaign briefs, knowledge base and auto-replies for marketing leads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${settings.ai_auto_reply_enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
            >
              {settings.ai_auto_reply_enabled ? (
                <PlayCircle size={16} />
              ) : (
                <PauseCircle size={16} />
              )}
              AI Auto Reply {settings.ai_auto_reply_enabled ? 'On' : 'Off'}
            </span>
            <button
              onClick={() => load()}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                tab === item
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {!schemaReady && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
            Communication database is not active yet. Run the Growth Campaigns migration.
          </div>
        )}
        {notice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
            {notice}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
            {error}
          </div>
        )}

        {tab === 'Overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {topCards.map(([label, value, Icon]) => (
                <Card key={label} label={label} value={fmt(value)} Icon={Icon} />
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">How it works</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      No human reply queue required.
                    </p>
                  </div>
                  <Sparkles className="text-blue-600" />
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    [
                      '1',
                      'Select audience',
                      'Use Lead Finder or campaign audience with valid contact details.',
                    ],
                    ['2', 'Send campaign', 'Approved template starts the conversation.'],
                    [
                      '3',
                      'AI replies',
                      'Every reply is classified, answered and tracked automatically.',
                    ],
                  ].map(([step, title, text]) => (
                    <div key={step} className="rounded-2xl bg-slate-50 p-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                        {step}
                      </span>
                      <h3 className="mt-4 font-black text-slate-950">{title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{text}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">Channel readiness</h2>
                <div className="mt-5 space-y-3">
                  <ChannelRow
                    icon={<MessageCircle size={18} />}
                    label="WhatsApp"
                    status={settings.whatsapp_enabled ? 'Active' : 'Off'}
                  />
                  <ChannelRow
                    icon={<Mail size={18} />}
                    label="Email"
                    status={settings.email_enabled ? 'Active' : 'Setup pending'}
                  />
                  <ChannelRow
                    icon={<Bot size={18} />}
                    label="AI reply engine"
                    status={settings.ai_auto_reply_enabled ? 'Active' : 'Paused'}
                  />
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'Build Campaign' && (
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Campaign brief</h2>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="mt-4 min-h-36 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400"
              />
              <button
                onClick={preparePlan}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Sparkles size={17} /> Prepare
              </button>
              {plan && (
                <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                    Message preview
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{plan.message_preview}</p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Save campaign</h2>
              <div className="mt-5 grid gap-4">
                <Field
                  label="Campaign name"
                  value={campaignForm.name}
                  onChange={(value) => setCampaignForm((prev) => ({ ...prev, name: value }))}
                />
                <Field
                  label="Approved template name"
                  value={campaignForm.template_name}
                  onChange={(value) =>
                    setCampaignForm((prev) => ({ ...prev, template_name: value }))
                  }
                  placeholder="Example: dsa_partner_intro"
                />
                <Field
                  label="Language"
                  value={campaignForm.language_code}
                  onChange={(value) =>
                    setCampaignForm((prev) => ({ ...prev, language_code: value }))
                  }
                />
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    Template variables
                  </span>
                  <textarea
                    value={campaignForm.body_values}
                    onChange={(event) =>
                      setCampaignForm((prev) => ({ ...prev, body_values: event.target.value }))
                    }
                    className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none focus:border-blue-400"
                  />
                </label>
                <button
                  onClick={saveCampaign}
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Save Campaign
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <h2 className="text-2xl font-black text-slate-950">Campaigns</h2>
              <div className="mt-5 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {['Campaign', 'Template', 'Status', 'Sent', 'Failed', 'Action'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-black">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="px-4 py-3 font-black text-slate-900">{campaign.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{campaign.template_name}</td>
                        <td className="px-4 py-3">
                          <Status value={campaign.status} />
                        </td>
                        <td className="px-4 py-3">{fmt(campaign.sent_count)}</td>
                        <td className="px-4 py-3">{fmt(campaign.failed_count)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => sendCampaign(campaign.id)}
                            disabled={saving}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Send
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!campaigns.length && (
                  <Empty text={loading ? 'Loading campaigns...' : 'No campaigns yet.'} />
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'AI Conversations' && (
          <section className="grid min-h-[650px] gap-5 xl:grid-cols-[390px_1fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-2xl font-black text-slate-950">Conversations</h2>
                <p className="text-sm font-bold text-slate-500">
                  {fmt(conversations.length)} threads
                </p>
              </div>
              <div className="max-h-[590px] overflow-auto">
                {conversations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveConversationId(item.id)}
                    className={`w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${activeConversation?.id === item.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-black text-slate-950">
                        {item.contact_name || item.phone_number || item.email || item.contact_key}
                      </p>
                      <Status value={item.priority} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Status value={item.status} />
                      <Status value={item.intent} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {dt(item.last_message_at)}
                    </p>
                  </button>
                ))}
                {!conversations.length && <Empty text="No conversations yet." />}
              </div>
            </div>

            <div className="flex overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {activeConversation ? (
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                          {activeConversation.channel}
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950">
                          {activeConversation.contact_name ||
                            activeConversation.phone_number ||
                            activeConversation.email}
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            updateConversation(activeConversation.id, {
                              ai_enabled: !activeConversation.ai_enabled,
                            })
                          }
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                        >
                          AI {activeConversation.ai_enabled ? 'On' : 'Off'}
                        </button>
                        <select
                          value={activeConversation.status}
                          onChange={(event) =>
                            updateConversation(activeConversation.id, {
                              status: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black"
                        >
                          {[
                            'open',
                            'qualified',
                            'callback_required',
                            'converted',
                            'not_interested',
                            'do_not_contact',
                            'closed',
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-5">
                    {activeMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[74%] rounded-3xl px-4 py-3 text-sm font-semibold shadow-sm ${message.direction === 'outbound' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}
                        >
                          <p>{message.message_text || '[Message]'}</p>
                          <p
                            className={`mt-2 text-[10px] font-bold ${message.direction === 'outbound' ? 'text-blue-100' : 'text-slate-400'}`}
                          >
                            {message.ai_generated ? 'AI reply · ' : ''}
                            {dt(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!activeMessages.length && (
                      <Empty text="No messages in this conversation yet." />
                    )}
                  </div>
                </div>
              ) : (
                <Empty text="Select a conversation." />
              )}
            </div>
          </section>
        )}

        {tab === 'Knowledge Base' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">AI knowledge base</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  This is what the AI uses while replying to DSA/CIBIL enquiries.
                </p>
              </div>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Save Knowledge
              </button>
            </div>
            <textarea
              value={settings.knowledge_base || ''}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, knowledge_base: event.target.value }))
              }
              className="mt-5 min-h-[520px] w-full rounded-2xl border border-slate-200 p-5 font-mono text-sm leading-6 text-slate-900 outline-none focus:border-blue-400"
            />
          </section>
        )}

        {tab === 'Settings' && (
          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Automation</h2>
              <div className="mt-5 space-y-4">
                <Toggle
                  label="AI auto reply"
                  value={settings.ai_auto_reply_enabled}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, ai_auto_reply_enabled: value }))
                  }
                />
                <Toggle
                  label="WhatsApp channel"
                  value={settings.whatsapp_enabled}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, whatsapp_enabled: value }))
                  }
                />
                <Toggle
                  label="Email channel"
                  value={settings.email_enabled}
                  onChange={(value) => setSettings((prev) => ({ ...prev, email_enabled: value }))}
                />
                <Field
                  label="Product context"
                  value={settings.product_context || ''}
                  onChange={(value) => setSettings((prev) => ({ ...prev, product_context: value }))}
                />
                <Field
                  label="Max AI replies per thread"
                  value={String(settings.max_auto_replies_per_thread || 20)}
                  onChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      max_auto_replies_per_thread: Number(value) || 20,
                    }))
                  }
                />
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Save Settings
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Email setup</h2>
              <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-600">
                <p>Email will use the same conversation database and AI knowledge base.</p>
                <p>
                  When mail provider access is connected, inbound replies will be saved as email
                  conversations and AI replies can be sent from the same engine.
                </p>
                <p>No separate workflow is needed for the team.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left"
    >
      <span className="font-black text-slate-800">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
      >
        {value ? 'On' : 'Off'}
      </span>
    </button>
  );
}

function ChannelRow({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-3 font-black text-slate-900">
        <span className="text-blue-600">{icon}</span>
        {label}
      </div>
      <Status value={status.toLowerCase().replace(/\s+/g, '_')} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">
      {text}
    </div>
  );
}

