-- Bureau Pulls table for storing all CIBIL report pull history
CREATE TABLE IF NOT EXISTS public.bureau_pulls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'consumer', -- 'consumer' | 'commercial'
  status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'failed'
  
  -- Customer identifiers
  member_ref TEXT, -- auto-generated unique reference (e.g. n70762456)
  pan TEXT, -- entered by partner at pull time
  customer_name TEXT,
  
  -- Bureau response fields
  credit_score INTEGER,
  occupation_code TEXT, -- Occ
  gender TEXT,
  state TEXT,
  dob TEXT,
  income TEXT,
  
  -- Trade line summary
  total_trades INTEGER,
  active_trade_lines INTEGER,
  loan_types TEXT, -- comma-separated e.g. "Consumer Loan, Credit Card"
  
  -- Risk indicators
  dpd_tag TEXT, -- LOW / MED / HIGH
  current_balance NUMERIC,
  overdue_amount NUMERIC,
  total_enquiries INTEGER,
  
  -- Raw bureau JSON response
  raw_json JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  amount_deducted NUMERIC DEFAULT 0,
  error_message TEXT,
  report_id TEXT,
  bureau TEXT DEFAULT 'CIBIL',
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bureau_pulls_partner_id ON public.bureau_pulls(partner_id);
CREATE INDEX IF NOT EXISTS idx_bureau_pulls_created_at ON public.bureau_pulls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bureau_pulls_report_type ON public.bureau_pulls(report_type);
CREATE INDEX IF NOT EXISTS idx_bureau_pulls_status ON public.bureau_pulls(status);
CREATE INDEX IF NOT EXISTS idx_bureau_pulls_pan ON public.bureau_pulls(pan);

-- Enable RLS
ALTER TABLE public.bureau_pulls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "partners_view_own_bureau_pulls" ON public.bureau_pulls;
CREATE POLICY "partners_view_own_bureau_pulls"
ON public.bureau_pulls
FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "partners_insert_own_bureau_pulls" ON public.bureau_pulls;
CREATE POLICY "partners_insert_own_bureau_pulls"
ON public.bureau_pulls
FOR INSERT
TO authenticated
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Admin can view all
DROP POLICY IF EXISTS "admin_view_all_bureau_pulls" ON public.bureau_pulls;
CREATE POLICY "admin_view_all_bureau_pulls"
ON public.bureau_pulls
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- Mock data for demo
DO $$
DECLARE
  existing_partner_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'partners'
  ) THEN
    SELECT id INTO existing_partner_id FROM public.partners LIMIT 1;

    IF existing_partner_id IS NOT NULL THEN
      INSERT INTO public.bureau_pulls (
        id, partner_id, report_type, status, member_ref, pan, customer_name,
        credit_score, occupation_code, gender, state, dob, income,
        total_trades, active_trade_lines, loan_types, dpd_tag,
        current_balance, overdue_amount, total_enquiries,
        amount_deducted, report_id, bureau, created_at
      ) VALUES
      (gen_random_uuid(), existing_partner_id, 'consumer', 'success', 'n70762456', 'ABCDE1234F', 'JAYANTH KUMAR VODE',
        762, '04', 'F', '36', '1985-03-15', '500000',
        25, 12, 'Consumer Loan, Credit Card', 'LOW',
        970000, 0, 1, 10, 'CIB-2026-00847', 'CIBIL', NOW() - INTERVAL '1 day'),
      (gen_random_uuid(), existing_partner_id, 'consumer', 'success', 'n70764292', 'FGHIJ5678K', 'GUPTA SHAILLY MS SHA',
        738, '01', 'M', '27', '1990-07-22', '750000',
        18, 8, 'Credit Card, Consumer Loan', 'LOW',
        260000, 0, 2, 1, 'CIB-2026-00848', 'CIBIL', NOW() - INTERVAL '2 days'),
      (gen_random_uuid(), existing_partner_id, 'consumer', 'success', 'n70765100', 'KLMNO9012L', 'SHARMA RAJESH KUMAR',
        680, '02', 'M', '29', '1988-11-10', '420000',
        12, 5, 'Home Loan, Personal Loan', 'MED',
        1200000, 15000, 3, 4, 'CIB-2026-00849', 'CIBIL', NOW() - INTERVAL '3 days'),
      (gen_random_uuid(), existing_partner_id, 'commercial', 'success', 'c80123456', 'PQRST3456M', 'TECH SOLUTIONS PVT LTD',
        72, '09', NULL, '27', NULL, NULL,
        8, 4, 'Business Loan, CC Limit', 'LOW',
        500000, 0, 2, 1, 'COM-2026-00312', 'CIBIL', NOW() - INTERVAL '1 day'),
      (gen_random_uuid(), existing_partner_id, 'consumer', 'failed', 'n70766000', 'UVWXY7890N', 'MEHTA PRIYA',
        NULL, NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 0, NULL, 'CIBIL', NOW() - INTERVAL '4 days')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
