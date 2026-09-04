import { getStateName } from '@/lib/bureau/state-codes';
import type { SimpleApiConfig } from '@/lib/api-hub/simple-store';

export type CibilPayload = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  pan: string;
  mobile: string;
  address: string;
  state: string;
  pincode: string;
};

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return text(value).replace(/\D/g, '');
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function at(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!object(current)) return undefined;
    current = current[key];
  }
  return current;
}

function personalData(prefill: unknown) {
  return [at(prefill, ['data', 'data', 'personal_data']), at(prefill, ['data', 'personal_data']), at(prefill, ['personal_data'])]
    .filter(object);
}

function firstByKey(value: unknown, aliases: string[]): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstByKey(item, aliases);
      if (found) return found;
    }
  }
  if (!object(value)) return '';
  for (const [key, nested] of Object.entries(value)) {
    if (aliases.some((alias) => alias.toLowerCase() === key.toLowerCase())) {
      const found = text(nested);
      if (found) return found;
    }
    const found = firstByKey(nested, aliases);
    if (found) return found;
  }
  return '';
}

function documentValue(prefill: unknown, key: string) {
  for (const data of personalData(prefill)) {
    const documents = data.document_data;
    if (!object(documents)) continue;
    const values = documents[key];
    if (Array.isArray(values)) {
      const found = values.find(object);
      if (found && text(found.value)) return text(found.value);
    }
  }
  return '';
}

function bestAddress(prefill: unknown) {
  const candidates = personalData(prefill).flatMap((data) => Array.isArray(data.address) ? data.address.filter(object) : []);
  return candidates.map((address) => ({
    address: text(address.detailed_address || address.address),
    state: text(address.state || address.state_name),
    pincode: digits(address.pincode || address.pinCode).slice(0, 6),
    reportedAt: Date.parse(text(address.date_of_reporting || address.updated_at)) || 0,
  })).filter((address) => address.state && /^\d{6}$/.test(address.pincode))
    .sort((a, b) => b.reportedAt - a.reportedAt || Number(Boolean(b.address)) - Number(Boolean(a.address)))[0];
}

function normalizeGender(value: string) {
  const gender = value.toLowerCase();
  if (gender === '1' || gender.includes('female')) return 'female';
  if (gender === '2' || gender.includes('male')) return 'male';
  if (gender === '3' || gender.includes('trans')) return 'transgender';
  return gender;
}

function normalizeDob(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const indian = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  return indian ? `${indian[1].padStart(2, '0')}/${indian[2].padStart(2, '0')}/${indian[3]}` : value;
}

function normalizeCibilAddress(value: string, state: string, pincode: string) {
  const stateCode = state.trim().toUpperCase();
  let address = value
    .toUpperCase()
    .replace(/[^A-Z0-9 /.,#-]/g, ' ')
    .replace(new RegExp(`\\b${pincode}\\b`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (stateCode) {
    address = address.replace(new RegExp(`\\s+${stateCode.replace(/\s+/g, '\\s+')}\\s*$`), '').trim();
  }

  if (address.length <= 40) return address;
  const shortened = address.slice(0, 40);
  return shortened.replace(/\s+\S*$/, '').trim() || shortened.trim();
}

export function buildCibilPayload(prefill: unknown, mobile: string): CibilPayload {
  const info = personalData(prefill).map((data) => data.personal_information).find(object) || {};
  const fullName = text(info.full_name || info.fullName || info.name) || firstByKey(prefill, ['full_name', 'fullName', 'customer_name']);
  const names = fullName.split(/\s+/).filter(Boolean);
  const address = bestAddress(prefill);
  const pan = documentValue(prefill, 'pan') || firstByKey(prefill, ['pan', 'pan_number', 'panNumber']);
  const dob = text(info.date_of_birth || info.dateOfBirth || info.dob) || firstByKey(prefill, ['date_of_birth', 'dateOfBirth', 'dob']);
  const gender = text(info.gender || info.sex) || firstByKey(prefill, ['gender', 'sex']);

  const addressLine = normalizeCibilAddress(address?.address || '', address?.state || '', address?.pincode || '');

  return {
    firstName: names[0] || firstByKey(prefill, ['first_name', 'firstName']),
    lastName: names.length > 1 ? names[names.length - 1] : firstByKey(prefill, ['last_name', 'lastName']),
    dob: normalizeDob(dob),
    gender: normalizeGender(gender),
    pan: pan.toUpperCase(),
    mobile: digits(mobile).slice(-10),
    address: addressLine,
    state: getStateName(address?.state || ''),
    pincode: address?.pincode || '',
  };
}

export function validateCibilPayload(payload: CibilPayload) {
  const required: Array<keyof CibilPayload> = ['firstName', 'lastName', 'dob', 'gender', 'pan', 'mobile', 'address', 'state', 'pincode'];
  const missing = required.filter((key) => !payload[key]);
  if (missing.length) return `Profile is missing required fields: ${missing.join(', ')}`;
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(payload.pan)) return 'Profile PAN is invalid';
  return null;
}

export function prefillPreview(payload: CibilPayload) {
  return {
    full_name: `${payload.firstName} ${payload.lastName}`.trim(),
    dob: payload.dob,
    gender: payload.gender,
    pan: payload.pan ? `${payload.pan.slice(0, 2)}******${payload.pan.slice(-2)}` : '',
    address: payload.address,
    state: payload.state,
    pincode: payload.pincode,
  };
}

export async function hitPrefill(api: SimpleApiConfig, mobile: string, referenceId: string) {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-Auth-Type': 'API-Key',
    'X-Reference-ID': referenceId,
  };
  if (api.auth_header && api.auth_token) headers[api.auth_header] = api.auth_token;
  const response = await fetch(api.master_url.trim(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ mobile_number: mobile, first_name: '', lastName: '', consent: 'Y' }),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export function findB2cApis(apis: SimpleApiConfig[]) {
  const prefill = apis.find((api) => api.status === 'active' && ['bureau-advanced', 'mobile-prefill'].includes(api.code));
  const bureau = apis.find((api) => api.status === 'active' && ['bureau-standard', 'bureau', 'cibil.consumer_score'].includes(api.code));
  return { prefill, bureau };
}
