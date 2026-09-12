import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassifiedProspect } from './types';

export type LeadFinderTablesReady = { ready: true } | { ready: false; warning: string };

export function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === '42P01' || Boolean(error?.message?.includes('does not exist'));
}

export async function checkLeadFinderTables(
  supabase: SupabaseClient
): Promise<LeadFinderTablesReady> {
  const { error } = await supabase.from('dsa_prospect_master').select('id').limit(1);
  if (isMissingTableError(error)) {
    return {
      ready: false,
      warning: 'Lead Finder tables are not available yet. Run the DSA Lead Finder migration first.',
    };
  }
  if (error) throw error;
  return { ready: true };
}

export function prospectToRow(prospect: ClassifiedProspect, runId?: string | null) {
  return {
    place_id: prospect.place_id,
    business_name: prospect.business_name || null,
    raw_phone: prospect.raw_phone,
    e164_phone: prospect.e164_phone,
    national_phone: prospect.national_phone,
    phone_type: prospect.phone_type,
    is_valid_phone: prospect.is_valid_phone,
    website: prospect.website || null,
    normalized_domain: prospect.normalized_domain,
    google_maps_url: prospect.google_maps_url || null,
    formatted_address: prospect.formatted_address || null,
    searched_city: prospect.searched_city || null,
    detected_city: prospect.detected_city,
    city_match: prospect.city_match,
    latitude: prospect.latitude ?? null,
    longitude: prospect.longitude ?? null,
    rating: prospect.rating ?? null,
    review_count: prospect.review_count ?? null,
    google_types: prospect.google_types || [],
    matched_keywords: prospect.matched_keywords || [],
    business_segment: prospect.business_segment,
    parent_brand: prospect.parent_brand,
    is_corporate_branch: prospect.is_corporate_branch,
    prospect_score: prospect.prospect_score,
    score_reasons: prospect.score_reasons,
    sales_ready: prospect.sales_ready,
    sales_priority: prospect.sales_priority,
    classification_source: 'rules',
    classified_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    last_fetched_at: new Date().toISOString(),
    source_run_id: runId || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAllProspectSummaryRows(
  supabase: SupabaseClient,
  leadType: 'dsa' | 'fintech' = 'dsa'
) {
  const rows: any[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('dsa_prospect_master')
      .select(
        'phone_type,is_valid_phone,business_segment,sales_ready,sales_priority,raw_phone,matched_keywords,score_reasons'
      )
      .range(from, from + pageSize - 1);

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows.filter((row) => {
    const keywords = Array.isArray(row.matched_keywords) ? row.matched_keywords : [];
    const isFintech = keywords.includes('Fintech Lead');
    return leadType === 'fintech' ? isFintech : !isFintech;
  });
}

export function summarizeProspects(rows: any[], run?: any) {
  const bankSegments = new Set(['bank', 'lender_nbfc', 'housing_finance', 'gold_loan_lender']);
  const irrelevantSegments = new Set([
    'ca_accounting',
    'stock_broker_investment',
    'recruitment_hr',
    'education',
    'unrelated',
  ]);
  return {
    rawResults: Number(run?.raw_results_count || rows.length),
    uniqueBusinesses: rows.length,
    salesReady: rows.filter((row) => row.sales_ready).length,
    priorityA: rows.filter((row) => row.sales_priority === 'A').length,
    priorityB: rows.filter((row) => row.sales_priority === 'B').length,
    emailsFound: rows.filter((row) =>
      (Array.isArray(row.score_reasons) ? row.score_reasons : []).some((reason: any) =>
        String(reason?.label || '').startsWith('Email: ')
      )
    ).length,
    enterpriseDsa: rows.filter((row) => row.business_segment === 'enterprise_dsa_aggregator')
      .length,
    bankNbfcLender: rows.filter((row) => bankSegments.has(row.business_segment)).length,
    irrelevant: rows.filter((row) => irrelevantSegments.has(row.business_segment)).length,
    needsReview: rows.filter(
      (row) => row.sales_priority === 'review' || row.business_segment === 'unknown'
    ).length,
    validMobile: rows.filter((row) => row.phone_type === 'mobile' && row.is_valid_phone).length,
    fixedLine: rows.filter((row) => row.phone_type === 'fixed_line').length,
    missingPhone: rows.filter((row) => row.phone_type === 'missing' || !row.raw_phone).length,
    textSearchCalls: Number(run?.actual_text_search_calls || 0),
    placeDetailsCalls: Number(run?.actual_place_details_calls || 0),
    cachedRecordsReused: Number(run?.cached_records_reused || 0),
    duplicateDetailsCallsAvoided: Number(run?.duplicates_skipped || 0),
    estimatedCostUsd: Number(run?.estimated_cost_usd || 0),
  };
}
