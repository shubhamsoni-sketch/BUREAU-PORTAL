import { PhoneNumberUtil, PhoneNumberType, PhoneNumberFormat } from 'google-libphonenumber';
import type { PhoneType } from './types';

const phoneUtil = PhoneNumberUtil.getInstance();

function mapPhoneType(type: PhoneNumberType, e164: string | null): PhoneType {
  if (type === PhoneNumberType.MOBILE || type === PhoneNumberType.FIXED_LINE_OR_MOBILE)
    return 'mobile';
  if (type === PhoneNumberType.FIXED_LINE) return 'fixed_line';
  if (type === PhoneNumberType.TOLL_FREE) return 'toll_free';
  if (type === PhoneNumberType.VOIP) return 'voip';
  if (e164 && !e164.startsWith('+91')) return 'international';
  return 'unknown';
}

export function classifyPhone(raw?: string | null) {
  if (!raw || !String(raw).trim()) {
    return {
      raw_phone: raw || null,
      e164_phone: null,
      national_phone: null,
      phone_type: 'missing' as PhoneType,
      is_valid_phone: false,
    };
  }

  try {
    const parsed = phoneUtil.parseAndKeepRawInput(String(raw), 'IN');
    const isValid = phoneUtil.isValidNumber(parsed);
    if (!isValid) {
      return {
        raw_phone: raw,
        e164_phone: null,
        national_phone: null,
        phone_type: 'invalid' as PhoneType,
        is_valid_phone: false,
      };
    }

    const e164 = phoneUtil.format(parsed, PhoneNumberFormat.E164);
    const national = phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL);
    return {
      raw_phone: raw,
      e164_phone: e164,
      national_phone: national,
      phone_type: mapPhoneType(phoneUtil.getNumberType(parsed), e164),
      is_valid_phone: true,
    };
  } catch {
    return {
      raw_phone: raw,
      e164_phone: null,
      national_phone: null,
      phone_type: 'invalid' as PhoneType,
      is_valid_phone: false,
    };
  }
}
