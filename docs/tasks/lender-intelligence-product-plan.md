# Lender Intelligence Product Plan

Last updated: 12 Sep 2026

## Product mandate

Build Lender Intelligence as CreditTrust's decision and operating layer between eligibility and file processing. It must help a DSA answer four questions with evidence:

1. Which lenders can accept this customer now?
2. Why is each lender recommended or excluded?
3. Which lender should receive the file first?
4. How did the recommendation perform after login, sanction, rejection, and disbursal?

The system is decision support, not a guarantee of approval. Lender policies must be versioned, attributable, reviewable, and scoped to the correct partner or global admin catalog.

## Current-state assessment

### Implemented foundation

- Admin workspaces cover lender onboarding/programs/policy, routing, performance, finance, reconciliation, and compliance.
- Stable lender and program identities replace name-based operational joins; global and partner-scoped programs remain explicit.
- Versioned policies carry source/checksum/effective/review evidence, structured rules, maker-checker publication, retirement, and restoration without rewriting history.
- Deterministic routing returns eligible, near-match, and excluded programs with rule traces, ranking components, capacity/compliance state, and immutable decision snapshots.
- Controlled selection, time-bound exceptions, rerouting, application stages, outcomes, and canonical rejection evidence are database-owned and atomically audited.
- Portfolio and dimensional KPIs use stable IDs, mature cohorts, terminal denominators, sample suppression, stage timestamps, percentiles, and source-file drill-down.
- Disbursal outcomes materialize lender receivables and independently governed partner payables. Invoices, receipts, payments, disputes, holds, write-offs, lender clawbacks, partner recoveries, and source events remain traceable without mixing ledger direction.
- Private policy evidence, consent/withdrawal evidence, bounded exports, compliance scans, schema-health verification, and purpose-specific admin permissions provide the operational control plane.

### Remaining production dependencies

- Apply and validate the additive foundation migration against the linked production Supabase project.
- Provision named operators with approved Lender Intelligence capabilities and execute maker/checker test cases using distinct real accounts.
- Replace all demo inputs with verified lender policy documents and owner-approved product, lender, taxonomy, retention, and commercial decisions.
- Run the authenticated post-deploy rollout verifier and one controlled end-to-end file through selection, outcome, receivable, payable, invoice/payment, reconciliation, and recovery paths.
- Predictive learning remains intentionally disabled (`descriptive_only`) until sufficient clean outcomes and approved calibration, drift, bias, and model-governance gates exist.

## Product boundaries

### In scope

- Lender master and lender-product programs
- Versioned credit policy rules and policy source evidence
- Explainable customer-to-lender matching
- Ranked routing and controlled lender selection
- Application outcome capture and lender funnel analytics
- Lender TAT, approval, rejection, amount, and conversion intelligence
- Commercial terms, payout readiness, and reconciliation hooks
- Audit trail, role controls, policy approval, and data-quality monitoring

### Out of scope until explicitly approved

- Claiming guaranteed sanction, rate, or disbursal
- Scraping or publishing unverified lender policy
- Fully autonomous submission to an external lender
- ML-based ranking before enough clean labeled outcomes exist
- Public sharing of lender commercials or customer bureau information

## Target user journeys

### CreditTrust admin

Create lender -> create lender-product program -> upload/source policy -> enter structured rules -> validate -> maker submits -> checker approves -> publish effective version -> monitor usage and outcomes -> retire or supersede policy.

### DSA credit user

Run eligibility -> see eligible and near-match lenders -> inspect reasons and warnings -> compare economics/TAT -> select a lender -> record override reason when not choosing rank 1 -> create file process.

### Operations manager

Monitor pending login, TAT breaches, stale files, rejections, lender capacity, and routing overrides -> re-route with reason -> retain complete lender history.

### Finance/compliance user

Connect disbursal outcome to payout terms -> verify invoice/commission readiness -> inspect consent, policy version, decision trace, and audit history.

## Decision engine design

### Layer 1: hard eligibility gates

- Product and scheme
- Employment type and employer category
- Geography/serviceability
- Bureau score/no-hit/thin-file rules
- Age at application and maturity
- Minimum income or turnover
- Loan amount and tenure bands
- FOIR, LTV, vintage, and obligation rules
- Delinquency, enquiries, write-off, settlement, and suit-filed rules
- Required documents and banking/GST/ITR conditions

