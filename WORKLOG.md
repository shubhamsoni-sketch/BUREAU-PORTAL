# Worklog

- Added atomic audit evidence to initial explainable routing-decision persistence and every application stage/outcome transition. Routing replays remain idempotent without duplicate audits; disbursal audits include the commercial version, calculated payout, and GST lineage.
- Made the full compliance data-quality issue lifecycle atomically audited. Claim, resolve, accept-risk, and reopen now record previous/current ownership and state with evidence inside the locked database mutation; removed the catalog's final mutation-side post-commit audit.
- Made private document registration/review and rejection-taxonomy create/update atomically audited. Added canonical reviewer verification to document review, retained failed-metadata storage cleanup, and removed all three mutation-side API post-commit audits.
- Made lender/program master saves and operating-status changes atomically audited for both create/update branches and lifecycle transitions. Removed four API post-commit audits plus the program-activation readiness pre-read; canonical locked database guards now own the decision.
- Made policy restoration and policy-rule replacement atomically audited. Restoration records exact copied-rule count and lineage; rule replacement locks the policy and commits content plus audit together. Removed both API post-commit audits and the stale draft-status pre-read.
- Made the principal policy maker-checker lifecycle atomically audited: draft creation, submission, publication, rejection, retirement, and discard now commit state plus source/checksum/effective-date evidence together. Removed six API post-commit audits and the stale policy-submission pre-read.
- Made the complete commercial maker-checker lifecycle atomically audited: draft creation, submission, rejection, activation, termination, and discard now commit state plus rich commercial evidence together. Removed all six API post-commit audits and the stale submission pre-read.
- Made routing-exception request and independent review audits atomic with their locked lifecycle mutations. Complete decision/program/policy/reason/reviewer evidence now commits together, and both APIs no longer perform fallible post-commit logging.
- Made every reconciliation resolution path atomically audited: dispute, direct settlement, invoice-lifecycle restoration, and write-off now commit state and evidence together. Removed the API's race-prone finance pre-read and post-commit audit.
- Made custom/manual payout audit atomic with approved amount, calculated GST, approval evidence, and the invoice-ready transition. Audit failure leaves the reconciliation item untouched; removed post-commit API logging.
- Made invoice cancellation audit atomic with cancellation status, mandatory reason, and reconciliation-line release. Audit failure rolls the entire reversal back; removed post-commit API logging.
- Made invoice raising audit atomic with the locked draft-to-raised transition and issued timestamp. Audit failure now leaves the invoice in draft; removed post-commit API logging.
- Made invoice creation audit atomic with fiscal-sequence allocation, header insertion, reconciliation-line attachment, and calculated totals. Audit failure now rolls back all invoice state including the sequence increment; removed post-commit API logging.
- Made invoice payment audit atomic with receipt posting, allocation, and balance updates. Audit failure rolls back all cash evidence; identical idempotent replay returns before audit insertion and cannot duplicate payment or audit rows. Removed the post-commit API audit.
- Made clawback liability and settlement audit evidence atomic: registration and recovered/waived resolution now append canonical audit events inside their database transactions, and the API no longer performs fallible post-commit duplicate logging.
- Added clawback cash-settlement evidence: `recovered` now requires a bounded payment/UTR reference and records the exact recovered amount, while `waived` explicitly rejects recovery receipt fields. Database transition guards, API, finance UI, and audit metadata are aligned.
- Capped clawback recovery to the lower of contracted payout and actual cash received. Full, percentage, and fixed recovery can no longer exceed received payout principal or accidentally recover GST as payout principal.
- Corrected clawback accounting eligibility: written-off reconciliation items can no longer create recovery liabilities because no payout was received; registration and the finance action are now restricted to actually paid items.
- Added active-content blocking to policy-document inspection: PDF JavaScript/launch/embedded-file actions and legacy Office VBA/macro stream markers (ASCII or UTF-16) are rejected before private storage.
- Tightened OOXML policy-document inspection beyond ZIP magic bytes: DOCX/XLSX uploads now require the content-types manifest and correct `word/` or `xl/` package root, and packages advertising embedded `vbaProject.bin` macros are rejected before storage.
- Hardened private policy-document uploads with server-side binary signature verification for PDF, OOXML, and legacy Office formats. Empty, disguised, mismatched, or unknown content is rejected before storage and metadata registration.
- Corrected and strengthened the live rollout verifier against the actual API shapes (`reconciliation`/`exceptions` and root intelligence payload), added invalid-token rejection, response credential-leak detection, fresh-generation checks, and KPI cohort/breakdown evidence validation.
- Added a deployment-safe authenticated rollout verifier for the live Lender Intelligence catalog, operations, and KPI surfaces. It is read-only, timeout-bounded, redirect-denying, contract-aware, does not print its bearer token, and exits non-zero on any failed launch gate.
- Split manual and scheduled compliance scan execution: admin-triggered readiness scans now use a canonical actor-bound database wrapper that commits scan changes and immutable audit evidence atomically; the raw no-argument scanner remains isolated to the `CRON_SECRET` scheduler.
- Completed the canonical actor rollout for the newest governed workflows: policy draft/submit/retire/discard, commercial draft/terminate/discard, and rejection-taxonomy maintenance now resolve real `auth.users` identities rather than accepting any non-null UUID.
- Extended canonical `auth.users` actor verification across application transitions, policy rules/restoration/review/publish, routing decisions/exceptions, lender and program lifecycle changes, compliance issue handling, private-document registration, and clawback registration/resolution.
- Closed fabricated finance/commercial provenance: a private canonical actor verifier now resolves identities against `auth.users`; invoice creation/raise/cancel, manual payout valuation, payment posting, reconciliation resolution, and commercial submit/reject/activate workflows reject null, unknown, or invented actors before mutation.
- Hardened lender/program bulk import so the private database RPC independently checks actor, batch/payload bounds, duplicate program codes, and locked lifecycle state, then delegates all writes to the canonical lender and program workflows. Bulk import can now update only drafts and cannot bypass tenant, identity, range, SLA, or immutable lifecycle controls; its immutable audit record commits atomically with the entire batch.

Keep this file updated for meaningful changes. Add newest entries at the top.

## 2026-09-13 - Codex - Lender compliance state machines

- Added database transition matrices for lender onboarding, KYC, and agreement lifecycles while preserving the current UI onboarding flow.
- Blocked backward KYC resets, invalid onboarding jumps, offboarded revival, and in-place resurrection of terminated agreements.

## 2026-09-13 - Codex - Governed lender-program lifecycle

- Added a row-locking program operating-status RPC with explicit draft/active/paused/retired transitions.
- Froze lender ownership/provenance universally and all program identity, eligibility, pricing indicator, SLA, priority, and metadata fields after draft; retirement is terminal.

## 2026-09-13 - Codex - Governed private-document registration

- Moved policy-document metadata creation into a private RPC validating lender/program/policy ownership, MIME type, storage scope, checksum, and expiry.
- Made draft-policy checksum binding atomic with registration and revoked direct service-client document DML.

## 2026-09-13 - Codex - Canonical audit-ledger registration

- Replaced direct audit inserts with a private RPC that resolves canonical actor email from Auth and validates module, identifiers, summaries, and bounded JSON metadata.
- Revoked direct service-client audit DML while preserving reporting reads and append-only history.

## 2026-09-13 - Codex - Workflow-owned compliance findings

- Revoked direct data-quality issue DML from service clients while preserving compliance reporting reads.
- Restricted finding creation/refresh to the scanner and claim/resolve/accept/reopen mutations to the row-locking lifecycle RPC.

## 2026-09-13 - Codex - Governed clawback lifecycle

- Moved clawback registration and recovered/waived resolution into private row-locking database functions.
- Recalculated recovery from immutable settlement, commercial, and disbursal evidence; revoked direct service-client clawback DML.

## 2026-09-13 - Codex - Workflow-owned reconciliation ledger

- Revoked direct reconciliation-item DML from service clients while preserving reporting reads.
- Restricted payout creation, custom valuation, invoicing, receipt settlement, disputes, write-offs, and cancellation release to security-definer workflows.

## 2026-09-13 - Codex - RPC-only application evidence ledgers

- Revoked direct stage-event and lender-outcome DML from service clients; governed selection, reroute, and transition functions are now the only production writers.
- Preserved service reporting reads and explicitly scoped the old helper to pre-migration compatibility only.

## 2026-09-13 - Codex - RPC-only routing exceptions

- Moved exception request and maker-checker review into private row-locking database functions that derive targets from immutable routing evidence.
- Revoked direct routing-exception DML from service clients and added concurrent-open-request and independent-review enforcement.

## 2026-09-13 - Codex - Governed routing snapshot registration

- Replaced direct routing-decision insertion with a private idempotent RPC validating exact partner, lead, eligibility report, engine, input, and result evidence.
- Enforced one immutable unbound recommendation snapshot per report and revoked direct decision-table DML even from service-role clients.

## 2026-09-13 - Codex - RPC-only invoice finance boundary

- Revoked direct DML on invoice headers, sequences, receipts, allocations, and adjustments from public, user, and service-role clients.
- Retained service-role reporting reads while requiring every financial mutation to pass through the governed security-definer workflows.

## 2026-09-13 - Codex - Atomic lender shutdown and identity custody

- Corrected pause/offboard ordering so active programs are atomically paused or retired before the lender shutdown guard evaluates.
- Made offboarding terminal and protected lender code, partner binding, creation provenance, and governed legal identity from direct database rewrites.

## 2026-09-13 - Codex - Policy document evidence custody

