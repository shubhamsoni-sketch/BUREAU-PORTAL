-- ============================================================
-- Fix: Seed admin user_profiles row
-- The trigger handle_new_user does NOT fire on direct SQL inserts
-- into auth.users, so we manually insert the profile row here.
-- ============================================================

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the admin user's UUID from auth.users
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin@credittrust.in'
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Insert profile row if it doesn't already exist
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (admin_id, 'admin@credittrust.in', 'Super Admin', 'admin'::public.user_role)
    ON CONFLICT (id) DO UPDATE
      SET role = 'admin'::public.user_role,
          full_name = 'Super Admin';

    RAISE NOTICE 'Admin profile seeded for user id: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users — skipping profile seed';
  END IF;
END $$;
