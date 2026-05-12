# Admin System Blueprint

This document explains how to rebuild the current portal admin system for another product. It covers the data model, auth model, backend APIs, admin screens, partner flows, B2C customer flow, deployment setup, and implementation order.

Use this as the master handoff for a developer who needs to create a similar admin portal from scratch.

## 1. Tech Stack

- Framework: Next.js 15 App Router
- Language: TypeScript
- UI: React 19, Tailwind CSS, lucide-react icons
- Backend style: Next.js route handlers under `src/app/api/*`
- Database/Auth/Storage: Supabase
- Deployment: Vercel
- Runtime port locally: `4028`

Core scripts:

```bash
npm install
npm run dev
npm run build -- --no-lint
npm run type-check -- --pretty false
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional/current placeholders:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ADSENSE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
```

For the new system, do not expose the service role key in client code. Use it only inside server route handlers.

## 2. High-Level Modules

The portal has these major areas:

- Public website: landing, partner program, contact, informational pages.
- Admin portal: partners, customer master, B2C reports, wallet, payments, invoices, agreements, integrations, audit logs.
- Partner portal: dashboard, wallet, report pull form, report history, invoices, profile, agreement signing.
- B2C customer journey: mobile verification, customer details, consent, payment, report generation.
- Backend APIs: Supabase service-role APIs for admin and partner operations.
- Database: Supabase auth plus public schema tables.

Admin navigation groups:

- Overview: Dashboard
- Partner Management: Partners, Customer Master, B2C Reports
- Finance: Wallet Management, Payments, Invoices
- Documents: Agreements
- System: Integrations, Audit Logs

## 3. Auth And Role Model

Supabase Auth is the identity provider.

Roles:

- `admin`: full admin access.
- `partner`: partner portal access only.

Role is stored in:

- `auth.users.raw_app_meta_data.role`
- `auth.users.raw_user_meta_data.role`
- `public.user_profiles.role`

Admin verification must prefer `app_metadata.role` because user metadata can be edited by the user in some auth systems.

Frontend auth context:

- Keeps Supabase session persisted in browser.
- Loads `user_profiles`.
- For partner users, loads matching `partners` row.
- Keeps user logged in with Supabase session persistence.

Route protection:

- Public routes render without auth.
- Admin routes require `user.role === 'admin'`.
- Partner routes require `user.role === 'partner'`.
- Partner routes also require signed agreement, except onboarding routes.

Important route groups:

```ts
ADMIN_ONLY_PATHS = [
  '/admin-partners',
  '/admin-wallet',
  '/admin-payments',
  '/admin-agreements',
  '/admin-integrations',
  '/admin-audit-logs',
  '/admin-invoices',
  '/admin-customer-master',
  '/admin-b2c-reports',
  '/admin-dashboard',
  '/customer-master',
  '/partners',
];

PARTNER_ONLY_PATHS = [
  '/partner-dashboard',
  '/pull-bureau',
  '/my-wallet',
  '/reports-history',
  '/my-profile',
  '/partner-invoices',
];
```

## 4. Supabase Client Pattern

Use three Supabase helpers:

1. Browser client:
   - Uses anon key.
   - Persists session.
   - Used by client components.

2. Server client:
   - Uses anon key with cookies.
   - Used by server components when needed.

3. Admin/service client:
   - Uses service role key.
   - Used only in API routes.
   - Bypasses RLS for admin operations.

Admin helper behavior:

```ts
requireAdmin(accessToken)
```

- Reads bearer token from request.
- Validates Supabase user.
- Checks metadata/profile role.
- Returns admin Supabase client or 401/403.

## 5. Database Schema

The new system should recreate these tables and relationships.

### 5.1 Enums

```sql
user_role: 'admin', 'partner'
partner_status: 'pending', 'approved', 'rejected', 'suspended', 'terminated'
invoice_status: 'Paid', 'Pending', 'Cancelled', 'draft', 'raised', 'paid'
transaction_type: 'recharge', 'deduction', 'manual_adjustment', 'refund'
payment_order_status: 'pending', 'success', 'failed', 'expired'
subscription_type: 'prepaid', 'monthly_fixed', 'hybrid'
pricing_plan: 'Basic', 'Standard', 'Premium', 'Custom'
webhook_event_status: 'received', 'processed', 'failed', 'ignored'
```

