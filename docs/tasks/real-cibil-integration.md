# Real CIBIL Integration

## Goal

Integrate the portal's Pull CIBIL flow with the external real CIBIL backend API.

## Current Status

Not implemented yet. Do not build until response JSON samples are reviewed and discussed with the owner.

## External API

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

## Proposed Architecture

1. Frontend `/pull-cibil` calls an internal API route.
2. Internal API route validates input and maps fields.
3. Internal API route calls the external CIBIL API.
4. Raw response is saved for audit/history.
5. Response is normalized for UI.
6. Wallet deduction happens only after a valid successful response.
7. No wallet deduction on network/API/validation failure.

## Acceptance Criteria

- Form data maps correctly to external API payload.
- Birth date is sent as `DDMMYYYY`.
- Gender is sent using the confirmed numeric mapping.
- State name is mapped to state code.
- External API errors are shown clearly.
- Successful reports are saved to report history.
- Wallet deduction happens only after success.
- Build and type-check pass.

