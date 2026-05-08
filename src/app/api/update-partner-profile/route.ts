import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Read Bearer token from Authorization header (session stored in localStorage, not cookies)
    const authHeader = req.headers.get('authorization') ?? '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyName, authorizedPerson, mobile, gstNumber, address } = await req.json();

    // Update partners table
    const { error: partnerError } = await supabaseAdmin
      .from('partners')
      .update({
        company_name: companyName ?? '',
        authorized_person: authorizedPerson ?? '',
        mobile: mobile ?? '',
        gst_number: gstNumber ?? '',
        address: address ?? '',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (partnerError) {
      console.error('[update-partner-profile] partner update error:', partnerError.message);
      return NextResponse.json({ error: partnerError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[update-partner-profile] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
