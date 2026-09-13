import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { logLenderIntelligenceAudit } from '@/lib/lender-intelligence/audit';
import { requireLenderIntelligenceCapability } from '@/lib/lender-intelligence/access';

export const runtime = 'nodejs';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 90;
const MAX_ROWS = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const params = new URL(request.url).searchParams;
  const dataset = params.get('dataset') || '';
  const complianceDatasets = new Set(['audit', 'compliance']);
  const financeDatasets = new Set([
    'lender-reconciliation',
    'lender-invoices',
    'partner-payables',
    'partner-payment-requests',
    'partner-recoveries',
  ]);
  if (!complianceDatasets.has(dataset) && !financeDatasets.has(dataset))
    return NextResponse.json(
      { success: false, error: 'Unsupported export dataset' },
      { status: 400 }
    );
  const denied = requireLenderIntelligenceCapability(
    auth.user,
    financeDatasets.has(dataset) ? 'finance.read' : 'compliance.read'
  );
  if (denied)
    return NextResponse.json({ success: false, error: denied.error }, { status: denied.status });

  const partnerId = params.get('partnerId')?.trim() || null;
  const now = new Date();
  const requestedFrom = params.get('from')
    ? new Date(params.get('from') as string)
    : new Date(now.getTime() - 30 * DAY_MS);
  const requestedTo = params.get('to') ? new Date(params.get('to') as string) : now;
  if (partnerId && !UUID.test(partnerId))
    return NextResponse.json(
      { success: false, error: 'Partner ID must be a valid UUID' },
      { status: 400 }
    );
  if (!Number.isFinite(requestedFrom.getTime()) || !Number.isFinite(requestedTo.getTime()))
    return NextResponse.json(
      { success: false, error: 'Export dates are invalid' },
      { status: 400 }
    );
  if (requestedFrom >= requestedTo || requestedTo > new Date(now.getTime() + 5 * 60 * 1000))
    return NextResponse.json(
      { success: false, error: 'Export date window is invalid' },
      { status: 400 }
    );
  if (requestedTo.getTime() - requestedFrom.getTime() > MAX_DAYS * DAY_MS)
    return NextResponse.json(
      { success: false, error: `Export window cannot exceed ${MAX_DAYS} days` },
      { status: 400 }
    );

  let content: string;
  let rowCount = 0;
  if (dataset === 'audit') {
    let query = auth.supabase
      .from('lender_intelligence_audit_logs')
      .select('id,partner_id,actor_user_id,module,action,entity_type,entity_id,created_at')
      .gte('created_at', requestedFrom.toISOString())
      .lte('created_at', requestedTo.toISOString())
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (partnerId) query = query.eq('partner_id', partnerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const rows = data || [];
    rowCount = rows.length;
    content = csv(
      [
        'audit_id',
        'partner_id',
        'actor_user_id',
        'module',
        'action',
        'entity_type',
        'entity_id',
        'created_at',
      ],
      rows.map((row) => [
        row.id,
        row.partner_id,
        row.actor_user_id,
        row.module,
        row.action,
        row.entity_type,
        row.entity_id,
        row.created_at,
      ])
    );
  } else if (dataset === 'compliance') {
    let query = auth.supabase
      .from('lender_data_quality_issues')
      .select(
        'id,partner_id,lender_id,program_id,application_id,issue_type,severity,status,title,owner_user_id,due_at,resolved_at,source,created_at,updated_at'
      )
      .gte('created_at', requestedFrom.toISOString())
      .lte('created_at', requestedTo.toISOString())
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (partnerId) query = query.eq('partner_id', partnerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const rows = data || [];
    rowCount = rows.length;
    content = csv(
      [
        'issue_id',
        'partner_id',
        'lender_id',
        'program_id',
        'application_id',
        'issue_type',
        'severity',
        'status',
        'title',
        'owner_user_id',
        'due_at',
        'resolved_at',
        'source',
        'created_at',
        'updated_at',
      ],
      rows.map((row) => [
        row.id,
        row.partner_id,
        row.lender_id,
        row.program_id,
        row.application_id,
        row.issue_type,
        row.severity,
        row.status,
        row.title,
        row.owner_user_id,
        row.due_at,
        row.resolved_at,
        row.source,
        row.created_at,
        row.updated_at,
      ])
    );
  } else if (dataset === 'lender-reconciliation') {
    let query = auth.supabase
      .from('lender_reconciliation_items')
      .select(
        'id,partner_id,application_id,outcome_id,commercial_version_id,invoice_id,expected_amount,tax_amount,invoiced_amount,received_amount,status,external_reference,due_at,settled_at,created_at,updated_at,lender_outcomes!inner(lender_id,program_id,disbursed_amount,disbursed_at)'
      )
      .gte('created_at', requestedFrom.toISOString())
      .lte('created_at', requestedTo.toISOString())
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (partnerId) query = query.eq('partner_id', partnerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const rows = data || [];
    rowCount = rows.length;
    content = csv(
      [
        'reconciliation_id',
        'partner_id',
        'application_id',
        'outcome_id',
        'commercial_version_id',
        'invoice_id',
        'lender_id',
        'program_id',
        'disbursed_amount',
        'disbursed_at',
        'expected_amount',
        'tax_amount',
        'invoiced_amount',
        'received_amount',
        'open_amount',
        'status',
        'external_reference',
        'due_at',
        'settled_at',
        'created_at',
        'updated_at',
      ],
      rows.map((row) => {
        const outcome = Array.isArray(row.lender_outcomes)
          ? row.lender_outcomes[0]
          : row.lender_outcomes;
        return [
          row.id,
          row.partner_id,
          row.application_id,
          row.outcome_id,
          row.commercial_version_id,
          row.invoice_id,
          outcome?.lender_id,
          outcome?.program_id,
          outcome?.disbursed_amount,
          outcome?.disbursed_at,
          row.expected_amount,
          row.tax_amount,
          row.invoiced_amount,
          row.received_amount,
          Math.max(
            0,
            Number(
              row.invoice_id
                ? row.invoiced_amount
                : Number(row.expected_amount) + Number(row.tax_amount)
            ) - Number(row.received_amount)
          ),
          row.status,
          row.external_reference,
          row.due_at,
          row.settled_at,
          row.created_at,
          row.updated_at,
        ];
      })
    );
  } else if (dataset === 'lender-invoices') {
    let query = auth.supabase
      .from('lender_invoices')
      .select(
        'id,partner_id,lender_id,invoice_number,direction,subtotal,tax_amount,total_amount,paid_amount,adjustment_amount,status,issued_at,due_at,paid_at,payment_reference,created_at,updated_at'
      )
      .gte('created_at', requestedFrom.toISOString())
      .lte('created_at', requestedTo.toISOString())
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (partnerId) query = query.eq('partner_id', partnerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const rows = data || [];
    rowCount = rows.length;
    content = csv(
      [
        'invoice_id',
        'partner_id',
        'lender_id',
        'invoice_number',
        'direction',
        'subtotal',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'adjustment_amount',
        'open_amount',
        'status',
        'issued_at',
        'due_at',
        'paid_at',
        'payment_reference',
        'created_at',
        'updated_at',
      ],
      rows.map((row) => [
        row.id,
        row.partner_id,
        row.lender_id,
        row.invoice_number,
        row.direction,
        row.subtotal,
        row.tax_amount,
        row.total_amount,
        row.paid_amount,
        row.adjustment_amount,
        Math.max(
          0,
          Number(row.total_amount) - Number(row.paid_amount) - Number(row.adjustment_amount)
        ),
        row.status,
        row.issued_at,
        row.due_at,
        row.paid_at,
        row.payment_reference,
        row.created_at,
        row.updated_at,
      ])
    );
  } else if (dataset === 'partner-payables') {
    let query = auth.supabase
      .from('partner_commission_items')
      .select(
        'id,partner_id,application_id,outcome_id,commission_version_id,payout_profile_version_id,lender_id,program_id,disbursed_amount,gross_commission,tax_amount,withholding_amount,net_payable,paid_amount,status,due_at,settled_at,beneficiary_snapshot,created_at,updated_at'
      )
      .gte('created_at', requestedFrom.toISOString())
      .lte('created_at', requestedTo.toISOString())
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    if (partnerId) query = query.eq('partner_id', partnerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const rows = data || [];
    rowCount = rows.length;
    content = csv(
      [
        'payable_id',
        'partner_id',
        'application_id',
        'outcome_id',
        'commission_version_id',
        'payout_profile_version_id',
        'lender_id',
        'program_id',
        'disbursed_amount',
        'gross_commission',
        'tax_amount',
        'withholding_amount',
        'net_payable',
        'paid_amount',
        'open_amount',
        'status',
        'due_at',
        'settled_at',
        'beneficiary_profile_version',
        'account_last4',
        'ifsc',
        'beneficiary_reference',
        'created_at',
        'updated_at',
      ],
      rows.map((row) => {
        const beneficiary =
          row.beneficiary_snapshot &&
          typeof row.beneficiary_snapshot === 'object' &&
          !Array.isArray(row.beneficiary_snapshot)
            ? (row.beneficiary_snapshot as Record<string, unknown>)
            : {};
        return [
          row.id,
          row.partner_id,
          row.application_id,
          row.outcome_id,
          row.commission_version_id,
          row.payout_profile_version_id,
          row.lender_id,
          row.program_id,
          row.disbursed_amount,
          row.gross_commission,
          row.tax_amount,
          row.withholding_amount,
          row.net_payable,
          row.paid_amount,
          Number(row.net_payable) - Number(row.paid_amount),
          row.status,
          row.due_at,
          row.settled_at,
          beneficiary.profileVersion,
          beneficiary.accountNumberLast4,
          beneficiary.ifsc,
          beneficiary.beneficiaryReference,
          row.created_at,
          row.updated_at,
        ];
      })
    );
  } else if (dataset === 'partner-payment-requests') {
    let query = auth.supabase
      .from('partner_commission_payment_requests')
      .select(
        'id,commission_item_id,amount,payment_reference,idempotency_key,status,requested_by,requested_at,reviewed_by,reviewed_at,payment_id,partner_commission_items!inner(partner_id)'
      )
      .gte('requested_at', requestedFrom.toISOString())
      .lte('requested_at', requestedTo.toISOString())
      .order('requested_at', { ascending: false })
      .limit(MAX_ROWS);
    if (partnerId) query = query.eq('partner_commission_items.partner_id', partnerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const rows = data || [];
    rowCount = rows.length;
    content = csv(
      [
        'request_id',
        'commission_item_id',
        'partner_id',
        'amount',
        'payment_reference',
        'idempotency_key',
        'status',
        'requested_by',
        'requested_at',
        'reviewed_by',
        'reviewed_at',
        'payment_id',
      ],
      rows.map((row) => {
        const joined = Array.isArray(row.partner_commission_items)
          ? row.partner_commission_items[0]
          : row.partner_commission_items;
        return [
          row.id,
          row.commission_item_id,
          joined?.partner_id,
          row.amount,
          row.payment_reference,
          row.idempotency_key,
          row.status,
          row.requested_by,
          row.requested_at,
          row.reviewed_by,
          row.reviewed_at,
          row.payment_id,
        ];
      })
    );
  } else {
    let query = auth.supabase
      .from('partner_commission_recoveries')
      .select(
        'id,commission_item_id,partner_id,amount,trigger_code,status,requested_by,requested_at,resolved_by,resolved_at,resolution_reference'
      )
      .gte('requested_at', requestedFrom.toISOString())
      .lte('requested_at', requestedTo.toISOString())
      .order('requested_at', { ascending: false })
      .limit(MAX_ROWS);
    if (partnerId) query = query.eq('partner_id', partnerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const rows = data || [];
    rowCount = rows.length;
    content = csv(
      [
        'recovery_id',
        'commission_item_id',
        'partner_id',
        'amount',
        'trigger_code',
        'status',
        'requested_by',
        'requested_at',
        'resolved_by',
        'resolved_at',
        'resolution_reference',
      ],
      rows.map((row) => [
        row.id,
        row.commission_item_id,
        row.partner_id,
        row.amount,
        row.trigger_code,
        row.status,
        row.requested_by,
        row.requested_at,
        row.resolved_by,
        row.resolved_at,
        row.resolution_reference,
      ])
    );
  }

  await logLenderIntelligenceAudit(auth.supabase, auth.user, {
    partnerId,
    module: complianceDatasets.has(dataset)
      ? 'compliance'
      : dataset.startsWith('partner-')
        ? 'partner_commissions'
        : 'invoicing',
    action: `export_${dataset}`,
    entityType: `${dataset}_register`,
    summary: `${dataset} register exported`,
    metadata: {
      from: requestedFrom.toISOString(),
      to: requestedTo.toISOString(),
      rowCount,
      maxRows: MAX_ROWS,
      partnerScoped: Boolean(partnerId),
      format: 'csv',
      freeTextIncluded: false,
      piiIncluded: false,
    },
  });

  const stamp = now.toISOString().slice(0, 10);
  return new NextResponse(`\uFEFF${content}`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="lender-${dataset}-${stamp}.csv"`,
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
    },
  });
}
