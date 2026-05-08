import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('id, type, title, message, is_read, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[get-notifications] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      notifications: notifications ?? [],
      unreadCount,
    });
  } catch (err: any) {
    console.error('[get-notifications] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
