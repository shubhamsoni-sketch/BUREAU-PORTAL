# Credit Trust Domain Routing

## Canonical Hosts

- `https://credittrust.in`: main Credit Trust portal, admin, partner, B2C report journey, APIs, and report tracking.
- `https://crm.credittrust.in`: CRM marketing website at `/`, with CRM login at `/login`.
- `https://crm.credittrust.in/crm/...`: CRM workspace routes.
- `https://portal.credittrust.in`: legacy parallel portal host kept working for existing links, webhooks, callbacks, and sessions.
- `https://api.credittrust.in`: API console/API hub host, unchanged.

## Compatibility Rules

- Do not redirect `portal.credittrust.in/api/*`; existing WhatsApp/Meta webhook callbacks must remain valid.
- Do not redirect `portal.credittrust.in/r/*`; old report tracking links must keep resolving.
- `credittrust.in/crm...` redirects to `crm.credittrust.in/crm...`.
- `crm.credittrust.in/login` rewrites to the existing CRM sign-in route.
- `crm.credittrust.in` public marketing paths rewrite to the existing `/crm-website` pages.

## External Config To Verify

- Supabase Auth allowed URLs should include `https://credittrust.in`, `https://crm.credittrust.in`, and `https://portal.credittrust.in`.
- Cashfree return URLs should use `https://credittrust.in/get-my-report`, with `portal.credittrust.in` still allowed as legacy.
- Meta and WhatsApp webhook callbacks can move to `https://credittrust.in/api/...`, while old `portal.credittrust.in/api/...` callbacks continue to work.
