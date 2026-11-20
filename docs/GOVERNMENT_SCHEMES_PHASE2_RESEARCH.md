# Government Schemes — Phase 2 research & readiness notes

**Research date:** 20 November 2026 (Pakistan time)  
**Status:** Phase 2 MVP implemented and deployed; five official-source information records are published with application intake explicitly marked unconfirmed until a current intake window is verified.  
**Scope:** Punjab + Federal programmes, clearly labelled by government level.  
**Rule:** A programme is not marked open for applications solely because an information page exists. Verify the current intake window, live application route, eligibility and any deadline immediately before publication.

## 1. Candidate programme shortlist

### A. Punjab — Apni Chhat Apna Ghar
- Official information: https://smu.punjab.gov.pk/apni-chat-apna-ghar-program
- Official application portal referenced by the programme page: https://acag.punjab.gov.pk/
- The Punjab SMU page describes a housing initiative and lists eligibility for Punjab residents who own a qualifying residential plot (up to 5 marla urban / 10 marla rural). The current page reviewed does **not** establish a current loan amount or financing offer, so the public listing does not state a loan amount.
- The same page describes Punjab permanent-residency and land-ownership conditions, plus bank-default/criminal-record restrictions.
- **Publication caution:** The information page's deadline statement is stale (it refers to 2025) and does not establish the current 2026 application window. Recheck the live portal and current government notices before labelling the intake open or entering a closing date.
- Suggested category: Housing / Home construction.
- Source status: Official programme page found; current application availability needs fresh confirmation.

### B. Punjab — CM Punjab Asaan Karobar Card
- Official information: https://psic.punjab.gov.pk/node/177
- Official PSIC ongoing-programmes index: https://psic.punjab.gov.pk/index.php/ongoing
- PSIC describes a three-year digital SME-card financing programme with loans up to PKR 1 million, three-month grace period, 33 monthly instalments, and 0% markup for borrowers (subsidised by Punjab).
- Listed eligibility includes age 21–57, Pakistani nationality and Punjab residence according to valid CNIC, business location in Punjab, valid CNIC, and mobile phone registered in the applicant's own name.
- PSIC page lists a PKR 500 processing fee and annual card fee PKR 25,000 + FED. These costs must be reproduced clearly, never described as “free”. The Punjab SMU page also links to the official programme website `https://akc.punjab.gov.pk/cmpunjabfinance`.
- **Publication caution:** PSIC includes the programme in its “Ongoing” list, but this alone does not confirm that fresh applications are currently being accepted or that the application portal is open. Confirm intake and current fee/terms before publication.
- Suggested category: Business finance / SME.
- Source status: Official details and ongoing listing found; live application intake needs confirmation.

### C. Federal — Prime Minister's Youth Business & Agriculture Loan Scheme (PMYB&ALS)
- Official portal: https://pmybals.pmyp.gov.pk/
- Official online application route shown by the portal: https://pmyp.gov.pk/bankform/newapplicantform
- The official programme portal describes eligibility for resident Pakistani citizens aged 21–45, with a lower age limit of 18 for IT/e-commerce businesses.
- The official portal currently displays three tiers: up to PKR 0.5 million at 0% markup; above PKR 0.5 million to PKR 1.5 million at 5%; above PKR 1.5 million to PKR 7.5 million at 7%.
- A Press Information Department release dated 10 November 2026 announced a new Tier 4 above PKR 7.5 million up to PKR 25 million at 8% markup for up to eight years: https://pid.gov.pk/site/press_detail/34717. The portal page reviewed still displays the older three tiers; the new tier must not be presented as available through the application form until the official portal / participating bank confirms implementation.
- Applications are submitted online through the official portal; non-resident Pakistanis and government employees are listed as ineligible.
- **Publication caution:** Recheck the current application form, participating banks, tier limits and terms before publishing. These are financing terms, not a grant.
- Suggested category: Business / Agriculture finance.
- Source status: Official portal and live application route found; terms need date-stamped re-verification at publication.

