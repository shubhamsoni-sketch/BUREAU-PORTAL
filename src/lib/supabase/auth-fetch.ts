import { AUTH_STORAGE_KEY, createClient } from './client';

function timeout<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function tokenFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      null
    );
  } catch {
    return null;
  }
}

export async function getAuthHeaders(extraHeaders: HeadersInit = {}) {
  const supabase = createClient();
  const result = await Promise.race([
    supabase.auth.getSession().catch(() => null),
    timeout(2500, null),
  ]);
  const session = result && 'data' in result ? result.data.session : null;
  const headers = new Headers(extraHeaders);
  const accessToken = session?.access_token || tokenFromStorage();

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

type AuthFetchInit = RequestInit & {
  timeoutMs?: number;
};

function abortWithReason(controller: AbortController, reason: string) {
  try {
    controller.abort(new DOMException(reason, 'TimeoutError'));
  } catch {
    controller.abort(reason);
  }
}

export async function authFetch(input: RequestInfo | URL, init: AuthFetchInit = {}) {
  const headers = await getAuthHeaders(init.headers);
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 45000;
  const timer = setTimeout(
    () => abortWithReason(controller, `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`),
    timeoutMs
  );
  const { timeoutMs: _timeoutMs, ...fetchInit } = init;
  const response = await fetch(input, {
    ...fetchInit,
    headers,
    signal: init.signal || controller.signal,
  }).finally(() => clearTimeout(timer));

  if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => undefined);
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
    const path = window.location.pathname;
    window.location.href = path.startsWith('/admin') ? '/admin' : '/partner-login';
  }

  return response;
}

export async function downloadAuthenticatedFile(url: string, filename: string) {
  const response = await authFetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Unable to download file');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
