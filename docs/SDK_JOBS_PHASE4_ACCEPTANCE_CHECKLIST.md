# SDK Jobs Phase 4 — Owner/Admin Acceptance Checklist

**Purpose:** Final authenticated-browser acceptance for the Phase 4 SDK Jobs implementation. On 26 November 2026, the owner explicitly confirmed that they personally tested and passed every item in Sections 1–8. Those acceptance items are checked on the basis of that owner confirmation; production deployment and post-deployment smoke tests remain separate release gates.

**Safety rules**
- Do not share passwords, OTPs, cookies, service-role keys or access tokens in chat.
- Use an existing authorized Owner account linked to a published business and an authorized Admin account with explicit `sdk_jobs.manage`.
- Do not publish a dummy/test vacancy. Use a legitimate job only if the Owner intends to submit it.
- Do not create fake candidate applications, CVs, referrals or fee records; those are Phase 5.
- Do not delete existing production records. If a test submission is created, use Admin status controls to reject/archive it only after the Owner confirms.
- The public street address is not confirmed. Do not invent one or direct anyone to an unverified location.

## 1. Owner Portal — eligibility and submission

- [x] Sign in as an active Owner with at least one own published business.
- [x] Confirm SDK Jobs appears in Owner navigation and `/owner/sdk-jobs` is owner-role protected.
- [x] Confirm business selector contains only that Owner's published businesses.
- [x] Submit a legitimate vacancy with required English title, summary, description, category, vacancy count and job type.
- [x] Confirm server sets Owner identity and `pending_review`; Owner cannot choose employer ID or publish status.
- [x] Confirm request appears in Owner list with pending status.
- [x] Confirm an Owner without an own published business cannot submit.

## 2. Owner poster upload

- [x] Upload a JPEG, PNG or WebP poster no larger than 5 MiB.
- [x] Confirm upload is sent through `create-sdk-job-poster-upload` and goes to the private `hs-pending-business-media` bucket under the SDK Jobs pending prefix.
- [x] Confirm Owner list reports poster uploaded / Admin review pending; no public image URL is exposed.
- [x] Confirm unsupported MIME types and files larger than 5 MiB are rejected.
- [x] Confirm Owner cannot attach a path containing another job ID or Owner ID.\n- [x] Confirm unsafe slugs (slashes, traversal strings, uppercase or spaces) are rejected and Owner cannot change a slug after submission.
- [x] Confirm Owner cannot change job content while the row is `pending_review`; only the pending poster path can be attached.
- [x] Confirm Owner cannot read private Admin notes or modify `owner_feedback`.

## 3. Admin access and private review

- [x] Sign in as Super Admin or active staff explicitly granted `sdk_jobs.manage`.
- [x] Confirm SDK Jobs appears in Admin navigation.
- [x] Sign in as staff without `sdk_jobs.manage` and confirm the tab and Edge Function endpoints deny access.
- [x] Open the job and confirm linked business name/contact and Owner name/contact appear only in the Admin private details panel.
- [x] Confirm pending poster preview uses a short-lived signed URL from the private bucket.
- [x] Confirm private Admin notes are separate from Owner-facing feedback.
- [x] Confirm Admin can see all public content fields in English and Urdu before publication.

## 4. Poster approval and rejection

- [x] Reject a pending poster and confirm the private pending path is cleared; Owner can upload another poster.
- [x] Upload a replacement poster and approve it.
- [x] Confirm server verifies actual file signature (JPEG/PNG/WebP) and size before promotion.
- [x] Confirm approved image is copied to the existing public media bucket only after Admin approval.
- [x] Confirm pending private object is removed where cleanup succeeds and `pending_media_path` is cleared.
- [x] Confirm approving a poster does not publish the job; job remains pending Admin publication.
- [x] Confirm Publish remains blocked if no approved poster exists.\n- [x] Confirm a direct authenticated Supabase update cannot set `approved_image_url` or transition status to `published` without the service-role one-time authorization created by the secure Edge Function.\n- [x] Confirm anon/authenticated roles cannot execute `authorize_sdk_job_admin_action`; only service_role can.

## 5. Correction and resubmission loop

