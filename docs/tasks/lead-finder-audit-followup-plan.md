# Lead Finder audit follow-up plan

Status: saved for later implementation only. Do not implement until Ketav explicitly approves.

## Context

The Lead Finder browser/live audit found that Mumbai, Delhi, and Bengaluru data was saved, while Hyderabad stopped before paid Place Details because the daily API cost guardrail was reached.

This document preserves the agreed follow-up plan so it can be implemented later after discussion.

## Audit findings

### City data currently saved in `dsa_prospect_master`

| City | Detailed records | Sales Ready | Valid Mobile | Notes |
|---|---:|---:|---:|---|
| Indore | 1001 | 63 | 535 | Imported + searched |
| Mumbai | 58 | 20 | 46 | Details saved |
| Delhi | 58 | 20 | 50 | Details saved |
| Bengaluru | 50 | 20 | 43 | Details saved |
| Hyderabad | 0 | 0 | 0 | Coverage IDs saved, no paid Details fetched |

### Recent run behavior

| Run | Status | Text Search | Details | Cost | Reason |
|---|---:|---:|---:|---:|---|
| Mumbai first | Complete | 9 | 58 | $0.348 | Place IDs found, details fetched until budget cap |
| Delhi first | Complete | 9 | 58 | $0.348 | Place IDs found, details fetched until budget cap |
| Bengaluru first | Complete | 9 | 50 | $0.300 | 94 place IDs found, details fetched until budget cap |
| Hyderabad | Failed | run row shows 0 | 0 | $0 | Budget guardrail stopped before paid Place Details |
| Mumbai repeat | Complete cached | 0 | 0 | $0 | DB/cache reused |
| Delhi repeat | Complete cached | 0 | 0 | $0 | DB/cache reused |
| Bengaluru repeat | Complete cached | 0 | 0 | $0 | DB/cache reused |

Important nuance: Hyderabad coverage exists for all 9 keywords, with 20 IDs per keyword. Google Text Search IDs stage had already saved coverage, but paid Place Details were not fetched. The run row did not record those coverage/search counts because the older failure branch only saved status/error. This is a reporting mismatch, not corruption.

## Irrelevant analysis

Total irrelevant classified records found: 339.

| Segment | Count |
|---|---:|
| CA / accounting | 226 |
| Stock broker / investment | 70 |
| Education | 37 |
| Recruitment / HR | 6 |

Top keywords causing irrelevant records:

| Keyword | Irrelevant count |
|---|---:|
| CA firm | 82 |
| chartered accountant | 32 |
| GST consultant | 25 |
| tax consultant | 20 |
| mutual fund distributor | 20 |
| Finance Consultant | 12 |
| Financial Consultant | 11 |
| Loan Consultant | 11 |
| MSME loan consultant | 11 |
| Finance Services | 7 |
| Business Loan Agent | 7 |

## Recommended implementation plan

### 1. Fix run reporting mismatch

- If a run stops due to budget after coverage/Text Search work, persist those counts in `dsa_extraction_runs`.
- Add/represent status as `stopped_by_budget` or an equivalent user-friendly status instead of plain `failed`.
- Keep cost at zero when no paid Place Details happen.

### 2. Add Hyderabad resume mode

- Use existing Hyderabad coverage IDs.
- Do not call Google Text Search again.
- Fetch only missing Place Details by `place_id`.
- Stop at configured run/daily budget cap.
- Save results to `dsa_prospect_master` so future Hyderabad repeat runs are cached.

### 3. Optimize search keywords

Keep high-intent keywords:

- Loan DSA
- Loan Agent
- Personal Loan Agent
- Business Loan Agent
- Home Loan Agent
- Mortgage Consultant

Review/de-prioritize broad keywords:

- Finance Services
- Financial Consultant
- Loan Consultant, keep only with stronger filters

### 4. Improve irrelevant filtering/classification

Add stronger negative scoring/exclusion for:

- CA / GST / tax / accounting
- mutual fund / stock broker / investment advisor
- education loan-only / overseas education
- job consultancy / HR
- insurance-only

