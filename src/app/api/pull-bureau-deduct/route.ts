import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await req.json();
    const { partner_id, report_type, customer_name, report_id } = body;

    if (!partner_id || !report_type) {
      return NextResponse.json({ error: 'partner_id and report_type are required' }, { status: 400 });
    }

    const { data: commercials, error: commercialsError } = await supabaseAdmin
      .from('partner_commercials')
      .select('consumer_credit_rate, commercial_credit_rate, credit_rate')
      .eq('partner_id', partner_id)
      .maybeSingle();

    if (commercialsError) {
      console.error('[pull-bureau-deduct] commercials fetch error:', commercialsError);
    }

    const rate = report_type === 'commercial'
      ? Number(commercials?.commercial_credit_rate ?? commercials?.credit_rate ?? 15)
      : Number(commercials?.consumer_credit_rate ?? commercials?.credit_rate ?? 10);

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

    const { error: updateError } = await supabaseAdmin
      .from('partners')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', partner_id);

    if (updateError) {
      console.error('[pull-bureau-deduct] balance update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

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
    }

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
