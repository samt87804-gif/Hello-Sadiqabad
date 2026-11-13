# Hello Sadiqabad — Supabase

Project ref: `efwohfzqitevkuybnyif`  
Region: `ap-southeast-2` (Singapore)  
Database: PostgreSQL 17

## Database setup

- `migrations/20261113220000_hello_sadiqabad_baseline.sql` is the consolidated baseline snapshot for a fresh project.
- `seed.sql` inserts the city, 13 top-level categories, 3 plans, 4 emergency contacts, bilingual static pages and public site settings.
- The current connected project has already received the schema and security changes directly; do **not** replay the baseline migration against this already-initialized project.
- There are 25 public tables. RLS is enabled on every public table. Public roles have read-only access to published directory data; public writes go through Edge Functions using the service role.
- Images are external HTTPS URLs. No Storage buckets are used in this version.
- Areas are intentionally left empty pending confirmation of Sadiqabad locality names. No TEST businesses were inserted.

## Edge Functions

| Function | JWT verification | Purpose |
|---|---:|---|
| `submit-review` | Off | Validates and rate-limits public reviews; inserts as pending |
| `submit-inquiry` | Off | Checks plan feature and rate-limits inquiries |
| `submit-suggestion` | Off | Receives listing/correction/claim/report submissions |
| `track-event` | Off | Tracks anonymized business events, ads and search queries |
| `admin-create-user` | On | Creates confirmed owner/staff/admin accounts |
| `admin-reset-password` | On | Super-admin password reset; requires password change |
| `admin-set-user-active` | On | Super-admin account activation/deactivation |

Public function source is under `supabase/functions/<name>/index.ts`. The admin endpoints are deployed in the connected Supabase project; keep their source mirrored here before changing them.

## Scheduled maintenance

- Daily at 02:00 Pakistan time: expire plans and offers.
- Weekly at 02:30 Pakistan time: purge old rate-limit, search-log and event rows.
- Daily stats are incremented atomically when events arrive; no separate rollup job is required.

## Security follow-ups in Dashboard

- Enable Auth leaked-password protection.
- Set Auth Site URL to `https://hellosadiqabad.com`.
- Add redirect URLs for the production domain, Cloudflare preview domain and `http://localhost:3000/reset-password`.
- Disable public sign-ups. Accounts are provisioned by the admin Edge Function.
- Set the Edge Function secret `ALLOWED_ORIGINS` to the exact production/preview origins.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or any secret key in Vite variables or GitHub.

## Cloudflare frontend variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SITE_URL`
- `VITE_DEFAULT_CITY`

Never add a service-role key to the frontend.
