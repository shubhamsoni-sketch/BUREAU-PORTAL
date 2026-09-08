import { randomBytes } from 'crypto';

export type SupabaseLike = {
  from: (table: string) => any;
};

type SendRow = {
  id: string;
  customer_id?: string | null;
  customer_source?: string | null;
  phone_number?: string | null;
  campaign_id?: string | null;
  source_campaign_id?: string | null;
  campaign_name?: string | null;
  template_name?: string | null;
  report_request_id?: string | null;
  redirect_url?: string | null;
  current_status?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_at?: string | null;
  click_count?: number | null;
};

export type WhatsAppAnalyticsInput = {
  supabase?: SupabaseLike | null;
  customerId?: string | null;
  customerSource?: string | null;
  phoneNumber: string;
  campaignName?: string | null;
  campaignType?: string | null;
  sourceCampaignId?: string | null;
  templateName: string;
  languageCode?: string | null;
  whatsappMessageId?: string | null;
  reportRequestId?: string | null;
  reportToken?: string | null;
  trackingToken?: string | null;
  redirectUrl?: string | null;
  sentAt?: string | null;
  currentStatus?: string | null;
  failureReason?: string | null;
  providerStatus?: number | null;
  providerResponse?: unknown;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
};

export type WhatsAppStatusUpdateInput = {
  supabase?: SupabaseLike | null;
  whatsappMessageId?: string | null;
  phoneNumber?: string | null;
  status?: string | null;
  timestamp?: string | number | null;
  failureReason?: string | null;
  rawStatus?: unknown;
};

export type WhatsAppIncomingMessageInput = {
  supabase?: SupabaseLike | null;
  phoneNumber?: string | null;
  whatsappMessageId?: string | null;
  messageType?: string | null;
  messageText?: string | null;
  buttonPayload?: string | null;
  timestamp?: string | number | null;
  rawMessage?: unknown;
  metadata?: Record<string, unknown>;
};

export type WhatsAppTrackingClickInput = {
  supabase?: SupabaseLike | null;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown>;
};

const STATUS_RANK: Record<string, number> = {
  queued: 0,
  failed: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function defaultCountryCode() {
  return process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91';
}

export function normalizeAnalyticsPhone(input: unknown) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `${defaultCountryCode()}${digits}`;
  return digits;
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return { value };
}

