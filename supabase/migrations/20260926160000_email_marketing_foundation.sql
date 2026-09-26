create table if not exists public.email_marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  mobile text,
  company_name text,
  city text,
  source text not null default 'manual',
  status text not null default 'active',
  opt_in boolean not null default true,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  preview_text text,
  html_body text not null,
  text_body text,
  audience_status text not null default 'active',
  status text not null default 'draft',
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  reply_count integer not null default 0,
  open_count integer not null default 0,
  click_count integer not null default 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references public.user_profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.email_marketing_campaigns(id) on delete set null,
  contact_id uuid references public.email_marketing_contacts(id) on delete set null,
  parent_message_id uuid references public.email_marketing_messages(id) on delete set null,
  direction text not null check (direction in ('outbound', 'inbound', 'admin_reply')),
  sender_email text not null,
  recipient_email text not null,
  subject text not null,
  html_body text,
  text_body text,
  resend_email_id text,
  resend_message_id text,
  inbound_email_id text,
  in_reply_to text,
  references_header text,
  status text not null default 'pending',
  error text,
  read_at timestamptz,
  sent_at timestamptz,
  received_at timestamptz,
  created_by uuid references public.user_profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_marketing_contacts_status_created
  on public.email_marketing_contacts(status, created_at desc);

create index if not exists idx_email_marketing_campaigns_status_created
  on public.email_marketing_campaigns(status, created_at desc);

create index if not exists idx_email_marketing_messages_campaign_created
  on public.email_marketing_messages(campaign_id, created_at desc);

create index if not exists idx_email_marketing_messages_contact_created
  on public.email_marketing_messages(contact_id, created_at desc);

create index if not exists idx_email_marketing_messages_resend_message_id
  on public.email_marketing_messages(resend_message_id)
  where resend_message_id is not null;

create index if not exists idx_email_marketing_messages_inbound_email_id
  on public.email_marketing_messages(inbound_email_id)
  where inbound_email_id is not null;

alter table public.email_marketing_contacts enable row level security;
alter table public.email_marketing_campaigns enable row level security;
alter table public.email_marketing_messages enable row level security;

drop policy if exists "admin_manage_email_marketing_contacts" on public.email_marketing_contacts;
create policy "admin_manage_email_marketing_contacts"
on public.email_marketing_contacts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_email_marketing_campaigns" on public.email_marketing_campaigns;
create policy "admin_manage_email_marketing_campaigns"
on public.email_marketing_campaigns
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_email_marketing_messages" on public.email_marketing_messages;
create policy "admin_manage_email_marketing_messages"
on public.email_marketing_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
