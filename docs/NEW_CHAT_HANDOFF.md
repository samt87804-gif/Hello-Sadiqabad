# IMPORTANT PROJECT CONTINUATION — READ FIRST (26 November 2026)

This repository now has two separate active workstreams that must not be confused:

1. **Business Registration/Admin approval redesign:** follow [docs/ADD_BUSINESS_APPROVAL_ACTIVE_IMPLEMENTATION_PLAN.md](ADD_BUSINESS_APPROVAL_ACTIVE_IMPLEMENTATION_PLAN.md). The old [docs/ADD_BUSINESS_OWNER_APPROVAL_PLAN.md](ADD_BUSINESS_OWNER_APPROVAL_PLAN.md) is marked **ARCHIVED / DO NOT IMPLEMENT**. Keep it only for history/compatibility audit; do not continue its old workflow, do not create a parallel queue, and do not roll back compatible production code.
2. **SDK Jobs:** follow [docs/SDK_JOBS_RECRUITMENT_PLAN.md](SDK_JOBS_RECRUITMENT_PLAN.md), [docs/SDK_JOBS_PHASE4_DATA_MODEL_SECURITY_DESIGN.md](SDK_JOBS_PHASE4_DATA_MODEL_SECURITY_DESIGN.md) and [docs/SDK_JOBS_PHASE4_ACCEPTANCE_CHECKLIST.md](SDK_JOBS_PHASE4_ACCEPTANCE_CHECKLIST.md). On 26 November 2026, the owner explicitly confirmed that they personally tested and passed every Phase 4 acceptance checklist item in Sections 1–8. The checklist now records that owner acceptance. Phase 4 implementation and owner acceptance are complete; CI run [45714887257](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45714887257) passed and Cloudflare Pages deployment `cf208161-c3da-4116-a0bc-f3eb2a983cfb` succeeded for commit `c766470a26a0325d1bc6c21d2bce65255184d06f`. Post-deployment SDK Jobs Owner/Admin/public/sitemap/social-preview smoke checks remain open. Four JWT-protected SDK Jobs Edge Functions and seven additive migrations are live. Published-job editing remains deliberately disabled until public-version preservation is designed. Candidate intake, CV/PII, referrals, referral letters and fees remain separate Phase 5 work. A read-only privacy/security design now exists at `docs/SDK_JOBS_PHASE5_PRIVACY_SECURITY_DESIGN.md`; no Phase 5 code/schema/data has been created. Candidate data collection is blocked pending owner approval of retention periods, bilingual consent wording/method, staff permission matrix, fee amount/payment policy and referral-letter/verification fields.

## Mandatory current status and next actions

