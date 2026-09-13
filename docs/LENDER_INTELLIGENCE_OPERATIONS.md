# Lender Intelligence Operations Guide

## Purpose

Lender Intelligence connects lender onboarding, versioned policy, explainable routing, application outcomes, commercials, invoicing, reconciliation, and operating analytics. It supports credit and operations decisions; it does not guarantee lender approval.

## Access

- Overview: `/admin-lender-intelligence`
- Lender onboarding and policy: `/admin-lender-intelligence/onboarding`
- Routing analytics: `/admin-lender-intelligence/routing`
- Performance analytics: `/admin-lender-intelligence/performance`
- Commercials and reconciliation: `/admin-lender-intelligence/invoicing-compliance`

All APIs require an authenticated CreditTrust admin except CRM eligibility and file-process actions, which use partner scope and CRM permissions.

Lender Intelligence admin access is additionally capability-scoped through server-owned Supabase `app_metadata.lender_intelligence_permissions`; client-editable `user_metadata` is never accepted for either base admin authorization or LI permissions. Base admin identity must come from trusted `app_metadata.role` or the server-read `user_profiles` record. Supported grants are `intelligence.read`, `catalog.read`, `policy.manage`, `routing.review`, `finance.read`, `finance.manage`, `compliance.read`, and `compliance.manage`; `*` is reserved for the super-admin. `intelligence.read` is intentionally separate because the composite dashboard includes cross-domain routing, performance, receivable, invoice, and compliance aggregates. The foundation migration explicitly bootstraps existing trusted admins with `*`, while every newly provisioned or restricted admin must receive only the grants needed for their duties. Finance readers commonly also need `catalog.read` so lender/program labels can render. Permission changes must be made through trusted Supabase admin provisioning and require a refreshed access token.

The admin sidebar and internal LI workspace navigation read the same trusted `app_metadata` permissions and hide destinations the current operator cannot read. Finance-to-compliance links and compliance/audit exports appear only with `compliance.read`; scoped workspaces return to the composite intelligence page only with `intelligence.read`, otherwise they return to the general admin dashboard. A `finance.read` operator can load and export the finance ledgers when catalog access is absent; lender/program setup controls simply have no catalog choices, while joined ledger labels remain available. The workspace visibly marks this as read-only and suppresses finance mutation interaction unless `finance.manage` is present; routing exception decisions are independently enabled only by `routing.review`. Catalog readers receive the same explicit read-only treatment: lender, program, policy, taxonomy, document, and import workflows require `policy.manage`, while compliance issue custody requires `compliance.manage`. The dedicated compliance workspace keeps evidence and document access available to `compliance.read` operators but disables issue lifecycle changes without `compliance.manage`. This is navigation hygiene only: every API still performs its own server-side capability check and the database continues to enforce actor/workflow boundaries. A missing client permission never grants access and a manually entered URL still receives the server's 403 response.

Maker-checker queues use the authenticated user's stable UUID and the server-returned `submitted_by`, `requested_by`, or `created_by` identity to disable self-review controls before an operator can act. This covers policy publication/rejection, private-document review, commercial activation/rejection, beneficiary verification, partner commission activation, outbound payment approval, recovery resolution, and routing exceptions. Database workflows repeat the independence check under row locks; the UI restriction is an early operational safeguard, not the authority boundary.

## Production rollout order

Every pull request that changes Lender Intelligence code, tests, migrations, or operational documentation must pass the GitHub Actions **Lender Intelligence Quality Gate**. The gate uses Node 22 and a clean locked install, matching the repository's `>=22.6.0 <25` runtime contract required by the TypeScript-stripping test runner. It rejects any npm advisory at low severity or above, then runs the dedicated contract suite, TypeScript validation, zero-warning scoped lint, a production build with non-secret placeholder configuration, and a built-server smoke test. The smoke test boots `npm start`, verifies private response controls on the protected workspace, and proves the unauthenticated admin API returns structured HTTP 401 before stopping the server. The workflow also runs on matching pushes to `main` and can be dispatched manually. No deployment should bypass a failed or cancelled gate.

After applying the migration and deploying the application, run the authenticated, read-only smoke gate with a short-lived admin access token. It first proves that an invalid token is rejected, then checks the exact live catalog and finance/operations collections plus fresh KPI cohort/evidence contracts. Requests use bounded timeouts, deny redirects, and responses are checked to ensure they never echo the token. The deployment target must be an origin-only HTTPS URL: embedded credentials, paths, queries, fragments, and non-loopback HTTP are rejected before a bearer token can be sent. Plain HTTP is accepted only for local loopback verification:

```bash
LENDER_INTELLIGENCE_BASE_URL=https://your-deployment.example \
LENDER_INTELLIGENCE_ADMIN_BEARER_TOKEN='<short-lived-admin-access-token>' \
npm run verify:lender-intelligence-rollout
```

For release evidence, also provide all five scoped tokens. Use separate admin accounts whose `app_metadata.lender_intelligence_permissions` are respectively empty, `['intelligence.read']`, `['catalog.read']`, `['finance.read']`, and `['compliance.read']`:

```bash
LENDER_INTELLIGENCE_BASE_URL=https://your-deployment.example \
LENDER_INTELLIGENCE_ADMIN_BEARER_TOKEN='<short-lived-super-admin-token>' \
LENDER_INTELLIGENCE_RESTRICTED_BEARER_TOKEN='<short-lived-restricted-admin-token>' \
LENDER_INTELLIGENCE_INTELLIGENCE_BEARER_TOKEN='<short-lived-intelligence-reader-token>' \
LENDER_INTELLIGENCE_CATALOG_BEARER_TOKEN='<short-lived-catalog-reader-token>' \
LENDER_INTELLIGENCE_FINANCE_BEARER_TOKEN='<short-lived-finance-reader-token>' \
LENDER_INTELLIGENCE_COMPLIANCE_BEARER_TOKEN='<short-lived-compliance-reader-token>' \
npm run verify:lender-intelligence-rollout
```

When these tokens are present, the verifier additionally proves nineteen allow/deny boundaries across composite intelligence, catalog, finance operations, compliance evidence, and private-document authorization. Partial matrix configuration fails closed. Never save any token in `.env` files committed to source control.

