# API Client Portal Plan

Status: Parked for later. Complete admin-side API Hub first.

## Goal

Build a separate client-facing API portal for API reseller clients. This must stay separate from the existing partner/DSA portal.

The UX reference is Tenacio's API discovery console:

- Left sidebar navigation
- Top environment switch for testing/live
- Discover/API catalog screen
- API documentation panel
- Sandbox test console
- Response preview

Do not copy branding or exact visuals. Use the same product pattern with CreditTrust branding and the existing admin/product design language.

## Proposed Routes

- `/api-client-login`
- `/api-console`
- `/api-console/discover`
- `/api-console/keys`
- `/api-console/transactions`
- `/api-console/docs`
- `/api-console/support`

## User Model

Keep API clients separate from existing users:

- `admin`: manages API Hub and clients
- `partner`: existing partner/DSA portal user
- `api_client`: future API portal user

Admin API Hub flow:

1. Configure vendor/master API.
2. Add API client.
3. Generate client API keys for selected APIs.
4. Later create API client login.

Client portal flow:

1. Client logs in through `/api-client-login`.
2. Client opens API console.
3. Client discovers assigned/available APIs.
4. Client reads docs and tests sandbox payloads.
5. Client uses generated key to integrate from their own system.

## Main Navigation

- Dashboard
- Discover
- My APIs
- API Keys
- Transactions
- Credits
- Support
- API Documentation

Credits/wallet can be kept minimal initially. Billing can come later.

## Discover Page

The discover page should show a searchable API catalog.

Initial category:

- Credit Bureau
  - Bureau API

Future categories:

- Identity Verification
- PAN Services
- Aadhaar Services
- Banking
- Business Verification
- Employment Verification
- Contactability Checks
- Alternate Data

Do not hard-code fake future APIs as active products. Future APIs should appear only as planned/disabled placeholders or when configured from admin.

## API Detail Page

When a client selects an API, show:

- API overview
- Environment selector: Testing / Live
- Endpoint
- Method
- Authentication headers
- Required fields
- Sample request JSON
- Sample response JSON
- Error codes
- Validation rules
- cURL example
- Node.js example
- PHP example
- Copy buttons
- Sandbox test console
- Response preview

## First API: Bureau API

Client endpoint:

```http
POST /api/v1/cibil/consumer-score
```

Generic future API endpoint pattern:

```http
POST /api/v1/{apiCode}
```

Header:

```http
x-api-key: <client_generated_api_key>
content-type: application/json
```

Sample payload:

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

Field rules:

- `birthDate`: DDMMYYYY
- `gender`: `1` female, `2` male, `3` transgender
- `idNumber`: PAN format
- `telephoneNumber`: 10 digit mobile number
- `pinCode`: 6 digits
- `stateCode`: CIBIL/TransUnion state code

## Integration Architecture

```text
Client System
  -> CreditTrust client API endpoint
  -> CreditTrust validates client API key
  -> CreditTrust reads configured vendor/master API
  -> CreditTrust calls Jaadugar/Bureau Gateway
  -> Gateway calls provider from whitelisted IP
  -> Response returns to client
```

Admin remains the control plane. Client portal is the developer-facing console.

The admin API Hub must allow multiple master APIs, not only Bureau API. Each configured API has its own code, master URL, auth header, internal token, per-hit credit cost, test payload, and status. Client keys are generated for one selected API at a time.

## Build Order

1. Finish admin-side API Hub:
   - Vendor/master API config
   - API test
   - Client management
   - Client API key generation
2. Build separate API client portal shell.
3. Build Discover catalog.
4. Build Bureau API documentation panel.
5. Build sandbox test console.
6. Add API client auth.
7. Add transactions/usage history.
