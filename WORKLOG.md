# Worklog

Keep this file updated for meaningful changes. Add newest entries at the top.

## 2026-06-25 - Developer - Partner Scoped CRM Store

Summary:

- Added CRM scope resolution so CRM APIs can resolve the logged-in partner from Supabase auth and store data per partner.
- Moved leads, team, lenders, eligibility reports, and file applications away from the hardcoded global CRM store for authenticated partners.
- Added `crmFetch` so CRM pages send the current Supabase session token to CRM APIs.
- Kept the old demo store as a fallback when CRM pages are opened without a partner session.

Verification:

- `npm run type-check -- --pretty false` passed.

## 2026-06-25 - Developer - Link CRM Setup To CreditTrust Admin Data

Summary:

- Added `/api/crm/context` to resolve the active CreditTrust partner and return admin-managed onboarding data in one response.
- Wired CRM Setup to show the existing admin partner profile, wallet ledger, invoices, agreement, and commercials.
- Removed the standalone CRM credit-add flow from Setup display so wallet, invoice, and agreement remain controlled by CreditTrust admin.

Verification:

- `npm run type-check -- --pretty false` passed.

## 2026-06-25 - Developer - Setup Onboarding Tabs

Summary:

- Simplified CRM Setup to a single Onboarding Setup module.
- Added simple tabs inside Onboarding Setup for DSA Profile, Wallet Management, Invoice & Accounting, and Agreement.
- Removed Access Control and Bureau Setup cards from the Setup page to avoid overlapping with existing CRM settings/navigation.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - Simplify CRM Setup Layout

Summary:

- Removed nested tab/section switching from CRM Setup.
- Converted setup into a single scrollable control page with DSA Profile, Wallet Management, Wallet Ledger, Invoice & Accounting, Agreement, Access Control, and Bureau Setup sections.
- Kept existing add credits, ledger, and invoice display behavior intact.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - CRM Setup Onboarding Sections

Summary:

- Restructured CRM Setup into Setup tabs for Onboarding, Access Control, and Bureau Setup.
- Moved wallet credits, ledger, invoices, accounting, DSA profile, and agreement into the Onboarding section.
- Preserved existing eligibility credit add and invoice generation flow inside Wallet Management.
- Added clear placeholders for admin-linked DSA profile and agreement state until partner-scoped workspace data is wired.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - CRM Team Roles And Permissions

Summary:

- Added CRM team member model with Admin, Manager, DSA Agent, Ops Executive, and Accounts roles.
- Added module permission matrix for dashboard, leads, eligibility, lender selection, file process, setup, reports, and team management.
- Added `/api/crm/team` for team CRUD, status toggles, deletion guard, and CRM store persistence.
- Updated Team Management UI to load/save real team data and manage module-level access.
- Added role preview so the CRM sidebar/topbar can show navigation based on selected user permissions.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-25 - Developer - File Document Checklist

Summary:

- Added application-level document checklist metadata for File Process.
- Added document upload status, verification, rejection, and missing-state updates.
- Added document readiness counts in the File Process table and detail panel.
- Blocked file submission until required documents are verified.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Demo Lender Eligibility Seed

Summary:

- Added a CRM backend seed action for a demo eligibility report with lender matches.
- The seeded demo lead appears in Eligibility Checked Leads and can be sent to the lender queue for flow testing.
- Demo data is idempotent so repeated seeding updates the same demo lead/report instead of creating duplicates.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Show Lender Eligibility In Reports

Summary:

- Persisted matched lender recommendations with each CRM eligibility report.
- Added lender match visibility to Eligibility Checked Leads and Eligibility Reports.
- Added a checked-lead Send to Lender action so eligible leads can be pushed to the lender queue after the report is reviewed.
- Added lender eligibility details in the report drawer.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Embed Eligibility Reports In Checker

Summary:

- Removed the right-side Queue Summary panel from CRM Eligibility Checker so the lead table can use full width.
- Added top sub-tabs inside Eligibility Checker for Lead Queue and Eligibility Reports.
- Embedded the existing Eligibility Reports screen inside the checker tab while keeping the direct reports route available.
- Removed Eligibility Reports from the main CRM sidebar so reports are managed inside Eligibility Checker.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Scalable Eligibility Lead Queue

Summary:

- Reworked CRM Eligibility Checker queue from lead cards into a table layout suitable for large bulk-uploaded lead lists.
- Added queue tabs for Pending Leads and Eligibility Checked Leads with counts, search, sticky table headers, and row-level actions.
- Added Run Eligibility action directly on pending lead rows so a lead can be checked without first opening a card.
- Added checked-lead rows with result summary and View Report action so completed checks move out of the pending queue.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Lead Queue Eligibility Flow

