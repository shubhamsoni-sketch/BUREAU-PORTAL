# Bureau API Standard

CreditTrust is the client-facing vendor for this API. Jaadugar remains the internal master/vendor gateway and is never exposed to API clients.

## Endpoint

```http
POST https://credittrust.in/api/v1/bureau
```

Internal alias:

```http
POST https://credittrust.in/api/v1/cibil/consumer-score
```

## Headers

```http
content-type: application/json
accept: application/json
x-api-key: <client_api_key>
```

Each client must receive a unique API key generated from CreditTrust Admin > API Hub > API Keys. A key generated for another API cannot be used for Bureau API Standard.

## Request

```json
{
  "firstName": "HARSHAL",
  "lastName": "PAWAR",
  "dob": "2000-12-13",
  "gender": "male",
  "pan": "GEAPP1589H",
  "mobile": "7067384810",
  "address": "450221 MADHYA PRADESH",
  "state": "MADHYA PRADESH",
  "pincode": "450221"
}
```

## Field Rules

- `dob`: `YYYY-MM-DD` or `DD/MM/YYYY`
- `gender`: `male`, `female`, or `transgender`
- `pan`: valid PAN format
- `mobile`: 10 digit Indian mobile number
- `pincode`: 6 digits
- `state`: full state name, for example `MADHYA PRADESH`

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

`data` contains the Jaadugar/master API response returned through CreditTrust.

## Error Response

```json
{
  "success": false,
  "request_id": "API-...",
  "error": "Invalid or inactive API key"
}
```

Common statuses:

- `400`: invalid payload
- `401`: missing or invalid client API key
- `402`: insufficient credits
- `403`: key is not allowed for this API
- `502`: upstream/master API failed
