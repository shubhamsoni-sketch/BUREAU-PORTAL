import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientPortalSession } from '@/lib/api-hub/client-portal-auth';
import { getApiHubStore } from '@/lib/api-hub/simple-store';

export async function GET(request: NextRequest) {
  const session = getClientPortalSession(request);
  if (!session) return NextResponse.json({ success: true, authenticated: false });

  const supabase = createAdminClient();
  const { store } = await getApiHubStore(supabase);
  const client = store.clients.find((item) => item.id === session.client_id && item.status === 'active');
  return NextResponse.json({
    success: true,
    authenticated: Boolean(client),
    client: client ? {
      id: client.id,
      name: client.name,
      legal_name: client.company_name || client.name,
    } : null,
  });
}