Summary:

- Added a CRM leads backend store behind `/api/crm/leads` so lead capture, queue state, and lender submissions persist with the CRM data.
- Simplified Add Lead to basic inquiry fields only: customer, mobile, city, product, amount, source, assignment, follow-up, and notes.
- Added a Pending Leads queue inside Eligibility Checker so agents can select leads one-by-one and run mobile/full-details eligibility.
- Updated eligibility checks to mark selected leads as eligibility done and added a lender submission action that creates a loan application queue entry.
- Wired Loan Application Tracking to read submitted applications from the CRM store while keeping the existing UI layout intact.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Hide Internal Eligibility Workflow Copy

Summary:

- Removed internal implementation wording from CRM Eligibility Checker UI.
- Replaced public-facing copy that mentioned mobile prefill, bureau payload building, background processing, CIBIL response, and FOIR with neutral eligibility language.
- Kept backend flow unchanged while making the UI suitable for agents/customers.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` passed.

## 2026-06-24 - Developer - Lender Policy Form Upgrade

Summary:

- Reworked the Add/Edit Lender modal into a visible policy setup form while keeping the same CRM design language.
- Split lender setup into Basic Information, Products & Coverage, Eligibility Policy Rules, and Commercials & Operations.
- Added minimum loan amount as a matching rule and surfaced policy context directly inside the form.
- Updated lender matching so minimum loan amount is enforced along with score, income, FOIR, tenure, max loan, product, and state rules.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` passed.

## 2026-06-24 - Developer - CRM Lender Policy Engine

Summary:

