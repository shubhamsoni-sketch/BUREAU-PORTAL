import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireMarketingAdmin } from '@/lib/marketing/api';
import { createClickToWhatsAppAd } from '@/lib/marketing/meta-ads';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const result = await createClickToWhatsAppAd({ supabase: auth.supabase, campaignId: id });
    if (!result.ok) return jsonError(('error' in result && result.error) || 'Unable to create Click-to-WhatsApp ad', result.status || 502);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[marketing/create-ad] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to create ad', 500);
  }
}
