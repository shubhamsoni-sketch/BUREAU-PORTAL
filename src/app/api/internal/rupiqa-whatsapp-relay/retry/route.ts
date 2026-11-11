import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processPendingRupiqaWhatsAppRelays } from '@/lib/whatsapp/rupiqa-relay';

export const runtime = 'nodejs';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.RUPIQA_RELAY_CRON_SECRET || '';
  if (!secret) return true;
  const auth = request.headers.get('authorization') || '';
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || 25)));
    const supabase = createAdminClient();
    const result = await processPendingRupiqaWhatsAppRelays({ supabase, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[rupiqa-whatsapp-relay/retry] failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Retry failed' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
