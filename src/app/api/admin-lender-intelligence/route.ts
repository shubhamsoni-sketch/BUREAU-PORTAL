import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

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

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [lendersResult, appsResult, reportsResult, invoicesResult] = await Promise.all([
      auth.supabase
        .from('crm_lenders')
        .select(
          'id,name,type,products,status,approval_rate,active_apps,score_cutoff,min_income,max_loan,avg_tat,rm,updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(500),
      auth.supabase
        .from('crm_applications')
        .select('id,lender_name,product,loan_amount,status,rejection_reason,created_at,updated_at')
        .gte('created_at', monthStart)
        .order('created_at', { ascending: false })
        .limit(3000),
      auth.supabase
        .from('crm_eligibility_reports')
        .select('id,loan_type,score,status,matched_lenders,created_at')
        .gte('created_at', monthStart)
        .order('created_at', { ascending: false })
        .limit(3000),
      auth.supabase
        .from('invoices')
        .select('id,partner_name,amount,status,invoice_number,issued_at')
        .order('issued_at', { ascending: false })
        .limit(500),
    ]);

    const firstError = [
      lendersResult.error,
      appsResult.error,
      reportsResult.error,
      invoicesResult.error,
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

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      summary: {
        totalLenders: lenders.length,
        activeLenders: activeLenders.length,
        mappedProducts: lenders.reduce((sum, lender) => sum + lender.products.length, 0),
        reportsChecked: reports.length,
        matchedReports: matchedReports.length,
        matchRate: reports.length ? Math.round((matchedReports.length / reports.length) * 100) : 0,
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
