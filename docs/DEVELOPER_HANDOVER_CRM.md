# CreditTrust CRM Developer Handover

Last updated: 26 Jun 2026

## 1. Project

Repo: `https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git`

Production:

- Website: `https://credittrust.in`
- CRM: `https://credittrust.in/crm`
- CRM login: `https://credittrust.in/crm/sign-up-login-screen`

Primary product direction:

CreditTrust is moving from a direct bureau/CIBIL portal into a DSA CRM product. The bureau/eligibility pull is the core hook, but the product should look and behave like a practical DSA CRM:

- Lead management
- Eligibility checker
- Lender selection
- File process / loan application tracking
- Team management with role access
- Eligibility credits
- Partner onboarding/admin integration

## 2. Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Vercel production deployment

Useful commands:

```bash
npm install
npm run type-check
npm run build
npx vercel deploy --prod --yes --force
```

Important note:

Local `npm run build` may fail if `.env.local` is missing Supabase vars. Vercel production build currently passes because env vars exist there.

## 3. Environment Variables

Required app env:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_HUB_GATEWAY_URL=
API_HUB_GATEWAY_TOKEN=
API_HUB_GATEWAY_AUTH_HEADER=token
API_HUB_GATEWAY_TIMEOUT_MS=45000
```

For Supabase CLI migrations:

```bash
SUPABASE_ACCESS_TOKEN=
```

Do not commit `.env.local`. It is ignored.

## 4. Supabase

Project ref:

```txt
qoseffoyxasnqqdrcesb
```

Production CRM migration already applied:

```txt
20260626013000_crm_production_schema.sql
```

Migration file:

```txt
supabase/migrations/20260626013000_crm_production_schema.sql
```

Created CRM tables:

- `crm_leads`
- `crm_applications`
- `crm_team_members`
- `crm_lenders`
- `crm_eligibility_reports`
- `crm_application_documents`
- `crm_reminders`
- `crm_audit_logs`

Important migration note:

There is an old duplicate local migration timestamp:

```txt
20260510120000
```

It appears twice locally. The CRM migration itself is applied and working, but future `supabase db push` may need migration history cleanup before use.

## 5. Current Git Status

Latest relevant commits:

```txt
2ba4b2f Ignore Supabase local link cache
60b15df Ignore local environment files
37730ea Add production CRM data foundation
a9fc02f Add agent workboard to CRM dashboard
5120c68 Remove dashboard role info card
```

Production was deployed after commit:

```txt
37730ea Add production CRM data foundation
```

Then `.gitignore` safety commits were pushed.

## 6. CRM Architecture

Core routes:

```txt
src/app/crm/page.tsx
src/app/crm/lead-management/page.tsx
src/app/crm/eligibility-check/page.tsx
src/app/crm/eligibility-report/page.tsx
src/app/crm/lender-selection/page.tsx
src/app/crm/loan-application-tracking/page.tsx
src/app/crm/lender-management/page.tsx
src/app/crm/team-management/page.tsx
src/app/crm/setup/page.tsx
src/app/crm/sign-up-login-screen/page.tsx
```

Shared CRM helpers:

```txt
src/lib/crm/api.ts
src/lib/crm/scope.ts
src/lib/crm/access.ts
src/lib/crm/db.ts
src/lib/crm/leads.ts
src/lib/crm/lender-policy.ts
src/lib/crm/team.ts
```

CRM API routes:

```txt
src/app/api/crm/context/route.ts
src/app/api/crm/me/route.ts
src/app/api/crm/leads/route.ts
src/app/api/crm/team/route.ts
src/app/api/crm/lenders/route.ts
src/app/api/crm/eligibility-check/route.ts
```

## 7. Data Scope

Partner scoping is handled in:

```txt
src/lib/crm/scope.ts
```

Resolution priority:

- Bearer token from Supabase session
- User metadata/app metadata:
  - `crm_partner_id`
  - `partner_id`
- `partners.user_id`
- Fallback demo store if no partner is found

The CRM APIs are now table-aware:

- If partner exists and CRM tables exist, data is read/written from CRM tables.
- If not, fallback blob store under `b2c_report_requests.report_json` is still used.

This fallback is intentional so production does not break if tables are missing or demo mode is used.

## 8. Auth

CRM login page:

```txt
src/app/crm/sign-up-login-screen/components/SignUpLoginContent.tsx
```

Current behavior:

- Uses Supabase `signInWithPassword`.
- Visible demo accounts were removed.
- On login, local UI user metadata is saved in `localStorage` only for sidebar/display.
- Real API auth uses Supabase session token through `crmFetch`.

Client fetch helper:

```txt
src/lib/crm/api.ts
```

It attaches:

- `Authorization: Bearer <session token>`
- `x-crm-user-id`

Team creation:

```txt
src/app/api/crm/team/route.ts
```

When a team member is created for a real partner, it provisions a Supabase Auth user and stores metadata:

- `role: partner`
- `crm_role`
- `crm_partner_id`
- `crm_team_member_id`
- `crm_permissions`
- `is_temp_password`

## 9. Permissions

Permission definitions:

```txt
src/lib/crm/team.ts
```

Backend permission checks:

```txt
src/lib/crm/access.ts
```

Permissions:

- `dashboard`
- `lead_management`
- `eligibility_check`
- `lender_selection`
- `file_process`
- `lender_management`
- `team_management`
- `eligibility_credits`
- `reports`

## 10. Eligibility / Bureau Engine

Main route:

```txt
src/app/api/crm/eligibility-check/route.ts
```

Modes:

- Standard: full payload
- Advanced: mobile number -> prefill -> bureau payload -> bureau score

Gateway/vendor:

Jaadugar/bureau API gateway is configured through API Hub settings. CreditTrust acts as the reseller/client-facing product.

Existing API docs:

```txt
docs/api/bureau-standard.md
docs/api/bureau-advanced.md
```

Eligibility result writes:

- `crm_eligibility_reports`
- lead stage update
- eligibility credit debit in fallback store
- audit log hook

## 11. Dashboard

Dashboard:

```txt
src/app/crm/page.tsx
```

Real-data hydrated components:

```txt
src/app/crm/components/DashboardMetrics.tsx
src/app/crm/components/TopAgentsTable.tsx
```

These fetch:

```txt
/api/crm/eligibility-check
```

and calculate:

- Lead queue
- Eligibility checked
- Files in process
- Login pending
- Disbursed MTD
- Rejections
- Agent-wise workload

Some dashboard charts/activity panels are still partially static and should be connected next.

## 12. File Process

Main file process UI:

```txt
src/app/crm/loan-application-tracking/components/LoanApplicationContent.tsx
src/app/crm/loan-application-tracking/components/ApplicationDetailPanel.tsx
```

Current features:

- Application list
- Status filters
- Status history
- Notes
- Rejection reason
- Follow-up date
- Lender history base
- Document checklist metadata
- Document status updates

Still pending:

- Actual binary file upload/storage
- Real notification/reminder delivery
- Stronger lender-change workflow

## 13. Lender Flow

Flow direction decided:

1. Lead is created.
2. Eligibility check runs.
3. Eligibility report is generated.
4. Lender matches go to Lender Selection.
5. User selects lender.
6. Loan application/file is created.
7. File Process owns all status movement after lender selection.

Important product decision:

Eligibility checker should remain standalone and should not expose internal bureau/prefill implementation details to users.

## 14. Setup / Admin Link

Setup page:

```txt
src/app/crm/setup/page.tsx
```

It pulls partner context:

```txt
src/app/api/crm/context/route.ts
```

Goal:

CRM should use the existing CreditTrust admin partner onboarding, wallet/eligibility credits, invoices, accounting, and agreement flow.

Current status:

- Setup is partially admin-linked.
- Full real-time sync between admin wallet/invoice/agreement and CRM setup should be hardened.

## 15. Current Production Gaps

Highest priority gaps:

1. Dashboard charts and activity feed are still partly static.
2. Reports analytics still partly static.
3. Real binary document upload/storage is pending.
4. Bulk lead upload needs robust CSV/XLSX parser, validation, duplicate handling.
5. Real notification/reminder delivery is pending.
6. Lead assignment/reassignment workflow needs stronger UI and audit trail.
7. Lender change history should be improved.
8. File detail offers are still mock/partial.
9. Route-level UI access guards should be hardened.
10. Duplicate old migration timestamp should be cleaned for future Supabase CLI pushes.

## 16. Recommended Next Work Order

1. Connect dashboard activity/charts to real CRM tables.
2. Connect reports analytics to real CRM tables.
3. Add document upload to Supabase Storage.
4. Build bulk lead upload parser and validation UI.
5. Build reminders/notifications:
   - pending callback
   - document pending
   - lender TAT breach
6. Add full audit log screen for CRM.
7. Harden lead assignment/reassignment.
8. Harden lender change workflow.
9. Add route-level permission guards in UI.
10. Clean duplicate migration timestamp.

## 17. Codex Prompt For Next Developer

Use this prompt in a new Codex thread:

```txt
You are taking over the CreditTrust CRM repo.

Repo path:
/Users/shubhamsoni/Documents/New project/BUREAU-PORTAL

Read this handover first:
docs/DEVELOPER_HANDOVER_CRM.md

Production:
https://credittrust.in/crm

Current state:
- CRM production schema exists in Supabase.
- APIs are table-aware with fallback to old b2c_report_requests JSON store.
- Real Supabase login is enabled for CRM.
- Dashboard metrics and Agent Workboard hydrate from CRM data.
- Eligibility flow, lender selection, file process, team management, and setup exist.

Your next priority:
Connect remaining static CRM areas to real data without changing the visual design:
1. Dashboard activity/charts
2. Reports analytics
3. Document upload with Supabase Storage
4. Bulk lead upload
5. Notifications/reminders
6. Audit log UI

Rules:
- Do not redesign UI unless asked.
- Keep CreditTrust branding.
- Preserve partner-scoped data.
- Run npm run type-check before finishing.
- If deploying, use Vercel production and verify https://credittrust.in/crm returns 200.
```

## 18. Security Notes

- Revoke/rotate any Supabase access token shared during migration work.
- Never commit `.env.local`.
- `.env*` and `supabase/.temp/` are ignored.
- Avoid printing service role keys or tokens in logs.

