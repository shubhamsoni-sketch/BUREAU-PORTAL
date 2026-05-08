import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('partner_commercials')
      .select('partner_id, pricing_plan, subscription_type, consumer_credit_rate, commercial_credit_rate, bundled_credits, credit_limit, notes');

    if (error) {
      console.error('[admin-commercials-list] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    console.error('[admin-commercials-list] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
