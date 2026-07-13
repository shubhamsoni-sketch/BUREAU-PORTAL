import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const setupSecret = process.env.SETUP_ADMIN_SECRET;
  const providedSecret = request.headers.get('x-setup-admin-secret');

  if (!setupSecret || providedSecret !== setupSecret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return handleSetupAdmin();
}

async function handleSetupAdmin() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD are required.' },
        { status: 500 }
      );
    }

    // Check if user already exists
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: `Failed to list users: ${listError.message}` }, { status: 500 });
    }

    const existingUser = existingUsers?.users?.find((u) => u.email === adminEmail);

    let userId: string;
    let isExisting = false;

    if (existingUser) {
      isExisting = true;
      // Update existing user's password, confirm email, AND set role metadata
      // This ensures the handle_new_user trigger (if it fires) sets role = 'admin'
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        {
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Admin', role: 'admin' },
          app_metadata: { role: 'admin', provider: 'email', providers: ['email'] },
        }
      );

      if (updateError) {
        return NextResponse.json({ error: `Failed to update admin user: ${updateError.message}` }, { status: 500 });
      }

      userId = existingUser.id;
      console.log('[setup-admin] Updated existing admin user:', userId);
    } else {
      // Create new admin user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Admin', role: 'admin' },
        app_metadata: { role: 'admin', provider: 'email', providers: ['email'] },
      });

      if (createError) {
        return NextResponse.json({ error: `Failed to create admin user: ${createError.message}` }, { status: 500 });
      }

      userId = newUser.user.id;
      console.log('[setup-admin] Created new admin user:', userId);
    }

    // Force-upsert user_profiles row with admin role using a raw SQL update
    // This bypasses any trigger that might reset the role to 'partner'
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          email: adminEmail,
          full_name: 'Admin',
          role: 'admin',
          is_temp_password: false,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('[setup-admin] Profile upsert error:', profileError.message);
      // Try a direct UPDATE as fallback in case the row already exists
      const { error: updateProfileError } = await adminClient
        .from('user_profiles')
        .update({ role: 'admin', full_name: 'Admin', is_temp_password: false })
        .eq('id', userId);

      if (updateProfileError) {
        return NextResponse.json({
          warning: `Admin auth user set up but profile update failed: ${updateProfileError.message}`,
          userId,
          success: true,
        });
      }
    }

    // Verify the profile was set correctly
    const { data: verifyProfile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    console.log('[setup-admin] Profile role after setup:', verifyProfile?.role);

    if (verifyProfile?.role !== 'admin') {
      // Last resort: direct UPDATE to force the role
      await adminClient
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
      console.log('[setup-admin] Forced role to admin via direct update');
    }

    return NextResponse.json({
      success: true,
      message: isExisting
        ? 'Admin user password reset successfully. You can now log in.' :'Admin user created successfully. You can now log in.',
      email: adminEmail,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
