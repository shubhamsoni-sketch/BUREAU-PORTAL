import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { recordCampaignOutbound } from '@/lib/growth-campaigns/ai-agent';
import {
  normalizeWhatsAppPhone,
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from '@/lib/whatsapp/cloud-api';

const SEND_LIMIT = Number(process.env.WHATSAPP_PROMOTION_SEND_LIMIT ?? 50);

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function isAuthError(auth: unknown): auth is { error: string; status: number } {
  return Boolean(auth && typeof auth === 'object' && 'error' in auth);
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function replaceTokens(template: unknown, lead: Record<string, any>) {
  return clean(template)
    .replace(/\{name\}/gi, lead.name || '-')
    .replace(/\{business_name\}/gi, lead.business_name || '-')
    .replace(/\{city\}/gi, lead.city || '-')
    .replace(/\{mobile\}/gi, lead.mobile || '-');
}

function renderCampaignPreview(campaign: Record<string, any>, lead: Record<string, any>) {
  const bodyValues = Array.isArray(campaign.body_values)
    ? campaign.body_values.map((value: unknown) => replaceTokens(value, lead))
    : [];
  const values = bodyValues.length ? ` (${bodyValues.join(' · ')})` : '';
  return `Campaign sent: ${campaign.name || campaign.template_name}${values}`;
}

async function loadCampaignAudience(supabase: any, campaign: Record<string, any>) {
  const { data: promotionLeads, error: promotionError } = await supabase
    .from('promotion_leads')
    .select('*')
    .eq('status', campaign.audience_status || 'active')
    .eq('opt_in', true)
    .limit(SEND_LIMIT);

  if (promotionError) throw new Error(promotionError.message);
  const selectedPromotionLeads = promotionLeads || [];
  if (selectedPromotionLeads.length >= SEND_LIMIT) return selectedPromotionLeads;
  const existingMobiles = new Set(
    selectedPromotionLeads.map((lead: Record<string, unknown>) =>
      normalizeWhatsAppPhone(lead.mobile)
    )
  );

  const { data: masterLeads, error: masterError } = await supabase
    .from('lead_finder_master')
    .select('id,business_name,phone,email,city,lead_type,segment,search_intent,marketing_status')
    .eq('is_valid_mobile', true)
    .neq('marketing_status', 'do_not_contact')
    .in('status', ['ready', 'review'])
    .order('score', { ascending: false })
    .limit(SEND_LIMIT);

  if (masterError) throw new Error(masterError.message);
  if (!masterLeads?.length) return selectedPromotionLeads;

  const leadsToSync = masterLeads
    .map((lead: Record<string, unknown>) => ({
      name: clean(lead.business_name) || 'DSA Partner',
      mobile: normalizeWhatsAppPhone(lead.phone),
      email: clean(lead.email) || null,
      city: clean(lead.city) || null,
      business_name: clean(lead.business_name) || null,
      source: 'lead_finder_master',
      status: 'active',
      opt_in: true,
      metadata: {
        master_lead_id: lead.id,
        lead_type: lead.lead_type,
        segment: lead.segment,
        search_intent: lead.search_intent,
        synced_for_growth_campaigns: true,
      },
    }))
    .filter(
      (lead: { mobile: string }) => lead.mobile.length >= 11 && !existingMobiles.has(lead.mobile)
    )
    .slice(0, SEND_LIMIT - selectedPromotionLeads.length);

  if (!leadsToSync.length) return selectedPromotionLeads;

  const { error: upsertError } = await supabase
    .from('promotion_leads')
    .upsert(leadsToSync, { onConflict: 'mobile', ignoreDuplicates: false });
  if (upsertError) throw new Error(upsertError.message);

  const mobiles = leadsToSync.map((lead: { mobile: string }) => lead.mobile);
  const { data: syncedLeads, error: syncedError } = await supabase
    .from('promotion_leads')
    .select('*')
    .in('mobile', mobiles)
    .limit(SEND_LIMIT);
  if (syncedError) throw new Error(syncedError.message);
  return [...selectedPromotionLeads, ...(syncedLeads || [])].slice(0, SEND_LIMIT);
}

async function loadData(supabase: any) {
  const [leadsResult, campaignsResult, recipientsResult, inboundResult] = await Promise.all([
    supabase
      .from('promotion_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('promotion_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('promotion_campaign_recipients')
      .select('*, promotion_leads(name, mobile, business_name, city)')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('whatsapp_event_logs')
      .select('*')
      .in('event_type', ['whatsapp_inbound_message', 'whatsapp_admin_reply', 'promotion_campaign'])
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (leadsResult.error) throw new Error(leadsResult.error.message);
  if (campaignsResult.error) throw new Error(campaignsResult.error.message);
  if (recipientsResult.error) throw new Error(recipientsResult.error.message);
  if (inboundResult.error) throw new Error(inboundResult.error.message);

  return {
    leads: leadsResult.data ?? [],
    campaigns: campaignsResult.data ?? [],
    recipients: recipientsResult.data ?? [],
    inboundMessages: inboundResult.data ?? [],
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  try {
    const data = await loadData(auth.supabase);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('[admin-promotions] load error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load promotions', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  try {
    const body = await request.json();
    const action = clean(body.action);

    if (action === 'import_leads') {
      const rows = Array.isArray(body.leads) ? body.leads : [];
      const leads = rows
        .map((row: Record<string, unknown>) => ({
          name: clean(row.name),
          mobile: normalizeWhatsAppPhone(row.mobile),
          email: clean(row.email) || null,
          city: clean(row.city) || null,
          business_name: clean(row.business_name || row.businessName) || null,
          source: clean(row.source) || 'manual',
          status: clean(row.status) || 'active',
          opt_in: row.opt_in !== false && clean(row.opt_in).toLowerCase() !== 'false',
          metadata: { imported_from: 'admin_promotions' },
        }))
        .filter((lead: { name: string; mobile: string }) => lead.name && lead.mobile.length >= 11);

      if (!leads.length) return jsonError('No valid leads found. Name and mobile are required.');

      const { error } = await auth.supabase
        .from('promotion_leads')
        .upsert(leads, { onConflict: 'mobile', ignoreDuplicates: false });

      if (error) throw new Error(error.message);
      return NextResponse.json({
        success: true,
        imported: leads.length,
        ...(await loadData(auth.supabase)),
      });
    }

    if (action === 'create_campaign') {
      const name = clean(body.name);
      const templateName = clean(body.template_name);
      if (!name || !templateName) return jsonError('Campaign name and template name are required.');

      const { data, error } = await auth.supabase
        .from('promotion_campaigns')
        .insert({
          name,
          template_name: templateName,
          language_code: clean(body.language_code) || 'en',
          body_values: Array.isArray(body.body_values) ? body.body_values : [],
          audience_status: clean(body.audience_status) || 'active',
          status: 'draft',
          created_by: auth.user.id,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({
        success: true,
        campaign: data,
        ...(await loadData(auth.supabase)),
      });
    }

    if (action === 'send_campaign') {
      const campaignId = clean(body.campaign_id);
      if (!campaignId) return jsonError('campaign_id is required.');

      const { data: campaign, error: campaignError } = await auth.supabase
        .from('promotion_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) return jsonError('Campaign not found.', 404);

      const leads = await loadCampaignAudience(auth.supabase, campaign);
      if (!leads?.length) return jsonError('No opted-in leads found for this campaign.');

      await auth.supabase
        .from('promotion_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId);

      let sent = 0;
      let failed = 0;

      for (const lead of leads) {
        await auth.supabase.from('promotion_campaign_recipients').upsert(
          {
            campaign_id: campaignId,
            lead_id: lead.id,
            status: 'pending',
          },
          { onConflict: 'campaign_id,lead_id', ignoreDuplicates: true }
        );

        const bodyValues = Array.isArray(campaign.body_values)
          ? campaign.body_values.map((value: unknown) => replaceTokens(value, lead))
          : [];

        const result = await sendWhatsAppTemplate({
          to: lead.mobile,
          templateName: campaign.template_name,
          languageCode: campaign.language_code || 'en',
          bodyValues,
          analytics: {
            supabase: auth.supabase,
            customerId: lead.id,
            customerSource: 'promotion_leads',
            campaignName: campaign.name,
            campaignType: 'promotion',
            sourceCampaignId: campaignId,
            createdBy: auth.user.id,
            metadata: {
              source: 'admin_promotions',
              promotion_campaign_id: campaignId,
              lead_id: lead.id,
            },
          },
        });

        if (result.success) sent += 1;
        else failed += 1;

        await recordCampaignOutbound({
          supabase: auth.supabase,
          phoneNumber: lead.mobile,
          contactName: lead.name || lead.business_name || null,
          messageText: renderCampaignPreview(campaign, lead),
          providerMessageId: result.messageId ?? null,
          status: result.success ? 'sent' : 'failed',
          metadata: {
            source: 'campaign_send',
            campaign_id: campaignId,
            campaign_name: campaign.name,
            template_name: campaign.template_name,
            lead_id: lead.id,
            lead_source: lead.source ?? null,
            send_success: result.success,
            send_error: result.error ?? null,
          },
        }).catch((error) => {
          console.warn(
            '[admin-promotions] conversation campaign log failed:',
            error instanceof Error ? error.message : error
          );
        });

        await auth.supabase
          .from('promotion_campaign_recipients')
          .update({
            status: result.success ? 'sent' : 'failed',
            message_id: result.messageId ?? null,
            error: result.error ?? null,
            sent_at: result.success ? new Date().toISOString() : null,
          })
          .eq('campaign_id', campaignId)
          .eq('lead_id', lead.id);

        await auth.supabase.from('whatsapp_event_logs').insert({
          user_id: auth.user.id,
          event_type: 'promotion_campaign',
          recipient_phone: lead.mobile,
          template_name: campaign.template_name,
          status: result.success ? 'sent' : 'failed',
          message_id: result.messageId ?? null,
          error: result.error ?? null,
          metadata: {
            campaign_id: campaignId,
            lead_id: lead.id,
            whatsapp_status: result.status ?? null,
            whatsapp_response: result.response ?? null,
          },
        });
      }

      await auth.supabase
        .from('promotion_campaigns')
        .update({
          status: failed ? 'completed_with_errors' : 'completed',
          sent_count: Number(campaign.sent_count || 0) + sent,
          failed_count: Number(campaign.failed_count || 0) + failed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return NextResponse.json({ success: true, sent, failed, ...(await loadData(auth.supabase)) });
    }

    if (action === 'reply_inbox') {
      const to = normalizeWhatsAppPhone(body.to);
      const text = clean(body.text);
      if (!to || to.length < 11) return jsonError('A valid recipient phone number is required.');
      if (!text) return jsonError('Reply text is required.');
      if (text.length > 4096) return jsonError('Reply text must be 4096 characters or fewer.');

      const result = await sendWhatsAppText({ to, text });
      await auth.supabase.from('whatsapp_event_logs').insert({
        user_id: auth.user.id,
        event_type: 'whatsapp_admin_reply',
        recipient_phone: to,
        status: result.success ? 'sent' : 'failed',
        message_id: result.messageId ?? null,
        error: result.error ?? null,
        metadata: {
          whatsapp_status: result.status ?? null,
          whatsapp_response: result.response ?? null,
          text,
        },
      });

      if (!result.success) return jsonError(result.error || 'WhatsApp reply failed', 502);
      return NextResponse.json({ success: true, ...(await loadData(auth.supabase)) });
    }

    return jsonError('Invalid action.');
  } catch (error) {
    console.error('[admin-promotions] action error:', error);
    return jsonError(error instanceof Error ? error.message : 'Promotion action failed', 500);
  }
}
