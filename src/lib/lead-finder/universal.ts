import { estimateGoogleCost } from './googlePlacesPricing';

export type UniversalLocation = {
  city: string;
  state: string;
};

export type UniversalLeadPlan = {
  lead_type: string;
  search_intent: string;
  locations: UniversalLocation[];
  keywords: string[];
  required_fields: string[];
  exclude_rules: string[];
  confidence_rules: string[];
  score_rules: string[];
  recommended_count: number;
  risk_warnings: string[];
  recommendation: string;
};

export type UniversalYieldForecast = {
  existing_db_matches: number;
  fresh_coverage_matches: number;
  estimated_raw_results_min: number;
  estimated_raw_results_max: number;
  estimated_unique_leads_min: number;
  estimated_unique_leads_max: number;
  estimated_valid_mobile_min: number;
  estimated_valid_mobile_max: number;
  estimated_high_confidence_min: number;
  estimated_high_confidence_max: number;
  duplicate_risk: 'low' | 'medium' | 'high';
  fresh_google_text_search_calls_needed: number;
  worst_case_place_details_calls: number;
  approx_cost_inr: number;
  confidence: 'low' | 'medium' | 'high';
  recommendation: string;
};

const DEFAULT_REQUIRED_FIELDS = ['name', 'phone', 'website', 'maps_link', 'city', 'rating'];
const DEFAULT_EXCLUDE_RULES = [
  'Exclude pure software companies unless they distribute loans',
  'Exclude stock brokers, trading-only, insurance-only, payment-only businesses',
  'Exclude schools, colleges, recruitment and unrelated consultants',
];

const MAJOR_CITY_STATE: Record<string, string> = {
  indore: 'Madhya Pradesh',
  bhopal: 'Madhya Pradesh',
  jabalpur: 'Madhya Pradesh',
  gwalior: 'Madhya Pradesh',
  ujjain: 'Madhya Pradesh',
  mumbai: 'Maharashtra',
  pune: 'Maharashtra',
  nashik: 'Maharashtra',
  nagpur: 'Maharashtra',
  ahmedabad: 'Gujarat',
  surat: 'Gujarat',
  vadodara: 'Gujarat',
  rajkot: 'Gujarat',
  gandhinagar: 'Gujarat',
  delhi: 'Delhi',
  gurgaon: 'Haryana',
  gurugram: 'Haryana',
  noida: 'Uttar Pradesh',
  lucknow: 'Uttar Pradesh',
  jaipur: 'Rajasthan',
  bengaluru: 'Karnataka',
  bangalore: 'Karnataka',
  hyderabad: 'Telangana',
  chennai: 'Tamil Nadu',
  kolkata: 'West Bengal',
};

function slugLeadType(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return slug || 'custom';
}

function parseCount(prompt: string) {
  const match = prompt.match(/\b(\d{2,5})\b/);
  const count = match ? Number(match[1]) : 100;
  return Math.max(10, Math.min(1000, Number.isFinite(count) ? count : 100));
}

function inferLeadType(prompt: string) {
  const text = prompt.toLowerCase();
  if (text.includes('fintech')) return 'fintech';
  if (text.includes('andromeda') || text.includes('ru loans') || text.includes('aggregator'))
    return 'aggregator_dsa';
  if (text.includes('restaurant') || text.includes('cafe')) return 'restaurant';
  if (text.includes('builder') || text.includes('real estate')) return 'builder';
  if (text.includes('chartered accountant') || /\bca\b/.test(text)) return 'ca_finance';
  if (text.includes('dsa') || text.includes('loan')) return 'dsa';
  return 'custom';
}

