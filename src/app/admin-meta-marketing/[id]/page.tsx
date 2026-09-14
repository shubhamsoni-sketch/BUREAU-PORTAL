'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import { ArrowLeft, BarChart3, CheckCheck, MessageCircle, MousePointerClick, RefreshCw, Wallet } from 'lucide-react';

const adEnquiryWhatsAppNumber = '8109276589';

type DetailResponse = {
  success: boolean;
  campaign?: any;
  leads?: any[];
  messages?: any[];
  events?: any[];
  insights?: any[];
  trackingLinks?: any[];
  error?: string;
};

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function statusClass(status: string) {
  const value = String(status || '').toLowerCase();
  if (['active', 'published', 'delivered', 'read', 'sent'].includes(value)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['paused', 'draft', 'scheduled'].includes(value)) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (value.includes('failed') || value.includes('error')) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDetail() {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/marketing/campaigns/${params.id}`);
      const json = await res.json() as DetailResponse;
      if (!res.ok || json.success === false) throw new Error(json.error || 'Unable to load campaign detail');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load campaign detail');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) loadDetail();
  }, [params.id]);

  const summary = useMemo(() => {
    const insights = data?.insights || [];
    const messages = data?.messages || [];
    const tracking = data?.trackingLinks || [];
    const spend = insights.reduce((sum, item) => sum + numberValue(item.spend), 0);
    const clicks = insights.reduce((sum, item) => sum + numberValue(item.clicks), 0);
    const delivered = messages.filter((item) => item.delivered_at || item.status === 'delivered' || item.status === 'read').length;
    const read = messages.filter((item) => item.read_at || item.status === 'read').length;
    const opens = tracking.reduce((sum, item) => sum + numberValue(item.open_count), 0);
    return { spend, clicks, delivered, read, opens, leads: (data?.leads || []).length };
  }, [data]);

  const campaign = data?.campaign;
  const meta = Array.isArray(campaign?.meta_campaigns) ? campaign.meta_campaigns[0] : campaign?.meta_campaigns;
  const post = Array.isArray(campaign?.meta_page_posts) ? campaign.meta_page_posts[0] : campaign?.meta_page_posts;
  const asset = Array.isArray(campaign?.marketing_assets) ? campaign.marketing_assets[0] : campaign?.marketing_assets;

  return (
    <AdminLayout title="Campaign Detail">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href="/admin-meta-marketing" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-blue-600"><ArrowLeft size={16} /> Back to Marketing</Link>
            <h1 className="text-3xl font-bold text-slate-900">{campaign?.name || 'Campaign Detail'}</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">{campaign?.campaign_code || params.id}</p>
          </div>
          <button onClick={loadDetail} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : undefined} /> Refresh
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ['Spend', formatCurrency(summary.spend), Wallet],
            ['Ad Clicks', summary.clicks, MousePointerClick],
            ['WA Leads', summary.leads, MessageCircle],
            ['Delivered', summary.delivered, CheckCheck],
            ['Read', summary.read, BarChart3],
            ['Reports Opened', summary.opens, BarChart3],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon size={18} className="text-blue-600" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Campaign Status</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <p><span className="font-semibold text-slate-500">Status:</span> <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(campaign?.status)}`}>{campaign?.status || '-'}</span></p>
              <p><span className="font-semibold text-slate-500">Platform:</span> {campaign?.platform || '-'}</p>
              <p><span className="font-semibold text-slate-500">WhatsApp:</span> {campaign?.whatsapp_number || adEnquiryWhatsAppNumber}</p>
              <p><span className="font-semibold text-slate-500">Prefill:</span> {campaign?.prefilled_message || '-'}</p>
              <p><span className="font-semibold text-slate-500">Ad Code:</span> <span className="font-mono text-xs">{campaign?.ad_code || '-'}</span></p>
              <p><span className="font-semibold text-slate-500">Tracking Token:</span> <span className="font-mono text-xs">{campaign?.tracking_token || '-'}</span></p>
              <p><span className="font-semibold text-slate-500">Meta Campaign ID:</span> <span className="font-mono text-xs">{meta?.meta_campaign_id || '-'}</span></p>
              <p><span className="font-semibold text-slate-500">Meta Ad Set ID:</span> <span className="font-mono text-xs">{meta?.meta_adset_id || '-'}</span></p>
              <p><span className="font-semibold text-slate-500">Meta Creative ID:</span> <span className="font-mono text-xs">{meta?.meta_creative_id || '-'}</span></p>
              <p><span className="font-semibold text-slate-500">Meta Ad ID:</span> <span className="font-mono text-xs">{meta?.meta_ad_id || '-'}</span></p>
              {campaign?.meta_error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{campaign.meta_error}</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Post / Ad Preview</h2>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {asset?.file_url && (
                asset.asset_type === 'video'
                  ? <video src={asset.file_url} controls className="mb-4 max-h-72 w-full rounded-lg object-cover" />
                  : <img src={asset.file_url} alt="Campaign asset" className="mb-4 max-h-72 w-full rounded-lg object-cover" />
              )}
              <p className="whitespace-pre-wrap text-sm text-slate-800">{campaign?.content_text || 'No post copy added yet.'}</p>
              <p className="mt-3 text-xs font-bold text-blue-600">CTA: WhatsApp Message</p>
              {post?.permalink_url && <a href={post.permalink_url} target="_blank" className="mt-2 inline-block text-xs font-bold text-blue-600">Open published post</a>}
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-900">Customers</h2></div>
            <div className="divide-y divide-slate-100">
              {(data?.leads || []).map((lead) => (
                <div key={lead.id} className="p-4">
                  <p className="font-bold text-slate-900">+{lead.phone_number} {lead.profile_name ? `· ${lead.profile_name}` : ''}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{lead.first_message_text || '-'}</p>
                  <p className="mt-2 text-[11px] text-slate-400">First: {formatDate(lead.first_message_at)} · Last: {formatDate(lead.last_message_at)}</p>
                </div>
              ))}
              {!data?.leads?.length && <p className="p-8 text-center text-sm text-slate-500">No attributed customers yet.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-900">Events Timeline</h2></div>
            <div className="divide-y divide-slate-100">
              {(data?.events || []).map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-900">{event.event_type}</p>
                    <span className="text-xs text-slate-400">{formatDate(event.occurred_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{event.event_source}</p>
                  {event.event_data_json && (
                    <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600">{JSON.stringify(event.event_data_json, null, 2)}</pre>
                  )}
                </div>
              ))}
              {!data?.events?.length && <p className="p-8 text-center text-sm text-slate-500">No events yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
