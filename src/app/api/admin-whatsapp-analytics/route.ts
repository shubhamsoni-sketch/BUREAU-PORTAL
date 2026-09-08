import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

type QueryResult<T> = {
  data: T[] | null;
  error: { code?: string; message?: string } | null;
};

type SendRow = {
  id: string;
  customer_id: string | null;
  customer_source: string | null;
  phone_number: string;
  campaign_id: string | null;
  source_campaign_id: string | null;
  campaign_name: string;
  campaign_type: string | null;
  template_name: string;
  language_code: string | null;
  whatsapp_message_id: string | null;
  report_request_id: string | null;
  tracking_token: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  click_count: number | null;
  current_status: string;
  created_at: string;
};

type ClickRow = {
  id: string;
  message_send_id: string;
  tracking_token: string;
  phone_number: string | null;
  campaign_id: string | null;
  clicked_at: string;
  user_agent: string | null;
  ip_address: string | null;
};

type IncomingRow = {
  id: string;
  message_send_id: string | null;
  phone_number: string;
  campaign_id: string | null;
  campaign_name: string | null;
  template_name: string | null;
  message_type: string | null;
  message_text: string | null;
  received_at: string;
};

type StatusEventRow = {
  id: string;
  message_send_id: string | null;
  whatsapp_message_id: string | null;
  phone_number: string | null;
  status: string;
  event_at: string;
  failure_reason: string | null;
};

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function isAuthError(auth: unknown): auth is { error: string; status: number } {
  return Boolean(auth && typeof auth === 'object' && 'error' in auth);
}

