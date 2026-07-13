import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await req.json();
    const { invoice_id, payment_mode, utr_number, recorded_by } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
    }

    if (!payment_mode) {
      return NextResponse.json({ error: 'payment_mode is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('mark_invoice_paid_atomic', {
      p_invoice_id: invoice_id,
      p_payment_mode: payment_mode,
      p_utr_number: utr_number || null,
      p_recorded_by: recorded_by || null,
    });

    if (error) {
      console.error('[mark-invoice-paid] rpc error:', error);
      const { data: inv, error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'paid',
          payment_mode,
          utr_number: utr_number || null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoice_id)
        .select('id, invoice_number, status, partner_id, amount, credits_added, partner_name, partner_email')
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if (inv) {
        const { data: txn } = await supabaseAdmin
          .from('wallet_transactions')
          .select('id')
          .eq('partner_id', inv.partner_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (txn) {
          await supabaseAdmin
            .from('wallet_transactions')
            .update({ status: 'confirmed' })
            .eq('id', txn.id);
        }

        const { data: confirmedTxns } = await supabaseAdmin
          .from('wallet_transactions')
          .select('type, amount')
          .eq('partner_id', inv.partner_id)
          .eq('status', 'confirmed');

        if (confirmedTxns) {
          const newBalance = confirmedTxns.reduce((sum, t) => {
            return t.type === 'credit' ? sum + Number(t.amount) : sum - Number(t.amount);
          }, 0);

          await supabaseAdmin
            .from('partners')
            .update({ wallet_balance: newBalance })
            .eq('id', inv.partner_id);

          const { data: wb } = await supabaseAdmin
            .from('wallet_balances')
            .select('id, total_recharged')
            .eq('partner_id', inv.partner_id)
            .maybeSingle();

          const totalRecharged = confirmedTxns
            .filter((t) => t.type === 'credit')
            .reduce((s, t) => s + Number(t.amount), 0);
          const totalDeducted = confirmedTxns
            .filter((t) => t.type === 'debit')
            .reduce((s, t) => s + Number(t.amount), 0);

          if (wb) {
            await supabaseAdmin
              .from('wallet_balances')
              .update({ balance: newBalance, total_recharged: totalRecharged, total_deducted: totalDeducted, updated_at: new Date().toISOString() })
              .eq('partner_id', inv.partner_id);
          } else {
            await supabaseAdmin
              .from('wallet_balances')
              .insert({ partner_id: inv.partner_id, balance: newBalance, total_recharged: totalRecharged, total_deducted: totalDeducted });
          }
        }

        await supabaseAdmin.from('payments').insert({
          partner_id: inv.partner_id,
          partner_name: inv.partner_name,
          partner_email: inv.partner_email,
          invoice_id,
          invoice_number: inv.invoice_number,
          amount: inv.amount,
          credits_added: inv.credits_added,
          payment_mode,
          utr_number: utr_number || null,
          source: 'admin_recorded',
          recorded_by: recorded_by || null,
          paid_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: true, invoice: inv });
    }

    const result = data as { success: boolean; error?: string; invoice_id?: string; payment_id?: string };

    if (!result?.success) {
      return NextResponse.json({ error: result?.error || 'Failed to mark invoice as paid' }, { status: 500 });
    }

    try {
      const { data: paidInvoice } = await supabaseAdmin
        .from('invoices')
        .select('id, invoice_number, partner_id, amount')
        .eq('id', invoice_id)
        .maybeSingle();

      if (paidInvoice) {
        const { data: partner } = await supabaseAdmin
          .from('partners')
          .select('user_id')
          .eq('id', paidInvoice.partner_id)
          .maybeSingle();

        if (partner?.user_id) {
          await supabaseAdmin.from('notifications').insert([
            {
              user_id: partner.user_id,
              type: 'invoice_paid',
              title: 'Invoice Marked Paid',
              message: `Invoice ${paidInvoice.invoice_number} has been marked as paid.`,
              metadata: { invoice_id: paidInvoice.id, invoice_number: paidInvoice.invoice_number, amount: paidInvoice.amount },
            },
            {
              user_id: partner.user_id,
              type: 'wallet_recharged',
              title: 'Wallet Recharged',
              message: `Your wallet has been recharged with ₹${Number(paidInvoice.amount).toLocaleString('en-IN')}.`,
              metadata: { invoice_id: paidInvoice.id, amount: paidInvoice.amount },
            },
          ]);
        }
      }
    } catch (notifErr) {
      console.error('[mark-invoice-paid] notification error (non-blocking):', notifErr);
    }

    return NextResponse.json({ ...result, success: true });
  } catch (err: any) {
    console.error('[mark-invoice-paid] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