For a fresh build, avoid mixed-case/lowercase invoice statuses. Prefer one clean enum:

```sql
invoice_status: 'draft', 'raised', 'paid', 'cancelled'
```

The current project has legacy values because it evolved over time.

### 5.2 `user_profiles`

Purpose: app-level user profile and role.

Columns:

- `id uuid primary key references auth.users(id)`
- `email text unique not null`
- `full_name text not null default ''`
- `role user_role not null default 'partner'`
- `created_at timestamptz`
- Later migration adds temp password fields in current project if needed.

Rules:

- Every auth user should have a matching profile.
- Create profile automatically with auth trigger.
- Admin can view/manage all; user can view own.

### 5.3 `partners`

Purpose: partner company/account master.

Columns:

- `id uuid primary key`
- `user_id uuid references user_profiles(id)`
- `name text not null`
- `company_name text`
- `mobile text`
- `email text unique not null`
- `city text`
- `partner_code text unique`
- `status partner_status`
- `pricing_plan text`
- `wallet_balance numeric`
- `reports_pulled integer`
- `authorized_person text`
- `gst_number text`
- `address text`
- `is_demo boolean default false`
- `created_at timestamptz`
- `updated_at timestamptz`

Rules:

- Partner user can view only own partner record.
- Admin can manage all partner records.
- Demo account can be marked with `is_demo = true`.

### 5.4 `partner_requests`

Purpose: public "Become Partner" lead/request form.

Columns:

- `id uuid primary key`
- `name text not null`
- `company_name text`
- `mobile text`
- `email text not null unique`
- `city text`
- `address text`
- `state text`
- `pin_code text`
- `gst text`
- `business_type text`
- `service_type text`
- `status text check pending/approved/rejected`
- `submitted_at timestamptz`
- `reviewed_at timestamptz`
- `reviewed_by uuid`

Flow:

1. Public user submits partner request.
2. Admin sees request.
3. Admin approves.
4. System creates Supabase auth user, `user_profiles`, `partners`, default wallet/commercial rows.
5. System sends or shows credentials.

### 5.5 `wallet_transactions`

Purpose: append-only wallet ledger.

Expected core columns:

- `id uuid primary key`
- `partner_id uuid references partners(id)`
- `type text` such as `credit` or `debit`
- `amount numeric`
- `description text`
- `created_at timestamptz`
- `transaction_type transaction_type`
- `reference_id text`
- `rate_snapshot numeric`
- `running_balance numeric`
- `performed_by uuid`
- `metadata jsonb`
- `status text default 'confirmed'`
- `updated_at timestamptz`

Rules:

- Never trust only `partners.wallet_balance`.
- Use `wallet_transactions` as ledger.
- `wallet_balances` is fast-read materialized summary.
- Report pulls create debit transactions.
- Admin recharges/create invoices create credit transactions.
- Pending invoice credit should not count until payment is confirmed.

### 5.6 `wallet_balances`

Purpose: fast wallet summary per partner.

Columns:

