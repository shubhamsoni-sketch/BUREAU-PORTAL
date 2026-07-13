import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bearerToken, requireUser } from '@/lib/supabase/admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  const auth = await requireUser(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { partner_id, report_type, customer_name, report_id } = body;

    if (!partner_id || !report_type) {
      return NextResponse.json({ error: 'partner_id and report_type are required' }, { status: 400 });
    }

    const isAdmin =
      auth.user.app_metadata?.role === 'admin' ||
      auth.user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      const { data: ownedPartner, error: ownershipError } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('id', partner_id)
        .maybeSingle();

      if (ownershipError) {
        console.error('[pull-bureau-deduct] ownership check error:', ownershipError);
        return NextResponse.json({ error: ownershipError.message }, { status: 500 });
      }

      if (!ownedPartner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 1. Fetch partner's commercial rates
    const { data: commercials, error: commercialsError } = await supabaseAdmin
      .from('partner_commercials')
      .select('consumer_credit_rate, commercial_credit_rate, credit_rate')
      .eq('partner_id', partner_id)
      .maybeSingle();

    if (commercialsError) {
      console.error('[pull-bureau-deduct] commercials fetch error:', commercialsError);
    }

    // Determine rate: use split rates if available, fallback to credit_rate, then default
    const rate = report_type === 'commercial'
      ? Number(commercials?.commercial_credit_rate ?? commercials?.credit_rate ?? 15)
      : Number(commercials?.consumer_credit_rate ?? commercials?.credit_rate ?? 10);

    // 2. Fetch current wallet balance from partners table
    const { data: partnerRow, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, wallet_balance')
      .eq('id', partner_id)
      .maybeSingle();

    if (partnerError || !partnerRow) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const currentBalance = Number(partnerRow.wallet_balance ?? 0);

    if (currentBalance < rate) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance', balance: currentBalance, required: rate },
        { status: 402 }
      );
    }

    const newBalance = currentBalance - rate;

    // 3. Deduct from partners.wallet_balance
    const { error: updateError } = await supabaseAdmin
      .from('partners')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', partner_id);

    if (updateError) {
      console.error('[pull-bureau-deduct] balance update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 4. Update wallet_balances table if row exists
    const { data: wbRow } = await supabaseAdmin
      .from('wallet_balances')
      .select('total_deducted')
      .eq('partner_id', partner_id)
      .maybeSingle();

    if (wbRow) {
      await supabaseAdmin
        .from('wallet_balances')
        .update({
          balance: newBalance,
          total_deducted: Number(wbRow.total_deducted ?? 0) + rate,
          last_transaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('partner_id', partner_id);
    }

    // 5. Insert wallet_transactions row
    const description = `${report_type === 'commercial' ? 'Commercial' : 'Consumer'} Bureau Pull${customer_name ? ` – ${customer_name}` : ''}`;
    const { error: txnError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        partner_id,
        type: 'debit',
        amount: rate,
        description,
        transaction_type: 'deduction',
        rate_snapshot: rate,
        running_balance: newBalance,
        reference_id: report_id ?? null,
        metadata: {
          report_type,
          customer_name: customer_name ?? null,
          report_id: report_id ?? null,
        },
      });

    if (txnError) {
      console.error('[pull-bureau-deduct] transaction insert error:', txnError);
      // Don't fail — balance already deducted, just log
    }

    // 6. Insert bureau_pulls row for report history
    const memberRef = `n${Date.now().toString().slice(-8)}`;
    const { error: pullError } = await supabaseAdmin
      .from('bureau_pulls')
      .insert({
        partner_id,
        report_type: report_type ?? 'consumer',
        status: 'success',
        member_ref: memberRef,
        pan: body.pan ?? null,
        customer_name: customer_name ?? null,
        credit_score: body.credit_score ?? null,
        occupation_code: body.occupation_code ?? null,
        gender: body.gender ?? null,
        state: body.state ?? null,
        dob: body.dob ?? null,
        income: body.income ?? null,
        total_trades: body.total_trades ?? null,
        active_trade_lines: body.active_trade_lines ?? null,
        loan_types: body.loan_types ?? null,
        dpd_tag: body.dpd_tag ?? null,
        current_balance: body.current_balance ?? null,
        overdue_amount: body.overdue_amount ?? null,
        total_enquiries: body.total_enquiries ?? null,
        amount_deducted: rate,
        report_id: report_id ?? null,
        bureau: 'Bureau',
        raw_json: body.raw_json ?? {},
      });

    if (pullError) {
      console.error('[pull-bureau-deduct] bureau_pulls insert error:', pullError);
      // Don't fail — balance already deducted
    }

    return NextResponse.json({
      success: true,
      rate,
      new_balance: newBalance,
      description,
      member_ref: memberRef,
    });
  } catch (err: any) {
    console.error('[pull-bureau-deduct] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
