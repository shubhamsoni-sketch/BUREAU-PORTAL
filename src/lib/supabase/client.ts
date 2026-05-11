import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export const AUTH_STORAGE_KEY = 'sb-cibilysis-auth-token';

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  );

  return browserClient;
}

export function resetClient() {
  browserClient = null;
}
