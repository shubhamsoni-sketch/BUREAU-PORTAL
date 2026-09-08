import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireMarketingAdmin } from '@/lib/marketing/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const [campaign, leads, messages, events, insights, tracking] = await Promise.all([
      auth.supabase
        .from('marketing_campaigns')
        .select('*, marketing_assets(*), meta_campaigns(*), meta_page_posts(*)')
        .eq('id', id)
        .maybeSingle(),
      auth.supabase.from('whatsapp_leads').select('*').eq('campaign_id', id).order('created_at', { ascending: false }).limit(500),
      auth.supabase.from('whatsapp_messages').select('*, whatsapp_leads!inner(campaign_id)').eq('whatsapp_leads.campaign_id', id).order('created_at', { ascending: false }).limit(500),
      auth.supabase.from('campaign_events').select('*').eq('campaign_id', id).order('occurred_at', { ascending: false }).limit(500),
      auth.supabase.from('meta_insights_snapshots').select('*').eq('campaign_id', id).order('created_at', { ascending: false }).limit(500),
      auth.supabase.from('report_tracking_links').select('*, report_tracking_events(*)').eq('campaign_id', id).order('created_at', { ascending: false }).limit(200),
    ]);

    const firstError = [campaign.error, leads.error, messages.error, events.error, insights.error, tracking.error].find(Boolean);
    if (firstError) throw new Error(firstError.message);
    if (!campaign.data) return jsonError('Campaign not found', 404);

    return NextResponse.json({
      success: true,
      campaign: campaign.data,
      leads: leads.data || [],
      messages: messages.data || [],
      events: events.data || [],
      insights: insights.data || [],
      trackingLinks: tracking.data || [],
    });
  } catch (error) {
    console.error('[marketing/campaigns/:id] load error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load campaign', 500);
  }
}
