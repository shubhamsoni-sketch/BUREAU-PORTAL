-- Lender Intelligence foundation.
-- Additive only: the existing crm_lenders and crm_applications tables remain
-- available while product/program-based routing is rolled out behind the API.

-- This migration owns a collision-safe CRM custody surface. Some deployments
-- already use crm_applications for an unrelated UUID-based operating system,
-- while lender routing uses stable text application IDs. Never rename or
-- mutate that pre-existing table.
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

create table if not exists public.crm_lender_applications (
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
  application_id text not null references public.crm_lender_applications(id) on delete cascade,
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
  application_id text references public.crm_lender_applications(id) on delete cascade,
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

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default current_timestamp
);

create index if not exists idx_crm_team_partner on public.crm_team_members(partner_id);
create index if not exists idx_crm_leads_partner_stage on public.crm_leads(partner_id, stage);
create index if not exists idx_crm_leads_partner_agent on public.crm_leads(partner_id, assigned_agent);
create index if not exists idx_crm_lenders_partner_status on public.crm_lenders(partner_id, status);
create index if not exists idx_crm_reports_partner_created on public.crm_eligibility_reports(partner_id, created_at desc);
create index if not exists idx_crm_lender_apps_partner_status on public.crm_lender_applications(partner_id, status);
create index if not exists idx_crm_docs_application on public.crm_application_documents(application_id);
create index if not exists idx_crm_reminders_partner_due on public.crm_reminders(partner_id, due_at);
create index if not exists idx_crm_audit_partner_created on public.crm_audit_logs(partner_id, created_at desc);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(user_id, is_read);

alter table public.crm_team_members enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_lenders enable row level security;
alter table public.crm_eligibility_reports enable row level security;
alter table public.crm_lender_applications enable row level security;
alter table public.crm_application_documents enable row level security;
alter table public.crm_reminders enable row level security;
alter table public.crm_audit_logs enable row level security;
alter table public.notifications enable row level security;

alter table if exists public.notifications add column if not exists deduplication_key text;
create unique index if not exists idx_notifications_user_deduplication
  on public.notifications(user_id, deduplication_key) where deduplication_key is not null;

create or replace function public.require_lender_intelligence_actor(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'A valid authenticated lender intelligence actor is required';
  end if;
end;
$$;

revoke all on function public.require_lender_intelligence_actor(uuid) from public;
grant execute on function public.require_lender_intelligence_actor(uuid) to service_role;

create table if not exists public.lender_master (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  legal_name text not null,
  display_name text not null,
  lender_code text not null,
  lender_type text not null check (lender_type in ('bank', 'nbfc', 'hfc', 'fintech', 'other')),
  website text,
  support_email text,
  support_mobile text,
  finance_email text,
  billing_address text,
  gstin text,
  onboarding_status text not null default 'draft'
    check (onboarding_status in ('draft', 'due_diligence', 'agreement_pending', 'active', 'paused', 'offboarded')),
  kyc_status text not null default 'pending'
    check (kyc_status in ('pending', 'in_review', 'verified', 'rejected', 'expired')),
  agreement_status text not null default 'pending'
    check (agreement_status in ('pending', 'in_review', 'signed', 'expired', 'terminated')),
  agreement_expires_at timestamptz,
  owner_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (partner_id, lender_code)
);

create table if not exists public.lender_programs (
  id uuid primary key default gen_random_uuid(),
  lender_id uuid not null references public.lender_master(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete cascade,
  program_code text not null,
  program_name text not null,
  product text not null,
  borrower_segment text not null default 'all',
  employment_types text[] not null default '{}',
  channels text[] not null default '{}',
  states text[] not null default '{}',
  cities text[] not null default '{}',
  min_loan numeric(14,2),
  max_loan numeric(14,2),
  min_tenure_months integer,
  max_tenure_months integer,
  indicative_roi_min numeric(7,3),
  indicative_roi_max numeric(7,3),
  processing_fee_text text,
  capacity_status text not null default 'open'
    check (capacity_status in ('open', 'limited', 'paused')),
  daily_submission_limit integer check (daily_submission_limit between 1 and 1000000),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'retired')),
  priority integer not null default 100,
  login_sla_hours integer not null default 24 check (login_sla_hours > 0),
  sanction_sla_hours integer not null default 120 check (sanction_sla_hours > 0),
  disbursal_sla_hours integer not null default 72 check (disbursal_sla_hours > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (partner_id, program_code),
  check (min_loan is null or max_loan is null or min_loan <= max_loan),
  check (min_tenure_months is null or max_tenure_months is null or min_tenure_months <= max_tenure_months),
  check (indicative_roi_min is null or indicative_roi_max is null or indicative_roi_min <= indicative_roi_max)
);

create or replace function public.enforce_lender_operating_readiness()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.onboarding_status = 'active' and (
    new.kyc_status <> 'verified' or new.agreement_status <> 'signed' or
    (new.agreement_expires_at is not null and new.agreement_expires_at <= now()) or
    length(btrim(coalesce(new.billing_address, ''))) < 10 or
    new.gstin is null or new.gstin !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' or
    new.finance_email is null
  ) then raise exception 'Active lender requires verified KYC, current agreement, and complete billing identity'; end if;
  return new;
end;
$$;

drop trigger if exists trg_lender_operating_readiness on public.lender_master;
create trigger trg_lender_operating_readiness
before insert or update of onboarding_status, kyc_status, agreement_status, agreement_expires_at
on public.lender_master for each row execute function public.enforce_lender_operating_readiness();

create or replace function public.bulk_import_lender_programs(p_rows jsonb, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  lender_record public.lender_master;
  existing_program public.lender_programs;
  created_count integer := 0;
  updated_count integer := 0;
  lender_count integer := 0;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'A non-empty import array is required';
  end if;
  if jsonb_array_length(p_rows) > 500 then raise exception 'Maximum 500 rows per import'; end if;

  for item in select value from jsonb_array_elements(p_rows)
  loop
    if nullif(trim(item->>'lenderCode'), '') is null or nullif(trim(item->>'programCode'), '') is null then
      raise exception 'Every row requires lenderCode and programCode';
    end if;

    insert into public.lender_master (
      partner_id, legal_name, display_name, lender_code, lender_type,
      onboarding_status, kyc_status, agreement_status, created_by, updated_by
    ) values (
      null, coalesce(nullif(trim(item->>'legalName'), ''), trim(item->>'displayName')),
      trim(item->>'displayName'), upper(trim(item->>'lenderCode')), lower(trim(item->>'lenderType')),
      'draft', 'pending', 'pending', p_user_id, p_user_id
    )
    on conflict (partner_id, lender_code) do update set
      legal_name = case when lender_master.onboarding_status = 'active' then lender_master.legal_name else excluded.legal_name end,
      display_name = case when lender_master.onboarding_status = 'active' then lender_master.display_name else excluded.display_name end,
      lender_type = case when lender_master.onboarding_status = 'active' then lender_master.lender_type else excluded.lender_type end,
      updated_by = p_user_id
    returning * into lender_record;
    lender_count := lender_count + 1;

    select * into existing_program from public.lender_programs
    where partner_id is null and program_code = upper(trim(item->>'programCode'))
    for update;
    if existing_program.id is not null and existing_program.status = 'active' then
      raise exception 'Active program % cannot be overwritten', existing_program.program_code;
    end if;

    if existing_program.id is null then
      insert into public.lender_programs (
        lender_id, partner_id, program_code, program_name, product, min_loan, max_loan,
        indicative_roi_min, indicative_roi_max, login_sla_hours, sanction_sla_hours,
        disbursal_sla_hours, status, capacity_status, created_by, updated_by
      ) values (
        lender_record.id, null, upper(trim(item->>'programCode')), trim(item->>'programName'), lower(trim(item->>'product')),
        nullif(item->>'minLoan', '')::numeric, nullif(item->>'maxLoan', '')::numeric,
        nullif(item->>'indicativeRoiMin', '')::numeric, nullif(item->>'indicativeRoiMax', '')::numeric,
        (item->>'loginSlaHours')::integer, (item->>'sanctionSlaHours')::integer,
        (item->>'disbursalSlaHours')::integer, 'draft', 'open', p_user_id, p_user_id
      );
      created_count := created_count + 1;
    else
      update public.lender_programs set
        lender_id = lender_record.id,
        program_name = trim(item->>'programName'), product = lower(trim(item->>'product')),
        min_loan = nullif(item->>'minLoan', '')::numeric, max_loan = nullif(item->>'maxLoan', '')::numeric,
        indicative_roi_min = nullif(item->>'indicativeRoiMin', '')::numeric,
        indicative_roi_max = nullif(item->>'indicativeRoiMax', '')::numeric,
        login_sla_hours = (item->>'loginSlaHours')::integer,
        sanction_sla_hours = (item->>'sanctionSlaHours')::integer,
        disbursal_sla_hours = (item->>'disbursalSlaHours')::integer,
        updated_by = p_user_id
      where id = existing_program.id;
      updated_count := updated_count + 1;
    end if;
    existing_program := null;
  end loop;

  return jsonb_build_object('rows', jsonb_array_length(p_rows), 'lendersProcessed', lender_count,
    'programsCreated', created_count, 'programsUpdated', updated_count);
end;
$$;

revoke all on function public.bulk_import_lender_programs(jsonb, uuid) from public;
grant execute on function public.bulk_import_lender_programs(jsonb, uuid) to service_role;

-- Human-triggered compliance scans carry canonical provenance and their audit
-- evidence commits atomically. The no-argument scanner remains reserved for the
-- CRON_SECRET-protected system route.
create or replace function public.refresh_lender_data_quality_issues_as_actor(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  refreshed integer;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  refreshed := public.refresh_lender_data_quality_issues();
  perform public.register_lender_intelligence_audit(
    null, p_user_id, 'compliance', 'refresh_data_quality', 'data_quality_scan',
    null, 'Lender readiness and compliance scan completed',
    jsonb_build_object('refreshedIssues', refreshed, 'executionMode', 'manual')
  );
  return refreshed;
end;
$$;

revoke all on function public.refresh_lender_data_quality_issues_as_actor(uuid) from public;
grant execute on function public.refresh_lender_data_quality_issues_as_actor(uuid) to service_role;

create table if not exists public.lender_policy_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.lender_programs(id) on delete cascade,
  version integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'published', 'rejected', 'retired')),
  effective_from timestamptz,
  effective_to timestamptz,
  review_due_at timestamptz,
  source_type text not null default 'manual'
    check (source_type in ('manual', 'lender_document', 'lender_api', 'email', 'other')),
  source_reference text,
  source_checksum text,
  change_summary text,
  submitted_by uuid,
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, version),
  check (effective_to is null or effective_from is null or effective_to > effective_from),
  check (status <> 'published' or (approved_by is not null and approved_at is not null and effective_from is not null))
);

create unique index if not exists idx_lender_policy_one_published
  on public.lender_policy_versions(program_id)
  where status = 'published' and effective_to is null;

create table if not exists public.lender_policy_rules (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references public.lender_policy_versions(id) on delete cascade,
  rule_group text not null default 'base',
  field_key text not null,
  operator text not null check (operator in ('eq', 'neq', 'in', 'not_in', 'gt', 'gte', 'lt', 'lte', 'between', 'exists', 'not_exists')),
  comparison_value jsonb not null default 'null'::jsonb,
  severity text not null default 'hard' check (severity in ('hard', 'soft', 'warning')),
  reason_code text not null,
  reason_text text not null,
  weight numeric(8,3) not null default 0,
  priority integer not null default 100,
  enabled boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (policy_version_id, reason_code)
);

create table if not exists public.lender_policy_documents (
  id uuid primary key default gen_random_uuid(),
  lender_id uuid not null references public.lender_master(id) on delete cascade,
  program_id uuid references public.lender_programs(id) on delete cascade,
  policy_version_id uuid references public.lender_policy_versions(id) on delete set null,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  checksum text,
  issued_at timestamptz,
  expires_at timestamptz,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'verified', 'rejected', 'expired')),
  review_note text,
  verified_by uuid,
  verified_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create or replace function public.review_lender_policy_document(
  p_document_id uuid,
  p_decision text,
  p_note text,
  p_reviewer_user_id uuid
)
returns public.lender_policy_documents
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_policy_documents;
  lender_partner_id uuid;
begin
  perform public.require_lender_intelligence_actor(p_reviewer_user_id);
  select * into target from public.lender_policy_documents where id = p_document_id for update;
  if target.id is null then raise exception 'Document not found'; end if;
  if target.review_status <> 'pending' then raise exception 'Only pending documents can be reviewed'; end if;
  if p_decision not in ('verified', 'rejected') then raise exception 'Invalid document review decision'; end if;
  if target.created_by is not null and target.created_by = p_reviewer_user_id then
    raise exception 'Uploader and reviewer must be different admins';
  end if;
  if p_decision = 'rejected' and (p_note is null or length(btrim(p_note)) < 5) then
    raise exception 'A rejection note of at least 5 characters is required';
  end if;

  update public.lender_policy_documents
  set review_status = p_decision,
      review_note = nullif(btrim(p_note), ''),
      verified_by = p_reviewer_user_id,
      verified_at = now()
  where id = p_document_id
  returning * into target;
  select partner_id into lender_partner_id from public.lender_master where id = target.lender_id;
  perform public.register_lender_intelligence_audit(
    lender_partner_id, p_reviewer_user_id, 'compliance', 'document_' || p_decision,
    'policy_document', target.id::text, 'Private document ' || p_decision,
    jsonb_build_object('lenderId', target.lender_id, 'programId', target.program_id,
      'policyVersionId', target.policy_version_id, 'documentType', target.document_type,
      'checksum', target.checksum, 'reviewNote', target.review_note,
      'reviewedAt', target.verified_at, 'status', target.review_status)
  );
  return target;
end;
$$;

revoke all on function public.review_lender_policy_document(uuid, text, text, uuid) from public;
grant execute on function public.review_lender_policy_document(uuid, text, text, uuid) to service_role;

create or replace function public.enforce_lender_program_readiness()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active' then
    if not exists (
      select 1 from public.lender_master lender
      where lender.id = new.lender_id and lender.onboarding_status = 'active'
    ) then raise exception 'Program requires an active lender'; end if;
    if not exists (
      select 1 from public.lender_policy_versions policy
      where policy.program_id = new.id and policy.status = 'published'
        and policy.effective_from <= now()
        and (policy.effective_to is null or policy.effective_to > now())
    ) then raise exception 'Program requires a current published policy'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lender_program_readiness on public.lender_programs;
create trigger trg_lender_program_readiness
before insert or update of status, lender_id on public.lender_programs
for each row execute function public.enforce_lender_program_readiness();

-- Declare consent evidence before routing functions are compiled.
alter table public.crm_eligibility_reports
  add column if not exists consent_given boolean not null default false,
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists consent_purpose text,
  add column if not exists consent_source text,
  add column if not exists consent_captured_by uuid;

create table if not exists public.lender_consent_withdrawals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  eligibility_report_id text not null unique references public.crm_eligibility_reports(id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 5 and 2000),
  withdrawn_by uuid not null references auth.users(id) on delete restrict,
  withdrawn_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.lender_routing_decisions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  lead_id text references public.crm_leads(id) on delete set null,
  eligibility_report_id text references public.crm_eligibility_reports(id) on delete set null,
  application_id text references public.crm_lender_applications(id) on delete set null,
  engine_version text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '[]'::jsonb,
  selected_lender_id uuid references public.lender_master(id) on delete set null,
  selected_program_id uuid references public.lender_programs(id) on delete set null,
  selected_rank integer,
  decision_type text not null default 'recommendation'
    check (decision_type in ('recommendation', 'selected', 'override', 'exception', 'no_match')),
  override_reason_code text,
  override_note text,
  decided_by uuid,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.lender_routing_exceptions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  routing_decision_id uuid not null references public.lender_routing_decisions(id) on delete cascade,
  lead_id text references public.crm_leads(id) on delete set null,
  eligibility_report_id text references public.crm_eligibility_reports(id) on delete set null,
  lender_id uuid not null references public.lender_master(id) on delete restrict,
  program_id uuid not null references public.lender_programs(id) on delete restrict,
  policy_version_id uuid references public.lender_policy_versions(id) on delete set null,
  match_status text not null check (match_status in ('near_match', 'excluded', 'needs_data')),
  reason_code text not null,
  reason_note text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'expired', 'used')),
  requested_by uuid,
  requested_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routing_decision_id, program_id, status)
);

create table if not exists public.application_stage_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  application_id text not null references public.crm_lender_applications(id) on delete cascade,
  lender_id uuid references public.lender_master(id) on delete set null,
  program_id uuid references public.lender_programs(id) on delete set null,
  from_stage text,
  to_stage text not null,
  reason_code text,
  note text,
  source text not null default 'manual' check (source in ('manual', 'system', 'import', 'lender_api', 'webhook')),
  idempotency_key text,
  occurred_at timestamptz not null,
  actor_user_id uuid,
  created_at timestamptz not null default now(),
  -- Only source events carrying an idempotency key participate in deduplication.
  -- Manual lifecycle transitions intentionally leave it null and must coexist.
  unique (partner_id, idempotency_key)
);

create or replace function public.commit_lender_selection(
  p_partner_id uuid,
  p_eligibility_report_id text,
  p_application jsonb,
  p_lender_id uuid,
  p_program_id uuid,
  p_selected_rank integer,
  p_decision_type text,
  p_reason_code text,
  p_reason_note text,
  p_exception_id uuid,
  p_actor_user_id uuid,
  p_occurred_at timestamptz
)
returns public.crm_lender_applications
language plpgsql security definer set search_path = public
as $$
declare
  decision public.lender_routing_decisions;
  exception_record public.lender_routing_exceptions;
  created_application public.crm_lender_applications;
  new_application_id text := nullif(btrim(p_application->>'id'), '');
  lender_name_value text := nullif(btrim(p_application->>'lenderName'), '');
  snapshot_result jsonb;
  program_daily_limit integer;
  submissions_today integer;
begin
  perform public.require_lender_intelligence_actor(p_actor_user_id);
  if jsonb_typeof(p_application) <> 'object' or octet_length(p_application::text) > 1048576 then
    raise exception 'Application selection payload must be an object no larger than 1 MB';
  end if;
  if p_occurred_at is null or p_occurred_at > now() + interval '5 minutes' then
    raise exception 'Selection timestamp is invalid or too far in the future';
  end if;
  if p_partner_id is null or new_application_id is null or lender_name_value is null then
    raise exception 'Partner, application id, and lender are required';
  end if;
  if length(new_application_id) > 100 or length(lender_name_value) > 200
    or length(coalesce(p_application->>'customerName', '')) > 200
    or length(coalesce(p_application->>'mobile', '')) > 30
    or length(coalesce(p_application->>'product', '')) > 100
    or length(coalesce(p_application->>'followUpDate', '')) > 50
    or length(coalesce(p_reason_code, '')) > 50
    or length(coalesce(p_reason_note, '')) > 2000 then
    raise exception 'Application selection text exceeds the allowed length';
  end if;
  if jsonb_typeof(coalesce(p_application->'statusHistory', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_application->'notes', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_application->'lenderHistory', '[]'::jsonb)) <> 'array' then
    raise exception 'Application histories and notes must be arrays';
  end if;
  if coalesce(p_application->>'loanAmount', '') <> ''
    and (p_application->>'loanAmount' !~ '^\d+(\.\d{1,2})?$'
      or (p_application->>'loanAmount')::numeric > 1000000000000) then
    raise exception 'Application loan amount is invalid or outside the allowed range';
  end if;
  if p_decision_type not in ('selected', 'override', 'exception') then raise exception 'Invalid selection type'; end if;
  select * into decision from public.lender_routing_decisions
  where partner_id = p_partner_id and eligibility_report_id = p_eligibility_report_id
  order by decided_at desc limit 1 for update;
  if decision.id is null then raise exception 'Routing decision not found'; end if;
  if decision.application_id is not null then raise exception 'Routing decision is already committed'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_program_id::text, 0));
  if not exists (
    select 1 from public.crm_eligibility_reports report
    where report.id = decision.eligibility_report_id and report.partner_id = p_partner_id
      and report.consent_given and report.consent_at is not null
      and report.consent_version is not null and report.consent_purpose is not null
      and report.consent_captured_by is not null
      and not exists (select 1 from public.lender_consent_withdrawals withdrawal
        where withdrawal.eligibility_report_id = report.id)
  ) then raise exception 'Current customer consent evidence is required for lender submission'; end if;
  if nullif(p_application->>'leadId', '') is distinct from decision.lead_id then
    raise exception 'Application lead does not match routing evidence';
  end if;
  if p_occurred_at < decision.decided_at then raise exception 'Selection cannot predate routing evidence'; end if;
  select value into snapshot_result from jsonb_array_elements(decision.result_snapshot)
  where value->>'programId' = p_program_id::text and value->>'lenderId' = p_lender_id::text limit 1;
  if snapshot_result is null then raise exception 'Selected program is not part of this routing decision'; end if;
  if coalesce((snapshot_result->>'rank')::integer, 0) <> coalesce(p_selected_rank, 0) then raise exception 'Selected rank does not match routing evidence'; end if;
  if p_decision_type <> 'exception' and snapshot_result->>'matchStatus' <> 'eligible' then raise exception 'Only an eligible result can be selected without an exception'; end if;
  if not exists (
    select 1 from public.lender_programs program join public.lender_master lender on lender.id = program.lender_id
    where program.id = p_program_id and program.lender_id = p_lender_id and program.status = 'active'
      and program.capacity_status <> 'paused' and lender.onboarding_status = 'active'
      and lender.kyc_status = 'verified' and lender.agreement_status = 'signed'
      and (lender.agreement_expires_at is null or lender.agreement_expires_at > now())
      and lender.finance_email is not null and lender.billing_address is not null and lender.gstin is not null
      and lower(lender.display_name) = lower(lender_name_value)
  ) then raise exception 'Selected lender program is no longer active'; end if;
  select daily_submission_limit into program_daily_limit
  from public.lender_programs where id = p_program_id;
  if program_daily_limit is not null then
    select count(*) into submissions_today from public.application_stage_events
    where program_id = p_program_id and to_stage = 'case_sent_to_lender'
      and (occurred_at at time zone 'Asia/Kolkata')::date = (p_occurred_at at time zone 'Asia/Kolkata')::date;
    if submissions_today >= program_daily_limit then
      raise exception 'Program daily submission capacity is exhausted';
    end if;
  end if;
  if not exists (
    select 1 from public.lender_policy_versions policy
    where policy.id = nullif(snapshot_result->>'policyVersionId', '')::uuid
      and policy.program_id = p_program_id and policy.status = 'published'
      and policy.effective_from <= now()
      and (policy.effective_to is null or policy.effective_to > now())
  ) then raise exception 'Routing policy evidence is no longer current; run eligibility again'; end if;
  if p_decision_type = 'selected' and coalesce(p_selected_rank, 0) <> 1 then raise exception 'Top selection must have rank 1'; end if;
  if p_decision_type = 'override' and (coalesce(p_selected_rank, 0) <= 1 or length(btrim(coalesce(p_reason_code, ''))) < 2 or length(btrim(coalesce(p_reason_note, ''))) < 5) then
    raise exception 'Rank override requires structured evidence';
  end if;
  if p_decision_type = 'exception' then
    select * into exception_record from public.lender_routing_exceptions
    where id = p_exception_id and partner_id = p_partner_id and routing_decision_id = decision.id
      and program_id = p_program_id and lender_id = p_lender_id
      and policy_version_id = nullif(snapshot_result->>'policyVersionId', '')::uuid for update;
    if exception_record.id is null or exception_record.status <> 'approved'
      or exception_record.reviewed_at is null
      or exception_record.reviewed_at <= now() - interval '24 hours' then
      raise exception 'A current approved routing exception is required';
    end if;
  elsif p_exception_id is not null then raise exception 'Exception id is valid only for exception selection';
  end if;

  insert into public.crm_lender_applications (
    id, partner_id, lead_id, customer_name, mobile, lender_name, product, loan_amount,
    status, status_history, notes, lender_history, follow_up_date, rejection_reason,
    created_by, updated_by, created_at, updated_at
  ) values (
    new_application_id, p_partner_id, nullif(p_application->>'leadId', ''),
    coalesce(p_application->>'customerName', ''), p_application->>'mobile', lender_name_value,
    coalesce(nullif(p_application->>'product', ''), 'personal_loan'),
    coalesce(nullif(p_application->>'loanAmount', '')::numeric, 0),
    'case_sent_to_lender', coalesce(p_application->'statusHistory', '[]'::jsonb),
    coalesce(p_application->'notes', '[]'::jsonb), coalesce(p_application->'lenderHistory', '[]'::jsonb),
    nullif(p_application->>'followUpDate', ''), null, p_actor_user_id, p_actor_user_id,
    p_occurred_at, p_occurred_at
  ) returning * into created_application;

  update public.lender_routing_decisions set application_id = new_application_id,
    selected_lender_id = p_lender_id, selected_program_id = p_program_id,
    selected_rank = p_selected_rank, decision_type = p_decision_type,
    override_reason_code = nullif(btrim(p_reason_code), ''), override_note = nullif(btrim(p_reason_note), ''),
    decided_by = p_actor_user_id, decided_at = p_occurred_at where id = decision.id;
  insert into public.application_stage_events (
    partner_id, application_id, lender_id, program_id, from_stage, to_stage,
    reason_code, note, source, idempotency_key, occurred_at, actor_user_id
  ) values (
    p_partner_id, new_application_id, p_lender_id, p_program_id, null, 'case_sent_to_lender',
    case when p_decision_type = 'exception' then 'APPROVED_EXCEPTION' else coalesce(nullif(btrim(p_reason_code), ''), 'INITIAL_SUBMISSION') end,
    nullif(btrim(p_reason_note), ''), 'manual', 'selection-open:' || decision.id::text, p_occurred_at, p_actor_user_id
  );
  if p_decision_type = 'exception' then
    update public.lender_routing_exceptions set status = 'used', used_at = p_occurred_at, updated_at = p_occurred_at
    where id = exception_record.id;
  end if;
  perform public.register_lender_intelligence_audit(
    p_partner_id, p_actor_user_id, 'routing', 'commit_lender_selection',
    'lender_application', created_application.id::text, 'Lender selection committed',
    jsonb_build_object('routingDecisionId', decision.id, 'eligibilityReportId', p_eligibility_report_id,
      'leadId', decision.lead_id, 'lenderId', p_lender_id, 'programId', p_program_id,
      'policyVersionId', nullif(snapshot_result->>'policyVersionId', '')::uuid,
      'selectedRank', p_selected_rank, 'decisionType', p_decision_type,
      'reasonCode', nullif(btrim(p_reason_code), ''), 'exceptionId', exception_record.id,
      'occurredAt', p_occurred_at)
  );
  return created_application;
end;
$$;

revoke all on function public.commit_lender_selection(uuid, text, jsonb, uuid, uuid, integer, text, text, text, uuid, uuid, timestamptz) from public;
grant execute on function public.commit_lender_selection(uuid, text, jsonb, uuid, uuid, integer, text, text, text, uuid, uuid, timestamptz) to service_role;

drop index if exists public.idx_crm_lender_applications_partner_lead_lender;
create unique index idx_crm_lender_applications_partner_lead_lender
  on public.crm_lender_applications(partner_id, lead_id, lender_name)
  where partner_id is not null
    and lead_id is not null
    and status not in ('rejected', 'rerouted', 'disbursed');

drop function if exists public.reroute_crm_application(uuid, text, jsonb, uuid, uuid, text, uuid, timestamptz);
create or replace function public.reroute_crm_application(
  p_partner_id uuid,
  p_previous_application_id text,
  p_new_application jsonb,
  p_new_lender_id uuid,
  p_new_program_id uuid,
  p_reason text,
  p_eligibility_report_id text,
  p_selected_rank integer,
  p_decision_type text,
  p_reason_code text,
  p_reason_note text,
  p_exception_id uuid,
  p_actor_user_id uuid,
  p_occurred_at timestamptz
)
returns public.crm_lender_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_application public.crm_lender_applications;
  created_application public.crm_lender_applications;
  new_application_id text := nullif(trim(p_new_application->>'id'), '');
  new_lender_name text := nullif(trim(p_new_application->>'lenderName'), '');
  prior_lender_id uuid;
  prior_program_id uuid;
  source_decision public.lender_routing_decisions;
  exception_record public.lender_routing_exceptions;
  snapshot_result jsonb;
  program_daily_limit integer;
  submissions_today integer;
begin
  perform public.require_lender_intelligence_actor(p_actor_user_id);
  if jsonb_typeof(p_new_application) <> 'object' or octet_length(p_new_application::text) > 1048576 then
    raise exception 'Reroute application payload must be an object no larger than 1 MB';
  end if;
  if p_occurred_at is null or p_occurred_at > now() + interval '5 minutes' then
    raise exception 'Reroute timestamp is invalid or too far in the future';
  end if;
  if p_partner_id is null or p_previous_application_id is null then
    raise exception 'Partner and previous application are required';
  end if;
  if new_application_id is null or new_lender_name is null then
    raise exception 'New application id and lender are required';
  end if;
  if length(new_application_id) > 100 or length(new_lender_name) > 200
    or length(coalesce(p_new_application->>'customerName', '')) > 200
    or length(coalesce(p_new_application->>'mobile', '')) > 30
    or length(coalesce(p_new_application->>'product', '')) > 100
    or length(coalesce(p_new_application->>'followUpDate', '')) > 50
    or length(coalesce(p_reason, '')) > 2000 or length(coalesce(p_reason_code, '')) > 50
    or length(coalesce(p_reason_note, '')) > 2000 then
    raise exception 'Reroute application text exceeds the allowed length';
  end if;
  if jsonb_typeof(coalesce(p_new_application->'statusHistory', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_new_application->'notes', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_new_application->'lenderHistory', '[]'::jsonb)) <> 'array' then
    raise exception 'Reroute application histories and notes must be arrays';
  end if;
  if coalesce(p_new_application->>'loanAmount', '') <> ''
    and (p_new_application->>'loanAmount' !~ '^\d+(\.\d{1,2})?$'
      or (p_new_application->>'loanAmount')::numeric > 1000000000000) then
    raise exception 'Reroute loan amount is invalid or outside the allowed range';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'A meaningful rerouting reason is required';
  end if;
  if p_decision_type not in ('selected', 'override', 'exception') then raise exception 'Invalid rerouting decision type'; end if;

  select * into previous_application
  from public.crm_lender_applications
  where id = p_previous_application_id and partner_id = p_partner_id
  for update;
  if previous_application.id is null then raise exception 'Previous application not found'; end if;
  if nullif(p_new_application->>'leadId', '') is distinct from previous_application.lead_id then
    raise exception 'Reroute application lead does not match the source application';
  end if;
  if p_occurred_at < previous_application.created_at then raise exception 'Reroute cannot predate the source application'; end if;
  if octet_length(coalesce(previous_application.status_history, '[]'::jsonb)::text) > 1040000
    or octet_length(coalesce(previous_application.lender_history, '[]'::jsonb)::text) > 1040000 then
    raise exception 'Source application history is too large to extend safely';
  end if;
  if previous_application.status in ('rejected', 'rerouted', 'disbursed') then
    raise exception 'Previous application is already terminal';
  end if;
  if exists (
    select 1 from public.crm_lender_applications
    where partner_id = p_partner_id
      and lead_id = previous_application.lead_id
      and lower(lender_name) = lower(new_lender_name)
      and status not in ('rejected', 'rerouted', 'disbursed')
  ) then raise exception 'An active application already exists for the target lender'; end if;

  select * into source_decision from public.lender_routing_decisions
  where partner_id = p_partner_id and eligibility_report_id = p_eligibility_report_id
  order by decided_at desc limit 1 for update;
  if source_decision.id is null or (source_decision.application_id is not null and source_decision.application_id <> previous_application.id) then
    raise exception 'Current routing decision belongs to another application';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_new_program_id::text, 0));
  if not exists (
    select 1 from public.crm_eligibility_reports report
    where report.id = source_decision.eligibility_report_id and report.partner_id = p_partner_id
      and report.consent_given and report.consent_at is not null
      and report.consent_version is not null and report.consent_purpose is not null
      and report.consent_captured_by is not null
      and not exists (select 1 from public.lender_consent_withdrawals withdrawal
        where withdrawal.eligibility_report_id = report.id)
  ) then raise exception 'Current customer consent evidence is required for lender rerouting'; end if;
  if source_decision.lead_id is distinct from previous_application.lead_id then
    raise exception 'Routing decision lead does not match the source application';
  end if;
  select selected_lender_id, selected_program_id into prior_lender_id, prior_program_id
  from public.lender_routing_decisions
  where partner_id = p_partner_id and application_id = previous_application.id
  order by decided_at desc limit 1;
  select value into snapshot_result from jsonb_array_elements(source_decision.result_snapshot)
  where value->>'programId' = p_new_program_id::text and value->>'lenderId' = p_new_lender_id::text limit 1;
  if snapshot_result is null then raise exception 'Reroute target is not part of the routing evidence'; end if;
  if coalesce((snapshot_result->>'rank')::integer, 0) <> coalesce(p_selected_rank, 0) then raise exception 'Reroute rank does not match routing evidence'; end if;
  if p_decision_type <> 'exception' and snapshot_result->>'matchStatus' <> 'eligible' then raise exception 'Reroute target requires an approved exception'; end if;
  if not exists (
    select 1 from public.lender_programs program join public.lender_master lender on lender.id = program.lender_id
    where program.id = p_new_program_id and program.lender_id = p_new_lender_id
      and program.status = 'active' and program.capacity_status <> 'paused'
      and lender.onboarding_status = 'active' and lender.kyc_status = 'verified'
      and lender.agreement_status = 'signed'
      and (lender.agreement_expires_at is null or lender.agreement_expires_at > now())
      and lender.finance_email is not null and lender.billing_address is not null and lender.gstin is not null
      and lower(lender.display_name) = lower(new_lender_name)
  ) then raise exception 'Reroute lender program is no longer active'; end if;
  select daily_submission_limit into program_daily_limit
  from public.lender_programs where id = p_new_program_id;
  if program_daily_limit is not null then
    select count(*) into submissions_today from public.application_stage_events
    where program_id = p_new_program_id and to_stage = 'case_sent_to_lender'
      and (occurred_at at time zone 'Asia/Kolkata')::date = (p_occurred_at at time zone 'Asia/Kolkata')::date;
    if submissions_today >= program_daily_limit then
      raise exception 'Program daily submission capacity is exhausted';
    end if;
  end if;
  if not exists (
    select 1 from public.lender_policy_versions policy
    where policy.id = nullif(snapshot_result->>'policyVersionId', '')::uuid
      and policy.program_id = p_new_program_id and policy.status = 'published'
      and policy.effective_from <= now()
      and (policy.effective_to is null or policy.effective_to > now())
  ) then raise exception 'Reroute policy evidence is no longer current; run eligibility again'; end if;
  if p_decision_type = 'selected' and coalesce(p_selected_rank, 0) <> 1 then raise exception 'Top selection must have rank 1'; end if;
  if p_decision_type = 'override' and (coalesce(p_selected_rank, 0) <= 1 or length(btrim(coalesce(p_reason_code, ''))) < 2 or length(btrim(coalesce(p_reason_note, ''))) < 5) then
    raise exception 'Reroute rank override requires structured evidence';
  end if;
  if p_decision_type = 'exception' then
    select * into exception_record from public.lender_routing_exceptions
    where id = p_exception_id and partner_id = p_partner_id and routing_decision_id = source_decision.id
      and program_id = p_new_program_id and lender_id = p_new_lender_id
      and policy_version_id = nullif(snapshot_result->>'policyVersionId', '')::uuid for update;
    if exception_record.id is null or exception_record.status <> 'approved'
      or exception_record.reviewed_at is null
      or exception_record.reviewed_at <= now() - interval '24 hours' then
      raise exception 'A current approved rerouting exception is required';
    end if;
  elsif p_exception_id is not null then raise exception 'Exception id is valid only for exception rerouting';
  end if;

  perform set_config('app.li_governed_application_write', 'on', true);
  update public.crm_lender_applications
  set status = 'rerouted',
      status_history = jsonb_build_array(jsonb_build_object(
        'status', 'rerouted',
        'note', format('Rerouted from %s to %s: %s', lender_name, new_lender_name, trim(p_reason)),
        'changedAt', p_occurred_at,
        'changedBy', 'Admin'
      )) || coalesce(status_history, '[]'::jsonb),
      lender_history = jsonb_build_array(jsonb_build_object(
        'lenderName', lender_name,
        'status', 'rerouted',
        'changedAt', p_occurred_at,
        'note', format('Transferred to %s: %s', new_lender_name, trim(p_reason))
      )) || coalesce(lender_history, '[]'::jsonb),
      updated_by = p_actor_user_id,
      updated_at = p_occurred_at
  where id = previous_application.id;

  insert into public.crm_lender_applications (
    id, partner_id, lead_id, customer_name, mobile, lender_name, product, loan_amount,
    status, status_history, notes, lender_history, follow_up_date, rejection_reason,
    created_by, updated_by, created_at, updated_at
  ) values (
    new_application_id, p_partner_id, nullif(p_new_application->>'leadId', ''),
    coalesce(p_new_application->>'customerName', ''), p_new_application->>'mobile', new_lender_name,
    coalesce(nullif(p_new_application->>'product', ''), 'personal_loan'),
    coalesce(nullif(p_new_application->>'loanAmount', '')::numeric, 0),
    'case_sent_to_lender', coalesce(p_new_application->'statusHistory', '[]'::jsonb),
    coalesce(p_new_application->'notes', '[]'::jsonb), coalesce(p_new_application->'lenderHistory', '[]'::jsonb),
    nullif(p_new_application->>'followUpDate', ''), null, p_actor_user_id, p_actor_user_id,
    p_occurred_at, p_occurred_at
  ) returning * into created_application;

  insert into public.lender_routing_decisions (
    partner_id, lead_id, eligibility_report_id, application_id, engine_version,
    input_snapshot, result_snapshot, selected_lender_id, selected_program_id, selected_rank,
    decision_type, override_reason_code, override_note, decided_by, decided_at
  ) values (
    source_decision.partner_id, source_decision.lead_id, source_decision.eligibility_report_id,
    new_application_id, source_decision.engine_version, source_decision.input_snapshot,
    source_decision.result_snapshot, p_new_lender_id, p_new_program_id, p_selected_rank,
    p_decision_type, nullif(btrim(p_reason_code), ''), nullif(btrim(p_reason_note), ''),
    p_actor_user_id, p_occurred_at
  );

  insert into public.application_stage_events (
    partner_id, application_id, lender_id, program_id, from_stage, to_stage,
    reason_code, note, source, idempotency_key, occurred_at, actor_user_id
  ) values
  (p_partner_id, previous_application.id, prior_lender_id, prior_program_id,
   previous_application.status, 'rerouted', 'LENDER_SWITCH', trim(p_reason), 'manual',
   'reroute-close:' || previous_application.id || ':' || new_application_id, p_occurred_at, p_actor_user_id),
  (p_partner_id, new_application_id, p_new_lender_id, p_new_program_id,
   null, 'case_sent_to_lender', 'LENDER_SWITCH',
   format('Rerouted from %s to %s: %s', previous_application.lender_name, new_lender_name, trim(p_reason)),
   'manual', 'reroute-open:' || previous_application.id || ':' || new_application_id,
   p_occurred_at, p_actor_user_id);

  if p_decision_type = 'exception' then
    update public.lender_routing_exceptions set status = 'used', used_at = p_occurred_at, updated_at = p_occurred_at
    where id = exception_record.id;
  end if;

  perform public.register_lender_intelligence_audit(
    p_partner_id, p_actor_user_id, 'routing', 'reroute_lender_application',
    'lender_application', created_application.id::text, 'Lender application rerouted',
    jsonb_build_object('sourceApplicationId', previous_application.id,
      'sourceRoutingDecisionId', source_decision.id, 'eligibilityReportId', p_eligibility_report_id,
      'leadId', previous_application.lead_id, 'fromLenderId', prior_lender_id,
      'fromProgramId', prior_program_id, 'toLenderId', p_new_lender_id,
      'toProgramId', p_new_program_id,
      'policyVersionId', nullif(snapshot_result->>'policyVersionId', '')::uuid,
      'selectedRank', p_selected_rank, 'decisionType', p_decision_type,
      'reasonCode', nullif(btrim(p_reason_code), ''), 'exceptionId', exception_record.id,
      'occurredAt', p_occurred_at)
  );

  return created_application;
