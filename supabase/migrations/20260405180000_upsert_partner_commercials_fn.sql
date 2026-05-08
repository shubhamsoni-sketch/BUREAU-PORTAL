-- Helper function to upsert partner_commercials bypassing enum casting issues
CREATE OR REPLACE FUNCTION upsert_partner_commercials(
  p_partner_id uuid,
  p_pricing_plan text,
  p_subscription_type text,
  p_consumer_credit_rate numeric,
  p_commercial_credit_rate numeric,
  p_credit_rate numeric,
  p_bundled_credits integer,
  p_credit_limit integer,
  p_addon_credits integer,
  p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO partner_commercials (
    partner_id,
    pricing_plan,
    subscription_type,
    credit_rate,
    consumer_credit_rate,
    commercial_credit_rate,
    bundled_credits,
    credit_limit,
    addon_credits,
    notes,
    updated_at
  ) VALUES (
    p_partner_id,
    p_pricing_plan::pricing_plan,
    p_subscription_type::subscription_type,
    p_credit_rate,
    p_consumer_credit_rate,
    p_commercial_credit_rate,
    p_bundled_credits,
    p_credit_limit,
    p_addon_credits,
    p_notes,
    NOW()
  )
  ON CONFLICT (partner_id) DO UPDATE SET
    pricing_plan = EXCLUDED.pricing_plan,
    subscription_type = EXCLUDED.subscription_type,
    credit_rate = EXCLUDED.credit_rate,
    consumer_credit_rate = EXCLUDED.consumer_credit_rate,
    commercial_credit_rate = EXCLUDED.commercial_credit_rate,
    bundled_credits = EXCLUDED.bundled_credits,
    credit_limit = EXCLUDED.credit_limit,
    addon_credits = EXCLUDED.addon_credits,
    notes = EXCLUDED.notes,
    updated_at = NOW();
END;
$$;

-- Grant execute to service role (already has it via SECURITY DEFINER, but be explicit)
GRANT EXECUTE ON FUNCTION upsert_partner_commercials TO service_role;
