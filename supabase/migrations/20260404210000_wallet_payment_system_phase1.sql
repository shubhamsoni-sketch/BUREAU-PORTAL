-- ============================================================
-- Phase 1: Wallet & Payment System — Foundation Tables
-- Tables: wallet_balances, wallet_transactions (enhanced),
--         payment_orders, partner_commercials, webhook_logs
-- ============================================================

-- ============================================================
-- STEP 1: ENUMS
-- ============================================================

DROP TYPE IF EXISTS public.transaction_type CASCADE;
CREATE TYPE public.transaction_type AS ENUM (
  'recharge',
  'deduction',
  'manual_adjustment',
  'refund'
);

DROP TYPE IF EXISTS public.payment_order_status CASCADE;
CREATE TYPE public.payment_order_status AS ENUM (
  'pending',
  'success',
  'failed',
  'expired'
);

DROP TYPE IF EXISTS public.subscription_type CASCADE;
CREATE TYPE public.subscription_type AS ENUM (
  'prepaid',
  'monthly_fixed',
  'hybrid'
);

DROP TYPE IF EXISTS public.pricing_plan CASCADE;
CREATE TYPE public.pricing_plan AS ENUM (
  'Basic',
  'Standard',
  'Premium',
  'Custom'
);

DROP TYPE IF EXISTS public.webhook_event_status CASCADE;
CREATE TYPE public.webhook_event_status AS ENUM (
  'received',
  'processed',
  'failed',
  'ignored'
);

-- ============================================================
-- STEP 2: CORE TABLES
-- ============================================================

-- wallet_balances: one row per partner, balance derived from ledger
-- This is a materialized view of the ledger for fast reads.
-- Balance is NEVER directly updated — only via wallet_transactions.
CREATE TABLE IF NOT EXISTS public.wallet_balances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        UUID NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  balance           NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_recharged   NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_deducted    NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  last_transaction_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- partner_commercials: per-partner pricing and billing configuration
CREATE TABLE IF NOT EXISTS public.partner_commercials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          UUID NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  pricing_plan        public.pricing_plan NOT NULL DEFAULT 'Basic'::public.pricing_plan,
  subscription_type   public.subscription_type NOT NULL DEFAULT 'prepaid'::public.subscription_type,
  credit_rate         NUMERIC(10, 4) NOT NULL DEFAULT 10.0000,  -- cost per CIBIL report pull (INR)
  bundled_credits     INTEGER NOT NULL DEFAULT 0,               -- credits included in subscription
  credit_limit        INTEGER NOT NULL DEFAULT 1000,            -- max credits allowed
  addon_credits       INTEGER NOT NULL DEFAULT 0,               -- top-up credits on top of subscription
  notes               TEXT DEFAULT '',
  set_by              UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- payment_orders: tracks Stripe payment lifecycle
