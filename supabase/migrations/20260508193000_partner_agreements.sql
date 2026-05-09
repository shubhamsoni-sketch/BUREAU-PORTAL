CREATE TABLE IF NOT EXISTS public.partner_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agreement_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_at TIMESTAMPTZ,
  signed_ip TEXT,
  signed_user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_agreements_partner_id
  ON public.partner_agreements(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_agreements_user_id
  ON public.partner_agreements(user_id);

CREATE INDEX IF NOT EXISTS idx_partner_agreements_status
  ON public.partner_agreements(status);

ALTER TABLE public.partner_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_read_own_agreements" ON public.partner_agreements;
CREATE POLICY "partners_read_own_agreements"
  ON public.partner_agreements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "partners_sign_own_pending_agreements" ON public.partner_agreements;
CREATE POLICY "partners_sign_own_pending_agreements"
  ON public.partner_agreements
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_partner_agreements" ON public.partner_agreements;
CREATE POLICY "admin_manage_partner_agreements"
  ON public.partner_agreements
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "service_role_manage_partner_agreements" ON public.partner_agreements;
CREATE POLICY "service_role_manage_partner_agreements"
  ON public.partner_agreements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
