import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import {
  hasLeadFinderMasterTable,
  isMissingTableError,
  masterRowToLegacyProspect,
} from '@/lib/lead-finder/db';

function csvValue(value: unknown) {
  const text = Array.isArray(value) ? value.join('|') : value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const salesReadyOnly = request.nextUrl.searchParams.get('sales_ready') !== 'false';
  const requestedLeadType = request.nextUrl.searchParams.get('leadType');
  const leadType =
    requestedLeadType === 'dsa' ? 'dsa' : requestedLeadType === 'fintech' ? 'fintech' : 'all';
  const scope = request.nextUrl.searchParams.get('scope') || 'all';
  let requestedRunId = request.nextUrl.searchParams.get('runId') || '';
  const view = request.nextUrl.searchParams.get('view') || (salesReadyOnly ? 'sales_ready' : 'all');

  if (await hasLeadFinderMasterTable(auth.supabase)) {
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

    let query = auth.supabase
      .from('lead_finder_master')
      .select(
        'id,place_id,lead_type,search_prompt,search_keyword,source_run_id,business_name,phone,phone_type,is_valid_mobile,email,email_status,email_source,website,google_maps_url,address,searched_city,detected_city,city,city_match,rating,review_count,matched_keywords,segment,parent_brand,matched_aggregator,is_corporate_branch,score,score_reasons,status,confidence,target_fit,created_at,updated_at,last_seen_at,last_fetched_at'
      )
      .neq('status', 'hidden')
      .order('score', { ascending: false })
      .limit(5000);
    if (leadType !== 'all') query = query.eq('lead_type', leadType);
    if (scopedPlaceIds) {
      const ids = Array.from(scopedPlaceIds);
      if (!ids.length) {
        return csvResponse([], leadType, salesReadyOnly);
      }
      query = query.in('place_id', ids);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    let rows = (data || []).map((row: any) => ({
      ...masterRowToLegacyProspect(row),
      email: row.email,
      email_status: row.email_status,
      email_source: row.email_source,
      run_result_type: runResultByPlaceId.get(row.place_id)?.result_type || null,
      run_keyword: runResultByPlaceId.get(row.place_id)?.keyword || null,
      run_added_at: runResultByPlaceId.get(row.place_id)?.created_at || null,
    }));
    if (view === 'sales_ready') rows = rows.filter((row: any) => row.sales_ready);
    else if (view === 'priority_a') rows = rows.filter((row: any) => row.sales_priority === 'A');
    else if (view === 'priority_b') rows = rows.filter((row: any) => row.sales_priority === 'B');
    return csvResponse(rows, leadType, salesReadyOnly, true);
  }

  const legacyLeadType = requestedLeadType === 'fintech' ? 'fintech' : 'dsa';
  let query = auth.supabase
    .from('dsa_prospect_master')
    .select(
      'business_name,raw_phone,e164_phone,phone_type,business_segment,prospect_score,sales_priority,formatted_address,detected_city,website,google_maps_url,rating,review_count,matched_keywords,score_reasons,place_id'
    )
    .order('prospect_score', { ascending: false })
    .limit(5000);
  if (legacyLeadType === 'fintech') query = query.contains('matched_keywords', ['Fintech Lead']);
  else
    query = query
      .not('matched_keywords', 'cs', '["Fintech Lead"]')
      .not('matched_keywords', 'cs', '["fintech_import"]')
      .not('matched_keywords', 'cs', '["Fintech Excluded - not loan distribution"]');
  if (salesReadyOnly) query = query.eq('sales_ready', true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return csvResponse(data || [], legacyLeadType, salesReadyOnly);
}

function csvResponse(data: any[], leadType: string, salesReadyOnly: boolean, master = false) {
  const headers = [
    'business_name',
    'added_on',
    'search_source',
    'run_source',
    'phone',
    'e164_phone',
    'phone_type',
    'business_segment',
    'prospect_score',
    'sales_priority',
    'address',
    'city',
    'website',
    'email',
    'email_status',
    'email_source',
    'map_url',
    'rating',
    'review_count',
    'matched_keywords',
    'why_summary',
    'place_id',
  ];
  const rows = (data || []).map((row: any) => {
    const scoreReasons = Array.isArray(row.score_reasons) ? row.score_reasons : [];
    const email = scoreReasons
      .map((reason: any) => String(reason?.label || ''))
      .find((label: string) => label.startsWith('Email: '))
      ?.replace('Email: ', '');
    const emailSource = scoreReasons
      .map((reason: any) => String(reason?.label || ''))
      .find((label: string) => label.startsWith('Email source: '))
      ?.replace('Email source: ', '');
    return [
      row.business_name,
      row.run_added_at || row.created_at || '',
      row.run_keyword || row.search_keyword || '',
      row.run_result_type || (row.source_run_id ? 'new' : ''),
      row.raw_phone,
      row.e164_phone,
      row.phone_type,
      row.business_segment,
      row.prospect_score,
      row.sales_priority,
      row.formatted_address,
      row.detected_city,
      row.website,
      master ? row.email || email || '' : email || '',
      master
        ? row.email_status || (row.email ? 'Found on website' : 'Not found')
        : email
          ? 'Found on website'
          : 'Not found',
      master ? row.email_source || emailSource || '' : emailSource || '',
      row.google_maps_url,
      row.rating,
      row.review_count,
      row.matched_keywords,
      scoreReasons
        .map((reason: any) => String(reason?.label || ''))
        .filter(Boolean)
        .slice(0, 2)
        .join(' | '),
      row.place_id,
    ];
  });
  const csv = [
    headers.map(csvValue).join(','),
    ...rows.map((row) => row.map(csvValue).join(',')),
  ].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${leadType}-lead-finder-${salesReadyOnly ? 'sales-ready' : 'all'}.csv"`,
    },
  });
}
