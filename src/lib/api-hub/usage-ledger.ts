import { NextRequest } from 'next/server';

type SupabaseAdmin = ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>;

export type ApiUsageLedgerEntry = {
  id?: string;
  request_id: string;
  client_id?: string | null;
  api_id?: string | null;
  key_id?: string | null;
  api_code?: string | null;
  environment?: string;
  method?: string;
  request_path?: string | null;
  status: 'success' | 'failed';
  http_status?: number | null;
  provider_status?: number | null;
  credits_deducted?: number;
  balance_after?: number | null;
  masked_pan?: string | null;
  masked_mobile?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  response_time_ms?: number | null;
  provider_ref?: string | null;
  error_message?: string | null;
  request_json?: unknown;
  response_json?: unknown;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

function extractProviderRef(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  for (const key of ['request_id', 'requestId', 'reportId', 'report_id', 'reference_id', 'transaction_id']) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  for (const nested of Object.values(record)) {
    const candidate = extractProviderRef(nested);
    if (candidate) return candidate;
  }
  return null;
}

export function requestEvidence(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return {
    ip_address: forwarded || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip'),
    user_agent: request.headers.get('user-agent'),
    method: request.method,
    request_path: request.nextUrl.pathname,
  };
}

export async function appendApiUsageLedger(supabase: SupabaseAdmin, entry: ApiUsageLedgerEntry) {
  const payload = {
    ...entry,
    provider_ref: entry.provider_ref || extractProviderRef(entry.response_json),
    credits_deducted: Number(entry.credits_deducted || 0),
    created_at: entry.created_at || new Date().toISOString(),
  };
  const { error } = await supabase.from('api_hub_usage_ledger').insert(payload);
  if (error) throw new Error(`Unable to persist API usage ledger: ${error.message}`);
}

export async function listApiUsageLedger(
  supabase: SupabaseAdmin,
  options: { page: number; pageSize: number; clientId?: string; status?: string },
) {
  const from = (options.page - 1) * options.pageSize;
  let query = supabase
    .from('api_hub_usage_ledger')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + options.pageSize - 1);
  if (options.clientId) query = query.eq('client_id', options.clientId);
  if (options.status === 'success' || options.status === 'failed') query = query.eq('status', options.status);
  const { data, error, count } = await query;
  if (error) throw new Error(`Unable to load API usage ledger: ${error.message}`);
  return { rows: data || [], total: count || 0 };
}

export async function exportApiUsageLedger(supabase: SupabaseAdmin) {
  const rows: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('api_hub_usage_ledger')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Unable to export API usage ledger: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}
