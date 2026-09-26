type SendEmailInput = {
  to: string;
  subject: string;
  html?: string | null;
  text?: string | null;
  replyTo?: string | null;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  attachments?: EmailAttachment[];
};

export type ResendSendResult = {
  success: boolean;
  emailId?: string;
  messageId?: string | null;
  error?: string;
  response?: unknown;
};

export type EmailAttachment = {
  filename: string;
  content: string;
  content_type?: string;
};

export const MARKETING_FROM_EMAIL =
  process.env.RESEND_MARKETING_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  'Credit Trust <support@credittrust.in>';

export const MARKETING_REPLY_TO =
  process.env.RESEND_MARKETING_REPLY_TO ||
  process.env.RESEND_INBOUND_EMAIL ||
  process.env.SUPPORT_EMAIL ||
  'support@credittrust.in';

function apiHeaders() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function textToHtml(value: string) {
  return escapeHtml(value)
    .split(/\r?\n/)
    .map((line) => line || '&nbsp;')
    .join('<br />');
}

export async function sendMarketingEmail(input: SendEmailInput): Promise<ResendSendResult> {
  const headers = apiHeaders();
  if (!headers) return { success: false, error: 'RESEND_API_KEY is missing' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: MARKETING_FROM_EMAIL,
      to: [input.to],
      subject: input.subject,
      html: input.html || textToHtml(input.text || ''),
      text: input.text || undefined,
      reply_to: input.replyTo || MARKETING_REPLY_TO,
      headers: input.headers && Object.keys(input.headers).length ? input.headers : undefined,
      tags: input.tags,
      attachments: input.attachments?.length ? input.attachments : undefined,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return { success: false, error: data?.message || data?.error || 'Resend send failed', response: data };
  }

  const emailId = data?.id as string | undefined;
  const messageId = await fetchResendMessageId(emailId);
  return { success: true, emailId, messageId, response: data };
}

export async function fetchResendMessageId(emailId?: string) {
  const headers = apiHeaders();
  if (!headers || !emailId) return null;

  const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(emailId)}`, {
    headers,
  });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  return typeof data?.message_id === 'string' ? data.message_id : null;
}

export function replaceTokens(template: string, contact: Record<string, unknown>) {
  return template
    .replace(/\{name\}/gi, String(contact.full_name || contact.name || '').trim() || 'there')
    .replace(/\{email\}/gi, String(contact.email || '').trim())
    .replace(/\{mobile\}/gi, String(contact.mobile || '').trim())
    .replace(/\{company\}/gi, String(contact.company_name || contact.company || '').trim())
    .replace(/\{city\}/gi, String(contact.city || '').trim());
}
