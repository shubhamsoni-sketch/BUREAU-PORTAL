import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canTransitionLenderApplication,
  isLenderApplicationStage,
} from '../../src/lib/lender-intelligence/lifecycle.ts';

test('lender application stages allow forward movement and operational exits', () => {
  assert.equal(canTransitionLenderApplication('case_sent_to_lender', 'submitted'), true);
  assert.equal(canTransitionLenderApplication('submitted', 'sanctioned'), true);
  assert.equal(canTransitionLenderApplication('sanctioned', 'disbursed'), true);
  assert.equal(canTransitionLenderApplication('credit_check', 'rejected'), true);
  assert.equal(canTransitionLenderApplication('under_review', 'rerouted'), true);
});

test('lender application stages reject backward, duplicate and terminal transitions', () => {
  assert.equal(canTransitionLenderApplication('sanctioned', 'submitted'), false);
  assert.equal(canTransitionLenderApplication('submitted', 'submitted'), false);
  assert.equal(canTransitionLenderApplication('rejected', 'submitted'), false);
  assert.equal(canTransitionLenderApplication('disbursed', 'rejected'), false);
  assert.equal(canTransitionLenderApplication('rerouted', 'case_sent_to_lender'), false);
});

test('unknown statuses never enter the governed lifecycle', () => {
  assert.equal(isLenderApplicationStage('approved'), false);
  assert.equal(canTransitionLenderApplication('unknown', 'submitted'), false);
});
