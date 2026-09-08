import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clean, jsonError, requireMarketingAdmin } from '@/lib/marketing/api';
import { syncMetaInsights } from '@/lib/marketing/meta-ads';

function authorizedCron(request: NextRequest) {
  const secret = process.env.MARKETING_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return header === secret;
}

async function runSync(request: NextRequest, body: Record<string, unknown>) {
  let supabase: ReturnType<typeof createAdminClient>;
  if (authorizedCron(request)) {
    supabase = createAdminClient();
  } else {
    const { auth, response } = await requireMarketingAdmin(request);
    if (response) return response;
    supabase = auth.supabase;
  }

  try {
    const result = await syncMetaInsights({
      supabase,
      campaignId: clean(body.campaign_id) || null,
      datePreset: clean(body.date_preset) || 'last_7d',
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[marketing/insights/sync] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to sync Meta insights', 500);
  }
}

export async function POST(request: NextRequest) {
  return runSync(request, await request.json().catch(() => ({})));
}

export async function GET(request: NextRequest) {
  if (!authorizedCron(request)) return jsonError('Unauthorized', 401);
  return runSync(request, {
    campaign_id: request.nextUrl.searchParams.get('campaign_id'),
    date_preset: request.nextUrl.searchParams.get('date_preset') || 'last_7d',
  });
}
