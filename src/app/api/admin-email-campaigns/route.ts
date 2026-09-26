import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import {
  type EmailAttachment,
  MARKETING_FROM_EMAIL,
  MARKETING_REPLY_TO,
  replaceTokens,
  sendMarketingEmail,
  textToHtml,
} from '@/lib/email-marketing/resend';

const SEND_LIMIT = Number(process.env.EMAIL_MARKETING_SEND_LIMIT ?? 100);
const MAX_ATTACHMENT_BYTES = Number(process.env.EMAIL_MARKETING_MAX_ATTACHMENT_BYTES ?? 8 * 1024 * 1024);

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function isAuthError(auth: unknown): auth is { error: string; status: number } {
  return Boolean(auth && typeof auth === 'object' && 'error' in auth);
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function emailValue(value: unknown) {
  return clean(value).toLowerCase();
}

function arrayValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  return clean(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAttachment(value: unknown): EmailAttachment | null {
  if (!value || typeof value !== 'object') return null;
  const attachment = value as Record<string, unknown>;
  const filename = clean(attachment.filename);
  const content = clean(attachment.content);
  const contentType = clean(attachment.content_type || attachment.contentType);
  const size = Number(attachment.size || 0);

  if (!filename || !content) return null;
  if (size && size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`${filename} is too large. Max allowed size is ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB.`);
  }

  return {
    filename,
    content,
    content_type: contentType || undefined,
  };
}

function normalizeAttachments(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  return values.map(normalizeAttachment).filter(Boolean) as EmailAttachment[];
}

function inlineImageHtml(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const image = value as Record<string, unknown>;
  const url = clean(image.url || image.file_url);
  const filename = clean(image.filename) || 'Promotional image';
  const contentType = clean(image.content_type || image.contentType);

  if (!url) return '';
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error('Promotional image must be PNG, JPG, or WEBP.');
  }

  return [
    '<div style="margin:0 0 20px 0;text-align:center">',
    `<img src="${url}" alt="${filename}" style="display:block;width:100%;max-width:680px;height:auto;margin:0 auto;border:0;border-radius:10px" />`,
    '</div>',
  ].join('');
}

