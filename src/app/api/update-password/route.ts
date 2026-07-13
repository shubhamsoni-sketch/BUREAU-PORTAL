import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
      app_metadata: {
        role: 'partner',
        is_temp_password: false,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_temp_password: false })
      .eq('id', userId);

    if (profileError) {
      console.error('[update-password] Failed to clear is_temp_password:', profileError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[update-password] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
