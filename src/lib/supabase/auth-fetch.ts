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

function authRedirectTarget() {
  const path = window.location.pathname;
  return path.startsWith('/admin') ? '/admin' : '/partner-login';
}

function shouldSkipAuthRedirect(input: RequestInfo | URL) {
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
  if (currentPathname.startsWith('/client') || currentPathname.startsWith('/api-client-portal')) {
    return true;
  }

  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.pathname
      : input.url;
  const pathname = (() => {
    try {
      return new URL(url, window.location.origin).pathname;
    } catch {
      return url;
    }
  })();
  return pathname.startsWith('/api/api-client-portal')
    || pathname.startsWith('/api/api-client-portal-auth')
    || pathname.startsWith('/api/hub-console-auth');
}

function clearAuthStorageOnly() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('sb-') && key.includes('auth-token'))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable in restricted browser contexts.
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

  if (typeof window !== 'undefined' && response.status === 401 && !shouldSkipAuthRedirect(input)) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

    // If there is no browser session, send the user to login. Do not clear the
    // whole browser storage because dashboard widgets use sessionStorage caches.
    if (!session?.access_token) {
      clearAuthStorageOnly();
      const target = authRedirectTarget();
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
      return response;
    }

    const { data } = await supabase.auth.getUser(session.access_token).catch(() => ({ data: { user: null } }));
    if (!data.user) {
      await supabase.auth.signOut().catch(() => undefined);
      clearAuthStorageOnly();
      const target = authRedirectTarget();
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
    }
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
