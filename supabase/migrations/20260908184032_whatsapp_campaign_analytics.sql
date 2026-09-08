create table if not exists public.whatsapp_message_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  campaign_type text not null default 'utility',
  template_name text not null,
  language_code text not null default 'en',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_name, template_name, language_code)
);

create table if not exists public.whatsapp_message_sends (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  customer_source text,
  phone_number text not null,
  campaign_id uuid references public.whatsapp_message_campaigns(id) on delete set null,
  source_campaign_id text,
  campaign_name text not null,
  campaign_type text not null default 'utility',
  template_name text not null,
  language_code text not null default 'en',
  whatsapp_message_id text unique,
  report_request_id uuid references public.b2c_report_requests(id) on delete set null,
  report_token text,
  tracking_token text unique,
  redirect_url text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  click_count integer not null default 0,
  current_status text not null default 'queued',
  provider_status integer,
  provider_response jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_message_status_events (
  id uuid primary key default gen_random_uuid(),
  message_send_id uuid references public.whatsapp_message_sends(id) on delete set null,
  whatsapp_message_id text,
  phone_number text,
  status text not null,
  event_at timestamptz not null default now(),
  failure_reason text,
  raw_status jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (whatsapp_message_id, status, event_at)
);

create table if not exists public.whatsapp_incoming_messages (
  id uuid primary key default gen_random_uuid(),
  message_send_id uuid references public.whatsapp_message_sends(id) on delete set null,
  customer_id uuid,
  customer_source text,
  phone_number text not null,
  whatsapp_message_id text unique,
  campaign_id uuid references public.whatsapp_message_campaigns(id) on delete set null,
  campaign_name text,
  template_name text,
  message_type text,
  message_text text,
  button_payload text,
  received_at timestamptz not null default now(),
  raw_message jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_link_clicks (
  id uuid primary key default gen_random_uuid(),
  message_send_id uuid not null references public.whatsapp_message_sends(id) on delete cascade,
  tracking_token text not null,
  customer_id uuid,
  customer_source text,
  phone_number text,
  report_request_id uuid references public.b2c_report_requests(id) on delete set null,
  campaign_id uuid references public.whatsapp_message_campaigns(id) on delete set null,
  clicked_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_whatsapp_campaigns_created
  on public.whatsapp_message_campaigns(created_at desc);

create index if not exists idx_whatsapp_sends_campaign_created
  on public.whatsapp_message_sends(campaign_id, created_at desc);

create index if not exists idx_whatsapp_sends_source_campaign
  on public.whatsapp_message_sends(source_campaign_id, created_at desc);

create index if not exists idx_whatsapp_sends_phone_created
  on public.whatsapp_message_sends(phone_number, created_at desc);

create index if not exists idx_whatsapp_sends_status_created
  on public.whatsapp_message_sends(current_status, created_at desc);

create index if not exists idx_whatsapp_sends_report_request
  on public.whatsapp_message_sends(report_request_id);

create index if not exists idx_whatsapp_status_events_send_created
  on public.whatsapp_message_status_events(message_send_id, event_at desc);

create index if not exists idx_whatsapp_incoming_phone_received
  on public.whatsapp_incoming_messages(phone_number, received_at desc);

create index if not exists idx_whatsapp_clicks_send_clicked
  on public.whatsapp_link_clicks(message_send_id, clicked_at desc);

create index if not exists idx_whatsapp_clicks_token_clicked
  on public.whatsapp_link_clicks(tracking_token, clicked_at desc);

create or replace function public.set_whatsapp_analytics_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_whatsapp_campaigns_updated_at on public.whatsapp_message_campaigns;
create trigger set_whatsapp_campaigns_updated_at
before update on public.whatsapp_message_campaigns
for each row execute function public.set_whatsapp_analytics_updated_at();

drop trigger if exists set_whatsapp_sends_updated_at on public.whatsapp_message_sends;
create trigger set_whatsapp_sends_updated_at
before update on public.whatsapp_message_sends
for each row execute function public.set_whatsapp_analytics_updated_at();

alter table public.whatsapp_message_campaigns enable row level security;
alter table public.whatsapp_message_sends enable row level security;
alter table public.whatsapp_message_status_events enable row level security;
alter table public.whatsapp_incoming_messages enable row level security;
alter table public.whatsapp_link_clicks enable row level security;

drop policy if exists "admin_manage_whatsapp_message_campaigns" on public.whatsapp_message_campaigns;
create policy "admin_manage_whatsapp_message_campaigns"
on public.whatsapp_message_campaigns
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_whatsapp_message_sends" on public.whatsapp_message_sends;
create policy "admin_manage_whatsapp_message_sends"
on public.whatsapp_message_sends
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_whatsapp_message_status_events" on public.whatsapp_message_status_events;
create policy "admin_manage_whatsapp_message_status_events"
on public.whatsapp_message_status_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_whatsapp_incoming_messages" on public.whatsapp_incoming_messages;
create policy "admin_manage_whatsapp_incoming_messages"
on public.whatsapp_incoming_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_whatsapp_link_clicks" on public.whatsapp_link_clicks;
create policy "admin_manage_whatsapp_link_clicks"
on public.whatsapp_link_clicks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service_manage_whatsapp_message_campaigns" on public.whatsapp_message_campaigns;
create policy "service_manage_whatsapp_message_campaigns"
on public.whatsapp_message_campaigns
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_whatsapp_message_sends" on public.whatsapp_message_sends;
create policy "service_manage_whatsapp_message_sends"
on public.whatsapp_message_sends
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_whatsapp_message_status_events" on public.whatsapp_message_status_events;
create policy "service_manage_whatsapp_message_status_events"
on public.whatsapp_message_status_events
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_whatsapp_incoming_messages" on public.whatsapp_incoming_messages;
create policy "service_manage_whatsapp_incoming_messages"
on public.whatsapp_incoming_messages
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_whatsapp_link_clicks" on public.whatsapp_link_clicks;
create policy "service_manage_whatsapp_link_clicks"
on public.whatsapp_link_clicks
for all
to service_role
using (true)
with check (true);