- Added a CRM lender policy store behind `/api/crm/lenders` so lender changes persist in the CRM backend.
- Kept the existing Lender Management UI shape while wiring list load and add/edit save to the backend.
- Added lender policy fields for minimum income and state coverage alongside existing score, FOIR, tenure, amount, ROI, and product rules.
- Updated CRM Eligibility Checker so matched lenders come from configured lender rules instead of hardcoded lenders.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build` passed.

## 2026-06-23 - Developer - Two Mode CRM Eligibility Checker

Summary:

- Split CRM Eligibility Checker into two flows: mobile-only advanced bureau pull and full-details lender eligibility.
- Added mobile-only flow that runs Bureau Advanced / Mobile Prefill internally, builds the CIBIL payload, and then calls Bureau Standard.
- Updated full-details flow to accept first name, last name, mobile, DOB, PAN, address, pincode, state, and gender before calculating FOIR and matched lenders.
- Kept all CRM eligibility checks on eligibility credits with report history and wallet ledger deduction.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-06-23 - Developer - CRM Setup Credits And Tools Cleanup

Summary:

- Moved CRM eligibility credits out of the main navigation and into a new `/crm/setup` section.
- Added setup tabs for Eligibility Credits, Wallet Ledger, and Invoices so recharge, usage, and billing history live together.
- Extended the CRM eligibility backend store with credit transactions and invoice records.
- Cleaned the sidebar Tools group so it only contains Eligibility Checker and EMI Calculator.
- Added `/crm/emi-calculator` as the direct EMI route and kept old `/crm/tools` and `/crm/eligibility-credits` routes as redirects.

Verification:

- `npm run type-check -- --pretty false` passed.

## 2026-06-23 - Developer - DSA CRM Zip Integration And Eligibility Backend

Summary:

- Replaced the earlier custom `/crm` shell with the provided DSA CRM UI from `dsa_crm.zip`.
- Mounted the CRM under `/crm` with zip routes for dashboard, lead management, loan tracking, lender management, team management, tools, reports, eligibility check, eligibility reports, and eligibility credits.
- Kept the provided CRM UI structure intact while isolating its shared components under `src/crm`.
- Added `/api/crm/eligibility-check` backend with CRM eligibility credits, report persistence, and Bureau Standard API Hub integration.
- Wired Eligibility Check to call the backend and Eligibility Reports/Credits to read from the CRM store.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-06-02 - Developer - Prefill Payload Mapping Fix

Summary:

- Updated Bureau Advanced prefill mapping to support Gridlines responses shaped as `data.personal_data` as well as `data.data.personal_data`.
- Fixed PAN extraction from `document_data.pan[].value` and address extraction from `personal_data.address[]` for both admin testing and client Advanced API calls.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-06-02 - Developer - Admin Advanced Bureau Test Flow

Summary:

- Updated Admin API Hub testing for Bureau API Advanced so the admin test runs Mobile Prefill first, builds the Jaadugar CIBIL payload, then calls Bureau API Standard.
- The admin test response now returns the final CIBIL stage/result instead of stopping at the raw prefill response.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-31 - Developer - Bureau API Routing Guard

Summary:

- Routed generic `POST /api/v1/bureau` requests through the Bureau API Standard handler.
- Routed generic `POST /api/v1/bureau-advanced` requests through the Bureau API Advanced handler so clients receive the final CIBIL response instead of the raw prefill response.
- Added a guard so the Bureau Standard endpoint only accepts keys generated for the standard bureau product.
- Updated client docs so `/api/v1/bureau` and `/api/v1/bureau-advanced` are the primary handover endpoints.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-30 - Developer - Client Bureau API Documentation

Summary:

- Added a Docs tab in Admin API Hub with client-ready documentation for Bureau API Standard and Bureau API Advanced.
- Added copyable client endpoints, headers, payloads, cURL examples, response shapes, and field rules for the CreditTrust reseller flow.
- Added repo documentation files for Standard and Advanced so client handover material stays versioned with the portal.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-30 - Developer - Jaadugar Bureau Payload Contract

Summary:

- Switched Bureau API Standard to forward CreditTrust requests to the Jaadugar CIBIL master API using `firstName`, `lastName`, `dob`, `gender`, `pan`, `mobile`, `address`, `state`, and `pincode`.
- Updated Bureau API Advanced so Mobile Prefill runs first, then maps the best reported address, PAN, DOB, gender, and full state name into the same Jaadugar payload contract.
- Updated API Hub defaults and the parked client-portal plan so admin tests and future client docs use the new payload rules instead of old CIBIL code fields.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-28 - Developer - Simplified API Hub Reseller Flow

Summary:

- Replaced the overbuilt API Hub flow with a simple admin control panel for APIs, clients, API keys, credits, and usage.
- Added multi-API admin creation with quick API templates for Bureau, PAN, Aadhaar, and Name Fetch so future vendor APIs can be configured from the same section.
- Split Bureau into Standard and Advanced products: Standard accepts full CIBIL payloads, Advanced accepts mobile-first requests and runs Mobile Prefill before the Bureau hit.
- Added `consent: true` validation to Bureau Standard and Advanced so the final CIBIL request carries captured customer consent.
- Added a lightweight API Hub store that keeps the Jaadugar/master API token internal and exposes only CreditTrust-generated client keys.
- Updated `POST /api/v1/cibil/consumer-score` to validate a CreditTrust `x-api-key`, check client credits, call the configured master Bureau API, deduct per-hit credits on success, and log masked usage.
- Added `POST /api/v1/cibil/mobile-prefill` for Bureau API Advanced using the configured Gridlines Mobile Prefill API and the configured Bureau API Standard.
- Added standalone `Mobile Prefill API` as an independent API Hub product with `POST /api/v1/mobile-prefill`.
- Added generic `POST /api/v1/{apiCode}` reseller proxy for future APIs that do not need the Bureau-specific request validation route.
- Parked the separate client-facing API portal plan in `docs/tasks/api-client-portal-plan.md` for later work.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run build` passed.

## 2026-05-26 - Developer - API Hub Control Plane MVP

Summary:

- Added API Hub database foundation for reseller clients, products, hashed API keys, wallets, transactions, usage logs, and gateway settings.
- Added admin `/admin-api-hub` section for onboarding clients, generating sandbox/live keys, adding demo credits or live balance, and reviewing usage.
- Added client-facing `POST /api/v1/cibil/consumer-score` endpoint with `x-api-key` auth, sandbox demo responses, live gateway pass-through, wallet deduction, and masked usage logging.
- Added API Hub to the admin sidebar and admin route guard.
- Refined the API Hub admin screen into a long-term product catalog model with `Control Panel` heading, `APIs` tab, `Bureau API` as the first active product, planned API placeholders, product-specific key generation, wallet section, and sandbox test console.
- Reworked API Hub around vendor/master API configuration first: Bureau API can store gateway endpoint, method, auth header, secret token, request template, and direct admin test response; client keys can then be generated against the configured API. Wallet/credits are no longer part of the active flow.

Verification:

- `npm run type-check -- --pretty false` passed.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.

## 2026-05-19 - Developer - Login Role Switch And Logout Fix

Summary:

