create table if not exists public.crm_team_members (
  id text primary key,
  partner_id uuid references public.partners(id) on delete cascade,
  auth_user_id uuid,
  name text not null,
  email text not null,
  mobile text,
  role text not null default 'DSA Agent',
  zone text,
  permissions text[] not null default '{}',
  leads_assigned integer not null default 0,
  leads_converted integer not null default 0,
  joined_date text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  avatar text,
  login_enabled boolean not null default true,
  credentials_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, email)
);

create table if not exists public.crm_leads (
  id text primary key,
  partner_id uuid references public.partners(id) on delete cascade,
  name text not null,
  mobile text not null,
  email text,
  product text not null default 'personal_loan',
  loan_amount numeric(14,2) not null default 0,
  source text not null default 'walk_in',
  stage text not null default 'eligibility_pending',
  assigned_agent text,
  assigned_user_id text references public.crm_team_members(id) on delete set null,
  last_contact text,
  next_follow_up text,
  days_in_stage integer not null default 0,
  city text,
  notes text,
  eligibility_report_id text,
  selected_lender text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_lenders (
  id text primary key,
  partner_id uuid references public.partners(id) on delete cascade,
  name text not null,
  type text not null default 'bank' check (type in ('bank', 'nbfc')),
  products text[] not null default '{}',
  roi_min numeric(6,2) not null default 0,
  roi_max numeric(6,2) not null default 0,
  min_loan numeric(14,2) not null default 0,
  max_loan numeric(14,2) not null default 0,
  processing_fee text,
  approval_rate numeric(6,2) not null default 0,
  active_apps integer not null default 0,
  score_cutoff integer not null default 0,
  min_income numeric(14,2) not null default 0,
  max_tenure integer not null default 0,
  foir_limit numeric(6,2) not null default 0,
  ltv_max numeric(6,2) not null default 0,
  states text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive')),
  contact text,
  rm text,
  avg_tat text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_eligibility_reports (
  id text primary key,
  partner_id uuid references public.partners(id) on delete cascade,
  lead_id text references public.crm_leads(id) on delete set null,
  request_id text,
  borrower_name text not null,
  pan text,
  mobile text,
  loan_type text,
  loan_amount numeric(14,2) not null default 0,
  score integer,
  status text not null default 'completed',
  foir numeric(6,2),
  max_loan_amount numeric(14,2),
  matched_lenders jsonb not null default '[]'::jsonb,
  cibil_payload jsonb not null default '{}'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_applications (
  id text primary key,
  partner_id uuid references public.partners(id) on delete cascade,
  lead_id text references public.crm_leads(id) on delete cascade,
  customer_name text not null,
  mobile text,
  lender_name text not null,
  product text not null default 'personal_loan',
  loan_amount numeric(14,2) not null default 0,
  status text not null default 'case_sent_to_lender',
  status_history jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  lender_history jsonb not null default '[]'::jsonb,
  follow_up_date text,
  rejection_reason text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_application_documents (
  id text primary key,
  partner_id uuid references public.partners(id) on delete cascade,
  application_id text not null references public.crm_applications(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  status text not null default 'missing' check (status in ('missing', 'uploaded', 'verified', 'rejected')),
  file_name text,
  file_url text,
  storage_path text,
  uploaded_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_reminders (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  lead_id text references public.crm_leads(id) on delete cascade,
  application_id text references public.crm_applications(id) on delete cascade,
  assigned_to text references public.crm_team_members(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'dismissed')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_audit_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  actor_user_id uuid,
  actor_email text,
  module text not null,
  action text not null,
  entity_type text,
  entity_id text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_team_partner on public.crm_team_members(partner_id);
create index if not exists idx_crm_leads_partner_stage on public.crm_leads(partner_id, stage);
create index if not exists idx_crm_leads_partner_agent on public.crm_leads(partner_id, assigned_agent);
create index if not exists idx_crm_lenders_partner_status on public.crm_lenders(partner_id, status);
create index if not exists idx_crm_reports_partner_created on public.crm_eligibility_reports(partner_id, created_at desc);
create index if not exists idx_crm_apps_partner_status on public.crm_applications(partner_id, status);
create index if not exists idx_crm_docs_application on public.crm_application_documents(application_id);
create index if not exists idx_crm_reminders_partner_due on public.crm_reminders(partner_id, due_at);
create index if not exists idx_crm_audit_partner_created on public.crm_audit_logs(partner_id, created_at desc);