- Enforced SHA-256 document identity and valid issue/expiry terms at the database boundary.
- Made lender/program/policy ownership, storage metadata, checksum, validity dates, uploader, and creation time immutable; document evidence cannot be deleted.
- Preserved maker-checker review evidence and allowed verified-to-expired movement only after the recorded expiry time.

## 2026-09-05 - Developer - B2C Credit Intelligence Dashboard

Summary:

- Added a session-protected Credit Intelligence experience for each completed B2C report.
- Added a server-side analytics layer that derives score factors, account performance, DPD history, utilisation, enquiries, risk flags, insights, and action plans from the saved raw bureau JSON.
- Kept sensitive customer values masked in the customer dashboard while preserving the complete raw provider response in the existing B2C request record.
- Added a direct handoff from the report-success screen to the new intelligence dashboard, without changing OTP, payment, bureau generation, or PDF download flows.

Verification:

- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.
- `npm run type-check -- --pretty false` passed.
- No OTP, payment, prefill, or live bureau request was made during verification.

## 2026-08-31 - Developer - Live B2C Financial Report Journey

Summary:

- Replaced the demo B2C report form with mobile consent, WhatsApp OTP, Cashfree payment, mobile prefill confirmation, live bureau generation and PDF download.
- Added signed request sessions, OTP hashing/rate limits, payment verification, an atomic bureau-generation lock and complete consent/payment/download metadata.
- Added Cashfree and WhatsApp OTP production configuration documentation.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- No paid bureau call was made during verification.

## 2026-06-26 - Developer - CRM User Login And Role Enforcement

Summary:

- Added CRM auth user provisioning from Team Management with temporary password generation.
- Added CRM password reset flow for existing team members.
- Added `/api/crm/me` so CRM layout/sidebar can load the logged-in user's real role and module permissions.
- Added backend permission guards for team, leads, lenders, eligibility, credits, and file process actions.
- Extended CRM scoping to resolve team users through auth metadata `crm_partner_id`.

Verification:

- `npm run type-check -- --pretty false` passed.

## 2026-06-25 - Developer - Partner Scoped CRM Store

Summary:

- Added CRM scope resolution so CRM APIs can resolve the logged-in partner from Supabase auth and store data per partner.
- Moved leads, team, lenders, eligibility reports, and file applications away from the hardcoded global CRM store for authenticated partners.
- Added `crmFetch` so CRM pages send the current Supabase session token to CRM APIs.
- Kept the old demo store as a fallback when CRM pages are opened without a partner session.

Verification:

- `npm run type-check -- --pretty false` passed.

## 2026-06-25 - Developer - Link CRM Setup To CreditTrust Admin Data

Summary:

- Added `/api/crm/context` to resolve the active CreditTrust partner and return admin-managed onboarding data in one response.
- Wired CRM Setup to show the existing admin partner profile, wallet ledger, invoices, agreement, and commercials.
- Removed the standalone CRM credit-add flow from Setup display so wallet, invoice, and agreement remain controlled by CreditTrust admin.

Verification:

- `npm run type-check -- --pretty false` passed.

## 2026-06-25 - Developer - Setup Onboarding Tabs

Summary:

- Simplified CRM Setup to a single Onboarding Setup module.
- Added simple tabs inside Onboarding Setup for DSA Profile, Wallet Management, Invoice & Accounting, and Agreement.
- Removed Access Control and Bureau Setup cards from the Setup page to avoid overlapping with existing CRM settings/navigation.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - Simplify CRM Setup Layout

Summary:

- Removed nested tab/section switching from CRM Setup.
- Converted setup into a single scrollable control page with DSA Profile, Wallet Management, Wallet Ledger, Invoice & Accounting, Agreement, Access Control, and Bureau Setup sections.
- Kept existing add credits, ledger, and invoice display behavior intact.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - CRM Setup Onboarding Sections

Summary:

- Restructured CRM Setup into Setup tabs for Onboarding, Access Control, and Bureau Setup.
- Moved wallet credits, ledger, invoices, accounting, DSA profile, and agreement into the Onboarding section.
- Preserved existing eligibility credit add and invoice generation flow inside Wallet Management.
- Added clear placeholders for admin-linked DSA profile and agreement state until partner-scoped workspace data is wired.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - CRM Team Roles And Permissions

Summary:

- Added CRM team member model with Admin, Manager, DSA Agent, Ops Executive, and Accounts roles.
- Added module permission matrix for dashboard, leads, eligibility, lender selection, file process, setup, reports, and team management.
- Added `/api/crm/team` for team CRUD, status toggles, deletion guard, and CRM store persistence.
- Updated Team Management UI to load/save real team data and manage module-level access.
- Added role preview so the CRM sidebar/topbar can show navigation based on selected user permissions.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - File Document Checklist

Summary:

- Added application-level document checklist metadata for File Process.
- Added document upload status, verification, rejection, and missing-state updates.
- Added document readiness counts in the File Process table and detail panel.
- Blocked file submission until required documents are verified.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Demo Lender Eligibility Seed

Summary:

- Added a CRM backend seed action for a demo eligibility report with lender matches.
- The seeded demo lead appears in Eligibility Checked Leads and can be sent to the lender queue for flow testing.
- Demo data is idempotent so repeated seeding updates the same demo lead/report instead of creating duplicates.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Show Lender Eligibility In Reports

Summary:

- Persisted matched lender recommendations with each CRM eligibility report.
- Added lender match visibility to Eligibility Checked Leads and Eligibility Reports.
- Added a checked-lead Send to Lender action so eligible leads can be pushed to the lender queue after the report is reviewed.
- Added lender eligibility details in the report drawer.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Embed Eligibility Reports In Checker

Summary:

- Removed the right-side Queue Summary panel from CRM Eligibility Checker so the lead table can use full width.
- Added top sub-tabs inside Eligibility Checker for Lead Queue and Eligibility Reports.
- Embedded the existing Eligibility Reports screen inside the checker tab while keeping the direct reports route available.
- Removed Eligibility Reports from the main CRM sidebar so reports are managed inside Eligibility Checker.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Scalable Eligibility Lead Queue

Summary:

- Reworked CRM Eligibility Checker queue from lead cards into a table layout suitable for large bulk-uploaded lead lists.
- Added queue tabs for Pending Leads and Eligibility Checked Leads with counts, search, sticky table headers, and row-level actions.
- Added Run Eligibility action directly on pending lead rows so a lead can be checked without first opening a card.
- Added checked-lead rows with result summary and View Report action so completed checks move out of the pending queue.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Lead Queue Eligibility Flow

Summary:

- Added a CRM leads backend store behind `/api/crm/leads` so lead capture, queue state, and lender submissions persist with the CRM data.
- Simplified Add Lead to basic inquiry fields only: customer, mobile, city, product, amount, source, assignment, follow-up, and notes.
- Added a Pending Leads queue inside Eligibility Checker so agents can select leads one-by-one and run mobile/full-details eligibility.
- Updated eligibility checks to mark selected leads as eligibility done and added a lender submission action that creates a loan application queue entry.
- Wired Loan Application Tracking to read submitted applications from the CRM store while keeping the existing UI layout intact.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Hide Internal Eligibility Workflow Copy

Summary:

- Removed internal implementation wording from CRM Eligibility Checker UI.
- Replaced public-facing copy that mentioned mobile prefill, bureau payload building, background processing, CIBIL response, and FOIR with neutral eligibility language.
- Kept backend flow unchanged while making the UI suitable for agents/customers.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` passed.

## 2026-06-24 - Developer - Lender Policy Form Upgrade

Summary:

- Reworked the Add/Edit Lender modal into a visible policy setup form while keeping the same CRM design language.
- Split lender setup into Basic Information, Products & Coverage, Eligibility Policy Rules, and Commercials & Operations.
- Added minimum loan amount as a matching rule and surfaced policy context directly inside the form.
- Updated lender matching so minimum loan amount is enforced along with score, income, FOIR, tenure, max loan, product, and state rules.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` passed.

## 2026-06-24 - Developer - CRM Lender Policy Engine

Summary:

