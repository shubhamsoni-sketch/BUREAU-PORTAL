# BUREAU-PORTAL Project Handoff

Use this file to onboard new agents/developers quickly. Keep implementation scoped and avoid unrelated UI or architecture changes unless requested.

Latest onboarding milestone: lender onboarding, KYC, and agreement statuses now have database transition matrices; backward resets and terminal offboard/agreement revival are blocked.

Latest program milestone: operating status uses a row-locking RPC, non-draft program content is database-frozen, ownership/provenance is immutable, and retirement is terminal.

Latest document-intake milestone: private policy-document metadata is registered through a relationship/checksum/storage-bound RPC, atomically binds draft policy source evidence, and rejects direct service-client DML.

Latest audit milestone: Lender Intelligence audit writes use a private bounded RPC with canonical Auth actor identity; direct service-client DML is revoked and history remains append-only.

Latest compliance milestone: data-quality findings are service-client read-only; scanner refresh and claim/resolve/risk-accept/reopen workflows exclusively own mutations.

Latest clawback milestone: registration and resolution are private row-locking RPCs that recalculate contractual recovery from immutable payout/commercial/disbursal evidence; direct service-client DML is revoked.

Latest reconciliation milestone: the payout reconciliation ledger is service-client read-only; all creation, valuation, invoice, receipt, dispute, write-off, and release mutations are workflow-owned.

Latest application-evidence milestone: stage and outcome ledgers are service-client read-only, with writes restricted to atomic selection, reroute, and application-transition RPCs.

Latest exception milestone: routing exception requests and maker-checker reviews now use private row-locking RPCs; direct service-client writes are revoked and target evidence is derived inside the transaction.

Latest routing boundary milestone: eligibility recommendation snapshots are registered through an idempotent partner/report/lead-bound RPC; direct service-client decision writes are revoked.

Latest evidence-input milestone: routing snapshots and application transitions have database-enforced payload, value, text, and event-time bounds, with mirrored API validation and contract coverage.

Latest learning-readiness milestone: performance now includes PII-free fixed borrower-profile bands joined from immutable decisions to outcomes, with minimum-sample suppression and an explicit descriptive-only/no-model contract.

Latest export-control milestone: the finance/compliance workspace exposes bounded audit and compliance register CSVs; every export is admin-only, no-store, formula-safe, optionally partner-scoped, and fail-closed on immutable access-audit failure.

Latest routing-readiness milestone: matching, initial selection, and rerouting all recheck verified KYC, signed agreement, and live agreement expiry rather than trusting an older active lender status.

Latest exception-expiry milestone: approvals revalidate the complete live routing dependency chain, remain consumable for 24 hours, and stale approvals are retired atomically before a replacement request.

Latest privacy milestone: compliance SLA findings no longer persist borrower names, and register exports deliberately exclude free-text issue/resolution narratives while preserving operationally traceable structured IDs.

Latest selection-integrity milestone: initial selection and reroute are canonical-actor, payload, value, lead-lineage, and event-time bound; client creation timestamps are ignored and each complete state transition includes an atomic Lender Intelligence audit record.

Latest billing-identity milestone: lender master now governs finance email, registered billing address, and GSTIN; complete identity is required for activation/routing and appears in the invoice recipient block, without storing bank credentials in plaintext.

Latest invoice-reproducibility milestone: invoice creation freezes immutable issuer and recipient legal/tax/contact snapshots, and artifact rendering prefers this historical evidence so later master-data or branding changes cannot alter issued records; live joins remain a legacy fallback.

Latest consent milestone: eligibility no longer silently asserts consent. Operators must explicitly attest the approved purpose; the report freezes versioned consent evidence against the canonical authenticated actor, and recommendation, selection, and reroute workflows fail closed for unproven legacy or new reports.

Latest consent-lifecycle milestone: report detail exposes a governed withdrawal action; the database appends one actor-bound, audited withdrawal record and blocks that report from every future recommendation, initial selection, and reroute without destroying historical evidence.

