'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Eye,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Pause,
  Play,
  RefreshCw,
  Send,
  Upload,
  Wallet,
} from 'lucide-react';

type Campaign = {
  id: string;
  campaign_code: string;
  ad_code: string;
  name: string;
  objective: string;
  status: string;
  platform: string;
  content_text?: string | null;
  whatsapp_number: string;
  prefilled_message?: string | null;
  tracking_token?: string | null;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  budget_type?: string | null;
  meta_error?: string | null;
  created_at: string;
  marketing_assets?: Array<{ file_url: string; asset_type: string }> | null;
  meta_campaigns?: Array<{
    meta_campaign_id?: string | null;
    meta_adset_id?: string | null;
    meta_ad_id?: string | null;
    meta_creative_id?: string | null;
    status?: string | null;
  }> | null;
};

type Lead = {
  id: string;
  phone_number: string;
  profile_name?: string | null;
  campaign_code?: string | null;
  lead_status: string;
  otp_status?: string | null;
  report_status?: string | null;
  first_message_text?: string | null;
  first_message_at?: string | null;
  last_message_at?: string | null;
};

type DashboardResponse = {
  success: boolean;
  schemaReady?: boolean;
  warning?: string;
  summary?: {
    campaigns: number;
    total_spend: number;
    reach: number;
    impressions: number;
    clicks: number;
    whatsapp_leads: number;
    reports_opened: number;
    cost_per_whatsapp_lead: number;
  } | null;
  campaigns?: Campaign[];
  leads?: Lead[];
  meta?: {
    missingConfig?: string[];
    permissions?: unknown;
  };
  error?: string;
};

const defaultAudience = JSON.stringify({
  geo_locations: { countries: ['IN'] },
  age_min: 21,
  age_max: 60,
  publisher_platforms: ['facebook', 'instagram'],
}, null, 2);

const defaultRules = JSON.stringify([
  { type: 'pause_if_cpl_above', threshold: 300, enabled: true },
  { type: 'increase_budget_if_cpl_below', threshold: 120, amount: 1000, budget_type: 'daily', enabled: false },
  { type: 'alert_if_spend_above', threshold: 5000, enabled: true },
  { type: 'stop_at_end_date', enabled: true },
], null, 2);

