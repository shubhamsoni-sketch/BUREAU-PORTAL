import { updateMetaBudget, updateMetaCampaignStatus } from './meta-ads';

type SupabaseLike = {
  from: (table: string) => any;
};

type Rule = {
  type: string;
  threshold?: number;
  amount?: number;
  budget_type?: 'daily' | 'lifetime';
  hours?: number;
  enabled?: boolean;
};

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rules(value: unknown): Rule[] {
  return Array.isArray(value)
    ? value.filter((item): item is Rule => item && typeof item === 'object' && item.enabled !== false)
    : [];
}

async function campaignMetrics(supabase: SupabaseLike, campaignId: string) {
  const [insights, leads, tracking, failedMessages] = await Promise.all([
    supabase.from('meta_insights_snapshots').select('spend,reach,impressions,clicks').eq('campaign_id', campaignId),
    supabase.from('whatsapp_leads').select('id').eq('campaign_id', campaignId),
    supabase.from('report_tracking_links').select('id,open_count').eq('campaign_id', campaignId),
    supabase.from('whatsapp_messages').select('id').eq('status', 'failed'),
  ]);

  if (insights.error) throw new Error(insights.error.message);
  if (leads.error) throw new Error(leads.error.message);
  if (tracking.error) throw new Error(tracking.error.message);
  if (failedMessages.error) throw new Error(failedMessages.error.message);

  const spend = (insights.data || []).reduce((sum: number, row: any) => sum + numberValue(row.spend), 0);
  const leadCount = (leads.data || []).length;
  const reportOpens = (tracking.data || []).reduce((sum: number, row: any) => sum + numberValue(row.open_count), 0);

  return {
    spend,
    leadCount,
    reportOpens,
    cpl: leadCount ? spend / leadCount : 0,
    failedMessages: (failedMessages.data || []).length,
  };
}

async function logRun(params: {
  supabase: SupabaseLike;
  campaignId: string;
  ruleType: string;
  actionTaken: string;
  dryRun: boolean;
  result: Record<string, unknown>;
}) {
  await params.supabase.from('automation_rule_runs').insert({
    campaign_id: params.campaignId,
    rule_type: params.ruleType,
    action_taken: params.actionTaken,
    dry_run: params.dryRun,
    result_json: params.result,
  });
  await params.supabase.from('campaign_events').insert({
    campaign_id: params.campaignId,
    event_type: 'automation_rule_evaluated',
    event_source: 'automation_rules',
    event_data_json: {
      rule_type: params.ruleType,
      action_taken: params.actionTaken,
      dry_run: params.dryRun,
      result: params.result,
    },
  });
}

export async function evaluateAutomationRules(params: {
  supabase: SupabaseLike;
  campaignId?: string | null;
  execute?: boolean;
}) {
  let query = params.supabase
    .from('marketing_campaigns')
    .select('id,name,status,automation_rules_json,daily_budget,lifetime_budget,budget_type,end_at')
    .in('status', ['ad_created', 'active', 'paused', 'scheduled', 'published']);
  if (params.campaignId) query = query.eq('id', params.campaignId);
  const { data: campaigns, error } = await query;
  if (error) throw new Error(error.message);

  const dryRun = !params.execute;
  const results = [];

  for (const campaign of campaigns || []) {
    const metrics = await campaignMetrics(params.supabase, campaign.id);
    for (const rule of rules(campaign.automation_rules_json)) {
      let matched = false;
      let actionTaken = 'none';
      const threshold = numberValue(rule.threshold);

      if (rule.type === 'pause_if_cpl_above' && metrics.leadCount > 0 && metrics.cpl > threshold) {
        matched = true;
        actionTaken = 'pause_campaign';
        if (!dryRun) await updateMetaCampaignStatus({ supabase: params.supabase, campaignId: campaign.id, status: 'PAUSED' });
      }

      if (rule.type === 'resume_if_cpl_below' && metrics.leadCount > 0 && metrics.cpl < threshold) {
        matched = true;
        actionTaken = 'resume_campaign';
        if (!dryRun) await updateMetaCampaignStatus({ supabase: params.supabase, campaignId: campaign.id, status: 'ACTIVE' });
      }

      if (rule.type === 'increase_budget_if_cpl_below' && metrics.leadCount > 0 && metrics.cpl < threshold && rule.amount) {
        matched = true;
        actionTaken = 'increase_budget';
        const nextAmount = Math.max(numberValue(campaign.daily_budget || campaign.lifetime_budget), numberValue(rule.amount));
        if (!dryRun) {
          await updateMetaBudget({
            supabase: params.supabase,
            campaignId: campaign.id,
            budgetType: rule.budget_type || campaign.budget_type || 'daily',
            amount: nextAmount,
          });
        }
      }

      if (rule.type === 'alert_if_spend_above' && metrics.spend > threshold) {
        matched = true;
        actionTaken = 'admin_alert';
      }

      if (rule.type === 'stop_at_end_date' && campaign.end_at && new Date(campaign.end_at).getTime() < Date.now()) {
        matched = true;
        actionTaken = 'pause_campaign';
        if (!dryRun) await updateMetaCampaignStatus({ supabase: params.supabase, campaignId: campaign.id, status: 'PAUSED' });
      }

      if (matched) {
        const result = { campaign_name: campaign.name, metrics, rule };
        await logRun({
          supabase: params.supabase,
          campaignId: campaign.id,
          ruleType: rule.type,
          actionTaken,
          dryRun,
          result,
        });
        results.push({ campaign_id: campaign.id, rule_type: rule.type, action_taken: actionTaken, dry_run: dryRun });
      }
    }
  }

  return { evaluatedCampaigns: (campaigns || []).length, actions: results };
}
