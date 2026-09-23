import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const API_HUB_CONSOLE_COOKIE = 'ct_hub_console';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

type HubConsoleSession = {
  sub: string;
  exp: number;
};

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sessionSecret() {
  return process.env.API_HUB_CONSOLE_SESSION_SECRET || '';
}

function configuredPassword() {
  return process.env.API_HUB_CONSOLE_PASSWORD || '';
}

export function configuredUsername() {
  return process.env.API_HUB_CONSOLE_USERNAME || 'bridge-admin';
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error('Bridge console session secret is not configured');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isHubConsoleConfigured() {
  return Boolean(sessionSecret() && configuredPassword());
}

export function verifyHubConsoleCredentials(username: unknown, password: unknown) {
  if (!isHubConsoleConfigured()) return false;
  const inputUsername = typeof username === 'string' ? username.trim() : '';
  const inputPassword = typeof password === 'string' ? password : '';
  return safeEqual(inputUsername, configuredUsername()) && safeEqual(inputPassword, configuredPassword());
}

export function createHubConsoleToken() {
  const payload: HubConsoleSession = {
    sub: configuredUsername(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyHubConsoleToken(token?: string | null) {
  if (!token || !isHubConsoleConfigured()) return false;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;
  let expectedSignature = '';
  try {
    expectedSignature = signPayload(encodedPayload);
  } catch {
    return false;
  }
  if (!safeEqual(signature, expectedSignature)) return false;
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as HubConsoleSession;
    return payload.sub === configuredUsername() && Number(payload.exp || 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function hasHubConsoleSession(request: NextRequest) {
  return verifyHubConsoleToken(request.cookies.get(API_HUB_CONSOLE_COOKIE)?.value);
}

export function setHubConsoleCookie(response: NextResponse, token: string) {
  response.cookies.set(API_HUB_CONSOLE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearHubConsoleCookie(response: NextResponse) {
  response.cookies.set(API_HUB_CONSOLE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
