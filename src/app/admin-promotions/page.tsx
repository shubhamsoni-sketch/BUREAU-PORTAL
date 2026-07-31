'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, RefreshCw, Send, Upload, Users } from 'lucide-react';

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

  const stats = useMemo(() => {
    const optedIn = leads.filter((lead) => lead.opt_in && lead.status === 'active').length;
    const sent = campaigns.reduce((sum, campaign) => sum + Number(campaign.sent_count || 0), 0);
    const failed = campaigns.reduce((sum, campaign) => sum + Number(campaign.failed_count || 0), 0);
    return { optedIn, sent, failed };
  }, [campaigns, leads]);

  async function authHeaders() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-promotions', { headers: await authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to load promotions');
      setLeads(json.leads || []);
      setCampaigns(json.campaigns || []);
      setRecipients(json.recipients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load promotions');
    } finally {
      setLoading(false);
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
      setNotice(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();
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
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Total leads', leads.length, Users],
            ['Opted-in leads', stats.optedIn, Users],
            ['Messages sent', stats.sent, Send],
            ['Failed sends', stats.failed, Megaphone],
          ].map(([label, value, Icon]) => (
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
      </div>
    </AdminLayout>
  );
}