- Added a CRM lender policy store behind `/api/crm/lenders` so lender changes persist in the CRM backend.
- Kept the existing Lender Management UI shape while wiring list load and add/edit save to the backend.
- Added lender policy fields for minimum income and state coverage alongside existing score, FOIR, tenure, amount, ROI, and product rules.
- Updated CRM Eligibility Checker so matched lenders come from configured lender rules instead of hardcoded lenders.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` passed.

## 2026-06-23 - Developer - Two Mode CRM Eligibility Checker

Summary:

- Split CRM Eligibility Checker into two flows: mobile-only advanced bureau pull and full-details lender eligibility.
- Added mobile-only flow that runs Bureau Advanced / Mobile Prefill internally, builds the CIBIL payload, and then calls Bureau Standard.
- Updated full-details flow to accept first name, last name, mobile, DOB, PAN, address, pincode, state, and gender before calculating FOIR and matched lenders.
- Kept all CRM eligibility checks on eligibility credits with report history and wallet ledger deduction.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-06-23 - Developer - CRM Setup Credits And Tools Cleanup

Summary:

- Moved CRM eligibility credits out of the main navigation and into a new `/crm/setup` section.
- Added setup tabs for Eligibility Credits, Wallet Ledger, and Invoices so recharge, usage, and billing history live together.
- Extended the CRM eligibility backend store with credit transactions and invoice records.
- Cleaned the sidebar Tools group so it only contains Eligibility Checker and EMI Calculator.
- Added `/crm/emi-calculator` as the direct EMI route and kept old `/crm/tools` and `/crm/eligibility-credits` routes as redirects.

Verification:

- `npm run type-check -- --pretty false` passed.

## 2026-06-23 - Developer - DSA CRM Zip Integration And Eligibility Backend

Summary:

- Replaced the earlier custom `/crm` shell with the provided DSA CRM UI from `dsa_crm.zip`.
- Mounted the CRM under `/crm` with zip routes for dashboard, lead management, loan tracking, lender management, team management, tools, reports, eligibility check, eligibility reports, and eligibility credits.
- Kept the provided CRM UI structure intact while isolating its shared components under `src/crm`.
- Added `/api/crm/eligibility-check` backend with CRM eligibility credits, report persistence, and Bureau Standard API Hub integration.
- Wired Eligibility Check to call the backend and Eligibility Reports/Credits to read from the CRM store.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-06-02 - Developer - Prefill Payload Mapping Fix

Summary:

- Updated Bureau Advanced prefill mapping to support Gridlines responses shaped as `data.personal_data` as well as `data.data.personal_data`.
- Fixed PAN extraction from `document_data.pan[].value` and address extraction from `personal_data.address[]` for both admin testing and client Advanced API calls.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-06-02 - Developer - Admin Advanced Bureau Test Flow

Summary:

- Updated Admin API Hub testing for Bureau API Advanced so the admin test runs Mobile Prefill first, builds the Jaadugar CIBIL payload, then calls Bureau API Standard.
- The admin test response now returns the final CIBIL stage/result instead of stopping at the raw prefill response.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-31 - Developer - Bureau API Routing Guard

Summary:

- Routed generic `POST /api/v1/bureau` requests through the Bureau API Standard handler.
- Routed generic `POST /api/v1/bureau-advanced` requests through the Bureau API Advanced handler so clients receive the final CIBIL response instead of the raw prefill response.
- Added a guard so the Bureau Standard endpoint only accepts keys generated for the standard bureau product.
- Updated client docs so `/api/v1/bureau` and `/api/v1/bureau-advanced` are the primary handover endpoints.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-30 - Developer - Client Bureau API Documentation

Summary:

- Added a Docs tab in Admin API Hub with client-ready documentation for Bureau API Standard and Bureau API Advanced.
- Added copyable client endpoints, headers, payloads, cURL examples, response shapes, and field rules for the CreditTrust reseller flow.
- Added repo documentation files for Standard and Advanced so client handover material stays versioned with the portal.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-30 - Developer - Jaadugar Bureau Payload Contract

Summary:

- Switched Bureau API Standard to forward CreditTrust requests to the Jaadugar CIBIL master API using `firstName`, `lastName`, `dob`, `gender`, `pan`, `mobile`, `address`, `state`, and `pincode`.
- Updated Bureau API Advanced so Mobile Prefill runs first, then maps the best reported address, PAN, DOB, gender, and full state name into the same Jaadugar payload contract.
- Updated API Hub defaults and the parked client-portal plan so admin tests and future client docs use the new payload rules instead of old CIBIL code fields.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-28 - Developer - Simplified API Hub Reseller Flow

Summary:

- Replaced the overbuilt API Hub flow with a simple admin control panel for APIs, clients, API keys, credits, and usage.
- Added multi-API admin creation with quick API templates for Bureau, PAN, Aadhaar, and Name Fetch so future vendor APIs can be configured from the same section.
- Split Bureau into Standard and Advanced products: Standard accepts full CIBIL payloads, Advanced accepts mobile-first requests and runs Mobile Prefill before the Bureau hit.
- Added `consent: true` validation to Bureau Standard and Advanced so the final CIBIL request carries captured customer consent.
- Added a lightweight API Hub store that keeps the Jaadugar/master API token internal and exposes only CreditTrust-generated client keys.
- Updated `POST /api/v1/cibil/consumer-score` to validate a CreditTrust `x-api-key`, check client credits, call the configured master Bureau API, deduct per-hit credits on success, and log masked usage.
- Added `POST /api/v1/cibil/mobile-prefill` for Bureau API Advanced using the configured Gridlines Mobile Prefill API and the configured Bureau API Standard.
- Added standalone `Mobile Prefill API` as an independent API Hub product with `POST /api/v1/mobile-prefill`.
- Added generic `POST /api/v1/{apiCode}` reseller proxy for future APIs that do not need the Bureau-specific request validation route.
- Parked the separate client-facing API portal plan in `docs/tasks/api-client-portal-plan.md` for later work.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-26 - Developer - API Hub Control Plane MVP

Summary:

- Added API Hub database foundation for reseller clients, products, hashed API keys, wallets, transactions, usage logs, and gateway settings.
- Added admin `/admin-api-hub` section for onboarding clients, generating sandbox/live keys, adding demo credits or live balance, and reviewing usage.
- Added client-facing `POST /api/v1/cibil/consumer-score` endpoint with `x-api-key` auth, sandbox demo responses, live gateway pass-through, wallet deduction, and masked usage logging.
- Added API Hub to the admin sidebar and admin route guard.
- Refined the API Hub admin screen into a long-term product catalog model with `Control Panel` heading, `APIs` tab, `Bureau API` as the first active product, planned API placeholders, product-specific key generation, wallet section, and sandbox test console.
- Reworked API Hub around vendor/master API configuration first: Bureau API can store gateway endpoint, method, auth header, secret token, request template, and direct admin test response; client keys can then be generated against the configured API. Wallet/credits are no longer part of the active flow.

Verification:

- `npm run type-check -- --pretty false` passed.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.

## 2026-05-19 - Developer - Login Role Switch And Logout Fix

Summary:

- Fixed partner login opening the admin area when an admin session was already active.
- Fixed admin login opening the partner area when a partner session was already active.
- Strengthened logout to clear Supabase auth state, reset the browser client, remove persisted auth tokens, and refresh after redirect.
- Updated login submission handling so wrong-role credentials are signed out and kept on the intended login page.

Verification:

- `npm run type-check -- --pretty false` passed.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.

## 2026-05-19 - Developer - Real Bureau API Payload Scaffold

Summary:

- Prepared `/api/pull-bureau-real` to build and send the confirmed real CIBIL payload through configurable `BUREAU_API_URL`.
- Added `BUREAU_API_AUTH_TOKEN` support with configurable auth header name; current Fincooper API expects `token`.
- Kept demo partner behavior unchanged.
- Added safe live-response handling so wallet deduction and report persistence happen only after a successful JSON response with a valid score.
- Updated the real CIBIL task doc with endpoint test results, env configuration, and remaining provider confirmations.

Verification:

- `npm run type-check -- --pretty false` passed.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.

## 2026-05-14 - Developer - Credit Trust Favicon Update

Summary:

- Replaced the old browser favicon with Credit Trust mark-based favicon assets.
- Added SVG, 32x32 PNG, Apple touch icon, 512px icon, and refreshed `/favicon.ico` fallback.
- Updated app metadata to use the new favicon paths with cache-busting query strings.

Verification:

- Generated favicon preview was visually checked for centered Credit Trust mark framing.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.
- `npm run type-check -- --pretty false` passed.
- Committed and pushed to `main` (`b613d40`), deployed to Vercel production, and verified live HTML references the `?v=2` favicon assets with `/favicon.ico` and `/favicon.svg` returning HTTP 200.

## 2026-05-14 - Developer - Landing Nav Security Link Removal

Summary:

- Removed the unused `Security` button from the landing header navigation.
- Added payment-gateway compliance contact details to the landing footer, including company address and mobile number below the existing support email.
- Kept the underlying trust/security landing section unchanged for page content continuity.
- Noted the owner preference to keep markdown logs updated after future pulls and deploys.

Verification:

- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.
- `npm run type-check -- --pretty false` passed.
- Committed and pushed to `main` (`2c07241`), then deployed to Vercel production and verified `https://credittrust.in/` shows the footer address/mobile and no longer shows the `Security` nav link.

## 2026-05-13 - Developer - About Us Landing Page Update

Summary:

- Reworked `/about` with the provided CreditTrust company overview and mission copy.
- Kept the page aligned with the current dark landing website theme.
- Added `About Us` to the landing footer links while keeping it out of the header navigation.

Verification:

- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.
- `npm run type-check -- --pretty false` passed.
- Pushed to `main` to trigger the configured GitHub/Vercel deployment flow.

## 2026-05-12 - Developer - Customer Journey Form UI Compacting

Summary:

- Reduced oversized customer journey form containers, inputs, OTP field, buttons, and helper chips on `/get-my-report`.
- Added consistent compact input/select/textarea styling with subtle focus states.
- Tightened the mobile verification and details screens so the journey feels cleaner and more premium.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Local browser check confirmed the mobile, OTP, and details steps render with compact fields.

## 2026-05-12 - Developer - Footer Contact Cleanup

Summary:

- Removed the standalone Contact page route and Contact links from public navigation/footer areas.
- Added direct footer contact copy: `support@credittrust.in`.
- Removed unused footer social/web icon buttons.
- Added `Powered by Fincoopers Tech India Private Limited` to footer rights text.
- Replaced remaining Contact page CTAs with direct `mailto:support@credittrust.in` links.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Theme-Friendly Credit Trust Logo

Summary:

- Added separate Credit Trust logo variants for dark surfaces, light surfaces, and compact mark placements.
- Updated website/header/footer/login logo sizing to use a compact lockup without the tagline so it remains readable.
- Updated admin/partner sidebars to use the dark-surface logo when expanded and the compact mark when collapsed.
- Updated Supabase invoice branding migrations and live invoice settings to use the light-surface logo asset.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Live Supabase invoice settings were updated to `/assets/images/credit-trust-logo-light.svg`.

## 2026-05-12 - Developer - Credit Trust Rebrand

