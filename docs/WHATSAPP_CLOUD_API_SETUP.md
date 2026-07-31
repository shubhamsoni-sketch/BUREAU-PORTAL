# CreditTrust WhatsApp Cloud API Setup

CreditTrust uses Meta WhatsApp Cloud API through environment variables. The code is template-first for production safety: if template environment variables are blank, WhatsApp auto-send is skipped and existing email/portal flows continue.

## Required Meta Values

Add these in Vercel production environment:

```env
WHATSAPP_API_VERSION=v23.0
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_DEFAULT_COUNTRY_CODE=91
WHATSAPP_TEMPLATE_LANGUAGE=en
```

Where to find:

- `WHATSAPP_PHONE_NUMBER_ID`: Meta Business Suite / WhatsApp Manager phone number details.
- `WHATSAPP_ACCESS_TOKEN`: Meta Developer app access token or system user permanent token with WhatsApp messaging permissions.

## Optional Template Events

These are approved WhatsApp template names from Meta. Leave blank until the template is approved.

```env
WHATSAPP_DEMO_THANK_YOU_TEMPLATE=
WHATSAPP_PARTNER_ENQUIRY_TEMPLATE=
WHATSAPP_PARTNER_WELCOME_TEMPLATE=
```

Current event mapping:

- `WHATSAPP_DEMO_THANK_YOU_TEMPLATE`: sent after CRM website demo enquiry.
- `WHATSAPP_PARTNER_ENQUIRY_TEMPLATE`: sent after Become Partner enquiry.
- `WHATSAPP_PARTNER_WELCOME_TEMPLATE`: sent after admin creates/approves a partner.

## Admin Test Endpoint

After env is configured and deployed, an admin can test an approved template:

```http
POST /api/admin-whatsapp-test
Authorization: Bearer <admin-session-token>
Content-Type: application/json

{
  "to": "9893332647",
  "templateName": "demo_enquiry_reply",
  "languageCode": "en",
  "bodyValues": ["Shubham"]
}
```

The endpoint normalizes Indian 10-digit numbers to `91XXXXXXXXXX`.

## Logging

WhatsApp attempts are logged in `public.whatsapp_event_logs` after the migration is applied. Logging is non-blocking, so a missing table does not break partner/demo workflows.