end;
$$;

revoke all on function public.reroute_crm_application(uuid, text, jsonb, uuid, uuid, text, text, integer, text, text, text, uuid, uuid, timestamptz) from public;
grant execute on function public.reroute_crm_application(uuid, text, jsonb, uuid, uuid, text, text, integer, text, text, text, uuid, uuid, timestamptz) to service_role;

create table if not exists public.lender_outcomes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  application_id text not null references public.crm_lender_applications(id) on delete cascade,
  lender_id uuid references public.lender_master(id) on delete set null,
  program_id uuid references public.lender_programs(id) on delete set null,
  outcome text not null check (outcome in ('approved', 'rejected', 'cancelled', 'expired', 'disbursed')),
  rejection_reason_code text,
  rejection_reason_text text,
  sanctioned_amount numeric(14,2),
  disbursed_amount numeric(14,2),
  approved_roi numeric(7,3),
  approved_tenure_months integer,
  decided_at timestamptz,
  disbursed_at timestamptz,
  source text not null default 'manual',
  external_reference text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lender_rejection_reasons (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  code text not null,
  category text not null,
  label text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (partner_id, code)
);

insert into public.lender_rejection_reasons (partner_id, code, category, label, sort_order)
values
  (null, 'BUREAU_POLICY', 'credit', 'Bureau policy not met', 10),
  (null, 'HIGH_FOIR', 'affordability', 'FOIR above lender policy', 20),
  (null, 'LOW_INCOME', 'affordability', 'Income below lender policy', 30),
  (null, 'EMPLOYMENT_POLICY', 'profile', 'Employment profile not eligible', 40),
  (null, 'SERVICEABILITY', 'geography', 'Location not serviceable', 50),
  (null, 'DOCUMENTATION', 'documents', 'Documents incomplete or invalid', 60),
  (null, 'BANKING_POLICY', 'banking', 'Banking assessment not met', 70),
  (null, 'FRAUD_RISK', 'risk', 'Fraud or verification risk', 80),
  (null, 'CUSTOMER_CANCELLED', 'customer', 'Customer withdrew the application', 90),
  (null, 'DUPLICATE_CASE', 'operations', 'Duplicate application', 100),
  (null, 'OTHER', 'other', 'Other lender reason', 999)
on conflict (partner_id, code) do nothing;

create unique index if not exists idx_lender_outcomes_application_outcome
  on public.lender_outcomes(application_id, outcome);

create or replace function public.valid_lender_payout_slabs(p_slabs jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
  current_min numeric;
  current_max numeric;
  current_value numeric;
  prior_max numeric := -1;
  open_ended_seen boolean := false;
begin
  if jsonb_typeof(p_slabs) <> 'array' or jsonb_array_length(p_slabs) = 0 then return false; end if;
  for item in select value from jsonb_array_elements(p_slabs) loop
    if jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item->'min') <> 'number'
      or (item ? 'max' and item->'max' <> 'null'::jsonb and jsonb_typeof(item->'max') <> 'number')
      or coalesce(item->>'basis', '') not in ('flat', 'percentage')
      or jsonb_typeof(item->'value') <> 'number'
    then return false; end if;
    current_min := (item->>'min')::numeric;
    current_max := case when not (item ? 'max') or item->'max' = 'null'::jsonb then null else (item->>'max')::numeric end;
    current_value := (item->>'value')::numeric;
    if current_min < 0 or current_value <= 0 or (current_max is not null and current_max < current_min)
      or open_ended_seen or current_min <= prior_max
      or (item->>'basis' = 'percentage' and current_value > 100)
    then return false; end if;
    if current_max is null then open_ended_seen := true; else prior_max := current_max; end if;
  end loop;
  return true;
end;
$$;

create table if not exists public.lender_commercial_versions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  lender_id uuid not null references public.lender_master(id) on delete cascade,
  program_id uuid references public.lender_programs(id) on delete cascade,
  version integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'active', 'rejected', 'expired', 'terminated')),
  payout_basis text not null check (payout_basis in ('flat', 'percentage', 'slab', 'custom')),
  payout_value numeric(12,4),
  payout_slab jsonb not null default '[]'::jsonb,
  tax_terms jsonb not null default '{}'::jsonb,
  clawback_terms jsonb not null default '{}'::jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  source_reference text,
  submitted_by uuid,
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (partner_id, lender_id, program_id, version),
  check (effective_to is null or effective_from is null or effective_to > effective_from),
  constraint lender_commercial_payout_terms_valid check (payout_basis = 'custom' or (payout_basis = 'flat' and payout_value > 0) or (payout_basis = 'percentage' and payout_value > 0 and payout_value <= 100) or (payout_basis = 'slab' and public.valid_lender_payout_slabs(payout_slab)))
);

create unique index if not exists idx_lender_commercial_one_active
  on public.lender_commercial_versions(
    coalesce(partner_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lender_id,
    coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) where status = 'active' and effective_to is null;

create table if not exists public.lender_invoice_sequences (
  fiscal_year text primary key,
  last_number integer not null check (last_number > 0),
  updated_at timestamptz not null default now(),
  check (fiscal_year ~ '^[0-9]{2}-[0-9]{2}$')
);

create table if not exists public.lender_invoices (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  lender_id uuid not null references public.lender_master(id) on delete restrict,
  invoice_number text not null unique,
  direction text not null check (direction in ('receivable', 'payable')),
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'raised', 'part_paid', 'paid', 'cancelled', 'disputed')),
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  notes text,
  recipient_snapshot jsonb not null default '{}'::jsonb,
  issuer_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subtotal >= 0 and tax_amount >= 0 and total_amount >= 0 and paid_amount >= 0),
  check (paid_amount <= total_amount)
);

create table if not exists public.lender_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.lender_invoices(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  reference text not null,
  idempotency_key text not null,
  recorded_by uuid,
  recorded_at timestamptz not null default now(),
  unique (invoice_id, idempotency_key)
);

alter table public.lender_invoices add column if not exists adjustment_amount numeric(14,2) not null default 0;
alter table public.lender_invoices drop constraint if exists lender_invoices_adjustment_amount_check;
alter table public.lender_invoices add constraint lender_invoices_adjustment_amount_check
  check (adjustment_amount >= 0 and paid_amount + adjustment_amount <= total_amount);
alter table public.lender_invoices drop constraint if exists lender_invoices_total_matches_components;
alter table public.lender_invoices add constraint lender_invoices_total_matches_components
  check (total_amount = subtotal + tax_amount);

create table if not exists public.lender_reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  application_id text references public.crm_lender_applications(id) on delete set null,
  outcome_id uuid references public.lender_outcomes(id) on delete set null,
  commercial_version_id uuid references public.lender_commercial_versions(id) on delete set null,
  invoice_id uuid references public.lender_invoices(id) on delete set null,
  expected_amount numeric(14,2) not null default 0,
  invoiced_amount numeric(14,2) not null default 0,
  received_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  status text not null default 'unbilled'
    check (status in ('unbilled', 'invoice_ready', 'invoiced', 'part_paid', 'paid', 'disputed', 'written_off')),
  external_reference text,
  variance_reason text,
  due_at timestamptz,
  settled_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lender_invoice_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.lender_invoice_payments(id) on delete restrict,
  reconciliation_item_id uuid not null references public.lender_reconciliation_items(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  allocated_at timestamptz not null default now(),
  unique (payment_id, reconciliation_item_id)
);

create table if not exists public.lender_invoice_adjustments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.lender_invoices(id) on delete restrict,
  reconciliation_item_id uuid references public.lender_reconciliation_items(id) on delete restrict,
  adjustment_type text not null check (adjustment_type in ('write_off', 'credit_note', 'correction')),
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  recorded_by uuid,
  recorded_at timestamptz not null default now(),
  unique (reconciliation_item_id, adjustment_type)
);

create table if not exists public.lender_clawbacks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  reconciliation_item_id uuid not null references public.lender_reconciliation_items(id) on delete restrict,
  commercial_version_id uuid not null references public.lender_commercial_versions(id) on delete restrict,
  application_id text references public.crm_lender_applications(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  trigger_code text not null,
  trigger_note text not null,
  triggered_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'recovered', 'waived')),
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (reconciliation_item_id)
);

alter table public.lender_clawbacks add column if not exists recovered_amount numeric(14,2);
alter table public.lender_clawbacks add column if not exists recovery_reference text;

create unique index if not exists idx_lender_reconciliation_outcome
  on public.lender_reconciliation_items(outcome_id);

