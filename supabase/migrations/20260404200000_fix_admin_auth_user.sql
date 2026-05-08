-- ============================================================
-- Fix: Create or update admin auth user with correct password
-- Ensures admin@cibilysis.in exists in auth.users with Admin@2026
-- ============================================================

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin@cibilysis.in'
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Admin user exists — update password and confirm email
    UPDATE auth.users
    SET
      encrypted_password = crypt('Admin@2026', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmed_at = COALESCE(confirmed_at, now()),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin", "provider": "email", "providers": ["email"]}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "full_name": "Super Admin"}'::jsonb,
      updated_at = now()
    WHERE id = admin_id;

    RAISE NOTICE 'Admin user password updated for id: %', admin_id;
  ELSE
    -- Admin user does not exist — create it
    admin_id := gen_random_uuid();

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
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@cibilysis.in',
      crypt('Admin@2026', gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      now(),
      jsonb_build_object('full_name', 'Super Admin', 'role', 'admin'),
      jsonb_build_object('role', 'admin', 'provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false,
      '', null, '', null, '', '', null, '', 0, '', null,
      null, '', '', null
    );

    RAISE NOTICE 'Admin user created with id: %', admin_id;
  END IF;

  -- Ensure user_profiles row exists with admin role
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (admin_id, 'admin@cibilysis.in', 'Super Admin', 'admin'::public.user_role)
  ON CONFLICT (id) DO UPDATE
    SET role = 'admin'::public.user_role,
        full_name = 'Super Admin',
        email = 'admin@cibilysis.in';

  RAISE NOTICE 'Admin profile ensured for id: %', admin_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin auth fix failed: %', SQLERRM;
END $$;