Run the separate mutation-authorization gate with eight short-lived accounts: the catalog, finance, compliance, and restricted read tokens above plus accounts carrying exactly `policy.manage`, `finance.manage`, `compliance.manage`, and `routing.review`. Its eight POST requests are deliberately non-mutating: read-only accounts must stop at authorization with HTTP 403, while the corresponding manager/reviewer must cross authorization and stop at invalid-input/unsupported-action validation with HTTP 400. Every response must also carry the protected private headers and a structured JSON application-error envelope, so an intermediary/WAF status page cannot create a false pass. Any success response is a failure because a probe must never change production data.

```bash
LENDER_INTELLIGENCE_BASE_URL=https://your-deployment.example \
LENDER_INTELLIGENCE_CATALOG_BEARER_TOKEN='<short-lived-catalog-reader-token>' \
LENDER_INTELLIGENCE_POLICY_MANAGER_BEARER_TOKEN='<short-lived-policy-manager-token>' \
LENDER_INTELLIGENCE_FINANCE_BEARER_TOKEN='<short-lived-finance-reader-token>' \
LENDER_INTELLIGENCE_FINANCE_MANAGER_BEARER_TOKEN='<short-lived-finance-manager-token>' \
LENDER_INTELLIGENCE_COMPLIANCE_BEARER_TOKEN='<short-lived-compliance-reader-token>' \
LENDER_INTELLIGENCE_COMPLIANCE_MANAGER_BEARER_TOKEN='<short-lived-compliance-manager-token>' \
LENDER_INTELLIGENCE_RESTRICTED_BEARER_TOKEN='<short-lived-non-reviewer-token>' \
LENDER_INTELLIGENCE_ROUTING_REVIEWER_BEARER_TOKEN='<short-lived-routing-reviewer-token>' \
npm run verify:lender-intelligence-mutation-authorization
```

The authenticated catalog includes a database-generated `schemaHealth` manifest. The rollout command fails unless the expected migration ID, critical tables, governed functions, exact table-bound triggers, RLS flags, and direct-write privilege boundaries are all present. Operations verification also requires the lender receivable and partner payable registers. Use a short-lived admin access token and never persist it in source control.

Before deployment, `npm run verify:lender-intelligence-migration-syntax` parses the complete migration with the PostgreSQL parser and rejects malformed SQL or an unexpectedly truncated file. CI runs this automatically. This structural parse does not replace applying the migration to Supabase, which is still required to validate PL/pgSQL bodies, referenced objects, grants, and runtime behavior against the real schema.

CI also runs `npm run verify:lender-intelligence-migration-execution`. It creates an isolated embedded PostgreSQL database with the minimum authoritative pre-existing CreditTrust schema, executes every migration statement so SQL and PL/pgSQL bodies compile, and requires the resulting schema-health manifest to report ready. Behavioral smoke checks then prove trusted-admin capability bootstrap, unknown-actor rejection, governed lender/program creation, draft/pending defaults with atomic audits, policy rule replacement/submission, same-maker publication denial, independent-checker publication, lender/program activation, consent-required routing, atomic selection/stage evidence, application custody, and service-role denial of direct lender inserts. This catches function-body, manifest, maker-checker, routing, and core privilege errors without credentials. Supabase execution remains mandatory because extensions, the full historical schema, auth behavior, and platform grants must still be proven in the target environment.

The embedded gate switches into the actual `service_role` before its privilege checks. It requires governed schema-health and actor-bound compliance RPC execution to succeed, while direct catalog, stage, reconciliation, audit, and partner-payable DML must fail. This verifies both necessary access and denied bypass paths rather than relying only on grant text inspection.

Finance can export bounded 90-day partner-payable and payment-approval CSV registers from the admin workspace. The payable export includes source IDs, disbursal/commission/tax/TDS/open amounts, lifecycle dates, beneficiary profile version, masked account digits, IFSC, and provider beneficiary reference. The approval export includes structured request/reviewer/payment IDs and amounts. Borrower names, free-text request/review notes, full PAN, and full bank credentials are excluded; spreadsheet formula prefixes are neutralized and every export is audited before bytes are returned.

Finance can also export lender reconciliation and invoice registers for the same bounded window. These carry application/outcome/commercial/invoice IDs, disbursal evidence, expected tax, invoiced, received and open balances, statuses, dates and payment references. Borrower identity and reconciliation narrative are excluded. Export audit events are classified under `invoicing`, `partner_commissions`, or `compliance` according to the selected register.

A non-zero exit means rollout is not verified. Revoke or allow the short-lived token to expire after the check.

1. Back up the production Supabase database.
2. Apply `supabase/migrations/20260912220000_lender_intelligence_foundation.sql`.
3. Verify all new tables, indexes, triggers, RLS policies, and RPC functions exist.
4. Deploy the application.
5. Create lender master records in draft.
6. Complete KYC, agreement status, finance email, registered billing address, and GSTIN before changing onboarding status to active.
7. Create one program for the selected MVP product.
8. Create a policy draft with a verified source reference.
9. Add and validate policy rules.
10. Maker submits the policy; a different admin publishes it.
11. Run golden-profile eligibility tests and compare every result with the source policy.
12. Configure a commercial version; maker submits and a different admin activates it.
13. Test one controlled file through lender selection, stage events, terminal outcome, reconciliation, invoice, and payment.

Do not deploy application code before the migration because the admin catalog and operations routes require the new tables.

Lender and program activation gates are enforced twice. The catalog API permits program master edits only while the program is draft and never accepts an active status through upsert. PostgreSQL triggers independently reject an active lender without verified KYC/current signed agreement and reject an active program without both an active lender and a current published policy. Service-role integrations cannot bypass these invariants.

Program operating changes use a row-locking lifecycle workflow. Lender ownership and creation provenance never change; once a program leaves draft, its identity, product eligibility, pricing indicators, SLA configuration, priority, and metadata are frozen. Retired programs cannot be reactivated.

## Policy lifecycle

`draft -> in_review -> published -> retired`

- Only draft rules may be edited.
- A policy needs a source reference and at least one enabled rule before review.
- Maker and checker must be different authenticated admins.
- Publishing is atomic: the current published version retires in the same transaction that activates the new version.
- Routing decisions store policy IDs, versions, inputs, full result traces, rank, and selection.

Supported rule operators:

- Equality: `eq`, `neq`
- Membership: `in`, `not_in`
- Numeric: `gt`, `gte`, `lt`, `lte`, `between`
- Presence: `exists`, `not_exists`

Rule severities:

- `hard`: failure excludes the program.
- `soft`: failure keeps a near match and reduces fit score by its weight.
- `warning`: visible evidence without exclusion or score penalty.

