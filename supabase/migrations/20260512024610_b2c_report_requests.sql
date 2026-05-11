create table if not exists public.b2c_report_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  middle_name text,
  last_name text,
  full_name text,
  mobile text not null,
  email text,
  pan text,
  dob date,
  gender text,
  address text,
  state text,
  pin_code text,
  consent_given boolean not null default false,
  consent_at timestamptz,
  status text not null default 'mobile_started',
  report_type text not null default 'individual_financial_health',
  credit_score integer,
  report_id text,
  report_json jsonb,
  api_request_json jsonb,
  api_response_json jsonb,
  api_status text,
  api_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.b2c_payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.b2c_report_requests(id) on delete set null,
  full_name text,
  mobile text not null,
  pan text,
  gateway text not null default 'cashfree',
  order_id text not null,
  payment_id text,
  amount numeric(12,2) not null default 199,
  currency text not null default 'INR',
  status text not null default 'created',
  raw_response jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2c_report_requests_mobile on public.b2c_report_requests(mobile);
create index if not exists idx_b2c_report_requests_pan on public.b2c_report_requests(pan);
create index if not exists idx_b2c_report_requests_status on public.b2c_report_requests(status);
create index if not exists idx_b2c_report_requests_created_at on public.b2c_report_requests(created_at desc);
create index if not exists idx_b2c_payments_request_id on public.b2c_payments(request_id);
create index if not exists idx_b2c_payments_order_id on public.b2c_payments(order_id);
create index if not exists idx_b2c_payments_status on public.b2c_payments(status);
create index if not exists idx_b2c_payments_created_at on public.b2c_payments(created_at desc);
