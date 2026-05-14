# Worklog

Keep this file updated for meaningful changes. Add newest entries at the top.

## 2026-05-14 - Developer - Landing Nav Security Link Removal

Summary:

- Removed the unused `Security` button from the landing header navigation.
- Added payment-gateway compliance contact details to the landing footer, including company address and mobile number below the existing support email.
- Kept the underlying trust/security landing section unchanged for page content continuity.
- Noted the owner preference to keep markdown logs updated after future pulls and deploys.

Verification:

- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.
- `npm run type-check -- --pretty false` passed.
- Committed and pushed to `main` (`2c07241`), then deployed to Vercel production and verified `https://credittrust.in/` shows the footer address/mobile and no longer shows the `Security` nav link.

## 2026-05-13 - Developer - About Us Landing Page Update

Summary:

- Reworked `/about` with the provided CreditTrust company overview and mission copy.
- Kept the page aligned with the current dark landing website theme.
- Added `About Us` to the landing footer links while keeping it out of the header navigation.

Verification:

- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.
- `npm run type-check -- --pretty false` passed.
- Pushed to `main` to trigger the configured GitHub/Vercel deployment flow.

## 2026-05-12 - Developer - Customer Journey Form UI Compacting

Summary:

- Reduced oversized customer journey form containers, inputs, OTP field, buttons, and helper chips on `/get-my-report`.
- Added consistent compact input/select/textarea styling with subtle focus states.
- Tightened the mobile verification and details screens so the journey feels cleaner and more premium.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Local browser check confirmed the mobile, OTP, and details steps render with compact fields.

## 2026-05-12 - Developer - Footer Contact Cleanup

Summary:

- Removed the standalone Contact page route and Contact links from public navigation/footer areas.
- Added direct footer contact copy: `support@credittrust.in`.
- Removed unused footer social/web icon buttons.
- Added `Powered by Fincoopers Tech India Private Limited` to footer rights text.
- Replaced remaining Contact page CTAs with direct `mailto:support@credittrust.in` links.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Theme-Friendly Credit Trust Logo

Summary:

- Added separate Credit Trust logo variants for dark surfaces, light surfaces, and compact mark placements.
- Updated website/header/footer/login logo sizing to use a compact lockup without the tagline so it remains readable.
- Updated admin/partner sidebars to use the dark-surface logo when expanded and the compact mark when collapsed.
- Updated Supabase invoice branding migrations and live invoice settings to use the light-surface logo asset.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Live Supabase invoice settings were updated to `/assets/images/credit-trust-logo-light.svg`.

## 2026-05-12 - Developer - Credit Trust Rebrand

Summary:

- Replaced the portal brand name from Insight/InsightIQ to Credit Trust across public pages, partner/admin UI, policies, metadata, notifications, and invoice defaults.
- Added the provided Credit Trust logo asset and wired it into shared logo usage, landing header/footer, partner program, customer journey, login screens, and sidebars.
- Updated live invoice settings to use Credit Trust Financial Services and the new logo.
- Added a Supabase migration to keep invoice branding reproducible for future environments.

Verification:

- Brand scan no longer finds Insight/InsightIQ/CIBILysis/app_logo references in source, package files, public assets, or migrations except generic lowercase insight variables/labels.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Gateway Compliance Policy Pages

Summary:

- Added public policy pages for Privacy Policy, Refund and Cancellation Policy, Usage Policy, and Terms and Conditions.
- Reworked About Us into a compliance-oriented company overview focused on consent, data protection, partner responsibility, and misuse prevention.
- Added policy links to public footers and allowed policy routes through the auth guard.
- Strengthened consent language in Terms, Privacy, and Usage policies for financial health report generation and authorized provider processing.
- Updated policy and About pages to use the current dark landing website theme instead of the old public-page theme.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Admin System Blueprint

Summary:

- Added `ADMIN_SYSTEM_BLUEPRINT.md` as a full rebuild guide for cloning the portal admin into another system.
- Covered tech stack, auth, Supabase schema, RLS patterns, backend APIs, admin/partner/B2C pages, business flows, provider integration pattern, deployment checklist, and suggested build order.

Verification:

- Documentation-only change. File was created and read back successfully.

## 2026-05-12 - Developer - B2C Admin Tracking Foundation

Summary:

- Added Supabase tables for B2C report requests and B2C payments with full customer data, actual PAN, consent state, payment state, and report/API fields.
- Added admin APIs for B2C report requests and B2C payments.
- Added customer journey persistence hooks so mobile, details, consent, payment, and generated demo report states can be tracked.
- Added B2C Reports to the admin sidebar and built the admin B2C reports screen.
- Added B2C tabs to Admin Payments and Customer Master so partner data remains separate from B2C customer data.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Production Supabase migration was applied through SQL Editor.
- Live `/api/admin-b2c-reports` and `/api/admin-b2c-payments` return clean success responses.
- Live customer report request persistence was verified with a test mobile record.
- Cashfree and real report integration remain intentionally stubbed for the next phase.