Summary:

- Replaced the portal brand name from Insight/InsightIQ to Credit Trust across public pages, partner/admin UI, policies, metadata, notifications, and invoice defaults.
- Added the provided Credit Trust logo asset and wired it into shared logo usage, landing header/footer, partner program, customer journey, login screens, and sidebars.
- Updated live invoice settings to use Credit Trust Financial Services and the new logo.
- Added a Supabase migration to keep invoice branding reproducible for future environments.

Verification:

- Brand scan no longer finds Insight/InsightIQ/CIBILysis/app_logo references in source, package files, public assets, or migrations except generic lowercase insight variables/labels.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Gateway Compliance Policy Pages

Summary:

- Added public policy pages for Privacy Policy, Refund and Cancellation Policy, Usage Policy, and Terms and Conditions.
- Reworked About Us into a compliance-oriented company overview focused on consent, data protection, partner responsibility, and misuse prevention.
- Added policy links to public footers and allowed policy routes through the auth guard.
- Strengthened consent language in Terms, Privacy, and Usage policies for financial health report generation and authorized provider processing.
- Updated policy and About pages to use the current dark landing website theme instead of the old public-page theme.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Admin System Blueprint

Summary:

- Added `ADMIN_SYSTEM_BLUEPRINT.md` as a full rebuild guide for cloning the portal admin into another system.
- Covered tech stack, auth, Supabase schema, RLS patterns, backend APIs, admin/partner/B2C pages, business flows, provider integration pattern, deployment checklist, and suggested build order.

Verification:

- Documentation-only change. File was created and read back successfully.

## 2026-05-12 - Developer - B2C Admin Tracking Foundation

Summary:

- Added Supabase tables for B2C report requests and B2C payments with full customer data, actual PAN, consent state, payment state, and report/API fields.
- Added admin APIs for B2C report requests and B2C payments.
- Added customer journey persistence hooks so mobile, details, consent, payment, and generated demo report states can be tracked.
- Added B2C Reports to the admin sidebar and built the admin B2C reports screen.
- Added B2C tabs to Admin Payments and Customer Master so partner data remains separate from B2C customer data.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Production Supabase migration was applied through SQL Editor.
- Live `/api/admin-b2c-reports` and `/api/admin-b2c-payments` return clean success responses.
- Live customer report request persistence was verified with a test mobile record.
- Cashfree and real report integration remain intentionally stubbed for the next phase.

## 2026-05-12 - Developer - Remove Early Payment Cues

Summary:

- Removed early price/payment hints from the customer report journey before the final payment step.
- Replaced "No price shown yet" and locked preview payment wording with privacy/value-focused language.

Verification:

- Removed early payment/price cues while keeping final payment step copy intact.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Customer Journey Public Route Fix

Summary:

- Added `/get-my-report` to the public route allowlist so the global auth guard does not redirect logged-in partners away from the customer journey.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - B2C Report Purchase Journey

Summary:

- Added a separate customer journey at `/get-my-report` for mobile OTP, value education, secure details, consent, final price reveal, demo payment, report preparation, and report view.
- Kept the price hidden until after OTP, benefits education, details, and consent.
- Added Cashfree-ready customer payment API stubs with demo fallback when Cashfree keys are not configured.
- Routed landing CTA buttons to the new customer journey.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Built `/get-my-report` initial HTML does not contain upfront `₹199` or payment copy.

## 2026-05-12 - Developer - Public Landing Content Cleanup

Summary:

- Cleaned public/landing-linked copy so the website positions Insight as financial health analysis, not bureau report pulling.
- Updated metadata, Partner Program wording, partner application terms/header, features page copy, and integrations page labels.
- Left partner portal, admin portal, APIs, and internal route/table names unchanged.

Verification:

- `rg -i "cibil|bureau|credit report|pull|pulls|pulled|credit bureau|bureau data|bureau report" src/components/landing src/app/page.tsx src/app/home/page.tsx src/app/partner-program/page.tsx src/app/become-a-partner/page.tsx src/app/features/page.tsx src/app/about/page.tsx src/app/contact/page.tsx src/app/layout.tsx src/app/integrations/page.tsx` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Partner Hero Report Visual

Summary:

- Replaced the Partner Program hero journey preview with a neutral professional report visual.
- Removed intake steps, client names, workflow statuses, and public-facing journey/counter messaging from the hero card.
- Added score summary, insight tags, analysis signal tiles, and report-module progress lines.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Partner Hero Workspace Preview

Summary:

- Replaced the Partner Program hero counter grid with a more credible client journey preview.
- Added intake flow chips, consumer/commercial analysis tiles, and sample client workflow rows.
- Removed demo-credit style messaging from the public B2B hero.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - B2C Home And Dedicated Partner Page

Summary:

- Repositioned the main `/` and `/home` landing page around a B2C customer journey for creating a personal financial health report.
- Removed the embedded Partner Program section from the home page and changed the nav to link to `/partner-program`.
- Updated hero, journey, report preview, trust, footer, and CTA copy around individual report creation, credit score understanding, loan readiness, repayment insights, and improvement actions.
- Rebuilt `/partner-program` as a dedicated B2B page using the same dark landing theme, font scale, glass cards, teal/accent styling, and existing partner content.

Verification:

- `rg "CIBIL|Cibil|cibil|CibilCheck|cibilcheck" src/components/landing src/app/page.tsx src/app/home/page.tsx src/app/partner-program/page.tsx` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Matched Partner Program Landing Section

Summary:

- Added a new `PartnerProgramSection` to the public landing page.
- Reused old partner-program content themes: DSA/CA/advisor audience, Consumer Data, Commercial Data, Bulk Analysis, onboarding steps, and partner differentiators.
- Matched the new landing design system with dark background, glass cards, teal/accent colors, scoped animations, and existing CTA button styles.
- Added a `Partner Program` anchor in the public landing nav.

Verification:

- `rg "CIBIL|Cibil|cibil|CibilCheck|cibilcheck|Admin|/admin|emoji|ð" src/components/landing src/app/page.tsx src/app/home/page.tsx` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-11 - Developer - Hide Public Admin Landing Links

Summary:

- Removed visible Admin/Admin Login links from the public landing header, mobile menu, footer, and CTA section.
- Kept the `/admin` route unchanged so direct admin access still works.

Verification:

- `rg "Admin|/admin" src/components/landing src/app/page.tsx src/app/home/page.tsx` returned no matches.
- `rg "CIBIL|Cibil|cibil|CibilCheck|cibilcheck" src` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-11 - Developer - Landing Hero Visibility Hotfix

Summary:

- Restored missing landing animation keyframes used by the imported hero section.
- Fixed the hero content staying invisible because animated elements were stuck at `opacity-0`.
- Restored orbit and scroll hint animations for the landing hero visual.

Verification:

- Live HTML already contained hero copy; issue was CSS animation visibility.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed after build regenerated `.next/types`.

## 2026-05-11 - Developer - Landing Page Replacement

Summary:

- Replaced the public `/` and `/home` landing experience with the design adapted from `PORTAL-LANDING-PAGE`.
- Preserved portal controls for `Partner Login`, `Admin Login`, and `Become Partner`.
- Removed the source landing form and its separate Supabase submission/storage behavior.
- Sanitized user-facing copy to avoid CIBIL wording and use credit health / financial analysis language.
- Added landing-specific components and scoped landing styles so admin/partner screens remain isolated.

Verification:

- `rg "CIBIL|Cibil|cibil|CibilCheck|cibilcheck" src` returned no matches.
- Local HTTP checks for `/` and `/home` returned 200 and confirmed `InsightIQ`, `Partner Login`, and `Start Financial Analysis` render with no CIBIL text.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed after build regenerated `.next/types`.

## 2026-05-10 - Developer - Demo Partner Seed Migration

Summary:

- Added Supabase migration to seed the demo partner account `user@demo.in`.
- Demo seed creates/updates auth user, user profile, partner row, wallet balance, partner commercials, and signed demo agreement.
- This makes the demo account reproducible from the repo for fresh environments.

Verification:

- Migration file added. Existing DB already has the demo account; apply migration only where demo seed is needed.

## 2026-06-25 - Developer - Harden File Process Workflow

Summary:

- Added persisted file status history, notes, follow-up date, rejection reason, and lender trail fields.
- Added CRM backend actions for adding file notes, updating follow-up dates, and saving status movements with history.
- Added File Process table follow-up visibility.
- Added File Process detail activity tab with status history, notes, and lender trail.
- Added detail-panel controls for follow-up date, quick notes, mark submitted, and reject with reason.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Open Lender Details From Button

Summary:

- Removed the always-visible lender details section below the Lender Selection table.
- Made lender details open only from the row `Select Lender` button.
- Moved lender options into a modal so the file table remains the primary screen.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Reshape Lender Selection And File Process

Summary:

- Changed Lender Selection to a table-first workflow for eligibility-checked files.
- Kept lender options below the selected file and allowed switching to another lender.
- Renamed Loan Applications navigation and page title to File Process.
- Added Case Sent status and wired status dropdown updates to the CRM backend.
- Added Change Lender action from File Process back to Lender Selection for the same lead.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Make Application Status Pills Clickable

Summary:

- Converted Loan Application Tracking status summary pills into quick filters.
- Added active visual state for selected pill filters.
- Synced the status dropdown with quick filter selections, including an In Progress filter.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Add Lender Selection Demo Leads

Summary:

- Expanded the CRM demo eligibility seed to create three fresh checked leads.
- Added home loan, personal loan, and business loan demo reports with lender matches.
- Reset demo applications during seed so the lender selection flow can be tested repeatedly.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Link Lender Selection To Application View