Latest capacity milestone: lender programs support optional IST operating-day submission limits; real-time recommendations explain exhaustion, both initial selection and reroute serialize on the program and recount immutable opening events, and a reasoned admin RPC governs cap changes without allowing retired-program mutation.

Latest capacity-scale milestone: current usage is computed by a bounded authenticated database aggregate for up to 500 programs, eliminating API row-limit undercounts; routing consumes exact exhaustion and the admin program register shows live used/remaining counts.

Latest finance-classification milestone: lender payout invoices are now server/database-enforced receivables and cannot be relabeled through request input. Partner commission remains a deliberately separate payable-ledger requirement until its basis, tax, eligibility, settlement, and clawback terms are approved.

Latest application-custody milestone: governed CRM application rows cannot be deleted or have source identity, lender, amount, lifecycle history, or rejection evidence rewritten through legacy service-client writes; only transaction-flagged atomic reroute/transition workflows may advance protected state.

Latest partner-payable milestone: partner commissions now have their own source-backed, maker-checker contract versions and immutable disbursal-linked payable/payment ledgers. GST, TDS, due date, and term evidence are snapshotted at materialization; payments are actor-bound, idempotent, partial-settlement safe, and cannot draw on or relabel lender receivable invoices.

Partner payable operations also include evidenced contract termination, hold/dispute/release/write-off controls, and automated overdue compliance findings. Scheduled and manual scans escalate 30-day overdue balances while retaining claimed ownership and accepted-risk decisions.

Post-payment partner recoveries now use their own governed subledger rather than lender-receivable clawbacks. Aggregate claims cannot exceed commission cash paid; registration is actor-bound and independently resolved as disputed, recovered with a collection reference, or waived. The admin finance workspace and audited bounded CSV export expose the register without borrower PII or narrative evidence.

Lender Intelligence admin APIs now fail closed on purpose-specific permissions stored only in trusted `app_metadata`: catalog read, policy management, routing review, finance read/write, and compliance read/write. The migration assigns `*` to existing admins for continuity; newly provisioned restricted operators need explicit grants and a refreshed token. Database maker-checker separation remains mandatory even when both actors hold the same functional capability.

The shared admin authenticator was hardened at the same boundary: it no longer treats client-editable `user_metadata.role` as authorization. Only trusted auth `app_metadata.role` or a server-read admin `user_profiles` row establishes base admin identity; the migration's existing-admin capability bootstrap uses those same trusted sources.

The requirement-by-requirement launch evidence and remaining production proofs are maintained in `docs/tasks/lender-intelligence-completion-audit.md`. Do not describe the platform as production-complete until every item in that document's final evidence list is closed.

Use `docs/LENDER_INTELLIGENCE_RELEASE_EVIDENCE.md` as the per-release production proof and sign-off record. It deliberately accepts only opaque operational IDs and access-controlled artifact references, never bearer tokens, borrower PII, bureau payloads, source policy documents, or confidential commercial values.

The post-deploy rollout verifier now consumes a database-owned schema manifest in addition to API contracts. It fails unless critical relations, functions, table-bound triggers, RLS, direct-write restrictions, lender receivable registers, and partner payable registers are present under migration `20260912220000_lender_intelligence_foundation`.

Partner payout identity is now versioned and maker-checker verified. Only masked PAN/account digits, IFSC, legal/tax/contact details, and the payment-provider beneficiary reference are retained. An active commission contract requires a verified beneficiary, and each generated payable freezes that beneficiary version for reproducible settlement evidence.

Outgoing partner settlement is also dual-controlled. A maker submits the payment instruction and evidence; a different checker approves or rejects it. Approval locks and revalidates the payable, prevents overpayment/stale approval, and atomically posts the immutable payment. The low-level posting function is not executable by the service API role.

Finance handoff exports now include separate partner payable and payment-approval CSV registers. Both are 90-day/5,000-row bounded, partner-filterable, formula-safe, audited, and omit borrower names, narrative notes, and full PAN/account credentials.

