# Local SEO & Directory Data Quality Audit

**Audit date:** 17 November 2026  
**Scope:** Read-only review of the live Supabase directory and the three supplied Excel workbooks.  
**Safety:** No live business, category, area, or owner records were inserted, updated, deactivated, or deleted during this audit.

## 1. Live directory snapshot

The live database currently contains 223 published business listings, 15 active categories, and 263 active areas.

| Check | Result |
|---|---:|
| Published businesses | 223 |
| Missing/blank primary phone | 15 |
| Placeholder/unusable phone values (e.g. `0`, all-zero strings) | 21 |
| Missing English street/address field | 33 |
| No linked area | 49 |
| Missing either latitude or longitude | 7 |
| Missing either logo or cover image | 222 |
| English description missing or shorter than 40 characters | 121 |
| Missing either explicit SEO title or SEO description | 223 |
| Active areas with no published businesses | 186 |
| Active area labels flagged for manual review (empty, unusually long, or address-like) | 12 |
| Active categories with no published businesses | 4 |

The site already has fallback metadata generation for business profiles. Therefore, the 223 missing explicit metadata fields do not mean those pages have no HTML metadata; it means the records do not contain custom per-business overrides.

## 2. Taxonomy indexability

The current area table is substantially broader than the supplied 204-row locality workbook. It includes 263 active area rows, of which 186 currently have no published listings. Only **14 areas** currently have at least three published businesses. There are **10 categories** with at least one published listing; four active categories are empty.

To avoid publishing thin location/category pages as sitemap targets, the sitemap now includes:
- Category detail pages only when at least one published business belongs to the category.
- Area detail pages only when at least three published businesses belong to the area.
- The city map route remains available and is included when published businesses exist.

This is an indexing eligibility rule only. It does not delete, deactivate, rename, or hide any area/category from the user-facing directory. Direct links and the directory filters remain available. The threshold can be revisited as real listings are added.

## 3. Supplied workbook review

### Google Places crawler export (374 rows, 187 columns)
- 374 unique Google Maps place IDs and 374 unique Google Maps URLs.
- 370 unique titles (12 rows participate in repeated-title groups).
- 227 rows have a phone value; 220 distinct phone values.
- 363 rows identify the city as Sadiqabad; the remaining 11 rows are blank or identify another locality.
- 38 rows contain a website URL.
- 327 rows have a distinct latitude value.

### New Seed Data (771 rows, 1,021 columns)
- 771 unique Google Maps place IDs and 771 unique Google Maps URLs.
- 767 unique titles (10 rows participate in repeated-title groups).
- 470 rows have a phone value; 457 distinct phone values.
- 739 rows identify the city as Sadiqabad; the remaining 32 rows are blank or identify another locality.
- 93 rows contain a website URL.
- 635 rows have a distinct latitude value.

Repeated titles or phones are not automatically duplicate businesses: distinct Google place IDs can represent separate branches, and shared phone numbers may be valid for a group. These records must be matched by place ID, normalized name, address, coordinates, and phone before any import or merge.

### City Sadiqabad All Areas (204 rows, 9 columns)
- 204 unique area names and no duplicate slugs in the workbook.
- The workbook groups entries into Colony (58), Mohalla / Basti (57), Town / Housing Scheme (42), Road / Chowk / Commercial Hub (24), Park / Residential Block (12), and City Boundary Chak / Revenue Estate (11).
- The workbook itself describes this as a locality reference list; entries should not automatically be represented as officially delimited neighborhoods.

## 4. Import and correction safeguards

1. Do not bulk-import either crawler workbook directly into production.
2. Do not overwrite current business records using a title-only match.
3. Treat empty, zero, all-zero, or malformed phone values as missing; do not show them as callable numbers.
4. Never invent phone numbers, addresses, hours, descriptions, area assignments, or images.
5. Resolve area assignments from the actual address/locality evidence and the approved area reference; ambiguous records remain unassigned pending review.
6. Keep new or uncertain records in an admin review/import batch until they pass deduplication and local-relevance checks.
7. Preserve the current published listings and owner links. Corrections should be additive or individually reviewed and audited.

## 5. Next data-quality priorities

1. Review the 36 listings with blank or placeholder phone values.
2. Resolve the 33 missing addresses and 49 missing area links using verifiable source records.
3. Review the 12 suspicious area labels and compare them against the supplied locality workbook before any rename/merge.
4. Prepare a candidate import review keyed by Google place ID, not by business title alone.
5. Add genuinely useful business descriptions only from verified business facts or owner submissions.
6. Add custom SEO titles/descriptions only where the underlying business data supports accurate, unique copy.

