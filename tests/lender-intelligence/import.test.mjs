import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLenderProgramImport } from '../../src/lib/lender-intelligence/import.ts';

const validRow = {
  lenderCode: ' alpha ',
  displayName: 'Alpha Bank',
  lenderType: 'BANK',
  programCode: ' pl-1 ',
  programName: 'Salaried PL',
  product: 'PERSONAL_LOAN',
  minLoan: 100000,
  maxLoan: 1000000,
};

test('bulk import normalizes identifiers and applies safe SLA defaults', () => {
  const result = validateLenderProgramImport([validRow]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0].lenderCode, 'ALPHA');
  assert.equal(result.rows[0].programCode, 'PL-1');
  assert.equal(result.rows[0].product, 'personal_loan');
  assert.equal(result.rows[0].loginSlaHours, 24);
});

test('bulk import rejects duplicates, invalid ranges, negative values and invalid enums', () => {
  const result = validateLenderProgramImport([
    validRow,
    { ...validRow, lenderType: 'broker', minLoan: 500000, maxLoan: 100000, indicativeRoiMin: -1 },
  ]);
  assert.ok(result.errors.some((error) => error.field === 'programCode' && error.row === 2));
  assert.ok(result.errors.some((error) => error.field === 'lenderType'));
  assert.ok(result.errors.some((error) => error.field === 'maxLoan'));
  assert.ok(result.errors.some((error) => error.field === 'indicativeRoiMin'));
});

test('bulk import enforces payload type, non-empty batches and maximum size', () => {
  assert.ok(validateLenderProgramImport({}).errors.length);
  assert.ok(validateLenderProgramImport([]).errors.length);
  assert.ok(validateLenderProgramImport(Array.from({ length: 501 }, () => validRow)).errors.length);
});
