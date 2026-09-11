import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { checkLeadFinderTables, summarizeProspects } from '@/lib/lead-finder/db';

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
    let query = auth.supabase
      .from('dsa_prospect_master')
      .select(
        'id,place_id,business_name,raw_phone,e164_phone,national_phone,phone_type,is_valid_phone,website,google_maps_url,formatted_address,searched_city,detected_city,city_match,rating,review_count,matched_keywords,business_segment,parent_brand,is_corporate_branch,prospect_score,score_reasons,sales_ready,sales_priority,classification_source,classified_at,last_seen_at,last_fetched_at'
      )
      .order('prospect_score', { ascending: false })
      .limit(500);

    if (view === 'sales_ready') query = query.eq('sales_ready', true);
    else if (view === 'priority_a') query = query.eq('sales_priority', 'A');
    else if (view === 'priority_b') query = query.eq('sales_priority', 'B');
    else if (view === 'enterprise')
      query = query.eq('business_segment', 'enterprise_dsa_aggregator');
    else if (view === 'bank_lender')
      query = query.in('business_segment', [
        'bank',
        'lender_nbfc',
        'housing_finance',
        'gold_loan_lender',
      ]);
    else if (view === 'irrelevant')
      query = query.in('business_segment', [
        'ca_accounting',
        'stock_broker_investment',
        'recruitment_hr',
        'education',
        'unrelated',
      ]);
    else if (view === 'review')
      query = query.or('sales_priority.eq.review,business_segment.eq.unknown');

    const [{ data: prospects, error }, { data: allRows, error: allError }, { data: latestRun }] =
      await Promise.all([
        query,
        auth.supabase
          .from('dsa_prospect_master')
          .select(
            'phone_type,is_valid_phone,business_segment,sales_ready,sales_priority,raw_phone'
          ),
        auth.supabase
          .from('dsa_extraction_runs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (error || allError) throw error || allError;
    return NextResponse.json({
      success: true,
      schemaReady: true,
      summary: summarizeProspects(allRows || [], latestRun),
      prospects: prospects || [],
      latestRun,
    });
  } catch (error) {
    console.error('[lead-finder/results] error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load Lead Finder results' },
      { status: 500 }
    );
  }
}
