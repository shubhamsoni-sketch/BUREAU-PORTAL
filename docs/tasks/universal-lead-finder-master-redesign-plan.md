# Universal Lead Finder master redesign plan

Status: approved for redesign by Ketav. Implement phase-wise; preserve existing DSA/Fintech data until verified.

## Core objective

Turn Lead Finder into a long-term reusable data asset system.

Every paid Google Places / Gemini / future website-scrape call must create or improve reusable lead inventory. The system should preserve data, prevent duplicate paid calls, and make future marketing/campaign/CRM workflows easy.

## Product principle

- One master lead database.
- UI tabs are filtered views, not separate data silos.
- No Google paid call before user approval.
- Reuse existing place IDs and coverage before spending again.
- Preserve excluded/irrelevant records for duplicate prevention and audit; do not hard delete by default.
- Reclassification must cost zero Google API calls.

## Final Lead Finder tab structure

1. `DSA Data`
   - Filtered view from the master table.
   - Shows `lead_type = dsa`.
   - Existing DSA records must remain intact.

2. `Fintech Data`
   - Filtered view from the master table.
   - Shows `lead_type = fintech`.
   - Existing cleaned fintech/lending data must remain intact.

3. `Universal Finder`
   - AI prompt-based discovery workflow.
   - User describes the audience in plain language.
   - Gemini converts prompt into a structured plan.
   - App shows yield forecast + cost preview.
   - Google Places runs only after explicit approval.

4. `Lead Library`
   - User-facing master data view.
   - Shows all lead types from the master table.
   - Default view should be simple and not overwhelming.

5. `Runs & Cost`
   - Search history, cost audit, saved/reused counts, failed runs, warnings.

6. `Settings`
   - API health, TTL, pricing config, allowed fields, budgets, templates.

## Master Supabase table

Create a single canonical table:

`lead_finder_master`

### Purpose

Store DSA, fintech, aggregator DSA, restaurants, builders, CA/finance, and future custom lead types in one reusable table.

### Required columns

- `id`
- `place_id`
- `lead_type`
- `search_intent`
- `search_prompt`
- `search_keyword`
- `business_name`
- `phone`
- `phone_type`
- `is_valid_mobile`
- `email`
- `website`
- `google_maps_url`
- `address`
- `city`
- `state`
- `latitude`
- `longitude`
- `rating`
- `review_count`
- `google_types`
- `matched_aggregator`
- `matched_keywords`
- `confidence`
- `target_fit`
- `score`
- `score_reasons`
- `status`
- `data_source_quality`
- `marketing_status`
- `source_run_id`
- `first_seen_at`
- `last_seen_at`
- `last_fetched_at`
- `created_at`
- `updated_at`

### Suggested enum values

`lead_type`

- `dsa`
- `fintech`
- `aggregator_dsa`
- `restaurant`
- `builder`
- `ca_finance`
- `custom`

`status`

- `ready`
- `review`
- `excluded`
- `hidden`

`data_source_quality`

- `google_places`
- `manual_upload`
- `website_scrape`
- `imported_sheet`
- `crm_import`

`marketing_status`

- `not_contacted`
- `contacted`
- `interested`
- `not_interested`
- `do_not_contact`

## Run history table

Create/upgrade:

`lead_finder_runs`

### Required fields

- `id`
- `user_prompt`
- `gemini_generated_plan`
- `approved_plan`
- `lead_type`
- `search_intent`
- `locations`
- `keywords`
- `requested_count`
- `budget_cap_inr`
- `expected_yield`
- `text_search_calls`
- `place_details_calls`
- `gemini_calls`
- `website_scrape_calls`
- `records_found`
- `new_records`
- `reused_records`
- `duplicates_skipped`
- `excluded_records`
- `estimated_cost_inr`
- `status`
- `error_message`
- `started_at`
- `completed_at`

## Coverage/cache table

Create/upgrade:

`lead_search_coverage`

### Required fields

- `city`
- `state`
- `lead_type`
- `keyword`
- `last_search_at`
- `next_refresh_at`
- `place_ids_count`
- `status`
- `source_run_id`

Default TTL: 30 days.

If the same `city + state + lead_type + keyword` is fresh:

- Do not call Google Text Search.
- Do not call Place Details.
- Return master-table results.

## Universal Finder workflow

1. User enters a prompt.
2. Gemini creates structured plan.
3. System checks DB coverage and existing master records.
4. System creates AI Yield Forecast.
5. System calculates cost estimate in INR.
6. User reviews plan.
7. User clicks `Approve & Run`.
8. Only then Google Places can run.
9. Results save into `lead_finder_master`.
10. Lead Library shows clean records.

## Gemini plan output

Gemini should produce structured JSON with:

- `lead_type`
- `search_intent`
- `locations`
- `keywords`
- `required_fields`
- `exclude_rules`
- `confidence_rules`
- `score_rules`
- `recommended_count`
- `risk_warnings`
- `recommendation`

Example prompt:

> MP Gujarat me Andromeda aur RU Loans DSA nikaalo

Expected plan:

- Lead type: `aggregator_dsa`
- Locations: target MP/Gujarat cities
- Keywords: Andromeda loan DSA, Andromeda loan partner, RU Loans DSA, RU Loans partner, loan DSA partner
- Exclude: stock broker, software, payment, tax/GST-only, pure insurance
- Recommendation: direct aggregator matches may be low in smaller cities; include generic DSA keywords.

