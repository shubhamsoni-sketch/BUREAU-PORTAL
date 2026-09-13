import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateClawback,
  calculateCommercialTax,
  calculateExpectedPayout,
  validateCommercialPayoutTerms,
} from '../../src/lib/lender-intelligence/commercials.ts';

test('flat payout returns the contracted amount with currency precision', () => {
  assert.equal(
    calculateExpectedPayout({ basis: 'flat', value: 1250.555, disbursedAmount: 500_000 }),
    1250.56
  );
});

test('percentage payout uses disbursed amount and rounds to paise', () => {
  assert.equal(
    calculateExpectedPayout({ basis: 'percentage', value: 1.25, disbursedAmount: 123_456 }),
    1543.2
  );
});

test('slab payout includes exact boundaries and supports an open upper bound', () => {
  const slabs = [
    { min: 0, max: 500_000, basis: 'flat', value: 2_000 },
    { min: 500_001, max: 1_000_000, basis: 'percentage', value: 1 },
    { min: 1_000_001, max: null, basis: 'percentage', value: 1.5 },
  ];
  assert.equal(calculateExpectedPayout({ basis: 'slab', slabs, disbursedAmount: 500_000 }), 2_000);
  assert.equal(calculateExpectedPayout({ basis: 'slab', slabs, disbursedAmount: 750_000 }), 7_500);
  assert.equal(
    calculateExpectedPayout({ basis: 'slab', slabs, disbursedAmount: 2_000_000 }),
    30_000
  );
});

test('unsupported custom terms and unmatched slabs require manual payout', () => {
  assert.equal(
    calculateExpectedPayout({ basis: 'custom', value: 10, disbursedAmount: 100_000 }),
    0
  );
  assert.equal(
    calculateExpectedPayout({
      basis: 'slab',
      slabs: [{ min: 200_000, max: 300_000, basis: 'flat', value: 1_000 }],
      disbursedAmount: 100_000,
    }),
    0
  );
});

test('negative amounts and values cannot generate negative payouts', () => {
  assert.equal(
    calculateExpectedPayout({ basis: 'flat', value: -100, disbursedAmount: 100_000 }),
    0
  );
  assert.equal(
    calculateExpectedPayout({ basis: 'percentage', value: 2, disbursedAmount: -100_000 }),
    0
  );
});

test('commercial tax calculates GST to paise and honours reverse charge', () => {
  assert.equal(calculateCommercialTax(1_543.2, { ratePercent: 18 }), 277.78);
  assert.equal(calculateCommercialTax(1_000, { ratePercent: 18, reverseCharge: true }), 0);
});

test('commercial tax safely rejects malformed and out-of-range terms', () => {
  assert.equal(calculateCommercialTax(1_000, null), 0);
  assert.equal(calculateCommercialTax(1_000, { ratePercent: 101 }), 0);
  assert.equal(calculateCommercialTax(-1_000, { ratePercent: 18 }), 0);
});

test('clawback supports full, percentage and capped fixed recovery inside its window', () => {
  const dates = { disbursedAt: '2026-01-01T00:00:00Z', triggerAt: '2026-01-20T00:00:00Z' };
  assert.equal(
    calculateClawback({ payoutAmount: 10_000, terms: { windowDays: 30, basis: 'full' }, ...dates }),
    10_000
  );
  assert.equal(
    calculateClawback({
      payoutAmount: 10_000,
      terms: { windowDays: 30, basis: 'percentage', value: 25 },
      ...dates,
    }),
    2_500
  );
  assert.equal(
    calculateClawback({
      payoutAmount: 10_000,
      terms: { windowDays: 30, basis: 'fixed', value: 15_000 },
      ...dates,
    }),
    10_000
  );
});

test('clawback is zero outside its contractual window or for invalid terms', () => {
  assert.equal(
    calculateClawback({
      payoutAmount: 10_000,
      terms: { windowDays: 7, basis: 'full' },
      disbursedAt: '2026-01-01',
      triggerAt: '2026-01-20',
    }),
    0
  );
  assert.equal(
    calculateClawback({
      payoutAmount: 10_000,
      terms: {},
      disbursedAt: '2026-01-01',
      triggerAt: '2026-01-02',
    }),
    0
  );
});

test('commercial validator accepts safe terms and rejects invalid or overlapping slabs', () => {
  assert.deepEqual(validateCommercialPayoutTerms({ basis: 'percentage', value: 1.5 }), []);
  assert.ok(validateCommercialPayoutTerms({ basis: 'percentage', value: 101 }).length);
  assert.deepEqual(
    validateCommercialPayoutTerms({
      basis: 'slab',
      slabs: [
        { min: 0, max: 500_000, basis: 'flat', value: 2_000 },
        { min: 500_001, max: null, basis: 'percentage', value: 1.5 },
      ],
    }),
    []
  );
  assert.ok(
    validateCommercialPayoutTerms({
      basis: 'slab',
      slabs: [
        { min: 0, max: 500_000, basis: 'flat', value: 2_000 },
        { min: 400_000, max: null, basis: 'percentage', value: 150 },
      ],
    }).length >= 2
  );
});
