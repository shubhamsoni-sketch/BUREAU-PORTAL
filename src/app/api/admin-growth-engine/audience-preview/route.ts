import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';
import { audienceOperators, fieldByCode } from '@/lib/credit-audience/catalog';
import { summarizeAudienceSample } from '@/lib/credit-audience/evaluation';
import { growthAudienceTables } from '@/lib/credit-audience/tables';

export const dynamic = 'force-dynamic';

class AudienceInputError extends Error {}

function validateAudienceFilters(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 5) {
    throw new AudienceInputError('Choose between one and five conditions.');
  }

  return input.map((item) => {
    if (!item || typeof item !== 'object')
      throw new AudienceInputError('Invalid audience condition.');
    const row = item as Record<string, unknown>;
    const field = fieldByCode(String(row.field || ''));
    const operator = audienceOperators.find((op) => op.value === row.operator);
    if (!field || !operator)
      throw new AudienceInputError('An audience signal or comparison is unavailable.');
    const value =
      typeof row.value === 'string' ? (row.value.trim() ? Number(row.value) : null) : row.value;
    if (operator.needsValue && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new AudienceInputError(`${field.description} needs a numeric value.`);
    }
    return {
      field,
      operator: operator.value,
      value: operator.needsValue ? (value as number) : null,
    };
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => null);
    const filters = validateAudienceFilters(body?.filters);
    const [first, last, stats] = await Promise.all([
      auth.supabase.from(growthAudienceTables.rows).select('id').order('id').limit(1),
      auth.supabase
        .from(growthAudienceTables.rows)
        .select('id')
        .order('id', { ascending: false })
        .limit(1),
      auth.supabase.from(growthAudienceTables.fileStats).select('total_rows'),
    ]);

    for (const result of [first, last, stats]) {
      if (result.error) throw new Error(result.error.message);
    }

    const population = (stats.data || []).reduce(
      (sum, row) => sum + Number(row.total_rows || 0),
      0
    );
    const firstId = Number(first.data?.[0]?.id);
    const lastId = Number(last.data?.[0]?.id);
    if (!firstId || !lastId || !population) throw new Error('Audience inventory is not ready.');

    const columns = ['id', ...new Set(filters.map((filter) => filter.field.column))].join(',');
    const samples = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        auth.supabase
          .from(growthAudienceTables.rows)
          .select(columns)
          .gte('id', Math.floor(firstId + (Math.max(lastId - firstId, 1) * index) / 20))
          .order('id')
          .limit(500)
      )
    );

    for (const result of samples) {
      if (result.error) throw new Error(result.error.message);
    }

    const rows = samples.flatMap((result) => result.data || []) as unknown as Record<
      string,
      unknown
    >[];
    if (!rows.length) throw new Error('No audience records were available.');
    const summary = summarizeAudienceSample(rows, filters, population);

    return NextResponse.json({
      success: true,
      matchingRecords: summary.matchingRecords,
      matchingSample: summary.matchingSample,
      sampleRecords: summary.sampleRecords,
      populationRecords: population,
      isEstimate: true,
      generatedAt: new Date().toISOString(),
      filters: filters.map(({ field, operator, value }, index) => ({
        filterIndex: index,
        code: field.code,
        description: field.description,
        operator,
        value,
        matchingRecords: summary.filterCounts[index],
      })),
      output: {
        identitySafe: true,
        includes: ['Estimated audience size', 'Individual filter counts', 'Combined filter count'],
        excludes: ['Mobile numbers', 'PAN', 'Names', 'Individual customer profiles'],
      },
    });
  } catch (error) {
    if (error instanceof AudienceInputError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('[admin-growth-engine/audience-preview] failed:', error);
    return NextResponse.json(
      { success: false, error: 'Audience service unavailable. Please retry.' },
      { status: 503 }
    );
  }
}
