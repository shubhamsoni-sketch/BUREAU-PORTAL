import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { classifyProspect } from '@/lib/lead-finder/classifyProspect';
import {
  fetchAllMasterSummaryRows,
  hasLeadFinderMasterTable,
  prospectToMasterRow,
  summarizeMasterProspects,
} from '@/lib/lead-finder/db';
import { fetchPlaceDetails, searchPlaceIds } from '@/lib/lead-finder/googlePlacesClient';
import { estimateGoogleCost } from '@/lib/lead-finder/googlePlacesPricing';
import { UniversalLeadPlan } from '@/lib/lead-finder/universal';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAILY_BUDGET_INR = 500;
const DEFAULT_RUN_BUDGET_INR = 150;

function cleanPlan(value: any): UniversalLeadPlan {
  const leadType = String(value?.lead_type || 'custom')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  const locations = Array.isArray(value?.locations)
    ? value.locations
        .map((item: any) => ({
          city: String(item?.city || '').trim(),
          state: String(item?.state || '').trim(),
        }))
        .filter((item: any) => item.city && item.state)
        .slice(0, 12)
    : [];
  const keywords = Array.isArray(value?.keywords)
    ? value.keywords
        .map((item: any) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];
  return {
    lead_type: leadType || 'custom',
    search_intent: String(value?.search_intent || `${leadType || 'custom'}_discovery`),
    locations: locations.length ? locations : [{ city: 'Indore', state: 'Madhya Pradesh' }],
    keywords: keywords.length ? keywords : ['Loan DSA'],
    required_fields: Array.isArray(value?.required_fields) ? value.required_fields : [],
    exclude_rules: Array.isArray(value?.exclude_rules) ? value.exclude_rules : [],
    confidence_rules: Array.isArray(value?.confidence_rules) ? value.confidence_rules : [],
    score_rules: Array.isArray(value?.score_rules) ? value.score_rules : [],
    recommended_count: Math.max(10, Math.min(1000, Number(value?.recommended_count || 100))),
    risk_warnings: Array.isArray(value?.risk_warnings) ? value.risk_warnings : [],
    recommendation: String(value?.recommendation || ''),
  };
}

function budgetNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

async function getTodaySpendInr(supabase: any) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('lead_finder_runs')
    .select('estimated_cost_inr,status')
    .gte('created_at', since.toISOString())
    .in('status', ['running', 'complete']);
  if (error) throw error;
  return (data || []).reduce(
    (sum: number, run: any) => sum + Number(run.estimated_cost_inr || 0),
    0
  );
}

