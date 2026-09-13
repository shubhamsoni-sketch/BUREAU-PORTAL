import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { parse } from 'pgsql-parser';

const migrationUrl = new URL(
  '../supabase/migrations/20260912220000_lender_intelligence_foundation.sql',
  import.meta.url
);

const bootstrap = `
create schema auth;
create role anon;
create role authenticated;
create role service_role;
create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb default '{}'::jsonb, raw_user_meta_data jsonb default '{}'::jsonb);
create type public.user_role as enum ('admin','partner');
create type public.partner_status as enum ('pending','approved','rejected','suspended','terminated');
create table public.user_profiles(id uuid primary key references auth.users(id),email text not null,full_name text not null default '',role public.user_role not null default 'partner');
create table public.partners(id uuid primary key default gen_random_uuid(),user_id uuid references public.user_profiles(id),name text not null,company_name text not null default '',mobile text not null default '',email text not null unique,city text not null default '',status public.partner_status not null default 'pending');
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.user_profiles(id),type text not null,title text not null,message text not null,is_read boolean not null default false,metadata jsonb default '{}'::jsonb,created_at timestamptz default now());
create table public.crm_leads(id text primary key,partner_id uuid references public.partners(id),name text not null,mobile text not null,product text not null default 'personal_loan',loan_amount numeric(14,2) not null default 0,stage text not null default 'eligibility_pending',assigned_agent text,selected_lender text,created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.crm_eligibility_reports(id text primary key,partner_id uuid references public.partners(id),lead_id text references public.crm_leads(id),borrower_name text not null,loan_type text,loan_amount numeric(14,2) not null default 0,score integer,status text not null default 'completed',foir numeric(6,2),matched_lenders jsonb not null default '[]'::jsonb,created_by uuid,created_at timestamptz not null default now());
create table public.crm_lender_applications(id text primary key,partner_id uuid references public.partners(id),lead_id text references public.crm_leads(id),customer_name text not null,mobile text,lender_name text not null,product text not null default 'personal_loan',loan_amount numeric(14,2) not null default 0,status text not null default 'case_sent_to_lender',status_history jsonb not null default '[]'::jsonb,notes jsonb not null default '[]'::jsonb,lender_history jsonb not null default '[]'::jsonb,follow_up_date text,rejection_reason text,created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.invoice_settings(id uuid primary key default gen_random_uuid(),company_name text not null default 'CreditTrust',company_address text not null default '',gst_number text,updated_at timestamptz default now());
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
  ('10000000-0000-4000-8000-000000000001','trusted-admin@example.test','{"role":"admin"}','{}'),
  ('10000000-0000-4000-8000-000000000002','profile-admin@example.test','{}','{"role":"admin"}');
insert into public.user_profiles(id,email,full_name,role) values
  ('10000000-0000-4000-8000-000000000001','trusted-admin@example.test','Trusted Admin','admin'),
  ('10000000-0000-4000-8000-000000000002','profile-admin@example.test','Profile Admin','admin');
`;

async function expectDatabaseFailure(label, operation, pattern) {
  try {
    await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (pattern.test(message)) return;
    throw new Error(`${label} failed for the wrong reason: ${message}`);
  }
  throw new Error(`${label} unexpectedly succeeded`);
}