- Fixed partner login opening the admin area when an admin session was already active.
- Fixed admin login opening the partner area when a partner session was already active.
- Strengthened logout to clear Supabase auth state, reset the browser client, remove persisted auth tokens, and refresh after redirect.
- Updated login submission handling so wrong-role credentials are signed out and kept on the intended login page.

Verification:

- `npm run type-check -- --pretty false` passed.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.

## 2026-05-19 - Developer - Real Bureau API Payload Scaffold

Summary:

- Prepared `/api/pull-bureau-real` to build and send the confirmed real CIBIL payload through configurable `BUREAU_API_URL`.
- Added `BUREAU_API_AUTH_TOKEN` support with configurable auth header name; current Fincooper API expects `token`.
- Kept demo partner behavior unchanged.
- Added safe live-response handling so wallet deduction and report persistence happen only after a successful JSON response with a valid score.
- Updated the real CIBIL task doc with endpoint test results, env configuration, and remaining provider confirmations.

Verification:

- `npm run type-check -- --pretty false` passed.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.

## 2026-05-14 - Developer - Credit Trust Favicon Update

Summary:

- Replaced the old browser favicon with Credit Trust mark-based favicon assets.
- Added SVG, 32x32 PNG, Apple touch icon, 512px icon, and refreshed `/favicon.ico` fallback.
- Updated app metadata to use the new favicon paths with cache-busting query strings.

Verification:

- Generated favicon preview was visually checked for centered Credit Trust mark framing.
- `npm run build -- --no-lint` passed with placeholder Supabase env values for local build verification.
- `npm run type-check -- --pretty false` passed.
- Committed and pushed to `main` (`b613d40`), deployed to Vercel production, and verified live HTML references the `?v=2` favicon assets with `/favicon.ico` and `/favicon.svg` returning HTTP 200.

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

## 2026-06-25 - Developer - Harden File Process Workflow

Summary:

- Added persisted file status history, notes, follow-up date, rejection reason, and lender trail fields.
- Added CRM backend actions for adding file notes, updating follow-up dates, and saving status movements with history.
- Added File Process table follow-up visibility.
- Added File Process detail activity tab with status history, notes, and lender trail.
- Added detail-panel controls for follow-up date, quick notes, mark submitted, and reject with reason.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Open Lender Details From Button

Summary:

- Removed the always-visible lender details section below the Lender Selection table.
- Made lender details open only from the row `Select Lender` button.
- Moved lender options into a modal so the file table remains the primary screen.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Reshape Lender Selection And File Process

Summary:

- Changed Lender Selection to a table-first workflow for eligibility-checked files.
- Kept lender options below the selected file and allowed switching to another lender.
- Renamed Loan Applications navigation and page title to File Process.
- Added Case Sent status and wired status dropdown updates to the CRM backend.
- Added Change Lender action from File Process back to Lender Selection for the same lead.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Make Application Status Pills Clickable

Summary:

- Converted Loan Application Tracking status summary pills into quick filters.
- Added active visual state for selected pill filters.
- Synced the status dropdown with quick filter selections, including an In Progress filter.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Add Lender Selection Demo Leads

Summary:

- Expanded the CRM demo eligibility seed to create three fresh checked leads.
- Added home loan, personal loan, and business loan demo reports with lender matches.
- Reset demo applications during seed so the lender selection flow can be tested repeatedly.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Link Lender Selection To Application View

Summary:

- Added a `View Application` CTA after creating a loan application from Lender Selection.
- Passed the created application id into Loan Application Tracking through the URL.
- Auto-opened and filtered the created application in Loan Application Tracking.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Separate Lender Selection Workflow

Summary:

- Kept Eligibility Checker focused on running eligibility checks and saving bureau reports.
- Removed direct lender submission actions from Eligibility Checker and Eligibility Reports.
- Added a dedicated CRM Lender Selection module for eligibility-checked leads with matched lender options.
- Wired Lender Selection to create loan applications through the existing lender submission action.
- Added Lender Selection to the CRM sidebar.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

## 2026-06-24 - Developer - Clarify Send To Lender Flow

Summary:

- Added clear success feedback after a checked lead is sent to a lender.
- Added a `Sent` badge for leads already submitted to lender queue.
- Made the demo lender eligibility seed reset prior demo applications so the `Send to Lender` action can be tested repeatedly.
- Prevented duplicate lender applications for the same lead and lender.

Verification:

- `npm run type-check -- --pretty false` passed.
- `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" SUPABASE_SERVICE_ROLE_KEY="placeholder" NEXT_TELEMETRY_DISABLED=1 npm run build` passed.

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