function eventTime(timestamp?: string | number | null) {
  if (!timestamp) return new Date().toISOString();
  const raw = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  if (Number.isFinite(raw) && raw > 0) return new Date(raw * 1000).toISOString();
  const parsed = new Date(String(timestamp));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function bestStatus(current: string | null | undefined, next: string) {
  if (next === 'failed') return 'failed';
  const currentRank = STATUS_RANK[current || 'queued'] ?? 0;
  const nextRank = STATUS_RANK[next] ?? currentRank;
  return nextRank >= currentRank ? next : (current || next);
}

export function createWhatsAppTrackingToken(prefix = 'wa') {
  return `${prefix}_${randomBytes(18).toString('base64url')}`;
}

export function buildWhatsAppTrackingUrl(token: string) {
  const baseUrl =
    process.env.WHATSAPP_TRACKING_BASE_URL ||
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    'https://credittrust.in';
  return `${baseUrl.replace(/\/+$/, '')}/r/${encodeURIComponent(token)}`;
}

export function buildB2cReportRedirectUrl(requestId: string) {
  return `/credit-intelligence?request_id=${encodeURIComponent(requestId)}`;
}

async function ensureCampaign(params: {
  supabase: SupabaseLike;
  campaignName: string;
  campaignType: string;
  templateName: string;
  languageCode: string;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const row = {
    campaign_name: params.campaignName,
    campaign_type: params.campaignType,
    template_name: params.templateName,
    language_code: params.languageCode,
    status: 'active',
    created_by: params.createdBy ?? null,
    metadata: params.metadata ?? {},
  };

  const { data, error } = await params.supabase
    .from('whatsapp_message_campaigns')
    .upsert(row, {
      onConflict: 'campaign_name,template_name,language_code',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data?.id as string | null;
}

export async function logWhatsAppTemplateSend(params: WhatsAppAnalyticsInput) {
  if (!params.supabase) return null;

  try {
    const supabase = params.supabase;
    const languageCode = clean(params.languageCode) || process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
    const templateName = clean(params.templateName);
    const campaignName = clean(params.campaignName) || templateName || 'whatsapp_template';
    const campaignType = clean(params.campaignType) || 'utility';
    const phoneNumber = normalizeAnalyticsPhone(params.phoneNumber);
    const currentStatus = clean(params.currentStatus) || (params.failureReason ? 'failed' : 'sent');
    const sentAt = params.sentAt || (currentStatus === 'sent' ? new Date().toISOString() : null);
    const failedAt = currentStatus === 'failed' ? new Date().toISOString() : null;

    const campaignId = await ensureCampaign({
      supabase,
      campaignName,
      campaignType,
      templateName,
      languageCode,
      createdBy: params.createdBy,
      metadata: {
        source_campaign_id: params.sourceCampaignId ?? null,
      },
    });

    const row = {
      customer_id: params.customerId ?? null,
      customer_source: params.customerSource ?? null,
      phone_number: phoneNumber,
      campaign_id: campaignId,
      source_campaign_id: params.sourceCampaignId ?? null,
      campaign_name: campaignName,
      campaign_type: campaignType,
      template_name: templateName,
      language_code: languageCode,
      whatsapp_message_id: params.whatsappMessageId ?? null,
      report_request_id: params.reportRequestId ?? null,
      report_token: params.reportToken ?? null,
      tracking_token: params.trackingToken ?? null,
      redirect_url: params.redirectUrl ?? null,
      sent_at: sentAt,
      failed_at: failedAt,
      failure_reason: params.failureReason ?? null,
      current_status: currentStatus,
      provider_status: params.providerStatus ?? null,
      provider_response: jsonObject(params.providerResponse),
      metadata: params.metadata ?? {},
    };

    const builder = supabase.from('whatsapp_message_sends');
    const result = params.whatsappMessageId
      ? await builder.upsert(row, { onConflict: 'whatsapp_message_id', ignoreDuplicates: false }).select('id').single()
      : await builder.insert(row).select('id').single();

    if (result.error) throw new Error(result.error.message);
    return result.data as { id: string } | null;
  } catch (error) {
    console.warn('[whatsapp-analytics] template send log failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function insertStatusEvent(params: {
  supabase: SupabaseLike;
  send: SendRow | null;
  whatsappMessageId: string | null;
  phoneNumber: string | null;
  status: string;
  eventAt: string;
  failureReason: string | null;
  rawStatus?: unknown;
}) {
  const row = {
    message_send_id: params.send?.id ?? null,
    whatsapp_message_id: params.whatsappMessageId,
    phone_number: params.phoneNumber || params.send?.phone_number || null,
    status: params.status,
    event_at: params.eventAt,
    failure_reason: params.failureReason,
    raw_status: jsonObject(params.rawStatus),
  };

  await params.supabase
    .from('whatsapp_message_status_events')
    .upsert(row, {
      onConflict: 'whatsapp_message_id,status,event_at',
      ignoreDuplicates: true,
    });
}

export async function updateWhatsAppMessageStatus(params: WhatsAppStatusUpdateInput) {
  if (!params.supabase || !params.whatsappMessageId) return null;

  try {
    const supabase = params.supabase;
    const whatsappMessageId = params.whatsappMessageId;
    const status = clean(params.status).toLowerCase() || 'unknown';
    const phoneNumber = normalizeAnalyticsPhone(params.phoneNumber);
    const eventAt = eventTime(params.timestamp);

    const { data: send, error: findError } = await supabase
      .from('whatsapp_message_sends')
      .select('id,phone_number,current_status,sent_at,delivered_at,read_at,failed_at')
      .eq('whatsapp_message_id', whatsappMessageId)
      .maybeSingle();

    if (findError) throw new Error(findError.message);

    await insertStatusEvent({
      supabase,
      send: (send as SendRow | null) ?? null,
      whatsappMessageId,
      phoneNumber,
      status,
      eventAt,
      failureReason: params.failureReason ?? null,
      rawStatus: params.rawStatus,
    });

    if (!send) return null;

    const update: Record<string, unknown> = {
      current_status: bestStatus((send as SendRow).current_status, status),
    };

    if (status === 'sent') update.sent_at = eventAt;
    if (status === 'delivered' && !(send as SendRow).delivered_at) update.delivered_at = eventAt;
    if (status === 'read' && !(send as SendRow).read_at) {
      update.read_at = eventAt;
      if (!(send as SendRow).delivered_at) update.delivered_at = eventAt;
    }
    if (status === 'failed') {
      update.failed_at = eventAt;
      update.failure_reason = params.failureReason ?? null;
    }

    const { error: updateError } = await supabase
      .from('whatsapp_message_sends')
      .update(update)
      .eq('id', (send as SendRow).id);
    if (updateError) throw new Error(updateError.message);

    await supabase
      .from('promotion_campaign_recipients')
      .update({
        status,
        error: status === 'failed' ? params.failureReason ?? null : null,
      })
      .eq('message_id', whatsappMessageId);

    return { id: (send as SendRow).id, status };
  } catch (error) {
    console.warn('[whatsapp-analytics] status update failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

function extractLatestCampaign(send: SendRow | null) {
  if (!send) {
    return {
      message_send_id: null,
      customer_id: null,
      customer_source: null,
      campaign_id: null,
      campaign_name: null,
      template_name: null,
    };
  }

  return {
    message_send_id: send.id,
    customer_id: send.customer_id ?? null,
    customer_source: send.customer_source ?? null,
    campaign_id: send.campaign_id ?? null,
    campaign_name: send.campaign_name ?? null,
    template_name: send.template_name ?? null,
  };
}

export async function logWhatsAppIncomingMessage(params: WhatsAppIncomingMessageInput) {
  if (!params.supabase || !params.phoneNumber) return null;

  try {
    const supabase = params.supabase;
    const phoneNumber = normalizeAnalyticsPhone(params.phoneNumber);
    const { data: latestSend, error: latestError } = await supabase
      .from('whatsapp_message_sends')
      .select('id,customer_id,customer_source,campaign_id,campaign_name,template_name')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw new Error(latestError.message);
    const related = extractLatestCampaign((latestSend as SendRow | null) ?? null);
    const row = {
      ...related,
      phone_number: phoneNumber,
      whatsapp_message_id: params.whatsappMessageId ?? null,
      message_type: params.messageType ?? null,
      message_text: params.messageText ?? null,
      button_payload: params.buttonPayload ?? null,
      received_at: eventTime(params.timestamp),
      raw_message: jsonObject(params.rawMessage),
      metadata: params.metadata ?? {},
    };

    const builder = supabase.from('whatsapp_incoming_messages');
    const result = params.whatsappMessageId
      ? await builder.upsert(row, { onConflict: 'whatsapp_message_id', ignoreDuplicates: true }).select('id').single()
      : await builder.insert(row).select('id').single();

    if (result.error) throw new Error(result.error.message);
    return result.data as { id: string } | null;
  } catch (error) {
    console.warn('[whatsapp-analytics] incoming message log failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function logWhatsAppTrackingClick(params: WhatsAppTrackingClickInput) {
  if (!params.supabase || !params.token) return { send: null, clicked: false };

  try {
    const supabase = params.supabase;
    const { data: send, error: findError } = await supabase
      .from('whatsapp_message_sends')
      .select('id,customer_id,customer_source,phone_number,report_request_id,campaign_id,tracking_token,redirect_url,click_count')
      .eq('tracking_token', params.token)
      .maybeSingle();

    if (findError) throw new Error(findError.message);
    if (!send) return { send: null, clicked: false };

    const sendRow = send as SendRow & { tracking_token?: string | null };
    const { error: insertError } = await supabase.from('whatsapp_link_clicks').insert({
      message_send_id: sendRow.id,
      tracking_token: params.token,
      customer_id: sendRow.customer_id ?? null,
      customer_source: sendRow.customer_source ?? null,
      phone_number: sendRow.phone_number ?? null,
      report_request_id: sendRow.report_request_id ?? null,
      campaign_id: sendRow.campaign_id ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
      referrer: params.referrer ?? null,
      metadata: params.metadata ?? {},
    });
    if (insertError) throw new Error(insertError.message);

    await supabase
      .from('whatsapp_message_sends')
      .update({ click_count: Number(sendRow.click_count || 0) + 1 })
      .eq('id', sendRow.id);

    return { send: sendRow, clicked: true };
  } catch (error) {
    console.warn('[whatsapp-analytics] click log failed:', error instanceof Error ? error.message : error);
    return { send: null, clicked: false };
  }
}
