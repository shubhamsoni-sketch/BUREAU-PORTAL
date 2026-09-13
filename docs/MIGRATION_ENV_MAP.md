# Migration Environment Map

This file is intentionally secret-free. The matching secret values are stored only in ignored local env files.

## Final Main Application

- Purpose: Bureau Portal production application.
- Local env file: `.env.bureau.local`
- Active env file for this repo: `.env.local`
- Git repo: `https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git`
- Supabase project ref: `qoseffoyxasnqqdrcesb`
- Supabase URL: `https://qoseffoyxasnqqdrcesb.supabase.co`
- Vercel project: `bureau-portal`
- Production domain: `credittrust.in`
- Production URL: `https://credittrust.in`

Use this environment for all new Bureau Portal work.

## Prototype / Source Application

- Purpose: Old prototype/source reference for migration only.
- Local env file: `.env.prototype.local`
- Git repo: `https://github.com/pketav/creditanalytics-universal.git`
- Supabase project ref: `ncuszzxymbhzxprecovg`
- Supabase URL: `https://ncuszzxymbhzxprecovg.supabase.co`
- Vercel project: `creditanalytics-universal`
- Production domain: `creditanalytics-universal.vercel.app`

Use this environment only when reading or exporting prototype features/data for migration.

## Working Rule

- Build and deploy new production features in Bureau Portal.
- Treat the prototype as a reference/source system only.
- Do not copy data between Supabase projects unless there is a specific approved migration step.
- Keep both env files local and ignored; never commit secrets.
