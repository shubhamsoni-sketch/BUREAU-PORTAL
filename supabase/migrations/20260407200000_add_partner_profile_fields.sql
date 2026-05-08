-- Add authorized_person, gst_number, address fields to partners table
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS authorized_person text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gst_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
