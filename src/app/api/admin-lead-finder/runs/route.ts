import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { checkLeadFinderTables } from '@/lib/lead-finder/db';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const ready = await checkLeadFinderTables(auth.supabase);
    if (!ready.ready)
      return NextResponse.json({
        success: true,
        schemaReady: false,
        runs: [],
        warning: ready.warning,
      });

    const limit = Math.max(
      1,
      Math.min(100, Number(request.nextUrl.searchParams.get('limit') || 30))
    );

    const { data, error } = await auth.supabase
      .from('dsa_extraction_runs')
      .select(
        'id,searched_city,searched_state,keywords,requested_count,raw_results_count,unique_businesses_count,new_details_calls,cached_records_reused,duplicates_skipped,stale_records_refreshed,estimated_cost_usd,actual_text_search_calls,actual_place_details_calls,coverage_hits,coverage_misses,force_refresh,status,created_at,completed_at,error_message'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      schemaReady: true,
      runs: data || [],
    });
  } catch (error) {
    console.error('[lead-finder/runs] error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load Lead Finder run history' },
      { status: 500 }
    );
  }
}