Latest finance boundary milestone: invoice headers, fiscal sequences, receipts, allocations, and adjustments are read-only to service clients; all writes are restricted to governed security-definer RPCs.

Latest lifecycle milestone: lender pause/offboarding now orders program shutdown atomically, offboarding is terminal, and lender identity/provenance fields are protected against direct database mutation.

Latest integrity milestone: lender policy documents now have database-enforced evidence custody—immutable file/ownership/checksum/validity metadata, deletion prevention, maker-checker review, preserved reviewer evidence, and expiry only after the recorded expiry time.

## Repository

- GitHub: `https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git`
- Main local dev URL: `http://127.0.0.1:4028`
- Current Vercel demo URL: `https://bureau-portal.vercel.app`
- Framework: Next.js 15 app router
- Database/Auth/Storage: Supabase

## Local Setup

```powershell
git clone https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git
cd BUREAU-PORTAL
npm install
powershell -ExecutionPolicy Bypass -File .\scripts\decrypt-env.ps1 -Password "<ask-owner-for-password>"
npm run dev
```

Open:

```text
http://127.0.0.1:4028/admin
```

Notes:

- `.env` is not committed in plain text.
- `.env.enc` is committed and can be decrypted with `scripts/decrypt-env.ps1`.
- Ask the project owner for the encryption password.
- Do not commit the generated `.env`.

## Verification Commands

The same checks are enforced by `.github/workflows/lender-intelligence-quality.yml` for in-scope pull requests and pushes to `main`. Locally, run the dedicated suite and type-check before the production build:

```powershell
npm run test:lender-intelligence
npm run type-check
npm run build
```

## Admin Login

Ask the project owner for current admin credentials if needed. Existing local/dev credentials were used during implementation, but avoid hardcoding credentials in code or docs.

## Demo Credentials

Use this account for client demos:

- Partner login URL: `https://bureau-portal.vercel.app/partner-login`
- Demo partner email: `user@demo.in`
- Demo partner password: ask owner if changed; initial demo password was set during implementation.
- Demo wallet opening balance: `100000`
- Demo Bureau OTP: `123456`

Demo account behavior:

- Full partner portal works with demo data.
- Bureau pulls use generated demo report data, not the live external bureau API.
- Demo Bureau score is normalized to `790`.
- Wallet deduction still happens so the demo looks realistic.
- Run `scripts/seed-demo-account.mjs` when the demo account/wallet needs to be reset.

## Current Completed Work

### Lender Intelligence Operating System Foundation

Implemented locally on 12 Sep 2026:

- Admin overview, routing, performance, onboarding, policy governance, commercials, invoicing, and reconciliation workspaces.
- Additive schema for lender master, programs, versioned policies and rules, policy evidence, routing decisions, stage events, outcomes, commercials, lender invoices, reconciliation, and data-quality issues.
- Admin-only catalog and finance operation APIs.
- Maker-checker policy and commercial activation with atomic database functions.
- Explainable deterministic matching with hard/soft/warning rules, missing-data state, fit score, reason trace, and ranking.
- Published-policy routing with legacy matcher fallback until active policy data exists.
- Server enforcement for file-process permission, eligible matched lender, active lender/program, and saved eligibility report.
- Structured status events and sanction/rejection/disbursal outcomes.
- Automatic payout calculation and invoice-ready reconciliation creation on disbursal.
- Outcome-based approval/rejection rates, TAT percentiles, override rate, policy freshness, payout exposure, and data-quality KPIs.
- Automated lender-policy regression tests covering rule operators, missing inputs, hard/soft/warning outcomes, product filtering, deterministic ranking, and rank assignment.
- Auditable lender rerouting that closes the prior active file as `rerouted` and preserves distinct historical lender attempts.
- PostgreSQL-atomic rerouting: prior-file closure, target-file creation, and paired stage events roll back as one unit on failure.
- Automated commercial payout tests for flat, percentage, slab, boundary, open-ended, rounding, and invalid-input behavior.
- Preview-first, atomic bulk lender/program import with duplicate/range validation and active-program overwrite protection.
- Governed policy restoration and checker rejection; retired policies clone into new drafts and never bypass maker-checker approval or immutable history.
- Hourly `CRON_SECRET`-protected SLA scanning with deduplicated pending-login and TAT-breach notifications; deployment needs a Vercel plan that permits three cron jobs/hourly cadence.
- Database-aggregated KPI evidence contract with cohort/maturity rules, pending separation, numerator/denominator disclosure, TAT percentiles, and n=20 suppression.
- Lender/program/product/partner KPI breakdowns with uncapped database aggregation and direct source-application drill-down.

