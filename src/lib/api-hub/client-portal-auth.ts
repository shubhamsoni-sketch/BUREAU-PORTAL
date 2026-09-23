import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SimpleApiClient, SimpleApiHubStore } from './simple-store';

export const API_CLIENT_PORTAL_COOKIE = 'ct_api_client_portal';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

type ClientPortalSession = {
  client_id: string;
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
  return process.env.API_CLIENT_PORTAL_SESSION_SECRET || process.env.API_HUB_CONSOLE_SESSION_SECRET || '';
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error('Client portal session secret is not configured');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function hashClientPortalPassword(password: string, salt: string) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export function createClientPortalPasswordRecord(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    salt,
    hash: hashClientPortalPassword(password, salt),
  };
}

function portalMetadata(client: SimpleApiClient) {
  const metadata = client.metadata && typeof client.metadata === 'object' && !Array.isArray(client.metadata)
    ? client.metadata as Record<string, unknown>
    : {};
  const portal = metadata.client_portal && typeof metadata.client_portal === 'object' && !Array.isArray(metadata.client_portal)
    ? metadata.client_portal as Record<string, unknown>
    : {};
  return portal;
}

export function findClientByPortalCredentials(store: SimpleApiHubStore, username: unknown, password: unknown) {
  const inputUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const inputPassword = typeof password === 'string' ? password : '';
  if (!inputUsername || !inputPassword || !sessionSecret()) return null;

  for (const client of store.clients) {
    if (client.status !== 'active') continue;
    const portal = portalMetadata(client);
    const configuredUsername = String(portal.username || '').trim().toLowerCase();
    const salt = String(portal.password_salt || '');
    const passwordHash = String(portal.password_hash || '');
    if (!configuredUsername || !salt || !passwordHash) continue;
    if (!safeEqual(inputUsername, configuredUsername)) continue;
    const inputHash = hashClientPortalPassword(inputPassword, salt);
    if (safeEqual(inputHash, passwordHash)) return client;
  }

  return null;
}

export function createClientPortalToken(client: SimpleApiClient) {
  const portal = portalMetadata(client);
  const username = String(portal.username || client.email || client.id);
  const payload: ClientPortalSession = {
    client_id: client.id,
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyClientPortalToken(token?: string | null) {
  if (!token || !sessionSecret()) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  let expectedSignature = '';
  try {
    expectedSignature = signPayload(encodedPayload);
  } catch {
    return null;
  }
  if (!safeEqual(signature, expectedSignature)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ClientPortalSession;
    if (!payload.client_id || Number(payload.exp || 0) <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getClientPortalSession(request: NextRequest) {
  return verifyClientPortalToken(request.cookies.get(API_CLIENT_PORTAL_COOKIE)?.value);
}

export function setClientPortalCookie(response: NextResponse, token: string) {
  response.cookies.set(API_CLIENT_PORTAL_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearClientPortalCookie(response: NextResponse) {
  response.cookies.set(API_CLIENT_PORTAL_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