create table if not exists public.lender_data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete cascade,
  lender_id uuid references public.lender_master(id) on delete cascade,
  program_id uuid references public.lender_programs(id) on delete cascade,
  application_id text references public.crm_lender_applications(id) on delete cascade,
  issue_type text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'accepted')),
  title text not null,
  detail text,
  owner_user_id uuid,
  due_at timestamptz,
  resolved_at timestamptz,
  resolution_note text,
  fingerprint text not null unique,
  source text not null default 'system' check (source in ('system', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lender_intelligence_audit_logs (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete set null,
  actor_user_id uuid,
  actor_email text,
  module text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lender_master_partner_status on public.lender_master(partner_id, onboarding_status);
create index if not exists idx_lender_programs_lender_status on public.lender_programs(lender_id, status);
create index if not exists idx_lender_programs_partner_product on public.lender_programs(partner_id, product, status);
create index if not exists idx_lender_policy_versions_program_status on public.lender_policy_versions(program_id, status, effective_from desc);
create index if not exists idx_lender_policy_rules_version_priority on public.lender_policy_rules(policy_version_id, priority);
create index if not exists idx_lender_policy_documents_expiry on public.lender_policy_documents(expires_at) where expires_at is not null;
create index if not exists idx_lender_routing_partner_date on public.lender_routing_decisions(partner_id, decided_at desc);
create index if not exists idx_lender_routing_application on public.lender_routing_decisions(application_id);
create index if not exists idx_lender_exceptions_partner_status on public.lender_routing_exceptions(partner_id, status, requested_at desc);
create index if not exists idx_application_stage_events_app_date on public.application_stage_events(application_id, occurred_at);
create index if not exists idx_lender_outcomes_partner_date on public.lender_outcomes(partner_id, created_at desc);
create index if not exists idx_lender_outcomes_program on public.lender_outcomes(program_id, outcome);
create index if not exists idx_lender_rejection_reasons_active on public.lender_rejection_reasons(partner_id, active, sort_order);
create index if not exists idx_lender_commercials_effective on public.lender_commercial_versions(partner_id, lender_id, status, effective_from desc);
create index if not exists idx_lender_invoices_partner_status on public.lender_invoices(partner_id, status, due_at);
create index if not exists idx_lender_invoices_lender_status on public.lender_invoices(lender_id, status, issued_at desc);
create index if not exists idx_lender_invoice_payments_invoice on public.lender_invoice_payments(invoice_id, recorded_at desc);
create index if not exists idx_lender_payment_allocations_item on public.lender_invoice_payment_allocations(reconciliation_item_id, allocated_at desc);
create index if not exists idx_lender_invoice_adjustments_invoice on public.lender_invoice_adjustments(invoice_id, recorded_at desc);
create index if not exists idx_lender_clawbacks_partner_status on public.lender_clawbacks(partner_id, status, triggered_at desc);
create index if not exists idx_lender_reconciliation_partner_status on public.lender_reconciliation_items(partner_id, status, due_at);
create index if not exists idx_lender_dq_owner_status on public.lender_data_quality_issues(owner_user_id, status, due_at);
create index if not exists idx_lender_audit_created on public.lender_intelligence_audit_logs(created_at desc);
create index if not exists idx_lender_audit_entity on public.lender_intelligence_audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.reject_lender_append_only_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception '% is an append-only lender intelligence ledger', tg_table_name;
end;
$$;

create or replace function public.protect_lender_routing_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and old.application_id is null
    and new.application_id is not null
    and new.selected_lender_id is not null
    and new.selected_program_id is not null
    and (to_jsonb(new) - array[
      'application_id', 'selected_lender_id', 'selected_program_id', 'selected_rank',
      'decision_type', 'override_reason_code', 'override_note', 'decided_by', 'decided_at'
    ]::text[]) = (to_jsonb(old) - array[
      'application_id', 'selected_lender_id', 'selected_program_id', 'selected_rank',
      'decision_type', 'override_reason_code', 'override_note', 'decided_by', 'decided_at'
    ]::text[])
  then
    return new;
  end if;
  raise exception 'Lender routing decisions are immutable after their one-time application binding';
end;
$$;

create or replace function public.protect_lender_policy_rule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_parent_status text;
  new_parent_status text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select status into old_parent_status from public.lender_policy_versions where id = old.policy_version_id for update;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    select status into new_parent_status from public.lender_policy_versions where id = new.policy_version_id for update;
  end if;
  if (tg_op in ('UPDATE', 'DELETE') and old_parent_status is distinct from 'draft')
    or (tg_op in ('INSERT', 'UPDATE') and new_parent_status is distinct from 'draft') then
    raise exception 'Policy rules can be changed only while their version is draft';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.protect_lender_policy_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then raise exception 'Policy version history cannot be deleted'; end if;
  if old.status = 'draft' and new.status in ('draft', 'in_review', 'rejected')
    and new.id = old.id and new.program_id = old.program_id and new.version = old.version
    and new.created_at = old.created_at
  then return new; end if;
  if old.status <> 'draft' and (to_jsonb(new) - array[
    'status', 'effective_from', 'effective_to', 'submitted_by', 'submitted_at',
    'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_note', 'updated_at'
  ]::text[]) <> (to_jsonb(old) - array[
    'status', 'effective_from', 'effective_to', 'submitted_by', 'submitted_at',
    'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_note', 'updated_at'
  ]::text[]) then
    raise exception 'Reviewed policy content is immutable; create a new version';
  end if;
  if old.status = 'in_review' and new.status = 'published'
    and new.effective_from is not null and new.effective_from <= now()
  then return new; end if;
  if old.status = 'in_review' and new.status = 'rejected' then return new; end if;
  if old.status = 'published' and new.status = 'retired' then return new; end if;
  raise exception 'Invalid or immutable policy version transition';
end;
$$;

create or replace function public.protect_lender_commercial_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then raise exception 'Commercial version history cannot be deleted'; end if;
  if old.status = 'draft' and new.status in ('draft', 'in_review', 'rejected')
    and new.id = old.id and new.partner_id is not distinct from old.partner_id
    and new.lender_id = old.lender_id and new.program_id is not distinct from old.program_id
    and new.version = old.version and new.created_at = old.created_at
  then return new; end if;
  if old.status <> 'draft' and (to_jsonb(new) - array[
    'status', 'effective_from', 'effective_to', 'submitted_by', 'submitted_at',
    'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_note', 'updated_at'
  ]::text[]) <> (to_jsonb(old) - array[
    'status', 'effective_from', 'effective_to', 'submitted_by', 'submitted_at',
    'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_note', 'updated_at'
  ]::text[]) then
    raise exception 'Reviewed commercial economics are immutable; create a new version';
  end if;
  if old.status = 'in_review' and new.status = 'active'
    and new.effective_from is not null and new.effective_from <= now()
  then return new; end if;
  if old.status = 'in_review' and new.status = 'rejected' then return new; end if;
  if old.status = 'active' and new.status in ('expired', 'terminated') then return new; end if;
  raise exception 'Invalid or immutable commercial version transition';
end;
$$;

create or replace function public.enforce_active_program_policy_dependency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_program_id uuid := case when tg_op = 'DELETE' then old.program_id else new.program_id end;
begin
  if exists (select 1 from public.lender_programs where id = affected_program_id and status = 'active')
    and not exists (
      select 1 from public.lender_policy_versions policy
      where policy.program_id = affected_program_id
        and policy.status = 'published'
        and policy.effective_from <= now()
        and (policy.effective_to is null or policy.effective_to > now())
    ) then
    raise exception 'Active program must retain a current published policy';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.enforce_lender_program_shutdown_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.onboarding_status = 'active' and new.onboarding_status <> 'active'
    and exists (select 1 from public.lender_programs where lender_id = old.id and status = 'active') then
    raise exception 'Pause or retire active lender programs before lender shutdown';
  end if;
  return new;
end;
$$;

create or replace function public.protect_lender_routing_exception()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  decision public.lender_routing_decisions;
  evidence jsonb;
begin
  if tg_op = 'DELETE' then raise exception 'Routing exception history cannot be deleted'; end if;
  if tg_op = 'INSERT' then
    select * into decision from public.lender_routing_decisions
    where id = new.routing_decision_id and partner_id = new.partner_id for update;
    if decision.id is null or decision.application_id is not null
      or decision.lead_id is distinct from new.lead_id
      or decision.eligibility_report_id is distinct from new.eligibility_report_id then
      raise exception 'Exception must belong to an unbound routing decision in the same partner context';
    end if;
    select value into evidence from jsonb_array_elements(decision.result_snapshot)
    where value->>'programId' = new.program_id::text
      and value->>'lenderId' = new.lender_id::text
      and value->>'policyVersionId' = new.policy_version_id::text
    limit 1;
    if evidence is null or evidence->>'matchStatus' <> new.match_status
      or new.match_status not in ('near_match', 'excluded', 'needs_data') then
      raise exception 'Exception request does not match immutable routing evidence';
    end if;
    if length(btrim(new.reason_code)) < 2 or length(btrim(new.reason_note)) < 10
      or new.status <> 'pending' or new.requested_by is null then
      raise exception 'A pending exception requires requester and structured evidence';
    end if;
    return new;
  end if;
  if (to_jsonb(new) - array['status', 'reviewed_by', 'reviewed_at', 'review_note', 'used_at', 'updated_at']::text[])
    <> (to_jsonb(old) - array['status', 'reviewed_by', 'reviewed_at', 'review_note', 'used_at', 'updated_at']::text[]) then
    raise exception 'Routing exception request evidence is immutable';
  end if;
  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    if new.reviewed_by is null or new.reviewed_by = old.requested_by
      or new.reviewed_at is null or length(btrim(coalesce(new.review_note, ''))) < 5 then
      raise exception 'Exception review requires an independent reviewer and evidence';
    end if;
    if new.status = 'approved' and not exists (
      select 1 from public.lender_programs program
      join public.lender_master lender on lender.id = program.lender_id
      join public.lender_policy_versions policy on policy.id = old.policy_version_id and policy.program_id = program.id
      where program.id = old.program_id and program.lender_id = old.lender_id
        and program.status = 'active' and program.capacity_status <> 'paused'
        and lender.onboarding_status = 'active' and lender.kyc_status = 'verified'
        and lender.agreement_status = 'signed'
        and (lender.agreement_expires_at is null or lender.agreement_expires_at > now())
        and lender.finance_email is not null and lender.billing_address is not null and lender.gstin is not null
        and policy.status = 'published'
        and policy.effective_from <= now() and (policy.effective_to is null or policy.effective_to > now())
    ) then raise exception 'Exception evidence is stale or lender program is not operational'; end if;
    return new;
  end if;
  if old.status = 'pending' and new.status in ('cancelled', 'expired') then return new; end if;
  if old.status = 'approved' and new.status = 'expired'
    and old.reviewed_at is not null and old.reviewed_at <= now() - interval '24 hours' then return new; end if;
  if old.status = 'approved' and new.status = 'used' and new.used_at is not null then return new; end if;
  raise exception 'Invalid or immutable routing exception transition';
end;
$$;

create or replace function public.validate_application_stage_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.crm_lender_applications;
  latest_event public.application_stage_events;
  decision public.lender_routing_decisions;
begin
  select * into application from public.crm_lender_applications where id = new.application_id for update;
  if application.id is null or application.partner_id is distinct from new.partner_id then
    raise exception 'Stage event must belong to an application in the same partner scope';
  end if;
  if application.status <> new.to_stage then raise exception 'Stage event must match current application status'; end if;
  if new.occurred_at < application.created_at or new.occurred_at > now() + interval '5 minutes' then
    raise exception 'Stage event timestamp is outside the valid application timeline';
  end if;
  select * into latest_event from public.application_stage_events
  where application_id = new.application_id order by occurred_at desc, created_at desc limit 1 for update;
  if latest_event.id is null and new.from_stage is not null then
    raise exception 'First application stage event cannot have a prior stage';
  end if;
  if latest_event.id is not null and (
    new.from_stage is distinct from latest_event.to_stage or new.occurred_at < latest_event.occurred_at
  ) then raise exception 'Stage event breaks the immutable application timeline'; end if;
  select * into decision from public.lender_routing_decisions
  where partner_id = new.partner_id and application_id = new.application_id
  order by decided_at desc limit 1;
  if decision.id is null or decision.selected_lender_id is distinct from new.lender_id
    or decision.selected_program_id is distinct from new.program_id then
    raise exception 'Stage event lender and program must match the bound routing decision';
  end if;
  return new;
end;
$$;

create or replace function public.validate_lender_outcome_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.crm_lender_applications;
  decision public.lender_routing_decisions;
  required_stage text := case new.outcome when 'approved' then 'sanctioned' when 'rejected' then 'rejected' when 'disbursed' then 'disbursed' else new.outcome end;
  evidence_time timestamptz := coalesce(new.disbursed_at, new.decided_at);
begin
  select * into application from public.crm_lender_applications where id = new.application_id for update;
  if application.id is null or application.partner_id is distinct from new.partner_id
    or application.status <> required_stage then
    raise exception 'Outcome must match the current application and partner stage';
  end if;
  select * into decision from public.lender_routing_decisions
  where partner_id = new.partner_id and application_id = new.application_id
  order by decided_at desc limit 1;
  if decision.id is null or decision.selected_lender_id is distinct from new.lender_id
    or decision.selected_program_id is distinct from new.program_id then
    raise exception 'Outcome lender and program must match the bound routing decision';
  end if;
  if evidence_time is null or evidence_time < application.created_at or evidence_time > now() + interval '5 minutes'
    or not exists (
      select 1 from public.application_stage_events event
      where event.application_id = new.application_id and event.partner_id = new.partner_id
        and event.to_stage = required_stage and event.occurred_at = evidence_time
    ) then raise exception 'Outcome requires a matching canonical stage event and timestamp'; end if;
  if new.outcome = 'approved' and coalesce(new.sanctioned_amount, 0) <= 0 then
    raise exception 'Approved outcome requires a positive sanctioned amount';
  end if;
  if new.outcome = 'approved' and coalesce(new.approved_roi, 0) <= 0 then
    raise exception 'Approved outcome requires a positive approved ROI';
  end if;
  if new.outcome = 'approved' and coalesce(new.approved_tenure_months, 0) <= 0 then
    raise exception 'Approved outcome requires a positive approved tenure';
  end if;
  if new.outcome = 'disbursed' and coalesce(new.disbursed_amount, 0) <= 0 then
    raise exception 'Disbursed outcome requires a positive disbursed amount';
  end if;
  if new.outcome = 'rejected' and (
    length(btrim(coalesce(new.rejection_reason_text, ''))) < 3 or not exists (
      select 1 from public.lender_rejection_reasons reason
      where upper(reason.code) = upper(btrim(new.rejection_reason_code)) and reason.active
        and (reason.partner_id = new.partner_id or reason.partner_id is null)
    )
  ) then raise exception 'Rejected outcome requires active canonical reason evidence'; end if;
  return new;
end;
$$;

create or replace function public.validate_lender_reconciliation_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  outcome public.lender_outcomes;
  commercial public.lender_commercial_versions;
  slab jsonb;
  calculated_amount numeric(14,2) := 0;
  calculated_tax numeric(14,2) := 0;
begin
  select * into outcome from public.lender_outcomes where id = new.outcome_id;
  if outcome.id is null or outcome.outcome <> 'disbursed'
    or outcome.application_id is distinct from new.application_id
    or outcome.partner_id is distinct from new.partner_id then
    raise exception 'Reconciliation source must be the matching disbursal outcome';
  end if;
  if new.invoice_id is not null or new.invoiced_amount <> 0 or new.received_amount <> 0 then
    raise exception 'New reconciliation item cannot start invoiced or paid';
  end if;
  if new.commercial_version_id is null then
    if new.expected_amount <> 0 or new.tax_amount <> 0 or new.status <> 'unbilled' then
      raise exception 'Missing commercial coverage must start as zero-value unbilled';
    end if;
    return new;
  end if;
  select * into commercial from public.lender_commercial_versions where id = new.commercial_version_id;
  if commercial.id is null or commercial.lender_id is distinct from outcome.lender_id
    or commercial.program_id is distinct from outcome.program_id
    or not (commercial.partner_id is null or commercial.partner_id = new.partner_id)
    or commercial.status not in ('active', 'expired', 'terminated')
    or commercial.effective_from is null or commercial.effective_from > outcome.disbursed_at
    or (commercial.effective_to is not null and commercial.effective_to <= outcome.disbursed_at) then
    raise exception 'Commercial version does not cover the routed disbursal';
  end if;
  if commercial.payout_basis = 'flat' then calculated_amount := commercial.payout_value;
  elsif commercial.payout_basis = 'percentage' then
    calculated_amount := outcome.disbursed_amount * commercial.payout_value / 100;
  elsif commercial.payout_basis = 'slab' then
    select value into slab from jsonb_array_elements(commercial.payout_slab)
    where outcome.disbursed_amount >= (value->>'min')::numeric
      and ((value->>'max') is null or outcome.disbursed_amount <= (value->>'max')::numeric)
    order by (value->>'min')::numeric desc limit 1;
    if slab is not null then calculated_amount := case when slab->>'basis' = 'flat'
      then (slab->>'value')::numeric else outcome.disbursed_amount * (slab->>'value')::numeric / 100 end;
    end if;
  end if;
  calculated_amount := round(greatest(0, coalesce(calculated_amount, 0)), 2);
  if calculated_amount > 0 and not coalesce((commercial.tax_terms->>'reverseCharge')::boolean, false) then
    calculated_tax := round(calculated_amount * least(100, greatest(0,
      coalesce((commercial.tax_terms->>'ratePercent')::numeric, 0))) / 100, 2);
  end if;
  if new.expected_amount <> calculated_amount or new.tax_amount <> calculated_tax
    or new.status <> (case when calculated_amount > 0 then 'invoice_ready' else 'unbilled' end) then
    raise exception 'Reconciliation amount, tax, or readiness does not match immutable commercial terms';
  end if;
  return new;
end;
$$;

create or replace function public.validate_invoice_payment_allocation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payment public.lender_invoice_payments;
  item public.lender_reconciliation_items;
  already_allocated numeric(14,2);
begin
  select * into payment from public.lender_invoice_payments where id = new.payment_id for update;
  select * into item from public.lender_reconciliation_items where id = new.reconciliation_item_id for update;
  if payment.id is null or item.id is null or item.invoice_id is distinct from payment.invoice_id then
    raise exception 'Payment allocation must belong to a reconciliation line on the same invoice';
  end if;
  if item.status not in ('invoiced', 'part_paid') or new.amount <> round(new.amount, 2)
    or new.amount > item.invoiced_amount - item.received_amount then
    raise exception 'Payment allocation exceeds the exact open line balance';
  end if;
  select coalesce(sum(amount), 0) into already_allocated
  from public.lender_invoice_payment_allocations where payment_id = new.payment_id;
  if already_allocated + new.amount > payment.amount then
    raise exception 'Payment allocations exceed the immutable receipt amount';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_payment_allocation_conservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_payment_id uuid;
  receipt_amount numeric(14,2);
  allocated_amount numeric(14,2);
begin
  if tg_table_name = 'lender_invoice_payments' then
    target_payment_id := new.id;
  else
    target_payment_id := new.payment_id;
  end if;
  select amount into receipt_amount from public.lender_invoice_payments where id = target_payment_id;
  select coalesce(sum(amount), 0) into allocated_amount
  from public.lender_invoice_payment_allocations where payment_id = target_payment_id;
  if receipt_amount is null or allocated_amount <> receipt_amount then
    raise exception 'Every invoice receipt must be fully allocated exactly once';
  end if;
  return new;
end;
$$;

create or replace function public.protect_lender_reconciliation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allocated_amount numeric(14,2);
  commercial public.lender_commercial_versions;
  expected_tax numeric(14,2);
begin
  if tg_op = 'DELETE' then raise exception 'Reconciliation history cannot be deleted'; end if;
  if new.partner_id is distinct from old.partner_id or new.application_id is distinct from old.application_id
    or new.outcome_id is distinct from old.outcome_id or new.commercial_version_id is distinct from old.commercial_version_id
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Reconciliation source identity is immutable';
  end if;
  if new.expected_amount is distinct from old.expected_amount or new.tax_amount is distinct from old.tax_amount then
    select * into commercial from public.lender_commercial_versions where id = old.commercial_version_id;
    expected_tax := case when coalesce((commercial.tax_terms->>'reverseCharge')::boolean, false) then 0
      else round(new.expected_amount * least(100, greatest(0,
        coalesce((commercial.tax_terms->>'ratePercent')::numeric, 0))) / 100, 2) end;
    if old.status <> 'unbilled' or old.invoice_id is not null or old.expected_amount <> 0
      or commercial.payout_basis <> 'custom' or new.expected_amount <= 0
      or new.expected_amount <> round(new.expected_amount, 2) or new.tax_amount <> expected_tax
      or new.status <> 'invoice_ready' or length(btrim(coalesce(new.variance_reason, ''))) < 5 then
      raise exception 'Only an untouched custom payout can receive reviewed valuation';
    end if;
  end if;
  if new.status <> old.status and not (
    (old.status = 'unbilled' and new.status in ('invoice_ready', 'disputed'))
    or (old.status = 'invoice_ready' and new.status in ('invoiced', 'paid', 'disputed'))
    or (old.status = 'invoiced' and new.status in ('part_paid', 'paid', 'disputed', 'invoice_ready', 'unbilled'))
    or (old.status = 'part_paid' and new.status in ('paid', 'disputed'))
    or (old.status = 'disputed' and new.status in ('invoiced', 'part_paid', 'paid', 'written_off', 'invoice_ready', 'unbilled'))
  ) then raise exception 'Invalid reconciliation lifecycle transition'; end if;
  if old.invoice_id is null and new.invoice_id is not null and (
    old.status <> 'invoice_ready' or new.status <> 'invoiced'
    or new.invoiced_amount <> new.expected_amount + new.tax_amount
  ) then raise exception 'Invoice attachment requires an invoice-ready item and exact line total'; end if;
  if old.invoice_id is not null and new.invoice_id is null and (
    old.status not in ('invoiced', 'disputed') or old.received_amount <> 0 or new.received_amount <> 0
    or new.invoiced_amount <> 0
    or new.status <> case when new.expected_amount > 0 then 'invoice_ready' else 'unbilled' end
  ) then raise exception 'Only an unpaid invoiced item can be released by cancellation'; end if;
  if old.invoice_id is not distinct from new.invoice_id
    and new.invoiced_amount is distinct from old.invoiced_amount then
    raise exception 'Invoiced line value is immutable while invoice attachment is unchanged';
  end if;
  if new.received_amount < old.received_amount then raise exception 'Reconciliation receipts cannot decrease'; end if;
  if new.invoice_id is not null and new.received_amount > new.invoiced_amount then
    raise exception 'Reconciliation receipt exceeds invoiced line value';
  end if;
  if new.invoice_id is null and new.received_amount > new.expected_amount then
    raise exception 'Reconciliation receipt exceeds expected value';
  end if;
  if new.status = 'part_paid' and (new.invoice_id is null or new.received_amount <= 0 or new.received_amount >= new.invoiced_amount) then
    raise exception 'Part-paid reconciliation requires an exact open invoice balance';
  end if;
  if new.status = 'paid' and (
    (new.invoice_id is not null and new.received_amount < new.invoiced_amount)
    or (new.invoice_id is null and new.received_amount <= 0)
  ) then raise exception 'Paid reconciliation requires settled receipt evidence'; end if;
  if new.status = 'written_off' and old.status <> 'disputed' then
    raise exception 'Only a disputed reconciliation item can be written off';
  end if;
  if new.received_amount is distinct from old.received_amount and coalesce(new.invoice_id, old.invoice_id) is not null then
    select coalesce(sum(allocation.amount), 0) into allocated_amount
    from public.lender_invoice_payment_allocations allocation
    where allocation.reconciliation_item_id = old.id;
    if new.received_amount <> allocated_amount then
      raise exception 'Invoiced reconciliation receipts must equal immutable payment allocations';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.protect_lender_invoice_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_total numeric(14,2);
  adjustment_total numeric(14,2);
begin
  if tg_op = 'DELETE' then raise exception 'Lender invoice history cannot be deleted'; end if;
  if new.id is distinct from old.id or new.partner_id is distinct from old.partner_id
    or new.lender_id is distinct from old.lender_id or new.invoice_number is distinct from old.invoice_number
    or new.direction is distinct from old.direction or new.subtotal is distinct from old.subtotal
    or new.tax_amount is distinct from old.tax_amount or new.total_amount is distinct from old.total_amount
    or new.recipient_snapshot is distinct from old.recipient_snapshot
    or new.issuer_snapshot is distinct from old.issuer_snapshot
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at
    or new.due_at is distinct from old.due_at then
    raise exception 'Invoice identity, source totals, and due date are immutable';
  end if;
  if new.status <> old.status and not (
    (old.status = 'draft' and new.status in ('raised', 'cancelled'))
    or (old.status = 'raised' and new.status in ('part_paid', 'paid', 'disputed', 'cancelled'))
    or (old.status = 'part_paid' and new.status in ('part_paid', 'paid', 'disputed'))
    or (old.status = 'disputed' and new.status in ('disputed', 'raised', 'part_paid', 'paid', 'cancelled'))
  ) then raise exception 'Invalid lender invoice lifecycle transition'; end if;
  select coalesce(sum(amount), 0) into payment_total from public.lender_invoice_payments where invoice_id = old.id;
  select coalesce(sum(amount), 0) into adjustment_total from public.lender_invoice_adjustments where invoice_id = old.id;
  if new.paid_amount <> payment_total then raise exception 'Invoice paid balance must equal immutable payment ledger'; end if;
  if new.adjustment_amount <> adjustment_total then raise exception 'Invoice adjustment balance must equal immutable adjustment ledger'; end if;
  if new.issued_at is distinct from old.issued_at and not (old.status = 'draft' and new.status = 'raised') then
    raise exception 'Invoice issuance timestamp is immutable after raising';
  end if;
  if new.paid_at is distinct from old.paid_at and new.status <> 'paid' then
    raise exception 'Invoice settlement timestamp can change only at final settlement';
  end if;
  if new.payment_reference is distinct from old.payment_reference and new.paid_amount <= old.paid_amount then
    raise exception 'Invoice payment reference requires new immutable receipt evidence';
  end if;
  if new.notes is distinct from old.notes and new.status <> 'cancelled' then
    raise exception 'Invoice notes can change only for evidenced cancellation';
  end if;
  if new.status = 'raised' and new.issued_at is null then raise exception 'Raised invoice requires issuance evidence'; end if;
  if new.status = 'part_paid' and (new.paid_amount <= 0 or new.paid_amount + new.adjustment_amount >= new.total_amount) then
    raise exception 'Part-paid invoice requires a genuine open balance';
  end if;
  if new.status = 'paid' and (new.paid_amount + new.adjustment_amount <> new.total_amount or new.paid_at is null) then
    raise exception 'Paid invoice requires exact settlement evidence';
  end if;
  if new.status = 'cancelled' and (
    new.paid_amount <> 0 or new.adjustment_amount <> 0 or length(btrim(coalesce(new.notes, ''))) < 5
  ) then raise exception 'Cancelled invoice requires zero ledger activity and reason evidence'; end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_lender_policy_rule on public.lender_policy_rules;
create trigger trg_protect_lender_policy_rule before insert or update or delete on public.lender_policy_rules
for each row execute function public.protect_lender_policy_rule();
drop trigger if exists trg_protect_lender_policy_version on public.lender_policy_versions;
create trigger trg_protect_lender_policy_version before update or delete on public.lender_policy_versions
for each row execute function public.protect_lender_policy_version();
drop trigger if exists trg_protect_lender_commercial_version on public.lender_commercial_versions;
create trigger trg_protect_lender_commercial_version before update or delete on public.lender_commercial_versions
for each row execute function public.protect_lender_commercial_version();
drop trigger if exists trg_active_program_policy_dependency on public.lender_policy_versions;
create constraint trigger trg_active_program_policy_dependency
after insert or update or delete on public.lender_policy_versions
deferrable initially deferred
for each row execute function public.enforce_active_program_policy_dependency();
drop trigger if exists trg_lender_program_shutdown_order on public.lender_master;
create trigger trg_lender_program_shutdown_order
before update of onboarding_status on public.lender_master
for each row execute function public.enforce_lender_program_shutdown_order();
drop trigger if exists trg_protect_lender_routing_exception on public.lender_routing_exceptions;
create trigger trg_protect_lender_routing_exception
before insert or update or delete on public.lender_routing_exceptions
for each row execute function public.protect_lender_routing_exception();
drop trigger if exists trg_validate_application_stage_event on public.application_stage_events;
create trigger trg_validate_application_stage_event before insert on public.application_stage_events
for each row execute function public.validate_application_stage_event();
drop trigger if exists trg_validate_lender_outcome_evidence on public.lender_outcomes;
create trigger trg_validate_lender_outcome_evidence before insert on public.lender_outcomes
for each row execute function public.validate_lender_outcome_evidence();
drop trigger if exists trg_validate_lender_reconciliation_insert on public.lender_reconciliation_items;
create trigger trg_validate_lender_reconciliation_insert before insert on public.lender_reconciliation_items
for each row execute function public.validate_lender_reconciliation_insert();
drop trigger if exists trg_validate_invoice_payment_allocation on public.lender_invoice_payment_allocations;
create trigger trg_validate_invoice_payment_allocation before insert on public.lender_invoice_payment_allocations
for each row execute function public.validate_invoice_payment_allocation();
drop trigger if exists trg_payment_allocation_conservation_payment on public.lender_invoice_payments;
create constraint trigger trg_payment_allocation_conservation_payment
after insert on public.lender_invoice_payments deferrable initially deferred
for each row execute function public.enforce_payment_allocation_conservation();
drop trigger if exists trg_payment_allocation_conservation_allocation on public.lender_invoice_payment_allocations;
create constraint trigger trg_payment_allocation_conservation_allocation
after insert on public.lender_invoice_payment_allocations deferrable initially deferred
for each row execute function public.enforce_payment_allocation_conservation();
drop trigger if exists trg_protect_lender_reconciliation_update on public.lender_reconciliation_items;
create trigger trg_protect_lender_reconciliation_update before update or delete on public.lender_reconciliation_items
for each row execute function public.protect_lender_reconciliation_update();
drop trigger if exists trg_protect_lender_invoice_update on public.lender_invoices;
create trigger trg_protect_lender_invoice_update before update or delete on public.lender_invoices
for each row execute function public.protect_lender_invoice_update();

drop trigger if exists trg_protect_lender_routing_decision on public.lender_routing_decisions;
create trigger trg_protect_lender_routing_decision
before update or delete on public.lender_routing_decisions
for each row execute function public.protect_lender_routing_decision();

drop trigger if exists trg_append_only_application_stage_events on public.application_stage_events;
create trigger trg_append_only_application_stage_events before update or delete on public.application_stage_events
for each row execute function public.reject_lender_append_only_mutation();
drop trigger if exists trg_append_only_lender_outcomes on public.lender_outcomes;
create trigger trg_append_only_lender_outcomes before update or delete on public.lender_outcomes
for each row execute function public.reject_lender_append_only_mutation();
drop trigger if exists trg_append_only_lender_invoice_payments on public.lender_invoice_payments;
create trigger trg_append_only_lender_invoice_payments before update or delete on public.lender_invoice_payments
for each row execute function public.reject_lender_append_only_mutation();
drop trigger if exists trg_append_only_lender_payment_allocations on public.lender_invoice_payment_allocations;
create trigger trg_append_only_lender_payment_allocations before update or delete on public.lender_invoice_payment_allocations
for each row execute function public.reject_lender_append_only_mutation();
drop trigger if exists trg_append_only_lender_invoice_adjustments on public.lender_invoice_adjustments;
create trigger trg_append_only_lender_invoice_adjustments before update or delete on public.lender_invoice_adjustments
for each row execute function public.reject_lender_append_only_mutation();
drop trigger if exists trg_append_only_lender_intelligence_audit_logs on public.lender_intelligence_audit_logs;
create trigger trg_append_only_lender_intelligence_audit_logs before update or delete on public.lender_intelligence_audit_logs
for each row execute function public.reject_lender_append_only_mutation();

create or replace function public.create_lender_invoice(
  p_partner_id uuid,
  p_lender_id uuid,
  p_direction text,
  p_item_ids uuid[],
  p_due_at timestamptz,
  p_user_id uuid
)
returns public.lender_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  created_invoice public.lender_invoices;
  item_count integer;
  subtotal_value numeric(14,2);
  tax_value numeric(14,2);
  generated_number text;
  fiscal_year_value text;
  sequence_value integer;
  recipient_value jsonb;
  issuer_value jsonb;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_direction <> 'receivable' then
    raise exception 'Lender payout reconciliation can create receivable invoices only';
  end if;
  if coalesce(array_length(p_item_ids, 1), 0) = 0 then
    raise exception 'At least one reconciliation item is required';
  end if;
  if p_due_at is not null and p_due_at <= now() then
    raise exception 'Invoice due date must be in the future';
  end if;

  perform 1
  from public.lender_reconciliation_items item
  where item.id = any(p_item_ids)
  order by item.id
  for update;

  select count(*), coalesce(sum(item.expected_amount), 0), coalesce(sum(item.tax_amount), 0)
    into item_count, subtotal_value, tax_value
  from public.lender_reconciliation_items item
  join public.lender_outcomes outcome on outcome.id = item.outcome_id
  where item.id = any(p_item_ids)
    and item.partner_id is not distinct from p_partner_id
    and outcome.lender_id = p_lender_id
    and item.invoice_id is null
    and item.status in ('unbilled', 'invoice_ready');

  if item_count <> array_length(p_item_ids, 1) then
    raise exception 'Reconciliation items must be unbilled and belong to one partner and lender';
  end if;
  if subtotal_value + tax_value <= 0 then
    raise exception 'Invoice total must be positive';
  end if;
  select jsonb_build_object('legalName', lender.legal_name, 'displayName', lender.display_name,
    'billingAddress', lender.billing_address, 'gstin', lender.gstin,
    'financeEmail', lender.finance_email, 'supportEmail', lender.support_email)
  into recipient_value from public.lender_master lender where lender.id = p_lender_id for share;
  if recipient_value is null or nullif(recipient_value->>'billingAddress', '') is null
    or nullif(recipient_value->>'gstin', '') is null or nullif(recipient_value->>'financeEmail', '') is null then
    raise exception 'Invoice requires complete lender billing identity';
  end if;
  select jsonb_build_object('companyName', settings.company_name,
    'companyAddress', settings.company_address, 'gstNumber', settings.gst_number)
  into issuer_value from public.invoice_settings settings
  order by settings.updated_at desc limit 1;
  if issuer_value is null then raise exception 'Invoice issuer settings are required'; end if;

  fiscal_year_value := case when extract(month from current_date) >= 4
    then to_char(current_date, 'YY') || '-' || to_char(current_date + interval '1 year', 'YY')
    else to_char(current_date - interval '1 year', 'YY') || '-' || to_char(current_date, 'YY') end;
  insert into public.lender_invoice_sequences (fiscal_year, last_number)
  values (fiscal_year_value, 1)
  on conflict (fiscal_year) do update set
    last_number = lender_invoice_sequences.last_number + 1,
    updated_at = now()
  returning last_number into sequence_value;
  if sequence_value > 999999 then raise exception 'Lender invoice sequence exhausted for fiscal year %', fiscal_year_value; end if;
  generated_number := 'LND' || fiscal_year_value || '-' || lpad(sequence_value::text, 6, '0');
  insert into public.lender_invoices (
    partner_id, lender_id, invoice_number, direction, subtotal, tax_amount, total_amount,
    status, due_at, recipient_snapshot, issuer_snapshot, created_by, updated_by
  ) values (
    p_partner_id, p_lender_id, generated_number, p_direction, subtotal_value, tax_value, subtotal_value + tax_value,
    'draft', coalesce(p_due_at, now() + interval '15 days'), recipient_value, issuer_value,
    p_user_id, p_user_id
  ) returning * into created_invoice;

  update public.lender_reconciliation_items
  set invoice_id = created_invoice.id,
      invoiced_amount = expected_amount + tax_amount,
      status = 'invoiced',
      updated_by = p_user_id
  where id = any(p_item_ids);

  perform public.register_lender_intelligence_audit(
    p_partner_id, p_user_id, 'invoicing', 'create_invoice', 'lender_invoice',
    created_invoice.id::text,
    format('Lender invoice created from %s reconciliation items', item_count),
    jsonb_build_object('lenderId', p_lender_id, 'itemCount', item_count,
      'direction', p_direction, 'invoiceNumber', generated_number,
      'billingSnapshotVersion', 1,
      'subtotal', subtotal_value, 'taxAmount', tax_value,
      'totalAmount', subtotal_value + tax_value)
  );

  return created_invoice;
end;
$$;

revoke all on function public.create_lender_invoice(uuid, uuid, text, uuid[], timestamptz, uuid) from public;
grant execute on function public.create_lender_invoice(uuid, uuid, text, uuid[], timestamptz, uuid) to service_role;

create or replace function public.raise_lender_invoice(p_invoice_id uuid, p_user_id uuid)
returns public.lender_invoices
language plpgsql security definer set search_path = public
as $$
declare
  target public.lender_invoices;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select * into target from public.lender_invoices where id = p_invoice_id for update;
  if target.id is null then raise exception 'Invoice not found'; end if;
  if target.status <> 'draft' then raise exception 'Only a draft invoice can be raised'; end if;
  if target.total_amount <= 0 then raise exception 'Invoice total must be positive'; end if;
  if target.due_at is null or target.due_at <= now() then raise exception 'Invoice due date must be in the future'; end if;
  if not exists (
    select 1 from public.lender_reconciliation_items item
    where item.invoice_id = target.id and item.status = 'invoiced'
  ) then raise exception 'Invoice has no eligible reconciliation items'; end if;
  update public.lender_invoices set status = 'raised', issued_at = now(), updated_by = p_user_id
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'invoicing', 'raise_invoice', 'lender_invoice',
    target.id::text, target.invoice_number || ' raised',
    jsonb_build_object('invoiceNumber', target.invoice_number, 'totalAmount', target.total_amount,
      'dueAt', target.due_at, 'issuedAt', target.issued_at)
  );
  return target;
end;
$$;

revoke all on function public.raise_lender_invoice(uuid, uuid) from public;
grant execute on function public.raise_lender_invoice(uuid, uuid) to service_role;

create or replace function public.set_manual_lender_payout(p_item_id uuid, p_amount numeric, p_reason text, p_user_id uuid)
returns public.lender_reconciliation_items
language plpgsql security definer set search_path = public
as $$
declare
  target public.lender_reconciliation_items;
  commercial public.lender_commercial_versions;
  tax_rate numeric := 0;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_amount <= 0 then raise exception 'Manual payout amount must be positive'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Manual payout evidence is required'; end if;
  select * into target from public.lender_reconciliation_items where id = p_item_id for update;
  if target.id is null then raise exception 'Reconciliation item not found'; end if;
  if target.status <> 'unbilled' or target.invoice_id is not null or target.expected_amount <> 0 then
    raise exception 'Only an untouched unbilled custom payout can be valued manually';
  end if;
  select * into commercial from public.lender_commercial_versions where id = target.commercial_version_id;
  if commercial.id is null or commercial.payout_basis <> 'custom' then raise exception 'Manual payout is only valid for custom commercial terms'; end if;
  if not coalesce((commercial.tax_terms->>'reverseCharge')::boolean, false) then
    tax_rate := least(100, greatest(0, coalesce((commercial.tax_terms->>'ratePercent')::numeric, 0)));
  end if;
  update public.lender_reconciliation_items set expected_amount = round(p_amount, 2),
    tax_amount = round(p_amount * tax_rate / 100, 2), status = 'invoice_ready',
    variance_reason = btrim(p_reason), updated_by = p_user_id
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'commercials', 'set_manual_payout',
    'reconciliation_item', target.id::text, 'Custom commercial payout valued manually',
    jsonb_build_object('amount', target.expected_amount, 'taxAmount', target.tax_amount,
      'reason', btrim(p_reason), 'commercialVersionId', target.commercial_version_id,
      'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.set_manual_lender_payout(uuid, numeric, text, uuid) from public;
grant execute on function public.set_manual_lender_payout(uuid, numeric, text, uuid) to service_role;

create or replace function public.submit_lender_commercial(
  p_commercial_version_id uuid,
  p_maker_user_id uuid
)
returns public.lender_commercial_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_commercial_versions;
begin
  perform public.require_lender_intelligence_actor(p_maker_user_id);
  select * into target from public.lender_commercial_versions where id = p_commercial_version_id for update;
  if target.id is null then raise exception 'Commercial version not found'; end if;
  if target.status <> 'draft' then raise exception 'Only a draft commercial can be submitted'; end if;
  if length(btrim(coalesce(target.source_reference, ''))) < 3 then raise exception 'Commercial source reference is required'; end if;
  if target.payout_basis <> 'custom' and coalesce(target.payout_value, 0) <= 0 and jsonb_array_length(target.payout_slab) = 0 then
    raise exception 'Payout value or slab is required';
  end if;
  update public.lender_commercial_versions set status = 'in_review', submitted_by = p_maker_user_id,
    submitted_at = now(), rejected_by = null, rejected_at = null, rejection_note = null
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_maker_user_id, 'commercials', 'submit_commercial',
    'commercial_version', target.id::text, 'Commercial submitted for independent review',
    jsonb_build_object('lenderId', target.lender_id, 'programId', target.program_id,
      'version', target.version, 'payoutBasis', target.payout_basis,
      'sourceReference', target.source_reference, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.submit_lender_commercial(uuid, uuid) from public;
grant execute on function public.submit_lender_commercial(uuid, uuid) to service_role;

create or replace function public.reject_lender_commercial(
  p_commercial_version_id uuid,
  p_checker_user_id uuid,
  p_reason text
)
returns public.lender_commercial_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_commercial_versions;
begin
  perform public.require_lender_intelligence_actor(p_checker_user_id);
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'A detailed rejection reason is required'; end if;
  select * into target from public.lender_commercial_versions where id = p_commercial_version_id for update;
  if target.id is null then raise exception 'Commercial version not found'; end if;
  if target.status <> 'in_review' then raise exception 'Only an in-review commercial can be rejected'; end if;
  if coalesce(target.submitted_by, target.created_by) = p_checker_user_id then raise exception 'Maker and checker must be different admins'; end if;
  update public.lender_commercial_versions set status = 'rejected', rejected_by = p_checker_user_id,
    rejected_at = now(), rejection_note = btrim(p_reason)
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_checker_user_id, 'commercials', 'reject_commercial',
    'commercial_version', target.id::text, 'Commercial review rejected',
    jsonb_build_object('lenderId', target.lender_id, 'programId', target.program_id,
      'version', target.version, 'reason', target.rejection_note,
      'submittedBy', target.submitted_by, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.reject_lender_commercial(uuid, uuid, text) from public;
grant execute on function public.reject_lender_commercial(uuid, uuid, text) to service_role;

create or replace function public.activate_lender_commercial(
  p_commercial_version_id uuid,
  p_checker_user_id uuid,
  p_effective_from timestamptz default now()
)
returns public.lender_commercial_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_commercial_versions;
begin
  perform public.require_lender_intelligence_actor(p_checker_user_id);
  select * into target from public.lender_commercial_versions
  where id = p_commercial_version_id for update;
  if target.id is null then raise exception 'Commercial version not found'; end if;
  if target.status <> 'in_review' then raise exception 'Commercial must be in review before activation'; end if;
  if coalesce(target.submitted_by, target.created_by) is null or coalesce(target.submitted_by, target.created_by) = p_checker_user_id then
    raise exception 'Maker and checker must be different admins';
  end if;

  update public.lender_commercial_versions
  set status = 'expired', effective_to = p_effective_from - interval '1 millisecond'
  where partner_id is not distinct from target.partner_id
    and lender_id = target.lender_id
    and program_id is not distinct from target.program_id
    and status = 'active'
    and id <> target.id;

  update public.lender_commercial_versions
  set status = 'active', effective_from = p_effective_from, effective_to = null,
      approved_by = p_checker_user_id, approved_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_checker_user_id, 'commercials', 'activate_commercial',
    'commercial_version', target.id::text, 'Commercial approved and activated',
    jsonb_build_object('lenderId', target.lender_id, 'programId', target.program_id,
      'version', target.version, 'payoutBasis', target.payout_basis,
      'effectiveFrom', target.effective_from, 'submittedBy', target.submitted_by,
      'approvedAt', target.approved_at, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.activate_lender_commercial(uuid, uuid, timestamptz) from public;
grant execute on function public.activate_lender_commercial(uuid, uuid, timestamptz) to service_role;

drop function if exists public.record_lender_invoice_payment(uuid, numeric, text, uuid);
create or replace function public.record_lender_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_reference text,
  p_user_id uuid,
  p_idempotency_key text
)
returns public.lender_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_invoices;
  new_paid numeric(14,2);
  payment_id_value uuid;
  remaining_amount numeric(14,2);
  allocation_amount numeric(14,2);
  item_record record;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_amount <= 0 then raise exception 'Payment amount must be positive'; end if;
  if p_amount <> round(p_amount, 2) then raise exception 'Payment amount supports at most two decimal places'; end if;
  if length(btrim(coalesce(p_reference, ''))) not between 3 and 100 then raise exception 'Payment reference must be between 3 and 100 characters'; end if;
  if length(btrim(coalesce(p_idempotency_key, ''))) not between 8 and 200 then raise exception 'Valid payment idempotency key is required'; end if;
  select * into target from public.lender_invoices where id = p_invoice_id for update;
  if target.id is null then raise exception 'Invoice not found'; end if;
  if exists (select 1 from public.lender_invoice_payments where invoice_id = p_invoice_id and idempotency_key = p_idempotency_key) then
    if not exists (select 1 from public.lender_invoice_payments where invoice_id = p_invoice_id and idempotency_key = p_idempotency_key and amount = p_amount and reference = btrim(p_reference)) then
      raise exception 'Idempotency key was already used with different payment details';
    end if;
    return target;
  end if;
  if target.status not in ('raised', 'part_paid') then raise exception 'Only raised or part-paid invoices accept payment'; end if;
  if p_amount > target.total_amount - target.adjustment_amount - target.paid_amount then raise exception 'Payment exceeds outstanding invoice balance'; end if;
  new_paid := target.paid_amount + p_amount;

  insert into public.lender_invoice_payments (invoice_id, amount, reference, idempotency_key, recorded_by)
  values (p_invoice_id, p_amount, btrim(p_reference), btrim(p_idempotency_key), p_user_id)
  returning id into payment_id_value;

  remaining_amount := p_amount;
  for item_record in
    select item.id, item.invoiced_amount, item.received_amount
    from public.lender_reconciliation_items item
    where item.invoice_id = target.id
      and item.status in ('invoiced', 'part_paid')
      and item.received_amount < item.invoiced_amount
    order by item.id
    for update
  loop
    allocation_amount := least(remaining_amount, item_record.invoiced_amount - item_record.received_amount);
    if allocation_amount > 0 then
      insert into public.lender_invoice_payment_allocations (payment_id, reconciliation_item_id, amount)
      values (payment_id_value, item_record.id, allocation_amount);
      update public.lender_reconciliation_items
      set received_amount = received_amount + allocation_amount,
          status = case when received_amount + allocation_amount >= invoiced_amount then 'paid' else 'part_paid' end,
          settled_at = case when received_amount + allocation_amount >= invoiced_amount then now() else null end,
          updated_by = p_user_id
      where id = item_record.id;
      remaining_amount := remaining_amount - allocation_amount;
    end if;
    exit when remaining_amount = 0;
  end loop;
  if remaining_amount <> 0 then raise exception 'Payment cannot be fully allocated to invoice items'; end if;

  update public.lender_invoices
  set paid_amount = new_paid,
      status = case when new_paid + adjustment_amount >= total_amount then 'paid' else 'part_paid' end,
      paid_at = case when new_paid + adjustment_amount >= total_amount then now() else paid_at end,
      payment_reference = nullif(btrim(p_reference), ''),
      updated_by = p_user_id
  where id = target.id returning * into target;

  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'invoicing', 'record_payment', 'lender_invoice',
    target.id::text, 'Payment recorded for ' || target.invoice_number,
    jsonb_build_object('amount', p_amount, 'status', target.status,
      'referencePresent', true, 'idempotencyKey', btrim(p_idempotency_key),
      'paymentId', payment_id_value)
  );

  return target;
end;
$$;

revoke all on function public.record_lender_invoice_payment(uuid, numeric, text, uuid, text) from public;
grant execute on function public.record_lender_invoice_payment(uuid, numeric, text, uuid, text) to service_role;

create or replace function public.resolve_lender_reconciliation(
  p_item_id uuid,
  p_status text,
  p_received_amount numeric,
  p_reason text,
  p_user_id uuid
)
returns public.lender_reconciliation_items
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_reconciliation_items;
  invoice public.lender_invoices;
  write_off_amount numeric(14,2);
  new_adjustment numeric(14,2);
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_status not in ('disputed', 'invoiced', 'paid', 'written_off') then raise exception 'Invalid reconciliation status'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'A detailed reconciliation reason is required'; end if;
  select * into target from public.lender_reconciliation_items where id = p_item_id for update;
  if target.id is null then raise exception 'Reconciliation item not found'; end if;
  if target.status in ('paid', 'written_off') then raise exception 'Settled reconciliation item is immutable'; end if;

  if target.invoice_id is not null then
    select * into invoice from public.lender_invoices where id = target.invoice_id for update;
    if invoice.id is null then raise exception 'Linked invoice not found'; end if;
  end if;

  if p_status = 'disputed' then
    update public.lender_reconciliation_items set status = 'disputed', variance_reason = btrim(p_reason),
      settled_at = null, updated_by = p_user_id where id = target.id returning * into target;
    if invoice.id is not null and invoice.status <> 'paid' then
      update public.lender_invoices set status = 'disputed', updated_by = p_user_id where id = invoice.id;
    end if;
    perform public.register_lender_intelligence_audit(
      target.partner_id, p_user_id, 'invoicing', 'reconciliation_disputed',
      'reconciliation_item', target.id::text, 'Reconciliation item changed to disputed',
      jsonb_build_object('status', target.status, 'reason', btrim(p_reason),
        'invoiceId', target.invoice_id, 'expectedAmount', target.expected_amount,
        'invoicedAmount', target.invoiced_amount, 'receivedAmount', target.received_amount)
    );
    return target;
  end if;

  if p_status = 'paid' then
    if invoice.id is not null then raise exception 'Use invoice payment posting for invoiced reconciliation items'; end if;
    if p_received_amount <= 0 or p_received_amount > target.expected_amount then
      raise exception 'Received amount must be positive and cannot exceed expected amount';
    end if;
    update public.lender_reconciliation_items set status = 'paid', received_amount = p_received_amount,
      variance_reason = btrim(p_reason), settled_at = now(), updated_by = p_user_id
    where id = target.id returning * into target;
    perform public.register_lender_intelligence_audit(
      target.partner_id, p_user_id, 'invoicing', 'reconciliation_paid',
      'reconciliation_item', target.id::text, 'Reconciliation item changed to paid',
      jsonb_build_object('status', target.status, 'reason', btrim(p_reason),
        'invoiceId', target.invoice_id, 'expectedAmount', target.expected_amount,
        'invoicedAmount', target.invoiced_amount, 'receivedAmount', target.received_amount,
        'settledAt', target.settled_at)
    );
    return target;
  end if;

  if p_status = 'invoiced' then
    if invoice.id is null then raise exception 'Only an invoice-linked dispute can be restored'; end if;
    if target.status <> 'disputed' then raise exception 'Only a disputed reconciliation item can be restored'; end if;
    update public.lender_reconciliation_items set
      status = case when received_amount >= invoiced_amount and invoiced_amount > 0 then 'paid'
        when received_amount > 0 then 'part_paid' else 'invoiced' end,
      variance_reason = btrim(p_reason),
      settled_at = case when received_amount >= invoiced_amount and invoiced_amount > 0 then now() else null end,
      updated_by = p_user_id where id = target.id returning * into target;
    if not exists (select 1 from public.lender_reconciliation_items where invoice_id = invoice.id and status = 'disputed') then
      update public.lender_invoices set
        status = case when paid_amount + adjustment_amount >= total_amount then 'paid'
          when paid_amount > 0 then 'part_paid' else 'raised' end,
        paid_at = case when paid_amount + adjustment_amount >= total_amount then coalesce(paid_at, now()) else null end,
        updated_by = p_user_id where id = invoice.id;
    end if;
    perform public.register_lender_intelligence_audit(
      target.partner_id, p_user_id, 'invoicing', 'reconciliation_invoiced',
      'reconciliation_item', target.id::text, 'Reconciliation dispute restored to invoice lifecycle',
      jsonb_build_object('status', target.status, 'reason', btrim(p_reason),
        'invoiceId', target.invoice_id, 'expectedAmount', target.expected_amount,
        'invoicedAmount', target.invoiced_amount, 'receivedAmount', target.received_amount,
        'settledAt', target.settled_at)
    );
    return target;
  end if;

  if target.status <> 'disputed' then raise exception 'Only a disputed item can be written off'; end if;
  write_off_amount := greatest(0, (case when invoice.id is null then target.expected_amount else target.invoiced_amount end) - target.received_amount);
  if write_off_amount <= 0 then raise exception 'No outstanding amount remains to write off'; end if;
  if invoice.id is not null then
    new_adjustment := invoice.adjustment_amount + write_off_amount;
    if invoice.paid_amount + new_adjustment > invoice.total_amount then raise exception 'Write-off exceeds invoice outstanding balance'; end if;
    insert into public.lender_invoice_adjustments (
      invoice_id, reconciliation_item_id, adjustment_type, amount, reason, recorded_by
    ) values (invoice.id, target.id, 'write_off', write_off_amount, btrim(p_reason), p_user_id);
    update public.lender_invoices set adjustment_amount = new_adjustment,
      status = case when exists (
          select 1 from public.lender_reconciliation_items other
          where other.invoice_id = invoice.id and other.status = 'disputed' and other.id <> target.id
        ) then 'disputed'
        when paid_amount + new_adjustment >= total_amount then 'paid'
        when paid_amount > 0 then 'part_paid' else 'raised' end,
      paid_at = case when not exists (
          select 1 from public.lender_reconciliation_items other
          where other.invoice_id = invoice.id and other.status = 'disputed' and other.id <> target.id
        ) and paid_amount + new_adjustment >= total_amount then now() else paid_at end,
      updated_by = p_user_id where id = invoice.id;
  end if;
  update public.lender_reconciliation_items set status = 'written_off', variance_reason = btrim(p_reason),
    settled_at = now(), updated_by = p_user_id where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'invoicing', 'reconciliation_written_off',
    'reconciliation_item', target.id::text, 'Reconciliation item written off',
    jsonb_build_object('status', target.status, 'reason', btrim(p_reason),
      'invoiceId', target.invoice_id, 'expectedAmount', target.expected_amount,
      'invoicedAmount', target.invoiced_amount, 'receivedAmount', target.received_amount,
      'writeOffAmount', write_off_amount, 'settledAt', target.settled_at)
  );
  return target;
end;
$$;

revoke all on function public.resolve_lender_reconciliation(uuid, text, numeric, text, uuid) from public;
grant execute on function public.resolve_lender_reconciliation(uuid, text, numeric, text, uuid) to service_role;

create or replace function public.cancel_lender_invoice(
  p_invoice_id uuid,
  p_reason text,
  p_user_id uuid
)
returns public.lender_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_invoices;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'A detailed cancellation reason is required'; end if;
  select * into target from public.lender_invoices where id = p_invoice_id for update;
  if target.id is null then raise exception 'Invoice not found'; end if;
  if target.status not in ('draft', 'raised', 'disputed') then raise exception 'Only an unpaid draft, raised, or disputed invoice can be cancelled'; end if;
  if target.paid_amount > 0 or target.adjustment_amount > 0
    or exists (select 1 from public.lender_invoice_payments where invoice_id = target.id)
    or exists (select 1 from public.lender_invoice_adjustments where invoice_id = target.id) then
    raise exception 'Invoice with payments or adjustments cannot be cancelled';
  end if;
  update public.lender_reconciliation_items set invoice_id = null, invoiced_amount = 0,
    status = case when expected_amount > 0 then 'invoice_ready' else 'unbilled' end,
    variance_reason = null, updated_by = p_user_id
  where invoice_id = target.id;
  update public.lender_invoices set status = 'cancelled', notes = btrim(p_reason),
    updated_by = p_user_id where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'invoicing', 'cancel_invoice', 'lender_invoice',
    target.id::text, target.invoice_number || ' cancelled and items released',
    jsonb_build_object('invoiceNumber', target.invoice_number, 'reason', btrim(p_reason))
  );
  return target;
end;
$$;

revoke all on function public.cancel_lender_invoice(uuid, text, uuid) from public;
grant execute on function public.cancel_lender_invoice(uuid, text, uuid) to service_role;

create or replace function public.transition_lender_application(
  p_partner_id uuid,
  p_application_id text,
  p_expected_from_stage text,
  p_to_stage text,
  p_status_history jsonb,
  p_note text,
  p_reason_code text,
  p_rejection_reason text,
  p_sanctioned_amount numeric,
  p_disbursed_amount numeric,
  p_approved_roi numeric,
  p_approved_tenure_months integer,
  p_actor_user_id uuid,
  p_occurred_at timestamptz
)
returns public.crm_lender_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.crm_lender_applications;
  decision public.lender_routing_decisions;
  outcome_record public.lender_outcomes;
  approved_outcome public.lender_outcomes;
  commercial public.lender_commercial_versions;
  payout numeric(14,2) := 0;
  tax numeric(14,2) := 0;
  slab jsonb;
  allowed boolean := false;
  terminal_outcome text;
  canonical_rejection_code text;
begin
  perform public.require_lender_intelligence_actor(p_actor_user_id);
  if p_occurred_at is null or p_occurred_at > now() + interval '5 minutes' then
    raise exception 'Application event timestamp is invalid or too far in the future';
  end if;
  if p_status_history is not null and (
    jsonb_typeof(p_status_history) <> 'array'
    or octet_length(p_status_history::text) > 1048576
  ) then raise exception 'Application status history must be an array no larger than 1 MB'; end if;
  if length(coalesce(p_note, '')) > 2000
    or length(coalesce(p_reason_code, '')) > 50
    or length(coalesce(p_rejection_reason, '')) > 2000 then
    raise exception 'Application outcome text exceeds the allowed length';
  end if;
  if coalesce(p_sanctioned_amount, 0) < 0 or coalesce(p_sanctioned_amount, 0) > 1000000000000
    or coalesce(p_disbursed_amount, 0) < 0 or coalesce(p_disbursed_amount, 0) > 1000000000000 then
    raise exception 'Application outcome amount is outside the allowed range';
  end if;
  if round(coalesce(p_sanctioned_amount, 0), 2) <> coalesce(p_sanctioned_amount, 0)
    or round(coalesce(p_disbursed_amount, 0), 2) <> coalesce(p_disbursed_amount, 0) then
    raise exception 'Application outcome amounts cannot contain sub-paise precision';
  end if;
  if coalesce(p_approved_roi, 0) < 0 or coalesce(p_approved_roi, 0) > 100 then
    raise exception 'Approved ROI must be between 0 and 100';
  end if;
  if coalesce(p_approved_tenure_months, 0) < 0 or coalesce(p_approved_tenure_months, 0) > 1200 then
    raise exception 'Approved tenure must be between 0 and 1200 months';
  end if;
  select * into application from public.crm_lender_applications
  where id = p_application_id and partner_id = p_partner_id for update;
  if application.id is null then raise exception 'Application not found'; end if;
  if p_occurred_at < application.created_at then
    raise exception 'Application event cannot predate the application';
  end if;
  if application.status <> p_expected_from_stage then raise exception 'Application stage changed; refresh and retry'; end if;
  if p_to_stage not in ('case_sent_to_lender','login_pending','draft','submitted','under_review','credit_check','conditional_approval','final_approval','sanctioned','disbursal_initiated','rejected','rerouted','disbursed') then
    raise exception 'Invalid lender application stage';
  end if;
  if application.status in ('rejected','rerouted','disbursed') or application.status = p_to_stage then
    raise exception 'Terminal, duplicate, or invalid stage transition';
  end if;
  if p_to_stage in ('rejected','rerouted') then
    allowed := true;
  else
    allowed := array_position(array['case_sent_to_lender','login_pending','draft','submitted','under_review','credit_check','conditional_approval','final_approval','sanctioned','disbursal_initiated','disbursed'], p_to_stage)
      > array_position(array['case_sent_to_lender','login_pending','draft','submitted','under_review','credit_check','conditional_approval','final_approval','sanctioned','disbursal_initiated','disbursed'], application.status);
  end if;
  if not coalesce(allowed, false) then raise exception 'Backward lender application transition is not allowed'; end if;
  if p_to_stage = 'sanctioned' and coalesce(p_sanctioned_amount, 0) <= 0 then raise exception 'Sanctioned amount must be positive'; end if;
  if p_to_stage = 'sanctioned' and coalesce(p_approved_roi, 0) <= 0 then raise exception 'Sanctioned outcome requires a positive approved ROI'; end if;
  if p_to_stage = 'sanctioned' and coalesce(p_approved_tenure_months, 0) <= 0 then raise exception 'Sanctioned outcome requires a positive approved tenure'; end if;
  if p_to_stage = 'disbursed' and coalesce(p_disbursed_amount, 0) <= 0 then raise exception 'Disbursed amount must be positive'; end if;
  if p_to_stage = 'rejected' and (length(btrim(coalesce(p_reason_code, ''))) < 2 or length(btrim(coalesce(p_rejection_reason, ''))) < 3) then
    raise exception 'Rejection code and detail are required';
  end if;

  select * into decision from public.lender_routing_decisions
  where partner_id = p_partner_id and application_id = p_application_id
  order by decided_at desc limit 1;
  if decision.id is null or decision.selected_lender_id is null or decision.selected_program_id is null then
    raise exception 'A bound lender routing decision is required before application progression';
  end if;
  if p_to_stage = 'disbursed' then
    select * into approved_outcome
    from public.lender_outcomes
    where partner_id = p_partner_id
      and application_id = p_application_id
      and lender_id = decision.selected_lender_id
      and program_id = decision.selected_program_id
      and outcome = 'approved'
    order by decided_at desc nulls last, created_at desc
    limit 1;
    if approved_outcome.id is null then
      raise exception 'A canonical sanctioned outcome is required before disbursal';
    end if;
    if approved_outcome.approved_roi is null or approved_outcome.approved_tenure_months is null then
      raise exception 'Canonical sanction terms are incomplete';
    end if;
    if p_disbursed_amount > approved_outcome.sanctioned_amount then
      raise exception 'Disbursed amount cannot exceed the sanctioned amount';
    end if;
  end if;
  if p_to_stage = 'rejected' then
    select reason.code into canonical_rejection_code
    from public.lender_rejection_reasons reason
    where upper(reason.code) = upper(btrim(p_reason_code))
      and reason.active = true
      and (reason.partner_id = p_partner_id or reason.partner_id is null)
    order by (reason.partner_id = p_partner_id) desc
    limit 1;
    if canonical_rejection_code is null then raise exception 'An active canonical rejection reason is required'; end if;
  end if;

  perform set_config('app.li_governed_application_write', 'on', true);
  update public.crm_lender_applications set status = p_to_stage, status_history = coalesce(p_status_history, '[]'::jsonb),
    rejection_reason = case when p_to_stage = 'rejected' then p_rejection_reason else rejection_reason end,
    updated_by = p_actor_user_id, updated_at = p_occurred_at
  where id = application.id returning * into application;

  insert into public.application_stage_events (
    partner_id, application_id, lender_id, program_id, from_stage, to_stage,
    reason_code, note, source, occurred_at, actor_user_id
  ) values (
    p_partner_id, application.id, decision.selected_lender_id, decision.selected_program_id,
    p_expected_from_stage, p_to_stage,
    case when p_to_stage = 'rejected' then canonical_rejection_code else nullif(btrim(p_reason_code), '') end,
    nullif(btrim(p_note), ''),
    'manual', p_occurred_at, p_actor_user_id
  );

  terminal_outcome := case p_to_stage when 'sanctioned' then 'approved' when 'rejected' then 'rejected' when 'disbursed' then 'disbursed' end;
  if terminal_outcome is not null then
    insert into public.lender_outcomes (
      partner_id, application_id, lender_id, program_id, outcome, rejection_reason_code,
      rejection_reason_text, sanctioned_amount, disbursed_amount, approved_roi,
      approved_tenure_months, decided_at, disbursed_at, source, created_by
    ) values (
      p_partner_id, application.id, decision.selected_lender_id, decision.selected_program_id, terminal_outcome,
      case when terminal_outcome = 'rejected' then canonical_rejection_code end,
      case when terminal_outcome = 'rejected' then p_rejection_reason end,
      case
        when terminal_outcome = 'approved' then p_sanctioned_amount
        when terminal_outcome = 'disbursed' then approved_outcome.sanctioned_amount
      end,
      case when terminal_outcome = 'disbursed' then p_disbursed_amount end,
      case when terminal_outcome = 'disbursed' then approved_outcome.approved_roi else nullif(p_approved_roi, 0) end,
      case when terminal_outcome = 'disbursed' then approved_outcome.approved_tenure_months else nullif(p_approved_tenure_months, 0) end,
      case when terminal_outcome = 'disbursed' then null else p_occurred_at end,
      case when terminal_outcome = 'disbursed' then p_occurred_at end,
      'manual', p_actor_user_id
    ) on conflict (application_id, outcome) do nothing
    returning * into outcome_record;
    if outcome_record.id is null then raise exception 'Application outcome already exists and is immutable'; end if;
  end if;

  if terminal_outcome = 'disbursed' and decision.selected_lender_id is not null then
    select * into commercial from public.lender_commercial_versions
    where lender_id = decision.selected_lender_id
      and program_id is not distinct from decision.selected_program_id
      and (partner_id = p_partner_id or partner_id is null)
      and status = 'active' and effective_from <= p_occurred_at
      and (effective_to is null or effective_to > p_occurred_at)
    order by (partner_id = p_partner_id) desc, effective_from desc limit 1;
    if commercial.id is not null then
      if commercial.payout_basis = 'flat' then payout := greatest(0, coalesce(commercial.payout_value, 0));
      elsif commercial.payout_basis = 'percentage' then payout := greatest(0, p_disbursed_amount * coalesce(commercial.payout_value, 0) / 100);
      elsif commercial.payout_basis = 'slab' then
        select value into slab from jsonb_array_elements(commercial.payout_slab)
        where p_disbursed_amount >= coalesce((value->>'min')::numeric, 0)
          and ((value->>'max') is null or p_disbursed_amount <= (value->>'max')::numeric)
        order by coalesce((value->>'min')::numeric, 0) desc limit 1;
        if slab is not null then
          payout := case when slab->>'basis' = 'flat' then coalesce((slab->>'value')::numeric, 0)
            else p_disbursed_amount * coalesce((slab->>'value')::numeric, 0) / 100 end;
        end if;
      end if;
      payout := round(greatest(0, payout), 2);
      if not coalesce((commercial.tax_terms->>'reverseCharge')::boolean, false) then
        tax := round(payout * least(100, greatest(0, coalesce((commercial.tax_terms->>'ratePercent')::numeric, 0))) / 100, 2);
      end if;
      insert into public.lender_reconciliation_items (
        partner_id, application_id, outcome_id, commercial_version_id, expected_amount,
        tax_amount, status, variance_reason, created_by, updated_by
      ) values (
        p_partner_id, application.id, outcome_record.id, commercial.id, payout, tax,
        case when payout > 0 then 'invoice_ready' else 'unbilled' end,
        case when commercial.payout_basis = 'custom' then 'Custom payout requires reviewed manual valuation'
          when payout <= 0 then 'Commercial terms did not produce a payable amount' end,
        p_actor_user_id, p_actor_user_id
      ) on conflict (outcome_id) do update set commercial_version_id = excluded.commercial_version_id,
        expected_amount = excluded.expected_amount, tax_amount = excluded.tax_amount,
        status = case when lender_reconciliation_items.invoice_id is null then excluded.status else lender_reconciliation_items.status end,
        updated_by = excluded.updated_by;
    else
      insert into public.lender_reconciliation_items (
        partner_id, application_id, outcome_id, commercial_version_id, expected_amount,
        tax_amount, status, variance_reason, created_by, updated_by
      ) values (
        p_partner_id, application.id, outcome_record.id, null, 0, 0, 'unbilled',
        'No active commercial version covered the disbursal timestamp', p_actor_user_id, p_actor_user_id
      );
    end if;
  end if;
  perform public.register_lender_intelligence_audit(
    p_partner_id, p_actor_user_id, 'outcomes', 'application_transition',
    'lender_application', application.id::text,
    'Application changed from ' || p_expected_from_stage || ' to ' || p_to_stage,
    jsonb_build_object('routingDecisionId', decision.id, 'lenderId', decision.selected_lender_id,
      'programId', decision.selected_program_id, 'fromStage', p_expected_from_stage,
      'toStage', p_to_stage, 'reasonCode', case when p_to_stage = 'rejected'
        then canonical_rejection_code else nullif(btrim(p_reason_code), '') end,
      'note', nullif(btrim(p_note), ''), 'terminalOutcome', terminal_outcome,
      'outcomeId', outcome_record.id, 'sanctionedAmount', nullif(p_sanctioned_amount, 0),
      'disbursedAmount', nullif(p_disbursed_amount, 0), 'approvedRoi', nullif(p_approved_roi, 0),
      'approvedTenureMonths', nullif(p_approved_tenure_months, 0),
      'commercialVersionId', commercial.id, 'expectedPayout', payout,
      'taxAmount', tax, 'occurredAt', p_occurred_at)
  );
  return application;
end;
$$;

revoke all on function public.transition_lender_application(uuid, text, text, text, jsonb, text, text, text, numeric, numeric, numeric, integer, uuid, timestamptz) from public;
grant execute on function public.transition_lender_application(uuid, text, text, text, jsonb, text, text, text, numeric, numeric, numeric, integer, uuid, timestamptz) to service_role;

create or replace function public.replace_lender_policy_rules(
  p_policy_version_id uuid,
  p_rules jsonb,
  p_user_id uuid
)
returns setof public.lender_policy_rules
language plpgsql
security definer
set search_path = public
as $$
declare
  policy public.lender_policy_versions;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select * into policy from public.lender_policy_versions
  where id = p_policy_version_id for update;
  if policy.id is null then raise exception 'Policy version not found'; end if;
  if policy.status <> 'draft' then raise exception 'Only draft policy rules can be edited'; end if;
  if jsonb_typeof(p_rules) <> 'array' or jsonb_array_length(p_rules) = 0 then
    raise exception 'At least one policy rule is required';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_rules) rule
    where coalesce(rule->>'field_key','') not in ('score','loanAmount','monthlyIncome','tenure','foir','maxLoanAmount','loanType','state','city','employmentType','channel')
      or coalesce(rule->>'severity','') not in ('hard','soft','warning')
      or length(btrim(coalesce(rule->>'reason_code',''))) not between 2 and 50
      or length(btrim(coalesce(rule->>'reason_text',''))) < 5
      or coalesce((rule->>'weight')::numeric, 0) not between 0 and 100
      or (rule->>'field_key' in ('loanType','state','city','employmentType','channel') and coalesce(rule->>'operator','') not in ('eq','neq','in','not_in','exists','not_exists'))
      or (rule->>'field_key' in ('score','loanAmount','monthlyIncome','tenure','foir','maxLoanAmount') and coalesce(rule->>'operator','') not in ('eq','neq','gt','gte','lt','lte','between','in','not_in','exists','not_exists'))
  ) then raise exception 'Policy rules contain unsupported fields, operators, or evidence metadata'; end if;

  delete from public.lender_policy_rules where policy_version_id = p_policy_version_id;
  return query
  insert into public.lender_policy_rules (
    policy_version_id, rule_group, field_key, operator, comparison_value,
    severity, reason_code, reason_text, weight, priority, enabled, created_by
  )
  select
    p_policy_version_id,
    coalesce(nullif(btrim(rule_group), ''), 'base'),
    btrim(field_key),
    operator,
    comparison_value,
    coalesce(nullif(severity, ''), 'hard'),
    upper(btrim(reason_code)),
    btrim(reason_text),
    coalesce(weight, 0),
    coalesce(priority, 100),
    coalesce(enabled, true),
    p_user_id
  from jsonb_to_recordset(p_rules) as rule_data(
    rule_group text,
    field_key text,
    operator text,
    comparison_value jsonb,
    severity text,
    reason_code text,
    reason_text text,
    weight numeric,
    priority integer,
    enabled boolean
  )
  where btrim(field_key) <> '' and btrim(reason_code) <> '' and btrim(reason_text) <> ''
  returning *;

  if not found then raise exception 'No valid policy rules supplied'; end if;
  perform public.register_lender_intelligence_audit(
    null, p_user_id, 'policy', 'replace_policy_rules', 'policy_version', policy.id::text,
    jsonb_array_length(p_rules) || ' policy rules saved',
    jsonb_build_object('programId', policy.program_id, 'version', policy.version,
      'ruleCount', jsonb_array_length(p_rules), 'status', policy.status)
  );
