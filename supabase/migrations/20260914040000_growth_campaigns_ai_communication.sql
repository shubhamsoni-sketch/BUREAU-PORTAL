create table if not exists public.growth_campaign_settings (
  id text primary key default 'default',
  ai_auto_reply_enabled boolean not null default true,
  whatsapp_enabled boolean not null default true,
  email_enabled boolean not null default false,
  reply_tone text not null default 'clear_professional',
  product_context text not null default 'DSA Portal and CIBIL Pull',
  knowledge_base text not null default '',
  max_auto_replies_per_thread integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communication_conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('whatsapp', 'email')),
  contact_key text not null,
  contact_name text,
  phone_number text,
  email text,
  lead_id uuid,
  campaign_id text,
  status text not null default 'open' check (
    status in ('open', 'qualified', 'callback_required', 'converted', 'not_interested', 'do_not_contact', 'closed')
  ),
  intent text not null default 'new',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  ai_enabled boolean not null default true,
  auto_reply_count integer not null default 0,
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, contact_key)
);

create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.communication_conversations(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email')),
  direction text not null check (direction in ('inbound', 'outbound')),
  message_text text,
  provider_message_id text,
  status text not null default 'received',
  ai_generated boolean not null default false,
  intent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists communication_conversations_status_idx
  on public.communication_conversations (status, priority, updated_at desc);

create index if not exists communication_conversations_last_message_idx
  on public.communication_conversations (last_message_at desc);

create index if not exists communication_messages_conversation_created_idx
  on public.communication_messages (conversation_id, created_at asc);

create or replace function public.set_growth_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_growth_campaign_settings_updated_at on public.growth_campaign_settings;
create trigger set_growth_campaign_settings_updated_at
before update on public.growth_campaign_settings
for each row execute function public.set_growth_campaigns_updated_at();

drop trigger if exists set_communication_conversations_updated_at on public.communication_conversations;
create trigger set_communication_conversations_updated_at
before update on public.communication_conversations
for each row execute function public.set_growth_campaigns_updated_at();

insert into public.growth_campaign_settings (
  id,
  ai_auto_reply_enabled,
  whatsapp_enabled,
  email_enabled,
  product_context,
  knowledge_base
)
values (
  'default',
  true,
  true,
  false,
  'DSA Portal and CIBIL Pull',
  'CreditTrust/RUPIQA product context:
- This product is a DSA portal for partners who want to pull customer bureau/CIBIL reports.
- The portal supports partner onboarding, login, wallet/recharge, bureau pull, report history, customer master, APIs and admin controls.
- Primary campaign goal: qualify DSA partners, loan agents, finance consultants and channel partners who can use the portal for customer credit report pulls.
- Ask for business name, city, monthly bureau pull volume, products handled and callback preference.
- Never promise loan approval, guaranteed bureau improvement or guaranteed credit score changes.
- Keep replies short, professional and conversion-focused.
- If user asks pricing, say commercials depend on volume and onboarding; ask expected monthly usage.
- If user asks documents, ask for business name, GST/PAN if applicable, contact person, mobile and city.
- If user says not interested or stop, acknowledge and mark do-not-contact.
- If user is interested, collect required details and mark callback required.'
)
on conflict (id) do update
set
  product_context = excluded.product_context,
  knowledge_base = excluded.knowledge_base,
  updated_at = now();

alter table public.growth_campaign_settings enable row level security;
alter table public.communication_conversations enable row level security;
alter table public.communication_messages enable row level security;

drop policy if exists "admin_manage_growth_campaign_settings" on public.growth_campaign_settings;
create policy "admin_manage_growth_campaign_settings"
on public.growth_campaign_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_communication_conversations" on public.communication_conversations;
create policy "admin_manage_communication_conversations"
on public.communication_conversations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_manage_communication_messages" on public.communication_messages;
create policy "admin_manage_communication_messages"
on public.communication_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service_manage_growth_campaign_settings" on public.growth_campaign_settings;
create policy "service_manage_growth_campaign_settings"
on public.growth_campaign_settings
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_communication_conversations" on public.communication_conversations;
create policy "service_manage_communication_conversations"
on public.communication_conversations
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_manage_communication_messages" on public.communication_messages;
create policy "service_manage_communication_messages"
on public.communication_messages
for all
to service_role
using (true)
with check (true);
