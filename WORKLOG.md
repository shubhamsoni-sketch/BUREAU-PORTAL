# Worklog

Keep this file updated for meaningful changes. Add newest entries at the top.

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
