import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireMarketingAdmin } from '@/lib/marketing/api';
import { updateMetaCampaignStatus } from '@/lib/marketing/meta-ads';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const result = await updateMetaCampaignStatus({ supabase: auth.supabase, campaignId: id, status: 'ACTIVE' });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[marketing/resume] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to resume campaign', 500);
  }
}
