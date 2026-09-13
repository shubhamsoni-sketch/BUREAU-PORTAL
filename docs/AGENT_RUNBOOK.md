# Agent runbook for parallel work

Use this document when assigning this repo to multiple Codex/AI agents.

## Project identity

- Repo: `https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git`
- Branch used right now: `main`
- Local working directory in this session: `/tmp/bureau-portal-MCWEQm`
- Vercel project: `bureau-portal`
- Production URL: `https://credittrust.in`
- Main Supabase project ref: `qoseffoyxasnqqdrcesb`
- Main Supabase URL: `https://qoseffoyxasnqqdrcesb.supabase.co`

Do not mix this project with the old/other Supabase project refs.

## Environment source of truth

Real secrets live only in `.env.local` and Vercel production env.

Committed reference files:

- `.env.example` — safe env template with placeholders
- `docs/ENVIRONMENT_SETUP.md` — canonical env mapping and setup notes

Current production Supabase must be:

```text
NEXT_PUBLIC_SUPABASE_URL=https://qoseffoyxasnqqdrcesb.supabase.co
SUPABASE_PROJECT_REF=qoseffoyxasnqqdrcesb
SUPABASE_PROJECT_ID=qoseffoyxasnqqdrcesb
SUPABASE_DB_URL host=db.qoseffoyxasnqqdrcesb.supabase.co
```

Never commit `.env.local`, API keys, DB passwords, service role keys, Vercel tokens, or downloaded env files.

## Database status

Universal Finder master tables exist in the main Supabase project:

- `lead_finder_master`
- `lead_finder_runs`
- `lead_search_coverage`
- `lead_search_coverage_places`

Legacy DSA data is available in `dsa_prospect_master`, and Universal Finder data has been migrated/backfilled into `lead_finder_master`.

## Suggested 7-agent split

### Agent 1 — Environment and deployment owner

Scope:

- Maintain `.env.example` and `docs/ENVIRONMENT_SETUP.md`
- Verify Vercel production env points to `qoseffoyxasnqqdrcesb`
- Run production deployments only after build passes
- Keep deployment notes updated

Do not:

- Rotate keys without explicit approval
- Print secrets in logs or final reports

Verification:

```bash
npm run type-check
npm run build
npx vercel deploy --prod --yes
```

### Agent 2 — Supabase/schema owner

Scope:

- Maintain migrations under `supabase/migrations`
- Verify tables, indexes, and safe backfill behavior
- Add future migration notes to `docs/ENVIRONMENT_SETUP.md`

Do not:

- Run broad destructive migration commands
- Enable RLS blindly across the whole database
- Drop or rename existing production tables without approval

Verification:

- Check table existence through REST or SQL
- Confirm Universal Finder APIs can read/write the master tables

### Agent 3 — Lead Finder backend owner

Scope:

- APIs under `src/app/api/admin-lead-finder`
- Cost guardrails
- duplicate/coverage logic
- Google Places field masks
- Gemini plan generation fallback

Do not:

- Add WhatsApp/CRM/campaign/payment features unless explicitly approved
- Store unrestricted raw Google payloads permanently

Verification:

- First identical search can call Google only if coverage is missing/stale
- Second identical search within TTL must use DB/cache and zero Google calls
- Reclassification must make zero Google calls

### Agent 4 — Lead Finder frontend/UX owner

Scope:

- `src/app/admin-lead-finder/page.tsx`
- DSA Data, Fintech Data, Universal Finder, Lead Library, Runs & Cost tabs
- KPI cards, run history, table layout, clean English copy

Do not:

- Add presentation-style text
- Add Hinglish copy to the portal UI
- Unlock paid runs when setup/cost checks are incomplete

Verification:

- Browser check the page
- Buttons do not double-trigger
- KPI cards refresh after data changes
- Run status messages are clear and short

### Agent 5 — Data import/export owner

Scope:

- Import uploaded DSA/Fintech CSV/XLSX into master tables
- Export filtered/sales-ready data
- Preserve `lead_type`, `search_intent`, source run, and upload metadata

Do not:

- Insert duplicate `place_id` records
- Overwrite existing high-quality records with weaker upload data

Verification:

- Import sample file
- Check duplicates skipped/reused
- Export works for DSA, fintech, and master library views

### Agent 6 — Auth/admin QA owner

Scope:

- Admin login flow
- AdminGuard behavior
- API auth with Supabase session token
- Verify admin pages after env switch

Do not:

- Bypass auth in production
- Store passwords in source files

Verification:

- Admin login works
- Admin-only routes redirect correctly when logged out
- Lead Finder APIs reject unauthenticated requests

### Agent 7 — QA and acceptance owner

Scope:

- Full live acceptance checklist
- Browser-based testing
- Console/network error checks
- Regression report before each final deployment

Do not:

- Run paid Google searches without approved count and cost preview
- Approve high-cost runs casually

Verification:

- Login
- Open Lead Finder
- Prepare Universal Finder search
- Verify cost estimate
- Run small approved test only when asked
- Verify DB rows, KPI cards, and run history update
- Repeat identical run and verify zero Google calls when coverage is fresh

## Branching and work safety

Recommended per-agent branch naming:

```text
codex/env-cleanup
codex/supabase-schema
codex/lead-backend
codex/lead-ui
codex/import-export
codex/auth-qa
codex/live-qa
```

Before editing:

```bash
git status --short
git pull --ff-only origin main
git switch -c codex/<task-name>
```

Before handoff:

```bash
npm run type-check
npm run build
git status --short
git diff --stat
```

## Pull request / merge rule

Only merge one agent branch at a time.

After each merge:

```bash
npm run type-check
npm run build
```

Then redeploy only if the change is meant to go live.

## Live paid-run rule

Paid Google Places calls are allowed only when all are true:

1. Master tables exist.
2. Cost estimate is visible in INR.
3. Duplicate coverage check has run.
4. Admin intentionally clicks the final run button.
5. The approved count is small enough for the agreed test.

Default test count should be small, such as 10 or 25. Do not jump to 500/1000 without approval.

## Known current note

The repo is live on Vercel and env is aligned to `qoseffoyxasnqqdrcesb`. Universal Finder schema exists, and master lead data is active in `lead_finder_master`.
