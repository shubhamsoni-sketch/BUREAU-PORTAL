'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_STORAGE_KEY, createClient, resetClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getPartnerLandingPath, normalizePartnerProductAccess, type PartnerProductAccess } from '@/lib/partner-access';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'partner';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  partnerCode?: string;
  productAccess?: PartnerProductAccess;
  isTempPassword?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser | null }>;
  logout: (redirectTo?: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// DO NOT capture a singleton here — always call createClient() to get the current instance
// (resetClient() nulls the singleton, so a module-level capture becomes stale after a reset)

/**
 * Build an AuthUser from a Supabase user + optional profile row.
 * Falls back to JWT metadata if the user_profiles row is missing.
 */
async function resolveAuthUser(supabaseUser: User): Promise<AuthUser | null> {
  try {
    const supabase = createClient(); // always get the current (possibly fresh) client
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_temp_password')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    console.log('[AuthContext] user_profiles fetch:', { profile, error: profileError });

    let role: UserRole = 'partner';
    if (profile?.role) {
      role = profile.role as UserRole;
    } else if (supabaseUser.app_metadata?.role) {
      role = supabaseUser.app_metadata.role as UserRole;
    } else if (supabaseUser.user_metadata?.role) {
      role = supabaseUser.user_metadata.role as UserRole;
    }

    const name =
      profile?.full_name ||
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.email?.split('@')[0] ||
      'User';

    const email = profile?.email || supabaseUser.email || '';

    if (!profile) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .upsert(
          { id: supabaseUser.id, email, full_name: name, role },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      console.log('[AuthContext] user_profiles upsert (fallback):', { insertError });
    }

    let partnerCode: string | undefined;
    let productAccess: PartnerProductAccess | undefined;
    if (role === 'partner') {
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('partner_code, product_access')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();
      console.log('[AuthContext] partners fetch:', { partner, error: partnerError });
      partnerCode = partner?.partner_code ?? undefined;
      productAccess = partner?.product_access
        ? normalizePartnerProductAccess(partner.product_access)
        : undefined;
    }

    const resolved: AuthUser = {
      id: supabaseUser.id,
      name,
      email,
      role,
      partnerCode,
      productAccess,
      isTempPassword: profile?.is_temp_password ??
        ((supabaseUser.app_metadata?.is_temp_password === true) || false),
    };
    console.log('[AuthContext] resolveAuthUser result:', resolved);
    return resolved;
  } catch (err) {
    console.error('[AuthContext] resolveAuthUser threw:', err);
    return null;
  }
}

export function getPartnerRedirectPath(user: AuthUser | null): string {
  return user?.role === 'partner' ? getPartnerLandingPath(user.productAccess) : '/partner-login';
}

function withAuthTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 8000)),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track if we're currently resolving to prevent duplicate calls
  const resolvingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // If Supabase is not configured, skip auth entirely
    if (!isSupabaseConfigured()) {
      console.warn('[AuthContext] Supabase env vars not set — running in unauthenticated mode.');
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Immediately check for an existing session on mount
    const supabase = createClient();
    let cancelled = false;

    const loadInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          resolvingRef.current = true;
          try {
            const profile = await withAuthTimeout(resolveAuthUser(session.user), null);
            if (!cancelled) setUser(profile);
          } finally {
            resolvingRef.current = false;
          }
        } else {
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadInitialSession();

    // Single source of truth: onAuthStateChange handles INITIAL_SESSION on mount.
    // Do NOT call getSession() separately — that creates a competing lock on the same
    // localStorage key and causes "lock stolen" / rate-limit errors.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange:', event, 'session user:', session?.user?.id ?? null);

      // INITIAL_SESSION fires on mount with the current session (or null if signed out)
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          if (resolvingRef.current) {
            return;
          }
          if (!resolvingRef.current) {
            resolvingRef.current = true;
            try {
              const profile = await withAuthTimeout(resolveAuthUser(session.user), null);
              setUser(profile);
            } finally {
              resolvingRef.current = false;
            }
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
        return;
      }

      // TOKEN_REFRESHED failure — clear user
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[AuthContext] Token refresh failed — clearing user');
        await supabase.auth.signOut();
        resetClient();
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        if (resolvingRef.current) {
          setIsLoading(false);
          return;
        }
        resolvingRef.current = true;
        try {
          const profile = await withAuthTimeout(resolveAuthUser(session.user), null);
          console.log('[AuthContext] setUser:', profile);
          setUser(profile);
        } finally {
          resolvingRef.current = false;
        }
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] SIGNED_OUT — clearing user');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Any other event with a session (e.g. USER_UPDATED)
      if (session?.user && !resolvingRef.current) {
        resolvingRef.current = true;
        try {
          const profile = await withAuthTimeout(resolveAuthUser(session.user), null);
          setUser(profile);
        } finally {
          resolvingRef.current = false;
        }
      } else if (!session) {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser | null }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Authentication service is not configured.' };
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[AuthContext] signInWithPassword error:', error.message);
        return { success: false, error: 'Invalid email or password.' };
      }
      if (!data.user) {
        return { success: false, error: 'Login failed. Please try again.' };
      }

      const profile = await withAuthTimeout(resolveAuthUser(data.user), null);
      setUser(profile);
      setIsLoading(false);
      return { success: true, user: profile };
    } catch {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(async (redirectTo = '/') => {
    setUser(null);
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await createClient().auth.signOut({ scope: 'global' });
      }
    } catch (err) {
      console.warn('[AuthContext] signOut failed, clearing local session anyway:', err);
    } finally {
      try {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith('sb-') && key.includes('auth-token'))
          .forEach((key) => window.localStorage.removeItem(key));
      } catch {
        // Ignore storage cleanup failures.
      }
      resetClient();
      setUser(null);
      setIsLoading(false);
      router.replace(redirectTo);
      router.refresh();
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
