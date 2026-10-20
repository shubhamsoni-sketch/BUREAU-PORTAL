-- Binta production accounting is isolated from the legacy API Hub JSON store.
-- All wallet, request, ledger and response-archive transitions are transactional.
create table if not exists public.api_hub_live_wallets (
  client_id text primary key,
  credits integer not null default 0 check (credits >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_hub_live_requests (
  request_id text primary key,
  client_id text not null references public.api_hub_live_wallets(client_id),
  idempotency_key text,
  body_sha256 text not null,
  cost integer not null check (cost > 0),
  status text not null check (status in ('reserved', 'success', 'failed')),
  response_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, idempotency_key)
);

create index if not exists api_hub_live_requests_pending_idx
  on public.api_hub_live_requests (created_at) where status = 'reserved';

create table if not exists public.api_hub_live_archives (
  request_id text primary key references public.api_hub_live_requests(request_id),
  client_id text not null,
  request_json jsonb not null,
  response_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists api_hub_live_archives_client_created_idx
  on public.api_hub_live_archives (client_id, created_at desc);

alter table public.api_hub_live_wallets enable row level security;
alter table public.api_hub_live_requests enable row level security;
alter table public.api_hub_live_archives enable row level security;
revoke all on public.api_hub_live_wallets, public.api_hub_live_requests,
  public.api_hub_live_archives from anon, authenticated;
grant select, insert, update on public.api_hub_live_wallets,
  public.api_hub_live_requests to service_role;
grant select, insert on public.api_hub_live_archives to service_role;

-- Carry forward any previously allocated live balance once; later allocations
-- must use api_hub_live_add_credits, never JSON metadata read-modify-write.
insert into public.api_hub_live_wallets (client_id, credits)
select client->>'id', greatest(0, floor(coalesce(nullif(client->'metadata'->>'live_credits', '')::numeric, 0)))::integer
from public.b2c_report_requests store
cross join lateral jsonb_array_elements(coalesce(store.report_json->'clients', '[]'::jsonb)) client
where store.mobile = '0000000000' and store.status = 'api_hub_store'
  and client ? 'id'
on conflict (client_id) do nothing;

create or replace function public.api_hub_live_add_credits(p_client_id text, p_amount integer)
returns integer language plpgsql security definer set search_path = public as $$
declare v_balance integer;
begin
  if nullif(trim(p_client_id), '') is null or p_amount is null or p_amount <= 0 then
    raise exception 'Invalid client or credit amount';
  end if;
  insert into public.api_hub_live_wallets (client_id, credits)
  values (p_client_id, p_amount)
  on conflict (client_id) do update
    set credits = public.api_hub_live_wallets.credits + excluded.credits,
        updated_at = now()
  returning credits into v_balance;
  return v_balance;
end $$;

create or replace function public.api_hub_live_reserve(
  p_client_id text, p_request_id text, p_idempotency_key text,
  p_body_sha256 text, p_cost integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_existing public.api_hub_live_requests%rowtype;
declare v_balance integer;
begin
  if nullif(trim(p_client_id), '') is null or nullif(trim(p_request_id), '') is null
    or p_body_sha256 is null or p_body_sha256 !~ '^[a-f0-9]{64}$'
    or p_cost is null or p_cost <= 0
    or length(coalesce(p_idempotency_key, '')) > 128 then
    raise exception 'Invalid live reservation';
  end if;
  if nullif(p_idempotency_key, '') is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_client_id || ':' || p_idempotency_key, 0));
    select * into v_existing from public.api_hub_live_requests
      where client_id = p_client_id and idempotency_key = p_idempotency_key;
    if found then
      if v_existing.body_sha256 <> p_body_sha256 then
        raise exception 'Idempotency key belongs to another request body';
      end if;
      return jsonb_build_object('status', v_existing.status,
        'request_id', v_existing.request_id, 'response', v_existing.response_json);
    end if;
  end if;
  update public.api_hub_live_wallets set credits = credits - p_cost, updated_at = now()
    where client_id = p_client_id and credits >= p_cost
    returning credits into v_balance;
  if not found then raise exception 'Insufficient or unallocated live credits'; end if;
  insert into public.api_hub_live_requests
    (request_id, client_id, idempotency_key, body_sha256, cost, status)
  values (p_request_id, p_client_id, nullif(p_idempotency_key, ''), p_body_sha256, p_cost, 'reserved');
  return jsonb_build_object('status', 'reserved', 'request_id', p_request_id, 'balance', v_balance);
end $$;

create or replace function public.api_hub_live_complete(
  p_request_id text, p_request_json jsonb, p_response_json jsonb,
  p_api_id text, p_key_id text, p_masked_pan text, p_masked_mobile text,
  p_response_time_ms integer, p_ip_address text
) returns integer language plpgsql security definer set search_path = public as $$
declare v_request public.api_hub_live_requests%rowtype;
declare v_balance integer;
begin
  select * into v_request from public.api_hub_live_requests
    where request_id = p_request_id for update;
  if not found or v_request.status <> 'reserved' or p_response_json is null then
    raise exception 'Live request cannot be completed';
  end if;
  insert into public.api_hub_live_archives (request_id, client_id, request_json, response_json)
    values (p_request_id, v_request.client_id, p_request_json, p_response_json);
  select credits into v_balance from public.api_hub_live_wallets
    where client_id = v_request.client_id;
  insert into public.api_hub_usage_ledger
    (request_id, client_id, api_id, key_id, api_code, environment, status,
     http_status, provider_status, credits_deducted, balance_after, masked_pan,
     masked_mobile, ip_address, response_time_ms, request_json, response_json)
  values (p_request_id, v_request.client_id, p_api_id, p_key_id, 'bureau-binta',
    'production', 'success', 200, 200, v_request.cost, v_balance, p_masked_pan,
    p_masked_mobile, p_ip_address, p_response_time_ms, p_request_json, p_response_json);
  update public.api_hub_live_requests
    set status = 'success', response_json = p_response_json, updated_at = now()
    where request_id = p_request_id;
  return v_balance;
end $$;

create or replace function public.api_hub_live_fail(
  p_request_id text, p_api_id text, p_key_id text, p_error text,
  p_http_status integer, p_provider_status integer
) returns integer language plpgsql security definer set search_path = public as $$
declare v_request public.api_hub_live_requests%rowtype;
declare v_balance integer;
begin
  select * into v_request from public.api_hub_live_requests
    where request_id = p_request_id for update;
  if not found or v_request.status <> 'reserved' then
    raise exception 'Live request cannot be failed';
  end if;
  update public.api_hub_live_wallets
    set credits = credits + v_request.cost, updated_at = now()
    where client_id = v_request.client_id returning credits into v_balance;
  insert into public.api_hub_usage_ledger
    (request_id, client_id, api_id, key_id, api_code, environment,
     status, http_status, provider_status, credits_deducted, balance_after, error_message)
  values (p_request_id, v_request.client_id, p_api_id, p_key_id, 'bureau-binta',
    'production', 'failed', p_http_status, p_provider_status, 0, v_balance, p_error);
  update public.api_hub_live_requests set status = 'failed', updated_at = now()
    where request_id = p_request_id;
  return v_balance;
end $$;

revoke all on function public.api_hub_live_add_credits(text, integer),
  public.api_hub_live_reserve(text, text, text, text, integer),
  public.api_hub_live_complete(text, jsonb, jsonb, text, text, text, text, integer, text),
  public.api_hub_live_fail(text, text, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.api_hub_live_add_credits(text, integer),
  public.api_hub_live_reserve(text, text, text, text, integer),
  public.api_hub_live_complete(text, jsonb, jsonb, text, text, text, text, integer, text),
  public.api_hub_live_fail(text, text, text, text, integer, integer)
  to service_role;
