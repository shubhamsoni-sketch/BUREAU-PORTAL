# Binta Production Readiness

Status: isolated release build passes and the additive DB migration is applied;
production traffic remains disabled. Do not issue or
share the production key or URL until the release gates below are verified.

## 20 October staging update

- Confirmed in the authenticated hub console that Binta's production IP is
  `3.109.33.183`, UAT sign-off and payload validation are done, and the
  production certificate gate remains in progress.
- Added the approved production certificate fingerprint to the Bureau Portal
  Vercel Production environment. Set `BINTA_PRODUCTION_ENABLED=false`
  explicitly and deployed the unchanged `main` release; deployment
  `dpl_GVLQFqHyJbtxgSSMAGWCWztvDxNB` reached READY.
- Allocated exactly five Binta production credits in the hub console. The
  refreshed console showed `Live 5`; UAT credits remained at four. No
  production key was issued.
- The Vultr reserved IP `65.20.75.9` is attached to the gateway VM.
  Public HTTPS rejects a request without a client certificate with HTTP 400;
  the existing API rejects a request without a key with HTTP 401.
- Remaining blockers: protected Vultr signing secret cannot yet be paired to
  the Vercel app without VM shell access; Binta must perform the positive mTLS
  test with its private key; complete the remaining archive, accounting, and
  end-to-end gates before issuing the key or enabling production traffic.

## Contract

- Keep the documented `POST /api/v1/source` endpoint and request headers/body unchanged.
- Return the frozen Binta normalized response shape. Include every source account and enquiry; never cap lists or expose raw source JSON, account numbers, or lender names.
- UAT continues to use the sample response. Production uses the live source response, normalized after a successful source call.
- Existing non-Binta partner APIs must retain their current behavior.

## Console-owned client controls

- Binta production IP allowlist, production key status, live credit allocation, and onboarding checklist are managed in the API Hub console.
- The request handler requires UAT sign-off, payload validation, production IP approval, and go-live approval to be marked `done` before production traffic.
- `BINTA_PRODUCTION_ENABLED` remains an infrastructure-wide kill switch, not a substitute for console approval.
- Production credit balance is distinct from UAT credits.

## Remaining release blockers

1. The inbound NGINX mTLS host and loopback attestation proxy are installed and active at `secure-api.credittrust.in`. No-client-certificate and no-edge-token rejection passed. Positive verification with Binta's private key, app-side signing secret/fingerprint deployment, direct-Vercel bypass checks, IP/body-hash/timestamp validation and authenticated forwarding remain unverified. Do not treat negative tests as mTLS completion.
2. Independently test the applied `20261020190000_binta_production_atomic.sql` wallet, idempotent reservation and transactional response archive under concurrency. No live bureau request or credit allocation has been made.
3. Verify every successful source response is durably present in the hub Response Master and archive table before returning 200. Exercise archive failure and ambiguous upstream outcomes without issuing a second bureau call.
4. Binta confirmed production IP `3.109.33.183` and supplied a separate production public certificate. Verify the pinned fingerprint and certificate dates on the actual server; keep UAT credentials and credits separate.
5. Reconcile the signed UAT sign-off with the console metadata. Complete payload validation, production IP approval, and go-live approval only after independent checks.
6. Test the full route end-to-end with authorized data, including mTLS rejection, IP rejection, invalid/expired key, insufficient credits, concurrency, all-account mapping, response persistence, and rollback. Do not use customer data or call the live source for an unapproved smoke test.
7. Build and type-check, review the diff, merge to `main`, and deploy from verified `main` only. The current working tree contains unrelated in-progress changes; do not deploy it wholesale. Verify the live route while the global production switch remains off; enable only after release blockers are closed.
8. The linked Bureau Portal database (`qoseffoyxasnqqdrcesb`) still has unrelated migration-history divergence: remote `20260912220000` is absent locally and several local migrations are unapplied. Do not push all pending migrations or repair unrelated history blindly. The Binta SQL passed a transaction-rollback check, was applied separately, and its own history version was marked applied and verified.
9. Vercel CLI access to the exact Bureau Portal team/project is restored. Deploy only after this branch is merged to clean `main`, with the production switch off. The app-side mTLS signing secret must match the protected Vultr proxy secret before any production call; neither belongs in source control.

## Verified on 20 October 2026

- `hub.credittrust.in/admin` returned HTTP 200. This does not prove an authenticated console workflow.
- The isolated NGINX host and loopback proxy were installed on Vultr after backing up existing NGINX configuration. The Binta public certificate's SHA-256 and validity dates matched the approved values. `nginx -t` passed; DNS resolved to `65.20.75.9`; HTTPS certificate verification passed. Requests without a client certificate received HTTP 400 from the intended host. A local request without the NGINX edge token received HTTP 403 from the proxy. Axis NACH still returned HTTP 401 and both existing backend ports remained listening. A valid Binta certificate test remains required.
- The Certbot timer is active and a hostname-scoped deploy hook reloads NGINX after renewal. A configuration backup exists on the VM; no full-VM snapshot or restore test was taken. The temporary root SSH public key used for installation was removed, and a fresh login with that key was denied.
- Synthetic Binta contract tests and six proxy unit tests passed; Next.js build and TypeScript type-check passed.
- Supabase CLI is linked to the `bureau portal` project. The Binta-only migration passed a rollback transaction, was applied, and all three tables and the reservation function were verified. Nine client wallets were backfilled with a total of zero live credits. The migration history entry is applied. A schema dump could not be produced because local Docker is unavailable; no full database snapshot was taken.
- Vercel CLI access to `shubhamsoni-8129s-projects/bureau-portal` and project ID `prj_Me7FNJHwlvwuLNpkIqWMHzDuPse5` was verified. No production key, credits, live bureau request or app deployment was made at this point. The server-side mTLS edge is active but not a complete production release.

## Local verification

- `node scripts/test-binta-production.cjs`
- `npm run build -- --no-lint`
- `npm run type-check -- --pretty false`

The synthetic normalizer tests prove mapping and schema behavior; they are not a production end-to-end sign-off.
