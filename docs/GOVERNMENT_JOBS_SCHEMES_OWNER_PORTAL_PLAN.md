# Hello Sadiqabad — Master Plan & New-Chat Handoff

> **START HERE in every new chat.** This document is the canonical handoff for the approved Government Jobs, Government Schemes and Business Owner Experience expansion. Read it before doing any work. Then read the linked permanent rules and current project documents listed below. Do not rely on old chat summaries as the source of truth.

## 0. Owner approval and current checkpoint

- **Owner approval:** The owner approved this plan on **20 November 2026** and authorised the work to proceed with **Phase 0 (requirements, data model, permissions, security and UX design)**.
- **Current status:** Phase 0 is authorised for inspection/design/documentation. Feature implementation, schema migrations and production data changes have **not** been authorised by this approval and must wait for the relevant phase approval.
- **Repository:** [samt87804-gif/Hello-Sadiqabad](https://github.com/samt87804-gif/Hello-Sadiqabad), work directly on `main`.
- **Production:** https://hellosadiqabad.com
- **Cloudflare Pages:** `hello-sadiqabad`
- **Supabase project ref:** `efwohfzqitevkuybnyif`
- **Immediate next action:** perform Phase 0 re-audit of current Admin permissions, moderation, audit logs, storage policies, schema/migration ledger and current UI; prepare proposed data model/RLS/permission design and UX/wireframes; document decisions and acceptance gates. Do not run migrations or alter production records in Phase 0.

## 0.1 Required reading order for every new chat

1. This file — complete feature plan, owner approval, phase status, trust rules and copy/paste handoff.
2. `docs/PROJECT_WORKING_RULES.md` — permanent owner-confirmed working and safety rules; mandatory for every change.
3. `PROJECT_ROADMAP.md` — live application-wide feature checklist.
4. `docs/NEW_CHAT_HANDOFF.md` — latest cross-project continuation notes; reconcile it with current GitHub `main`.
5. `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` — domain, security, SEO decisions and verification history.
6. Relevant feature plans before touching those areas, especially `docs/CHATBOT_PUBLIC_KNOWLEDGE_PLAN.md`, `docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md`, `docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md`, `docs/ANALYTICS_EXPANSION_ROADMAP.md`, and `DEPLOYMENT.md`.

**Source-of-truth hierarchy:** current GitHub `main` code and `supabase/migrations/` for implemented behavior/schema; `PROJECT_ROADMAP.md` for app-wide checklist; `docs/PROJECT_WORKING_RULES.md` for permanent rules; the relevant feature plan for its scope and acceptance criteria; `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` for domain/security/SEO. If a handoff or chat summary conflicts with current code, migrations or these canonical documents, inspect and reconcile—do not blindly follow the stale note.

## 0.2 Permanent project rules (quick reference)

The complete, authoritative rules remain in `docs/PROJECT_WORKING_RULES.md`. These mandatory rules are reproduced here so this plan remains useful when opened on its own:

1. **Protect production:** Hello Sadiqabad serves real visitors. Prefer narrow, backward-compatible, additive changes; do not rewrite working architecture for convenience.
2. **Direct main only:** commit directly to GitHub `main`. Do not create feature branches or Pull Requests unless the owner explicitly changes this rule.
3. **Inspect before every change:** inspect current implementation, callers, tests, configuration, routes, data flow, migrations, RLS, permissions and relevant Cloudflare/Supabase settings before editing.
4. **Preserve all existing data:** never delete, truncate, bulk-replace, re-seed over or mutate existing business, user, review, inquiry, owner, media or operational data. No destructive DB action without explicit owner approval. Prefer additive, reversible changes.
5. **Preserve security boundaries:** never bypass or weaken RLS, authentication, authorization, moderation, validation, rate limits or privacy. Never put service-role keys, tokens or secrets in frontend code, GitHub or chat.
6. **No collateral changes:** keep commits narrowly scoped; do not opportunistically refactor unrelated components, dependencies, styles, routes or business logic.
7. **No fabricated public facts:** do not invent businesses, owners, contact details, opening hours, images, sources, reviews, government job/scheme facts or eligibility.
8. **Verify with evidence:** run relevant tests, TypeScript checks, production build and CI; verify Cloudflare Pages deployment and affected production endpoints where possible. A green build is not proof of every user journey. Never claim checks that were not performed.
9. **Keep documentation current:** after meaningful progress, update this feature plan, `PROJECT_ROADMAP.md` and `docs/NEW_CHAT_HANDOFF.md`. Mark work complete only when acceptance evidence exists. Distinguish planned, implemented, CI-passed, deployed, endpoint-tested, browser-tested and device-tested.
10. **Respect phase gates:** follow the documented order. Do not skip blockers or mark a phase accepted before its criteria pass. Record blockers and the next safe action.
11. **Owner-only actions:** perform technical work available through connected tools. Ask the owner only for actions genuinely requiring their dashboard/private account, factual local verification, real-world participation or explicit approval. Never ask for passwords/private keys.
12. **Communication:** concise Roman Urdu updates. Clearly state what changed, what was tested, what is live, what remains unverified and any owner action required.

### Database, deployment and offline safeguards

- The live Supabase migration ledger differs from the consolidated repository baseline. Never replay the baseline, run an unreviewed schema push or assume the live ledger matches repository files.
- Do not modify Cloudflare DNS, Pages environment variables, Workers, R2, Auth dashboard settings or infrastructure unless required, reviewed and explicitly within scope.
- Keep `https://hellosadiqabad.com` as the canonical production domain; do not introduce a second indexable hostname.
- Commits to `main` trigger production deployment. Check the matching CI and Pages deployment before calling a change live.
- Never expose private customer/owner/admin data in public endpoints, logs, offline bundles or client storage.
- Offline downloads may contain only public, anonymous-RLS-approved data. Never cache Admin/Owner/auth/private data. Never queue submissions or report server writes as successful offline. Preserve the existing PWA/service-worker compatibility and online Supabase source-of-truth behavior.

## 0.3 Project-wide continuation snapshot (verify current state before acting)

- Public chatbot Parts 1–3 are implemented and deployed, including public-only retrieval and a Super Admin manual full-refresh control. Owner's first authenticated refresh and physical mobile/device checks were pending in the latest handoff. No vector index or model fine-tuning exists.
- Domain/SEO/security work has a separate master plan; Google indexing/ranking must never be claimed without Search Console evidence.
- Offline-first PWA has its own phase plan and strict public-only cache/write safeguards.
- Advanced analytics has its own implementation and expansion plans; retain privacy controls, permission boundaries and aggregate-only reporting.
- Business share-card SEO and mobile share popup changes have their own recorded verification checkpoints; re-check current main/CI/deploy before making claims.
- These notes are orientation only. Re-read the current handoff and feature-specific plans for exact commit IDs, deployment evidence and remaining checks.

## 0.4 Copy/paste instruction for a new chat

> We are continuing the existing **Hello Sadiqabad** project; do not start from scratch. First read `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md` (this file), `docs/PROJECT_WORKING_RULES.md`, `PROJECT_ROADMAP.md`, `docs/NEW_CHAT_HANDOFF.md`, and the relevant master/feature plans. Inspect current GitHub `main`, migrations, RLS and live configuration before any change. Work directly on `main`; no branches/PRs. Preserve production data and all security/moderation boundaries. The owner approved the Jobs, Schemes and Owner Experience plan on 20 November 2026 and authorised **Phase 0 design/audit only**. Start with Phase 0; do not implement features, apply migrations or mutate production data until the relevant later phase is explicitly authorised. Keep this document, roadmap and handoff updated with evidence. Communicate in concise Roman Urdu.

---

# Hello Sadiqabad — Government Jobs, Government Schemes & Owner Experience Plan

**Status:** Owner-approved plan · Phase 0 (audit/design/documentation) authorised · Feature implementation and database changes not yet authorised  
**Prepared:** 20 November 2026  
**Repository:** `samt87804-gif/Hello-Sadiqabad` · `main`  
**Production:** https://hellosadiqabad.com

## 1. Product direction

Grow Hello Sadiqabad from a local business directory into a daily-use Sadiqabad information platform. The three workstreams are:

1. **Government Jobs:** a verified, searchable public job board, managed from the Admin Portal.
2. **Government Schemes:** a verified guide to Punjab and Federal Government programmes, including eligibility, benefits, documents, dates and official application routes.
3. **Business Owner Experience:** a guided public Add Business flow, better area selection, more complete business profiles, and a clearer plan-aware Owner Portal.

The app is an information and discovery platform, not a government department, recruitment authority, loan provider, scheme registration office or guarantor of eligibility/selection. Applications and sensitive identity checks must remain on official government channels.

## 2. Product principles and trust rules

- **Official-source-first:** every published job/scheme needs a primary official source URL or official advertisement/document. A secondary news article can help discover an item but cannot be its only verification source.
- **Manual publication with assistant research support:** the owner may add entries in Admin, or ask the assistant to research and prepare a draft for Admin review. The assistant must not publish automatically or invent missing facts.
- **No fragile scraping in MVP:** no automated crawling or scraping of government portals. Portals change formats, PDFs, CAPTCHA and application pages; a broken scraper can silently publish stale or false dates. Consider official feeds/APIs only after checking that the agency provides and permits them.
- **Visible freshness:** show “Last verified” date and source on every job/scheme detail page. Admin queue should highlight records that need rechecking.
- **No false endorsement:** use neutral labels such as “Official source linked” or “Source checked”; never imply Hello Sadiqabad is a government portal or that a listing is endorsed by the government.
- **Safety against scams:** HTTPS only; no shortened links; validate destination domains; warn against agents demanding payment or CNIC/OTP; never collect OTPs, passwords, bank details or CNIC copies in Hello Sadiqabad.
- **Preserve current flows:** public submissions remain pending moderation; owners cannot publish directly or change protected fields/plan entitlements. RLS/backend remains the authority, not UI-only hiding.
- **Bilingual and mobile-first:** English + Urdu labels and Roman Urdu-friendly wording, readable on low-end Android devices and slow connections.
- **No destructive data changes:** additive migrations only, preserve current business, owner, inquiry, review and moderation records.

## 3. Workstream A — Government Jobs

### 3.1 User experience

Add a public **Government Jobs** section, with a home-page “Latest Government Jobs” preview and a dedicated listing/detail route.

Public job card should show:
- Job title and department/authority.
- Government scope: Punjab, Federal, or other province (only where deliberately included).
- Work location/district and whether Sadiqabad/Rahim Yar Khan applicants are eligible.
- Number of vacancies, scale/pay band (if stated), job type (regular/contract/project/internship).
- Minimum qualification and a short eligibility summary.
- Closing date and a clear Open / Closing Soon / Closed / Expired label.
- Source-check date and an official-source indicator.

Listing filters:
- Search title, department and keywords.
- Punjab / Federal / other scope.
- Department, qualification, job type, location, scale and open/closed status.
- “Relevant to Sadiqabad” filter only when the official domicile/location rules support it.
- Sort newest, deadline soonest and recently verified.

Detail page:
- Full, carefully transcribed advertisement details.
- Vacancy/post breakdown and quota where the advertisement states it.
- Education, experience, age range/relaxation, gender (if specified), domicile, district, physical/medical requirements and other conditions.
- Application steps, fee and payment instructions exactly as the official ad states.
- Official apply URL, official advertisement PDF/image and department source page.
- Disclaimer: the official advertisement controls if any summary differs; Hello Sadiqabad does not accept applications.

### 3.2 Admin-managed fields

Minimum recommended fields:
- `title_en`, `title_ur` (Urdu optional initially), `slug`, `department_name`, `department_scope`.
- `job_type`, `scale_or_grade`, `vacancy_count`, `location_text`, `districts`, `sadiqabad_relevance`.
- `qualification_text`, `experience_text`, `age_text`, `domicile_text`, `gender_or_quota_text`, `other_eligibility_text`.
- `application_steps`, `application_fee_text`, `apply_url`, `advertisement_url` and optional uploaded official document.
- `published_at`, `application_open_at`, `deadline_at`, `status`.
- `source_name`, `source_url`, `source_document_url`, `verified_at`, `next_review_at`, `reviewed_by`, `created_by`, timestamps.
- Optional contact/helpline only when published by the official department.

Statuses: Draft → Published → Closed / Expired / Cancelled. The public UI should derive “Closing Soon” from the deadline (for example, within 7 days), not let an editor manually mislabel a job as open after its deadline. Preserve a visible expired/closed archive for reference, excluded from the default active list.

Admin tools:
- Create/edit draft, preview public card/detail, publish, close, cancel, duplicate as draft, and inspect change history.
- Deadline warnings, missing official source warnings, and “needs re-verification” queue.
- PDF/link validation and duplicate detection (same department + title + advertisement/case number + year).
- Only authorised Super Admin/staff roles can manage records; add a dedicated permission such as `government_jobs.manage` after reviewing the existing permission model.
- Every publish/status/source change should be auditable.

### 3.3 Official source strategy

Initial source directory:
- Punjab Government unified recruitment portal: https://jobs.punjab.gov.pk/
- Punjab Public Service Commission: https://www.ppsc.gop.pk/
- National Jobs Portal, Government of Pakistan: https://www.njp.gov.pk/
- Punjab Job Center (PITB employment matching): https://jobcenter.punjab.gov.pk/
- Department/authority official websites and their signed/hosted advertisements.

Prioritise Punjab and Federal Government vacancies that are open to Sadiqabad residents. Do not imply that every federal job is locally based. Include a job only after checking the actual advertisement and its closing date.

### 3.4 MVP boundaries

- Admin manually enters jobs, or the assistant researches an official source and prepares a draft for owner/admin confirmation.
- No user account required to browse or apply externally.
- No in-app job applications, CV storage, CNIC collection or fee collection.
- No promise that a user is eligible; show source criteria and link to official application.
- No auto-publishing from search results, Facebook posts or third-party job blogs.

## 4. Workstream B — Government Schemes

### 4.1 Coverage and categories

Create a **Government Schemes** directory covering Punjab Government and Federal Government programmes, clearly separating their jurisdictions.

Suggested categories:
- Housing / plot / home construction.
- Business loans, entrepreneurship and small-business support.
- Agriculture, Kissan support, livestock and tractors.
- Education, scholarships, laptops and skills/training.
- Women, families, social protection and BISP.
- Health, disability and welfare.
- Fuel, transport and public relief.
- Youth, employment and internships.

Examples to research/maintain when officially confirmed include Apni Chhat Apna Ghar, Apni Zameen Apna Ghar, Asaan Karobar Card/Finance, Kissan Card, Green Tractor initiatives, PM Youth Business & Agriculture Loan Scheme, BISP programmes and any current fuel relief programme. These are examples, not a statement that every scheme is open today. Each phase/round and its application status must be verified separately.

### 4.2 Scheme card and detail page

Scheme card:
- Scheme name, government level/department and category.
- Who it is for (short, non-technical summary).
- Benefit type (grant, subsidy, loan, stipend, training, housing, etc.).
- Current application status: Open, Coming Soon, Temporarily Paused, Closed, or Information Only.
- Last verified date.

Scheme detail:
- Purpose and what the applicant may receive.
- Amount/benefit, interest/markup, tenure, instalments or subsidy terms only if stated by official source.
- Eligibility requirements in clear sections.
- Required documents and any official fee (explicitly state “not specified” rather than guessing).
- Geographic scope: Punjab-wide, selected districts, tehsil/area, or Pakistan-wide.
- Step-by-step official application route and official registration/status-check URL.
- Official helpline/office details when verified.
- Start date, last date, phase/round and current status.
- “Last verified” timestamp, official source links and a “Report outdated information” option.
- Prominent safety notice: never share OTP/password/bank PIN; do not pay agents; verify that the URL is official before entering personal information.

### 4.3 Eligibility guidance

Build eligibility guidance in two levels:
1. **MVP:** a readable checklist copied/condensed from official criteria, with a link to the full official criteria.
2. **Later optional self-check:** only for schemes whose official criteria are structured and unambiguous. Ask low-risk yes/no or range questions (for example, Punjab resident, farmer/landholding band, age range, student status) and return “may meet the listed criteria”, “appears not to meet one or more criteria”, or “criteria need official confirmation”.

Never call this an official eligibility decision or promise approval. Do not ask for CNIC number, family registration data, bank account, OTP, passwords, biometric information or upload identity documents. Do not store answers in the first release. For BISP, link users to the official BISP/8171 channels and repeat official anti-fraud guidance; never build a fake eligibility checker or ask users to send CNIC to Hello Sadiqabad.

### 4.4 Admin-managed fields

- `name_en`, `name_ur`, `slug`, `government_level` (Punjab/Federal/other), `department_name`, `category`.
- `summary`, `purpose`, `benefit_type`, `benefit_details`, `amount_or_range`, `loan_markup_and_tenure`.
- `eligibility_summary`, structured `eligibility_rules` (only fields actually supported by source), `required_documents`, `geographic_scope`.
- `application_steps`, `application_url`, `status_check_url`, `official_helpline`.
- `application_open_at`, `deadline_at`, `phase_name`, `status`.
- `source_name`, `source_url`, optional official PDF, `verified_at`, `next_review_at`, reviewer/audit fields and timestamps.

Admin workflow:
- Draft → review official source → preview → publish → update/close/archive.
- Re-verification reminders; flag schemes with an approaching deadline or old verification date.
- Scheme rounds/phases should be versioned or separately recorded so old eligibility/deadlines are not silently overwritten.
- A material update (eligibility, amount, application URL, closing date) should update the verification timestamp and preserve an audit trail.
- Add dedicated permission such as `government_schemes.manage` after reviewing the current permission system.

### 4.5 Official source strategy

Starting official sources:
- Punjab Government: https://punjab.gov.pk/
- Punjab Special Monitoring Unit programme pages: https://smu.punjab.gov.pk/
- Punjab Small Industries Corporation: https://psic.punjab.gov.pk/
- Punjab Agriculture Department: https://agripunjab.punjab.gov.pk/
- Apni Chhat Apna Ghar official portal: https://acag.punjab.gov.pk/
- Asaan Karobar Card official portal: https://akc.punjab.gov.pk/
- BISP: https://www.bisp.gov.pk/ (official BISP messages use 8171; verify latest official instructions before publishing).
- PM Youth Programme: https://pmyp.gov.pk/ and its official loan portal https://pmybals.pmyp.gov.pk/
- Relevant federal ministry/department websites for federal schemes.

A scheme may have a separate application portal from the department's information page. Store and label both URLs separately. Check that each link is official before publishing. Petrol/fuel relief programmes are especially time-sensitive: never reuse an old round's registration URL, eligibility or SMS instructions without rechecking the current official announcement.

## 5. Workstream C — Add Business and Owner Portal

### 5.1 Current implementation baseline (inspected 20 November 2026)

- Public Add Business route: `/add-business` in `src/pages/AddBusiness.tsx`.
- Current public form asks for English/Urdu business name, category, area, primary phone, optional WhatsApp, address/landmark, quick facilities, short description, submitter name and contact phone.
- It currently uses native HTML `<Select>` controls for Category and Area and initially selects the first loaded category/area. The current active area dataset contains **314 areas**. This makes the area control difficult to scan on mobile and risks an accidental default selection.
- Public form writes a `new_business` suggestion through the existing moderated submission flow; it does not directly publish a business.
- Public owner account request route: `/owner-register`; currently collects name, email, phone and optional business name. Admin approval is required before account invitation/access.
- Owner Portal pages live in `src/pages/owner/OwnerPortalPages.tsx`; navigation in `src/components/owner/OwnerNav.tsx`.
- Owner listing editor: `src/components/owner/ListingEditor.tsx`, already has a multi-step editor, area/category selects, location picker/map, opening-hours editor, preview, and plan-aware controls.
- Plan feature/limit data is stored in `public.plans`. Current live plan configuration inspected:
  - Free: 0 gallery photos, 0 videos, 0 active offers, no WhatsApp button, no social links, no cover/gallery, no full analytics.
  - Basic: up to 5 photos, 1 video, 2 active offers, 3 social links, WhatsApp, cover/gallery and verified badge.
  - Premium: up to 15 photos, 3 videos, 10 active offers, expanded social links and full analytics.
- Some Free-plan locks already exist (e.g. WhatsApp, social links and offers). The project should complete and standardise this experience rather than replace the current plan model.

### 5.2 Public Add Business form redesign

Convert the single long form into a clear, mobile-first, bilingual wizard with progress and save-as-you-go only if safe server-side draft support is designed. Until then, keep submission atomic and do not store partial personal details in local storage.

Suggested steps:

**Step 1 — Business identity**
- English name (required), Urdu name (optional).
- Main category (required), optional secondary category only if the existing data model supports it; do not invent a schema shortcut.
- Business type (shop, clinic, restaurant, school, service, professional, etc.) only if useful and mapped to a controlled taxonomy.
- Established year (optional), short tagline (optional).

**Step 2 — Area and address**
- Replace native area select with a searchable, accessible dropdown/combobox designed for 314+ areas.
- Search by English and Urdu names; show selected area clearly, match count, keyboard navigation, touch-friendly rows and “No area found”.
- Do not preselect the first area. Require the user to make an explicit selection; offer “Area not listed?” as a moderated suggestion, not a free-form replacement of the area taxonomy.
- Keep the existing area UUID/slug unchanged when selected.
- Street/shop address, market/road, landmark and optional Urdu address.
- Add a map pin / location picker with “Use my location” and manual pin placement. Explain that location permission is optional; if no pin is supplied, retain a clear admin-review step instead of inventing coordinates.

**Step 3 — Contact**
- Primary phone (required), secondary phone (optional), WhatsApp (optional), email (optional), website (optional).
- Same-as-phone checkbox; validate Pakistani numbers and HTTPS URLs.
- Ask for submitter/owner name and a reachable contact number; explain that these are used for verification and are not automatically public.
- Never expose submitter contact details in the public listing by default.

**Step 4 — Business details**
- Short and full description (English/Urdu where supplied).
- Services/products and facilities (controlled tags plus free-text details, with sensible limits).
- Opening days/hours, 24-hour flag, home delivery/service area, appointment/booking availability where relevant.
- Social profiles only as optional information; public visibility and premium features remain governed by the plan and existing privacy rules.

**Step 5 — Photos and preview**
- Logo, cover and gallery upload only if the public submission path can safely store private pending media. Otherwise keep media as an optional later Admin/Owner step after approval.
- Show a profile preview, missing-information checklist and final confirmation.
- Explicit consent that information is accurate and may be checked by the Admin team.
- On submission, show request ID/status and explain that listing is not live until approved.

Do not make every field mandatory. Required minimum should remain realistic for a small shop owner using a phone: business name, category, area, address, primary phone, submitter contact and consent. Encourage but do not block on non-essential details.

### 5.3 Area dropdown component

Build one reusable accessible searchable area picker and use it in:
- Public `/add-business` form.
- Owner `ListingEditor`.
- Any other business area selector where the same UX is appropriate (after inspecting each caller).

Expected behavior:
- Search English + Urdu area names; support Roman Urdu/simple transliteration where practical.
- Show total active areas and filtered count.
- Selected value chip/summary; clear/change action.
- Grouping only if actual area data includes a reliable grouping field; do not infer markets/blocks from names.
- Arrow-key navigation, Enter to select, Escape to close, proper labels/ARIA, visible focus, screen-reader result announcements.
- On mobile, use a full-width popover/sheet with a scrollable list and no tiny native select.
- Preserve current area IDs, slugs, public filters and URL behavior.
- Loading/error/empty states and a retry path.

### 5.4 Owner Portal plan-aware feature presentation

Keep Premium/Basic features visible even when the current business is Free, but show them as clearly locked previews rather than hiding them or allowing a failed action:
- Each locked feature card should show a lock icon, plan badge, concise benefit, actual plan limit and a “View Plans / Request Upgrade” action.
- Show the Free user's available features separately from locked upgrades.
- On Basic, show Premium-only upgrades as locked; on Premium, show included/unlocked state.
- Use `public.plans.features` and `public.plans.limits` as the source of truth. Do not hardcode duplicate plan rules in the frontend.
- Preserve Admin-approved upgrade requests; no checkout/payment gateway unless separately requested and explicitly planned.
- UI locks are not security. Database/RLS/RPC must continue to enforce limits and permissions server-side.
- Show the user's current plan, expiry, used/allowed quota and what resets/does not reset.
- Explain moderation: edits/offers/products/services remain pending until Admin approval where existing workflows require it.

### 5.5 Owner Portal modules to refine

- **Overview:** business status, current plan, profile completeness, pending requests, views/calls/WhatsApp/directions and actionable next steps. Mark demo metrics as demo; do not mix with live metrics.
- **My Businesses:** searchable business switcher, clear approval state, Add Business and Find & Claim actions, per-listing plan and last-updated date.
- **Edit Listing:** guided steps, searchable area picker, preview, completeness checklist and field-level validation.
- **Photos & Media:** plan quota meter, upload guidance, image previews and locked slots for Free plan.
- **Products/Services:** explain current per-business limit and moderation. Do not silently remove legacy data beyond current limits.
- **Offers:** visible Free lock, Basic/Premium quotas, date/status preview and approval state.
- **Analytics:** clearly distinguish available Free summary from Basic/Premium full analytics based on plan config.
- **Plan & Benefits:** side-by-side Free/Basic/Premium comparison sourced from database, current plan highlight and secure request-upgrade flow.
- **Profile & Notifications:** contact/privacy settings and clear notification preferences without exposing private contact data.
- **Help:** short bilingual guides for listing quality, photo requirements, how to upgrade and how verification works.

## 6. Daily-use engagement strategy

After the core records and owner experience are reliable, make the homepage a useful daily dashboard:
- “Latest Government Jobs”, “Closing Soon” and “Recently Added”.
- “Government Schemes Open Now”, “New Scheme Updates” and “Eligibility Guides”.
- Local directory updates, new businesses, verified offers, civic announcements, news and emergency shortcuts.
- Optional saved jobs/schemes and alert preferences (later phase, explicit opt-in).
- A daily/weekly digest only after a reliable notification channel and consent flow exist. Do not send unsolicited WhatsApp/SMS or collect phone numbers for marketing.
- PWA home-screen experience, fast search, shareable detail pages, SEO metadata and stale-data warnings.
- Chatbot integration only after jobs/schemes are published and public fields are explicitly allowlisted. The chatbot should answer from current published records, cite/link the source and say when details are stale or unknown.

## 7. Suggested delivery phases and gates

Each phase requires owner approval before implementation; do not begin the next phase until the current phase passes acceptance.

### Phase 0 — Data model, permissions and UX foundation (planning/design)
- Confirm job/scheme scope and required fields.
- Inspect current Admin permission keys, submission moderation, audit logs, storage policies and migration ledger.
- Produce UI wireframes and additive schema/RLS proposal.
- Define official-source allowlist/link policy, verification cadence and duplicate rules.
- Acceptance: owner approves fields, routes, admin workflow, trust/safety rules and phase sequencing. No production schema change in this planning phase.

### Phase 1 — Government Jobs MVP
- Additive jobs table, RLS and admin permission.
- Admin Jobs Manager: draft, edit, source/advertisement upload, preview, publish, close/archive.
- Public Jobs listing/detail, filters, deadline labels, official apply links, source and last-verified date.
- SEO metadata, mobile layout, chatbot allowlist only if separately verified.
- Acceptance: anonymous visitor sees only published jobs; unauthorised users cannot write; Admin can publish; expired deadlines are not shown as open; all links validated; test fixtures do not persist in production.

### Phase 2 — Government Schemes MVP
- Additive schemes and scheme-update/phase history model, RLS and admin permission.
- Admin Scheme Manager and public category/list/detail pages.
- Eligibility checklist, required documents, official registration/status URLs, scheme status and verification timestamp.
- Safety/fraud warnings and report-outdated workflow.
- Acceptance: official source required; expired/paused status accurate; Punjab/Federal labels clear; no CNIC/OTP/private financial data requested; anonymous users can read published records only.

### Phase 3 — Public Add Business + Owner Registration UX
- Accessible searchable area dropdown used in public Add Business and owner listing editor.
- Public Add Business wizard, explicit area selection, clearer required/optional fields, location pin and privacy/consent copy.
- Owner registration request form improvements and pending-review state.
- Preserve current submission moderation, anti-spam/honeypot, phone validation and no direct account creation.
- Acceptance: new public requests remain pending; no private submitter fields become public; area UUID is preserved; mobile keyboard/accessibility checks pass; no existing submissions/businesses change.

### Phase 4 — Owner Portal premium visibility and completeness
- Standardise visible locked feature cards for Free/Basic/Premium.
- Plan/quota dashboard, feature comparison, guided editor and media quota.
- Improve overview, My Businesses, Products, Offers, Analytics, Plan & Benefits and help content.
- Confirm every premium restriction is enforced by database/RPC as well as UI.
- Acceptance: Free users can see locked benefits but cannot use them; Basic/Premium entitlements match live `plans` rows; no owner can change plan/verification/ownership fields; current moderation still works.

### Phase 5 — Daily-use engagement
- Homepage widgets, saved jobs/schemes, opt-in notifications and digest.
- Search/filters, relevant alerts and shareable SEO pages.
- Chatbot public knowledge integration for published jobs/schemes with official-source links.
- Acceptance: opt-in and unsubscribe work, no unsolicited marketing, stale records are clearly identified, no private owner/user data enters public chatbot context.

## 8. Technical and security architecture (proposal, subject to Phase 0 audit)

- Use additive tables such as `government_jobs`, `government_schemes`, and `government_scheme_revisions` (or equivalent version model) only after checking current schema and migration ledger.
- Public anonymous SELECT: published, current/public fields only.
- Admin writes: authenticated active Super Admin or staff with dedicated permission; RLS/backend checks; never rely on hiding Admin controls.
- Keep source documents in a private pending/review storage path until publication; only publish explicitly approved official documents. Validate PDF MIME/size and URLs.
- Keep audit records for create/edit/publish/close/source/eligibility/deadline changes.
- Use server/database time consistently for deadlines (Pakistan timezone display) and test date-boundary behavior.
- Escape/sanitize rich text; no arbitrary HTML or executable embeds.
- No third-party scraping, external APIs, scheduled jobs, email/SMS/WhatsApp provider or paid integration until separately scoped and approved.
- Extend chatbot's explicit public field allowlist only after public RLS and privacy review. Do not expose admin notes, submitter contacts, private document paths or unpublished drafts.

## 9. Initial research links (official sources checked 20 November 2026)

### Jobs
- Punjab Job Portal: https://jobs.punjab.gov.pk/
- PITB description of Punjab's unified job portal: https://www.pitb.gov.pk/job_portal
- PPSC: https://www.ppsc.gop.pk/
- National Jobs Portal: https://www.njp.gov.pk/
- Punjab Job Center: https://jobcenter.punjab.gov.pk/

### Schemes
- Punjab Government: https://punjab.gov.pk/
- Punjab Special Monitoring Unit: https://smu.punjab.gov.pk/
- Apni Chhat Apna Ghar information: https://smu.punjab.gov.pk/apni-chhat-apna-ghar-program
- Asaan Karobar Card information: https://psic.punjab.gov.pk/node/177
- Punjab Agriculture Department initiatives: https://agripunjab.punjab.gov.pk/index.php/agri-adp-cminitiatives
- BISP: https://www.bisp.gov.pk/
- BISP official 8171 fraud warning: https://www.bisp.gov.pk/NewsDetail/Njk4ZDI0MTAtYzdiMy00MDMwLTljNTItZjI3OWM2MGQ4OWYz
- PM Youth Business & Agriculture Loan Scheme: https://pmybals.pmyp.gov.pk/
- Fuel relief example (must reverify each round): https://lahore.punjab.gov.pk/index.php/node/7198

These pages demonstrate official starting points and examples of programmes; they do not guarantee current application availability. Re-check each scheme's official status, eligibility and application URL at the time of publication.

## 10. Open owner decisions before Phase 0 acceptance

Recommended defaults are listed; the owner can change them:

1. **Jobs coverage:** Punjab + Federal jobs, prioritising vacancies open to Sadiqabad/Rahim Yar Khan residents. Recommended.
2. **Schemes coverage:** Punjab + Federal programmes (BISP and PM Youth loans are Federal, not Punjab schemes). Recommended, with government level shown clearly.
3. **Publishing:** Admin-only publish; assistant researches and prepares a draft only when asked. Recommended.
4. **Language:** English and Urdu for public headings/summaries; retain official advertisement text/link for exact legal criteria. Recommended.
5. **Alerts:** no SMS/WhatsApp/email alerts in MVP; add opt-in alerts later. Recommended.
6. **Owner uploads:** collect photos at initial public form only if pending-media storage can be safely isolated; otherwise ask for core data first and let owner/Admin add media after approval. Recommended.
7. **Owner verification:** never request CNIC/OTP through the public form. Use admin review and official business proof only when proportionate. Recommended.

## 11. Explicit non-goals for the first releases

- In-app job applications, CV builder or recruitment service.
- In-app loan/scheme applications or eligibility guarantees.
- CNIC/OTP/bank-account collection or document vault.
- Auto-scraping/auto-publishing government jobs/schemes.
- Payment gateway, premium subscription checkout or automatic plan purchases.
- Unsolicited SMS/WhatsApp marketing.
- Any change to existing businesses, owners, plans, RLS or moderation without a reviewed additive migration and separate phase approval.


---

## Phase 0 audit checkpoint — 20 November 2026

Owner approved Phase 0 (read-only audit, requirements and design). The detailed audit and proposed additive design are recorded in:

- `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PHASE0_AUDIT.md`

The audit inspected the current `main` code snapshot and live Supabase schema, migration ledger, RLS, Storage policies, plans, Admin permission gates, owner submission/registration flows and Supabase Advisors. It records the existing architecture, live counts, proposed routes/data model/security, and test/acceptance gates.

**Current status (20 Nov 2026):** Owner accepted the Phase 0 design and explicitly authorised Phase 1 Government Jobs implementation. Phase 1 MVP code and additive database foundation are now committed/deployed; see the latest implementation checkpoint at the end of this document. Phase 2–5 remain separately gated. Preserve the current live migration history; do not replay the consolidated baseline.


---

## Phase 1 implementation checkpoint — 20 November 2026

**Owner approval:** Explicit approval received to begin Phase 1 Government Jobs MVP after Phase 0 design acceptance.

**Implemented in commit `464691c9542ae753ec4a7b320d097b72136e13ce`:**
- Public routes: `/government-jobs` and `/government-jobs/:slug`.
- Admin Government Jobs manager: create drafts, edit, publish, close, cancel, duplicate drafts, and re-verification queue.
- Dedicated `government_jobs.manage` permission added to the permission type, staff permission matrix, Admin navigation/tab, and `public.my_permissions()`. No broad staff-type defaults grant it.
- Additive `public.government_jobs` table with RLS, explicit grants, HTTPS source/application URL constraints, publication verification gate, Pakistan-date closing logic, update timestamp and audit triggers.
- Public pages only read published/closed/expired records; drafts/cancelled records remain private.
- Public sitemap includes published job pages and detail slugs. Empty job listings remain noindex until content exists.
- Automated helper tests cover Pakistan date boundaries, closing/expired status, HTTPS/shortener validation and slug normalization.

**Live migrations applied (20 Nov 2026):**
- `20261120150330_government_jobs_mvp`
- `20261120150410_government_jobs_allow_incomplete_drafts`
- `20261120150416_government_jobs_require_verification_timestamp`
- `20261120150950_government_jobs_audit_fk_indexes`

Matching SQL files are tracked under `supabase/migrations/`. This environment did not have a local Supabase CLI/repository checkout; migrations were applied with the connected Supabase migration operation and the exact versioned SQL was committed to the repository. Do not replay these versions.

**Verification:** GitHub Actions CI passed for the feature commit; Cloudflare Pages production deployment completed successfully. Live Supabase RLS/grants/triggers and Advisor snapshot were checked. The new table contains zero job records; Admin must add/review official-source jobs before the public page has content. Physical mobile-browser testing is still outstanding.

**Scope boundary:** Government Schemes, Add Business, Owner Registration and Owner Portal enhancements are not included in this Phase 1 implementation.
