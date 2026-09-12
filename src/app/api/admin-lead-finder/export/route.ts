import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

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
  const leadType = requestedLeadType === 'fintech' ? 'fintech' : 'dsa';
  let query = auth.supabase
    .from('dsa_prospect_master')
    .select(
      'business_name,raw_phone,e164_phone,phone_type,business_segment,prospect_score,sales_priority,formatted_address,detected_city,website,google_maps_url,rating,review_count,matched_keywords,score_reasons,place_id'
    )
    .order('prospect_score', { ascending: false })
    .limit(5000);
  if (leadType === 'fintech') query = query.contains('matched_keywords', ['Fintech Lead']);
  else
    query = query
      .not('matched_keywords', 'cs', '["Fintech Lead"]')
      .not('matched_keywords', 'cs', '["fintech_import"]')
      .not('matched_keywords', 'cs', '["Fintech Excluded - not loan distribution"]');
  if (salesReadyOnly) query = query.eq('sales_ready', true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  const headers = [
    'business_name',
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
    'google_maps_url',
    'rating',
    'review_count',
    'matched_keywords',
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
    row.raw_phone,
    row.e164_phone,
    row.phone_type,
    row.business_segment,
    row.prospect_score,
    row.sales_priority,
    row.formatted_address,
    row.detected_city,
    row.website,
    email || '',
    email ? 'Found on website' : 'Not found',
    emailSource || '',
    row.google_maps_url,
    row.rating,
    row.review_count,
    row.matched_keywords,
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