function tableMissing(result: QueryResult<unknown>) {
  return result.error?.code === '42P01' || Boolean(result.error?.message?.includes('does not exist'));
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function campaignKey(send: SendRow) {
  return send.campaign_id || `${send.campaign_name}|${send.template_name}|${send.language_code || 'en'}`;
}

function isSent(send: SendRow) {
  return Boolean(send.sent_at) || ['sent', 'delivered', 'read'].includes(send.current_status);
}

function isDelivered(send: SendRow) {
  return Boolean(send.delivered_at) || ['delivered', 'read'].includes(send.current_status);
}

function isRead(send: SendRow) {
  return Boolean(send.read_at) || send.current_status === 'read';
}

function isFailed(send: SendRow) {
  return Boolean(send.failed_at) || send.current_status === 'failed';
}

function preview(value: string | null | undefined) {
  if (!value) return null;
  return value.length > 160 ? `${value.slice(0, 157)}...` : value;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  try {
    const days = Math.max(1, Math.min(365, Number(request.nextUrl.searchParams.get('days') || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const sendsQuery = auth.supabase
      .from('whatsapp_message_sends')
      .select('id,customer_id,customer_source,phone_number,campaign_id,source_campaign_id,campaign_name,campaign_type,template_name,language_code,whatsapp_message_id,report_request_id,tracking_token,sent_at,delivered_at,read_at,failed_at,failure_reason,click_count,current_status,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(3000);

    const clicksQuery = auth.supabase
      .from('whatsapp_link_clicks')
      .select('id,message_send_id,tracking_token,phone_number,campaign_id,clicked_at,user_agent,ip_address')
      .gte('clicked_at', since)
      .order('clicked_at', { ascending: false })
      .limit(3000);

    const incomingQuery = auth.supabase
      .from('whatsapp_incoming_messages')
      .select('id,message_send_id,phone_number,campaign_id,campaign_name,template_name,message_type,message_text,received_at')
      .gte('received_at', since)
      .order('received_at', { ascending: false })
      .limit(1000);

    const statusQuery = auth.supabase
      .from('whatsapp_message_status_events')
      .select('id,message_send_id,whatsapp_message_id,phone_number,status,event_at,failure_reason')
      .gte('event_at', since)
      .order('event_at', { ascending: false })
      .limit(3000);

    const [sendsResult, clicksResult, incomingResult, statusResult] = await Promise.all([
      sendsQuery,
      clicksQuery,
      incomingQuery,
      statusQuery,
    ]) as [
      QueryResult<SendRow>,
      QueryResult<ClickRow>,
      QueryResult<IncomingRow>,
      QueryResult<StatusEventRow>,
    ];

    if ([sendsResult, clicksResult, incomingResult, statusResult].some(tableMissing)) {
      return NextResponse.json({
        success: true,
        schemaReady: false,
        warning: 'WhatsApp analytics tables are not available yet. Run the latest Supabase migration first.',
        summary: null,
        metrics: [],
        timeline: [],
      });
    }

    const firstError = [sendsResult, clicksResult, incomingResult, statusResult].find((result) => result.error)?.error;
    if (firstError) throw new Error(firstError.message || 'Unable to load WhatsApp analytics');

    const sends = sendsResult.data ?? [];
    const clicks = clicksResult.data ?? [];
    const incoming = incomingResult.data ?? [];
    const statusEvents = statusResult.data ?? [];
    const sendById = new Map(sends.map((send) => [send.id, send]));
    const metrics = new Map<string, {
      key: string;
      campaign_id: string | null;
      source_campaign_id: string | null;
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
    }>();

    for (const send of sends) {
      const key = campaignKey(send);
      const current = metrics.get(key) || {
        key,
        campaign_id: send.campaign_id,
        source_campaign_id: send.source_campaign_id,
        campaign_name: send.campaign_name,
        campaign_type: send.campaign_type,
        template_name: send.template_name,
        language_code: send.language_code,
        attempted_count: 0,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0,
        failed_count: 0,
        click_count: 0,
        clicked_customer_count: 0,
        reply_count: 0,
        replied_customer_count: 0,
      };
      current.attempted_count += 1;
      if (isSent(send)) current.sent_count += 1;
      if (isDelivered(send)) current.delivered_count += 1;
      if (isRead(send)) current.read_count += 1;
      if (isFailed(send)) current.failed_count += 1;
      current.click_count += Number(send.click_count || 0);
      metrics.set(key, current);
    }

    const clickedSendIdsByKey = new Map<string, Set<string>>();
    for (const click of clicks) {
      const send = sendById.get(click.message_send_id);
      if (!send) continue;
      const key = campaignKey(send);
      const set = clickedSendIdsByKey.get(key) || new Set<string>();
      set.add(click.message_send_id);
      clickedSendIdsByKey.set(key, set);
    }

    const repliedPhonesByKey = new Map<string, Set<string>>();
    for (const reply of incoming) {
      const send = reply.message_send_id ? sendById.get(reply.message_send_id) : null;
      const key = send ? campaignKey(send) : reply.campaign_id || `${reply.campaign_name || 'unknown'}|${reply.template_name || 'unknown'}|en`;
      const current = metrics.get(key);
      if (current) current.reply_count += 1;
      const set = repliedPhonesByKey.get(key) || new Set<string>();
      set.add(reply.phone_number);
      repliedPhonesByKey.set(key, set);
    }

    const campaignMetrics = [...metrics.values()].map((metric) => {
      const clickedCustomers = clickedSendIdsByKey.get(metric.key)?.size || 0;
      const repliedCustomers = repliedPhonesByKey.get(metric.key)?.size || 0;
      return {
        ...metric,
        clicked_customer_count: clickedCustomers,
        replied_customer_count: repliedCustomers,
        delivered_rate: pct(metric.delivered_count, metric.sent_count),
        read_rate: pct(metric.read_count, metric.sent_count),
        failed_rate: pct(metric.failed_count, metric.attempted_count),
        click_rate: pct(clickedCustomers, metric.sent_count),
        reply_rate: pct(repliedCustomers, metric.sent_count),
      };
    }).sort((a, b) => b.sent_count - a.sent_count || b.read_rate - a.read_rate);

    const summary = {
      days,
      attempted_count: sends.length,
      sent_count: sends.filter(isSent).length,
      delivered_count: sends.filter(isDelivered).length,
      read_count: sends.filter(isRead).length,
      failed_count: sends.filter(isFailed).length,
      click_count: clicks.length,
      reply_count: incoming.length,
      delivered_rate: pct(sends.filter(isDelivered).length, sends.filter(isSent).length),
      read_rate: pct(sends.filter(isRead).length, sends.filter(isSent).length),
      failed_rate: pct(sends.filter(isFailed).length, sends.length),
      click_rate: pct(new Set(clicks.map((click) => click.message_send_id)).size, sends.filter(isSent).length),
      reply_rate: pct(new Set(incoming.map((reply) => reply.phone_number)).size, sends.filter(isSent).length),
    };

    const timeline = [
      ...sends.map((send) => ({
        id: `send-${send.id}`,
        type: isFailed(send) ? 'failed' : 'sent',
        at: send.failed_at || send.sent_at || send.created_at,
        phone_number: send.phone_number,
        campaign_name: send.campaign_name,
        template_name: send.template_name,
        status: send.current_status,
        message: send.failure_reason,
      })),
      ...statusEvents.map((event) => ({
        id: `status-${event.id}`,
        type: event.status,
        at: event.event_at,
        phone_number: event.phone_number,
        campaign_name: event.message_send_id ? sendById.get(event.message_send_id)?.campaign_name || null : null,
        template_name: event.message_send_id ? sendById.get(event.message_send_id)?.template_name || null : null,
        status: event.status,
        message: event.failure_reason,
      })),
      ...clicks.map((click) => ({
        id: `click-${click.id}`,
        type: 'click',
        at: click.clicked_at,
        phone_number: click.phone_number,
        campaign_name: sendById.get(click.message_send_id)?.campaign_name || null,
        template_name: sendById.get(click.message_send_id)?.template_name || null,
        status: 'clicked',
        message: click.user_agent ? preview(click.user_agent) : null,
      })),
      ...incoming.map((reply) => ({
        id: `reply-${reply.id}`,
        type: 'reply',
        at: reply.received_at,
        phone_number: reply.phone_number,
        campaign_name: reply.campaign_name,
        template_name: reply.template_name,
        status: reply.message_type || 'reply',
        message: preview(reply.message_text),
      })),
    ].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()).slice(0, 200);

    return NextResponse.json({
      success: true,
      schemaReady: true,
      summary,
      metrics: campaignMetrics,
      timeline,
    });
  } catch (error) {
    console.error('[admin-whatsapp-analytics] load error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load WhatsApp analytics', 500);
  }
}