function contactFromRow(row: Record<string, unknown>, source: string) {
  const email = emailValue(row.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return {
    email,
    full_name: clean(row.full_name || row.name || row.customer_name) || null,
    mobile: clean(row.mobile || row.phone) || null,
    company_name: clean(row.company_name || row.company || row.business_name || row.partner_name) || null,
    city: clean(row.city) || null,
    source,
    status: clean(row.status) || 'active',
    opt_in: row.opt_in !== false && clean(row.opt_in).toLowerCase() !== 'false',
    tags: arrayValue(row.tags),
    metadata: { imported_from: source },
    updated_at: new Date().toISOString(),
  };
}

async function upsertContacts(supabase: any, rows: Array<Record<string, unknown>>, source: string) {
  const contacts = rows
    .map((row) => contactFromRow(row, source))
    .filter(Boolean);

  const unique = [...new Map(contacts.map((contact: any) => [contact.email, contact])).values()];
  if (!unique.length) return { imported: 0 };

  const { error } = await supabase
    .from('email_marketing_contacts')
    .upsert(unique, { onConflict: 'email', ignoreDuplicates: false });
  if (error) throw new Error(error.message);

  return { imported: unique.length };
}

async function loadLeadFunnelRows(supabase: any) {
  const [crmResult, b2cResult, promotionResult] = await Promise.all([
    supabase
      .from('crm_leads')
      .select('name,email,mobile,city,source,status,created_at')
      .not('email', 'is', null)
      .limit(1000),
    supabase
      .from('b2c_report_requests')
      .select('full_name,email,mobile,state,status,created_at')
      .not('email', 'is', null)
      .limit(1000),
    supabase
      .from('promotion_leads')
      .select('name,email,mobile,city,business_name,source,status,opt_in,created_at')
      .not('email', 'is', null)
      .limit(1000),
  ]);

  if (crmResult.error) throw new Error(crmResult.error.message);
  if (b2cResult.error) throw new Error(b2cResult.error.message);
  if (promotionResult.error) throw new Error(promotionResult.error.message);

  return [
    ...(crmResult.data || []).map((row: any) => ({ ...row, source: `crm_${row.source || 'lead_funnel'}` })),
    ...(b2cResult.data || []).map((row: any) => ({
      ...row,
      city: row.state,
      source: 'b2c_report_funnel',
      opt_in: true,
    })),
    ...(promotionResult.data || []).map((row: any) => ({ ...row, source: `promotion_${row.source || 'lead_funnel'}` })),
  ];
}

async function loadData(supabase: any) {
  const [contactsResult, campaignsResult, messagesResult] = await Promise.all([
    supabase
      .from('email_marketing_contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('email_marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('email_marketing_messages')
      .select('*, email_marketing_contacts(full_name,email,company_name,city)')
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  if (contactsResult.error) throw new Error(contactsResult.error.message);
  if (campaignsResult.error) throw new Error(campaignsResult.error.message);
  if (messagesResult.error) throw new Error(messagesResult.error.message);

  return {
    contacts: contactsResult.data ?? [],
    campaigns: campaignsResult.data ?? [],
    messages: messagesResult.data ?? [],
    config: {
      fromEmail: MARKETING_FROM_EMAIL,
      replyTo: MARKETING_REPLY_TO,
      sendLimit: SEND_LIMIT,
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  try {
    return NextResponse.json({ success: true, ...(await loadData(auth.supabase)) });
  } catch (error: any) {
    const missingTable = error?.message?.includes('does not exist') || error?.code === '42P01';
    if (missingTable) {
      return NextResponse.json({
        success: true,
        schemaReady: false,
        warning: 'Email marketing tables are not available yet. Run the latest Supabase migration.',
        contacts: [],
        campaigns: [],
        messages: [],
        config: {
          fromEmail: MARKETING_FROM_EMAIL,
          replyTo: MARKETING_REPLY_TO,
          sendLimit: SEND_LIMIT,
          resendConfigured: Boolean(process.env.RESEND_API_KEY),
        },
      });
    }

    console.error('[admin-email-campaigns] load error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load email marketing data', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  try {
    const body = await request.json();
    const action = clean(body.action);

    if (action === 'import_contacts') {
      const rows = Array.isArray(body.contacts) ? body.contacts : [];
      const result = await upsertContacts(auth.supabase, rows, clean(body.source) || 'admin_file_import');
      if (!result.imported) return jsonError('No valid email contacts found.');

      return NextResponse.json({ success: true, imported: result.imported, ...(await loadData(auth.supabase)) });
    }

    if (action === 'import_lead_funnel') {
      const rows = await loadLeadFunnelRows(auth.supabase);
      const result = await upsertContacts(auth.supabase, rows, 'lead_funnel');
      if (!result.imported) return jsonError('No email contacts found in lead funnel sources.');

      return NextResponse.json({ success: true, imported: result.imported, ...(await loadData(auth.supabase)) });
    }

    if (action === 'create_campaign') {
      const name = clean(body.name);
      const subject = clean(body.subject);
      const htmlBody = clean(body.html_body);
      const textBody = clean(body.text_body);
      const attachments = normalizeAttachments(body.attachments);
      const inlineImage = typeof body.inline_image === 'object' ? body.inline_image : null;
      const bodyHtml = htmlBody || textToHtml(textBody);
      const campaignHtml = `${inlineImageHtml(inlineImage)}${bodyHtml}`;
      if (!name || !subject) return jsonError('Campaign name and subject are required.');
      if (!htmlBody && !textBody) return jsonError('Email body is required.');

      const { data, error } = await auth.supabase
        .from('email_marketing_campaigns')
        .insert({
          name,
            subject,
            preview_text: clean(body.preview_text) || null,
          html_body: campaignHtml,
            text_body: textBody || null,
            audience_status: clean(body.audience_status) || 'active',
            status: 'draft',
            created_by: auth.user.id,
            metadata: {
              source: 'admin_email_campaigns',
              attachments,
              inline_image: inlineImage,
            },
          })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, campaign: data, ...(await loadData(auth.supabase)) });
    }

    if (action === 'send_campaign') {
      const campaignId = clean(body.campaign_id);
      if (!campaignId) return jsonError('campaign_id is required.');

      const { data: campaign, error: campaignError } = await auth.supabase
        .from('email_marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      if (campaignError || !campaign) return jsonError('Campaign not found.', 404);

      const { data: contacts, error: contactsError } = await auth.supabase
        .from('email_marketing_contacts')
        .select('*')
        .eq('status', campaign.audience_status || 'active')
        .eq('opt_in', true)
        .limit(SEND_LIMIT);
      if (contactsError) throw new Error(contactsError.message);
      if (!contacts?.length) return jsonError('No opted-in contacts found for this audience.');

      await auth.supabase.from('email_marketing_campaigns').update({ status: 'sending' }).eq('id', campaignId);

      let sent = 0;
      let failed = 0;

      for (const contact of contacts) {
        const subject = replaceTokens(campaign.subject, contact);
        const html = replaceTokens(campaign.html_body || '', contact);
        const text = campaign.text_body ? replaceTokens(campaign.text_body, contact) : null;
        const attachments = normalizeAttachments(campaign.metadata?.attachments);

        const { data: message, error: messageError } = await auth.supabase
          .from('email_marketing_messages')
          .insert({
            campaign_id: campaignId,
            contact_id: contact.id,
            direction: 'outbound',
            sender_email: MARKETING_FROM_EMAIL,
            recipient_email: contact.email,
            subject,
            html_body: html,
            text_body: text,
            status: 'pending',
            created_by: auth.user.id,
            metadata: { source: 'campaign_send' },
          })
          .select('*')
          .single();
        if (messageError) throw new Error(messageError.message);

        const result = await sendMarketingEmail({
          to: contact.email,
          subject,
          html,
          text,
          replyTo: MARKETING_REPLY_TO,
          attachments,
          tags: [
            { name: 'source', value: 'email_marketing' },
            { name: 'campaign_id', value: campaignId },
          ],
        });

        if (result.success) sent += 1;
        else failed += 1;

        await auth.supabase
          .from('email_marketing_messages')
          .update({
            status: result.success ? 'sent' : 'failed',
            resend_email_id: result.emailId ?? null,
            resend_message_id: result.messageId ?? null,
            error: result.error ?? null,
            sent_at: result.success ? new Date().toISOString() : null,
            metadata: { source: 'campaign_send', resend_response: result.response ?? null },
          })
          .eq('id', message.id);
      }

      await auth.supabase
        .from('email_marketing_campaigns')
        .update({
          status: failed ? 'completed_with_errors' : 'sent',
          sent_count: Number(campaign.sent_count || 0) + sent,
          failed_count: Number(campaign.failed_count || 0) + failed,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return NextResponse.json({ success: true, sent, failed, ...(await loadData(auth.supabase)) });
    }

    if (action === 'reply_message') {
      const parentId = clean(body.parent_message_id);
      const text = clean(body.text);
      if (!parentId) return jsonError('parent_message_id is required.');
      if (!text) return jsonError('Reply text is required.');

      const { data: parent, error: parentError } = await auth.supabase
        .from('email_marketing_messages')
        .select('*')
        .eq('id', parentId)
        .single();
      if (parentError || !parent) return jsonError('Thread message not found.', 404);

      const customerEmail = parent.direction === 'inbound' ? parent.sender_email : parent.recipient_email;
      const subject = parent.subject.toLowerCase().startsWith('re:') ? parent.subject : `Re: ${parent.subject}`;
      const references = [parent.references_header, parent.in_reply_to, parent.resend_message_id]
        .filter(Boolean)
        .join(' ');
      const result = await sendMarketingEmail({
        to: customerEmail,
        subject,
        text,
        html: textToHtml(text),
        replyTo: MARKETING_REPLY_TO,
        headers: {
          ...(parent.resend_message_id ? { 'In-Reply-To': parent.resend_message_id } : {}),
          ...(references ? { References: references } : {}),
        },
        tags: [{ name: 'source', value: 'email_marketing_reply' }],
      });

      const { error } = await auth.supabase.from('email_marketing_messages').insert({
        campaign_id: parent.campaign_id,
        contact_id: parent.contact_id,
        parent_message_id: parent.id,
        direction: 'admin_reply',
        sender_email: MARKETING_FROM_EMAIL,
        recipient_email: customerEmail,
        subject,
        html_body: textToHtml(text),
        text_body: text,
        resend_email_id: result.emailId ?? null,
        resend_message_id: result.messageId ?? null,
        in_reply_to: parent.resend_message_id ?? null,
        references_header: references || null,
        status: result.success ? 'sent' : 'failed',
        error: result.error ?? null,
        sent_at: result.success ? new Date().toISOString() : null,
        created_by: auth.user.id,
        metadata: { source: 'admin_reply', resend_response: result.response ?? null },
      });
      if (error) throw new Error(error.message);
      if (!result.success) return jsonError(result.error || 'Reply send failed', 502);

      return NextResponse.json({ success: true, ...(await loadData(auth.supabase)) });
    }

    if (action === 'mark_read') {
      const messageId = clean(body.message_id);
      if (!messageId) return jsonError('message_id is required.');
      const { error } = await auth.supabase
        .from('email_marketing_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('direction', 'inbound');
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, ...(await loadData(auth.supabase)) });
    }

    return jsonError('Invalid action.');
  } catch (error) {
    console.error('[admin-email-campaigns] action error:', error);
    return jsonError(error instanceof Error ? error.message : 'Email marketing action failed', 500);
  }
}
