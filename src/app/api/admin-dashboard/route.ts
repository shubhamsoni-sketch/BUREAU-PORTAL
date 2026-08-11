import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(bearerToken(req));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = startOfDay(now);
    const chartStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));

    const [partnersResult, pullsResult, invoicesResult, paymentsResult, requestsResult] = await Promise.all([
      auth.supabase
        .from('partners')
        .select('id, partner_code, name, company_name, email, status, wallet_balance, reports_pulled, product_access, created_at')
        .order('created_at', { ascending: false }),
      auth.supabase
        .from('bureau_pulls')
        .select(`
          id, partner_id, report_type, status, customer_name, credit_score,
          amount_deducted, error_message, member_ref, created_at,
          partners (company_name, name, partner_code)
        `)
        .gte('created_at', monthStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(5000),
      auth.supabase
        .from('invoices')
        .select('id, invoice_number, partner_id, partner_name, amount, status, issued_at')
        .order('issued_at', { ascending: false })
        .limit(1000),
      auth.supabase
        .from('payments')
        .select('id, partner_id, partner_name, amount, paid_at')
        .gte('paid_at', monthStart.toISOString())
        .order('paid_at', { ascending: false })
        .limit(1000),
      auth.supabase
        .from('partner_requests')
        .select('id, name, company_name, email, submitted_at, status')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false }),
    ]);

    const firstError = [partnersResult.error, pullsResult.error, invoicesResult.error, paymentsResult.error, requestsResult.error].find(Boolean);
    if (firstError) {
      console.error('[admin-dashboard] query error:', firstError);
      return NextResponse.json({ success: false, error: firstError.message }, { status: 500 });
    }

    const partners = partnersResult.data ?? [];
    const pulls = pullsResult.data ?? [];
    const invoices = invoicesResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const pendingRequests = requestsResult.data ?? [];

    const activePartners = partners.filter((partner) => ['active', 'approved'].includes(String(partner.status).toLowerCase()));
    const successfulPulls = pulls.filter((pull) => String(pull.status).toLowerCase() === 'success');
    const failedPulls = pulls.filter((pull) => String(pull.status).toLowerCase() === 'failed');
    const pendingInvoices = invoices.filter((invoice) => String(invoice.status).toLowerCase() === 'pending');
    const walletBalance = partners.reduce((total, partner) => total + numberValue(partner.wallet_balance), 0);
    const collections = payments.reduce((total, payment) => total + numberValue(payment.amount), 0);
    const todayPulls = pulls.filter((pull) => new Date(pull.created_at) >= todayStart).length;
    const newPartners = partners.filter((partner) => new Date(partner.created_at) >= monthStart).length;
    const lowBalancePartners = activePartners.filter((partner) => numberValue(partner.wallet_balance) <= 100);

    const activity = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(chartStart);
      day.setDate(chartStart.getDate() + index);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const rows = pulls.filter((pull) => {
        const createdAt = new Date(pull.created_at);
        return createdAt >= day && createdAt < nextDay;
      });

      return {
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
        total: rows.length,
        success: rows.filter((row) => String(row.status).toLowerCase() === 'success').length,
        failed: rows.filter((row) => String(row.status).toLowerCase() === 'failed').length,
      };
    });

    const partnerPullCounts = new Map<string, number>();
    for (const pull of pulls) {
      partnerPullCounts.set(pull.partner_id, (partnerPullCounts.get(pull.partner_id) ?? 0) + 1);
    }

    const topPartners = partners
      .map((partner) => ({
        id: partner.id,
        name: partner.company_name || partner.name,
        code: partner.partner_code,
        pulls: partnerPullCounts.get(partner.id) ?? 0,
        walletBalance: numberValue(partner.wallet_balance),
      }))
      .sort((a, b) => b.pulls - a.pulls)
      .slice(0, 5);

    const recentPulls = pulls.slice(0, 8).map((pull) => {
      const joinedPartner = Array.isArray(pull.partners) ? pull.partners[0] : pull.partners;
      return {
        id: pull.id,
        partnerName: joinedPartner?.company_name || joinedPartner?.name || 'Unknown partner',
        partnerCode: joinedPartner?.partner_code || '',
        customerName: pull.customer_name || 'Customer',
        memberRef: pull.member_ref || '',
        reportType: pull.report_type || 'consumer',
        status: pull.status,
        score: pull.credit_score,
        amount: numberValue(pull.amount_deducted),
        error: pull.error_message || '',
        createdAt: pull.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      summary: {
        totalPartners: partners.length,
        activePartners: activePartners.length,
        newPartners,
        monthPulls: pulls.length,
        todayPulls,
        successfulPulls: successfulPulls.length,
        failedPulls: failedPulls.length,
        successRate: pulls.length ? Math.round((successfulPulls.length / pulls.length) * 100) : 0,
        walletBalance,
        collections,
        pendingInvoiceAmount: pendingInvoices.reduce((total, invoice) => total + numberValue(invoice.amount), 0),
      },
      attention: {
        pendingPartnerRequests: pendingRequests.length,
        pendingInvoices: pendingInvoices.length,
        lowBalancePartners: lowBalancePartners.length,
        failedPulls: failedPulls.length,
      },
      activity,
      recentPulls,
      topPartners,
      recentPartners: partners.slice(0, 5).map((partner) => ({
        id: partner.id,
        name: partner.company_name || partner.name,
        code: partner.partner_code,
        email: partner.email,
        status: partner.status,
        productAccess: partner.product_access || 'bureau_portal',
        walletBalance: numberValue(partner.wallet_balance),
        createdAt: partner.created_at,
      })),
    });
  } catch (error) {
    console.error('[admin-dashboard] unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Unable to load dashboard data' }, { status: 500 });
  }
}
