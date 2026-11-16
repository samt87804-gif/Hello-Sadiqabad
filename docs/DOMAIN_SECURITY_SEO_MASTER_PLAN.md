# Hello Sadiqabad — Domain, Security & SEO Master Plan

Last updated: 17 November 2026  
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

## Verified baseline — 16 November 2026

### Completed and verified
- [x] Cloudflare Pages custom domain `hellosadiqabad.com` is active and certificate validation is active.
- [x] Cloudflare SSL mode is `Full`.
- [x] Cloudflare Always Use HTTPS is ON.
- [x] Cloudflare minimum TLS version is 1.2.
- [x] Cloudflare Automatic HTTPS Rewrites, HTTP/3 and Brotli are ON.
- [x] Cloudflare Pages production `VITE_SITE_URL` is `https://hellosadiqabad.com`; other existing production variables were preserved.
- [x] Cloudflare production deployment for commit `a061a78018133d14da17a0ecaf8505537e4e024e` completed successfully.
- [x] `public/_headers` now includes HSTS (max-age 1 year), CSP, nosniff, SAMEORIGIN, strict-origin referrer policy and restricted Permissions-Policy.
- [x] Supabase view `public.owner_public_profile_directory` was changed to `security_invoker=true` and verified in `pg_class.reloptions`; Supabase Security Advisor no longer reports its SECURITY DEFINER finding.
- [x] Supabase health advisor returned no findings at the time of check.

### Still open / not yet completed
- [x] Owner confirmed Supabase Auth Site URL and all three canonical allowed redirect URLs were saved in the dashboard (17 November 2026).
- [ ] Supabase leaked-password protection remains disabled. Connected organization is confirmed on the Free plan; this feature is plan-gated and cannot be enabled on the current subscription. Do not change plans automatically; revisit only if the owner independently elects to upgrade.
- [x] Owner created the Google Search Console Domain property for `hellosadiqabad.com` and confirmed successful DNS TXT verification (17 November 2026). The verification TXT record remains in Cloudflare DNS.
- [ ] `www.hellosadiqabad.com` is not currently connected as a Pages custom domain; it returned Pages domain-not-found at audit time. Decide whether to support www and redirect it to apex.
- [ ] No sitemap exists in the current `main` tree; `public/sitemap.xml` is absent. Build a dynamic, accurate sitemap in Phase 1.
- [ ] No claim is made that Google has indexed the site or that rankings have improved.
- [ ] A full live browser security test, external scanner assessment and full SEO crawl have not yet been performed.

## Phase 0 — Finish domain and account security

### Assistant implementation
- [x] Cloudflare HTTPS/TLS/canonical Pages env settings above.
- [x] Security headers deployed.
- [x] Supabase public-profile view security fix deployed to database.
- [ ] Verify actual production response headers over HTTPS and test HTTP-to-HTTPS redirect. Cloudflare settings are correct, but external DNS/network access from the execution environment failed; response-level verification remains pending.
- [x] Keep `www.hellosadiqabad.com` intentionally unsupported for now; only the canonical apex hostname is connected to Pages and present in DNS. Do not add a second indexable hostname unless the owner explicitly requests www support.
- [ ] Review CSP against real production requests; tighten only after confirming required integrations, maps, media, fonts and Supabase connections.
- [x] Reviewed the current zone DNS listing: apex proxied CNAME to the Pages project and owner-verified Google TXT record are present; no other records appeared in the returned listing. No records were deleted.
- [ ] Review Cloudflare WAF/bot protections and rate limits for public forms/chat endpoint; introduce rules carefully to avoid blocking normal visitors.
- [x] Re-reviewed Supabase Security, Performance and Health Advisors and public RLS state. Security Advisor reports leaked-password protection disabled only; Health Advisor has no findings. Performance Advisor reports one unindexed FK, 26 unused-index notices and two multiple-permissive-policy notices; these are documented for targeted review. No indexes/policies were removed or weakened. All inspected public base tables have RLS enabled.
- [ ] Check public signup policy and account provisioning. Keep signups restricted to the intended Admin-approved flow.
- [ ] Review Supabase Auth redirect configuration after owner completes dashboard changes.

