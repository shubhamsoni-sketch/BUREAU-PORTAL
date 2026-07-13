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

    // Create auth user with service role
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
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

    const newUserId = authData.user.id;

    // Ensure user_profiles row exists with is_temp_password = true
    await adminClient
      .from('user_profiles')
      .upsert(
        {
          id: newUserId,
          email,
          full_name: resolvedFullName,
          role: 'partner',
          is_temp_password: true,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );

    // Create partner record
    const { error: partnerError } = await adminClient.from('partners').insert({
      user_id: newUserId,
      name: resolvedFullName,
      company_name: resolvedCompany,
      mobile: resolvedPhone,
      email,
      city: city || '',
      partner_code: partnerCode,
      status: 'approved',
      pricing_plan: pricingPlan || 'Basic',
      product_access: normalizePartnerProductAccess(productAccess),
      wallet_balance: 0,
      reports_pulled: 0,
    });

    if (partnerError) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create partner record: ' + partnerError.message },
        { status: 500 }
      );
    }

    // Send credentials email via Resend edge function (non-blocking — don't fail if email fails)
    try {
      const loginUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/partner-login`
        : 'https://credittrust.in/partner-login';
      await fetch(
        `${supabaseUrl}/functions/v1/send-partner-credentials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            partnerName: resolvedFullName,
            partnerEmail: email,
            tempPassword: password,
            loginUrl,
          }),
        }
      );
    } catch {
      // Email failure is non-fatal — partner is still created
      console.warn('[add-partner] Credentials email failed to send');
    }

    return NextResponse.json({
      success: true,
      partnerCode,
      email,
      password,
      name: resolvedFullName,
    });
  } catch (err) {
    console.error('Add partner API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