Summary:

- Added a `View Application` CTA after creating a loan application from Lender Selection.
- Passed the created application id into Loan Application Tracking through the URL.
- Auto-opened and filtered the created application in Loan Application Tracking.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Separate Lender Selection Workflow

Summary:

- Kept Eligibility Checker focused on running eligibility checks and saving bureau reports.
- Removed direct lender submission actions from Eligibility Checker and Eligibility Reports.
- Added a dedicated CRM Lender Selection module for eligibility-checked leads with matched lender options.
- Wired Lender Selection to create loan applications through the existing lender submission action.
- Added Lender Selection to the CRM sidebar.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Clarify Send To Lender Flow

Summary:

- Added clear success feedback after a checked lead is sent to a lender.
- Added a `Sent` badge for leads already submitted to lender queue.
- Made the demo lender eligibility seed reset prior demo applications so the `Send to Lender` action can be tested repeatedly.
- Prevented duplicate lender applications for the same lead and lender.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-05-10 - Coordinator - Agent Operating System

Summary:

- Added `AGENTS.md` with five role definitions: Auditor, Project Manager, Developer, Coordinator, and Personal Assistant.
- Added `WORKLOG.md` so agents can track meaningful changes.
- Added task docs structure under `docs/tasks/`.

Verification:

- Documentation-only change. No build required.

## 2026-05-09 - Developer - Encrypted Environment Bundle

Summary:

- Added `.env.enc` for portable encrypted environment setup.
- Added `scripts/decrypt-env.ps1` for local `.env` creation.

Verification:

- Decrypt test passed by comparing SHA-256 hash of decrypted output with local `.env`.

## 2026-05-09 - Developer - Partner Agreement Consent Flow

Summary:

- Added partner agreement table migration.
- Added admin agreement upload/list/status APIs.
- Added partner agreement fetch/sign APIs.
- Added partner `/agreement` page.
- Updated admin agreement UI.
- Updated route protection to block partner portal access until agreement is signed.
- Fixed auth loading edge case in `AuthContext`.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

# 2026-09-12 - Lender intelligence ownership foundation