const adEnquiryWhatsAppNumber = '8109276589';

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (['active', 'published', 'ad_created', 'scheduled'].includes(value)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['paused', 'draft'].includes(value)) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (value.includes('error') || value === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function AdminMetaMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<DashboardResponse['summary']>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metaMissing, setMetaMissing] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    objective: 'credit_report_lead',
    platform: 'whatsapp_ads',
    content_text: 'Check your Credit Trust financial health report and understand your credit profile insights.',
    prefilled_message: 'Hi Credit Trust, I am interested in DSA Partner campaign. Please contact me.',
    media_url: '',
    whatsapp_number: adEnquiryWhatsAppNumber,
    budget_type: 'daily',
    daily_budget: '1000',
    lifetime_budget: '',
    start_at: '',
    end_at: '',
    audience_json: defaultAudience,
    automation_rules_json: defaultRules,
  });

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/marketing/campaigns');
      const json = await res.json() as DashboardResponse;
      if (!res.ok || json.success === false) throw new Error(json.error || 'Unable to load marketing dashboard');
      setSummary(json.summary || null);
      setCampaigns(json.campaigns || []);
      setLeads(json.leads || []);
      setMetaMissing(json.meta?.missingConfig || []);
      if (json.warning) setError(json.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load marketing dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const cards = useMemo(() => [
    { label: 'Spend', value: formatCurrency(summary?.total_spend), Icon: Wallet },
    { label: 'Reach', value: formatNumber(summary?.reach), Icon: Eye },
    { label: 'Impressions', value: formatNumber(summary?.impressions), Icon: BarChart3 },
    { label: 'Clicks', value: formatNumber(summary?.clicks), Icon: MousePointerClick },
    { label: 'WhatsApp Leads', value: formatNumber(summary?.whatsapp_leads), Icon: MessageCircle },
    { label: 'Reports Opened', value: formatNumber(summary?.reports_opened), Icon: CheckCircle2 },
  ], [summary]);

  async function runAction(url: string, successMessage: string, init: RequestInit = {}) {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
        ...init,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.error || 'Action failed');
      setNotice(successMessage);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  async function createCampaign() {
    await runAction('/api/marketing/campaigns', 'Draft campaign created with tracking codes', {
      body: JSON.stringify({
        ...form,
        daily_budget: Number(form.daily_budget || 0),
        lifetime_budget: Number(form.lifetime_budget || 0),
      }),
    });
  }

  async function publishCampaign(campaign: Campaign) {
    const confirmed = window.confirm(
      `Publish this campaign live on Meta?\n\nCampaign: ${campaign.name}\nWhatsApp number: ${campaign.whatsapp_number}\n\nThis can create Meta campaign/ad set/ad/creative if not already prepared, then set it ACTIVE.`,
    );
    if (!confirmed) return;
    await runAction(`/api/marketing/campaigns/${campaign.id}/publish-live`, 'Campaign published live on Meta');
  }

  async function uploadMedia(file: File | null) {
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.set('file', file);
      data.set('caption', form.content_text);
      const res = await authFetch('/api/marketing/assets/upload', { method: 'POST', body: data });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Upload failed');
      setForm((prev) => ({ ...prev, media_url: json.file_url || '' }));
      setNotice('Media uploaded and ready for campaign');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  }

  const firstAsset = (campaign: Campaign) => campaign.marketing_assets?.[0]?.file_url || '';

  return (
    <AdminLayout title="Meta Marketing">
      <div className="p-6 space-y-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Meta Marketing Automation</p>
            <h1 className="text-3xl font-bold text-slate-900">Marketing Command Center</h1>
            <p className="mt-1 text-sm text-slate-500">
              Facebook posts, Instagram publishing, Click-to-WhatsApp ads, lead attribution, report opens, insights and automation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runAction('/api/marketing/insights/sync', 'Meta insights sync started', { body: JSON.stringify({ date_preset: 'last_7d' }) })}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} /> Sync Insights
            </button>
            <button
              onClick={() => runAction('/api/marketing/automation/evaluate', 'Automation rules evaluated', { body: JSON.stringify({ execute: false }) })}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Bot size={16} /> Evaluate Rules
            </button>
          </div>
        </div>

        {metaMissing.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Meta config pending: {metaMissing.join(', ')}. Campaigns can be drafted, but publish/ad actions need these env values.
          </div>
        )}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {cards.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <Icon size={18} className="text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Campaign Builder</h2>
              <p className="text-sm text-slate-500">Creates campaign_code, ad_code, tracking_token and WhatsApp prefilled message automatically.</p>
            </div>
            <div className="grid gap-4 p-5">
              <input className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid gap-3 md:grid-cols-2">
                <select className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                  <option value="whatsapp_ads">Click-to-WhatsApp Ads</option>
                  <option value="facebook_page">Facebook Page Post</option>
                  <option value="instagram">Instagram Post</option>
                  <option value="multi">Multi-platform</option>
                </select>
                <input className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Objective" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
              </div>
              <textarea className="min-h-24 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Post/ad content" value={form.content_text} onChange={(e) => setForm({ ...form, content_text: e.target.value })} />
              <textarea className="min-h-20 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="WhatsApp prefilled message" value={form.prefilled_message} onChange={(e) => setForm({ ...form, prefilled_message: e.target.value })} />
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Media URL" value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} />
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <Upload size={16} /> Upload
                  <input type="file" accept="image/*,video/mp4,video/quicktime" className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
                <select className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" value={form.budget_type} onChange={(e) => setForm({ ...form, budget_type: e.target.value })}>
                  <option value="daily">Daily budget</option>
                  <option value="lifetime">Lifetime budget</option>
                </select>
                <input className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Budget INR" value={form.budget_type === 'lifetime' ? form.lifetime_budget : form.daily_budget} onChange={(e) => form.budget_type === 'lifetime' ? setForm({ ...form, lifetime_budget: e.target.value }) : setForm({ ...form, daily_budget: e.target.value })} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="datetime-local" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
                <input type="datetime-local" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
              <textarea className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-blue-500 focus:bg-white" value={form.audience_json} onChange={(e) => setForm({ ...form, audience_json: e.target.value })} />
              <textarea className="min-h-28 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-blue-500 focus:bg-white" value={form.automation_rules_json} onChange={(e) => setForm({ ...form, automation_rules_json: e.target.value })} />
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                Preview WhatsApp message: "{form.prefilled_message.trim() || 'Hi Credit Trust, I am interested in this campaign.'} Ref: CT_META_[auto]"
              </div>
              <button disabled={saving || !form.name.trim()} onClick={createCampaign} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                <Megaphone size={16} /> Create Draft Campaign
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Campaign Performance</h2>
              <p className="text-sm text-slate-500">Drafts stay internal until you explicitly publish. Meta publish needs final confirmation.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Codes</th>
                    <th className="px-4 py-3">Budget</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((campaign) => {
                    const metaDraft = campaign.meta_campaigns?.[0];
                    const hasMetaIds = Boolean(metaDraft?.meta_campaign_id || metaDraft?.meta_adset_id || metaDraft?.meta_ad_id);
                    return (
                    <tr key={campaign.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{campaign.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{campaign.content_text || '-'}</p>
                        {campaign.meta_error && <p className="mt-1 text-xs font-semibold text-red-600">{campaign.meta_error}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-[11px] text-slate-700">{campaign.campaign_code}</p>
                        <p className="font-mono text-[11px] text-slate-500">{campaign.ad_code}</p>
                        <p className="font-mono text-[11px] text-slate-400">{campaign.tracking_token || '-'}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{hasMetaIds ? `Meta: ${metaDraft?.status || 'prepared'}` : 'Meta IDs: not created yet'}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{formatCurrency(campaign.budget_type === 'lifetime' ? campaign.lifetime_budget : campaign.daily_budget)}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(campaign.status)}`}>{campaign.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/admin-meta-marketing/${campaign.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Detail</Link>
                          <button disabled={saving} onClick={() => runAction(`/api/marketing/campaigns/${campaign.id}/publish-post`, 'Post publish/schedule requested', { body: JSON.stringify({ post_text: campaign.content_text, media_url: firstAsset(campaign) }) })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Post</button>
                          <button disabled={saving || hasMetaIds} onClick={() => runAction(`/api/marketing/campaigns/${campaign.id}/create-ad`, 'Meta draft prepared in paused state')} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">Prepare Meta Draft</button>
                          <button disabled={saving} onClick={() => runAction(`/api/marketing/campaigns/${campaign.id}/pause`, 'Campaign paused')} className="rounded-lg border border-amber-200 px-2.5 py-1.5 text-amber-700"><Pause size={13} /></button>
                          <button disabled={saving} onClick={() => publishCampaign(campaign)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-bold text-emerald-700" title="Publish live with confirmation"><Play size={13} /> Publish</button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {!campaigns.length && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{loading ? 'Loading campaigns...' : 'No campaigns yet.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Lead Inbox</h2>
              <p className="text-sm text-slate-500">Incoming WhatsApp ad leads attributed by campaign code and referral payload.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 12).map((lead) => (
                <Link href={`/admin-meta-marketing?lead=${lead.id}`} key={lead.id} className="block p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">+{lead.phone_number} {lead.profile_name ? `· ${lead.profile_name}` : ''}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{lead.first_message_text || '-'}</p>
                      <p className="mt-1 font-mono text-[11px] text-blue-600">{lead.campaign_code || 'unattributed'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(lead.lead_status)}`}>{lead.lead_status}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">Last message: {formatDate(lead.last_message_at)}</p>
                </Link>
              ))}
              {!leads.length && <p className="p-8 text-center text-sm text-slate-500">No WhatsApp ad leads yet.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">Template & Report Tracking</h2>
              <p className="text-sm text-slate-500">Outbound delivery/read/failed and report opens are tracked in the WhatsApp Analytics dashboard.</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Utility template rule</p>
                <p className="mt-1 text-sm text-slate-500">Use WhatsApp Utility templates only for requested report, OTP, status, delivery and financial-health journey updates.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Report links</p>
                <p className="mt-1 text-sm text-slate-500">Final report URLs are not sent directly. Customer receives {'https://credittrust.in/r/{{tracking_token}}'}.</p>
              </div>
              <Link href="/admin-whatsapp-analytics" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
                <Send size={16} /> Open WhatsApp Analytics
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
