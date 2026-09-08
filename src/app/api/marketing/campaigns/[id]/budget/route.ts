import { NextRequest, NextResponse } from 'next/server';
import { clean, jsonError, numberValue, requireMarketingAdmin } from '@/lib/marketing/api';
import { updateMetaBudget } from '@/lib/marketing/meta-ads';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { auth, response } = await requireMarketingAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const budgetType = clean(body.budget_type) === 'lifetime' ? 'lifetime' : 'daily';
    const amount = numberValue(body.amount);
    if (amount <= 0) return jsonError('A positive budget amount is required.');
    const result = await updateMetaBudget({ supabase: auth.supabase, campaignId: id, budgetType, amount });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[marketing/budget] error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unable to update budget', 500);
  }
}
