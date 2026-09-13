import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateOperator,
  evaluateProgram,
  rankPrograms,
} from '../../src/lib/lender-intelligence/engine.ts';

const rule = (overrides) => ({
  id: 'rule-default',
  fieldKey: 'bureauScore',
  operator: 'gte',
  comparisonValue: 700,
  severity: 'hard',
  reasonCode: 'MIN_SCORE',
  reasonText: 'Minimum bureau score is required',
  weight: 0,
  priority: 1,
  enabled: true,
  ...overrides,
});

const program = (overrides = {}) => ({
  lenderId: 'lender-a',
  lenderName: 'Alpha Bank',
  programId: 'program-a',
  programName: 'Alpha Salaried',
  product: 'personal_loan',
  priority: 10,
  policyVersionId: 'policy-a-v1',
  policyVersion: 1,
  roiMin: 10.5,
  roiMax: 12.5,
  maxLoan: 2_500_000,
  avgTat: '24 hours',
  rules: [rule()],
  ...overrides,
});

test('operators handle normalized strings, inclusive boundaries, lists and existence', () => {
  assert.equal(evaluateOperator(' Salaried ', 'eq', 'salaried'), true);
  assert.equal(evaluateOperator('Delhi', 'in', ['mumbai', 'DELHI']), true);
  assert.equal(evaluateOperator('Delhi', 'not_in', ['mumbai', 'pune']), true);
  assert.equal(evaluateOperator(700, 'gte', 700), true);
  assert.equal(evaluateOperator(40, 'between', [21, 60]), true);
  assert.equal(evaluateOperator('', 'exists', null), false);
  assert.equal(evaluateOperator('', 'not_exists', null), true);
});

test('missing hard input is never converted to zero or silently excluded', () => {
  const result = evaluateProgram(program(), {});
  assert.equal(result.matchStatus, 'needs_data');
  assert.equal(result.reasons[0].outcome, 'missing');
  assert.equal(result.reasons[0].actualValue, undefined);
});

test('hard failure excludes while soft failure produces a weighted near match', () => {
  const evaluatedProgram = program({
    rules: [
      rule(),
      rule({
        id: 'rule-foir',
        fieldKey: 'foir',
        operator: 'lte',
        comparisonValue: 50,
        severity: 'soft',
        reasonCode: 'HIGH_FOIR',
        reasonText: 'FOIR is above preference',
        weight: 18,
        priority: 2,
      }),
    ],
  });

  const excluded = evaluateProgram(evaluatedProgram, {
    bureauScore: 699,
    foir: 40,
    loanAmount: 100_000,
  });
  assert.equal(excluded.matchStatus, 'excluded');

  const nearMatch = evaluateProgram(evaluatedProgram, {
    bureauScore: 750,
    foir: 55,
    loanAmount: 100_000,
  });
  assert.equal(nearMatch.matchStatus, 'near_match');
  assert.equal(nearMatch.fitScore, 82);
});

test('warning failures remain eligible and do not reduce fit score', () => {
  const result = evaluateProgram(
    program({
      rules: [
        rule(),
        rule({
          id: 'rule-vintage',
          fieldKey: 'employmentMonths',
          operator: 'gte',
          comparisonValue: 24,
          severity: 'warning',
          reasonCode: 'LOW_VINTAGE',
          reasonText: 'Employment vintage is low',
          priority: 2,
        }),
      ],
    }),
    { bureauScore: 760, employmentMonths: 12, loanAmount: 100_000 }
  );
  assert.equal(result.matchStatus, 'eligible');
  assert.equal(result.fitScore, 100);
  assert.equal(
    result.reasons.find((reason) => reason.reasonCode === 'LOW_VINTAGE')?.outcome,
    'failed'
  );
});

test('ranking is deterministic across status, fit, priority and ROI', () => {
  const programs = [
    program({ programId: 'wrong-product', product: 'home_loan', priority: 1, roiMin: 8 }),
    program({ programId: 'higher-roi', priority: 1, roiMin: 11, roiMax: 11 }),
    program({ programId: 'lower-roi', priority: 1, roiMin: 10, roiMax: 10 }),
    program({
      programId: 'near-match',
      priority: 0,
      rules: [rule({ severity: 'soft', weight: 5, comparisonValue: 800 })],
    }),
    program({
      programId: 'excluded',
      priority: 0,
      rules: [rule({ comparisonValue: 800 })],
    }),
  ];

  const results = rankPrograms(programs, {
    loanType: 'personal_loan',
    bureauScore: 750,
    loanAmount: 100_000,
  });
  assert.deepEqual(
    results.map((item) => item.programId),
    ['lower-roi', 'higher-roi', 'near-match', 'excluded']
  );
  assert.deepEqual(
    results.map((item) => item.rank),
    [1, 2, 3, null]
  );
});

test('program master guardrails are enforced as explainable hard rules', () => {
  const result = evaluateProgram(
    program({
      minLoan: 100_000,
      maxLoan: 500_000,
      minTenureMonths: 12,
      maxTenureMonths: 48,
      employmentTypes: ['salaried'],
      channels: ['crm'],
      states: ['MAHARASHTRA'],
      cities: ['Pune'],
      rules: [],
    }),
    {
      loanAmount: 750_000,
      tenure: 60,
      employmentType: 'self_employed',
      channel: 'crm',
      state: 'Maharashtra',
      city: 'Mumbai',
    }
  );

  assert.equal(result.matchStatus, 'excluded');
  assert.deepEqual(
    result.reasons
      .filter((reason) => reason.outcome === 'failed')
      .map((reason) => reason.reasonCode),
    ['PROGRAM_MAX_LOAN', 'PROGRAM_MAX_TENURE', 'PROGRAM_EMPLOYMENT', 'PROGRAM_CITY']
  );
});

test('missing program-restricted applicant data is surfaced as needs_data', () => {
  const result = evaluateProgram(program({ maxLoan: null, states: ['Delhi'], rules: [] }), {});
  assert.equal(result.matchStatus, 'needs_data');
  assert.equal(result.reasons[0].reasonCode, 'PROGRAM_STATE');
  assert.equal(result.reasons[0].outcome, 'missing');
});

test('limited capacity remains routable but ranks below an equivalent open program', () => {
  const results = rankPrograms(
    [
      program({ programId: 'limited', capacityStatus: 'limited', rules: [] }),
      program({ programId: 'open', capacityStatus: 'open', rules: [] }),
    ],
    { loanType: 'personal_loan', loanAmount: 100_000 }
  );

  assert.deepEqual(
    results.map((item) => item.programId),
    ['open', 'limited']
  );
  assert.equal(results[1].matchStatus, 'eligible');
  assert.equal(results[1].fitScore, 85);
  assert.equal(
    results[1].reasons.find((reason) => reason.reasonCode === 'PROGRAM_LIMITED_CAPACITY')?.outcome,
    'failed'
  );
});

test('exhausted quantitative capacity is an explainable hard exclusion', () => {
  const result = evaluateProgram(
    program({ programId: 'exhausted', capacityStatus: 'paused', rules: [] }),
    { loanType: 'personal_loan', loanAmount: 100_000 }
  );
  assert.equal(result.matchStatus, 'excluded');
  assert.equal(
    result.reasons.find((reason) => reason.reasonCode === 'PROGRAM_DAILY_CAPACITY_EXHAUSTED')
      ?.outcome,
    'failed'
  );
});
