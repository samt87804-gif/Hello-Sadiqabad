# Owner Plan & Payment — Manual Acceptance Checklist

**Status:** Implemented and deployed; owner acceptance pending.

## Confirmed plan configuration

- Free plan: existing feature set and limits retained; Website URL is not available.
- Basic: **Rs. 700 per month**; existing feature limits retained; Website URL enabled.
- Premium: **Rs. 1,500 per month**; existing feature limits retained; Website URL enabled.
- Existing saved Free-plan website URLs are preserved in the database, but hidden publicly and read-only in the Free Owner editor.
- Plan activation begins only after Admin independently verifies payment. Approval grants one month. Renewal extends from the later of the current expiry or approval time by one month.

## Owner tests

1. Sign in to an Owner account on the Free plan. Open **Owner Portal → Business Profile / Edit Listing**. Confirm Website URL is disabled and a note says it is included in Basic and Premium.
2. Save a different permitted Free-plan field. Confirm the existing listing saves normally and no existing website URL is deleted.
3. Open **Owner Portal → Plans**. Confirm the three plan cards show the configured limits and the prices above. Compare photos, videos, offers, social links, WhatsApp, website URL, cover, gallery, verified badge, QR code, inquiry button, analytics and search priority. Do not change any limits.
4. On a Basic or Premium test business, open Edit Listing. Add a valid HTTPS Website URL and save. Open the public business profile and confirm the Website button appears.
5. Open **Choose / Renew Plan**. Select JazzCash, Easypaisa and UBL one at a time. Confirm each account title and number; for UBL also confirm the IBAN. Check that each method's icon appears after Admin uploads it.
6. Do not submit a payment request with a made-up reference and do not approve a payment that was not actually received. For a real request, transfer the exact amount, enter the transaction/reference number, tick the paid confirmation and send the request.
7. Confirm the Owner sees the request as waiting for Admin review and cannot submit a duplicate while it is pending.

## Admin tests

1. Sign in to Admin and open **Moderation Queue**. Confirm the plan payment request appears with the business, selected plan, amount, payment method, account details captured at submission time, owner-paid confirmation and transaction reference.
2. Compare the reference and amount against the actual receiving JazzCash / Easypaisa / UBL account. Only after a genuine match, choose **Verify Payment & Activate 1 Month**.
3. Confirm the business plan changes to the selected plan, the expiry date is one month from the later of today or the previous expiry, an audit record is created and the Owner receives a notification.
4. Open **Businesses** and confirm Admin can see the plan expiry date. Ask the Owner to open **Plans** and confirm the same validity date and remaining days.
5. For a genuine rejected payment or a safe test request that was not paid, choose **Reject Payment** with a clear reason. Confirm the Owner sees Rejected and the reason, and the business plan does not change.

## Image compression tests

1. Use a normal JPG/PNG image in an Admin image upload, an Owner business image upload and a Government Jobs/Schemes or SDK Jobs poster upload.
2. Confirm the upload completes and the stored/uploaded image is WebP.
3. Confirm the reported compressed byte size is smaller than the original. If the browser cannot compress the image or cannot make it smaller, the upload should be blocked rather than uploading the original.

## Important safeguards

- Never approve an unverified or fabricated payment.
- Never use a real customer's account or business to run destructive tests.
- Do not delete existing business records, plan history, payment references or images during acceptance testing.
- If any step fails, report the step number and what appeared on screen; do not repeatedly submit the same payment request.
