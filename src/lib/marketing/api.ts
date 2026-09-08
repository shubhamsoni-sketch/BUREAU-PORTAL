import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export function isAuthError(auth: unknown): auth is { error: string; status: number } {
  return Boolean(auth && typeof auth === 'object' && 'error' in auth);
}

export async function requireMarketingAdmin(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return { auth: null, response: jsonError(auth.error, auth.status) };
  return { auth, response: null };
}

export function clean(value: unknown) {
  return String(value ?? '').trim();
}

export function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
