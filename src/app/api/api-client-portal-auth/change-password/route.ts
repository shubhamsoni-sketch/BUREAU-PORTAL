import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createClientPortalPasswordRecord,
  getClientPortalSession,
  verifyClientPortalPassword,
} from '@/lib/api-hub/client-portal-auth';
import { getApiHubStore, saveApiHubStore } from '@/lib/api-hub/simple-store';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  const session = getClientPortalSession(request);
  if (!session?.client_id) return jsonError('Client portal login is required', 401);

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return jsonError('Request body must be valid JSON');
  }

  const currentPassword = typeof body.current_password === 'string' ? body.current_password : '';
  const newPassword = typeof body.new_password === 'string' ? body.new_password : '';
  const confirmPassword = typeof body.confirm_password === 'string' ? body.confirm_password : '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    return jsonError('Current password, new password and confirmation are required');
  }
  if (newPassword !== confirmPassword) return jsonError('New password and confirmation do not match');
  if (newPassword.length < 10) return jsonError('New password must be at least 10 characters');
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return jsonError('New password must include uppercase, lowercase and number');
  }
  if (newPassword === currentPassword) return jsonError('New password must be different from current password');

  const supabase = createAdminClient();
  const { rowId, store } = await getApiHubStore(supabase);
  const clientIndex = store.clients.findIndex((client) => client.id === session.client_id && client.status === 'active');
  if (clientIndex < 0) return jsonError('Client is inactive or unavailable', 403);

  const client = store.clients[clientIndex];
  if (!verifyClientPortalPassword(client, currentPassword)) {
    return jsonError('Current password is incorrect', 401);
  }

  const passwordRecord = createClientPortalPasswordRecord(newPassword);
  const metadata = client.metadata && typeof client.metadata === 'object' && !Array.isArray(client.metadata)
    ? client.metadata
    : {};
  const portal = metadata.client_portal && typeof metadata.client_portal === 'object' && !Array.isArray(metadata.client_portal)
    ? metadata.client_portal as Record<string, unknown>
    : {};

  store.clients[clientIndex] = {
    ...client,
    metadata: {
      ...metadata,
      client_portal: {
        ...portal,
        password_salt: passwordRecord.salt,
        password_hash: passwordRecord.hash,
        password_changed_at: new Date().toISOString(),
      },
    },
    updated_at: new Date().toISOString(),
  };

  await saveApiHubStore(supabase, rowId, store);
  return NextResponse.json({ success: true });
}
