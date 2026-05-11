import process from 'node:process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx);
  const value = trimmed.slice(idx + 1);
  if (!process.env[key]) process.env[key] = value;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = 'user@demo.in';
const DEMO_PASSWORD = 'Demo@2026';
const DEMO_BALANCE = 100000;

async function findUserByEmail(email) {
  let page = 1;
  while (page < 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

async function main() {
  const existing = await findUserByEmail(DEMO_EMAIL);
  const userResult = existing
    ? await supabase.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Demo Partner', role: 'partner' },
        app_metadata: { role: 'partner' },
      })
    : await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Demo Partner', role: 'partner' },
        app_metadata: { role: 'partner' },
      });

  if (userResult.error) throw userResult.error;
  const user = userResult.data.user;
  if (!user) throw new Error('Demo user was not returned by Supabase Auth');

  await supabase.from('user_profiles').upsert({
    id: user.id,
    email: DEMO_EMAIL,
    full_name: 'Demo Partner',
    role: 'partner',
    is_temp_password: false,
  });

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .upsert(
      {
        user_id: user.id,
        name: 'Demo Partner',
        company_name: 'Demo Bureau Partner',
        mobile: '9999999999',
        email: DEMO_EMAIL,
        city: 'Indore',
        partner_code: 'DEMO001',
        status: 'approved',
        pricing_plan: 'Premium',
        wallet_balance: DEMO_BALANCE,
        reports_pulled: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single();

  if (partnerError) throw partnerError;
  const partnerId = partner.id;

  await supabase.from('partner_commercials').upsert(
    {
      partner_id: partnerId,
      pricing_plan: 'Premium',
      subscription_type: 'prepaid',
      credit_rate: 10,
      consumer_credit_rate: 10,
      commercial_credit_rate: 15,
      bundled_credits: 0,
      credit_limit: DEMO_BALANCE,
      addon_credits: DEMO_BALANCE,
      notes: 'Shared demo account pricing.',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'partner_id' }
  );

  await supabase
    .from('wallet_transactions')
    .delete()
    .eq('partner_id', partnerId)
    .contains('metadata', { demo: true });

  await supabase.from('wallet_transactions').insert({
    partner_id: partnerId,
    type: 'credit',
    amount: DEMO_BALANCE,
    description: 'Demo wallet opening balance',
    transaction_type: 'manual_adjustment',
    running_balance: DEMO_BALANCE,
    status: 'confirmed',
    metadata: { demo: true, seed: true },
  });

  await supabase.from('wallet_balances').upsert(
    {
      partner_id: partnerId,
      balance: DEMO_BALANCE,
      total_recharged: DEMO_BALANCE,
      total_deducted: 0,
      last_transaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'partner_id' }
  );

  const { data: existingAgreement } = await supabase
    .from('partner_agreements')
    .select('id')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const agreementPayload = {
      partner_id: partnerId,
      user_id: user.id,
      agreement_name: 'Demo Partner Agreement',
      file_path: 'demo/demo-partner-agreement.pdf',
      status: 'signed',
      assigned_at: new Date().toISOString(),
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

  if (existingAgreement?.id) {
    await supabase.from('partner_agreements').update(agreementPayload).eq('id', existingAgreement.id);
  } else {
    await supabase.from('partner_agreements').insert(agreementPayload);
  }

  console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