A failed hard gate excludes a program and returns a user-readable reason plus the evaluated values.

### Layer 2: soft ranking

Rank only eligible programs using configurable weights:

- Expected approval likelihood based on observed terminal outcomes
- Expected login-to-sanction and sanction-to-disbursal TAT
- Indicative rate and fees
- Eligible amount coverage
- Historical rejection pattern for similar profiles
- Current lender capacity and operational health
- Partner commercial preference, separated visibly from customer-fit factors

Every score must expose its components. Commercial preference must never silently override a hard policy failure.

### Layer 3: controlled decision

- User may select any eligible program.
- Selecting outside the recommended top result records an override reason.
- Selecting an excluded lender requires a permissioned exception workflow, not a normal submission.
- The saved decision snapshot includes engine version, policy version, input snapshot, matched/excluded programs, scores, and actor.

## Data model roadmap

Create new migrations instead of changing the already-applied CRM migration.

1. `lender_master`: stable lender identity, legal/display names, type, status.
2. `lender_programs`: lender, product, scheme, channel, geography, amount/tenure/rate bands, status.
3. `lender_policy_versions`: program, version, effective window, status, source, checksum, maker/checker.
4. `lender_policy_rules`: version, field, operator, value, severity, reason code, reason text, priority.
5. `lender_commercials`: partner/program, payout basis, slabs, tax terms, effective window, confidentiality controls.
6. `lender_routing_decisions`: report/lead, engine version, ranked result snapshot, selection, override/exception reason.
7. `application_stage_events`: application, lender/program, from/to stage, occurred time, actor, source.
8. `lender_outcomes`: terminal decision, sanctioned/disbursed amount, rate, tenure, rejection taxonomy.
9. `lender_policy_documents`: private storage metadata, source/evidence, review and expiry dates.
10. `lender_data_quality_issues`: missing/stale/conflicting policy and outcome data with ownership and SLA.

All operational rows must carry partner scope where applicable, immutable IDs, timestamps, and audit actors. Customer PII and bureau payloads stay outside analytics responses unless specifically required and authorized.

## Delivery roadmap

### Phase 0 — Stabilize and define (current)

- Map existing admin/CRM/data flows.
- Establish this product specification and source-of-truth backlog.
- Enforce file-process permission for lender submission.
- Reject lender submissions not present in the lead's saved eligibility result or no longer active.
- Require explicit, versioned customer-consent evidence before eligibility routing or lender submission. **Implemented:** UI attestation, immutable report evidence, canonical actor binding, and database fail-closed checks at recommendation, initial selection, and reroute boundaries.
- Label seed policies and rates as demo data in non-production contexts.

Acceptance: unauthorized or arbitrary lender submission is blocked server-side; current build and type-check pass; open policy/data decisions are documented.

### Phase 1 — Trusted lender master and policy governance

- Split lender identity from lender-product programs.
- Capture finance-grade lender billing identity. **Implemented:** finance email, registered address, and GSTIN are governed master fields, activation/routing gates, and invoice-recipient evidence.
- Add policy versioning, effective dates, source evidence, draft/review/published/retired states.
- Add maker-checker roles and audit events.
- Add bulk import with validation and preview; never silently overwrite published policy. **Implemented:** preview-first admin workflow, normalized server validation, active-program blocker, audit record, and atomic 500-row commit.
- Add data freshness and incomplete-policy indicators.

Acceptance: an admin can publish a reviewed program version, trace every field to a source, and restore the previous version without losing history. **Implemented:** restoration creates a new atomic draft clone, preserves historical records, records the reason, and re-enters independent maker-checker review.

### Phase 2 — Explainable matching MVP

- Evaluate program-level hard rules.
- Return eligible, near-match, and excluded results with reason codes.
- Add comparison UI and input completeness warnings.
- Persist an immutable decision snapshot.
- Add engine regression fixtures for representative borrower profiles. **Implemented:** automated operator, missing-input, severity, product-filtering, and deterministic-ranking coverage under `tests/lender-intelligence/`.

Acceptance: the same inputs and policy version produce the same result; every inclusion/exclusion is explainable; missing inputs never become silent zero values.

### Phase 3 — Routing workflow

