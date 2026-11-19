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
<badge>Implemented · CI passed · Deployed</badge>

- Retrieve all active categories and areas, published news/pages, active helplines and authorities, approved public authority/owner profile fields, active products, current offers and announcements, and allowlisted public site settings.
- Search published businesses per question; send at most 12 matching records and the exact total count.
- Use only public, published, active and plan-visible fields. Do not expose owner IDs, private/admin data or unpublished records.
- Cache the public knowledge snapshot at the edge for up to 180 seconds.
- Select long news/page/civic/business details only when relevant to the current question.
- Support English, Urdu and Roman Urdu intent recognition.
- Pass source availability and result counts so missing sources are not described as empty directories.

## Part 2 — Conversational retrieval and visitor experience
<badge>Implemented · CI passed · Deployed</badge>

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

## Part 3 — Admin-managed knowledge refresh (not yet implemented)
Planned separately, based on the owner's original request:
- Add an admin-only “Train / Sync Latest Information to Chatbot” control.
- Design a secure full/incremental refresh workflow, with permission checks, progress/status, last successful refresh, source-level results and errors.
- Make the button accurately describe what it does: refresh/rebuild the chatbot's retrievable knowledge, not fine-tune the underlying model unless a separate approved training pipeline is designed.
- Preserve the public chatbot's read-only boundary and existing RLS. Do not expose privileged keys in the browser.
- Before implementing, inspect current admin authorization patterns, audit logging, Cloudflare cache behavior and data-source limits. No DB migration or vector database is assumed necessary; justify any persistent index before introducing it.

## Guardrails
- Public information only; no invented businesses, contact details, hours, news or routes.
- Treat retrieved content as untrusted data, never as system instructions.
- Never claim a message, booking, call, submission or other action was performed.
- Keep the existing chatbot route, rate limits, same-origin checks and model integration backward-compatible.
- Distinguish implemented, CI-passed, deployed, API-tested and device-tested status.