Missing hard-rule data returns `needs_data`; it must not be treated as zero or eligible.

The governed routing-input taxonomy currently includes bureau score, requested amount, monthly income, requested tenure, FOIR, calculated maximum loan, loan product, applicant state/city, employment type, and origination channel. Numeric fields allow numeric/list/range/presence operators; categorical fields allow string/list/presence operators. Unknown fields, incompatible operators, malformed values, invalid weights, and weak reason evidence are rejected by both API validation and database publication controls.

Active program-master limits are enforced before authored policy rules. Min/max amount, min/max tenure, employment types, channels, states, and cities become hard explainable checks in every routing result. A failed guardrail excludes the program; missing data produces `needs_data` rather than a false decline. Full-detail eligibility checks collect the loan and income inputs needed for this evaluation, and CRM is recorded as the default origination channel.

Configure these guardrails when creating a product program in the onboarding workspace. Comma-separated serviceability values are case-insensitive during evaluation. Blank lists mean unrestricted; do not enter a blank token to represent “all”. The API rejects malformed, negative, fractional-tenure, or inverted numeric ranges before persistence.

Private policy and compliance documents can only be attached to a program and policy version owned by the selected lender. Opening a document creates a five-minute signed URL only after the access grant has been written to the immutable Lender Intelligence audit ledger; audit failure denies access. The UI creates an opener-isolated viewer synchronously from the user's click so browser popup controls do not discard the signed response; it closes that viewer if authorization/signing fails. Audit CSV exports retain stable actor UUID attribution but omit actor email and free-text summaries, keeping the register traceable without exporting staff identity or filename-bearing narrative fields.

New documents enter `pending` review. A different admin must verify or reject them; the uploader cannot self-review, a rejection requires a meaningful note, and a completed review cannot be overwritten. The document register exposes status and review evidence.

Document ownership, storage location, filename, SHA-256 digest, validity dates, uploader, and upload timestamp are immutable after registration, and document evidence cannot be deleted. A verified document can become `expired` only after its recorded expiry time; reviewer evidence remains preserved.

Document metadata registration is a private database workflow that validates lender/program/policy ownership, MIME allowlist, lender-scoped private storage path, SHA-256 shape, and future expiry. For draft policy sources, document registration and policy checksum binding commit atomically; direct service-client document DML is revoked.

Before any object reaches private storage, the server verifies its binary file signature against the declared PDF, OOXML, or legacy Office MIME type. OOXML uploads must also contain the standard content-types manifest and the correct Word or Excel package root; generic ZIP files, cross-type packages, and embedded VBA macro projects are rejected. Legacy Office macro streams are rejected using ASCII and UTF-16 markers. PDFs containing JavaScript, launch actions, or embedded-file actions are rejected. Empty, disguised, mismatched, unknown, and active-content files receive HTTP 415.

A policy whose source type is `lender_document` cannot enter review or publish from a typed reference alone. Its linked source must be independently verified, unexpired at the effective date, and have the same SHA-256 checksum stored on the policy version. The database rechecks this at publication to close API-bypass and race conditions.

Capacity participates in routing without overriding credit policy. `paused` programs are removed before evaluation. `limited` programs remain eligible but receive a visible `PROGRAM_LIMITED_CAPACITY` warning and 15-point fit-score penalty, so an otherwise equivalent open program ranks first.

Commercial drafts validate their lender/program ownership before creation. Flat values must be positive, percentage values must be within 0–100, and slab terms must be a non-empty ordered JSON array of non-overlapping bands with `flat` or `percentage` payout values. An open-ended band must be last. The finance workspace provides an editable slab JSON template; invalid terms are rejected before governance review.

The same payout constraints are enforced by the `lender_commercial_versions` table through an immutable PostgreSQL slab validator. Service-role jobs and future integrations therefore cannot bypass the API validator and persist payout terms that the disbursal engine cannot calculate.

Invoice creation locks selected reconciliation rows in deterministic ID order before validating and summing them. Concurrent attempts against the same source items serialize: the first transaction assigns the items, and the second fails the unbilled-item check instead of creating a duplicate or orphan invoice.

Rollback never reactivates or edits a historical policy. Select a retired version and create a restoration draft with a mandatory reason. The database clones its rules and source evidence into the next version atomically. The maker must submit that draft and a different admin must approve or reject it. New and restored policies receive a 90-day review due date, and publication is blocked if that date is not after the effective date.

## Bulk lender/program import

Use the onboarding workspace template to paste a JSON array of up to 500 lender-program rows. Run **Validate & preview** first; commit remains disabled until every row is valid. The preview identifies creates, draft updates, and blocked active programs. Commit executes the complete batch and its immutable audit record in one database transaction. The database independently enforces actor, batch-size, payload-size, duplicate-code, tenant, identity, range, and SLA rules and delegates every mutation to the same governed lender/program workflows used by the editors. Only draft programs can be updated. Active, paused, or retired programs and published policy versions are never overwritten by bulk import; use the governed lifecycle/version workflow for live changes.

## File rerouting lifecycle

For a new persisted program selection, `commit_lender_selection` locks the latest partner/report decision and atomically validates its immutable result snapshot, rank, lender identity, current operating state, and any approved exception. Application creation, decision binding, first stage event, and one-time exception consumption then commit or roll back together. Direct callers cannot select an excluded or missing-data result without the exact approved exception.

Selection and reroute transactions also authenticate the canonical actor inside PostgreSQL, accept only bounded JSON objects (1 MB), require array-shaped histories/notes, constrain identity and reason lengths, validate amount precision/range, bind the lead to the immutable decision/source application, and reject future or backdated transaction times. New application `created_at` is assigned by the governed transaction rather than trusted from client JSON. Their Lender Intelligence audit event commits in the same transaction as the application, routing, stage, and exception writes.

Every new eligibility check requires an explicit operator confirmation that the customer authorized profile verification, eligibility assessment, and lender-fit routing. The resulting report stores the consent time, purpose, notice version, source, and canonical authenticated actor as immutable evidence. Routing registration, initial lender submission, and rerouting all fail closed when that evidence is absent; legacy reports are not silently treated as consented and must be re-run after valid consent is obtained.

If a customer withdraws consent, open the eligibility report and use **Record consent withdrawal** with the request/evidence reference. The private workflow locks the report, verifies that consent existed, writes one append-only withdrawal record, and commits its audit event atomically. A withdrawn report remains available for authorized historical/compliance evidence, but it cannot support a new recommendation, first lender submission, or reroute. Do not delete or overwrite the original consent record.

