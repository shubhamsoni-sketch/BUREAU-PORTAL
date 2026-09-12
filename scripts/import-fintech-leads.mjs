import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function readEnv(path = '.env.local') {
  const env = {};
  for (const line of fs.readFileSync(path, 'utf8').split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return env;
}

function phoneInfo(raw) {
  const phone = raw ? String(raw).trim() : '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return { raw_phone: null, e164_phone: null, national_phone: null, phone_type: 'missing', is_valid_phone: false };
  const last10 = digits.slice(-10);
  const isMobile = last10.length === 10 && /^[6-9]/.test(last10);
  return {
    raw_phone: phone,
    e164_phone: isMobile ? `+91${last10}` : null,
    national_phone: last10.length === 10 ? last10 : digits,
    phone_type: isMobile ? 'mobile' : 'fixed_line',
    is_valid_phone: isMobile,
  };
}

function domain(website) {
  if (!website) return null;
  try {
    const url = new URL(String(website).startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function priority(score) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'review';
}

function clean(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text && text !== 'null' ? text : null;
}

const env = readEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rowsPath = process.argv[2];
if (!rowsPath) throw new Error('Usage: node scripts/import-fintech-leads.mjs /path/to/rows.json');
const inputRows = JSON.parse(fs.readFileSync(rowsPath, 'utf8'));

const { data: run, error: runError } = await supabase
  .from('dsa_extraction_runs')
  .insert({
    searched_city: 'All Big Cities',
    searched_state: 'India',
    keywords: ['fintech_import', 'Fintech Lead'],
    requested_count: inputRows.length,
    raw_results_count: inputRows.length,
    unique_businesses_count: inputRows.length,
    actual_text_search_calls: 0,
    actual_place_details_calls: 0,
    text_search_sku: 'backend_import_no_google_call',
    place_details_sku: 'backend_import_no_google_call',
    pricing_config_version: 'fintech-import-v1',
    estimated_cost_usd: 0,
    status: 'complete',
    completed_at: new Date().toISOString(),
  })
  .select('id')
  .single();
if (runError) throw runError;

const now = new Date().toISOString();
const mapped = inputRows
  .filter((row) => clean(row['Place ID']))
  .map((row) => {
    const score = Number(row['Lead Score'] || 65);
    const email = clean(row.Email);
    const emailSource = clean(row['Email Source']);
    const reasons = [
      { type: 'positive', label: 'Imported fintech lead', points: 0 },
      ...(email && email.toLowerCase() !== 'not found'
        ? [{ type: 'neutral', label: `Email: ${email}`, points: 0 }]
        : []),
      ...(emailSource ? [{ type: 'neutral', label: `Email source: ${emailSource}`, points: 0 }] : []),
    ];
    const phone = phoneInfo(row.Phone);
    const matched = [
      clean(row['Matched Keyword']) || 'fintech import',
      'Fintech Lead',
    ];
    return {
      place_id: clean(row['Place ID']),
      business_name: clean(row['Business Name']),
      ...phone,
      website: clean(row.Website),
      normalized_domain: domain(row.Website),
      google_maps_url: clean(row['Google Maps Link']),
      formatted_address: clean(row.Address),
      searched_city: clean(row.City),
      detected_city: clean(row.City),
      city_match: true,
      latitude: null,
      longitude: null,
      rating: row.Rating === '' || row.Rating == null ? null : Number(row.Rating),
      review_count: row.Reviews === '' || row.Reviews == null ? null : Number(row.Reviews),
      google_types: String(row['Category/Types'] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      matched_keywords: Array.from(new Set(matched.filter(Boolean))),
      business_segment: 'adjacent_fintech',
      parent_brand: null,
      is_corporate_branch: false,
      prospect_score: Number.isFinite(score) ? score : 65,
      score_reasons: reasons,
      sales_ready: true,
      sales_priority: priority(Number.isFinite(score) ? score : 65),
      classification_source: 'rules',
      classified_at: now,
      last_seen_at: now,
      last_fetched_at: now,
      source_run_id: run.id,
      updated_at: now,
    };
  });

for (let i = 0; i < mapped.length; i += 500) {
  const chunk = mapped.slice(i, i + 500);
  const { error } = await supabase
    .from('dsa_prospect_master')
    .upsert(chunk, { onConflict: 'place_id' });
  if (error) throw error;
}

console.log(JSON.stringify({ success: true, runId: run.id, imported: mapped.length }, null, 2));
