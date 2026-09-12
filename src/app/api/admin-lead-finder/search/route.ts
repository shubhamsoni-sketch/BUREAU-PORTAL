import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { classifyProspect } from '@/lib/lead-finder/classifyProspect';
import { checkLeadFinderTables, prospectToRow, summarizeProspects } from '@/lib/lead-finder/db';
import { searchPlaceIds, fetchPlaceDetails } from '@/lib/lead-finder/googlePlacesClient';
import { estimateGoogleCost, pricingConfig } from '@/lib/lead-finder/googlePlacesPricing';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAILY_BUDGET_USD = 1;
const DEFAULT_RUN_BUDGET_USD = 0.35;
const DEFAULT_KEYWORDS = [
  'Loan Agent',
  'Loan DSA',
  'Loan Consultant',
  'Personal Loan Agent',
  'Business Loan Agent',
];

function cleanKeywords(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_KEYWORDS;
  const list = value.map((item) => String(item || '').trim()).filter(Boolean);
  return list.length ? list.slice(0, 12) : DEFAULT_KEYWORDS;
}

function budgetNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

async function getTodaysLeadFinderSpend(supabase: any) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('dsa_extraction_runs')
    .select('estimated_cost_usd,status')
    .gte('created_at', since.toISOString())
    .in('status', ['running', 'complete']);
  if (error) throw error;
  return (data || []).reduce(
    (sum: number, run: any) => sum + Number(run.estimated_cost_usd || 0),
    0
  );
}

