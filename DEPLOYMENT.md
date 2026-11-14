# Production deployment

Cloudflare Pages project: `hello-sadiqabad`
Production URL: https://hello-sadiqabad-2bs.pages.dev
Production branch: `main`

## Build settings

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repository root
- Package manager: npm (keep `package-lock.json`; do not add Bun lockfiles)
- `.npmrc` must retain `legacy-peer-deps=true`

## Required Production variables

Set these in Cloudflare Pages → Settings → Variables and secrets → Production:

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable/legacy anon public key
- `VITE_SITE_URL`: `https://hello-sadiqabad-2bs.pages.dev`
- `VITE_DEFAULT_CITY`: `sadiqabad`

After changing a variable, trigger a new production deployment because Vite embeds `VITE_*` values at build time.

Never expose a Supabase service-role or secret key through a `VITE_*` variable, source file, or browser bundle.

## Authentication dashboard checklist

- Set the Supabase Auth Site URL to the production URL above.
- Add the production URL and `/reset-password` to the allowed redirect URLs.
- Keep public sign-ups disabled; provision accounts through the admin workflow.
- Enable leaked-password protection.
- Update the Edge Function `ALLOWED_ORIGINS` secret if the production hostname changes.

## Release verification

After each production deploy, verify the home page, direct route refreshes, directory data, sign-in, password reset redirect, and admin authorization. Check Cloudflare build logs and browser console/network errors before announcing the release as production-ready.
