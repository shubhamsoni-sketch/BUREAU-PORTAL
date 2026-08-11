import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireUser } from '@/lib/supabase/admin';
import { renderBureauReportHtml, renderBureauReportPdf } from '@/lib/bureau/report-pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Source = 'bureau_pulls' | 'b2c_report_requests' | 'crm_eligibility_reports';

function fileName(name: string | null | undefined, reportId: string | null | undefined) {
  const base = `${name || 'bureau-report'}-${reportId || Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'bureau-report'}.pdf`;
}

function pickRaw(row: any, source: Source) {
  if (source === 'bureau_pulls') return row.raw_json?.response ?? row.raw_json ?? {};
  if (source === 'crm_eligibility_reports') return row.raw_response ?? {};
  return row.report_json ?? row.api_response_json ?? {};
}

async function isAdminUser(auth: Awaited<ReturnType<typeof requireUser>>) {
  if ('error' in auth) return false;
  const role = auth.user.app_metadata?.role || auth.user.user_metadata?.role;
  if (role === 'admin') return true;
  const { data } = await auth.supabase
    .from('user_profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();
  return data?.role === 'admin';
}

async function canAccessPartnerReport(
  auth: Exclude<Awaited<ReturnType<typeof requireUser>>, { error: string }>,
  partnerId: string | null | undefined
) {
  if (!partnerId) return false;
  if (await isAdminUser(auth)) return true;

  const metadataPartnerId =
    auth.user.app_metadata?.crm_partner_id ||
    auth.user.app_metadata?.partner_id ||
    auth.user.user_metadata?.crm_partner_id ||
    auth.user.user_metadata?.partner_id;
  if (metadataPartnerId === partnerId) return true;

  const { data: partner } = await auth.supabase
    .from('partners')
    .select('id')
    .eq('id', partnerId)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (partner) return true;

  const { data: teamMember } = await auth.supabase
    .from('crm_team_members')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('auth_user_id', auth.user.id)
    .eq('status', 'active')
    .maybeSingle();
  return Boolean(teamMember);
}

async function usesViotalReportBranding(
  auth: Exclude<Awaited<ReturnType<typeof requireUser>>, { error: string }>,
  requestedPartnerId?: string | null
) {
  const metadataPartnerId =
    auth.user.app_metadata?.crm_partner_id ||
    auth.user.app_metadata?.partner_id ||
    auth.user.user_metadata?.crm_partner_id ||
    auth.user.user_metadata?.partner_id;
  const partnerId = requestedPartnerId || metadataPartnerId;

  let query = auth.supabase.from('partners').select('name,company_name');
  query = partnerId
    ? query.eq('id', partnerId)
    : query.eq('user_id', auth.user.id);
  const { data } = await query.maybeSingle();
  const identity = `${data?.name || ''} ${data?.company_name || ''}`.toLowerCase();
  return identity.includes('viotal');
}

async function loadReport(source: Source, id: string, auth: Exclude<Awaited<ReturnType<typeof requireUser>>, { error: string }>) {
  const supabase = auth.supabase;
  if (source === 'bureau_pulls') {
    const { data, error } = await supabase
      .from('bureau_pulls')
      .select('id,partner_id,customer_name,report_id,member_ref,raw_json,created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    if (!(await canAccessPartnerReport(auth, data.partner_id))) return 'forbidden' as const;
    return {
      rawJson: pickRaw(data, source),
      reportId: data.report_id || data.id,
      fallbackName: data.customer_name,
      createdAt: data.created_at,
      partnerId: data.partner_id,
    };
  }

  if (source === 'crm_eligibility_reports') {
    const { data, error } = await supabase
      .from('crm_eligibility_reports')
      .select('id,partner_id,borrower_name,request_id,raw_response,created_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    if (!(await canAccessPartnerReport(auth, data.partner_id))) return 'forbidden' as const;
    return {
      rawJson: pickRaw(data, source),
      reportId: data.request_id || data.id,
      fallbackName: data.borrower_name,
      createdAt: data.created_at,
      partnerId: data.partner_id,
    };
  }

  if (!(await isAdminUser(auth))) return 'forbidden' as const;

  const { data, error } = await supabase
    .from('b2c_report_requests')
    .select('id,full_name,report_id,report_json,api_response_json,created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    rawJson: pickRaw(data, source),
    reportId: data.report_id || data.id,
    fallbackName: data.full_name,
    createdAt: data.created_at,
    partnerId: null,
  };
}

async function makeResponse(input: Awaited<ReturnType<typeof loadReport>>, format: string) {
  if (input === 'forbidden') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  if (!input) return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });

  if (format === 'html') {
    return new NextResponse(renderBureauReportHtml(input), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const pdf = await renderBureauReportPdf(input);
  const body = new Uint8Array(pdf);
  return new NextResponse(body, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${fileName(input.fallbackName, input.reportId)}"`,
      'cache-control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const source = (searchParams.get('source') || 'bureau_pulls') as Source;
    const format = searchParams.get('format') || 'pdf';

    if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    if (!['bureau_pulls', 'b2c_report_requests', 'crm_eligibility_reports'].includes(source)) {
      return NextResponse.json({ success: false, error: 'Invalid report source' }, { status: 400 });
    }

    const input = await loadReport(source, id, auth);
    const brandedInput = input && input !== 'forbidden' && await usesViotalReportBranding(auth, input.partnerId)
      ? { ...input, providerLogoDataUrl: 'bundled' }
      : input;
    return makeResponse(brandedInput, format);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate bureau report PDF';
    console.error('[bureau-report-pdf] GET error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const input = {
      rawJson: body.raw_json ?? body.rawJson ?? body.response ?? {},
      reportId: body.report_id ?? body.reportId ?? null,
      fallbackName: body.customer_name ?? body.customerName ?? body.name ?? null,
      createdAt: body.created_at ?? body.createdAt ?? null,
      partnerId: body.partner_id ?? body.partnerId ?? null,
      providerLogoDataUrl: null as string | null,
    };
    if (input.partnerId && !(await canAccessPartnerReport(auth, input.partnerId))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (await usesViotalReportBranding(auth, input.partnerId)) input.providerLogoDataUrl = 'bundled';
    return makeResponse(input, body.format || 'pdf');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate bureau report PDF';
    console.error('[bureau-report-pdf] POST error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
