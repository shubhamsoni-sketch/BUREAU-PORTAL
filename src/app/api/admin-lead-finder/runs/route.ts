import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { checkLeadFinderTables, hasLeadFinderMasterTable } from '@/lib/lead-finder/db';

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

    if (await hasLeadFinderMasterTable(auth.supabase)) {
      const { data, error } = await auth.supabase
        .from('lead_finder_runs')
        .select(
          'id,lead_type,search_intent,locations,keywords,requested_count,records_found,new_records,reused_records,duplicates_skipped,estimated_cost_inr,text_search_calls,place_details_calls,status,started_at,completed_at,error_message'
        )
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      const runs = (data || []).map((run: any) => {
        const firstLocation = Array.isArray(run.locations) ? run.locations[0] : null;
        return {
          id: run.id,
          searched_city: firstLocation?.city || run.lead_type || 'Universal',
          searched_state: firstLocation?.state || run.search_intent || '',
          keywords: Array.isArray(run.keywords) ? run.keywords : [],
          requested_count: run.requested_count,
          raw_results_count: run.records_found,
          unique_businesses_count: run.records_found,
          new_details_calls: run.place_details_calls,
          cached_records_reused: run.reused_records,
          duplicates_skipped: run.duplicates_skipped,
          stale_records_refreshed: 0,
          estimated_cost_usd: Number(run.estimated_cost_inr || 0) / 83,
          actual_text_search_calls: run.text_search_calls,
          actual_place_details_calls: run.place_details_calls,
          coverage_hits: 0,
          coverage_misses: 0,
          force_refresh: false,
          status: run.status,
          created_at: run.started_at,
          completed_at: run.completed_at,
          error_message: run.error_message,
        };
      });
      return NextResponse.json({
        success: true,
        schemaReady: true,
        source: 'lead_finder_runs',
        runs,
      });
    }

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
