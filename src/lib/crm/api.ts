'use client';

import { createClient } from '@/lib/supabase/client';

export async function crmFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);

  if (data.session?.access_token && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${data.session.access_token}`);
  }
  if (data.session?.user?.id && !headers.has('x-crm-user-id')) {
    headers.set('x-crm-user-id', data.session.user.id);
  }

  return fetch(input, { ...init, headers });
}
