# CreditTrust loan website release

## Scope

- Replace the public homepage with the approved local `/home/loan-hero-preview` design.
- Publish matching About and Instant Personal Loan pages.
- Keep existing admin, partner, CIBIL, report and API implementations untouched.
- Keep the customer Apply journey a clearly labelled demo, with no real OTP or data submission.

## Verification gates

1. Build and type-check the clean candidate.
2. Preview-deploy to the verified Bureau Portal Vercel project.
3. Check homepage, About, Personal Loan, demo Apply, mobile layout and logo assets.
4. Check existing admin and partner routes still respond.
5. Push the scoped change to `main`, fetch `origin/main`, verify branch and SHA equality, then deploy production.
6. Smoke-check production and avoid claiming the demo journey is a live loan application.