end;
$$;

revoke all on function public.replace_lender_policy_rules(uuid, jsonb, uuid) from public;
grant execute on function public.replace_lender_policy_rules(uuid, jsonb, uuid) to service_role;

create or replace function public.refresh_lender_data_quality_issues()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  refreshed integer := 0;
  affected integer := 0;
begin
  update public.lender_data_quality_issues
  set status = 'resolved', resolved_at = now(), resolution_note = 'Automatically cleared by readiness scan'
  where source = 'system' and status = 'open';

  insert into public.lender_data_quality_issues (
    partner_id, lender_id, issue_type, severity, status, title, detail, fingerprint, source
  )
  select partner_id, id, 'lender_readiness', 'critical', 'open',
    'Active lender is not compliance-ready',
    'Active lender must have verified KYC and a signed, unexpired agreement.',
    'lender-readiness:' || id::text, 'system'
  from public.lender_master
  where onboarding_status = 'active'
    and (kyc_status <> 'verified' or agreement_status <> 'signed' or (agreement_expires_at is not null and agreement_expires_at <= now()))
  on conflict (fingerprint) do update set status = case when lender_data_quality_issues.status in ('in_progress', 'accepted') then lender_data_quality_issues.status else 'open' end,
    resolved_at = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolution_note else null end, updated_at = now();
  get diagnostics refreshed = row_count;

  insert into public.lender_data_quality_issues (
    partner_id, lender_id, program_id, issue_type, severity, status, title, detail, fingerprint, source
  )
  select program.partner_id, program.lender_id, program.id, 'missing_policy', 'critical', 'open',
    'Active program has no published policy',
    'Publish a reviewed, effective policy version before routing production cases.',
    'missing-policy:' || program.id::text, 'system'
  from public.lender_programs program
  where program.status = 'active' and not exists (
    select 1 from public.lender_policy_versions policy
    where policy.program_id = program.id and policy.status = 'published'
      and policy.effective_from <= now() and (policy.effective_to is null or policy.effective_to > now())
  )
  on conflict (fingerprint) do update set status = case when lender_data_quality_issues.status in ('in_progress', 'accepted') then lender_data_quality_issues.status else 'open' end,
    resolved_at = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolution_note else null end, updated_at = now();
  get diagnostics affected = row_count;
  refreshed := refreshed + affected;

  insert into public.lender_data_quality_issues (
    partner_id, lender_id, program_id, application_id, issue_type, severity, status,
    title, detail, fingerprint, source
  )
  select item.partner_id, outcome.lender_id, outcome.program_id, item.application_id,
    'payout_not_ready',
    case when item.commercial_version_id is null then 'critical' else 'warning' end,
    'open',
    case when item.commercial_version_id is null then 'Disbursal has no commercial coverage'
      else 'Disbursal payout requires finance valuation' end,
    coalesce(item.variance_reason, 'Resolve commercial terms and payout evidence before invoicing.'),
    'payout-not-ready:' || item.id::text, 'system'
  from public.lender_reconciliation_items item
  join public.lender_outcomes outcome on outcome.id = item.outcome_id and outcome.outcome = 'disbursed'
  where item.status = 'unbilled' and item.invoice_id is null and item.expected_amount = 0
  on conflict (fingerprint) do update set severity = excluded.severity, title = excluded.title,
    detail = excluded.detail,
    status = case when lender_data_quality_issues.status in ('in_progress', 'accepted') then lender_data_quality_issues.status else 'open' end,
    resolved_at = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolution_note else null end,
    updated_at = now();
  get diagnostics affected = row_count;
  refreshed := refreshed + affected;

  insert into public.lender_data_quality_issues (
    partner_id, lender_id, issue_type, severity, status, title, detail, due_at, fingerprint, source
  )
  select invoice.partner_id, invoice.lender_id, 'invoice_overdue',
    case when now() > invoice.due_at + interval '30 days' then 'critical' else 'warning' end,
    'open', 'Lender invoice is overdue',
    invoice.invoice_number || ' has ' ||
      (invoice.total_amount - invoice.adjustment_amount - invoice.paid_amount)::text ||
      ' outstanding since ' || to_char(invoice.due_at, 'DD Mon YYYY') || '.',
    invoice.due_at, 'invoice-overdue:' || invoice.id::text, 'system'
  from public.lender_invoices invoice
  where invoice.status in ('raised', 'part_paid', 'disputed')
    and invoice.due_at < now()
    and invoice.total_amount - invoice.adjustment_amount - invoice.paid_amount > 0
  on conflict (fingerprint) do update set severity = excluded.severity,
    status = case when lender_data_quality_issues.status in ('in_progress', 'accepted') then lender_data_quality_issues.status else 'open' end,
    detail = excluded.detail, due_at = excluded.due_at,
    resolved_at = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolution_note else null end,
    updated_at = now();
  get diagnostics affected = row_count;
  refreshed := refreshed + affected;

  insert into public.lender_data_quality_issues (
    lender_id, program_id, issue_type, severity, status, title, detail, fingerprint, source
  )
  select program.lender_id, program.id, 'policy_review_overdue', 'warning', 'open',
    'Published policy review is overdue',
    'Review the source policy and publish a current version.',
    'policy-overdue:' || policy.id::text, 'system'
  from public.lender_policy_versions policy
  join public.lender_programs program on program.id = policy.program_id
  where policy.status = 'published' and policy.review_due_at is not null and policy.review_due_at < now()
  on conflict (fingerprint) do update set status = case when lender_data_quality_issues.status in ('in_progress', 'accepted') then lender_data_quality_issues.status else 'open' end,
    resolved_at = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolution_note else null end, updated_at = now();
  get diagnostics affected = row_count;
  refreshed := refreshed + affected;

  insert into public.lender_data_quality_issues (
    lender_id, program_id, issue_type, severity, status, title, detail, due_at, fingerprint, source
  )
  select document.lender_id, document.program_id, 'document_expiry',
    case when document.expires_at <= now() then 'critical' else 'warning' end,
    'open', 'Lender document is expired or expiring',
    document.file_name || ' requires renewal.', document.expires_at,
    'document-expiry:' || document.id::text, 'system'
  from public.lender_policy_documents document
  where document.expires_at is not null and document.expires_at <= now() + interval '30 days'
  on conflict (fingerprint) do update set severity = excluded.severity,
    status = case when lender_data_quality_issues.status in ('in_progress', 'accepted') then lender_data_quality_issues.status else 'open' end,
    due_at = excluded.due_at, resolved_at = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolution_note else null end, updated_at = now();
  get diagnostics affected = row_count;
  refreshed := refreshed + affected;

  insert into public.lender_data_quality_issues (
    partner_id, lender_id, program_id, application_id, issue_type, severity, status,
    title, detail, due_at, fingerprint, source
  )
  select application.partner_id, decision.selected_lender_id, decision.selected_program_id,
    application.id, 'lender_tat_breach', 'warning', 'open',
    'Lender application TAT breached',
    'Application ' || application.id || ' is delayed at ' || replace(application.status, '_', ' ') || '.',
    coalesce(event.occurred_at, application.created_at) +
      make_interval(hours => case
        when application.status in ('case_sent_to_lender', 'login_pending', 'draft') then program.login_sla_hours
        when application.status in ('submitted', 'under_review', 'credit_check', 'conditional_approval', 'final_approval') then program.sanction_sla_hours
        else program.disbursal_sla_hours end),
    'tat-breach:' || application.id || ':' || application.status, 'system'
  from public.crm_lender_applications application
  join lateral (
    select selected_lender_id, selected_program_id
    from public.lender_routing_decisions
    where application_id = application.id
    order by decided_at desc limit 1
  ) decision on true
  join public.lender_programs program on program.id = decision.selected_program_id
  left join lateral (
    select occurred_at from public.application_stage_events
    where application_id = application.id order by occurred_at desc limit 1
  ) event on true
  where application.status not in ('rejected', 'rerouted', 'disbursed')
    and now() > coalesce(event.occurred_at, application.created_at) +
      make_interval(hours => case
        when application.status in ('case_sent_to_lender', 'login_pending', 'draft') then program.login_sla_hours
        when application.status in ('submitted', 'under_review', 'credit_check', 'conditional_approval', 'final_approval') then program.sanction_sla_hours
        else program.disbursal_sla_hours end)
  on conflict (fingerprint) do update set
    status = case when lender_data_quality_issues.status in ('in_progress', 'accepted') then lender_data_quality_issues.status else 'open' end,
    due_at = excluded.due_at, detail = excluded.detail,
    resolved_at = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note = case when lender_data_quality_issues.status = 'accepted' then lender_data_quality_issues.resolution_note else null end, updated_at = now();
  get diagnostics affected = row_count;
  refreshed := refreshed + affected;

  insert into public.notifications (user_id, type, title, message, metadata, deduplication_key)
  select application.created_by, 'lender_login_pending', 'Lender login SLA approaching',
    'Application ' || application.id || ' is still pending lender login with ' || application.lender_name || '.',
    jsonb_build_object('applicationId', application.id, 'lenderName', application.lender_name,
      'stage', application.status, 'route', '/crm/loan-application-tracking'),
    'lender-login-warning:' || application.id || ':' || application.status
  from public.crm_lender_applications application
  join lateral (
    select selected_program_id from public.lender_routing_decisions
    where application_id = application.id order by decided_at desc limit 1
  ) decision on true
  join public.lender_programs program on program.id = decision.selected_program_id
  left join lateral (
    select occurred_at from public.application_stage_events
    where application_id = application.id order by occurred_at desc limit 1
  ) event on true
  where application.created_by is not null
    and application.status in ('case_sent_to_lender', 'login_pending', 'draft')
    and now() >= coalesce(event.occurred_at, application.created_at) +
      make_interval(secs => (program.login_sla_hours * 3600 * 0.75)::integer)
    and now() < coalesce(event.occurred_at, application.created_at) + make_interval(hours => program.login_sla_hours)
  on conflict (user_id, deduplication_key) where deduplication_key is not null do nothing;

  insert into public.notifications (user_id, type, title, message, metadata, deduplication_key)
  select application.created_by, 'lender_tat_breach', 'Lender application SLA breached',
    'Application ' || application.id || ' has breached the ' || replace(application.status, '_', ' ') || ' SLA with ' || application.lender_name || '.',
    jsonb_build_object('applicationId', application.id, 'lenderName', application.lender_name,
      'stage', application.status, 'route', '/crm/loan-application-tracking'),
    'lender-tat-breach:' || application.id || ':' || application.status
  from public.crm_lender_applications application
  join lateral (
    select selected_program_id from public.lender_routing_decisions
    where application_id = application.id order by decided_at desc limit 1
  ) decision on true
  join public.lender_programs program on program.id = decision.selected_program_id
  left join lateral (
    select occurred_at from public.application_stage_events
    where application_id = application.id order by occurred_at desc limit 1
  ) event on true
  where application.created_by is not null
    and application.status not in ('rejected', 'rerouted', 'disbursed')
    and now() > coalesce(event.occurred_at, application.created_at) +
      make_interval(hours => case
        when application.status in ('case_sent_to_lender', 'login_pending', 'draft') then program.login_sla_hours
        when application.status in ('submitted', 'under_review', 'credit_check', 'conditional_approval', 'final_approval') then program.sanction_sla_hours
        else program.disbursal_sla_hours end)
  on conflict (user_id, deduplication_key) where deduplication_key is not null do nothing;

  insert into public.notifications (user_id, type, title, message, metadata, deduplication_key)
  select invoice.created_by, 'lender_invoice_overdue', 'Lender invoice overdue',
    invoice.invoice_number || ' is overdue with ' ||
      (invoice.total_amount - invoice.adjustment_amount - invoice.paid_amount)::text || ' outstanding.',
    jsonb_build_object('invoiceId', invoice.id, 'invoiceNumber', invoice.invoice_number,
      'lenderId', invoice.lender_id, 'dueAt', invoice.due_at,
      'outstandingAmount', invoice.total_amount - invoice.adjustment_amount - invoice.paid_amount,
      'route', '/admin-lender-intelligence/invoicing-compliance'),
    'lender-invoice-overdue:' || invoice.id::text
  from public.lender_invoices invoice
  where invoice.created_by is not null
    and invoice.status in ('raised', 'part_paid', 'disputed')
    and invoice.due_at < now()
    and invoice.total_amount - invoice.adjustment_amount - invoice.paid_amount > 0
  on conflict (user_id, deduplication_key) where deduplication_key is not null do nothing;

  return refreshed;
end;
$$;

revoke all on function public.refresh_lender_data_quality_issues() from public;
grant execute on function public.refresh_lender_data_quality_issues() to service_role;

create or replace function public.manage_lender_data_quality_issue(
  p_issue_id uuid,
  p_action text,
  p_note text,
  p_user_id uuid
)
returns public.lender_data_quality_issues
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_data_quality_issues;
  previous_status text;
  previous_owner_user_id uuid;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select * into target from public.lender_data_quality_issues where id = p_issue_id for update;
  if target.id is null then raise exception 'Compliance issue not found'; end if;
  previous_status := target.status;
  previous_owner_user_id := target.owner_user_id;
  if p_action = 'claim' then
    if target.status <> 'open' then raise exception 'Only an open issue can be claimed'; end if;
    update public.lender_data_quality_issues set status = 'in_progress', owner_user_id = p_user_id,
      resolution_note = null, resolved_at = null where id = target.id returning * into target;
  elsif p_action in ('resolve', 'accept') then
    if target.status not in ('open', 'in_progress') then raise exception 'Only an active issue can be closed'; end if;
    if length(btrim(coalesce(p_note, ''))) < (case when p_action = 'accept' then 10 else 5 end) then
      raise exception 'Detailed resolution or risk-acceptance evidence is required';
    end if;
    update public.lender_data_quality_issues set status = case when p_action = 'accept' then 'accepted' else 'resolved' end,
      owner_user_id = coalesce(owner_user_id, p_user_id), resolution_note = btrim(p_note), resolved_at = now()
    where id = target.id returning * into target;
  elsif p_action = 'reopen' then
    if target.status not in ('resolved', 'accepted') then raise exception 'Only a closed issue can be reopened'; end if;
    if length(btrim(coalesce(p_note, ''))) < 5 then raise exception 'Reopen reason is required'; end if;
    update public.lender_data_quality_issues set status = 'open', owner_user_id = null,
      resolution_note = 'Reopened: ' || btrim(p_note), resolved_at = null where id = target.id returning * into target;
  else
    raise exception 'Invalid compliance issue action';
  end if;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'compliance', 'data_quality_' || p_action,
    'data_quality_issue', target.id::text,
    'Compliance issue ' || case p_action
      when 'claim' then 'claimed' when 'resolve' then 'resolved'
      when 'accept' then 'risk accepted' else 'reopened' end,
    jsonb_build_object('issueType', target.issue_type, 'severity', target.severity,
      'previousStatus', previous_status, 'status', target.status,
      'previousOwnerUserId', previous_owner_user_id, 'ownerUserId', target.owner_user_id,
      'note', nullif(btrim(p_note), ''), 'resolutionNote', target.resolution_note,
      'resolvedAt', target.resolved_at)
  );
  return target;
end;
$$;

revoke all on function public.manage_lender_data_quality_issue(uuid, text, text, uuid) from public;
grant execute on function public.manage_lender_data_quality_issue(uuid, text, text, uuid) to service_role;

create or replace function public.get_lender_kpi_snapshot(
  p_cohort_start timestamptz,
  p_as_of timestamptz default now(),
  p_maturity_days integer default 30,
  p_min_sample integer default 20
)
returns jsonb
language sql
security definer
set search_path = public
as $$
with cohort as (
  select application.id, application.created_at,
    coalesce(min(event.occurred_at) filter (where event.to_stage in ('case_sent_to_lender', 'submitted')), application.created_at) as sent_at
  from public.crm_lender_applications application
  left join public.application_stage_events event on event.application_id = application.id
  where application.created_at >= p_cohort_start and application.created_at <= p_as_of
  group by application.id, application.created_at
), stage_flags as (
  select cohort.id, cohort.sent_at,
    bool_or(event.to_stage in ('submitted', 'under_review', 'credit_check', 'conditional_approval', 'final_approval', 'sanctioned', 'disbursal_initiated', 'disbursed')) as logged_in,
    min(event.occurred_at) filter (where event.to_stage = 'sanctioned') as sanctioned_at,
    min(event.occurred_at) filter (where event.to_stage = 'disbursed') as disbursed_at
  from cohort left join public.application_stage_events event on event.application_id = cohort.id
  group by cohort.id, cohort.sent_at
), outcome_flags as (
  select cohort.id,
    coalesce(bool_or(outcome.outcome = 'approved'), false) as approved,
    coalesce(bool_or(outcome.outcome = 'rejected'), false) as rejected,
    coalesce(bool_or(outcome.outcome = 'disbursed'), false) as disbursed
  from cohort left join public.lender_outcomes outcome on outcome.application_id = cohort.id and outcome.created_at <= p_as_of
  group by cohort.id
), application_facts as (
  select stage_flags.*, outcome_flags.approved, outcome_flags.rejected, outcome_flags.disbursed,
    (stage_flags.sent_at <= p_as_of - make_interval(days => greatest(p_maturity_days, 0))) as mature
  from stage_flags join outcome_flags using (id)
), counts as (
  select count(*)::integer as sent,
    count(*) filter (where logged_in)::integer as logged_in,
    count(*) filter (where approved)::integer as approved,
    count(*) filter (where rejected)::integer as rejected,
    count(*) filter (where approved or rejected)::integer as terminal,
    count(*) filter (where not approved and not rejected)::integer as pending,
    count(*) filter (where mature)::integer as mature,
    count(*) filter (where mature and disbursed)::integer as mature_disbursed
  from application_facts
), tat as (
  select
    count(sanctioned_at)::integer as sanction_n,
    percentile_cont(0.5) within group (order by extract(epoch from sanctioned_at - sent_at) / 3600) filter (where sanctioned_at is not null) as sanction_median,
    percentile_cont(0.75) within group (order by extract(epoch from sanctioned_at - sent_at) / 3600) filter (where sanctioned_at is not null) as sanction_p75,
    percentile_cont(0.9) within group (order by extract(epoch from sanctioned_at - sent_at) / 3600) filter (where sanctioned_at is not null) as sanction_p90,
    count(disbursed_at)::integer as disbursal_n,
    percentile_cont(0.5) within group (order by extract(epoch from disbursed_at - sent_at) / 3600) filter (where disbursed_at is not null) as disbursal_median,
    percentile_cont(0.75) within group (order by extract(epoch from disbursed_at - sent_at) / 3600) filter (where disbursed_at is not null) as disbursal_p75,
    percentile_cont(0.9) within group (order by extract(epoch from disbursed_at - sent_at) / 3600) filter (where disbursed_at is not null) as disbursal_p90
  from application_facts
), routing as (
  select count(*) filter (where decision_type in ('selected', 'override', 'exception'))::integer as selections,
    count(*) filter (where decision_type = 'override' or selected_rank > 1)::integer as overrides
  from public.lender_routing_decisions where decided_at >= p_cohort_start and decided_at <= p_as_of
), matching as (
  select count(*) filter (where status = 'completed')::integer as complete_reports,
    count(*) filter (where status = 'completed' and jsonb_typeof(matched_lenders) = 'array' and jsonb_array_length(matched_lenders) > 0)::integer as matched_reports
  from public.crm_eligibility_reports where created_at >= p_cohort_start and created_at <= p_as_of
), policy as (
  select count(*)::integer as active_programs,
    count(*) filter (where published.id is not null and published.review_due_at >= p_as_of)::integer as fresh_programs
  from public.lender_programs program
  left join lateral (
    select id, review_due_at from public.lender_policy_versions
    where program_id = program.id and status = 'published' and effective_from <= p_as_of
      and (effective_to is null or effective_to > p_as_of)
    order by version desc limit 1
  ) published on true where program.status = 'active'
)
select jsonb_build_object(
  'cohort', jsonb_build_object('from', p_cohort_start, 'to', p_as_of, 'maturityDays', greatest(p_maturity_days, 0), 'minimumSampleSize', greatest(p_min_sample, 1)),
  'pendingDecisions', counts.pending,
  'loginRate', jsonb_build_object('numerator', counts.logged_in, 'denominator', counts.sent, 'value', case when counts.sent >= p_min_sample then round(counts.logged_in * 100.0 / nullif(counts.sent, 0)) end, 'sufficientSample', counts.sent >= p_min_sample),
  'approvalRate', jsonb_build_object('numerator', counts.approved, 'denominator', counts.terminal, 'value', case when counts.terminal >= p_min_sample then round(counts.approved * 100.0 / nullif(counts.terminal, 0)) end, 'sufficientSample', counts.terminal >= p_min_sample),
  'rejectionRate', jsonb_build_object('numerator', counts.rejected, 'denominator', counts.terminal, 'value', case when counts.terminal >= p_min_sample then round(counts.rejected * 100.0 / nullif(counts.terminal, 0)) end, 'sufficientSample', counts.terminal >= p_min_sample),
  'disbursalRate', jsonb_build_object('numerator', counts.mature_disbursed, 'denominator', counts.mature, 'value', case when counts.mature >= p_min_sample then round(counts.mature_disbursed * 100.0 / nullif(counts.mature, 0)) end, 'sufficientSample', counts.mature >= p_min_sample),
  'overrideRate', jsonb_build_object('numerator', routing.overrides, 'denominator', routing.selections, 'value', case when routing.selections >= p_min_sample then round(routing.overrides * 100.0 / nullif(routing.selections, 0)) end, 'sufficientSample', routing.selections >= p_min_sample),
  'matchRate', jsonb_build_object('numerator', matching.matched_reports, 'denominator', matching.complete_reports, 'value', case when matching.complete_reports >= p_min_sample then round(matching.matched_reports * 100.0 / nullif(matching.complete_reports, 0)) end, 'sufficientSample', matching.complete_reports >= p_min_sample),
  'policyFreshness', jsonb_build_object('numerator', policy.fresh_programs, 'denominator', policy.active_programs, 'value', case when policy.active_programs > 0 then round(policy.fresh_programs * 100.0 / policy.active_programs) end, 'sufficientSample', policy.active_programs > 0),
  'sanctionTatHours', jsonb_build_object('sampleSize', tat.sanction_n, 'median', round(coalesce(tat.sanction_median, 0)::numeric, 1), 'p75', round(coalesce(tat.sanction_p75, 0)::numeric, 1), 'p90', round(coalesce(tat.sanction_p90, 0)::numeric, 1), 'sufficientSample', tat.sanction_n >= p_min_sample),
  'disbursalTatHours', jsonb_build_object('sampleSize', tat.disbursal_n, 'median', round(coalesce(tat.disbursal_median, 0)::numeric, 1), 'p75', round(coalesce(tat.disbursal_p75, 0)::numeric, 1), 'p90', round(coalesce(tat.disbursal_p90, 0)::numeric, 1), 'sufficientSample', tat.disbursal_n >= p_min_sample)
) from counts cross join tat cross join routing cross join matching cross join policy;
$$;

revoke all on function public.get_lender_kpi_snapshot(timestamptz, timestamptz, integer, integer) from public;
grant execute on function public.get_lender_kpi_snapshot(timestamptz, timestamptz, integer, integer) to service_role;

create or replace function public.get_lender_kpi_breakdown(
  p_cohort_start timestamptz,
  p_as_of timestamptz default now(),
  p_maturity_days integer default 30,
  p_min_sample integer default 20
)
returns jsonb
language sql
security definer
set search_path = public
as $$
with facts as (
  select application.id, application.partner_id, application.product,
    coalesce(decision.selected_lender_id::text, 'legacy:' || lower(application.lender_name)) as lender_key,
    coalesce(lender.display_name, application.lender_name, 'Unmapped lender') as lender_label,
    coalesce(decision.selected_program_id::text, 'unmapped') as program_key,
    coalesce(program.program_name, 'Unmapped program') as program_label,
    coalesce(partner.company_name, partner.name, 'Unscoped') as partner_label,
    coalesce(stage.sent_at, application.created_at) as sent_at,
    coalesce(stage.logged_in, false) as logged_in, stage.sanctioned_at, stage.disbursed_at,
    coalesce(outcome.approved, false) as approved, coalesce(outcome.rejected, false) as rejected,
    coalesce(outcome.disbursed, false) as disbursed
  from public.crm_lender_applications application
  left join lateral (
    select selected_lender_id, selected_program_id from public.lender_routing_decisions
    where application_id = application.id order by decided_at desc limit 1
  ) decision on true
  left join public.lender_master lender on lender.id = decision.selected_lender_id
  left join public.lender_programs program on program.id = decision.selected_program_id
  left join public.partners partner on partner.id = application.partner_id
  left join lateral (
    select min(occurred_at) filter (where to_stage in ('case_sent_to_lender', 'submitted')) as sent_at,
      bool_or(to_stage in ('submitted', 'under_review', 'credit_check', 'conditional_approval', 'final_approval', 'sanctioned', 'disbursal_initiated', 'disbursed')) as logged_in,
      min(occurred_at) filter (where to_stage = 'sanctioned') as sanctioned_at,
      min(occurred_at) filter (where to_stage = 'disbursed') as disbursed_at
    from public.application_stage_events where application_id = application.id
  ) stage on true
  left join lateral (
    select bool_or(outcome = 'approved') as approved, bool_or(outcome = 'rejected') as rejected,
      bool_or(outcome = 'disbursed') as disbursed
    from public.lender_outcomes where application_id = application.id and created_at <= p_as_of
  ) outcome on true
  where application.created_at >= p_cohort_start and application.created_at <= p_as_of
), dimension_facts as (
  select 'lender'::text as dimension, lender_key as dimension_id, lender_label as label, facts.* from facts
  union all select 'program', program_key, program_label, facts.* from facts
  union all select 'product', product, replace(initcap(replace(product, '_', ' ')), '_', ' '), facts.* from facts
  union all select 'partner', coalesce(partner_id::text, 'unscoped'), partner_label, facts.* from facts
), grouped as (
  select dimension, dimension_id, label, count(*)::integer as sent,
    count(*) filter (where logged_in)::integer as logged_in,
    count(*) filter (where approved or rejected)::integer as terminal,
    count(*) filter (where approved)::integer as approved,
    count(*) filter (where rejected)::integer as rejected,
    count(*) filter (where not approved and not rejected)::integer as pending,
    count(*) filter (where sent_at <= p_as_of - make_interval(days => greatest(p_maturity_days, 0)))::integer as mature,
    count(*) filter (where sent_at <= p_as_of - make_interval(days => greatest(p_maturity_days, 0)) and disbursed)::integer as mature_disbursed,
    count(sanctioned_at)::integer as sanction_n,
    (array_agg(id order by sent_at desc))[1:100] as application_ids,
    round(coalesce(percentile_cont(0.5) within group (order by extract(epoch from sanctioned_at - sent_at) / 3600) filter (where sanctioned_at is not null), 0)::numeric, 1) as sanction_median,
    round(coalesce(percentile_cont(0.9) within group (order by extract(epoch from sanctioned_at - sent_at) / 3600) filter (where sanctioned_at is not null), 0)::numeric, 1) as sanction_p90,
    count(disbursed_at)::integer as disbursal_n,
    round(coalesce(percentile_cont(0.5) within group (order by extract(epoch from disbursed_at - sent_at) / 3600) filter (where disbursed_at is not null), 0)::numeric, 1) as disbursal_median,
    round(coalesce(percentile_cont(0.9) within group (order by extract(epoch from disbursed_at - sent_at) / 3600) filter (where disbursed_at is not null), 0)::numeric, 1) as disbursal_p90
  from dimension_facts group by dimension, dimension_id, label
)
select coalesce(jsonb_agg(jsonb_build_object(
  'dimension', dimension, 'dimensionId', dimension_id, 'label', label,
  'sentFiles', sent, 'pendingFiles', pending,
  'applicationIds', to_jsonb(application_ids),
  'loginRate', jsonb_build_object('numerator', logged_in, 'denominator', sent, 'value', case when sent >= p_min_sample then round(logged_in * 100.0 / nullif(sent, 0)) end, 'sufficientSample', sent >= p_min_sample),
  'approvalRate', jsonb_build_object('numerator', approved, 'denominator', terminal, 'value', case when terminal >= p_min_sample then round(approved * 100.0 / nullif(terminal, 0)) end, 'sufficientSample', terminal >= p_min_sample),
  'rejectionRate', jsonb_build_object('numerator', rejected, 'denominator', terminal, 'value', case when terminal >= p_min_sample then round(rejected * 100.0 / nullif(terminal, 0)) end, 'sufficientSample', terminal >= p_min_sample),
  'disbursalRate', jsonb_build_object('numerator', mature_disbursed, 'denominator', mature, 'value', case when mature >= p_min_sample then round(mature_disbursed * 100.0 / nullif(mature, 0)) end, 'sufficientSample', mature >= p_min_sample),
  'sanctionTatHours', jsonb_build_object('sampleSize', sanction_n, 'median', sanction_median, 'p90', sanction_p90, 'sufficientSample', sanction_n >= p_min_sample),
  'disbursalTatHours', jsonb_build_object('sampleSize', disbursal_n, 'median', disbursal_median, 'p90', disbursal_p90, 'sufficientSample', disbursal_n >= p_min_sample),
  'applicationFilter', jsonb_build_object('dimension', dimension, 'value', dimension_id)
) order by dimension, sent desc, label), '[]'::jsonb) from grouped;
$$;

