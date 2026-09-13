export type PolicyOperator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'not_in'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'exists'
  | 'not_exists';

export type PolicyRule = {
  id: string;
  fieldKey: string;
  operator: PolicyOperator;
  comparisonValue: unknown;
  severity: 'hard' | 'soft' | 'warning';
  reasonCode: string;
  reasonText: string;
  weight: number;
  priority: number;
  enabled: boolean;
};

export type PolicyProgram = {
  lenderId: string;
  lenderName: string;
  programId: string;
  programName: string;
  product: string;
  priority: number;
  policyVersionId: string;
  policyVersion: number;
  roiMin: number | null;
  roiMax: number | null;
  maxLoan: number | null;
  avgTat?: string;
  capacityStatus?: 'open' | 'limited' | 'paused';
  minLoan?: number | null;
  minTenureMonths?: number | null;
  maxTenureMonths?: number | null;
  employmentTypes?: string[];
  channels?: string[];
  states?: string[];
  cities?: string[];
  rules: PolicyRule[];
};

export type RuleEvaluation = {
  ruleId: string;
  fieldKey: string;
  reasonCode: string;
  reasonText: string;
  severity: PolicyRule['severity'];
  outcome: 'passed' | 'failed' | 'missing';
  actualValue: unknown;
  expectedValue: unknown;
};

export type ProgramEvaluation = {
  lenderId: string;
  lenderName: string;
  programId: string;
  programName: string;
  policyVersionId: string;
  policyVersion: number;
  matchStatus: 'eligible' | 'near_match' | 'excluded' | 'needs_data';
  fitScore: number;
  rank: number | null;
  roi: string;
  maxLoan: number | null;
  tat: string;
  reasons: RuleEvaluation[];
};

