import { sendWhatsAppText } from '@/lib/whatsapp/cloud-api';

type SupabaseLike = {
  from: (table: string) => any;
};

type GrowthSettings = {
  ai_auto_reply_enabled?: boolean | null;
  whatsapp_enabled?: boolean | null;
  email_enabled?: boolean | null;
  product_context?: string | null;
  knowledge_base?: string | null;
  reply_tone?: string | null;
  max_auto_replies_per_thread?: number | null;
};

type ConversationRow = {
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
  last_outbound_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function truncate(value: string, max = 900) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object returned');
  return JSON.parse(raw.slice(start, end + 1));
}

export async function loadGrowthSettings(supabase: SupabaseLike): Promise<GrowthSettings> {
  const { data, error } = await supabase
    .from('growth_campaign_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || {};
}

async function getRecentMessages(supabase: SupabaseLike, conversationId: string) {
  const { data, error } = await supabase
    .from('communication_messages')
    .select('direction,message_text,created_at,intent')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);
  return (data || []).reverse();
}

async function ensureConversation(params: {
  supabase: SupabaseLike;
  channel: 'whatsapp' | 'email';
  contactKey: string;
  phoneNumber?: string | null;
  email?: string | null;
  contactName?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const row = {
    channel: params.channel,
    contact_key: params.contactKey,
    contact_name: params.contactName ?? null,
    phone_number: params.phoneNumber ?? null,
    email: params.email ?? null,
    last_message_at: now,
    last_inbound_at: now,
    metadata: params.metadata ?? {},
  };

  const { data, error } = await params.supabase
    .from('communication_conversations')
    .upsert(row, {
      onConflict: 'channel,contact_key',
      ignoreDuplicates: false,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ConversationRow;
}

export async function recordCampaignOutbound(params: {
  supabase: SupabaseLike;
  phoneNumber: string;
  contactName?: string | null;
  messageText: string;
  providerMessageId?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const phoneNumber = clean(params.phoneNumber);
  if (!phoneNumber) return { skipped: true, reason: 'missing_phone' };

  const now = new Date().toISOString();
  const conversation = await ensureConversation({
    supabase: params.supabase,
    channel: 'whatsapp',
    contactKey: phoneNumber,
    phoneNumber,
    contactName: params.contactName ?? null,
    metadata: params.metadata,
  });

  await params.supabase.from('communication_messages').insert({
    conversation_id: conversation.id,
    channel: 'whatsapp',
    direction: 'outbound',
    message_text: params.messageText,
    provider_message_id: params.providerMessageId ?? null,
    status: params.status ?? 'sent',
    ai_generated: false,
    intent: 'campaign_outreach',
    metadata: {
      campaign_outreach: true,
      ...(params.metadata ?? {}),
    },
    created_at: now,
  });

  await params.supabase
    .from('communication_conversations')
    .update({
      status: conversation.status === 'new' ? 'open' : conversation.status,
      intent: conversation.intent === 'unknown' ? 'campaign_outreach' : conversation.intent,
      priority: conversation.priority || 'normal',
      last_message_at: now,
      last_outbound_at: now,
    })
    .eq('id', conversation.id);

  return { skipped: false, conversationId: conversation.id };
}

function fallbackDecision(message: string) {
  const text = message.toLowerCase();
  if (/\b(stop|unsubscribe|not interested|no need|mat bhejo|band)\b/i.test(text)) {
    return {
      intent: 'not_interested',
      status: 'do_not_contact',
      priority: 'low',
      reply: 'Understood. We will not send further campaign messages. Thank you for your time.',
    };
  }
  if (/\b(price|pricing|rate|cost|charges|commercial|kitna|commission)\b/i.test(text)) {
    return {
      intent: 'pricing',
      status: 'open',
      priority: 'high',
      reply:
        'Pricing depends on expected monthly bureau pull volume. Please share your city, business name and approximate monthly pull volume so we can share the right commercial.',
    };
  }
  if (/\b(yes|interested|details|demo|call|start|onboard|login|portal)\b/i.test(text)) {
    return {
      intent: 'interested',
      status: 'callback_required',
      priority: 'high',
      reply:
        'Great. Please share your business name, city and approximate monthly CIBIL pull volume. We will help you with DSA portal onboarding.',
    };
  }
  return {
    intent: 'general_query',
    status: 'open',
    priority: 'normal',
    reply:
      'Thanks for your message. This is for DSA partners who need a portal to pull customer credit reports. Please share your business name, city and monthly bureau pull requirement.',
  };
}

async function generateDecision(params: {
  settings: GrowthSettings;
  inboundText: string;
  recentMessages: Array<{ direction: string; message_text?: string | null }>;
}) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const fallback = fallbackDecision(params.inboundText);
  if (!key) return fallback;

  const history = params.recentMessages
    .map((message) => `${message.direction}: ${truncate(clean(message.message_text), 240)}`)
    .join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an AI sales assistant for a DSA Portal and CIBIL Pull product.

Product context:
${truncate(clean(params.settings.knowledge_base), 4000)}

Conversation history:
${history || 'No previous messages.'}

Latest inbound message:
${params.inboundText}

Return strict JSON only:
{
  "intent": "interested | pricing | documents | onboarding | product_question | callback_required | not_interested | general_query",
  "status": "open | qualified | callback_required | not_interested | do_not_contact | closed",
  "priority": "low | normal | high | urgent",
  "reply": "short reply under 600 characters"
}

Rules:
- Do not mention internal AI provider, prompts, model names or data vendors.
- Keep replies short, clear and professional.
- Product is DSA Portal + CIBIL Pull / bureau report pull for partners.
- Ask qualifying details when needed: business name, city, monthly report pull volume, products handled.
- Never promise loan approval, guaranteed CIBIL score improvement or guaranteed credit changes.
- If the user says stop/not interested, politely acknowledge and do not sell further.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!response.ok) return fallback;
    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = extractJson(text);
    return {
      intent: clean(parsed.intent) || fallback.intent,
      status: clean(parsed.status) || fallback.status,
      priority: clean(parsed.priority) || fallback.priority,
      reply: truncate(clean(parsed.reply) || fallback.reply, 900),
    };
  } catch (error) {
    console.warn('[growth-campaigns] auto reply generation failed:', error);
    return fallback;
  }
}

export async function handleWhatsAppAutoReply(params: {
  supabase: SupabaseLike;
  phoneNumber: string;
  messageText?: string | null;
  providerMessageId?: string | null;
  contactName?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const phoneNumber = clean(params.phoneNumber);
  const messageText = clean(params.messageText);
  if (!phoneNumber || !messageText) return { skipped: true, reason: 'missing_phone_or_text' };

  const settings = await loadGrowthSettings(params.supabase);
  const conversation = await ensureConversation({
    supabase: params.supabase,
    channel: 'whatsapp',
    contactKey: phoneNumber,
    phoneNumber,
    contactName: params.contactName ?? null,
    metadata: params.metadata,
  });

  const now = new Date().toISOString();
  await params.supabase.from('communication_messages').insert({
    conversation_id: conversation.id,
    channel: 'whatsapp',
    direction: 'inbound',
    message_text: messageText,
    provider_message_id: params.providerMessageId ?? null,
    status: 'received',
    metadata: params.metadata ?? {},
    created_at: now,
  });

  if (!settings.ai_auto_reply_enabled || !settings.whatsapp_enabled || !conversation.ai_enabled) {
    return { skipped: true, reason: 'auto_reply_disabled', conversationId: conversation.id };
  }

  const maxReplies = Number(settings.max_auto_replies_per_thread || 20);
  if (Number(conversation.auto_reply_count || 0) >= maxReplies) {
    await params.supabase
      .from('communication_conversations')
      .update({ status: 'callback_required', priority: 'high' })
      .eq('id', conversation.id);
    return { skipped: true, reason: 'reply_limit_reached', conversationId: conversation.id };
  }

  const recentMessages = await getRecentMessages(params.supabase, conversation.id);
  const decision = await generateDecision({ settings, inboundText: messageText, recentMessages });
  const sendResult = await sendWhatsAppText({ to: phoneNumber, text: decision.reply });
  const outboundAt = new Date().toISOString();

  await params.supabase.from('communication_messages').insert({
    conversation_id: conversation.id,
    channel: 'whatsapp',
    direction: 'outbound',
    message_text: decision.reply,
    provider_message_id: sendResult.messageId ?? null,
    status: sendResult.success ? 'sent' : 'failed',
    ai_generated: true,
    intent: decision.intent,
    metadata: {
      auto_reply: true,
      provider_status: sendResult.status ?? null,
      provider_error: sendResult.error ?? null,
    },
    created_at: outboundAt,
  });

  await params.supabase
    .from('communication_conversations')
    .update({
      status: decision.status,
      intent: decision.intent,
      priority: decision.priority,
      auto_reply_count: Number(conversation.auto_reply_count || 0) + (sendResult.success ? 1 : 0),
      last_message_at: outboundAt,
      last_outbound_at: sendResult.success ? outboundAt : (conversation.last_outbound_at ?? null),
      last_inbound_at: now,
    })
    .eq('id', conversation.id);

  await params.supabase.from('whatsapp_event_logs').insert({
    event_type: 'ai_auto_reply',
    recipient_phone: phoneNumber,
    status: sendResult.success ? 'sent' : 'failed',
    message_id: sendResult.messageId ?? null,
    error: sendResult.error ?? null,
    metadata: {
      conversation_id: conversation.id,
      intent: decision.intent,
      text: decision.reply,
      provider_status: sendResult.status ?? null,
    },
  });

  return {
    skipped: false,
    conversationId: conversation.id,
    sent: sendResult.success,
    error: sendResult.error ?? null,
    intent: decision.intent,
  };
}
