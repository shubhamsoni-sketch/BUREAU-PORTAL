-- Invoice Management System Migration
-- Tables: invoices, invoice_settings

-- ─── Types ────────────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS public.invoice_status CASCADE;
CREATE TYPE public.invoice_status AS ENUM ('Paid', 'Pending', 'Cancelled');

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'CIBILysis',
  company_address TEXT NOT NULL DEFAULT '',
  gst_number TEXT DEFAULT NULL,
  logo_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  partner_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_email TEXT NOT NULL DEFAULT '',
  amount NUMERIC(10, 2) NOT NULL,
  credits_added INTEGER NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'UPI',
  status public.invoice_status NOT NULL DEFAULT 'Paid',
  transaction_ref TEXT DEFAULT NULL,
  issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON public.invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON public.invoices(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "open_access_invoices" ON public.invoices;
CREATE POLICY "open_access_invoices" ON public.invoices FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_invoice_settings" ON public.invoice_settings;
CREATE POLICY "open_access_invoice_settings" ON public.invoice_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- ─── Seed: Invoice Settings ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.invoice_settings LIMIT 1) THEN
    INSERT INTO public.invoice_settings (company_name, company_address, gst_number)
    VALUES (
      'CIBILysis Financial Services Pvt. Ltd.',
      '301, Pinnacle Business Park, Andheri East, Mumbai - 400069, Maharashtra, India',
      '27AABCC1234D1Z5'
    );
  END IF;
END $$;

-- ─── Seed: Invoices ───────────────────────────────────────────────────────────
DO $$
BEGIN
  INSERT INTO public.invoices (invoice_number, partner_id, partner_name, partner_email, amount, credits_added, payment_mode, status, transaction_ref, issued_at)
  VALUES
    ('INV-2026-0001', 'partner-001', 'Rajesh Kumar Sharma', 'rajesh.sharma@creditdsa.in', 5000, 5000, 'UPI', 'Paid', 'UPI2026040100123', '2026-04-01 10:15:00+00'),
    ('INV-2026-0002', 'partner-002', 'Priya Nair', 'priya.nair@finbridge.co.in', 3000, 3000, 'Net Banking', 'Paid', 'NB2026033100456', '2026-03-31 14:30:00+00'),
    ('INV-2026-0003', 'partner-006', 'Kavitha Rajan', 'kavitha.rajan@tncredit.in', 10000, 10000, 'UPI', 'Paid', 'UPI2026032900789', '2026-03-29 16:20:00+00'),
    ('INV-2026-0004', 'partner-007', 'Deepak Patel', 'deepak.patel@gujdsa.in', 2000, 2000, 'Card', 'Paid', 'CARD2026032600321', '2026-03-26 11:55:00+00'),
    ('INV-2026-0005', 'partner-004', 'Sunita Agarwal', 'sunita.agarwal@creditmitra.in', 1000, 1000, 'UPI', 'Paid', 'UPI2026032400654', '2026-03-24 09:30:00+00'),
    ('INV-2026-0006', 'partner-001', 'Rajesh Kumar Sharma', 'rajesh.sharma@creditdsa.in', 3000, 3000, 'Card', 'Paid', 'CARD2026031500222', '2026-03-15 11:30:00+00'),
    ('INV-2026-0007', 'partner-005', 'Mohammed Farhan', 'm.farhan@dsahub.co.in', 2000, 2000, 'UPI', 'Paid', 'UPI2026021400111', '2026-02-14 10:00:00+00')
  ON CONFLICT (invoice_number) DO NOTHING;
END $$;
