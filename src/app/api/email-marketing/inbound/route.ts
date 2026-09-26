import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function extractEmail(value: unknown) {
  const raw = clean(value).toLowerCase();
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] || raw).trim();
}

function headerValue(headers: unknown, name: string) {
  if (!headers || typeof headers !== 'object') return '';
  const record = headers as Record<string, unknown>;
  const direct = record[name] || record[name.toLowerCase()] || record[name.toUpperCase()];
  return clean(direct);
}

function referenceTokens(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.startsWith('<') && token.endsWith('>'));
}

function svixSecretBytes(secret: string) {
  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  return Buffer.from(raw, 'base64');
}

function verifyResendSignature(rawBody: string, request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return { ok: true, configured: false };

  const id = request.headers.get('svix-id') || request.headers.get('x-resend-id');
  const timestamp = request.headers.get('svix-timestamp') || request.headers.get('x-resend-timestamp');
  const signatureHeader = request.headers.get('svix-signature') || request.headers.get('x-resend-signature');
  if (!id || !timestamp || !signatureHeader) return { ok: false, configured: true };

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', svixSecretBytes(secret))
    .update(signedContent)
    .digest();

  const signatures = signatureHeader
    .split(' ')
    .flatMap((part) => part.split(','))
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.startsWith('v1,') ? part.slice(3) : part.startsWith('v1=') ? part.slice(3) : part);

  return {
    ok: signatures.some((signature) => {
      try {
        const actual = Buffer.from(signature, 'base64');
        return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
      } catch {
        return false;
      }
    }),
    configured: true,
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = verifyResendSignature(rawBody, request);
  if (!signature.ok) {
    return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (event?.type !== 'email.received') {
    return NextResponse.json({ success: true, ignored: true });
  }

  const data = event.data || {};
  const inboundEmailId = clean(data.email_id || data.id);
  if (!inboundEmailId) {
    return NextResponse.json({ success: false, error: 'email_id is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const fromEmail = extractEmail(data.from);
  const toEmail = Array.isArray(data.to) ? extractEmail(data.to[0]) : extractEmail(data.to);
  const subject = clean(data.subject) || '(No subject)';
  const headers = data.headers || {};
  const inReplyTo = clean(data.in_reply_to) || headerValue(headers, 'in-reply-to');
  const referencesHeader = clean(data.references) || headerValue(headers, 'references');
  const messageId = clean(data.message_id);
  const textBody = clean(data.text || data.text_body || data.plain);
  const htmlBody = clean(data.html || data.html_body);
  const candidates = [
    inReplyTo,
    ...referenceTokens(referencesHeader),
  ].filter(Boolean);

  const existing = await supabase
    .from('email_marketing_messages')
    .select('id')
    .eq('inbound_email_id', inboundEmailId)
    .maybeSingle();
  if (existing.data) return NextResponse.json({ success: true, deduped: true });

  let parent: any = null;
  if (candidates.length) {
    const parentResult = await supabase
      .from('email_marketing_messages')
      .select('*')
      .in('resend_message_id', candidates)
      .order('created_at', { ascending: false })
      .limit(1);
    parent = parentResult.data?.[0] || null;
  }

  const { data: contact } = await supabase
    .from('email_marketing_contacts')
    .upsert({
      email: fromEmail,
      full_name: clean(data.from_name) || null,
      status: 'active',
      opt_in: true,
      source: 'email_reply',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email', ignoreDuplicates: false })
    .select('*')
    .single();

  const campaignId = parent?.campaign_id || null;
  const contactId = parent?.contact_id || contact?.id || null;
  const { data: inserted, error } = await supabase
    .from('email_marketing_messages')
    .insert({
      campaign_id: campaignId,
      contact_id: contactId,
      parent_message_id: parent?.id || null,
      direction: 'inbound',
      sender_email: fromEmail,
      recipient_email: toEmail || 'unknown',
      subject,
      html_body: htmlBody || null,
      text_body: textBody || null,
      resend_message_id: messageId || null,
      inbound_email_id: inboundEmailId,
      in_reply_to: inReplyTo || null,
      references_header: referencesHeader || null,
      status: 'received',
      received_at: clean(data.created_at) || new Date().toISOString(),
      metadata: {
        source: 'resend_inbound',
        signature_configured: signature.configured,
        attachments: data.attachments || [],
        raw_event_type: event.type,
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('[email-marketing/inbound] insert error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (campaignId) {
    const { data: campaign } = await supabase
      .from('email_marketing_campaigns')
      .select('reply_count')
      .eq('id', campaignId)
      .single();
    await supabase
      .from('email_marketing_campaigns')
      .update({
        reply_count: Number(campaign?.reply_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);
  }

  return NextResponse.json({ success: true, messageId: inserted?.id, matched: Boolean(parent) });
}
