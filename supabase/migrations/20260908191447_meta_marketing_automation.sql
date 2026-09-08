create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_code text not null unique,
  ad_code text not null unique,
  name text not null,
  objective text not null default 'credit_report_lead',
  status text not null default 'draft',
  platform text not null default 'whatsapp_ads',
  source text not null default 'meta',
  content_text text,
  cta_type text not null default 'WHATSAPP_MESSAGE',
  whatsapp_number text not null default '8109276589',
  prefilled_message text,
  tracking_token text,
  start_at timestamptz,
  end_at timestamptz,
  budget_type text not null default 'daily',
  daily_budget numeric(14,2),
  lifetime_budget numeric(14,2),
  audience_json jsonb not null default '{}'::jsonb,
  automation_rules_json jsonb not null default '[]'::jsonb,
  meta_error text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  asset_type text not null,
  file_url text not null,
  storage_path text,
  mime_type text,
  file_size bigint,
  meta_asset_id text,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id text,
  ad_account_id text not null unique,
  page_id text,
  instagram_user_id text,
  whatsapp_business_account_id text,
  whatsapp_phone_number_id text,
  whatsapp_display_number text not null default '8109276589',
  status text not null default 'active',
  permissions_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_page_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  platform text not null default 'facebook',
  page_id text,
  instagram_user_id text,
  meta_post_id text,
  meta_media_id text,
  post_text text,
  media_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text not null default 'draft',
  permalink_url text,
  error_message text,
  raw_response_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_campaigns (
  id uuid primary key default gen_random_uuid(),
  marketing_campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  ad_account_id text,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  meta_creative_id text,
  status text not null default 'draft',
  objective text,
  budget numeric(14,2),
  start_time timestamptz,
  end_time timestamptz,
  raw_response_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (marketing_campaign_id)
);

