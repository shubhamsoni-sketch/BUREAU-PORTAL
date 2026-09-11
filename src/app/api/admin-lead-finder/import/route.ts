import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { classifyProspect } from '@/lib/lead-finder/classifyProspect';
import { checkLeadFinderTables, prospectToRow, summarizeProspects } from '@/lib/lead-finder/db';

type ImportRow = Record<string, unknown>;

function text(row: ImportRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function numberValue(row: ImportRow, ...keys: string[]) {
  const value = text(row, ...keys);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function arrayValue(row: ImportRow, ...keys: string[]) {
  const value = text(row, ...keys);
  if (!value) return [];
  return value
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const ready = await checkLeadFinderTables(auth.supabase);
    if (!ready.ready)
      return NextResponse.json({ success: false, error: ready.warning }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const rows = Array.isArray(body.rows) ? (body.rows as ImportRow[]) : [];
    const city = String(body.city || 'Indore');
    const state = String(body.state || 'Madhya Pradesh');
    if (!rows.length)
      return NextResponse.json(
        { success: false, error: 'No rows supplied for import' },
        { status: 400 }
      );

    const { data: run, error: runError } = await auth.supabase
      .from('dsa_extraction_runs')
      .insert({
        searched_city: city,
        searched_state: state,
        keywords: ['backend_import'],
        requested_count: rows.length,
        raw_results_count: rows.length,
        actual_text_search_calls: 0,
        actual_place_details_calls: 0,
        text_search_sku: 'backend_import_no_google_call',
        place_details_sku: 'backend_import_no_google_call',
        pricing_config_version: 'backend-import-v1',
        estimated_cost_usd: 0,
        status: 'running',
        created_by: auth.user?.id || null,
      })
      .select('id')
      .single();
    if (runError) throw runError;

    const classified = rows
      .map((row) => {
        const placeId = text(row, 'place_id', 'google_place_id', 'id');
        if (!placeId) return null;
        return classifyProspect({
          place_id: placeId,
          business_name: text(row, 'business_name', 'name'),
          raw_phone: text(row, 'phone', 'raw_phone', 'normalized_phone', 'international_phone'),
          website: text(row, 'website'),
          google_maps_url: text(row, 'google_maps_url', 'maps_url'),
          formatted_address: text(row, 'address', 'formatted_address'),
          searched_city: text(row, 'searched_city') || city,
          searched_state: text(row, 'searched_state') || state,
          detected_city: text(row, 'city', 'detected_city'),
          rating: numberValue(row, 'rating'),
          review_count: numberValue(row, 'review_count', 'reviews'),
          google_types: arrayValue(row, 'google_types'),
          matched_keywords: arrayValue(row, 'matched_keywords', 'searched_keyword'),
          latitude: numberValue(row, 'latitude'),
          longitude: numberValue(row, 'longitude'),
          category: text(row, 'category'),
        });
      })
      .filter(Boolean);

    if (classified.length) {
      const { error: upsertError } = await auth.supabase.from('dsa_prospect_master').upsert(
        classified.map((prospect) => prospectToRow(prospect!, run.id)),
        { onConflict: 'place_id' }
      );
      if (upsertError) throw upsertError;
    }

    await auth.supabase
      .from('dsa_extraction_runs')
      .update({
        unique_businesses_count: classified.length,
        cached_records_reused: 0,
        duplicates_skipped: rows.length - classified.length,
        status: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    const { data: allRows } = await auth.supabase
      .from('dsa_prospect_master')
      .select('phone_type,is_valid_phone,business_segment,sales_ready,sales_priority,raw_phone');
    return NextResponse.json({
      success: true,
      runId: run.id,
      imported: classified.length,
      googleCalls: { textSearch: 0, placeDetails: 0 },
      summary: summarizeProspects(allRows || [], {
        raw_results_count: rows.length,
        actual_text_search_calls: 0,
        actual_place_details_calls: 0,
        estimated_cost_usd: 0,
      }),
    });
  } catch (error) {
    console.error('[lead-finder/import] error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to import Lead Finder data' },
      { status: 500 }
    );
  }
}
