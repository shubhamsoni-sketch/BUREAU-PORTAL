import { extractCampaignCode } from './codes';

type SupabaseLike = {
  from: (table: string) => any;
};

type IncomingMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: unknown;
  referral?: {
    source_url?: string;
    source_id?: string;
    source_type?: string;
    headline?: string;
    body?: string;
    media_type?: string;
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    ctwa_clid?: string;
  };
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function eventTime(timestamp?: string | number | null) {
  if (!timestamp) return new Date().toISOString();
  const raw = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  if (Number.isFinite(raw) && raw > 0) return new Date(raw * 1000).toISOString();
  const parsed = new Date(String(timestamp));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizePhone(input: unknown) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

export function getIncomingMessageText(message: IncomingMessage) {
  const interactive = message.interactive && typeof message.interactive === 'object'
    ? message.interactive as { button_reply?: { title?: string }; list_reply?: { title?: string } }
    : null;
  return message.text?.body
    || message.button?.text
    || interactive?.button_reply?.title
    || interactive?.list_reply?.title
    || '';
}

export function getReferralMeta(message: IncomingMessage) {
  const referral = message.referral || {};
  return {
    ad_id: clean(referral.source_id) || null,
    source_type: clean(referral.source_type) || null,
    source_url: clean(referral.source_url) || null,
    headline: clean(referral.headline) || null,
    body: clean(referral.body) || null,
    ctwa_clid: clean(referral.ctwa_clid) || null,
    raw_referral: referral,
  };
}

async function findCampaign(supabase: SupabaseLike, campaignCode: string | null, referralAdId: string | null) {
  if (campaignCode) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('id,campaign_code,name,status')
      .eq('campaign_code', campaignCode)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;
  }

  if (referralAdId) {
    const { data, error } = await supabase
      .from('meta_campaigns')
      .select('marketing_campaign_id,meta_ad_id,marketing_campaigns(id,campaign_code,name,status)')
      .eq('meta_ad_id', referralAdId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const joined = Array.isArray(data?.marketing_campaigns)
      ? data?.marketing_campaigns[0]
      : data?.marketing_campaigns;
    if (joined) return joined;
  }

  return null;
}

export async function upsertWhatsAppLeadFromInbound(params: {
  supabase: SupabaseLike;
  phoneNumber: string;
  waId?: string | null;
  profileName?: string | null;
  message: IncomingMessage;
}) {
  const phoneNumber = normalizePhone(params.phoneNumber);
  const messageText = getIncomingMessageText(params.message);
  const campaignCode = extractCampaignCode(messageText);
  const referral = getReferralMeta(params.message);
  const campaign = await findCampaign(params.supabase, campaignCode, referral.ad_id);
  const finalCampaignCode = campaignCode || campaign?.campaign_code || null;
  const now = eventTime(params.message.timestamp);

  let existing = null;
  if (finalCampaignCode) {
    const { data, error } = await params.supabase
      .from('whatsapp_leads')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('campaign_code', finalCampaignCode)
      .maybeSingle();
    if (error) throw new Error(error.message);
    existing = data;
  }

  if (!existing) {
    const { data, error } = await params.supabase
      .from('whatsapp_leads')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    existing = data;
  }

  const row = {
    phone_number: phoneNumber,
    wa_id: params.waId ?? phoneNumber,
    profile_name: params.profileName ?? null,
    campaign_id: campaign?.id ?? existing?.campaign_id ?? null,
    campaign_code: finalCampaignCode ?? existing?.campaign_code ?? null,
    ad_id: referral.ad_id,
    meta_ad_id: referral.ad_id,
    source: referral.ad_id ? 'click_to_whatsapp_ad' : 'whatsapp',
    first_message_text: existing?.first_message_text || messageText || null,
    first_message_at: existing?.first_message_at || now,
    last_message_at: now,
    lead_status: existing?.lead_status || 'new',
    referral_json: referral,
  };

  const result = existing
    ? await params.supabase.from('whatsapp_leads').update(row).eq('id', existing.id).select('*').single()
    : await params.supabase.from('whatsapp_leads').insert(row).select('*').single();
  if (result.error) throw new Error(result.error.message);
  const lead = result.data;

  await params.supabase.from('whatsapp_messages').upsert({
    lead_id: lead.id,
    customer_id: lead.customer_id ?? null,
    phone_number: phoneNumber,
    direction: 'inbound',
    whatsapp_message_id: params.message.id ?? null,
    message_type: params.message.type ?? 'text',
    message_text: messageText || null,
    status: 'received',
    raw_payload_json: params.message,
    created_at: now,
  }, { onConflict: 'whatsapp_message_id', ignoreDuplicates: true });

  await params.supabase.from('campaign_events').insert({
    campaign_id: lead.campaign_id ?? null,
    lead_id: lead.id,
    customer_id: lead.customer_id ?? null,
    event_type: 'whatsapp_inbound_message',
    event_source: referral.ad_id ? 'meta_click_to_whatsapp' : 'whatsapp_webhook',
    event_data_json: {
      campaign_code: finalCampaignCode,
      whatsapp_message_id: params.message.id ?? null,
      message_type: params.message.type ?? null,
      referral,
    },
    occurred_at: now,
  });

  return lead;
}

export async function updateTrackedWhatsAppMessageStatus(params: {
  supabase: SupabaseLike;
  whatsappMessageId?: string | null;
  status?: string | null;
  timestamp?: string | number | null;
  failureReason?: string | null;
  rawStatus?: unknown;
}) {
  if (!params.whatsappMessageId) return null;
  const status = clean(params.status).toLowerCase() || 'unknown';
  const eventAt = eventTime(params.timestamp);
  const update: Record<string, unknown> = { status, raw_payload_json: params.rawStatus ?? {} };
  if (status === 'sent') update.sent_at = eventAt;
  if (status === 'delivered') update.delivered_at = eventAt;
  if (status === 'read') update.read_at = eventAt;
  if (status === 'failed') {
    update.failed_at = eventAt;
    update.failure_reason = params.failureReason ?? null;
  }

  const { data, error } = await params.supabase
    .from('whatsapp_messages')
    .update(update)
    .eq('whatsapp_message_id', params.whatsappMessageId)
    .select('id,lead_id,customer_id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
