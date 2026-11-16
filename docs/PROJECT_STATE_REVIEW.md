# Hello Sadiqabad — Current Project State

Last reviewed: 16 November 2026

## Source-of-truth order

1. Current GitHub main code and supabase/migrations describe the implemented application and database.
2. PROJECT_ROADMAP.md is the live checklist for completed work and user-requested improvements.
3. The six files under public/assets/aistudio are the original planning baseline. They remain useful for initial product intent, architecture and security rules, but predate later post-build features. Do not treat them as a complete description of the current implementation.

## Platform

- Frontend: React, TypeScript and Vite.
- Database/auth: Supabase PostgreSQL 17, with RLS and migrations.
- Hosting/deployment: Cloudflare Pages, connected to GitHub.
- Main repository: samt87804-gif/Hello-Sadiqabad, branch main.
- Public site: https://hello-sadiqabad-2bs.pages.dev

## Verified completed application work

- Homepage hero banner.
- Owner registration requests and Admin approval/rejection.
- Public owner profiles with Admin-controlled field-level privacy.
- News module with bilingual public feed/article pages and Admin draft/publish workflow.
- Enhanced Owner Portal, including My Businesses, owner request history and plan-upgrade submissions.
- Owner Products & Services Catalogue, with database/UI limits and published-business visibility rules.

## Important existing rules and data to preserve

- Public business and owner-profile visibility must be enforced by Supabase RLS/backend, not only by frontend conditions.
- Existing News articles must remain intact when News media fields are extended.
- Civic Announcements at /announcements are separate from the News module.
- The 14 legacy imported businesses with more than two English service entries were not deleted or trimmed; they have no linked owner. Preserve these records.
- Product catalogue rows currently start empty; owners may add up to two products per business.
- Offer limits remain plan-based (Free 0, Basic 2, Premium 10 active offers).
- Do not perform destructive data changes without explicit approval.

## User-requested improvements

The user asked for eight improvements, to be implemented in batches of three. Their detailed status is maintained in PROJECT_ROADMAP.md. Do not begin a later batch until the current batch is completed, verified and the user approves the next one.

### Batch 1
1. News button in mobile bottom navigation.
2. Multiple images and a YouTube video URL per News article.
3. Consistent 16:9 image-management preview cards (40% image / 60% details); helpline cards include name, phone and a Call action.

### Batch 2
4. Keep Admin edit panels and unsaved form state open when switching browser tabs or copying/pasting.
5. Owner products, services and offers require Admin approval before becoming public.
6. Owners choose which owned businesses appear on their public owner profile.

### Batch 3
7. Move category listing count to the far right and make it larger/bolder without otherwise changing the category card design.
8. Apply the supplied logo to the website header and PWA install icon.

## Operating checklist

- Inspect the current code, database schema, RLS and relevant migrations before every change.
- Preserve existing data and backward compatibility.
- Validate user-supplied URLs and content in both frontend and database where applicable.
- Run typecheck, tests and production build; verify Supabase behavior and Cloudflare deployment for the affected feature.
- Update PROJECT_ROADMAP.md after each verified batch.