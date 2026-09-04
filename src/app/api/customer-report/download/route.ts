import { NextRequest, NextResponse } from 'next/server';
import { requireB2cSession } from '@/lib/b2c/security';
import { renderFinancialAnalysisPdf } from '@/lib/b2c/financial-report-pdf';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

function hasDownloadableReport(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasDownloadableReport);
  const data = value as Record<string, unknown>;
  if (String(data.status ?? '').toLowerCase() === 'no_hit') return true;
  if (data.consumerCreditData) return true;
  return Object.values(data).some(hasDownloadableReport);
}

function fileName(name: string | null, reportId: string | null) {
  const value = `${name || 'financial-report'}-${reportId || Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${value || 'financial-report'}.pdf`;
}

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('request_id') || '';
  if (!requireB2cSession(request, requestId)) {
    return NextResponse.json({ success: false, error: 'This report session has expired.' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('b2c_report_requests')
      .select('id,status,full_name,report_id,report_json,created_at,download_count')
      .eq('id', requestId)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.status !== 'report_generated' || !data.report_json) {
      return NextResponse.json({ success: false, error: 'Report is not ready for download.' }, { status: 409 });
    }
    if (!hasDownloadableReport(data.report_json)) {
      return NextResponse.json({ success: false, error: 'The bureau response did not contain a downloadable report.' }, { status: 409 });
    }

    const pdf = await renderFinancialAnalysisPdf({
      rawJson: data.report_json,
      reportId: data.report_id || data.id,
      fallbackName: data.full_name,
      createdAt: data.created_at,
    });
    await supabase.from('b2c_report_requests').update({
      download_count: Number(data.download_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', requestId);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${fileName(data.full_name, data.report_id)}"`,
        'cache-control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[customer-report/download]', error);
    return NextResponse.json({ success: false, error: 'Unable to download the report.' }, { status: 500 });
  }
}