- Audited the existing CRM lender policy, eligibility matching, lender selection, file process, admin intelligence, finance, and database flows.
- Added the end-to-end lender intelligence product plan at `docs/tasks/lender-intelligence-product-plan.md`.
- Hardened lender submission so it requires `file_process` permission.
- Added server-side validation that the selected lender exists in the lead's saved eligibility matches and is still active.
- Added an additive Lender Intelligence foundation migration covering lender onboarding, product programs, versioned credit policy/rules/documents, decision snapshots, application stage events, outcomes, commercial versions, reconciliation, and data-quality operations.
- Added an admin-only lender catalog and policy governance API with lender/program upserts, immutable policy version creation, draft rule replacement, review submission, and maker-checker publishing.
- Made policy publication atomic in Postgres so retiring the old policy and activating the reviewed version cannot partially succeed.
- Added the admin Lender Onboarding workspace for creating lenders, product programs, sourced policy drafts, and monitoring onboarding/policy status.
- Added a deterministic, explainable lender-policy engine supporting hard, soft, and warning rules; missing-input outcomes; reason traces; fit scoring; and stable ranking.
- Integrated published lender-program policies into live CRM eligibility routing with legacy fallback and immutable decision snapshots.
- Made lender selection aware of the new program/lender identities and linked the selected program, rank, application, actor, and timestamp back to the routing decision.
- Added immutable application stage events and structured sanction, rejection, and disbursal outcome capture for lender funnel and TAT analytics.
- Added commercial payout calculation for flat, percentage, and slab terms; disbursal now creates an invoice-ready reconciliation item from the active commercial version.
- Added lender operations APIs for commercial draft/review/activation, atomic invoice creation from reconciliation items, invoice raising, and payment allocation.
- Replaced the lender compliance placeholder with an operational finance workspace for commercials, reconciliation selection, lender invoice creation/raising, and settlement.
- Completed the admin policy workflow UI with rule authoring, draft submission, and checker-only publication actions.
- Upgraded lender performance analytics with terminal-outcome rates, routing overrides, policy freshness, TAT median/P75/P90, payout exposure, and data-quality KPIs.
- Added the Lender Intelligence operations guide and updated the project handoff with rollout order, lifecycle controls, verification gates, and current production limitations.
- Made policy rule replacement atomic so a rejected batch cannot delete the existing draft rule set.
- Added controlled routing overrides: non-rank-1 selection requires an operational reason and persists override type, code, note, rank, actor, and timestamp.
- Added append-only lender intelligence audit logs and instrumented lender/program/policy governance mutations with actor and sanitized metadata.
- Enforced database-level audit immutability and exposed recent lender governance history in the admin onboarding workspace.
- Added private lender policy/compliance document upload with type/size validation, SHA-256 checksums, short-lived signed access, cleanup on failed metadata writes, and audit logging.
- Added compliance evidence upload and private signed-document access UI with lender/program/policy linkage, expiry, checksum, and document register.
- Added governed lender onboarding transitions and enforced verified KYC plus signed, unexpired agreement before lender activation.
- Added partner-scoped lender routing exception records and API access to full explainable results plus controlled exception requests for near-match, excluded, and missing-data programs.
- Added admin exception queue data and independent approve/reject controls that block self-approval and inactive/paused program approvals.
- Enforced one-time approved exceptions for non-eligible lender submission and consume the exception only after successful application creation.
- Persisted exception reason evidence into the routing decision and added a database uniqueness guard against duplicate lead/lender applications.
- Added DSA-facing explainable manual-review results, exception request status, and approved-exception submission controls, including leads with zero direct matches.
- Added admin exception review queue with approve/reject notes and visible lender, program, policy match state, and request reason.
- Added partner exception-request audit events without exposing customer or bureau payload data.
- Added canonical, partner-extensible lender rejection taxonomy and enforced structured rejection code plus detail for terminal rejection outcomes.
- Replaced free-text rejection prompt with a canonical reason selector plus mandatory lender detail in File Process UI.
- Added automated lender readiness/compliance scans and an admin issue board for invalid active lenders, missing published policies, overdue policy reviews, and expiring documents.
- Added lender pause/offboarding with active-file safeguards, automatic program pausing/retirement, program capacity controls, policy-gated activation, and configurable login/sanction/disbursal SLAs.
- Extended automated compliance scans to create application-level lender TAT breach issues from immutable stage-event timestamps and program SLAs.
- Added reconciliation dispute, paid-resolution, and controlled write-off workflows with amount validation, variance reasons, invoice dispute propagation, and audit events.
- Closed the lender-switch lifecycle gap: changing lenders now requires a reason, marks the prior active application as `rerouted`, preserves status/lender histories and immutable stage events, and creates a distinct application for the new lender.
- Added zero-dependency lender policy regression tests for operator boundaries, missing-input safety, hard/soft/warning outcomes, product filtering, deterministic ranking, and rank assignment.
- Corrected application uniqueness to allow historical rejected/rerouted/disbursed attempts while still preventing duplicate active lead+lender files.
- Made lender rerouting transactional in PostgreSQL: closing the prior file, creating the target-lender file, and writing both stage events now succeed or roll back together.
- Added automated commercial payout regression coverage for flat, percentage, slab-boundary, open-ended, rounding, unsupported, and negative-input cases.
- Added preview-first bulk lender/program import with normalized validation, duplicate/range/SLA checks, a 500-row limit, active-program overwrite protection, atomic database commit, audit evidence, and an admin import workspace.
- Added governed policy restoration: a retired version is cloned atomically into a new immutable draft with copied rules and source evidence, then must pass the normal independent maker-checker publication flow.
- Added independent checker policy rejection with mandatory evidence and audit history, plus a default 90-day review SLA enforced before publication.
- Added deduplicated lender login-warning and stage-SLA-breach notifications routed to the originating operations user, backed by the existing notification center.
- Added a CRON_SECRET-protected hourly lender readiness/SLA scan endpoint and Vercel Cron schedule.
- Replaced capped in-memory headline rates with a database KPI snapshot covering a 90-day sent cohort, 30-day disbursal maturity, terminal-only approval/rejection denominators, pending separation, complete-report match rate, active-program policy freshness, and TAT percentiles.
- Added minimum sample-size suppression (n=20), numerator/denominator evidence, cohort timestamps, maturity disclosure, and removed stale prototype messaging from the performance UI.
- Added database-aggregated lender, program, product, and partner KPI breakdowns with the same cohort/maturity/sample contracts, dimension-level TAT, pending counts, and links to up to 100 source applications per row.
- Hardened invoice settlement with immutable payment entries, caller-supplied idempotency keys, strict overpayment/state validation, and adjustment-aware outstanding balances.
- Made disputed reconciliation resolution atomic and added an immutable adjustment ledger so linked write-offs update invoice accounting in the same transaction.
- Exposed payment and adjustment audit trails in the lender finance workspace and prevented direct paid resolution for invoice-linked items.
- Added commercial maker submission evidence, independent checker rejection with mandatory reason, and atomic database transitions.
- Applied commercial GST/reverse-charge terms to disbursal reconciliation and invoice totals, with regression coverage.
- Closed a commercial tenant-isolation gap by enforcing partner-specific lookup with global-only fallback during payout generation.
- Added contract-driven post-disbursal clawbacks with full/percentage/fixed calculation, configurable windows, immutable source evidence, single-step recovery/waiver resolution, audit events, and finance UI register.
- Fixed a migration-blocking duplicate policy-column declaration discovered during completion audit and added permanent schema-integrity regression tests.
- Enforced one current active commercial per partner/lender/program scope and deterministic newest-effective policy selection.
- Added a canonical forward-only lender application stage matrix, terminal-state immutability, and mandatory positive sanction/disbursal amount validation with regression coverage.
- Made normal lender application transitions transactional: locked CRM status/history, stage event, terminal outcome, commercial payout, GST, and reconciliation now commit or roll back together, with stale-write protection.
- Aligned File Process UI with the governed stage matrix: invalid/backward options are hidden, terminal quick actions are disabled, and sanction/disbursal amounts plus rejection evidence are collected before mutation.
- Closed finance lifecycle dead-ends with atomic invoice-dispute restoration and reasoned cancellation of unpaid invoices, including safe reconciliation-item release and audit logging.
- Added governed compliance issue claim/resolve/risk-accept/reopen actions, complete admin UI history, and fixed hourly scans so active ownership and accepted-risk evidence are not erased.
- Added a shared policy-field taxonomy with type-compatible operators, comparison/evidence validation, governed editor controls, API rejection, and database publish guards so unavailable or malformed inputs cannot become live policy.
- Enforced lender program master guardrails (amount, tenure, employment, channel, state, and city) inside the explainable ranking engine and added the missing full-eligibility loan/income inputs required to evaluate them.
- Expanded the admin product-program form to configure amount/tenure/ROI bands plus employment, channel, state, and city serviceability, with server-side malformed, negative, integer-tenure, and inverted-range validation.
- Hardened private lender-document handling: upload now rejects cross-lender program/policy references, and every signed URL grant requires an immutable access-audit event before the URL is returned.
- Added independent private-document review: pending evidence can be verified or rejected once, uploaders cannot self-review, rejection requires evidence, and every decision is audited.
- Bound document-sourced policy publication to a current, independently verified, checksum-matched document at both review submission and transactional database publication gates.
- Added explainable operational-capacity ranking: paused programs remain excluded, while limited programs stay eligible with a visible 15-point ranking penalty behind equivalent open-capacity programs.
- Closed commercial payout configuration gaps with lender/program ownership validation, strict flat/percentage/slab validation, overlap/open-ended slab checks, and a working JSON slab editor in the finance workspace.
- Mirrored commercial payout validation in PostgreSQL with an immutable slab validator and table constraint, preventing malformed terms from entering the ledger through API bypass or future service-role integrations.
- Made invoice creation concurrency-safe by deterministically locking every source reconciliation row before partner/lender/status validation and aggregation, preventing duplicate invoices from simultaneous finance actions.
- Added a governed custom-commercial payout workflow: finance must record a positive approved amount plus evidence, GST is calculated transactionally, the item then becomes invoice-ready, and zero-value invoices are blocked in PostgreSQL.
- Governed invoice aging and issuance: creation requires a future due date with a 15-day default, the finance register displays it, and raising now uses a locked RPC that revalidates invoice value and linked reconciliation evidence.
- Added overdue collections controls to the hourly compliance scan: open-balance invoices create governed issues, escalate to critical after 30 days, notify their owner once, and display an overdue warning in finance.
- Completed partial-payment operations: finance can enter any valid amount up to the net outstanding balance, UTR-derived keys make retries idempotent, and API/database validation bounds references and rejects sub-paise precision.
- Added a secured lender-invoice PDF artifact with source application lines, tax/payment/adjustment/outstanding totals, admin-only audited access, no-store delivery, finance download control, automated contract tests, and visual A4 render verification.
- Replaced random lender invoice identifiers with a private, atomic fiscal-year sequence (`LND26-27-000001`), allocated in the invoice transaction for concurrency safety and rollback consistency.
- Closed onboarding activation bypasses: program upsert is draft-only and cannot move records between lenders, while PostgreSQL triggers enforce lender KYC/agreement readiness and active-program lender/published-policy readiness for every write path.
- Made initial lender selection transactional: locked decision evidence, current lender/program state, rank, application creation, decision binding, first stage event, and approved-exception consumption now commit or roll back as one database operation.
- Made persisted lender rerouting fully governed and atomic: it now preserves the original routing decision, clones immutable engine evidence into a new application-bound decision, revalidates rank/current lender-program state, and consumes an exact approved exception in the same transaction.
- Closed the direct-RPC outcome-quality bypass: application progression now requires a bound lender/program routing decision, and rejection codes are resolved against the active partner/global canonical taxonomy inside PostgreSQL before stage and outcome records are written.
- Replaced proportional reconciliation rewrites with an immutable incremental payment-allocation ledger. Every receipt now locks invoice lines in stable order, allocates exact paise, updates only funded rows, and aborts atomically if any amount cannot be allocated.
- Extended audited invoice HTML/PDF evidence with exact payment-reference-to-reconciliation-line allocations and included allocation counts in the artifact access audit metadata.
- Enforced evidence immutability in PostgreSQL: stage events, outcomes, payment/allocation/adjustment ledgers, and audit logs are append-only; routing decisions allow only one controlled application binding while preserving engine/input/result evidence.
- Added database structural-freeze guards for credit policy and commercial versions. Rules/economics are draft-only editable, reviewed history cannot be deleted, and only the documented maker-checker lifecycle transitions remain legal.
- Closed operating dependency gaps: immediate policy/commercial activation cannot be future-dated, active programs must retain a current published policy at transaction commit, and active programs must be shut down before their lender is paused/offboarded.
- Bound selection/rerouting to the exact currently effective policy version in the immutable snapshot and added database-governed exception requests: snapshot identity validation, frozen request evidence, independent review, live readiness recheck, and one-time consumption.
- Added canonical insert guards for stage and outcome evidence: partner/application/status binding, exact routed lender/program identity, continuous monotonic event chains, bounded timestamps, matching terminal events, positive amounts, and canonical rejection evidence.
- Closed the missing-commercial blind spot: every disbursal now materializes a reconciliation row, zero-value/non-calculable terms carry explicit evidence, and readiness scans raise critical missing-coverage or warning manual-valuation issues.
- Added database economic-proof validation for reconciliation inserts: matching disbursal source, exact lender/program and partner scope, historical commercial coverage, recalculated flat/percentage/slab payout, GST, and zero-value missing-coverage state.
- Enforced finance-ledger conservation: allocations must join receipt and line on one invoice, cannot exceed either balance, every receipt must be fully allocated at commit, and reconciliation source/received amounts are protected against direct mutation.
- Added the reconciliation database state machine with exact invoice attach/release rules, immutable attached line values, monotonic bounded receipts, evidence-backed paid/part-paid states, and dispute-only write-off transitions.
- Added an invoice header state machine tied to immutable payment/adjustment ledger sums, frozen source totals and due date, evidence-backed settlement/cancellation, and preserved invoice dispute status while any other line remains disputed.
- Bounded persisted routing evidence at the database boundary (1 MB input, 2 MB/500 results) and constrained application transitions to 1 MB history, bounded text, finite/ranged economics, realistic tenure, and non-future/non-predating event timestamps; the API mirrors the economic/text checks for fast feedback.
- Added privacy-safe similar-profile performance: immutable application-bound routing inputs are grouped into fixed score, income, loan-size, and employment bands, joined to canonical outcomes/overrides, sample-suppressed, and shown in the performance workspace as descriptive evidence with an explicit deterministic-routing fallback.
- Added governed compliance exports: admins can download audit or data-quality registers through a 90-day/5,000-row bounded no-store route; optional partner scope is validated, CSV formula injection is neutralized, and immutable export audit evidence must commit before the file is released.
- Closed post-activation compliance drift in routing: recommendations, initial selection, and rerouting now independently require verified KYC, a signed agreement, and a still-current agreement expiry, so an expired lender cannot receive a new file while still carrying an active operating label.
- Time-bounded routing exceptions: approval now rechecks KYC, signed/current agreement, live program capacity, and exact policy evidence; selection/rerouting accept approvals for 24 hours only, and a replacement request atomically expires the stale authorization with audit metadata.
- Minimized compliance PII: system TAT findings now identify only the application, and CSV exports omit free-text issue/resolution narratives while preserving structured entity IDs, taxonomy, status, ownership, and timestamps.
- Hardened the two application-creation transactions: selection and reroute now verify canonical actors; bound 1 MB object payloads, array histories, text lengths, amount precision/range, lead lineage, and event time; ignore client-created timestamps; and append their Lender Intelligence audit evidence atomically with routing/application/stage/exception state.
- Completed lender billing identity from onboarding to invoice: finance email, registered billing address, and GSTIN are normalized and validated in the lender-master RPC, mandatory for activation/new routing, editable from onboarding, and rendered in audited invoice artifacts; plaintext bank credentials remain out of scope by design.
- Made invoice artifacts historically reproducible by freezing issuer and recipient legal, tax, address, and contact identity at invoice creation. Both snapshots are database-immutable, and PDF rendering uses the frozen evidence while retaining live joins only for legacy invoices.
- Replaced the CRM eligibility UI's hard-coded consent assertion with an explicit operator checkbox. New reports persist immutable consent time, purpose, notice version, source, and authenticated actor; database checks now reject recommendation registration, initial lender selection, and rerouting when consent evidence is absent.
- Added the governed consent-withdrawal lifecycle: CRM operators record a meaningful withdrawal reason, a private actor-bound RPC locks the report and appends immutable withdrawal plus audit evidence, and every recommendation/selection/reroute boundary rejects withdrawn reports while retaining their historical record.
- Upgraded lender capacity from a manual label to a quantitative operating control: programs can carry an optional IST-day submission cap, recommendation exposes exhaustion as a hard reason, selection/reroute use a shared advisory lock and event recount to prevent concurrent overshoot, and admins change caps only through a reasoned audited RPC.
- Removed the capacity recommender's raw event-row counting ceiling by adding a bounded authenticated PostgreSQL aggregate that returns exact used, remaining, and exhausted values for up to 500 programs. Routing consumes this snapshot and the admin register surfaces live usage, including volumes above the Supabase 1,000-row response default.
- Closed invoice-direction injection: lender payout reconciliation now creates only server-derived receivable invoices, PostgreSQL rejects payable relabeling, and the UI no longer submits a direction. Documented partner commission as a separate governed payable ledger pending its reviewed business terms instead of fabricating it from lender receivable evidence.
- Closed the legacy CRM application evidence bypass: once routing/stage/outcome/reconciliation evidence exists, PostgreSQL blocks deletion, freezes partner/lead/customer/lender/product/amount/provenance, and permits lifecycle/history/rejection changes only from the atomic reroute or transition workflows via a transaction-local guard.
- Added the independent partner-commission payable system: versioned source-backed terms, maker-checker activation, lender/program specificity, disbursal-triggered payable materialization, immutable tax/TDS/terms snapshots, and idempotent partial/final payment evidence. Added admin contract review and payable controls without reusing lender receivable invoices.
- Completed partner-payable operations with audited active-contract termination, locked hold/dispute/release/write-off transitions, admin controls, and overdue compliance scanning with 30-day severity escalation and accepted-risk preservation.
- Strengthened the read-only live rollout gate with a database schema-health manifest: it now fails closed on missing critical relations/functions, triggers attached to the wrong table, missing RLS, unsafe API-role DML privileges, or absent partner payable response contracts.
- Added versioned partner payout-beneficiary governance: maker-checker verification, legal/GST/contact evidence, masked PAN and bank-account identity, IFSC and provider beneficiary reference. Commission activation now requires a verified profile, and every payable freezes that exact beneficiary version without storing full PAN/account credentials.
- Closed the outbound-payment single-admin gap: partner settlements now begin as immutable payment requests with amount, UTR/reference, idempotency key, and instruction evidence; a different admin must approve/reject, approval rechecks the locked balance, and only the internal atomic workflow can create payment evidence.
- Added audited, bounded partner payable and payment-approval CSV registers for finance reconciliation. Exports preserve structured source/amount/masked-beneficiary evidence while omitting borrower names, narrative notes, and full financial credentials and neutralizing spreadsheet formulas.
- Added a least-privilege GitHub Actions quality gate for all Lender Intelligence pull requests and matching `main` pushes. It performs a clean locked Node 22 install, the dedicated Lender Intelligence suite, TypeScript validation, and a production build using non-secret placeholder configuration; a contract test prevents silent weakening of the workflow. The repository runtime is explicitly `>=22.6.0 <25`, matching the test runner's TypeScript-stripping requirement.
- Added a dedicated partner-commission recovery subledger: claims are capped by commission cash paid, source payable rows are locked, canonical triggers and evidence are mandatory, and a different admin must record dispute, collection reference, or waiver. Added finance UI/API controls, schema-health coverage, immutable audit evidence, and a bounded PII-minimized recovery CSV export.
- Added fail-closed, purpose-specific Lender Intelligence admin capabilities in server-owned Supabase app metadata. Catalog/policy, routing review, finance read/write, and compliance read/write routes now enforce distinct grants after base admin authentication; client-editable user metadata is ignored, and existing admins are explicitly bootstrapped as super-admins by migration.
- Closed an inherited admin privilege-escalation path: the shared server authorization helper no longer accepts client-editable `user_metadata.role`. Admin authority now requires trusted auth `app_metadata` or the database-owned user profile, and LI super-admin bootstrap likewise ignores self-asserted metadata.
- Aligned CI and repository engines on Node `>=22.6.0 <25`, which is required by the TypeScript-stripping test suite. Upgraded Next.js to 15.5.25 and remediated the full npm advisory tree, including the critical Next.js and high PostCSS/sharp chains; `npm audit` now reports zero vulnerabilities and CI rejects future low-or-higher advisories.
- Proved CI parity under Node 22.23.2: all 154 Lender Intelligence tests, TypeScript, and the production build pass on the workflow runtime. Expanded workflow path filters to include operations/planning/audit handoff docs plus environment and Vercel configuration, so changes to claimed rollout controls cannot bypass the gate.
- Added an offline PostgreSQL-parser gate for the complete Lender Intelligence migration. All 485 top-level statements parse successfully; CI now rejects malformed or unexpectedly truncated migration SQL while documentation correctly retains live Supabase execution as the PL/pgSQL/runtime proof.
- Added isolated embedded-PostgreSQL migration execution to CI, compiling all SQL/PL/pgSQL, triggers, grants, and schema-health checks against prerequisite CreditTrust tables. It exposed and fixed two genuine launch blockers: ambiguous/unbalanced reconciliation validation control flow and a schema manifest expecting nonexistent `select_lender_application` instead of governed `commit_lender_selection`. The complete migration now executes and reports schema health ready.
- Extended embedded migration verification with database behavior: trusted app/profile admins receive explicit LI capability bootstrap, fabricated actors are rejected, governed lender creation forces draft/pending defaults and atomically emits one audit event, and the service role cannot bypass the workflow with direct lender DML. Contract tests prevent silently skipping statements or weakening these smoke assertions.
- Added an actual policy-governance database journey to the embedded gate: governed program creation, source-bound policy draft, structured rule replacement, maker submission, explicit same-maker publish denial, and successful publication by a second trusted admin. This verifies the central maker-checker path beyond source-pattern assertions.
- Extended the embedded journey through compliance-ready lender/program activation, explicit consent evidence, rejection of routing without consent, immutable explainable decision registration, atomic rank-1 application selection with exactly one initial stage event, and rejection of direct governed-application lifecycle mutation.
- Extended the executable database journey through independently approved percentage commercials, sanction, disbursal, automatic payout/GST reconciliation, receivable invoice creation/raising, exact payment allocation, full settlement, and replay-safe receipt idempotency. This uncovered and fixed three launch-blocking PostgreSQL defects: nullable stage events were incorrectly deduplicated, the reconciliation upsert could not infer its partial unique index, and the shared deferred conservation trigger accessed a field absent from payment rows.
- Corrected export least privilege: audit/compliance CSV datasets require `compliance.read`, while partner payable, payment-request, and recovery ledgers require `finance.read`; a compliance-only operator can no longer export finance settlement evidence.
- Fixed partner commission materialization to use the canonical disbursal timestamp rather than the intentionally null decision timestamp on disbursed outcomes. Extended embedded PostgreSQL verification through masked beneficiary maker-checker approval, partner commission activation, automatic tax/TDS/net-payable creation, same-maker payment denial, and independent full settlement.
- Extended the executable controlled case through post-settlement recoveries: full-basis lender clawback calculation and collection, partner-recovery rejection above cash actually paid, and maker-checker partner recovery collection with immutable reference evidence.
- Extended embedded verification through compliance close-out: private expiring-document registration, actor-bound readiness scan, issue materialization, claim ownership, repeat-scan ownership preservation, risk acceptance, and repeat-scan preservation of resolution evidence.
- Extended the read-only production rollout verifier with an optional fail-closed four-account permission matrix. It now proves real restricted, catalog-read, finance-read, and compliance-read allow/deny boundaries, validates partner recovery presence in the operations contract, and retains backward-compatible super-admin smoke verification.
- Added bounded, audited lender reconciliation and invoice CSV registers to the finance workspace. They expose source/outcome/commercial/invoice identities, disbursal and exact expected/tax/invoiced/received/open amounts, settlement status and references without borrower names or narrative notes; export audits now use the correct invoicing, partner-commission, or compliance module by dataset.
- Hardened File Process operational integrity: API failures no longer masquerade as an empty portfolio, loading/empty/unavailable states are distinct with a retry action, live state never falls back to demo applications, and **New File** now starts the governed eligibility journey instead of being an inert control.
- Added a second executable database case for canonical rejection: fabricated taxonomy codes fail atomically, a valid global reason produces exactly one matching stage event and immutable rejection outcome, application/outcome reason evidence agrees, and direct outcome mutation is rejected.
- Removed the obsolete hard-coded borrower-like demo portfolio from the production File Process component. A regression contract now requires complete absence of the mock identifiers/names/lenders while retaining authoritative live API state and explicit loading/error handling.
- Made demo eligibility seeding categorically unavailable when `NODE_ENV=production`, even if its development opt-in flag is accidentally enabled. The denial occurs before database client/store access, preventing sample borrower and lender/rate data from contaminating production evidence.
- Strengthened embedded privilege verification under the actual `service_role`: governed schema-health and actor-bound compliance RPCs execute, while direct lender creation, application-stage insertion, reconciliation rewrite, forged audit insertion, and partner-payable rewrite are all denied at the PostgreSQL privilege boundary.

