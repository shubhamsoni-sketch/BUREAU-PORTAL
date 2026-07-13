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
  return fetch(input, { ...init, headers });
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