An active label alone is never sufficient. Recommendation queries, initial selection, and rerouting each require currently verified lender KYC, a signed agreement, and an agreement expiry later than the transaction time (or no recorded expiry). A lender whose compliance evidence ages out after activation therefore stops receiving new files immediately, without waiting for the next readiness scan.

The initial recommendation snapshot is registered through an idempotent database workflow bound to the exact partner, lead, and persisted eligibility report. Only one unbound recommendation snapshot can exist per report, and service clients cannot insert or rewrite decision rows directly.

Changing an already-selected lender requires a recorded operational reason. For persisted partner files, `reroute_crm_application` locks the prior application and current routing evidence, revalidates the target rank and operating readiness, preserves the original bound decision, and creates a derived decision bound to the new application. The prior application closure (`rerouted`), new application creation, both immutable stage events, and one-time exception consumption execute in the same database transaction. A failure rolls back the complete switch; terminal attempts and their original decisions remain available for history and future retries.

There is no normalized-ledger direct-write fallback. Program-backed initial selection, rerouting, stage/outcome capture, payout materialization, and exception consumption must succeed through their atomic workflows; repeated selection of the same open lender application returns the existing application idempotently. The legacy JSON path remains only for installations where the Lender Intelligence migration is not present and does not fabricate normalized evidence.

Once an application is referenced by routing, stage, outcome, or reconciliation evidence, the legacy CRM row becomes evidence-protected. Partner/lead/customer/lender/product/amount and creation provenance cannot be changed, and deleting the application is rejected before foreign-key cascades can erase history. Status, status history, lender history, and rejection evidence may change only inside the atomic reroute or application-transition workflow; ordinary note, document, and follow-up operations remain available without rewriting the governed facts.

Selection and rerouting also require the exact policy version captured in the decision snapshot to remain the currently effective published version; stale evidence forces a fresh eligibility run. Exception requests are database-bound to the unbound decision's lender, program, policy, lead, report, and match status. Request evidence cannot be edited or deleted, self-review is blocked, approval rechecks current lender/program/policy readiness, and an approved exception can transition only once to `used`.

Exception approval additionally rechecks lender KYC, signed/current agreement, program capacity, and the exact effective policy. Approval is valid for 24 hours only. Initial selection and rerouting reject an older approval; when a replacement request is created, the prior stale approval is atomically marked `expired` and that cleanup is recorded in the new request audit metadata.

Programs may also carry an optional numeric daily submission limit. The operating day is calculated in `Asia/Kolkata`; a bounded database aggregate—not a row-limited API event fetch—counts current immutable `case_sent_to_lender` events and returns exact used/remaining/exhausted values even above 1,000 submissions. Recommendation returns `PROGRAM_DAILY_CAPACITY_EXHAUSTED` as an explainable hard exclusion when the limit is reached, and the admin program register displays live usage. Initial selection and reroute acquire the same program-scoped transaction lock, recount usage, and reject the write at the database boundary, preventing simultaneous requests from overshooting the cap. Admins can change or remove the cap only through **Set daily cap**, with a mandatory reason and atomic audit evidence; retired programs cannot be changed.

Exception creation and maker-checker review are private row-locking database workflows. Direct service-client exception inserts and updates are revoked, so concurrent duplicate requests, stale approvals, or API-level check/write races cannot bypass the evidence lifecycle. Request/review state and their complete immutable audit evidence commit in the same transaction; an audit failure rolls back the exception action.

- Initial recommendation/no-match persistence records engine version, report/lead lineage, decision type, and result count atomically with its audit. Identical idempotent replay returns before audit insertion, preventing duplicate decision or audit rows.
- Every application stage transition atomically binds the application update, stage event, terminal outcome, and any generated payout/GST reconciliation evidence to a canonical audit event containing routing, commercial, amount, reason, and occurrence-time lineage.

Normal file progression follows a governed forward-only stage matrix. Operational exits to `rejected` or `rerouted` are allowed before settlement, while `rejected`, `rerouted`, and `disbursed` are terminal and cannot be reopened. Duplicate and backward stage changes are rejected. Sanction and disbursal outcomes require positive sanctioned/disbursed amounts respectively.

Stage events and lender outcomes are reporting-only tables for service clients. Only governed selection, reroute, and application-transition database workflows can write them, preserving one atomic chain from application status through terminal outcome and disbursal payout creation. The pre-migration compatibility helper is not a writer once this foundation is installed.

Every governed progression requires an application-bound routing decision with stable lender and program IDs. Rejection additionally requires an active canonical reason from the partner taxonomy (falling back to the global taxonomy); the database stores that canonical code in both the stage event and outcome, so API bypasses and future integrations cannot introduce free-form reporting categories.

Canonical rejection reasons are administered through `save_lender_rejection_reason`. Codes and partner scope become immutable after creation, descriptive fields can be revised, and obsolete reasons are deactivated instead of deleted so historical outcomes retain meaning. The global `OTHER` fallback cannot be deactivated. Direct taxonomy DML is denied to API roles.

The onboarding/governance workspace includes the taxonomy register and editor. Leave partner UUID blank for a global reason; use a partner UUID only for a scoped override. Editing locks code and scope in the UI and database, while the Active toggle supports non-destructive retirement.

Every stage insert must match the application's partner, current status, bound lender/program decision, prior stage, and monotonic application timeline; future or pre-application events are rejected. Terminal outcomes must match the corresponding immutable stage event at the same timestamp and carry the same routed lender/program IDs. Approval/disbursal amounts and rejection taxonomy evidence are revalidated on direct inserts, protecting funnel and TAT analytics from fabricated rows.

The embedded database gate exercises both terminal branches: sanction/disbursal with economic materialization and rejection with an active canonical code. It proves an unknown code rolls back, valid application/stage/outcome reason evidence remains identical, exactly one terminal event is written, and the outcome cannot be edited afterward.

The File Process UI exposes only the current stage and valid future transitions. It collects the positive sanction/disbursal amount or structured rejection evidence before sending the transition, and disables terminal-file submission/rejection shortcuts.

File Process treats its API as authoritative: loading, genuinely empty, and unavailable states are rendered separately, failures never fall back to demo files, and **New File** routes operators into the consent-backed eligibility workflow.

