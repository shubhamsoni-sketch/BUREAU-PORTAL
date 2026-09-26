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
  const dsaSignal = has(text, [/\bdsa\b/i, /loan agent/i, /loan agency/i, /loan hub/i]);
  const loanSignal = has(text, [
    /loan consultant/i,
    /mortgage consultant/i,
    /home loan/i,
    /personal loan/i,
    /business loan/i,
    /loan against property/i,
    /\blap\b/i,
  ]);
  const educationFalsePositive = has(text, [
    /overseas education/i,
    /abroad education/i,
    /study abroad/i,
    /education consultant/i,
    /school/i,
    /college/i,
    /coaching/i,
    /institute/i,
  ]);
  const accountingFalsePositive = has(text, [
    /chartered accountant/i,
    /\bca\b/i,
    /tax consultant/i,
    /gst/i,
    /accounting/i,
  ]);
  const investmentFalsePositive = has(text, [
    /stock broker/i,
    /share broker/i,
    /mutual fund/i,
    /securities/i,
    /demat/i,
    /trading/i,
  ]);

  if (has(text, [/recruit/i, /\bhr\b/i, /job/i, /placement/i])) segment = 'recruitment_hr';
  else if (educationFalsePositive) segment = 'education';
  else if (accountingFalsePositive) segment = 'ca_accounting';
  else if (investmentFalsePositive) segment = 'stock_broker_investment';
  else if (dsaSignal) segment = 'small_dsa';
  else if (loanSignal) segment = 'loan_consultant';
  else if (has(text, [/education loan/i])) segment = 'education';
  else if (has(text, [/stock/i, /investment/i])) segment = 'stock_broker_investment';
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
  } else if (
    has(text, [/financial service/i, /finserv/i, /finance service/i, /capital/i, /fincorp/i])
  )
    segment = 'financial_services';
  else if (has(text, [/fintech/i])) segment = 'adjacent_fintech';
  else if (input.business_name || input.website) segment = 'unknown';
  else segment = 'unrelated';

  return { business_segment: segment, parent_brand, is_corporate_branch };
}
