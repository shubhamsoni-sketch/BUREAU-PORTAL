create table if not exists public.promotion_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  email text,
  city text,
  business_name text,
  source text not null default 'manual',
  status text not null default 'active',
  opt_in boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mobile)
);

create table if not exists public.promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_name text not null,
  language_code text not null default 'en',
  body_values jsonb not null default '[]'::jsonb,
  audience_status text not null default 'active',
  status text not null default 'draft',
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promotion_campaigns(id) on delete cascade,
  lead_id uuid not null references public.promotion_leads(id) on delete cascade,
  status text not null default 'pending',
  message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, lead_id)
);

create index if not exists idx_promotion_leads_status_created
  on public.promotion_leads(status, created_at desc);

create index if not exists idx_promotion_campaigns_created
  on public.promotion_campaigns(created_at desc);

create index if not exists idx_promotion_recipients_campaign_status
  on public.promotion_campaign_recipients(campaign_id, status);

alter table public.promotion_leads enable row level security;
alter table public.promotion_campaigns enable row level security;
alter table public.promotion_campaign_recipients enable row level security;

drop policy if exists "admin_manage_promotion_leads" on public.promotion_leads;
create policy "admin_manage_promotion_leads"
on public.promotion_leads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_promotion_campaigns" on public.promotion_campaigns;
create policy "admin_manage_promotion_campaigns"
on public.promotion_campaigns
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_promotion_recipients" on public.promotion_campaign_recipients;
create policy "admin_manage_promotion_recipients"
on public.promotion_campaign_recipients
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service_manage_promotion_leads" on public.promotion_leads;
create policy "service_manage_promotion_leads"
on public.promotion_leads
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_promotion_campaigns" on public.promotion_campaigns;
create policy "service_manage_promotion_campaigns"
on public.promotion_campaigns
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_promotion_recipients" on public.promotion_campaign_recipients;
create policy "service_manage_promotion_recipients"
on public.promotion_campaign_recipients
for all
to service_role
using (true)
with check (true);
