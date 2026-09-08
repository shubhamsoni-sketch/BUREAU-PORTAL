import { campaignPrefilledMessage, whatsappDeepLink } from './codes';
import { assertMetaConfig, getMetaConfig, metaGraphFetch } from './meta-auth';

type SupabaseLike = {
  from: (table: string) => any;
};

type MarketingCampaign = {
  id: string;
  campaign_code: string;
  ad_code: string;
  name: string;
  objective: string;
  status: string;
  content_text?: string | null;
  cta_type?: string | null;
  whatsapp_number?: string | null;
  prefilled_message?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  budget_type?: string | null;
  daily_budget?: number | null;
  lifetime_budget?: number | null;
  audience_json?: Record<string, unknown> | null;
};

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function moneyToMinor(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : undefined;
}

function objective(value: string) {
  const normalized = clean(value).toUpperCase();
  if (normalized.startsWith('OUTCOME_')) return normalized;
  if (normalized.includes('LEAD')) return 'OUTCOME_LEADS';
  if (normalized.includes('MESSAGE') || normalized.includes('WHATSAPP')) return 'OUTCOME_ENGAGEMENT';
  return 'OUTCOME_TRAFFIC';
}

function defaultTargeting(audience?: Record<string, unknown> | null) {
  const geo = audience?.geo_locations || { countries: ['IN'] };
  const ageMin = Number(audience?.age_min || 21);
  const ageMax = Number(audience?.age_max || 65);
  return {
    geo_locations: geo,
    age_min: Math.max(18, ageMin),
    age_max: Math.min(65, ageMax),
    publisher_platforms: audience?.publisher_platforms || ['facebook', 'instagram'],
    facebook_positions: audience?.facebook_positions || ['feed', 'marketplace', 'video_feeds'],
    instagram_positions: audience?.instagram_positions || ['stream', 'story', 'reels'],
  };
}

async function loadCampaign(supabase: SupabaseLike, id: string) {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Marketing campaign not found');
  return data as MarketingCampaign;
}

export async function createClickToWhatsAppAd(params: {
  supabase: SupabaseLike;
  campaignId: string;
}) {
  const config = assertMetaConfig(['accessToken', 'adAccountId', 'pageId']);
  const campaign = await loadCampaign(params.supabase, params.campaignId);
  const adAccountPath = `act_${config.adAccountId}`;
  const now = new Date().toISOString();
  const prefilledMessage = campaign.prefilled_message || campaignPrefilledMessage(campaign.campaign_code);
  const waLink = whatsappDeepLink(campaign.whatsapp_number || config.whatsappDisplayNumber, prefilledMessage);
  const budget = campaign.budget_type === 'lifetime'
    ? moneyToMinor(campaign.lifetime_budget)
    : moneyToMinor(campaign.daily_budget);

  const metaCampaign = await metaGraphFetch<{ id?: string }>(`${adAccountPath}/campaigns`, {
    method: 'POST',
    token: config.accessToken,
    body: {
      name: `${campaign.name} (${campaign.campaign_code})`,
      objective: objective(campaign.objective),
      status: 'PAUSED',
      special_ad_categories: config.specialAdCategories,
    },
  });
  if (!metaCampaign.ok || !metaCampaign.data?.id) {
    await markAdFailure(params.supabase, campaign.id, metaCampaign.error || 'Meta campaign creation failed');
    return { ...metaCampaign, meta: null };
  }

  const adsetBody: Record<string, unknown> = {
    name: `${campaign.name} Ad Set`,
    campaign_id: metaCampaign.data.id,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'CONVERSATIONS',
    status: 'PAUSED',
    targeting: defaultTargeting(campaign.audience_json),
  };
  if (campaign.start_at) adsetBody.start_time = campaign.start_at;
  if (campaign.end_at) adsetBody.end_time = campaign.end_at;
  if (campaign.budget_type === 'lifetime' && budget) adsetBody.lifetime_budget = budget;
  if (campaign.budget_type !== 'lifetime' && budget) adsetBody.daily_budget = budget;

  const adset = await metaGraphFetch<{ id?: string }>(`${adAccountPath}/adsets`, {
    method: 'POST',
    token: config.accessToken,
    body: adsetBody,
  });
  if (!adset.ok || !adset.data?.id) {
    await markAdFailure(params.supabase, campaign.id, adset.error || 'Meta ad set creation failed', metaCampaign.data.id);
    return { ...adset, meta: null };
  }

  const creative = await metaGraphFetch<{ id?: string }>(`${adAccountPath}/adcreatives`, {
    method: 'POST',
    token: config.accessToken,
    body: {
      name: `${campaign.name} Creative`,
      object_story_spec: {
        page_id: config.pageId,
        link_data: {
          message: campaign.content_text || 'Check your Credit Trust financial health report.',
          link: waLink,
          name: campaign.name,
          call_to_action: {
            type: 'WHATSAPP_MESSAGE',
            value: {
              app_destination: 'WHATSAPP',
              link: waLink,
            },
          },
        },
      },
    },
  });
  if (!creative.ok || !creative.data?.id) {
    await markAdFailure(params.supabase, campaign.id, creative.error || 'Meta creative creation failed', metaCampaign.data.id, adset.data.id);
    return { ...creative, meta: null };
  }

  const ad = await metaGraphFetch<{ id?: string }>(`${adAccountPath}/ads`, {
    method: 'POST',
    token: config.accessToken,
    body: {
      name: `${campaign.name} (${campaign.ad_code})`,
      adset_id: adset.data.id,
      creative: { creative_id: creative.data.id },
      status: 'PAUSED',
    },
  });
  if (!ad.ok || !ad.data?.id) {
    await markAdFailure(params.supabase, campaign.id, ad.error || 'Meta ad creation failed', metaCampaign.data.id, adset.data.id, creative.data.id);
    return { ...ad, meta: null };
  }

  const metaRow = {
    marketing_campaign_id: campaign.id,
    ad_account_id: config.adAccountId,
    meta_campaign_id: metaCampaign.data.id,
    meta_adset_id: adset.data.id,
    meta_ad_id: ad.data.id,
    meta_creative_id: creative.data.id,
    status: 'paused',
    objective: objective(campaign.objective),
    budget: Number(campaign.budget_type === 'lifetime' ? campaign.lifetime_budget : campaign.daily_budget) || null,
    start_time: campaign.start_at ?? null,
    end_time: campaign.end_at ?? null,
    raw_response_json: {
      campaign: metaCampaign.data,
      adset: adset.data,
      creative: creative.data,
      ad: ad.data,
      whatsapp_link: waLink,
    },
  };

  const { data, error } = await params.supabase
    .from('meta_campaigns')
    .upsert(metaRow, { onConflict: 'marketing_campaign_id', ignoreDuplicates: false })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  await params.supabase.from('marketing_campaigns').update({ status: 'ad_created', meta_error: null }).eq('id', campaign.id);
  await params.supabase.from('campaign_events').insert({
    campaign_id: campaign.id,
    event_type: 'click_to_whatsapp_ad_created',
    event_source: 'meta_marketing_api',
    event_data_json: {
      meta_campaign_id: metaCampaign.data.id,
      meta_adset_id: adset.data.id,
      meta_creative_id: creative.data.id,
      meta_ad_id: ad.data.id,
      campaign_code: campaign.campaign_code,
      ad_code: campaign.ad_code,
    },
    occurred_at: now,
  });

  return { ok: true, status: 200, data, meta: data };
}

