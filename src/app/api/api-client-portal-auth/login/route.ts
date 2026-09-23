import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClientPortalToken, findClientByPortalCredentials, setClientPortalCookie } from '@/lib/api-hub/client-portal-auth';
import { getApiHubStore } from '@/lib/api-hub/simple-store';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { store } = await getApiHubStore(supabase);
  const client = findClientByPortalCredentials(store, body.username, body.password);
  if (!client) {
    return NextResponse.json({ success: false, error: 'Invalid client portal credentials' }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    client: {
      id: client.id,
      name: client.name,
      legal_name: client.company_name || client.name,
    },
  });
  setClientPortalCookie(response, createClientPortalToken(client));
  return response;
}
