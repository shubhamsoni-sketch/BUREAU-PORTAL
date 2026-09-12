-- Universal Lead Finder master schema.
-- Purpose: keep every paid/imported lead reusable in one master inventory.
-- Safety: this migration does not drop or mutate dsa_prospect_master.

create table if not exists public.lead_finder_runs (
  id uuid primary key default gen_random_uuid(),
  user_prompt text,
  gemini_generated_plan jsonb not null default '{}'::jsonb,
  approved_plan jsonb not null default '{}'::jsonb,
  lead_type text not null default 'dsa',
  search_intent text,
  locations jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  requested_count integer not null default 100,
  budget_cap_inr numeric(12,2),
  expected_yield jsonb not null default '{}'::jsonb,
  text_search_calls integer not null default 0,
  place_details_calls integer not null default 0,
  gemini_calls integer not null default 0,
  website_scrape_calls integer not null default 0,
  records_found integer not null default 0,
  new_records integer not null default 0,
  reused_records integer not null default 0,
  duplicates_skipped integer not null default 0,
  excluded_records integer not null default 0,
  estimated_cost_inr numeric(12,2) not null default 0,
  status text not null default 'running' check (
    status in ('planned', 'running', 'complete', 'failed', 'stopped_by_budget', 'cancelled')
  ),
  legacy_dsa_run_id uuid,
  created_by uuid,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_finder_master (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  lead_type text not null default 'dsa' check (lead_type ~ '^[a-z][a-z0-9_]{1,60}$'),
  search_intent text,
  search_prompt text,
  search_keyword text,
  business_name text,
  phone text,
  phone_type text not null default 'missing' check (
    phone_type in ('mobile', 'fixed_line', 'toll_free', 'voip', 'international', 'unknown', 'invalid', 'missing')
  ),
  is_valid_mobile boolean not null default false,
  email text,
  email_status text,
  email_source text,
  website text,
  normalized_domain text,
  google_maps_url text,
  address text,
  address_components jsonb,
  city text,
  state text,
  searched_city text,
  detected_city text,
  city_match boolean,
  latitude numeric,
  longitude numeric,
  rating numeric,
  review_count integer,
  google_types jsonb not null default '[]'::jsonb,
  matched_aggregator text,
  matched_keywords jsonb not null default '[]'::jsonb,
  category text,
  segment text not null default 'unknown',
  parent_brand text,
  is_corporate_branch boolean not null default false,
  confidence text not null default 'review' check (confidence in ('high', 'medium', 'low', 'review')),
  target_fit text not null default 'review' check (target_fit in ('yes', 'no', 'review')),
  score integer not null default 0,
  score_reasons jsonb not null default '[]'::jsonb,
  status text not null default 'review' check (status in ('ready', 'review', 'excluded', 'hidden')),
  data_source_quality text not null default 'google_places' check (
    data_source_quality in ('google_places', 'manual_upload', 'website_scrape', 'imported_sheet', 'crm_import')
  ),
  custom_fields jsonb not null default '{}'::jsonb,
  marketing_status text not null default 'not_contacted' check (
    marketing_status in ('not_contacted', 'contacted', 'interested', 'not_interested', 'do_not_contact')
  ),
  source_run_id uuid references public.lead_finder_runs(id) on delete set null,
  legacy_dsa_prospect_id uuid,
  legacy_dsa_run_id uuid,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_search_coverage (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text not null,
  lead_type text not null default 'dsa',
  keyword text not null,
  last_search_at timestamptz,
  next_refresh_at timestamptz,
  place_ids_count integer not null default 0,
  status text not null default 'partial' check (status in ('complete', 'partial', 'failed', 'refresh_required')),
  source_run_id uuid references public.lead_finder_runs(id) on delete set null,
  legacy_dsa_coverage_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city, state, lead_type, keyword)
);

create table if not exists public.lead_search_coverage_places (
  id uuid primary key default gen_random_uuid(),
  coverage_id uuid not null references public.lead_search_coverage(id) on delete cascade,
  place_id text not null,
  rank integer,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (coverage_id, place_id)
);

create index if not exists lead_finder_master_type_status_idx
  on public.lead_finder_master (lead_type, status, score desc);

create index if not exists lead_finder_master_city_idx
  on public.lead_finder_master (state, city, lead_type);

create index if not exists lead_finder_master_phone_idx
  on public.lead_finder_master (phone, phone_type);

create index if not exists lead_finder_master_marketing_idx
  on public.lead_finder_master (marketing_status, status);

create index if not exists lead_finder_master_intent_idx
  on public.lead_finder_master (search_intent, lead_type, status);

create index if not exists lead_finder_runs_type_status_idx
  on public.lead_finder_runs (lead_type, status, created_at desc);

create index if not exists lead_search_coverage_lookup_idx
  on public.lead_search_coverage (city, state, lead_type, keyword, next_refresh_at, status);

create index if not exists lead_search_coverage_places_place_idx
  on public.lead_search_coverage_places (place_id);

-- Backfill legacy run records into the new run table.
insert into public.lead_finder_runs (
  legacy_dsa_run_id,
  user_prompt,
  lead_type,
  search_intent,
  locations,
  keywords,
  requested_count,
  text_search_calls,
  place_details_calls,
  records_found,
  new_records,
  reused_records,
  duplicates_skipped,
  estimated_cost_inr,
  status,
  created_by,
  started_at,
  completed_at,
  error_message,
  created_at,
  updated_at
)
select
  r.id,
  null,
  case
    when r.keywords ? 'Fintech Lead' or r.keywords ? 'fintech_import' then 'fintech'
    else 'dsa'
  end,
  case
    when r.keywords ? 'Fintech Lead' or r.keywords ? 'fintech_import' then 'fintech_lending'
    else 'loan_dsa'
  end,
  jsonb_build_array(jsonb_build_object('city', r.searched_city, 'state', r.searched_state)),
  r.keywords,
  r.requested_count,
  r.actual_text_search_calls,
  r.actual_place_details_calls,
  r.raw_results_count,
  greatest(r.unique_businesses_count - r.cached_records_reused, 0),
  r.cached_records_reused,
  r.duplicates_skipped,
  round((coalesce(r.estimated_cost_usd, 0) * 83.0)::numeric, 2),
  case when r.status = 'complete' then 'complete' when r.status = 'failed' then 'failed' else 'running' end,
  r.created_by,
  r.created_at,
  r.completed_at,
  r.error_message,
  r.created_at,
  now()
from public.dsa_extraction_runs r
where not exists (
  select 1 from public.lead_finder_runs lr where lr.legacy_dsa_run_id = r.id
);

-- Backfill legacy prospect records into the new master table.
insert into public.lead_finder_master (
  place_id,
  lead_type,
  search_intent,
  search_prompt,
  search_keyword,
  business_name,
  phone,
  phone_type,
  is_valid_mobile,
  email,
  email_status,
  email_source,
  website,
  normalized_domain,
  google_maps_url,
  address,
  address_components,
  city,
  state,
  searched_city,
  detected_city,
  city_match,
  latitude,
  longitude,
  rating,
  review_count,
  google_types,
  matched_aggregator,
  matched_keywords,
  category,
  segment,
  parent_brand,
  is_corporate_branch,
  confidence,
  target_fit,
  score,
  score_reasons,
  status,
  data_source_quality,
  custom_fields,
  marketing_status,
  source_run_id,
  legacy_dsa_prospect_id,
  legacy_dsa_run_id,
  first_seen_at,
  last_seen_at,
  last_fetched_at,
  created_at,
  updated_at
)
select
  p.place_id,
  case
    when p.matched_keywords ? 'Fintech Lead'
      or p.matched_keywords ? 'fintech_import'
      or p.matched_keywords ? 'Fintech Excluded - not loan distribution'
      then 'fintech'
    else 'dsa'
  end as lead_type,
  case
    when p.matched_keywords ? 'Fintech Lead'
      or p.matched_keywords ? 'fintech_import'
      or p.matched_keywords ? 'Fintech Excluded - not loan distribution'
      then 'fintech_lending'
    else 'loan_dsa'
  end as search_intent,
  null,
  coalesce((p.matched_keywords ->> 0), null),
  p.business_name,
  p.raw_phone,
  p.phone_type,
  (p.phone_type = 'mobile' and p.is_valid_phone) as is_valid_mobile,
  (
    select regexp_replace(reason ->> 'label', '^Email: ', '')
    from jsonb_array_elements(coalesce(p.score_reasons, '[]'::jsonb)) reason
    where reason ->> 'label' like 'Email:%'
    limit 1
  ) as email,
  case
    when exists (
      select 1
      from jsonb_array_elements(coalesce(p.score_reasons, '[]'::jsonb)) reason
      where reason ->> 'label' like 'Email:%'
    ) then 'found'
    else null
  end as email_status,
  (
    select regexp_replace(reason ->> 'label', '^Email source: ', '')
    from jsonb_array_elements(coalesce(p.score_reasons, '[]'::jsonb)) reason
    where reason ->> 'label' like 'Email source:%'
    limit 1
  ) as email_source,
  p.website,
  p.normalized_domain,
  p.google_maps_url,
  p.formatted_address,
  p.address_components,
  coalesce(p.searched_city, p.detected_city),
  coalesce(dr.searched_state, coverage_state.state),
  p.searched_city,
  p.detected_city,
  p.city_match,
  p.latitude,
  p.longitude,
  p.rating,
  p.review_count,
  p.google_types,
  p.parent_brand,
  p.matched_keywords,
  null,
  p.business_segment,
  p.parent_brand,
  p.is_corporate_branch,
  case
    when p.sales_priority = 'A' then 'high'
    when p.sales_priority = 'B' then 'medium'
    when p.sales_priority = 'C' then 'low'
    else 'review'
  end as confidence,
  case
    when p.sales_priority = 'exclude' then 'no'
    when p.sales_ready then 'yes'
    else 'review'
  end as target_fit,
  p.prospect_score,
  p.score_reasons,
  case
    when p.sales_priority = 'exclude' then 'excluded'
    when p.sales_ready then 'ready'
    else 'review'
  end as status,
  case
    when p.matched_keywords ? 'fintech_import' then 'imported_sheet'
    else 'google_places'
  end as data_source_quality,
  jsonb_build_object(
    'legacy_table', 'dsa_prospect_master',
    'legacy_sales_priority', p.sales_priority,
    'legacy_sales_ready', p.sales_ready
  ),
  'not_contacted',
  lr.id,
  p.id,
  p.source_run_id,
  p.first_seen_at,
  p.last_seen_at,
  p.last_fetched_at,
  p.created_at,
  now()
from public.dsa_prospect_master p
left join public.lead_finder_runs lr on lr.legacy_dsa_run_id = p.source_run_id
left join public.dsa_extraction_runs dr on dr.id = p.source_run_id
left join lateral (
  select c.state
  from public.dsa_search_coverage_places cp
  join public.dsa_search_coverage c on c.id = cp.coverage_id
  where cp.place_id = p.place_id
  order by c.last_search_at desc nulls last
  limit 1
) coverage_state on true
where not exists (
  select 1 from public.lead_finder_master lm where lm.place_id = p.place_id
);

-- Backfill legacy coverage into the new coverage table.
insert into public.lead_search_coverage (
  city,
  state,
  lead_type,
  keyword,
  last_search_at,
  next_refresh_at,
  place_ids_count,
  status,
  legacy_dsa_coverage_id,
  created_at,
  updated_at
)
select
  c.city,
  c.state,
  'dsa',
  c.keyword,
  c.last_search_at,
  c.next_refresh_at,
  c.place_ids_count,
  c.status,
  c.id,
  c.created_at,
  now()
from public.dsa_search_coverage c
where not exists (
  select 1
  from public.lead_search_coverage lc
  where lc.city = c.city and lc.state = c.state and lc.lead_type = 'dsa' and lc.keyword = c.keyword
);

insert into public.lead_search_coverage_places (
  coverage_id,
  place_id,
  rank,
  first_seen_at,
  last_seen_at
)
select
  lc.id,
  cp.place_id,
  cp.rank,
  cp.first_seen_at,
  cp.last_seen_at
from public.dsa_search_coverage_places cp
join public.lead_search_coverage lc on lc.legacy_dsa_coverage_id = cp.coverage_id
where not exists (
  select 1
  from public.lead_search_coverage_places lcp
  where lcp.coverage_id = lc.id and lcp.place_id = cp.place_id
);
