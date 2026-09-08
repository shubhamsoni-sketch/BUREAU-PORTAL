import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireMarketingAdmin } from '@/lib/marketing/api';

export async function GET(request: NextRequest) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const campaignId = request.nextUrl.searchParams.get('campaign_id');
    let query = auth.supabase
      .from('whatsapp_leads')
      .select('*, marketing_campaigns(name,campaign_code,status), whatsapp_messages(*), report_tracking_links(*)')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (campaignId) query = query.eq('campaign_id', campaignId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, leads: data || [] });
  } catch (error) {
    console.error('[marketing/leads] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load leads', 500);
  }
}
