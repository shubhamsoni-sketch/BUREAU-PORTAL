import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are missing');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireAdmin(accessToken: string | null) {
  if (!accessToken) return { error: 'Unauthorized', status: 401 as const };

  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return { error: 'Unauthorized', status: 401 as const };

  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (role === 'admin') return { user, supabase };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 as const };
  return { user, supabase };
}

export async function requireUser(accessToken: string | null) {
  if (!accessToken) return { error: 'Unauthorized', status: 401 as const };

  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return { error: 'Unauthorized', status: 401 as const };

  return { user, supabase };
}

export function bearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
}