### D. Federal — Benazir Kafaalat (BISP)
- Official programme page: https://www.bisp.gov.pk/Detail/YTgzNjkxM2YtN2ViMC00MjA5LWI0MDMtNzM4ZWJmMGVlNzc5
- Official BISP information: https://www.bisp.gov.pk/
- Official status portal referenced by BISP: https://8171.pass.gov.pk
- BISP describes Benazir Kafaalat as its core unconditional cash-transfer programme for eligible families, with women as the principal beneficiaries.
- BISP material describes dynamic registry / registration desks at tehsil level and eligibility assessment through the programme's official process.
- Official BISP notices warn that 8171 is the only official SMS number and that the survey/registration has no fee. Do not direct people to agents or unofficial WhatsApp/phone numbers.
- **Publication caution:** Do not publish a stipend amount from old notices without confirming the current quarter's official notification. Do not promise eligibility or payment. Explain that the 8171 portal/SMS only checks status; it is not a guarantee of enrolment.
- Suggested category: Social protection / Cash assistance.
- Source status: Official programme and anti-fraud information found; current eligibility threshold and payment amount need current notice verification.

### E. Federal — Benazir Hunarmand Programme
- Official portal: https://hunarmand.bisp.gov.pk/
- The official portal states that applicants must already be registered in the BISP Dynamic Registry, have at least Matric education, be aged 18–40, and only one person per family may register.
- The portal says it is for registration only; applications are reviewed and only eligible candidates are selected. It also points to the nearest Tehsil Office as an in-person information/registration option. The portal page reviewed does not confirm current Sadiqabad district/course availability; candidates should check before travelling.
- **Publication caution:** Recheck whether registration is still open in the portal and confirm current district/course availability before labelling it open.
- Suggested category: Skills / Training / Employment.
- Source status: Official live portal found; intake availability and local course capacity need confirmation.

## 2. Cross-cutting safety rules for public scheme pages

- Never ask visitors to submit CNIC numbers, CNIC photos, OTPs, bank account numbers, card details, passwords or private financial documents to Hello Sadiqabad.
- Never collect application fees or claim that Hello Sadiqabad can approve, accelerate or guarantee a government benefit/loan.
- Clearly distinguish grants, cash transfers, subsidised financing and repayable loans. Display all fees, markup, repayment and grace-period information when officially stated.
- Link directly to official programme and application domains. No shortened URLs, agent phone numbers or unofficial WhatsApp groups.
- Warn users that 8171 is the official BISP SMS number; do not present other numbers as BISP.
- Store source name, source URL, source document URL, verified timestamp, next review timestamp, current intake status and an explicit editorial note where a fact remains unconfirmed.
- Expired, paused, suspended or intake-unconfirmed schemes must not be displayed as “Apply now”.
- Public report-outdated action must not require personal contact details; keep it separate from eligibility/application data.

## 3. Proposed Phase 2 data model (design only)

Recommended additive tables, subject to a fresh live-schema/migration check before implementation:

1. `public.government_schemes`
   - Public fields: slug, bilingual title/summary, government scope (Punjab/Federal/other), category, benefit type, benefit details, eligibility checklist, required documents, official apply URL, official information/source URLs, current status, application start/end dates, verified_at, next_review_at, published_at, image URL only if a later approved media design exists.
   - Admin-only fields: internal review note, editorial status, created/updated/published actor IDs.
   - Status should distinguish `draft`, `upcoming`, `open`, `paused`, `closed`, `expired` and `cancelled`; never infer an open intake from a generic programme description.

2. `public.government_scheme_revisions`
   - Append-only change snapshots for material eligibility, benefit, deadline, status, official URL and source-verification changes.
   - Record actor and timestamp; public history may show only approved published snapshots.

3. `public.government_scheme_reports`
   - Minimal “report outdated / broken official link” workflow.
   - Store scheme ID, reason, optional short note and created_at only; do not request CNIC, phone, email or other sensitive data.

4. Dedicated permission `government_schemes.manage`
   - Super Admin and explicitly authorised staff only.
   - Public anonymous SELECT limited to published public fields; no draft, internal notes or private reports.
   - Explicit grants, RLS, audit triggers and supporting indexes; no broad staff-type default access.

## 4. Public/Admin UX outline

