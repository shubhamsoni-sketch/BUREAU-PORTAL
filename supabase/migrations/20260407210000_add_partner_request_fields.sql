-- Add new fields to partner_requests table for enhanced partner registration
ALTER TABLE public.partner_requests
  ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pin_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gst TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT '';
