ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_partners_is_demo
  ON public.partners(is_demo);
