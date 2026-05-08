import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 });
    }

    // Update the password using the admin API (bypasses session/cookie issues in iframes)
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

    // Clear the temp password flag
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_temp_password: false })
      .eq('id', userId);

    if (profileError) {
      console.error('[update-password] Failed to clear is_temp_password:', profileError.message);
      // Non-fatal — password was updated successfully
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[update-password] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