const db = new PGlite();
try {
  await db.exec(bootstrap);
  const sqlBuffer = await readFile(migrationUrl);
  const sql = sqlBuffer.toString('utf8');
  const parsed = await parse(sql);
  for (const [index, statement] of parsed.stmts.entries()) {
    const start = statement.stmt_location || 0;
    const length = statement.stmt_len || sqlBuffer.length - start;
    try {
      await db.exec(`${sqlBuffer.subarray(start, start + length).toString('utf8')};`);
    } catch (error) {
      const line = sqlBuffer.subarray(0, start).toString('utf8').split('\n').length;
      const context =
        error && typeof error === 'object'
          ? [error.detail, error.hint, error.where, error.position && `position ${error.position}`]
              .filter(Boolean)
              .join(' | ')
          : '';
      throw new Error(
        `statement ${index + 1} near line ${line}: ${error instanceof Error ? error.message : String(error)}${context ? ` (${context})` : ''}`
      );
    }
  }
  const health = await db.query('select public.verify_lender_intelligence_schema() as value');
  const value = health.rows[0]?.value;
  if (!value || value.ready !== true)
    throw new Error(`Schema health failed: ${JSON.stringify(value)}`);

  const grants = await db.query(
    `select id,raw_app_meta_data->'lender_intelligence_permissions' as permissions from auth.users order by id`
  );
  if (
    grants.rows.length !== 2 ||
    grants.rows.some((row) => !Array.isArray(row.permissions) || row.permissions[0] !== '*')
  ) {
    throw new Error(`Trusted admin capability bootstrap failed: ${JSON.stringify(grants.rows)}`);
  }
  await expectDatabaseFailure(
    'Unknown actor rejection',
    () =>
      db.query(
        `select public.require_lender_intelligence_actor('ffffffff-ffff-4fff-8fff-ffffffffffff')`
      ),
    /valid authenticated lender intelligence actor/i
  );
  const lenderResult = await db.query(`select to_jsonb(public.save_lender_master(
    '{"legal_name":"Runtime Bank Limited","display_name":"Runtime Bank","lender_code":"RUNTIME_BANK","lender_type":"bank"}'::jsonb,
    '10000000-0000-4000-8000-000000000001'
  )) as value`);
  const lender = lenderResult.rows[0]?.value;
  if (
    !lender ||
    lender.onboarding_status !== 'draft' ||
    lender.kyc_status !== 'pending' ||
    lender.agreement_status !== 'pending'
  ) {
    throw new Error(`Governed lender defaults failed: ${JSON.stringify(lender)}`);
  }
  const audit = await db.query(
    `select count(*)::int as count from public.lender_intelligence_audit_logs where entity_id=$1`,
    [lender.id]
  );
  if (audit.rows[0]?.count !== 1)
    throw new Error('Governed lender creation did not commit exactly one audit event');

  const programResult = await db.query(
    `select to_jsonb(public.save_lender_program($1::jsonb,$2::uuid)) as value`,
    [
      JSON.stringify({
        lender_id: lender.id,
        program_code: 'RUNTIME_PL',
        program_name: 'Runtime Personal Loan',
        product: 'personal_loan',
        borrower_segment: 'all',
        employment_types: [],
        channels: [],
        states: [],
        cities: [],
        min_loan: 10000,
        max_loan: 1000000,
        min_tenure_months: 6,
        max_tenure_months: 60,
        indicative_roi_min: 10,
        indicative_roi_max: 24,
        capacity_status: 'open',
        status: 'draft',
        priority: 100,
        login_sla_hours: 24,
        sanction_sla_hours: 120,
        disbursal_sla_hours: 72,
        metadata: {},
      }),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const program = programResult.rows[0]?.value;
  if (!program || program.status !== 'draft')
    throw new Error(`Governed program creation failed: ${JSON.stringify(program)}`);
  const policyResult = await db.query(
    `select to_jsonb(public.create_lender_policy_draft(
    $1::uuid,'manual','runtime-policy-source',null,'Embedded governance proof',now()+interval '90 days',$2::uuid
  )) as value`,
    [program.id, '10000000-0000-4000-8000-000000000001']
  );
  const policy = policyResult.rows[0]?.value;
  await db.query(
    `select count(*) from public.replace_lender_policy_rules($1::uuid,$2::jsonb,$3::uuid)`,
    [
      policy.id,
      JSON.stringify([
        {
          rule_group: 'base',
          field_key: 'score',
          operator: 'gte',
          comparison_value: 700,
          severity: 'hard',
          reason_code: 'MIN_SCORE',
          reason_text: 'Minimum bureau score is 700',
          weight: 0,
          priority: 10,
          enabled: true,
        },
      ]),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  await db.query(`select public.submit_lender_policy($1::uuid,$2::uuid)`, [
    policy.id,
    '10000000-0000-4000-8000-000000000001',
  ]);
  await expectDatabaseFailure(
    'Policy maker self-publication rejection',
    () =>
      db.query(`select public.publish_lender_policy($1::uuid,$2::uuid,now())`, [
        policy.id,
        '10000000-0000-4000-8000-000000000001',
      ]),
    /maker and checker must be different admins/i
  );
  const publishedResult = await db.query(
    `select to_jsonb(public.publish_lender_policy($1::uuid,$2::uuid,now())) as value`,
    [policy.id, '10000000-0000-4000-8000-000000000002']
  );
  const published = publishedResult.rows[0]?.value;
  if (
    !published ||
    published.status !== 'published' ||
    published.approved_by !== '10000000-0000-4000-8000-000000000002'
  ) {
    throw new Error(`Independent policy publication failed: ${JSON.stringify(published)}`);
  }

  const readyLenderResult = await db.query(
    `select to_jsonb(public.save_lender_master($1::jsonb,$2::uuid)) as value`,
    [
      JSON.stringify({
        id: lender.id,
        legal_name: lender.legal_name,
        display_name: lender.display_name,
        lender_code: lender.lender_code,
        lender_type: lender.lender_type,
        onboarding_status: 'due_diligence',
        kyc_status: 'verified',
        agreement_status: 'signed',
        agreement_expires_at: '2030-01-01T00:00:00Z',
        finance_email: 'finance@runtime-bank.example',
        billing_address: '1 Runtime Avenue, Mumbai, Maharashtra 400001',
        gstin: '27AAAAA0000A1Z5',
        metadata: {},
      }),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  if (readyLenderResult.rows[0]?.value?.onboarding_status !== 'due_diligence')
    throw new Error('Lender due-diligence transition failed');
  await db.query(`select public.set_lender_operating_status($1::uuid,'active',$2::uuid)`, [
    lender.id,
    '10000000-0000-4000-8000-000000000001',
  ]);
  await db.query(
    `select public.set_lender_program_operating_status($1::uuid,'active','open',$2::uuid)`,
    [program.id, '10000000-0000-4000-8000-000000000001']
  );
  await db.exec(`insert into public.partners(id,name,company_name,mobile,email,city,status) values
    ('20000000-0000-4000-8000-000000000001','Runtime DSA','Runtime DSA Private Limited','9999999999','runtime-dsa@example.test','Mumbai','approved')`);
  await db.exec(`insert into public.crm_leads(id,partner_id,name,mobile,product,loan_amount,created_by) values
    ('runtime-lead','20000000-0000-4000-8000-000000000001','Runtime Customer','9000000000','personal_loan',250000,'10000000-0000-4000-8000-000000000001')`);
  await db.exec(`insert into public.crm_eligibility_reports(id,partner_id,lead_id,borrower_name,loan_type,loan_amount,score,status,created_by)
    values ('runtime-no-consent','20000000-0000-4000-8000-000000000001','runtime-lead','Runtime Customer','personal_loan',250000,760,'completed','10000000-0000-4000-8000-000000000001')`);
  await expectDatabaseFailure(
    'Routing without consent rejection',
    () =>
      db.query(
        `select public.register_lender_routing_decision($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb,$7::uuid)`,
        [
          '20000000-0000-4000-8000-000000000001',
          'runtime-lead',
          'runtime-no-consent',
          'runtime-engine-v1',
          JSON.stringify({ score: 760 }),
          '[]',
          '10000000-0000-4000-8000-000000000001',
        ]
      ),
    /does not belong to the partner and lead/i
  );
  await db.exec(`insert into public.crm_eligibility_reports(id,partner_id,lead_id,borrower_name,loan_type,loan_amount,score,status,created_by,
    consent_given,consent_at,consent_version,consent_purpose,consent_source,consent_captured_by)
    values ('runtime-report','20000000-0000-4000-8000-000000000001','runtime-lead','Runtime Customer','personal_loan',250000,760,'completed',
      '10000000-0000-4000-8000-000000000001',true,now(),'eligibility-routing-v1','eligibility_and_routing','operator_attestation','10000000-0000-4000-8000-000000000001')`);
  const routingResult = [
    {
      lenderId: lender.id,
      programId: program.id,
      policyVersionId: policy.id,
      rank: 1,
      matchStatus: 'eligible',
    },
  ];
  await db.query(
    `select public.register_lender_routing_decision($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb,$7::uuid)`,
    [
      '20000000-0000-4000-8000-000000000001',
      'runtime-lead',
      'runtime-report',
      'runtime-engine-v1',
      JSON.stringify({ score: 760, loanAmount: 250000, loanType: 'personal_loan' }),
      JSON.stringify(routingResult),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const applicationResult = await db.query(
    `select to_jsonb(public.commit_lender_selection(
    $1::uuid,$2,$3::jsonb,$4::uuid,$5::uuid,1,'selected',null,null,null,$6::uuid,now()+interval '1 second'
  )) as value`,
    [
      '20000000-0000-4000-8000-000000000001',
      'runtime-report',
      JSON.stringify({
        id: 'runtime-application',
        leadId: 'runtime-lead',
        customerName: 'Runtime Customer',
        mobile: '9000000000',
        lenderName: 'Runtime Bank',
        product: 'personal_loan',
        loanAmount: 250000,
        statusHistory: [],
        notes: [],
        lenderHistory: [],
      }),
      lender.id,
      program.id,
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const application = applicationResult.rows[0]?.value;
  if (!application || application.status !== 'case_sent_to_lender')
    throw new Error(`Governed lender selection failed: ${JSON.stringify(application)}`);
  const stageCount = await db.query(
    `select count(*)::int as count from public.application_stage_events where application_id='runtime-application' and to_stage='case_sent_to_lender'`
  );
  if (stageCount.rows[0]?.count !== 1)
    throw new Error('Initial lender selection did not commit exactly one stage event');
  const commercialResult = await db.query(
    `select to_jsonb(public.create_lender_commercial_draft($1::jsonb,$2::uuid)) as value`,
    [
      JSON.stringify({
        partner_id: '20000000-0000-4000-8000-000000000001',
        lender_id: lender.id,
        program_id: program.id,
        payout_basis: 'percentage',
        payout_value: 2,
        payout_slab: [],
        tax_terms: { ratePercent: 18, reverseCharge: false },
        clawback_terms: { windowDays: 90, basis: 'full', value: 0 },
        source_reference: 'runtime-commercial-v1',
      }),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const commercial = commercialResult.rows[0]?.value;
  await db.query(`select public.submit_lender_commercial($1::uuid,$2::uuid)`, [
    commercial.id,
    '10000000-0000-4000-8000-000000000001',
  ]);
  await expectDatabaseFailure(
    'Commercial maker self-activation rejection',
    () =>
      db.query(`select public.activate_lender_commercial($1::uuid,$2::uuid,now())`, [
        commercial.id,
        '10000000-0000-4000-8000-000000000001',
      ]),
    /maker and checker must be different admins/i
  );
  await db.query(`select public.activate_lender_commercial($1::uuid,$2::uuid,now())`, [
    commercial.id,
    '10000000-0000-4000-8000-000000000002',
  ]);
  const payoutProfileResult = await db.query(
    `select to_jsonb(public.create_partner_payout_profile_draft($1::jsonb,$2::uuid)) as value`,
    [
      JSON.stringify({
        partner_id: '20000000-0000-4000-8000-000000000001',
        legal_name: 'Runtime DSA Private Limited',
        tax_registration_status: 'registered',
        gstin: '27CCCCC2222C1Z5',
        pan_last4: '2C3D',
        billing_address: '2 Partner Avenue, Mumbai, Maharashtra 400001',
        finance_email: 'finance@runtime-dsa.example',
        account_holder_name: 'Runtime DSA Private Limited',
        bank_name: 'Runtime Bank',
        account_number_last4: '4321',
        ifsc: 'RUNT0123456',
        beneficiary_reference: 'beneficiary-runtime-001',
        verification_reference: 'penny-drop-runtime-001',
      }),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const payoutProfile = payoutProfileResult.rows[0]?.value;
  await db.query(`select public.review_partner_payout_profile($1::uuid,'submit',null,$2::uuid)`, [
    payoutProfile.id,
    '10000000-0000-4000-8000-000000000001',
  ]);
  await expectDatabaseFailure(
    'Payout profile maker self-verification rejection',
    () =>
      db.query(
        `select public.review_partner_payout_profile($1::uuid,'verify','Verified evidence',$2::uuid)`,
        [payoutProfile.id, '10000000-0000-4000-8000-000000000001']
      ),
    /maker and checker must be different admins/i
  );
  await db.query(
    `select public.review_partner_payout_profile($1::uuid,'verify','Independent verification complete',$2::uuid)`,
    [payoutProfile.id, '10000000-0000-4000-8000-000000000002']
  );
  const partnerTermsResult = await db.query(
    `select to_jsonb(public.create_partner_commission_draft($1::jsonb,$2::uuid)) as value`,
    [
      JSON.stringify({
        partner_id: '20000000-0000-4000-8000-000000000001',
        lender_id: lender.id,
        program_id: program.id,
        commission_basis: 'percentage',
        commission_value: 1,
        commission_slab: [],
        tax_rate: 18,
        withholding_rate: 5,
        payment_terms_days: 30,
        source_reference: 'runtime-partner-commercial-v1',
      }),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const partnerTerms = partnerTermsResult.rows[0]?.value;
  await db.query(`select public.review_partner_commission($1::uuid,'submit',null,$2::uuid)`, [
    partnerTerms.id,
    '10000000-0000-4000-8000-000000000001',
  ]);
  await expectDatabaseFailure(
    'Partner commission maker self-activation rejection',
    () =>
      db.query(
        `select public.review_partner_commission($1::uuid,'activate','Approved terms',$2::uuid)`,
        [partnerTerms.id, '10000000-0000-4000-8000-000000000001']
      ),
    /maker and checker must be different admins/i
  );
  await db.query(
    `select public.review_partner_commission($1::uuid,'activate','Independent approval complete',$2::uuid)`,
    [partnerTerms.id, '10000000-0000-4000-8000-000000000002']
  );
  await expectDatabaseFailure(
    'Disbursal without canonical sanction rejection',
    () =>
      db.query(
        `select public.transition_lender_application(
          $1::uuid,'runtime-application','case_sent_to_lender','disbursed','[]'::jsonb,'Premature disbursal',null,null,null,200000,0,0,$2::uuid,now()+interval '1 second'
        )`,
        ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
      ),
    /canonical sanctioned outcome is required before disbursal/i
  );
  await expectDatabaseFailure(
    'Sanction without approved ROI rejection',
    () =>
      db.query(
        `select public.transition_lender_application(
          $1::uuid,'runtime-application','case_sent_to_lender','sanctioned','[]'::jsonb,'Incomplete sanction',null,null,200000,null,0,24,$2::uuid,now()+interval '1 second'
        )`,
        ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
      ),
    /positive approved ROI/i
  );
  await expectDatabaseFailure(
    'Sanction with sub-paise amount rejection',
    () =>
      db.query(
        `select public.transition_lender_application(
          $1::uuid,'runtime-application','case_sent_to_lender','sanctioned','[]'::jsonb,'Invalid precision',null,null,200000.001,null,14,24,$2::uuid,now()+interval '1 second'
        )`,
        ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
      ),
    /sub-paise precision/i
  );
  await db.query(
    `select public.transition_lender_application(
    $1::uuid,'runtime-application','case_sent_to_lender','sanctioned','[]'::jsonb,'Runtime sanction',null,null,200000,null,14,24,$2::uuid,now()+interval '2 seconds'
  )`,
    ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
  );
  await expectDatabaseFailure(
    'Disbursal above sanctioned amount rejection',
    () =>
      db.query(
        `select public.transition_lender_application(
          $1::uuid,'runtime-application','sanctioned','disbursed','[]'::jsonb,'Excess disbursal',null,null,null,200001,0,0,$2::uuid,now()+interval '3 seconds'
        )`,
        ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
      ),
    /disbursed amount cannot exceed the sanctioned amount/i
  );
  await expectDatabaseFailure(
    'Disbursal with sub-paise amount rejection',
    () =>
      db.query(
        `select public.transition_lender_application(
          $1::uuid,'runtime-application','sanctioned','disbursed','[]'::jsonb,'Invalid precision',null,null,null,199999.999,0,0,$2::uuid,now()+interval '3 seconds'
        )`,
        ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
      ),
    /sub-paise precision/i
  );
  await db.query(
    `select public.transition_lender_application(
    $1::uuid,'runtime-application','sanctioned','disbursed','[]'::jsonb,'Runtime disbursal',null,null,null,200000,14,24,$2::uuid,now()+interval '3 seconds'
  )`,
    ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
  );
  const moneyPath =
    await db.query(`select application.status, outcome.outcome, outcome.sanctioned_amount,
    outcome.disbursed_amount,outcome.approved_roi,outcome.approved_tenure_months,
    item.id as item_id,item.expected_amount,item.tax_amount,item.status as item_status
    from public.crm_lender_applications application
    join public.lender_outcomes outcome on outcome.application_id=application.id and outcome.outcome='disbursed'
    join public.lender_reconciliation_items item on item.outcome_id=outcome.id
    where application.id='runtime-application'`);
  const money = moneyPath.rows[0];
  if (
    !money ||
    money.status !== 'disbursed' ||
    money.outcome !== 'disbursed' ||
    Number(money.sanctioned_amount) !== 200000 ||
    Number(money.disbursed_amount) !== 200000 ||
    Number(money.approved_roi) !== 14 ||
    Number(money.approved_tenure_months) !== 24 ||
    Number(money.expected_amount) !== 4000 ||
    Number(money.tax_amount) !== 720 ||
    money.item_status !== 'invoice_ready'
  ) {
    throw new Error(`Disbursal payout valuation failed: ${JSON.stringify(money)}`);
  }
  await db.exec(`insert into public.invoice_settings(company_name,company_address,gst_number)
    values ('CreditTrust Runtime','1 Platform Road, Mumbai','27BBBBB1111B1Z5')`);
  const invoiceResult = await db.query(
    `select to_jsonb(public.create_lender_invoice(
    $1::uuid,$2::uuid,'receivable',array[$3::uuid],now()+interval '15 days',$4::uuid
  )) as value`,
    [
      '20000000-0000-4000-8000-000000000001',
      lender.id,
      money.item_id,
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const invoice = invoiceResult.rows[0]?.value;
  if (
    !invoice ||
    Number(invoice.subtotal) !== 4000 ||
    Number(invoice.tax_amount) !== 720 ||
    Number(invoice.total_amount) !== 4720 ||
    invoice.status !== 'draft'
  ) {
    throw new Error(`Invoice creation from reconciliation failed: ${JSON.stringify(invoice)}`);
  }
  await db.query(`select public.raise_lender_invoice($1::uuid,$2::uuid)`, [
    invoice.id,
    '10000000-0000-4000-8000-000000000001',
  ]);
  await db.query(
    `select public.record_lender_invoice_payment($1::uuid,4720,'UTR-RUNTIME-001',$2::uuid,'runtime-payment-0001')`,
    [invoice.id, '10000000-0000-4000-8000-000000000001']
  );
  const settledResult = await db.query(
    `select invoice.status,invoice.paid_amount,item.status as item_status,item.received_amount,
    (select count(*)::int from public.lender_invoice_payments payment where payment.invoice_id=invoice.id) as payment_count,
    (select count(*)::int from public.lender_invoice_payment_allocations allocation join public.lender_invoice_payments payment on payment.id=allocation.payment_id where payment.invoice_id=invoice.id) as allocation_count
    from public.lender_invoices invoice join public.lender_reconciliation_items item on item.invoice_id=invoice.id where invoice.id=$1`,
    [invoice.id]
  );
  const settled = settledResult.rows[0];
  if (
    !settled ||
    settled.status !== 'paid' ||
    Number(settled.paid_amount) !== 4720 ||
    settled.item_status !== 'paid' ||
    Number(settled.received_amount) !== 4720 ||
    settled.payment_count !== 1 ||
    settled.allocation_count !== 1
  ) {
    throw new Error(`Invoice settlement conservation failed: ${JSON.stringify(settled)}`);
  }
  await db.query(
    `select public.record_lender_invoice_payment($1::uuid,4720,'UTR-RUNTIME-001',$2::uuid,'runtime-payment-0001')`,
    [invoice.id, '10000000-0000-4000-8000-000000000001']
  );
  const idempotentPayment = await db.query(
    `select count(*)::int as count from public.lender_invoice_payments where invoice_id=$1`,
    [invoice.id]
  );
  if (idempotentPayment.rows[0]?.count !== 1)
    throw new Error('Idempotent invoice payment created a duplicate receipt');
  const partnerPayableResult =
    await db.query(`select id,gross_commission,tax_amount,withholding_amount,net_payable,status,
    beneficiary_snapshot->>'accountNumberLast4' as account_last4
    from public.partner_commission_items where application_id='runtime-application'`);
  const partnerPayable = partnerPayableResult.rows[0];
  if (
    !partnerPayable ||
    Number(partnerPayable.gross_commission) !== 2000 ||
    Number(partnerPayable.tax_amount) !== 360 ||
    Number(partnerPayable.withholding_amount) !== 100 ||
    Number(partnerPayable.net_payable) !== 2260 ||
    partnerPayable.status !== 'payable_ready' ||
    partnerPayable.account_last4 !== '4321'
  ) {
    throw new Error(`Partner payable materialization failed: ${JSON.stringify(partnerPayable)}`);
  }
  const paymentRequestResult = await db.query(
    `select to_jsonb(public.request_partner_commission_payment(
    $1::uuid,2260,'UTR-PARTNER-001','partner-payment-0001','Approved partner payout instruction',$2::uuid
  )) as value`,
    [partnerPayable.id, '10000000-0000-4000-8000-000000000001']
  );
  const paymentRequest = paymentRequestResult.rows[0]?.value;
  await expectDatabaseFailure(
    'Partner payment maker self-approval rejection',
    () =>
      db.query(
        `select public.review_partner_commission_payment($1::uuid,'approved','Self approval attempt',$2::uuid)`,
        [paymentRequest.id, '10000000-0000-4000-8000-000000000001']
      ),
    /maker and checker must be different admins/i
  );
  await db.query(
    `select public.review_partner_commission_payment($1::uuid,'approved','Independent payment approval',$2::uuid)`,
    [paymentRequest.id, '10000000-0000-4000-8000-000000000002']
  );
  const partnerSettlementResult = await db.query(
    `select item.status,item.paid_amount,request.status as request_status,
    request.reviewed_by,request.payment_id,(select count(*)::int from public.partner_commission_payments payment where payment.commission_item_id=item.id) as payment_count
    from public.partner_commission_items item join public.partner_commission_payment_requests request on request.commission_item_id=item.id
    where item.id=$1`,
    [partnerPayable.id]
  );
  const partnerSettlement = partnerSettlementResult.rows[0];
  if (
    !partnerSettlement ||
    partnerSettlement.status !== 'paid' ||
    Number(partnerSettlement.paid_amount) !== 2260 ||
    partnerSettlement.request_status !== 'approved' ||
    partnerSettlement.reviewed_by !== '10000000-0000-4000-8000-000000000002' ||
    !partnerSettlement.payment_id ||
    partnerSettlement.payment_count !== 1
  ) {
    throw new Error(
      `Partner maker-checker settlement failed: ${JSON.stringify(partnerSettlement)}`
    );
  }
  const clawbackResult = await db.query(
    `select to_jsonb(public.register_lender_clawback(
    $1::uuid,'EARLY_CLOSURE','Borrower closed facility inside contracted recovery window',now()+interval '4 seconds',$2::uuid
  )) as value`,
    [money.item_id, '10000000-0000-4000-8000-000000000001']
  );
  const clawback = clawbackResult.rows[0]?.value;
  if (!clawback || Number(clawback.amount) !== 4000 || clawback.status !== 'open') {
    throw new Error(`Lender clawback calculation failed: ${JSON.stringify(clawback)}`);
  }
  await db.query(
    `select public.resolve_lender_clawback($1::uuid,'recovered','Lender recovery received','UTR-CLAWBACK-001',$2::uuid)`,
    [clawback.id, '10000000-0000-4000-8000-000000000002']
  );
  const recoveredClawbackResult = await db.query(
    `select status,recovered_amount,recovery_reference from public.lender_clawbacks where id=$1`,
    [clawback.id]
  );
  const recoveredClawback = recoveredClawbackResult.rows[0];
  if (
    !recoveredClawback ||
    recoveredClawback.status !== 'recovered' ||
    Number(recoveredClawback.recovered_amount) !== 4000 ||
    recoveredClawback.recovery_reference !== 'UTR-CLAWBACK-001'
  ) {
    throw new Error(`Lender clawback resolution failed: ${JSON.stringify(recoveredClawback)}`);
  }
  await expectDatabaseFailure(
    'Partner recovery paid-cap rejection',
    () =>
      db.query(
        `select public.register_partner_commission_recovery($1::uuid,2260.01,'EARLY_CLOSURE','Recovery exceeds partner cash paid',$2::uuid)`,
        [partnerPayable.id, '10000000-0000-4000-8000-000000000001']
      ),
    /cannot exceed paid commission/i
  );
  const partnerRecoveryResult = await db.query(
    `select to_jsonb(public.register_partner_commission_recovery(
    $1::uuid,1000,'EARLY_CLOSURE','Partner recovery supported by early closure evidence',$2::uuid
  )) as value`,
    [partnerPayable.id, '10000000-0000-4000-8000-000000000001']
  );
  const partnerRecovery = partnerRecoveryResult.rows[0]?.value;
  await expectDatabaseFailure(
    'Partner recovery maker self-resolution rejection',
    () =>
      db.query(
        `select public.resolve_partner_commission_recovery($1::uuid,'recovered','UTR-RECOVERY-001','Self resolution attempt',$2::uuid)`,
        [partnerRecovery.id, '10000000-0000-4000-8000-000000000001']
      ),
    /maker and checker must be different admins/i
  );
  await db.query(
    `select public.resolve_partner_commission_recovery($1::uuid,'recovered','UTR-RECOVERY-001','Independent collection confirmation',$2::uuid)`,
    [partnerRecovery.id, '10000000-0000-4000-8000-000000000002']
  );
  const recoveredPartnerResult = await db.query(
    `select status,amount,resolved_by,resolution_reference from public.partner_commission_recoveries where id=$1`,
    [partnerRecovery.id]
  );
  const recoveredPartner = recoveredPartnerResult.rows[0];
  if (
    !recoveredPartner ||
    recoveredPartner.status !== 'recovered' ||
    Number(recoveredPartner.amount) !== 1000 ||
    recoveredPartner.resolved_by !== '10000000-0000-4000-8000-000000000002' ||
    recoveredPartner.resolution_reference !== 'UTR-RECOVERY-001'
  ) {
    throw new Error(`Partner recovery resolution failed: ${JSON.stringify(recoveredPartner)}`);
  }
  const expiringDocumentResult = await db.query(
    `select to_jsonb(public.register_lender_policy_document(
    $1::uuid,$2::uuid,$3::uuid,'agreement','runtime-agreement.pdf',$4,'application/pdf',repeat('a',64),now()+interval '10 days',$5::uuid
  )) as value`,
    [
      lender.id,
      program.id,
      policy.id,
      `${lender.id}/2026/runtime-agreement.pdf`,
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  const expiringDocument = expiringDocumentResult.rows[0]?.value;
  const refreshedResult = await db.query(
    `select public.refresh_lender_data_quality_issues_as_actor($1::uuid) as count`,
    ['10000000-0000-4000-8000-000000000001']
  );
  if (Number(refreshedResult.rows[0]?.count) < 1)
    throw new Error('Manual compliance scan did not refresh the expiring document issue');
  const issueResult = await db.query(
    `select id,status,owner_user_id from public.lender_data_quality_issues where fingerprint=$1`,
    [`document-expiry:${expiringDocument.id}`]
  );
  const complianceIssue = issueResult.rows[0];
  if (!complianceIssue || complianceIssue.status !== 'open')
    throw new Error(`Compliance issue materialization failed: ${JSON.stringify(complianceIssue)}`);
  await db.query(`select public.manage_lender_data_quality_issue($1::uuid,'claim',null,$2::uuid)`, [
    complianceIssue.id,
    '10000000-0000-4000-8000-000000000001',
  ]);
  await db.query(`select public.refresh_lender_data_quality_issues_as_actor($1::uuid)`, [
    '10000000-0000-4000-8000-000000000002',
  ]);
  const claimedResult = await db.query(
    `select status,owner_user_id from public.lender_data_quality_issues where id=$1`,
    [complianceIssue.id]
  );
  if (
    claimedResult.rows[0]?.status !== 'in_progress' ||
    claimedResult.rows[0]?.owner_user_id !== '10000000-0000-4000-8000-000000000001'
  ) {
    throw new Error(
      `Compliance scan did not preserve claimed ownership: ${JSON.stringify(claimedResult.rows[0])}`
    );
  }
  await db.query(
    `select public.manage_lender_data_quality_issue($1::uuid,'accept','Renewal risk accepted until scheduled lender review',$2::uuid)`,
    [complianceIssue.id, '10000000-0000-4000-8000-000000000001']
  );
  await db.query(`select public.refresh_lender_data_quality_issues_as_actor($1::uuid)`, [
    '10000000-0000-4000-8000-000000000002',
  ]);
  const acceptedResult = await db.query(
    `select status,owner_user_id,resolution_note,resolved_at from public.lender_data_quality_issues where id=$1`,
    [complianceIssue.id]
  );
  const accepted = acceptedResult.rows[0];
  if (
    !accepted ||
    accepted.status !== 'accepted' ||
    accepted.owner_user_id !== '10000000-0000-4000-8000-000000000001' ||
    accepted.resolution_note !== 'Renewal risk accepted until scheduled lender review' ||
    !accepted.resolved_at
  ) {
    throw new Error(
      `Compliance scan did not preserve accepted-risk evidence: ${JSON.stringify(accepted)}`
    );
  }
  const scheduledScanResult = await db.query(`select public.run_lender_compliance_scan() as value`);
  const scheduledScan = scheduledScanResult.rows[0]?.value;
  if (
    !scheduledScan?.runId ||
    Number(scheduledScan.refreshedIssues) !==
      Number(scheduledScan.readinessIssues) + Number(scheduledScan.partnerPayableIssues) ||
    !scheduledScan.startedAt ||
    !scheduledScan.scannedAt
  ) {
    throw new Error(`Atomic scheduled compliance scan failed: ${JSON.stringify(scheduledScan)}`);
  }
  const scanEvidenceResult = await db.query(
    `select count(*)::int as count from public.lender_compliance_scan_runs where id=$1::uuid`,
    [scheduledScan.runId]
  );
  if (Number(scanEvidenceResult.rows[0]?.count) !== 1) {
    throw new Error('Scheduled compliance scan did not retain durable run evidence');
  }
  await db.exec(`insert into public.crm_leads(id,partner_id,name,mobile,product,loan_amount,created_by) values
    ('runtime-reject-lead','20000000-0000-4000-8000-000000000001','Rejected Runtime Customer','9111111111','personal_loan',180000,'10000000-0000-4000-8000-000000000001')`);
  await db.exec(`insert into public.crm_eligibility_reports(id,partner_id,lead_id,borrower_name,loan_type,loan_amount,score,status,created_by,
    consent_given,consent_at,consent_version,consent_purpose,consent_source,consent_captured_by)
    values ('runtime-reject-report','20000000-0000-4000-8000-000000000001','runtime-reject-lead','Rejected Runtime Customer','personal_loan',180000,745,'completed',
      '10000000-0000-4000-8000-000000000001',true,now(),'eligibility-routing-v1','eligibility_and_routing','operator_attestation','10000000-0000-4000-8000-000000000001')`);
  await db.query(
    `select public.register_lender_routing_decision($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb,$7::uuid)`,
    [
      '20000000-0000-4000-8000-000000000001',
      'runtime-reject-lead',
      'runtime-reject-report',
      'runtime-engine-v1',
      JSON.stringify({ score: 745, loanAmount: 180000, loanType: 'personal_loan' }),
      JSON.stringify(routingResult),
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  await db.query(
    `select public.commit_lender_selection(
    $1::uuid,$2,$3::jsonb,$4::uuid,$5::uuid,1,'selected',null,null,null,$6::uuid,now()+interval '4 seconds'
  )`,
    [
      '20000000-0000-4000-8000-000000000001',
      'runtime-reject-report',
      JSON.stringify({
        id: 'runtime-rejected-application',
        leadId: 'runtime-reject-lead',
        customerName: 'Rejected Runtime Customer',
        mobile: '9111111111',
        lenderName: 'Runtime Bank',
        product: 'personal_loan',
        loanAmount: 180000,
        statusHistory: [],
        notes: [],
        lenderHistory: [],
      }),
      lender.id,
      program.id,
      '10000000-0000-4000-8000-000000000001',
    ]
  );
  await expectDatabaseFailure(
    'Unknown canonical rejection reason denial',
    () =>
      db.query(
        `select public.transition_lender_application(
      $1::uuid,'runtime-rejected-application','case_sent_to_lender','rejected','[]'::jsonb,'Lender declined','MADE_UP_REASON','Detailed lender rejection',null,null,null,null,$2::uuid,now()+interval '5 seconds'
    )`,
        ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
      ),
    /active canonical rejection reason is required/i
  );
  await db.query(
    `select public.transition_lender_application(
    $1::uuid,'runtime-rejected-application','case_sent_to_lender','rejected','[]'::jsonb,'Lender declined after credit assessment','BUREAU_POLICY','Bureau policy threshold was not met',null,null,null,null,$2::uuid,now()+interval '5 seconds'
  )`,
    ['20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001']
  );
  const rejectionResult =
    await db.query(`select application.status,application.rejection_reason,outcome.outcome,
    outcome.rejection_reason_code,outcome.rejection_reason_text,
    (select count(*)::int from public.application_stage_events event where event.application_id=application.id and event.to_stage='rejected') as rejection_event_count
    from public.crm_lender_applications application join public.lender_outcomes outcome on outcome.application_id=application.id and outcome.outcome='rejected'
    where application.id='runtime-rejected-application'`);
  const rejection = rejectionResult.rows[0];
  if (
    !rejection ||
    rejection.status !== 'rejected' ||
    rejection.outcome !== 'rejected' ||
    rejection.rejection_reason_code !== 'BUREAU_POLICY' ||
    rejection.rejection_reason !== 'Bureau policy threshold was not met' ||
    rejection.rejection_reason_text !== 'Bureau policy threshold was not met' ||
    rejection.rejection_event_count !== 1
  ) {
    throw new Error(`Canonical rejection outcome failed: ${JSON.stringify(rejection)}`);
  }
  await expectDatabaseFailure(
    'Immutable rejection outcome mutation denial',
    () =>
      db.exec(
        `update public.lender_outcomes set rejection_reason_code='OTHER' where application_id='runtime-rejected-application' and outcome='rejected'`
      ),
    /append-only lender intelligence ledger/i
  );
  await expectDatabaseFailure(
    'Governed application direct lifecycle mutation rejection',
    () =>
      db.exec(
        `update public.crm_lender_applications set status='rejected' where id='runtime-application'`
      ),
    /requires its atomic workflow/i
  );
  await db.exec('set role service_role');
  try {
    const serviceHealth = await db.query(
      `select public.verify_lender_intelligence_schema() as value`
    );
    if (serviceHealth.rows[0]?.value?.ready !== true)
      throw new Error('Service role could not execute the governed schema-health RPC');
    await db.query(`select public.refresh_lender_data_quality_issues_as_actor($1::uuid)`, [
      '10000000-0000-4000-8000-000000000001',
    ]);
    await expectDatabaseFailure(
      'Service-role direct lender insert denial',
      () =>
        db.exec(
          `insert into public.lender_master(legal_name,display_name,lender_code,lender_type) values ('Bypass','Bypass','BYPASS','bank')`
        ),
      /permission denied/i
    );
    await expectDatabaseFailure(
      'Service-role direct application evidence insert denial',
      () =>
        db.exec(
          `insert into public.application_stage_events(partner_id,application_id,to_stage,occurred_at) values ('20000000-0000-4000-8000-000000000001','runtime-application','disbursed',now())`
        ),
      /permission denied/i
    );
    await expectDatabaseFailure(
      'Service-role direct reconciliation mutation denial',
      () =>
        db.exec(
          `update public.lender_reconciliation_items set received_amount=0 where id='${money.item_id}'`
        ),
      /permission denied/i
    );
    await expectDatabaseFailure(
      'Service-role direct audit insert denial',
      () =>
        db.exec(
          `insert into public.lender_intelligence_audit_logs(actor_user_id,actor_email,module,action,entity_type,summary) values ('10000000-0000-4000-8000-000000000001','forged@example.test','compliance','forge','audit','Forged audit')`
        ),
      /permission denied/i
    );
    await expectDatabaseFailure(
      'Service-role direct partner payable mutation denial',
      () =>
        db.exec(
          `update public.partner_commission_items set paid_amount=0 where id='${partnerPayable.id}'`
        ),
      /permission denied/i
    );
  } finally {
    await db.exec('reset role');
  }
  console.log(
    'Lender Intelligence migration executed successfully; schema, onboarding, policy, consent, routing, application custody, canonical outcomes, both finance directions, recoveries, atomic scheduled compliance scanning, service-role RPC grants, direct-DML denial, payment conservation, audit, and actor smoke checks passed.'
  );
} catch (error) {
  console.error(
    `Lender Intelligence migration execution failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
} finally {
  await db.close();
}