async function freshCoverage(
  supabase: any,
  city: string,
  state: string,
  leadType: string,
  keyword: string
) {
  const { data, error } = await supabase
    .from('lead_search_coverage')
    .select('id,place_ids_count,next_refresh_at,status')
    .eq('city', city)
    .eq('state', state)
    .eq('lead_type', leadType)
    .eq('keyword', keyword)
    .eq('status', 'complete')
    .gt('next_refresh_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: places, error: placesError } = await supabase
    .from('lead_search_coverage_places')
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
  leadType: string,
  keyword: string,
  runId: string,
  placeIds: string[]
) {
  const now = new Date();
  const { data, error } = await supabase
    .from('lead_search_coverage')
    .upsert(
      {
        city,
        state,
        lead_type: leadType,
        keyword,
        last_search_at: now.toISOString(),
        next_refresh_at: new Date(now.getTime() + 30 * DAY_MS).toISOString(),
        place_ids_count: placeIds.length,
        status: 'complete',
        source_run_id: runId,
        updated_at: now.toISOString(),
      },
      { onConflict: 'city,state,lead_type,keyword' }
    )
    .select('id')
    .single();
  if (error) throw error;
  if (!placeIds.length) return;
  const rows = placeIds.map((place_id, index) => ({
    coverage_id: data.id,
    place_id,
    rank: index + 1,
    last_seen_at: now.toISOString(),
  }));
  const { error: placesError } = await supabase
    .from('lead_search_coverage_places')
    .upsert(rows, { onConflict: 'coverage_id,place_id' });
  if (placesError) throw placesError;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  let runId: string | null = null;
  try {
    if (!(await hasLeadFinderMasterTable(auth.supabase))) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Setup required: the master lead database is not active yet. Paid runs are locked until setup is complete.',
        },
        { status: 400 }
      );
    }

    const payload = await request.json().catch(() => ({}));
    const plan = cleanPlan(payload.plan);
    const userPrompt = String(payload.prompt || '').trim();
    const approvedPlan = payload.approvedPlan || plan;
    const forceRefresh = Boolean(payload.forceRefresh);
    const refreshExisting = Boolean(payload.refreshExisting);
    const requestedCount = Math.max(
      10,
      Math.min(1000, Number(payload.count || plan.recommended_count || 100))
    );
    const runBudgetInr = budgetNumber(
      process.env.LEAD_FINDER_RUN_BUDGET_INR,
      DEFAULT_RUN_BUDGET_INR
    );
    const dailyBudgetInr = budgetNumber(
      process.env.LEAD_FINDER_DAILY_BUDGET_INR,
      DEFAULT_DAILY_BUDGET_INR
    );
    const spendTodayInr = await getTodaySpendInr(auth.supabase);
    if (spendTodayInr >= dailyBudgetInr && forceRefresh) {
      return NextResponse.json(
        { success: false, error: 'Daily Universal Finder budget is already used.' },
        { status: 429 }
      );
    }

    const { data: run, error: runError } = await auth.supabase
      .from('lead_finder_runs')
      .insert({
        user_prompt: userPrompt,
        ai_generated_plan: payload.plan || {},
        approved_plan: approvedPlan,
        lead_type: plan.lead_type,
        search_intent: plan.search_intent,
        locations: plan.locations,
        keywords: plan.keywords,
        requested_count: requestedCount,
        budget_cap_inr: runBudgetInr,
        ai_calls: Number(payload.planSource === 'ai' || payload.planSource === 'model' ? 1 : 0),
        status: 'running',
        created_by: auth.user?.id || null,
      })
      .select('id')
      .single();
    if (runError) throw runError;
    runId = run.id;
    const activeRunId = run.id as string;

    let textSearchCalls = 0;
    let placeDetailsCalls = 0;
    let coverageHits = 0;
    let coverageMisses = 0;
    const placeMeta = new Map<string, { city: string; state: string; keywords: Set<string> }>();

    for (const location of plan.locations) {
      for (const keyword of plan.keywords) {
        let ids: string[] = [];
        const coverage = !forceRefresh
          ? await freshCoverage(
              auth.supabase,
              location.city,
              location.state,
              plan.lead_type,
              keyword
            )
          : null;
        if (coverage) {
          coverageHits += 1;
          ids = coverage.place_ids || [];
        } else {
          coverageMisses += 1;
          ids = await searchPlaceIds(
            `${keyword} in ${location.city}, ${location.state}, India`,
            Math.min(20, requestedCount)
          );
          textSearchCalls += 1;
          await upsertCoverage(
            auth.supabase,
            location.city,
            location.state,
            plan.lead_type,
            keyword,
            activeRunId,
            ids
          );
        }
        for (const placeId of ids) {
          const existing = placeMeta.get(placeId) || {
            city: location.city,
            state: location.state,
            keywords: new Set<string>(),
          };
          existing.keywords.add(keyword);
          placeMeta.set(placeId, existing);
          if (placeMeta.size >= requestedCount) break;
        }
        if (placeMeta.size >= requestedCount) break;
      }
      if (placeMeta.size >= requestedCount) break;
    }

    const placeIds = Array.from(placeMeta.keys()).slice(0, requestedCount);
    const { data: existing, error: existingError } = placeIds.length
      ? await auth.supabase.from('lead_finder_master').select('*').in('place_id', placeIds)
      : { data: [], error: null };
    if (existingError) throw existingError;
    const existingById = new Map((existing || []).map((row: any) => [row.place_id, row]));
    const staleCutoff = Date.now() - 30 * DAY_MS;
    const newProspects = [];
    let stoppedByBudget = false;

    for (const placeId of placeIds) {
      const row = existingById.get(placeId);
      const stale = !row?.last_fetched_at || new Date(row.last_fetched_at).getTime() < staleCutoff;
      if (row && !refreshExisting && !stale) continue;
      const projectedCostInr = estimateGoogleCost(textSearchCalls, placeDetailsCalls + 1) * 83;
      if (projectedCostInr > runBudgetInr || spendTodayInr + projectedCostInr > dailyBudgetInr) {
        stoppedByBudget = true;
        break;
      }
      const meta = placeMeta.get(placeId);
      const details = await fetchPlaceDetails(
        placeId,
        meta?.city || plan.locations[0]?.city || '',
        meta?.state || plan.locations[0]?.state || '',
        Array.from(meta?.keywords || [])
      );
      placeDetailsCalls += 1;
      newProspects.push(classifyProspect({ ...details, category: plan.search_intent }));
    }

    if (newProspects.length) {
      const { error: upsertError } = await auth.supabase.from('lead_finder_master').upsert(
        newProspects.map((prospect) =>
          prospectToMasterRow(prospect, runId, {
            leadType: plan.lead_type,
            searchIntent: plan.search_intent,
            searchPrompt: userPrompt,
            searchKeyword: prospect.matched_keywords?.[0] || plan.keywords[0],
          })
        ),
        { onConflict: 'place_id' }
      );
      if (upsertError) throw upsertError;
    }

    const { data: runMasterRows, error: runMasterError } = placeIds.length
      ? await auth.supabase
          .from('lead_finder_master')
          .select('id,place_id')
          .in('place_id', placeIds)
      : { data: [], error: null };
    if (runMasterError) throw runMasterError;
    const masterIdByPlaceId = new Map(
      (runMasterRows || []).map((row: any) => [row.place_id, row.id])
    );

    if (placeIds.length) {
      const runResultRows = placeIds.map((placeId) => {
        const meta = placeMeta.get(placeId);
        const existed = existingById.has(placeId);
        return {
          run_id: activeRunId,
          master_id: masterIdByPlaceId.get(placeId) || null,
          place_id: placeId,
          result_type: existed ? 'reused' : 'new',
          city: meta?.city || null,
          state: meta?.state || null,
          keyword: Array.from(meta?.keywords || [])[0] || null,
        };
      });
      const { error: runResultsError } = await auth.supabase
        .from('lead_finder_run_results')
        .upsert(runResultRows, { onConflict: 'run_id,place_id' });
      if (runResultsError) throw runResultsError;
    }

    const reusedRecords = placeIds.filter((placeId) => existingById.has(placeId)).length;
    const estimatedCostInr = Number(
      (estimateGoogleCost(textSearchCalls, placeDetailsCalls) * 83).toFixed(2)
    );
    await auth.supabase
      .from('lead_finder_runs')
      .update({
        records_found: placeIds.length,
        new_records: Math.max(placeIds.length - reusedRecords, 0),
        reused_records: reusedRecords,
        duplicates_skipped: reusedRecords,
        estimated_cost_inr: estimatedCostInr,
        text_search_calls: textSearchCalls,
        place_details_calls: placeDetailsCalls,
        status: stoppedByBudget ? 'stopped_by_budget' : 'complete',
        error_message: stoppedByBudget ? 'Stopped by Universal Finder budget guardrail' : null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    const allRows = await fetchAllMasterSummaryRows(auth.supabase, plan.lead_type);
    return NextResponse.json({
      success: true,
      runId,
      stoppedByBudget,
      metrics: {
        textSearchCalls,
        placeDetailsCalls,
        coverageHits,
        coverageMisses,
        reusedRecords,
        estimatedCostInr,
        recordsFound: placeIds.length,
      },
      summary: summarizeMasterProspects(allRows, {
        records_found: allRows.length,
        reused_records: reusedRecords,
        duplicates_skipped: reusedRecords,
        estimated_cost_inr: estimatedCostInr,
        text_search_calls: textSearchCalls,
        place_details_calls: placeDetailsCalls,
      }),
    });
  } catch (error) {
    console.error('[lead-finder/universal-run] error:', error);
    if (runId) {
      await auth.supabase
        .from('lead_finder_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Universal run failed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', runId);
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Universal Finder run failed',
      },
      { status: 500 }
    );
  }
}
