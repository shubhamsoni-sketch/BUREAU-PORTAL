-- ============================================================
-- Manual Payment Flow Migration
-- 1. Add status (pending/confirmed) to wallet_transactions
-- 2. Create payments table for confirmed payment records
-- 3. Update wallet balance trigger to only count confirmed transactions
-- 4. Add payment_mode and utr_number to invoices
-- ============================================================

-- ─── 1. Add status column to wallet_transactions ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'wallet_transactions'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.wallet_transactions
      ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed';
  END IF;
END $$;

-- Mark all existing transactions as confirmed (they were already applied to balance)
UPDATE public.wallet_transactions
SET status = 'confirmed'
WHERE status IS NULL OR status = '';

-- ─── 2. Add payment_mode and utr_number to invoices ──────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS utr_number TEXT DEFAULT NULL;

-- payment_mode already exists, just ensure it's there
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;

-- ─── 3. Create payments table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  partner_name      TEXT NOT NULL DEFAULT '',
  partner_email     TEXT NOT NULL DEFAULT '',
  invoice_id        UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  invoice_number    TEXT NOT NULL DEFAULT '',
  amount            NUMERIC(12, 2) NOT NULL,
  credits_added     INTEGER NOT NULL DEFAULT 0,
  payment_mode      TEXT NOT NULL DEFAULT 'Bank Transfer',
  utr_number        TEXT DEFAULT NULL,
  source            TEXT NOT NULL DEFAULT 'admin_recorded',
  recorded_by       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  paid_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── 4. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_partner_id ON public.payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payment_mode ON public.payments(payment_mode);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);

-- ─── 5. RLS for payments ──────────────────────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_payments" ON public.payments;
CREATE POLICY "admin_manage_payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "service_role_payments" ON public.payments;
CREATE POLICY "service_role_payments"
ON public.payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ─── 6. Update refresh_wallet_balance to only count confirmed transactions ─────
CREATE OR REPLACE FUNCTION public.refresh_wallet_balance(p_partner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance         NUMERIC(12, 2);
  v_total_recharged NUMERIC(12, 2);
  v_total_deducted  NUMERIC(12, 2);
  v_last_tx_at      TIMESTAMPTZ;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN type = 'credit' AND (status IS NULL OR status = 'confirmed') THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0),
    MAX(created_at)
  INTO v_total_recharged, v_total_deducted, v_last_tx_at
  FROM public.wallet_transactions
  WHERE partner_id = p_partner_id;

  v_balance := v_total_recharged - v_total_deducted;

  INSERT INTO public.wallet_balances (partner_id, balance, total_recharged, total_deducted, last_transaction_at, updated_at)
  VALUES (p_partner_id, v_balance, v_total_recharged, v_total_deducted, v_last_tx_at, now())
  ON CONFLICT (partner_id) DO UPDATE SET
    balance             = EXCLUDED.balance,
    total_recharged     = EXCLUDED.total_recharged,
    total_deducted      = EXCLUDED.total_deducted,
    last_transaction_at = EXCLUDED.last_transaction_at,
    updated_at          = now();
END;
$$;

-- ─── 7. Atomic mark-invoice-paid function ─────────────────────────────────────
-- This function atomically:
-- 1. Marks invoice as paid
-- 2. Confirms the wallet transaction
-- 3. Updates wallet balance
-- 4. Inserts payment record
CREATE OR REPLACE FUNCTION public.mark_invoice_paid_atomic(
  p_invoice_id    UUID,
  p_payment_mode  TEXT,
  p_utr_number    TEXT DEFAULT NULL,
  p_recorded_by   UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice         RECORD;
  v_transaction_id  UUID;
  v_payment_id      UUID;
BEGIN
  -- Fetch invoice
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  AND status = 'raised';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invoice not found or not in raised status');
  END IF;

  -- 1. Mark invoice as paid
  UPDATE public.invoices
  SET
    status     = 'paid',
    payment_mode = p_payment_mode,
    utr_number = p_utr_number,
    paid_at    = now()
  WHERE id = p_invoice_id;

  -- 2. Find and confirm the pending wallet transaction linked to this invoice
  -- Try source_transaction_id first, then transaction_ref
  SELECT id INTO v_transaction_id
  FROM public.wallet_transactions
  WHERE partner_id = v_invoice.partner_id::UUID
  AND status = 'pending'
  AND (
    id::TEXT = v_invoice.source_transaction_id::TEXT
    OR id::TEXT = v_invoice.transaction_ref
  )
  LIMIT 1;

  IF v_transaction_id IS NOT NULL THEN
    UPDATE public.wallet_transactions
    SET status = 'confirmed'
    WHERE id = v_transaction_id;
  ELSE
    -- No pending transaction found — insert a confirmed credit transaction
    INSERT INTO public.wallet_transactions (
      partner_id,
      type,
      amount,
      description,
      transaction_type,
      status,
      metadata
    )
    VALUES (
      v_invoice.partner_id::UUID,
      'credit',
      v_invoice.amount,
      'Payment confirmed for invoice ' || v_invoice.invoice_number,
      'recharge',
      'confirmed',
      jsonb_build_object('invoice_id', p_invoice_id, 'payment_mode', p_payment_mode)
    )
    RETURNING id INTO v_transaction_id;
  END IF;

  -- 3. Refresh wallet balance (only counts confirmed transactions)
  PERFORM public.refresh_wallet_balance(v_invoice.partner_id::UUID);

  -- Also update partners.wallet_balance for legacy compatibility
  UPDATE public.partners
  SET wallet_balance = (
    SELECT COALESCE(balance, 0)
    FROM public.wallet_balances
    WHERE partner_id = v_invoice.partner_id::UUID
  )
  WHERE id = v_invoice.partner_id::UUID;

  -- 4. Insert payment record
  INSERT INTO public.payments (
    partner_id,
    partner_name,
    partner_email,
    invoice_id,
    invoice_number,
    amount,
    credits_added,
    payment_mode,
    utr_number,
    source,
    recorded_by,
    paid_at
  )
  VALUES (
    v_invoice.partner_id::UUID,
    v_invoice.partner_name,
    v_invoice.partner_email,
    p_invoice_id,
    v_invoice.invoice_number,
    v_invoice.amount,
    v_invoice.credits_added,
    p_payment_mode,
    p_utr_number,
    'admin_recorded',
    p_recorded_by,
    now()
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'payment_id', v_payment_id,
    'transaction_id', v_transaction_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
