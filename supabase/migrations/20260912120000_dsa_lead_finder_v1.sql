-- DSA Lead Finder V1: cost-safe Google Places prospect discovery.
-- No unrestricted raw Google payload storage is used.

create table if not exists public.dsa_search_coverage (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text not null,
  keyword text not null,
  last_search_at timestamptz,
  next_refresh_at timestamptz,
  place_ids_count integer not null default 0,
  status text not null default 'partial' check (status in ('complete', 'partial', 'failed', 'refresh_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city, state, keyword)
);

create table if not exists public.dsa_search_coverage_places (
  id uuid primary key default gen_random_uuid(),
  coverage_id uuid not null references public.dsa_search_coverage(id) on delete cascade,
  place_id text not null,
  rank integer,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (coverage_id, place_id)
);

create table if not exists public.dsa_extraction_runs (
  id uuid primary key default gen_random_uuid(),
  searched_city text not null,
  searched_state text not null,
  keywords jsonb not null default '[]'::jsonb,
  requested_count integer not null default 100,
  raw_results_count integer not null default 0,
  unique_businesses_count integer not null default 0,
  new_details_calls integer not null default 0,
  cached_records_reused integer not null default 0,
  duplicates_skipped integer not null default 0,
  stale_records_refreshed integer not null default 0,
  estimated_cost_usd numeric(12,4) not null default 0,
  actual_text_search_calls integer not null default 0,
  actual_place_details_calls integer not null default 0,
  text_search_sku text,
  place_details_sku text,
  pricing_config_version text,
  coverage_hits integer not null default 0,
  coverage_misses integer not null default 0,
  force_refresh boolean not null default false,
  status text not null default 'running' check (status in ('running', 'complete', 'failed')),
  created_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create table if not exists public.dsa_prospect_master (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  business_name text,
  raw_phone text,
  e164_phone text,
  national_phone text,
  phone_type text not null default 'missing' check (phone_type in ('mobile', 'fixed_line', 'toll_free', 'voip', 'international', 'unknown', 'invalid', 'missing')),
  is_valid_phone boolean not null default false,
  website text,
  normalized_domain text,
  google_maps_url text,
  formatted_address text,
  address_components jsonb,
  searched_city text,
  detected_city text,
  city_match boolean,
  latitude numeric,
  longitude numeric,
  rating numeric,
  review_count integer,
  google_types jsonb not null default '[]'::jsonb,
  matched_keywords jsonb not null default '[]'::jsonb,
  business_segment text not null default 'unknown',
  parent_brand text,
  is_corporate_branch boolean not null default false,
  prospect_score integer not null default 0,
  score_reasons jsonb not null default '[]'::jsonb,
  sales_ready boolean not null default false,
  sales_priority text not null default 'review' check (sales_priority in ('A', 'B', 'C', 'review', 'exclude')),
  classification_source text not null default 'rules' check (classification_source in ('rules', 'manual')),
  classified_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_fetched_at timestamptz,
  source_run_id uuid references public.dsa_extraction_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dsa_search_coverage_lookup_idx on public.dsa_search_coverage (city, state, keyword, next_refresh_at, status);
create index if not exists dsa_search_coverage_places_place_idx on public.dsa_search_coverage_places (place_id);
create index if not exists dsa_prospect_sales_ready_idx on public.dsa_prospect_master (sales_ready, sales_priority, prospect_score desc);
create index if not exists dsa_prospect_segment_idx on public.dsa_prospect_master (business_segment);
create index if not exists dsa_prospect_e164_idx on public.dsa_prospect_master (e164_phone);
create index if not exists dsa_prospect_city_idx on public.dsa_prospect_master (searched_city, detected_city);

