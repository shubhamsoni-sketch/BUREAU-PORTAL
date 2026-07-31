create table if not exists public.whatsapp_event_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete set null,
  event_type text not null,
  recipient_phone text not null,
  template_name text,
  status text not null default 'sent',
  message_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_event_logs_partner_event_created
  on public.whatsapp_event_logs(partner_id, event_type, created_at desc);

create index if not exists idx_whatsapp_event_logs_recipient_created
  on public.whatsapp_event_logs(recipient_phone, created_at desc);

alter table public.whatsapp_event_logs enable row level security;

drop policy if exists "admin_manage_whatsapp_event_logs" on public.whatsapp_event_logs;
create policy "admin_manage_whatsapp_event_logs"
on public.whatsapp_event_logs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service_manage_whatsapp_event_logs" on public.whatsapp_event_logs;
create policy "service_manage_whatsapp_event_logs"
on public.whatsapp_event_logs
for all
to service_role
using (true)
with check (true);
