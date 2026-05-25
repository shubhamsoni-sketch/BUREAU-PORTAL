# Real CIBIL Integration

## Goal

Integrate the portal's Pull CIBIL flow with the external real CIBIL backend API.

## Current Status

Prepared, but not fully enabled in production until a working endpoint is confirmed.

- `/api/pull-bureau-real` already validates partner input and builds the external API payload.
- Demo partner flow still uses generated demo bureau data.
- Non-demo partner flow will call `BUREAU_API_URL` when that environment variable is configured.
- If `BUREAU_API_URL` is missing, the route returns `501 Live bureau API URL is not configured`.
- If the external API fails, returns non-JSON, or returns a response without a valid score, wallet deduction does not happen.

## External API

```text
POST https://fincooper.in/v1/cibilScore/getCibilScore
```

Note: The first direct test of this URL returned a redirect to the trailing-slash path, and the trailing-slash path returned an HTML 404 page. Keep the endpoint configurable through `BUREAU_API_URL` until the provider confirms the correct working URL/path.

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

## Known Mapping

- `MALE = 2`
- `FEMALE = 1`
- Portal currently takes state name, not state code.
- State name must be mapped directly to `stateCode`.
- Do not auto-detect state code from PIN.

## Still Needed

- Successful response JSON sample.
- Failed/error response JSON sample.
- Confirm whether API requires auth headers/tokens.
- Confirm the final working API URL/path for `BUREAU_API_URL`.

## Proposed Architecture

1. Frontend `/pull-cibil` calls an internal API route.
2. Internal API route validates input and maps fields.
3. Internal API route calls the external CIBIL API.
4. Raw response is saved for audit/history.
5. Response is normalized for UI.
6. Wallet deduction happens only after a valid successful response.
7. No wallet deduction on network/API/validation failure.

## Environment

```env
BUREAU_API_URL=
BUREAU_API_AUTH_TOKEN=
BUREAU_API_AUTH_HEADER=token
BUREAU_API_TIMEOUT_MS=30000
```

Use `BUREAU_API_URL` for the provider endpoint so future endpoint corrections do not require a code change.
Use `BUREAU_API_AUTH_TOKEN` for the provider token. The current Fincooper endpoint expects this in the `token` header, not `Authorization: Bearer`. Never commit the token into source files or docs.

## Acceptance Criteria

- Form data maps correctly to external API payload.
- Birth date is sent as `DDMMYYYY`.
- Gender is sent using the confirmed numeric mapping.
- State name is mapped to state code.
- External API errors are shown clearly.
- Successful reports are saved to report history.
- Wallet deduction happens only after success.
- Build and type-check pass.