## 6. Supabase advisor snapshot

- Security advisor: one warning — leaked-password protection disabled. This remains an Auth plan/feature setting for the project owner to check; no workaround was added.
- Performance advisor: 26 unused-index notices and two multiple-permissive-policy notices. Unused indexes were not dropped because their future use and foreign-key/operational role need review. The two SELECT policy pairs need semantic/RLS review before consolidation.
- Health advisor: no notices at the time of this audit.

**No schema or RLS changes were made as part of this read-only audit.**


## 7. Cross-workbook Place ID reconciliation — follow-up audit (17 November 2026)

A second pass compared the two supplied Google Places exports against each other, rather than assessing each workbook in isolation:

| Check | Result |
|---|---:|
| Combined source rows | 1,145 |
| Likely Sadiqabad rows (city field or address text) | 1,109 |
| Rows needing geographic relevance review | 36 |
| Unique nonblank Place IDs across both workbooks | 1,028 |
| Place IDs repeated across the combined source rows | 117 IDs |
| Rows participating in repeated-Place-ID groups | 234 |
| Area reference rows / unique area names | 204 / 204 |

Each workbook has unique Place IDs within itself (crawler: 374; New Seed Data: 771), but 117 Place IDs overlap across the two workbooks. This means the two files are not independent lists and should be reconciled before treating their combined row count as a count of distinct candidate businesses.

A review workbook was generated for owner/admin inspection: `Hello_Sadiqabad_Business_Data_Audit.xlsx`. It contains a summary, per-source quality counts, 1,109 likely-Sadiqabad candidate rows, repeated Place ID groups, rows participating in those repeated IDs, 36 geographic-review rows, the 204-row area master, and methodology/limitations.

### Live database matching limitation

The live `public.businesses` schema was inspected directly. It has no Google Place ID column. A fresh read-only aggregate query confirmed 223 published businesses, 49 without area, 15 without primary phone, 7 without coordinates, and 33 without address. Therefore, this pass has **not** labelled any source row as a confirmed live duplicate or confirmed new listing. A safe next matching pass needs normalized business name + phone + address + coordinate proximity, with ambiguous cases manually reviewed. Do not add a place-ID column or mutate business rows as part of this report-only task without a separate schema/data plan.

No production records were inserted, updated, merged, renamed, deactivated, or deleted.


## 8. Live business image and crawler SEO re-audit — 19 November 2026

A read-only re-audit was completed after the earlier 17 November snapshot. The live counts have changed and supersede the old snapshot for current planning:

| Check | Result |
|---|---:|
| Published businesses | 397 |
| Published businesses with at least one logo/cover image URL | 375 |
| Published businesses without either logo or cover image URL | 22 |

Additional verified controls:
- `public.businesses` has RLS enabled. The anonymous SELECT policy is `status = 'published'`.
- Active categories and areas are publicly readable only while active.
- The only configured storage bucket is `Hello Sadiqabad`, marked public. The storage inventory contains 804 objects under the `business-media` folder. No bucket setting or storage policy was changed.
- The dynamic sitemap already reads published business slugs and includes `updated_at` as last-modified metadata. `robots.txt` allows crawling and points to `https://hellosadiqabad.com/sitemap.xml`.
- The requested example slug `al-madina-medical-store` was not found in the live published-business rows at the time of this check. This does not change the desired search-result format; an existing published listing was used for crawler testing.
- A Googlebot request through Cloudflare Browser Rendering returned HTTP 200 for a live published business and exposed its page-specific title, description, canonical URL, real cover image URL and LocalBusiness/BreadcrumbList JSON-LD in the HTML.
- No database/schema/RLS/storage changes or business-record mutations were made during this re-audit.

This is a live snapshot only; counts may change as businesses are published or their media is updated.


## 9. Business sitemap and image-object verification — 19 November 2026

- Live sitemap returned HTTP 200 XML with 479 URLs total, including 397 `/business/` URLs.
- Live `public.businesses` has 397 published rows, 397 distinct published slugs and zero duplicate published slugs. The sitemap contained the existing live test slug `al-madina-boring-and-sanitary-store-gvz`.
- The sample cover object referenced by the crawler's `og:image` metadata exists in the public `Hello Sadiqabad` bucket and is stored as `image/webp` (41,564 bytes).
- Googlebot Browser Rendering returned HTTP 200, business-specific title/description/canonical/OG image/JSON-LD and the visible business H1 after hydration. WhatsApp and Facebook crawler requests also returned the expected preview metadata.
- This verifies the URL and storage object are present; actual preview rendering/image retrieval by the WhatsApp/Facebook apps remains a separate device/platform check.
