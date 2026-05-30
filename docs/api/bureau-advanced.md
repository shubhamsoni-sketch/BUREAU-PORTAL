# Bureau API Advanced

CreditTrust is the client-facing vendor for this API. The client sends a mobile-first request only. CreditTrust runs Mobile Prefill internally, builds the Bureau Standard payload, calls Jaadugar, deducts credits on success, and returns the bureau response.

## Endpoint

```http
POST https://credittrust.in/api/v1/cibil/mobile-prefill
```

## Headers

```http
content-type: application/json
accept: application/json
x-api-key: <client_api_key>
```

Each client must receive a unique API key generated from CreditTrust Admin > API Hub > API Keys. A key generated for Bureau API Standard cannot be used for Bureau API Advanced.

## Request

```json
{
  "mobile_number": "9876543210",
  "consent": true
}
```

## Internal Flow

```text
Client
  -> CreditTrust Bureau API Advanced
  -> CreditTrust validates client key and credits
  -> CreditTrust calls Mobile Prefill internally
  -> CreditTrust maps prefill data to Bureau Standard payload
  -> CreditTrust calls Jaadugar CIBIL master API
  -> CreditTrust returns bureau response to client
```

## Mapping Rules

- `mobile_number`: must be 10 digits.
- `consent`: must be `true`.
- Prefill must return customer name, DOB, gender, PAN, and at least one address with pincode and state.
- If multiple addresses are present, CreditTrust picks the latest valid reported address.
- State is converted to the full uppercase state name before the Jaadugar CIBIL call.

## Success Response

```json
{
  "success": true,
  "request_id": "API-...",
  "charged": {
    "credits": 1
  },
  "data": {}
}
```

`data` contains the Jaadugar/master API response returned through CreditTrust. The prefill response is not exposed separately to the client.

## Error Response

```json
{
  "success": false,
  "request_id": "API-...",
  "error": "Unable to build CIBIL payload from prefill response"
}
```

Common statuses:

- `400`: invalid mobile number, missing consent, or incomplete prefill-derived data
- `401`: missing or invalid client API key
- `402`: insufficient credits
- `403`: key is not allowed for this API
- `502`: prefill or bureau master API failed

