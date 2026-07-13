import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      partner_id,
      pricing_plan,
      subscription_type,
      consumer_credit_rate,
      commercial_credit_rate,
      bundled_credits,
      credit_limit,
      addon_credits,
      notes,
    } = body;

    if (!partner_id) {
      return NextResponse.json({ error: 'partner_id is required' }, { status: 400 });
    }

    const consumerRate = Number(consumer_credit_rate) || 10;
    const commercialRate = Number(commercial_credit_rate) || 15;
    const plan = pricing_plan || 'Basic';
    const subType = subscription_type || 'prepaid';

    // Use raw SQL via rpc to avoid enum casting issues
    const { error } = await auth.supabase.rpc('upsert_partner_commercials', {
      p_partner_id: partner_id,
      p_pricing_plan: plan,
      p_subscription_type: subType,
      p_consumer_credit_rate: consumerRate,
      p_commercial_credit_rate: commercialRate,
      p_credit_rate: consumerRate,
      p_bundled_credits: Number(bundled_credits) || 0,
      p_credit_limit: Number(credit_limit) || 1000,
      p_addon_credits: Number(addon_credits) || 0,
      p_notes: notes || '',
    });

    if (error) {
      console.error('[save-partner-commercials] rpc error:', JSON.stringify(error));
      // Fallback: direct upsert with explicit casting
      const { error: upsertError } = await auth.supabase
        .from('partner_commercials')
        .upsert(
          {
            partner_id,
            pricing_plan: plan as 'Basic' | 'Standard' | 'Premium' | 'Custom',
            subscription_type: subType as 'prepaid' | 'monthly_fixed' | 'hybrid',
            credit_rate: consumerRate,
            consumer_credit_rate: consumerRate,
            commercial_credit_rate: commercialRate,
            bundled_credits: Number(bundled_credits) || 0,
            credit_limit: Number(credit_limit) || 1000,
            addon_credits: Number(addon_credits) || 0,
            notes: notes || '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'partner_id' }
        );

      if (upsertError) {
        console.error('[save-partner-commercials] fallback upsert error:', JSON.stringify(upsertError));
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[save-partner-commercials] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
