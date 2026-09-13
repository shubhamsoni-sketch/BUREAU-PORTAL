import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { requireLenderIntelligenceCapability } from '@/lib/lender-intelligence/access';

type LenderRow = {
  id: string;
  name: string | null;
  type: string | null;
  products: string[] | null;
  status: string | null;
  approval_rate: number | string | null;
  active_apps: number | string | null;
  score_cutoff: number | string | null;
  min_income: number | string | null;
  max_loan: number | string | null;
  avg_tat: string | null;
  rm: string | null;
  updated_at: string | null;
};

type ApplicationRow = {
  id: string;
  lender_name: string | null;
  product: string | null;
  loan_amount: number | string | null;
  status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ReportRow = {
  id: string;
  loan_type: string | null;
  score: number | null;
  status: string | null;
  matched_lenders: unknown;
  created_at: string | null;
};

type InvoiceRow = {
  id: string;
  partner_name: string | null;
  amount: number | string | null;
  status: string | null;
  invoice_number: string | null;
  issued_at: string | null;
};

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusKey(value: unknown) {
  return String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function productLabel(value: unknown) {
  return String(value || 'not_mapped').replace(/_/g, ' ');
}

function percentile(values: number[], quantile: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return (
    Math.round(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)] * 10) /
    10
  );
}