function inferKeywords(prompt: string, leadType: string) {
  const text = prompt.toLowerCase();
  if (text.includes('andromeda') || text.includes('ru loans')) {
    return [
      'Andromeda loan DSA',
      'Andromeda loan partner',
      'RU Loans DSA',
      'RU Loans loan partner',
      'loan DSA partner',
    ];
  }
  if (leadType === 'fintech') {
    return [
      'loan distribution fintech',
      'digital lending partner',
      'loan marketplace',
      'business loan fintech',
      'personal loan fintech',
    ];
  }
  if (leadType === 'restaurant') return ['restaurant', 'cafe', 'family restaurant'];
  if (leadType === 'builder')
    return ['real estate builder', 'property developer', 'construction company'];
  if (leadType === 'ca_finance')
    return ['chartered accountant loan consultant', 'finance consultant', 'tax consultant loan'];
  return [
    'Loan DSA',
    'Loan Agent',
    'Business Loan Agent',
    'Home Loan Agent',
    'Mortgage Consultant',
  ];
}

function inferLocations(prompt: string): UniversalLocation[] {
  const text = prompt.toLowerCase();
  const found = Object.entries(MAJOR_CITY_STATE)
    .filter(([city]) => text.includes(city))
    .map(([city, state]) => ({
      city: city === 'gurugram' ? 'Gurgaon' : city.replace(/\b\w/g, (char) => char.toUpperCase()),
      state,
    }));
  if (text.includes('mp') || text.includes('madhya pradesh')) {
    found.push(
      { city: 'Indore', state: 'Madhya Pradesh' },
      { city: 'Bhopal', state: 'Madhya Pradesh' },
      { city: 'Jabalpur', state: 'Madhya Pradesh' },
      { city: 'Gwalior', state: 'Madhya Pradesh' }
    );
  }
  if (text.includes('gujarat')) {
    found.push(
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Surat', state: 'Gujarat' },
      { city: 'Vadodara', state: 'Gujarat' },
      { city: 'Rajkot', state: 'Gujarat' }
    );
  }
  const unique = new Map(found.map((item) => [`${item.city}|${item.state}`, item]));
  return Array.from(unique.values()).slice(0, 12).length
    ? Array.from(unique.values()).slice(0, 12)
    : [{ city: 'Indore', state: 'Madhya Pradesh' }];
}

export function fallbackUniversalPlan(prompt: string): UniversalLeadPlan {
  const leadType = inferLeadType(prompt);
  return {
    lead_type: leadType,
    search_intent: `${leadType}_discovery`,
    locations: inferLocations(prompt),
    keywords: inferKeywords(prompt, leadType),
    required_fields: DEFAULT_REQUIRED_FIELDS,
    exclude_rules: DEFAULT_EXCLUDE_RULES,
    confidence_rules: [
      'High confidence when business name/website/keyword clearly matches target audience',
      'Medium confidence when finance/loan intent is present but category is broad',
      'Low/review when place looks adjacent or ambiguous',
    ],
    score_rules: [
      'Valid mobile increases score',
      'Relevant keyword/category increases score',
      'Website and rating improve quality',
      'Irrelevant categories reduce score',
    ],
    recommended_count: parseCount(prompt),
    risk_warnings: [
      'External data may return broad/adjacent businesses; review exclusions before run.',
    ],
    recommendation:
      'Start with a small run, review quality, then expand city-by-city to control cost.',
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object returned');
  return JSON.parse(raw.slice(start, end + 1));
}

export async function generateUniversalPlan(prompt: string): Promise<{
  plan: UniversalLeadPlan;
  source: 'ai' | 'fallback';
}> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const fallback = fallbackUniversalPlan(prompt);
  if (!key) return { plan: fallback, source: 'fallback' };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Convert this lead-finding request into strict JSON only. No markdown. Request: ${prompt}

Schema:
{
  "lead_type": "lower_snake_case max 60 chars",
  "search_intent": "short lower_snake_case",
  "locations": [{"city":"City","state":"State"}],
  "keywords": ["External data search keyword"],
  "required_fields": ["name","phone","website","maps_link","city","rating"],
  "exclude_rules": ["..."],
  "confidence_rules": ["..."],
  "score_rules": ["..."],
  "recommended_count": 100,
  "risk_warnings": ["..."],
  "recommendation": "..."
}

Rules: max 12 locations, max 10 keywords, Indian cities/states when implied, cost-conscious search terms, avoid irrelevant broad keywords.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!response.ok) throw new Error(`AI planner failed: ${response.status}`);
    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = extractJson(text);
    const plan: UniversalLeadPlan = {
      ...fallback,
      ...parsed,
      lead_type: slugLeadType(String(parsed.lead_type || fallback.lead_type)),
      locations:
        Array.isArray(parsed.locations) && parsed.locations.length
          ? parsed.locations
          : fallback.locations,
      keywords:
        Array.isArray(parsed.keywords) && parsed.keywords.length
          ? parsed.keywords.slice(0, 10)
          : fallback.keywords,
      recommended_count: Math.max(
        10,
        Math.min(1000, Number(parsed.recommended_count || fallback.recommended_count))
      ),
    };
    return { plan, source: 'ai' };
  } catch {
    return { plan: fallback, source: 'fallback' };
  }
}

