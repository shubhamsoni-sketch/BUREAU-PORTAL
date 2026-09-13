# BUREAU-PORTAL agent environment handoff

Use this file first before doing any BUREAU-PORTAL work. It exists to avoid deploying to the wrong Vercel project or using the wrong Supabase/Google keys.

## Canonical repo and branch

- GitHub repo: `https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git`
- Branch: `main`
- Local working directory used in this session: `/tmp/bureau-portal-MCWEQm`
- Production route to verify Lead Finder: `https://credittrust.in/admin-lead-finder`

## Correct Vercel production target

Do not deploy this app to `creditanalytics-universal` or `creditanalytics-universal-xi`. That is the wrong project for this portal.

- Vercel team/scope: `shubhamsoni-8129s-projects`
- Vercel project name: `bureau-portal`
- Vercel project id: `prj_Me7FNJHwlvwuLNpkIqWMHzDuPse5`
- Vercel org/team id: `team_WKMUBik54XIZ6F9mf0Scibij`
- Primary live domain: `https://credittrust.in`
- Previous handover domain also referenced: `https://portal.credittrust.in`
- `.vercel/project.json` must point to `bureau-portal` before deployment.

Expected `.vercel/project.json`:

```json
{
  "projectId": "prj_Me7FNJHwlvwuLNpkIqWMHzDuPse5",
  "orgId": "team_WKMUBik54XIZ6F9mf0Scibij",
  "projectName": "bureau-portal"
}
```

## Local secret env file

Secrets are intentionally kept out of Git.

- Local-only agent env file: `.env.agents.local`
- Active app env file: `.env.local`
- Both are ignored by `.gitignore`.

Before local work, load env like this:

```bash
set -a
. ./.env.agents.local
set +a
```

If the app expects `.env.local`, copy the local agent env into `.env.local` only on the developer machine:

```bash
cp .env.agents.local .env.local
```

Never commit `.env.local`, `.env.agents.local`, `.env.production.local`, tokens, API keys, Supabase service-role keys, or DB passwords.

## Required environment variable names

The local secret env should include at least:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
NEW_SUPABASE_DB_URL=
NEW_SUPABASE_DB_PASSWORD=
GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
VERCEL_TOKEN=
VERCEL_OIDC_TOKEN=
```

## Supabase production source

- Main Supabase project ref: `qoseffoyxasnqqdrcesb`
- Supabase URL format: `https://qoseffoyxasnqqdrcesb.supabase.co`
- Database host: `db.qoseffoyxasnqqdrcesb.supabase.co`

Use the local secret env file for actual service-role key and database password.

## Google APIs

Google keys must remain server-side unless a key is explicitly meant for browser Maps rendering.

Lead Finder uses:

- Google Places / Maps API key
- Gemini API key
- `GEMINI_MODEL` for the AI planning model

Do not print these keys in terminal output, comments, commits, docs, or final responses.

## Deployment commands

Use the correct team scope every time:

```bash
set -a
. ./.env.agents.local
set +a

npx vercel link --project bureau-portal --scope shubhamsoni-8129s-projects --yes
npx vercel deploy --prod --yes --scope shubhamsoni-8129s-projects
```

A successful deploy should say it was aliased to:

```text
https://credittrust.in
```

## Git workflow

```bash
git status --short
git pull --rebase origin main
git push origin main
```

If push is rejected, fetch/rebase first. Do not force-push unless the user explicitly approves.

## Current Lead Finder verification checklist

After deploy, verify:

- `https://credittrust.in/admin-lead-finder` serves HTTP 200.
- The deployed JS bundle contains:
  - `Find with AI`
  - `Lead Library`
  - `Runs & Cost`
  - `Search brief`
  - `Plan first. Run only after approval.`
- Browser UI should show:
  - no separate `AI Finder` tab
  - top `Find with AI` button
  - right-side AI drawer
  - single clean form, not PPT-style long explanatory cards

## Known authentication note

Directly opening `/admin-lead-finder` may redirect to `/admin` if the browser session is not authenticated on `credittrust.in`. That does not by itself mean deployment failed. Verify with an authenticated admin session or by checking the served bundle.

## Do-not-use targets

These were used earlier by mistake and should not be used for BUREAU-PORTAL production:

- `creditanalytics-universal`
- `creditanalytics-universal-xi.vercel.app`
- `ketavpipaliya-7793s-projects` for this portal deployment
