-- Fix: Ensure lowercase 'paid' exists in invoice_status enum
-- The original enum only had 'Paid' (capital P), 'draft', 'raised'
-- This migration adds lowercase 'paid' for consistency

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'paid'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
  ) THEN
    ALTER TYPE public.invoice_status ADD VALUE 'paid';
  END IF;
END $$;