- `id uuid primary key`
- `partner_id uuid unique references partners(id)`
- `balance numeric`
- `total_recharged numeric`
- `total_deducted numeric`
- `last_transaction_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Use function:

```sql
refresh_wallet_balance(p_partner_id uuid)
```

It recalculates balance from confirmed wallet transactions.

### 5.7 `partner_commercials`

Purpose: per-partner commercial/pricing configuration.

Columns:

- `id uuid primary key`
- `partner_id uuid unique references partners(id)`
- `pricing_plan pricing_plan`
- `subscription_type subscription_type`
- `credit_rate numeric`
- `bundled_credits integer`
- `credit_limit integer`
- `addon_credits integer`
- `consumer_rate numeric`
- `commercial_rate numeric`
- `notes text`
- `set_by uuid`
- `created_at timestamptz`
- `updated_at timestamptz`

Rules:

- Use `consumer_rate` for individual/consumer report pulls.
- Use `commercial_rate` for company/commercial report pulls.
- Keep `credit_rate` as fallback for old data.

### 5.8 `invoices`

Purpose: partner billing/invoice records.

Columns:

- `id uuid primary key`
- `invoice_number text unique`
- `partner_id text` or uuid in a clean rebuild
- `partner_name text`
- `partner_email text`
- `amount numeric`
- `credits_added integer`
- `payment_mode text`
- `status invoice_status`
- `transaction_ref text`
- `utr_number text`
- `paid_at timestamptz`
- `notes text`
- `source_transaction_id uuid`
- `issued_at timestamptz`
- `created_at timestamptz`

Recommended clean rebuild:

- Use `partner_id uuid references partners(id)` instead of text.
- Use only lowercase status values.

### 5.9 `invoice_settings`

Purpose: company invoice metadata.

Columns:

- `id uuid primary key`
- `company_name text`
- `company_address text`
- `gst_number text`
- `logo_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

### 5.10 `payments`

Purpose: confirmed partner payment records.

Columns:

- `id uuid primary key`
- `partner_id uuid references partners(id)`
- `partner_name text`
- `partner_email text`
- `invoice_id uuid references invoices(id)`
- `invoice_number text`
- `amount numeric`
- `credits_added integer`
- `payment_mode text`
- `utr_number text`
- `source text`
- `recorded_by uuid`
- `paid_at timestamptz`
- `created_at timestamptz`

Flow:

- Admin marks invoice paid.
- System confirms wallet transaction.
- System refreshes wallet balance.
- System inserts payment row.

### 5.11 `payment_orders` And `webhook_logs`

Purpose: online payment gateway lifecycle for partner recharge.

Current naming is Stripe-oriented, but the same shape works for Cashfree/Razorpay.

`payment_orders`:

- `id uuid`
- `partner_id uuid`
- `stripe_session_id text unique`
- `stripe_payment_intent_id text`
- `amount_inr numeric`
- `credits_to_add integer`
- `status payment_order_status`
- `failure_reason text`
- `retry_count integer`
- `last_retried_at timestamptz`
- `webhook_received_at timestamptz`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

`webhook_logs`:

- `id uuid`
- `event_id text unique`
- `event_type text`
- `payment_order_id uuid`
- `partner_id uuid`
- `status webhook_event_status`
- `raw_payload jsonb`
- `error_message text`
- `processed_at timestamptz`
- `created_at timestamptz`

For a new Cashfree-first system, rename fields:

- `gateway_order_id`
- `gateway_payment_id`
- `gateway text default 'cashfree'`

### 5.12 `notifications`

Purpose: partner/admin notifications.

Columns:

- `id uuid primary key`
- `user_id uuid references user_profiles(id)`
- `type text`
- `title text`
- `message text`
- `is_read boolean`
- `metadata jsonb`
- `created_at timestamptz`

Use cases:

- Partner request approved.
- Invoice raised.
- Payment confirmed.
- Credit request approved/rejected.
- Agreement assigned.

### 5.13 `credit_requests`

Purpose: partner asks admin for wallet credit/recharge.

Columns:

- `id uuid primary key`
- `partner_id uuid references partners(id)`
- `user_id uuid references user_profiles(id)`
- `amount numeric check amount >= 10000`
- `status text pending/approved/rejected`
- `note text`
- `created_at timestamptz`
- `reviewed_at timestamptz`
- `reviewed_by uuid`
- `updated_at timestamptz`

Flow:

1. Partner requests credits.
2. Admin sees request.
3. Admin approves.
4. System creates pending/confirmed wallet transaction and invoice depending on business rule.
5. Notification is created.

### 5.14 `bureau_pulls` / Report Pull History

Purpose: store partner report pulls.

Columns:

