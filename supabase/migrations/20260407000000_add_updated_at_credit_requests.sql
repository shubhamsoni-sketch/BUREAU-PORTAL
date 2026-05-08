-- Add updated_at column to credit_requests table
ALTER TABLE public.credit_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