- Owner confirmed workstreams 4.1, 4.2 and 4.3 (including all tests through Government Jobs and Government Schemes) passed. Do not ask the owner to repeat those tests unless a regression is reported.
- Business Registration new active plan: owner approved; plan is committed; Phase A audit is next. No implementation checkbox is complete merely because the popup prototype was discussed.
- SDK Jobs Phase 4: owner-confirmed acceptance for all checklist testing Sections 1–8 is complete. Do not re-ask for those tests. Production Pages deployment is complete; remaining release gates are live Owner/Admin/public/sitemap/social-preview smoke checks.
- Work directly on GitHub main; no branches or PRs unless owner changes this rule.
- Preserve all existing data. Inspect routes, callers, tests, live schema, RLS, permissions, Storage policies and migration ledger before changes.
- Never claim CI, deployment, browser or physical-device acceptance without evidence. Update the master plan, roadmap, child plan and this handoff after verified milestones.
- No candidate intake, CV, candidate PII, interviews, referrals, referral letters or fee collection have been implemented; these are Phase 5 and require their own approved consent/retention/security design.
- Gov landing/mobile navigation code is committed, CI-passed and deployed: bilingual `/gov` four-card landing, six mobile bottom-nav items (Home, Search, News, Gov, SDK Jobs, Saved), desktop Civic Services entry, public indexing, analytics and sitemap. Cloudflare Browser Rendering confirmed `/gov` HTTP 200 with expected title/canonical metadata and five-item mobile nav at 390×844 (this was before the owner's News-preservation correction). Live sitemap check and owner browser/deep-link/Urdu RTL/Emergency acceptance remain pending. Cloudflare Browser Rendering has imposed a long rate-limit cooldown; do not retry that endpoint until its cooldown expires.

---

# New Chat Handoff — Hello Sadiqabad Domain & SEO

Paste the message below into a new ChatGPT chat inside the **Hello Sadiqabad** Project. The full plan is in `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` in the GitHub repository. Read that file first and treat it as the source of truth.

---

## Copy this message into the new chat

We are continuing work on my existing project **Hello Sadiqabad**. Do not start from scratch. First inspect the GitHub repository and read:

- `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` — main phased plan and current verified status.
- `PROJECT_ROADMAP.md` — existing application roadmap and outstanding work.
- `DEPLOYMENT.md` — production deployment instructions.
- `docs/PROJECT_WORKING_RULES.md` — permanent owner-confirmed rules; follow them for every change.
- `docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md` — offline-first PWA plan and phase status.
- Relevant existing security/roadmap documents only when needed.

### Live infrastructure
- GitHub: `samt87804-gif/Hello-Sadiqabad`
- Branch: `main`
- Website/canonical domain: https://hellosadiqabad.com
- Cloudflare Pages project: `hello-sadiqabad`
- Pages origin: `https://hello-sadiqabad-2bs.pages.dev`
- Cloudflare account: `1d6a40b5558a2326be1faf79c67e2c4a`
- Cloudflare zone: `047a89dfd18e46c356ed2ba3b473ee65`
- Supabase project ref: `efwohfzqitevkuybnyif`

Use the connected GitHub, Cloudflare and Supabase tools where available. Read the relevant plugin skills before working with those services. Never ask me for passwords, service-role keys or private credentials. Do not expose keys in code or chat.

### Work already completed (verify before changing)
- Cloudflare custom domain `hellosadiqabad.com` is active.
- SSL mode Full, Always Use HTTPS ON, minimum TLS 1.2.
- Automatic HTTPS Rewrites, HTTP/3 and Brotli ON.
- Pages production `VITE_SITE_URL` updated to `https://hellosadiqabad.com`; existing other variables preserved.
- Security headers updated in `public/_headers` (one-year HSTS, CSP with `object-src 'none'`, `base-uri`, `form-action`, `frame-ancestors`, Cloudflare Insights allowlist, nosniff, SAMEORIGIN, strict-origin referrer policy, Permissions-Policy).
- Latest production Pages deployment: commit `2d966202510c4d63d668780ce84a2e4237af6287`, deployment `0b25073c-b7f2-4600-a8b4-0fe7fa3583a7` — build and deploy succeeded.
- Supabase `owner_public_profile_directory` is `security_invoker=true` and `security_barrier=true`; anon can read only generated/redacted public columns under RLS. Raw phone/email and base-table SELECT remain denied. Anon read was tested; no SECURITY DEFINER view or RLS bypass.
- Supabase Security Advisor reports only leaked-password protection disabled. Connected organization is on Free plan; feature is plan-gated. Do not request credentials or upgrade without owner decision.
- Owner confirmed Supabase Auth Site URL and all three canonical redirect URLs were saved on 17 November 2026.
- Owner confirmed Google Search Console Domain property `hellosadiqabad.com` is verified. Matching TXT record is present in Cloudflare DNS.
- Dynamic `/sitemap.xml` is live: browser-verified HTTP 200 XML, 516 unique canonical URLs, zero duplicates/private URLs; owner profiles are included only through the redacted public view when opted in.
- `www.hellosadiqabad.com` is intentionally unsupported; apex domain is the only active Pages custom domain.
- `robots.txt` points to sitemap; homepage, search noindex, news, business and category metadata/JSON-LD were browser spot-checked. Mobile 390×844 business breadcrumb and News image alt text were browser-tested. News images now have descriptive alt text; business pages have visible Home → category → business breadcrumbs. Semantic H1 headings were added to homepage, categories, map, offers and announcements; CI and deployment passed. Browser re-check for this latest commit hit Cloudflare browser-rendering rate limit, so those H1s are code/CI/deploy verified but not browser-verified yet. No full-site crawl or Google Rich Results Test has been performed.
- Cloudflare rate-limit rule active on POST `/api/chat`: 30 requests/10 seconds per IP+colo, 10-second block with JSON 429.

### Mandatory working rules (owner-confirmed 17 November 2026)
- Commit directly to `main`; do not create Pull Requests or feature branches unless I change this instruction.
- Inspect current code/configuration/schema/RLS/migrations before every change.
- Make narrowly scoped changes and do not break unrelated features or existing data.
- Never delete or overwrite existing business/user data; no destructive DB operations without explicit approval.
- Never bypass RLS, auth, permissions or moderation.
- Run relevant tests, typecheck, build and verify Cloudflare deployment/endpoints. Never claim a check that was not performed.
- Keep the master plan, handoff and roadmap updated with evidence.
- Do all technical work yourself; ask me only for dashboard/private-account actions, factual local verification or explicit approvals. Explain manual steps in detail.
- Communicate concise Roman Urdu status updates and clearly state blockers.

### My role (website owner)
I will do only the tasks that require my Google/Supabase dashboard or real-world owner participation:
1. Supabase Auth Site URL and canonical redirect URLs were saved and confirmed; do not repeat.
2. Redirect URLs already saved; no further action.
3. Leaked-password protection remains unavailable on Free; no action unless I independently choose to upgrade.
4. Google Search Console Domain property `hellosadiqabad.com` is created and verified.
5. DNS TXT verification is already present and verified. Do not add duplicates or remove the record.
6. Search Console Verify already succeeded.
7. Owner submitted `https://hellosadiqabad.com/sitemap.xml` on 17 November 2026; Search Console confirmed successful submission and says Google will process it periodically. Processing/index coverage is not yet confirmed.
8. Owner confirmed URL Inspection + Request Indexing submissions for homepage and six priority URLs (`/categories`, `/emergency`, `/map`, `/news`, `/offers`, `/announcements`) on 17 November 2026. These are crawl-queue submissions, not proof of indexing. Assistant continues technical SEO and local data-quality audits; owner can later share sitemap processing and Page Indexing/URL Inspection outcomes.
9. I will share Search Console reports/screenshots/exports when asked, and provide accurate local business information, official sources, corrections and authorized photos.
10. I will encourage genuine local businesses to claim their own eligible Google Business Profiles and share their directory pages naturally. I will not buy searches, clicks, reviews or backlinks.

### ChatGPT's role
You own the technical work:
- Read the master plan and continue at the first incomplete task.
- Work phase by phase, starting with Phase 0 remaining security/domain verification, then Phase 1 Technical SEO.
- Inspect code, live configuration, database schema/RLS/migrations before changing anything.
- Implement code, Cloudflare DNS/settings, Supabase changes supported by tools, sitemap, robots, canonical URLs, metadata, structured data, local SEO pages and technical fixes as laid out in the master plan.
- Preserve existing data. Never run destructive database changes without my explicit approval.
- Build, test, deploy and verify every phase before marking it complete.
- Update the master plan and project roadmap with evidence after each verified batch.
- Ask me only for steps that genuinely require my dashboard, Google verification, factual local knowledge or approval.
- Be transparent: distinguish completed, deployed, verified and waiting for my action. Never claim browser testing unless you performed it.
- Do not promise top rankings or a fixed time. Do not use fake searches, bots, click farms, fake reviews or purchased backlinks.

### Immediate next task — Offline-first PWA Phase 1
Continue the active offline-first implementation from `docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md`, following `docs/PROJECT_WORKING_RULES.md` on every change. Phase 0 is complete. Phase 1 now includes the IndexedDB public-snapshot store, `/offline-data` download manager, public read adapters and offline write guards. CI run `44118681086` passed TypeScript, automated tests, production build and Edge Function checks for commit `76805d80a18c81257d5758aacf29ad6970dd5d18`; Cloudflare Pages deployment `e3d48ab7-b202-43a2-8184-385ec0520686` succeeded and the download manager route was browser-render verified HTTP 200.

Public business search/details, categories, areas, emergency contacts and homepage directory sections now select the saved snapshot when the browser is offline. Public reviews, inquiries and suggestions are explicitly rejected offline; telemetry is skipped and nothing is queued. Online behavior still uses Supabase as the source of truth. The initial conservative Service Worker shell/lazy-chunk runtime caching is now implemented and deployed (details below). Next: browser-level IndexedDB transaction/quota/concurrency tests, actual offline reload/deep-link and cache inspection, plus stale-chunk/update/rollback acceptance. The `/offline` route remains the existing emergency fallback. Do not mark Phase 1 complete until every acceptance gate passes. The Domain/SEO workstream remains documented in `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md`; do not silently discard it, but keep offline-first as the current active task.


## Latest verified work — 17 November 2026

- Owner confirmed all six priority Google Search Console URL inspection submissions; submission to priority crawl queue is not proof of indexing.
- Read-only live Supabase + workbook audit completed and documented in `docs/LOCAL_SEO_DATA_QUALITY_AUDIT.md`.
- Sitemap detail routes now include only 10 categories with published listings and 14 areas with at least three published businesses. Production sitemap browser-render verification: HTTP 200, 169 canonical `<loc>` entries, no search URLs. Sitemap cache key bumped to `?v=2` to prevent stale pre-filter sitemap responses.
- Invalid/blank/zero/all-zero Pakistani phone numbers no longer produce call or WhatsApp links; invalid primary/secondary call actions are hidden on business cards and business profiles.
- Production browser-render check for the Al Barkat Pulao and Tea Restaurant listing (blank phone): HTTP 200, correct canonical URL, no `tel:` links, no placeholder number, no Call action.
- GitHub CI run 43954990190 passed for code commit `81e9378f681f9ad82e7af680ccf4735ad9256d6d`; Cloudflare Pages production deployment `c3c0e3ba-1729-4f9b-87f8-cbca75e60ed4` succeeded.
- No production business, area, category or owner records were changed; no crawler workbook records were imported. Remaining tasks: full route crawl, Rich Results Test, candidate matching by place ID/address/coordinates, and verified owner-sourced data corrections.


## Latest continuation — 17 November 2026

- Implemented dynamic `noindex,follow` for empty/error Offers and Announcements routes. Both become indexable only after non-empty content is successfully fetched.
- Code commit: `bac9261c134bc782159db8d696026ff0979fdc4a`; CI run 43956280854 passed; Cloudflare deployment 017a7ca2-fe39-463d-9e46-631bba2e1fbe succeeded.
- Live post-deploy browser-render verification completed for both `/offers` and `/announcements`: HTTP 200, correct canonical URL, one H1, and `noindex,follow` while active content is empty.
- Next safe data task: build a read-only Google Places candidate-matching review keyed by place ID/address/coordinates; do not import or alter production listings until manual review is complete.


### Data audit follow-up — 17 November 2026
- Cross-workbook reconciliation of crawler (374 rows) + New Seed Data (771 rows): 1,145 rows, 1,109 likely Sadiqabad, 36 geographic-review rows, 1,028 unique Place IDs, 117 Place IDs repeated across the two files (234 participating rows).
- Live `public.businesses` schema has no Google Place ID column. The 223 published businesses were re-counted read-only: 49 without area, 15 without primary phone, 7 without coordinates, 33 without address.
- Generated owner review workbook: `Hello_Sadiqabad_Business_Data_Audit.xlsx` (summary, source quality, Sadiqabad candidates, repeated Place IDs, geo review, 204-area master, methodology).
- No source candidates have been declared a confirmed new business or live duplicate. No production records were changed.
- Next technical step: read-only matching by normalized name, phone, address and coordinate proximity, then prepare an ambiguous-match review queue. Do not add schema columns or import data without an explicit reviewed plan.


## Latest SEO/logo work (17 November 2026)

- Owner reports branded “Hello Sadiqabad” Google results now appear prominently; broader keyword queries are not yet showing the site. Treat this as an observation, not proof of indexing/rank coverage.
- Homepage H1 was screen-reader-only; changed to a visible bilingual “Sadiqabad Business Directory” heading and supporting local-services text. Updated homepage and Categories title/description with natural local search phrases. No meta-keywords stuffing.
- Logo source: user-supplied square image at Supabase public Storage path `Hello Sadiqabad/186747.png`. It was returning `X-Robots-Tag: none`; same-domain assets `/favicon.png` (192×192) and `/site-logo.png` (512×512) are now added, with index, manifest, Organization schema and social image references updated.
- Verified: CI run 44072068947 passed; production Pages deployment 6202c970-d2b1-406e-a991-e5b5e736f88c succeeded. Live custom-domain homepage metadata/H1/Organization logo, `/favicon.png` (192×192), `/site-logo.png` (512×512), and manifest were checked successfully.
- Owner action still needed: re-submit the homepage URL Inspection / Request Indexing in Search Console to prompt a recrawl for the changed favicon and snippet. Google may take days/weeks to refresh; never claim keyword ranking/indexing until Search Console evidence exists.


## Search Console indexing rejection audit — 17 November 2026
- Rechecked live apex homepage with Google-InspectionTool smartphone user-agent via Cloudflare Browser Rendering: HTTP 200, visible H1, `index,follow`, self-canonical `https://hellosadiqabad.com/`.
- `/robots.txt` and `/sitemap.xml` both returned HTTP 200; robots allows all and points to sitemap; sitemap is valid XML.
- `/offers` and `/announcements` intentionally return `noindex,follow` while there is no active content. Do not force-index empty pages.
- `www.hellosadiqabad.com` is intentionally unsupported. Use the apex domain URL in Search Console.
- Owner has not supplied the exact URL that Search Console rejected or the expanded Live Test diagnostic fields. The actual Google-side rejection reason is therefore not yet established; do not claim a fix or alter security settings blindly. Ask for the exact rejected URL and the values for Crawl allowed, Page fetch, Indexing allowed, and any issue detail. Matching user-agent browser rendering is not the same as a fetch from Google's infrastructure.


## Offline-first PWA continuation — 17 November 2026

The owner requested full offline support for the public Hello Sadiqabad website and its installable PWA. Read and follow these documents before implementation:

- `docs/PROJECT_WORKING_RULES.md` — mandatory rules, especially protecting the live website and real visitors.
- `docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md` — source of truth for offline scope, phase order, safety requirements and acceptance gates.
- `PROJECT_ROADMAP.md` — live feature checklist.

### Verified current state

- Existing PWA manifest and install prompt already work as the current install mechanism; do not rebuild or remove them.
- Current `public/sw.js` caches only `/offline.html`; it does not cache the React shell or lazy-loaded hashed assets.
- `src/lib/offlineStorage.ts` still contains favorites, recently viewed and a limited emergency-contact cache. `src/lib/offlineDirectory.ts` now provides the initial validated IndexedDB snapshot store and public-field mappers, but no download manager or app read integration exists yet.
- Public business data is assembled from static JSON chunks and current published Supabase rows. Preserve the existing publication filtering, RLS and crawl-only supplemental rules.
- Offline map tiles are not included unless the provider's current terms permit bulk offline storage.

### Required next action

Start **Phase 1** of `docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md` only after re-inspecting current main. Implement the public data snapshot, atomic IndexedDB download, visible download manager, offline data fallbacks, safe versioned app-shell/lazy-chunk caching and explicit online-only write guards. Keep all Admin/Owner/auth/private data and all server writes out of offline caches. Do not mark Phase 1 complete until its listed acceptance checks pass. Do not change Supabase schema or existing production data for this feature without a proven need and owner approval.


## Latest offline-first implementation — 17 November 2026

- Added the initial IndexedDB snapshot persistence module and automated sanitization/validation tests.
- Commit: `0460ecb3c6506d25f233bf17a316fb774a632b36`; CI run `44112311265` passed all jobs.
- Cloudflare Pages production deployment `6d404e0a-299b-4fb1-bb09-9891cb261cf2` succeeded. The new module is not imported by the live application yet; no offline directory functionality has been released.
- No database migration, production data mutation, Service Worker change or Cloudflare settings change was made.
- Resume with the download manager and public data integration; keep all writes online-only and never store private owner/admin/auth data offline.


## Latest offline download manager — 17 November 2026

- Added the public `/offline-data` page, lazy route and footer entry. It downloads the current published business set plus active categories, areas and fresh emergency contacts; shows progress, estimated JSON size and last successful download; and supports cancellation before snapshot activation.
- Added a public Supabase row-count preflight and forced refresh for each download. A mismatch or stale emergency-contact fallback prevents a new package from replacing the previous one.
- Route correction: `/offline` is the existing emergency fallback and remains untouched; the new download manager is `/offline-data`.
- CI run `44114620453` passed for the strict business-source helper. Cloudflare deployment `ba819f2f-2881-44d8-9606-54285abe6dbd` succeeded. Browser-render verification: `/offline-data` HTTP 200 with the download UI; `/offline` HTTP 200 with emergency call links. CI run `44114989998` for the final route-string commit was pending at this update.
- Remaining Phase 1 work: wire saved data into offline public routes, app-shell/lazy-chunk caching, online-only write guards and browser-level IndexedDB tests. Do not call the site fully offline yet.


### Offline-first continuation — public snapshot read integration (17 November 2026)

- Added `src/lib/offlineDirectoryAdapters.ts` to reconstruct the existing public UI row shapes from the explicit offline allow-list. Owner IDs, email and private account fields remain null/absent.
- Updated `src/lib/api.ts`: when `navigator.onLine` is false, public business reads, active categories/areas and emergency contacts use the verified IndexedDB snapshot. Homepage public settings fall back to safe seed defaults; non-essential ads/news suggestions and product previews are omitted offline.
- Public review, inquiry and suggestion submissions return a clear not-sent result while offline. Business/ad telemetry and search logging are skipped. No payloads are stored or queued.
- CI run `44118681086` passed TypeScript, automated tests, production build, and Edge Function checks. Cloudflare Pages deployment `e3d48ab7-b202-43a2-8184-385ec0520686` succeeded for commit `76805d80a18c81257d5758aacf29ad6970dd5d18`. Browser-render check confirmed `/offline-data` HTTP 200 and the download manager UI.
- Not yet verified: true airplane-mode browsing, offline reload/deep-links, browser-level IndexedDB failure/quota/concurrency behavior. The Service Worker still caches only `offline.html`; app-shell and hashed lazy-chunk caching is the next task.
- No Supabase schema, migration, row, RLS policy, Cloudflare setting or Service Worker behavior was changed.


## Latest offline-first continuation — Service Worker caching (17 November 2026)

- Re-read permanent rules and the offline implementation plan; audited `public/sw.js`, `src/main.tsx`, `index.html`, manifest, install prompt and React Router lazy routes before editing.
- `public/sw.js` now pre-caches the SPA entry and existing emergency fallback, uses network-first navigation, falls back to the cached SPA entry for app routes, and caches successful fingerprinted same-origin Vite JS/CSS chunks on first use.
- API/function/Supabase traffic and non-fingerprinted assets remain outside the runtime cache. `/offline` keeps the existing emergency fallback.
- No `skipWaiting()`, `clients.claim()` or cache deletion. The worker deliberately reuses `hs-sadiqabad-shell-v3` because the currently deployed v3 worker deletes every other cache key on activation; a new cache key would be unsafe on rollback.
- Commits: `5b83a8c16fb9a0a828236e70420fb2399b399cfa` and `5cb77a8bf47089f6c755cf03bb8df82f1ed814ff`.
- CI runs `44120063673` and `44120165303` passed all configured checks. Final Cloudflare Pages production deployment `4c4647d1-e582-4250-8704-a258e15c3089` succeeded.
- Not verified yet: browser/device Service Worker lifecycle, actual cache contents, offline reload/deep-link, previously visited lazy route, stale chunk/update/rollback, IndexedDB quota/concurrency and airplane-mode acceptance. Phase 1 remains in progress; do not claim full offline browsing.
- No Supabase schema/data/RLS/migrations, Cloudflare settings, install manifest/prompt, auth/owner/admin workflow or production business/user records were changed.


## Latest authority navigation and presentation work — 17 November 2026

- Public Local Authorities (`/local-authorities`) and individual Authority Profiles (`/authority-profiles/:slug`) remain separate routes and separate concepts. Local Authorities are offices/departments and public office contacts; Authority Profiles are people/office-holders.
- Added a desktop `Civic Services` header menu with distinct links to both routes, plus an Authority Profiles entry in the public All Links footer (including mobile footer drawer).
- Added `Preview public profile` to each Super Admin Authority Profiles manager card so an editor can open the public-facing profile directly in a new tab.
- Added individual profile Presentation Mode: it hides the normal app header/footer/bottom navigation/chatbot, uses a larger portrait and typography, and provides an exit control. The regular profile view also has `Print / Save PDF`.
- No profile records, photos, authority records, or Supabase data were created/edited. Real office-holder information must come from the person/office or a reliable official source; do not invent achievements, current status, or contact details. The first real profile still requires owner-sourced content and review.
- Code commits: `586023450879ad9e9e62f0b650920183ed7c02d7`, `9c4a2e0b2fcd3ef9d71982f92fec8ed5c5bac3e0`, `2e52d746def4a24b74bc3f55a0d3c875093783b0`, `3cad70829d57e7c5970378d6c3e27723d54830f7`, `ca87af6e77ba87bedb260267093531e73b0be431`.
- CI and production deployment status must be checked for the final commit before describing the work as live. Browser-level presentation rendering and print layout remain to be verified after deployment.

- Final presentation polish: hide popup ads while presenting and replace the repeated person-name heading with a neutral Hello Sadiqabad public-profile heading. Commits: `3933c74f4c100b7aa98fa2af530106df2112134c`, `57f3509534e0245feff84ba2a5d47980d7766e9d`.


## Offline-first Phase 1 continuation — 17 November 2026, evening

- Re-read current project rules, state review, handoff and offline plan. Continue direct to main; preserve Supabase online source-of-truth, public-only offline package, no local write queue, and existing /offline emergency fallback.
- Added a Vite build plugin that emits offline-precache.json with all fingerprinted JS/CSS bundles; Service Worker pre-caches these bundles on install (best-effort). Production manifest endpoint returned HTTP 200 with 75 assets (73 JS, 2 CSS), including public route chunks. This closes the previous first-visit-only JS/CSS caching gap at code/build level; actual Cache Storage and offline navigation still need real browser verification.
- Hardened offline snapshot validation and added malformed nested data/private field regression tests.
- /offline-data now clarifies media/live content limits, displays StorageManager usage/quota where supported, guards duplicate download starts and checks cancellation before activation.
- CI run 44143421511: TypeScript, automated tests, production build and Edge Function checks passed. Overall CI remains failed because npm audit --audit-level=high reported a high/critical dependency gate failure. Do not suppress the gate or claim CI green; identify exact advisory before changing dependencies.
- Cloudflare Pages production deployment 9c5e9413-98d1-4568-9b3f-fe912c3e1638 succeeded for commit d607c987748476cb82c806a57dd26401084ba587.
- Production Browser Rendering verified /offline-data, /offline-precache.json (HTTP 200, 75 hashed assets) and /sw.js (HTTP 200). Browser Rendering did not expose an interactive persistent context for Cache Storage inspection or airplane-mode testing.
- Code commits: 631f31aa0fe54a2cbe8026078cb82e3dbde89e03, 16003b2ef031f27cafb2629681e8b231ba040438, 8687077a47f2da4be28d4e54e7f5890e888a3001, 218c5517b5654bb496bed5dd4f473f9ef62bdf0e, a363474e76afff9959b1199876d93d143ed2baed, 015306c55e235f9638404da18215c3208813d534, 07ccfa978422327a9f12fd8e5aef6c49d5e4d969, d607c987748476cb82c806a57dd26401084ba587.
- Phase 1 is still not accepted. Remaining: audit advisory investigation; true IndexedDB transaction/quota/concurrency failure tests; real browser SW install/cache, offline reload/deep-link, stale chunk/update/rollback; online regression and write guard acceptance; device/airplane-mode test.


## Offline-first Phase 1 — full browser package verification (17 November 2026)

- /offline-data now includes a readiness check: active Service Worker, cached SPA shell, cached emergency fallback, manifest asset coverage, native IndexedDB write/read, abort rollback and concurrent transactions, plus saved public package metadata.
- Browser Rendering on production passed: Service Worker active; SPA shell/emergency fallback cached; 75/75 fingerprinted JS/CSS assets cached; native IndexedDB write/read, abort rollback and concurrent transaction probes passed.
- End-to-end public package download in an isolated Browser Rendering context succeeded: 655 businesses, 19 categories, 303 areas, 12 emergency contacts. The diagnostic temporarily set navigator.onLine=false and verified public search, business detail, categories, areas and emergency contacts all read from the saved snapshot with matching counts. navigator.onLine was restored afterwards. No Supabase data was written.
- Added src/lib/api.offline.test.ts: offline review/inquiry/suggestion submissions return not-sent, and business/ad telemetry does not create an analytics session or queue writes. Test passed.
- CI run 44148164258: TypeScript, automated tests, production build and Deno Edge Function checks passed. Overall CI remains failed only at npm audit: 3 high findings for picomatch/tinyglobby/Vite. GHSA-fc5q-39xc-vjpf affects picomatch through 4.0.7; npm audit offers only npm audit fix --force downgrading Vite to 6.2.7 (major). Do not suppress or force-downgrade; wait for a safe upstream patch.
- Production deployment 6d482311-18fe-47f6-bed0-382c0422dae7 succeeded for b80e6b470390fc80fba26c0111574a2e46c21a38.
- This Browser Rendering test used an isolated browser context; it does not mean the user's phone already has the package. Real airplane-mode reload/deep-link and Service Worker update/rollback across open tabs still require device/browser acceptance. Real quota exhaustion and comprehensive online route smoke checks also remain.
- Phase 1 remains in progress. Do not claim complete until the physical-device checks and audit blocker are resolved.

- Additional production online smoke checks passed via Browser Rendering: home, search, a published crawl-only business profile (Shoe World), Restaurants category, Tibba Zahir Pir area, Emergency (1122/15), Local Authorities, Authority Profiles, /offline and /offline-data all returned rendered pages with expected page content. This validates key online public routes after the offline changes. A stale DB-backed static snapshot listing was correctly withheld when its live publication status could not be verified; no stale business data was force-shown.


## Mobile offline-download shortcut — 17 November 2026

- Owner requested a more obvious way for mobile visitors and installed-PWA users to reach offline setup.
- Added a highlighted **Offline** item with a download icon to the persistent mobile bottom navigation; it links directly to `/offline-data`. Urdu app language displays the Urdu label. Existing footer link and offline download logic are preserved.
- This is a navigation-only change: no changes to IndexedDB contents, public data access, Service Worker lifecycle, caching rules, Supabase, or private data.
- Awaiting CI and production deployment verification; mobile-device appearance is still to be checked as part of Phase 1 physical-device acceptance.


## Mobile offline shortcut deployment verification — 17 November 2026

- Commit `76ba1eee2e579aa9c5deaf9d5e3150185d1f1d3a` deployed successfully to Cloudflare Pages production as deployment `057d8d2b-6e48-44df-acea-13974115c885`; canonical alias `https://hellosadiqabad.com` is attached.
- GitHub Actions run `44154044236`: TypeScript, automated tests, production build and Edge Function checks passed. The overall run remains failed only at the existing npm audit high-severity advisory gate; it was not suppressed or force-fixed.
- The mobile shortcut is deployed. Physical-device visual/usability acceptance is still pending.


## Latest continuation — Admin-only compressed images and offline media — 18 November 2026

- New AdminImageUpload component and src/lib/adminMedia.ts add browser-side WebP compression, purpose-specific resizing, 15 MiB original limit and 8 MiB compressed limit. Uploads use the existing public Supabase bucket 'Hello Sadiqabad' under 'site-media/<auth.uid>/<purpose>/...'.
- Admin image upload controls are added to directory cards (categories/areas/helplines), homepage hero, Authority Profiles, admin-managed Owner Public Profile photo, News cover/gallery, sponsored campaigns and business gallery. Existing Business Logo/Cover uploader is preserved.
- Supabase migrations applied: '20261117193404_site_media_admin_upload_policy', '20261117194321_restrict_owner_image_updates', '20261117194905_enforce_site_media_webp_size'. RLS limits site-media writes to authenticated Admin/Super Admin staff with matching permissions, their own UID folder, WebP MIME and <=8 MiB. Public image reads use the already-public bucket.
- Owner Portal image URL editing was removed for business logo/cover/gallery and product/offer images. The live business trigger blocks owner changes to 'owner_photo_url', 'logo_url', 'cover_url' and 'gallery_urls'; owner product/offer request RPCs only accept the currently stored image unchanged. Existing media and records were not deleted or bulk-updated.
- Offline downloader now collects referenced images from public businesses, products, offers, directory/hero settings, active ads, published News and active Authority profiles; it caches supported public Supabase Storage images and the existing Google image proxy with bounded concurrency. Service Worker media cache is separate from the shell cache and does not include private data/API responses.
- Code is deployed; see the verification update below. Actual signed-in Admin upload, WebP size, media Cache Storage count and physical-device airplane-mode/reload remain acceptance tests. Existing npm audit gate is still a separate CI blocker.


### Additional security hardening — public business submissions

- Public visitors do not have image upload or image URL fields in the Add Business form. The live approval RPC now explicitly inserts NULL for logo and cover URLs from public new-business submissions, so a crafted public payload cannot set either image. Admin adds images after approval.
- This final migration is applied as '20261117195404_public_submission_images_admin_only'. Existing businesses and image URLs were not changed.


## Verification update — 18 November 2026

- Production commit '2aa09779c1993dd3dde4a3734e06b86e2ca23e4d' deployed successfully to Cloudflare Pages deployment '70ad68bf-c6b4-4505-85c4-19d07f075a2f'; 'https://hellosadiqabad.com' remains attached.
- CI run '44164115526': TypeScript, 92 automated tests, production build and Edge Function type-check passed. Overall run remains failed only at npm audit (3 high findings: picomatch/tinyglobby/Vite); do not suppress or force-downgrade.
- Public visitor submission hardening migration '20261117195404_public_submission_images_admin_only' is applied and included in the repository. The public approval RPC ignores visitor-supplied logo/cover URLs.
- Still unverified: actual signed-in Admin upload from UI, resulting WebP sizes, offline media cache count, and physical phone airplane-mode/reload. Production deployment alone does not prove these acceptance tests.

### Storage upload RLS correction — 18 November 2026

- Diagnosed real failed `site-media` upload from Supabase Storage logs: authenticated active Super Admin, correct own-UID folder, but INSERT rejected by RLS because metadata MIME/size predicates were not reliably satisfied at insert time.
- Applied and committed migration `20261117204927_fix_site_media_admin_insert_rls` to remove only the `metadata.mimetype` and `metadata.size` conditions. Retained `TO authenticated`, exact `Hello Sadiqabad` bucket, `site-media` prefix, own UID folder and Super Admin/approved staff permission checks.
- Browser uploader still converts to WebP and enforces supported image formats and 8 MiB compressed limit. This is client-side validation; Storage RLS no longer enforces MIME/size independently.
- Live policy verified. Owner still needs to retry one image upload in Admin UI to confirm end-to-end persistence; then check offline media cache. No public/owner upload permission was added.


## Category detail search update — 18 November 2026

- Owner requested a search bar inside every category detail listing, scoped to that category, with keywords such as business/shop name, phone number, area and other useful directory fields.
- Re-read docs/PROJECT_WORKING_RULES.md, docs/PHASE_1_GLOBAL_AND_PAGE_SEARCH_PLAN.md, the current CategoryDetail/search implementation, Supabase schema/migration state, and Cloudflare Pages configuration before editing.
- Added the search UI directly to src/pages/CategoryDetail.tsx. It is live/debounced at 300 ms, supports clearing, has bilingual placeholders/labels, and remains scoped by the current category plus existing area/open filters.
- Reused the existing public searchBusinesses() + matchesDirectoryBusinessQuery() path. No database migration, RLS change, data mutation, or new dependency was required.
- Added regression coverage for phone, address, area, services and Urdu-text matching.
- Direct commit to main is required by the permanent project rules. Cloudflare Pages is GitHub-integrated to main, so the commit should trigger a production deployment automatically.
- Supabase production project remains Hello Sadiqabad (efwohfzqitevkuybnyif); no schema/data change is needed for this UI-only feature.
- Before calling the feature deployed, verify GitHub CI, the matching Cloudflare Pages deployment for the new commit, and the affected public category route.


## Offline category and helpline card images — 18 November 2026

- Owner requested category-card and helpline-card images to remain visible offline, consistent with existing business image caching.
- Read `docs/PROJECT_WORKING_RULES.md` and `docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md` before editing.
- Root cause: `OfflineData` already included all `directory_image_urls` groups in its public media prefetch list, including categories and helplines, but only image responses were cached. The URL-to-category-slug / URL-to-helpline-ID mappings were not included in the IndexedDB offline snapshot. Offline `fetchSiteSettings()` therefore returned seed settings and the cards could not resolve their cached image URLs.
- Fix: added optional `directory_image_urls` to the existing offline snapshot, persist it during normal download, and restore it through offline `fetchSiteSettings()`. Kept schema version 1 and made field optional for old snapshot compatibility; a fresh download is needed for old snapshots to gain the mappings.
- Added validation tests for HTTPS category/helpline mappings and rejection of insecure image URLs.
- Reused existing Cache Storage media cache and Service Worker allowlist. No Supabase migration, data/RLS/Storage change, Cloudflare setting or image uploader change.
- Verify CI and Cloudflare deployment, then test /categories and /emergency or /government-helplines offline on an actual browser/device.


## Category image offline delivery correction — 18 November 2026

- Owner reported business photos display offline but uploaded category photos still do not.
- Read current permanent project rules and offline-first plan, checked current main implementation, and ran a read-only production query against public `site_settings.directory_image_urls`. Category mappings are present and use valid public URLs in the Supabase `Hello Sadiqabad` bucket (e.g. showroom, academy, college, schools, clothing, groceries and others).
- Root cause: previous offline cache stored cross-origin Supabase image responses, but category cards continued using direct Supabase URLs. Service Workers cannot intercept cross-origin image requests; therefore a Cache Storage entry keyed by that external URL is not sufficient to serve the image offline.
- Fix: added a display URL helper that rewrites only approved public Supabase bucket images (and existing Google-hosted images) to the same-origin `/image?url=` proxy. Category and helpline cards use it. The offline downloader explicitly pre-caches those same-origin proxy URLs for categories and helplines.
- Cloudflare Pages image proxy now permits only the exact production Supabase host + public `Hello Sadiqabad` bucket path in addition to the pre-existing Google image host. Other buckets/hosts remain blocked.
- Existing business card image rendering/download behavior is unchanged. No database changes, re-upload, data rewrite, RLS/Storage policy changes, or Service Worker cache namespace/version change.
- Pending: CI and Cloudflare deployment, then user must perform one fresh offline directory download and confirm category/helpline cards in airplane mode.


## Admin Data Quality category filter — 18 November 2026

- Owner requested a category filter on Admin Portal > Data Quality while preserving all existing functionality.
- Added a category dropdown sourced from the already-loaded admin category list, including counts, All Categories, and Unassigned Category options.
- Existing issue chips, displayed issue counts, listing cards, and CSV export are scoped to the selected category. No filter selection changes data or writes to Supabase.
- Passed the existing `categories` prop from AdminPortal into DataQualityManager. No schema, RLS, permission, business data or category data changes.
- CI and production deployment verification pending.


## Owner creation/listing assignment correction — 18 November 2026

- Owner reported newly created owner accounts did not show the listing selected in the Create Owner Account form.
- Production read-only checks: 3 owners, 1 existing assignment (ARTS APPAREL), 2 owners with no assignments; 371 unassigned business rows. Existing relationships must not be inferred or bulk-changed.
- Root cause: admin-create-user contained a double-escaped email regex even though shared isValidEmail was already imported; admin UI showed all businesses including already-assigned ones and did not clear the selected business after a successful create. Edge function used owner_id IS NULL correctly but returned a generic 400 on conflict.
- Fix in progress: switch to shared validator; only list unassigned businesses; reset selector after successful create/open/close; server preflight checks the listing is still unassigned; conditional update remains race-safe and returned owner_id is verified; rollback newly created Auth user on assignment failure with a clear conflict response.
- No changes to existing business data, profiles, Auth users, ownership assignments, schema, RLS or permissions. Verify production Edge Function and Pages release before asking owner to retry.


## Existing owner multi-listing management — 18 November 2026

- Added Manage Listings modal separate from Public Profile & Privacy.
- Supports multiple listings per owner; existing assignments are preselected; unassigned listings are selectable; other owners' listings are hidden.
- Added admin-manage-owner-listings Edge Function with JWT auth, super-admin / authorized sales-onboarding staff checks, active-owner validation, conditional assignment, and conflict protection. Does not transfer from another owner.
- Added API wrapper and demo fallback.
- No existing ownership data changed. Save action is explicit.
- Deployment and CI verification pending at handoff.


## Manage Listings 409 root-cause fix — 18 November 2026

- Production Supabase function logs showed two POST 409 responses from `admin-manage-owner-listings`; matching Postgres logs exposed SQLSTATE 42501: `permission denied for schema private` in `public.enforce_business_plan_limits()`, during the conditional `businesses.owner_id` update.
- Live trigger function was SECURITY INVOKER while authenticator had no USAGE on private schema. Its existing code calls `private.is_super_admin()` / `private.staff_has_permission()`; this failed before the permission decision could complete.
- Applied additive migration `20261118100000_fix_business_plan_trigger_private_schema_permissions`: set only `public.enforce_business_plan_limits()` to SECURITY DEFINER, retaining postgres ownership, empty search_path, schema-qualified references and existing authorization logic. No grants to private, no RLS changes.
- Verified live function now has `prosecdef=true` and `search_path=""`.
- Authenticated Super Admin transaction test updated the exact `MS Advertisement` listing for Muhammad Shaban successfully; transaction was rolled back, and a separate read confirmed owner_id remains NULL. This was a no-data-change regression test.
- Pending: owner should retry Save Listings in production UI to confirm end-to-end Edge Function success. Existing listing data remains unchanged.


## Inspire Business Academy listing enhancement — 18 November 2026

- Owner confirmed the Adeel Bhatti Owner account has now been created. Production read-only query confirms the existing academy listing is assigned to Adeel Bhatti and `owner_public_profiles` has `is_public=true`, `show_name=true`, `show_photo=true` with an uploaded profile photo URL. The Business Profile UI already fetches and displays this public owner profile; no profile privacy bypass or duplicate owner account was needed.
- Updated the existing listing only (ID `0d14d4af-6434-4b3c-aec3-3de0bb669a51`): detailed English description, services/course list, admission Rs. 2,000, monthly lab charges Rs. 5,040 inclusive of all 10 courses, six-month programme, batches, facilities, address, phone/WhatsApp, SEO metadata and daily 09:00–20:00 hours. Listing remains Premium and Featured. The gallery now contains the two existing approved listing images (cover and logo); additional real academy photos can be uploaded through the existing Admin gallery workflow.
- Added two active categories in production: `computer-it-training-institute` and `education-training-academy`; business tags include both slugs. Verified each category currently matches exactly one published listing.
- Committed `src/lib/api.ts` change `4d4815419ba9682cfc7956b587c07d1f71de8ef4`: secondary category slugs in business tags now count toward category listing counts and satisfy category search filters. Existing primary category behavior is retained.
- CI run `44287820063`: TypeScript type check, automated tests and production build passed; overall run failed only at the existing npm audit gate (three high advisories in picomatch/tinyglobby/Vite). Edge-function check passed. No dependency downgrade, suppression or unrelated package change made.
- Production Cloudflare Pages deployment and browser-level category/homepage verification are pending because the overall CI gate is not green. Do not claim the code change is live until the matching Pages deployment is verified.


## Latest verified feature — Public News and Authority sharing (19 November 2026)

- Owner requested individual News articles and Authority Profiles be easy to share on WhatsApp/Facebook and that the social preview image match the article cover/profile portrait.
- Implemented and deployed on GitHub main: reusable ContentShareActions component with WhatsApp, Facebook, copy-link and native share sheet (where supported); wired to News detail and Authority Profile detail pages.
- Added crawler-specific Cloudflare Pages Functions at functions/news/[slug].js and functions/authority-profiles/[slug].js. These provide crawler-readable page-specific Open Graph/Twitter metadata and canonical URLs while regular visitors continue through the existing SPA routes.
- News preview image: article cover → first gallery image → /site-logo.png. Authority preview image: profile photo_url → /site-logo.png. Data lookups use the Supabase publishable/anon key and existing public RLS policies; News is restricted to published/past-published rows and Authority to active profiles. No schema, RLS, storage, private data or existing content changed.
- Added Urdu authority-description fallback when the English authority text is blank.
- Latest feature-code commit: 3360b77aa8ec8c10c9c5b55b65c2000458dda3b9. Latest Pages deployment: 891d235d-b897-4207-b4fc-008dcdcf9229; Cloudflare reports all build/deploy stages succeeded.
- Live Cloudflare Browser Rendering with WhatsApp and Facebook crawler user-agent strings returned HTTP 200 and the correct page-specific title, description, canonical URL and image for /news/sadiqabad-ki-pehli-phone-directory and /authority-profiles/farhan-iqbal. The latest Urdu-fallback commit was rechecked on the Authority route with the WhatsApp user agent.
- Normal-browser rendering now also confirms WhatsApp, Facebook and Copy link controls are present on both the News article and Authority profile pages. The Authority page was adjusted so optional related-business loading no longer blocks the profile/share controls; latest Pages deployment `e69db7ef-2085-4a61-bbb1-a2607f6d35b5` succeeded, and the Authority route returned HTTP 200 with its portrait and all three share controls.
- Remaining external acceptance: test actual WhatsApp on a phone and Facebook Sharing Debugger; social networks may cache previews. Share buttons are present in the rendered News and Authority pages, but actual taps/sharing have not been physically device-tested. GitHub combined-status returned no checks for the feature commit, so do not report a separate GitHub Actions CI pass. Cloudflare Pages build/deploy is verified.


## Advanced Admin Analytics — 19 November 2026

- Owner approved an advanced Admin Analytics dashboard including Live Visitors.
- Feature plan and checklist: `docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md`.
- Plan commit: b95c46279f8a36ae6e80000e65e3943afe62aebc; roadmap update commit: fd2d357558ba5ca92f3c1122d032b88a639ccdf1.
- Initial audit: legacy `business_events`, `daily_business_stats`, `search_logs`, ad counters and the existing directory Analytics tab are present. The current tab is not full site-wide analytics and does not yet show live visitors/sessions.
- Deployed `track-event` v7 has JWT verification OFF and uses a server-side service-role client. It has CORS allowlisting and rate limiting keyed by the client-supplied session ID; Origin is not authentication and a caller can choose its own session key. Search logs currently retain raw search text (max 120 chars). These are explicit hardening/privacy design items, not proof of an exploit.
- No analytics application code, Edge Function or database schema has been changed yet. Phase 0 security review remains in progress; no schema/function deployment until RLS, grants, RPC authorization and migration path are fully verified.


## Advanced Admin Analytics — 19 November 2026, continued Phase 0 audit

- Read permanent project working rules and domain/security master plan. Continue direct-to-main, additive-only, no destructive DB work, and update plan/roadmap/handoff as evidence accumulates.
- Verified current repository tracking implementation and live deployed Edge Function v7. Repository source has 4 KiB body cap, UUID validation and published-business validation; deployed v7 is older/less strict and lacks those protections. Both trust caller-provided session_id as rate-limit key. Frontend src/lib/api.ts calls track-event for business events and search events.
- Verified live analytics schemas, RLS/grants and RPCs. business_events SELECT is analytics.view-only; daily_business_stats SELECT permits owner or analytics.view; search_logs SELECT is Super Admin/analytics.view; rate_limits denies anon/authenticated. No anon SELECT grants on these analytics tables. Existing admin_analytics is SECURITY INVOKER and internally gates its JSON response on Super Admin/analytics.view; retain its legacy contract.
- Verified private.staff_has_permission('analytics.view') requires active staff + active profile + staff role, honors explicit overrides/all, and falls back to listing_manager default; Super Admin is checked separately.
- Supabase Realtime publication has zero published tables and realtime.messages has no RLS policies. Do not implement visitor Presence through Supabase Realtime without a complete authorization design.
- Initial preferred live-presence design: Cloudflare Durable Object ephemeral heartbeat/aggregate with TTL and no visitor-level public API; admin read independently checks analytics.view. Same-origin edge collector + Cloudflare rate limiting is a candidate ingestion perimeter. Cloudflare binding availability/configuration is not yet verified.
- Critical deployment drift: deployed track-event v7 is materially older/less strict than repo source. Do not deploy or extend until reviewed compatibility contract is finalized.
- New findings and initial threat model recorded in docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md (commit cba1afbdc10e555f9b7f7e44da22bfe1f3206d15).
- No analytics app code, DB schema/migration, Edge Function or Cloudflare configuration has been changed. Phase 0 remains open pending SPA route lifecycle/offline review, repo-vs-live migration parity, Cloudflare binding verification and final event/report contracts.


## Advanced Analytics — continued audit 19 November 2026

- Re-read docs/PROJECT_WORKING_RULES.md and docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md. Direct main only; inspect before every change; narrow additive changes; preserve all data; never weaken RLS/auth/privacy; no unverified completion claims; verify CI and Pages deployment after commits.
- React Router source is src/App.tsx. Public routes identified: /, /search, /categories, /category/:slug, /area/:slug, /business/:slug, /owner-profile/:ownerId, /offers, /map, /favorites, /offline-data, emergency/government/local authorities, announcements/news and public static pages. Private/auth routes include login/reset/change-password, /owner/* and /admin/:tab. A global tracker belongs inside mounted BrowserRouter via useLocation; exclude private routes and query/hash-only changes by design.
- Existing offline mode explicitly skips track-event when navigator.onLine is false; no offline tracking queue is created. Preserve that. Existing search event comes from fetchBusinesses; business events and ad impressions have separate legacy calls. Do not double count these when adding site-wide page views.
- Cloudflare read-only inspection: Pages project hello-sadiqabad uses main and has only AI binding; account has one unrelated Worker script and zero Durable Object namespaces. Cloudflare docs require a separate DO Worker deployed outside Pages, then binding it to Pages and redeploying. No Cloudflare infra/config changes made.
- Rate-limit docs note WAF counters are data-centre-local. Zone WAF can add a layer but is not authentication or a global exact quota. Do not treat it as the only ingestion defense.
- Plan updated with SPA/offline/Cloudflare findings. Phase 0 remains open pending migration directory parity and complete deployment sequence for separate DO Worker + namespace + Pages binding. No code/schema/function/infra changed.


## Advanced Admin Analytics — current continuation checkpoint (19 November 2026)

- Re-opened and read the full source-of-truth plan at `docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md` on GitHub `main`.
- Completed an exact inventory comparison of the repository's `supabase/migrations/` directory and the live Supabase migration ledger: 47 repo SQL files vs 67 live applied versions (latest `20261118091057`); 44 normalized name matches; 23 live entries without same-named repo files; 3 repo files without same-named live entries. Some migrations have similar names but different timestamps, so this is not SQL-equivalence proof.
- The repo's consolidated `20261113220000_hello_sadiqabad_baseline.sql` must not be replayed: production has 16 individually applied initial migrations. For Analytics, only a new additive migration after `20261118091057` is acceptable once the SQL is reviewed.
- Verified Cloudflare Pages deployment `bc218d44-5724-4f50-b6c1-83bcbe047aa6` for docs commit `36fd8af2757d77001192e16b48b1611fa9aab256` completed successfully. This only deploys documentation; no analytics infrastructure exists yet.
- SPA public/private route inventory and offline no-queue behavior are mapped; existing search, business event and ad impression call paths are known. Full CTA/share event-source inventory remains open.
- No analytics code, DB schema/migration, Supabase function, Worker, Durable Object namespace or Pages binding has been changed. Continue from Phase 0; do not mark feature implementation complete.
- Latest plan audit update commit: `c76e64665648aab20c3bf98ffc1c93ac8c48605d`. Latest roadmap update commit is recorded in GitHub after this handoff update.


## Advanced Admin Analytics — Phase 1 database and collector checkpoint (19 November 2026)

- Source-of-truth plan is `docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md`; latest Phase 1 progress commit: `7eae8758e7e7bb258d5bf004c0f6c831d9d24942`.
- Applied live migrations:
  - `20261119140712_site_analytics_foundation`
  - `20261119140832_site_analytics_privilege_hardening`
  - `20261119140930_site_analytics_retention_90d`
  - `20261119141643_site_analytics_ingestion_primitives`
- Committed matching SQL files under `supabase/migrations/` on `main`; the retention file timestamp was corrected to match the actual live ledger version `20261119140930`.
- New tables: `public.site_analytics_events` and `public.site_analytics_sessions`; both have RLS enabled, no anon SELECT, authenticated SELECT only through the `analytics.view` policy, and service_role direct writes. Service_role cannot delete or execute the admin report.
- New report RPC: `public.admin_site_analytics_report`, SECURITY INVOKER, fixed empty search_path, Super Admin / active staff `analytics.view` authorization, max 90-day range, optional page/channel/device/entity filters, Asia/Karachi reporting date.
- New independent weekly 90-day cleanup job `site-analytics-retention-90d` is active. Existing legacy cleanup job and legacy tables remain unchanged.
- Deployed Supabase Edge Function `track-site-analytics` version 1, JWT verification disabled for public visitor ingestion. It has strict allowlists, 4 KiB body cap, HMAC visitor/session IDs, HMAC of Cloudflare edge IP for atomic 240/hour per-IP rate limiting, bot filtering and no raw search query. The existing `track-event` v7 is untouched.
- DB tests: duplicate event insertion was idempotent and updated session page views once; rate limit allowed first request and denied second; both transactions rolled back. An unrelated authenticated user was denied the report; simulated active Super Admin got the expected empty summary. Anonymous table SELECT/report execute denied. No test rows retained.
- Security Advisor still has one pre-existing leaked-password warning. Performance Advisor has 30 unused-index notices (7 new analytics indexes not used yet) and 2 pre-existing permissive-policy warnings on unrelated tables.
- No frontend tracker, dashboard UI, Live Visitors Durable Object, Cloudflare binding or production analytics events yet. Next: request-level Edge Function smoke tests, privacy notice/opt-out review, then guarded frontend tracker and dashboard.


## Advanced Analytics — frontend/Admin dashboard checkpoint (19 November 2026)

- Latest plan progress commit: `18a59dfb401753cadaa266f88cc73f043c763ee0`.
- Frontend tracker `src/lib/siteAnalytics.ts`: visitor/session pseudonyms, DNT/GPC and local opt-out checks, offline skip, allowlisted routes, no offline queue, non-blocking invocation.
- `src/App.tsx`: global React Router page-view + active-visible-time tracking.
- `src/lib/api.ts`: privacy-minimized search summary and business CTA/share event calls; legacy `track-event` calls are retained.
- `src/components/admin/AdvancedAnalyticsPanel.tsx`: database-backed report UI with 7/30/90 day range, KPIs, daily chart, top pages, channels, devices, search/engagement, CSV export.
- `src/pages/admin/AdminPortal.tsx`: panel added inside existing analytics permission gate; legacy directory analytics component remains.
- `fetchSiteAnalyticsReport` in `src/lib/api.ts` calls the SECURITY INVOKER RPC with explicit 7/30/90-day bounds.
- Cloudflare Pages production deployment for commit `9c04c3c5780ea5a84dc91338044c159e695c0ceb` succeeded. Do not infer TypeScript/test/Edge Function CI from the Pages build.
- Production env does NOT yet contain `VITE_SITE_ANALYTICS_ENABLED`; tracking remains disabled until privacy notice/controls and endpoint smoke tests are done.
- No Durable Object, Live Visitors data or Cloudflare analytics binding yet.
- Next tasks: add a visible privacy preference/notice that accurately explains analytics, perform request-level collector tests, check CI typecheck/test results, then enable tracking only after the privacy gate. Build DO presence with strict authenticated report read and no visitor-level exposure.


## Analytics production activation (19 November 2026)

- Added bilingual opt-out control to `src/pages/StaticPage.tsx` on the public Privacy Policy page. It persists the visitor preference and enforces DNT/GPC.
- Existing published privacy policy in Supabase says random session identifiers are used and raw visitor IPs are not stored in analytics.
- Set Cloudflare Pages production variable `VITE_SITE_ANALYTICS_ENABLED=true`; latest deployment for commit `b0fd6d2c203a8fba8a874c7ed4ffa06ed8a600d9` completed build and deploy successfully.
- Production analytics collection is enabled for visitors who have not opted out and do not send DNT/GPC. End-to-end event verification is still outstanding; do not claim events are verified until a browser smoke test is done.
- Current edge collector per-IP limit is 1200 requests/hour (HMAC digest only in existing rate_limits table; no raw IP storage).
- Correct retention schedule: daily at 22:00 UTC, 90-day event/session cleanup.
- Next: verify collector/browser end-to-end and implement Live Visitors Durable Object with authenticated aggregate-only admin read.


## Live Visitors implementation (19 November 2026)

- Live Visitors uses Supabase aggregate session heartbeats, not a Durable Object. The earlier DO architecture was superseded after review: existing page engagement events update session `last_seen_at` every 30 seconds while visible; querying a 5-minute window gives an appropriate aggregate live count with fewer moving parts.
- Migration `20261119150122_site_analytics_live_visitor_count` applied and committed. RPC `public.admin_live_visitor_count()` returns only an integer; SECURITY INVOKER; requires Super Admin or active staff `analytics.view`; anon EXECUTE denied.
- Added API helper `fetchAdminLiveVisitorCount()` and Live Visitors KPI in `AdvancedAnalyticsPanel.tsx`, polls every 30 seconds.
- SQL check confirmed anon EXECUTE false/authenticated EXECUTE true; simulated Super Admin RPC read succeeded.
- No DO namespace or Cloudflare binding is required for this aggregate-only implementation. Consider sharded DO only if observed scale warrants it.
- Current production deployment after the live visitor code commit is pending verification.


## Advanced Analytics — current verified status (19 November 2026)

- Latest code commit on `main`: `d7c007660890badfa9e30a13510ec8eedaa00b21` (CSV formula-injection protection).
- Latest Pages production deployment: `534fa136-8ad7-4af8-8f22-752028b5973a`, successful; alias https://hellosadiqabad.com.
- GitHub Actions run `44551040604` succeeded: TypeScript typecheck, automated tests, production build and Edge Function typecheck.
- Production analytics events are confirmed by aggregate database counts: 53 events in 24h (20 page_view, 19 search_summary, 14 engagement), 3 sessions in 24h and 1 live session in the five-minute window.
- Analytics tracker, privacy opt-out/DNT/GPC, Admin analytics panel, daily-series CSV export and aggregate Live Visitors KPI are deployed. Existing legacy analytics and `track-event` remain intact.
- No Durable Object is required for current aggregate live count.
- Still pending: controlled browser walkthrough including opt-out and private-route exclusion; direct request-level collector abuse tests; staff-denial edge cases; custom date range/comparison/visible filters/content drilldowns/expanded exports; owner-device visual verification.
- Full feature checklist and security caveats are in `docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md`. This current checkpoint supersedes earlier handoff notes saying analytics code or production event collection had not started.


## Advanced Analytics Expansion — continuation (19 November 2026)

- New owner-requested roadmap: [docs/ANALYTICS_EXPANSION_ROADMAP.md](ANALYTICS_EXPANSION_ROADMAP.md).
- Prioritized phases: P0 reliability/security verification; P1 custom dates, comparisons, filters, metric glossary/freshness and scoped exports; P2 content/CTA/search funnels; P3 audience/acquisition; P4 alerts; P5 advanced exports and UX.
- Plan and roadmap were committed directly to `main`; implementation is authorized to begin.
- Immediate next step: re-audit current tests, report RPC and authorization, then add/complete collector abuse tests and privacy/route lifecycle verification before richer reports.
- Preserve current analytics tables, RPCs, legacy analytics, privacy controls, permission model and raw-event retention. No raw IP/PII/precise location, visitor-level dashboard, fabricated history or anonymous analytics reads.
- Do not mark manual browser/device checks complete unless actually performed. See expansion roadmap for phase acceptance criteria.


### Analytics expansion — latest execution checkpoint (19 November 2026)
- Expansion plan: `docs/ANALYTICS_EXPANSION_ROADMAP.md`; original security/data contract remains `docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md`.
- Shared collector envelope validator and automated contract tests added. Sensitive/unknown top-level fields, invalid event names/IDs, engagement/search bounds and invalid entity references are rejected.
- Edge Function `track-site-analytics` deployed as version 4 (ACTIVE; JWT verification remains disabled for public ingestion). Rate limiting and bot filtering preserved.
- CI run `44554526513` passed both jobs for commit `f9b2631fbefbd59c6e8dcdae9fbbe16b25686ae6`.
- Live grants/RLS rechecked: anon analytics table SELECT/report EXECUTE denied; service_role report EXECUTE and DELETE denied; authenticated SELECT is subject to Super Admin / active staff `analytics.view` RLS.
- Remaining P0 blockers: direct live HTTP abuse/replay/rate-limit checks, staff-without-permission and inactive-staff authorization tests, and controlled browser navigation/engagement/opt-out/DNT/GPC/private-route walkthrough. Do these before custom report UI expansion.

- Latest analytics hardening adds shared public-route allowlist validation plus tests excluding Admin/Owner/auth/API/private/unknown and malformed URL paths. CI passed for commit `d6a9a063995d09295268148c51b05f891afa8314`.
- Supabase `track-site-analytics` is now version 5 (ACTIVE), including envelope and route validators. Live HTTP abuse tests and manual browser checks are still required.


## Business share cards & organic Google Search — current implementation checkpoint (19 November 2026)

- Owner approved the updated plan. Goal is the normal organic Google Search website result for each published Hello Sadiqabad business profile plus social URL preview cards. Do not create Google Maps listings or Google Business Profiles as part of this work.
- Phase 0 re-audit found 397 published businesses; 375 have at least one image URL and 22 have neither. Public `businesses` SELECT RLS is enabled and anon is limited to published rows. The only configured storage bucket is the public `Hello Sadiqabad` bucket; no storage policy was changed.
- Added `functions/business/[slug].js` for Google/social crawler requests, plus `src/lib/businessSeo.ts` and tests. The crawler response includes title, description, canonical, robots, Open Graph/Twitter and LocalBusiness/BreadcrumbList JSON-LD. Public query is allowlisted and status-filtered; normal visitors pass through unchanged.
- CI run `44581326800` passed TypeScript, tests, production build and Edge Function typecheck.
- Pages deployment `cdf061de-6a21-4d32-8deb-ea39013c03eb` succeeded for `c60031040fd95f41fb3ee35afeb2e55725507a00`.
- Googlebot Browser Rendering confirmed HTTP 200 and correct metadata/image/JSON-LD for `/business/al-madina-boring-and-sanitary-store-gvz`.
- The requested illustrative slug `al-madina-medical-store` did not match a current published business record at audit time; use an existing published slug for live testing.
- Remaining: wait-for-selector test for visible content after hydration; normal-browser and unknown/unpublished route checks; WhatsApp/Facebook/LinkedIn crawler and actual device preview checks; sitemap spot-check; Search Console URL Inspection and observed indexing. Do not claim Google indexing/ranking yet.
- No database/schema/RLS/storage changes or business-data mutations were made.


### Business SEO/share-card latest verification — 19 November 2026

- Latest deployed code commit: `b8f0c6d3bc2135c4cc6991fcbfd6b03fcc4ef056`; CI run `44582413841` passed all jobs; Pages deployment `73868e0a-b57f-4a60-8294-d9190c23a818` succeeded.
- Crawler and browser metadata now share `src/lib/businessSeo.ts` and the same JSON-LD script ID. Googlebot post-hydration Browser Rendering showed the real business H1 and exactly one structured-data script.
- WhatsApp and Facebook crawler responses: HTTP 200 with business-specific title, description, canonical, OG/Twitter image and JSON-LD.
- Unknown slug: HTTP 404/noindex, no business JSON-LD. Normal Chrome UA with JavaScript disabled: original SPA shell, no crawler-injected business metadata.
- Sitemap: HTTP 200 XML, 479 URLs total, 397 business URLs. Database: 397 published rows, 397 unique slugs, zero duplicate slug rows.
- Example cover image object exists in the public storage bucket as WebP; actual app/platform image retrieval is still pending.
- Owner's illustrative slug `al-madina-medical-store` is not currently in the live published data. Live crawler checks used `al-madina-boring-and-sanitary-store-gvz`.
- Remaining: LinkedIn crawler test, actual WhatsApp/Facebook app previews and social image fetch/cache confirmation, Search Console URL Inspection and observed Google indexing, and data-readiness improvements for 22 businesses without images.


## Mobile business share popup fix — 19 November 2026

- Owner clarified permanent workflow: direct commits to `main`; do not create feature branches or PRs. Re-read `docs/PROJECT_WORKING_RULES.md` and `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` and confirmed this rule.
- An unintended PR #13 was created in the prior turn; it has been closed. The same narrow code change was applied directly to `main` instead.
- `src/components/ui/Modal.tsx`: centered mobile backdrop with safe viewport margins; modal max-height accounts for viewport; body is a flex child with touch scrolling/overscroll containment and bottom safe-area padding.
- `src/components/directory/ActionModals.tsx`: business share sheet max width set to `max-w-md`; share actions use a two-column mobile grid.
- Main commits: `6246f7a68c4ac18dd5bbeb7c90d8b300f04bd287` and `af3041a1d00297dec9ad3324afbf6eed179ae15a`.
- No database, RLS, storage, business data, share destinations or unrelated workflows changed.
- CI, Pages deployment and actual narrow-device/browser verification are pending. Keep status as implemented, not deployed/verified, until evidence is available.


## Latest verified update — Chatbot Knowledge Part 1 (20 November 2026)

Part 1 is implemented and deployed. Existing `/api/chat` and Cloudflare Workers AI remain in place.

- Shared knowledge mapper/retrieval: `functions/_shared/chatKnowledge.js`.
- Chat endpoint integration: `functions/api/chat.js`.
- Unit tests: `src/lib/chatKnowledge.test.ts`.
- Public data snapshot: 397 published businesses, 22 categories, 314 areas, 2 news articles, 8 static pages, 12 helplines, 9 local authorities, 2 authority profiles, 3 visibility-approved owner profiles, 1 active product, 0 current offers, 0 current announcements.
- All published businesses are query-searchable through the public RPC; up to 12 matching businesses and the total count are supplied per request. Category/locality filtering supports English, Urdu, and Roman Urdu.
- Other public sources are cached for up to 180 seconds. Page/news/civic/business details are selected by query to stay within the Workers AI model's 24,000-token context limit.
- Public/private boundaries: only published/active public data, database-redacted owner profile fields, and plan-visible business fields are passed to the model. No owner IDs, admin/private data, or unpublished records.
- GitHub Actions run `44600639970` passed. Cloudflare Pages deployment `5e76f8d4-1e2c-4702-ad38-fb3ba70a33e4` succeeded.
- Production `/api/chat` returned HTTP 200 with real business links; area-list and news smoke tests also passed.
- No DB migration or data writes were made.

**Not done in Part 1:** Admin manual “Train / Sync Latest Information” button, persistent vector index/training corpus, and model fine-tuning. Do not assume these are implemented; wait for the user's next instruction before starting another phase.


## Latest verified update — Chatbot Part 2 (20 November 2026)

Read `docs/CHATBOT_PUBLIC_KNOWLEDGE_PLAN.md` for the feature plan and phase boundaries.

- Follow-up retrieval resolves short questions against earlier user requests and retains the original subject through chained follow-ups.
- Business-name searches are no longer confused with category synonyms; locality matching avoids false positives from business-name words such as “school”.
- Assistant HTTP(S)/Markdown links are clickable and safe; a New Chat control and accessible message/loading announcements were added.
- Regression tests cover follow-up context, category/business disambiguation, locality false positives and link safety.
- GitHub Actions run `44604061079` passed TypeScript, automated tests, production build and Edge Function checks.
- Cloudflare Pages deployment `97e8efdf-a322-41bd-8949-215e2b7766ce` succeeded for commit `83e8a86777f6db361e1b5c5bb5d3b35984331da9`.
- Production API smoke test returned HTTP 200; Al-Buraq School & Academy's public phone `03277056075` and follow-up address “near Kamal medical complex, Sadiqabad” were returned correctly.
- No DB migration or private-data access. Physical device/mobile interaction remains unverified.

**Part 3 now implemented:** Super Admin-only “Train / Sync Latest Information to Chatbot” control with full refresh, authorization, progress, last-sync history, source counts and error reporting. Incremental sync, vector index and model fine-tuning do not exist.

## Latest verified update — Chatbot Part 3 implementation (20 November 2026)

Read `docs/CHATBOT_PUBLIC_KNOWLEDGE_PLAN.md` for architecture, scope and verification boundaries.

- Added Admin Portal navigation section `/admin/chatbot-knowledge`, restricted to Super Admin in the frontend.
- Added backend `GET/POST /api/chat/sync`; server verifies Supabase Auth bearer token and current active `profiles.role = super_admin`. POST also requires same-origin.
- Added full public knowledge refresh. It re-reads 12 public sources and the published business count; business listings remain live searched per visitor question rather than being copied into a separate store.
- Versioned edge cache is replaced only after all sources load and cache write succeeds. Source failure preserves the prior successful cache.
- Admin UI records and displays progress, last successful refresh, source-by-source statuses/counts, recent runs and errors. Only full refresh is implemented; incremental sync and model fine-tuning are not.
- Applied Supabase migrations: `20261119201013_chatbot_knowledge_sync_runs`, `20261119201034_chatbot_knowledge_sync_progress`, `20261119201234_chatbot_knowledge_sync_admin_select_hardening`, `20261119201810_chatbot_knowledge_sync_actor_index`.
- Verified sync-history RLS: enabled; anon SELECT denied; authenticated SELECT/INSERT/UPDATE available only through Super Admin RLS; DELETE not granted.
- GitHub Actions run `44607374336` passed TypeScript, automated tests, production build and Edge Function checks. Cloudflare Pages deployment `f59c46e9-e0e6-494f-ad41-8cd2ddcbba26` succeeded for final commit `700dc172b70624c539373ad185ba620b538dfff5`.
- Production API smoke test: unauthenticated GET and POST both returned HTTP 401.
- **Pending verification:** owner runs the first authenticated full refresh using an active Super Admin session; physical mobile/device interaction.


## New requested work — Government Jobs, Schemes & Owner Portal (20 November 2026)

**Plan saved; implementation not yet authorised.** Read docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md before starting.

Owner wants Hello Sadiqabad to become a daily-use local information platform with:
1. Government Jobs — manually Admin-managed; assistant may research official sources and prepare drafts when asked; only official-source verified listings should publish.
2. Government Schemes — Punjab and Federal programmes clearly labelled separately (examples include housing, loans, agriculture, education, BISP and current fuel relief), with source-backed eligibility, documents, deadlines/status and official redirect URLs.
3. Add Business and Owner Portal — guided public form, searchable bilingual area picker, improved business details, and visible but locked Premium/Basic benefits for Free users.

Inspected baseline:
- src/pages/AddBusiness.tsx: simple public request form; native Category/Area selects; currently selects first loaded area/category; business requests remain moderated.
- Live public area dataset: 314 active rows.
- src/pages/OwnerRegistration.tsx: pending owner account request with Admin approval; no direct account creation.
- src/pages/owner/OwnerPortalPages.tsx, src/components/owner/OwnerNav.tsx, src/components/owner/ListingEditor.tsx, src/components/owner/OwnerModules.tsx: existing owner portal/editor and plan-aware UI.
- Live plans table already contains Free, Basic, Premium limits/features; existing locks include some WhatsApp/social/offers. New work should complete/standardise the plan-driven experience rather than replace it.
- Existing area IDs/slugs, business rows, submissions, ownership, moderation and RLS must remain intact.

Suggested delivery order:
- Phase 0: approve requirements, permissions, data model, source verification and UX.
- Phase 1: Government Jobs MVP.
- Phase 2: Government Schemes MVP.
- Phase 3: Add Business and Owner Registration form redesign.
- Phase 4: Owner Portal locked benefits, quotas and guided completeness.
- Phase 5: daily-use home widgets, saved items, opt-in alerts/digests and verified chatbot integration.

Trust/security:
- Official source URL or official advertisement is required for every published job/scheme; assistant research creates drafts only, Admin controls publication.
- No automatic scraping/auto-publishing in MVP.
- Show last verified date, source and status; distinguish Punjab and Federal schemes.
- Never collect CNIC, OTP, passwords, bank details or biometric data; no in-app applications or eligibility guarantees.
- Public Add Business stays moderated; submitter private contact is never public by default.
- UI plan locks must be backed by existing database/RPC/RLS enforcement.
- No schema changes, code implementation, or changes to existing records have been made for this new plan.

Official source starting points and detailed fields, routes, acceptance tests and owner decisions are in the feature plan. Owner must explicitly authorise a phase before implementation.


## Owner-approved product expansion — latest handoff (20 November 2026)

**Canonical starting document:** [Hello Sadiqabad Master Plan & New-Chat Handoff](GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md). This file now contains the full Jobs, Schemes and Owner Experience plan, owner approval state, a permanent project-rules quick reference, required reading order, project-wide continuity notes and a copy/paste instruction for a new chat. Always read it first when continuing this work.

- Owner explicitly approved the Government Jobs, Government Schemes and Business Owner Experience plan on 20 November 2026.
- **Phase 0 only is authorised:** inspect current Admin permissions, moderation, audit logs, schema and live migration ledger, RLS/storage policies and current UI; prepare data-model/permission/security proposal and UX design; record acceptance gates.
- **Not authorised yet:** feature implementation, database migrations, production data changes, or starting Phase 1. Obtain explicit owner approval at the appropriate phase gate.
- The complete feature requirements, fields, public UX, Admin workflows, official sources, scam safeguards, acceptance criteria and exclusions are in `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md`.
- Permanent working rules remain authoritative in `docs/PROJECT_WORKING_RULES.md`; work directly on `main`, no branches/PRs, inspect before every change, preserve all existing data/security/moderation, verify with evidence, and keep the plan/roadmap/handoff synchronized.
- `PROJECT_ROADMAP.md` has been updated to reflect approval and Phase 0 authorisation.

**Next action for a new chat:** read the canonical master plan and permanent rules, then begin Phase 0 audit/design only. Do not rely on the previous chat transcript or assume that implementation has started.


---

## Latest handoff — Government Jobs / Schemes / Owner Portal (20 Nov 2026)

**Owner decision:** The owner approved Phase 0 only (audit, requirements and design). Feature implementation and database changes require a separate explicit approval after Phase 0 design review.

**Read these first in a new chat:**
1. `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md` — canonical complete plan and rules.
2. `docs/PROJECT_WORKING_RULES.md` — mandatory repo workflow and safeguards.
3. `PROJECT_ROADMAP.md` — current product roadmap and checkpoints.
4. `docs/NEW_CHAT_HANDOFF.md` — project history and latest checkpoint.
5. `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PHASE0_AUDIT.md` — current audit findings and proposed design.

**Phase 0 completed work:** Read-only review of current code and live Supabase schema, 81-entry migration ledger, RLS policies, Storage bucket/policies, plan configuration, permissions, Add Business, Owner Registration, Owner Portal, Admin navigation/moderation and Supabase Advisors. The report records current counts, existing controls, proposed routes/data model, permissions, publication flow and test gates.

**Current status (latest):** Phase 0 design accepted; Phase 1 Government Jobs MVP is implemented in commit `464691c9542ae753ec4a7b320d097b72136e13ce`, CI passed and Cloudflare Pages production deployment succeeded. The live `government_jobs` table is created with RLS and audit controls. Do not treat Phase 2/3/4/5 as authorised.

**Critical preservation notes:**
- Continue from the existing `main` branch; do not rebuild from scratch.
- Do not replay the consolidated baseline or assume the repository migration files are identical to the live migration ledger.
- Preserve the existing `submit-suggestion` moderated flow for Add Business and the Admin-approved Owner Registration process.
- Preserve `public.plans` as the plan/limit source of truth and all existing backend plan enforcement.
- The existing `Hello Sadiqabad` Storage bucket is public; never put pending/private government documents there.
- New government-content staff permissions must be explicit and separately gated in frontend and database.
- All user-facing updates remain in Roman Urdu.


---

## Latest handoff — Phase 1 Government Jobs implementation (20 Nov 2026)

**Owner approvals:** Phase 0 design accepted; Phase 1 Government Jobs MVP explicitly authorised.

**Latest code commit:** `9e86b6505737ca5d666550e9df4b3a58566a12f7` on `main` (initial implementation commit `464691c9542ae753ec4a7b320d097b72136e13ce`).

**Implemented files:** `src/pages/GovernmentJobs.tsx`, `src/components/admin/GovernmentJobsManager.tsx`, `src/lib/governmentJobs.ts`, `src/lib/governmentJobs.test.ts`, `src/types/database.ts`, `src/lib/api.ts`, `src/App.tsx`, Admin navigation/portal/permission matrix, sitemap function, and versioned migrations.

**Live database:** `public.government_jobs` exists. RLS exposes only published/closed/expired records to public users. Authenticated writes require Super Admin or explicit `government_jobs.manage`; no broad staff-type default grants this permission. Create/update operations are audited. Table currently has zero job rows.

**Live migrations:**
- `20261120150330_government_jobs_mvp`
- `20261120150410_government_jobs_allow_incomplete_drafts`
- `20261120150416_government_jobs_require_verification_timestamp`
- `20261120150950_government_jobs_audit_fk_indexes`
- `20261120151230_government_jobs_bilingual_summary`

Matching files are tracked in `supabase/migrations/`. The execution environment lacked a local Supabase CLI/checkout, so the connected Supabase migration operation applied the versioned migrations and the matching SQL files were committed. Never replay the already-applied migrations or consolidated baseline.

**Tests/deployment:** GitHub Actions CI succeeded for latest code commit (`44761553431`). Cloudflare Pages deployment `f9b5688a-2642-4f01-98cb-e328440cb476` succeeded and carries the `https://hellosadiqabad.com` production alias. Supabase Security Advisor showed no new Government Jobs finding; Performance Advisor no longer reported unindexed Government Jobs foreign keys. Existing unrelated Advisor findings remain unchanged. Physical mobile-browser testing remains to be done.

**Next action:** Verify the live public route and Admin tab in a real browser/mobile session; add first jobs only after manual verification against official Punjab/Federal government source pages. English summary is mandatory for publication; Urdu summary is optional. Filters include department and job type; Upcoming/Closing Soon/Expired status uses Asia/Karachi dates. Keep source URL, official advertisement URL, application URL and verified date distinct. Do not upload unpublished PDFs to the public Storage bucket.

**Scope guard:** Government Schemes, Add Business form redesign, Owner Registration redesign and Owner Portal plan-aware improvements remain future phases and must not be implemented without their own explicit phase approval.


**Phase 1 latest delta:** Public navigation links now appear in desktop header, mobile bottom navigation and footer. Public listing supports Punjab/Federal, department, job type, archive and full-text filters. Upcoming jobs are labelled from `application_open_at`; published English summary is required and Urdu summary optional. Admin shows a likely-duplicate warning before save. The live jobs table remains empty pending manual source review; no job records were auto-imported.


Final UI detail: English/Urdu summary fields in Admin are multiline textareas in commit `9e86b6505737ca5d666550e9df4b3a58566a12f7`.


---

## Latest handoff — first Government Job record + optional poster upload (20 Nov 2026)

- First job record is now published in `public.government_jobs`: **Network Support Consultant**, Office of the Controller General of Accounts (Government of Pakistan), PPS-7 contract, Islamabad, 1 vacancy, deadline **28 November 2026**. Source: official National Jobs Portal detail page `https://www.njp.gov.pk/index.php/jobs/10578` (posted 11 Nov 2026; page states five years' networking experience, suitable technical qualification/CCNA/DAE or equivalent, maximum age 45, and location Islamabad). The portal listing does not state domicile; the record explicitly marks domicile as unspecified and tells candidates to confirm on the official listing. Sadiqabad eligibility is left unconfirmed.
- Public detail slug: `/government-jobs/network-support-consultant-cga-2026`.
- Admin Government Jobs form now has an optional poster upload: JPG/PNG/WebP/AVIF, max 5 MB, stored in `Hello Sadiqabad/government-jobs/<auth-user-id>/...`. Public detail and listing cards display the image when present. Image is not required and may be uploaded later.
- New nullable `image_url` column and storage policies applied; migration file tracked as `supabase/migrations/20261120152313_government_jobs_optional_poster_image.sql`.
- Latest code commits include `e841ec4`, `e7f449b`, `5b3b418`, `d73ed4a`, and `8079852`; check current `main` head, CI and Pages deployment before claiming live.
- Pending: confirm public RLS visibility, Storage policies/advisors, CI and Cloudflare deployment. Physical mobile-browser acceptance remains outstanding.
- Next roadmap phase after Phase 1 is Government Schemes MVP; do not start it until the owner confirms the intended scope/approval in the next turn.


## Phase 2 Government Schemes research handoff (20 Nov 2026)

The owner requested that the next planned work start after the first job entry. Phase 2 research/design has therefore begun; no Phase 2 feature code, schema migration or scheme record has been added. Read `docs/GOVERNMENT_SCHEMES_PHASE2_RESEARCH.md` for official candidate programmes, current verification caveats, proposed additive tables/RLS/permission model, public/Admin UX and acceptance gates. Candidates include Apni Chhat Apna Ghar, Asaan Karobar Card, PM Youth Business & Agriculture Loan Scheme, Benazir Kafaalat and Benazir Hunarmand. Intake windows/terms must be reverified from official sources before any scheme is published.

Phase 1 remains pending final production alias/browser and owner mobile QA. Do not start Phase 2 schema/code until that acceptance gate is cleared; the user's latest instruction authorises research/design at this point.


### Final verification update — job poster upload and first public listing (20 Nov 2026)

- The new migration is recorded in Supabase as version `20261120152313`, name `government_jobs_optional_poster_image`; matching repo file: `supabase/migrations/20261120152313_government_jobs_optional_poster_image.sql`.
- Anonymous-role SQL query returned the published Network Support Consultant record, confirming public RLS read. `image_url` is currently NULL, as the owner has not uploaded a poster yet.
- Storage policies exist for INSERT/UPDATE/DELETE under `government-jobs/<auth.uid()>/`, restricted to Super Admin or explicit `government_jobs.manage` permission.
- Supabase Security Advisor: no new Government Jobs or Storage finding. Existing unrelated findings remain (private analytics gateway token table with RLS but no policy; leaked-password protection disabled). Performance Advisor's unused-index warnings include new Government Jobs indexes on a low-volume table; do not drop them without query-plan evidence.
- Cloudflare Pages deployment `73263626-a9f9-43ba-a4df-f0a33dca493d` succeeded and carried alias `https://hellosadiqabad.com`. It includes the optional poster upload code. Later commits only updated Markdown handoff/research documents and were still queued when checked.
- GitHub combined commit status did not expose check results; Pages build stage (`npm run build`) succeeded. Do not claim separate TypeScript check, unit tests or GitHub CI passed.
- Production browser route was not verified: web fetch of the detail URL was inaccessible. Physical mobile/browser QA remains the owner acceptance task.


---

## Latest handoff — Government Schemes Phase 2 MVP (20 November 2026)

Owner instructed: “ab agy ka kam shuru kro bina ruke”. Phase 2 Government Schemes implementation has therefore been authorised and started. Read docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md, docs/GOVERNMENT_SCHEMES_PHASE2_RESEARCH.md, docs/PROJECT_WORKING_RULES.md and docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md before any further code changes.

### Implemented
- Public /government-schemes and /government-schemes/:slug routes, search, Punjab/Federal, category and intake-status filters.
- Five published official-source information records: Apni Chhat Apna Ghar; CM Punjab Asaan Karobar Card; PM Youth Business & Agriculture Loan Scheme; Benazir Kafaalat; Benazir Hunarmand.
- All five have intake_status='unconfirmed'; the UI says to check the official portal and never claims applications are open. No unsupported deadline or stale BISP stipend amount is shown.
- PMYB record distinguishes the three tiers still shown on the official portal from the PID Tier 4 release confirming PKR 7.5m–25m at 8% for up to eight years; the portal still shows three tiers. It flags the age discrepancy between Radio Pakistan's 8 Nov report and PID/portal wording.
- Asaan Karobar Card details include PSIC processing fee PKR 500 and annual fee PKR 25,000 + FED, 0% borrower markup, 3-year repayment and 33 instalments after 3-month grace.
- BISP page warns that the survey is free and 8171 is the only official SMS number. Benazir Hunarmand page does not promise Sadiqabad course availability.
- Admin Portal tab Government Schemes, permission government_schemes.manage, scheme CRUD/publish/archive/intake-status management, re-verification filter, public report queue and append-only revision history.
- Open intake requires an official application URL and next-review date at both UI and DB level.
- Report form stores only a fixed reason choice (no public free-text, phone/email/CNIC/OTP/bank/application data), with a one-per-scheme/reason/hour uniqueness guard.

### Supabase migrations applied and tracked
- 20261120153621_government_schemes_mvp.sql
- 20261120154049_government_schemes_fk_indexes.sql
- 20261120154130_government_scheme_reports_authenticated_submit.sql
- 20261120154355_government_schemes_official_seed_v1.sql
- 20261120154533_government_schemes_open_intake_guard.sql
- 20261120154622_government_scheme_revision_history.sql
- 20261120155217_government_scheme_reports_no_public_note.sql

### Verification evidence
- Five published rows exist; anonymous SQL role reads five.
- Draft visibility test: anon sees zero drafts. Unauthorised authenticated insert into schemes was rejected.
- Anonymous and authenticated report-insert tests passed inside rolled-back transactions; non-admin authenticated report SELECT returned zero.
- Security Advisor: no new Government Schemes findings. Existing unrelated findings remain: private analytics gateway token table with RLS/no policy (INFO) and leaked-password protection disabled (WARN).
- Performance Advisor: no unindexed foreign keys after indexes; unused-index notices on the new low-volume tables are expected until queries use them.
- Final Cloudflare deployment 1ea86a78-1a15-4cd0-81b1-2cf7e57df644 succeeded with alias https://hellosadiqabad.com after the open-intake guard, public status filter and Admin revision-history refinements; its npm run build stage succeeded.
- GitHub combined status returned no check details; do not claim TypeScript/unit-test CI passed unless a later Actions run confirms.
- Web browser fetch of production/preview routes was inaccessible; physical mobile/browser QA remains outstanding.

### Next action
Check the latest Cloudflare Pages build/deploy for the final code commits, then finish real browser/mobile QA. Reverify official intake before changing any scheme to open. Phase 3 Public Add Business + Owner Registration UX is the next planned feature phase; do not mix it into the Schemes MVP without reviewing the master plan's scope.


### Official scheme content review v2

- Apni Chhat record now includes the SMU page's three programme routes, including interest-free construction loans up to PKR 1.5m over seven years for qualifying plot owners; application intake remains unconfirmed because the SMU page's last-date statement is from 2025.
- PMYB application link now points to the PMYP Digital Youth Hub, per the 10 Nov 2026 PID release. The old PMYB&ALS portal still displays three tiers; Tier 4 is announced but not assumed live in the old form.
- Benazir Hunarmand public page links only the public portal, does not expose the confidential guide PDF, and tells users to confirm Sadiqabad / Rahim Yar Khan course availability before travelling.
- Additional migration: 20261120155622_government_schemes_official_content_review_v2.sql.


### Official source verification v3

- PMYB&ALS now links to the PMYP Digital Youth Hub. Its info portal still shows three tiers; the Government's 8 Nov 2026 announcement reported by Radio Pakistan raises the ceiling to PKR 25m and changes the minimum-age policy; the PID 10 Nov release confirms Tier 4 at 8% for up to eight years. The public record flags the age-rule discrepancy between Radio Pakistan and the PID / older portal.
- Benazir Kafaalat now links directly to the official programme page and anti-fraud / 8171 notice. Old stipend and PMT values are not repeated as current-cycle terms.
- Migration 20261120155746_government_schemes_official_content_review_v3.sql
- `20261120155900_government_schemes_pmyb_source_attribution_v4.sql` is applied and tracked.


- Additional migration 20261120155900_government_schemes_pmyb_source_attribution_v4.sql updates the PMYB source attribution to the PID Tier 4 release.


- PMYB Tier 4 is now confirmed by the official PID 10 Nov release: above PKR 7.5m up to PKR 25m at 8% for up to eight years. The PMYB portal still shows three tiers. Radio Pakistan's 8 Nov report says age 18 for all, while PID / portal retain 21–45 (18 IT/e-commerce); the public record flags this conflict. Migration 20261120160458_government_schemes_pmyb_tier4_verified_v5.sql is applied and tracked.


- Benazir Hunarmand public content was further privacy-hardened: the older BISP guide PDF is marked confidential, so the public page no longer links or quotes it. The page uses only the public portal and tells Sadiqabad / Rahim Yar Khan applicants to confirm current course availability before travelling. Migration 20261120160642_government_schemes_hunarmand_public_source_only_v6.sql is applied and tracked.


### 24 November 2026 — Complete public offline package, background navigation and update notice

Implementation is in progress on `main`. This change expands the existing IndexedDB snapshot and Cache Storage flow; it does not require a Supabase schema, RLS, Storage-policy or data migration.

- Offline snapshot now includes published businesses, active categories and areas, active emergency contacts, published news articles, active/scheduled public announcements, active local authorities, active authority profiles, published government jobs, published government schemes, published static pages, active business products, active public ads, public site settings, and opted-in owner profiles from the redacted `owner_public_profile_directory` / `owner_public_profile_businesses` views.
- Public records are allowlisted before storage. Internal creator/updater/approver IDs and private notes/analytics are omitted. Owner profile contact fields are taken only from the existing redacted opt-in public view; the raw owner profile tables are not queried. Public owner profile values are hashed for the update fingerprint rather than copied into the fingerprint string.
- Offline adapters now read the saved news, announcements, authority directories, public pages, jobs, schemes, products, ads and opted-in owner profiles from the snapshot. Business listings continue to use the existing offline adapters.
- Image package now includes all public image URL fields from the above datasets, the known shipped public site image assets, directory image maps, business logos/covers/galleries/offers, product images, news images, authority/owner profile photos and job posters. Cache Storage uses the existing public media cache. The Service Worker also serves cached same-origin public image files while offline.
- Cacheable media sources remain deliberately restricted: the existing public Supabase bucket, the existing Google image proxy allowlist, the site's same-origin image proxy, and same-origin static image assets. Unsupported third-party image hosts can still prevent an image from being cached; the UI reports skipped images. External video streams, live embeds and third-party map tiles are not copied into the offline package.
- Download state/controller is now module-scoped and survives React route changes inside the open app. Navigating to another in-app page no longer aborts the download; returning to Offline Data shows the shared progress and cancel control. This is not a promise that a browser will continue downloads after the tab/browser is closed or the operating system suspends the app.
- Public content version checking fingerprints businesses, products, offers, approved reviews, active ads, categories, areas, emergency contacts, news, announcements, authorities, authority profiles, jobs, schemes, pages, public settings and opted-in public profile views. Public pages check on reconnect and at five-minute intervals. When a saved package is stale (including legacy packages without a version fingerprint), the homepage shows a download-update notice linking to Offline Data.
- Forms, report submissions, account/authentication flows, admin/owner portals and private user data remain online-only and are never queued or stored in the offline package.
- Acceptance still requires green TypeScript/unit-test/production-build CI, successful Cloudflare Pages deployment, and real browser/mobile testing: start a download, navigate between several public routes, return to confirm progress, complete the package, switch to airplane mode, and verify each downloaded route and image category. Do not claim complete offline acceptance until those checks pass.


### Offline-first latest status — 24 November 2026

- Offline public snapshot now includes businesses, categories, areas, emergency contacts, news, announcements, authorities, authority profiles, government jobs/schemes, public pages, safe public settings, active ads, products and opted-in public owner profiles.
- Image package includes all static public image assets plus supported public Supabase Storage and Google-hosted media referenced by the public datasets. If a referenced image fails or is unsupported, the new package is not activated; the previous verified package remains.
- Public content version checks run on public pages, on reconnect and every five minutes while open. A stale package triggers a homepage update notice linking to `/offline-data`.
- Download controller/progress is app-level; in-app navigation does not abort it, and a progress/cancel indicator stays visible across public pages. Browser tab closure/OS suspension is not guaranteed to continue a download.
- Final production code commit `9caa205c59e778f676ef1f404475777160cf8cb8`; Pages deployment `d87465cd-dc76-4c20-92df-3fc8503376ae` succeeded and has the canonical alias `https://hellosadiqabad.com`. Configured `npm run build` passed.
- TypeScript typecheck, automated tests, GitHub CI, interactive browser checks and physical-device airplane-mode acceptance were not run for this batch. Keep offline acceptance in progress until these are tested.
- Third-party map tiles, live embeds, external video streams and private/admin/owner portal data are not part of the offline package. Server writes remain online-only.



---

# NEW OWNER-APPROVED PLAN — 25 NOVEMBER 2026 (READ FIRST FOR THIS WORK)

The owner has approved the requirements recorded in `docs/FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md`. This is a planning record, not proof of implementation. For any new chat continuing this scope, read the master plan and all child plans before coding.

## Required new-chat reading order
1. `docs/FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md`
2. `docs/PROJECT_WORKING_RULES.md`
3. `PROJECT_ROADMAP.md`
4. This handoff; reconcile older notes below against current main.
5. `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md`
6. `docs/ADMIN_PERFORMANCE_OPTIMIZATION_PLAN.md`
7. `docs/ADD_BUSINESS_OWNER_APPROVAL_PLAN.md`
8. `docs/GOVERNMENT_CONTENT_BILINGUAL_MEDIA_PLAN.md`
9. `docs/SDK_JOBS_RECRUITMENT_PLAN.md`
10. `docs/GOV_LANDING_AND_MOBILE_NAVIGATION_PLAN.md`

## Owner-confirmed constants and decisions
- Recruitment WhatsApp: **03283212342**.
- Recruitment free period through **31 January 2027 inclusive**; fee may start 1 February 2027, amount intentionally unset and Admin-configurable. Candidate pays; business owner does not.
- Default office days Monday-Friday; hours 10:00 AM–2:00 PM Pakistan time. Saturday/Sunday closed. Admin may change schedule. Do not invent office address.
- SDK Jobs only for authenticated Admin-approved owners with at least one published business. Every job needs Admin approval. Employer identity is private/Admin-only on all public surfaces.
- Candidate brings physical CV; Admin interviews and, if suitable, refers to employer and issues an auditable referral letter. No job placement guarantee.
- Add Business form does not collect password. Admin sends secure Supabase invitation after review; owner sets password through Supabase.
- Each submitted business field has Pending Review / Approved & Published / Rejected / Unpublished status. Pending images remain private until approved. Owner can request maximum two profile/logo/cover image changes per business per calendar month.
- Government Jobs/Schemes require English and Urdu, official/verified Admin-uploaded image before publishing, canonical share URL and approved social preview image.
- Gov landing cards: Government Jobs, Government Schemes, Local Authorities, Authority Profiles.
- Mobile bottom nav final order: Home, Search, News, Gov, SDK Jobs, Saved. Preserve News at `/news` with bilingual `nav.news` label and Newspaper icon. Remove separate Jobs/Schemes and Urgent shortcuts only; preserve Home Emergency card and Emergency route.
- Admin Business and Data Quality performance issue is worse on desktop and is a priority.

## Next safe action
Start with Phase 0 audit/design in the master plan. Inspect current main code, exact routes, Supabase live migration ledger, RLS, permission model, Storage policies, tests and deployment state. Do not implement schema changes in the audit phase. Existing Government Jobs/Schemes/Owner workflows must be extended, not recreated. Preserve all production data and follow `docs/PROJECT_WORKING_RULES.md`.

Older historical notes in this handoff are retained as evidence; if they conflict with this latest approved plan or current code, inspect and reconcile rather than following stale instructions.


---

## Final Product Expansion — Phase 0 audit handoff (25 November 2026)

Read [`docs/FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md`](FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md) and [`docs/FINAL_PRODUCT_EXPANSION_PHASE0_AUDIT.md`](FINAL_PRODUCT_EXPANSION_PHASE0_AUDIT.md) before continuing.

- Phase 0 read-only source/schema/security audit and additive design are documented.
- Current audit HEAD before this documentation checkpoint: `a310577362fde1d5ce15ecc1fed507cf0a72d668`.
- CI for that HEAD passed both jobs (npm install/audit/typecheck/tests/build and Deno Edge Function typecheck). This was documentation-only; it does not mean expansion code is implemented.
- Admin performance root causes are recorded: 19-request global reload on every tab, eager large Admin module imports, unbounded business cards and repeated Data Quality scans.
- Database-only query baseline: current joined business query returned 697 rows and executed in 5.347 ms in the audit environment. Authenticated browser timings and click latency are still unmeasured and must be collected for Phase 1 acceptance.
- Live Supabase migration ledger has 95 versions; repository has 74 migration files with significant version drift. Never replay the baseline or blindly push migrations.
- Existing Storage bucket `Hello Sadiqabad` is public. Pending business/government media requires a separate private bucket and an approved-media promotion path.
- Existing `manage-owner-registration` Edge Function is deployed (version 3, JWT required) and checks Admin permission, but does not associate the invited owner with the reviewed business. Extend only with reviewed idempotency, rollback and business-linking safeguards.
- No application code, production schema/data, Storage objects, Auth settings or deployment configuration changed during Phase 0.

**Next approved workstream:** Phase 1 — Admin Business and Data Quality performance. Do not mark it complete until before/after desktop and mobile measurements, pagination/filter/action/export/permission tests, typecheck, automated tests, production build, CI and deployment evidence are recorded.


---

## Phase 1 Admin performance — current handoff (25 November 2026)

**Latest implementation commit:** `6009012c143e90dbbcce1dfc2fddaa79c3fa2872`.

Implemented and deployed:
- Lazy-loaded Admin managers.
- Active-tab-only data loading; the previous 19-request all-tab reload was removed.
- Global quick-search data loads only when a query is entered and required datasets are not already present.
- Business list: 50-item pagination, memoized filters, full-filter selection/bulk actions preserved.
- Data Quality: memoized issue calculations, one-pass category/issue counts, 50-item pagination, complete filtered CSV export preserved.

Verification:
- GitHub CI [45585636119](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45585636119) passed both jobs: npm dependency gate, TypeScript, automated tests, production build and Edge Function typecheck.
- Cloudflare Pages deployment `759c75f9-d12d-45ec-a94d-196953c9ba19` succeeded for the same commit and has canonical alias `https://hellosadiqabad.com`.
- No Supabase migration, RLS, Storage policy, Auth setting or production data change.

**Do not mark Phase 1 complete yet:** no authenticated browser was available to capture before/after desktop timings or test click latency, mobile behavior, pagination/filter/bulk actions, modal editing, moderation and export. Do not invent milliseconds or claim browser QA. The code changes are deployed; interactive acceptance remains pending.

**Current workstream:** Phase 2 Add Business field-level approval and secure owner invitation has been implemented on `main` and deployed to the existing Supabase production project. Phase 1 authenticated performance acceptance remains outstanding but does not block the owner-authorised Phase 2 work.


## Phase 1 latest continuation — 25 November 2026

Latest implementation commit: `4ed8f50042928896064f3925f8e8f203e0951de7`.

Additional optimization after the first Admin performance slice:
- Admin business list query now uses an explicit field allowlist and limited Category/Area relations, not `select('*')` or the full Plan relation.
- Full business row is fetched by ID only when Admin opens the edit modal.
- CI [45587036171](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45587036171) passed both jobs: dependency gate, TypeScript, automated tests, production build and Deno Edge Function checks.
- Cloudflare Pages deployment `51d981f8-e50a-400d-af08-ae5e14481940` succeeded for the exact commit, canonical alias `https://hellosadiqabad.com`.

**Phase 1 is still in progress.** No authenticated browser session was available to collect desktop cold/warm timings, click-to-response traces, permission/action checks or mobile smoke tests. Do not claim a speed percentage or mark Phase 1 complete. The repository currently has no Playwright/browser E2E script in `package.json`; CI runs typecheck, unit tests and production build only.

**Live database safeguards reconfirmed:** SQL reports 95 rows in `supabase_migrations.schema_migrations`; 74 migration SQL files exist in the repository. The single existing Storage bucket `Hello Sadiqabad` is public. All inspected public base tables have RLS enabled. Do not run schema push/replay or place pending media in a folder of the public bucket. No database/schema/RLS/Storage/Auth/data changes were made in this follow-up.


## Phase 2 preflight — read-only findings (25 November 2026)

Historical preflight snapshot: reviewed current `/add-business`, migrations, live tables/columns, RLS, Storage and Edge Functions before implementation. The subsequent production rollout is recorded below.

- `/add-business` lacks the approved fields for Urdu address, separate landmark, map URL, daily hours, owner Gmail and logo/cover uploads; it auto-selects first Category/Area.
- `submissions` is generic JSON payload with no per-field moderation ledger.
- Existing `private.approve_submission` currently publishes all fields of a new-business submission in one branch. Preserve all other branches and replace only this new-business path once a safe new workflow is ready.
- `owner_registration_requests` is separate and has no business/submission FK.
- `manage-owner-registration` is deployed ACTIVE v3/JWT required, but it does not link invited owners to a reviewed business.
- Current only Storage bucket is public; pending files need a separate private bucket.
- Live RLS policies were inspected and no public base table with RLS disabled was found.

At the time of this preflight snapshot, Phase 2 implementation had not started. Owner later explicitly authorised Phase 2 to proceed without waiting for Phase 1 browser/mobile acceptance; see the production rollout checkpoint below.


## Phase 2 continuation handoff — 25 November 2026

Historical pre-deployment handoff. Owner-approved workflow remains direct commits to GitHub `main`; no branches or PRs. The old feature branch/PR #19 remain closed, while verified code has since been ported to main and deployed; see the current rollout checkpoint below.

This earlier status was superseded: all Phase 2 migrations are now applied to the existing project, all dependent Edge Functions are deployed, and the production frontend is live. Current migration versions, CI and Cloudflare evidence are recorded below.

A separate staging project was not created because the organization had reached its Free-project limit. Owner then directed work in the existing Hello Sadiqabad project; additive migrations were applied there and transaction/rollback tests were run without retaining test records.

The second migration, Add Business/Admin changes and Edge Functions were ported to `main` and deployed. SQL transaction tests cover field approvals, media finalization, owner invitation/link/rollback, legacy approval guard, plan limits and rate limits. Remaining gate is authenticated browser/email/public-render QA.

Next safe action: complete authenticated Admin browser QA and a controlled disposable end-to-end submission in the existing project. Do not create a new Supabase project.

### Additional security review — anonymous media upload

Static review of the closed feature-branch implementation found that `AddBusiness` uploads pending images directly to the private Storage bucket using the public client before calling `submit-suggestion`. The `submit-suggestion` Edge Function rate-limits only after those objects have already been uploaded. Its `storage.objects` INSERT policy allows anonymous uploads into the `pending` folder, so an attacker can bypass the Edge Function rate limit and create many objects (each individually bounded by the bucket's 5 MB/MIME restrictions). This is a storage-abuse / cost-exhaustion risk and is a release blocker.

Required fix before release: replace unrestricted anonymous direct uploads with short-lived, narrowly scoped signed upload authorizations issued by a rate-limited server-side endpoint (or another equivalently enforced quota design). Bind authorization to the allowed `logo`/`cover` path, MIME type, max size and one-time submission token; ensure abandoned uploads expire/are cleaned up. Test that anonymous clients cannot upload without authorization and that repeated requests hit server-side limits. Do not relax the private bucket's read restrictions.

### Data API grants review — 25 November 2026

Supabase's 30 October 2026 change requires explicit grants for newly created `public` tables before the Data API can access them. The migration already grants authenticated SELECT for the admin/owner-facing tables and authenticated EXECUTE for the RPCs. Static review found the service-role Edge Functions also need access to the new media tables: `submit-suggestion` inserts/selects `business_media_assets`; `review-business-media` reads/updates `business_media_assets` and updates `business_image_change_requests`. Migration 1 was amended in commit `49569240a9d51c5922790df9ae147539487a9fb8` to grant `SELECT, INSERT, UPDATE` on `business_media_assets` and `SELECT, UPDATE` on `business_image_change_requests` to `service_role`. This is source-only; SQL remains unexecuted pending isolated staging validation.

### Legacy moderation compatibility review — 25 November 2026

Read-only production inspection found 13 existing `new_business` submissions with status `done` but `business_id IS NULL`, plus 3 still `new`. The live legacy `private.approve_submission` implementation creates the business but does not write the new business ID back to `submissions.business_id`. The Phase 2 backfill was corrected in commit `ac3b54d58f106d20eb2ce02e00decd05915cc56f` to mark all legacy `done` submissions as `approved_published`, preserve `rejected` as `rejected`, and leave other states pending; it must not infer/link existing business IDs from names or phones.

A separate UI integration issue was found: existing `ModerationManager` still includes `new_business` rows in its `All` and `New Listings` filters and calls legacy `reviewSubmission()` / `approve_submission()` for those actions. Once the migration's guard is active, this legacy approval path intentionally fails. The release must hide/route `new_business` out of the legacy moderation manager and make the new field-review queue the sole path, while preserving all other legacy submission types. Do this in the same coordinated release as the new queue and migrations.

## Phase 2 production rollout checkpoint — 25 November 2026

Owner confirmed that no new Supabase project is to be created. All Phase 2 database work is being performed in the existing Hello Sadiqabad production project only. Changes were additive; test transactions were explicitly rolled back.

### Applied database migrations
- `business_field_approval_workflow` — field review ledger, private media metadata, owner request linkage, private pending-media bucket and RLS.
- `business_field_review_rpc` — permission-checked field approval/publish RPC and compatibility with existing business insert guards.
- `business_media_review_finalize` — atomic/idempotent media review status, quota request and audit finalization.
- `owner_registration_finalize` — atomic owner-request decision, business owner linkage and audit finalization.
- `owner_claim_plan_guard` — treats owner assignment/claim timestamp as metadata so legacy Free-plan feature values do not block owner linking.
- `guard_legacy_new_business_approval` — blocks the legacy all-at-once approval path for new-business submissions; only the field-review RPC can complete them.
- `skip_logo_plan_revalidation` — isolated logo updates no longer fail because of unrelated legacy plan fields; cover/WhatsApp plan gates remain enforced.

### Deployed application and Edge Functions
- Add Business now requests rate-limited, session-bound signed upload URLs; anonymous direct INSERT into the private pending-media bucket is not allowed.
- Submission verifies the uploaded object's actual MIME and size, and the session-bound path before accepting metadata. Failed submissions can clean up only paths belonging to that upload session.
- Admin has a dedicated Business Field Review queue. Legacy ModerationManager no longer routes new-business submissions to the old approval RPC.
- Media moderation is retry-safe and checks that the business is published; cover publication requires a plan with the cover feature.
- Owner invitation uses an atomic finalizer for request status, business-owner link and audit; legacy standalone owner requests remain supported.
- Active deployed Edge Function versions: `create-business-media-upload` v1, `cleanup-business-media-upload` v1, `submit-suggestion` v8, `review-business-media` v1, `manage-owner-registration` v4.

### Verification evidence
- [GitHub CI run 45614173801](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45614173801) passed.
- Cloudflare Pages production deployment for commit `bf927cf66b38f4aa34563b6d035f84ff513f6720` succeeded with canonical alias `https://hellosadiqabad.com`.
- SQL transaction/rollback tests passed for core field approvals, Free-plan WhatsApp rejection, media finalizer idempotency, owner request approve/reject idempotency, owner-business linking, legacy approval guard, isolated logo updates, Free-plan cover rejection and rate-limit counters. All test transactions were rolled back; no test business, submission, media asset, owner request or audit record was retained.
- Current production state: 122 derived field-review rows (97 approved rows for 13 historical `done` submissions and 25 pending rows for 3 current `new` submissions); 0 media assets; 0 image-change requests; 3 existing standalone owner requests; 13 historical `done` submissions still have `business_id IS NULL`. No business is guessed or linked by name/phone.
- The new private bucket is present and has no anonymous INSERT policy. Existing business rows, users and public Storage objects were not rewritten or deleted.

### Remaining acceptance work
- Run authenticated Admin browser QA for the Business Field Review queue, media approval/rejection/unpublish and owner invitation screens.
- Run one owner-approved end-to-end test with a clearly marked disposable submission and remove only that test data afterward; do not use a real business record for testing.
- Verify email delivery/redirect in the actual owner invitation flow and confirm public listing/image rendering.
- Phase 1 remains in progress/not accepted until its separate authenticated desktop/mobile performance acceptance is evidenced.


### Latest hardening follow-up — 25 November 2026

- Added and applied `owner_image_metadata_check` migration. Owner-uploaded image-change requests now compare the declared MIME type and size with actual Supabase Storage object metadata before creating a review request.
- Add Business uploads now use session-hash-bound paths. Cleanup is rate-limited, can delete only paths belonging to that upload session, and refuses to delete media already attached to a business submission.
- Public business profiles now consume the approved `map_url`, show approved Urdu landmarks, and retain safe fallback directions. Google Maps links are restricted to exact Google-owned hosts and validated both in the browser and in `submit-suggestion`.
- Latest CI: [45615114991](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45615114991) passed. Latest Cloudflare Pages production deployment for commit `1187b47bbe24bc59b31f72c2c3e2e9a45803f1f2` succeeded at `https://hellosadiqabad.com`.
- Latest active Edge Function versions: `create-business-media-upload` v2, `cleanup-business-media-upload` v2, `submit-suggestion` v9, `review-business-media` v2, `manage-owner-registration` v5.
- Total Phase 2 migrations applied to the existing project: 9. No new Supabase project was created.


### Final validation and database-advisor follow-up — 25 November 2026

- Added and applied the ninth Phase 2 migration, `phase2_index_and_policy_cleanup`: indexes all Phase 2 foreign-key columns flagged by the advisor and consolidates the owner/admin read policies for image-change requests. Re-check confirms no unindexed-FK or duplicate-permissive-policy warnings remain for the three new Phase 2 tables.
- Added server-side validation for the seven-day opening-hours structure, optional Urdu/landmark fields, safe Google Maps hostnames and the existing two-facility limit. Add Business enforces the same two-facility limit in the UI.
- Public business profile fetch now includes `map_url`, uses only validated Google Maps URLs for directions, and displays approved Urdu landmarks.
- Latest [GitHub CI run 45616069591](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45616069591) passed both build and Edge Function checks.
- Cloudflare Pages deployment containing the application code from `a1b210633c23747b91758fa515e83b8941425080` succeeded for commit `8b778ba2dc7eb04192c5159696353f88ea44334a` with canonical alias `https://hellosadiqabad.com`.
- Latest active Edge Function versions: `create-business-media-upload` v2, `cleanup-business-media-upload` v3, `submit-suggestion` v10, `review-business-media` v3, `manage-owner-registration` v5.
- Total Phase 2 migrations applied to the existing project: **9**. No separate Supabase project was created. Test-only database writes were all rolled back; verification found no test media URLs, test submissions, test owner links or pending Storage objects.


## Admin media-review usability follow-up — 25 November 2026

- Added a clear note in the Business Field Review image queue: cover images can be published only when the business has an active Basic or Premium plan. The server-side plan check remains authoritative; no plan, media or business data was changed.
- Direct-main application commit: `498923c932cedba006ef9bf9303e93659aaf473a`.
- GitHub CI run `45623551108` passed.
- Cloudflare Pages production deployment `a749cbf3-223c-465f-9e08-3d484c208667` succeeded for the same application commit and carries canonical alias `https://hellosadiqabad.com`.
- Remaining Phase 2 acceptance is unchanged: authenticated Admin browser QA, one controlled disposable end-to-end submission, actual invitation email/redirect verification, and public listing/media rendering. No fake accounts, test submissions or emails were created/sent in this follow-up.


## Add Business taxonomy UX follow-up — 25 November 2026

## Owner image-change workflow — 25 November 2026

- Owner Listing Editor now provides logo/cover replacement requests, the combined two-change-per-business Pakistan-month allowance, and recent request statuses. Public images do not change until Admin approves the request.
- Owner uploads now use signed upload URLs. The Edge Function checks the active owner, business ownership and published status, cover plan eligibility, monthly allowance, image MIME/size and rate limits. The request RPC repeats ownership/quota checks under a row lock and validates actual Storage metadata. Cleanup can remove only the owner's own unregistered upload.
- Applied migration 10, `owner_signed_upload_only`, dropping the old direct owner INSERT policy on the private bucket. Admin SELECT remains; bucket is still private.
- Edge Function versions: `create-business-media-upload` v3, `cleanup-business-media-upload` v4, `submit-suggestion` v11, `review-business-media` v3, `manage-owner-registration` v5.
- Application commit `905065da1b4991143d1aafd010d802daddc345bc`; CI run `45625359267` passed; Pages deployment `95345747-efea-4a20-8743-26c91719efbe` succeeded with canonical alias.
- No test uploads, requests, objects, invitations or business rows were created. Browser/device QA and real invitation email delivery remain pending. Phase 2 now has 10 applied migrations.

- Added accessible, bilingual text filters above Category and Area selectors. Filtering preserves the current selection, keeps the existing taxonomy IDs/relations intact, and clears filter text when the form resets.
- The form now always explains what to do if the required category/area is missing and links to the approved Admin WhatsApp number; users are told not to select an incorrect substitute.
- Application commits: `84703741a53464d94681276ff89842848a15e944`, `58f126f392944f3598257c6e63796cdb1fc2326e`, `ea20723a0791ce79f75e696d228d8eeb9604954c`.
- CI run `45623996190` passed. Cloudflare Pages deployment `b0e31b63-826a-4987-8c18-20ed667b823b` succeeded and is attached to `https://hellosadiqabad.com`.
- No database, migration, Storage, Auth, existing listing or owner data was changed. Browser/device QA and real end-to-end submission/invitation delivery remain pending.

- Applied migration 11, `owner_image_change_rpc_plan_guard`: the database RPC independently checks published status and cover-plan eligibility. Transaction-only tests passed for logo request creation, Free-plan cover rejection and Premium-plan cover acceptance; every test rolled back and left 0 pending objects, 0 media assets and 0 image requests. Phase 2 now has 11 applied migrations.

## Add Business form completeness — 25 November 2026

- The form now has separate English/Urdu descriptions, server-side `description_ur` length validation, a public-field-only live preview, and a required bilingual consent checkbox. Owner name/Gmail are excluded from the preview.
- Searchable Category/Area controls and always-visible missing-taxonomy instructions are in place. File inputs reset after selection to support retrying the same file.
- Latest application commit `cc6c7ebcbd31ca2660cc7a470baf50bf13751008`; CI run `45625706344` passed; Cloudflare Pages deployment `9c109325-f411-44f0-8183-8d40c940ff70` succeeded.

## Public Add Business browser QA — 25 November 2026

- Playwright smoke test against production passed on mobile 390×844 and desktop 1365×900. It verified loaded Category/Area options, no first-option preselection, taxonomy search retaining selected values, preview content and owner-email privacy, required unchecked consent, logo file preview and same-file reselection, and no horizontal overflow.
- Workflow run `45627086704` passed; main CI run `45627086518` passed; Pages deployment `15c9b434-bc45-495b-814f-a00fe391cbf0` succeeded with the canonical alias.
- Remaining acceptance: authenticated Admin/Owner Portal browser QA, real owner image upload and Admin approval roundtrip, and real invitation email/redirect verification.

## Public Add Business visual UX polish — 25 November 2026

- Category and Area now use responsive bilingual search/select panels with icons, live counts, clear hints, styled native select controls and RTL-aware chevrons. Taxonomy IDs, search semantics and no-auto-select behavior are unchanged.
- Logo/Cover file inputs are now accessible card-style pickers with accepted format/5 MB guidance, selected filename and size, visible focus treatment and retry-safe reset.
- No DB, Storage, Auth or business data changed. Main commit `3e73a2d9943355d1c48370642ad8034f416571ec`; CI `45638490612` passed; production mobile/desktop Playwright smoke `45638490221` passed; Pages deployment `8969830b-3848-4951-a1dd-7b01f3fda6de` succeeded with canonical alias.
- Still pending: authenticated Admin/Owner browser acceptance, real owner image-upload-to-Admin-approval roundtrip and actual invitation email/redirect. Phase 1 Admin performance acceptance remains open.

## Phase 1 Admin performance checkpoint — 25 November 2026

- Current-main source review: Admin managers are React.lazy loaded; reload requests are gated by tab and permission; admin business list has an explicit column projection; BusinessManager/DataQualityManager render 50 items per page; DataQuality category counts are one-pass.
- Added 30-second in-memory caching for businesses, taxonomy, profiles and leads across tab switches. Global quick search shares the cache; explicit action reloads force fresh reads; failed refreshes retain last-good state and remain retryable. No local persistence or DB changes.
- Main commit `ce1b6788c3beafab864cf577c3b046beca64a49a`; CI `45639985225` passed; Cloudflare Pages deployment `81b032d7-64e1-45c1-a63c-1a46c60a8580` succeeded with canonical alias.
- Phase 1 remains open pending authenticated Admin desktop/mobile before/after timings and interaction/permission regression traces. Do not report invented performance numbers.

## Admin Business Field Review performance — 25 November 2026

- Review and media rows are fetched in parallel; private image previews use one batch `createSignedUrls` call instead of one request per image; field rows are grouped by submission once; image and submission cards are paginated at 20 per page.
- No moderation/RLS/Storage/database semantics or existing records changed.
- Main commit `6c237bf8b40bd93f9367cec0f126edf55d2e10c4`; CI `45640942909` passed; Pages deployment `0ab58777-c70e-4b76-a808-53af57e2a3f1` succeeded.

## Add Business form update — 25 November 2026

- Public Category and Area controls now use compact searchable listboxes with internal scrolling (14rem maximum height), not native full-screen select pickers.
- Public logo/cover images are resized and WebP-compressed client-side before the existing secure signed upload. Logo cap 640px; cover cap 1800px; quality 0.84 with 0.72 retry for larger outputs. Original is retained if browser encoding is unavailable or output would be larger. Existing upload authorization, 5 MB input limit, private pending bucket and cleanup flow remain in place.
- Main commit `3c2c45895d24e7ffaef8ae929b4703da456873da`; CI `45658737972` passed; Playwright mobile/desktop public form smoke `45658737929` passed; Cloudflare production deployment `db7b67c2-29a0-4f2a-bf86-fcda74fdb2e1` succeeded with canonical alias `https://hellosadiqabad.com`.
- Owner confirmed all requested Add Business manual tests passed (dropdowns and image-upload checks). No dummy production business was created.


## Government Jobs / Schemes Phase 3 checkpoint — 25 November 2026

- Added Urdu detailed content columns and Admin form inputs for job qualifications/experience/age/domicile/quota/other eligibility/application steps/fees; schemes benefits/eligibility/documents/application steps/fees.
- Added government_schemes.image_url, Admin scheme poster upload with MIME and 5 MB checks and WebP compression when smaller, public poster cards/details, bilingual public rendering, canonical share actions, social-crawler OG/Twitter metadata and offline image caching.
- Applied Supabase migrations 20261125171000_government_bilingual_poster_publication_gate and 20261125172500_government_content_bilingual_details to the existing production project. Database publication triggers require bilingual title/summary/details, official HTTPS source and poster for new publications/transitions. Invalid transaction-only test inserts were blocked and left zero test rows.
- CI 45662891896 passed; Cloudflare Pages deployment 5d601e4e-2e04-4478-bb2b-5b6bce833f6e succeeded with canonical alias.
- Existing 1 job + 5 schemes remain published and unchanged despite having no poster. Do not fabricate or unpublish; owner must approve official posters or decide whether to move legacy records to draft.
- Initial browser smoke run 45662892354 failed to locate the WhatsApp share control; corrected selectors accept Urdu/English labels and wait for loaded share controls. Corrected public browser smoke run 45663702714 passed: Add Business mobile/desktop; Government Jobs/Schemes share controls; social crawler canonical OG title/URL/HTTPS image and Twitter large-card metadata.
- Remaining Phase 3 gates: successful browser smoke; authenticated Admin UI review; official poster upload and share-preview roundtrip; resolve private-draft/public-approved image handling (scheme poster uploads currently go to the existing public bucket under Admin-only write policies; object URLs remain publicly readable).


---

## Current canonical continuation — 25 November 2026

For new work, read `docs/FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md` first, then `docs/PROJECT_WORKING_RULES.md`, `PROJECT_ROADMAP.md`, this handoff and the relevant child plans. Current `main` code and tracked migrations are authoritative for implemented behavior. Work directly on `main`; preserve existing data and security boundaries.

### Owner-approved offline Option 2

- Owner approved partial image caching: unsupported/unavailable images are counted and warned about but do not block a valid public-data offline snapshot.
- Source commits: `b4abe5a98bf303477a72f6a29f6b7b237902db14` (downloader behavior), `c51ddd6a4ae59cbf5176bed5ebd5127a25504ee1` (regression test).
- The public IndexedDB snapshot still uses its atomic generation activation. Core-data validation/fetch/save failures and cancellation must preserve the prior verified package.
- CI run `45668460310` passed TypeScript, automated tests, production build and Edge Function checks. Cloudflare Pages deployment `b162f9ca-f575-445f-aeb6-14711b7ff30c` succeeded for the feature commit. The canonical alias was subsequently confirmed on descendant deployment `3e856645-fe2b-47b6-84d8-885a6593b6a1` (commit `c181ea930802afa9186674e1be7e19aec4eff988`), which includes the feature. Current documentation-only main commit CI run `45669324532` also passed.
- Production browser test saved 748 businesses, 29 categories, 315 areas and 12 emergency contacts; 953 images cached and 235 unavailable/unsupported images were warned about without blocking the snapshot. Offline-emulation smoke at 390×844 verified homepage, categories, emergency and a business detail with `navigator.onLine=false`; no page errors.
- Physical-device airplane-mode and Service Worker update/rollback acceptance remain pending.

### Final Product Expansion master-plan sequence

- First incomplete phase: **Phase 1 — Admin Business and Data Quality performance acceptance**. Source optimizations are on main, but authenticated desktop/mobile before/after timings, interaction traces and permission/error regression evidence remain open.
- Phase 2 was owner-confirmed tested and accepted on 26 November 2026; only investigate if a regression is reported.
- Phase 3 Government Jobs/Schemes was owner-confirmed tested and accepted on 26 November 2026; do not re-request those tests unless a regression is reported.
- Continue Phases 4–7 in the exact approved sequence after their prerequisites/gates; do not mark a phase complete without evidence.


### Admin performance acceptance preparation — 25 November 2026

- Added `docs/ADMIN_PERFORMANCE_ACCEPTANCE_RUNBOOK.md` for repeatable authenticated desktop/mobile timing and regression evidence capture.
- Phase 1 remains first incomplete phase and is not accepted. The owner’s authenticated browser session is not automatically accessible from this chat; do not claim access to local Chrome or request credentials. Continue once the owner shares a screenshot/screen-share view or an accessible ChatGPT Work/Computer Use session is available.


## Current continuation — 26 November 2026

- Latest main commit reviewed: `3bb24fa1f97e21896fdf91092132aa21593eb5f6`; GitHub CI [45681595223](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45681595223) passed; Cloudflare production deployment `b6c15c02-79fc-44de-b8df-eaca3998ced6` succeeded with canonical alias `https://hellosadiqabad.com`.
- Add Business hotfix: `submitPublicSuggestion()` preserves the one-time upload-session ID used to create signed media paths; non-2xx JSON errors are surfaced; the session rotates after a successful reset. Public Add Business smoke [45681520762](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45681520762) passed. A real owner-observed submission with media is still needed to close the end-to-end acceptance gate; no disposable production submission was created.
- Production read-only counts: 4 pending `new_business` submissions, 39 pending field-review rows across 4 submissions, 2 pending media assets and 0 pending image-change requests. Earlier docs showing 3 pending submissions are historical snapshots. No existing data was deleted or edited.
- Field-review RLS read policies remain limited to Super Admin or `moderation.review`; no database, RLS, Storage, Auth or production data changes were made in this continuation.
- Image compression code is active: logo max dimension 640px; cover max dimension 1800px; WebP quality 0.84, retry 0.72 for outputs over 4 MB; original retained only if conversion is unavailable or not smaller. Failed-attempt Storage logs showed 9,064-byte logo and 34,118-byte cover temporary outputs.
- **First incomplete expansion phase remains Phase 1 — Admin Business/Data Quality performance acceptance.** The owner confirmed Businesses page and 50-row pagination work (677 total rows, 14 pages). Authenticated Data Quality smoke, cold/warm desktop measurements, mobile checks and permission/error regression evidence remain outstanding. Local Chrome is not accessible automatically from this chat; never request credentials, OTPs, cookies or access tokens. Continue all repo/CI/DB read-only work independently and ask only for the specific authenticated browser action that cannot be performed through connected tools.


### Live Add Business roundtrip — 26 November 2026

- After the upload-session hotfix, production logs show two signed upload authorization requests returned HTTP 200 and `submit-suggestion` v11 returned HTTP 200 at 2026-11-25 19:09:12 UTC.
- Read-only database check confirms one `new_business` submission with status `new` and two media assets with status `pending_review` created in the same minute. This is production evidence of the public upload+submit path, not a disposable test fixture.
- Storage metadata confirms both uploaded files are WebP: logo 9,064 bytes and cover 34,118 bytes (42.2 KiB total). Compression was applied before upload.
- Current totals: 4 pending new-business submissions, 39 pending field-review rows across 4 submissions, 2 pending media assets and 0 pending owner image-change requests. No record was reviewed, changed or deleted.
- Public form submission/compression gate is production-verified. Admin Field Review visual click-through, media approval and public rendering, plus owner invitation email/redirect remain pending. Phase 1 performance acceptance is still first incomplete.


## New canonical continuation — SDK Jobs Phase 4 — 26 November 2026

- Owner explicitly confirmed all testing through master workstream 4.3 (Government Jobs and Government Schemes) is complete and working. Record master workstreams 4.1–4.3 and implementation Phases 1–3 as owner-accepted. Do not ask the owner to repeat those tests; investigate only if a regression is reported.
- Next approved workstream: **4.4 SDK Jobs — local private-sector jobs and Admin referral service**, starting with Phase 4 (data, moderation and public board). Phase 5 candidate/recruitment operations follows later; Phase 6 Gov landing/mobile navigation comes after Phases 4–5.
- New audit/design: `docs/SDK_JOBS_PHASE4_DATA_MODEL_SECURITY_DESIGN.md`. The current repo/live schema has no SDK Jobs table, route, owner job form, Admin manager or Edge Function. Government Jobs is a separate existing feature and must not be reused as the SDK Jobs backend.
- Owner eligibility must be enforced server-side: authenticated active profile with `role='owner'` and a selected published business where `businesses.owner_id=auth.uid()`.
- New Admin permission is `sdk_jobs.manage`; wire it explicitly through TypeScript permission keys, staff permission editor, Admin nav/tab, `public.my_permissions()` and RLS/server checks. No automatic grants via broad staff types.
- Keep employer/business linkage private. Public clients must use a strict published-only projection that excludes owner/business IDs and contacts, Admin notes, private media paths and all future candidate data. Base `sdk_jobs` table must not be publicly selectable.
- Live migration ledger inspected: 108 applied versions; do not replay baseline. Candidate personal data must not be collected until Phase 5 defines consent, retention/deletion, and access controls.
- Phase 4 audit/design and the first additive database foundation are complete. Live migration versions `20261125210353` (SDK Jobs tables, owner guard, Admin notes/history, permission RPC) and `20261125210439` (security-invoker public projection with safe column grants) plus `20261125210610` (consolidated RLS and FK indexes) are applied; live ledger is 111 versions. Owner submission simulation passed inside a rolled-back transaction; live SDK job/history/note counts are all zero. Security advisor no longer flags a SECURITY DEFINER view, and performance advisor has no SDK Jobs unindexed-FK or multiple-permissive-policy findings. Next: owner submission UI + signed private media, then Admin moderation UI and public listing/detail/search/share pages. No existing business/owner/submission data was changed.
- User-facing communication remains concise Roman Urdu; work directly on `main`; no branches/PRs; preserve all existing data and security boundaries.


### SDK Jobs Phase 4 latest verified checkpoint — 26 November 2026

- Current approved sequence: owner confirmed workstreams 4.1–4.3 and Phases 1–3 fully tested/accepted. Next is 4.4 SDK Jobs; do not re-request prior tests unless regression reported.
- Three SDK Jobs migrations are applied and recorded: `20261125210353_sdk_jobs_phase4_foundation`, `20261125210439_sdk_jobs_public_view_invoker`, `20261125210610_sdk_jobs_rls_and_fk_index_cleanup`. Live migration ledger now 111 versions.
- Live schema has `sdk_jobs`, `sdk_job_status_history`, `sdk_job_admin_notes`, `sdk_jobs_public`; owner eligibility is enforced against active owner profile + own published business. `sdk_jobs.manage` is wired into DB permission RPC, TypeScript `PermissionKey` and explicit staff permission editor. Admin nav/tab and moderation UI are not yet built.
- Transactional owner submission test forced auth owner ID and `pending_review`; pending job was not public. Cross-owner business submission was denied; status history trigger verified. All tests rolled back; live counts are 0 jobs, 0 status-history rows and 0 Admin notes.
- Public view is `security_invoker=true`; anon has no table-level SELECT or private-column grants on the base table. Security advisor no longer reports a SECURITY DEFINER view; performance advisor no longer reports SDK Jobs unindexed FKs or multiple permissive policies.
- CI [45702011116](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45702011116) passed build and Edge Function jobs. Cloudflare Pages deployment `3d3bf1ec-2f80-4695-886e-75aaf2b528cb` succeeded for commit `12b9599f24765105972715681501ee5447d664eb` with canonical alias `https://hellosadiqabad.com`.
- Next: build owner vacancy form and signed private media upload, then permission-gated Admin moderation and published-only public listing/detail/search/filter/share routes. Candidate intake/PII remains Phase 5, not Phase 4. No existing business/owner/submission data was changed.


## Latest SDK Jobs status — 26 November 2026

- Database foundation, poster lifecycle and Owner-visible feedback migrations are live; migration ledger now 113 versions. Existing private `hs-pending-business-media` bucket reused with no bucket limit changes.
- Owner Portal poster upload UI, Admin private poster preview/approve/reject UI, and server-side publication privacy gate are committed. Edge Functions `create-sdk-job-poster-upload`, `review-sdk-job-poster`, and `publish-sdk-job` are deployed with JWT verification required.
- Public `/sdk-jobs` and `/sdk-jobs/:slug` routes, filters, privacy-safe metadata, Admin WhatsApp CTA, approved office-hours instruction, navigation and sitemap integration are committed.
- Rolled-back DB tests passed for Owner submission/path attachment, pending content mutation denial, cross-job path denial and anon employer-ID denial. No live SDK Jobs rows were created; live job/history/note counts remain zero.
- Final CI run [45711210914](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45711210914) passed both build and Edge Function jobs. Owner correction feedback/resubmission UI and tests are included.
- Not production-released: real authenticated Owner upload + Admin preview/approve/publish browser acceptance, final linked Owner/business display labels, production Pages deploy and public route/sitemap smoke tests remain open.
- Do not add candidate CV/intake/referral/fee/office-hour settings in Phase 4. Those remain Phase 5.



## Latest continuation note — SDK Jobs social preview and Owner correction loop (26 November 2026)

- Live SDK Jobs migration ledger is now 113 versions, including poster lifecycle migration `20261125220215` and Owner feedback migration `20261125221201`.
- Owner feedback is separate from private Admin notes; Admin must provide a reason for correction/rejection; Owner sees it and can edit/resubmit draft/changes-requested jobs. DB clears feedback on resubmission. Published-job edit UI remains disabled pending version preservation.
- Cloudflare Pages social preview functions now exist for SDK Jobs list/detail. Detail crawler metadata reads only the public published projection; no private owner/business fields. Node tests cover metadata privacy and noindex behavior.
- CI was updated to syntax-check both SDK Jobs Pages Functions and run their Node tests. Latest run [45711961724](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45711961724) is queued/pending; recheck before claiming final CI success.
- No live jobs/history/notes rows were created; current counts are all zero. Four active eligible Owner-to-published-business links exist.
- Do not deploy Pages until latest CI and authenticated Owner/Admin browser acceptance pass. No passwords, OTPs or cookies should be requested/shared; use a user-controlled authenticated browser session or screenshots.



## Next approved work — SDK Jobs Phase 5

- Read `docs/SDK_JOBS_PHASE5_PRIVACY_SECURITY_DESIGN.md` before any Phase 5 implementation.
- Design is read-only only. No candidate PII, CV upload, fee ledger, referral records, database migration or UI has been created.
- Ask the owner to approve the retention/deletion periods, consent notice and recording method, staff permission matrix, fee amount/payment method, and referral-letter/public verification fields before collection.
- Do not use candidate production data for testing. Prepare rollback/adversarial tests and verify current migration ledger/RLS before any future schema change.


## Owner correction — retain News in mobile navigation (26 November 2026)

- Owner pointed out that the News button must remain in the mobile bottom navigation, as in the earlier navigation design.
- Updated `src/components/layout/AppBottomNav.tsx`: six items in order Home, Search, News, Gov, SDK Jobs, Saved. News links to the existing `/news` route and reuses the existing `nav.news` bilingual label and Newspaper icon. Grid now uses six columns.
- This is a narrow navigation-only correction; no News page/content, database or permissions changed. New CI and Pages deployment are required; do not claim production release until both are verified.