Demo eligibility seeding is development-only and requires an explicit opt-in. Production runtime denies it regardless of environment flags, before any CRM store or database access; sample lender/rate data must never be treated as verified policy evidence.

For persisted partner files, a normal transition is committed by `transition_lender_application`. The CRM status, status history, immutable stage event, terminal outcome, and—on disbursal—the commercial-derived payout, tax, and reconciliation item are written in one locked PostgreSQL transaction. Concurrent stale updates fail instead of overwriting a newer stage. The legacy JSON store is synchronized only after this authoritative transaction.

Immutability is enforced by PostgreSQL, not only by API convention. Stage events, outcomes, invoice payments, payment allocations, invoice adjustments, and Lender Intelligence audit logs reject updates and deletes. A recommendation routing decision permits only its one-time application binding; its engine, input, and result evidence cannot change, and the complete decision is immutable afterward.

Audit entries are created only through a private bounded registration workflow. Actor email is resolved from the canonical authenticated user record rather than trusted from request code; direct service-client inserts are revoked, while reporting reads remain available.

Policy rules are writable only while their parent version is `draft`. Review submission freezes the policy content and permits only `in_review -> published/rejected -> retired` governance transitions; history cannot be deleted. Commercial economics follow the same pattern: editable in draft, frozen in review, and limited to approval/rejection plus active expiry/termination transitions. Corrections require a new version.

Publishing and commercial activation are immediate operations, so their effective timestamp cannot be in the future. A deferred database dependency check lets a policy replacement retire the old version and publish its replacement atomically, but rejects any completed transaction that leaves an active program without a current published policy. An active lender cannot be paused or offboarded until its active programs are paused or retired.

Policy version creation locks the parent program before allocating its sequence number and prevents parallel draft/review branches. Submission locks the draft and revalidates source reference, review date, enabled rules, and independently verified current document evidence. Version and rule tables are read-only to service clients; draft/rule replacement and every lifecycle transition are private workflows.

A published policy can be manually retired only after its program is paused or retired. The retirement workflow locks both records, requires evidence, closes the effective window, preserves historical decision references, and emits an audit event. Publishing a replacement remains the preferred zero-gap path because it retires the prior version atomically.

Unusable policy or commercial drafts must be discarded through their evidence-bearing workflow. Discarding changes the draft to a terminal rejected record rather than deleting it, releases the scope for a new draft, and preserves who discarded it, when, and why.

Commercial draft creation locks the lender before allocating a scope-specific version, prevents competing draft/review terms, validates lender/program/partner ownership, payout/slab economics, GST/reverse-charge settings, clawback terms, and source-reference bounds. The commercial ledger is read-only to service clients; creation, review, activation, expiry, and termination are governed workflows.

Finance can terminate only an active commercial. The termination workflow locks the version, requires bounded operational evidence, validates the effective timeline, closes the effective window, preserves historical payout linkage, and writes an audit event. Existing disbursal/reconciliation evidence remains linked to the version; new disbursals can no longer select it.

The governed operating-status action performs that shutdown order atomically: active programs are paused before a lender pause and retired before lender offboarding. Offboarding is terminal. Lender code, partner ownership, and creation provenance never change; legal name and regulated lender type freeze once the lender enters an operating state.

Onboarding, KYC, and agreement status changes follow database state machines. Draft onboarding must enter due diligence before activation; active lenders only pause or offboard, and offboarding is terminal. Verified KYC can expire but cannot reset to pending, rejected/expired KYC must be reviewed or re-verified, and a terminated agreement cannot be revived in place—a new governed agreement record/evidence cycle is required. Application rejection capture loads the active canonical taxonomy for the current partner, preferring a partner-specific definition when its code overrides a global code. Both the detail workflow and inline stage control reject stale or fabricated codes before the server repeats the active scoped lookup.

## Commercial and invoice lifecycle

Commercial: `draft -> in_review -> active -> expired`

Invoice: `draft -> raised -> part_paid -> paid`

Invoice identity, lender/partner source, subtotal, tax, total, due date, and creation evidence are immutable after creation. Header paid and adjustment balances must equal their append-only ledgers on every update. Only documented lifecycle transitions are accepted; part-paid requires an open balance, paid requires exact settlement plus timestamp, and cancellation requires zero ledger activity plus reason evidence.

The invoice recipient block is sourced from the governed lender master: legal/display name, registered billing address, GSTIN, and finance email. Draft lenders may save incomplete billing data, but activation and all new routing require the complete validated identity. At invoice creation, both recipient and issuer legal/tax/contact identity are copied into immutable JSON snapshots. Rendering reads these snapshots first, so later lender-master or invoice-settings changes cannot rewrite historical artifacts; live joins are retained only as a legacy fallback. Bank-account credentials are deliberately not stored in plaintext in this foundation.