## 2026-05-12 - Developer - Remove Early Payment Cues

Summary:

- Removed early price/payment hints from the customer report journey before the final payment step.
- Replaced "No price shown yet" and locked preview payment wording with privacy/value-focused language.

Verification:

- Removed early payment/price cues while keeping final payment step copy intact.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Customer Journey Public Route Fix

Summary:

- Added `/get-my-report` to the public route allowlist so the global auth guard does not redirect logged-in partners away from the customer journey.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - B2C Report Purchase Journey

Summary:

- Added a separate customer journey at `/get-my-report` for mobile OTP, value education, secure details, consent, final price reveal, demo payment, report preparation, and report view.
- Kept the price hidden until after OTP, benefits education, details, and consent.
- Added Cashfree-ready customer payment API stubs with demo fallback when Cashfree keys are not configured.
- Routed landing CTA buttons to the new customer journey.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.
- Built `/get-my-report` initial HTML does not contain upfront `₹199` or payment copy.

## 2026-05-12 - Developer - Public Landing Content Cleanup

Summary:

- Cleaned public/landing-linked copy so the website positions Insight as financial health analysis, not bureau report pulling.
- Updated metadata, Partner Program wording, partner application terms/header, features page copy, and integrations page labels.
- Left partner portal, admin portal, APIs, and internal route/table names unchanged.

Verification:

- `rg -i "cibil|bureau|credit report|pull|pulls|pulled|credit bureau|bureau data|bureau report" src/components/landing src/app/page.tsx src/app/home/page.tsx src/app/partner-program/page.tsx src/app/become-a-partner/page.tsx src/app/features/page.tsx src/app/about/page.tsx src/app/contact/page.tsx src/app/layout.tsx src/app/integrations/page.tsx` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Partner Hero Report Visual

Summary:

- Replaced the Partner Program hero journey preview with a neutral professional report visual.
- Removed intake steps, client names, workflow statuses, and public-facing journey/counter messaging from the hero card.
- Added score summary, insight tags, analysis signal tiles, and report-module progress lines.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Partner Hero Workspace Preview

Summary:

- Replaced the Partner Program hero counter grid with a more credible client journey preview.
- Added intake flow chips, consumer/commercial analysis tiles, and sample client workflow rows.
- Removed demo-credit style messaging from the public B2B hero.

Verification:

- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - B2C Home And Dedicated Partner Page

Summary:

- Repositioned the main `/` and `/home` landing page around a B2C customer journey for creating a personal financial health report.
- Removed the embedded Partner Program section from the home page and changed the nav to link to `/partner-program`.
- Updated hero, journey, report preview, trust, footer, and CTA copy around individual report creation, credit score understanding, loan readiness, repayment insights, and improvement actions.
- Rebuilt `/partner-program` as a dedicated B2B page using the same dark landing theme, font scale, glass cards, teal/accent styling, and existing partner content.

Verification:

- `rg "CIBIL|Cibil|cibil|CibilCheck|cibilcheck" src/components/landing src/app/page.tsx src/app/home/page.tsx src/app/partner-program/page.tsx` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-12 - Developer - Matched Partner Program Landing Section

Summary:

- Added a new `PartnerProgramSection` to the public landing page.
- Reused old partner-program content themes: DSA/CA/advisor audience, Consumer Data, Commercial Data, Bulk Analysis, onboarding steps, and partner differentiators.
- Matched the new landing design system with dark background, glass cards, teal/accent colors, scoped animations, and existing CTA button styles.
- Added a `Partner Program` anchor in the public landing nav.

Verification:

- `rg "CIBIL|Cibil|cibil|CibilCheck|cibilcheck|Admin|/admin|emoji|ð" src/components/landing src/app/page.tsx src/app/home/page.tsx` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-11 - Developer - Hide Public Admin Landing Links

Summary:

- Removed visible Admin/Admin Login links from the public landing header, mobile menu, footer, and CTA section.
- Kept the `/admin` route unchanged so direct admin access still works.

Verification:

- `rg "Admin|/admin" src/components/landing src/app/page.tsx src/app/home/page.tsx` returned no matches.
- `rg "CIBIL|Cibil|cibil|CibilCheck|cibilcheck" src` returned no matches.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed.

## 2026-05-11 - Developer - Landing Hero Visibility Hotfix

Summary:

- Restored missing landing animation keyframes used by the imported hero section.
- Fixed the hero content staying invisible because animated elements were stuck at `opacity-0`.
- Restored orbit and scroll hint animations for the landing hero visual.

Verification:

- Live HTML already contained hero copy; issue was CSS animation visibility.
- `npm run build -- --no-lint` passed.
- `npm run type-check -- --pretty false` passed after build regenerated `.next/types`.

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
