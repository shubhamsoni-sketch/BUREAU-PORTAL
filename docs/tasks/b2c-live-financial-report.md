# B2C Live Financial Report

## Objective

Provide a paid self-service financial report journey at `/get-my-report` without exposing provider credentials or allowing an unpaid bureau pull.

## Customer Journey

1. Customer enters a valid Indian mobile number and accepts report consent.
2. CreditTrust sends a WhatsApp authentication OTP.
3. Customer verifies the OTP and completes Cashfree payment.
4. CreditTrust runs the mobile-prefill service and shows a masked profile preview.
5. Customer confirms the fetched profile.
6. CreditTrust calls the standard bureau API once and stores the full provider response.
7. Customer downloads the existing CreditTrust PDF report.

## Security And Controls

- OTPs are generated server-side and only an HMAC hash is stored.
- OTP validity is 10 minutes with a maximum of five attempts.
- OTP requests are rate-limited to one per mobile number per minute.
- A signed, HttpOnly session cookie binds the browser to one report request.
- Cashfree payment status is verified server-side before prefill or bureau access.
- An atomic generation lock prevents duplicate paid bureau calls.
- Consent time, IP, user agent, version, OTP, payment, prefill, generation and download metadata are retained.
- Provider credentials and Cashfree secrets are server-only environment variables.

## WhatsApp OTP Setup

In Meta WhatsApp Manager, create an `Authentication` template named `credittrust_report_otp`:

- Language: English (`en`)
- Body: one OTP variable
- Button: `Copy Code`
- Expiry: 10 minutes

After Meta approves the template, configure `WHATSAPP_B2C_OTP_TEMPLATE=credittrust_report_otp`. Existing `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are used to send it.

## Production Environment

- `CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_ENV=production`
- `B2C_REPORT_PRICE`
- `NEXT_PUBLIC_B2C_REPORT_PRICE`
- `B2C_SESSION_SECRET`
- `WHATSAPP_B2C_OTP_TEMPLATE`
- `WHATSAPP_B2C_OTP_LANGUAGE=en`
- `WHATSAPP_B2C_OTP_BUTTON_TYPE=copy_code`

## Verification

- Build and TypeScript checks must pass.
- Invalid mobile and missing-consent requests must be rejected without sending OTP.
- Production smoke testing must not trigger a paid bureau pull.
