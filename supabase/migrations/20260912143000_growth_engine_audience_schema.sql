-- Growth Engine Audience schema for Bureau Portal.
-- This creates the destination structure only. No prototype data is migrated here.

create table if not exists public.growth_engine_audience_imports (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,
  zip_file text,
  zip_member text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'verification_failed')),
  total_rows bigint not null default 0,
  inserted_rows bigint not null default 0,
  duplicate_rows bigint not null default 0,
  error_rows bigint not null default 0,
  verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_engine_audience_records (
  id bigserial primary key,
  import_id uuid references public.growth_engine_audience_imports(id) on delete set null,
  source_file text,
  zip_member text,
  row_index bigint,
  sequence_no text,
  account_no text,
  adviser_transaction_no text,
  member_reference text,
  total_features integer,
  cibiltusc3_score_value text,
  cibiltusc3_score_reason_code_set text,
  cibiltusc3_score_exclusion_code_set text,
  cibiltusc3_score_error_code_set text,
  score_value_numeric integer,
  secured_accounts_count integer,
  unsecured_accounts_count integer,
  secured_high_credit_sum numeric(18,2),
  unsecured_high_credit_sum numeric(18,2),
  secured_amount_overdue_sum numeric(18,2),
  unsecured_amount_overdue_sum numeric(18,2),
  secured_balances_sum numeric(18,2),
  unsecured_balances_sum numeric(18,2),
  own_accounts_count integer,
  other_accounts_count integer,
  raw_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_engine_audience_file_stats (
  id uuid primary key default gen_random_uuid(),
  source_file text not null unique,
  total_rows bigint not null default 0,
  score_available_rows bigint not null default 0,
  score_missing_rows bigint not null default 0,
  score_700_plus_rows bigint not null default 0,
  score_650_699_rows bigint not null default 0,
  score_below_650_rows bigint not null default 0,
  error_rows bigint not null default 0,
  min_score integer,
  max_score integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_engine_audience_columns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  column_name text not null unique,
  description text not null,
  category text not null,
  data_type text not null default 'numeric',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_engine_audience_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_name text,
  industry text,
  use_case text,
  requested_count bigint not null default 0,
  estimated_count bigint not null default 0,
  filters jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approval_pending', 'approved', 'rejected', 'processing', 'delivered', 'cancelled')),
  delivery_mode text not null default 'approval_required',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_engine_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text not null unique,
  match_key text not null default 'member_reference' check (match_key in ('member_reference', 'mobile_no', 'unique_no')),
  source_file text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  input_rows bigint not null default 0,
  matched_rows bigint not null default 0,
  updated_rows bigint not null default 0,
  skipped_rows bigint not null default 0,
  error_rows bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_engine_audience_records_member_ref_idx on public.growth_engine_audience_records (member_reference);
create index if not exists growth_engine_audience_records_source_file_idx on public.growth_engine_audience_records (source_file);
create index if not exists growth_engine_audience_records_score_idx on public.growth_engine_audience_records (score_value_numeric);
create index if not exists growth_engine_audience_records_error_idx on public.growth_engine_audience_records (cibiltusc3_score_error_code_set);
create index if not exists growth_engine_audience_imports_status_idx on public.growth_engine_audience_imports (status, created_at desc);
create index if not exists growth_engine_audience_orders_status_idx on public.growth_engine_audience_orders (status, created_at desc);
create index if not exists growth_engine_enrichment_jobs_status_idx on public.growth_engine_enrichment_jobs (status, created_at desc);

do $$
declare
  signal_column text;
  signal_columns text[] := array[
    'trv07','trv09','balmag01','paymnt09','aggs907','paymnt03','walshr06','paymnt02','trv08','walshr08',
    'cv27','trv05','paymnt04','agg901','cv28','agg902','agg911','trv10','rvlr01','agg908',
    'cv13','bcpmtstr','paymnt01','rvlr10','trv23','bkc53','all234','paymnt57','all235','paymnt53',
    'bkc51','bkc234','bkc82','paymnt63','bkc84','bkc54','paymnt62','bkc81','walshr03','aggs910',
    'non_mt_trd','agg909','paymnt58','bc_trd','cv12','aggs911','paymnt05','inst_trd','walsres01','cv18',
    'aggs908','cv11','aggs909','trd','cv10','trv03','cv17','rvlr03','rvlr05','ul_trd',
    'balmag03','trv04','paymnt52','agg906','bkc83','bkc235','bkc52','trv06','cv14','cv15','cv16'
  ];
begin
  foreach signal_column in array signal_columns loop
    execute format('alter table public.growth_engine_audience_records add column if not exists %I numeric', signal_column);
    execute format('create index if not exists growth_engine_audience_records_%s_idx on public.growth_engine_audience_records (%I)', signal_column, signal_column);
  end loop;
end $$;

alter table public.growth_engine_audience_imports enable row level security;
alter table public.growth_engine_audience_records enable row level security;
alter table public.growth_engine_audience_file_stats enable row level security;
alter table public.growth_engine_audience_columns enable row level security;
alter table public.growth_engine_audience_orders enable row level security;
alter table public.growth_engine_enrichment_jobs enable row level security;
