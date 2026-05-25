import crypto from 'crypto';

export function hashApiKey(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function createApiKey(environment: 'sandbox' | 'live') {
  const random = crypto.randomBytes(24).toString('base64url');
  const prefix = environment === 'live' ? 'ctlive' : 'ctsand';
  const key = `${prefix}_${random}`;
  return {
    key,
    prefix: key.slice(0, 14),
    hash: hashApiKey(key),
  };
}

export function maskPan(value?: string | null) {
  const pan = (value ?? '').toUpperCase();
  if (pan.length < 6) return pan ? '***' : '';
  return `${pan.slice(0, 3)}****${pan.slice(-2)}`;
}

export function maskMobile(value?: string | null) {
  const mobile = value ?? '';
  if (mobile.length < 4) return mobile ? '******' : '';
  return `******${mobile.slice(-4)}`;
}
