import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireMarketingAdmin } from '@/lib/marketing/api';
import { createClickToWhatsAppAd, updateMetaCampaignStatus } from '@/lib/marketing/meta-ads';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;

    let publishResult;
    try {
      publishResult = await updateMetaCampaignStatus({ supabase: auth.supabase, campaignId: id, status: 'ACTIVE' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('Meta campaign has not been created yet') && !message.includes('Meta campaign/ad IDs are missing')) {
        throw error;
      }

      const draftResult = await createClickToWhatsAppAd({ supabase: auth.supabase, campaignId: id });
      if (!draftResult.ok) {
        return jsonError(('error' in draftResult && draftResult.error) || 'Unable to prepare Meta ad before publish', draftResult.status || 502);
      }
      publishResult = await updateMetaCampaignStatus({ supabase: auth.supabase, campaignId: id, status: 'ACTIVE' });
    }

    return NextResponse.json({ success: true, result: publishResult });
  } catch (error) {
    console.error('[marketing/publish-live] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to publish campaign live', 500);
  }
}
