import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const MAX_CLOCK_SKEW_MS = 60_000;

function fingerprint(value: string) {
  return value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

export function verifyBintaMtlsAttestation(params: {
  headers: Headers;
  rawBody: string;
  expectedFingerprint: string;
  secret: string;
  allowedIps: string[];
  now?: number;
}): boolean {
  const { headers, rawBody, secret, allowedIps } = params;
  const certFingerprint = fingerprint(headers.get('x-credittrust-mtls-fingerprint') || '');
  const expectedFingerprint = fingerprint(params.expectedFingerprint);
  const sourceIp = headers.get('x-credittrust-mtls-source-ip')?.trim() || '';
  const timestamp = headers.get('x-credittrust-mtls-timestamp') || '';
  const signature = headers.get('x-credittrust-mtls-signature') || '';
  const issuedAt = Number(timestamp);

  if (!secret || expectedFingerprint.length !== 64 || certFingerprint !== expectedFingerprint) return false;
  if (!sourceIp || !allowedIps.includes(sourceIp)) return false;
  if (!/^\d{13}$/.test(timestamp) || !Number.isSafeInteger(issuedAt)) return false;
  if (Math.abs((params.now ?? Date.now()) - issuedAt) > MAX_CLOCK_SKEW_MS) return false;
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) return false;

  // The trusted mTLS proxy signs the verified certificate, original client IP and exact body bytes.
  const bodyHash = createHash('sha256').update(rawBody).digest('hex');
  const message = `v1\n${timestamp}\n${certFingerprint}\n${sourceIp}\n${bodyHash}`;
  const expected = createHmac('sha256', secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
