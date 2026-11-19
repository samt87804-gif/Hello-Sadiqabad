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

**Next chatbot phase (not started):** Admin-only “Train / Sync Latest Information to Chatbot” control with safe full/incremental refresh, authorization, progress, last-sync status and error reporting. Do not claim that a persistent vector index or model fine-tuning exists.