async function markAdFailure(
  supabase: SupabaseLike,
  campaignId: string,
  errorMessage: string,
  metaCampaignId?: string,
  metaAdsetId?: string,
  metaCreativeId?: string,
) {
  await supabase.from('marketing_campaigns').update({ status: 'meta_error', meta_error: errorMessage }).eq('id', campaignId);
  await supabase.from('meta_campaigns').upsert({
    marketing_campaign_id: campaignId,
    meta_campaign_id: metaCampaignId ?? null,
    meta_adset_id: metaAdsetId ?? null,
    meta_creative_id: metaCreativeId ?? null,
    status: 'failed',
    error_message: errorMessage,
  }, { onConflict: 'marketing_campaign_id', ignoreDuplicates: false });
  await supabase.from('campaign_events').insert({
    campaign_id: campaignId,
    event_type: 'meta_ad_error',
    event_source: 'meta_marketing_api',
    event_data_json: { error: errorMessage },
  });
}

async function loadMetaCampaign(supabase: SupabaseLike, campaignId: string) {
  const { data, error } = await supabase
    .from('meta_campaigns')
    .select('*')
    .eq('marketing_campaign_id', campaignId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Meta campaign has not been created yet');
  return data;
}

export async function updateMetaCampaignStatus(params: {
  supabase: SupabaseLike;
  campaignId: string;
  status: 'ACTIVE' | 'PAUSED';
}) {
  const config = assertMetaConfig(['accessToken']);
  const meta = await loadMetaCampaign(params.supabase, params.campaignId);
  const ids = [meta.meta_campaign_id, meta.meta_adset_id, meta.meta_ad_id].filter(Boolean);
  const results = [];
  for (const id of ids) {
    results.push(await metaGraphFetch(String(id), {
      method: 'POST',
      token: config.accessToken,
      body: { status: params.status },
    }));
  }
  const failed = results.find((result) => !result.ok);
  if (failed) throw new Error(failed.error || 'Unable to update Meta status');

  const appStatus = params.status === 'ACTIVE' ? 'active' : 'paused';
  await Promise.all([
    params.supabase.from('meta_campaigns').update({ status: appStatus, error_message: null }).eq('marketing_campaign_id', params.campaignId),
    params.supabase.from('marketing_campaigns').update({ status: appStatus, meta_error: null }).eq('id', params.campaignId),
    params.supabase.from('campaign_events').insert({
      campaign_id: params.campaignId,
      event_type: appStatus === 'active' ? 'campaign_resumed' : 'campaign_paused',
      event_source: 'meta_marketing_api',
      event_data_json: { status: params.status },
    }),
  ]);

  return { ok: true, status: 200, data: { status: appStatus } };
}

export async function updateMetaBudget(params: {
  supabase: SupabaseLike;
  campaignId: string;
  budgetType: 'daily' | 'lifetime';
  amount: number;
}) {
  const config = assertMetaConfig(['accessToken']);
  const meta = await loadMetaCampaign(params.supabase, params.campaignId);
  if (!meta.meta_adset_id) throw new Error('Meta ad set ID is missing');
  const amountMinor = moneyToMinor(params.amount);
  if (!amountMinor) throw new Error('Budget amount is invalid');
  const field = params.budgetType === 'lifetime' ? 'lifetime_budget' : 'daily_budget';
  const result = await metaGraphFetch(String(meta.meta_adset_id), {
    method: 'POST',
    token: config.accessToken,
    body: { [field]: amountMinor },
  });
  if (!result.ok) throw new Error(result.error || 'Budget update failed');

  await Promise.all([
    params.supabase.from('meta_campaigns').update({ budget: params.amount }).eq('marketing_campaign_id', params.campaignId),
    params.supabase.from('marketing_campaigns').update({
      budget_type: params.budgetType,
      daily_budget: params.budgetType === 'daily' ? params.amount : null,
      lifetime_budget: params.budgetType === 'lifetime' ? params.amount : null,
    }).eq('id', params.campaignId),
    params.supabase.from('campaign_events').insert({
      campaign_id: params.campaignId,
      event_type: 'budget_updated',
      event_source: 'meta_marketing_api',
      event_data_json: { budget_type: params.budgetType, amount: params.amount },
    }),
  ]);

  return result;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function costPerResult(row: Record<string, unknown>) {
  const actions = Array.isArray(row.actions) ? row.actions as Array<Record<string, unknown>> : [];
  const conversation = actions.find((action) => String(action.action_type || '').includes('onsite_conversion.messaging'));
  const results = numberValue(conversation?.value);
  const spend = numberValue(row.spend);
  return results > 0 ? spend / results : 0;
}

export async function syncMetaInsights(params: {
  supabase: SupabaseLike;
  campaignId?: string | null;
  datePreset?: string | null;
}) {
  const config = assertMetaConfig(['accessToken', 'adAccountId']);
  let query = params.supabase.from('meta_campaigns').select('*').not('meta_campaign_id', 'is', null);
  if (params.campaignId) query = query.eq('marketing_campaign_id', params.campaignId);
  const { data: metaRows, error } = await query;
  if (error) throw new Error(error.message);

  const rows = [];
  for (const meta of metaRows || []) {
    const result = await metaGraphFetch<{ data?: Array<Record<string, unknown>> }>(
      `${meta.meta_campaign_id}/insights`,
      {
        token: config.accessToken,
        query: {
          date_preset: params.datePreset || 'last_7d',
          fields: 'campaign_id,adset_id,ad_id,date_start,date_stop,spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions',
          level: 'ad',
        },
      },
    );
    if (!result.ok) {
      await params.supabase.from('campaign_events').insert({
        campaign_id: meta.marketing_campaign_id,
        event_type: 'meta_insights_sync_failed',
        event_source: 'meta_marketing_api',
        event_data_json: { error: result.error ?? null, status: result.status },
      });
      continue;
    }

    for (const item of result.data?.data || []) {
      rows.push({
        campaign_id: meta.marketing_campaign_id,
        meta_campaign_id: clean(item.campaign_id) || meta.meta_campaign_id,
        meta_adset_id: clean(item.adset_id) || meta.meta_adset_id,
        meta_ad_id: clean(item.ad_id) || meta.meta_ad_id,
        date_start: item.date_start || null,
        date_stop: item.date_stop || null,
        spend: numberValue(item.spend),
        impressions: numberValue(item.impressions),
        reach: numberValue(item.reach),
        clicks: numberValue(item.clicks),
        ctr: numberValue(item.ctr),
        cpc: numberValue(item.cpc),
        cpm: numberValue(item.cpm),
        frequency: numberValue(item.frequency),
        cost_per_result: costPerResult(item),
        raw_insights_json: item,
      });
    }
  }

  if (rows.length) {
    const { error: insertError } = await params.supabase.from('meta_insights_snapshots').insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  return { ok: true, status: 200, synced: rows.length };
}
