import { NextRequest, NextResponse } from 'next/server'
import { buildComparisonHistory, buildCreditIntelligence } from '@/lib/credit-intelligence/analytics'
import { requireB2cSession } from '@/lib/b2c/security'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = new URL(request.url).searchParams.get('request_id')
  if (!requestId) return NextResponse.json({ error: 'Missing report request.' }, { status: 400 })
  if (!requireB2cSession(request, requestId)) {
    return NextResponse.json({ error: 'This report session has expired.' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data: report, error } = await supabase.from('b2c_report_requests').select('id,status,full_name,mobile,report_id,report_json,credit_score,created_at').eq('id', requestId).maybeSingle()
  if (error || !report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
  if (report.status !== 'report_generated' || !report.report_json) return NextResponse.json({ error: 'Your report is still being prepared.' }, { status: 409 })
  const { data: history } = await supabase.from('b2c_report_requests').select('id,report_id,credit_score,report_json,created_at').eq('mobile', report.mobile).eq('status', 'report_generated').not('report_json', 'is', null).order('created_at', { ascending: true }).limit(12)
  return NextResponse.json({ success: true, intelligence: buildCreditIntelligence(report.report_json, { fullName: report.full_name, reportId: report.report_id, createdAt: report.created_at }), history: buildComparisonHistory(history ?? []) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