Then reclassify existing data with zero Google calls.

### 5. Improve dashboard clarity

Show separate dashboard numbers:

- Place IDs Found
- Detailed Records Saved
- Cached Records Reused
- Approx API Cost in INR

This avoids confusion where a run finds 100 IDs but only 58 detailed records are saved due to cost guardrails.

### 6. Switch default search strategy to smart keyword ladder

Do not search every keyword blindly for every city.

Default target audience for Lead Finder marketing should be:

- Loan DSA / loan agents
- Small loan consultants
- Personal loan / business loan / home loan agents
- Mortgage / LAP consultants
- Small finance brokers who arrange loans
- Independent agents working with NBFCs/banks
- Local firms whose name/description clearly says loan agency, loan consultant, loan DSA, home loan, business loan, or personal loan

Avoid broad/low-intent audience by default:

- CA / GST / tax consultants
- Stock brokers / mutual fund advisors
- Pure insurance agents
- Education consultants
- Job consultants
- Generic financial services companies
- Banks/NBFC branches unless explicitly running a partnership campaign

Recommended keyword ladder:

1. Loan DSA
2. Loan Agent
3. Personal Loan Agent
4. Business Loan Agent
5. Home Loan Agent
6. Mortgage Consultant

Remove from default search:

- Finance Services
- Financial Consultant

Keep optional/manual:

- Loan Consultant

Proposed behavior:

1. Admin selects city and target count.
2. System searches `Loan DSA` first using IDs-only.
3. Dedupe by `place_id`.
4. If enough new IDs are available, stop searching more keywords.
5. If not enough, move to the next keyword in the ladder.
6. Fetch paid Place Details only for new IDs and only within budget cap.

This should reduce irrelevant data, avoid unnecessary Google API calls, and improve sales-ready lead quality.

### 7. PAN India scale target discussion

Ketav wants to discuss whether a true PAN India dataset should be much larger, potentially 1–2 lakh records.

Current Google Places behavior:

- Direct query `Loan DSA in India` returned only 7 IDs, so national text query is not reliable for total market size.
- City-wise query is the correct method.
- Sample check for `Loan DSA` across 10 major cities returned 195 IDs, averaging 19.5 IDs per city.
- Many cities hit the 20-result first-stage cap, which means actual local inventory can be larger than the first response.

Implication:

- With only one keyword and top 100 cities, raw IDs may be roughly 1,500–2,000 using the current first-page strategy.
- 1–2 lakh PAN India records will not come from one keyword + one simple search per city.
- To reach 1–2 lakh raw records, the system would need a broader city/town list, area-level search, controlled keyword expansion, and possibly grid/nearby strategies.

Possible scale model for discussion:

| Scope | Likely raw IDs | Notes |
|---|---:|---|
| Top 10 cities, `Loan DSA` only | ~150–200 | Based on sample |
| Top 100 cities, `Loan DSA` only | ~1,500–2,000 | First-page cap limited |
| Top 500 cities/towns, 3–6 high-intent keywords | ~20,000–60,000 | Depends on dedupe and city density |
| PAN India 1–2 lakh raw records | Possible only with broader strategy | Needs ward/area/geohash/grid search and strict cost controls |

Important distinction:

- 1–2 lakh raw Google place IDs is different from 1–2 lakh quality DSA leads.
- After dedupe, phone availability, classification, and irrelevant filtering, usable sales-ready leads may be much lower.

Before implementing PAN India scale, discuss and decide:

1. Do we want raw lead volume or high-intent sales-ready leads?
2. What is the monthly Google API budget?
3. Should we target top cities first or all Indian districts/towns?
4. Should we include area-level searches inside large cities?
5. Should we stop when a city reaches enough sales-ready leads?
6. Should low-quality broad keywords be completely disabled by default?

## Do not implement without approval

Do not modify code, run paid Google calls, force refresh, or reclassify existing data until Ketav explicitly approves implementation.
