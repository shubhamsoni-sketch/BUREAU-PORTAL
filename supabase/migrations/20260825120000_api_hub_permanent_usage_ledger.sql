create table if not exists public.api_hub_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  client_id text,
  api_id text,
  key_id text,
  api_code text,
  environment text not null default 'live',
  method text not null default 'POST',
  request_path text,
  status text not null check (status in ('success', 'failed')),
  http_status integer,
  provider_status integer,
  credits_deducted numeric(14, 2) not null default 0,
  balance_after numeric(14, 2),
  masked_pan text,
  masked_mobile text,
  ip_address text,
  user_agent text,
  response_time_ms integer,
  provider_ref text,
  error_message text,
  request_json jsonb,
  response_json jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists api_hub_usage_ledger_client_created_idx
  on public.api_hub_usage_ledger (client_id, created_at desc);
create index if not exists api_hub_usage_ledger_api_created_idx
  on public.api_hub_usage_ledger (api_id, created_at desc);
create index if not exists api_hub_usage_ledger_status_created_idx
  on public.api_hub_usage_ledger (status, created_at desc);
create index if not exists api_hub_usage_ledger_created_idx
  on public.api_hub_usage_ledger (created_at desc);

alter table public.api_hub_usage_ledger enable row level security;
revoke all on public.api_hub_usage_ledger from anon, authenticated;

comment on table public.api_hub_usage_ledger is
  'Permanent append-only evidence ledger for every API Hub request. Never use this table as a rolling cache.';

insert into public.api_hub_usage_ledger (
  id,
  request_id,
  client_id,
  api_id,
  key_id,
  status,
  credits_deducted,
  masked_pan,
  masked_mobile,
  response_time_ms,
  error_message,
  created_at,
  metadata
)
select
  case
    when coalesce(item->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then (item->>'id')::uuid
    else gen_random_uuid()
  end,
  item->>'request_id',
  item->>'client_id',
  item->>'api_id',
  item->>'key_id',
  case when item->>'status' = 'success' then 'success' else 'failed' end,
  coalesce((item->>'credits_deducted')::numeric, 0),
  nullif(item->>'masked_pan', ''),
  nullif(item->>'masked_mobile', ''),
  nullif(item->>'response_time_ms', '')::integer,
  nullif(item->>'error_message', ''),
  coalesce(nullif(item->>'created_at', '')::timestamptz, now()),
  jsonb_build_object('source', 'legacy_api_hub_store_backfill')
from public.b2c_report_requests source
cross join lateral jsonb_array_elements(coalesce(source.report_json->'usage', source.report_json->'logs', '[]'::jsonb)) item
where source.mobile = '0000000000'
  and source.status = 'api_hub_store'
  and nullif(item->>'request_id', '') is not null
on conflict (request_id) do nothing;
