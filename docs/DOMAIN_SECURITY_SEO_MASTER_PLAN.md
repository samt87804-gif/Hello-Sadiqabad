# Hello Sadiqabad — Domain, Security & SEO Master Plan

Last updated: 19 November 2026 — Phase 0 security verification, Phase 1 technical SEO, and public News/Authority social sharing deployed  
Canonical website: https://hellosadiqabad.com  
Repository: https://github.com/samt87804-gif/Hello-Sadiqabad  
Production: Cloudflare Pages project `hello-sadiqabad`, branch `main`  
Database/Auth: Supabase project `efwohfzqitevkuybnyif`

## Purpose and operating rules

This is the single source of truth for the domain-hardening and SEO work that follows. Execute one phase at a time, in order. The assistant owns implementation, code, DNS/Cloudflare changes, Supabase changes that are supported and safe, tests, deployments and evidence. The site owner completes Google account/dashboard actions and supplies verification tokens or screenshots/results.

- Inspect current repository, live configuration, schema, RLS and migrations before each change.
- Preserve all existing business and user data. No destructive DB operations without explicit approval.
- Never expose Supabase service-role/secret credentials in browser code, GitHub or chat.
- Do not invent pages, listings, contact details, structured-data facts, backlinks or rankings.
- Mark an item complete only after implementation and the relevant verification evidence.
- Distinguish coded, built, deployed, externally verified and user-confirmed states.
- Google indexing and ranking are not guaranteed. Never buy searches, clicks, reviews or links.
- Work directly on `main` as previously requested; check CI and Pages deployment after commits.
- Keep this plan and the handoff document current.



