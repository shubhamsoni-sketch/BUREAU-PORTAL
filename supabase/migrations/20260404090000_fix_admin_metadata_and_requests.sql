-- ============================================================
-- credit-trust: Fix admin app_metadata role + partner_requests email unique
-- ============================================================

-- 1. Add unique constraint on partner_requests.email to prevent duplicate submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partner_requests_email_unique'
    AND conrelid = 'public.partner_requests'::regclass
  ) THEN
    ALTER TABLE public.partner_requests ADD CONSTRAINT partner_requests_email_unique UNIQUE (email);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add unique constraint on partner_requests.email: %', SQLERRM;
END $$;

-- 2. Ensure admin user has role in BOTH user_metadata AND app_metadata
-- app_metadata is what the API routes check first (more secure, not user-editable)
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin@credittrust.in'
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Update raw_app_meta_data to include role: admin
    UPDATE auth.users
    SET
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "full_name": "Super Admin"}'::jsonb,
      updated_at = now()
    WHERE id = admin_id;

    -- Ensure user_profiles row has admin role
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (admin_id, 'admin@credittrust.in', 'Super Admin', 'admin'::public.user_role)
    ON CONFLICT (id) DO UPDATE
      SET role = 'admin'::public.user_role,
          full_name = 'Super Admin';

    RAISE NOTICE 'Admin app_metadata and profile updated for id: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user not found — skipping';
  END IF;
END $$;

-- 3. Update is_admin() function to also check app_metadata (more reliable)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin'
      OR raw_user_meta_data->>'role' = 'admin'
    )
  );
$$;
