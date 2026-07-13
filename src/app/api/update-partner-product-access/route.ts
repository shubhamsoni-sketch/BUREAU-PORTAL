import { NextRequest, NextResponse } from 'next/server';
import { normalizePartnerProductAccess } from '@/lib/partner-access';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { partner_id, product_access } = await request.json();

    if (!partner_id) {
      return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
    }

    const access = normalizePartnerProductAccess(product_access);
    const { error } = await auth.supabase
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
