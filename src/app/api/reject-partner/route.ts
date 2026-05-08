import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKeySecret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const isRealServiceKey =
      serviceRoleKey &&
      serviceRoleKey.length > 20 &&
      !serviceRoleKey.startsWith('your-') &&
      !serviceRoleKey.includes('here');

    if (!isRealServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' },
        { status: 503 }
      );
    }

    // Accept internal admin secret header (anon key) — same pattern as approve-partner and add-partner
    const internalSecret = request.headers.get('x-admin-secret');
    const isInternalAdmin = !!(internalSecret && anonKeySecret && internalSecret === anonKeySecret);

    // Also accept Bearer token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token && !isInternalAdmin) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service role admin client to bypass RLS
    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await adminClient
      .from('partner_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin-internal',
      })
      .eq('id', requestId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reject partner API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