- `id uuid primary key`
- `partner_id uuid references partners(id)`
- `report_type text` (`consumer` or `commercial`)
- `status text` (`success` or `failed`)
- `member_ref text`
- `pan text`
- `customer_name text`
- `credit_score integer`
- `occupation_code text`
- `gender text`
- `state text`
- `dob text`
- `income text`
- `total_trades integer`
- `active_trade_lines integer`
- `loan_types text`
- `dpd_tag text`
- `current_balance numeric`
- `overdue_amount numeric`
- `total_enquiries integer`
- `raw_json jsonb`
- `amount_deducted numeric`
- `error_message text`
- `report_id text`
- `bureau text`
- `created_at timestamptz`
- `updated_at timestamptz`

For a new non-bureau product, rename this table to:

```sql
report_requests
report_history
analysis_reports
```

Do not leak provider-specific names into public UI.

### 5.15 `partner_agreements`

Purpose: admin uploads/assigns agreement; partner signs before portal access.

Columns:

- `id uuid primary key`
- `partner_id uuid references partners(id)`
- `user_id uuid references auth.users(id)`
- `agreement_name text`
- `file_path text`
- `status text pending/signed/expired/cancelled`
- `assigned_by uuid`
- `assigned_at timestamptz`
- `signed_at timestamptz`
- `signed_ip text`
- `signed_user_agent text`
- `created_at timestamptz`
- `updated_at timestamptz`

Storage:

- Supabase Storage bucket for agreement PDFs.
- Admin upload API stores file.
- Signed URL API returns temporary view URL.

### 5.16 B2C Tables

Purpose: customer website journey and payment/report tracking.

`b2c_report_requests`:

- `id uuid primary key`
- `first_name text`
- `middle_name text`
- `last_name text`
- `full_name text`
- `mobile text not null`
- `email text`
- `pan text`
- `dob date`
- `gender text`
- `address text`
- `state text`
- `pin_code text`
- `consent_given boolean`
- `consent_at timestamptz`
- `status text`
- `report_type text default 'individual_financial_health'`
- `credit_score integer`
- `report_id text`
- `report_json jsonb`
- `api_request_json jsonb`
- `api_response_json jsonb`
- `api_status text`
- `api_error text`
- `created_at timestamptz`
- `updated_at timestamptz`

`b2c_payments`:

