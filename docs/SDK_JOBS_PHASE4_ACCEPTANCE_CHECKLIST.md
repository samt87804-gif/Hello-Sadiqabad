# SDK Jobs Phase 4 — Owner/Admin Acceptance Checklist

**Purpose:** Final authenticated-browser acceptance for the Phase 4 SDK Jobs implementation. This is a test checklist, not proof that a test has passed. Keep every box unchecked until the owner/admin browser session confirms the exact behavior.

**Safety rules**
- Do not share passwords, OTPs, cookies, service-role keys or access tokens in chat.
- Use an existing authorized Owner account linked to a published business and an authorized Admin account with explicit `sdk_jobs.manage`.
- Do not publish a dummy/test vacancy. Use a legitimate job only if the Owner intends to submit it.
- Do not create fake candidate applications, CVs, referrals or fee records; those are Phase 5.
- Do not delete existing production records. If a test submission is created, use Admin status controls to reject/archive it only after the Owner confirms.
- The public street address is not confirmed. Do not invent one or direct anyone to an unverified location.

## 1. Owner Portal — eligibility and submission

- [ ] Sign in as an active Owner with at least one own published business.
- [ ] Confirm SDK Jobs appears in Owner navigation and `/owner/sdk-jobs` is owner-role protected.
- [ ] Confirm business selector contains only that Owner's published businesses.
- [ ] Submit a legitimate vacancy with required English title, summary, description, category, vacancy count and job type.
- [ ] Confirm server sets Owner identity and `pending_review`; Owner cannot choose employer ID or publish status.
- [ ] Confirm request appears in Owner list with pending status.
- [ ] Confirm an Owner without an own published business cannot submit.

## 2. Owner poster upload

- [ ] Upload a JPEG, PNG or WebP poster no larger than 5 MiB.
- [ ] Confirm upload is sent through `create-sdk-job-poster-upload` and goes to the private `hs-pending-business-media` bucket under the SDK Jobs pending prefix.
- [ ] Confirm Owner list reports poster uploaded / Admin review pending; no public image URL is exposed.
- [ ] Confirm unsupported MIME types and files larger than 5 MiB are rejected.
- [ ] Confirm Owner cannot attach a path containing another job ID or Owner ID.\n- [ ] Confirm unsafe slugs (slashes, traversal strings, uppercase or spaces) are rejected and Owner cannot change a slug after submission.
- [ ] Confirm Owner cannot change job content while the row is `pending_review`; only the pending poster path can be attached.
- [ ] Confirm Owner cannot read private Admin notes or modify `owner_feedback`.

## 3. Admin access and private review

- [ ] Sign in as Super Admin or active staff explicitly granted `sdk_jobs.manage`.
- [ ] Confirm SDK Jobs appears in Admin navigation.
- [ ] Sign in as staff without `sdk_jobs.manage` and confirm the tab and Edge Function endpoints deny access.
- [ ] Open the job and confirm linked business name/contact and Owner name/contact appear only in the Admin private details panel.
- [ ] Confirm pending poster preview uses a short-lived signed URL from the private bucket.
- [ ] Confirm private Admin notes are separate from Owner-facing feedback.
- [ ] Confirm Admin can see all public content fields in English and Urdu before publication.

## 4. Poster approval and rejection

- [ ] Reject a pending poster and confirm the private pending path is cleared; Owner can upload another poster.
- [ ] Upload a replacement poster and approve it.
- [ ] Confirm server verifies actual file signature (JPEG/PNG/WebP) and size before promotion.
- [ ] Confirm approved image is copied to the existing public media bucket only after Admin approval.
- [ ] Confirm pending private object is removed where cleanup succeeds and `pending_media_path` is cleared.
- [ ] Confirm approving a poster does not publish the job; job remains pending Admin publication.
- [ ] Confirm Publish remains blocked if no approved poster exists.

## 5. Correction and resubmission loop

- [ ] Admin enters a clear Owner-facing reason and selects Request correction.
- [ ] Confirm Owner sees `owner_feedback` in Owner Portal but cannot edit it.
- [ ] Confirm private Admin notes are not visible to Owner.
- [ ] Owner opens Edit & resubmit for a `changes_requested` job and corrects the requested fields.
- [ ] Confirm resubmission returns job to `pending_review` and clears old Owner feedback.
- [ ] Confirm pending poster path is preserved unless Admin rejected the poster.
- [ ] Confirm Owner cannot edit a published job through the UI (this remains disabled until public-version preservation is designed).

## 6. Publication privacy gate

- [ ] Admin checks the required privacy acknowledgement, including the poster image itself.
- [ ] Try to publish content containing the linked business name; confirm server-side publication is blocked.
- [ ] Try to publish content containing Owner name, Owner email/phone, any phone/email pattern or external contact link; confirm blocked.
- [ ] Confirm the error message does not echo private values.
- [ ] Remove private identity/contact details and publish again.
- [ ] Confirm `publish-sdk-job` requires active Admin + `sdk_jobs.manage`, pending-review status, approved poster and a closing date that has not passed in Pakistan time.
- [ ] Confirm successful publication records reviewer/time and status history.

## 7. Public listing and detail pages

- [ ] Open `/sdk-jobs` anonymously and confirm only published/current jobs appear.
- [ ] Confirm search and category, job type, area and closing-date filters work.
- [ ] Open `/sdk-jobs/:slug` and confirm English/Urdu title, summary and job details render.
- [ ] Confirm only approved poster is public.
- [ ] Confirm employer/business name, Owner name, phone, email, WhatsApp, private IDs, pending media path, Owner feedback and Admin notes do not appear in page, metadata, JSON-LD, analytics or sitemap.
- [ ] Confirm salary is shown only when `salary_disclosed=true`.
- [ ] Confirm no direct Apply form, candidate upload, CV or referral flow appears in Phase 4.
- [ ] Confirm WhatsApp CTA points to the approved Admin contact `923283212342` and pre-fills only job title + canonical URL.
- [ ] Confirm office instruction says bring a physical CV Monday–Friday 10:00 AM–2:00 PM Pakistan time; Saturday/Sunday closed.
- [ ] Confirm no unverified street address is shown.

## 8. Social previews, SEO and sitemap

- [ ] Test the detail URL with WhatsApp/Facebook/Telegram/Slack preview tools and confirm title, short summary, approved image and canonical URL.
- [ ] Confirm JobPosting JSON-LD uses generic `Confidential local employer` and no employer identity/contact fields.
- [ ] Confirm an unpublished/closed/expired slug returns 404/noindex for crawlers.
- [ ] Confirm sitemap includes only published/current SDK Jobs slugs from `sdk_jobs_public`; pending/rejected/closed jobs are absent.
- [ ] Confirm canonical URLs use `https://hellosadiqabad.com`.

## 9. Release gate

- [ ] Latest GitHub CI passes TypeScript, tests, production build, Supabase Edge Function checks and Node syntax checks for Cloudflare Pages social-preview functions.
- [ ] Authenticated Owner/Admin browser acceptance above is complete.
- [ ] Production Pages deployment succeeds.
- [ ] Production smoke tests pass for Owner route, Admin permission gate, public listing/detail, social preview and sitemap.
- [ ] Owner confirms acceptance; only then mark SDK Jobs Phase 4 complete in the Master Plan and Roadmap.

**Current state at checklist creation (26 November 2026):** Code and four JWT-protected Edge Functions are committed/deployed; two additive SDK Jobs migrations are live; database transaction security tests passed and were rolled back; live SDK Jobs/history/Admin-note counts are zero. Latest CI run is queued/pending. No authenticated browser acceptance or production Pages deployment has been claimed.