Important files:

- `docs/tasks/lender-intelligence-product-plan.md`
- `docs/LENDER_INTELLIGENCE_OPERATIONS.md`
- `supabase/migrations/20260912220000_lender_intelligence_foundation.sql`
- `src/lib/lender-intelligence/engine.ts`
- `src/lib/lender-intelligence/commercials.ts`
- `src/lib/lender-intelligence/server.ts`
- `src/app/api/admin-lender-intelligence/catalog/route.ts`
- `src/app/api/admin-lender-intelligence/operations/route.ts`

Production note: the new migration has not been applied and the application has not been deployed. Apply the migration before deploying these routes. Populate only verified lender policies; existing lender defaults are demo data.

### Agreement Flow

Implemented and pushed:

- Admin agreement list page: `src/app/admin-agreements/page.tsx`
- Partner agreement page: `src/app/agreement/page.tsx`
- Admin agreement APIs:
  - `src/app/api/admin-agreements-list/route.ts`
  - `src/app/api/admin-upload-agreement/route.ts`
  - `src/app/api/admin-update-agreement-status/route.ts`
- Partner agreement APIs:
  - `src/app/api/partner-agreement/route.ts`
  - `src/app/api/sign-agreement/route.ts`
- Server-side Supabase admin helper:
  - `src/lib/supabase/admin.ts`
- Route protection updated:
  - `src/components/AdminGuard.tsx`
- Auth loading fix:
  - `src/context/AuthContext.tsx`
- Supabase migration:
  - `supabase/migrations/20260508193000_partner_agreements.sql`

### Demo Bureau Flow

Implemented:

- Demo account seed/reset script:
  - `scripts/seed-demo-account.mjs`
- Demo response generator:
  - `src/lib/bureau/demo-response.ts`
- State code mapping:
  - `src/lib/bureau/state-codes.ts`
- Internal bureau pull route:
  - `src/app/api/pull-bureau-real/route.ts`
- Partner pull form updates:
  - `src/app/pull-bureau/page.tsx`

Current behavior:

- Demo partner is detected by email `user@demo.in` or partner code `DEMO001`.
- Demo partner gets demo bureau JSON and wallet deduction.
- Non-demo partners currently receive `501 Live bureau integration is not enabled yet`.
- Live external bureau API should not be enabled until owner/developer reviews success and error JSON formats.

### Login And Guard Fixes

Implemented:

- Partner login no longer remains stuck on the "Signing in..." loader after successful auth:
  - `src/app/partner-login/page.tsx`
- Root auth guard no longer shows the full-screen "Authentication Required" message on protected pages:
  - `src/components/AdminGuard.tsx`
- Browser auth persistence is localStorage-backed with a stable storage key:
  - `src/lib/supabase/client.ts`
- Existing admin/partner sessions redirect to their correct portal instead of logging out when the wrong login page is opened:
  - `src/app/admin/page.tsx`
  - `src/app/partner-login/page.tsx`

Current guard behavior:

- Public pages render normally.
- Unauthenticated partner routes quietly redirect to `/partner-login`.
- Unauthenticated admin routes quietly redirect to `/admin`.
- Authenticated partner/admin sessions survive refresh and normal route navigation.
- Role-based `Access Denied` and partner `Agreement Required` screens remain active.

### Deployment Status

Current production deployment:

- `https://bureau-portal.vercel.app`

Vercel setup notes:

