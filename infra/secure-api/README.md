# Secure API edge (installed, production traffic disabled)

This is a separate mTLS entry point for production bridge clients. It must not
replace the existing bureau gateway on port 4000 or the Axis NACH host.

Traffic path: client -> NGINX client-certificate verification -> loopback proxy
-> existing Vercel `/api/v1/source` handler. The proxy pins the verified public
certificate SHA-256, signs the exact request body and source IP, then forwards
only the API key and optional idempotency key. The application must reject
production calls without a valid proxy signature.

The local proxy also requires a separate edge-ingress token from NGINX. A
loopback connection alone is not proof of mTLS: other local processes could
otherwise forge the forwarded certificate headers. Replace the token placeholder
in the installed NGINX config with the same random secret held in the protected
service environment; restrict both files and never commit the value.

The Binta production public certificate supplied on 20 October 2026 is staged
at `certs/binta-production-2026.pem`. Its independently checked SHA-256 is
`B0:83:5A:9B:06:CF:4A:C1:10:B8:26:95:8B:51:75:19:A3:A0:08:54:4C:6C:C3:EC:06:70:DC:E8:B1:A3:0D:7B`.
It is self-signed, RSA 2048, marked for client authentication, and valid from
19 October 2026 16:20:52 UTC to 19 October 2027 16:20:52 UTC. Binta confirmed
`3.109.33.183` as its only production source IP. This production certificate
must not be confused with the separate UAT certificate.

DNS for `secure-api.credittrust.in` resolves to the Vultr reserved IP
`65.20.75.9`. On 20 October 2026, a separate Let's Encrypt server TLS
certificate was issued on that VM with the webroot challenge; it expires on
18 January 2027. The isolated NGINX mTLS host and loopback proxy were installed
and enabled on 20 October 2026. Public DNS and server TLS passed; a caller
without a client certificate received HTTP 400, and the proxy rejected a
loopback request without its edge token with HTTP 403. The Axis NACH host
still returned its prior HTTP 401. This is not a positive client-certificate
test or production integration authorization. Do not put private keys, API keys
or signing secrets in this repository.

`install-stage.sh` and `activate-edge.sh` are the checked staging/activation
procedures used on the Vultr VM. Existing NGINX configuration was backed up in
`/root/credittrust-secure-api-backups/` before installation. Server-generated
secrets remain only in protected server files; the app's matching environment
settings are not deployed yet. The mTLS host is active, but the Binta app
production switch, live database migration, production key and credits remain
unconfigured. No live bureau call was made.
The scoped `certbot-deploy-hook.sh` reloads NGINX after a successful renewal
of this hostname's server certificate. Certbot's renewal timer is active.

Configuration phase (production traffic stays disabled):

1. Confirm the Vultr reserved public IP, then create the DNS A record for
   `secure-api.credittrust.in`. Confirm public DNS resolution before requesting
   the server-side TLS certificate. The server certificate is separate from
   Binta's client certificate.
2. Back up the Vultr VM and existing NGINX configuration. Stage a separate
   NGINX host and unprivileged proxy service; do not replace or restart the
   current bureau or Axis processes. Validate with `nginx -t` before any reload.
3. Install the approved Binta public certificate in a restricted client trust
   bundle. Configure `ALLOWED_CERT_SHA256`, `MTLS_PROXY_SECRET`,
   `EDGE_INGRESS_SECRET`, `UPSTREAM_URL` and `PORT` in a protected service
   environment. Set the matching `BINTA_MTLS_PROXY_SECRET` and
   `BINTA_PRODUCTION_CERT_SHA256` in the app, but keep
   `BINTA_PRODUCTION_ENABLED` off. Never run the proxy as root.
4. Stage Binta's confirmed production IP in the client-specific allowlist.
   Keep the UAT certificate, API key, IP policy and credits separate from
   production. Do not issue or activate a production key during this phase.

Activation phase (only after configuration is independently verified):

1. Complete atomic/idempotent production credit accounting and durable report
   archival in the app, and deploy the verified release with production off.
2. Test valid and invalid certificates, IPs, API keys, body tampering, direct
   Vercel bypass, duplicate requests, billing and archive consistency with
   Binta in an agreed window. A positive mTLS test requires Binta's private
   key on their side; we must never request it.
3. Allocate approved production credits, issue the production API key through
   the agreed secure channel, then approve the console go-live gate and global
   production switch. Do not treat configuration alone as go-live approval.

The proxy listens on `127.0.0.1:9443` only. Never expose it publicly. The
NGINX trust bundle controls certificate-chain verification; the proxy also
pins SHA-256 fingerprints. This design allows additional clients later while
keeping the hostname generic.

`node --test infra/secure-api/proxy.test.mjs` tests the proxy with synthetic
data. The server checks above test NGINX, DNS and negative certificate handling,
but not a valid Binta client certificate or production billing. Keep the
production switch off until those checks and the database release blockers
are complete.
