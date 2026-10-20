import { createHash, createHmac, timingSafeEqual, X509Certificate } from 'node:crypto';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const MAX_BODY_BYTES = 1_048_576;
const MAX_RESPONSE_BYTES = 8_388_608;
const ATTESTATION_HEADERS = [
  'x-credittrust-mtls-fingerprint',
  'x-credittrust-mtls-source-ip',
  'x-credittrust-mtls-timestamp',
  'x-credittrust-mtls-signature',
];

function fingerprint(value) {
  return String(value || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

function singleHeader(request, name) {
  const value = request.headers[name];
  return typeof value === 'string' ? value : '';
}

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function matchesEdgeToken(received, expected) {
  const supplied = Buffer.from(received);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('request_too_large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function send(response, status, message) {
  response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  response.end(JSON.stringify({ error: message }));
}

export function createHandler(config, fetchUpstream = fetch) {
  const allowedFingerprints = new Set((config.allowedFingerprints || []).map(fingerprint));
  if (!config.secret || config.secret.length < 32 || !config.edgeToken || config.edgeToken.length < 32
    || allowedFingerprints.size === 0
    || [...allowedFingerprints].some((item) => item.length !== 64)) {
    throw new Error('Proxy signing secret, edge token and approved certificate fingerprints are required');
  }
  if (!config.upstream || new URL(config.upstream).protocol !== 'https:') {
    throw new Error('HTTPS upstream is required');
  }

  return async (request, response) => {
    if (!isLoopback(request.socket.remoteAddress)) return send(response, 403, 'Forbidden');
    if (!matchesEdgeToken(singleHeader(request, 'x-credittrust-edge-token'), config.edgeToken)) {
      return send(response, 403, 'Forbidden');
    }
    if (request.method !== 'POST' || request.url !== '/api/v1/source') {
      return send(response, 404, 'Not found');
    }
    if (Number(singleHeader(request, 'content-length')) > MAX_BODY_BYTES) {
      return send(response, 413, 'Request too large');
    }

    let certificate;
    try {
      if (singleHeader(request, 'x-client-verify') !== 'SUCCESS') throw new Error('not_verified');
      const escaped = singleHeader(request, 'x-verified-client-cert');
      if (!escaped || escaped.length > 16_384) throw new Error('missing_certificate');
      certificate = new X509Certificate(decodeURIComponent(escaped));
      const now = Date.now();
      if (now < Date.parse(certificate.validFrom) || now > Date.parse(certificate.validTo)) {
        throw new Error('expired_certificate');
      }
      if (!allowedFingerprints.has(fingerprint(certificate.fingerprint256))) {
        throw new Error('unapproved_certificate');
      }
    } catch {
      return send(response, 403, 'Client certificate rejected');
    }

    const sourceIp = singleHeader(request, 'x-verified-source-ip').trim();
    if (!sourceIp || sourceIp.includes(',') || sourceIp.length > 64) {
      return send(response, 403, 'Client IP rejected');
    }

    let body;
    try {
      body = await readBody(request);
    } catch {
      return send(response, 413, 'Request too large');
    }

    const timestamp = String(Date.now());
    const certFingerprint = fingerprint(certificate.fingerprint256);
    const bodyHash = createHash('sha256').update(body).digest('hex');
    const signature = createHmac('sha256', config.secret)
      .update(`v1\n${timestamp}\n${certFingerprint}\n${sourceIp}\n${bodyHash}`)
      .digest('hex');
    const headers = new Headers({
      'content-type': 'application/json',
      'x-credittrust-mtls-fingerprint': certFingerprint,
      'x-credittrust-mtls-source-ip': sourceIp,
      'x-credittrust-mtls-timestamp': timestamp,
      'x-credittrust-mtls-signature': signature,
    });
    const apiKey = singleHeader(request, 'x-api-key');
    if (apiKey) headers.set('x-api-key', apiKey);
    const idempotencyKey = singleHeader(request, 'idempotency-key');
    if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
    for (const name of ATTESTATION_HEADERS) {
      if (singleHeader(request, name)) return send(response, 400, 'Reserved header supplied');
    }

    try {
      const upstream = await fetchUpstream(config.upstream, {
        method: 'POST',
        headers,
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(60_000),
      });
      if (upstream.status >= 300 && upstream.status < 400) {
        return send(response, 502, 'Unexpected upstream redirect');
      }
      const result = Buffer.from(await upstream.arrayBuffer());
      if (result.length > MAX_RESPONSE_BYTES) return send(response, 502, 'Upstream response too large');
      response.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      });
      response.end(result);
    } catch {
      send(response, 502, 'Upstream unavailable');
    }
  };
}

export function startProxy(env = process.env) {
  const port = Number(env.PORT || 9443);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid proxy port');
  const handler = createHandler({
    upstream: env.UPSTREAM_URL,
    secret: env.MTLS_PROXY_SECRET,
    edgeToken: env.EDGE_INGRESS_SECRET,
    allowedFingerprints: String(env.ALLOWED_CERT_SHA256 || '').split(',').filter(Boolean),
  });
  return createServer(handler).listen(port, '127.0.0.1');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) startProxy();
