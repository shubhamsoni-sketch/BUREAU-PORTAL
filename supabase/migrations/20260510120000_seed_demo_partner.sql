-- ============================================================
-- Seed demo partner account for local demos and fresh setups
-- Demo login:
--   email: user@demo.in
--   password: Demo@2026
-- Change or remove this account before production use.
-- ============================================================

DO $$
DECLARE
  demo_user_id UUID;
  demo_partner_id UUID;
  demo_agreement_id UUID := 'b8a7f8cc-f434-4743-b5d8-a85fb69eac3f';
BEGIN
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'user@demo.in'
  LIMIT 1;

  IF demo_user_id IS NULL THEN
    demo_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmed_at,
      created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous,
      confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at,
      email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current,
      email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at,
      phone, phone_change, phone_change_token, phone_change_sent_at
    ) VALUES (
      demo_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'user@demo.in',
      crypt('Demo@2026', gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      now(),
      jsonb_build_object('full_name', 'Demo Partner', 'role', 'partner'),
      jsonb_build_object('role', 'partner', 'provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false,
      '', null, '', null, '', '', null, '', 0, '', null,
      null, '', '', null
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('Demo@2026', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmed_at = COALESCE(confirmed_at, now()),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "partner", "provider": "email", "providers": ["email"]}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "partner", "full_name": "Demo Partner"}'::jsonb,
      updated_at = now()
    WHERE id = demo_user_id;
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, role, is_temp_password)
  VALUES (demo_user_id, 'user@demo.in', 'Demo Partner', 'partner'::public.user_role, false)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_temp_password = false;

  INSERT INTO public.partners (
    user_id,
    name,
    company_name,
    mobile,
    email,
    city,
    partner_code,
    status,
    pricing_plan,
    wallet_balance,
    reports_pulled,
    authorized_person,
    gst_number,
    address,
    updated_at
  )
  VALUES (
    demo_user_id,
    'Demo Partner',
    'Demo Bureau Partner',
    '9999999999',
    'user@demo.in',
    'Indore',
    'DEMO001',
    'approved'::public.partner_status,
    'Premium',
    100000,
    0,
    '',
    '',
    '',
    now()
  )
  ON CONFLICT (email) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        company_name = EXCLUDED.company_name,
        mobile = EXCLUDED.mobile,
        city = EXCLUDED.city,
        partner_code = EXCLUDED.partner_code,
        status = EXCLUDED.status,
        pricing_plan = EXCLUDED.pricing_plan,
        wallet_balance = EXCLUDED.wallet_balance,
        updated_at = now()
  RETURNING id INTO demo_partner_id;

  INSERT INTO public.wallet_balances (
    partner_id,
    balance,
    total_recharged,
    total_deducted,
    last_transaction_at,
    updated_at
  )
  VALUES (
    demo_partner_id,
    100000,
    100000,
    0,
    now(),
    now()
  )
  ON CONFLICT (partner_id) DO UPDATE
    SET balance = EXCLUDED.balance,
        total_recharged = EXCLUDED.total_recharged,
        total_deducted = EXCLUDED.total_deducted,
        last_transaction_at = EXCLUDED.last_transaction_at,
        updated_at = now();

  INSERT INTO public.partner_commercials (
    partner_id,
    pricing_plan,
    subscription_type,
    credit_rate,
    bundled_credits,
    credit_limit,
    addon_credits,
    notes,
    updated_at
  )
  VALUES (
    demo_partner_id,
    'Premium'::public.pricing_plan,
    'prepaid'::public.subscription_type,
    10.0000,
    0,
    100000,
    0,
    'Seeded demo partner commercial setup',
    now()
  )
  ON CONFLICT (partner_id) DO UPDATE
    SET pricing_plan = EXCLUDED.pricing_plan,
        subscription_type = EXCLUDED.subscription_type,
        credit_rate = EXCLUDED.credit_rate,
        credit_limit = EXCLUDED.credit_limit,
        notes = EXCLUDED.notes,
        updated_at = now();

  INSERT INTO public.partner_agreements (
    id,
    partner_id,
    user_id,
    agreement_name,
    file_path,
    status,
    assigned_at,
    signed_at,
    signed_ip,
    signed_user_agent,
    updated_at
  )
  VALUES (
    demo_agreement_id,
    demo_partner_id,
    demo_user_id,
    'Demo Partner Agreement',
    'demo/demo-partner-agreement.pdf',
    'signed',
    now(),
    now(),
    '127.0.0.1',
    'Seeded demo agreement',
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET partner_id = EXCLUDED.partner_id,
        user_id = EXCLUDED.user_id,
        agreement_name = EXCLUDED.agreement_name,
        status = EXCLUDED.status,
        signed_at = EXCLUDED.signed_at,
        updated_at = now();

  RAISE NOTICE 'Demo partner ensured: user@demo.in / DEMO001';
END $$;
