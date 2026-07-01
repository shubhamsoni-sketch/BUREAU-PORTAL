import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizePartnerProductAccess } from '@/lib/partner-access';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { partner_id, product_access } = await request.json();

    if (!partner_id) {
      return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
    }

    const access = normalizePartnerProductAccess(product_access);
    const { error } = await supabaseAdmin
      .from('partners')
      .update({ product_access: access, updated_at: new Date().toISOString() })
      .eq('id', partner_id);

    if (error) {
      console.error('[update-partner-product-access] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product_access: access });
  } catch (err: any) {
    console.error('[update-partner-product-access] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
