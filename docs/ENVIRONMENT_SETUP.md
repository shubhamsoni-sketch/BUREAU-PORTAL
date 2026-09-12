# Environment setup

This repo is deployed as **creditanalytics-universal** on Vercel.

## Source of truth

- GitHub repo: `https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git`
- Branch: `main`
- Vercel project: `creditanalytics-universal`
- Production URL: `https://creditanalytics-universal-xi.vercel.app`
- Main Supabase project ref: `ncuszzxymbhzxprecovg`
- Main Supabase URL: `https://ncuszzxymbhzxprecovg.supabase.co`

## Local env

Use `.env.local` for real values. It is ignored by git.

Start from `.env.example`, then fill the real values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_URL`
- `SUPABASE_DB_PASSWORD`
- Google Maps / Places keys
- Gemini key
- other production integrations used by the app

## Vercel env

Vercel production env must point to the same Supabase project:

- public Supabase URL: `https://ncuszzxymbhzxprecovg.supabase.co`
- project ref/id: `ncuszzxymbhzxprecovg`
- DB URL host: `db.ncuszzxymbhzxprecovg.supabase.co`

After changing Vercel environment variables, run a new production deployment. Existing deployments do not automatically reload changed env vars.

## Lead Finder migration

Universal Finder requires the master lead tables from:

`supabase/migrations/20260912143000_universal_lead_finder_master.sql`

Required tables:

- `lead_finder_master`
- `lead_finder_runs`
- `lead_search_coverage`
- `lead_search_coverage_places`

Paid Google Places runs should remain locked until these tables exist in the main Supabase project.
