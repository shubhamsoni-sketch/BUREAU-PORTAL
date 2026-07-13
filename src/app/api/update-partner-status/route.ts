import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

const STATUS_MAP: Record<string, string> = {
  Active: 'approved',
  Pending: 'pending',
  Suspended: 'suspended',
  Terminated: 'terminated',
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { partner_id, status } = body;

    if (!partner_id || !status) {
      return NextResponse.json({ error: 'partner_id and status are required' }, { status: 400 });
    }

    const dbStatus = STATUS_MAP[status] ?? status.toLowerCase();

    const { error } = await auth.supabase
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
