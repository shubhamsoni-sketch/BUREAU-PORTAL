'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { generatePartnerCode } from '@/lib/partner-code';

type CookieToSet = { name: string; value: string; options?: any };

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isReal =
    serviceRoleKey &&
    serviceRoleKey.length > 20 &&
    !serviceRoleKey.startsWith('your-') &&
    !serviceRoleKey.includes('here');

  if (!isReal) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export interface ApproveResult {
  success: boolean;
  partnerCode?: string;
  email?: string;
  password?: string;
  name?: string;
  error?: string;
}

async function verifyAdminCaller(): Promise<{ userId: string } | { error: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, sameSite: 'none', secure: true })
            );
          } catch {
            // read-only context
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const isAdmin =
    user.app_metadata?.role === 'admin' ||
    user.user_metadata?.role === 'admin';

  if (!isAdmin) {
    // Fallback: check user_profiles table
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') return { error: 'Not authorized' };
  }

  return { userId: user.id };
}

export async function approvePartnerRequest(requestId: string): Promise<ApproveResult> {
  const callerCheck = await verifyAdminCaller();
  if ('error' in callerCheck) return { success: false, error: callerCheck.error };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { success: false, error: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.' };
  }

  // Fetch the partner request using admin client (bypasses RLS)
  const { data: request, error: fetchError } = await adminClient
    .from('partner_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) return { success: false, error: 'Request not found' };
  if (request.status !== 'pending') return { success: false, error: 'Request already processed' };

  let password = generatePassword();
  const partnerCode = await generatePartnerCode(adminClient);

  // Create auth user with service role
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: request.email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: request.name,
      role: 'partner',
    },
    app_metadata: {
      role: 'partner',
    },
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Failed to create auth user' };
  }

  const newUserId = authData.user.id;

  // Ensure user_profiles row exists (trigger may have already created it)
  await adminClient
    .from('user_profiles')
    .upsert({
      id: newUserId,
      email: request.email,
      full_name: request.name,
      role: 'partner',
    }, { onConflict: 'id', ignoreDuplicates: false });

  // Create partner record using admin client (bypasses RLS)
  const { error: partnerError } = await adminClient
    .from('partners')
    .insert({
      user_id: newUserId,
      name: request.name,
      company_name: request.company_name,
      mobile: request.mobile,
      email: request.email,
      city: request.city,
      partner_code: partnerCode,
      status: 'approved',
      pricing_plan: 'Basic',
      wallet_balance: 0,
      reports_pulled: 0,
    });

  if (partnerError) {
    // Rollback: delete the auth user we just created
    await adminClient.auth.admin.deleteUser(newUserId);
    return { success: false, error: 'Failed to create partner record: ' + partnerError.message };
  }

  // Mark request as approved using admin client
  await adminClient
    .from('partner_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: callerCheck.userId,
    })
    .eq('id', requestId);

  return {
    success: true,
    partnerCode,
    email: request.email,
    password,
    name: request.name,
  };
}

export async function rejectPartnerRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const callerCheck = await verifyAdminCaller();
  if ('error' in callerCheck) return { success: false, error: callerCheck.error };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { success: false, error: 'Service role key not configured.' };
  }

  const { error } = await adminClient
    .from('partner_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: callerCheck.userId,
    })
    .eq('id', requestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addPartnerManually(data: {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pricingPlan: string;
}): Promise<ApproveResult> {
  const callerCheck = await verifyAdminCaller();
  if ('error' in callerCheck) return { success: false, error: callerCheck.error };

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return { success: false, error: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.' };
  }

  let password = generatePassword();
  const partnerCode = await generatePartnerCode(adminClient);

  // Create auth user with service role
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: 'partner',
    },
    app_metadata: {
      role: 'partner',
    },
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Failed to create auth user' };
  }

  const newUserId = authData.user.id;

  // Ensure user_profiles row exists (trigger may have already created it)
  await adminClient
    .from('user_profiles')
    .upsert({
      id: newUserId,
      email: data.email,
      full_name: data.fullName,
      role: 'partner',
    }, { onConflict: 'id', ignoreDuplicates: false });

  // Create partner record using admin client (bypasses RLS)
  const { error: partnerError } = await adminClient
    .from('partners')
    .insert({
      user_id: newUserId,
      name: data.fullName,
      company_name: '',
      mobile: data.phone,
      email: data.email,
      city: data.city,
      partner_code: partnerCode,
      status: 'approved',
      pricing_plan: data.pricingPlan || 'Basic',
      wallet_balance: 0,
      reports_pulled: 0,
    });

  if (partnerError) {
    await adminClient.auth.admin.deleteUser(newUserId);
    return { success: false, error: 'Failed to create partner record: ' + partnerError.message };
  }

  return {
    success: true,
    partnerCode,
    email: data.email,
    password,
    name: data.fullName,
  };
}
