import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { classifyProspect } from '@/lib/lead-finder/classifyProspect';
import {
  checkLeadFinderTables,
  fetchAllMasterSummaryRows,
  fetchAllProspectSummaryRows,
  hasLeadFinderMasterTable,
  prospectToRow,
  prospectToMasterRow,
  summarizeMasterProspects,
  summarizeProspects,
} from '@/lib/lead-finder/db';

async function fetchAllRowsForReclassify(supabase: any, overwriteManual: boolean) {
  const rows: any[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from('dsa_prospect_master')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (!overwriteManual) query = query.neq('classification_source', 'manual');

    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

async function fetchAllMasterRowsForReclassify(supabase: any) {
  const rows: any[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('lead_finder_master')
      .select('*')
      .neq('status', 'hidden')
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
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
    const overwriteManual = Boolean(body.overwriteManual);

    if (await hasLeadFinderMasterTable(auth.supabase)) {
      const rows = await fetchAllMasterRowsForReclassify(auth.supabase);
      const updates = (rows || []).map((row) => {
        const classified = classifyProspect({
          place_id: row.place_id,
          business_name: row.business_name,
          raw_phone: row.phone,
          website: row.website,
          google_maps_url: row.google_maps_url,
          formatted_address: row.address,
          searched_city: row.searched_city || row.city,
          searched_state: row.state,
          detected_city: row.detected_city || row.city,
          rating: row.rating,
          review_count: row.review_count,
          google_types: row.google_types || [],
          matched_keywords: row.matched_keywords || [],
          latitude: row.latitude,
          longitude: row.longitude,
          category: row.category || row.search_intent,
        });
        return prospectToMasterRow(classified, row.source_run_id, {
          leadType: row.lead_type || 'dsa',
          searchIntent: row.search_intent || 'loan_dsa',
          searchPrompt: row.search_prompt,
          searchKeyword: row.search_keyword,
          dataSourceQuality: row.data_source_quality || 'google_places',
        });
      });

      for (let start = 0; start < updates.length; start += 500) {
        const { error: upsertError } = await auth.supabase
          .from('lead_finder_master')
          .upsert(updates.slice(start, start + 500), { onConflict: 'place_id' });
        if (upsertError) throw upsertError;
      }
      const allRows = await fetchAllMasterSummaryRows(auth.supabase, 'all');
      return NextResponse.json({
        success: true,
        message: `Reclassified ${updates.length} prospects with zero Google API calls`,
        googleCalls: { textSearch: 0, placeDetails: 0 },
        summary: summarizeMasterProspects(allRows || [], {
          text_search_calls: 0,
          place_details_calls: 0,
        }),
      });
    }

    const rows = await fetchAllRowsForReclassify(auth.supabase, overwriteManual);

    const updates = (rows || []).map((row) => {
      const classified = classifyProspect({
        place_id: row.place_id,
        business_name: row.business_name,
        raw_phone: row.raw_phone,
        website: row.website,
        google_maps_url: row.google_maps_url,
        formatted_address: row.formatted_address,
        searched_city: row.searched_city,
        detected_city: row.detected_city,
        rating: row.rating,
        review_count: row.review_count,
        google_types: row.google_types || [],
        matched_keywords: row.matched_keywords || [],
        latitude: row.latitude,
        longitude: row.longitude,
      });
      return prospectToRow(classified, row.source_run_id);
    });

    for (let start = 0; start < updates.length; start += 500) {
      const { error: upsertError } = await auth.supabase
        .from('dsa_prospect_master')
        .upsert(updates.slice(start, start + 500), { onConflict: 'place_id' });
      if (upsertError) throw upsertError;
    }
    const allRows = await fetchAllProspectSummaryRows(auth.supabase);
    return NextResponse.json({
      success: true,
      message: `Reclassified ${updates.length} prospects with zero Google API calls`,
      googleCalls: { textSearch: 0, placeDetails: 0 },
      summary: summarizeProspects(allRows || [], {
        actual_text_search_calls: 0,
        actual_place_details_calls: 0,
      }),
    });
  } catch (error) {
    console.error('[lead-finder/reclassify] error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to reclassify existing data' },
      { status: 500 }
    );
  }
}
