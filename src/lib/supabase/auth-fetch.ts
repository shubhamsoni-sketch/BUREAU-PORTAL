import { createClient } from './client';

export async function getAuthHeaders(extraHeaders: HeadersInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(extraHeaders);

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return headers;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = await getAuthHeaders(init.headers);
  const response = await fetch(input, { ...init, headers });

  if (
    typeof window !== 'undefined' &&
    (response.status === 401 || response.status === 403)
  ) {
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