# Lender master workflow hardening

- Replaced API-side lender-master upserts with a private, row-locking database workflow.
- Forced every new lender into draft/pending onboarding state and added bounded identity, contact, and metadata validation.
- Revoked direct lender-master writes from API roles while retaining read access and governed lifecycle operations.
- Moved lender-program content writes to a private draft-only, row-locking workflow with tenant, range, SLA, audience-list, and metadata validation; direct program DML is now revoked.
- Serialized policy version allocation under a program lock, prohibited competing draft/review branches, moved submission into an evidence-revalidating RPC, and revoked direct policy-version/rule writes from service clients.
- Moved commercial draft creation into a serialized private workflow with tenant/program ownership, payout, tax, clawback, source, and parallel-draft validation; revoked direct commercial-ledger DML.
- Removed stale application-stage, outcome, reconciliation, routing-decision, and exception direct-write fallbacks; normalized evidence now moves only through atomic RPCs, with duplicate same-lender selection returning idempotently.
- Added a governed rejection-taxonomy registry with immutable code/tenant identity, bounded labels/categories, non-destructive deactivation, protected global fallback, audit logging, and revoked direct DML.
- Added the admin rejection-taxonomy register/editor for global and partner-scoped reasons, including ordering, descriptions, stable identity, and non-destructive activation controls.
- Added locked active-commercial termination with mandatory evidence, effective-window closure, audit logging, API action, and finance-workspace control.
- Added governed published-policy retirement with policy/program row locks, mandatory evidence, effective-window closure, active-program protection, audit logging, and UI control.
- Added evidence-based policy/commercial draft discard workflows and UI actions, preventing abandoned drafts from permanently blocking new versions while preserving history.

