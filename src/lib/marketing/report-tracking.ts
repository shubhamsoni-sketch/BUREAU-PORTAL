import { buildB2cReportRedirectUrl } from '@/lib/whatsapp/analytics';
import { generateTrackingToken } from './codes';

type SupabaseLike = {
  from: (table: string) => any;
};

export type ReportTrackingLink = {
  id: string;
  tracking_token: string;
  customer_id?: string | null;
  lead_id?: string | null;
  campaign_id?: string | null;
  report_id?: string | null;
  report_request_id?: string | null;
  destination_url: string;
  open_count?: number | null;
  expires_at?: string | null;
};

export function buildTrackingUrl(token: string) {
  const baseUrl =
    process.env.WHATSAPP_TRACKING_BASE_URL ||
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    'https://credittrust.in';
  return `${baseUrl.replace(/\/+$/, '')}/r/${encodeURIComponent(token)}`;
}

export async function createReportTrackingLink(params: {
  supabase: SupabaseLike;
  customerId?: string | null;
  leadId?: string | null;
  campaignId?: string | null;
  reportId?: string | null;
  reportRequestId?: string | null;
  destinationUrl?: string | null;
  expiresAt?: string | null;
  tokenPrefix?: string;
}) {
  const token = generateTrackingToken(params.tokenPrefix || 'rpt');
  const destinationUrl = params.destinationUrl
    || (params.reportRequestId ? buildB2cReportRedirectUrl(params.reportRequestId) : '/get-my-report');

  const { data, error } = await params.supabase
    .from('report_tracking_links')
    .insert({
      tracking_token: token,
      customer_id: params.customerId ?? null,
      lead_id: params.leadId ?? null,
      campaign_id: params.campaignId ?? null,
      report_id: params.reportId ?? null,
      report_request_id: params.reportRequestId ?? null,
      destination_url: destinationUrl,
      expires_at: params.expiresAt ?? null,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ReportTrackingLink;
}

export async function resolveReportTrackingLink(supabase: SupabaseLike, token: string) {
  const { data, error } = await supabase
    .from('report_tracking_links')
    .select('*')
    .eq('tracking_token', token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ReportTrackingLink | null;
}

export async function logReportTrackingEvent(params: {
  supabase: SupabaseLike;
  link: ReportTrackingLink;
  eventType?: 'click' | 'open' | 'redirect';
  ipAddress?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}) {
  const now = new Date().toISOString();
  const expired = params.link.expires_at && new Date(params.link.expires_at).getTime() < Date.now();
  if (expired) return { logged: false, expired: true };

  const { error: insertError } = await params.supabase
    .from('report_tracking_events')
    .insert({
      tracking_link_id: params.link.id,
      customer_id: params.link.customer_id ?? null,
      lead_id: params.link.lead_id ?? null,
      campaign_id: params.link.campaign_id ?? null,
      event_type: params.eventType || 'click',
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
      referer: params.referer ?? null,
      occurred_at: now,
    });
  if (insertError) throw new Error(insertError.message);

  const openCount = Number(params.link.open_count || 0) + 1;
  const linkUpdate: Record<string, unknown> = {
    open_count: openCount,
    last_opened_at: now,
  };
  if (!params.link.open_count) linkUpdate.first_opened_at = now;

  const { error: updateError } = await params.supabase
    .from('report_tracking_links')
    .update(linkUpdate)
    .eq('id', params.link.id);
  if (updateError) throw new Error(updateError.message);

  await params.supabase.from('campaign_events').insert({
    campaign_id: params.link.campaign_id ?? null,
    lead_id: params.link.lead_id ?? null,
    customer_id: params.link.customer_id ?? null,
    event_type: params.eventType || 'click',
    event_source: 'report_tracking',
    event_data_json: {
      tracking_link_id: params.link.id,
      report_id: params.link.report_id ?? null,
      report_request_id: params.link.report_request_id ?? null,
    },
    occurred_at: now,
  });

  return { logged: true, expired: false, openCount };
}
