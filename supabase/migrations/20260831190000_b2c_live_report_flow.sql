alter table public.b2c_report_requests
  add column if not exists consent_version text,
  add column if not exists consent_ip text,
  add column if not exists consent_user_agent text,
  add column if not exists otp_verified_at timestamptz,
  add column if not exists payment_verified_at timestamptz,
  add column if not exists prefill_json jsonb,
  add column if not exists prefill_payload jsonb,
  add column if not exists prefill_confirmed_at timestamptz,
  add column if not exists generation_started_at timestamptz,
  add column if not exists download_count integer not null default 0;

create table if not exists public.b2c_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.b2c_report_requests(id) on delete cascade,
  mobile text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  sent_at timestamptz,
  verified_at timestamptz,
  provider_message_id text,
  status text not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_b2c_otp_request on public.b2c_otp_challenges(request_id, created_at desc);
create index if not exists idx_b2c_otp_mobile_created on public.b2c_otp_challenges(mobile, created_at desc);
create unique index if not exists idx_b2c_payments_order_unique on public.b2c_payments(order_id);

alter table public.b2c_report_requests enable row level security;
alter table public.b2c_payments enable row level security;
alter table public.b2c_otp_challenges enable row level security;