- Flat, percentage, and amount-slab payouts calculate automatically on disbursal.
- Commercial submission records its maker; a different admin may approve or reject it with mandatory evidence.
- Policy draft creation, submission, independent publication/rejection, retirement, and draft discard commit lifecycle state plus source/checksum/effective-date/reviewer evidence atomically. The API no longer pre-reads mutable submission state or adds a fallible audit after commit.
- Lender/program creation and draft edits, lender activation/pause/offboarding, and program lifecycle/capacity changes commit canonical state and audit evidence together. Activation readiness and current-policy validation remain enforced under database locks rather than race-prone API pre-reads.
- Historical policy restoration atomically copies the prior rule set into a new draft and records source/restored versions, reason, checksum, and exact copied-rule count. Draft rule replacement locks the policy and commits the complete new rule set plus its rule-count audit in one transaction.
- Private document metadata registration and independent verification/rejection commit with checksum, ownership, expiry, reviewer, and audit evidence atomically; failed registration still triggers API cleanup of the uploaded private object. Rejection-taxonomy create/update actions likewise commit canonical code/category/status and audit together.
- Audit and compliance registers export only through the admin-authorized `/api/admin-lender-intelligence/export` route. The default window is 30 days, the maximum is 90 days/5,000 rows, optional partner scope is UUID-validated, spreadsheet-formula prefixes are neutralized, and the download is no-store. Export metadata is written to the immutable audit ledger before any CSV bytes are returned; an audit failure blocks the download.
- Compliance CSVs intentionally omit free-text issue detail and resolution narratives, retaining structured issue/application/lender/program identifiers, taxonomy, status, ownership, and timestamps. System-generated TAT findings reference application IDs rather than borrower names. Detailed narratives remain visible only inside the authenticated operational workspace.
- Compliance issue claim, resolution, risk acceptance, and reopening lock the finding and atomically record previous/current status, ownership, note, and resolution evidence. No compliance lifecycle state can commit without its canonical audit event.
- Commercial draft creation, submission, independent approval/rejection, active-term termination, and draft discard each commit their governed state and immutable audit evidence atomically. The API does not pre-read mutable commercial state or append a fallible audit after commit.
- Configured GST is calculated on the expected payout and carried separately into the invoice; reverse-charge terms produce zero invoice tax.
- Partner-specific commercial terms take precedence, with an explicitly global commercial used only as fallback. Another partner's terms are never considered.
- Reconciliation inserts independently revalidate the matching disbursal outcome, lender/program identity, partner/global commercial scope, historical effective window, payout basis/slab, GST, and initial readiness. Direct integrations cannot inject a different payout or tax amount than the immutable commercial version calculates.
- Reconciliation rows are reporting-only for service clients. Creation, manual custom valuation, invoice attachment/release, receipt allocation, disputes, settlement, and write-off mutations are restricted to private database workflows.
- A database uniqueness invariant allows only one current active commercial for each partner/lender/program scope, including global scopes.
- Custom terms intentionally calculate zero until finance records the reviewed amount and evidence through **Set payout**.
- A disbursal with a calculable flat, percentage, or slab commercial creates an `invoice_ready` reconciliation item.
- Every disbursal creates a reconciliation item even when no active commercial covers its timestamp. Missing coverage remains `unbilled` with zero assumed payout and creates a critical data-quality issue instead of disappearing from finance reporting.
- A custom commercial creates an `unbilled` item with zero assumed payout. Finance must use **Set payout** with a positive approved amount and evidence; the locked database transaction applies GST/reverse-charge rules and moves it to `invoice_ready`. The amount, calculated GST, approval reference, state transition, and canonical audit event commit together; audit failure leaves the item untouched and unbilled.
- Custom or otherwise non-calculable terms remain visibly unbilled with an evidence note and produce a payout-readiness issue until finance resolves the amount.
- Dispute opening, non-invoice payment settlement, restoration into the invoice lifecycle, and write-off each lock their source rows and commit the accounting state plus a canonical audit event atomically. The API does not pre-read mutable finance state or append a fallible post-commit audit.
- The finance register shows the payout-readiness evidence note. **Set payout** is offered only for an attached `custom` commercial; missing coverage or invalid slab coverage must be corrected through governed commercial terms rather than an unsupported manual override.
- Only `invoice_ready` items can be selected for invoicing, and the database rejects a non-positive invoice total.
- One invoice may contain multiple reconciliation items only when they belong to the same partner and lender.
- A lender-payout reconciliation item represents money receivable from the lender. Its invoice direction is derived as `receivable` by the server and revalidated by PostgreSQL; callers cannot relabel the same economic evidence as a payable.
- Partner commission terms use a separate versioned contract scoped to partner and optionally lender/program. Draft terms require a source reference, independent maker-checker activation, a disbursal eligibility event, GST/TDS rates, and payment terms. A disbursal atomically materializes one immutable payable with its exact terms snapshot. Outgoing settlement uses a second maker-checker boundary: one admin submits an amount, UTR/reference, idempotency key, and instruction evidence; a different admin must approve or reject it. Approval rechecks the live open balance and atomically creates the immutable partial/final payment. Direct settlement RPC access is not granted to the service API role. These rows never reuse or relabel lender receivable invoices.
- Commission activation requires an independently verified partner payout profile. The profile stores legal/tax/contact identity, IFSC, payment-provider beneficiary reference, and only the last four characters of PAN/account identity—never the full PAN or bank account number. Each payable freezes the exact verified beneficiary-profile version and masked payment coordinates, so later profile replacement cannot rewrite historical payment evidence.
- Active commission contracts can be terminated only with audited evidence; historical payables keep their original terms snapshot. Open partner payables can be held, disputed, released, or written off only through their locked audited lifecycle. Both scheduled and manual compliance scans surface overdue partner payables, escalating items older than 30 days to critical while preserving claimed or accepted-risk findings.
- Paid partner commissions can enter a separate recovery workflow without changing the original payable/payment evidence. Registration locks the payable, caps all open/disputed/recovered claims at cash actually paid, requires a canonical trigger and evidence, and creates an immutable claim. A different admin resolves it as disputed, recovered (with collection reference), or waived. Finance can export the bounded recovery register; narrative evidence and borrower PII are excluded.
- Invoice creation requires a future due date (15 days by default). Raising is a locked database transition that rechecks positive value, future due date, draft status, and linked reconciliation evidence.
- Invoice numbers use an atomic fiscal-year sequence (`LND26-27-000001` format). Number allocation occurs inside the same transaction as source-item locking and invoice creation, preventing concurrent duplicates and rolling back the allocation when creation fails.
- Every non-cancelled invoice exposes an admin-authenticated PDF containing issuer/lender/partner identity, source application lines, disbursal and payout values, GST, adjustments, payments, outstanding balance, status, dates, and UTR-to-reconciliation-line allocation evidence. Each HTML/PDF access records both line and payment-allocation counts in the Lender Intelligence audit ledger before the artifact is returned, and responses are never cached.
- Invoice creation and allocation are atomic.
- Finance may record partial or full receipts. Each receipt is incrementally allocated in stable line-item order and stored in an immutable payment-to-reconciliation allocation ledger. Payments update invoice and exact line balances in one transaction, reject overpayments, unallocatable amounts, or sub-paise precision, and require a bounded unique idempotency key; cumulative proportional rewrites are not used.
- Sanction capture requires a positive paise-precision sanctioned amount, approved annual ROI, and a positive whole-month tenure; the outcome guard repeats these requirements below the API. Disbursal amounts are also limited to exact paise so the persisted outcome and downstream payout formula cannot diverge through numeric rounding. A disbursal cannot be recorded until the same application, latest bound routing decision, selected lender, and selected program have that complete canonical sanctioned outcome. Historical sanction evidence from a previous lender after rerouting is not accepted. The disbursed amount cannot exceed the sanctioned amount. The immutable disbursal outcome inherits sanctioned amount, approved ROI, and approved tenure from that sanction rather than trusting re-keyed values at payout time; the API performs the same decision-bound prerequisite check before the locked database workflow repeats it.
- Allocation inserts lock and verify both payment and reconciliation line, require the same invoice, enforce exact open-line and receipt limits, and pass a deferred conservation check proving every receipt is fully allocated at transaction commit. Reconciliation source identity cannot change or be deleted; invoiced received balances must equal the immutable allocation sum.
- Payment receipt, line allocations, invoice/reconciliation balances, and canonical audit evidence commit in one transaction. An identical idempotent replay returns the settled invoice before audit insertion, so retrying cannot duplicate either cash or audit evidence.
- Reconciliation status follows a database state machine. Invoice attachment requires an invoice-ready item and exact payout-plus-tax line total; release is limited to an unpaid invoiced line during cancellation. Receipts cannot decrease or exceed expected/invoiced value, part-paid requires a genuine open balance, paid requires settlement evidence, and write-off requires a prior dispute.
- The finance UI derives a stable invoice-plus-UTR idempotency key, so retrying the same receipt is safe; reusing that UTR with changed payment details is rejected.
- Every payment is written to an immutable UTR/reference ledger; replaying the same key is safe only when its amount and reference match.
- Invoice-linked write-offs are allowed only from a disputed item and atomically create an immutable adjustment entry, reduce the net collectible balance, and update invoice status.
- Clawbacks can be registered only against an actually paid reconciliation item. A written-off payout was never received and cannot create a recovery liability; this is enforced in both the database workflow and finance UI.
- The recoverable clawback principal is the lower of contracted payout and actual received amount. Full, percentage, and fixed calculations are capped to that principal, preventing recovery above cash received and excluding GST from payout principal.
- Marking a clawback recovered requires a 3–100 character payment/UTR reference. The database records the exact recovered amount equal to the immutable clawback liability; waived items cannot carry recovery receipt evidence.
- Clawback registration and recovered/waived resolution write their immutable audit evidence inside the same database transaction. A failed audit rolls back the liability or settlement mutation instead of leaving unaudited finance state.
- Clawback registration locks the settled reconciliation row and recalculates the recoverable amount from its immutable payout, commercial terms, and disbursal-relative contractual window. Registration and recovered/waived resolution are private database workflows; direct service-client clawback writes are revoked.
- Writing off one disputed line does not clear an invoice-level dispute while another disputed line remains open; the invoice returns to raised/part-paid/paid only after the final dispute is resolved.
- Invoice-linked items must be settled through invoice payment posting; direct reconciliation payment resolution is reserved for un-invoiced items.
- A disputed invoice item can be restored after validation; the invoice automatically returns to raised, part-paid, or paid only after its last open dispute is resolved.
- An unpaid draft, raised, or disputed invoice can be cancelled with a mandatory reason. Cancellation atomically releases its items back to invoice-ready/unbilled state. Any payment or adjustment permanently blocks cancellation.
- Cancellation status, source-line release, reason, and canonical audit event commit in the same transaction. Audit failure rolls the reversal back, keeping both invoice and reconciliation lines in their prior states.
- Invoice numbers, headers, receipts, allocations, adjustments, and fiscal sequences are write-accessible only through governed `SECURITY DEFINER` finance workflows. Even service-role API clients have reporting-only table access, preventing direct inserts from bypassing line locks, numbering, idempotency, allocation, or settlement conservation.
- Invoice fiscal-sequence allocation, header creation, reconciliation-line attachment, calculated totals, and canonical audit evidence commit atomically. Audit failure rolls back the invoice and sequence increment together, leaving no unaudited invoice or consumed sequence gap.
- Raising a draft invoice writes its issued timestamp and canonical audit evidence in the same locked transaction. An audit failure leaves the invoice in draft rather than producing an unaudited issued document.
- Every invoice creation/raise/cancel, manual payout valuation, payment posting, reconciliation resolution, and commercial review transition verifies the actor against the canonical Supabase authentication directory at the database boundary; null, unknown, or fabricated operator identities are rejected before mutation.
- The same canonical identity check applies to application transitions, policy drafting/rules/review/publish/restore, routing decisions and exceptions, lender/program lifecycle changes, compliance issue management, private-document registration, and clawback registration/resolution.
- Post-disbursal clawbacks are calculated only from the immutable commercial version attached to the payout. Supported terms are full, percentage, or fixed recovery within a configured day window.
- A clawback source and amount cannot be edited or deleted. An open case may be closed once as recovered or waived, with resolution actor, timestamp, and evidence.