### Owner actions
1. Open Supabase Auth URL configuration:
   https://supabase.com/dashboard/project/efwohfzqitevkuybnyif/auth/url-configuration
2. Set Site URL to `https://hellosadiqabad.com` (owner confirmed saved on 17 November 2026).
3. Add allowed redirect URLs (owner confirmed all three saved on 17 November 2026):
   - `https://hellosadiqabad.com/**`
   - `https://hellosadiqabad.com/reset-password`
   - `https://hellosadiqabad.com/change-password`
   - Add www URLs only if www is actually configured.
4. Save.
5. Leaked-password protection is currently unavailable on the connected Free plan. Owner action is only needed if the owner independently chooses to upgrade; never share credentials.
6. Tell the assistant when done; do not share passwords or private keys.

### Phase 0 acceptance
- HTTP requests redirect to HTTPS.
- Production HTTPS response headers are present and do not break app functionality.
- Supabase Auth password reset and allowed redirect paths use the canonical domain (owner-confirmed dashboard save).
- Leaked-password protection is either enabled after a plan upgrade or explicitly recorded as a Free-plan limitation accepted by the owner.
- Security Advisor findings are reviewed and remaining warnings are documented.
- www is either intentionally unsupported or redirects permanently to apex.

## Phase 1 — Technical SEO foundation

### Assistant implementation
- [ ] Inspect all public routes, route parameters, rendering model, page titles/descriptions and canonical URL generation.
- [ ] Create a dynamic, accurate XML sitemap at `https://hellosadiqabad.com/sitemap.xml`; include only canonical, public, indexable URLs.
- [ ] Include appropriate public business, category, area, news, authority-profile and other useful detail pages only where their routes are stable and content is public.
- [ ] Exclude Admin, Owner Portal, authentication/reset routes, drafts, private/inactive records, search query URLs, duplicate routes and error pages.
- [ ] Add sitemap location to `robots.txt`.
- [ ] Add unique title and meta description for homepage and each indexable page type.
- [ ] Add canonical links using `https://hellosadiqabad.com`; avoid pages.dev and www duplicates.
- [ ] Add Open Graph/Twitter metadata and social share image where appropriate.
- [ ] Add valid JSON-LD structured data only where page content supports it (Organization/WebSite, BreadcrumbList, LocalBusiness on genuine individual business pages, NewsArticle on published news).
- [ ] Ensure admin/private routes are noindex and also remain protected by authentication/RLS; robots.txt is not access control.
- [ ] Ensure pages have crawlable internal links, descriptive headings and meaningful image alt text.
- [ ] Validate sitemap XML, robots, canonical tags, metadata, structured data and route response behavior.
- [ ] Build, run tests/typecheck and deploy to Cloudflare Pages; verify deployment ID and production endpoints.

### Owner actions
- [x] Create Google Search Console Domain property for `hellosadiqabad.com`: https://search.google.com/search-console (owner-confirmed).
- [x] Copy and share the Google DNS TXT verification record (owner supplied DNS token only; no password shared).
- [x] Assistant verified the matching TXT record already existed in Cloudflare DNS; owner clicked Verify and confirmed success.
- [ ] After sitemap is deployed, submit `https://hellosadiqabad.com/sitemap.xml` in Search Console → Sitemaps.
- [ ] Use URL Inspection for homepage and a few important public pages; request indexing once after final URLs are live.

### Phase 1 acceptance
- Sitemap returns valid XML and only contains canonical, indexable public URLs.
- robots.txt points to sitemap.
- Canonicals and metadata are unique and correct for public page types.
- Structured data passes Google's Rich Results/Schema validation where applicable.
- Search Console Domain property is verified and sitemap is accepted (owner-confirmed).
- No admin/private data is exposed by sitemap or public structured data.

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

Continue Phase 0 technical verification first: response-level HTTPS/redirect checks, CSP and WAF/rate-limit review, and targeted remediation of confirmed low-risk findings. Owner has confirmed Auth URLs and Google Domain verification. Leaked-password protection is blocked by the Free plan. Once remaining Phase 0 technical checks are complete and the plan limitation is explicitly recorded, proceed to Phase 1 Technical SEO. Do not jump ahead or mark owner-only tasks complete without confirmation.
