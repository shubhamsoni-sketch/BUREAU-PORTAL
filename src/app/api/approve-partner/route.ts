import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { generatePartnerCode } from '@/lib/partner-code';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { generateTemporaryPassword } from '@/lib/security/password';
import { sendConfiguredTemplate } from '@/lib/whatsapp/cloud-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isRealServiceKey =
      serviceRoleKey &&
      serviceRoleKey.length > 20 &&
      !serviceRoleKey.startsWith('your-') &&
      !serviceRoleKey.includes('here');

    if (!isRealServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Please add your Supabase service role key to the environment variables to enable partner approval.' },
        { status: 503 }
      );
    }

    const auth = await requireAdmin(bearerToken(request));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const callerUserId = auth.user.id;

    // Use service role admin client for ALL operations
    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch the partner request using admin client to bypass RLS
    const { data: partnerRequest, error: fetchError } = await adminClient
      .from('partner_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !partnerRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (partnerRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
    }

    const password = generateTemporaryPassword();
    const partnerCode = await generatePartnerCode(adminClient);

    // Check if an auth user with this email already exists
    // (can happen if a previous approval attempt partially succeeded)
    let newUserId: string;
    const { data: existingUsersData } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsersData?.users?.find(
      (u) => u.email?.toLowerCase() === partnerRequest.email?.toLowerCase()
    );

    if (existingUser) {
      // User already exists in auth — reuse their ID and update password
      newUserId = existingUser.id;
      // Update the existing user's password and metadata
      await adminClient.auth.admin.updateUserById(newUserId, {
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: partnerRequest.name,
          role: 'partner',
        },
        app_metadata: {
          role: 'partner',
          is_temp_password: true,
        },
      });
    } else {
      // Create a new auth user with service role
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: partnerRequest.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: partnerRequest.name,
          role: 'partner',
        },
        app_metadata: {
          role: 'partner',
          is_temp_password: true,
        },
      });

      if (authError || !authData.user) {
        console.error('Auth user creation error:', authError);
        return NextResponse.json(
          { error: authError?.message || 'Failed to create auth user' },
          { status: 500 }
        );
      }

      newUserId = authData.user.id;
    }

    // Ensure user_profiles row exists with is_temp_password = true
    await adminClient
      .from('user_profiles')
      .upsert({
        id: newUserId,
        email: partnerRequest.email,
        full_name: partnerRequest.name,
        role: 'partner',
        is_temp_password: true,
      }, { onConflict: 'id', ignoreDuplicates: false });

    // Check if a partner record already exists for this user
    const { data: existingPartner } = await adminClient
      .from('partners')
      .select('id')
      .eq('user_id', newUserId)
      .maybeSingle();

    if (!existingPartner) {
      // Create partner record using admin client (bypasses RLS)
      const { error: partnerError } = await adminClient
        .from('partners')
        .insert({
          user_id: newUserId,
          name: partnerRequest.name,
          company_name: partnerRequest.company_name,
          mobile: partnerRequest.mobile,
          email: partnerRequest.email,
          city: partnerRequest.city,
          partner_code: partnerCode,
          status: 'approved',
          pricing_plan: 'Basic',
          wallet_balance: 0,
          reports_pulled: 0,
        });

      if (partnerError) {
        console.error('Partner record creation error:', partnerError);
        // Only rollback if we created the user (not if we reused an existing one)
        if (!existingUser) {
          await adminClient.auth.admin.deleteUser(newUserId);
        }
        return NextResponse.json({ error: 'Failed to create partner record: ' + partnerError.message }, { status: 500 });
      }
    }

    // Mark request as approved using admin client
    await adminClient
      .from('partner_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: callerUserId,
      })
      .eq('id', requestId);

    // Send credentials email via Resend edge function
    try {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-partner-credentials`;
      await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          partnerName: partnerRequest.name,
          partnerEmail: partnerRequest.email,
          tempPassword: password,
          loginUrl: process.env.NEXT_PUBLIC_PORTAL_URL
            ? `${process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, '')}/partner-login`
            : 'https://portal.credittrust.in/partner-login',
        }),
      });
    } catch (emailErr) {
      // Email failure is non-blocking — partner account is still created
      console.error('Failed to send credentials email:', emailErr);
    }

    try {
      const loginUrl = process.env.NEXT_PUBLIC_PORTAL_URL
        ? `${process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, '')}/partner-login`
        : 'https://portal.credittrust.in/partner-login';
      const whatsappResult = await sendConfiguredTemplate({
        supabase: adminClient,
        eventType: 'partner_welcome',
        templateEnv: 'WHATSAPP_PARTNER_WELCOME_TEMPLATE',
        to: partnerRequest.mobile,
        userId: newUserId,
        bodyValues: [partnerRequest.name, loginUrl],
        metadata: {
          source: 'approve_partner_request',
          partner_code: partnerCode,
          email: partnerRequest.email,
        },
      });

      if (!whatsappResult.sent && whatsappResult.error) {
        console.warn('[approve-partner] welcome whatsapp failed:', whatsappResult.error);
      }
    } catch (whatsappErr) {
      console.error('Failed to send partner welcome WhatsApp:', whatsappErr);
    }

    // Notify the new partner that their account has been approved
    try {
      await adminClient.from('notifications').insert({
        user_id: newUserId,
        type: 'account_approved',
        title: 'Account Approved',
        message: `Welcome to Credit Trust! Your partner account has been approved. Your partner code is ${partnerCode}. Login credentials have been sent to your email.`,
        metadata: { partner_code: partnerCode },
      });
    } catch (notifErr) {
      console.error('Failed to create approval notification (non-blocking):', notifErr);
    }

    return NextResponse.json({
      success: true,
      partnerCode,
      email: partnerRequest.email,
      password,
      name: partnerRequest.name,
    });
  } catch (err) {
    console.error('Approve partner API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