- Add ranking configuration and routing waterfall.
- Capture selected program ID and rank, not only lender name.
- Add override/exception reasons and approval workflow.
- Time-bound exception authorization. **Implemented:** independent approval revalidates live compliance/policy/capacity, expires after 24 hours, and stale approval is atomically retired before replacement.
- Add capacity pause, geography/channel controls, rerouting, and lender-change audit. **Implemented:** manual capacity states plus optional IST-day numeric submission caps, explainable exhaustion, and advisory-lock enforcement at selection/reroute commit.
- Revalidate lender compliance readiness at recommendation and commit time. **Implemented:** verified KYC, signed agreement, and live agreement-expiry gates apply to matching, initial selection, and rerouting transactions.
- Add notifications for pending login and TAT breach. **Implemented:** hourly authenticated scan, 75% login warning, stage-specific breach notification, deduplication key, and compliance issue linkage.

Acceptance: operations can trace a file from recommendation through every lender movement and explain why each routing decision occurred.

Governed application custody is database-enforced: after normalized evidence exists, legacy CRM writes cannot alter source identity, lender, amount, status history, or rejection evidence, and deletion cannot cascade away routing/stage/outcome/reconciliation history. Only atomic reroute and transition workflows can advance the protected lifecycle.

Selection/reroute integrity is database-owned: canonical actor, payload shape/size, lead lineage, timestamps, amount bounds, decision evidence, current readiness, application/stage writes, exception consumption, and immutable audit evidence commit or roll back together.

### Phase 4 — Outcome intelligence

- Introduce canonical stage events and terminal outcome taxonomy.
- Calculate cohort-based login, sanction, rejection, and disbursal rates. **Implemented at portfolio level:** rolling 90-day sent cohort with 30-day disbursal maturity.
- Calculate median and percentile TAT by lender, program, product, partner, and period. **Implemented:** database portfolio and dimension breakdowns, 90-day period, sample suppression, and source-file drill-down.
- Separate pending files from terminal-rate denominators. **Implemented:** terminal-only approval/rejection metrics expose pending count separately.
- Add rejection reason quality controls and similar-profile performance views. **Implemented:** governed rejection taxonomy plus anonymized score/income/loan/employment bands with terminal-denominator and minimum-sample suppression.

Acceptance: every KPI has a documented numerator, denominator, cohort window, freshness timestamp, and drill-down to source applications. **Implemented:** portfolio and lender/program/product/partner evidence contracts with source-file links.

### Phase 5 — Commercials and compliance

- Version payout/commission terms independently from credit policy.
- Link disbursal events to payout eligibility and reconciliation states.
- Add private document storage, expiry alerts, access logging, and export controls. **Implemented:** private signed access, expiry scanning, access audits, plus bounded admin audit/compliance CSV exports that fail closed unless their export event is committed.
- Reconcile application, lender payout, partner commission, invoice, and payment. **Implemented:** lender receivables use governed reconciliation/invoice/receipt ledgers with immutable legal-tax-contact snapshots. Partner commissions use a separate reviewed payable contract and disbursal-linked ledger with frozen GST/TDS/payment-term evidence. Outgoing partial/final settlement requires maker-checker approval and stale-balance revalidation; neither side can be relabelled as the other.
- Govern partner beneficiary identity without retaining full bank/PAN credentials. **Implemented:** versioned masked payout profiles, maker-checker verification, provider beneficiary references, commission-activation gating, and immutable payable-time beneficiary snapshots.

Acceptance: finance can explain every payable/receivable amount from source terms and application events without exposing confidential terms to unauthorized users.

### Phase 6 — Learning and optimization

- Establish clean training/validation datasets from versioned decisions and outcomes. **Foundation implemented:** application-bound immutable routing inputs are joined to canonical outcomes into anonymized, fixed profile bands; raw PII is not returned.
- Add calibrated approval/TAT predictions only after sample-size thresholds are met.
- Monitor drift, bias, overrides, and false-negative/false-positive patterns.
- Keep deterministic policy gates authoritative; predictive models assist ranking only.

Current learning mode is explicitly `descriptive_only`: no model version or predictive claim is emitted, and the declared fallback remains deterministic policy routing until calibration, drift, bias, and validation gates are implemented and approved.

Acceptance: predictive metrics show sample size, calibration period, confidence, model version, and fallback behavior.

## KPI contract

