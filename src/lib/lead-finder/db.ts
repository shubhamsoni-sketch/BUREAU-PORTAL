import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassifiedProspect } from './types';

export type LeadFinderTablesReady = { ready: true } | { ready: false; warning: string };

export function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
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

export async function hasLeadFinderMasterTable(supabase: SupabaseClient) {
  const { error } = await supabase.from('lead_finder_master').select('id').limit(1);
  if (isMissingTableError(error)) return false;
  if (error) throw error;
  return true;
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

export function prospectToMasterRow(
  prospect: ClassifiedProspect,
  runId?: string | null,
  options?: {
    leadType?: string;
    searchIntent?: string;
    searchPrompt?: string | null;
    searchKeyword?: string | null;
    dataSourceQuality?: string;
  }
) {
  return {
    place_id: prospect.place_id,
    lead_type: options?.leadType || prospect.lead_type || 'dsa',
    search_intent: options?.searchIntent || 'loan_dsa',
    search_prompt: options?.searchPrompt || null,
    search_keyword: options?.searchKeyword || prospect.matched_keywords?.[0] || null,
    business_name: prospect.business_name || null,
    phone: prospect.raw_phone,
    phone_type: prospect.phone_type,
    is_valid_mobile: prospect.phone_type === 'mobile' && prospect.is_valid_phone,
    email: prospect.contact_email || null,
    email_status: prospect.email_status || null,
    email_source: prospect.email_source || null,
    website: prospect.website || null,
    normalized_domain: prospect.normalized_domain,
    google_maps_url: prospect.google_maps_url || null,
    address: prospect.formatted_address || null,
    city: prospect.searched_city || prospect.detected_city || null,
    state: prospect.searched_state || null,
    searched_city: prospect.searched_city || null,
    detected_city: prospect.detected_city,
    city_match: prospect.city_match,
    latitude: prospect.latitude ?? null,
    longitude: prospect.longitude ?? null,
    rating: prospect.rating ?? null,
    review_count: prospect.review_count ?? null,
    google_types: prospect.google_types || [],
    matched_aggregator: prospect.parent_brand,
    matched_keywords: prospect.matched_keywords || [],
    category: prospect.category || null,
    segment: prospect.business_segment,
    parent_brand: prospect.parent_brand,
    is_corporate_branch: prospect.is_corporate_branch,
    confidence:
      prospect.sales_priority === 'A'
        ? 'high'
        : prospect.sales_priority === 'B'
          ? 'medium'
          : prospect.sales_priority === 'C'
            ? 'low'
            : 'review',
    target_fit:
      prospect.sales_priority === 'exclude' ? 'no' : prospect.sales_ready ? 'yes' : 'review',
    score: prospect.prospect_score,
    score_reasons: prospect.score_reasons,
    status:
      prospect.sales_priority === 'exclude'
        ? 'excluded'
        : prospect.sales_ready
          ? 'ready'
          : 'review',
    data_source_quality: options?.dataSourceQuality || 'google_places',
    source_run_id: runId || null,
    last_seen_at: new Date().toISOString(),
    last_fetched_at: new Date().toISOString(),
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
    const isActiveFintech = keywords.includes('Fintech Lead');
    const isFintechFamily =
      isActiveFintech ||
      keywords.includes('fintech_import') ||
      keywords.includes('Fintech Excluded - not loan distribution');
    return leadType === 'fintech' ? isActiveFintech : !isFintechFamily;
  });
}

