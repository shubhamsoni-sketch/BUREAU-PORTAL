-- ============================================================
-- Add is_temp_password flag to user_profiles
-- ============================================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_temp_password BOOLEAN NOT NULL DEFAULT false;