async function createRun(supabase: any, userId: string | undefined, body: any) {
  const { data, error } = await supabase
    .from('dsa_extraction_runs')
    .insert({
      searched_city: body.city,
      searched_state: body.state,
      keywords: body.keywords,
      requested_count: body.count,
      force_refresh: body.forceRefresh,
      created_by: userId || null,
      text_search_sku: pricingConfig.skus.textSearchIdsOnly.sku,
      place_details_sku: pricingConfig.skus.placeDetailsEnterprise.sku,
      pricing_config_version: pricingConfig.version,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function freshCoverage(supabase: any, city: string, state: string, keyword: string) {
  const { data, error } = await supabase
    .from('dsa_search_coverage')
    .select('id,place_ids_count,next_refresh_at,status')
    .eq('city', city)
    .eq('state', state)
    .eq('keyword', keyword)
    .eq('status', 'complete')
    .gt('next_refresh_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: places, error: placesError } = await supabase
    .from('dsa_search_coverage_places')
    .select('place_id,rank')
    .eq('coverage_id', data.id)
    .order('rank', { ascending: true });
  if (placesError) throw placesError;
  return { ...data, place_ids: (places || []).map((row: any) => row.place_id) };
}

async function upsertCoverage(
  supabase: any,
  city: string,
  state: string,
  keyword: string,
  placeIds: string[]
) {
  const now = new Date();
  const { data, error } = await supabase
    .from('dsa_search_coverage')
    .upsert(
      {
        city,
        state,
        keyword,
        last_search_at: now.toISOString(),
        next_refresh_at: new Date(now.getTime() + 30 * DAY_MS).toISOString(),
        place_ids_count: placeIds.length,
        status: 'complete',
        updated_at: now.toISOString(),
      },
      { onConflict: 'city,state,keyword' }
    )
    .select('id')
    .single();
  if (error) throw error;
  if (placeIds.length) {
    const rows = placeIds.map((place_id, index) => ({
      coverage_id: data.id,
      place_id,
      rank: index + 1,
      last_seen_at: now.toISOString(),
    }));
    const { error: placesError } = await supabase
      .from('dsa_search_coverage_places')
      .upsert(rows, { onConflict: 'coverage_id,place_id' });
    if (placesError) throw placesError;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  let runId: string | null = null;
  try {
    const ready = await checkLeadFinderTables(auth.supabase);
    if (!ready.ready)
      return NextResponse.json({ success: false, error: ready.warning }, { status: 400 });

    const payload = await request.json().catch(() => ({}));
    const city = String(payload.city || 'Indore').trim();
    const state = String(payload.state || 'Madhya Pradesh').trim();
    const count = Math.max(1, Math.min(1000, Number(payload.count || 100)));
    const keywords = cleanKeywords(payload.keywords);
    const forceRefresh = Boolean(payload.forceRefresh);
    const refreshExisting = Boolean(payload.refreshExisting);
    const dailyBudgetUsd = budgetNumber(
      process.env.DSA_LEAD_FINDER_DAILY_BUDGET_USD,
      DEFAULT_DAILY_BUDGET_USD
    );
    const runBudgetUsd = budgetNumber(
      process.env.DSA_LEAD_FINDER_RUN_BUDGET_USD,
      DEFAULT_RUN_BUDGET_USD
    );
    const spendTodayUsd = await getTodaysLeadFinderSpend(auth.supabase);
    if (spendTodayUsd >= dailyBudgetUsd && (forceRefresh || refreshExisting)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Daily Lead Finder Google API budget is already used. Cached results are still available.',
        },
        { status: 429 }
      );
    }
    runId = await createRun(auth.supabase, auth.user?.id, {
      city,
      state,
      count,
      keywords,
      forceRefresh,
    });

    let textSearchCalls = 0;
    let placeDetailsCalls = 0;
    let coverageHits = 0;
    let coverageMisses = 0;
    const placeKeywordMap = new Map<string, Set<string>>();

    for (const keyword of keywords) {
      let ids: string[] = [];
      let coverageFound = false;
      if (!forceRefresh) {
        const coverage = await freshCoverage(auth.supabase, city, state, keyword);
        if (coverage) {
          coverageFound = true;
          coverageHits += 1;
          ids = coverage.place_ids || [];
        }
      }
      if (!coverageFound) {
        coverageMisses += 1;
        ids = await searchPlaceIds(`${keyword} in ${city}, ${state}, India`, Math.min(20, count));
        textSearchCalls += 1;
        await upsertCoverage(auth.supabase, city, state, keyword, ids);
      }
      for (const id of ids) {
        if (!placeKeywordMap.has(id)) placeKeywordMap.set(id, new Set());
        placeKeywordMap.get(id)?.add(keyword);
        if (placeKeywordMap.size >= count) break;
      }
      if (placeKeywordMap.size >= count) break;
    }

    const placeIds = Array.from(placeKeywordMap.keys()).slice(0, count);
    const { data: existing, error: existingError } = placeIds.length
      ? await auth.supabase.from('dsa_prospect_master').select('*').in('place_id', placeIds)
      : { data: [], error: null };
    if (existingError) throw existingError;

    const existingById = new Map((existing || []).map((row: any) => [row.place_id, row]));
    const staleCutoff = Date.now() - 30 * DAY_MS;
    const detailProspects = [];
    let budgetStoppedBeforeDetails = false;

    for (const placeId of placeIds) {
      const row = existingById.get(placeId);
      const stale = !row?.last_fetched_at || new Date(row.last_fetched_at).getTime() < staleCutoff;
      if (row && !refreshExisting && !stale) continue;
      const projectedCost = estimateGoogleCost(textSearchCalls, placeDetailsCalls + 1);
      if (projectedCost > runBudgetUsd || spendTodayUsd + projectedCost > dailyBudgetUsd) {
        budgetStoppedBeforeDetails = true;
        if (!detailProspects.length && placeDetailsCalls === 0 && !existingById.size) {
          await auth.supabase
            .from('dsa_extraction_runs')
            .update({
              status: 'failed',
              error_message: 'Stopped by Lead Finder Google API budget guardrail',
              completed_at: new Date().toISOString(),
            })
            .eq('id', runId);
          return NextResponse.json(
            {
              success: false,
              error:
                'Lead Finder Google API budget guardrail stopped this run before new paid Place Details calls.',
              budget: {
                runBudgetUsd,
                dailyBudgetUsd,
                spendTodayUsd: Number(spendTodayUsd.toFixed(4)),
                projectedCostUsd: projectedCost,
              },
            },
            { status: 429 }
          );
        }
        break;
      }
      const details = await fetchPlaceDetails(
        placeId,
        city,
        state,
        Array.from(placeKeywordMap.get(placeId) || [])
      );
      placeDetailsCalls += 1;
      detailProspects.push(classifyProspect(details));
    }

    if (detailProspects.length) {
      const { error: upsertError } = await auth.supabase.from('dsa_prospect_master').upsert(
        detailProspects.map((prospect) => prospectToRow(prospect, runId)),
        { onConflict: 'place_id' }
      );
      if (upsertError) throw upsertError;
    }

    const cachedRecordsReused = placeIds.filter((placeId) => existingById.has(placeId)).length;
    const duplicatesSkipped = cachedRecordsReused;
    const estimatedCostUsd = estimateGoogleCost(textSearchCalls, placeDetailsCalls);
    await auth.supabase
      .from('dsa_extraction_runs')
      .update({
        raw_results_count: placeIds.length,
        unique_businesses_count: placeIds.length,
        new_details_calls: placeDetailsCalls,
        cached_records_reused: cachedRecordsReused,
        duplicates_skipped: duplicatesSkipped,
        estimated_cost_usd: estimatedCostUsd,
        actual_text_search_calls: textSearchCalls,
        actual_place_details_calls: placeDetailsCalls,
        coverage_hits: coverageHits,
        coverage_misses: coverageMisses,
        status:
          budgetStoppedBeforeDetails && !placeDetailsCalls && !cachedRecordsReused
            ? 'failed'
            : 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    const { data: allRows } = await auth.supabase
      .from('dsa_prospect_master')
      .select('phone_type,is_valid_phone,business_segment,sales_ready,sales_priority,raw_phone');
    const { data: prospects } = await auth.supabase
      .from('dsa_prospect_master')
      .select(
        'id,place_id,business_name,raw_phone,e164_phone,phone_type,is_valid_phone,website,google_maps_url,formatted_address,searched_city,detected_city,city_match,rating,review_count,matched_keywords,business_segment,parent_brand,is_corporate_branch,prospect_score,score_reasons,sales_ready,sales_priority'
      )
      .eq('sales_ready', true)
      .order('prospect_score', { ascending: false })
      .limit(500);

    return NextResponse.json({
      success: true,
      runId,
      summary: summarizeProspects(allRows || [], {
        raw_results_count: placeIds.length,
        actual_text_search_calls: textSearchCalls,
        actual_place_details_calls: placeDetailsCalls,
        cached_records_reused: cachedRecordsReused,
        duplicates_skipped: duplicatesSkipped,
        estimated_cost_usd: estimatedCostUsd,
      }),
      prospects: prospects || [],
    });
  } catch (error) {
    console.error('[lead-finder/search] error:', error);
    if (runId) {
      await auth.supabase
        .from('dsa_extraction_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Search failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Lead Finder search failed',
      },
      { status: 500 }
    );
  }
}