- Match rate: reports with at least one eligible published program / complete evaluated reports.
- Login rate: applications reaching lender login / files sent, by sent-date cohort.
- Sanction rate: sanctioned applications / terminal lender decisions, with pending shown separately.
- Disbursal rate: disbursed applications / files sent, by sent-date cohort and maturity window.
- Rejection rate: rejected applications / terminal lender decisions.
- TAT: event-to-event duration from immutable stage timestamps; report median, P75, and P90.
- Override rate: non-rank-1 selections / selections.
- Policy freshness: active programs whose current published policy is within its review SLA.
- Data completeness: records satisfying required fields / records expected for the metric.

## Production launch ownership

1. Product owner: approve catalog scope, first product/lenders, KPI definitions, and recovery/waiver authority.
2. Credit policy owner: provide verified source documents for the first three lenders, approve structured rule mapping, and nominate reviewers.
3. Platform owner: decrypt production configuration, apply the additive migration, provision scoped operator capabilities, deploy, and run the rollout verifier.
4. Data/operations: approve canonical stage, rejection, exception, and partner-recovery codes and validate historical mappings before any import.
5. Finance: approve lender commercial and partner commission/tax terms, billing identities, beneficiary references, invoice numbering, and reconciliation opening balances.
6. QA: execute golden profiles, tenant isolation, capability denial, maker-checker, concurrency, idempotency, invoice, settlement, and recovery test cases with real test identities.
7. Compliance: approve customer notice/consent wording, retention/deletion schedule, decision-support language, private-document access, exports, and accepted-risk authority.

## Launch gates

- Every in-scope pull request and `main` push must pass the repository Lender Intelligence quality workflow: clean install, dedicated contract tests, TypeScript validation, and production build.
- No real lender policy is published without named source, effective date, reviewer, and freshness SLA.
- No recommendation is described as guaranteed approval or final lender decision.
- No cross-partner lender commercial or customer data can appear in API/UI responses.
- Bulk compliance exports must use structured identifiers and omit free-text narratives that may contain borrower PII; system findings must not copy borrower names into compliance detail.
- No routing decision is saved without the evaluated policy version and decision trace.
- No routing or outcome integration may bypass database payload, range, and event-time bounds; callers should reject the same invalid values before invoking the governed RPC.
- No performance rate is shown without a valid denominator and minimum sample-size treatment.
- No external lender submission becomes automatic without explicit authorization, idempotency, retry, and reconciliation design.
- Custom commercial payouts remain unbilled until finance records a positive approved amount and calculation evidence; only invoice-ready items may enter an invoice, and invoice totals must be positive.

## Custom payout operating procedure

When an active commercial uses the `custom` payout basis, disbursal creates an unbilled reconciliation item with no assumed payout. Finance uses **Set payout** to enter the approved amount and an approval/calculation reference. The transaction locks the item, verifies that the linked commercial is custom and untouched, applies the commercial GST or reverse-charge terms, preserves the evidence, and moves the item to `invoice_ready`. Only then can it be selected for invoice creation.

## Open owner decisions

1. Is the lender catalog global, partner-specific, or global with partner overrides?
2. Who may create, review, publish, and retire credit policies? **Technical boundary implemented:** only admins with server-owned `policy.manage` capability reach mutations, while database maker-checker rules still require different authenticated actors. Business must nominate the actual users.
3. Which first product and first three lenders should define the MVP policy taxonomy?
4. Are commercials maintained by CreditTrust centrally or independently per partner?
5. What are the official application stages and lender rejection reason codes?
6. What policy review SLA is required: 30, 60, or 90 days?
7. Which outcomes can be imported from lender systems, and which remain manually entered?
8. What customer consent, retention, and audit-export rules have compliance approved?
9. Product/compliance must approve the canonical partner-recovery trigger taxonomy and waiver authority. **Safe technical foundation implemented:** partner commission recoveries have a separate paid-capped ledger, independent maker-checker resolution, collection/waiver/dispute evidence, audited PII-minimized export, and never reuse lender-receivable clawbacks.

Interim safe default for decision 8: the platform captures an explicit `eligibility-routing-v1` operator attestation for profile verification, eligibility assessment, and lender-fit routing. Withdrawal is append-only, audited, and immediately blocks new routing/submission while preserving historical evidence. These are technical controls, not a substitute for compliance approving the final notice wording and retention schedule.

## Recommended MVP cut

Start with one product and three verified lenders. Deliver versioned policy entry, explainable hard-rule matching, a ranked comparison, controlled selection, decision snapshots, and basic terminal-outcome reporting. Do not expand to more lenders until policy accuracy, tenant isolation, and outcome event quality pass the launch gates.
