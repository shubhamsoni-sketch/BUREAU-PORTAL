-- Notifications & Credit Requests Migration
-- Timestamp: 20260406200000

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- 2. Create credit_requests table
CREATE TABLE IF NOT EXISTS public.credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 10000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.user_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_credit_requests_partner_id ON public.credit_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_credit_requests_status ON public.credit_requests(status);

-- 3. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for notifications
-- Partners can read their own notifications
DROP POLICY IF EXISTS "users_read_own_notifications" ON public.notifications;
CREATE POLICY "users_read_own_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Partners can update (mark read) their own notifications
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role can insert notifications (via API routes)
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;
CREATE POLICY "service_insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. RLS Policies for credit_requests
-- Partners can insert their own requests
DROP POLICY IF EXISTS "partners_insert_credit_requests" ON public.credit_requests;
CREATE POLICY "partners_insert_credit_requests"
ON public.credit_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Partners can read their own requests
DROP POLICY IF EXISTS "partners_read_own_credit_requests" ON public.credit_requests;
CREATE POLICY "partners_read_own_credit_requests"
ON public.credit_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin can read all credit requests (via service role API)
DROP POLICY IF EXISTS "admin_read_all_credit_requests" ON public.credit_requests;
CREATE POLICY "admin_read_all_credit_requests"
ON public.credit_requests
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
