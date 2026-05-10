# BUREAU-PORTAL Project Handoff

Use this file to onboard new agents/developers quickly. Keep implementation scoped and avoid unrelated UI or architecture changes unless requested.

## Repository

- GitHub: `https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git`
- Main local dev URL: `http://127.0.0.1:4028`
- Framework: Next.js 15 app router
- Database/Auth/Storage: Supabase

## Local Setup

```powershell
git clone https://github.com/shubhamsoni-sketch/BUREAU-PORTAL.git
cd BUREAU-PORTAL
npm install
powershell -ExecutionPolicy Bypass -File .\scripts\decrypt-env.ps1 -Password "<ask-owner-for-password>"
npm run dev
```

Open:

```text
http://127.0.0.1:4028/admin
```

Notes:

- `.env` is not committed in plain text.
- `.env.enc` is committed and can be decrypted with `scripts/decrypt-env.ps1`.
- Ask the project owner for the encryption password.
- Do not commit the generated `.env`.

## Verification Commands

Run build first, then type-check:

```powershell
npm run build -- --no-lint
npm run type-check -- --pretty false
```

Do not run build and type-check in parallel. Type-check depends on generated `.next/types`.

## Admin Login

Ask the project owner for current admin credentials if needed. Existing local/dev credentials were used during implementation, but avoid hardcoding credentials in code or docs.

## Current Completed Work

### Demo Partner Account

A reproducible Supabase seed migration exists:

- `supabase/migrations/20260510120000_seed_demo_partner.sql`

Demo account:

- Email: `user@demo.in`
- Password: ask owner or check the seed migration in trusted local context
- Partner name: `Demo Partner`
- Partner code: `DEMO001`
- Status: `approved`
- Agreement: signed
- Wallet balance: `100000`

### Agreement Flow

Implemented and pushed:

- Admin agreement list page: `src/app/admin-agreements/page.tsx`
- Partner agreement page: `src/app/agreement/page.tsx`
- Admin agreement APIs:
  - `src/app/api/admin-agreements-list/route.ts`
  - `src/app/api/admin-upload-agreement/route.ts`
  - `src/app/api/admin-update-agreement-status/route.ts`
- Partner agreement APIs:
  - `src/app/api/partner-agreement/route.ts`
  - `src/app/api/sign-agreement/route.ts`
- Server-side Supabase admin helper:
  - `src/lib/supabase/admin.ts`
- Route protection updated:
  - `src/components/AdminGuard.tsx`
- Auth loading fix:
  - `src/context/AuthContext.tsx`
- Supabase migration:
  - `supabase/migrations/20260508193000_partner_agreements.sql`

### Supabase Migration Status

The `partner_agreements` table migration has already been run successfully in Supabase for the current project DB.

The migration creates:

- `public.partner_agreements`
- RLS policies for partner read/sign
- Admin/service role management policies
- Indexes on partner, user, and status

### Test Data

A test agreement was created during verification:

- Partner email: `test@gmail.com`
- Agreement name: `Test Agreement - Browser Verification`
- Status: `pending`

## Agreement Flow Behavior

Expected flow:

1. Admin logs in.
2. Admin goes to `Admin -> Agreements`.
3. Admin uploads/assigns partner-specific agreement file.
4. Partner logs in.
5. Partner is blocked from normal portal pages until agreement is signed.
6. Partner opens `/agreement`.
7. Partner checks consent and signs.
8. Partner dashboard and portal pages unlock.

Current v1 signing is checkbox consent only. Real e-sign integration is planned for later.

## Next Major Task: Real CIBIL Integration

Do not implement until response JSON sample is reviewed and discussed.

External API provided by owner/developer:

```text
POST https://fincooper.in/v1/cibilScore/getCibilScore
```

Payload sample:

```json
{
  "firstName": "HARSHAL",
  "middleName": "ARUN",
  "lastName": "PAWAR",
  "birthDate": "13122000",
  "gender": "2",
  "idNumber": "GEAPP1589H",
  "stateCode": "23",
  "pinCode": "450221",
  "telephoneNumber": "7067384810"
}
```

Known mapping:

- `MALE = 2`
- `FEMALE = 1`

Important state behavior:

- Portal currently takes state name, not state code.
- Map selected state name to `stateCode`.
- Do not auto-detect state from PIN.

State code source:

- Owner provided `State Code.docx`.
- The mapping includes examples:
  - `23 = Madhya Pradesh`
  - `27 = Maharashtra`
  - `07 = Delhi`
  - `24 = Gujarat`
  - `08 = Rajasthan`
  - `09 = Uttar Pradesh`
  - `36 = Telangana`

Still needed before build:

- Success response JSON sample.
- Error response JSON sample.
- Confirm whether API needs auth header/token.

Suggested architecture:

1. Frontend `/pull-cibil` calls internal route, for example `/api/pull-cibil-real`.
2. Internal route maps portal form fields to external API payload.
3. Internal route calls `https://fincooper.in/v1/cibilScore/getCibilScore`.
4. Save raw response JSON for audit/history.
5. Normalize score/report fields for UI.
6. Deduct wallet only after valid successful response.
7. Do not deduct wallet on API/network/validation failure.

## Safety Rules For Agents

- Do not commit `.env`.
- Do not print Supabase keys or service role key.
- Keep UI style consistent with existing admin/partner portal.
- Do not redesign unrelated pages.
- Avoid broad refactors unless the task requires it.
- For CIBIL work, discuss response JSON before implementing.
- Run build and type-check before pushing.
- If the worktree has unrelated changes, do not revert them.
