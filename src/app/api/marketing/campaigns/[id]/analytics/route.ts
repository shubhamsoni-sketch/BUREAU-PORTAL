import { NextRequest, NextResponse } from 'next/server';
import { jsonError, numberValue, requireMarketingAdmin } from '@/lib/marketing/api';

function rate(part: number, total: number) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const [campaign, insights, leads, tracking, messages, events] = await Promise.all([
      auth.supabase.from('marketing_campaigns').select('*').eq('id', id).maybeSingle(),
      auth.supabase.from('meta_insights_snapshots').select('*').eq('campaign_id', id),
      auth.supabase.from('whatsapp_leads').select('*').eq('campaign_id', id),
      auth.supabase.from('report_tracking_links').select('*').eq('campaign_id', id),
      auth.supabase.from('whatsapp_messages').select('*, whatsapp_leads!inner(campaign_id)').eq('whatsapp_leads.campaign_id', id),
      auth.supabase.from('campaign_events').select('*').eq('campaign_id', id).order('occurred_at', { ascending: false }).limit(300),
    ]);
    const firstError = [campaign.error, insights.error, leads.error, tracking.error, messages.error, events.error].find(Boolean);
    if (firstError) throw new Error(firstError.message);
    if (!campaign.data) return jsonError('Campaign not found', 404);

    const insightRows = insights.data || [];
    const leadRows = leads.data || [];
    const trackingRows = tracking.data || [];
    const messageRows = messages.data || [];
    const spend = insightRows.reduce((sum: number, row: any) => sum + numberValue(row.spend), 0);
    const impressions = insightRows.reduce((sum: number, row: any) => sum + numberValue(row.impressions), 0);
    const reach = insightRows.reduce((sum: number, row: any) => sum + numberValue(row.reach), 0);
    const clicks = insightRows.reduce((sum: number, row: any) => sum + numberValue(row.clicks), 0);
    const outbound = messageRows.filter((row: any) => row.direction === 'outbound');
    const delivered = outbound.filter((row: any) => row.delivered_at || row.status === 'delivered' || row.status === 'read');
    const read = outbound.filter((row: any) => row.read_at || row.status === 'read');
    const failed = outbound.filter((row: any) => row.failed_at || row.status === 'failed');
    const opens = trackingRows.reduce((sum: number, row: any) => sum + numberValue(row.open_count), 0);

    return NextResponse.json({
      success: true,
      campaign: campaign.data,
      summary: {
        spend,
        impressions,
        reach,
        clicks,
        ctr: rate(clicks, impressions),
        whatsapp_leads: leadRows.length,
        cost_per_whatsapp_lead: leadRows.length ? Math.round((spend / leadRows.length) * 100) / 100 : 0,
        outbound_messages: outbound.length,
        delivered: delivered.length,
        delivered_rate: rate(delivered.length, outbound.length),
        read: read.length,
        read_rate: rate(read.length, outbound.length),
        failed: failed.length,
        failed_rate: rate(failed.length, outbound.length),
        reports_opened: opens,
        report_open_rate: rate(opens, leadRows.length),
      },
      insights: insightRows,
      leads: leadRows,
      trackingLinks: trackingRows,
      messages: messageRows,
      events: events.data || [],
    });
  } catch (error) {
    console.error('[marketing/analytics] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load analytics', 500);
  }
}
