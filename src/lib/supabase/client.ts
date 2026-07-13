import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export const AUTH_STORAGE_KEY = 'sb-bureau-portal-auth-token';

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined'
  );
}

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  if (!isSupabaseConfigured()) {
    // Return a minimal stub so callers don't crash — auth methods will fail gracefully
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

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
