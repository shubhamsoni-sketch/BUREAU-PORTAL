import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCrmPermission } from '@/lib/crm/access';
import { getCrmTableData } from '@/lib/crm/db';
import { resolveCrmScope } from '@/lib/crm/scope';

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

async function context(request: NextRequest) {
  const supabase = createAdminClient();
  const scope = await resolveCrmScope(request, supabase);
  if (!scope.partnerId || scope.isDemo) return { error: fail('Partner account is required', 403) };
  const store = (await getCrmTableData(supabase, scope)) || {};
  const access = requireCrmPermission(scope, store, 'lender_selection');
  if (!access.ok) return { error: fail(access.error, access.status) };
  return { supabase, scope };
}

export async function GET(request: NextRequest) {
  const resolved = await context(request);
  if ('error' in resolved) return resolved.error;
  const leadId = text(request.nextUrl.searchParams.get('leadId'));
  let query = resolved.supabase
    .from('lender_routing_decisions')
    .select(
      'id,lead_id,eligibility_report_id,engine_version,result_snapshot,selected_program_id,selected_rank,decision_type,override_reason_code,override_note,decided_at,lender_routing_exceptions(*)'
    )
    .eq('partner_id', resolved.scope.partnerId)
    .order('decided_at', { ascending: false })
    .limit(200);
  if (leadId) query = query.eq('lead_id', leadId);
  const { data, error } = await query;
  if (error) return fail(error.message, 500);
  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: NextRequest) {
  const resolved = await context(request);
  if ('error' in resolved) return resolved.error;
  const body = await request.json().catch(() => ({}));
  const action = text(body.action);
  if (action !== 'request_exception') return fail('Unsupported action');
  const decisionId = text(body.decisionId);
  const programId = text(body.programId);
  const reasonCode = text(body.reasonCode).toUpperCase();
  const reasonNote = text(body.reasonNote);
  if (!decisionId || !programId || !reasonCode || reasonNote.length < 10) {
    return fail('Decision, program, reason code, and a detailed reason are required');
  }
  const { data: result, error } = await resolved.supabase.rpc('request_lender_routing_exception', {
    p_partner_id: resolved.scope.partnerId,
    p_routing_decision_id: decisionId,
    p_program_id: programId,
    p_reason_code: reasonCode,
    p_reason_note: reasonNote,
    p_requester_user_id: resolved.scope.userId,
  });
  if (error) return fail(error.message, 409);
  const data = Array.isArray(result) ? result[0] : result;
  return NextResponse.json({ success: true, data });
}