function formatLender(row: LenderRow) {
  return {
    id: row.id,
    name: row.name || 'Unnamed lender',
    type: row.type || 'bank',
    products: Array.isArray(row.products) ? row.products : [],
    status: row.status || 'active',
    approvalRate: numberValue(row.approval_rate),
    activeApps: numberValue(row.active_apps),
    scoreCutoff: numberValue(row.score_cutoff),
    minIncome: numberValue(row.min_income),
    maxLoan: numberValue(row.max_loan),
    avgTat: row.avg_tat || '-',
    rm: row.rm || '-',
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }
  const denied = requireLenderIntelligenceCapability(auth.user, 'intelligence.read');
  if (denied)
    return NextResponse.json({ success: false, error: denied.error }, { status: denied.status });

  try {
    const now = new Date();
    const cohortStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [
      lendersResult,
      appsResult,
      reportsResult,
      invoicesResult,
      outcomesResult,
      eventsResult,
      decisionsResult,
      policiesResult,
      reconciliationResult,
      qualityResult,
      kpiResult,
      kpiBreakdownResult,
      profilePerformanceResult,
    ] = await Promise.all([
      auth.supabase
        .from('crm_lenders')
        .select(
          'id,name,type,products,status,approval_rate,active_apps,score_cutoff,min_income,max_loan,avg_tat,rm,updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(500),
      auth.supabase
        .from('crm_lender_applications')
        .select('id,lender_name,product,loan_amount,status,rejection_reason,created_at,updated_at')
        .gte('created_at', cohortStart)
        .order('created_at', { ascending: false })
        .limit(3000),
      auth.supabase
        .from('crm_eligibility_reports')
        .select('id,loan_type,score,status,matched_lenders,created_at')
        .gte('created_at', cohortStart)
        .order('created_at', { ascending: false })
        .limit(3000),
      auth.supabase
        .from('invoices')
        .select('id,partner_name,amount,status,invoice_number,issued_at')
        .order('issued_at', { ascending: false })
        .limit(500),
      auth.supabase
        .from('lender_outcomes')
        .select('id,application_id,outcome,created_at')
        .limit(5000),
      auth.supabase
        .from('application_stage_events')
        .select('application_id,to_stage,occurred_at')
        .order('occurred_at', { ascending: true })
        .limit(10000),
      auth.supabase
        .from('lender_routing_decisions')
        .select('decision_type,selected_rank,decided_at')
        .gte('decided_at', cohortStart)
        .limit(5000),
      auth.supabase
        .from('lender_policy_versions')
        .select('id,status,review_due_at')
        .eq('status', 'published')
        .limit(2000),
      auth.supabase
        .from('lender_reconciliation_items')
        .select('expected_amount,received_amount,status')
        .limit(5000),
      auth.supabase
        .from('lender_data_quality_issues')
        .select('severity,status')
        .neq('status', 'resolved')
        .limit(2000),
      auth.supabase.rpc('get_lender_kpi_snapshot', {
        p_cohort_start: cohortStart,
        p_as_of: now.toISOString(),
        p_maturity_days: 30,
        p_min_sample: 20,
      }),
      auth.supabase.rpc('get_lender_kpi_breakdown', {
        p_cohort_start: cohortStart,
        p_as_of: now.toISOString(),
        p_maturity_days: 30,
        p_min_sample: 20,
      }),
      auth.supabase.rpc('get_lender_profile_performance', {
        p_cohort_start: cohortStart,
        p_as_of: now.toISOString(),
        p_min_sample: 20,
      }),
    ]);

    const firstError = [
      lendersResult.error,
      appsResult.error,
      reportsResult.error,
      invoicesResult.error,
      outcomesResult.error,
      eventsResult.error,
      decisionsResult.error,
      policiesResult.error,
      reconciliationResult.error,
      qualityResult.error,
      kpiResult.error,
      kpiBreakdownResult.error,
      profilePerformanceResult.error,
    ].find(Boolean);
    if (firstError) throw firstError;

    const lenders = ((lendersResult.data || []) as LenderRow[]).map(formatLender);
    const applications = (appsResult.data || []) as ApplicationRow[];
    const reports = (reportsResult.data || []) as ReportRow[];
    const invoices = (invoicesResult.data || []) as InvoiceRow[];
    const activeLenders = lenders.filter((item) => statusKey(item.status) === 'active');
    const sentApps = applications.filter((item) =>
      ['case_sent_to_lender', 'submitted_to_lender', 'sent', 'login_done'].includes(
        statusKey(item.status)
      )
    );
    const approvedApps = applications.filter((item) =>
      ['approved', 'sanctioned', 'disbursed'].includes(statusKey(item.status))
    );
    const rejectedApps = applications.filter((item) =>
      ['rejected', 'declined'].includes(statusKey(item.status))
    );

    const lenderVolume = new Map<
      string,
      { lender: string; files: number; amount: number; approved: number; rejected: number }
    >();
    for (const app of applications) {
      const lender = app.lender_name || 'Not assigned';
      const current = lenderVolume.get(lender) || {
        lender,
        files: 0,
        amount: 0,
        approved: 0,
        rejected: 0,
      };
      current.files += 1;
      current.amount += numberValue(app.loan_amount);
      if (['approved', 'sanctioned', 'disbursed'].includes(statusKey(app.status)))
        current.approved += 1;
      if (['rejected', 'declined'].includes(statusKey(app.status))) current.rejected += 1;
      lenderVolume.set(lender, current);
    }

    const productVolume = new Map<string, number>();
    for (const report of reports) {
      const label = productLabel(report.loan_type);
      productVolume.set(label, (productVolume.get(label) || 0) + 1);
    }

    const rejectionReasons = new Map<string, number>();
    for (const app of rejectedApps) {
      const reason = app.rejection_reason || 'Reason pending';
      rejectionReasons.set(reason, (rejectionReasons.get(reason) || 0) + 1);
    }

    const matchedReports = reports.filter((report) => {
      const value = report.matched_lenders;
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
    const pendingInvoices = invoices.filter((invoice) => statusKey(invoice.status) !== 'paid');
    const pendingInvoiceAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + numberValue(invoice.amount),
      0
    );
    const outcomes = outcomesResult.data || [];
    const terminalDecisions = outcomes.filter((item) =>
      ['approved', 'rejected'].includes(statusKey(item.outcome))
    );
    const approvedOutcomes = terminalDecisions.filter(
      (item) => statusKey(item.outcome) === 'approved'
    );
    const rejectedOutcomes = terminalDecisions.filter(
      (item) => statusKey(item.outcome) === 'rejected'
    );
    const disbursedOutcomes = outcomes.filter((item) => statusKey(item.outcome) === 'disbursed');
    const eventsByApplication = new Map<string, Array<{ to_stage: string; occurred_at: string }>>();
    for (const event of eventsResult.data || []) {
      const current = eventsByApplication.get(event.application_id) || [];
      current.push(event);
      eventsByApplication.set(event.application_id, current);
    }
    const sanctionTatHours: number[] = [];
    const disbursalTatHours: number[] = [];
    for (const events of eventsByApplication.values()) {
      const sent = events.find((event) =>
        ['case_sent_to_lender', 'submitted'].includes(statusKey(event.to_stage))
      );
      const sanction = events.find((event) => statusKey(event.to_stage) === 'sanctioned');
      const disbursal = events.find((event) => statusKey(event.to_stage) === 'disbursed');
      const sentAt = sent ? Date.parse(sent.occurred_at) : NaN;
      if (Number.isFinite(sentAt) && sanction)
        sanctionTatHours.push(Math.max(0, (Date.parse(sanction.occurred_at) - sentAt) / 3600000));
      if (Number.isFinite(sentAt) && disbursal)
        disbursalTatHours.push(Math.max(0, (Date.parse(disbursal.occurred_at) - sentAt) / 3600000));
    }
    const decisions = decisionsResult.data || [];
    const selections = decisions.filter((item) =>
      ['selected', 'override', 'exception'].includes(statusKey(item.decision_type))
    );
    const overrides = selections.filter(
      (item) => statusKey(item.decision_type) === 'override' || Number(item.selected_rank || 0) > 1
    );
    const policies = policiesResult.data || [];
    const freshPolicies = policies.filter(
      (item) => !item.review_due_at || Date.parse(item.review_due_at) >= now.getTime()
    );
    const reconciliation = reconciliationResult.data || [];
    const expectedPayout = reconciliation.reduce(
      (sum, item) => sum + numberValue(item.expected_amount),
      0
    );
    const receivedPayout = reconciliation.reduce(
      (sum, item) => sum + numberValue(item.received_amount),
      0
    );
    const openQualityIssues = qualityResult.data || [];
    const kpis = (
      kpiResult.data && typeof kpiResult.data === 'object' && !Array.isArray(kpiResult.data)
        ? kpiResult.data
        : {}
    ) as Record<string, { value?: unknown }> & {
      cohort?: unknown;
      decisionTAT?: unknown;
      disbursalTAT?: unknown;
      stageTAT?: unknown;
      outcomeRates?: unknown;
      lenderConversion?: unknown;
      programConversion?: unknown;
      rejectionTaxonomy?: unknown;
      similarProfiles?: unknown;
      funnel?: unknown;
    };

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      summary: {
        totalLenders: lenders.length,
        activeLenders: activeLenders.length,
        mappedProducts: lenders.reduce((sum, lender) => sum + lender.products.length, 0),
        reportsChecked: reports.length,
        matchedReports: matchedReports.length,
        matchRate: kpis.matchRate?.value ?? null,
        sentFiles: sentApps.length,
        approvalRate: applications.length
          ? Math.round((approvedApps.length / applications.length) * 100)
          : 0,
        rejectionRate: applications.length
          ? Math.round((rejectedApps.length / applications.length) * 100)
          : 0,
        pendingInvoiceAmount,
        pendingInvoices: pendingInvoices.length,
      },
      lenders,
      routing: {
        productVolume: Array.from(productVolume.entries()).map(([product, count]) => ({
          product,
          count,
        })),
        latestReports: reports.slice(0, 15).map((report) => ({
          id: report.id,
          product: productLabel(report.loan_type),
          score: report.score,
          status: report.status || 'completed',
          matchedCount: Array.isArray(report.matched_lenders) ? report.matched_lenders.length : 0,
          createdAt: report.created_at,
        })),
      },
      performance: {
        lenderVolume: Array.from(lenderVolume.values())
          .sort((a, b) => b.files - a.files)
          .slice(0, 20),
        rejectionReasons: Array.from(rejectionReasons.entries()).map(([reason, count]) => ({
          reason,
          count,
        })),
        latestApplications: applications.slice(0, 20).map((app) => ({
          id: app.id,
          lender: app.lender_name || 'Not assigned',
          product: productLabel(app.product),
          amount: numberValue(app.loan_amount),
          status: app.status || 'pending',
          updatedAt: app.updated_at || app.created_at,
        })),
      },
      compliance: {
        invoices: invoices.slice(0, 20).map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoice_number || invoice.id,
          partnerName: invoice.partner_name || 'Partner',
          amount: numberValue(invoice.amount),
          status: invoice.status || 'pending',
          issuedAt: invoice.issued_at,
        })),
      },
      intelligence: {
        cohort: kpis.cohort || {
          from: cohortStart,
          to: now.toISOString(),
          maturityDays: 30,
          minimumSampleSize: 20,
        },
        kpis,
        breakdown: Array.isArray(kpiBreakdownResult.data) ? kpiBreakdownResult.data : [],
        profilePerformance:
          profilePerformanceResult.data && typeof profilePerformanceResult.data === 'object'
            ? profilePerformanceResult.data
            : {
                cohort: {
                  from: cohortStart,
                  to: now.toISOString(),
                  minimumSampleSize: 20,
                  modelVersion: null,
                  mode: 'descriptive_only',
                  fallback: 'deterministic_policy_routing',
                },
                rows: [],
              },
        pendingDecisions: numberValue(kpis.pendingDecisions),
        terminalDecisions: terminalDecisions.length,
        approvalRate: terminalDecisions.length
          ? Math.round((approvedOutcomes.length / terminalDecisions.length) * 100)
          : 0,
        rejectionRate: terminalDecisions.length
          ? Math.round((rejectedOutcomes.length / terminalDecisions.length) * 100)
          : 0,
        disbursedFiles: disbursedOutcomes.length,
        overrideRate: selections.length
          ? Math.round((overrides.length / selections.length) * 100)
          : 0,
        policyFreshness: policies.length
          ? Math.round((freshPolicies.length / policies.length) * 100)
          : 0,
        publishedPolicies: policies.length,
        openQualityIssues: openQualityIssues.length,
        criticalQualityIssues: openQualityIssues.filter((item) => item.severity === 'critical')
          .length,
        expectedPayout,
        receivedPayout,
        outstandingPayout: Math.max(0, expectedPayout - receivedPayout),
        sanctionTatHours: kpis.sanctionTatHours || {
          sampleSize: sanctionTatHours.length,
          median: percentile(sanctionTatHours, 0.5),
          p75: percentile(sanctionTatHours, 0.75),
          p90: percentile(sanctionTatHours, 0.9),
        },
        disbursalTatHours: kpis.disbursalTatHours || {
          sampleSize: disbursalTatHours.length,
          median: percentile(disbursalTatHours, 0.5),
          p75: percentile(disbursalTatHours, 0.75),
          p90: percentile(disbursalTatHours, 0.9),
        },
      },
    });
  } catch (error) {
    console.error('[admin-lender-intelligence] failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to load lender intelligence',
      },
      { status: 500 }
    );
  }
}
