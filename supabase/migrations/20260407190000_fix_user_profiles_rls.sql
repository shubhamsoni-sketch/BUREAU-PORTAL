-- ============================================================
-- Fix RLS SELECT policy on user_profiles so partners can always
-- read their own row (previously the policy evaluated is_admin()
-- which could cause empty results for partner rows in some cases).
-- Also fix the INSERT policy to allow service-role triggers to
-- create rows without requiring is_admin() check.
-- ============================================================

-- Drop and recreate the SELECT policy with a simpler, reliable expression
DROP POLICY IF EXISTS "users_view_own_profile" ON public.user_profiles;
CREATE POLICY "users_view_own_profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Allow service role to insert/update profiles (for triggers and admin APIs)
DROP POLICY IF EXISTS "service_role_manage_profiles" ON public.user_profiles;
CREATE POLICY "service_role_manage_profiles"
  ON public.user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
