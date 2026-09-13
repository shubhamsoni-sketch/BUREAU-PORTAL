import { NextRequest, NextResponse } from 'next/server';
import { requireLenderIntelligenceCapability } from '@/lib/lender-intelligence/access';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) return fail(auth.error || 'Unauthorized', auth.status || 401);
  const denied = requireLenderIntelligenceCapability(auth.user, 'compliance.read');
  if (denied) return fail(denied.error, denied.status);

  const [issues, documents, auditLogs, scanRuns] = await Promise.all([
    auth.supabase
      .from('lender_data_quality_issues')
      .select(
        'id,partner_id,lender_id,program_id,application_id,issue_type,severity,status,title,detail,owner_user_id,due_at,resolved_at,resolution_note,source,created_at,updated_at'
      )
      .order('created_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('lender_policy_documents')
      .select(
        'id,lender_id,program_id,policy_version_id,document_type,file_name,mime_type,checksum,expires_at,review_status,reviewed_at,reviewed_by,created_at'
      )
      .order('created_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('lender_intelligence_audit_logs')
      .select('id,partner_id,actor_user_id,module,action,entity_type,entity_id,created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    auth.supabase
      .from('lender_compliance_scan_runs')
      .select(
        'id,readiness_issue_count,partner_payable_issue_count,total_issue_count,started_at,completed_at'
      )
      .order('completed_at', { ascending: false })
      .limit(50),
  ]);
  const firstError = [issues.error, documents.error, auditLogs.error, scanRuns.error].find(Boolean);
  if (firstError) return fail('Unable to load lender compliance evidence', 500);

  return NextResponse.json({
    success: true,
    data: {
      dataQualityIssues: issues.data || [],
      documents: documents.data || [],
      auditLogs: auditLogs.data || [],
      scanRuns: scanRuns.data || [],
    },
  });
}