## Admin API actions

`POST /api/admin-lender-intelligence/catalog`

- `preview_bulk_import`: validates and classifies a lender/program batch without mutation.
- `commit_bulk_import`: atomically creates or updates draft lender/program records after the same server-side validation.

- `upsert_lender`
- `upsert_program`
- `create_policy_draft`
- `replace_policy_rules`
- `submit_policy`
- `publish_policy`

`POST /api/admin-lender-intelligence/operations`

- `create_commercial_draft`
- `submit_commercial`
- `activate_commercial`
- `reject_commercial`
- `set_manual_payout`
- `create_invoice`
- `raise_invoice`
- `record_payment`
- `update_reconciliation`
- `register_clawback`
- `resolve_clawback`
- `cancel_invoice`

## Required operational controls

The dedicated `/admin-lender-intelligence/compliance` workspace and `/api/admin-lender-intelligence/compliance` read boundary require `compliance.read`; they do not require or expose catalog/finance access. Conversely, `catalog.read` returns only lender/program/policy/taxonomy/capacity/schema catalog data and cannot read compliance issues, audit history, or private-document metadata. The onboarding workspace requests both boundaries independently and degrades to catalog-only content when compliance access is not granted. The compliance workspace shows bounded issue custody, private document metadata/access, the latest 50 scheduled scan runs, and a minimized audit register without staff email or narrative. It is directly discoverable from the admin sidebar and Lender Intelligence navigation. Issue lifecycle mutations continue to require `compliance.manage` and execute through the actor-bound database workflow.

- Lender-master creation and edits run only through the private `save_lender_master` workflow. A new lender always starts as draft with pending KYC and agreement; later status changes are row-locked and checked against the onboarding, KYC, agreement, readiness, identity, and shutdown rules. Direct lender-master DML is denied even to the service API role.
- Lender-program creation and content edits run only through `save_lender_program`. It validates lender ownership, tenant scope, bounded identifiers/audience lists, numeric bands, SLAs, and metadata; new and editable records must remain draft. Program activation, pause, capacity, and retirement continue through the separate locked lifecycle workflow. Direct program-master DML is denied to API roles.

