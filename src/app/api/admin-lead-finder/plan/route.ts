import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { hasLeadFinderMasterTable } from '@/lib/lead-finder/db';
import { forecastUniversalRun, generateUniversalPlan } from '@/lib/lead-finder/universal';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body.prompt || '').trim();
    if (prompt.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Please enter a more detailed audience prompt.' },
        { status: 400 }
      );
    }

    const masterReady = await hasLeadFinderMasterTable(auth.supabase);
    const { plan, source } = await generateUniversalPlan(prompt);

    if (!masterReady) {
      return NextResponse.json({
        success: true,
        schemaReady: false,
        source,
        plan,
        forecast: null,
        warning:
          'Universal Finder master database is not active yet. Run the lead_finder_master migration before approving paid runs.',
      });
    }

    const forecast = await forecastUniversalRun(auth.supabase, plan);
    return NextResponse.json({
      success: true,
      schemaReady: true,
      source,
      plan,
      forecast,
    });
  } catch (error) {
    console.error('[lead-finder/plan] error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to generate Lead Finder plan' },
      { status: 500 }
    );
  }
}
