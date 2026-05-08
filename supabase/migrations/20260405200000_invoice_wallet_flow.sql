-- Invoice Wallet Flow Migration
-- Extends invoice_status enum with draft/raised states
-- Adds notes column to invoices for admin reference

-- ─── Extend invoice_status enum ───────────────────────────────────────────────
-- PostgreSQL requires adding enum values via ALTER TYPE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'draft'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
  ) THEN
    ALTER TYPE public.invoice_status ADD VALUE 'draft';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'raised'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
  ) THEN
    ALTER TYPE public.invoice_status ADD VALUE 'raised';
  END IF;
END $$;

-- ─── Add notes column to invoices ─────────────────────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- ─── Add source_transaction_id to invoices for traceability ───────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS source_transaction_id UUID DEFAULT NULL;

-- ─── Index for status filtering ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
