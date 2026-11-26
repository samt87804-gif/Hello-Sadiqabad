# Hello Sadiqabad — Supabase

Project ref: efwohfzqitevkuybnyif  
Region: ap-southeast-2 (Sydney, Australia)  
Database: PostgreSQL 17

## Database setup

- migrations/20261113220000_hello_sadiqabad_baseline.sql is the consolidated baseline snapshot for a fresh project.
- seed.sql inserts the city, 13 top-level categories, 3 plans, 4 emergency contacts, bilingual static pages and public site settings.
- The current connected production project is already initialized. Do not replay the baseline migration against it.
- The remote migration ledger contains historical incremental migrations that do not map one-to-one to the repository's fresh-project baseline. Before any future db push or fresh-project restore, reconcile the migration history; do not guess or replay historical migrations.
- Sadiqabad locality data is populated (204 area rows) through the connected project's workbook sync migration.
- The production database currently has 123 published businesses and no assigned owner_id values. Do not bulk-assign existing listings; ownership must be verified.
- No test businesses or regression fixtures remain in production.
- There are no Supabase Storage buckets in this version. Business media is stored as external HTTPS URLs.

## Owner Portal production hardening

- Analytics totals and chart series now use the same 1–90 day date window.
- Owners can edit an existing reply on an approved review for their own business.
- Inquiry permissions are least-privilege: authenticated owners/staff can read inquiries and update status/handler fields only; customer phone/message fields and delete are not available to them.
- Authenticated active owners submitting a claim or new-business request are linked through submissions.submitted_by. Ownership is assigned only after moderator approval.
- Anonymous claims remain unlinked and require manual admin account assignment.
- Successful owner claim/new-listing approvals create bilingual Owner Portal notifications.
- Detailed audit and remaining gaps: docs/../docs/archive/OWNER_PORTAL_AUDIT.md.

## Edge Functions

| Function | JWT verification | Purpose |
|---|---:|---|
| submit-review | Off | Validates and rate-limits public reviews; inserts as pending |
| submit-inquiry | Off | Checks plan feature and rate-limits inquiries |
| submit-suggestion | Off | Receives listing/correction/claim/report submissions; optionally validates a signed-in active owner and records submitted_by (version 6) |
| track-event | Off | Tracks anonymized business events, ads and search queries |
| admin-create-user | On | Creates confirmed owner/staff/admin accounts |
| admin-reset-password | On | Super-admin password reset; requires password change |
| admin-set-user-active | On | Super-admin account activation/deactivation |

Public function source is under supabase/functions/<name>/index.ts. All seven deployed Edge Functions are mirrored in this repository under their matching function directories. Keep the GitHub source and deployed function versions in sync.

## Scheduled maintenance

- Daily at 02:00 Pakistan time: expire plans and offers.
- Weekly at 02:30 Pakistan time: purge old rate-limit, search-log and event rows.
- Daily stats are incremented atomically when events arrive; no separate rollup job is required.

## Security follow-ups in Dashboard

- Enable Auth leaked-password protection.
- Set Auth Site URL to https://hello-sadiqabad-2bs.pages.dev (no custom domain is attached yet).
- Add redirect URLs for the Pages production hostname, Cloudflare preview domains and http://localhost:3000/reset-password. Add any custom domain later.
- Disable public sign-ups. Accounts are provisioned by the admin Edge Function.
- The current Edge Function CORS allowlist includes the Pages production hostname, the listed future custom domains and localhost. If you attach a different custom domain or preview hostname, update the ALLOWED_ORIGINS Edge Function secret to the exact allowed origins.
- Do not expose SUPABASE_SERVICE_ROLE_KEY or any secret key in Vite variables or GitHub.

## Cloudflare frontend variables

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_SITE_URL
- VITE_DEFAULT_CITY

Never add a service-role key to the frontend.