- Public landing page: category chips, Punjab/Federal filter, status filter, search, and a clear “last verified” date.
- Scheme detail page: benefit type, eligibility checklist, required documents, application steps, official links, costs/repayment, safety warning, and current intake status.
- Admin Scheme Manager: draft/edit/duplicate, publish/close/pause/cancel, source verification, review queue, revision history and report review.
- No auto-scraping or auto-publishing in MVP. Assistant research may prepare drafts, but Admin controls publication.
- Keep published scheme data available to the public chatbot only after a separate public-field allowlist and RLS/privacy review.

## 5. Phase 2 acceptance gates

- Each published scheme has a current official source and verified_at timestamp.
- Current application availability is independently confirmed; no stale deadline or unsupported “open now” claim.
- Punjab/Federal labels and benefit type are unambiguous.
- Fees, markup, repayment and non-grant nature are explicit where applicable.
- Public users cannot read drafts, internal notes or report records.
- Report-outdated flow stores no unnecessary personal/sensitive data.
- Admin writes require `government_schemes.manage` and are audited.
- Pakistan timezone/date-boundary tests, mobile/browser QA, CI and production deployment evidence are recorded.


## 6. Phase 2 implementation checkpoint — 20 November 2026

### Delivered
- Public route `/government-schemes` and detail routes `/government-schemes/:slug`, with search, Punjab/Federal filter, category filter, intake-status filter, bilingual titles, benefit type, eligibility, document checklist, steps, fees/repayment, official source links, last-verified and next-review dates.
- Five initial official-source scheme records: Apni Chhat Apna Ghar; CM Punjab Asaan Karobar Card; Prime Minister's Youth Business & Agriculture Loan Scheme; Benazir Kafaalat; Benazir Hunarmand.
- All five records are published as information pages, but `intake_status='unconfirmed'`. No deadline is invented and no “Apply Now” wording is shown while intake is unconfirmed. Official portals are labelled as places to check current availability.
- The PMYB&ALS record distinguishes the three tiers still shown on the official portal from the Tier 4 announced by PID on 10 November 2026; it warns that the new tier is not yet reflected on the portal page reviewed.
- The Asaan Karobar Card record states the PSIC processing and annual card fees, the 0% borrower markup and the repayable nature of the facility.
- BISP record avoids a stale stipend amount, states that the dynamic survey is free and 8171 is the only official SMS number.
- Benazir Hunarmand record does not claim Sadiqabad course availability.
- Admin tab `Government Schemes` is gated by dedicated `government_schemes.manage` permission; Super Admin receives it through `my_permissions()`, and other staff require explicit permission.
- Admin can create/edit/draft/publish/archive schemes, set intake status and verification/review dates, review public correction reports and inspect append-only revision snapshots.
- Public “Report outdated information” accepts only reason + optional short note (max 500 chars); it does not collect contact details, CNIC, OTP, bank or application data. Duplicate reports for the same scheme/reason are rate-limited to one per hour.
- An open intake is blocked unless an official application URL and next-review date are present, in both the client validation and database constraint.
- Published scheme records are visible to anonymous users; drafts and report records are not. Reports are insert-only for public users and readable/reviewable only by authorised Admin staff.
- Scheme create/update and report review are audit logged; scheme changes also create append-only before/after snapshots.

### Applied migrations
- `20261120153621_government_schemes_mvp.sql`
- `20261120154049_government_schemes_fk_indexes.sql`
- `20261120154130_government_scheme_reports_authenticated_submit.sql`
- `20261120154355_government_schemes_official_seed_v1.sql`
- `20261120154533_government_schemes_open_intake_guard.sql`
- `20261120154622_government_scheme_revision_history.sql`

### Remaining acceptance
- Reconfirm each programme's live intake, current application URL and any changed eligibility/fees immediately before changing its intake status to open.
- Verify public routes in a real browser and on a physical mobile device; the web browser tool could not fetch the production route.
- [x] Latest Cloudflare Pages deployment after the final UI refinements: ec963236-1709-4eee-9618-59185c891b96 succeeded with alias https://hellosadiqabad.com; npm run build completed successfully. Pages build is not a substitute for TypeScript/unit-test CI.
- Keep the public chatbot integration out of scope until a separate public-field allowlist and privacy review.
