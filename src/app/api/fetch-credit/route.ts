import { NextRequest, NextResponse } from 'next/server';

// Normalize the raw backend response into a clean, UI-ready structure
function normalizeResponse(data: Record<string, unknown>) {
  // Extract score — try common field names
  const score: number | null =
    (data.score as number) ??
    (data.cibilScore as number) ??
    (data.creditScore as number) ??
    ((data.CCRResponse as Record<string, unknown>)?.CIRReportDataLst as Record<string, unknown>[])?.[0]
      ?.CIRReportData as unknown as number ??
    null;

  // Extract report URL
  const reportUrl: string | null =
    (data.reportUrl as string) ??
    (data.report_url as string) ??
    (data.pdfUrl as string) ??
    null;

  // Extract insights — key summary metrics
  const rawInsights =
    (data.insights as Record<string, unknown>) ??
    (data.summary as Record<string, unknown>) ??
    {};

  const insights: Record<string, unknown> = {
    totalAccounts: rawInsights.totalAccounts ?? rawInsights.total_accounts ?? null,
    activeAccounts: rawInsights.activeAccounts ?? rawInsights.active_accounts ?? null,
    closedAccounts: rawInsights.closedAccounts ?? rawInsights.closed_accounts ?? null,
    overdueAccounts: rawInsights.overdueAccounts ?? rawInsights.overdue_accounts ?? null,
    totalOutstanding: rawInsights.totalOutstanding ?? rawInsights.total_outstanding ?? null,
    totalCreditLimit: rawInsights.totalCreditLimit ?? rawInsights.total_credit_limit ?? null,
    paymentHistory: rawInsights.paymentHistory ?? rawInsights.payment_history ?? null,
    creditUtilization: rawInsights.creditUtilization ?? rawInsights.credit_utilization ?? null,
    oldestAccount: rawInsights.oldestAccount ?? rawInsights.oldest_account ?? null,
    recentEnquiries: rawInsights.recentEnquiries ?? rawInsights.recent_enquiries ?? null,
  };

  // Remove null keys from insights to keep it lean
  Object.keys(insights).forEach((key) => {
    if (insights[key] === null) delete insights[key];
  });

  // Extract accounts array — normalize each account to useful fields only
  const rawAccounts: Record<string, unknown>[] =
    (data.accounts as Record<string, unknown>[]) ??
    (data.creditAccounts as Record<string, unknown>[]) ??
    (data.loanAccounts as Record<string, unknown>[]) ??
    [];

  const accounts = rawAccounts.map((acc) => ({
    accountNumber: acc.accountNumber ?? acc.account_number ?? acc.maskedAccountNumber ?? null,
    lender: acc.lender ?? acc.subscriberName ?? acc.bank ?? null,
    accountType: acc.accountType ?? acc.account_type ?? acc.type ?? null,
    ownershipType: acc.ownershipType ?? acc.ownership_type ?? null,
    sanctionedAmount: acc.sanctionedAmount ?? acc.sanctioned_amount ?? acc.creditLimit ?? null,
    currentBalance: acc.currentBalance ?? acc.current_balance ?? acc.balance ?? null,
    overdueAmount: acc.overdueAmount ?? acc.overdue_amount ?? acc.overdue ?? null,
    emiAmount: acc.emiAmount ?? acc.emi_amount ?? acc.emi ?? null,
    openDate: acc.openDate ?? acc.open_date ?? acc.dateOpened ?? null,
    closeDate: acc.closeDate ?? acc.close_date ?? acc.dateClosed ?? null,
    status: acc.status ?? acc.accountStatus ?? acc.account_status ?? null,
    paymentHistory: acc.paymentHistory ?? acc.payment_history ?? null,
  }));

  // Extract enquiries array — normalize each enquiry
  const rawEnquiries: Record<string, unknown>[] =
    (data.enquiries as Record<string, unknown>[]) ??
    (data.creditEnquiries as Record<string, unknown>[]) ??
    (data.recentEnquiries as Record<string, unknown>[]) ??
    [];

  const enquiries = rawEnquiries.map((enq) => ({
    lender: enq.lender ?? enq.subscriberName ?? enq.bank ?? null,
    enquiryDate: enq.enquiryDate ?? enq.enquiry_date ?? enq.date ?? null,
    enquiryType: enq.enquiryType ?? enq.enquiry_type ?? enq.purpose ?? null,
    amount: enq.amount ?? enq.enquiryAmount ?? enq.enquiry_amount ?? null,
  }));

  // Extract summary — high-level profile info
  const rawSummary =
    (data.summary as Record<string, unknown>) ??
    (data.profileSummary as Record<string, unknown>) ??
    {};

  const summary: Record<string, unknown> = {
    name: rawSummary.name ?? (data.name as string) ?? null,
    pan: rawSummary.pan ?? (data.maskedPan as string) ?? null,
    dob: rawSummary.dob ?? (data.dob as string) ?? null,
    gender: rawSummary.gender ?? (data.gender as string) ?? null,
    mobile: rawSummary.mobile ?? (data.mobile as string) ?? null,
    email: rawSummary.email ?? (data.email as string) ?? null,
    reportDate: rawSummary.reportDate ?? rawSummary.report_date ?? (data.reportDate as string) ?? null,
    reportId: rawSummary.reportId ?? rawSummary.report_id ?? (data.reportId as string) ?? null,
  };

  // Remove null keys from summary
  Object.keys(summary).forEach((key) => {
    if (summary[key] === null) delete summary[key];
  });

  return { score, reportUrl, insights, accounts, enquiries, summary };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, type, state } = body;

    if (!formId || !type || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: formId, type, state' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;
    const backendToken = process.env.BACKEND_TOKEN;

    if (!backendUrl || !backendToken) {
      console.error('Missing BACKEND_URL or BACKEND_TOKEN environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const backendResponse = await fetch(`${backendUrl}/v1/cibilScore/getCibilScore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: backendToken,
      },
      body: JSON.stringify({ formId, type, state }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', backendResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch credit data from backend' },
        { status: backendResponse.status }
      );
    }

    const rawData = await backendResponse.json();

    // Normalize and return only clean, useful fields — no raw bulky data sent to UI
    const normalized = normalizeResponse(rawData);

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('fetch-credit route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
