import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      company_name,
      mobile,
      email,
      address,
      state,
      pin_code,
      gst,
      business_type,
      service_type,
    } = body;

    // Validate required fields
    if (!name || !company_name || !mobile || !email || !address || !state || !pin_code || !business_type || !service_type) {
      return NextResponse.json(
        { error: 'All required fields must be filled.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const isRealServiceKey =
      serviceRoleKey &&
      serviceRoleKey.length > 20 &&
      !serviceRoleKey.startsWith('your-') &&
      !serviceRoleKey.includes('here');

    const supabaseAdmin = createClient(
      supabaseUrl,
      isRealServiceKey ? serviceRoleKey! : anonKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabaseAdmin
      .from('partner_requests')
      .insert({
        name: name.trim(),
        company_name: company_name.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        state: state.trim(),
        pin_code: pin_code.trim(),
        gst: gst ? gst.trim().toUpperCase() : null,
        business_type: business_type.trim(),
        service_type: service_type.trim(),
        status: 'pending',
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An application with this email already exists.' },
          { status: 409 }
        );
      }
      // If columns don't exist yet, fall back to inserting without new fields
      if (error.code === '42703') {
        const { error: fallbackError } = await supabaseAdmin
          .from('partner_requests')
          .insert({
            name: name.trim(),
            company_name: company_name.trim(),
            mobile: mobile.trim(),
            email: email.trim().toLowerCase(),
            city: state.trim(),
            status: 'pending',
          });
        if (fallbackError) {
          if (fallbackError.code === '23505') {
            return NextResponse.json(
              { error: 'An application with this email already exists.' },
              { status: 409 }
            );
          }
          console.error('Partner request fallback insert error:', fallbackError);
          return NextResponse.json(
            { error: 'Failed to submit application. Please try again.' },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true }, { status: 200 });
      }
      console.error('Partner request insert error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Partner request API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
