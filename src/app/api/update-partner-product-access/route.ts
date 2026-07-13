import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePartnerProductAccess } from '@/lib/partner-access';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
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
