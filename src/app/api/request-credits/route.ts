import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    const body = await req.json();
    const { user_id, partner_id, amount, note } = body;

    if (!user_id && !partner_id) {
      return NextResponse.json({ error: 'user_id or partner_id is required' }, { status: 400 });
    }

    const requestedAmount = Number(amount);
    if (!amount || isNaN(requestedAmount) || requestedAmount < 10000) {
      return NextResponse.json({ error: 'Minimum credit request amount is ₹10,000' }, { status: 400 });
    }

    // Get partner by partner_id for CRM/team users, or by user_id for legacy partner portal users.
    let partnerQuery = supabaseAdmin
      .from('partners')
      .select('id, name, email, user_id');

    partnerQuery = partner_id ? partnerQuery.eq('id', partner_id) : partnerQuery.eq('user_id', user_id);

    const { data: partner, error: partnerError } = await partnerQuery.maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Insert credit request
    const { data: creditRequest, error: crError } = await supabaseAdmin
      .from('credit_requests')
      .insert({
        partner_id: partner.id,
        user_id: user_id || partner.user_id,
        amount: requestedAmount,
        note: note || '',
        status: 'pending',
      })
      .select('id')
      .single();

    if (crError) {
      console.error('[request-credits] insert error:', crError);
      return NextResponse.json({ error: crError.message }, { status: 500 });
    }

    // Find admin user_id to notify
    const { data: adminProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (adminProfile) {
      await supabaseAdmin.from('notifications').insert({
        user_id: adminProfile.id,
        type: 'credit_request',
        title: 'Credit Request Received',
        message: `${partner.name} has requested ₹${requestedAmount.toLocaleString('en-IN')} in wallet credits.`,
        metadata: {
          partner_id: partner.id,
          partner_name: partner.name,
          amount: requestedAmount,
          credit_request_id: creditRequest.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Credit request submitted successfully. Admin will be notified.',
      credit_request_id: creditRequest.id,
    });
  } catch (err: any) {
    console.error('[request-credits] unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
