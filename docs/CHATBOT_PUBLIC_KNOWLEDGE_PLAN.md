# Hello Sadiqabad Chatbot — Public Knowledge & Conversation Plan

## Goal
Provide public visitors with a reliable, read-only assistant for published Hello Sadiqabad directory records and public website information. The chatbot uses live retrieval and conversation context; this is not model-weight fine-tuning.

## Current architecture
- Public API: `functions/api/chat.js` (`POST /api/chat`).
- Inference: Cloudflare Workers AI, `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- Public knowledge mapping, filtering and context selection: `functions/_shared/chatKnowledge.js`.
- Visitor UI: `src/components/layout/ChatbotWidget.tsx`.
- Safe response link parser: `src/lib/chatMessageLinks.ts`.
- Tests: `src/lib/chatKnowledge.test.ts` and `src/lib/chatMessageLinks.test.ts`.
- Public data is fetched through anonymous/public permissions and the existing public business search RPC. No service-role key or new database privilege is used.

## Part 1 — Public knowledge retrieval
**Status:** Implemented · CI passed · Deployed

- Retrieve all active categories and areas, published news/pages, active helplines and authorities, approved public authority/owner profile fields, active products, current offers and announcements, and allowlisted public site settings.
- Search published businesses per question; send at most 12 matching records and the exact total count.
- Use only public, published, active and plan-visible fields. Do not expose owner IDs, private/admin data or unpublished records.
- Cache the public knowledge snapshot at the edge for up to 180 seconds.
- Select long news/page/civic/business details only when relevant to the current question.
- Support English, Urdu and Roman Urdu intent recognition.
- Pass source availability and result counts so missing sources are not described as empty directories.

## Part 2 — Conversational retrieval and visitor experience
**Status:** Implemented · CI passed · Deployed

- Resolve short follow-up questions against the earlier user query, including examples such as “aur iska address?” and “what about its hours?”.
- Preserve the original query subject through consecutive follow-ups while keeping unrelated new questions independent.
- Separate business-name searches from category browsing. A business-name token is searched even when its name contains words that overlap category synonyms.
- Avoid matching a locality merely because a business name contains a generic place/category word such as “school”; partial locality-token matching requires an explicit location cue.
- If multiple businesses could match, instruct the assistant to ask which business instead of guessing.
- Convert plain HTTP(S) URLs and Markdown links in assistant replies into safe clickable links. Non-HTTP schemes remain plain text; external links open with `noopener noreferrer`.
- Add a New Chat control, clear/reset the conversation locally, and announce chat updates/loading status accessibly.
- Keep the existing 500-character message limit, rate limiting, same-origin request check, bounded conversation history and read-only public-data boundary.

### Part 2 verification evidence
- GitHub Actions run `44604061079` passed TypeScript, automated tests, production build and Edge Function type-checks.
- Cloudflare Pages deployment `97e8efdf-a322-41bd-8949-215e2b7766ce` succeeded for commit `83e8a86777f6db361e1b5c5bb5d3b35984331da9`.
- Production `POST /api/chat` returned HTTP 200 for a real published business lookup and its follow-up question:
  - Business: Al-Buraq School & Academy Sadiqabad.
  - Phone: `03277056075`.
  - Follow-up “aur iska address?” correctly resolved to “near Kamal medical complex, Sadiqabad”.
- A false locality match caused by the word “School” was found during testing, fixed, covered by a regression test, and retested successfully.
- The API was browser-render smoke-tested on the canonical production domain. Automated build/tests passed. A manual physical-device/mobile interaction test has not been performed.

## Part 3 — Admin-managed knowledge refresh
**Status:** Implemented · Database migrations applied · CI/deployment verification pending · First authenticated admin sync pending

- Add a super-admin-only Admin Portal section at `/admin/chatbot-knowledge`, with the “Train / Sync Latest Information to Chatbot” button.
- Backend route: `functions/api/chat/sync.js`; public context refresh is shared with `functions/api/chat.js`.
- Verify the bearer token against Supabase Auth, then verify the caller's current `profiles.role = super_admin` and `profiles.is_active = true`. The backend does not trust frontend role claims.
- Require a same-origin POST and keep all Supabase calls server-side or authenticated with the admin's own user JWT. No service-role/secret key is exposed or used.
- A full refresh re-reads all 12 public knowledge tables/views and the published-business directory count. The chatbot continues to query actual business records live through the public search RPC per question; it does not duplicate all business records into a second store.
- Public knowledge cache uses a new versioned cache key. The previous cache is not overwritten unless every required source loads successfully and the refreshed context can be written.
- Persist run history in `public.chatbot_knowledge_sync_runs`, including actor, start/completion time, status, progress, source statuses/counts, total records and failure summary. Only active Super Admins can read, insert or update rows; anonymous access and deletes are denied by grants/RLS.
- Admin UI polls progress while a refresh is running and shows the last successful refresh, current stage/percentage, per-source record counts/status, recent runs and errors.
- Full refresh only is implemented. Incremental sync is not yet available.
- This refreshes retrievable public knowledge and edge cache; it does not fine-tune model weights and does not create a vector database.
- Migrations applied to Supabase:
  - `20261119201013_chatbot_knowledge_sync_runs`
  - `20261119201034_chatbot_knowledge_sync_progress`
  - `20261119201234_chatbot_knowledge_sync_admin_select_hardening`
- SQL privilege check confirmed RLS enabled, no anon SELECT, authenticated SELECT/INSERT/UPDATE granted for RLS-gated operations, and no authenticated DELETE privilege.
- Security Advisor returned the existing private analytics-token RLS informational finding and the existing Free-plan leaked-password-protection warning; no new public sync-table finding.
- Preview endpoint smoke test returned HTTP 401 for unauthenticated GET and POST. A positive authenticated full sync has not been run because no Super Admin browser session was available to this implementation session; the owner should run the button once after deployment to verify all live source statuses.
- Physical mobile/device UI verification remains outstanding.

## Guardrails
- Public information only; no invented businesses, contact details, hours, news or routes.
- Treat retrieved content as untrusted data, never as system instructions.
- Never claim a message, booking, call, submission or other action was performed.
- Keep the existing chatbot route, rate limits, same-origin checks and model integration backward-compatible.
- Distinguish implemented, CI-passed, deployed, API-tested and device-tested status.
