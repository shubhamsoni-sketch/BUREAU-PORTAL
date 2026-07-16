import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { generatePartnerCode } from '@/lib/partner-code';
import { normalizePartnerProductAccess } from '@/lib/partner-access';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { generateTemporaryPassword } from '@/lib/security/password';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isRealServiceKey =
      serviceRoleKey &&
      serviceRoleKey.length > 20 &&
      !serviceRoleKey.startsWith('your-') &&
      !serviceRoleKey.includes('here');

    if (!isRealServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' },
        { status: 503 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const auth = await requireAdmin(bearerToken(request));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      // New fields from updated form
      companyName,
      authorisedPersonName,
      contactNumber,
      address,
      state,
      pinCode,
      gst,
      businessType,
      serviceType,
      pricingPlan,
      productAccess,
      // Legacy fields (kept for backward compatibility)
      fullName: legacyFullName,
      email,
      phone,
      city,
    } = body;

    // Resolve name and phone from either new or legacy fields
    const resolvedFullName = authorisedPersonName || legacyFullName;
    const resolvedPhone = contactNumber || phone || '';
    const resolvedCompany = companyName || '';

    if (!resolvedFullName || !email) {
      return NextResponse.json({ error: 'Authorised person name and email are required' }, { status: 400 });
    }

    const password = generateTemporaryPassword();
    const partnerCode = await generatePartnerCode(adminClient);
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existingUsersData } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsersData?.users?.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    let newUserId: string;

    if (existingUser) {
      newUserId = existingUser.id;
      const { error: updateError } = await adminClient.auth.admin.updateUserById(newUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: resolvedFullName,
          role: 'partner',
        },
        app_metadata: {
          role: 'partner',
          is_temp_password: true,
        },
      });

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || 'Failed to update existing auth user' },
          { status: 500 }
        );
      }
    } else {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: resolvedFullName,
          role: 'partner',
        },
        app_metadata: {
          role: 'partner',
          is_temp_password: true,
        },
      });

      if (authError || !authData.user) {
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
      .upsert(
        {
          id: newUserId,
          email: normalizedEmail,
          full_name: resolvedFullName,
          role: 'partner',
          is_temp_password: true,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );

    const { data: existingPartner } = await adminClient
      .from('partners')
      .select('id, partner_code')
      .or(`user_id.eq.${newUserId},email.eq.${normalizedEmail}`)
      .maybeSingle();

    let finalPartnerCode = existingPartner?.partner_code || partnerCode;

    if (existingPartner) {
      const { error: partnerUpdateError } = await adminClient
        .from('partners')
        .update({
          user_id: newUserId,
          name: resolvedFullName,
          company_name: resolvedCompany,
          mobile: resolvedPhone,
          email: normalizedEmail,
          city: city || '',
          authorized_person: resolvedFullName,
          address: address || '',
          gst_number: gst || '',
          pricing_plan: pricingPlan || 'Basic',
          product_access: normalizePartnerProductAccess(productAccess),
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPartner.id);

      if (partnerUpdateError) {
        return NextResponse.json(
          { error: 'Failed to update partner record: ' + partnerUpdateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: partnerError } = await adminClient.from('partners').insert({
        user_id: newUserId,
        name: resolvedFullName,
        company_name: resolvedCompany,
        mobile: resolvedPhone,
        email: normalizedEmail,
        city: city || '',
        authorized_person: resolvedFullName,
        address: address || '',
        gst_number: gst || '',
        partner_code: finalPartnerCode,
        status: 'approved',
        pricing_plan: pricingPlan || 'Basic',
        product_access: normalizePartnerProductAccess(productAccess),
        wallet_balance: 0,
        reports_pulled: 0,
      });

      if (partnerError) {
        if (!existingUser) await adminClient.auth.admin.deleteUser(newUserId);
        return NextResponse.json(
          { error: 'Failed to create partner record: ' + partnerError.message },
          { status: 500 }
        );
      }
    }

    let emailSent = false;
    let emailError: string | null = null;

    // Send credentials email via Resend edge function (non-blocking — don't fail if email fails)
    try {
      const loginUrl = process.env.NEXT_PUBLIC_PORTAL_URL
        ? `${process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, '')}/partner-login`
        : 'https://portal.credittrust.in/partner-login';
      const mailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-partner-credentials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            partnerName: resolvedFullName,
            partnerEmail: normalizedEmail,
            tempPassword: password,
            loginUrl,
          }),
        }
      );
      if (mailResponse.ok) {
        emailSent = true;
      } else {
        const mailData = await mailResponse.json().catch(() => null);
        emailError = mailData?.error || 'Credentials email failed to send';
        console.warn('[add-partner] Credentials email failed to send:', emailError);
      }
    } catch (error) {
      // Email failure is non-fatal — partner is still created
      emailError = error instanceof Error ? error.message : 'Credentials email failed to send';
      console.warn('[add-partner] Credentials email failed to send:', emailError);
    }

    return NextResponse.json({
      success: true,
      partnerCode: finalPartnerCode,
      email: normalizedEmail,
      password,
      name: resolvedFullName,
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error('Add partner API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