create table if not exists public.whatsapp_leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  phone_number text not null,
  wa_id text,
  profile_name text,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  campaign_code text,
  ad_id text,
  meta_ad_id text,
  meta_campaign_id text,
  source text not null default 'whatsapp',
  first_message_text text,
  first_message_at timestamptz,
  last_message_at timestamptz,
  lead_status text not null default 'new',
  otp_status text,
  report_status text,
  referral_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_number, campaign_code)
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.whatsapp_leads(id) on delete set null,
  customer_id uuid,
  phone_number text not null,
  direction text not null,
  whatsapp_message_id text unique,
  template_name text,
  message_type text,
  message_text text,
  status text not null default 'received',
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  raw_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  lead_id uuid references public.whatsapp_leads(id) on delete set null,
  customer_id uuid,
  event_type text not null,
  event_source text not null default 'system',
  event_data_json jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.report_tracking_links (
  id uuid primary key default gen_random_uuid(),
  tracking_token text not null unique,
  customer_id uuid,
  lead_id uuid references public.whatsapp_leads(id) on delete set null,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  report_id text,
  report_request_id uuid references public.b2c_report_requests(id) on delete set null,
  destination_url text not null,
  open_count integer not null default 0,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.report_tracking_events (
  id uuid primary key default gen_random_uuid(),
  tracking_link_id uuid not null references public.report_tracking_links(id) on delete cascade,
  customer_id uuid,
  lead_id uuid references public.whatsapp_leads(id) on delete set null,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  event_type text not null default 'click',
  ip_address text,
  user_agent text,
  referer text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.meta_insights_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  date_start date,
  date_stop date,
  spend numeric(14,2) not null default 0,
  impressions integer not null default 0,
  reach integer not null default 0,
  clicks integer not null default 0,
  ctr numeric(14,4) not null default 0,
  cpc numeric(14,4) not null default 0,
  cpm numeric(14,4) not null default 0,
  frequency numeric(14,4) not null default 0,
  cost_per_result numeric(14,4) not null default 0,
  raw_insights_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.post_engagement_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  meta_post_id text not null,
  engagement_type text not null,
  meta_user_id text,
  user_name text,
  comment_id text,
  comment_text text,
  raw_payload_json jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (meta_post_id, engagement_type, comment_id)
);

create table if not exists public.automation_rule_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete cascade,
  rule_type text not null,
  action_taken text,
  dry_run boolean not null default true,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_campaigns_status_created
  on public.marketing_campaigns(status, created_at desc);

create index if not exists idx_marketing_campaigns_code
  on public.marketing_campaigns(campaign_code);

create index if not exists idx_marketing_assets_campaign
  on public.marketing_assets(campaign_id, created_at desc);

create index if not exists idx_meta_page_posts_campaign
  on public.meta_page_posts(campaign_id, created_at desc);

create index if not exists idx_meta_campaigns_marketing_campaign
  on public.meta_campaigns(marketing_campaign_id);

create index if not exists idx_whatsapp_leads_campaign_created
  on public.whatsapp_leads(campaign_id, created_at desc);

create index if not exists idx_whatsapp_leads_phone_created
  on public.whatsapp_leads(phone_number, created_at desc);

create index if not exists idx_whatsapp_messages_lead_created
  on public.whatsapp_messages(lead_id, created_at desc);

create index if not exists idx_whatsapp_messages_phone_created
  on public.whatsapp_messages(phone_number, created_at desc);

create index if not exists idx_campaign_events_campaign_occurred
  on public.campaign_events(campaign_id, occurred_at desc);

create index if not exists idx_report_tracking_links_campaign
  on public.report_tracking_links(campaign_id, created_at desc);

create index if not exists idx_report_tracking_events_link
  on public.report_tracking_events(tracking_link_id, occurred_at desc);

create index if not exists idx_meta_insights_campaign_created
  on public.meta_insights_snapshots(campaign_id, created_at desc);

create index if not exists idx_post_engagement_post_created
  on public.post_engagement_events(meta_post_id, created_at desc);

create or replace function public.set_marketing_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_marketing_campaigns_updated_at on public.marketing_campaigns;
create trigger set_marketing_campaigns_updated_at
before update on public.marketing_campaigns
for each row execute function public.set_marketing_updated_at();

drop trigger if exists set_meta_ad_accounts_updated_at on public.meta_ad_accounts;
create trigger set_meta_ad_accounts_updated_at
before update on public.meta_ad_accounts
for each row execute function public.set_marketing_updated_at();

drop trigger if exists set_meta_page_posts_updated_at on public.meta_page_posts;
create trigger set_meta_page_posts_updated_at
before update on public.meta_page_posts
for each row execute function public.set_marketing_updated_at();

drop trigger if exists set_meta_campaigns_updated_at on public.meta_campaigns;
create trigger set_meta_campaigns_updated_at
before update on public.meta_campaigns
for each row execute function public.set_marketing_updated_at();

drop trigger if exists set_whatsapp_leads_updated_at on public.whatsapp_leads;
create trigger set_whatsapp_leads_updated_at
before update on public.whatsapp_leads
for each row execute function public.set_marketing_updated_at();

alter table public.marketing_campaigns enable row level security;
alter table public.marketing_assets enable row level security;
alter table public.meta_ad_accounts enable row level security;
alter table public.meta_page_posts enable row level security;
alter table public.meta_campaigns enable row level security;
alter table public.whatsapp_leads enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.campaign_events enable row level security;
alter table public.report_tracking_links enable row level security;
alter table public.report_tracking_events enable row level security;
alter table public.meta_insights_snapshots enable row level security;
alter table public.post_engagement_events enable row level security;
alter table public.automation_rule_runs enable row level security;

drop policy if exists "admin_manage_marketing_campaigns" on public.marketing_campaigns;
create policy "admin_manage_marketing_campaigns" on public.marketing_campaigns
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_marketing_assets" on public.marketing_assets;
create policy "admin_manage_marketing_assets" on public.marketing_assets
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_meta_ad_accounts" on public.meta_ad_accounts;
create policy "admin_manage_meta_ad_accounts" on public.meta_ad_accounts
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_meta_page_posts" on public.meta_page_posts;
create policy "admin_manage_meta_page_posts" on public.meta_page_posts
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_meta_campaigns" on public.meta_campaigns;
create policy "admin_manage_meta_campaigns" on public.meta_campaigns
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_whatsapp_leads" on public.whatsapp_leads;
create policy "admin_manage_whatsapp_leads" on public.whatsapp_leads
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_whatsapp_messages" on public.whatsapp_messages;
create policy "admin_manage_whatsapp_messages" on public.whatsapp_messages
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_campaign_events" on public.campaign_events;
create policy "admin_manage_campaign_events" on public.campaign_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_report_tracking_links" on public.report_tracking_links;
create policy "admin_manage_report_tracking_links" on public.report_tracking_links
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_report_tracking_events" on public.report_tracking_events;
create policy "admin_manage_report_tracking_events" on public.report_tracking_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_meta_insights_snapshots" on public.meta_insights_snapshots;
create policy "admin_manage_meta_insights_snapshots" on public.meta_insights_snapshots
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_post_engagement_events" on public.post_engagement_events;
create policy "admin_manage_post_engagement_events" on public.post_engagement_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_manage_automation_rule_runs" on public.automation_rule_runs;
create policy "admin_manage_automation_rule_runs" on public.automation_rule_runs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "service_manage_marketing_campaigns" on public.marketing_campaigns;
create policy "service_manage_marketing_campaigns" on public.marketing_campaigns
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_marketing_assets" on public.marketing_assets;
create policy "service_manage_marketing_assets" on public.marketing_assets
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_meta_ad_accounts" on public.meta_ad_accounts;
create policy "service_manage_meta_ad_accounts" on public.meta_ad_accounts
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_meta_page_posts" on public.meta_page_posts;
create policy "service_manage_meta_page_posts" on public.meta_page_posts
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_meta_campaigns" on public.meta_campaigns;
create policy "service_manage_meta_campaigns" on public.meta_campaigns
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_whatsapp_leads" on public.whatsapp_leads;
create policy "service_manage_whatsapp_leads" on public.whatsapp_leads
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_whatsapp_messages" on public.whatsapp_messages;
create policy "service_manage_whatsapp_messages" on public.whatsapp_messages
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_campaign_events" on public.campaign_events;
create policy "service_manage_campaign_events" on public.campaign_events
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_report_tracking_links" on public.report_tracking_links;
create policy "service_manage_report_tracking_links" on public.report_tracking_links
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_report_tracking_events" on public.report_tracking_events;
create policy "service_manage_report_tracking_events" on public.report_tracking_events
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_meta_insights_snapshots" on public.meta_insights_snapshots;
create policy "service_manage_meta_insights_snapshots" on public.meta_insights_snapshots
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_post_engagement_events" on public.post_engagement_events;
create policy "service_manage_post_engagement_events" on public.post_engagement_events
for all to service_role using (true) with check (true);

drop policy if exists "service_manage_automation_rule_runs" on public.automation_rule_runs;
create policy "service_manage_automation_rule_runs" on public.automation_rule_runs
for all to service_role using (true) with check (true);