- `id uuid primary key`
- `request_id uuid references b2c_report_requests(id)`
- `full_name text`
- `mobile text`
- `pan text`
- `gateway text default 'cashfree'`
- `order_id text`
- `payment_id text`
- `amount numeric default 199`
- `currency text default 'INR'`
- `status text`
- `raw_response jsonb`
- `paid_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Important: admin needs actual PAN and real customer details for records, so do not mask PAN in admin tables. Masking can be done only in public/customer UI.

## 6. Backend API Blueprint

All APIs live under `src/app/api/*/route.ts`.

### 6.1 Admin Auth

`POST /api/verify-admin`

- Validates current Supabase user.
- Confirms role is admin.
- Used by admin login/guard logic.

`POST /api/setup-admin`

- Creates or fixes admin user/profile.
- Should be protected or disabled in production after setup.

### 6.2 Partner Management

`GET /api/admin-partners-list`

- Returns all partners for admin.
- Joins/uses partner status, wallet, report count.

`POST /api/add-partner`

- Admin creates partner directly.
- Creates auth user.
- Creates `user_profiles`.
- Creates `partners`.
- Initializes wallet/commercial rows.

`POST /api/approve-partner`

- Approves a `partner_requests` row.
- Creates/updates auth user.
- Creates `user_profiles`.
- Creates `partners`.
- Sends notification.

`POST /api/reject-partner`

- Marks request rejected.

`POST /api/update-partner-status`

- Suspends/approves/rejects/terminates partner.

`POST /api/update-partner-pricing`

- Updates legacy `partners.pricing_plan` or related price fields.

`POST /api/save-partner-commercials`

- Upserts `partner_commercials`.
- Stores consumer/commercial rate, subscription type, credit limit, notes.

`POST /api/update-partner-profile`

- Partner updates own profile fields.

`POST /api/partner-request`

- Public partner lead form.
- Inserts `partner_requests`.
- Handles duplicate email gracefully.

### 6.3 Wallet And Credits

`GET /api/partner-wallet-data`

- Partner wallet summary, transactions, commercials.

`POST /api/request-credits`

- Partner creates credit request.
- Notifies admin.

`GET /api/approve-credit-request`

- Admin list credit requests.

`POST /api/approve-credit-request`

- Admin approves/rejects.
- Creates wallet transaction and invoice.
- Sends notification.

`POST /api/add-credits`

- Admin adds credits manually.
- Creates wallet transaction.
- Creates invoice.

`GET /api/admin-wallet-transactions`

- Admin ledger list.

### 6.4 Invoices And Payments

`GET /api/admin-invoices-list`

- Admin invoice list with filters.

`POST /api/admin-invoices-list`

- Create/update invoice depending current route implementation.

`POST /api/raise-invoice`

- Raises invoice for pending wallet transaction/credit request.
- Notifies partner.

`POST /api/mark-invoice-paid`

- Calls `mark_invoice_paid_atomic` if available.
- Fallback manually updates invoice, confirms transaction, refreshes wallet, inserts payment, notifies partner.

`GET /api/admin-payments-list`

- Admin confirmed partner payments from `payments`.

`GET/POST /api/admin-invoice-settings`

- Read/update company invoice settings.

### 6.5 Agreements

`POST /api/admin-upload-agreement`

- Admin uploads agreement file.
- Stores in Supabase Storage.
- Inserts `partner_agreements`.

`GET /api/admin-agreements-list`

- Admin lists agreements and signed URLs.

`POST /api/admin-update-agreement-status`

- Admin changes agreement status.

`GET /api/partner-agreement`

- Partner fetches own assigned agreement and signed URL.

`POST /api/sign-agreement`

- Partner signs agreement.
- Stores signed timestamp, IP, user agent.

### 6.6 Notifications

`GET /api/get-notifications`

- Gets notifications for current user.

`POST /api/mark-notifications-read`

- Marks one or all notifications read.

### 6.7 Partner Report Pull

`POST /api/pull-bureau-real`

Current purpose:

- Validates partner.
- Checks wallet balance and commercial rate.
- Calls report provider or demo response.
- Deducts wallet.
- Updates `partners.wallet_balance`.
- Upserts `wallet_balances`.
- Inserts debit `wallet_transactions`.
- Inserts `bureau_pulls`.
- Returns parsed report.

For the new system:

- Rename route to provider-neutral name, for example `/api/pull-report`.
- Keep provider-specific API code in a service module.
- Store raw provider response in JSONB.
- Store normalized summary fields in report table.

`POST /api/pull-bureau-deduct`

- Deduct-only/report-save helper.
- Uses `partner_commercials`, wallet balance, transactions, report history.

`GET /api/bureau-pulls`

- Partner report history.

`GET /api/admin-bureau-pulls`

- Admin customer master report list.

### 6.8 B2C Customer Journey

`POST /api/customer-report/request`

- Creates/updates `b2c_report_requests`.
- Saves stages:
  - `mobile_started`
  - `mobile_verified`
  - `details_submitted`
  - `consent_given`
  - `payment_pending`
  - `report_generated`
- Saves full PAN and customer details.

`POST /api/customer-report/create-order`

- Creates Cashfree order in future.
- Current stub returns demo order if Cashfree keys are missing.
- Inserts `b2c_payments`.
- Marks request `payment_pending`.

`POST /api/customer-report/verify-payment`

- Verifies gateway payment in future.
- Current stub marks payment success and creates demo report fields.
- Updates `b2c_report_requests` with report id, score, report JSON.

`GET /api/admin-b2c-reports`

- Admin B2C report/customer list.

`GET /api/admin-b2c-payments`

- Admin B2C payment list.

## 7. Frontend Page Blueprint

### 7.1 Public Pages

Recommended pages:

- `/`
- `/home`
- `/partner-program`
- `/become-a-partner`
- `/get-my-report`
- `/about`
- `/contact`
- `/features`
- `/integrations`

Public website should use product-neutral copy. If the product is financial health, say:

- Financial Health Report
- Credit Score
- Financial Analysis
- Report Insights

Do not say the upstream bureau/provider name on public landing pages unless legally required.

### 7.2 Admin Pages

`/admin`

- Admin login.
- Uses Supabase auth and admin verification.

`/admin-partners`

- Partner list.
- Status actions.
- Commercials modal.
- Partner profile fields.
- Partner request approval.

`/admin-customer-master`

- Admin master list of partner report pulls.
- Tabs:
  - Consumer
  - Commercial
  - Failed Pulls
  - B2C
- Search by name, PAN, reference, partner, report id.
- CSV export.
- Row detail modal.

`/admin-b2c-reports`

- B2C customer journey/report records.
- Shows full customer data and actual PAN for admin.
- Stats:
  - total requests
  - B2C revenue
  - generated reports
  - pending
- Detail modal includes consent, address, API status, API error.

`/admin-wallet`

- Partner wallet balances.
- Wallet transactions.
- Credit requests.
- Admin recharge flow.

`/admin-payments`

- Tabs:
  - Partner Payments
  - B2C Payments
- Partner table from `payments`.
- B2C table from `b2c_payments`.

`/admin-invoices`

- Invoice list.
- Raise invoice.
- Mark paid.
- Payment mode and UTR.

`/admin-agreements`

- Upload agreement.
- Assign to partner.
- View status.

`/admin-integrations`

- Placeholder/settings for API keys and external integrations.

`/admin-audit-logs`

- Placeholder or future activity log.

### 7.3 Partner Pages

`/partner-login`

- Partner login.

`/partner-dashboard`

- KPIs, wallet, report volume, recent reports, quick actions.

`/pull-bureau` or `/pull-report`

- Partner report pull form.
- Should include fields required by provider:
  - first name
  - middle name
  - last name
  - mobile
  - PAN
  - DOB
  - gender
  - address
  - state code
  - PIN
  - consent
- On submit, call report API and deduct wallet.

`/reports-history`

- Partner report history.
- Opens report modal.

`/my-wallet`

- Wallet balance, transactions, request credits.

`/partner-invoices`

- Partner invoices and payment status.

`/my-profile`

- Profile fields.

`/agreement`

- Agreement viewer/signing.

`/change-password`

- Force password change if temp password flag is enabled.

## 8. Core Business Flows

### 8.1 Admin Creates Partner

1. Admin fills partner details.
2. API checks duplicate email.
3. API creates Supabase auth user.
4. API creates `user_profiles` with role `partner`.
5. API creates `partners` row.
6. API creates `partner_commercials`.
7. API creates `wallet_balances`.
8. Optional: agreement assigned.
9. Partner receives credentials.

### 8.2 Public Partner Request Approval

1. Public form inserts `partner_requests`.
2. Admin reviews.
3. Admin approves.
4. System creates partner auth/profile/partner row.
5. Request status becomes approved.
6. Notification created.

### 8.3 Partner Login

1. Partner signs in with Supabase.
2. Auth context loads `user_profiles`.
3. If role partner, load partner row.
4. If agreement pending, redirect/block to `/agreement`.
5. If temp password required, show password change flow.

### 8.4 Wallet Recharge Via Admin Invoice

1. Admin adds credits or approves credit request.
2. System creates wallet transaction with status pending or confirmed.
3. System creates invoice.
4. Admin marks invoice paid.
5. `mark_invoice_paid_atomic`:
   - sets invoice paid
   - confirms transaction
   - recalculates wallet balance
   - updates partner legacy wallet balance
   - inserts payment record
6. Partner sees updated wallet.

### 8.5 Partner Report Pull

1. Partner fills report pull form.
2. API validates partner and status.
3. API gets commercial rate.
4. API checks wallet balance.
5. API sends payload to provider.
6. API normalizes response.
7. API deducts wallet.
8. API inserts `wallet_transactions` debit.
9. API inserts report history row.
10. UI shows report.

Important rule:

- Deduct only when the provider call is considered successful, unless business explicitly wants charge-on-attempt.

### 8.6 B2C Customer Flow

1. Customer clicks CTA.
2. Enters mobile.
3. OTP verification happens.
4. Customer sees report benefits/education.
5. Customer fills actual details including PAN.
6. Customer gives consent.
7. Price is shown only at final payment step.
8. Cashfree order is created.
9. Payment is verified.
10. Real report API is called.
11. `b2c_report_requests` stores actual customer data, raw API request/response, normalized summary.
12. `b2c_payments` stores payment record.
13. Admin can view in B2C Reports, Customer Master B2C tab, Payments B2C tab.

## 9. Provider Integration Pattern

Keep provider logic isolated.

Recommended structure:

```txt
src/lib/report-provider/
  payload.ts
  client.ts
  normalize.ts
  types.ts
```

Payload module:

- Converts app form fields to provider API payload.
- Handles gender/state codes.
- Handles first/middle/last name mapping.
- Adds consent fields.

Client module:

- Reads API base URL/key from env.
- Sends request.
- Handles timeout/retry.
- Returns raw JSON.

Normalize module:

- Extracts:
  - score
  - report id
  - customer name
  - trade count
  - active trade lines
  - enquiries
  - overdue amount
  - current balance
  - loan types
  - DPD/risk tag
- Stores raw response separately.

Never build UI directly from raw provider JSON only. Always store:

- raw JSON for audit/debug
- normalized fields for tables/search/export

## 10. Security Rules

- Service role key only in server route handlers.
- Admin APIs should validate admin bearer token unless they are internal-only and protected by app routing.
- RLS should be enabled for user-facing tables.
- Partner can read only own partner/report/wallet/invoice/agreement data.
- Admin can read/manage all.
- Storage files should use signed URLs, not public buckets, for agreements.
- Actual PAN can be visible in admin only.
- Public/customer UI should mask sensitive data after entry where possible.
- Keep audit fields:
  - `created_at`
  - `updated_at`
  - `performed_by`
  - `recorded_by`
  - raw request/response JSON

## 11. RLS Policy Pattern

Use helper functions:

```sql
public.is_admin_user()
public.get_current_partner_id()
```

Pattern:

- Admin policies: full access if `is_admin_user()`.
- Partner policies: select own records where `partner_id = get_current_partner_id()`.
- Service role policies: allow all for server-side automation/webhooks.

For B2C tables:

- Current system relies on service role APIs and no public direct table access.
- In a stricter rebuild, enable RLS and allow service_role only.

## 12. Deployment Checklist

1. Create Supabase project.
2. Add env vars locally and in Vercel.
3. Run migrations in order.
4. Create/fix admin user.
5. Create Storage bucket for agreements.
6. Deploy to Vercel.
7. Verify:
   - admin login
   - partner create/approve
   - partner login
   - agreement assignment/sign
   - wallet recharge
   - invoice paid
   - report pull
   - report history
   - customer master
   - B2C journey
   - B2C admin tabs

## 13. Suggested Build Order For New System

1. Set up Next.js, Tailwind, Supabase clients.
2. Build auth and role model.
3. Add admin layout/sidebar/topbar/guard.
4. Add base DB tables:
   - `user_profiles`
   - `partners`
   - `partner_requests`
5. Build admin partners module.
6. Add wallet tables and partner commercials.
7. Build wallet/invoice/payment modules.
8. Add partner portal.
9. Add agreement system.
10. Add report pull history table.
11. Add provider integration in isolated service.
12. Add customer master.
13. Add B2C customer flow and B2C admin modules.
14. Add audit logs and integration settings.
15. Add demo mode and seed account.
16. Final polish: exports, filters, notifications, error states.

## 14. Demo Mode

Recommended demo account pattern:

- One shared demo partner login.
- Mark partner row `is_demo = true`.
- Give large demo wallet balance.
- Use demo provider response instead of real API.
- Demo data should never affect real billing or provider calls.

Current demo credentials:

```txt
Email: user@demo.in
Password: Demo@2026
```

For a new system, keep demo credentials configurable and seed via migration.

## 15. Important Implementation Notes

- Keep admin/partner/B2C data separate in UI tabs and tables.
- Do not mix partner payments with B2C customer payments.
- Do not mix partner customer master with B2C customer master without a clear tab/source column.
- Keep raw provider JSON for every successful/failed report attempt.
- Use normalized columns for dashboard/table performance.
- Use service role APIs for admin writes.
- Keep public page copy provider-neutral.
- Build Cashfree as a replaceable payment adapter.
- Build report provider as a replaceable API adapter.
- Keep WORKLOG updated for every meaningful change.

## 16. File Map From Current Project

Core layout/auth:

- `src/context/AuthContext.tsx`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/components/AdminGuard.tsx`
- `src/components/AdminLayout.tsx`
- `src/components/AdminSidebar.tsx`
- `src/components/AdminTopbar.tsx`

Admin pages:

- `src/app/admin/page.tsx`
- `src/app/admin-partners/page.tsx`
- `src/app/admin-customer-master/page.tsx`
- `src/app/admin-b2c-reports/page.tsx`
- `src/app/admin-wallet/page.tsx`
- `src/app/admin-payments/page.tsx`
- `src/app/admin-invoices/page.tsx`
- `src/app/admin-agreements/page.tsx`
- `src/app/admin-integrations/page.tsx`
- `src/app/admin-audit-logs/page.tsx`

Partner pages:

- `src/app/partner-login/page.tsx`
- `src/app/partner-dashboard/page.tsx`
- `src/app/pull-bureau/page.tsx`
- `src/app/reports-history/page.tsx`
- `src/app/my-wallet/page.tsx`
- `src/app/partner-invoices/page.tsx`
- `src/app/my-profile/page.tsx`
- `src/app/agreement/page.tsx`
- `src/app/change-password/page.tsx`

B2C pages:

- `src/app/get-my-report/page.tsx`

Representative APIs:

- `src/app/api/add-partner/route.ts`
- `src/app/api/approve-partner/route.ts`
- `src/app/api/admin-partners-list/route.ts`
- `src/app/api/save-partner-commercials/route.ts`
- `src/app/api/add-credits/route.ts`
- `src/app/api/request-credits/route.ts`
- `src/app/api/approve-credit-request/route.ts`
- `src/app/api/raise-invoice/route.ts`
- `src/app/api/mark-invoice-paid/route.ts`
- `src/app/api/admin-payments-list/route.ts`
- `src/app/api/pull-bureau-real/route.ts`
- `src/app/api/bureau-pulls/route.ts`
- `src/app/api/admin-bureau-pulls/route.ts`
- `src/app/api/customer-report/request/route.ts`
- `src/app/api/customer-report/create-order/route.ts`
- `src/app/api/customer-report/verify-payment/route.ts`
- `src/app/api/admin-b2c-reports/route.ts`
- `src/app/api/admin-b2c-payments/route.ts`

Database migrations:

- `supabase/migrations/20260404001539_auth_onboarding.sql`
- `supabase/migrations/20260403212615_invoice_management.sql`
- `supabase/migrations/20260404210000_wallet_payment_system_phase1.sql`
- `supabase/migrations/20260406100000_manual_payment_flow.sql`
- `supabase/migrations/20260406200000_notifications_credit_requests.sql`
- `supabase/migrations/20260407130000_bureau_pulls_table.sql`
- `supabase/migrations/20260508193000_partner_agreements.sql`
- `supabase/migrations/20260510120000_demo_partner_support.sql`
- `supabase/migrations/20260510120000_seed_demo_partner.sql`
- `supabase/migrations/20260512024610_b2c_report_requests.sql`

## 17. Minimum Viable Clone Scope

If the second system needs the same admin quickly, build this first:

1. Supabase auth/admin/partner roles.
2. Admin layout/sidebar/guard.
3. Partner master.
4. Wallet ledger and balances.
5. Partner commercials/pricing.
6. Invoices and payments.
7. Customer/report master table.
8. B2C reports and B2C payments.
9. Agreement upload/signing.
10. Notifications.

Everything else can be added after the core admin is stable.
