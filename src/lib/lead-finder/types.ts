export type PhoneType =
  | 'mobile'
  | 'fixed_line'
  | 'toll_free'
  | 'voip'
  | 'international'
  | 'unknown'
  | 'invalid'
  | 'missing';

export type BusinessSegment =
  | 'small_dsa'
  | 'loan_consultant'
  | 'financial_services'
  | 'enterprise_dsa_aggregator'
  | 'lender_nbfc'
  | 'bank'
  | 'housing_finance'
  | 'gold_loan_lender'
  | 'insurance'
  | 'ca_accounting'
  | 'stock_broker_investment'
  | 'recruitment_hr'
  | 'education'
  | 'adjacent_fintech'
  | 'unrelated'
  | 'unknown';

export type SalesPriority = 'A' | 'B' | 'C' | 'review' | 'exclude';

export type ScoreReason = {
  type: 'positive' | 'negative' | 'neutral';
  label: string;
  points: number;
};

export type ProspectInput = {
  place_id: string;
  business_name?: string | null;
  raw_phone?: string | null;
  website?: string | null;
  google_maps_url?: string | null;
  formatted_address?: string | null;
  searched_city?: string | null;
  searched_state?: string | null;
  detected_city?: string | null;
  rating?: number | null;
  review_count?: number | null;
  google_types?: string[];
  matched_keywords?: string[];
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
};

export type ClassifiedProspect = ProspectInput & {
  raw_phone: string | null;
  e164_phone: string | null;
  national_phone: string | null;
  phone_type: PhoneType;
  is_valid_phone: boolean;
  normalized_domain: string | null;
  detected_city: string | null;
  city_match: boolean | null;
  business_segment: BusinessSegment;
  parent_brand: string | null;
  is_corporate_branch: boolean;
  prospect_score: number;
  score_reasons: ScoreReason[];
  sales_ready: boolean;
  sales_priority: SalesPriority;
};

export type LeadFinderSummary = {
  rawResults: number;
  uniqueBusinesses: number;
  salesReady: number;
  priorityA: number;
  priorityB: number;
  enterpriseDsa: number;
  bankNbfcLender: number;
  irrelevant: number;
  needsReview: number;
  validMobile: number;
  fixedLine: number;
  missingPhone: number;
  textSearchCalls: number;
  placeDetailsCalls: number;
  cachedRecordsReused: number;
  duplicateDetailsCallsAvoided: number;
  estimatedCostUsd: number;
};
