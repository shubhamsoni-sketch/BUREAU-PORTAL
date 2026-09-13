import assert from 'node:assert/strict';
import test from 'node:test';

import {
  operatorsForPolicyField,
  validatePolicyRule,
} from '../../src/lib/lender-intelligence/policy-schema.ts';

const valid = {
  fieldKey: 'score',
  operator: 'gte',
  comparisonValue: 700,
  severity: 'hard',
  reasonCode: 'MIN_SCORE',
  reasonText: 'Minimum bureau score',
  weight: 0,
};

test('policy taxonomy accepts valid numeric and string comparisons', () => {
  assert.deepEqual(validatePolicyRule(valid), []);
  assert.deepEqual(
    validatePolicyRule({
      ...valid,
      fieldKey: 'state',
      operator: 'in',
      comparisonValue: ['Delhi', 'Gujarat'],
    }),
    []
  );
});

test('policy taxonomy rejects unknown fields, incompatible operators and malformed values', () => {
  assert.match(
    validatePolicyRule({ ...valid, fieldKey: 'unknown' }).join(' '),
    /Unknown policy field/
  );
  assert.match(
    validatePolicyRule({ ...valid, fieldKey: 'state', operator: 'gte' }).join(' '),
    /not valid/
  );
  assert.match(
    validatePolicyRule({ ...valid, operator: 'between', comparisonValue: [700] }).join(' '),
    /exactly two/
  );
  assert.match(
    validatePolicyRule({ ...valid, comparisonValue: 'not-a-number' }).join(' '),
    /must be numeric/
  );
});

test('policy taxonomy constrains evidence and scoring metadata', () => {
  const errors = validatePolicyRule({ ...valid, reasonCode: '!', reasonText: 'no', weight: 101 });
  assert.equal(errors.length, 3);
  assert.ok(operatorsForPolicyField('loanType').includes('in'));
  assert.ok(!operatorsForPolicyField('loanType').includes('gte'));
});
