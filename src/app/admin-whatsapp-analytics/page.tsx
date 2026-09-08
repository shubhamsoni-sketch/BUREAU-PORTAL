'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { authFetch } from '@/lib/supabase/auth-fetch';
import {
  BarChart3,
  CheckCheck,
  Clock,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Send,
  TriangleAlert,
} from 'lucide-react';

type Summary = {
  days: number;
  attempted_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  click_count: number;
  reply_count: number;
  delivered_rate: number;
  read_rate: number;
  failed_rate: number;
  click_rate: number;
  reply_rate: number;
};

type CampaignMetric = {
  key: string;
  campaign_name: string;
  campaign_type: string | null;
  template_name: string;
  language_code: string | null;
  attempted_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  click_count: number;
  clicked_customer_count: number;
  reply_count: number;
  replied_customer_count: number;
  delivered_rate: number;
  read_rate: number;
  failed_rate: number;
  click_rate: number;
  reply_rate: number;
};

type TimelineItem = {
  id: string;
  type: string;
  at: string;
  phone_number: string | null;
  campaign_name: string | null;
  template_name: string | null;
  status: string;
  message: string | null;
};

type AnalyticsResponse = {
  success: boolean;
  schemaReady?: boolean;
  warning?: string;
  summary: Summary | null;
  metrics: CampaignMetric[];
  timeline: TimelineItem[];
  error?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value === 'read' || value === 'delivered' || value === 'sent') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (value === 'click' || value === 'clicked' || value === 'reply') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (value === 'failed') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function metricTone(rate: number) {
  if (rate >= 70) return 'text-emerald-700';
  if (rate >= 35) return 'text-amber-700';
  return 'text-slate-600';
}

export default function AdminWhatsAppAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [schemaReady, setSchemaReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  async function loadAnalytics(selectedDays = days) {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/admin-whatsapp-analytics?days=${selectedDays}`);
      const json = await res.json() as AnalyticsResponse;
      if (!res.ok || json.success === false) throw new Error(json.error || 'Unable to load WhatsApp analytics');
      setSummary(json.summary);
      setMetrics(json.metrics || []);
      setTimeline(json.timeline || []);
      setSchemaReady(json.schemaReady !== false);
      setError(json.warning || '');
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load WhatsApp analytics');
      setSummary(null);
      setMetrics([]);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(days);
  }, []);

  const bestCampaign = useMemo(() => {
    return [...metrics].sort((a, b) => b.read_rate - a.read_rate || b.click_rate - a.click_rate)[0] || null;
  }, [metrics]);

  const cards = [
    { label: 'Sent', value: summary?.sent_count ?? 0, helper: `${summary?.attempted_count ?? 0} attempts`, Icon: Send },
    { label: 'Delivered', value: summary?.delivered_count ?? 0, helper: `${summary?.delivered_rate ?? 0}% delivery`, Icon: CheckCheck },
    { label: 'Read', value: summary?.read_count ?? 0, helper: `${summary?.read_rate ?? 0}% read`, Icon: BarChart3 },
    { label: 'Clicks', value: summary?.click_count ?? 0, helper: `${summary?.click_rate ?? 0}% click`, Icon: MousePointerClick },
    { label: 'Replies', value: summary?.reply_count ?? 0, helper: `${summary?.reply_rate ?? 0}% reply`, Icon: MessageCircle },
    { label: 'Failed', value: summary?.failed_count ?? 0, helper: `${summary?.failed_rate ?? 0}% failed`, Icon: TriangleAlert },
  ];

  return (
    <AdminLayout title="WhatsApp Analytics">
      <div className="p-6 space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Meta Cloud API Tracking</p>
            <h1 className="text-3xl font-bold text-slate-900">WhatsApp Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Campaign-wise sent, delivered, read, failed, report-click, and reply performance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={days}
              onChange={(event) => {
                const value = Number(event.target.value);
                setDays(value);
                loadAnalytics(value);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 365 days</option>
            </select>
            <button
              onClick={() => loadAnalytics(days)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : undefined} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
          <span className={`h-2 w-2 rounded-full ${schemaReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>{lastUpdatedAt ? `Updated ${lastUpdatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Connecting...'}</span>
          {bestCampaign && <span>Best read rate: {bestCampaign.campaign_name} ({bestCampaign.read_rate}%)</span>}
        </div>

        {error && (
          <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${schemaReady ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {cards.map(({ label, value, helper, Icon }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <Icon size={18} className="text-blue-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campaign Performance</h2>
              <p className="text-sm text-slate-500">Rates are calculated against successful sends, except failed rate against attempts.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Template</th>
                  <th className="px-5 py-3">Sent</th>
                  <th className="px-5 py-3">Delivered</th>
                  <th className="px-5 py-3">Read</th>
                  <th className="px-5 py-3">Failed</th>
                  <th className="px-5 py-3">Clicks</th>
                  <th className="px-5 py-3">Replies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.map((metric) => (
                  <tr key={metric.key} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{metric.campaign_name}</p>
                      <p className="text-xs text-slate-500">{metric.campaign_type || 'utility'} · {metric.attempted_count} attempts</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-slate-700">{metric.template_name}</p>
                      <p className="text-xs text-slate-400">{metric.language_code || 'en'}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{metric.sent_count}</td>
                    <td className={`px-5 py-4 font-semibold ${metricTone(metric.delivered_rate)}`}>{metric.delivered_count} ({metric.delivered_rate}%)</td>
                    <td className={`px-5 py-4 font-semibold ${metricTone(metric.read_rate)}`}>{metric.read_count} ({metric.read_rate}%)</td>
                    <td className="px-5 py-4 font-semibold text-red-700">{metric.failed_count} ({metric.failed_rate}%)</td>
                    <td className="px-5 py-4 font-semibold text-blue-700">{metric.click_count} ({metric.click_rate}%)</td>
                    <td className="px-5 py-4 font-semibold text-blue-700">{metric.reply_count} ({metric.reply_rate}%)</td>
                  </tr>
                ))}
                {!metrics.length && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                      {loading ? 'Loading analytics...' : 'No WhatsApp analytics found for this period.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-900">Customer Event Timeline</h2>
            <p className="text-sm text-slate-500">Latest sends, Meta status updates, tracking-link clicks, and WhatsApp replies.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {timeline.map((item) => (
              <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[160px_160px_1fr_auto] md:items-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={14} />
                  {formatDateTime(item.at)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.phone_number ? `+${item.phone_number}` : 'Unknown phone'}</p>
                  <p className="text-xs text-slate-500">{item.campaign_name || '-'}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.template_name || item.type}</p>
                  {item.message && <p className="mt-1 truncate text-xs text-slate-500">{item.message}</p>}
                </div>
                <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(item.status || item.type)}`}>
                  {item.status || item.type}
                </span>
              </div>
            ))}
            {!timeline.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                {loading ? 'Loading timeline...' : 'No customer events yet.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