revoke all on function public.get_lender_kpi_breakdown(timestamptz, timestamptz, integer, integer) from public;
grant execute on function public.get_lender_kpi_breakdown(timestamptz, timestamptz, integer, integer) to service_role;

create or replace function public.get_lender_profile_performance(
  p_cohort_start timestamptz,
  p_as_of timestamptz default now(),
  p_min_sample integer default 20
)
returns jsonb
language sql
security definer
set search_path = public
as $$
with decisions as (
  select distinct on (decision.application_id)
    decision.application_id, decision.input_snapshot, decision.decision_type, decision.selected_rank
  from public.lender_routing_decisions decision
  where decision.application_id is not null
    and decision.decided_at >= p_cohort_start and decision.decided_at <= p_as_of
  order by decision.application_id, decision.decided_at desc
), facts as (
  select decision.application_id,
    case when decision.input_snapshot->>'score' ~ '^\d+(\.\d+)?$'
      then (decision.input_snapshot->>'score')::numeric end as score,
    case when decision.input_snapshot->>'monthlyIncome' ~ '^\d+(\.\d+)?$'
      then (decision.input_snapshot->>'monthlyIncome')::numeric end as monthly_income,
    case when decision.input_snapshot->>'loanAmount' ~ '^\d+(\.\d+)?$'
      then (decision.input_snapshot->>'loanAmount')::numeric end as loan_amount,
    lower(btrim(coalesce(decision.input_snapshot->>'employmentType', ''))) as employment_type,
    decision.decision_type = 'override' or coalesce(decision.selected_rank, 0) > 1 as overridden,
    coalesce(outcome.approved, false) as approved,
    coalesce(outcome.rejected, false) as rejected,
    coalesce(outcome.disbursed, false) as disbursed
  from decisions decision
  left join lateral (
    select bool_or(item.outcome = 'approved') as approved,
      bool_or(item.outcome = 'rejected') as rejected,
      bool_or(item.outcome = 'disbursed') as disbursed
    from public.lender_outcomes item
    where item.application_id = decision.application_id and item.created_at <= p_as_of
  ) outcome on true
), segmented as (
  select 'score_band'::text as dimension,
    case when score is null then 'unknown' when score < 650 then 'below_650'
      when score < 700 then '650_699' when score < 750 then '700_749' else '750_plus' end as segment_id,
    case when score is null then 'Score unavailable' when score < 650 then 'Below 650'
      when score < 700 then '650–699' when score < 750 then '700–749' else '750+' end as label, facts.* from facts
  union all select 'income_band',
    case when monthly_income is null then 'unknown' when monthly_income < 25000 then 'below_25k'
      when monthly_income < 50000 then '25k_50k' when monthly_income < 100000 then '50k_100k' else '100k_plus' end,
    case when monthly_income is null then 'Income unavailable' when monthly_income < 25000 then 'Below ₹25k'
      when monthly_income < 50000 then '₹25k–₹50k' when monthly_income < 100000 then '₹50k–₹1L' else '₹1L+' end, facts.* from facts
  union all select 'loan_band',
    case when loan_amount is null then 'unknown' when loan_amount < 200000 then 'below_2l'
      when loan_amount < 500000 then '2l_5l' when loan_amount < 1000000 then '5l_10l' else '10l_plus' end,
    case when loan_amount is null then 'Loan unavailable' when loan_amount < 200000 then 'Below ₹2L'
      when loan_amount < 500000 then '₹2L–₹5L' when loan_amount < 1000000 then '₹5L–₹10L' else '₹10L+' end, facts.* from facts
  union all select 'employment',
    case when employment_type in ('salaried','salary') then 'salaried'
      when employment_type in ('self_employed','self-employed','business','professional') then 'self_employed'
      when employment_type = '' then 'unknown' else 'other' end,
    case when employment_type in ('salaried','salary') then 'Salaried'
      when employment_type in ('self_employed','self-employed','business','professional') then 'Self-employed'
      when employment_type = '' then 'Employment unavailable' else 'Other' end, facts.* from facts
), grouped as (
  select dimension, segment_id, label, count(*)::integer as sample_size,
    count(*) filter (where approved or rejected)::integer as terminal,
    count(*) filter (where approved)::integer as approved,
    count(*) filter (where rejected)::integer as rejected,
    count(*) filter (where disbursed)::integer as disbursed,
    count(*) filter (where overridden)::integer as overrides,
    (array_agg(application_id order by application_id))[1:100] as application_ids
  from segmented group by dimension, segment_id, label
)
select jsonb_build_object(
  'cohort', jsonb_build_object('from', p_cohort_start, 'to', p_as_of,
    'minimumSampleSize', greatest(p_min_sample, 1), 'modelVersion', null,
    'mode', 'descriptive_only', 'fallback', 'deterministic_policy_routing'),
  'rows', coalesce(jsonb_agg(jsonb_build_object(
    'dimension', dimension, 'segmentId', segment_id, 'label', label,
    'sampleSize', sample_size, 'terminalDecisions', terminal,
    'applicationIds', to_jsonb(application_ids),
    'approvalRate', jsonb_build_object('numerator', approved, 'denominator', terminal,
      'value', case when terminal >= greatest(p_min_sample, 1) then round(approved * 100.0 / nullif(terminal, 0)) end,
      'sufficientSample', terminal >= greatest(p_min_sample, 1)),
    'rejectionRate', jsonb_build_object('numerator', rejected, 'denominator', terminal,
      'value', case when terminal >= greatest(p_min_sample, 1) then round(rejected * 100.0 / nullif(terminal, 0)) end,
      'sufficientSample', terminal >= greatest(p_min_sample, 1)),
    'disbursedFiles', disbursed,
    'overrideRate', jsonb_build_object('numerator', overrides, 'denominator', sample_size,
      'value', case when sample_size >= greatest(p_min_sample, 1) then round(overrides * 100.0 / nullif(sample_size, 0)) end,
      'sufficientSample', sample_size >= greatest(p_min_sample, 1))
  ) order by dimension, segment_id), '[]'::jsonb)
) from grouped;
$$;

revoke all on function public.get_lender_profile_performance(timestamptz, timestamptz, integer) from public;
grant execute on function public.get_lender_profile_performance(timestamptz, timestamptz, integer) to service_role;

create or replace function public.set_lender_operating_status(
  p_lender_id uuid,
  p_status text,
  p_user_id uuid
)
returns public.lender_master
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_master;
  open_files integer;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_status not in ('active', 'paused', 'offboarded') then raise exception 'Invalid lender operating status'; end if;
  select * into target from public.lender_master where id = p_lender_id for update;
  if target.id is null then raise exception 'Lender not found'; end if;
  if target.onboarding_status = 'offboarded' and p_status <> 'offboarded' then
    raise exception 'An offboarded lender cannot be reactivated';
  end if;
  if p_status = 'active' and (
    target.kyc_status <> 'verified' or target.agreement_status <> 'signed' or
    (target.agreement_expires_at is not null and target.agreement_expires_at <= now()) or
    target.finance_email is null or target.billing_address is null or target.gstin is null
  ) then raise exception 'Lender is not compliance-ready'; end if;
  if p_status = 'offboarded' then
    select count(*) into open_files from public.crm_lender_applications
    where lower(lender_name) = lower(target.display_name)
      and status not in ('rejected', 'rerouted', 'disbursed');
    if open_files > 0 then raise exception 'Resolve or transfer active lender files before offboarding'; end if;
  end if;
  if p_status in ('paused', 'offboarded') then
    update public.lender_programs set
      capacity_status = 'paused',
      status = case when p_status = 'offboarded' then 'retired' when status = 'active' then 'paused' else status end,
      updated_by = p_user_id
    where lender_id = p_lender_id;
  end if;
  update public.lender_master set onboarding_status = p_status, updated_by = p_user_id
  where id = p_lender_id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'onboarding', 'set_lender_' || p_status,
    'lender', target.id::text, 'Lender operating status changed to ' || p_status,
    jsonb_build_object('lenderCode', target.lender_code, 'status', target.onboarding_status,
      'kycStatus', target.kyc_status, 'agreementStatus', target.agreement_status,
      'agreementExpiresAt', target.agreement_expires_at, 'affectedOpenFiles', open_files)
  );
  return target;
end;
$$;

revoke all on function public.set_lender_operating_status(uuid, text, uuid) from public;
grant execute on function public.set_lender_operating_status(uuid, text, uuid) to service_role;

create or replace function public.create_lender_policy_restoration(
  p_source_policy_version_id uuid,
  p_reason text,
  p_maker_user_id uuid
)
returns public.lender_policy_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  source_policy public.lender_policy_versions;
  restored_policy public.lender_policy_versions;
  next_version integer;
  copied_rule_count integer;
begin
  perform public.require_lender_intelligence_actor(p_maker_user_id);
  if length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A meaningful restoration reason is required';
  end if;
  select * into source_policy from public.lender_policy_versions
  where id = p_source_policy_version_id for update;
  if source_policy.id is null then raise exception 'Source policy version not found'; end if;
  if source_policy.status <> 'retired' then
    raise exception 'Only a previously published retired policy can be restored';
  end if;

  perform 1 from public.lender_programs where id = source_policy.program_id for update;
  if exists (
    select 1 from public.lender_policy_versions
    where program_id = source_policy.program_id and status in ('draft', 'in_review')
  ) then raise exception 'Resolve the existing draft or in-review policy before restoration'; end if;
  if not exists (
    select 1 from public.lender_policy_rules where policy_version_id = source_policy.id
  ) then raise exception 'Source policy has no rules to restore'; end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.lender_policy_versions where program_id = source_policy.program_id;
  insert into public.lender_policy_versions (
    program_id, version, status, source_type, source_reference, source_checksum,
    change_summary, review_due_at, created_by
  ) values (
    source_policy.program_id, next_version, 'draft', source_policy.source_type,
    source_policy.source_reference, source_policy.source_checksum,
    format('Restoration draft from policy v%s: %s', source_policy.version, btrim(p_reason)),
    now() + interval '90 days', p_maker_user_id
  ) returning * into restored_policy;

  insert into public.lender_policy_rules (
    policy_version_id, rule_group, field_key, operator, comparison_value, severity,
    reason_code, reason_text, weight, priority, enabled, created_by
  )
  select restored_policy.id, rule_group, field_key, operator, comparison_value, severity,
    reason_code, reason_text, weight, priority, enabled, p_maker_user_id
  from public.lender_policy_rules where policy_version_id = source_policy.id;

  get diagnostics copied_rule_count = row_count;
  perform public.register_lender_intelligence_audit(
    null, p_maker_user_id, 'policy', 'create_policy_restoration', 'policy_version',
    restored_policy.id::text, 'Policy restoration draft version ' || restored_policy.version || ' created',
    jsonb_build_object('programId', restored_policy.program_id,
      'sourcePolicyVersionId', source_policy.id, 'sourceVersion', source_policy.version,
      'restoredVersion', restored_policy.version, 'restorationReason', btrim(p_reason),
      'copiedRuleCount', copied_rule_count, 'sourceChecksum', restored_policy.source_checksum,
      'status', restored_policy.status)
  );

  return restored_policy;
end;
$$;

revoke all on function public.create_lender_policy_restoration(uuid, text, uuid) from public;
grant execute on function public.create_lender_policy_restoration(uuid, text, uuid) to service_role;

