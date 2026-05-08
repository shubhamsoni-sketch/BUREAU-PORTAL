import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner_id, pricing_plan } = body;

    if (!partner_id || !pricing_plan) {
      return NextResponse.json({ error: 'partner_id and pricing_plan are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('partners')
      .update({ pricing_plan, updated_at: new Date().toISOString() })
      .eq('id', partner_id);

    if (error) {
      console.error('[update-partner-pricing] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[update-partner-pricing] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