-- Idempotency key = stripe_session_id (prevents duplicate wallet credits)
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  stripe_session_id   TEXT UNIQUE,                              -- Stripe Checkout session ID
  stripe_payment_intent_id TEXT,                               -- Stripe PaymentIntent ID
  amount_inr          NUMERIC(12, 2) NOT NULL,                 -- amount in INR
  credits_to_add      INTEGER NOT NULL DEFAULT 0,              -- credits to credit on success
  status              public.payment_order_status NOT NULL DEFAULT 'pending'::public.payment_order_status,
  failure_reason      TEXT,                                    -- populated on failed status
  retry_count         INTEGER NOT NULL DEFAULT 0,              -- number of retry attempts
  last_retried_at     TIMESTAMPTZ,                             -- timestamp of last retry
  webhook_received_at TIMESTAMPTZ,                             -- when webhook was processed
  metadata            JSONB DEFAULT '{}'::jsonb,               -- extra Stripe metadata
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- webhook_logs: full audit trail of all incoming Stripe webhook events
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        TEXT NOT NULL UNIQUE,                        -- Stripe event ID (idempotency)
  event_type      TEXT NOT NULL,                               -- e.g. checkout.session.completed
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  partner_id      UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  status          public.webhook_event_status NOT NULL DEFAULT 'received'::public.webhook_event_status,
  raw_payload     JSONB NOT NULL DEFAULT '{}'::jsonb,          -- full Stripe event payload
  error_message   TEXT,                                        -- error if processing failed
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STEP 3: ENHANCE EXISTING wallet_transactions TABLE
-- Add missing columns for ledger system, rate snapshot, and audit
-- ============================================================

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS transaction_type public.transaction_type DEFAULT 'recharge'::public.transaction_type,
  ADD COLUMN IF NOT EXISTS reference_id     TEXT,                   -- payment_order_id or invoice_id
  ADD COLUMN IF NOT EXISTS rate_snapshot    NUMERIC(10, 4),         -- credit_rate at time of transaction
  ADD COLUMN IF NOT EXISTS running_balance  NUMERIC(12, 2),         -- balance after this transaction
  ADD COLUMN IF NOT EXISTS performed_by     UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata         JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- STEP 4: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wallet_balances_partner_id
  ON public.wallet_balances(partner_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_partner_id
  ON public.wallet_transactions(partner_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type
  ON public.wallet_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at
  ON public.wallet_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference_id
  ON public.wallet_transactions(reference_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_partner_id
  ON public.payment_orders(partner_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status
  ON public.payment_orders(status);

CREATE INDEX IF NOT EXISTS idx_payment_orders_stripe_session_id
  ON public.payment_orders(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at
  ON public.payment_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_commercials_partner_id
  ON public.partner_commercials(partner_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id
  ON public.webhook_logs(event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type
  ON public.webhook_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_order_id
  ON public.webhook_logs(payment_order_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at
  ON public.webhook_logs(created_at DESC);

-- ============================================================
-- STEP 5: HELPER FUNCTIONS (must be before RLS policies)
-- ============================================================

-- Check if current user is admin (via auth metadata — safe for all tables)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (
      au.raw_user_meta_data->>'role' = 'admin'
      OR au.raw_app_meta_data->>'role' = 'admin'
    )
  )
$$;

-- Get partner_id for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT p.id
  FROM public.partners p
  JOIN public.user_profiles up ON p.user_id = up.id
  WHERE up.id = auth.uid()
  LIMIT 1
$$;

-- Recalculate and update wallet_balances from wallet_transactions ledger
CREATE OR REPLACE FUNCTION public.refresh_wallet_balance(p_partner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance        NUMERIC(12, 2);
  v_total_recharged NUMERIC(12, 2);
  v_total_deducted  NUMERIC(12, 2);
  v_last_tx_at     TIMESTAMPTZ;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0),
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

-- Auto-update wallet_balances whenever a wallet_transaction is inserted
CREATE OR REPLACE FUNCTION public.handle_wallet_transaction_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.refresh_wallet_balance(NEW.partner_id);
  RETURN NEW;
END;
$$;

-- Auto-update updated_at on payment_orders
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 6: ENABLE RLS
-- ============================================================

ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commercials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- wallet_transactions already has RLS enabled from previous migration

-- ============================================================
-- STEP 7: RLS POLICIES
-- ============================================================

-- wallet_balances: partner sees own, admin sees all
DROP POLICY IF EXISTS "partner_view_own_wallet_balance" ON public.wallet_balances;
CREATE POLICY "partner_view_own_wallet_balance"
ON public.wallet_balances
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id()
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "admin_manage_wallet_balances" ON public.wallet_balances;
CREATE POLICY "admin_manage_wallet_balances"
ON public.wallet_balances
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- wallet_transactions: partner sees own, admin sees all
DROP POLICY IF EXISTS "partner_view_own_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "partner_view_own_wallet_transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id()
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "admin_manage_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "admin_manage_wallet_transactions"
ON public.wallet_transactions
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- payment_orders: partner sees own, admin sees all
DROP POLICY IF EXISTS "partner_view_own_payment_orders" ON public.payment_orders;
CREATE POLICY "partner_view_own_payment_orders"
ON public.payment_orders
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id()
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "partner_insert_own_payment_orders" ON public.payment_orders;
CREATE POLICY "partner_insert_own_payment_orders"
ON public.payment_orders
FOR INSERT
TO authenticated
WITH CHECK (
  partner_id = public.get_current_partner_id()
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "admin_manage_payment_orders" ON public.payment_orders;
CREATE POLICY "admin_manage_payment_orders"
ON public.payment_orders
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- partner_commercials: partner can view own, admin manages all
DROP POLICY IF EXISTS "partner_view_own_commercials" ON public.partner_commercials;
CREATE POLICY "partner_view_own_commercials"
ON public.partner_commercials
FOR SELECT
TO authenticated
USING (
  partner_id = public.get_current_partner_id()
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "admin_manage_partner_commercials" ON public.partner_commercials;
CREATE POLICY "admin_manage_partner_commercials"
ON public.partner_commercials
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- webhook_logs: admin only (sensitive debugging data)
DROP POLICY IF EXISTS "admin_manage_webhook_logs" ON public.webhook_logs;
CREATE POLICY "admin_manage_webhook_logs"
ON public.webhook_logs
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Service role bypass for webhook_logs (needed for Stripe webhook API route)
DROP POLICY IF EXISTS "service_role_webhook_logs" ON public.webhook_logs;
CREATE POLICY "service_role_webhook_logs"
ON public.webhook_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role bypass for payment_orders (needed for Stripe webhook API route)
DROP POLICY IF EXISTS "service_role_payment_orders" ON public.payment_orders;
CREATE POLICY "service_role_payment_orders"
ON public.payment_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role bypass for wallet_transactions (needed for webhook-triggered updates)
DROP POLICY IF EXISTS "service_role_wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "service_role_wallet_transactions"
ON public.wallet_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role bypass for wallet_balances
DROP POLICY IF EXISTS "service_role_wallet_balances" ON public.wallet_balances;
CREATE POLICY "service_role_wallet_balances"
ON public.wallet_balances
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- STEP 8: TRIGGERS
-- ============================================================

-- Auto-refresh wallet_balances on every new wallet_transaction
DROP TRIGGER IF EXISTS on_wallet_transaction_insert ON public.wallet_transactions;
CREATE TRIGGER on_wallet_transaction_insert
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_wallet_transaction_insert();

-- Auto-update updated_at on payment_orders
DROP TRIGGER IF EXISTS set_payment_orders_updated_at ON public.payment_orders;
CREATE TRIGGER set_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-update updated_at on wallet_balances
DROP TRIGGER IF EXISTS set_wallet_balances_updated_at ON public.wallet_balances;
CREATE TRIGGER set_wallet_balances_updated_at
  BEFORE UPDATE ON public.wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-update updated_at on partner_commercials
DROP TRIGGER IF EXISTS set_partner_commercials_updated_at ON public.partner_commercials;
CREATE TRIGGER set_partner_commercials_updated_at
  BEFORE UPDATE ON public.partner_commercials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- STEP 9: SEED DEFAULT PARTNER COMMERCIALS
-- Create default commercial records for all existing approved partners
-- ============================================================

DO $$
DECLARE
  partner_rec RECORD;
BEGIN
  FOR partner_rec IN
    SELECT id FROM public.partners WHERE status = 'approved'
  LOOP
    INSERT INTO public.partner_commercials (
      partner_id,
      pricing_plan,
      subscription_type,
      credit_rate,
      bundled_credits,
      credit_limit,
      addon_credits
    )
    VALUES (
      partner_rec.id,
      'Basic'::public.pricing_plan,
      'prepaid'::public.subscription_type,
      10.0000,
      0,
      1000,
      0
    )
    ON CONFLICT (partner_id) DO NOTHING;

    -- Also seed wallet_balances for each approved partner
    INSERT INTO public.wallet_balances (partner_id, balance, total_recharged, total_deducted)
    VALUES (partner_rec.id, 0.00, 0.00, 0.00)
    ON CONFLICT (partner_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Seeded partner_commercials and wallet_balances for approved partners';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seeding failed: %', SQLERRM;
END $$;