export async function fetchAllMasterSummaryRows(
  supabase: SupabaseClient,
  leadType: string = 'dsa'
) {
  const rows: any[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from('lead_finder_master')
      .select(
        'phone_type,is_valid_mobile,segment,status,confidence,target_fit,phone,lead_type,email,score'
      )
      .neq('status', 'hidden')
      .order('score', { ascending: false })
      .range(from, from + pageSize - 1);
    if (leadType !== 'all') query = query.eq('lead_type', leadType);
    const { data, error } = await query;

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

export function masterRowToLegacyProspect(row: any) {
  const salesPriority =
    row.status === 'excluded'
      ? 'exclude'
      : row.confidence === 'high'
        ? 'A'
        : row.confidence === 'medium'
          ? 'B'
          : row.confidence === 'low'
            ? 'C'
            : 'review';

  const scoreReasons = Array.isArray(row.score_reasons) ? [...row.score_reasons] : [];
  if (
    row.email &&
    !scoreReasons.some((reason: any) => String(reason?.label || '').startsWith('Email: '))
  ) {
    scoreReasons.push({ type: 'neutral', label: `Email: ${row.email}`, points: 0 });
  }
  if (
    row.email_source &&
    !scoreReasons.some((reason: any) => String(reason?.label || '').startsWith('Email source: '))
  ) {
    scoreReasons.push({ type: 'neutral', label: `Email source: ${row.email_source}`, points: 0 });
  }

  return {
    id: row.id,
    place_id: row.place_id,
    business_name: row.business_name,
    raw_phone: row.phone,
    e164_phone: row.phone,
    national_phone: row.phone,
    phone_type: row.phone_type,
    is_valid_phone: row.is_valid_mobile,
    website: row.website,
    google_maps_url: row.google_maps_url,
    formatted_address: row.address,
    searched_city: row.searched_city || row.city,
    detected_city: row.detected_city || row.city,
    city_match: row.city_match,
    rating: row.rating,
    review_count: row.review_count,
    matched_keywords: row.matched_keywords || [],
    business_segment: row.segment || 'unknown',
    parent_brand: row.parent_brand || row.matched_aggregator,
    is_corporate_branch: row.is_corporate_branch,
    prospect_score: row.score,
    score_reasons: scoreReasons,
    sales_ready: row.status === 'ready',
    sales_priority: salesPriority,
    classification_source: 'master',
    classified_at: row.updated_at,
    last_seen_at: row.last_seen_at,
    last_fetched_at: row.last_fetched_at,
  };
}

export function summarizeMasterProspects(rows: any[], run?: any) {
  const bankSegments = new Set(['bank', 'lender_nbfc', 'housing_finance', 'gold_loan_lender']);
  const irrelevantSegments = new Set([
    'ca_accounting',
    'stock_broker_investment',
    'recruitment_hr',
    'education',
    'unrelated',
  ]);
  return {
    rawResults: Number(run?.records_found || rows.length),
    uniqueBusinesses: rows.length,
    salesReady: rows.filter((row) => row.status === 'ready').length,
    priorityA: rows.filter((row) => row.confidence === 'high').length,
    priorityB: rows.filter((row) => row.confidence === 'medium').length,
    emailsFound: rows.filter((row) => row.email).length,
    enterpriseDsa: rows.filter((row) => row.segment === 'enterprise_dsa_aggregator').length,
    bankNbfcLender: rows.filter((row) => bankSegments.has(row.segment)).length,
    irrelevant: rows.filter((row) => irrelevantSegments.has(row.segment)).length,
    needsReview: rows.filter((row) => row.status === 'review' || row.segment === 'unknown').length,
    validMobile: rows.filter((row) => row.phone_type === 'mobile' && row.is_valid_mobile).length,
    fixedLine: rows.filter((row) => row.phone_type === 'fixed_line').length,
    missingPhone: rows.filter((row) => row.phone_type === 'missing' || !row.phone).length,
    textSearchCalls: Number(run?.text_search_calls || 0),
    placeDetailsCalls: Number(run?.place_details_calls || 0),
    cachedRecordsReused: Number(run?.reused_records || 0),
    duplicateDetailsCallsAvoided: Number(run?.duplicates_skipped || 0),
    estimatedCostUsd: Number(run?.estimated_cost_usd || 0),
    estimatedCostInr: Number(run?.estimated_cost_inr || 0),
  };
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