- The hourly `/api/admin-lender-intelligence/sla-scan` job requires Vercel `CRON_SECRET` and a Vercel plan supporting three cron jobs and hourly frequency. Readiness and partner-payable scans execute inside one advisory-locked database transaction: either both commit or neither does. Every successful scheduled run stores its component counts, total, start, completion, and run ID in the read-only `lender_compliance_scan_runs` evidence register.
- A manual compliance refresh uses a separate actor-bound database wrapper: the scan and immutable audit evidence commit together or roll back together. The no-argument scanner is reserved for the authenticated scheduler route.
- The same scan creates a collections issue for every raised, part-paid, or disputed invoice past its due date with an outstanding balance. Severity escalates to critical after 30 days, and the invoice creator receives one deduplicated notification linking to finance operations.
- At 75% of the configured login SLA, the originating operations user receives one deduplicated warning per application stage.
- After any configured login, sanction, or disbursal SLA is breached, the user receives one deduplicated breach notification and the compliance issue board is updated.
- Compliance issues follow `open -> in_progress -> resolved` or `open/in_progress -> accepted`. Claiming assigns the current admin; resolution requires evidence; risk acceptance requires a longer explicit rationale; closed issues can be reopened with a reason.
- Compliance findings are reporting-only for service clients. The readiness scanner exclusively creates or refreshes findings, while the row-locking lifecycle workflow exclusively handles claim, resolve, risk-accept, and reopen actions.
- Hourly scans preserve `in_progress` ownership and accepted-risk evidence while the underlying condition remains. Open system issues auto-clear when the condition disappears; a recurring resolved issue reopens on the next scan.

## KPI evidence contract

Headline operational rates use a rolling 90-day sent-date cohort and include their numerator, denominator, cohort timestamps, and generated timestamp. Approval and rejection use terminal lender decisions only; unresolved files are shown separately. Disbursal uses only files that have matured for 30 days. Match rate uses completed eligibility reports. Rates and TAT values are hidden until their denominator/sample reaches 20, except policy freshness, whose complete active-program population is shown whenever at least one program exists.

The performance workspace applies the same contract to lender, program, product, and partner breakdowns. Expand any row to open its source applications in File Process; the evidence list is capped at the 100 most recent IDs while aggregate metrics remain uncapped database calculations.

Similar-profile performance uses only fixed score, monthly-income, requested-loan, and employment bands derived from immutable routing inputs joined to canonical outcomes. It never returns borrower names, contact details, PAN, or bureau payloads. Approval and rejection remain hidden until the terminal sample reaches 20; override rate uses the same minimum on all routed samples. This is descriptive evidence, not an approval prediction. The response declares no model version and keeps deterministic policy routing as the fallback.

## Evidence input limits

- A routing decision accepts at most 1 MB of normalized input evidence and 2 MB or 500 ranked results. Oversized snapshots must be reduced before retrying; do not remove decision-critical policy/version references.
- Application status history is capped at 1 MB. Notes and rejection details are capped at 2,000 characters, and reason codes at 50 characters.
- Sanctioned/disbursed values cannot exceed 1 trillion, approved ROI cannot exceed 100%, and approved tenure cannot exceed 1,200 months.
- Operational event timestamps may tolerate at most five minutes of clock skew into the future and cannot predate the application.

- Use verified lender documents or authorized lender feeds as policy sources.
- Store policy documents in private storage only.
- Never expose customer PII, bureau payloads, or partner commercials in cross-partner responses.
- Do not publish demo lender values as real policy.
- Review open critical data-quality issues before routing production cases.
- Investigate high override rates and capture override reasons.
- Interpret approval/rejection rates only from terminal decisions; pending files are excluded from the denominator.
- Treat small samples as directional and always display the sample size beside TAT metrics.

## Verification checklist

- Admin and non-admin access tests
- Cross-partner isolation tests
- Maker-checker same-user rejection tests
- Policy effective-date rollover tests
- Rule boundary and missing-input tests
- Policy field/operator/value/evidence taxonomy tests
- Lender deactivation and capacity-pause tests
- Arbitrary lender submission rejection test
- Duplicate submission/idempotency test
- Stage-event ordering and TAT test
- Forward, backward, duplicate, and terminal application-transition tests
- Concurrent stale-transition and atomic status/event/outcome/payout transaction tests
- Disbursal payout test for flat, percentage, and every slab boundary
- Single-lender invoice grouping test
- Fiscal-year invoice sequence concurrency, format, and rollback test
- Partial and full payment allocation tests
- Duplicate payment-idempotency and overpayment rejection tests
- Invoice-linked write-off and adjustment-ledger tests
- Dispute restoration and unpaid-invoice cancellation tests
- Clawback boundary, calculation, immutability, and resolution tests
- Reconciliation variance test
- Audit-log completeness test
- Secured invoice PDF authorization, no-cache, access-audit, escaping, line-item, and total tests
- Admin-only audit/compliance export authorization, bounded-window, row-cap, no-cache, audit-before-release, and CSV formula-injection tests
- Compliance claim, resolution, risk-acceptance, reopen, and scan-preservation tests
- Overdue invoice detection, aging escalation, outstanding-balance, and notification-deduplication tests
- Production smoke test without paid bureau/API calls
- Static migration checks for duplicate columns, table dependency order, RLS coverage, function grants, and balanced function bodies

## Current rollout limitation

The migration is committed as source but is not applied automatically. Until it is applied, the existing legacy lender matcher remains the eligibility fallback and the new admin catalog/operations pages cannot load production data.

The local embedded-PostgreSQL gate additionally proves both money directions. The receivable path covers governed commercial maker-checker approval, sanction and disbursal evidence, percentage payout plus GST valuation, invoice creation and raising, exact allocation conservation, full settlement, idempotent payment replay, and contractual clawback collection. The payable path covers masked beneficiary verification, partner commission maker-checker activation, disbursal-time tax/TDS/net-payable materialization, same-maker payment rejection, independent full settlement, paid-cap enforcement, and maker-checker recovery collection. This is structural/runtime evidence only; the controlled production case in the completion audit is still mandatory.

The same embedded journey registers a private expiring lender document, runs the actor-bound readiness scan, claims its generated issue, and proves that later scans preserve both claimed ownership and accepted-risk resolution evidence.

Export authorization is dataset-specific. Audit and data-quality registers require `compliance.read`; partner payable, outbound-payment approval, and recovery registers require `finance.read`. Holding one read capability never implies the other.
