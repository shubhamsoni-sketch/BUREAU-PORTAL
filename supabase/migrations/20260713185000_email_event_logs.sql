create table if not exists public.email_event_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  event_type text not null,
  recipient_email text not null,
  template_alias text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_event_logs_partner_event_created
  on public.email_event_logs(partner_id, event_type, created_at desc);

alter table public.email_event_logs enable row level security;

drop policy if exists "admin_manage_email_event_logs" on public.email_event_logs;
create policy "admin_manage_email_event_logs"
on public.email_event_logs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service_insert_email_event_logs" on public.email_event_logs;