function normalized(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function number(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function missing(value: unknown) {
  return value === undefined || value === null || value === '';
}

export function buildProgramGuardRules(program: PolicyProgram): PolicyRule[] {
  const rules: PolicyRule[] = [];
  const add = (
    suffix: string,
    fieldKey: string,
    operator: PolicyOperator,
    comparisonValue: unknown,
    reasonCode: string,
    reasonText: string,
    severity: PolicyRule['severity'] = 'hard',
    weight = 0
  ) =>
    rules.push({
      id: `program:${program.programId}:${suffix}`,
      fieldKey,
      operator,
      comparisonValue,
      severity,
      reasonCode,
      reasonText,
      weight,
      priority: -100 + rules.length,
      enabled: true,
    });

  if (program.minLoan !== null && program.minLoan !== undefined)
    add(
      'min-loan',
      'loanAmount',
      'gte',
      program.minLoan,
      'PROGRAM_MIN_LOAN',
      'Requested amount is below the program minimum'
    );
  if (program.maxLoan !== null && program.maxLoan !== undefined)
    add(
      'max-loan',
      'loanAmount',
      'lte',
      program.maxLoan,
      'PROGRAM_MAX_LOAN',
      'Requested amount exceeds the program maximum'
    );
  if (program.minTenureMonths !== null && program.minTenureMonths !== undefined)
    add(
      'min-tenure',
      'tenure',
      'gte',
      program.minTenureMonths,
      'PROGRAM_MIN_TENURE',
      'Requested tenure is below the program minimum'
    );
  if (program.maxTenureMonths !== null && program.maxTenureMonths !== undefined)
    add(
      'max-tenure',
      'tenure',
      'lte',
      program.maxTenureMonths,
      'PROGRAM_MAX_TENURE',
      'Requested tenure exceeds the program maximum'
    );
  if (program.employmentTypes?.length)
    add(
      'employment',
      'employmentType',
      'in',
      program.employmentTypes,
      'PROGRAM_EMPLOYMENT',
      'Employment type is not served by this program'
    );
  if (program.channels?.length)
    add(
      'channel',
      'channel',
      'in',
      program.channels,
      'PROGRAM_CHANNEL',
      'Origination channel is not enabled for this program'
    );
  if (program.states?.length)
    add(
      'state',
      'state',
      'in',
      program.states,
      'PROGRAM_STATE',
      'Applicant state is outside the program service area'
    );
  if (program.cities?.length)
    add(
      'city',
      'city',
      'in',
      program.cities,
      'PROGRAM_CITY',
      'Applicant city is outside the program service area'
    );
  if (program.capacityStatus === 'limited')
    add(
      'limited-capacity',
      'programCapacityStatus',
      'eq',
      'open',
      'PROGRAM_LIMITED_CAPACITY',
      'Program is accepting files at limited capacity',
      'warning',
      15
    );
  if (program.capacityStatus === 'paused')
    add(
      'exhausted-capacity',
      'programCapacityStatus',
      'eq',
      'open',
      'PROGRAM_DAILY_CAPACITY_EXHAUSTED',
      'Program has reached its daily submission capacity'
    );
  return rules;
}

export function evaluateOperator(actual: unknown, operator: PolicyOperator, expected: unknown) {
  if (operator === 'exists') return !missing(actual);
  if (operator === 'not_exists') return missing(actual);
  if (missing(actual)) return false;
  if (operator === 'eq') return normalized(actual) === normalized(expected);
  if (operator === 'neq') return normalized(actual) !== normalized(expected);
  if (operator === 'in') return list(expected).map(normalized).includes(normalized(actual));
  if (operator === 'not_in') return !list(expected).map(normalized).includes(normalized(actual));

  const actualNumber = number(actual);
  if (actualNumber === null) return false;
  if (operator === 'between') {
    const values = list(expected).map(number);
    return values.length === 2 && values[0] !== null && values[1] !== null
      ? actualNumber >= values[0] && actualNumber <= values[1]
      : false;
  }
  const expectedNumber = number(expected);
  if (expectedNumber === null) return false;
  if (operator === 'gt') return actualNumber > expectedNumber;
  if (operator === 'gte') return actualNumber >= expectedNumber;
  if (operator === 'lt') return actualNumber < expectedNumber;
  if (operator === 'lte') return actualNumber <= expectedNumber;
  return false;
}

export function evaluateProgram(
  program: PolicyProgram,
  input: Record<string, unknown>
): ProgramEvaluation {
  const effectiveRules = [...buildProgramGuardRules(program), ...program.rules];
  const evaluationInput: Record<string, unknown> = {
    ...input,
    programCapacityStatus: program.capacityStatus || 'open',
  };
  const reasons = effectiveRules
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority)
    .map((rule): RuleEvaluation => {
      const actualValue = evaluationInput[rule.fieldKey];
      const isMissing = missing(actualValue) && !['not_exists', 'exists'].includes(rule.operator);
      return {
        ruleId: rule.id,
        fieldKey: rule.fieldKey,
        reasonCode: rule.reasonCode,
        reasonText: rule.reasonText,
        severity: rule.severity,
        outcome: isMissing
          ? 'missing'
          : evaluateOperator(actualValue, rule.operator, rule.comparisonValue)
            ? 'passed'
            : 'failed',
        actualValue,
        expectedValue: rule.comparisonValue,
      };
    });

  const hardFailures = reasons.filter(
    (item) => item.severity === 'hard' && item.outcome === 'failed'
  );
  const missingHardInputs = reasons.filter(
    (item) => item.severity === 'hard' && item.outcome === 'missing'
  );
  const softFailures = reasons.filter(
    (item) => item.severity === 'soft' && item.outcome === 'failed'
  );
  const scoredFailures = reasons.filter(
    (item) =>
      item.outcome === 'failed' &&
      (item.severity === 'soft' || item.reasonCode === 'PROGRAM_LIMITED_CAPACITY')
  );
  const softPenalty = scoredFailures.reduce((sum, failed) => {
    const rule = effectiveRules.find((item) => item.id === failed.ruleId);
    return sum + Math.max(0, rule?.weight || 0);
  }, 0);
  const fitScore = Math.max(0, Math.min(100, Math.round(100 - softPenalty)));
  const matchStatus = hardFailures.length
    ? 'excluded'
    : missingHardInputs.length
      ? 'needs_data'
      : softFailures.length
        ? 'near_match'
        : 'eligible';

  return {
    lenderId: program.lenderId,
    lenderName: program.lenderName,
    programId: program.programId,
    programName: program.programName,
    policyVersionId: program.policyVersionId,
    policyVersion: program.policyVersion,
    matchStatus,
    fitScore,
    rank: null,
    roi:
      program.roiMin === null
        ? '-'
        : program.roiMax === null || program.roiMin === program.roiMax
          ? `${program.roiMin}%`
          : `${program.roiMin}-${program.roiMax}%`,
    maxLoan: program.maxLoan,
    tat: program.avgTat || '-',
    reasons,
  };
}

export function rankPrograms(programs: PolicyProgram[], input: Record<string, unknown>) {
  const statusOrder: Record<ProgramEvaluation['matchStatus'], number> = {
    eligible: 0,
    near_match: 1,
    needs_data: 2,
    excluded: 3,
  };
  const evaluated = programs
    .filter((program) => !input.loanType || program.product === input.loanType)
    .map((program) => ({ program, result: evaluateProgram(program, input) }))
    .sort(
      (a, b) =>
        statusOrder[a.result.matchStatus] - statusOrder[b.result.matchStatus] ||
        b.result.fitScore - a.result.fitScore ||
        a.program.priority - b.program.priority ||
        (a.program.roiMin ?? Number.MAX_SAFE_INTEGER) -
          (b.program.roiMin ?? Number.MAX_SAFE_INTEGER)
    )
    .map(({ result }) => result);

  let rank = 0;
  return evaluated.map((result) => {
    if (!['eligible', 'near_match'].includes(result.matchStatus)) return result;
    rank += 1;
    return { ...result, rank };
  });
}
