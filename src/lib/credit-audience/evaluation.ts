import type { AudienceOperator } from './catalog';
export type EvaluatedFilter = {
  field: { column: string };
  operator: AudienceOperator;
  value: number | null;
};
export function numericAudienceValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const cleaned = value.trim().replace(/,/g, '');
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
export function matchesAudienceFilter(row: Record<string, unknown>, filter: EvaluatedFilter) {
  const value = numericAudienceValue(row[filter.field.column]);
  if (filter.operator === 'is_null') return value === null;
  if (filter.operator === 'not_null') return value !== null;
  if (value === null || filter.value === null) return false;
  if (filter.operator === 'gte') return value >= filter.value;
  if (filter.operator === 'lte') return value <= filter.value;
  if (filter.operator === 'eq') return value === filter.value;
  return value !== filter.value;
}
export function summarizeAudienceSample(
  rows: Record<string, unknown>[],
  filters: EvaluatedFilter[],
  population: number
) {
  // ID-range samples overlap on sparse datasets; each sampled row counts once.
  const uniqueRows = [...new Map(rows.map((row) => [String(row.id), row])).values()];
  const estimate = (count: number) =>
    uniqueRows.length ? Math.round((count / uniqueRows.length) * population) : 0;
  const filterCounts = filters.map((filter) =>
    estimate(uniqueRows.filter((row) => matchesAudienceFilter(row, filter)).length)
  );
  const matchingSample = uniqueRows.filter((row) =>
    filters.every((filter) => matchesAudienceFilter(row, filter))
  ).length;
  return {
    sampleRecords: uniqueRows.length,
    matchingSample,
    matchingRecords: estimate(matchingSample),
    filterCounts,
  };
}