- Project is linked locally through `.vercel`.
- Environment variables were added from decrypted `.env`.
- `.env` must remain uncommitted.

### Supabase Migration Status

The `partner_agreements` table migration has already been run successfully in Supabase for the current project DB.

The migration creates:

- `public.partner_agreements`
- RLS policies for partner read/sign
- Admin/service role management policies
- Indexes on partner, user, and status

### Test Data

A test agreement was created during verification:

- Partner email: `test@gmail.com`
- Agreement name: `Test Agreement - Browser Verification`
- Status: `pending`

## Agreement Flow Behavior

Expected flow:

1. Admin logs in.
2. Admin goes to `Admin -> Agreements`.
3. Admin uploads/assigns partner-specific agreement file.
4. Partner logs in.
5. Partner is blocked from normal portal pages until agreement is signed.
6. Partner opens `/agreement`.
7. Partner checks consent and signs.
8. Partner dashboard and portal pages unlock.

Current v1 signing is checkbox consent only. Real e-sign integration is planned for later.

## Next Major Task: Real Bureau Integration

Do not implement until response JSON sample is reviewed and discussed.

External API provided by owner/developer:

```text
POST https://fincooper.in/v1/bureau-score/get-bureau-score (owner-provided endpoint may still contain vendor-specific path internally)
```

Payload sample:

```json
{
  "firstName": "HARSHAL",
  "middleName": "ARUN",
  "lastName": "PAWAR",
  "birthDate": "13122000",
  "gender": "2",
  "idNumber": "GEAPP1589H",
  "stateCode": "23",
  "pinCode": "450221",
  "telephoneNumber": "7067384810"
}
```

Known mapping:

- `MALE = 2`
- `FEMALE = 1`

Important state behavior:

- Portal currently takes state name, not state code.
- Map selected state name to `stateCode`.
- Do not auto-detect state from PIN.

State code source:

- Owner provided `State Code.docx`.
- The mapping includes examples:
  - `23 = Madhya Pradesh`
  - `27 = Maharashtra`
  - `07 = Delhi`
  - `24 = Gujarat`
  - `08 = Rajasthan`
  - `09 = Uttar Pradesh`
  - `36 = Telangana`

Still needed before build:

- Success response JSON sample.
- Error response JSON sample.
- Confirm whether API needs auth header/token.

Suggested architecture:

1. Frontend `/pull-bureau` calls internal route, for example `/api/pull-bureau-real`.
2. Internal route maps portal form fields to external API payload.
3. Internal route calls the owner-provided bureau score endpoint.
4. Save raw response JSON for audit/history.
5. Normalize score/report fields for UI.
6. Deduct wallet only after valid successful response.
7. Do not deduct wallet on API/network/validation failure.

## Lender Intelligence finance integrity

