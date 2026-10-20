import assert from 'node:assert/strict';
import { createHash, createHmac, X509Certificate } from 'node:crypto';
import { createServer } from 'node:http';
import { rootCertificates } from 'node:tls';
import { after, before, test } from 'node:test';
import { createHandler } from './proxy.mjs';

const publicCertificate = rootCertificates.find((pem) => {
  const cert = new X509Certificate(pem);
  const now = Date.now();
  return now > Date.parse(cert.validFrom) && now < Date.parse(cert.validTo);
});
if (!publicCertificate) throw new Error('No current public test certificate is available');

const certificate = new X509Certificate(publicCertificate);
const fingerprint = certificate.fingerprint256.replaceAll(':', '').toUpperCase();
const secret = 'synthetic-secret-with-at-least-32-characters';
const edgeToken = 'synthetic-edge-token-with-at-least-32-characters';
const body = JSON.stringify({ synthetic: true });
let server;
let baseUrl;
let forwarded;

before(async () => {
  server = createServer(createHandler({
    upstream: 'https://api.example.test/api/v1/source',
    secret,
    edgeToken,
    allowedFingerprints: [fingerprint],
  }, async (url, options) => {
    forwarded = { url, options };
    return Response.json({ success: true });
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function verifiedHeaders(overrides = {}) {
  return {
    'content-type': 'application/json',
    'x-client-verify': 'SUCCESS',
    'x-credittrust-edge-token': edgeToken,
    'x-verified-client-cert': encodeURIComponent(publicCertificate),
    'x-verified-source-ip': '192.0.2.10',
    'x-api-key': 'synthetic-key',
    ...overrides,
  };
}

test('forwards exact body with signed certificate fingerprint and source IP', async () => {
  forwarded = null;
  const response = await fetch(`${baseUrl}/api/v1/source`, {
    method: 'POST',
    headers: verifiedHeaders(),
    body,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(forwarded.url, 'https://api.example.test/api/v1/source');
  assert.equal(forwarded.options.body.toString(), body);
  const headers = forwarded.options.headers;
  assert.equal(headers.get('x-api-key'), 'synthetic-key');
  assert.equal(headers.get('x-credittrust-mtls-fingerprint'), fingerprint);
  assert.equal(headers.get('x-credittrust-mtls-source-ip'), '192.0.2.10');
  const timestamp = headers.get('x-credittrust-mtls-timestamp');
  const hash = createHash('sha256').update(body).digest('hex');
  const expected = createHmac('sha256', secret)
    .update(`v1\n${timestamp}\n${fingerprint}\n192.0.2.10\n${hash}`)
    .digest('hex');
  assert.equal(headers.get('x-credittrust-mtls-signature'), expected);
});

test('rejects missing or unapproved client certificate', async () => {
  for (const headers of [
    verifiedHeaders({ 'x-client-verify': 'NONE' }),
    verifiedHeaders({ 'x-verified-client-cert': '' }),
  ]) {
    const response = await fetch(`${baseUrl}/api/v1/source`, { method: 'POST', headers, body });
    assert.equal(response.status, 403);
  }
});

test('rejects forged local mTLS headers without the edge-ingress token', async () => {
  for (const headers of [
    verifiedHeaders({ 'x-credittrust-edge-token': '' }),
    verifiedHeaders({ 'x-credittrust-edge-token': 'wrong-token' }),
  ]) {
    const response = await fetch(`${baseUrl}/api/v1/source`, { method: 'POST', headers, body });
    assert.equal(response.status, 403);
  }
});

test('rejects client-supplied attestation and non-source routes', async () => {
  const spoofed = await fetch(`${baseUrl}/api/v1/source`, {
    method: 'POST',
    headers: verifiedHeaders({ 'x-credittrust-mtls-signature': 'forged' }),
    body,
  });
  assert.equal(spoofed.status, 400);
  const otherRoute = await fetch(`${baseUrl}/admin`, { method: 'POST', headers: verifiedHeaders(), body });
  assert.equal(otherRoute.status, 404);
});

test('rejects certificate fingerprint not on the approved list', async () => {
  const other = createHandler({
    upstream: 'https://api.example.test/api/v1/source',
    secret,
    edgeToken,
    allowedFingerprints: ['A'.repeat(64)],
  });
  const otherServer = createServer(other);
  await new Promise((resolve) => otherServer.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${otherServer.address().port}/api/v1/source`;
    const response = await fetch(url, { method: 'POST', headers: verifiedHeaders(), body });
    assert.equal(response.status, 403);
  } finally {
    await new Promise((resolve) => otherServer.close(resolve));
  }
});

test('refuses placeholder secrets and fingerprints at startup', () => {
  assert.throws(() => createHandler({
    upstream: 'https://api.example.test/api/v1/source',
    secret: 'CHANGE_ME',
    edgeToken,
    allowedFingerprints: [fingerprint],
  }), /required/);
  assert.throws(() => createHandler({
    upstream: 'https://api.example.test/api/v1/source',
    secret,
    edgeToken,
    allowedFingerprints: ['CHANGE_ME'],
  }), /required/);
  assert.throws(() => createHandler({
    upstream: 'https://api.example.test/api/v1/source',
    secret,
    edgeToken: 'CHANGE_ME',
    allowedFingerprints: [fingerprint],
  }), /required/);
});
