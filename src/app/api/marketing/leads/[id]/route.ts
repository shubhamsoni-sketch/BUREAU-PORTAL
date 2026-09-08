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
    const [lead, messages, events, links] = await Promise.all([
      auth.supabase.from('whatsapp_leads').select('*, marketing_campaigns(*)').eq('id', id).maybeSingle(),
      auth.supabase.from('whatsapp_messages').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(500),
      auth.supabase.from('campaign_events').select('*').eq('lead_id', id).order('occurred_at', { ascending: false }).limit(500),
      auth.supabase.from('report_tracking_links').select('*, report_tracking_events(*)').eq('lead_id', id).order('created_at', { ascending: false }),
    ]);
    const firstError = [lead.error, messages.error, events.error, links.error].find(Boolean);
    if (firstError) throw new Error(firstError.message);
    if (!lead.data) return jsonError('Lead not found', 404);
    return NextResponse.json({
      success: true,
      lead: lead.data,
      messages: messages.data || [],
      events: events.data || [],
      trackingLinks: links.data || [],
    });
  } catch (error) {
    console.error('[marketing/leads/:id] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to load lead', 500);
  }
}
