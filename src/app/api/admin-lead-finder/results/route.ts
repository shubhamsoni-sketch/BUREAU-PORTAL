import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import {
  checkLeadFinderTables,
  fetchAllMasterSummaryRows,
  fetchAllProspectSummaryRows,
  hasLeadFinderMasterTable,
  masterRowToLegacyProspect,
  summarizeMasterProspects,
  summarizeProspects,
  isMissingTableError,
} from '@/lib/lead-finder/db';

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
        warning: ready.warning,
        summary: summarizeProspects([]),
        prospects: [],
      });

    const view = request.nextUrl.searchParams.get('view') || 'sales_ready';
    const requestedLeadType = request.nextUrl.searchParams.get('leadType');
    const scope = request.nextUrl.searchParams.get('scope') || 'all';
    let requestedRunId = request.nextUrl.searchParams.get('runId') || '';
    const leadType =
      requestedLeadType === 'fintech' ? 'fintech' : requestedLeadType === 'all' ? 'all' : 'dsa';
    const useMaster = await hasLeadFinderMasterTable(auth.supabase);

    if (useMaster) {
      if (scope !== 'all' && !requestedRunId) {
        let latestRunQuery = auth.supabase
          .from('lead_finder_runs')
          .select('id')
          .in('status', ['complete', 'stopped_by_budget'])
          .order('started_at', { ascending: false })
          .limit(1);
        if (leadType !== 'all') latestRunQuery = latestRunQuery.eq('lead_type', leadType);
        const { data: latestRuns, error: latestRunError } = await latestRunQuery;
        if (latestRunError) throw latestRunError;
        requestedRunId = latestRuns?.[0]?.id || '';
      }

      let scopedPlaceIds: Set<string> | null = null;
      const runResultByPlaceId = new Map<string, any>();
      if (scope !== 'all' && requestedRunId) {
        let runResultQuery = auth.supabase
          .from('lead_finder_run_results')
          .select('place_id,result_type,city,state,keyword,created_at')
          .eq('run_id', requestedRunId);
        if (scope === 'new') runResultQuery = runResultQuery.eq('result_type', 'new');
        if (scope === 'reused')
          runResultQuery = runResultQuery.in('result_type', ['reused', 'cached', 'duplicate']);
        const { data: runResults, error: runResultsError } = await runResultQuery;
        if (runResultsError && !isMissingTableError(runResultsError)) throw runResultsError;
        const rows = runResultsError ? [] : runResults || [];
        scopedPlaceIds = new Set(rows.map((row: any) => row.place_id));
        rows.forEach((row: any) => runResultByPlaceId.set(row.place_id, row));
      }

      const prospectRows: any[] = [];
      const pageSize = 1000;
      let prospectError: any = null;
      for (let from = 0; ; from += pageSize) {
        let query = auth.supabase
          .from('lead_finder_master')
          .select(
            'id,place_id,lead_type,search_prompt,search_keyword,source_run_id,business_name,phone,phone_type,is_valid_mobile,email,email_source,website,google_maps_url,address,searched_city,detected_city,city,city_match,rating,review_count,matched_keywords,segment,parent_brand,matched_aggregator,is_corporate_branch,score,score_reasons,status,confidence,target_fit,created_at,updated_at,last_seen_at,last_fetched_at'
          )
          .neq('status', 'hidden')
          .order('score', { ascending: false })
          .range(from, from + pageSize - 1);
        if (leadType !== 'all') query = query.eq('lead_type', leadType);
        if (scopedPlaceIds) {
          const ids = Array.from(scopedPlaceIds);
          if (!ids.length) break;
          query = query.in('place_id', ids);
        }
        const { data, error } = await query;
        if (error) {
          prospectError = error;
          break;
        }
        prospectRows.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }

      if (prospectError) throw prospectError;

      let prospects = prospectRows.map((row) => ({
        ...masterRowToLegacyProspect(row),
        run_result_type: runResultByPlaceId.get(row.place_id)?.result_type || null,
        run_city: runResultByPlaceId.get(row.place_id)?.city || null,
        run_state: runResultByPlaceId.get(row.place_id)?.state || null,
        run_keyword: runResultByPlaceId.get(row.place_id)?.keyword || null,
        run_added_at: runResultByPlaceId.get(row.place_id)?.created_at || null,
      }));
      if (view === 'sales_ready') prospects = prospects.filter((row) => row.sales_ready);
      else if (view === 'priority_a')
        prospects = prospects.filter((row) => row.sales_priority === 'A');
      else if (view === 'priority_b')
        prospects = prospects.filter((row) => row.sales_priority === 'B');
      else if (view === 'enterprise')
        prospects = prospects.filter((row) => row.business_segment === 'enterprise_dsa_aggregator');
      else if (view === 'bank_lender')
        prospects = prospects.filter((row) =>
          ['bank', 'lender_nbfc', 'housing_finance', 'gold_loan_lender'].includes(
            row.business_segment
          )
        );
      else if (view === 'irrelevant')
        prospects = prospects.filter((row) =>
          [
            'ca_accounting',
            'stock_broker_investment',
            'recruitment_hr',
            'education',
            'unrelated',
          ].includes(row.business_segment)
        );
      else if (view === 'review')
        prospects = prospects.filter(
          (row) => row.sales_priority === 'review' || row.business_segment === 'unknown'
        );

      const summaryRows =
        scope === 'all' ? await fetchAllMasterSummaryRows(auth.supabase, leadType) : prospectRows;
      const [{ data: runRows, error: runError }] = await Promise.all([
        (() => {
          let query = auth.supabase
            .from('lead_finder_runs')
            .select(
              'id,lead_type,records_found,new_records,reused_records,duplicates_skipped,estimated_cost_inr,text_search_calls,place_details_calls,status'
            )
            .order('created_at', { ascending: false })
            .limit(1000);
          if (leadType !== 'all') query = query.eq('lead_type', leadType);
          return query;
        })(),
      ]);
      if (runError) throw runError;
      const completedRuns = (runRows || []).filter((run: any) => run.status === 'complete');
      const scopedRuns =
        scope !== 'all' && requestedRunId
          ? completedRuns.filter((run: any) => run.id === requestedRunId)
          : completedRuns;
      const aggregateRun = {
        records_found: summaryRows?.length || 0,
        reused_records: scopedRuns.reduce(
          (total: number, run: any) => total + Number(run.reused_records || 0),
          0
        ),
        duplicates_skipped: scopedRuns.reduce(
          (total: number, run: any) => total + Number(run.duplicates_skipped || 0),
          0
        ),
        estimated_cost_inr: scopedRuns.reduce(
          (total: number, run: any) => total + Number(run.estimated_cost_inr || 0),
          0
        ),
        text_search_calls: scopedRuns.reduce(
          (total: number, run: any) => total + Number(run.text_search_calls || 0),
          0
        ),
        place_details_calls: scopedRuns.reduce(
          (total: number, run: any) => total + Number(run.place_details_calls || 0),
          0
        ),
      };

      return NextResponse.json({
        success: true,
        schemaReady: true,
        source: 'lead_finder_master',
        scope,
        runId: requestedRunId || null,
        summary: summarizeMasterProspects(summaryRows || [], aggregateRun),
        prospects: prospects
          .sort((a, b) => Number(b.prospect_score || 0) - Number(a.prospect_score || 0))
          .slice(0, 500),
      });
    }

    const prospectRows: any[] = [];
    const pageSize = 1000;
    let prospectError: any = null;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await auth.supabase
        .from('dsa_prospect_master')
        .select(
          'id,place_id,business_name,raw_phone,e164_phone,national_phone,phone_type,is_valid_phone,website,google_maps_url,formatted_address,searched_city,detected_city,city_match,rating,review_count,matched_keywords,business_segment,parent_brand,is_corporate_branch,prospect_score,score_reasons,sales_ready,sales_priority,classification_source,classified_at,last_seen_at,last_fetched_at'
        )
        .order('prospect_score', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) {
        prospectError = error;
        break;
      }
      prospectRows.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }

    const isRequestedLeadType = (row: any) => {
      const keywords = Array.isArray(row.matched_keywords) ? row.matched_keywords : [];
      const isActiveFintech = keywords.includes('Fintech Lead');
      const isFintechFamily =
        isActiveFintech ||
        keywords.includes('fintech_import') ||
        keywords.includes('Fintech Excluded - not loan distribution');
      return leadType === 'fintech' ? isActiveFintech : !isFintechFamily;
    };
    let prospects = prospectRows.filter(isRequestedLeadType);
    if (view === 'sales_ready') prospects = prospects.filter((row) => row.sales_ready);
    else if (view === 'priority_a')
      prospects = prospects.filter((row) => row.sales_priority === 'A');
    else if (view === 'priority_b')
      prospects = prospects.filter((row) => row.sales_priority === 'B');
    else if (view === 'enterprise')
      prospects = prospects.filter((row) => row.business_segment === 'enterprise_dsa_aggregator');
    else if (view === 'bank_lender')
      prospects = prospects.filter((row) =>
        ['bank', 'lender_nbfc', 'housing_finance', 'gold_loan_lender'].includes(
          row.business_segment
        )
      );
    else if (view === 'irrelevant')
      prospects = prospects.filter((row) =>
        [
          'ca_accounting',
          'stock_broker_investment',
          'recruitment_hr',
          'education',
          'unrelated',
        ].includes(row.business_segment)
      );
    else if (view === 'review')
      prospects = prospects.filter(
        (row) => row.sales_priority === 'review' || row.business_segment === 'unknown'
      );
    prospects = prospects
      .sort((a, b) => Number(b.prospect_score || 0) - Number(a.prospect_score || 0))
      .slice(0, 500);

    const [allRows, { data: runRows, error: runError }] = await Promise.all([
      fetchAllProspectSummaryRows(auth.supabase, leadType === 'fintech' ? 'fintech' : 'dsa'),
      auth.supabase
        .from('dsa_extraction_runs')
        .select(
          'keywords,raw_results_count,unique_businesses_count,cached_records_reused,duplicates_skipped,estimated_cost_usd,actual_text_search_calls,actual_place_details_calls,status'
        )
        .order('created_at', { ascending: false })
        .limit(1000),
    ]);

    if (prospectError || runError) throw prospectError || runError;
    const completedRuns = (runRows || []).filter((run: any) => {
      const keywords = Array.isArray(run.keywords) ? run.keywords : [];
      const isFintechRun = keywords.includes('Fintech Lead') || keywords.includes('fintech_import');
      return run.status === 'complete' && (leadType === 'fintech' ? isFintechRun : !isFintechRun);
    });
    const aggregateRun = {
      raw_results_count: allRows?.length || 0,
      unique_businesses_count: allRows?.length || 0,
      cached_records_reused: completedRuns.reduce(
        (total: number, run: any) => total + Number(run.cached_records_reused || 0),
        0
      ),
      duplicates_skipped: completedRuns.reduce(
        (total: number, run: any) => total + Number(run.duplicates_skipped || 0),
        0
      ),
      estimated_cost_usd: completedRuns.reduce(
        (total: number, run: any) => total + Number(run.estimated_cost_usd || 0),
        0
      ),
      actual_text_search_calls: completedRuns.reduce(
        (total: number, run: any) => total + Number(run.actual_text_search_calls || 0),
        0
      ),
      actual_place_details_calls: completedRuns.reduce(
        (total: number, run: any) => total + Number(run.actual_place_details_calls || 0),
        0
      ),
    };
    return NextResponse.json({
      success: true,
      schemaReady: true,
      summary: summarizeProspects(allRows || [], aggregateRun),
      prospects: prospects || [],
    });
  } catch (error) {
    console.error('[lead-finder/results] error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load Lead Finder results' },
      { status: 500 }
    );
  }
}