# Lender Intelligence production configuration hardening

- Pinned Next.js output tracing to the BUREAU-PORTAL application root so an adjacent parent lockfile cannot alter deployment tracing.
- Disabled production browser source maps and removed the build-time TypeScript bypass; production builds now fail closed on type errors.
- Browser runtime check confirmed the protected admin route renders the administrator login redirect without an error overlay, and all four unauthenticated Lender Intelligence API surfaces return structured HTTP 401 responses.
- Added locked configuration regressions; 171/171 Lender Intelligence tests and the production build pass.
- Enforced private `no-store`, `Pragma: no-cache`, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff` headers for protected Lender Intelligence pages, admin APIs, and CRM routing responses. Runtime header checks passed on all five surfaces; 172/172 tests pass.
- Removed staff email and free-text summary from the audit CSV. Stable actor UUID, module, action, entity, and timestamp remain sufficient for attribution while the export metadata can truthfully state that PII/free text is excluded; 173/173 tests pass.
- Replaced the scheduler's two independent scan transactions with one advisory-locked `run_lender_compliance_scan` database workflow. Readiness and partner-payable changes now commit atomically, and successful executions retain durable component counts/timestamps in a service-read-only run register. Embedded PostgreSQL executes and verifies the real wrapper; 174/174 tests pass.
- Added a dedicated `compliance.read` API and `/admin-lender-intelligence/compliance` workspace so a narrowly scoped compliance operator can inspect issue custody, private document metadata/access, minimized audit evidence, and the latest 50 scheduled scan runs without catalog or finance permissions. The live rollout verifier now proves this allow/deny boundary; 176/176 tests, type-check, and the 172-page production build pass.
- Completed the compliance evidence UI contract: all returned scan runs and minimized audit rows now render in bounded scrollable registers, finance/compliance navigation is separated, and the compliance workspace is directly reachable from both the global admin sidebar and LI navigation. 177/177 tests, type-check, and the production build pass.
- Fixed private-document viewing in both onboarding and compliance workspaces: an opener-isolated blank viewer is now created synchronously inside the click gesture before the audited signed-URL request, then navigated only on success and closed on denial/failure. This avoids async popup blocking without exposing the parent window; 178/178 tests and type-check pass.
- Closed a least-privilege leak in `catalog.read`: its response no longer bundles compliance issues, private-document metadata, staff email, or audit history. Onboarding now loads the dedicated compliance boundary separately and safely degrades to catalog-only data on a 403. The authenticated rollout contract was updated; 179/179 tests and type-check pass.
- Separated the cross-domain intelligence dashboard from `catalog.read`. The dashboard now requires `intelligence.read` (or super-admin `*`) because it contains performance, receivable, invoice, and compliance aggregates; a catalog-only release-test account is explicitly denied.
- Extended the fail-closed live rollout verifier to require an independent `intelligence.read` account when scoped tokens are supplied. The five-account matrix now proves nineteen allow/deny boundaries, including that the composite reader cannot enter catalog, finance, or compliance APIs.
- Propagated trusted LI permissions from Supabase `app_metadata` into the client session model and filtered each LI sidebar destination by its exact read capability (with `*` support). This removes predictable 403 dead ends for scoped operators while retaining API/database authorization as the security boundary; 180/180 tests and type-check pass.
- Extended permission-aware navigation inside LI workspaces. Composite tabs, finance-to-compliance links, and workspace back links now honor exact read grants; operators without `intelligence.read` return to the general admin dashboard rather than a guaranteed 403. A shared client helper has runtime coverage; 181/181 tests and type-check pass.
- Made the finance workspace usable with `finance.read` alone: a catalog 403 now degrades to empty setup choices instead of failing all ledger data, while operations remain required. Compliance navigation plus compliance/audit CSV controls are hidden without `compliance.read`; 182/182 tests and type-check pass.
- Made finance role separation explicit in the workspace: `finance.read` remains sufficient for inspection and exports, all finance mutations are centrally denied without `finance.manage`, and routing exception approval/rejection is independently controlled by `routing.review`. Read-only controls are visually suppressed while API and database authorization remain authoritative.
- Extended exact capability UX to catalog and compliance surfaces. Catalog inspection no longer presents usable policy/onboarding writes without `policy.manage`; issue custody is independently gated by `compliance.manage`; and the dedicated compliance evidence workspace stays useful to readers while lifecycle mutations are disabled and centrally denied.
- Surfaced database maker-checker rules directly in operational queues. Policy, document, commercial, beneficiary, partner-commission, payment, recovery, and routing-exception rows now compare their maker identity with the authenticated actor and disable self-review with an explicit independent-checker explanation before the locked workflow is called.
- Added a live, non-mutating mutation-authorization verifier. Eight deliberately invalid POST probes prove that catalog/finance/compliance readers and a non-reviewer stop at 403 while exact policy/finance/compliance managers and routing reviewers cross the capability boundary and stop safely at 400 validation, with bounded requests and bearer-leak checks.
- Replaced hard-coded CRM rejection capture with the active canonical registry. The leads boundary returns deduplicated global/partner-scoped codes (partner overrides win), the detail panel follows the live options, and inline stage changes validate a selected live code instead of silently forcing `OTHER`; the transition API retains the authoritative scoped lookup.
- Closed premature/excess disbursal paths. The transition workflow now requires a canonical sanction for the same decision-bound lender/program, caps disbursal at the sanctioned amount, and copies sanctioned amount/ROI/tenure into the immutable disbursal outcome. API preflight mirrors the prerequisite, and embedded execution proves both denials plus inherited terms.
- Made sanction evidence complete at capture time. CRM operators must provide sanctioned amount, approved annual ROI, and whole-month tenure; API validation and the database outcome guard reject missing/non-positive terms, so later disbursal inheritance cannot silently produce incomplete economics.
- Aligned disbursal API preflight with the database's exact routing lineage: it now resolves the latest bound decision and accepts sanction evidence only for that selected lender/program, preventing a pre-reroute lender's historical approval from passing the early check.
- Rejected sub-paise sanction and disbursal amounts at both API and database boundaries, preventing numeric-column rounding from diverging from payout calculations and preserving exact outcome-to-reconciliation conservation.
- Extended the embedded PostgreSQL journey with real rollback-safe denials for incomplete sanction economics and sub-paise sanction/disbursal values; the valid sanction-to-disbursal-to-invoice path still completes with inherited terms. Migration execution, 187/187 tests, type-check, and diff validation pass.
- Added a per-release production evidence record that closes the audit's five remaining gates with explicit owners, opaque evidence IDs, short-lived-token verification, controlled bilateral money-path proof, and final sign-off while prohibiting secrets, borrower PII, bureau payloads, policy documents, and confidential commercial values from the record. Fresh dependency audit reports 0 vulnerabilities, all 494 migration statements parse, and the 172-page production build passes.
- Added a zero-warning scoped Lender Intelligence lint gate to CI and its locked contract. Removed an unused eligibility mapper, replaced loose exception/status/API response `any` types with bounded types or safe `unknown` narrowing, and formatted the governed admin/CRM surfaces; scoped lint and TypeScript validation pass.
- Corrected the production runtime contract: `npm start` now serves the compiled Next.js application on port 4028 instead of silently launching a development server. README guidance and a locked regression assertion prevent deployment entrypoint drift.
- Converted the manual production-server check into an enforced CI smoke gate. It boots the compiled application, verifies private/no-store/no-referrer/nosniff controls on the protected LI workspace, asserts a structured unauthenticated HTTP 401 from the admin API, and always terminates the child server; the release evidence record now captures this proof.
- Extended the authenticated live rollout verifier to reject deployments missing private/no-store/no-referrer/nosniff controls on invalid-token, super-admin, or scoped-role requests. Corrected the release record to obtain schema health from the actual catalog contract rather than a nonexistent query action.
- Hardened both live verification tools against bearer-token transport leakage: deployment targets must be origin-only HTTPS URLs, with plain HTTP accepted solely for loopback testing; embedded credentials, paths, queries, and fragments are rejected before any request. Behavioral tests prove non-loopback HTTP exits before network use.
- Closed live-verifier false positives from proxies and WAFs. Scoped read and manage probes now require JSON content type, protected private response headers, and a valid success/error application envelope in addition to the expected HTTP status; an HTML status page can no longer masquerade as authorization proof.
- Migrated the LI zero-warning gate onto ESLint 9 flat configuration while preserving the existing Next, TypeScript, and Prettier rule contract, removing the deprecated compatibility environment flag. Added a scoped ESM package boundary for direct Node execution of LI TypeScript modules so test output no longer repeats ambiguous-module warnings.
