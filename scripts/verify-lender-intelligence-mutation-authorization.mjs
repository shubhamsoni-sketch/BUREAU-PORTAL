#!/usr/bin/env node

const baseUrlInput = String(process.env.LENDER_INTELLIGENCE_BASE_URL || '');
let baseUrl;
const tokens = {
  policyRead: String(process.env.LENDER_INTELLIGENCE_CATALOG_BEARER_TOKEN || ''),
  policyManage: String(process.env.LENDER_INTELLIGENCE_POLICY_MANAGER_BEARER_TOKEN || ''),
  financeRead: String(process.env.LENDER_INTELLIGENCE_FINANCE_BEARER_TOKEN || ''),
  financeManage: String(process.env.LENDER_INTELLIGENCE_FINANCE_MANAGER_BEARER_TOKEN || ''),
  complianceRead: String(process.env.LENDER_INTELLIGENCE_COMPLIANCE_BEARER_TOKEN || ''),
  complianceManage: String(process.env.LENDER_INTELLIGENCE_COMPLIANCE_MANAGER_BEARER_TOKEN || ''),
  routingRead: String(process.env.LENDER_INTELLIGENCE_RESTRICTED_BEARER_TOKEN || ''),
  routingReview: String(process.env.LENDER_INTELLIGENCE_ROUTING_REVIEWER_BEARER_TOKEN || ''),
};
const requiredResponseHeaders = {
  'cache-control': /private.*no-store/i,
  pragma: /no-cache/i,
  'referrer-policy': /no-referrer/i,
  'x-content-type-options': /nosniff/i,
  'content-type': /application\/json/i,
};

function assertProtectedJsonResponse(response, body, name) {
  for (const [header, expected] of Object.entries(requiredResponseHeaders)) {
    const value = response.headers.get(header) || '';
    if (!expected.test(value)) {
      throw new Error(`${name}: invalid ${header} response control (${value || '<none>'})`);
    }
  }
  if (!body || body.success !== false || typeof body.error !== 'string' || !body.error.trim()) {
    throw new Error(`${name}: expected a structured application error response`);
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
if (Object.values(tokens).some((token) => token.length < 20)) {
  console.error('All eight read/manage authorization-probe bearer tokens are required.');
  process.exit(2);
}

const probes = [
  {
    name: 'policy read denied',
    path: '/api/admin-lender-intelligence/catalog',
    token: tokens.policyRead,
    body: { action: '__authorization_probe__' },
    expected: 403,
  },
  {
    name: 'policy manager admitted',
    path: '/api/admin-lender-intelligence/catalog',
    token: tokens.policyManage,
    body: { action: '__authorization_probe__' },
    expected: 400,
  },
  {
    name: 'finance read denied',
    path: '/api/admin-lender-intelligence/operations',
    token: tokens.financeRead,
    body: { action: '__authorization_probe__' },
    expected: 403,
  },
  {
    name: 'finance manager admitted',
    path: '/api/admin-lender-intelligence/operations',
    token: tokens.financeManage,
    body: { action: '__authorization_probe__' },
    expected: 400,
  },
  {
    name: 'compliance read denied',
    path: '/api/admin-lender-intelligence/catalog',
    token: tokens.complianceRead,
    body: { action: 'manage_data_quality_issue' },
    expected: 403,
  },
  {
    name: 'compliance manager admitted',
    path: '/api/admin-lender-intelligence/catalog',
    token: tokens.complianceManage,
    body: { action: 'manage_data_quality_issue' },
    expected: 400,
  },
  {
    name: 'non-reviewer denied',
    path: '/api/admin-lender-intelligence/operations',
    token: tokens.routingRead,
    body: { action: 'review_exception' },
    expected: 403,
  },
  {
    name: 'routing reviewer admitted',
    path: '/api/admin-lender-intelligence/operations',
    token: tokens.routingReview,
    body: { action: 'review_exception' },
    expected: 400,
  },
];

const failures = [];
for (const probe of probes) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}${probe.path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${probe.token}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(probe.body),
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });
    const rawBody = await response.text();
    if (rawBody.includes(probe.token)) throw new Error('response exposed the bearer credential');
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new Error('response was not valid JSON');
    }
    assertProtectedJsonResponse(response, body, probe.name);
    if (response.status !== probe.expected) {
      failures.push(`${probe.name}: expected HTTP ${probe.expected}, received ${response.status}`);
    } else {
      console.log(`PASS ${probe.name}`);
    }
  } catch (error) {
    failures.push(`${probe.name}: ${error instanceof Error ? error.message : 'request failed'}`);
  } finally {
    clearTimeout(timeout);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`PASS lender intelligence mutation authorization (${probes.length}/${probes.length})`);
