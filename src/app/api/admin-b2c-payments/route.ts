import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('b2c_payments')
      .select('*, b2c_report_requests(full_name, email, report_id, status)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin-b2c-payments] query error:', error);
      return NextResponse.json({ success: true, payments: [], warning: error.message });
    }

    return NextResponse.json({ success: true, payments: data ?? [] });
  } catch (error: any) {
    console.error('[admin-b2c-payments] unexpected error:', error);
    return NextResponse.json({ success: true, payments: [], warning: error?.message ?? 'Unexpected error' });
  }
}
