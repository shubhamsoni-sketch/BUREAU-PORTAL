import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireUser } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const auth = await requireUser(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { notification_id } = body;

    if (notification_id) {
      // Mark single notification as read
      const { error } = await auth.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .eq('user_id', auth.user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Mark all as read
      const { error } = await auth.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', auth.user.id)
        .eq('is_read', false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[mark-notifications-read] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