create or replace function public.reject_lender_policy(
  p_policy_version_id uuid,
  p_reason text,
  p_checker_user_id uuid
)
returns public.lender_policy_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_policy_versions;
begin
  perform public.require_lender_intelligence_actor(p_checker_user_id);
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'A meaningful rejection reason is required'; end if;
  select * into target from public.lender_policy_versions where id = p_policy_version_id for update;
  if target.id is null then raise exception 'Policy version not found'; end if;
  if target.status <> 'in_review' then raise exception 'Only an in-review policy can be rejected'; end if;
  if target.submitted_by is null or target.submitted_by = p_checker_user_id then
    raise exception 'Maker and checker must be different admins';
  end if;
  update public.lender_policy_versions set
    status = 'rejected', rejected_by = p_checker_user_id, rejected_at = now(), rejection_note = btrim(p_reason)
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    null, p_checker_user_id, 'policy', 'reject_policy', 'policy_version', target.id::text,
    'Policy version ' || target.version || ' rejected by checker',
    jsonb_build_object('programId', target.program_id, 'version', target.version,
      'reason', target.rejection_note, 'submittedBy', target.submitted_by,
      'rejectedAt', target.rejected_at, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.reject_lender_policy(uuid, text, uuid) from public;
grant execute on function public.reject_lender_policy(uuid, text, uuid) to service_role;

create or replace function public.publish_lender_policy(
  p_policy_version_id uuid,
  p_checker_user_id uuid,
  p_effective_from timestamptz default now()
)
returns public.lender_policy_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_policy_versions;
begin
  perform public.require_lender_intelligence_actor(p_checker_user_id);
  select * into target
  from public.lender_policy_versions
  where id = p_policy_version_id
  for update;

  if target.id is null then
    raise exception 'Policy version not found';
  end if;
  if target.status <> 'in_review' then
    raise exception 'Policy must be in review before publishing';
  end if;
  if target.submitted_by is null or target.submitted_by = p_checker_user_id then
    raise exception 'Maker and checker must be different admins';
  end if;
  if target.source_reference is null or btrim(target.source_reference) = '' then
    raise exception 'Policy source reference is required';
  end if;
  if target.source_type = 'lender_document' and (target.source_checksum is null or not exists (
    select 1 from public.lender_policy_documents document
    where document.policy_version_id = target.id
      and document.review_status = 'verified'
      and document.checksum = target.source_checksum
      and (document.expires_at is null or document.expires_at > p_effective_from)
  )) then
    raise exception 'A current independently verified source document is required';
  end if;
  if target.review_due_at is null or target.review_due_at <= p_effective_from then
    raise exception 'Policy review due date must be after the effective date';
  end if;
  if not exists (
    select 1 from public.lender_policy_rules where policy_version_id = target.id and enabled
  ) then
    raise exception 'At least one enabled policy rule is required';
  end if;
  if exists (
    select 1 from public.lender_policy_rules rule
    where rule.policy_version_id = target.id and rule.enabled and (
      rule.field_key not in ('score','loanAmount','monthlyIncome','tenure','foir','maxLoanAmount','loanType','state','city','employmentType','channel')
      or rule.weight not between 0 and 100
      or length(btrim(rule.reason_code)) not between 2 and 50
      or length(btrim(rule.reason_text)) < 5
      or (rule.field_key in ('loanType','state','city','employmentType','channel') and rule.operator not in ('eq','neq','in','not_in','exists','not_exists'))
      or (rule.field_key in ('score','loanAmount','monthlyIncome','tenure','foir','maxLoanAmount') and rule.operator not in ('eq','neq','gt','gte','lt','lte','between','in','not_in','exists','not_exists'))
    )
  ) then raise exception 'Policy contains unsupported fields, operators, or evidence metadata'; end if;

  update public.lender_policy_versions
  set status = 'retired', effective_to = p_effective_from - interval '1 millisecond'
  where program_id = target.program_id and status = 'published' and id <> target.id;

  update public.lender_policy_versions
  set status = 'published',
      effective_from = p_effective_from,
      effective_to = null,
      approved_by = p_checker_user_id,
      approved_at = now()
  where id = target.id
  returning * into target;

  perform public.register_lender_intelligence_audit(
    null, p_checker_user_id, 'policy', 'publish_policy', 'policy_version', target.id::text,
    'Policy approved and published',
    jsonb_build_object('programId', target.program_id, 'version', target.version,
      'sourceType', target.source_type, 'sourceReference', target.source_reference,
      'sourceChecksum', target.source_checksum, 'effectiveFrom', target.effective_from,
      'reviewDueAt', target.review_due_at, 'submittedBy', target.submitted_by,
      'approvedAt', target.approved_at, 'status', target.status)
  );

  return target;
end;
$$;

revoke all on function public.publish_lender_policy(uuid, uuid, timestamptz) from public;
grant execute on function public.publish_lender_policy(uuid, uuid, timestamptz) to service_role;

alter table public.lender_master enable row level security;
alter table public.lender_programs enable row level security;
alter table public.lender_policy_versions enable row level security;
alter table public.lender_policy_rules enable row level security;
alter table public.lender_policy_documents enable row level security;
alter table public.lender_routing_decisions enable row level security;
alter table public.lender_routing_exceptions enable row level security;
alter table public.application_stage_events enable row level security;
alter table public.lender_outcomes enable row level security;
alter table public.lender_rejection_reasons enable row level security;
alter table public.lender_commercial_versions enable row level security;
alter table public.lender_invoices enable row level security;
alter table public.lender_invoice_sequences enable row level security;
alter table public.lender_invoice_payments enable row level security;
alter table public.lender_invoice_payment_allocations enable row level security;
alter table public.lender_invoice_adjustments enable row level security;
alter table public.lender_clawbacks enable row level security;
alter table public.lender_reconciliation_items enable row level security;
alter table public.lender_data_quality_issues enable row level security;
alter table public.lender_intelligence_audit_logs enable row level security;

-- Application access goes through authenticated server routes. Service-role
-- policies make that boundary explicit and keep direct anonymous access closed.
create policy "service_manage_lender_master" on public.lender_master for all to service_role using (true) with check (true);
create policy "service_manage_lender_programs" on public.lender_programs for all to service_role using (true) with check (true);
create policy "service_manage_lender_policy_versions" on public.lender_policy_versions for all to service_role using (true) with check (true);
create policy "service_manage_lender_policy_rules" on public.lender_policy_rules for all to service_role using (true) with check (true);
create policy "service_manage_lender_policy_documents" on public.lender_policy_documents for all to service_role using (true) with check (true);
create policy "service_manage_lender_routing_decisions" on public.lender_routing_decisions for all to service_role using (true) with check (true);
create policy "service_manage_lender_routing_exceptions" on public.lender_routing_exceptions for all to service_role using (true) with check (true);
create policy "service_manage_application_stage_events" on public.application_stage_events for all to service_role using (true) with check (true);
create policy "service_manage_lender_outcomes" on public.lender_outcomes for all to service_role using (true) with check (true);
create policy "service_manage_lender_rejection_reasons" on public.lender_rejection_reasons for all to service_role using (true) with check (true);
create policy "service_manage_lender_commercial_versions" on public.lender_commercial_versions for all to service_role using (true) with check (true);
create policy "service_manage_lender_invoices" on public.lender_invoices for all to service_role using (true) with check (true);
create policy "service_manage_lender_invoice_sequences" on public.lender_invoice_sequences for all to service_role using (true) with check (true);
create policy "service_manage_lender_invoice_payments" on public.lender_invoice_payments for all to service_role using (true) with check (true);
create policy "service_manage_lender_invoice_payment_allocations" on public.lender_invoice_payment_allocations for all to service_role using (true) with check (true);
create policy "service_manage_lender_invoice_adjustments" on public.lender_invoice_adjustments for all to service_role using (true) with check (true);
create policy "service_manage_lender_clawbacks" on public.lender_clawbacks for all to service_role using (true) with check (true);
create policy "service_manage_lender_reconciliation_items" on public.lender_reconciliation_items for all to service_role using (true) with check (true);
create policy "service_manage_lender_data_quality_issues" on public.lender_data_quality_issues for all to service_role using (true) with check (true);
create policy "service_manage_lender_intelligence_audit_logs" on public.lender_intelligence_audit_logs for all to service_role using (true) with check (true);

create or replace function public.prevent_lender_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Lender intelligence audit logs are append-only';
end;
$$;

drop trigger if exists prevent_lender_audit_update_delete on public.lender_intelligence_audit_logs;
create trigger prevent_lender_audit_update_delete
before update or delete on public.lender_intelligence_audit_logs
for each row execute function public.prevent_lender_audit_mutation();

drop trigger if exists prevent_lender_payment_update_delete on public.lender_invoice_payments;
create trigger prevent_lender_payment_update_delete
before update or delete on public.lender_invoice_payments
for each row execute function public.prevent_lender_audit_mutation();

drop trigger if exists prevent_lender_adjustment_update_delete on public.lender_invoice_adjustments;
create trigger prevent_lender_adjustment_update_delete
before update or delete on public.lender_invoice_adjustments
for each row execute function public.prevent_lender_audit_mutation();

drop trigger if exists prevent_lender_clawback_delete on public.lender_clawbacks;
create trigger prevent_lender_clawback_delete
before delete on public.lender_clawbacks
for each row execute function public.prevent_lender_audit_mutation();

create or replace function public.enforce_lender_clawback_transition()
returns trigger language plpgsql as $$
begin
  if new.partner_id is distinct from old.partner_id
    or new.reconciliation_item_id is distinct from old.reconciliation_item_id
    or new.commercial_version_id is distinct from old.commercial_version_id
    or new.application_id is distinct from old.application_id
    or new.amount is distinct from old.amount
    or new.trigger_code is distinct from old.trigger_code
    or new.trigger_note is distinct from old.trigger_note
    or new.triggered_at is distinct from old.triggered_at
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Clawback source and amount are immutable';
  end if;
  if old.status <> 'open' or new.status not in ('recovered', 'waived') then
    raise exception 'Only an open clawback can be resolved';
  end if;
  if length(btrim(coalesce(new.resolution_note, ''))) < 5 or new.resolved_by is null or new.resolved_at is null then
    raise exception 'Clawback resolution evidence, actor, and timestamp are required';
  end if;
  if new.status = 'recovered' and (
    new.recovered_amount is distinct from new.amount
    or length(btrim(coalesce(new.recovery_reference, ''))) not between 3 and 100
  ) then raise exception 'Recovered clawback requires exact amount and payment reference'; end if;
  if new.status = 'waived' and (new.recovered_amount is not null or new.recovery_reference is not null) then
    raise exception 'Waived clawback cannot carry recovery receipt evidence';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_lender_clawback_update on public.lender_clawbacks;
create trigger enforce_lender_clawback_update
before update on public.lender_clawbacks
for each row execute function public.enforce_lender_clawback_transition();

create or replace function public.set_lender_intelligence_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_lender_master_updated_at on public.lender_master;
create trigger set_lender_master_updated_at before update on public.lender_master
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_programs_updated_at on public.lender_programs;
create trigger set_lender_programs_updated_at before update on public.lender_programs
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_policy_versions_updated_at on public.lender_policy_versions;
create trigger set_lender_policy_versions_updated_at before update on public.lender_policy_versions
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_policy_rules_updated_at on public.lender_policy_rules;
create trigger set_lender_policy_rules_updated_at before update on public.lender_policy_rules
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_outcomes_updated_at on public.lender_outcomes;
create trigger set_lender_outcomes_updated_at before update on public.lender_outcomes
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_rejection_reasons_updated_at on public.lender_rejection_reasons;
create trigger set_lender_rejection_reasons_updated_at before update on public.lender_rejection_reasons
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_routing_exceptions_updated_at on public.lender_routing_exceptions;
create trigger set_lender_routing_exceptions_updated_at before update on public.lender_routing_exceptions
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_commercial_versions_updated_at on public.lender_commercial_versions;
create trigger set_lender_commercial_versions_updated_at before update on public.lender_commercial_versions
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_invoices_updated_at on public.lender_invoices;
create trigger set_lender_invoices_updated_at before update on public.lender_invoices
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_reconciliation_items_updated_at on public.lender_reconciliation_items;
create trigger set_lender_reconciliation_items_updated_at before update on public.lender_reconciliation_items
for each row execute function public.set_lender_intelligence_updated_at();
drop trigger if exists set_lender_data_quality_issues_updated_at on public.lender_data_quality_issues;
create trigger set_lender_data_quality_issues_updated_at before update on public.lender_data_quality_issues
for each row execute function public.set_lender_intelligence_updated_at();

alter table public.lender_policy_documents
  add constraint lender_policy_documents_checksum_sha256
  check (checksum is not null and checksum ~ '^[0-9a-f]{64}$');
alter table public.lender_policy_documents
  add constraint lender_policy_documents_valid_term
  check (expires_at is null or issued_at is null or expires_at > issued_at);

create or replace function public.protect_lender_policy_document()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Policy document evidence cannot be deleted';
  end if;

  if new.id is distinct from old.id
    or new.lender_id is distinct from old.lender_id
    or new.program_id is distinct from old.program_id
    or new.policy_version_id is distinct from old.policy_version_id
    or new.document_type is distinct from old.document_type
    or new.file_name is distinct from old.file_name
    or new.storage_path is distinct from old.storage_path
    or new.mime_type is distinct from old.mime_type
    or new.checksum is distinct from old.checksum
    or new.issued_at is distinct from old.issued_at
    or new.expires_at is distinct from old.expires_at
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Policy document source evidence is immutable';
  end if;

  if old.review_status = 'pending' and new.review_status in ('verified', 'rejected') then
    if new.verified_by is null or new.verified_at is null then
      raise exception 'Document review actor and timestamp are required';
    end if;
    if old.created_by is not null and new.verified_by = old.created_by then
      raise exception 'Uploader and reviewer must be different admins';
    end if;
    if new.review_status = 'rejected' and length(btrim(coalesce(new.review_note, ''))) < 5 then
      raise exception 'A rejection note of at least 5 characters is required';
    end if;
    return new;
  end if;

  if old.review_status = 'verified' and new.review_status = 'expired' then
    if old.expires_at is null or old.expires_at > now() then
      raise exception 'Document cannot expire before its recorded expiry time';
    end if;
    if new.review_note is distinct from old.review_note
      or new.verified_by is distinct from old.verified_by
      or new.verified_at is distinct from old.verified_at then
      raise exception 'Document review evidence is immutable';
    end if;
    return new;
  end if;

  raise exception 'Invalid or repeated document review transition';
end;
$$;

drop trigger if exists protect_lender_policy_document_mutation on public.lender_policy_documents;
create trigger protect_lender_policy_document_mutation
before update or delete on public.lender_policy_documents
for each row execute function public.protect_lender_policy_document();

create or replace function public.protect_lender_master_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.partner_id is distinct from old.partner_id
    or new.lender_code is distinct from old.lender_code
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Lender identity and provenance are immutable';
  end if;
  if old.onboarding_status in ('active', 'paused', 'offboarded') and (
    new.legal_name is distinct from old.legal_name
    or new.lender_type is distinct from old.lender_type
  ) then
    raise exception 'Governed lender legal identity cannot be edited';
  end if;
  if old.onboarding_status = 'offboarded' and new.onboarding_status <> 'offboarded' then
    raise exception 'An offboarded lender cannot be reactivated';
  end if;
  if new.onboarding_status is distinct from old.onboarding_status and not (
    (old.onboarding_status = 'draft' and new.onboarding_status = 'due_diligence')
    or (old.onboarding_status = 'due_diligence' and new.onboarding_status in ('agreement_pending', 'active'))
    or (old.onboarding_status = 'agreement_pending' and new.onboarding_status = 'active')
    or (old.onboarding_status = 'active' and new.onboarding_status in ('paused', 'offboarded'))
    or (old.onboarding_status = 'paused' and new.onboarding_status in ('active', 'offboarded'))
  ) then raise exception 'Invalid lender onboarding lifecycle transition'; end if;
  if new.kyc_status is distinct from old.kyc_status and not (
    (old.kyc_status = 'pending' and new.kyc_status in ('in_review', 'verified', 'rejected'))
    or (old.kyc_status = 'in_review' and new.kyc_status in ('verified', 'rejected'))
    or (old.kyc_status = 'verified' and new.kyc_status = 'expired')
    or (old.kyc_status in ('rejected', 'expired') and new.kyc_status in ('in_review', 'verified'))
  ) then raise exception 'Invalid lender KYC lifecycle transition'; end if;
  if new.agreement_status is distinct from old.agreement_status and not (
    (old.agreement_status = 'pending' and new.agreement_status in ('in_review', 'signed', 'terminated'))
    or (old.agreement_status = 'in_review' and new.agreement_status in ('signed', 'terminated'))
    or (old.agreement_status = 'signed' and new.agreement_status in ('expired', 'terminated'))
    or (old.agreement_status = 'expired' and new.agreement_status in ('in_review', 'signed', 'terminated'))
  ) then raise exception 'Invalid or terminal lender agreement lifecycle transition'; end if;
  return new;
end;
$$;

drop trigger if exists protect_lender_master_identity_mutation on public.lender_master;
create trigger protect_lender_master_identity_mutation
before update on public.lender_master
for each row execute function public.protect_lender_master_identity();

-- Finance mutations must pass through the SECURITY DEFINER workflows above.
-- RLS is intentionally not the only boundary because service-role clients bypass it.
revoke insert, update, delete, truncate on public.lender_invoices from public, anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.lender_invoice_sequences from public, anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.lender_invoice_payments from public, anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.lender_invoice_payment_allocations from public, anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.lender_invoice_adjustments from public, anon, authenticated, service_role;
grant select on public.lender_invoices to service_role;
grant select on public.lender_invoice_sequences to service_role;
grant select on public.lender_invoice_payments to service_role;
grant select on public.lender_invoice_payment_allocations to service_role;
grant select on public.lender_invoice_adjustments to service_role;

create unique index if not exists idx_lender_routing_one_report_snapshot
  on public.lender_routing_decisions(eligibility_report_id)
  where eligibility_report_id is not null and application_id is null;

-- Consent evidence belongs to the eligibility report that supplied routing input.
-- Existing reports remain explicitly unproven until consent is recaptured through a
-- new check; they cannot be silently upgraded by a service-role client.

alter table public.crm_eligibility_reports
  drop constraint if exists crm_eligibility_reports_consent_evidence_check;
alter table public.crm_eligibility_reports
  add constraint crm_eligibility_reports_consent_evidence_check check (
    (not consent_given and consent_at is null and consent_version is null
      and consent_purpose is null and consent_source is null and consent_captured_by is null)
    or
    (consent_given and consent_at is not null and consent_at <= created_at + interval '5 minutes'
      and length(btrim(consent_version)) between 1 and 50
      and length(btrim(consent_purpose)) between 5 and 500
      and consent_source in ('operator_attestation', 'customer_digital', 'imported_evidence')
      and consent_captured_by is not null and consent_captured_by = created_by)
  );

alter table public.crm_eligibility_reports
  drop constraint if exists crm_eligibility_reports_consent_actor_fkey;
alter table public.crm_eligibility_reports
  add constraint crm_eligibility_reports_consent_actor_fkey
  foreign key (consent_captured_by) references auth.users(id) on delete restrict;

create or replace function public.protect_crm_eligibility_consent()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.consent_given is distinct from old.consent_given
    or new.consent_at is distinct from old.consent_at
    or new.consent_version is distinct from old.consent_version
    or new.consent_purpose is distinct from old.consent_purpose
    or new.consent_source is distinct from old.consent_source
    or new.consent_captured_by is distinct from old.consent_captured_by
    or (old.consent_given and new.created_by is distinct from old.created_by) then
    raise exception 'Eligibility consent evidence is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_crm_eligibility_consent_mutation on public.crm_eligibility_reports;
create trigger protect_crm_eligibility_consent_mutation
before update on public.crm_eligibility_reports
for each row execute function public.protect_crm_eligibility_consent();

alter table public.lender_consent_withdrawals enable row level security;
drop policy if exists lender_consent_withdrawals_service_access on public.lender_consent_withdrawals;
create policy lender_consent_withdrawals_service_access on public.lender_consent_withdrawals
  for select to service_role using (true);

create or replace function public.withdraw_lender_eligibility_consent(
  p_partner_id uuid, p_eligibility_report_id text, p_reason text, p_actor_user_id uuid
)
returns public.lender_consent_withdrawals
language plpgsql security definer set search_path = public
as $$
declare
  report public.crm_eligibility_reports;
  withdrawal public.lender_consent_withdrawals;
begin
  perform public.require_lender_intelligence_actor(p_actor_user_id);
  if p_partner_id is null or length(btrim(coalesce(p_eligibility_report_id, ''))) < 1
    or length(btrim(coalesce(p_reason, ''))) not between 5 and 2000 then
    raise exception 'Partner, eligibility report, and a meaningful withdrawal reason are required';
  end if;
  select * into report from public.crm_eligibility_reports
  where id = p_eligibility_report_id and partner_id = p_partner_id for update;
  if report.id is null then raise exception 'Eligibility report not found'; end if;
  if not report.consent_given or report.consent_at is null then
    raise exception 'Eligibility report has no recorded consent to withdraw';
  end if;
  if exists (select 1 from public.lender_consent_withdrawals where eligibility_report_id = report.id) then
    raise exception 'Consent is already withdrawn for this eligibility report';
  end if;
  insert into public.lender_consent_withdrawals (
    partner_id, eligibility_report_id, reason, withdrawn_by
  ) values (
    p_partner_id, report.id, btrim(p_reason), p_actor_user_id
  ) returning * into withdrawal;
  perform public.register_lender_intelligence_audit(
    p_partner_id, p_actor_user_id, 'compliance', 'withdraw_eligibility_consent',
    'eligibility_report', report.id, 'Customer consent withdrawal recorded',
    jsonb_build_object('withdrawalId', withdrawal.id, 'withdrawnAt', withdrawal.withdrawn_at)
  );
  return withdrawal;
end;
$$;

revoke all on function public.withdraw_lender_eligibility_consent(uuid, text, text, uuid) from public;
grant execute on function public.withdraw_lender_eligibility_consent(uuid, text, text, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_consent_withdrawals from public, anon, authenticated, service_role;
grant select on public.lender_consent_withdrawals to service_role;

create or replace function public.register_lender_routing_decision(
  p_partner_id uuid,
  p_lead_id text,
  p_eligibility_report_id text,
  p_engine_version text,
  p_input_snapshot jsonb,
  p_result_snapshot jsonb,
  p_actor_user_id uuid
)
returns public.lender_routing_decisions
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_decision public.lender_routing_decisions;
  created_decision public.lender_routing_decisions;
  expected_type text;
begin
  perform public.require_lender_intelligence_actor(p_actor_user_id);
  if p_partner_id is null or p_eligibility_report_id is null then
    raise exception 'Partner and eligibility report are required';
  end if;
  if length(btrim(coalesce(p_engine_version, ''))) not between 3 and 100 then
    raise exception 'Valid routing engine version is required';
  end if;
  if jsonb_typeof(p_input_snapshot) <> 'object' or jsonb_typeof(p_result_snapshot) <> 'array' then
    raise exception 'Routing input must be an object and results must be an array';
  end if;
  if octet_length(p_input_snapshot::text) > 1048576 then
    raise exception 'Routing input snapshot exceeds the 1 MB limit';
  end if;
  if octet_length(p_result_snapshot::text) > 2097152
    or jsonb_array_length(p_result_snapshot) > 500 then
    raise exception 'Routing result snapshot exceeds the 2 MB or 500-result limit';
  end if;
  if not exists (
    select 1 from public.crm_eligibility_reports report
    where report.id = p_eligibility_report_id and report.partner_id = p_partner_id
      and (p_lead_id is null or report.lead_id = p_lead_id)
      and report.consent_given and report.consent_at is not null
      and report.consent_version is not null and report.consent_purpose is not null
      and report.consent_captured_by is not null
      and not exists (select 1 from public.lender_consent_withdrawals withdrawal
        where withdrawal.eligibility_report_id = report.id)
  ) then raise exception 'Eligibility report does not belong to the partner and lead'; end if;
  if p_lead_id is not null and not exists (
    select 1 from public.crm_leads lead where lead.id = p_lead_id and lead.partner_id = p_partner_id
  ) then raise exception 'Lead does not belong to the partner'; end if;

  expected_type := case when jsonb_array_length(p_result_snapshot) > 0 then 'recommendation' else 'no_match' end;
  select * into existing_decision from public.lender_routing_decisions
  where eligibility_report_id = p_eligibility_report_id for update;
  if existing_decision.id is not null then
    if existing_decision.partner_id is distinct from p_partner_id
      or existing_decision.lead_id is distinct from p_lead_id
      or existing_decision.engine_version is distinct from btrim(p_engine_version)
      or existing_decision.input_snapshot is distinct from p_input_snapshot
      or existing_decision.result_snapshot is distinct from p_result_snapshot
      or existing_decision.decision_type is distinct from expected_type then
      raise exception 'Eligibility report already has different routing evidence';
    end if;
    return existing_decision;
  end if;

  insert into public.lender_routing_decisions (
    partner_id, lead_id, eligibility_report_id, engine_version, input_snapshot,
    result_snapshot, decision_type, decided_by
  ) values (
    p_partner_id, p_lead_id, p_eligibility_report_id, btrim(p_engine_version),
    p_input_snapshot, p_result_snapshot, expected_type, p_actor_user_id
  ) returning * into created_decision;
  perform public.register_lender_intelligence_audit(
    created_decision.partner_id, p_actor_user_id, 'routing', 'register_routing_decision',
    'routing_decision', created_decision.id::text,
    case when expected_type = 'no_match' then 'No lender routing match recorded'
      else 'Explainable lender recommendations recorded' end,
    jsonb_build_object('leadId', created_decision.lead_id,
      'eligibilityReportId', created_decision.eligibility_report_id,
      'engineVersion', created_decision.engine_version,
      'decisionType', created_decision.decision_type,
      'resultCount', jsonb_array_length(created_decision.result_snapshot))
  );
  return created_decision;
end;
$$;

revoke all on function public.register_lender_routing_decision(uuid, text, text, text, jsonb, jsonb, uuid) from public;
grant execute on function public.register_lender_routing_decision(uuid, text, text, text, jsonb, jsonb, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_routing_decisions from public, anon, authenticated, service_role;
grant select on public.lender_routing_decisions to service_role;

create or replace function public.request_lender_routing_exception(
  p_partner_id uuid,
  p_routing_decision_id uuid,
  p_program_id uuid,
  p_reason_code text,
  p_reason_note text,
  p_requester_user_id uuid
)
returns public.lender_routing_exceptions
language plpgsql
security definer
set search_path = public
as $$
declare
  decision public.lender_routing_decisions;
  evidence jsonb;
  created_exception public.lender_routing_exceptions;
  expired_prior integer := 0;
begin
  perform public.require_lender_intelligence_actor(p_requester_user_id);
  if length(btrim(coalesce(p_reason_code, ''))) < 2 or length(btrim(coalesce(p_reason_note, ''))) < 10 then
    raise exception 'Structured exception reason and detailed note are required';
  end if;
  select * into decision from public.lender_routing_decisions
  where id = p_routing_decision_id and partner_id = p_partner_id for update;
  if decision.id is null or decision.application_id is not null then
    raise exception 'An unbound routing decision in the partner scope is required';
  end if;
  select value into evidence from jsonb_array_elements(decision.result_snapshot)
  where value->>'programId' = p_program_id::text limit 1;
  if evidence is null or evidence->>'matchStatus' not in ('near_match', 'excluded', 'needs_data') then
    raise exception 'Program does not require an exception in this routing evidence';
  end if;
  update public.lender_routing_exceptions set status = 'expired', updated_at = now()
  where routing_decision_id = decision.id and program_id = p_program_id
    and status = 'approved' and reviewed_at <= now() - interval '24 hours';
  get diagnostics expired_prior = row_count;
  if exists (
    select 1 from public.lender_routing_exceptions exception
    where exception.routing_decision_id = decision.id and exception.program_id = p_program_id
      and exception.status in ('pending', 'approved')
  ) then raise exception 'An open exception already exists for this program'; end if;

  insert into public.lender_routing_exceptions (
    partner_id, routing_decision_id, lead_id, eligibility_report_id, lender_id,
    program_id, policy_version_id, match_status, reason_code, reason_note, requested_by
  ) values (
    p_partner_id, decision.id, decision.lead_id, decision.eligibility_report_id,
    nullif(evidence->>'lenderId', '')::uuid, p_program_id,
    nullif(evidence->>'policyVersionId', '')::uuid, evidence->>'matchStatus',
    upper(btrim(p_reason_code)), btrim(p_reason_note), p_requester_user_id
  ) returning * into created_exception;
  perform public.register_lender_intelligence_audit(
    created_exception.partner_id, p_requester_user_id, 'routing', 'request_exception',
    'routing_exception', created_exception.id::text, 'Lender routing exception requested',
    jsonb_build_object('decisionId', created_exception.routing_decision_id,
      'programId', created_exception.program_id, 'lenderId', created_exception.lender_id,
      'policyVersionId', created_exception.policy_version_id,
      'matchStatus', created_exception.match_status, 'reasonCode', created_exception.reason_code,
      'reasonNote', created_exception.reason_note, 'status', created_exception.status,
      'expiredPriorApprovals', expired_prior, 'approvalTtlHours', 24)
  );
  return created_exception;
end;
$$;

create or replace function public.review_lender_routing_exception(
  p_exception_id uuid,
  p_decision text,
  p_review_note text,
  p_reviewer_user_id uuid
)
returns public.lender_routing_exceptions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_routing_exceptions;
begin
  perform public.require_lender_intelligence_actor(p_reviewer_user_id);
  if p_decision not in ('approved', 'rejected') or length(btrim(coalesce(p_review_note, ''))) < 5 then
    raise exception 'Approve or reject decision with review evidence is required';
  end if;
  select * into target from public.lender_routing_exceptions where id = p_exception_id for update;
  if target.id is null then raise exception 'Exception request not found'; end if;
  if target.status <> 'pending' then raise exception 'Only a pending exception can be reviewed'; end if;
  if target.requested_by = p_reviewer_user_id then raise exception 'Requester cannot review their own exception'; end if;
  update public.lender_routing_exceptions set
    status = p_decision,
    reviewed_by = p_reviewer_user_id,
    reviewed_at = now(),
    review_note = btrim(p_review_note),
    updated_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_reviewer_user_id, 'routing', p_decision || '_exception',
    'routing_exception', target.id::text, 'Routing exception ' || p_decision,
    jsonb_build_object('decisionId', target.routing_decision_id,
      'programId', target.program_id, 'lenderId', target.lender_id,
      'policyVersionId', target.policy_version_id, 'matchStatus', target.match_status,
      'reasonCode', target.reason_code, 'reviewNote', target.review_note,
      'requesterUserId', target.requested_by, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.request_lender_routing_exception(uuid, uuid, uuid, text, text, uuid) from public;
grant execute on function public.request_lender_routing_exception(uuid, uuid, uuid, text, text, uuid) to service_role;
revoke all on function public.review_lender_routing_exception(uuid, text, text, uuid) from public;
grant execute on function public.review_lender_routing_exception(uuid, text, text, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_routing_exceptions from public, anon, authenticated, service_role;
grant select on public.lender_routing_exceptions to service_role;

-- Canonical application transitions are the only writers of stage and outcome evidence.
revoke insert, update, delete, truncate on public.application_stage_events from public, anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.lender_outcomes from public, anon, authenticated, service_role;
grant select on public.application_stage_events to service_role;
grant select on public.lender_outcomes to service_role;

-- Payout and reconciliation rows are created and settled only by governed workflows.
revoke insert, update, delete, truncate on public.lender_reconciliation_items from public, anon, authenticated, service_role;
grant select on public.lender_reconciliation_items to service_role;

create or replace function public.register_lender_clawback(
  p_reconciliation_item_id uuid,
  p_trigger_code text,
  p_trigger_note text,
  p_triggered_at timestamptz,
  p_user_id uuid
)
returns public.lender_clawbacks
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.lender_reconciliation_items;
  commercial public.lender_commercial_versions;
  outcome public.lender_outcomes;
  basis text;
  window_days numeric;
  term_value numeric;
  recoverable_payout numeric(14,2);
  clawback_amount numeric(14,2);
  created_clawback public.lender_clawbacks;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_trigger_code, ''))) < 3 or length(btrim(coalesce(p_trigger_note, ''))) < 5 then
    raise exception 'Clawback trigger code and detailed evidence are required';
  end if;
  if p_triggered_at is null or p_triggered_at > now() + interval '5 minutes' then
    raise exception 'Clawback trigger timestamp is invalid';
  end if;
  select * into item from public.lender_reconciliation_items
  where id = p_reconciliation_item_id for update;
  if item.id is null then raise exception 'Reconciliation item not found'; end if;
  if item.status <> 'paid' or item.commercial_version_id is null or item.outcome_id is null then
    raise exception 'Clawback requires a paid payout with commercial and outcome evidence';
  end if;
  select * into commercial from public.lender_commercial_versions where id = item.commercial_version_id;
  select * into outcome from public.lender_outcomes where id = item.outcome_id;
  if commercial.id is null or outcome.disbursed_at is null then
    raise exception 'Commercial and disbursal evidence are required';
  end if;
  basis := commercial.clawback_terms->>'basis';
  window_days := nullif(commercial.clawback_terms->>'windowDays', '')::numeric;
  term_value := greatest(0, coalesce(nullif(commercial.clawback_terms->>'value', '')::numeric, 0));
  if window_days is null or window_days < 0 or p_triggered_at < outcome.disbursed_at
    or p_triggered_at > outcome.disbursed_at + make_interval(days => window_days::integer) then
    raise exception 'Trigger is outside the contracted clawback window';
  end if;
  recoverable_payout := least(item.expected_amount, item.received_amount);
  clawback_amount := round(case basis
    when 'full' then recoverable_payout
    when 'percentage' then least(recoverable_payout, recoverable_payout * term_value / 100)
    when 'fixed' then least(recoverable_payout, term_value)
    else 0 end, 2);
  if clawback_amount <= 0 then raise exception 'Contractual clawback amount must be positive'; end if;
  insert into public.lender_clawbacks (
    partner_id, reconciliation_item_id, commercial_version_id, application_id,
    amount, trigger_code, trigger_note, triggered_at, created_by
  ) values (
    item.partner_id, item.id, commercial.id, item.application_id, clawback_amount,
    upper(btrim(p_trigger_code)), btrim(p_trigger_note), p_triggered_at, p_user_id
  ) returning * into created_clawback;
  perform public.register_lender_intelligence_audit(
    item.partner_id, p_user_id, 'commercials', 'register_clawback', 'lender_clawback',
    created_clawback.id::text, 'Contractual payout clawback registered',
    jsonb_build_object('reconciliationItemId', item.id, 'triggerCode', upper(btrim(p_trigger_code)),
      'amount', clawback_amount, 'triggeredAt', p_triggered_at)
  );
  return created_clawback;
end;
$$;

drop function if exists public.resolve_lender_clawback(uuid, text, text, uuid);
create or replace function public.resolve_lender_clawback(
  p_clawback_id uuid,
  p_status text,
  p_resolution_note text,
  p_recovery_reference text,
  p_user_id uuid
)
returns public.lender_clawbacks
language plpgsql
security definer
set search_path = public
as $$
declare target public.lender_clawbacks;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_status not in ('recovered', 'waived') or length(btrim(coalesce(p_resolution_note, ''))) < 5 then
    raise exception 'Valid clawback resolution and detailed evidence are required';
  end if;
  if p_status = 'recovered' and length(btrim(coalesce(p_recovery_reference, ''))) not between 3 and 100 then
    raise exception 'Recovered clawback payment reference is required';
  end if;
  if p_status = 'waived' and nullif(btrim(p_recovery_reference), '') is not null then
    raise exception 'Waived clawback cannot carry a recovery reference';
  end if;
  select * into target from public.lender_clawbacks where id = p_clawback_id for update;
  if target.id is null then raise exception 'Clawback not found'; end if;
  if target.status <> 'open' then raise exception 'Only an open clawback can be resolved'; end if;
  update public.lender_clawbacks set status = p_status, resolution_note = btrim(p_resolution_note),
    recovered_amount = case when p_status = 'recovered' then amount else null end,
    recovery_reference = case when p_status = 'recovered' then btrim(p_recovery_reference) else null end,
    resolved_by = p_user_id, resolved_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'commercials', 'resolve_clawback_' || p_status,
    'lender_clawback', target.id::text, 'Clawback ' || p_status,
    jsonb_build_object('amount', target.amount, 'resolutionNote', btrim(p_resolution_note),
      'recoveryReferencePresent', p_status = 'recovered')
  );
  return target;
end;
$$;

revoke all on function public.register_lender_clawback(uuid, text, text, timestamptz, uuid) from public;
grant execute on function public.register_lender_clawback(uuid, text, text, timestamptz, uuid) to service_role;
revoke all on function public.resolve_lender_clawback(uuid, text, text, text, uuid) from public;
grant execute on function public.resolve_lender_clawback(uuid, text, text, text, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_clawbacks from public, anon, authenticated, service_role;
grant select on public.lender_clawbacks to service_role;

-- Compliance findings are produced by the scanner and resolved only through its lifecycle RPC.
revoke insert, update, delete, truncate on public.lender_data_quality_issues from public, anon, authenticated, service_role;
grant select on public.lender_data_quality_issues to service_role;

create or replace function public.register_lender_intelligence_audit(
  p_partner_id uuid,
  p_actor_user_id uuid,
  p_module text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_summary text,
  p_metadata jsonb
)
returns public.lender_intelligence_audit_logs
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  canonical_actor_email text;
  created_log public.lender_intelligence_audit_logs;
begin
  if p_actor_user_id is null then raise exception 'Audit actor is required'; end if;
  select email into canonical_actor_email from auth.users where id = p_actor_user_id;
  if canonical_actor_email is null then raise exception 'Audit actor does not exist'; end if;
  if p_module not in ('onboarding', 'policy', 'routing', 'outcomes', 'commercials', 'partner_commissions', 'invoicing', 'compliance') then
    raise exception 'Invalid lender intelligence audit module';
  end if;
  if length(btrim(coalesce(p_action, ''))) not between 2 and 100
    or length(btrim(coalesce(p_entity_type, ''))) not between 2 and 100
    or length(btrim(coalesce(p_summary, ''))) not between 3 and 500 then
    raise exception 'Audit action, entity type, and summary are required and bounded';
  end if;
  if p_entity_id is not null and length(p_entity_id) > 200 then raise exception 'Audit entity id is too long'; end if;
  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object'
    or octet_length(coalesce(p_metadata, '{}'::jsonb)::text) > 65536 then
    raise exception 'Audit metadata must be a bounded JSON object';
  end if;
  insert into public.lender_intelligence_audit_logs (
    partner_id, actor_user_id, actor_email, module, action, entity_type,
    entity_id, summary, metadata
  ) values (
    p_partner_id, p_actor_user_id, canonical_actor_email, p_module, btrim(p_action),
    btrim(p_entity_type), nullif(btrim(p_entity_id), ''), btrim(p_summary),
    coalesce(p_metadata, '{}'::jsonb)
  ) returning * into created_log;
  return created_log;
end;
$$;

revoke all on function public.register_lender_intelligence_audit(uuid, uuid, text, text, text, text, text, jsonb) from public;
grant execute on function public.register_lender_intelligence_audit(uuid, uuid, text, text, text, text, text, jsonb) to service_role;
revoke insert, update, delete, truncate on public.lender_intelligence_audit_logs from public, anon, authenticated, service_role;
grant select on public.lender_intelligence_audit_logs to service_role;

create or replace function public.register_lender_policy_document(
  p_lender_id uuid,
  p_program_id uuid,
  p_policy_version_id uuid,
  p_document_type text,
  p_file_name text,
  p_storage_path text,
  p_mime_type text,
  p_checksum text,
  p_expires_at timestamptz,
  p_user_id uuid
)
returns public.lender_policy_documents
language plpgsql
security definer
set search_path = public
as $$
declare
  policy_record public.lender_policy_versions;
  actual_program_id uuid := p_program_id;
  created_document public.lender_policy_documents;
  lender_partner_id uuid;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select partner_id into lender_partner_id from public.lender_master where id = p_lender_id;
  if not found then
    raise exception 'Lender not found';
  end if;
  if length(btrim(coalesce(p_document_type, ''))) not between 2 and 100
    or length(btrim(coalesce(p_file_name, ''))) not between 1 and 120 then
    raise exception 'Document type and safe filename are required';
  end if;
  if p_mime_type not in (
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) then raise exception 'Unsupported lender document MIME type'; end if;
  if p_checksum is null or p_checksum !~ '^[0-9a-f]{64}$' then raise exception 'Valid SHA-256 checksum is required'; end if;
  if p_storage_path is null or p_storage_path not like (p_lender_id::text || '/%') or length(p_storage_path) > 500 then
    raise exception 'Private storage path must be scoped to the lender';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then raise exception 'Document expiry must be in the future'; end if;
  if p_program_id is not null and not exists (
    select 1 from public.lender_programs where id = p_program_id and lender_id = p_lender_id
  ) then raise exception 'Program does not belong to the lender'; end if;
  if p_policy_version_id is not null then
    select policy.* into policy_record from public.lender_policy_versions policy
    join public.lender_programs program on program.id = policy.program_id
    where policy.id = p_policy_version_id and program.lender_id = p_lender_id;
    if policy_record.id is null then raise exception 'Policy version does not belong to the lender'; end if;
    if p_program_id is not null and policy_record.program_id <> p_program_id then
      raise exception 'Policy version does not belong to the selected program';
    end if;
    actual_program_id := policy_record.program_id;
  end if;
  insert into public.lender_policy_documents (
    lender_id, program_id, policy_version_id, document_type, file_name, storage_path,
    mime_type, checksum, expires_at, created_by
  ) values (
    p_lender_id, actual_program_id, p_policy_version_id, btrim(p_document_type),
    btrim(p_file_name), p_storage_path, p_mime_type, p_checksum, p_expires_at, p_user_id
  ) returning * into created_document;
  if p_policy_version_id is not null and policy_record.status = 'draft' then
    update public.lender_policy_versions set source_checksum = p_checksum
    where id = p_policy_version_id;
  end if;
  perform public.register_lender_intelligence_audit(
    lender_partner_id, p_user_id, 'compliance', 'upload_document',
    'policy_document', created_document.id::text,
    created_document.document_type || ' document uploaded',
    jsonb_build_object('lenderId', created_document.lender_id,
      'programId', created_document.program_id, 'policyVersionId', created_document.policy_version_id,
      'fileName', created_document.file_name, 'mimeType', created_document.mime_type,
      'checksum', created_document.checksum, 'expiresAt', created_document.expires_at,
      'status', created_document.review_status)
  );
  return created_document;
end;
$$;

revoke all on function public.register_lender_policy_document(uuid, uuid, uuid, text, text, text, text, text, timestamptz, uuid) from public;
grant execute on function public.register_lender_policy_document(uuid, uuid, uuid, text, text, text, text, text, timestamptz, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_policy_documents from public, anon, authenticated, service_role;
grant select on public.lender_policy_documents to service_role;

create or replace function public.protect_lender_program_master()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.lender_id is distinct from old.lender_id
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Program ownership and provenance are immutable';
  end if;
  if old.status <> 'draft' and (
    new.partner_id is distinct from old.partner_id or new.program_code is distinct from old.program_code
    or new.program_name is distinct from old.program_name or new.product is distinct from old.product
    or new.borrower_segment is distinct from old.borrower_segment
    or new.employment_types is distinct from old.employment_types or new.channels is distinct from old.channels
    or new.states is distinct from old.states or new.cities is distinct from old.cities
    or new.min_loan is distinct from old.min_loan or new.max_loan is distinct from old.max_loan
    or new.min_tenure_months is distinct from old.min_tenure_months
    or new.max_tenure_months is distinct from old.max_tenure_months
    or new.indicative_roi_min is distinct from old.indicative_roi_min
    or new.indicative_roi_max is distinct from old.indicative_roi_max
    or new.processing_fee_text is distinct from old.processing_fee_text
    or new.priority is distinct from old.priority or new.login_sla_hours is distinct from old.login_sla_hours
    or new.sanction_sla_hours is distinct from old.sanction_sla_hours
    or new.disbursal_sla_hours is distinct from old.disbursal_sla_hours
    or new.metadata is distinct from old.metadata
  ) then raise exception 'Governed program content is immutable outside draft'; end if;
  if old.status = 'retired' and new.status <> 'retired' then raise exception 'A retired program cannot be reactivated'; end if;
  if new.status is distinct from old.status and not (
    (old.status = 'draft' and new.status in ('active', 'retired'))
    or (old.status = 'active' and new.status in ('paused', 'retired'))
    or (old.status = 'paused' and new.status in ('active', 'retired'))
  ) then raise exception 'Invalid lender program lifecycle transition'; end if;
  return new;
end;
$$;

drop trigger if exists protect_lender_program_master_mutation on public.lender_programs;
create trigger protect_lender_program_master_mutation
before update on public.lender_programs
for each row execute function public.protect_lender_program_master();

create or replace function public.set_lender_program_operating_status(
  p_program_id uuid,
  p_status text,
  p_capacity_status text,
  p_user_id uuid
)
returns public.lender_programs
language plpgsql
security definer
set search_path = public
as $$
declare target public.lender_programs;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_status not in ('draft', 'active', 'paused', 'retired')
    or p_capacity_status not in ('open', 'limited', 'paused') then
    raise exception 'Valid program and capacity states are required';
  end if;
  select * into target from public.lender_programs where id = p_program_id for update;
  if target.id is null then raise exception 'Lender program not found'; end if;
  update public.lender_programs set status = p_status, capacity_status = p_capacity_status,
    updated_by = p_user_id where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'onboarding', 'set_program_operating_status',
    'lender_program', target.id::text,
    'Program changed to ' || p_status || '/' || p_capacity_status,
    jsonb_build_object('lenderId', target.lender_id, 'programCode', target.program_code,
      'status', target.status, 'capacityStatus', target.capacity_status)
  );
  return target;
end;
$$;

revoke all on function public.set_lender_program_operating_status(uuid, text, text, uuid) from public;
grant execute on function public.set_lender_program_operating_status(uuid, text, text, uuid) to service_role;

create or replace function public.set_lender_program_daily_capacity(
  p_program_id uuid, p_daily_submission_limit integer, p_reason text, p_user_id uuid
)
returns public.lender_programs
language plpgsql security definer set search_path = public
as $$
declare target public.lender_programs;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_daily_submission_limit is not null and p_daily_submission_limit not between 1 and 1000000 then
    raise exception 'Daily submission limit must be null or between 1 and 1000000';
  end if;
  if length(btrim(coalesce(p_reason, ''))) not between 5 and 2000 then
    raise exception 'A meaningful capacity-change reason is required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_program_id::text, 0));
  select * into target from public.lender_programs where id = p_program_id for update;
  if target.id is null then raise exception 'Lender program not found'; end if;
  if target.status = 'retired' then raise exception 'Retired program capacity cannot be changed'; end if;
  update public.lender_programs set daily_submission_limit = p_daily_submission_limit,
    updated_by = p_user_id where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'onboarding', 'set_program_daily_capacity',
    'lender_program', target.id::text, 'Program daily submission capacity changed',
    jsonb_build_object('dailySubmissionLimit', target.daily_submission_limit,
      'operatingTimezone', 'Asia/Kolkata', 'reason', btrim(p_reason))
  );
  return target;
end;
$$;

revoke all on function public.set_lender_program_daily_capacity(uuid, integer, text, uuid) from public;
grant execute on function public.set_lender_program_daily_capacity(uuid, integer, text, uuid) to service_role;

create or replace function public.get_lender_program_daily_capacity_usage(
  p_program_ids uuid[], p_as_of timestamptz, p_actor_user_id uuid
)
returns table (
  program_id uuid,
  daily_submission_limit integer,
  submissions_used bigint,
  submissions_remaining integer,
  exhausted boolean,
  operating_date date
)
language plpgsql security definer stable set search_path = public
as $$
begin
  perform public.require_lender_intelligence_actor(p_actor_user_id);
  if p_as_of is null or p_as_of > now() + interval '5 minutes'
    or p_as_of < now() - interval '1 day' then
    raise exception 'Capacity snapshot time is invalid';
  end if;
  if p_program_ids is null or cardinality(p_program_ids) = 0
    or cardinality(p_program_ids) > 500 then
    raise exception 'Capacity snapshot requires 1 to 500 programs';
  end if;
  if exists (select 1 from unnest(p_program_ids) id group by id having count(*) > 1) then
    raise exception 'Capacity snapshot program IDs must be unique';
  end if;
  return query
  select program.id,
    program.daily_submission_limit,
    count(event.id)::bigint,
    case when program.daily_submission_limit is null then null
      else greatest(program.daily_submission_limit - count(event.id)::integer, 0) end,
    program.daily_submission_limit is not null
      and count(event.id) >= program.daily_submission_limit,
    (p_as_of at time zone 'Asia/Kolkata')::date
  from public.lender_programs program
  left join public.application_stage_events event
    on event.program_id = program.id and event.to_stage = 'case_sent_to_lender'
    and (event.occurred_at at time zone 'Asia/Kolkata')::date =
      (p_as_of at time zone 'Asia/Kolkata')::date
  where program.id = any(p_program_ids)
  group by program.id, program.daily_submission_limit;
end;
$$;

revoke all on function public.get_lender_program_daily_capacity_usage(uuid[], timestamptz, uuid) from public;
grant execute on function public.get_lender_program_daily_capacity_usage(uuid[], timestamptz, uuid) to service_role;

-- Lender onboarding is workflow-owned. New records always enter the initial
-- onboarding state; later lifecycle changes remain subject to the transition,
-- readiness, identity, and shutdown guards above.
create or replace function public.save_lender_master(p_lender jsonb, p_user_id uuid)
returns public.lender_master
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.lender_master;
  target public.lender_master;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if jsonb_typeof(p_lender) <> 'object' then raise exception 'Lender payload must be a JSON object'; end if;
  if octet_length(p_lender::text) > 131072 then raise exception 'Lender payload is too large'; end if;

  candidate := jsonb_populate_record(null::public.lender_master, p_lender);
  candidate.legal_name := btrim(candidate.legal_name);
  candidate.display_name := btrim(candidate.display_name);
  candidate.lender_code := upper(btrim(candidate.lender_code));
  candidate.lender_type := lower(btrim(candidate.lender_type));
  candidate.website := nullif(btrim(candidate.website), '');
  candidate.support_email := nullif(lower(btrim(candidate.support_email)), '');
  candidate.support_mobile := nullif(btrim(candidate.support_mobile), '');
  candidate.finance_email := nullif(lower(btrim(candidate.finance_email)), '');
  candidate.billing_address := nullif(btrim(candidate.billing_address), '');
  candidate.gstin := nullif(upper(btrim(candidate.gstin)), '');

  if length(coalesce(candidate.legal_name, '')) not between 2 and 200
    or length(coalesce(candidate.display_name, '')) not between 2 and 200 then
    raise exception 'Legal and display names are required and bounded';
  end if;
  if candidate.lender_code is null or candidate.lender_code !~ '^[A-Z0-9][A-Z0-9_-]{1,39}$' then
    raise exception 'Lender code must contain 2-40 uppercase letters, digits, underscores, or hyphens';
  end if;
  if candidate.lender_type not in ('bank', 'nbfc', 'hfc', 'fintech', 'other') then
    raise exception 'Valid lender type is required';
  end if;
  if length(coalesce(candidate.website, '')) > 500
    or length(coalesce(candidate.support_email, '')) > 320
    or length(coalesce(candidate.support_mobile, '')) > 30
    or length(coalesce(candidate.finance_email, '')) > 320
    or length(coalesce(candidate.billing_address, '')) > 1000 then
    raise exception 'Lender contact detail exceeds its maximum length';
  end if;
  if candidate.support_email is not null
    and candidate.support_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Lender support email is invalid';
  end if;
  if candidate.finance_email is not null
    and candidate.finance_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Lender finance email is invalid';
  end if;
  if candidate.gstin is not null
    and candidate.gstin !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' then
    raise exception 'Lender GSTIN is invalid';
  end if;
  if jsonb_typeof(coalesce(candidate.metadata, '{}'::jsonb)) <> 'object'
    or octet_length(coalesce(candidate.metadata, '{}'::jsonb)::text) > 65536 then
    raise exception 'Lender metadata must be a bounded JSON object';
  end if;

  if candidate.id is null then
    if coalesce(candidate.onboarding_status, 'draft') <> 'draft'
      or coalesce(candidate.kyc_status, 'pending') <> 'pending'
      or coalesce(candidate.agreement_status, 'pending') <> 'pending' then
      raise exception 'New lenders must begin in draft with pending KYC and agreement';
    end if;
    insert into public.lender_master (
      partner_id, legal_name, display_name, lender_code, lender_type, website,
      support_email, support_mobile, finance_email, billing_address, gstin, onboarding_status, kyc_status,
      agreement_status, agreement_expires_at, owner_user_id, metadata,
      created_by, updated_by
    ) values (
      candidate.partner_id, candidate.legal_name, candidate.display_name,
      candidate.lender_code, candidate.lender_type, candidate.website,
      candidate.support_email, candidate.support_mobile, candidate.finance_email,
      candidate.billing_address, candidate.gstin, 'draft', 'pending',
      'pending', candidate.agreement_expires_at, candidate.owner_user_id,
      coalesce(candidate.metadata, '{}'::jsonb), p_user_id, p_user_id
    ) returning * into target;
    perform public.register_lender_intelligence_audit(
      target.partner_id, p_user_id, 'onboarding', 'upsert_lender', 'lender', target.id::text,
      target.display_name || ' lender created',
      jsonb_build_object('operation', 'created', 'lenderCode', target.lender_code,
        'lenderType', target.lender_type, 'onboardingStatus', target.onboarding_status,
        'kycStatus', target.kyc_status, 'agreementStatus', target.agreement_status,
        'ownerUserId', target.owner_user_id)
    );
    return target;
  end if;

  select * into target from public.lender_master where id = candidate.id for update;
  if target.id is null then raise exception 'Lender not found'; end if;
  update public.lender_master set
    partner_id = candidate.partner_id,
    legal_name = candidate.legal_name,
    display_name = candidate.display_name,
    lender_code = candidate.lender_code,
    lender_type = candidate.lender_type,
    website = candidate.website,
    support_email = candidate.support_email,
    support_mobile = candidate.support_mobile,
    finance_email = candidate.finance_email,
    billing_address = candidate.billing_address,
    gstin = candidate.gstin,
    onboarding_status = candidate.onboarding_status,
    kyc_status = candidate.kyc_status,
    agreement_status = candidate.agreement_status,
    agreement_expires_at = candidate.agreement_expires_at,
    owner_user_id = candidate.owner_user_id,
    metadata = coalesce(candidate.metadata, '{}'::jsonb),
    updated_by = p_user_id
  where id = target.id
  returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'onboarding', 'upsert_lender', 'lender', target.id::text,
    target.display_name || ' lender updated',
    jsonb_build_object('operation', 'updated', 'lenderCode', target.lender_code,
      'lenderType', target.lender_type, 'onboardingStatus', target.onboarding_status,
      'kycStatus', target.kyc_status, 'agreementStatus', target.agreement_status,
      'ownerUserId', target.owner_user_id)
  );
  return target;
end;
$$;

revoke all on function public.save_lender_master(jsonb, uuid) from public;
grant execute on function public.save_lender_master(jsonb, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_master from public, anon, authenticated, service_role;
grant select on public.lender_master to service_role;

create or replace function public.save_lender_program(p_program jsonb, p_user_id uuid)
returns public.lender_programs
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.lender_programs;
  target public.lender_programs;
  lender public.lender_master;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if jsonb_typeof(p_program) <> 'object' then raise exception 'Program payload must be a JSON object'; end if;
  if octet_length(p_program::text) > 262144 then raise exception 'Program payload is too large'; end if;

  candidate := jsonb_populate_record(null::public.lender_programs, p_program);
  candidate.program_code := upper(btrim(candidate.program_code));
  candidate.program_name := btrim(candidate.program_name);
  candidate.product := lower(btrim(candidate.product));
  candidate.borrower_segment := lower(btrim(coalesce(candidate.borrower_segment, 'all')));
  candidate.processing_fee_text := nullif(btrim(candidate.processing_fee_text), '');

  if candidate.lender_id is null then raise exception 'Program lender is required'; end if;
  select * into lender from public.lender_master where id = candidate.lender_id;
  if lender.id is null then raise exception 'Program lender not found'; end if;
  if lender.partner_id is not null and candidate.partner_id is distinct from lender.partner_id then
    raise exception 'Partner-owned lender programs must remain in the lender tenant';
  end if;
  if candidate.program_code is null or candidate.program_code !~ '^[A-Z0-9][A-Z0-9_-]{1,59}$' then
    raise exception 'Program code must contain 2-60 uppercase letters, digits, underscores, or hyphens';
  end if;
  if length(coalesce(candidate.program_name, '')) not between 2 and 200
    or length(coalesce(candidate.product, '')) not between 2 and 100
    or length(candidate.borrower_segment) > 100
    or length(coalesce(candidate.processing_fee_text, '')) > 500 then
    raise exception 'Program identity fields are required and bounded';
  end if;
  if candidate.capacity_status not in ('open', 'limited', 'paused') then
    raise exception 'Valid program capacity status is required';
  end if;
  if coalesce(candidate.status, 'draft') <> 'draft' then
    raise exception 'Program content must be created and edited in draft';
  end if;
  if candidate.min_loan < 0 or candidate.max_loan < 0
    or candidate.min_tenure_months < 0 or candidate.max_tenure_months < 0
    or candidate.indicative_roi_min < 0 or candidate.indicative_roi_max < 0
    or candidate.min_loan > candidate.max_loan
    or candidate.min_tenure_months > candidate.max_tenure_months
    or candidate.indicative_roi_min > candidate.indicative_roi_max then
    raise exception 'Program numeric ranges are invalid';
  end if;
  if candidate.priority is null or candidate.priority < 0 or candidate.priority > 100000
    or (candidate.daily_submission_limit is not null
      and candidate.daily_submission_limit not between 1 and 1000000)
    or candidate.login_sla_hours is null or candidate.login_sla_hours not between 1 and 8760
    or candidate.sanction_sla_hours is null or candidate.sanction_sla_hours not between 1 and 8760
    or candidate.disbursal_sla_hours is null or candidate.disbursal_sla_hours not between 1 and 8760 then
    raise exception 'Program priority or SLA is invalid';
  end if;
  if cardinality(coalesce(candidate.employment_types, '{}')) > 100
    or cardinality(coalesce(candidate.channels, '{}')) > 100
    or cardinality(coalesce(candidate.states, '{}')) > 100
    or cardinality(coalesce(candidate.cities, '{}')) > 500
    or exists (select 1 from unnest(
      coalesce(candidate.employment_types, '{}') || coalesce(candidate.channels, '{}') ||
      coalesce(candidate.states, '{}') || coalesce(candidate.cities, '{}')
    ) value where length(btrim(value)) not between 1 and 120) then
    raise exception 'Program audience lists are invalid or too large';
  end if;
  if jsonb_typeof(coalesce(candidate.metadata, '{}'::jsonb)) <> 'object'
    or octet_length(coalesce(candidate.metadata, '{}'::jsonb)::text) > 65536 then
    raise exception 'Program metadata must be a bounded JSON object';
  end if;

  if candidate.id is null then
    insert into public.lender_programs (
      lender_id, partner_id, program_code, program_name, product, borrower_segment,
      employment_types, channels, states, cities, min_loan, max_loan,
      min_tenure_months, max_tenure_months, indicative_roi_min, indicative_roi_max,
      processing_fee_text, capacity_status, daily_submission_limit, status, priority, login_sla_hours,
      sanction_sla_hours, disbursal_sla_hours, metadata, created_by, updated_by
    ) values (
      candidate.lender_id, candidate.partner_id, candidate.program_code,
      candidate.program_name, candidate.product, candidate.borrower_segment,
      coalesce(candidate.employment_types, '{}'), coalesce(candidate.channels, '{}'),
      coalesce(candidate.states, '{}'), coalesce(candidate.cities, '{}'),
      candidate.min_loan, candidate.max_loan, candidate.min_tenure_months,
      candidate.max_tenure_months, candidate.indicative_roi_min,
      candidate.indicative_roi_max, candidate.processing_fee_text,
      candidate.capacity_status, candidate.daily_submission_limit, 'draft', candidate.priority,
      candidate.login_sla_hours, candidate.sanction_sla_hours,
      candidate.disbursal_sla_hours, coalesce(candidate.metadata, '{}'::jsonb),
      p_user_id, p_user_id
    ) returning * into target;
    perform public.register_lender_intelligence_audit(
      target.partner_id, p_user_id, 'onboarding', 'upsert_program',
      'lender_program', target.id::text, target.program_name || ' program created',
      jsonb_build_object('operation', 'created', 'lenderId', target.lender_id,
        'programCode', target.program_code, 'product', target.product,
        'status', target.status, 'capacityStatus', target.capacity_status,
        'dailySubmissionLimit', target.daily_submission_limit,
        'priority', target.priority)
    );
    return target;
  end if;

  select * into target from public.lender_programs where id = candidate.id for update;
  if target.id is null then raise exception 'Lender program not found'; end if;
  if target.status <> 'draft' then raise exception 'Only draft programs can be edited'; end if;
  update public.lender_programs set
    lender_id = candidate.lender_id, partner_id = candidate.partner_id,
    program_code = candidate.program_code, program_name = candidate.program_name,
    product = candidate.product, borrower_segment = candidate.borrower_segment,
    employment_types = coalesce(candidate.employment_types, '{}'),
    channels = coalesce(candidate.channels, '{}'), states = coalesce(candidate.states, '{}'),
    cities = coalesce(candidate.cities, '{}'), min_loan = candidate.min_loan,
    max_loan = candidate.max_loan, min_tenure_months = candidate.min_tenure_months,
    max_tenure_months = candidate.max_tenure_months,
    indicative_roi_min = candidate.indicative_roi_min,
    indicative_roi_max = candidate.indicative_roi_max,
    processing_fee_text = candidate.processing_fee_text,
    capacity_status = candidate.capacity_status,
    daily_submission_limit = candidate.daily_submission_limit,
    status = 'draft', priority = candidate.priority,
    login_sla_hours = candidate.login_sla_hours,
    sanction_sla_hours = candidate.sanction_sla_hours,
    disbursal_sla_hours = candidate.disbursal_sla_hours,
    metadata = coalesce(candidate.metadata, '{}'::jsonb), updated_by = p_user_id
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'onboarding', 'upsert_program',
    'lender_program', target.id::text, target.program_name || ' program updated',
    jsonb_build_object('operation', 'updated', 'lenderId', target.lender_id,
      'programCode', target.program_code, 'product', target.product,
      'status', target.status, 'capacityStatus', target.capacity_status,
      'dailySubmissionLimit', target.daily_submission_limit,
      'priority', target.priority)
  );
  return target;
