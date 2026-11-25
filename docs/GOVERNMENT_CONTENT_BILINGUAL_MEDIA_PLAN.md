# Government Jobs & Schemes — Bilingual Content and Media Plan

**Owner-approved decisions:** 25 November 2026.

## Existing baseline
Government Jobs and Government Schemes already have public directories/detail routes, Admin managers and dedicated permissions. Extend the current implementation; do not recreate tables/routes or replace the official-source verification workflow. Inspect current code and migrations before any schema changes.

## Bilingual publication requirements
English and Urdu content is required for:
- Title and short summary.
- Full description/details.
- Eligibility and exclusions.
- Required documents.
- Application steps/instructions.
- Fees, repayment or benefits where applicable.
- Important warnings, deadline/intake status and user-facing labels.

Preserve official legal/eligibility meaning. Retain the official source URL and verification/review dates. Admin sees a bilingual completeness checklist. Incomplete translation remains draft and cannot publish.

## Poster and image rules
- Admin uploads official poster or verified relevant image.
- Do not invent official artwork or use unverified imagery as official.
- No image means record stays draft; no public publication until an image is reviewed and approved.
- Preserve current Government Jobs optional poster support and Storage safeguards.
- Audit Government Schemes image support; if missing, propose additive nullable media fields/migration and secure storage policies.
- Validate MIME, size, uploader, object path and permissions. Draft images must not leak publicly before approval where current storage architecture permits private pending media.
- Keep image alt text/accessibility and sensible responsive crop behavior.

## Shareable pages
Every published job/scheme detail page has:
- Stable canonical URL.
- Bilingual title/description metadata.
- Approved poster as Open Graph/Twitter/social preview image.
- Share and copy-link actions.
- Public sitemap/search/offline inclusion only after publication.

Test actual link previews and ensure no draft image, admin notes or private source file appears. An image does not prove an application window is open; preserve intake verification safeguards.

## Acceptance
Bilingual content is complete before publication; no-image records remain draft; public image is the approved poster; share previews use the correct image and canonical URL; existing source verification, revision history, RLS and published-only behavior remain intact.
