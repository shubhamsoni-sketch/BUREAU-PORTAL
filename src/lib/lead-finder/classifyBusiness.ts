import type { BusinessSegment, ProspectInput } from './types';
import { detectKnownBrand } from './knownFinancialBrands';

const has = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));

export function classifyBusiness(input: ProspectInput) {
  const text =
    `${input.business_name || ''} ${input.website || ''} ${input.formatted_address || ''} ${(input.google_types || []).join(' ')} ${input.category || ''}`.toLowerCase();
  const known = detectKnownBrand(input.business_name, input.website);
  if (known) {
    return {
      business_segment: known.segment,
      parent_brand: known.parent_brand,
      is_corporate_branch: known.is_corporate_branch,
    };
  }

  let segment: BusinessSegment = 'unknown';
  let parent_brand: string | null = null;
  let is_corporate_branch = false;

  if (has(text, [/recruit/i, /\bhr\b/i, /job/i, /placement/i])) segment = 'recruitment_hr';
  else if (has(text, [/school/i, /college/i, /education/i, /coaching/i, /institute/i]))
    segment = 'education';
  else if (
    has(text, [/chartered accountant/i, /\bca\b/i, /tax consultant/i, /gst/i, /accounting/i])
  )
    segment = 'ca_accounting';
  else if (has(text, [/stock/i, /share broker/i, /investment/i, /mutual fund/i, /securities/i]))
    segment = 'stock_broker_investment';
  else if (has(text, [/insurance/i])) segment = 'insurance';
  else if (has(text, [/bank/i])) {
    segment = 'bank';
    is_corporate_branch = true;
  } else if (has(text, [/gold loan/i])) {
    segment = 'gold_loan_lender';
    is_corporate_branch = true;
  } else if (has(text, [/housing finance/i, /home finance/i])) {
    segment = 'housing_finance';
    is_corporate_branch = true;
  } else if (has(text, [/nbfc/i, /finance limited/i, /financial limited/i])) {
    segment = 'lender_nbfc';
    is_corporate_branch = true;
  } else if (has(text, [/andromeda/i, /aggregator/i, /distribution/i])) {
    segment = 'enterprise_dsa_aggregator';
    is_corporate_branch = true;
  } else if (has(text, [/\bdsa\b/i, /loan agent/i, /loan agency/i, /loan hub/i]))
    segment = 'small_dsa';
  else if (
    has(text, [
      /loan consultant/i,
      /mortgage consultant/i,
      /home loan/i,
      /personal loan/i,
      /business loan/i,
    ])
  )
    segment = 'loan_consultant';
  else if (
    has(text, [/financial service/i, /finserv/i, /finance service/i, /capital/i, /fincorp/i])
  )
    segment = 'financial_services';
  else if (has(text, [/fintech/i])) segment = 'adjacent_fintech';
  else if (input.business_name || input.website) segment = 'unknown';
  else segment = 'unrelated';

  return { business_segment: segment, parent_brand, is_corporate_branch };
}