end;
$$;

revoke all on function public.save_lender_program(jsonb, uuid) from public;
grant execute on function public.save_lender_program(jsonb, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_programs from public, anon, authenticated, service_role;
grant select on public.lender_programs to service_role;

create or replace function public.create_lender_policy_draft(
  p_program_id uuid,
  p_source_type text,
  p_source_reference text,
  p_source_checksum text,
  p_change_summary text,
  p_review_due_at timestamptz,
  p_maker_user_id uuid
)
returns public.lender_policy_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  created_policy public.lender_policy_versions;
begin
  perform public.require_lender_intelligence_actor(p_maker_user_id);
  if p_source_type not in ('manual', 'lender_document', 'lender_api', 'email', 'other') then
    raise exception 'Valid policy source type is required';
  end if;
  if length(coalesce(btrim(p_source_reference), '')) > 500
    or length(coalesce(btrim(p_change_summary), '')) > 1000 then
    raise exception 'Policy source or change summary is too long';
  end if;
  if p_source_checksum is not null and p_source_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'Policy source checksum must be SHA-256';
  end if;
  if p_review_due_at is null or p_review_due_at <= now() then
    raise exception 'Policy review due date must be in the future';
  end if;
  perform 1 from public.lender_programs where id = p_program_id for update;
  if not found then raise exception 'Lender program not found'; end if;
  if exists (
    select 1 from public.lender_policy_versions
    where program_id = p_program_id and status in ('draft', 'in_review')
  ) then raise exception 'Resolve the existing draft or in-review policy first'; end if;
  select coalesce(max(version), 0) + 1 into next_version
  from public.lender_policy_versions where program_id = p_program_id;
  insert into public.lender_policy_versions (
    program_id, version, status, source_type, source_reference, source_checksum,
    change_summary, review_due_at, created_by
  ) values (
    p_program_id, next_version, 'draft', p_source_type,
    nullif(btrim(p_source_reference), ''), p_source_checksum,
    nullif(btrim(p_change_summary), ''), p_review_due_at, p_maker_user_id
  ) returning * into created_policy;
  perform public.register_lender_intelligence_audit(
    null, p_maker_user_id, 'policy', 'create_policy_draft', 'policy_version',
    created_policy.id::text, 'Policy version ' || created_policy.version || ' created',
    jsonb_build_object('programId', created_policy.program_id, 'version', created_policy.version,
      'sourceType', created_policy.source_type, 'sourceReference', created_policy.source_reference,
      'sourceChecksum', created_policy.source_checksum, 'reviewDueAt', created_policy.review_due_at,
      'status', created_policy.status)
  );
  return created_policy;
end;
$$;

create or replace function public.submit_lender_policy(
  p_policy_version_id uuid,
  p_maker_user_id uuid
)
returns public.lender_policy_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_policy_versions;
begin
  perform public.require_lender_intelligence_actor(p_maker_user_id);
  select * into target from public.lender_policy_versions
  where id = p_policy_version_id for update;
  if target.id is null then raise exception 'Policy version not found'; end if;
  if target.status <> 'draft' then raise exception 'Only a draft policy can be submitted'; end if;
  if target.source_reference is null or btrim(target.source_reference) = '' then
    raise exception 'Policy source reference is required';
  end if;
  if target.review_due_at is null or target.review_due_at <= now() then
    raise exception 'Policy review due date must be in the future';
  end if;
  if not exists (
    select 1 from public.lender_policy_rules
    where policy_version_id = target.id and enabled
  ) then raise exception 'At least one enabled policy rule is required'; end if;
  if target.source_type = 'lender_document' and (
    target.source_checksum is null or not exists (
      select 1 from public.lender_policy_documents document
      where document.policy_version_id = target.id
        and document.checksum = target.source_checksum
        and document.review_status = 'verified'
        and (document.expires_at is null or document.expires_at > now())
    )
  ) then raise exception 'A current independently verified source document is required'; end if;
  update public.lender_policy_versions set
    status = 'in_review', submitted_by = p_maker_user_id, submitted_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    null, p_maker_user_id, 'policy', 'submit_policy', 'policy_version', target.id::text,
    'Policy submitted for independent review',
    jsonb_build_object('programId', target.program_id, 'version', target.version,
      'sourceType', target.source_type, 'sourceReference', target.source_reference,
      'sourceChecksum', target.source_checksum, 'reviewDueAt', target.review_due_at,
      'submittedAt', target.submitted_at, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.create_lender_policy_draft(uuid, text, text, text, text, timestamptz, uuid) from public;
grant execute on function public.create_lender_policy_draft(uuid, text, text, text, text, timestamptz, uuid) to service_role;
revoke all on function public.submit_lender_policy(uuid, uuid) from public;
grant execute on function public.submit_lender_policy(uuid, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_policy_versions from public, anon, authenticated, service_role;
grant select on public.lender_policy_versions to service_role;
revoke insert, update, delete, truncate on public.lender_policy_rules from public, anon, authenticated, service_role;
grant select on public.lender_policy_rules to service_role;

create or replace function public.create_lender_commercial_draft(
  p_commercial jsonb,
  p_maker_user_id uuid
)
returns public.lender_commercial_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.lender_commercial_versions;
  lender public.lender_master;
  program public.lender_programs;
  next_version integer;
  created_commercial public.lender_commercial_versions;
  tax_rate numeric;
  reverse_charge boolean;
  clawback_window integer;
  clawback_basis text;
  clawback_value numeric;
begin
  perform public.require_lender_intelligence_actor(p_maker_user_id);
  if jsonb_typeof(p_commercial) <> 'object' or octet_length(p_commercial::text) > 262144 then
    raise exception 'Commercial payload must be a bounded JSON object';
  end if;
  candidate := jsonb_populate_record(null::public.lender_commercial_versions, p_commercial);
  candidate.source_reference := nullif(btrim(candidate.source_reference), '');
  if candidate.lender_id is null then raise exception 'Commercial lender is required'; end if;
  select * into lender from public.lender_master where id = candidate.lender_id for update;
  if lender.id is null then raise exception 'Commercial lender not found'; end if;
  if lender.partner_id is not null and candidate.partner_id is distinct from lender.partner_id then
    raise exception 'Partner-owned lender commercials must remain in the lender tenant';
  end if;
  if candidate.program_id is not null then
    select * into program from public.lender_programs where id = candidate.program_id;
    if program.id is null or program.lender_id <> candidate.lender_id then
      raise exception 'Program does not belong to the commercial lender';
    end if;
    if program.partner_id is not null and candidate.partner_id is distinct from program.partner_id then
      raise exception 'Partner-owned program commercials must remain in the program tenant';
    end if;
  end if;
  if coalesce(candidate.status, 'draft') <> 'draft'
    or candidate.payout_basis not in ('flat', 'percentage', 'slab', 'custom') then
    raise exception 'Commercial must be a draft with a valid payout basis';
  end if;
  if not (
    candidate.payout_basis = 'custom'
    or (candidate.payout_basis = 'flat' and candidate.payout_value > 0)
    or (candidate.payout_basis = 'percentage' and candidate.payout_value > 0 and candidate.payout_value <= 100)
    or (candidate.payout_basis = 'slab' and public.valid_lender_payout_slabs(candidate.payout_slab))
  ) then raise exception 'Commercial payout terms are invalid'; end if;
  if jsonb_typeof(coalesce(candidate.tax_terms, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(candidate.clawback_terms, '{}'::jsonb)) <> 'object'
    or octet_length(coalesce(candidate.tax_terms, '{}'::jsonb)::text) > 16384
    or octet_length(coalesce(candidate.clawback_terms, '{}'::jsonb)::text) > 16384 then
    raise exception 'Tax and clawback terms must be bounded JSON objects';
  end if;
  begin
    tax_rate := coalesce((candidate.tax_terms->>'ratePercent')::numeric, 0);
    reverse_charge := coalesce((candidate.tax_terms->>'reverseCharge')::boolean, false);
    clawback_window := (candidate.clawback_terms->>'windowDays')::integer;
    clawback_basis := candidate.clawback_terms->>'basis';
    clawback_value := coalesce((candidate.clawback_terms->>'value')::numeric, 0);
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'Tax or clawback term has an invalid value';
  end;
  if tax_rate not between 0 and 100 or reverse_charge is null
    or clawback_window not between 0 and 3650
    or clawback_basis not in ('full', 'percentage', 'fixed')
    or (clawback_basis = 'percentage' and clawback_value not between 0.0001 and 100)
    or (clawback_basis = 'fixed' and clawback_value <= 0) then
    raise exception 'Tax or clawback terms are invalid';
  end if;
  if length(coalesce(candidate.source_reference, '')) > 500 then
    raise exception 'Commercial source reference is too long';
  end if;
  if exists (
    select 1 from public.lender_commercial_versions
    where partner_id is not distinct from candidate.partner_id
      and lender_id = candidate.lender_id
      and program_id is not distinct from candidate.program_id
      and status in ('draft', 'in_review')
  ) then raise exception 'Resolve the existing draft or in-review commercial first'; end if;
  select coalesce(max(version), 0) + 1 into next_version
  from public.lender_commercial_versions
  where partner_id is not distinct from candidate.partner_id
    and lender_id = candidate.lender_id
    and program_id is not distinct from candidate.program_id;
  insert into public.lender_commercial_versions (
    partner_id, lender_id, program_id, version, status, payout_basis, payout_value,
    payout_slab, tax_terms, clawback_terms, source_reference, created_by
  ) values (
    candidate.partner_id, candidate.lender_id, candidate.program_id, next_version,
    'draft', candidate.payout_basis,
    case when candidate.payout_basis in ('flat', 'percentage') then candidate.payout_value else null end,
    coalesce(candidate.payout_slab, '[]'::jsonb), coalesce(candidate.tax_terms, '{}'::jsonb),
    coalesce(candidate.clawback_terms, '{}'::jsonb), candidate.source_reference,
    p_maker_user_id
  ) returning * into created_commercial;
  perform public.register_lender_intelligence_audit(
    created_commercial.partner_id, p_maker_user_id, 'commercials', 'create_commercial_draft',
    'commercial_version', created_commercial.id::text,
    'Commercial version ' || created_commercial.version || ' created',
    jsonb_build_object('lenderId', created_commercial.lender_id,
      'programId', created_commercial.program_id, 'version', created_commercial.version,
      'payoutBasis', created_commercial.payout_basis,
      'sourceReference', created_commercial.source_reference, 'status', created_commercial.status)
  );
  return created_commercial;
end;
$$;

revoke all on function public.create_lender_commercial_draft(jsonb, uuid) from public;
grant execute on function public.create_lender_commercial_draft(jsonb, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_commercial_versions from public, anon, authenticated, service_role;
grant select on public.lender_commercial_versions to service_role;

create or replace function public.save_lender_rejection_reason(
  p_reason_id uuid,
  p_partner_id uuid,
  p_code text,
  p_category text,
  p_label text,
  p_description text,
  p_active boolean,
  p_sort_order integer,
  p_user_id uuid
)
returns public.lender_rejection_reasons
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_rejection_reasons;
  normalized_code text := upper(btrim(p_code));
  normalized_category text := lower(btrim(p_category));
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if normalized_code !~ '^[A-Z0-9][A-Z0-9_]{1,49}$' then
    raise exception 'Reason code must contain 2-50 uppercase letters, digits, or underscores';
  end if;
  if normalized_category !~ '^[a-z][a-z0-9_-]{1,49}$'
    or length(btrim(coalesce(p_label, ''))) not between 3 and 160
    or length(coalesce(btrim(p_description), '')) > 1000
    or p_sort_order not between 0 and 100000 then
    raise exception 'Rejection reason fields are invalid or out of bounds';
  end if;
  if p_partner_id is not null and not exists (
    select 1 from public.partners where id = p_partner_id
  ) then raise exception 'Rejection taxonomy partner not found'; end if;
  if p_reason_id is null then
    insert into public.lender_rejection_reasons (
      partner_id, code, category, label, description, active, sort_order,
      created_by, updated_by
    ) values (
      p_partner_id, normalized_code, normalized_category, btrim(p_label),
      nullif(btrim(p_description), ''), coalesce(p_active, true), p_sort_order,
      p_user_id, p_user_id
    ) returning * into target;
    perform public.register_lender_intelligence_audit(
      target.partner_id, p_user_id, 'outcomes', 'save_rejection_reason',
      'rejection_reason', target.id::text, target.code || ' rejection taxonomy created',
      jsonb_build_object('operation', 'created', 'code', target.code,
        'category', target.category, 'label', target.label, 'active', target.active,
        'sortOrder', target.sort_order)
    );
    return target;
  end if;
  select * into target from public.lender_rejection_reasons where id = p_reason_id for update;
  if target.id is null then raise exception 'Rejection reason not found'; end if;
  if target.partner_id is distinct from p_partner_id or target.code <> normalized_code then
    raise exception 'Rejection reason scope and code are immutable';
  end if;
  if target.partner_id is null and target.code = 'OTHER' and not coalesce(p_active, false) then
    raise exception 'The global OTHER fallback reason must remain active';
  end if;
  update public.lender_rejection_reasons set
    category = normalized_category, label = btrim(p_label),
    description = nullif(btrim(p_description), ''), active = coalesce(p_active, true),
    sort_order = p_sort_order, updated_by = p_user_id
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'outcomes', 'save_rejection_reason',
    'rejection_reason', target.id::text, target.code || ' rejection taxonomy updated',
    jsonb_build_object('operation', 'updated', 'code', target.code,
      'category', target.category, 'label', target.label, 'active', target.active,
      'sortOrder', target.sort_order)
  );
  return target;
end;
$$;

revoke all on function public.save_lender_rejection_reason(uuid, uuid, text, text, text, text, boolean, integer, uuid) from public;
grant execute on function public.save_lender_rejection_reason(uuid, uuid, text, text, text, text, boolean, integer, uuid) to service_role;
revoke insert, update, delete, truncate on public.lender_rejection_reasons from public, anon, authenticated, service_role;
grant select on public.lender_rejection_reasons to service_role;

create or replace function public.terminate_lender_commercial(
  p_commercial_version_id uuid,
  p_reason text,
  p_user_id uuid,
  p_terminated_at timestamptz default now()
)
returns public.lender_commercial_versions
language plpgsql
security definer
set search_path = public
as $$
declare target public.lender_commercial_versions;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_reason, ''))) not between 5 and 1000 then
    raise exception 'Commercial termination requires bounded evidence';
  end if;
  if p_terminated_at is null or p_terminated_at > now() + interval '5 minutes' then
    raise exception 'Commercial termination timestamp is invalid';
  end if;
  select * into target from public.lender_commercial_versions
  where id = p_commercial_version_id for update;
  if target.id is null then raise exception 'Commercial version not found'; end if;
  if target.status <> 'active' then raise exception 'Only an active commercial can be terminated'; end if;
  if target.effective_from is null or p_terminated_at < target.effective_from then
    raise exception 'Commercial cannot terminate before it became effective';
  end if;
  update public.lender_commercial_versions set
    status = 'terminated', effective_to = p_terminated_at,
    rejection_note = 'Termination: ' || btrim(p_reason), updated_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'commercials', 'terminate_commercial',
    'commercial_version', target.id::text, 'Active commercial terminated',
    jsonb_build_object('lenderId', target.lender_id, 'programId', target.program_id,
      'version', target.version, 'reason', btrim(p_reason),
      'terminatedAt', target.effective_to, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.terminate_lender_commercial(uuid, text, uuid, timestamptz) from public;
grant execute on function public.terminate_lender_commercial(uuid, text, uuid, timestamptz) to service_role;

create or replace function public.retire_lender_policy(
  p_policy_version_id uuid,
  p_reason text,
  p_user_id uuid,
  p_retired_at timestamptz default now()
)
returns public.lender_policy_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.lender_policy_versions;
  program public.lender_programs;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_reason, ''))) not between 5 and 1000 then
    raise exception 'Policy retirement requires bounded evidence';
  end if;
  if p_retired_at is null or p_retired_at > now() + interval '5 minutes' then
    raise exception 'Policy retirement timestamp is invalid';
  end if;
  select * into target from public.lender_policy_versions
  where id = p_policy_version_id for update;
  if target.id is null then raise exception 'Policy version not found'; end if;
  if target.status <> 'published' then raise exception 'Only a published policy can be retired'; end if;
  select * into program from public.lender_programs where id = target.program_id for update;
  if program.status = 'active' then
    raise exception 'Pause or retire the lender program before retiring its only published policy';
  end if;
  if target.effective_from is null or p_retired_at < target.effective_from then
    raise exception 'Policy cannot retire before it became effective';
  end if;
  update public.lender_policy_versions set
    status = 'retired', effective_to = p_retired_at,
    rejection_note = 'Retirement: ' || btrim(p_reason), updated_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    null, p_user_id, 'policy', 'retire_policy', 'policy_version', target.id::text,
    'Published policy retired',
    jsonb_build_object('programId', target.program_id, 'version', target.version,
      'reason', btrim(p_reason), 'retiredAt', target.effective_to, 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.retire_lender_policy(uuid, text, uuid, timestamptz) from public;
grant execute on function public.retire_lender_policy(uuid, text, uuid, timestamptz) to service_role;

create or replace function public.discard_lender_policy_draft(
  p_policy_version_id uuid,
  p_reason text,
  p_user_id uuid
)
returns public.lender_policy_versions
language plpgsql
security definer
set search_path = public
as $$
declare target public.lender_policy_versions;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_reason, ''))) not between 5 and 1000 then
    raise exception 'Policy draft discard requires actor and bounded evidence';
  end if;
  select * into target from public.lender_policy_versions where id = p_policy_version_id for update;
  if target.id is null then raise exception 'Policy version not found'; end if;
  if target.status <> 'draft' then raise exception 'Only a draft policy can be discarded'; end if;
  update public.lender_policy_versions set status = 'rejected', rejected_by = p_user_id,
    rejected_at = now(), rejection_note = 'Draft discarded: ' || btrim(p_reason), updated_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    null, p_user_id, 'policy', 'discard_policy_draft', 'policy_version', target.id::text,
    'Policy draft discarded',
    jsonb_build_object('programId', target.program_id, 'version', target.version,
      'reason', btrim(p_reason), 'status', target.status)
  );
  return target;
end;
$$;

create or replace function public.discard_lender_commercial_draft(
  p_commercial_version_id uuid,
  p_reason text,
  p_user_id uuid
)
returns public.lender_commercial_versions
language plpgsql
security definer
set search_path = public
as $$
declare target public.lender_commercial_versions;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_reason, ''))) not between 5 and 1000 then
    raise exception 'Commercial draft discard requires actor and bounded evidence';
  end if;
  select * into target from public.lender_commercial_versions where id = p_commercial_version_id for update;
  if target.id is null then raise exception 'Commercial version not found'; end if;
  if target.status <> 'draft' then raise exception 'Only a draft commercial can be discarded'; end if;
  update public.lender_commercial_versions set status = 'rejected', rejected_by = p_user_id,
    rejected_at = now(), rejection_note = 'Draft discarded: ' || btrim(p_reason), updated_at = now()
  where id = target.id returning * into target;
  perform public.register_lender_intelligence_audit(
    target.partner_id, p_user_id, 'commercials', 'discard_commercial_draft',
    'commercial_version', target.id::text, 'Commercial draft discarded',
    jsonb_build_object('lenderId', target.lender_id, 'programId', target.program_id,
      'version', target.version, 'reason', btrim(p_reason), 'status', target.status)
  );
  return target;
end;
$$;

revoke all on function public.discard_lender_policy_draft(uuid, text, uuid) from public;
grant execute on function public.discard_lender_policy_draft(uuid, text, uuid) to service_role;
revoke all on function public.discard_lender_commercial_draft(uuid, text, uuid) from public;
grant execute on function public.discard_lender_commercial_draft(uuid, text, uuid) to service_role;

-- Bulk imports must not become a weaker alternative to the governed lender and
-- program editors. Validate the batch at the database boundary, serialize each
-- global identity/program, and delegate mutations to the canonical workflows.
create or replace function public.bulk_import_lender_programs(p_rows jsonb, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  lender_record public.lender_master;
  existing_program public.lender_programs;
  imported_program public.lender_programs;
  created_count integer := 0;
  updated_count integer := 0;
  lender_count integer := 0;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'A non-empty import array is required';
  end if;
  if jsonb_array_length(p_rows) > 500 then raise exception 'Maximum 500 rows per import'; end if;
  if octet_length(p_rows::text) > 2097152 then raise exception 'Bulk import payload is too large'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_rows) row
    group by upper(btrim(row->>'programCode'))
    having count(*) > 1
  ) then raise exception 'Program codes must be unique within an import'; end if;

  for item in select value from jsonb_array_elements(p_rows)
  loop
    if jsonb_typeof(item) <> 'object' then raise exception 'Every import row must be an object'; end if;

    select * into lender_record
    from public.lender_master
    where partner_id is null and lender_code = upper(btrim(item->>'lenderCode'))
    for update;

    if lender_record.id is null then
      lender_record := public.save_lender_master(jsonb_build_object(
        'legal_name', coalesce(nullif(btrim(item->>'legalName'), ''), item->>'displayName'),
        'display_name', item->>'displayName', 'lender_code', item->>'lenderCode',
        'lender_type', item->>'lenderType', 'partner_id', null,
        'onboarding_status', 'draft', 'kyc_status', 'pending',
        'agreement_status', 'pending', 'metadata', '{}'::jsonb
      ), p_user_id);
    elsif lender_record.onboarding_status <> 'active' then
      lender_record := public.save_lender_master(
        to_jsonb(lender_record) || jsonb_build_object(
          'legal_name', coalesce(nullif(btrim(item->>'legalName'), ''), item->>'displayName'),
          'display_name', item->>'displayName', 'lender_type', item->>'lenderType'
        ), p_user_id
      );
    end if;
    lender_count := lender_count + 1;

    select * into existing_program
    from public.lender_programs
    where partner_id is null and program_code = upper(btrim(item->>'programCode'))
    for update;
    if existing_program.id is not null and existing_program.status <> 'draft' then
      raise exception 'Only draft program % can be imported', existing_program.program_code;
    end if;

    imported_program := public.save_lender_program(
      jsonb_build_object(
        'partner_id', null, 'borrower_segment', 'all',
        'employment_types', '[]'::jsonb, 'channels', '[]'::jsonb,
        'states', '[]'::jsonb, 'cities', '[]'::jsonb,
        'capacity_status', 'open', 'status', 'draft', 'priority', 100,
        'metadata', '{}'::jsonb
      ) || coalesce(to_jsonb(existing_program), '{}'::jsonb) || jsonb_build_object(
        'lender_id', lender_record.id, 'partner_id', null,
        'program_code', item->>'programCode', 'program_name', item->>'programName',
        'product', item->>'product',
        'min_loan', item->'minLoan', 'max_loan', item->'maxLoan',
        'indicative_roi_min', item->'indicativeRoiMin',
        'indicative_roi_max', item->'indicativeRoiMax',
        'login_sla_hours', coalesce(item->'loginSlaHours', '24'::jsonb),
        'sanction_sla_hours', coalesce(item->'sanctionSlaHours', '120'::jsonb),
        'disbursal_sla_hours', coalesce(item->'disbursalSlaHours', '72'::jsonb)
      ), p_user_id
    );
    if existing_program.id is null then created_count := created_count + 1;
    else updated_count := updated_count + 1;
    end if;
    existing_program := null;
  end loop;

  perform public.register_lender_intelligence_audit(
    null, p_user_id, 'onboarding', 'bulk_import_lender_programs', 'import_batch',
    null, format('Imported %s governed lender-program rows', jsonb_array_length(p_rows)),
    jsonb_build_object('rows', jsonb_array_length(p_rows),
      'lendersProcessed', lender_count, 'programsCreated', created_count,
      'programsUpdated', updated_count)
  );

  return jsonb_build_object('rows', jsonb_array_length(p_rows),
    'lendersProcessed', lender_count, 'programsCreated', created_count,
    'programsUpdated', updated_count);
end;
$$;

revoke all on function public.bulk_import_lender_programs(jsonb, uuid) from public;
grant execute on function public.bulk_import_lender_programs(jsonb, uuid) to service_role;

-- Partner commissions are a separate payable sub-ledger. They deliberately do
-- not share lender receivable invoices or commercial versions.
create table if not exists public.partner_payout_profile_versions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  version integer not null,
  status text not null default 'draft' check (status in ('draft','in_review','verified','rejected','retired')),
  legal_name text not null check (length(btrim(legal_name)) between 2 and 200),
  tax_registration_status text not null check (tax_registration_status in ('registered','unregistered')),
  gstin text,
  pan_last4 text not null check (pan_last4 ~ '^[A-Z0-9]{4}$'),
  billing_address text not null check (length(btrim(billing_address)) between 10 and 1000),
  finance_email text not null check (finance_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  account_holder_name text not null check (length(btrim(account_holder_name)) between 2 and 200),
  bank_name text not null check (length(btrim(bank_name)) between 2 and 200),
  account_number_last4 text not null check (account_number_last4 ~ '^[0-9]{4}$'),
  ifsc text not null check (ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  beneficiary_reference text not null check (length(btrim(beneficiary_reference)) between 3 and 200),
  verification_reference text not null check (length(btrim(verification_reference)) between 3 and 500),
  submitted_by uuid references auth.users(id) on delete restrict,
  submitted_at timestamptz,
  verified_by uuid references auth.users(id) on delete restrict,
  verified_at timestamptz,
  rejected_by uuid references auth.users(id) on delete restrict,
  rejected_at timestamptz,
  rejection_note text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(partner_id,version),
  constraint partner_payout_gstin_valid check ((tax_registration_status='registered' and gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$') or (tax_registration_status='unregistered' and gstin is null))
);
create unique index if not exists idx_partner_payout_profile_one_verified
  on public.partner_payout_profile_versions(partner_id) where status='verified';

create table if not exists public.partner_commission_versions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  lender_id uuid references public.lender_master(id) on delete restrict,
  program_id uuid references public.lender_programs(id) on delete restrict,
  version integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'active', 'rejected', 'expired', 'terminated')),
  commission_basis text not null check (commission_basis in ('flat', 'percentage', 'slab')),
  commission_value numeric(12,4),
  commission_slab jsonb not null default '[]'::jsonb,
  tax_rate numeric(7,4) not null default 0 check (tax_rate between 0 and 100),
  withholding_rate numeric(7,4) not null default 0 check (withholding_rate between 0 and 100),
  eligibility_event text not null default 'disbursed' check (eligibility_event = 'disbursed'),
  payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 365),
  source_reference text not null,
  effective_from timestamptz,
  effective_to timestamptz,
  submitted_by uuid references auth.users(id) on delete restrict,
  submitted_at timestamptz,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  rejected_by uuid references auth.users(id) on delete restrict,
  rejected_at timestamptz,
  rejection_note text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique nulls not distinct (partner_id, lender_id, program_id, version),
  check (effective_to is null or effective_from is null or effective_to > effective_from),
  constraint partner_commission_terms_valid check ((commission_basis = 'flat' and commission_value > 0) or (commission_basis = 'percentage' and commission_value > 0 and commission_value <= 100) or (commission_basis = 'slab' and public.valid_lender_payout_slabs(commission_slab)))
);

