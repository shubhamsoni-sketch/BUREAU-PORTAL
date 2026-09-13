import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export const AUTH_STORAGE_KEY = 'sb-bureau-portal-auth-token';

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
        // Chrome/Web Locks can get stuck after repeated deploys or stale tabs,
        // which leaves getSession/signInWithPassword pending forever. This app
        // uses a single client instance, so a direct in-process lock is enough.
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    }
  );

  return browserClient;
}

export function resetClient() {
  browserClient = null;
}
