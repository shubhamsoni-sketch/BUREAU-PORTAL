import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const STATUS_MAP: Record<string, string> = {
  Active: 'approved',
  Pending: 'pending',
  Suspended: 'suspended',
  Terminated: 'terminated',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner_id, status } = body;

    if (!partner_id || !status) {
      return NextResponse.json({ error: 'partner_id and status are required' }, { status: 400 });
    }

    const dbStatus = STATUS_MAP[status] ?? status.toLowerCase();

    const { error } = await supabaseAdmin
      .from('partners')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', partner_id);

    if (error) {
      console.error('[update-partner-status] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[update-partner-status] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