export async function forecastUniversalRun(supabase: any, plan: UniversalLeadPlan) {
  const locationPairs = plan.locations.slice(0, 12);
  const keywords = plan.keywords.slice(0, 10);
  const coverageLookups = locationPairs.length * keywords.length;
  let existingDbMatches = 0;
  let freshCoverageMatches = 0;

  const { count: dbCount } = await supabase
    .from('lead_finder_master')
    .select('id', { count: 'exact', head: true })
    .eq('lead_type', plan.lead_type)
    .neq('status', 'hidden');
  existingDbMatches = Number(dbCount || 0);

  for (const location of locationPairs) {
    for (const keyword of keywords) {
      const { data } = await supabase
        .from('lead_search_coverage')
        .select('place_ids_count,next_refresh_at,status')
        .eq('city', location.city)
        .eq('state', location.state)
        .eq('lead_type', plan.lead_type)
        .eq('keyword', keyword)
        .eq('status', 'complete')
        .gt('next_refresh_at', new Date().toISOString())
        .maybeSingle();
      if (data) freshCoverageMatches += Number(data.place_ids_count || 0);
    }
  }

  const freshGoogleTextSearchCallsNeeded = Math.max(
    0,
    coverageLookups - Math.ceil(freshCoverageMatches / 20)
  );
  const requested = plan.recommended_count;
  const duplicateRisk: UniversalYieldForecast['duplicate_risk'] =
    existingDbMatches > requested
      ? 'high'
      : existingDbMatches > requested * 0.35
        ? 'medium'
        : 'low';
  const worstCasePlaceDetailsCalls = Math.max(0, requested - existingDbMatches);
  const approxCostInr = Number(
    (estimateGoogleCost(freshGoogleTextSearchCallsNeeded, worstCasePlaceDetailsCalls) * 83).toFixed(
      2
    )
  );

  return {
    existing_db_matches: existingDbMatches,
    fresh_coverage_matches: freshCoverageMatches,
    estimated_raw_results_min: Math.min(requested, Math.max(20, coverageLookups * 8)),
    estimated_raw_results_max: Math.min(requested * 2, Math.max(40, coverageLookups * 20)),
    estimated_unique_leads_min: Math.min(requested, Math.max(10, Math.floor(requested * 0.45))),
    estimated_unique_leads_max: requested,
    estimated_valid_mobile_min: Math.floor(requested * 0.35),
    estimated_valid_mobile_max: Math.floor(requested * 0.75),
    estimated_high_confidence_min: Math.floor(requested * 0.15),
    estimated_high_confidence_max: Math.floor(requested * 0.45),
    duplicate_risk: duplicateRisk,
    fresh_google_text_search_calls_needed: freshGoogleTextSearchCallsNeeded,
    worst_case_place_details_calls: worstCasePlaceDetailsCalls,
    approx_cost_inr: approxCostInr,
    confidence: freshCoverageMatches || existingDbMatches ? 'medium' : 'low',
    recommendation:
      approxCostInr > 100
        ? 'Estimated cost is high. Start with a smaller test run and validate lead quality first.'
        : 'Estimated cost is within the safe range. You can approve and start the run.',
  } satisfies UniversalYieldForecast;
}