## AI Yield Forecast

Before a run, show:

- Existing DB matches
- Estimated raw results min/max
- Estimated unique leads min/max
- Estimated valid mobile min/max
- Estimated high-confidence min/max
- Duplicate risk: low / medium / high
- Fresh Google calls needed
- Approx cost INR
- Confidence in forecast
- Recommendation

### Forecast sources

Use in this order:

1. Same city + state + keyword coverage history.
2. Same lead type + city history.
3. Similar keyword/city history.
4. Gemini heuristic fallback.

### UX copy examples

If request is too narrow:

> Expected yield is low: 0-5 direct matches. Recommendation: include nearby cities or add generic loan DSA partner keywords.

If cache exists:

> Fresh coverage is available. Recommended: reuse DB. Fresh Google calls: 0.

## Cost guard rules

Mandatory rules:

- No Google call before approval.
- Google and Gemini keys server-side only.
- 30-day coverage TTL by default.
- Existing place ID = no paid Details call.
- Reclassification = zero Google API calls.
- Budget cap stops run before excess paid calls.
- Use cheapest first stage possible.
- Use minimal fields/field masks for discovery.
- Place Details only when required fields are missing.
- Centralized configurable pricing, not scattered hardcoding.
- Cost estimates must show INR.

## Lead Library UX

The user-facing master view should be called:

`Lead Library`

Avoid showing all technical columns by default.

### Default views

- `Ready Leads`
- `Needs Review`
- `Excluded`
- `All Records`

Default view: `Ready Leads`.

### Default visible columns

- Business Name
- Lead Type
- City
- Phone
- Website
- Confidence
- Score
- Actions

### Advanced columns

Hidden until `Advanced` is enabled:

- place_id
- source_run_id
- search_keyword
- google_types
- cache status
- cost source
- timestamps
- classification details

### Row detail drawer

Clicking a row opens a right-side drawer with:

- Full address
- Google Maps link
- Website
- Rating/reviews
- Matched keywords
- Why relevant
- Source prompt/run
- Duplicate/history
- Score reasons
- Classification reasons

## Existing DSA/Fintech migration

Do not delete old data during first migration.

### Steps

1. Create `lead_finder_master`.
2. Backfill existing DSA records as `lead_type = dsa`.
3. Backfill existing Fintech records as `lead_type = fintech`.
4. Preserve excluded fintech records as `status = excluded`.
5. Keep old `dsa_prospect_master` as backup.
6. Verify counts.
7. Switch APIs/UI to master table.
8. Only later deprecate old table after explicit confirmation.

## Templates

Universal Finder should provide templates:

- DSA Generic
- Aggregator DSA
- Fintech Lending
- CA Loan Consultant
- Restaurant Finder
- Builder Finder
- Custom

Template click should generate/fill a plan. It must not auto-run paid Google calls.

## Suggested UI direction

Use a premium but simple dashboard style:

- Clean left sidebar.
- Top KPI cards.
- Prompt-to-plan card.
- Cost Guard badge.
- “No Google calls before approval” warning.
- Gemini Plan Preview.
- Lead Library / Master Data table below.
- Strong filters but hidden advanced/technical fields.

Keep user conscious of what will spend money and what will reuse saved data.

## Acceptance tests

Before production completion:

- Existing DSA tab count matches expected migrated DSA records.
- Existing Fintech tab count matches expected cleaned fintech records.
- Universal Finder can generate a plan with Gemini.
- Google calls are zero before approval.
- Fresh same search within TTL uses DB/cache and has zero Google calls.
- Existing place ID skips paid details calls.
- Reclassification uses zero Google API calls.
- Yield forecast is shown before run.
- Cost estimate is shown in INR.
- Budget cap stops paid calls safely.
- Results save to `lead_finder_master`.
- DSA/Fintech tabs are filtered views from `lead_finder_master`.
- Lead Library filters work.
- Export works from master table filters.
- API keys are server-side only.
- Build passes.
- Live browser test passes.

## Implementation phases

### Phase 1: Schema and migration

- Add master/runs/coverage schema.
- Write migration/backfill script.
- Verify counts without deleting old tables.

### Phase 2: API switch

- Read results from `lead_finder_master`.
- Keep DSA/Fintech views by filter.
- Update export endpoints.

### Phase 3: UI redesign

- Redesign Lead Finder tabs.
- Add Lead Library view.
- Keep DSA/Fintech familiar but filter-backed.

### Phase 4: Universal Finder planning

- Add Gemini plan endpoint.
- Validate plan JSON.
- Add editable plan preview.
- Add yield forecast.

### Phase 5: Universal run engine

- Add approval-gated run endpoint.
- Add cache/coverage checks.
- Add Places calls with cost guard.
- Save into master table.

### Phase 6: QA and deploy

- Run build.
- Browser test live.
- Verify no existing data loss.
- Deploy production.

## Explicit non-goals for this redesign

Do not add WhatsApp campaigns, CRM assignment, payment flows, or calling workflows in this phase.

This phase is only the master lead inventory, universal finder, data preservation, cost guard, and clean UI foundation.