- Apply `supabase/migrations/20260912220000_lender_intelligence_foundation.sql` before deploying the lender intelligence UI/API.
- Payment posting is append-only, idempotent, and rejects amounts above the net invoice balance.
- Reconciliation write-offs use the database RPC so the item, adjustment ledger, and invoice balance cannot diverge.
- The finance workspace exposes both payment references and adjustment reasons for operations audit.
- Commercial tax is stored separately from payout subtotal, and partner-scoped terms always win over the global fallback.
- Commercial review now supports both independent approval and reasoned rejection; maker and checker cannot be the same admin.
- Settled payouts can enter a contractual clawback register; recovery amounts are calculated from the attached commercial version and ledger source fields are database-immutable.
- Lender files now reject backward, duplicate, and post-terminal stage changes; sanction and disbursal cannot be recorded with a zero amount.
- Persisted stage changes use `transition_lender_application`; application status/history, event, outcome, and disbursal reconciliation are one database transaction with an expected-current-stage concurrency guard.
- Finance can restore a validated invoice dispute or cancel only a zero-paid, zero-adjustment invoice; cancellation releases its reconciliation items atomically and retains the cancelled invoice record.
- Readiness/compliance issues now have an owner-aware lifecycle. Automated scans preserve claimed work and accepted risks; admins must record evidence to resolve, accept, or reopen an issue.
- Policy rules are limited to the live routing-input taxonomy. Extend `policy-schema.ts`, the routing snapshot, and database allowlists together before introducing a new borrower field.
- Program-master amount, tenure, employment, channel, state, and city restrictions are converted into hard explainable routing reasons; preserve this behavior when adding program dimensions.
- Private document upload enforces lender/program/policy referential ownership, and signed reads are fail-closed on immutable access-audit failure.
- Private documents have a one-way pending-to-verified/rejected lifecycle with independent reviewer enforcement and mandatory rejection evidence.
- Document-sourced policy versions require linked verified, current, checksum-matched source evidence before review and again inside the publication transaction.
- Routing excludes paused programs and applies an explainable 15-point operational penalty to limited-capacity programs without converting them into credit-policy failures.
- Commercial creation rejects cross-lender program linkage and malformed payout values/slabs; the finance UI now sends the actual slab array consumed by disbursal payout calculation.
- PostgreSQL independently enforces commercial payout validity, including ordered non-overlapping slabs and percentage ceilings; preserve the table constraint for every ingestion path.
- Lender invoice creation uses deterministic row locks before aggregation to prevent concurrent double-invoicing of reconciliation items.
- Custom commercial payouts require a positive finance-approved amount and evidence before becoming invoice-ready; GST is applied atomically, and PostgreSQL blocks zero-value invoices.
- Lender invoices receive a future due date (15-day default); the atomic raise function locks and revalidates draft state, total, due date, and linked source items before issuance.
- Hourly readiness scanning also tracks overdue lender invoices with outstanding balances, escalates severity after 30 days, and emits a deduplicated collections notification to the invoice creator.
- Finance supports partial and full receipts; each invoice-plus-UTR produces a stable idempotency key, while PostgreSQL rejects overpayments, changed replays, malformed references, and sub-paise amounts.
- Finance can download an A4 lender invoice PDF backed by reconciliation line items; the admin-only endpoint is no-store and fails closed if its access audit cannot be recorded.
- Invoice identifiers are fiscal-year sequential and allocated transactionally from the service-role-only `lender_invoice_sequences` table; do not replace this with application-side numbering.
- Catalog upsert cannot activate or mutate non-draft programs; database triggers independently enforce compliance-ready lenders and published-policy-backed programs on all activation paths.
- Persisted initial program selection uses `commit_lender_selection`; it atomically validates snapshot/rank/current state and writes the application, decision binding, first stage, and one-time approved-exception consumption.
- Persisted lender switches use `reroute_crm_application`; it preserves the original decision, creates a derived decision from the immutable routing snapshot, and atomically commits both application/stage changes plus exact approved-exception consumption.
- Governed application progression fails without an application-bound lender/program decision. Rejections accept only an active canonical partner/global taxonomy code, enforced in the transition RPC and reused across stage and outcome evidence.

## Safety Rules For Agents

