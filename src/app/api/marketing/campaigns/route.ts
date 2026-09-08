import { NextRequest, NextResponse } from 'next/server';
import {
  campaignPrefilledMessage,
  generateAdCode,
  generateCampaignCode,
  generateTrackingToken,
} from '@/lib/marketing/codes';
import { clean, jsonError, numberValue, requireMarketingAdmin } from '@/lib/marketing/api';
import { ensureMetaAdAccountRecord, missingMetaConfig, validateMetaPermissions } from '@/lib/marketing/meta-auth';

function parseJsonObject(value: unknown, fallback: Record<string, unknown> | unknown[] = {}) {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function summarize(campaigns: any[], insights: any[], leads: any[], tracking: any[]) {
  const spend = insights.reduce((sum, item) => sum + numberValue(item.spend), 0);
  const reach = insights.reduce((sum, item) => sum + numberValue(item.reach), 0);
  const impressions = insights.reduce((sum, item) => sum + numberValue(item.impressions), 0);
  const clicks = insights.reduce((sum, item) => sum + numberValue(item.clicks), 0);
  const reportsOpened = tracking.reduce((sum, item) => sum + numberValue(item.open_count), 0);
  const costPerLead = leads.length ? spend / leads.length : 0;

  return {
    campaigns: campaigns.length,
    total_spend: spend,
    reach,
    impressions,
    clicks,
    whatsapp_leads: leads.length,
    reports_opened: reportsOpened,
    cost_per_whatsapp_lead: Math.round(costPerLead * 100) / 100,
  };
}

export async function GET(request: NextRequest) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const [campaignsResult, insightsResult, leadsResult, trackingResult, adAccountResult, permissionsResult] = await Promise.all([
      auth.supabase
        .from('marketing_campaigns')
        .select('*, meta_campaigns(*), meta_page_posts(*), marketing_assets(*)')
        .order('created_at', { ascending: false })
        .limit(500),
      auth.supabase.from('meta_insights_snapshots').select('*').order('created_at', { ascending: false }).limit(5000),
      auth.supabase.from('whatsapp_leads').select('*').order('created_at', { ascending: false }).limit(1000),
      auth.supabase.from('report_tracking_links').select('*').order('created_at', { ascending: false }).limit(1000),
      ensureMetaAdAccountRecord(auth.supabase).catch((error) => ({ error: error instanceof Error ? error.message : 'Meta account not configured' })),
      validateMetaPermissions().catch((error) => ({ ok: false, error: error instanceof Error ? error.message : 'Meta permissions unavailable' })),
    ]);

    const firstError = [campaignsResult.error, insightsResult.error, leadsResult.error, trackingResult.error].find(Boolean);
    if (firstError) throw new Error(firstError.message);

    const campaigns = campaignsResult.data || [];
    const insights = insightsResult.data || [];
    const leads = leadsResult.data || [];
    const tracking = trackingResult.data || [];

    return NextResponse.json({
      success: true,
      schemaReady: true,
      summary: summarize(campaigns, insights, leads, tracking),
      campaigns,
      leads: leads.slice(0, 100),
      trackingLinks: tracking.slice(0, 100),
      meta: {
        missingConfig: missingMetaConfig(['accessToken', 'pageId', 'adAccountId']),
        adAccount: adAccountResult && 'error' in adAccountResult ? null : adAccountResult,
        permissions: permissionsResult,
      },
    });
  } catch (error: any) {
    const missingTable = error?.message?.includes('does not exist') || error?.code === '42P01';
    if (missingTable) {
      return NextResponse.json({
        success: true,
        schemaReady: false,
        warning: 'Meta marketing tables are not available yet. Run the latest Supabase migration.',
        summary: null,
        campaigns: [],
        leads: [],
        trackingLinks: [],
      });
    }
    console.error('[marketing/campaigns] load error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load marketing campaigns', 500);
  }
}

export async function POST(request: NextRequest) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const body = await request.json();
    const name = clean(body.name);
    if (!name) return jsonError('Campaign name is required.');

    const campaignCode = generateCampaignCode(name);
    const adCode = generateAdCode(campaignCode);
    const prefilledMessage = clean(body.prefilled_message) || campaignPrefilledMessage(campaignCode);
    const trackingToken = generateTrackingToken('mkt');

    const row = {
      campaign_code: campaignCode,
      ad_code: adCode,
      name,
      objective: clean(body.objective) || 'credit_report_lead',
      status: 'draft',
      platform: clean(body.platform) || 'whatsapp_ads',
      source: 'meta',
      content_text: clean(body.content_text) || null,
      cta_type: clean(body.cta_type) || 'WHATSAPP_MESSAGE',
      whatsapp_number: clean(body.whatsapp_number) || '8109276589',
      prefilled_message: prefilledMessage,
      tracking_token: trackingToken,
      start_at: clean(body.start_at) || null,
      end_at: clean(body.end_at) || null,
      budget_type: clean(body.budget_type) || 'daily',
      daily_budget: body.budget_type === 'lifetime' ? null : numberValue(body.daily_budget),
      lifetime_budget: body.budget_type === 'lifetime' ? numberValue(body.lifetime_budget || body.daily_budget) : null,
      audience_json: parseJsonObject(body.audience_json, {}),
      automation_rules_json: parseJsonObject(body.automation_rules_json, []),
      created_by: auth.user.id,
    };

    const { data, error } = await auth.supabase
      .from('marketing_campaigns')
      .insert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);

    if (clean(body.media_url)) {
      await auth.supabase.from('marketing_assets').insert({
        campaign_id: data.id,
        asset_type: clean(body.asset_type) || 'image',
        file_url: clean(body.media_url),
        caption: clean(body.content_text) || null,
      });
    }

    await auth.supabase.from('campaign_events').insert({
      campaign_id: data.id,
      event_type: 'campaign_created',
      event_source: 'admin',
      event_data_json: {
        campaign_code: campaignCode,
        ad_code: adCode,
        platform: row.platform,
      },
    });

    return NextResponse.json({ success: true, campaign: data });
  } catch (error) {
    console.error('[marketing/campaigns] create error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to create campaign', 500);
  }
}
