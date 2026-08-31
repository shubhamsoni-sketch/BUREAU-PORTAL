import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const B2C_SESSION_COOKIE = 'ct_b2c_session';
const SESSION_TTL_SECONDS = 60 * 60;

function secret() {
  const value = process.env.B2C_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error('B2C session secret is not configured');
  return value;
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createB2cSession(requestId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${requestId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function setB2cSession(response: NextResponse, requestId: string) {
  response.cookies.set(B2C_SESSION_COOKIE, createB2cSession(requestId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function sessionRequestId(request: NextRequest) {
  const token = request.cookies.get(B2C_SESSION_COOKIE)?.value || '';
  const [requestId, expiresRaw, signature] = token.split('.');
  if (!requestId || !expiresRaw || !signature) return null;
  if (Number(expiresRaw) < Math.floor(Date.now() / 1000)) return null;

  const payload = `${requestId}.${expiresRaw}`;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return requestId;
}

export function requireB2cSession(request: NextRequest, requestedId: string) {
  const sessionId = sessionRequestId(request);
  return Boolean(sessionId && requestedId && sessionId === requestedId);
}

export function otpHash(requestId: string, otp: string) {
  return createHmac('sha256', secret()).update(`otp:${requestId}:${otp}`).digest('hex');
}

export function requestIp(request: NextRequest) {
  return (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '')
    .split(',')[0]
    .trim() || null;
}
