import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, createAdminClient, requireAdmin } from '@/lib/supabase/admin';
import { createApiKey } from '@/lib/api-hub/keys';

const DEFAULT_PRODUCT = {
  code: 'cibil.consumer_score',
  name: 'Bureau API',
  description: 'Credit bureau report and score API through the whitelisted gateway.',
  default_price: 25,
  default_sandbox_credits: 10,
  is_active: true,
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

async function adminContext(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return auth;
  return auth;
}

async function ensureDefaultProduct(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from('api_products')
    .upsert(DEFAULT_PRODUCT, { onConflict: 'code' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await adminContext(request);
    if ('error' in auth) return jsonError(auth.error || 'Unauthorized', auth.status);

    const { supabase } = auth;
    await ensureDefaultProduct(supabase);

    const [clients, products, keys, wallets, logs, transactions, gatewaySettings] = await Promise.all([
      supabase.from('api_clients').select('*').order('created_at', { ascending: false }),
      supabase.from('api_products').select('*').order('name', { ascending: true }),
      supabase.from('api_keys').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('api_wallets').select('*').order('updated_at', { ascending: false }),
      supabase.from('api_usage_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('api_wallet_transactions').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('api_gateway_settings').select('*').order('updated_at', { ascending: false }).limit(1),
    ]);

    const firstError = [clients, products, keys, wallets, logs, transactions, gatewaySettings].find((res) => res.error)?.error;
    if (firstError) return jsonError(firstError.message, 500);

    return NextResponse.json({
      success: true,
      clients: clients.data ?? [],
      products: products.data ?? [],
      keys: keys.data ?? [],
      wallets: wallets.data ?? [],
      logs: logs.data ?? [],
      transactions: transactions.data ?? [],
      gateway: gatewaySettings.data?.[0] ?? null,
    });
  } catch (error) {
    console.error('[admin-api-hub] GET failed:', error);
    return jsonError('Unable to load API Hub data', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await adminContext(request);
    if ('error' in auth) return jsonError(auth.error || 'Unauthorized', auth.status);

    const { supabase, user } = auth;
    const body = await request.json();
    const action = body?.action;

    const product = await ensureDefaultProduct(supabase);

    if (action === 'create_client') {
      const name = String(body.name || '').trim();
      if (!name) return jsonError('Client name is required');

      const { data: client, error: clientError } = await supabase
        .from('api_clients')
        .insert({
          name,
          company_name: String(body.company_name || '').trim() || null,
          contact_name: String(body.contact_name || '').trim() || null,
          email: String(body.email || '').trim() || null,
          mobile: String(body.mobile || '').trim() || null,
          status: body.status === 'suspended' ? 'suspended' : 'active',
          notes: String(body.notes || '').trim() || null,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (clientError) return jsonError(clientError.message, 500);

      const sandboxCredits = Number.isFinite(Number(body.sandbox_credits))
        ? Math.max(0, Number(body.sandbox_credits))
        : Number(product.default_sandbox_credits ?? 10);

      const { error: walletError } = await supabase
        .from('api_wallets')
        .insert({
          client_id: client.id,
          live_balance: 0,
          sandbox_credits: sandboxCredits,
          low_balance_threshold: 100,
        });

      if (walletError) return jsonError(walletError.message, 500);

      if (sandboxCredits > 0) {
        await supabase.from('api_wallet_transactions').insert({
          client_id: client.id,
          type: 'credit',
          environment: 'sandbox',
          amount: 0,
          sandbox_credits: sandboxCredits,
          description: 'Initial sandbox credits',
          created_by: user.id,
        });
      }

      return NextResponse.json({ success: true, client });
    }

    if (action === 'generate_key') {
      const clientId = String(body.client_id || '').trim();
      const environment = body.environment === 'live' ? 'live' : 'sandbox';
      if (!clientId) return jsonError('Client is required');

      const { data: client, error: clientError } = await supabase
        .from('api_clients')
        .select('id,status')
        .eq('id', clientId)
        .maybeSingle();
      if (clientError) return jsonError(clientError.message, 500);
      if (!client || client.status !== 'active') return jsonError('Active client not found', 404);

      const generated = createApiKey(environment);
      const { data: apiKey, error: keyError } = await supabase
        .from('api_keys')
        .insert({
          client_id: clientId,
          product_id: body.product_id || product.id,
          label: String(body.label || '').trim() || `${environment.toUpperCase()} key`,
          key_prefix: generated.prefix,
          key_hash: generated.hash,
          environment,
          status: 'active',
          rate_limit_per_minute: Number(body.rate_limit_per_minute) || 60,
          created_by: user.id,
        })
        .select('*')
        .single();

      if (keyError) return jsonError(keyError.message, 500);

      return NextResponse.json({ success: true, api_key: apiKey, secret_key: generated.key });
    }

    if (action === 'revoke_key') {
      const keyId = String(body.key_id || '').trim();
      if (!keyId) return jsonError('Key id is required');

      const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', keyId);

      if (error) return jsonError(error.message, 500);
      return NextResponse.json({ success: true });
    }

    if (action === 'add_credits') {
      const clientId = String(body.client_id || '').trim();
      const environment = body.environment === 'live' ? 'live' : 'sandbox';
      if (!clientId) return jsonError('Client is required');

      const { data: wallet, error: walletError } = await supabase
        .from('api_wallets')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (walletError) return jsonError(walletError.message, 500);
      if (!wallet) return jsonError('Wallet not found', 404);

      const amount = environment === 'live' ? Math.max(0, Number(body.amount || 0)) : 0;
      const sandboxCredits = environment === 'sandbox' ? Math.max(0, Number(body.sandbox_credits || 0)) : 0;
      if (environment === 'live' && amount <= 0) return jsonError('Live amount must be greater than zero');
      if (environment === 'sandbox' && sandboxCredits <= 0) return jsonError('Sandbox credits must be greater than zero');

      const updatePayload = environment === 'live'
        ? { live_balance: Number(wallet.live_balance || 0) + amount, updated_at: new Date().toISOString() }
        : { sandbox_credits: Number(wallet.sandbox_credits || 0) + sandboxCredits, updated_at: new Date().toISOString() };

      const { error: updateError } = await supabase
        .from('api_wallets')
        .update(updatePayload)
        .eq('id', wallet.id);

      if (updateError) return jsonError(updateError.message, 500);

      await supabase.from('api_wallet_transactions').insert({
        client_id: clientId,
        type: 'credit',
        environment,
        amount,
        sandbox_credits: sandboxCredits,
        description: String(body.description || '').trim() || 'Manual admin credit',
        created_by: user.id,
      });

      return NextResponse.json({ success: true });
    }

    return jsonError('Unknown API Hub action');
  } catch (error) {
    console.error('[admin-api-hub] POST failed:', error);
    return jsonError('Unable to process API Hub request', 500);
  }
}
