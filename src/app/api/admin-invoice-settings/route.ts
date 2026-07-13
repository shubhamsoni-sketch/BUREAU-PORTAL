import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('invoice_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[admin-invoice-settings] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? null });
  } catch (err: any) {
    console.error('[admin-invoice-settings] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await req.json();
    const { id, company_name, company_address, gst_number, logo_url } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (company_name !== undefined) updates.company_name = company_name;
    if (company_address !== undefined) updates.company_address = company_address;
    if (gst_number !== undefined) updates.gst_number = gst_number;
    if (logo_url !== undefined) updates.logo_url = logo_url;

    let data;
    let error;

    if (id) {
      const result = await supabaseAdmin
        .from('invoice_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabaseAdmin
        .from('invoice_settings')
        .insert(updates)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('[admin-invoice-settings] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[admin-invoice-settings] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
