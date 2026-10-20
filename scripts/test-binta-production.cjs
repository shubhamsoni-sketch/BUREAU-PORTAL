const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { createHash, createHmac } = require('node:crypto');
const ts = require('typescript');

function loadTypeScript(relativePath) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const result = new Module(filename, module);
  result.filename = filename;
  result.paths = Module._nodeModulePaths(path.dirname(filename));
  result._compile(compiled, filename);
  return result.exports;
}

const { normalizeBintaProductionResponse } = loadTypeScript('src/lib/api-hub/binta-production-normalizer.ts');
const { verifyBintaMtlsAttestation } = loadTypeScript('src/lib/api-hub/binta-mtls-attestation.ts');
const sample = require('../src/lib/api-hub/binta-uat-normalized-response.json');

const requestBody = {
  firstName: 'TEST', lastName: 'PERSON', dob: '01-01-1995', gender_code: '2',
  pan: 'ABCDE1234F', mobile: '9899999999', address: 'Example address', state_code: '27', pincode: '400059',
  consent: true, consent_metadata: { consent_timestamp: '1789012300', email: 'te.st@example.com' },
};
const payload = {
  firstName: 'TEST', lastName: 'PERSON', dob: '01-01-1995', gender: 'male',
  pan: 'ABCDE1234F', mobile: '9899999999', address: 'Example address', state: 'MAHARASHTRA', pincode: '400059',
};
const account = {
  accountType: '10', ownershipIndicator: 1, currentBalance: 100,
  highCreditAmount: 200, creditLimit: 300, paymentHistory: '000030',
  paymentStartDate: '01092026', paymentEndDate: '01082026',
  dateOpened: '01012020', dateReported: '30092026', memberShortName: 'MUST_NOT_LEAK',
  accountNumber: 'SECRET_ACCOUNT_NUMBER',
};
const sourceResponse = {
  data: {
    raw: {
      controlData: { controlNumber: 'CONTROL_NUMBER_MUST_NOT_LEAK' },
      consumerCreditData: [{
        scores: [{ score: '742' }], ids: [{ idType: '01', idNumber: 'ABCDE1234F' }],
        telephones: [{ telephoneType: '01', telephoneNumber: '9899999999' }],
        emails: [{ emailID: 'te.st@example.com' }],
        addresses: [{ line1: 'Example address', pinCode: '400059', stateCode: '27', dateReported: '30092026' }],
        employment: [{ occupationCode: '01', income: 50000, incomeType: 'G', incomeFrequency: 'M' }],
        accounts: Array.from({ length: 55 }, () => ({ ...account })),
        enquiries: [{ enquiryDate: '01092026', enquiryPurpose: '10', enquiryAmount: 100000 }],
      }],
      consumerSummaryData: {
        accountSummary: { totalAccounts: 55, zeroBalanceAccounts: 0, currentBalance: 5500 },
        inquirySummary: { totalInquiry: 1 },
      },
    },
  },
};
const result = normalizeBintaProductionResponse({
  requestId: 'TEST-1', responseTimeMs: 100, requestBody, payload, sourceResponse,
});
assert.deepEqual(Object.keys(result), Object.keys(sample));
for (const section of ['processing', 'consent', 'input', 'score', 'account_summary', 'inquiry_summary', 'contacts']) {
  assert.deepEqual(Object.keys(result[section]), Object.keys(sample[section]), section);
}
for (const section of ['addresses', 'employment', 'tradelines', 'enquiries', 'identities']) {
  assert.deepEqual(Object.keys(result[section][0]), Object.keys(sample[section][0]), section);
}
assert.equal(result.score.score_range, '740-745');
assert.equal(result.tradelines.length, 55);
assert.equal(result.tradelines.at(-1).sequence, 55);
assert.equal(result.tradelines[0].payment_history.length, 2);
assert.deepEqual(result.tradelines[0].payment_history.map((item) => item.month), ['2026-09', '2026-08']);
assert.equal(result.enquiries.length, 1);
assert.equal(result.input.identity.gender, 'male');
assert.equal(result.input.identity.pan_masked, 'ABCDE****F');
assert.equal(result.contacts.mobiles[0].mobile_masked, '98******99');
assert.equal(result.employment[0].occupation_code, '01');
for (const secret of ['SECRET_ACCOUNT_NUMBER', 'CONTROL_NUMBER_MUST_NOT_LEAK', 'MUST_NOT_LEAK', 'ABCDE1234F', '9899999999']) {
  assert.equal(JSON.stringify(result).includes(secret), false, `Leaked ${secret}`);
}
const mismatched = structuredClone(sourceResponse);
mismatched.data.raw.consumerSummaryData.accountSummary.totalAccounts = 56;
assert.throws(() => normalizeBintaProductionResponse({ requestId: 'TEST-2', responseTimeMs: 1, requestBody, payload, sourceResponse: mismatched }), /account count/);
const invalidHistory = structuredClone(sourceResponse);
invalidHistory.data.raw.consumerCreditData[0].accounts[0].paymentHistory = '00000';
assert.throws(() => normalizeBintaProductionResponse({ requestId: 'TEST-3', responseTimeMs: 1, requestBody, payload, sourceResponse: invalidHistory }), /payment history/);

const rawBody = JSON.stringify(requestBody);
const fingerprint = 'A'.repeat(64);
const sourceIp = '3.109.33.183';
const secret = 'synthetic-test-only-secret';
const timestamp = String(Date.now());
const bodyHash = createHash('sha256').update(rawBody).digest('hex');
const signature = createHmac('sha256', secret).update(`v1\n${timestamp}\n${fingerprint}\n${sourceIp}\n${bodyHash}`).digest('hex');
const headers = new Headers({
  'x-credittrust-mtls-fingerprint': fingerprint,
  'x-credittrust-mtls-source-ip': sourceIp,
  'x-credittrust-mtls-timestamp': timestamp,
  'x-credittrust-mtls-signature': signature,
});
const attestation = { headers, rawBody, expectedFingerprint: fingerprint, secret, allowedIps: [sourceIp] };
assert.equal(verifyBintaMtlsAttestation(attestation), true);
assert.equal(verifyBintaMtlsAttestation({ ...attestation, rawBody: rawBody + ' ' }), false);
assert.equal(verifyBintaMtlsAttestation({ ...attestation, allowedIps: ['1.2.3.4'] }), false);
assert.equal(verifyBintaMtlsAttestation({ ...attestation, now: Number(timestamp) + 61_000 }), false);
assert.equal(verifyBintaMtlsAttestation({ ...attestation, secret: '' }), false);

console.log('Binta production contract, all-account mapping, redaction, and mTLS attestation tests passed.');
