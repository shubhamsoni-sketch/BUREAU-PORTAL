import type { BusinessSegment, PhoneType, SalesPriority, ScoreReason } from './types';

const targetSegments: BusinessSegment[] = ['small_dsa', 'loan_consultant', 'financial_services'];

export function scoreProspect(input: {
  business_name?: string | null;
  website?: string | null;
  phone_type: PhoneType;
  is_valid_phone: boolean;
  rating?: number | null;
  review_count?: number | null;
  matched_keywords?: string[];
  business_segment: BusinessSegment;
  is_corporate_branch: boolean;
  city_match: boolean | null;
}) {
  const reasons: ScoreReason[] = [];
  const add = (label: string, points: number) =>
    reasons.push({ type: points >= 0 ? 'positive' : 'negative', label, points });
  const text =
    `${input.business_name || ''} ${(input.matched_keywords || []).join(' ')}`.toLowerCase();

  if (/\bdsa\b|loan agent|loan hub/.test(text)) add('Strong loan/DSA business signal', 25);
  if (/loan consultant|loan agency|home loan|business loan|personal loan|mortgage/.test(text))
    add('Loan consultant / loan agency wording', 20);
  if (input.is_valid_phone && input.phone_type === 'mobile') add('Valid mobile number', 15);
  else if (input.is_valid_phone && input.phone_type === 'fixed_line')
    add('Valid fixed-line number', 8);
  if (input.website) add('Independent website available', 10);
  if (Number(input.rating || 0) >= 4) add('Google rating >= 4', 5);
  if (Number(input.review_count || 0) >= 5) add('Review count >= 5', 5);
  if ((input.matched_keywords || []).length > 1)
    add('Multiple relevant searched keywords matched', 10);
  if (!input.is_corporate_branch) add('Independent/local rather than corporate branch', 10);

  const negativeBySegment: Partial<Record<BusinessSegment, [string, number]>> = {
    bank: ['Known bank', -100],
    lender_nbfc: ['Known lender/NBFC', -100],
    housing_finance: ['Housing finance branch', -100],
    gold_loan_lender: ['Gold loan lender branch', -100],
    ca_accounting: ['CA/accounting false-positive segment', -70],
    recruitment_hr: ['Recruitment/HR false-positive segment', -80],
    education: ['Education false-positive segment', -80],
    stock_broker_investment: ['Stock broker/investment-only business', -60],
    unrelated: ['Clearly unrelated business', -100],
  };
  const negative = negativeBySegment[input.business_segment];
  if (negative) add(negative[0], negative[1]);
  if (input.city_match === false) add('City mismatch', -30);
  if (!input.is_valid_phone) add('No valid phone', -20);

  const prospect_score = Math.max(
    0,
    Math.min(
      100,
      reasons.reduce((sum, reason) => sum + reason.points, 0)
    )
  );
  const sales_ready =
    prospect_score >= 60 &&
    ['mobile', 'fixed_line'].includes(input.phone_type) &&
    input.city_match !== false &&
    targetSegments.includes(input.business_segment) &&
    !input.is_corporate_branch;

  let sales_priority: SalesPriority = 'review';
  if (!sales_ready && (negative || input.business_segment === 'unrelated'))
    sales_priority = 'exclude';
  else if (sales_ready && prospect_score >= 80 && input.phone_type === 'mobile')
    sales_priority = 'A';
  else if (sales_ready && prospect_score >= 65) sales_priority = 'B';
  else if (targetSegments.includes(input.business_segment)) sales_priority = 'C';

  return { prospect_score, score_reasons: reasons, sales_ready, sales_priority };
}
