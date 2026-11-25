# SDK Jobs — Local Recruitment and Referral Service Plan

**Owner-approved decisions:** 25 November 2026. This is a new private-sector local recruitment module, distinct from Government Jobs.

## 1. Who can post
Only a Supabase-authenticated, Admin-approved business owner who has at least one published business. Verify ownership and active status server-side using current canonical relationships. No public self-asserted owner status.

## 2. Owner submission
Collect vacancy details only: English/Urdu job title and description, job category, vacancy count, job type, work area/location, salary (optional), duties, qualifications, experience, hours/shift, benefits (optional), closing date and optional poster. Do not ask for owner/business contact details for public display. The system may retain the posting owner/business relationship privately for Admin review.

All submissions start pending. Admin approval is mandatory. Edits to a live job that materially change its content return to review.

## 3. Public privacy
Public job pages must not reveal poster identity, business/owner name, phone, WhatsApp, Gmail, private business IDs, owner IDs, candidate or moderation data. Admin-only views show employer and source business. Review API, SEO metadata, Open Graph, sitemap, offline data, logs and search indexes for leakage.

## 4. Public experience and sharing
- SDK Jobs listing, search, filters and detail pages.
- Stable canonical URL per published job.
- Approved image in page card and social share preview.
- Share/copy link action.
- Contact Admin on WhatsApp: **03283212342**.
- Prefill a neutral message with job title and public URL only.
- No direct public employer contact or in-app employer application.
- Clear vacancy, area, requirements, closing date and office-visit instructions.

## 5. Candidate workflow
1. Candidate contacts Admin.
2. Admin asks candidate to bring a physical CV during office hours.
3. Admin records candidate intake with consent and minimum necessary details.
4. Admin interviews/screens candidate for the selected vacancy.
5. Admin records suitability decision and reason.
6. If suitable, Admin refers candidate to the linked employer.
7. Admin generates an official referral letter with unique reference and verification mechanism.
8. Admin tracks referral outcome.

No online CV upload in initial release. Candidate data, interview notes, contact details and CV details are private Admin-only. Define retention/deletion policy before collecting candidate data. Share minimum necessary candidate information with an employer only after candidate consent and referral. Referral is not a job guarantee.

## 6. Fee policy
- Free service through **31 January 2027 inclusive**.
- Fee may apply from **1 February 2027**.
- Fee amount is not decided. It must be configured by authorized Admin; never invent, hardcode or collect an unapproved amount.
- Only candidate pays. No business-owner fee under this plan.
- Admin records waived/free-period, pending, paid and refund/void states as applicable, with amount, currency, payment date, method/reference, operator and audit trail.
- No payment gateway in initial scope.
- If 1 February arrives and fee is unset, do not invent a price or collect money; show “fee to be confirmed/contact Admin” and follow an explicitly approved Admin policy.

## 7. Recruitment office contact and schedule
- WhatsApp: **03283212342**.
- Default days: Monday–Friday.
- Default hours: **10:00 AM–2:00 PM Pakistan time**.
- Saturday and Sunday: closed.
- Candidate copy must state strictly: do not arrive before 10:00 AM or after 2:00 PM; do not visit Saturday/Sunday.
- Admin may change office hours and working days through a controlled, audited setting. Show the same current schedule across SDK Jobs and job details.
- Do not invent an office address. Use existing verified address only, or ask owner to confirm before publishing.

## 8. Admin workspace
- Job submission/review queue, employer identity and linked business.
- Approve, reject, request correction, edit, unpublish, close/expire, reopen and archive.
- Candidate intake and consent, interview scheduling/notes, suitability and referral statuses.
- Referral letter generation, unique reference, printable/shareable PDF or controlled document, verification page/code and audit log.
- Fee settings, free-period status, collection ledger and receipts.
- Office schedule and WhatsApp settings.
- Strict permission separation and audit of every sensitive action.

## 9. Data/security requirements
Use additive schema after auditing current database and migration ledger. Separate public job content from private employer linkage and candidate records. RLS and server-side functions enforce owner eligibility, moderation, candidate access, fee management and letter issuance. Public anonymous SELECT returns published/active safe fields only. No candidate or employer private data in offline cache, public search, metadata or analytics. Keep Pakistan timezone consistent for deadlines and schedule.

## 10. Acceptance
- Unapproved/unqualified owners cannot post.
- No submitted job is public before Admin approval.
- Employer identity remains Admin-only on every public surface.
- Contact CTA uses the approved WhatsApp number.
- Office schedule/weekend closure is correct and Admin configurable.
- Free through 31 Jan 2027; no fee amount invented; candidate-only fee.
- Candidate records and CV details remain private.
- Referral and letter are auditable and not represented as a placement guarantee.
- Every published job has a canonical share URL and approved social image.


## Phase 4 kickoff — 26 November 2026

The owner confirmed all testing through Government Jobs and Government Schemes (master workstream 4.3) is complete and correct. The next workstream is this SDK Jobs plan; do not repeat the already accepted tests unless a regression is reported.

- [x] Reconciled this plan with current `main` and the Final Product Expansion Master Plan.
- [x] Confirmed no SDK Jobs routes, table, owner submission UI, Admin manager or Edge Function exists yet; Government Jobs remains separate.
- [x] Inspected current owner eligibility source: active `profiles.role='owner'` and at least one `businesses` row with `owner_id=auth.uid()` and `status='published'`.
- [x] Inspected current dedicated Admin permission pattern and live RLS/grants. New permission must be `sdk_jobs.manage` and must be explicit for staff; do not add broad staff-type defaults.
- [x] Inspected live migration ledger (108 applied versions). Existing data/schema baseline must not be replayed.
- [x] Added detailed data-boundary/security design: [`SDK_JOBS_PHASE4_DATA_MODEL_SECURITY_DESIGN.md`](SDK_JOBS_PHASE4_DATA_MODEL_SECURITY_DESIGN.md).
- [ ] Finish exact areas schema, staff permission editor and Storage limits review.
- [ ] Additive `sdk_jobs` schema, private employer linkage, published-only public view and append-only moderation history.
- [ ] Owner submission form and server-side eligibility enforcement.
- [ ] Permission-gated Admin moderation.
- [ ] Public listing/detail/search/filter/share pages and employer-anonymity checks.
- [ ] Run authorization, public leakage, status-transition, media privacy, CI and deployment acceptance.

**Phase boundary:** candidate intake, consent records, CV details, interview notes, suitability, referrals, referral letters, fees and office-hour configuration remain Phase 5. Do not collect candidate personal data in Phase 4.

**Current status:** Phase 4 audit/design is in progress. No application code, migration, RLS, Storage policy or production record was changed by the audit.
