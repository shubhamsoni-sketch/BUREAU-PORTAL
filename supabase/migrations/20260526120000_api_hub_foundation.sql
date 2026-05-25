create table if not exists public.api_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  contact_name text,
  email text,
  mobile text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_active boolean not null default true,
  default_price numeric(12,2) not null default 0,
  default_sandbox_credits integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_wallets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.api_clients(id) on delete cascade,
  live_balance numeric(12,2) not null default 0,
  sandbox_credits integer not null default 10,
  low_balance_threshold numeric(12,2) not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id)
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.api_clients(id) on delete cascade,
  product_id uuid not null references public.api_products(id) on delete restrict,
  label text not null,
  key_prefix text not null,
  key_hash text not null unique,
  environment text not null check (environment in ('sandbox', 'live')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  rate_limit_per_minute integer not null default 60,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.api_clients(id) on delete cascade,
  type text not null check (type in ('credit', 'debit', 'refund', 'adjustment')),
  environment text not null check (environment in ('sandbox', 'live')),
  amount numeric(12,2) not null default 0,
  sandbox_credits integer not null default 0,
  description text,
  request_id text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.api_clients(id) on delete set null,
  api_key_id uuid references public.api_keys(id) on delete set null,
  product_id uuid references public.api_products(id) on delete set null,
  environment text not null check (environment in ('sandbox', 'live')),
  request_id text not null unique,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  charged boolean not null default false,
  amount_charged numeric(12,2) not null default 0,
  sandbox_credits_charged integer not null default 0,
  masked_pan text,
  masked_mobile text,
  response_time_ms integer,
  error_message text,
  provider_ref text,
  raw_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_gateway_settings (
  id uuid primary key default gen_random_uuid(),
  gateway_base_url text,
  status text not null default 'unknown',
  last_health_check_at timestamptz,
  last_health_message text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_api_clients_status on public.api_clients(status);
create index if not exists idx_api_keys_client_id on public.api_keys(client_id);
create index if not exists idx_api_keys_prefix on public.api_keys(key_prefix);
create index if not exists idx_api_usage_logs_client_id on public.api_usage_logs(client_id);
create index if not exists idx_api_usage_logs_created_at on public.api_usage_logs(created_at desc);
create index if not exists idx_api_wallet_transactions_client_id on public.api_wallet_transactions(client_id);

insert into public.api_products (code, name, description, status, is_active, default_price, default_sandbox_credits)
values ('cibil.consumer_score', 'Bureau API', 'Credit bureau report and score API through the whitelisted gateway.', 'active', true, 25, 10)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  is_active = excluded.is_active,
  default_price = excluded.default_price,
  default_sandbox_credits = excluded.default_sandbox_credits,
  updated_at = now();
