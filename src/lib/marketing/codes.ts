import { randomBytes } from 'crypto';

function base36(bytes = 5) {
  return randomBytes(bytes).toString('hex').toUpperCase();
}

function slug(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 18);
}

export function generateCampaignCode(name: string) {
  const prefix = slug(name) || 'CAMPAIGN';
  return `CT_META_${prefix}_${base36(3)}`;
}

export function generateAdCode(campaignCode: string) {
  return `${campaignCode}_AD_${base36(2)}`;
}

export function generateTrackingToken(prefix = 'mkt') {
  return `${prefix}_${randomBytes(18).toString('base64url')}`;
}

export function campaignPrefilledMessage(campaignCode: string) {
  return `Hi Credit Trust, I want to check my credit report. Ref: ${campaignCode}`;
}

export function extractCampaignCode(text: unknown) {
  const value = String(text ?? '');
  const match = value.match(/\bCT_META_[A-Z0-9_]+\b/i);
  if (!match) return null;
  return match[0].replace(/\s+/g, '_').toUpperCase();
}

export function whatsappDeepLink(phoneNumber: string, message: string) {
  const digits = String(phoneNumber).replace(/\D/g, '');
  return `https://wa.me/${digits.startsWith('91') ? digits : `91${digits}`}?text=${encodeURIComponent(message)}`;
}
