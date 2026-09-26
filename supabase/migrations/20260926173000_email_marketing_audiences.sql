create table if not exists public.email_marketing_audiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  source text not null default 'manual',
  status text not null default 'active',
  created_by uuid references public.user_profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_audience_contacts (
  audience_id uuid not null references public.email_marketing_audiences(id) on delete cascade,
  contact_id uuid not null references public.email_marketing_contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (audience_id, contact_id)
);

alter table public.email_marketing_campaigns
  add column if not exists last_audience_id uuid references public.email_marketing_audiences(id) on delete set null;

alter table public.email_marketing_messages
  add column if not exists audience_id uuid references public.email_marketing_audiences(id) on delete set null;

create index if not exists idx_email_marketing_audiences_created
  on public.email_marketing_audiences(created_at desc);

create index if not exists idx_email_marketing_audience_contacts_contact
  on public.email_marketing_audience_contacts(contact_id);

create index if not exists idx_email_marketing_messages_audience_created
  on public.email_marketing_messages(audience_id, created_at desc);

alter table public.email_marketing_audiences enable row level security;
alter table public.email_marketing_audience_contacts enable row level security;

drop policy if exists "admin_manage_email_marketing_audiences" on public.email_marketing_audiences;
create policy "admin_manage_email_marketing_audiences"
on public.email_marketing_audiences
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_email_marketing_audience_contacts" on public.email_marketing_audience_contacts;
create policy "admin_manage_email_marketing_audience_contacts"
on public.email_marketing_audience_contacts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
