import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { growthAudienceTables } from '@/lib/credit-audience/tables';

export const dynamic = 'force-dynamic';

const RESPONSE_ROW_COLUMNS =
  'id,source_file,zip_member,row_index,sequence_no,account_no,adviser_transaction_no,member_reference,total_features,cibiltusc3_score_value,cibiltusc3_score_reason_code_set,cibiltusc3_score_exclusion_code_set,cibiltusc3_score_error_code_set,score_value_numeric,created_at';

function numberValue(value: unknown) {
  return Number(value || 0);
}

function cleanSearch(value: string) {
  return value.replace(/[%(),]/g, '').trim();
}

function batchLabel(index: number) {
  return `Audience Batch ${String(index + 1).padStart(3, '0')}`;
}

// Supabase query builders return different generic builder shapes after each chained filter.
// Keeping this scoped helper loose avoids leaking that complexity into the API flow.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, params: URLSearchParams) {
  const sourceFile = params.get('sourceFile')?.trim() || 'all';
  const search = cleanSearch(params.get('search')?.trim() || '');
  const scoreStatus = params.get('scoreStatus')?.trim() || 'all';
  const errorStatus = params.get('errorStatus')?.trim() || 'all';
  const minScore = params.get('minScore')?.trim();
  const maxScore = params.get('maxScore')?.trim();

  if (sourceFile !== 'all') query = query.eq('source_file', sourceFile);
  if (scoreStatus === 'with_score') query = query.not('score_value_numeric', 'is', null);
  if (scoreStatus === 'missing_score') query = query.is('score_value_numeric', null);
  if (errorStatus === 'with_error') {
    query = query
      .not('cibiltusc3_score_error_code_set', 'is', null)
      .neq('cibiltusc3_score_error_code_set', '');
  }
  if (errorStatus === 'without_error') {
    query = query.or('cibiltusc3_score_error_code_set.is.null,cibiltusc3_score_error_code_set.eq.');
  }
  if (minScore && Number.isFinite(Number(minScore)))
    query = query.gte('score_value_numeric', Number(minScore));
  if (maxScore && Number.isFinite(Number(maxScore)))
    query = query.lte('score_value_numeric', Number(maxScore));
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `sequence_no.ilike.${pattern},account_no.ilike.${pattern},adviser_transaction_no.ilike.${pattern},member_reference.ilike.${pattern}`
    );
  }
  return query;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const params = request.nextUrl.searchParams;
  const pageSize = Math.min(Math.max(Number(params.get('pageSize') || 50), 10), 200);
  const page = Math.max(Number(params.get('page') || 1), 1);

  try {
    const [importsResult, statsResult] = await Promise.all([
      auth.supabase
        .from(growthAudienceTables.imports)
        .select(
          'id,source_file,zip_file,zip_member,status,total_rows,inserted_rows,verified,started_at,finished_at,error'
        )
        .order('created_at', { ascending: false })
        .limit(200),
      auth.supabase
        .from(growthAudienceTables.fileStats)
        .select(
          'source_file,total_rows,score_available_rows,score_missing_rows,score_700_plus_rows,score_650_699_rows,score_below_650_rows,error_rows,min_score,max_score'
        )
        .limit(500),
    ]);

    if (importsResult.error) throw importsResult.error;
    if (statsResult.error) throw statsResult.error;

    const imports = importsResult.data || [];
    const statsRows = statsResult.data || [];
    const stats = statsRows.reduce(
      (acc, row) => {
        acc.totalRows += numberValue(row.total_rows);
        acc.scoreAvailable += numberValue(row.score_available_rows);
        acc.scoreMissing += numberValue(row.score_missing_rows);
        acc.score700Plus += numberValue(row.score_700_plus_rows);
        acc.score650699 += numberValue(row.score_650_699_rows);
        acc.scoreBelow650 += numberValue(row.score_below_650_rows);
        acc.errorRows += numberValue(row.error_rows);
        const min = row.min_score === null ? null : Number(row.min_score);
        const max = row.max_score === null ? null : Number(row.max_score);
        if (min !== null) acc.minScore = acc.minScore === null ? min : Math.min(acc.minScore, min);
        if (max !== null) acc.maxScore = acc.maxScore === null ? max : Math.max(acc.maxScore, max);
        return acc;
      },
      {
        totalRows: 0,
        scoreAvailable: 0,
        scoreMissing: 0,
        score700Plus: 0,
        score650699: 0,
        scoreBelow650: 0,
        errorRows: 0,
        minScore: null as number | null,
        maxScore: null as number | null,
      }
    );

    let countQuery = auth.supabase
      .from(growthAudienceTables.rows)
      .select('id', { count: 'estimated', head: true });
    countQuery = applyFilters(countQuery, params);
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    let rowsQuery = auth.supabase
      .from(growthAudienceTables.rows)
      .select(RESPONSE_ROW_COLUMNS)
      .order('id', { ascending: false });
    rowsQuery = applyFilters(rowsQuery, params);
    const { data: rows, error: rowsError } = await rowsQuery.range(
      (page - 1) * pageSize,
      page * pageSize - 1
    );
    if (rowsError) throw rowsError;

    const sortedSourceFiles = Array.from(
      new Set(imports.map((row) => row.source_file).filter(Boolean))
    ).sort();

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      stats: {
        ...stats,
        filteredRows: numberValue(count),
        filesSeen: imports.length,
        completedFiles: imports.filter((row) => row.status === 'completed').length,
        failedFiles: imports.filter((row) => ['failed', 'verification_failed'].includes(row.status))
          .length,
      },
      imports,
      sourceFiles: sortedSourceFiles.map((value, index) => ({ value, label: batchLabel(index) })),
      rows: rows || [],
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[admin-growth-engine/audience-master] failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to load audience master',
      },
      { status: 500 }
    );
  }
}
