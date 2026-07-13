import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireUser } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireUser(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data: notifications, error } = await auth.supabase
      .from('notifications')
      .select('id, type, title, message, is_read, metadata, created_at')
      .eq('user_id', auth.user.id)
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