### Mandatory execution rules (owner-confirmed 17 November 2026)
1. **Direct main only:** commit approved implementation changes directly to GitHub `main`. Do not create feature branches or Pull Requests unless the owner explicitly changes this rule. (The earlier homepage collaboration PR #12 was already merged before this rule was reaffirmed.)
2. **Inspect before every change:** inspect current files, routes/data flows, deployment settings, database schema, RLS policies and migrations before editing or configuring anything.
3. **No collateral changes:** keep each change narrowly scoped; preserve existing UI, business workflows, accounts, records, storage objects, auth behavior and integrations. Avoid opportunistic refactors.
4. **Data protection:** never delete, truncate, bulk-replace, re-seed over, or mutate existing business/user data. No destructive database operation without explicit owner approval. Prefer additive, reversible changes.
5. **Security boundaries:** never disable or bypass RLS, auth, permissions, moderation or server-side validation to make a feature work. Never expose service-role/secret keys.
6. **Evidence-based completion:** run relevant automated tests, typecheck and production build; inspect CI and Pages deployment; verify affected production endpoints/settings where network access permits. Record checks that could not be performed as pending, with the reason.
7. **Documentation discipline:** update this master plan, handoff and application roadmap when relevant. Mark items complete only when evidence supports that status; distinguish implemented, CI-passed, deployed, endpoint-verified and owner-confirmed.
8. **Owner-only actions:** do all technical work that connected tools and repository access permit. Ask the owner only for actions requiring their Google/Supabase dashboard, private account interaction, real-world factual confirmation or explicit approval. Give step-by-step instructions with exact menu paths, values and expected success result.
9. **Concise Roman Urdu updates:** report changes, tests, deployment evidence, blockers and the owner's next action. Never claim browser testing unless an actual browser test was performed.
10. **Phase discipline:** complete and verify the current phase before marking it accepted or moving to the next phase. Do not silently skip blockers; document plan/permission limitations.

## Verified baseline — 17 November 2026

### Completed and verified
- [x] Cloudflare Pages custom domain `hellosadiqabad.com` is active and certificate validation is active.
- [x] Cloudflare SSL mode is `Full`.
- [x] Cloudflare Always Use HTTPS is ON.
- [x] Cloudflare minimum TLS version is 1.2.
- [x] Cloudflare Automatic HTTPS Rewrites, HTTP/3 and Brotli are ON.
- [x] Cloudflare Pages production `VITE_SITE_URL` is `https://hellosadiqabad.com`; other existing production variables were preserved.
- [x] Cloudflare production deployment for commit `a061a78018133d14da17a0ecaf8505537e4e024e` completed successfully.
- [x] `public/_headers` now includes HSTS (max-age 1 year), CSP, nosniff, SAMEORIGIN, strict-origin referrer policy and restricted Permissions-Policy.
- [x] Supabase view `public.owner_public_profile_directory` uses `security_invoker=true` and `security_barrier=true`. A safe additive migration adds generated, redacted public columns, grants anon access only to those columns, and adds an anon RLS policy. Verified anon can read the public view while raw phone/email columns and table-level SELECT remain unavailable. No SECURITY DEFINER view or RLS bypass is used.
- [x] Supabase missing FK index on `owner_public_profiles.updated_by` added through an additive migration; no rows or policies changed.
- [x] Public owner registration flow reviewed: public form creates a pending request only; Admin approval triggers the server-side invite flow. No direct `auth.signUp` call exists in the frontend; sign-in requires an active role/profile. Two existing Auth users have matching profiles; no orphan Auth users were found.
- [x] Supabase Health Advisor returned no findings; Security Advisor now reports only the Free-plan leaked-password-protection warning.

### Still open / not yet completed
- [x] Owner confirmed Supabase Auth Site URL and all three canonical allowed redirect URLs were saved in the dashboard (17 November 2026).
- [ ] Supabase leaked-password protection remains disabled. Connected organization is confirmed on the Free plan; this feature is plan-gated and cannot be enabled on the current subscription. Do not change plans automatically; revisit only if the owner independently elects to upgrade.
- [x] Owner created the Google Search Console Domain property for `hellosadiqabad.com` and confirmed successful DNS TXT verification (17 November 2026). The verification TXT record remains in Cloudflare DNS.
- [x] `www.hellosadiqabad.com` is intentionally unsupported. Pages custom-domain list contains only the active apex domain; no www DNS record was added.
- [x] Dynamic `/sitemap.xml` Pages Function is deployed. Browser-rendered production response is HTTP 200, `application/xml`, 516 unique canonical URLs, zero duplicates, zero wrong hosts and no private/admin routes. Current data: 223 published businesses, 263 active areas, 14 active categories, one published news article plus its listing, and eight published static pages. Public owner profiles are included only through the redacted public view when opted in; currently there are zero.
- [ ] No claim is made that Google has indexed the site or that rankings have improved.
- [x] Targeted live browser tests performed for homepage, collaboration credit/banner, sitemap, robots.txt, search noindex, news article metadata/NewsArticle schema, business LocalBusiness/BreadcrumbList schema, category breadcrumbs, and HTTPS upgrade. A full external security scanner and full-site SEO crawl have not been performed.

## Phase 0 — Finish domain and account security

### Assistant implementation
- [x] Cloudflare HTTPS/TLS/canonical Pages env settings above.
- [x] Security headers deployed.
- [x] Supabase public-profile view security fix deployed to database.
- [x] Cloudflare Always Use HTTPS is ON and TLS 1.2 is configured. Browser-rendered HTTP homepage ended at the canonical HTTPS URL; the browser marked the 307 as an internal `HttpsUpgrades` navigation, so the exact origin-generated redirect status is not claimed. HTTPS response headers were inspected in the live browser.
- [x] Keep `www.hellosadiqabad.com` intentionally unsupported for now; only the canonical apex hostname is connected to Pages and present in DNS. Do not add a second indexable hostname unless the owner explicitly requests www support.
- [x] Reviewed CSP against the app's actual integrations (Supabase, OpenStreetMap, YouTube/Vimeo embeds, Google Fonts and Cloudflare Web Analytics). Added `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`, and Cloudflare Insights script/connect hosts. Live response header inspected.
- [x] Reviewed the current zone DNS listing: apex proxied CNAME to the Pages project and owner-verified Google TXT record are present; no other records appeared in the returned listing. No records were deleted.
- [x] Cloudflare managed WAF and Layer 7 DDoS protections reviewed. Added and verified one narrow zone rate-limit rule for POST `/api/chat`: 30 requests per 10 seconds per source IP/data-centre, temporary 10-second block, JSON 429 response. Other site routes are not covered by this rule.
- [x] Re-reviewed Supabase Security, Performance and Health Advisors and public RLS state. Security Advisor reports only leaked-password protection disabled; Health Advisor is clean. The missing `owner_public_profiles.updated_by` FK index is now added. Performance Advisor still reports 26 unused-index INFO notices and two multiple-permissive-policy WARN notices; no unused indexes or policies were removed because query/policy semantics have not justified removal. All inspected public base tables retain RLS.
- [x] Verified application-level signup/account provisioning: the public owner form only submits a pending request, Admin approval sends the invitation server-side, and frontend contains no direct `auth.signUp` call. The provider-level global signup toggle is not exposed by the connected API, so its dashboard state is not claimed.
- [x] Owner confirmed Supabase Auth Site URL and allowed redirects saved; no further redirect change needed.

### Owner actions
1. Supabase Auth Site URL and all three canonical redirect URLs are already saved and owner-confirmed. Do not repeat this task.
2. Leaked Password Protection is unavailable on the connected Free plan. No action is required unless the owner independently chooses to upgrade; never share credentials.
3. Google Search Console Domain property `hellosadiqabad.com` is verified. The matching TXT record is already in Cloudflare DNS; do not add a duplicate or remove it.
4. Submit the deployed sitemap in Search Console → Sitemaps using `https://hellosadiqabad.com/sitemap.xml`.
5. After Google accepts the sitemap, use URL Inspection on the homepage and selected important business/category/area/news pages, then request indexing once per URL.
6. Share Search Console reports and verified local-business corrections when available. Never share passwords or private keys.
7. The app's owner registration is Admin-approved at application level. The global Supabase Email-provider signup toggle is not readable through the connected API; no change is requested now because there is no public `auth.signUp` flow and unapproved users cannot access a role-protected portal.

### Phase 0 acceptance
- Cloudflare Always Use HTTPS is ON; browser-rendered HTTP navigation ends on the canonical HTTPS origin. Exact server redirect status remains unclaimed because Chromium reported an internal HTTPS upgrade.
- Production HTTPS headers and CSP were inspected in the live browser; homepage, sitemap and robots responses load.
- Supabase Auth URL/redirect settings are owner-confirmed.
- Security Advisor has only the plan-limited leaked-password warning; the Free-plan limitation is documented, with no automatic upgrade.
- Application-level owner signup remains Admin-approved; RLS and the redacted public profile view are verified without SECURITY DEFINER or RLS bypass.
- Cloudflare managed protections and the narrow chat rate-limit rule are active.
- www is intentionally unsupported; apex remains canonical.

## Phase 1 — Technical SEO foundation

### Assistant implementation
- [x] Inspect public routes, route parameters, client-rendering model, page SEO helper and canonical generation.
- [x] Create dynamic `/sitemap.xml` Pages Function using the public Supabase publishable key and existing anon/RLS rules; live browser response is valid XML with 516 unique canonical URLs.
- [x] Include 223 published businesses, 263 active areas, 14 active categories, published news, published static pages, active directory list pages, active authority profiles and opted-in owner profiles via the redacted public view only.
- [x] Sitemap excludes Admin/Owner portals, auth/reset routes, drafts, private/inactive rows, search query URLs and error routes. No private owner base table is queried.
- [x] `robots.txt` includes `Sitemap: https://hellosadiqabad.com/sitemap.xml`; live response is HTTP 200 text/plain.
- [x] Improve page metadata helper; homepage, category, area, business, news, authority and static pages use page-specific titles/descriptions. Static-page descriptions derive from published body text.
- [x] Canonical links and `og:url` use the canonical apex domain; live browser spot-check passed for home, news, business and category routes.
- [x] Add page-specific Open Graph/Twitter title, description, URL, image and card metadata; business/news cover images are used when present, with site logo fallback.
- [x] Add Organization/WebSite on homepage, NewsArticle on published article, LocalBusiness plus BreadcrumbList on business profiles, and BreadcrumbList on category/area pages. Live browser JSON-LD spot-checks passed.
- [x] Add `noindex,follow` for search, favorites, add-business, auth, Admin/Owner and unknown routes; search noindex was browser-tested. Authentication/RLS remains the actual access control.
- [x] Core public image-alt audit completed: business/category/area/authority/emergency/offer/home images have descriptive alt text; decorative icons remain empty-alt; News cover, gallery and listing images now use article-title-based alt text.
- [x] Visible breadcrumbs exist on category and area pages; business pages now link Home → category → business; News articles link back to the News listing.
- [x] Added semantic primary H1 headings to homepage, category index, city map, offers and announcements pages; shared SectionHeading supports explicit H1/H2 semantics.
- [ ] Full route-by-route heading hierarchy and remaining internal-link audit remains to be completed.
- [x] Targeted live browser validation: sitemap 200/516 unique URLs/no private URLs; robots 200; search noindex; canonical and JSON-LD spot-checks on home, news, business and category; mobile viewport business breadcrumb (390×844); News image alt text. Semantic H1 code changes for five primary public routes passed CI and deployed; follow-up browser check was rate-limited and remains pending. Full-site crawl and Google Rich Results Test remain pending.
- [x] GitHub CI (npm ci, dependency advisory gate, TypeScript, automated tests, production build and Edge Function typecheck) passed; Cloudflare Pages deployment `0b25073c-b7f2-4600-a8b4-0fe7fa3583a7` for commit `2d966202510c4d63d668780ce84a2e4237af6287` succeeded.

### Owner actions
- [x] Create Google Search Console Domain property for `hellosadiqabad.com`; owner confirmed verification succeeded.
- [x] DNS TXT record is present in Cloudflare and verification succeeded; do not duplicate or remove it.
- [x] Owner submitted `https://hellosadiqabad.com/sitemap.xml` in Search Console → Sitemaps (17 November 2026); Google reports successful submission and says it will process periodically. Processing/indexing is not yet confirmed.
- [x] Owner confirmed URL Inspection and Request Indexing submissions for the homepage and six priority URLs: `/categories`, `/emergency`, `/map`, `/news`, `/offers`, `/announcements` (17 November 2026). Google crawl-queue submission is not proof of indexing; inspect Page Indexing/URL Inspection results when processing data becomes available.

### Phase 1 acceptance
- [x] Sitemap returns valid XML and contains only canonical, indexable public URLs (516 currently; zero duplicates/private URLs).
- [x] robots.txt points to the sitemap.
- [x] Canonicals and metadata are unique for the tested public page types; full-site crawl remains pending.
- [x] JSON-LD is valid JSON and rendered correctly for the tested Organization/WebSite, NewsArticle, LocalBusiness and BreadcrumbList pages.
- [ ] External Google Rich Results/Schema validation has not yet been run.
- [x] Search Console Domain property is verified.
- [x] Sitemap submission completed by owner; Google processing is pending and acceptance/index coverage are not yet confirmed.
- [x] No admin/private data is exposed by the sitemap or the redacted public owner-profile view.

## Phase 2 — Local SEO for Sadiqabad

### Assistant implementation
- [ ] Audit category, area and business data quality, duplicates, thin records and missing fields.
- [ ] Create useful, genuinely distinct category and area landing pages where enough unique listings/content exist.
- [ ] Optimize individual business profile titles/descriptions and LocalBusiness fields using verified business data only.
- [ ] Improve internal linking between area pages, categories and relevant businesses.
- [ ] Add accurate NAP (name/address/phone) display consistency; do not fabricate missing data.
- [ ] Add location context naturally: Sadiqabad, Rahim Yar Khan District, Punjab, Pakistan where accurate.
- [ ] Create a local business owner onboarding/claim guide and profile completeness guidance.
- [ ] Review duplicate/near-duplicate page handling and canonical/noindex policy.

### Owner actions
- [ ] Claim/verify the official Google Business Profile for Hello Sadiqabad only if it meets Google's eligibility rules as a real organization with an eligible presence; do not create a fake storefront.
- [ ] Encourage each listed business owner to manage their own eligible Google Business Profile and keep their business name/address/phone accurate.
- [ ] Share official website pages through genuine local community channels; no paid/fake clicks or reviews.
- [ ] Ask real customers for honest reviews of the actual business, not fabricated reviews for the directory.

## Phase 3 — Content strategy and useful local pages

### Assistant implementation
- [ ] Build a keyword/topic map based on real search intent and available directory data.
- [ ] Prioritize useful topics such as restaurants, doctors, clinics, pharmacies, schools, markets, repair services, government helplines and local guides only where accurate information exists.
- [ ] Publish original English, Urdu and/or Roman Urdu content as useful to local visitors; avoid machine-generated doorway pages.
- [ ] Add author/source/last-verified context to civic and factual content.
- [ ] Add FAQ sections only when they answer real recurring questions.
- [ ] Avoid thin location pages generated only by swapping area names.

### Owner actions
- [ ] Supply verified local knowledge, official sources, business corrections and photos/permission to publish.
- [ ] Invite local businesses to claim and maintain their listing.
- [ ] Share useful articles/pages with relevant local groups without spam.

## Phase 4 — Authority, trust and reputation

### Assistant implementation
- [ ] Audit inbound links and brand mentions when reliable tools/data are available.
- [ ] Prepare a genuine local outreach list: chambers, associations, schools, community organizations and official sources.
- [ ] Add clear About, Contact, privacy and editorial/source policies where missing.
- [ ] Improve content freshness and verification timestamps for civic records.
- [ ] Monitor spam, fake listings, impersonation and review abuse.

### Owner actions
- [ ] Build genuine partnerships and request relevant links/mentions from organizations that actually work with the directory.
- [ ] Encourage real business owners to link their verified Hello Sadiqabad profile from their own website/social pages.
- [ ] Do not buy backlinks, reviews, traffic or search clicks.

## Phase 5 — Measurement and continuous improvement

### Assistant implementation
- [ ] Review Search Console queries, clicks, impressions, CTR, indexing, page experience and crawl errors when owner shares access/export/screenshots or a supported connector is connected.
- [ ] Fix high-impact indexing/canonical/content issues first.
- [ ] Monitor Core Web Vitals and mobile performance.
- [ ] Maintain a monthly SEO change log and compare trends over time.
- [ ] Update priorities based on evidence, not ranking guesses.

### Owner actions
- [ ] Share Search Console Performance and Page Indexing reports periodically.
- [ ] Confirm business information changes and source material.
- [ ] Keep official social/business information current.

## Ranking expectations and prohibited shortcuts

- There is no required number of people who should Google the site. Artificial searches, repeated clicks, bots, purchased traffic and fake reviews do not create a legitimate ranking strategy and can cause harm.
- Search Console indexing requests and sitemap submission help discovery; they do not guarantee indexing or ranking.
- Ranking depends on relevance, quality, local prominence, competition, site quality and time. No fixed top-position promise or guaranteed timeline is valid.
- Measure real organic impressions/clicks and qualified local visits, not vanity search counts.

## Current next action

Phase 0 technical work is implemented and verified, with leaked-password protection documented as a Free-plan limitation. Phase 1 foundation (dynamic sitemap, robots, canonical/meta, structured data, noindex and chat rate limit) is deployed; owner submitted the sitemap on 17 November 2026 and Google says it will process periodically. Assistant continues full-site internal-link, heading, image-alt, structured-data and content SEO audits. Owner confirmed URL Inspection and Request Indexing submissions for homepage and six priority public URLs on 17 November 2026. Assistant now continues full-site internal-link, heading, image-alt, structured-data and local data-quality audits. Owner can later share sitemap processing and Page Indexing/URL Inspection outcomes when Google has processed the requests. Do not claim Google indexing until Search Console reports it.


## Keyword visibility and favicon correction — 17 November 2026

- Owner reports that branded search for “Hello Sadiqabad” is now surfacing the site prominently, while broader local service/category searches are not yet producing visible results. This is an owner observation, not proof of full index coverage or ranking position.
- Homepage title/description now target the actual local intent (“Sadiqabad Business Directory”, shops, doctors, hospitals, pharmacies, restaurants, local services and emergency helplines). Replaced the screen-reader-only homepage H1 with a visible bilingual H1 and supporting sentence. Category index title/description now name common local service intents. Existing category/area detail pages already include category/area names plus Sadiqabad in their titles.
- Reused the owner-supplied square logo from Supabase Storage and created same-domain image assets `/favicon.png` (192×192) and `/site-logo.png` (512×512). This avoids depending on the external Storage response, which returned `X-Robots-Tag: none` when checked. Updated favicon, Apple touch icon, PWA manifest, Open Graph/Twitter image defaults and homepage Organization logo to use domain-hosted assets.
- Google ranking for generic keywords is not guaranteed by metadata changes. Continue publishing useful, accurate visible content on relevant category/area pages, ensure those pages have internal links and enough unique public listings, and review Search Console Performance + Pages reports after Google recrawls. Do not add a meta-keywords tag; Google does not use it for ranking.
- [x] CI run 44072068947 passed for commit `f3677727c1f4341b6812358fa07fafb4b982aeab`; Cloudflare Pages deployment `6202c970-d2b1-406e-a991-e5b5e736f88c` succeeded on production.
- [x] Live custom-domain browser verification: homepage HTTP 200, updated title/canonical/description, visible bilingual H1, local favicon + Apple touch icon links, Open Graph/Twitter logo URL, and Organization JSON-LD logo all point to the domain-hosted asset.
- [x] `/favicon.png` returned HTTP 200 `image/png` at 192×192; `/site-logo.png` returned HTTP 200 `image/png` at 512×512. `/manifest.webmanifest` returned HTTP 200 `application/manifest+json` and lists both same-domain icons.
- [ ] Owner should re-submit homepage URL Inspection / Request Indexing in Search Console so Google can refresh the homepage favicon and updated snippets. Search Console crawl/index coverage and actual keyword positions remain pending; crawl submission is not indexing confirmation.


## Search Console rejection re-audit — 17 November 2026

- [x] Live production `https://hellosadiqabad.com/` returned HTTP 200 to Cloudflare Browser Rendering using the documented Google-InspectionTool smartphone user-agent string; the rendered page contained the visible Sadiqabad Business Directory H1, `index,follow` robots meta, and self-referencing apex canonical.
- [x] `/robots.txt` returned HTTP 200 with `User-agent: *` / `Allow: /` and the canonical sitemap URL.
- [x] `/sitemap.xml` returned HTTP 200 with `application/xml` and a valid sitemap URL set.
- [x] `/offers` and `/announcements` were rendered with `noindex,follow` while their active datasets are empty. This is intentional; do not remove noindex or request indexing until those pages contain real active content.
- [x] Confirmed `www.hellosadiqabad.com` remains intentionally unsupported; only `https://hellosadiqabad.com/` is the canonical homepage. Use the apex URL in Search Console.
- [ ] Search Console's exact rejected URL and detailed Live Test fields have not been supplied. Do not change Cloudflare security controls or remove intentional noindex directives without the URL and the specific failing field. Browser Rendering with a matching user-agent is a useful spot-check, not proof that Google's own fetch from Google's infrastructure succeeded.


## Public content sharing and social preview cards — 19 November 2026

### Implemented
- [x] Add reusable public sharing actions to individual News articles and Authority Profiles: WhatsApp, Facebook, copy-link, and the device's native share sheet where supported. The share actions use each record's canonical detail URL.
- [x] Add crawler-facing Cloudflare Pages Functions for /news/:slug and /authority-profiles/:slug. They return page-specific HTML metadata to recognized social/search crawlers while ordinary visitors continue through the existing application route.
- [x] News preview image selection uses the published article's cover image, then its first gallery image, then the existing same-domain site logo fallback.
- [x] Authority preview image selection uses the active profile's own photo_url, then the existing same-domain site logo fallback.
- [x] Crawler HTML includes page title, description, canonical URL, Open Graph title/description/type/site name/url/image/image-alt and Twitter large-image card metadata. News publication time is included when present.
- [x] Metadata lookups use the existing Supabase publishable/anon key and public read policies; News lookup is restricted to published and already-published articles, Authority lookup to active profiles. No schema, RLS, storage policy, existing content, or private data was changed.
- [x] Authority crawler description now falls back to Urdu authority text when English authority text is empty.

### Production verification — 19 November 2026
- [x] GitHub main implementation commits: reusable sharing actions 3e1407c4fbd0b79efa00b9acb50601be024d37ad; News sharing 8207342ad7594469616bf0b0d5307b23fd8f2609; Authority sharing/photo metadata 07895a64f11eeace24b8e95491a064e4ac6792bc; crawler HTML and metadata corrections 92a4575603782add5d789151ab20526c9515b52e, 0d439e4195112acd9f487ad1806dc52aceeed880, 086b571caaaecf33c2322ec29c0b14e3bfb7eda1, 835966f41ddc4344a5ee79b3992f86cff653ca81; Urdu fallback 3360b77aa8ec8c10c9c5b55b65c2000458dda3b9.
- [x] Latest feature-code Pages deployment 891d235d-b897-4207-b4fc-008dcdcf9229 for commit 3360b77aa8ec8c10c9c5b55b65c2000458dda3b9: all queued, initialize, clone, build and deploy stages succeeded.
- [x] Live Cloudflare Browser Rendering checks with WhatsApp and Facebook crawler user-agent strings returned HTTP 200 and the correct page-specific title, description, canonical URL and image metadata for /news/sadiqabad-ki-pehli-phone-directory and /authority-profiles/farhan-iqbal. News used its article cover image; Farhan Iqbal's profile used its own WebP portrait URL. The latest deployed Urdu-fallback commit was rechecked against the Authority route with the WhatsApp user agent and returned the same correct profile metadata.
- [ ] Actual WhatsApp app/device share-preview and Facebook Sharing Debugger checks remain pending. Social platforms may cache previous previews; their own cache refresh/debugger may be needed after content changes.
- [x] Live Browser Rendering of the normal visitor pages confirmed WhatsApp, Facebook and Copy link controls render on both the News article and Authority profile detail pages. The Authority profile was initially held behind an optional related-business data fetch; that fetch is now independent so the profile and share actions render without waiting for the full linked directory dataset. Latest Pages deployment `e69db7ef-2085-4a61-bbb1-a2607f6d35b5` for commit `2ef92af403aaffea845948ebae1320559bdd5769` succeeded; the Authority page was rechecked after deployment (HTTP 200, profile image and all three share controls present). Physical-device interaction remains pending. The GitHub combined-status endpoint returned no status checks for the feature commit; do not describe this as a separate GitHub Actions CI pass.
