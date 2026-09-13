#!/usr/bin/env node

const baseUrlInput = String(process.env.LENDER_INTELLIGENCE_BASE_URL || '');
let baseUrl;
const bearerToken = String(process.env.LENDER_INTELLIGENCE_ADMIN_BEARER_TOKEN || '');
const roleTokens = {
  restricted: String(process.env.LENDER_INTELLIGENCE_RESTRICTED_BEARER_TOKEN || ''),
  intelligence: String(process.env.LENDER_INTELLIGENCE_INTELLIGENCE_BEARER_TOKEN || ''),
  catalog: String(process.env.LENDER_INTELLIGENCE_CATALOG_BEARER_TOKEN || ''),
  finance: String(process.env.LENDER_INTELLIGENCE_FINANCE_BEARER_TOKEN || ''),
  compliance: String(process.env.LENDER_INTELLIGENCE_COMPLIANCE_BEARER_TOKEN || ''),
};
const requiredResponseHeaders = {
  'cache-control': /private.*no-store/i,
  pragma: /no-cache/i,
  'referrer-policy': /no-referrer/i,
  'x-content-type-options': /nosniff/i,
  'content-type': /application\/json/i,
};

function assertProtectedResponseHeaders(response, name) {
  for (const [header, expected] of Object.entries(requiredResponseHeaders)) {
    const value = response.headers.get(header) || '';
    if (!expected.test(value)) {
      throw new Error(`${name}: invalid ${header} response control (${value || '<none>'})`);
    }
  }
}

try {
  const url = new URL(baseUrlInput);
  const loopback = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
  if (url.protocol !== 'https:' && !loopback) throw new Error('insecure transport');
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('base URL must contain only an origin');
  }
  baseUrl = url.origin;
} catch {
  console.error(
    'LENDER_INTELLIGENCE_BASE_URL must be an HTTPS origin (HTTP is allowed only for loopback).'
  );
  process.exit(2);
}
if (bearerToken.length < 20) {
  console.error('LENDER_INTELLIGENCE_ADMIN_BEARER_TOKEN is required.');
  process.exit(2);
}
const configuredRoleTokens = Object.entries(roleTokens).filter(([, token]) => token.length > 0);
if (
  configuredRoleTokens.length > 0 &&
  configuredRoleTokens.length !== Object.keys(roleTokens).length
) {
  console.error('Provide all five scoped Lender Intelligence bearer tokens or none of them.');
  process.exit(2);
}
if (configuredRoleTokens.some(([, token]) => token.length < 20)) {
  console.error('Every scoped Lender Intelligence bearer token must be a valid access token.');
  process.exit(2);
}

const checks = [
  {
    name: 'catalog',
    path: '/api/admin-lender-intelligence/catalog',
    validate(data) {
      const payload = data?.data;
      return (
        payload &&
        ['lenders', 'programs', 'policies', 'rejectionReasons', 'partners'].every((key) =>
          Array.isArray(payload[key])
        ) &&
        payload.schemaHealth?.ready === true &&
        payload.schemaHealth?.migration === '20260912220000_lender_intelligence_foundation' &&
        [
          'missingRelations',
          'missingFunctions',
          'missingTriggers',
          'missingRls',
          'unsafePrivileges',
        ].every(
          (key) =>
            Array.isArray(payload.schemaHealth[key]) && payload.schemaHealth[key].length === 0
        )
      );
    },
  },
  {
    name: 'operations',
    path: '/api/admin-lender-intelligence/operations',
    validate(data) {
      const payload = data?.data;
      return (
        payload &&
        [
          'commercials',
          'reconciliation',
          'invoices',
          'payments',
          'adjustments',
          'clawbacks',
          'exceptions',
          'partnerPayoutProfiles',
          'partnerCommissionVersions',
          'partnerCommissionItems',
          'partnerCommissionPayments',
          'partnerCommissionPaymentRequests',
          'partnerCommissionRecoveries',
        ].every((key) => Array.isArray(payload[key]))
      );
    },
  },
  {
    name: 'intelligence',
    path: '/api/admin-lender-intelligence',
    validate(data) {
      const generatedAt = Date.parse(data?.generatedAt);
      return Boolean(
        Number.isFinite(generatedAt) &&
        Math.abs(Date.now() - generatedAt) < 10 * 60_000 &&
        data?.summary &&
        Array.isArray(data?.lenders) &&
        data?.routing &&
        data?.performance &&
        data?.compliance &&
        data?.intelligence?.kpis &&
        Array.isArray(data?.intelligence?.breakdown) &&
        data?.intelligence?.cohort?.from &&
        data?.intelligence?.cohort?.to
      );
    },
  },
  {
    name: 'compliance evidence',
    path: '/api/admin-lender-intelligence/compliance',
    validate(data) {
      const payload = data?.data;
      return Boolean(
        payload &&
        ['dataQualityIssues', 'documents', 'auditLogs', 'scanRuns'].every((key) =>
          Array.isArray(payload[key])
        )
      );
    },
  },
];

