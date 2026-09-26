import type { ClassifiedProspect, ProspectInput } from './types';
import { classifyBusiness } from './classifyBusiness';
import { classifyPhone } from './classifyPhone';
import { cityMatches, detectCity } from './cityDetection';
import { normalizeDomain } from './normalizeDomain';
import { scoreProspect } from './scoreProspect';

export function classifyProspect(input: ProspectInput): ClassifiedProspect {
  const phone = classifyPhone(input.raw_phone);
  const normalized_domain = normalizeDomain(input.website);
  const detected_city =
    input.detected_city || detectCity(input.formatted_address, input.searched_city);
  const city_match = cityMatches(input.searched_city, detected_city);
  const business = classifyBusiness(input);
  const score = scoreProspect({
    business_name: input.business_name,
    website: input.website,
    phone_type: phone.phone_type,
    is_valid_phone: phone.is_valid_phone,
    rating: input.rating,
    review_count: input.review_count,
    matched_keywords: input.matched_keywords,
    business_segment: business.business_segment,
    is_corporate_branch: business.is_corporate_branch,
    city_match,
  });

  return {
    ...input,
    raw_phone: phone.raw_phone,
    e164_phone: phone.e164_phone,
    national_phone: phone.national_phone,
    phone_type: phone.phone_type,
    is_valid_phone: phone.is_valid_phone,
    normalized_domain,
    detected_city,
    city_match,
    business_segment: business.business_segment,
    parent_brand: business.parent_brand,
    is_corporate_branch: business.is_corporate_branch,
    ...score,
  };
}