- Do not commit `.env`.
- Do not print Supabase keys or service role key.
- Keep UI style consistent with existing admin/partner portal.
- Do not redesign unrelated pages.
- Avoid broad refactors unless the task requires it.
- For bureau work, discuss response JSON before implementing.
- Run build and type-check before pushing.
- If the worktree has unrelated changes, do not revert them.
- Invoice receipts now create immutable `lender_invoice_payment_allocations` rows and allocate exact incremental amounts under deterministic row locks; this prevents rounding drift and incorrect reallocation after partial payments or write-offs.
- Audited lender invoice artifacts surface each payment reference/UTR allocation against its exact reconciliation line, closing the source-to-payment evidence chain for finance review.
- Core evidence is database-enforced append-only. Routing recommendations permit one evidence-preserving application binding; stage events, outcomes, invoice payments, payment allocations, adjustments, and audit logs reject UPDATE/DELETE even through service-role paths.
- Policy and commercial version integrity is enforced below the APIs: draft content is editable, submission freezes it, reviewed/live economics cannot mutate, deletion is blocked, and corrections require a new governed version.
- Deferred database validation guarantees every active program retains a currently effective published policy while allowing atomic version replacement; lender shutdown is blocked until its active programs are paused/retired, and activation cannot be future-dated.
- Routing commits reject stale policy snapshots and require a new eligibility run. Exception rows are database-bound to exact decision evidence, immutable after request, independently reviewed against current readiness, and consumable only once.
- Stage and outcome rows are not merely append-only: insert triggers bind them to the current partner application, routed lender/program, continuous timestamped stage chain, terminal event, positive outcome amounts, and canonical rejection taxonomy.
- Every disbursal is represented in reconciliation. Missing commercial coverage is never silently dropped: it creates a zero-value unbilled row plus critical readiness issue; custom/unmatched calculations remain visible for finance action.
- New reconciliation rows are independently recalculated at the database boundary from the exact routed disbursal and immutable historical commercial; mismatched payout, GST, scope, or readiness is rejected.
- Deferred payment-allocation conservation guarantees receipt amount equals exact line allocations. Allocation invoice/balance checks plus reconciliation source and received-balance guards close direct service-role mutation paths.
- Reconciliation lifecycle is database-governed: exact invoice attachment/release, immutable line value, bounded monotonic receipts, valid paid/part-paid evidence, and dispute-only write-off are enforced on every update path.
- Invoice headers are database-conserved against payment/adjustment ledgers with immutable identity/totals/due date and governed states. Multi-line write-off keeps the invoice disputed until its last disputed line is resolved.

# Latest lender-intelligence hardening

Lender onboarding is now workflow-owned: `save_lender_master` validates and serializes master updates, forces safe initial states, and direct table DML is revoked from API roles. Catalog writes use the RPC. Bulk import is also database-guarded and delegates to the canonical lender/program workflows; it can update drafts only and cannot bypass actor, tenant, identity, range, SLA, or lifecycle controls. All human-triggered lender-intelligence workflows verify their actor against canonical Supabase `auth.users` identity before mutation, including finance, commercial approval, policy, routing, application, compliance, documents, lifecycle, and clawback operations. Live Supabase migration and authenticated end-to-end validation remain rollout prerequisites. After deployment, `npm run verify:lender-intelligence-rollout` provides a read-only live gate using a short-lived admin bearer token.

Lender-product program content is also workflow-owned through `save_lender_program`: only draft records can be created or edited, partner-owned lenders cannot cross tenant scope, mutable inputs are bounded, and operating-state changes stay isolated in their lifecycle RPC.

Policy draft creation and submission are now database-owned. Program-row locking serializes version numbers and prevents competing draft/review branches; submission revalidates rules and verified document evidence. Direct policy-version and policy-rule DML is revoked from API roles.

Commercial draft creation is database-owned and lender-row serialized. It validates commercial scope and economics before assigning a version, blocks parallel draft/review terms for the same scope, and the commercial table is read-only to API roles.

Stale direct-write helpers for stage/outcome/reconciliation and post-selection decision/exception mutation were removed. Normalized evidence now has no API fallback around the atomic selection, reroute, and transition workflows; duplicate same-lender submissions are idempotent.

Canonical lender rejection reasons are now returned by the admin catalog and managed only through a private audited workflow. Code and tenant scope are immutable, deactivation preserves history, and the required global `OTHER` fallback is protected.

The onboarding workspace now exposes this taxonomy as an operational register/editor, including global/partner scope, order, descriptions, and active-state management.

Finance can now terminate active commercial terms through `terminate_lender_commercial`; the row is locked, evidence and timeline are validated, historical references remain intact, and the finance workspace exposes the action.

Published policies can now be manually retired through `retire_lender_policy` only after pausing/retiring their program. The action preserves historical decision evidence, requires a reason, closes the effective window, and is exposed in the governance queue.

Draft policy and commercial versions can be discarded into terminal rejected history through private audited workflows. This releases their scope for a corrected version without deleting provenance.