create unique index if not exists idx_partner_commission_one_active
  on public.partner_commission_versions(
    partner_id,
    coalesce(lender_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) where status = 'active' and effective_to is null;

create table if not exists public.partner_commission_items (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  application_id text not null references public.crm_lender_applications(id) on delete restrict,
  outcome_id uuid not null unique references public.lender_outcomes(id) on delete restrict,
  payout_profile_version_id uuid not null references public.partner_payout_profile_versions(id) on delete restrict,
  commission_version_id uuid not null references public.partner_commission_versions(id) on delete restrict,
  lender_id uuid not null references public.lender_master(id) on delete restrict,
  program_id uuid not null references public.lender_programs(id) on delete restrict,
  disbursed_amount numeric(14,2) not null check (disbursed_amount > 0),
  gross_commission numeric(14,2) not null check (gross_commission > 0),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  withholding_amount numeric(14,2) not null default 0 check (withholding_amount >= 0),
  net_payable numeric(14,2) not null check (net_payable > 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'payable_ready'
    check (status in ('payable_ready', 'part_paid', 'paid', 'disputed', 'held', 'written_off')),
  status_note text,
  due_at timestamptz not null,
  settled_at timestamptz,
  terms_snapshot jsonb not null,
  beneficiary_snapshot jsonb not null,
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (net_payable = gross_commission + tax_amount - withholding_amount),
  check (withholding_amount <= gross_commission + tax_amount),
  check (paid_amount <= net_payable)
);

create table if not exists public.partner_commission_payments (
  id uuid primary key default gen_random_uuid(),
  commission_item_id uuid not null references public.partner_commission_items(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  reference text not null check (length(btrim(reference)) between 3 and 100),
  idempotency_key text not null check (length(btrim(idempotency_key)) between 8 and 200),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  unique (commission_item_id, idempotency_key)
);

create table if not exists public.partner_commission_payment_requests (
  id uuid primary key default gen_random_uuid(),
  commission_item_id uuid not null references public.partner_commission_items(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_reference text not null check (length(btrim(payment_reference)) between 3 and 100),
  idempotency_key text not null check (length(btrim(idempotency_key)) between 8 and 200),
  request_note text not null check (length(btrim(request_note)) between 5 and 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  review_note text,
  payment_id uuid references public.partner_commission_payments(id) on delete restrict,
  unique(commission_item_id,idempotency_key)
);

create index if not exists idx_partner_commission_items_partner_status
  on public.partner_commission_items(partner_id, status, due_at);
create index if not exists idx_partner_commission_payments_item
  on public.partner_commission_payments(commission_item_id, recorded_at desc);
create index if not exists idx_partner_commission_payment_requests_status
  on public.partner_commission_payment_requests(status,requested_at);

alter table public.partner_payout_profile_versions enable row level security;
alter table public.partner_commission_versions enable row level security;
alter table public.partner_commission_items enable row level security;
alter table public.partner_commission_payments enable row level security;
alter table public.partner_commission_payment_requests enable row level security;

create or replace function public.protect_partner_commission_evidence()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'Partner commission evidence is immutable; use its governed workflow';
end;
$$;

create trigger protect_partner_commission_versions_direct_write
before update or delete on public.partner_commission_versions
for each row execute function public.protect_partner_commission_evidence();
create trigger protect_partner_commission_items_direct_write
before update or delete on public.partner_commission_items
for each row execute function public.protect_partner_commission_evidence();
create trigger protect_partner_commission_payments_direct_write
before update or delete on public.partner_commission_payments
for each row execute function public.protect_partner_commission_evidence();
create trigger protect_partner_commission_payment_requests_direct_write
before update or delete on public.partner_commission_payment_requests
for each row execute function public.protect_partner_commission_evidence();

create trigger protect_partner_payout_profiles_direct_write
before update or delete on public.partner_payout_profile_versions
for each row execute function public.protect_partner_commission_evidence();

create or replace function public.create_partner_payout_profile_draft(p_profile jsonb,p_user_id uuid)
returns public.partner_payout_profile_versions
language plpgsql security definer set search_path=public as $$
declare candidate public.partner_payout_profile_versions; next_version integer;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if jsonb_typeof(p_profile)<>'object' or octet_length(p_profile::text)>65536 then raise exception 'Invalid payout profile payload'; end if;
  candidate:=jsonb_populate_record(null::public.partner_payout_profile_versions,p_profile);
  candidate.legal_name:=btrim(candidate.legal_name); candidate.gstin:=nullif(upper(btrim(candidate.gstin)),'');
  candidate.pan_last4:=upper(btrim(candidate.pan_last4)); candidate.billing_address:=btrim(candidate.billing_address);
  candidate.finance_email:=lower(btrim(candidate.finance_email)); candidate.account_holder_name:=btrim(candidate.account_holder_name);
  candidate.bank_name:=btrim(candidate.bank_name); candidate.account_number_last4:=btrim(candidate.account_number_last4);
  candidate.ifsc:=upper(btrim(candidate.ifsc)); candidate.beneficiary_reference:=btrim(candidate.beneficiary_reference);
  candidate.verification_reference:=btrim(candidate.verification_reference);
  if candidate.partner_id is null then raise exception 'Partner is required'; end if;
  perform 1 from public.partners where id=candidate.partner_id for update;
  if not found then raise exception 'Partner not found'; end if;
  if exists(select 1 from public.partner_payout_profile_versions where partner_id=candidate.partner_id and status in ('draft','in_review')) then
    raise exception 'Resolve the existing payout profile draft or review first'; end if;
  select coalesce(max(version),0)+1 into next_version from public.partner_payout_profile_versions where partner_id=candidate.partner_id;
  insert into public.partner_payout_profile_versions(partner_id,version,status,legal_name,tax_registration_status,gstin,pan_last4,
    billing_address,finance_email,account_holder_name,bank_name,account_number_last4,ifsc,beneficiary_reference,
    verification_reference,created_by)
  values(candidate.partner_id,next_version,'draft',candidate.legal_name,candidate.tax_registration_status,candidate.gstin,
    candidate.pan_last4,candidate.billing_address,candidate.finance_email,candidate.account_holder_name,candidate.bank_name,
    candidate.account_number_last4,candidate.ifsc,candidate.beneficiary_reference,candidate.verification_reference,p_user_id)
  returning * into candidate;
  perform public.register_lender_intelligence_audit(candidate.partner_id,p_user_id,'partner_commissions','create_payout_profile_draft',
    'partner_payout_profile',candidate.id::text,'Masked partner payout profile draft created',
    jsonb_build_object('version',candidate.version,'taxRegistrationStatus',candidate.tax_registration_status,
      'accountLast4',candidate.account_number_last4,'ifsc',candidate.ifsc,'verificationReference',candidate.verification_reference));
  return candidate;
end; $$;

create or replace function public.review_partner_payout_profile(p_profile_id uuid,p_decision text,p_reason text,p_user_id uuid)
returns public.partner_payout_profile_versions
language plpgsql security definer set search_path=public as $$
declare target public.partner_payout_profile_versions;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select * into target from public.partner_payout_profile_versions where id=p_profile_id for update;
  if target.id is null then raise exception 'Payout profile not found'; end if;
  if p_decision='submit' then
    if target.status<>'draft' then raise exception 'Only a draft payout profile can be submitted'; end if;
    perform set_config('app.li_partner_commission_write','on',true);
    update public.partner_payout_profile_versions set status='in_review',submitted_by=p_user_id,submitted_at=now()
      where id=target.id returning * into target;
  elsif p_decision in ('verify','reject') then
    if target.status<>'in_review' then raise exception 'Only an in-review payout profile can be decided'; end if;
    if target.submitted_by=p_user_id then raise exception 'Maker and checker must be different admins'; end if;
    if p_decision='reject' and length(btrim(coalesce(p_reason,'')))<5 then raise exception 'Detailed rejection evidence is required'; end if;
    perform set_config('app.li_partner_commission_write','on',true);
    if p_decision='verify' then
      update public.partner_payout_profile_versions set status='retired' where partner_id=target.partner_id and status='verified';
      update public.partner_payout_profile_versions set status='verified',verified_by=p_user_id,verified_at=now()
        where id=target.id returning * into target;
    else
      update public.partner_payout_profile_versions set status='rejected',rejected_by=p_user_id,rejected_at=now(),rejection_note=btrim(p_reason)
        where id=target.id returning * into target;
    end if;
  else raise exception 'Unsupported payout profile review decision'; end if;
  perform public.register_lender_intelligence_audit(target.partner_id,p_user_id,'partner_commissions',p_decision||'_payout_profile',
    'partner_payout_profile',target.id::text,'Partner payout profile lifecycle advanced',
    jsonb_build_object('version',target.version,'status',target.status,'reason',nullif(btrim(coalesce(p_reason,'')),'')));
  return target;
end; $$;

create or replace function public.create_partner_commission_draft(p_terms jsonb, p_user_id uuid)
returns public.partner_commission_versions
language plpgsql security definer set search_path = public as $$
declare candidate public.partner_commission_versions; next_version integer;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  candidate := jsonb_populate_record(null::public.partner_commission_versions, p_terms);
  if candidate.partner_id is null then raise exception 'Partner is required'; end if;
  if jsonb_typeof(p_terms) <> 'object' or octet_length(p_terms::text) > 65536 then raise exception 'Invalid commission terms payload'; end if;
  if length(btrim(coalesce(candidate.source_reference, ''))) < 3 then raise exception 'Commission source reference is required'; end if;
  if candidate.program_id is not null and not exists (
    select 1 from public.lender_programs p where p.id = candidate.program_id
      and (candidate.lender_id is null or p.lender_id = candidate.lender_id)
      and (p.partner_id is null or p.partner_id = candidate.partner_id)
  ) then raise exception 'Commission program scope is invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended(candidate.partner_id::text || ':' || coalesce(candidate.lender_id::text, '*') || ':' || coalesce(candidate.program_id::text, '*'), 0));
  if exists (select 1 from public.partner_commission_versions v where v.partner_id = candidate.partner_id
    and v.lender_id is not distinct from candidate.lender_id and v.program_id is not distinct from candidate.program_id
    and v.status in ('draft','in_review')) then raise exception 'A draft or review commission already exists for this scope'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.partner_commission_versions v
    where v.partner_id = candidate.partner_id and v.lender_id is not distinct from candidate.lender_id
      and v.program_id is not distinct from candidate.program_id;
  perform set_config('app.li_partner_commission_write', 'on', true);
  insert into public.partner_commission_versions(partner_id,lender_id,program_id,version,status,
    commission_basis,commission_value,commission_slab,tax_rate,withholding_rate,payment_terms_days,
    source_reference,created_by)
  values(candidate.partner_id,candidate.lender_id,candidate.program_id,next_version,'draft',candidate.commission_basis,
    candidate.commission_value,coalesce(candidate.commission_slab,'[]'::jsonb),coalesce(candidate.tax_rate,0),
    coalesce(candidate.withholding_rate,0),coalesce(candidate.payment_terms_days,30),btrim(candidate.source_reference),p_user_id)
  returning * into candidate;
  perform public.register_lender_intelligence_audit(candidate.partner_id,p_user_id,'partner_commissions',
    'create_commission_draft','partner_commission_version',candidate.id::text,'Partner commission draft created',
    jsonb_build_object('version',candidate.version,'lenderId',candidate.lender_id,'programId',candidate.program_id));
  return candidate;
end; $$;

create or replace function public.review_partner_commission(p_version_id uuid, p_decision text, p_reason text, p_user_id uuid)
returns public.partner_commission_versions
language plpgsql security definer set search_path = public as $$
declare target public.partner_commission_versions;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select * into target from public.partner_commission_versions where id=p_version_id for update;
  if target.id is null then raise exception 'Commission version not found'; end if;
  if p_decision = 'submit' then
    if target.status <> 'draft' then raise exception 'Only a draft commission can be submitted'; end if;
    perform set_config('app.li_partner_commission_write','on',true);
    update public.partner_commission_versions set status='in_review',submitted_by=p_user_id,submitted_at=now()
      where id=target.id returning * into target;
  elsif p_decision in ('activate','reject') then
    if target.status <> 'in_review' then raise exception 'Only an in-review commission can be decided'; end if;
    if target.submitted_by = p_user_id then raise exception 'Maker and checker must be different admins'; end if;
    if p_decision='reject' and length(btrim(coalesce(p_reason,''))) < 5 then raise exception 'Detailed rejection evidence is required'; end if;
    perform set_config('app.li_partner_commission_write','on',true);
    if p_decision='activate' then
      if not exists(select 1 from public.partner_payout_profile_versions profile where profile.partner_id=target.partner_id and profile.status='verified') then
        raise exception 'A verified partner payout profile is required before commission activation'; end if;
      update public.partner_commission_versions set status='expired',effective_to=now()
      where partner_id=target.partner_id and lender_id is not distinct from target.lender_id
        and program_id is not distinct from target.program_id and status='active' and effective_to is null;
      update public.partner_commission_versions set status='active',approved_by=p_user_id,approved_at=now(),effective_from=now()
        where id=target.id returning * into target;
    else
      update public.partner_commission_versions set status='rejected',rejected_by=p_user_id,rejected_at=now(),rejection_note=btrim(p_reason)
        where id=target.id returning * into target;
    end if;
  else raise exception 'Unsupported commission review decision'; end if;
  perform public.register_lender_intelligence_audit(target.partner_id,p_user_id,'partner_commissions',
    p_decision || '_commission','partner_commission_version',target.id::text,'Partner commission lifecycle advanced',
    jsonb_build_object('version',target.version,'status',target.status,'reason',nullif(btrim(coalesce(p_reason,'')),'')));
  return target;
end; $$;

create or replace function public.materialize_partner_commission()
returns trigger language plpgsql security definer set search_path = public as $$
declare terms public.partner_commission_versions; profile public.partner_payout_profile_versions; slab jsonb; gross numeric(14,2); tax numeric(14,2); withholding numeric(14,2); created_item public.partner_commission_items; payout_event_at timestamptz;
begin
  if new.outcome <> 'disbursed' or new.disbursed_amount is null or new.disbursed_amount <= 0 then return new; end if;
  payout_event_at := coalesce(new.disbursed_at, new.decided_at);
  if payout_event_at is null then raise exception 'Partner commission requires a canonical outcome timestamp'; end if;
  select * into terms from public.partner_commission_versions v
  where v.partner_id=new.partner_id and v.status='active' and v.effective_from <= payout_event_at
    and (v.effective_to is null or v.effective_to > payout_event_at)
    and (v.lender_id is null or v.lender_id=new.lender_id)
    and (v.program_id is null or v.program_id=new.program_id)
  order by (v.program_id is not null) desc,(v.lender_id is not null) desc,v.version desc limit 1;
  if terms.id is null then return new; end if;
  select * into profile from public.partner_payout_profile_versions where partner_id=new.partner_id and status='verified';
  if profile.id is null then raise exception 'Active commission has no verified partner payout profile'; end if;
  if terms.commission_basis='flat' then gross:=terms.commission_value;
  elsif terms.commission_basis='percentage' then gross:=new.disbursed_amount*terms.commission_value/100;
  else
    select value into slab from jsonb_array_elements(terms.commission_slab) value
      where new.disbursed_amount >= (value->>'min')::numeric
        and (value->'max'='null'::jsonb or new.disbursed_amount <= (value->>'max')::numeric) limit 1;
    if slab->>'basis'='flat' then gross:=(slab->>'value')::numeric;
    else gross:=new.disbursed_amount*(slab->>'value')::numeric/100; end if;
  end if;
  gross:=round(gross,2); tax:=round(gross*terms.tax_rate/100,2); withholding:=round(gross*terms.withholding_rate/100,2);
  if gross <= 0 or gross+tax-withholding <= 0 then raise exception 'Partner commission terms produced an invalid payable'; end if;
  insert into public.partner_commission_items(partner_id,application_id,outcome_id,payout_profile_version_id,commission_version_id,lender_id,
    program_id,disbursed_amount,gross_commission,tax_amount,withholding_amount,net_payable,due_at,terms_snapshot,beneficiary_snapshot)
  values(new.partner_id,new.application_id,new.id,profile.id,terms.id,new.lender_id,new.program_id,new.disbursed_amount,gross,tax,
    withholding,gross+tax-withholding,payout_event_at+make_interval(days=>terms.payment_terms_days),
    jsonb_build_object('version',terms.version,'basis',terms.commission_basis,'value',terms.commission_value,
      'slab',terms.commission_slab,'taxRate',terms.tax_rate,'withholdingRate',terms.withholding_rate,
      'paymentTermsDays',terms.payment_terms_days,'sourceReference',terms.source_reference),
    jsonb_build_object('profileVersion',profile.version,'legalName',profile.legal_name,'taxRegistrationStatus',profile.tax_registration_status,
      'gstin',profile.gstin,'panLast4',profile.pan_last4,'billingAddress',profile.billing_address,'financeEmail',profile.finance_email,
      'accountHolderName',profile.account_holder_name,'bankName',profile.bank_name,'accountNumberLast4',profile.account_number_last4,
      'ifsc',profile.ifsc,'beneficiaryReference',profile.beneficiary_reference,'verificationReference',profile.verification_reference)) returning * into created_item;
  perform public.register_lender_intelligence_audit(new.partner_id,new.created_by,'partner_commissions','materialize_commission',
    'partner_commission_item',created_item.id::text,'Disbursal materialized a partner payable',
    jsonb_build_object('applicationId',new.application_id,'outcomeId',new.id,'commissionVersionId',terms.id,
      'grossCommission',gross,'taxAmount',tax,'withholdingAmount',withholding,'netPayable',created_item.net_payable));
  return new;
end; $$;

create trigger materialize_partner_commission_after_outcome
after insert on public.lender_outcomes for each row execute function public.materialize_partner_commission();

create or replace function public.record_partner_commission_payment(p_item_id uuid,p_amount numeric,p_reference text,p_idempotency_key text,p_user_id uuid)
returns public.partner_commission_items
language plpgsql security definer set search_path = public as $$
declare target public.partner_commission_items; existing public.partner_commission_payments;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_amount <= 0 or p_amount <> round(p_amount,2) then raise exception 'Payment must be a positive two-decimal amount'; end if;
  if length(btrim(coalesce(p_reference,''))) not between 3 and 100 or length(btrim(coalesce(p_idempotency_key,''))) not between 8 and 200 then
    raise exception 'Valid payment reference and idempotency key are required'; end if;
  select * into target from public.partner_commission_items where id=p_item_id for update;
  if target.id is null then raise exception 'Partner commission item not found'; end if;
  select * into existing from public.partner_commission_payments where commission_item_id=target.id and idempotency_key=btrim(p_idempotency_key);
  if existing.id is not null then
    if existing.amount<>p_amount or existing.reference<>btrim(p_reference) then raise exception 'Idempotency key conflicts with existing payment'; end if;
    return target;
  end if;
  if target.status not in ('payable_ready','part_paid') or target.paid_amount+p_amount>target.net_payable then raise exception 'Payment exceeds the open payable'; end if;
  perform set_config('app.li_partner_commission_write','on',true);
  insert into public.partner_commission_payments(commission_item_id,amount,reference,idempotency_key,recorded_by)
    values(target.id,p_amount,btrim(p_reference),btrim(p_idempotency_key),p_user_id);
  update public.partner_commission_items set paid_amount=paid_amount+p_amount,
    status=case when paid_amount+p_amount=net_payable then 'paid' else 'part_paid' end,
    settled_at=case when paid_amount+p_amount=net_payable then now() else null end,
    updated_by=p_user_id,updated_at=now()
    where id=target.id returning * into target;
  perform public.register_lender_intelligence_audit(target.partner_id,p_user_id,'partner_commissions','record_commission_payment',
    'partner_commission_item',target.id::text,'Partner commission payment recorded',
    jsonb_build_object('amount',p_amount,'reference',btrim(p_reference),'status',target.status,'paidAmount',target.paid_amount));
  return target;
end; $$;

create or replace function public.request_partner_commission_payment(p_item_id uuid,p_amount numeric,p_reference text,p_idempotency_key text,p_note text,p_user_id uuid)
returns public.partner_commission_payment_requests
language plpgsql security definer set search_path=public as $$
declare item public.partner_commission_items; request_record public.partner_commission_payment_requests;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_amount<=0 or p_amount<>round(p_amount,2) then raise exception 'Payment request must be a positive two-decimal amount'; end if;
  if length(btrim(coalesce(p_reference,''))) not between 3 and 100 or length(btrim(coalesce(p_idempotency_key,''))) not between 8 and 200
    or length(btrim(coalesce(p_note,''))) not between 5 and 500 then raise exception 'Payment request reference, key, and evidence are required and bounded'; end if;
  select * into item from public.partner_commission_items where id=p_item_id for update;
  if item.id is null then raise exception 'Partner commission item not found'; end if;
  if item.status not in ('payable_ready','part_paid') or item.paid_amount+p_amount>item.net_payable then raise exception 'Payment request exceeds the open payable'; end if;
  if exists(select 1 from public.partner_commission_payment_requests where commission_item_id=item.id and status='pending') then
    raise exception 'Resolve the existing payment request for this payable first'; end if;
  insert into public.partner_commission_payment_requests(commission_item_id,amount,payment_reference,idempotency_key,request_note,requested_by)
    values(item.id,p_amount,btrim(p_reference),btrim(p_idempotency_key),btrim(p_note),p_user_id) returning * into request_record;
  perform public.register_lender_intelligence_audit(item.partner_id,p_user_id,'partner_commissions','request_commission_payment',
    'partner_commission_payment_request',request_record.id::text,'Partner commission payment requested',
    jsonb_build_object('commissionItemId',item.id,'amount',p_amount,'paymentReference',btrim(p_reference),'requestNote',btrim(p_note)));
  return request_record;
end; $$;

create or replace function public.review_partner_commission_payment(p_request_id uuid,p_decision text,p_review_note text,p_user_id uuid)
returns public.partner_commission_payment_requests
language plpgsql security definer set search_path=public as $$
declare request_record public.partner_commission_payment_requests; item public.partner_commission_items; payment public.partner_commission_payments;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if p_decision not in ('approved','rejected') or length(btrim(coalesce(p_review_note,''))) not between 5 and 500 then
    raise exception 'Payment review decision and evidence are required'; end if;
  select * into request_record from public.partner_commission_payment_requests where id=p_request_id for update;
  if request_record.id is null then raise exception 'Payment request not found'; end if;
  if request_record.status<>'pending' then raise exception 'Only a pending payment request can be reviewed'; end if;
  if request_record.requested_by=p_user_id then raise exception 'Payment maker and checker must be different admins'; end if;
  select * into item from public.partner_commission_items where id=request_record.commission_item_id for update;
  perform set_config('app.li_partner_commission_write','on',true);
  if p_decision='approved' then
    if item.status not in ('payable_ready','part_paid') or item.paid_amount+request_record.amount>item.net_payable then
      raise exception 'Payment request is stale or exceeds the open payable'; end if;
    item:=public.record_partner_commission_payment(item.id,request_record.amount,request_record.payment_reference,request_record.idempotency_key,p_user_id);
    select * into payment from public.partner_commission_payments where commission_item_id=item.id and idempotency_key=request_record.idempotency_key;
  end if;
  update public.partner_commission_payment_requests set status=p_decision,reviewed_by=p_user_id,reviewed_at=now(),
    review_note=btrim(p_review_note),payment_id=payment.id where id=request_record.id returning * into request_record;
  perform public.register_lender_intelligence_audit(item.partner_id,p_user_id,'partner_commissions','review_commission_payment',
    'partner_commission_payment_request',request_record.id::text,'Partner commission payment request reviewed',
    jsonb_build_object('decision',p_decision,'reviewNote',btrim(p_review_note),'paymentId',request_record.payment_id,
      'amount',request_record.amount,'requestedBy',request_record.requested_by));
  return request_record;
end; $$;

create or replace function public.terminate_partner_commission(p_version_id uuid,p_reason text,p_user_id uuid)
returns public.partner_commission_versions
language plpgsql security definer set search_path = public as $$
declare target public.partner_commission_versions;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_reason,''))) < 5 then raise exception 'Detailed termination evidence is required'; end if;
  select * into target from public.partner_commission_versions where id=p_version_id for update;
  if target.id is null then raise exception 'Commission version not found'; end if;
  if target.status <> 'active' or target.effective_from is null or target.effective_from > now() then
    raise exception 'Only a currently active commission can be terminated'; end if;
  perform set_config('app.li_partner_commission_write','on',true);
  update public.partner_commission_versions set status='terminated',effective_to=now()
    where id=target.id returning * into target;
  perform public.register_lender_intelligence_audit(target.partner_id,p_user_id,'partner_commissions','terminate_commission',
    'partner_commission_version',target.id::text,'Partner commission contract terminated',
    jsonb_build_object('version',target.version,'reason',btrim(p_reason),'effectiveTo',target.effective_to));
  return target;
end; $$;

create or replace function public.manage_partner_commission_item(p_item_id uuid,p_action text,p_reason text,p_user_id uuid)
returns public.partner_commission_items
language plpgsql security definer set search_path = public as $$
declare target public.partner_commission_items; next_status text;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  if length(btrim(coalesce(p_reason,''))) < 5 then raise exception 'Detailed payable action evidence is required'; end if;
  select * into target from public.partner_commission_items where id=p_item_id for update;
  if target.id is null then raise exception 'Partner commission item not found'; end if;
  if p_action in ('hold','dispute') then
    if target.status not in ('payable_ready','part_paid') then raise exception 'Only an open payable can be held or disputed'; end if;
    next_status:=case when p_action='hold' then 'held' else 'disputed' end;
  elsif p_action='release' then
    if target.status not in ('held','disputed') then raise exception 'Only a held or disputed payable can be released'; end if;
    next_status:=case when target.paid_amount>0 then 'part_paid' else 'payable_ready' end;
  elsif p_action='write_off' then
    if target.status not in ('payable_ready','part_paid','held','disputed') or target.paid_amount>=target.net_payable then
      raise exception 'Only an unsettled payable balance can be written off'; end if;
    next_status:='written_off';
  else raise exception 'Unsupported payable action'; end if;
  perform set_config('app.li_partner_commission_write','on',true);
  update public.partner_commission_items set status=next_status,status_note=btrim(p_reason),updated_by=p_user_id,
    updated_at=now(),settled_at=case when next_status='written_off' then now() else settled_at end
    where id=target.id returning * into target;
  perform public.register_lender_intelligence_audit(target.partner_id,p_user_id,'partner_commissions',p_action || '_commission_payable',
    'partner_commission_item',target.id::text,'Partner commission payable status changed',
    jsonb_build_object('status',target.status,'reason',target.status_note,'paidAmount',target.paid_amount,'netPayable',target.net_payable));
  return target;
end; $$;

create or replace function public.refresh_partner_commission_issues()
returns integer language plpgsql security definer set search_path = public as $$
declare refreshed integer:=0;
begin
  update public.lender_data_quality_issues set status='resolved',resolved_at=now(),
    resolution_note='Automatically cleared by partner payable scan',updated_at=now()
  where source='system' and status='open' and fingerprint like 'partner-payable-overdue:%';
  insert into public.lender_data_quality_issues(partner_id,lender_id,program_id,application_id,issue_type,severity,status,title,detail,fingerprint,source)
  select item.partner_id,item.lender_id,item.program_id,item.application_id,'partner_payable_overdue',
    case when item.due_at < now()-interval '30 days' then 'critical' else 'warning' end,'open',
    'Partner commission payment is overdue','Review the governed partner payable and record settlement, hold, dispute, or write-off evidence.',
    'partner-payable-overdue:'||item.id::text,'system'
  from public.partner_commission_items item
  where item.status in ('payable_ready','part_paid') and item.paid_amount<item.net_payable and item.due_at<now()
  on conflict(fingerprint) do update set status=case when lender_data_quality_issues.status in ('in_progress','accepted') then lender_data_quality_issues.status else 'open' end,
    severity=excluded.severity,
    resolved_at=case when lender_data_quality_issues.status='accepted' then lender_data_quality_issues.resolved_at else null end,
    resolution_note=case when lender_data_quality_issues.status='accepted' then lender_data_quality_issues.resolution_note else null end,
    updated_at=now();
  get diagnostics refreshed=row_count;
  return refreshed;
end; $$;

create or replace function public.guard_partner_commission_mutation()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_setting('app.li_partner_commission_write',true) is distinct from 'on' then
    raise exception 'Partner commission evidence requires its governed workflow'; end if;
  return new;
end; $$;

drop trigger protect_partner_commission_versions_direct_write on public.partner_commission_versions;
create trigger protect_partner_commission_versions_direct_write before update or delete on public.partner_commission_versions
for each row execute function public.guard_partner_commission_mutation();
drop trigger protect_partner_payout_profiles_direct_write on public.partner_payout_profile_versions;
create trigger protect_partner_payout_profiles_direct_write before update or delete on public.partner_payout_profile_versions
for each row execute function public.guard_partner_commission_mutation();
drop trigger protect_partner_commission_items_direct_write on public.partner_commission_items;
create trigger protect_partner_commission_items_direct_write before update or delete on public.partner_commission_items
for each row execute function public.guard_partner_commission_mutation();
drop trigger protect_partner_commission_payment_requests_direct_write on public.partner_commission_payment_requests;
create trigger protect_partner_commission_payment_requests_direct_write before update or delete on public.partner_commission_payment_requests
for each row execute function public.guard_partner_commission_mutation();

revoke all on table public.partner_payout_profile_versions,public.partner_commission_versions,public.partner_commission_items,public.partner_commission_payments,public.partner_commission_payment_requests from anon,authenticated,service_role;
grant select on table public.partner_payout_profile_versions,public.partner_commission_versions,public.partner_commission_items,public.partner_commission_payments,public.partner_commission_payment_requests to service_role;
revoke all on function public.create_partner_payout_profile_draft(jsonb,uuid) from public;
revoke all on function public.review_partner_payout_profile(uuid,text,text,uuid) from public;
revoke all on function public.create_partner_commission_draft(jsonb,uuid) from public;
revoke all on function public.review_partner_commission(uuid,text,text,uuid) from public;
revoke all on function public.record_partner_commission_payment(uuid,numeric,text,text,uuid) from public;
revoke all on function public.request_partner_commission_payment(uuid,numeric,text,text,text,uuid) from public;
revoke all on function public.review_partner_commission_payment(uuid,text,text,uuid) from public;
revoke all on function public.terminate_partner_commission(uuid,text,uuid) from public;
revoke all on function public.manage_partner_commission_item(uuid,text,text,uuid) from public;
revoke all on function public.refresh_partner_commission_issues() from public;
grant execute on function public.create_partner_payout_profile_draft(jsonb,uuid),public.review_partner_payout_profile(uuid,text,text,uuid),public.create_partner_commission_draft(jsonb,uuid),public.review_partner_commission(uuid,text,text,uuid),public.request_partner_commission_payment(uuid,numeric,text,text,text,uuid),public.review_partner_commission_payment(uuid,text,text,uuid),public.terminate_partner_commission(uuid,text,uuid),public.manage_partner_commission_item(uuid,text,text,uuid),public.refresh_partner_commission_issues() to service_role;

create table if not exists public.lender_compliance_scan_runs (
  id uuid primary key default gen_random_uuid(),
  readiness_issue_count integer not null check (readiness_issue_count >= 0),
  partner_payable_issue_count integer not null check (partner_payable_issue_count >= 0),
  total_issue_count integer generated always as (readiness_issue_count + partner_payable_issue_count) stored,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  check (completed_at >= started_at)
);

alter table public.lender_compliance_scan_runs enable row level security;
drop policy if exists lender_compliance_scan_runs_service_read on public.lender_compliance_scan_runs;
create policy lender_compliance_scan_runs_service_read on public.lender_compliance_scan_runs
  for select to service_role using (true);
revoke all on table public.lender_compliance_scan_runs from anon, authenticated, service_role;
grant select on table public.lender_compliance_scan_runs to service_role;

create or replace function public.run_lender_compliance_scan()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  scan_started_at timestamptz := clock_timestamp();
  scan_completed_at timestamptz;
  readiness_count integer;
  partner_count integer;
  scan_run public.lender_compliance_scan_runs;
begin
  perform pg_advisory_xact_lock(hashtextextended('lender-compliance-scan', 0));
  readiness_count := public.refresh_lender_data_quality_issues();
  partner_count := public.refresh_partner_commission_issues();
  scan_completed_at := clock_timestamp();
  insert into public.lender_compliance_scan_runs (
    readiness_issue_count, partner_payable_issue_count, started_at, completed_at
  ) values (
    coalesce(readiness_count, 0), coalesce(partner_count, 0), scan_started_at, scan_completed_at
  ) returning * into scan_run;
  return jsonb_build_object(
    'runId', scan_run.id,
    'readinessIssues', scan_run.readiness_issue_count,
    'partnerPayableIssues', scan_run.partner_payable_issue_count,
    'refreshedIssues', scan_run.total_issue_count,
    'startedAt', scan_run.started_at,
    'scannedAt', scan_run.completed_at
  );
end;
$$;

revoke all on function public.run_lender_compliance_scan() from public, anon, authenticated;
grant execute on function public.run_lender_compliance_scan() to service_role;

-- Partner commission recoveries remain separate from lender-receivable
-- clawbacks. A recovery can never exceed cash actually paid to the partner,
-- and maker-checker resolution preserves collection/waiver evidence.
create table if not exists public.partner_commission_recoveries (
  id uuid primary key default gen_random_uuid(),
  commission_item_id uuid not null references public.partner_commission_items(id) on delete restrict,
  partner_id uuid not null references public.partners(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  trigger_code text not null check (trigger_code ~ '^[A-Z][A-Z0-9_]{2,49}$'),
  trigger_note text not null check (length(btrim(trigger_note)) between 5 and 500),
  status text not null default 'open' check (status in ('open','disputed','recovered','waived')),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  resolution_reference text,
  resolution_note text,
  unique(commission_item_id, trigger_code)
);
create index if not exists idx_partner_commission_recoveries_partner_status
  on public.partner_commission_recoveries(partner_id,status,requested_at desc);
alter table public.partner_commission_recoveries enable row level security;

create trigger protect_partner_commission_recoveries_direct_write
before update or delete on public.partner_commission_recoveries
for each row execute function public.guard_partner_commission_mutation();

create or replace function public.register_partner_commission_recovery(
  p_item_id uuid,p_amount numeric,p_trigger_code text,p_trigger_note text,p_user_id uuid
) returns public.partner_commission_recoveries
language plpgsql security definer set search_path=public as $$
declare item public.partner_commission_items; result public.partner_commission_recoveries; committed numeric;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select * into item from public.partner_commission_items where id=p_item_id for update;
  if item.id is null then raise exception 'Partner commission payable not found'; end if;
  if item.paid_amount<=0 then raise exception 'Recovery requires a paid partner commission'; end if;
  if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then raise exception 'Recovery amount must be positive with at most two decimals'; end if;
  if upper(btrim(coalesce(p_trigger_code,''))) !~ '^[A-Z][A-Z0-9_]{2,49}$' then raise exception 'A canonical recovery trigger code is required'; end if;
  if length(btrim(coalesce(p_trigger_note,''))) not between 5 and 500 then raise exception 'Detailed recovery evidence is required'; end if;
  select coalesce(sum(amount),0) into committed from public.partner_commission_recoveries
    where commission_item_id=item.id and status in ('open','disputed','recovered');
  if committed+p_amount>item.paid_amount then raise exception 'Partner recovery cannot exceed paid commission'; end if;
  insert into public.partner_commission_recoveries(commission_item_id,partner_id,amount,trigger_code,trigger_note,requested_by)
  values(item.id,item.partner_id,p_amount,upper(btrim(p_trigger_code)),btrim(p_trigger_note),p_user_id)
  returning * into result;
  perform public.register_lender_intelligence_audit(item.partner_id,p_user_id,'partner_commissions','register_partner_recovery',
    'partner_commission_recovery',result.id::text,'Partner commission recovery registered',
    jsonb_build_object('commissionItemId',item.id,'amount',result.amount,'triggerCode',result.trigger_code));
  return result;
end; $$;

create or replace function public.resolve_partner_commission_recovery(
  p_recovery_id uuid,p_status text,p_reference text,p_note text,p_user_id uuid
) returns public.partner_commission_recoveries
language plpgsql security definer set search_path=public as $$
declare target public.partner_commission_recoveries;
begin
  perform public.require_lender_intelligence_actor(p_user_id);
  select * into target from public.partner_commission_recoveries where id=p_recovery_id for update;
  if target.id is null then raise exception 'Partner commission recovery not found'; end if;
  if target.status not in ('open','disputed') then raise exception 'Resolved partner recovery is immutable'; end if;
  if target.requested_by=p_user_id then raise exception 'Recovery maker and checker must be different admins'; end if;
  if p_status not in ('disputed','recovered','waived') then raise exception 'Unsupported partner recovery resolution'; end if;
  if target.status='disputed' and p_status='disputed' then raise exception 'Recovery is already disputed'; end if;
  if length(btrim(coalesce(p_note,''))) not between 5 and 500 then raise exception 'Detailed recovery resolution evidence is required'; end if;
  if p_status='recovered' and length(btrim(coalesce(p_reference,''))) not between 3 and 100 then
    raise exception 'Collection reference is required for a recovered commission'; end if;
  perform set_config('app.li_partner_commission_write','on',true);
  update public.partner_commission_recoveries set status=p_status,resolved_by=p_user_id,resolved_at=now(),
    resolution_reference=case when p_status='recovered' then btrim(p_reference) else null end,resolution_note=btrim(p_note)
    where id=target.id returning * into target;
  perform public.register_lender_intelligence_audit(target.partner_id,p_user_id,'partner_commissions','resolve_partner_recovery_'||p_status,
    'partner_commission_recovery',target.id::text,'Partner commission recovery resolved',
    jsonb_build_object('amount',target.amount,'status',target.status,'reference',target.resolution_reference));
  return target;
end; $$;

revoke all on table public.partner_commission_recoveries from anon,authenticated,service_role;
grant select on table public.partner_commission_recoveries to service_role;
revoke all on function public.register_partner_commission_recovery(uuid,numeric,text,text,uuid) from public;
revoke all on function public.resolve_partner_commission_recovery(uuid,text,text,text,uuid) from public;
grant execute on function public.register_partner_commission_recovery(uuid,numeric,text,text,uuid),public.resolve_partner_commission_recovery(uuid,text,text,text,uuid) to service_role;

create or replace function public.verify_lender_intelligence_schema()
returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
with required_relations(name) as (values
  ('lender_master'),('lender_programs'),('lender_policy_versions'),('lender_policy_rules'),
  ('lender_routing_decisions'),('application_stage_events'),('lender_outcomes'),
  ('lender_commercial_versions'),('lender_reconciliation_items'),('lender_invoices'),
  ('lender_invoice_payments'),('partner_payout_profile_versions'),('partner_commission_versions'),('partner_commission_items'),
  ('partner_commission_payments'),('partner_commission_payment_requests'),('partner_commission_recoveries'),('lender_data_quality_issues'),('lender_intelligence_audit_logs'),('lender_compliance_scan_runs')
), required_functions(name) as (values
  ('save_lender_master'),('save_lender_program'),('publish_lender_policy'),
  ('register_lender_routing_decision'),('commit_lender_selection'),('reroute_crm_application'),
  ('transition_lender_application'),('create_lender_invoice'),('record_lender_invoice_payment'),
  ('create_partner_payout_profile_draft'),('review_partner_payout_profile'),('create_partner_commission_draft'),('review_partner_commission'),
  ('request_partner_commission_payment'),('review_partner_commission_payment'),('record_partner_commission_payment'),('register_partner_commission_recovery'),('resolve_partner_commission_recovery'),('refresh_lender_data_quality_issues'),('run_lender_compliance_scan'),
  ('verify_lender_intelligence_schema')
), required_triggers(name,relation_name) as (values
  ('protect_governed_crm_application_mutation','crm_lender_applications'),('trg_protect_lender_routing_decision','lender_routing_decisions'),
  ('trg_append_only_application_stage_events','application_stage_events'),('trg_append_only_lender_outcomes','lender_outcomes'),
  ('trg_protect_lender_reconciliation_update','lender_reconciliation_items'),('trg_protect_lender_invoice_update','lender_invoices'),
  ('materialize_partner_commission_after_outcome','lender_outcomes'),('protect_partner_payout_profiles_direct_write','partner_payout_profile_versions'),('protect_partner_commission_items_direct_write','partner_commission_items'),('protect_partner_commission_recoveries_direct_write','partner_commission_recoveries')
), protected_relations(name) as (values
  ('lender_routing_decisions'),('application_stage_events'),('lender_outcomes'),
  ('lender_reconciliation_items'),('lender_invoices'),('lender_invoice_payments'),
  ('partner_payout_profile_versions'),('partner_commission_versions'),('partner_commission_items'),('partner_commission_payments'),('partner_commission_payment_requests'),('partner_commission_recoveries'),
  ('lender_intelligence_audit_logs'),('lender_compliance_scan_runs')
), missing_relations as (
  select coalesce(jsonb_agg(name order by name),'[]'::jsonb) value from required_relations r
  where to_regclass('public.'||r.name) is null
), missing_functions as (
  select coalesce(jsonb_agg(name order by name),'[]'::jsonb) value from required_functions r
  where not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=r.name)
), missing_triggers as (
  select coalesce(jsonb_agg(name order by name),'[]'::jsonb) value from required_triggers r
  where not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where not t.tgisinternal and t.tgname=r.name and n.nspname='public' and c.relname=r.relation_name)
), missing_rls as (
  select coalesce(jsonb_agg(name order by name),'[]'::jsonb) value from protected_relations r
  where not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=r.name and c.relrowsecurity)
), unsafe_privileges as (
  select coalesce(jsonb_agg(name order by name),'[]'::jsonb) value from protected_relations r
  where not has_table_privilege('service_role','public.'||r.name,'SELECT')
    or has_table_privilege('anon','public.'||r.name,'INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated','public.'||r.name,'INSERT,UPDATE,DELETE')
)
select jsonb_build_object('migration','20260912220000_lender_intelligence_foundation',
  'ready',jsonb_array_length(missing_relations.value)=0 and jsonb_array_length(missing_functions.value)=0 and jsonb_array_length(missing_triggers.value)=0 and jsonb_array_length(missing_rls.value)=0 and jsonb_array_length(unsafe_privileges.value)=0,
  'missingRelations',missing_relations.value,'missingFunctions',missing_functions.value,'missingTriggers',missing_triggers.value,
  'missingRls',missing_rls.value,'unsafePrivileges',unsafe_privileges.value,
  'checkedAt',now())
from missing_relations,missing_functions,missing_triggers,missing_rls,unsafe_privileges;
$$;
revoke all on function public.verify_lender_intelligence_schema() from public;
grant execute on function public.verify_lender_intelligence_schema() to service_role;

-- Once an application enters governed lender routing, its source identity and
-- lifecycle evidence cannot be rewritten or cascade-deleted through the legacy
-- CRM table. Only the atomic reroute/transition functions set this transaction flag.
create or replace function public.protect_governed_crm_application()
returns trigger language plpgsql set search_path = public as $$
declare governed boolean;
begin
  select exists (
    select 1 from public.lender_routing_decisions decision where decision.application_id = old.id
    union all
    select 1 from public.application_stage_events event where event.application_id = old.id
    union all
    select 1 from public.lender_outcomes outcome where outcome.application_id = old.id
    union all
    select 1 from public.lender_reconciliation_items item where item.application_id = old.id
  ) into governed;
  if not governed then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'Governed lender application evidence cannot be deleted';
  end if;
  if new.id is distinct from old.id or new.partner_id is distinct from old.partner_id
    or new.lead_id is distinct from old.lead_id or new.customer_name is distinct from old.customer_name
    or new.mobile is distinct from old.mobile or new.lender_name is distinct from old.lender_name
    or new.product is distinct from old.product or new.loan_amount is distinct from old.loan_amount
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Governed lender application source identity is immutable';
  end if;
  if current_setting('app.li_governed_application_write', true) is distinct from 'on' and (
    new.status is distinct from old.status
    or new.status_history is distinct from old.status_history
    or new.lender_history is distinct from old.lender_history
    or new.rejection_reason is distinct from old.rejection_reason
  ) then raise exception 'Governed lender application lifecycle requires its atomic workflow'; end if;
  return new;
end;
$$;

drop trigger if exists protect_governed_crm_application_mutation on public.crm_lender_applications;
create trigger protect_governed_crm_application_mutation
before update or delete on public.crm_lender_applications
for each row execute function public.protect_governed_crm_application();

-- Existing administrators are explicitly bootstrapped as LI super-admins.
-- New/restricted admins must be provisioned with the narrow app_metadata
-- capabilities consumed by server routes; user_metadata is never trusted.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb)
  || jsonb_build_object('lender_intelligence_permissions',jsonb_build_array('*'))
where (raw_app_meta_data->>'role'='admin' or exists (
    select 1 from public.user_profiles profile where profile.id=auth.users.id and profile.role::text='admin'
  ))
  and not (coalesce(raw_app_meta_data,'{}'::jsonb) ? 'lender_intelligence_permissions');
