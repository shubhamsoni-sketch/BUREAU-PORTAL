-- Add separate consumer and commercial credit rate columns to partner_commercials
ALTER TABLE public.partner_commercials
ADD COLUMN IF NOT EXISTS consumer_credit_rate NUMERIC DEFAULT 10.0000,
ADD COLUMN IF NOT EXISTS commercial_credit_rate NUMERIC DEFAULT 15.0000;

-- Backfill existing rows: use existing credit_rate as consumer rate, 1.5x as commercial rate
UPDATE public.partner_commercials
SET
  consumer_credit_rate = credit_rate,
  commercial_credit_rate = ROUND(credit_rate * 1.5, 2)
WHERE consumer_credit_rate IS NULL OR consumer_credit_rate = 10.0000;
