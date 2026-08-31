type SupabaseLike = {
  from: (table: string) => any;
};

type WhatsAppSendResult = {
  success: boolean;
  messageId?: string;
  wamid?: string;
  error?: string;
  status?: number;
  response?: unknown;
};

type TemplateComponent =
  | {
      type: 'body';
      parameters: Array<{ type: 'text'; text: string }>;
    }
  | {
      type: 'button';
      sub_type: 'url' | 'copy_code';
      index: string;
      parameters: Array<{ type: 'text'; text: string } | { type: 'coupon_code'; coupon_code: string }>;
    };

const DEFAULT_API_VERSION = 'v23.0';
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_COUNTRY_CODE = '91';

function getWhatsAppConfig() {
  return {
    apiVersion: process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || DEFAULT_COUNTRY_CODE,
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_LANGUAGE,
  };
}

export function isWhatsAppConfigured() {
  const config = getWhatsAppConfig();
  return Boolean(config.accessToken && config.phoneNumberId);
}

export function normalizeWhatsAppPhone(input: unknown) {
  const config = getWhatsAppConfig();
  let digits = String(input ?? '').replace(/\D/g, '');

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `${config.defaultCountryCode}${digits}`;

  return digits;
}

function toTextParameter(value: unknown) {
  const text = String(value ?? '').trim();
  return { type: 'text' as const, text: text || '-' };
}

export async function sendWhatsAppTemplate(input: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyValues?: unknown[];
  urlButtonValues?: unknown[];
  copyCodeButtonValues?: unknown[];
}): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    return { success: false, error: 'WhatsApp Cloud API env is missing' };
  }

  const to = normalizeWhatsAppPhone(input.to);
  if (!to || to.length < 11) {
    return { success: false, error: 'Invalid WhatsApp recipient phone number' };
  }

  const components: TemplateComponent[] = [];
  if (input.bodyValues?.length) {
    components.push({
      type: 'body',
      parameters: input.bodyValues.map(toTextParameter),
    });
  }

  input.urlButtonValues?.forEach((value, index) => {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: String(index),
      parameters: [toTextParameter(value)],
    });
  });

  input.copyCodeButtonValues?.forEach((value, index) => {
    components.push({
      type: 'button',
      sub_type: 'copy_code',
      index: String(index),
      parameters: [{ type: 'coupon_code', coupon_code: String(value ?? '').trim() }],
    });
  });

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: input.templateName,
          language: {
            code: input.languageCode || config.templateLanguage,
          },
          ...(components.length ? { components } : {}),
        },
      }),
    }
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      error: data?.error?.message || 'WhatsApp template send failed',
      response: data,
    };
  }

  const messageId = data?.messages?.[0]?.id as string | undefined;
  return { success: true, messageId, wamid: messageId, status: response.status, response: data };
}

export async function sendWhatsAppText(input: {
  to: string;
  text: string;
}): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    return { success: false, error: 'WhatsApp Cloud API env is missing' };
  }

  const to = normalizeWhatsAppPhone(input.to);
  if (!to || to.length < 11) {
    return { success: false, error: 'Invalid WhatsApp recipient phone number' };
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: input.text,
        },
      }),
    }
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      error: data?.error?.message || 'WhatsApp text send failed',
      response: data,
    };
  }

  const messageId = data?.messages?.[0]?.id as string | undefined;
  return { success: true, messageId, wamid: messageId, status: response.status, response: data };
}

export async function logWhatsAppEvent(params: {
  supabase?: SupabaseLike | null;
  eventType: string;
  recipientPhone: string;
  templateName?: string | null;
  status: 'sent' | 'failed' | 'skipped';
  partnerId?: string | null;
  userId?: string | null;
  messageId?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (!params.supabase) return;

  try {
    await params.supabase.from('whatsapp_event_logs').insert({
      partner_id: params.partnerId ?? null,
      user_id: params.userId ?? null,
      event_type: params.eventType,
      recipient_phone: normalizeWhatsAppPhone(params.recipientPhone),
      template_name: params.templateName ?? null,
      status: params.status,
      message_id: params.messageId ?? null,
      error: params.error ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.warn(
      '[whatsapp] event log failed:',
      error instanceof Error ? error.message : error
    );
  }
}

export async function sendConfiguredTemplate(params: {
  supabase?: SupabaseLike | null;
  eventType: string;
  templateEnv: string;
  to: string;
  bodyValues?: unknown[];
  partnerId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const templateName = process.env[params.templateEnv];
  if (!templateName) {
    await logWhatsAppEvent({
      supabase: params.supabase,
      eventType: params.eventType,
      recipientPhone: params.to,
      templateName: null,
      status: 'skipped',
      metadata: {
        reason: 'template_env_missing',
        template_env: params.templateEnv,
        ...(params.metadata ?? {}),
      },
    });
    return { sent: false, reason: 'template_env_missing', error: undefined, messageId: undefined };
  }

  const result = await sendWhatsAppTemplate({
    to: params.to,
    templateName,
    bodyValues: params.bodyValues,
  });

  await logWhatsAppEvent({
    supabase: params.supabase,
    eventType: params.eventType,
    recipientPhone: params.to,
    templateName,
    status: result.success ? 'sent' : 'failed',
    partnerId: params.partnerId,
    userId: params.userId,
    messageId: result.messageId ?? null,
    error: result.error ?? null,
    metadata: {
      ...(params.metadata ?? {}),
      whatsapp_status: result.status ?? null,
      whatsapp_response: result.response ?? null,
    },
  });

  return { sent: result.success, reason: undefined, error: result.error, messageId: result.messageId };
}