const failures = [];

async function fetchStatus(name, path, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });
    const rawBody = await response.text();
    assertProtectedResponseHeaders(response, name);
    if (rawBody.includes(token)) throw new Error('response exposed the bearer credential');
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new Error(`${name}: response was not valid JSON`);
    }
    const validEnvelope = response.ok
      ? body?.success === true
      : body?.success === false && typeof body?.error === 'string' && body.error.trim();
    if (!validEnvelope) throw new Error(`${name}: invalid application response envelope`);
    return response.status;
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : 'request failed'}`);
  } finally {
    clearTimeout(timeout);
  }
}
{
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}/api/admin-lender-intelligence/catalog`, {
      headers: { authorization: `Bearer ${bearerToken}invalid`, accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });
    assertProtectedResponseHeaders(response, 'authentication rejection');
    const rawBody = await response.text();
    const body = JSON.parse(rawBody);
    if (rawBody.includes(bearerToken)) throw new Error('response exposed the bearer credential');
    if (
      ![401, 403].includes(response.status) ||
      body?.success !== false ||
      typeof body?.error !== 'string' ||
      !body.error.trim()
    )
      failures.push(`authentication: invalid token returned HTTP ${response.status}`);
    else console.log('PASS authentication rejection');
  } catch (error) {
    failures.push(`authentication: ${error instanceof Error ? error.message : 'request failed'}`);
  } finally {
    clearTimeout(timeout);
  }
}

for (const check of checks) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      headers: { authorization: `Bearer ${bearerToken}`, accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });
    const rawBody = await response.text();
    assertProtectedResponseHeaders(response, check.name);
    const body = JSON.parse(rawBody);
    if (rawBody.includes(bearerToken)) {
      failures.push(`${check.name}: response exposed the bearer credential`);
      continue;
    }
    if (!response.ok || body?.success !== true || !check.validate(body)) {
      failures.push(`${check.name}: HTTP ${response.status} or invalid response contract`);
      continue;
    }
    console.log(`PASS ${check.name}`);
  } catch (error) {
    failures.push(`${check.name}: ${error instanceof Error ? error.message : 'request failed'}`);
  } finally {
    clearTimeout(timeout);
  }
}

let permissionChecks = 0;
if (configuredRoleTokens.length === Object.keys(roleTokens).length) {
  const permissionMatrix = [
    { role: 'restricted', path: '/api/admin-lender-intelligence/catalog', expected: 403 },
    { role: 'restricted', path: '/api/admin-lender-intelligence/operations', expected: 403 },
    { role: 'restricted', path: '/api/admin-lender-intelligence', expected: 403 },
    { role: 'restricted', path: '/api/admin-lender-intelligence/compliance', expected: 403 },
    { role: 'intelligence', path: '/api/admin-lender-intelligence', expected: 200 },
    { role: 'intelligence', path: '/api/admin-lender-intelligence/catalog', expected: 403 },
    { role: 'intelligence', path: '/api/admin-lender-intelligence/operations', expected: 403 },
    { role: 'intelligence', path: '/api/admin-lender-intelligence/compliance', expected: 403 },
    { role: 'catalog', path: '/api/admin-lender-intelligence/catalog', expected: 200 },
    { role: 'catalog', path: '/api/admin-lender-intelligence', expected: 403 },
    { role: 'catalog', path: '/api/admin-lender-intelligence/operations', expected: 403 },
    { role: 'catalog', path: '/api/admin-lender-intelligence/compliance', expected: 403 },
    { role: 'finance', path: '/api/admin-lender-intelligence/operations', expected: 200 },
    { role: 'finance', path: '/api/admin-lender-intelligence/catalog', expected: 403 },
    { role: 'finance', path: '/api/admin-lender-intelligence/compliance', expected: 403 },
    { role: 'compliance', path: '/api/admin-lender-intelligence/compliance', expected: 200 },
    { role: 'compliance', path: '/api/admin-lender-intelligence/documents', expected: 400 },
    { role: 'compliance', path: '/api/admin-lender-intelligence/catalog', expected: 403 },
    { role: 'compliance', path: '/api/admin-lender-intelligence/operations', expected: 403 },
  ];
  for (const check of permissionMatrix) {
    permissionChecks += 1;
    try {
      const status = await fetchStatus(
        `permission ${check.role} ${check.path}`,
        check.path,
        roleTokens[check.role]
      );
      if (status !== check.expected) {
        failures.push(
          `permission ${check.role} ${check.path}: expected HTTP ${check.expected}, received ${status}`
        );
      } else {
        console.log(`PASS permission ${check.role} ${check.path}`);
      }
    } catch (error) {
      failures.push(
        error instanceof Error ? error.message : `permission ${check.role}: request failed`
      );
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
const totalChecks = checks.length + 1 + permissionChecks;
console.log(`PASS authenticated lender intelligence rollout (${totalChecks}/${totalChecks})`);
