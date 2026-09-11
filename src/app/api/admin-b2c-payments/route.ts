import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin environment is not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const { data, error } = await createSupabaseAdmin()
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
