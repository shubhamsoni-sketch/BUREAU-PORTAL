import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('run_lender_compliance_scan');
    if (error) throw error;
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('[lender-intelligence/sla-scan] failed', error);
    return NextResponse.json({ success: false, error: 'Lender SLA scan failed' }, { status: 500 });
  }
}
