# Meta Marketing Automation

This module adds Meta Page publishing, Instagram publishing, Click-to-WhatsApp ads, WhatsApp lead attribution, report tracking, insights sync, and automation rules inside the Credit Trust admin.

## Admin Screens

- `/admin-meta-marketing`: campaign dashboard, builder, campaign actions, lead inbox, tracking summary, automation controls.
- `/admin-meta-marketing/[id]`: campaign detail, Meta IDs, post/ad preview, leads, events timeline.
- `/admin-whatsapp-analytics`: outbound WhatsApp template delivery/read/failed/click/reply analytics.

## Required Meta Permissions

- `pages_manage_posts`
- `pages_read_engagement`
- `pages_show_list`
- `ads_management`
- `ads_read`
- `business_management`
- `whatsapp_business_messaging`
- `whatsapp_business_management`
- `instagram_basic`
- `instagram_content_publish`

Instagram permissions are only required when Instagram publishing is enabled.

## Required Environment Variables

- `META_GRAPH_API_VERSION`
- `META_ACCESS_TOKEN`
- `META_PAGE_ACCESS_TOKEN`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_WEBHOOK_REQUIRE_SIGNATURE`
- `META_BUSINESS_ID`
- `META_AD_ACCOUNT_ID`
- `META_PAGE_ID`
- `META_INSTAGRAM_USER_ID`
- `META_WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_DISPLAY_NUMBER=8109276589`
- `META_SPECIAL_AD_CATEGORIES=CREDIT`
- `MARKETING_CRON_SECRET`
- `CRON_SECRET`
- `WHATSAPP_TRACKING_BASE_URL=https://credittrust.in`
- `WHATSAPP_B2C_REPORT_READY_TEMPLATE`
- `WHATSAPP_B2C_REPORT_READY_LANGUAGE`
- `WHATSAPP_B2C_REPORT_READY_BODY_VALUES`
- `WHATSAPP_B2C_REPORT_READY_URL_BUTTON_MODE`

Do not expose access tokens, app secret, webhook tokens, or cron secrets in frontend code or admin UI.

## Meta Business Manager Setup

1. Connect the Credit Trust Facebook Page and ad account to the Meta app.
2. Connect Instagram account if Instagram publishing is needed.
3. Connect WhatsApp Business Account and phone number `8109276589`.
4. Add the app permissions listed above and complete review where required.
5. Configure webhook callback:
   - Meta webhook: `https://credittrust.in/api/meta/webhook`
   - WhatsApp webhook: `https://credittrust.in/api/whatsapp-webhook`
   - Legacy portal webhook URLs on `portal.credittrust.in` remain valid for backward compatibility.
6. Use the verify tokens from Vercel env variables.
7. Subscribe to Page/Instagram fields for comments/reactions where permissions allow.
8. Subscribe WhatsApp webhook to message and status updates.
9. Keep ad campaigns in `CREDIT` special ad category unless legal/compliance approves another setting.

## Campaign Flow

1. Admin creates campaign in `/admin-meta-marketing`.
2. System generates `campaign_code`, `ad_code`, `tracking_token`.
3. System creates prefilled WhatsApp message:
   `Hi Credit Trust, I want to check my credit report. Ref: CT_META_...`
4. Admin publishes/schedules Page or Instagram post if desired.
5. Admin creates Click-to-WhatsApp ad. New ads are created in paused state first.
6. Admin resumes campaign after reviewing Meta creative.
7. Incoming WhatsApp messages are attributed by campaign code and referral fields.
8. Report links use `/r/{tracking_token}` and log every click/open before redirect.
9. Insights sync stores spend, reach, impressions, clicks, CTR, CPC, CPM, frequency, and cost per result.
10. Automation rules evaluate on cron and can pause/resume/update budget when execute mode is enabled.
11. Vercel Hobby deployments can only run daily cron schedules, so production cron is daily-safe. On Pro, use more frequent schedules such as 6-hour insights sync and 30-minute automation evaluation.

## Testing Checklist

- Create a campaign draft.
- Upload image/video asset or paste a public media URL.
- Verify generated prefilled WhatsApp message contains campaign code.
- Publish a Facebook Page test post.
- Create Click-to-WhatsApp ad and confirm it is created as paused.
- Resume only after reviewing Meta Business Manager preview.
- Send a WhatsApp test message containing the generated campaign code.
- Confirm lead appears in `/admin-meta-marketing`.
- Confirm message/status appears in `/admin-whatsapp-analytics`.
- Open a `/r/{tracking_token}` test link and confirm report open is logged.
- Run insights sync and confirm dashboard metrics update.
- Run automation evaluation in dry-run first.

## Production Rollout Checklist

- Apply `20260908191447_meta_marketing_automation.sql`.
- Verify all 13 marketing tables exist.
- Add required Meta env variables to Vercel production.
- Add `MARKETING_CRON_SECRET` or `CRON_SECRET`.
- Confirm webhook verification from Meta succeeds.
- Confirm WhatsApp webhook still processes OTP status updates.
- Confirm Utility templates remain report/status/service-only.
- Confirm no guaranteed loan, guaranteed score improvement, or misleading score promise appears in ad copy.

## Known Meta API Limitations

- Comment/reaction readback depends on Page/Instagram permissions and review status.
- Instagram publishing requires a connected professional Instagram account and supported media format.
- Click-to-WhatsApp creative payload requirements can vary by ad account capabilities and Meta API version.
- Meta does not reliably provide per-customer link clicks for normal WhatsApp links; Credit Trust tracks customer opens via `/r/{tracking_token}`.
- Some campaign, adset, and creative operations may be rejected by Meta policy review even when the API call shape is valid.
