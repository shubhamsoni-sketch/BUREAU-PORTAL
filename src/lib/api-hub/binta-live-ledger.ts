import type { createAdminClient } from '@/lib/supabase/admin';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

type Reservation = {
  status: 'reserved' | 'success' | 'failed';
  request_id: string;
  balance?: number;
  response?: unknown;
};

function fail(operation: string, error: { message: string } | null) {
  if (error) throw new Error(`Binta live ${operation} failed: ${error.message}`);
}

export async function getBintaLiveBalance(supabase: SupabaseAdmin, clientId: string) {
  const { data, error } = await supabase.from('api_hub_live_wallets')
    .select('credits').eq('client_id', clientId).maybeSingle();
  fail('balance lookup', error);
  return data ? Number(data.credits) : 0;
}

export async function listBintaLiveBalances(supabase: SupabaseAdmin, clientIds: string[]) {
  if (!clientIds.length) return new Map<string, number>();
  const { data, error } = await supabase.from('api_hub_live_wallets')
    .select('client_id, credits').in('client_id', clientIds);
  fail('balance list', error);
  return new Map((data || []).map((item) => [String(item.client_id), Number(item.credits)]));
}

export async function addBintaLiveCredits(supabase: SupabaseAdmin, clientId: string, credits: number) {
  const { data, error } = await supabase.rpc('api_hub_live_add_credits', {
    p_client_id: clientId,
    p_amount: credits,
  });
  fail('credit allocation', error);
  return Number(data);
}

export async function reserveBintaLiveRequest(supabase: SupabaseAdmin, params: {
  clientId: string;
  requestId: string;
  idempotencyKey: string | null;
  bodySha256: string;
  cost: number;
}): Promise<Reservation> {
  const { data, error } = await supabase.rpc('api_hub_live_reserve', {
    p_client_id: params.clientId,
    p_request_id: params.requestId,
    p_idempotency_key: params.idempotencyKey,
    p_body_sha256: params.bodySha256,
    p_cost: params.cost,
  });
  fail('reservation', error);
  if (!data || typeof data !== 'object' || !['reserved', 'success', 'failed'].includes(data.status)) {
    throw new Error('Binta live reservation returned an invalid state');
  }
  return data as Reservation;
}

export async function completeBintaLiveRequest(supabase: SupabaseAdmin, params: {
  requestId: string;
  requestJson: unknown;
  responseJson: unknown;
  apiId: string;
  keyId: string;
  maskedPan: string;
  maskedMobile: string;
  responseTimeMs: number;
  ipAddress: string;
}) {
  const { data, error } = await supabase.rpc('api_hub_live_complete', {
    p_request_id: params.requestId,
    p_request_json: params.requestJson,
    p_response_json: params.responseJson,
    p_api_id: params.apiId,
    p_key_id: params.keyId,
    p_masked_pan: params.maskedPan,
    p_masked_mobile: params.maskedMobile,
    p_response_time_ms: params.responseTimeMs,
    p_ip_address: params.ipAddress,
  });
  fail('archive and debit finalization', error);
  return Number(data);
}

export async function failBintaLiveRequest(supabase: SupabaseAdmin, params: {
  requestId: string;
  apiId: string;
  keyId: string;
  message: string;
  httpStatus: number;
  providerStatus: number | null;
}) {
  const { data, error } = await supabase.rpc('api_hub_live_fail', {
    p_request_id: params.requestId,
    p_api_id: params.apiId,
    p_key_id: params.keyId,
    p_error: params.message,
    p_http_status: params.httpStatus,
    p_provider_status: params.providerStatus,
  });
  fail('refund', error);
  return Number(data);
}