- [x] Admin enters a clear Owner-facing reason and selects Request correction.
- [x] Confirm Owner sees `owner_feedback` in Owner Portal but cannot edit it.
- [x] Confirm private Admin notes are not visible to Owner.
- [x] Owner opens Edit & resubmit for a `changes_requested` job and corrects the requested fields.
- [x] Confirm resubmission returns job to `pending_review` and clears old Owner feedback.
- [x] Confirm pending poster path is preserved unless Admin rejected the poster.
- [x] Confirm Owner cannot edit a published job through the UI (this remains disabled until public-version preservation is designed).

## 6. Publication privacy gate

- [x] Admin checks the required privacy acknowledgement, including the poster image itself.
- [x] Try to publish content containing the linked business name; confirm server-side publication is blocked.
- [x] Try to publish content containing Owner name, Owner email/phone, any phone/email pattern or external contact link; confirm blocked.
- [x] Confirm the error message does not echo private values.
- [x] Remove private identity/contact details and publish again.
- [x] Confirm `publish-sdk-job` requires active Admin + `sdk_jobs.manage`, pending-review status, approved poster and a closing date that has not passed in Pakistan time.
- [x] Confirm successful publication records reviewer/time and status history.

## 7. Public listing and detail pages

- [x] Open `/sdk-jobs` anonymously and confirm only published/current jobs appear.
- [x] Confirm search and category, job type, area and closing-date filters work.
- [x] Open `/sdk-jobs/:slug` and confirm English/Urdu title, summary and job details render.
- [x] Confirm only approved poster is public.
- [x] Confirm employer/business name, Owner name, phone, email, WhatsApp, private IDs, pending media path, Owner feedback and Admin notes do not appear in page, metadata, JSON-LD, analytics or sitemap.
- [x] Confirm salary is shown only when `salary_disclosed=true`.
- [x] Confirm no direct Apply form, candidate upload, CV or referral flow appears in Phase 4.
- [x] Confirm WhatsApp CTA points to the approved Admin contact `923283212342` and pre-fills only job title + canonical URL.
- [x] Confirm office instruction says bring a physical CV Monday–Friday 10:00 AM–2:00 PM Pakistan time; Saturday/Sunday closed.
- [x] Confirm no unverified street address is shown.

## 8. Social previews, SEO and sitemap

- [x] Test the detail URL with WhatsApp/Facebook/Telegram/Slack preview tools and confirm title, short summary, approved image and canonical URL.
- [x] Confirm JobPosting JSON-LD uses generic `Confidential local employer` and no employer identity/contact fields.
- [x] Confirm an unpublished/closed/expired slug returns 404/noindex for crawlers.
- [x] Confirm sitemap includes only published/current SDK Jobs slugs from `sdk_jobs_public`; pending/rejected/closed jobs are absent.
- [x] Confirm canonical URLs use `https://hellosadiqabad.com`.

## 9. Release gate

- [x] Latest GitHub CI passes TypeScript, tests, production build, Supabase Edge Function checks and Node syntax checks for Cloudflare Pages social-preview functions.
- [x] Authenticated Owner/Admin browser acceptance above is complete — owner-confirmed on 26 November 2026.
- [ ] Production Pages deployment succeeds.
- [ ] Production smoke tests pass for Owner route, Admin permission gate, public listing/detail, social preview and sitemap.
- [x] Owner confirms acceptance — owner explicitly confirmed all checklist testing passed on 26 November 2026.

**Acceptance update (26 November 2026):** Owner-confirmed pass for all Owner Portal, poster upload, Admin review, poster approval/rejection, correction/resubmission, privacy gate, public listing/detail, social-preview, SEO and sitemap testing in Sections 1–8. Latest code CI [45712905357](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45712905357) passed. Production Pages deployment and production smoke tests are still pending.

**Implementation state at checklist creation (26 November 2026):** Code and four JWT-protected Edge Functions are committed/deployed; seven additive SDK Jobs migrations are live; database transaction security tests passed and were rolled back; live SDK Jobs/history/Admin-note counts are zero. Latest CI [45712905357](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45712905357) passed build and Supabase Edge Function checks after database-enforced Admin action authorization was added. Owner confirmed that all Owner/Admin browser acceptance items in Sections 1–8 were personally tested and passed on 26 November 2026. Production Pages deployment and post-deployment production smoke tests remain open.
