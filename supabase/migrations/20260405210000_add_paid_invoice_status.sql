-- Migration: Add 'paid', 'draft', 'raised' status support for invoices (prepaid model)
-- No due_date or overdue status needed

DO $$
BEGIN
  -- Add 'draft' to enum if not already present
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
  -- Add 'raised' to enum if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'raised'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
  ) THEN
    ALTER TYPE public.invoice_status ADD VALUE 'raised';
  END IF;
END $$;

DO $$
BEGIN
  -- Add 'paid' (lowercase) to enum if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'paid'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
  ) THEN
    ALTER TYPE public.invoice_status ADD VALUE 'paid';
  END IF;
END $$;

-- Update any existing 'Paid' (capital P) records to lowercase 'paid' for consistency
UPDATE public.invoices SET status = 'paid' WHERE status = 'Paid';
