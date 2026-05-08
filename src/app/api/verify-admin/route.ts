import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ isAdmin: false, error: 'Missing userId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ isAdmin: false, error: 'Missing env vars' }, { status: 500 });
    }

    // Use service role to bypass RLS — check both auth metadata and profile table
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check auth.users metadata first
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
    if (!userError && userData?.user) {
      const appRole = userData.user.app_metadata?.role;
      const metaRole = userData.user.user_metadata?.role;
      if (appRole === 'admin' || metaRole === 'admin') {
        return NextResponse.json({ isAdmin: true });
      }
    }

    // Check user_profiles table (service role bypasses RLS)
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';
    return NextResponse.json({ isAdmin });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ isAdmin: false, error: message }, { status: 500 });
  }
}
