# Lender Intelligence Release Evidence

Use one copy of this record for each production release. Do not paste access tokens, customer names, mobile numbers, PAN, bank-account data, bureau payloads, policy documents, or confidential commercial values into this file. Store restricted artifacts in the approved evidence repository and record only their access-controlled reference IDs.

## Release identity

| Field                            | Evidence                                            |
| -------------------------------- | --------------------------------------------------- |
| Release/commit SHA               | Pending                                             |
| Deployment URL                   | Pending                                             |
| Deployment ID and timestamp      | Pending                                             |
| Migration                        | `20260912220000_lender_intelligence_foundation.sql` |
| Product owner approval reference | Pending                                             |
| Platform owner                   | Pending                                             |
| QA owner                         | Pending                                             |

## Gate 1 — Database rollout

- [ ] Migration applied successfully to the intended Supabase project.
- [ ] Project reference was independently checked before migration; do not record database credentials here.
- [ ] `/api/admin-lender-intelligence/catalog` returns a healthy embedded schema manifest using a short-lived super-admin session.
- [ ] Critical relations, functions, triggers, RLS, grants, and direct-DML denials are all present.
- [ ] Migration/deployment log retained under restricted evidence reference: `Pending`.

## Gate 2 — Identity and authorization

- [ ] Named restricted, intelligence reader, catalog reader, finance reader, compliance reader, policy maker, independent policy checker, finance maker, independent finance checker, routing reviewer, and super-admin test identities are provisioned through trusted `app_metadata`.
- [ ] `npm run verify:lender-intelligence-rollout` passes the authenticated read allow/deny matrix.
- [ ] The rollout verifier confirms private/no-store/no-referrer/nosniff response controls on invalid-token, super-admin, and scoped-role requests.
- [ ] `npm run verify:lender-intelligence-mutation-authorization` passes with short-lived scoped tokens.
- [ ] Maker/checker production test proves that a maker cannot approve their own policy, document, commercial, beneficiary, payment, recovery, or routing exception.
- [ ] No token is retained in console captures or this record.
- [ ] Authorization evidence reference: `Pending`.

## Gate 3 — Approved operating inputs

- [ ] Product owner approved catalog scope and first product/lenders.
- [ ] Credit owner approved source-bound policies, mapped rules, rejection taxonomy, and review SLA.
- [ ] Finance approved lender billing identity, receivable commercials/tax, partner commission/TDS, beneficiary references, invoice sequence, and opening balances.
- [ ] Compliance approved consent wording/version, retention/deletion schedule, export access, decision-support language, and accepted-risk authority.
- [ ] Data/operations approved application stages, exception reasons, recovery triggers, and historical mappings.
- [ ] Approval pack reference: `Pending`.

## Gate 4 — Controlled end-to-end file

Record only opaque IDs and restricted evidence references.

| Evidence                                       | Result  |
| ---------------------------------------------- | ------- |
| Partner/application/report IDs                 | Pending |
| Consent evidence ID/version                    | Pending |
| Routing decision ID and policy version         | Pending |
| Selection/override/exception evidence          | Pending |
| Login/sanction/disbursal outcome IDs           | Pending |
| Lender reconciliation item and invoice IDs     | Pending |
| Receipt/allocation and idempotent replay proof | Pending |
| Partner payable/payment IDs                    | Pending |
| Lender clawback and partner recovery test IDs  | Pending |
| Bounded export audit event IDs                 | Pending |

- [ ] Routing is explainable and bound to the exact published policy/version.
- [ ] Sanction has positive amount, ROI, whole-month tenure, and paise precision.
- [ ] Disbursal uses the same latest lender/program lineage, does not exceed sanction, and inherits sanction terms.
- [ ] Lender receivable, GST, invoice, receipt allocation, balance, and clawback reconcile exactly.
- [ ] Partner payable, GST/TDS, independently approved settlement, paid cap, and recovery reconcile exactly.
- [ ] Compliance scan and issue custody preserve actor/audit evidence.
- [ ] No customer PII is present in analytics or exported release evidence.

## Gate 5 — Final rollout verification

Run from a clean checkout of the recorded commit:

```bash
npm ci
npm audit --audit-level=low
npm run test:lender-intelligence
npm run verify:lender-intelligence-migration-syntax
npm run verify:lender-intelligence-migration-execution
npm run type-check
npm run build
npm run verify:lender-intelligence-runtime
npm run verify:lender-intelligence-rollout
npm run verify:lender-intelligence-mutation-authorization
git diff --check
```

| Result                             | Evidence       |
| ---------------------------------- | -------------- |
| Local quality-gate output          | Pending        |
| Built production runtime smoke     | Pending        |
| Live rollout verifier output       | Pending        |
| Live mutation authorization output | Pending        |
| Controlled E2E evidence pack       | Pending        |
| Exception/waiver references        | None / Pending |

## Sign-off

Release status remains **not approved** until every checkbox above is closed without an undocumented exception.

| Role                | Name    | Decision | Timestamp | Approval reference |
| ------------------- | ------- | -------- | --------- | ------------------ |
| Product owner       | Pending | Pending  | Pending   | Pending            |
| Credit policy owner | Pending | Pending  | Pending   | Pending            |
| Finance owner       | Pending | Pending  | Pending   | Pending            |
| Compliance owner    | Pending | Pending  | Pending   | Pending            |
| Platform owner      | Pending | Pending  | Pending   | Pending            |
| QA owner            | Pending | Pending  | Pending   | Pending            |
