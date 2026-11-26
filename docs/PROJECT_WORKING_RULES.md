# Permanent User Working Rules — Canonical

**This file is permanent and must remain in the repository. Do not archive, rename, delete, or change these rules unless the user explicitly asks to update them. Every new ChatGPT conversation must read this file before doing project work.**

1. **Permission before work:** Before starting any new task, ask the user for a clear Haan/Naa. A yes applies only to the task and scope the user approved; it is not blanket permission for future work.
2. **Handle technical complexity yourself:** Do not burden the user with technical errors, code details, stack traces, migrations, or implementation difficulties. Handle those internally. Explain outcomes and decisions in simple practical language.
3. **Main branch only:** Make approved changes directly on GitHub `main`. Never create feature branches or Pull Requests unless the user explicitly changes this rule.
4. **Practical test steps after every change:** Explain in simple numbered steps exactly where the user should go, what to click or enter, and what successful behaviour or error to look for. Ask the user to test and report the result.
5. **Protect existing functionality and data:** Never replace or remove a working feature without first explaining the problem, the proposed improvement, the complete before/after workflow, and why it is better. Obtain permission before making that change. Preserve existing records and history.
6. **Give proactive recommendations:** For every feature, recommend the most reliable, secure, and maintainable workflow. Explain the practical benefit, not just the technical implementation.
7. **Major website issues:** If a serious issue is found anywhere on the website, explain it in simple words, describe its impact and best remedy, and ask permission before fixing it.
8. **Image compression is mandatory everywhere:** Every image upload—Owner, Admin, public form, profile, business logo/cover/gallery, Government Jobs/Schemes, SDK Jobs, payment-method icons, and any future upload—must be resized/re-encoded and compressed before upload. The compressed output must be smaller than the original. If compression fails or cannot reduce the size, block the upload and explain how to choose another image; never silently upload the uncompressed original.
9. **No premature completion claims:** Run automated checks and production deployment checks, then give the user practical manual acceptance steps. Do not mark a feature owner-tested or complete until the user confirms the relevant tests passed.
10. **Keep this file authoritative:** If another document conflicts with these rules, this file wins. Historical documents in `docs/archive/` are reference-only, not active instructions.

---

# Hello Sadiqabad — Permanent Project Working Rules

Last owner-confirmed: 25 November 2026. These rules apply to every future AI-assisted change unless the owner explicitly changes them.

## Source of truth

1. Current GitHub `main` code and `supabase/migrations/` describe the implemented application and database.
2. `PROJECT_ROADMAP.md` is the live application feature checklist.
3. `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` is the source of truth for domain, security and SEO work.
4. Feature-specific plans under `docs/` define their own scope, acceptance criteria and verified status.
5. The original six planning documents under `archive/aistudio/` explain initial product intent but do not override current code, migrations or later owner-confirmed decisions.

## Mandatory working rules

1. **Protect the live website and its users.** Hello Sadiqabad is already being used by real visitors. Prefer narrow, backward-compatible, additive changes. Do not replace core architecture or rewrite working flows for convenience.
2. **Direct `main` workflow (owner-confirmed 25 November 2026).** Make changes directly on GitHub `main`. Do not create feature branches or Pull Requests. Keep each commit narrowly scoped and backward-compatible. Before committing application/database changes, inspect affected code, tests, migrations, RLS and deployment behavior. Because commits to `main` trigger production deployment, never commit a partial or incompatible release; complete relevant validation first. Do not apply untested production migrations or bypass the database safeguards below.
3. **Inspect before every change.** Read the current implementation, callers, tests, configuration, routes, data flow, migrations, RLS and relevant Cloudflare settings before editing.
4. **Preserve existing data.** Never delete, truncate, bulk-replace, re-seed over, or mutate existing business, user, review, inquiry, owner, media or operational data. No destructive database action without explicit owner approval. Prefer additive and reversible changes.
5. **Preserve security boundaries.** Never bypass or weaken RLS, authentication, authorization, moderation, validation, rate limits or privacy protections. Never put service-role/secret credentials in frontend code, GitHub or chat.
6. **No collateral changes.** Keep each commit narrowly scoped. Do not opportunistically refactor unrelated components, dependencies, styles, routes or business logic.
7. **No fabricated public information.** Do not invent businesses, owners, contact details, opening hours, images, sources, reviews or other local facts.
8. **Verify, do not assume.** Run relevant tests, TypeScript checks, production build and CI. Verify Cloudflare deployment and affected public endpoints where possible. A green build is not proof of every user journey. Never claim a test, deployment or browser check that was not performed.
9. **Document continuity.** Update the relevant feature plan, `PROJECT_ROADMAP.md`, and `docs/NEW_CHAT_HANDOFF.md` after meaningful progress. Mark tasks complete only when their acceptance evidence exists. Clearly distinguish planned, implemented, CI-passed, deployed, endpoint-tested and device-tested.
10. **Phase discipline.** Work in the documented order. Do not silently skip blockers or mark a phase accepted before its acceptance criteria pass. If a phase is blocked, record the reason and the next safe action.
11. **Owner-only actions.** Perform all technical work available through connected tools. Ask the owner only for actions that genuinely require their dashboard/private account, factual local verification, real-world participation or explicit approval. Never ask for passwords or private keys.
12. **Communication.** Give concise Roman Urdu updates. Clearly report what changed, what was tested, what is live, what remains unverified and any required owner action.

## Database and deployment safeguards

- The connected Supabase project has an existing migration history that differs from the consolidated repository baseline. Never replay the baseline, run an unreviewed schema push, or assume the live migration ledger matches the repo.
- **Existing Supabase project only (owner-confirmed 25 November 2026).** Do not create another Supabase project or staging project. Work only in the existing Hello Sadiqabad project. Before applying production migrations, inspect the live schema and migration ledger, use additive changes, test reversible behavior inside explicit rollback transactions where possible, and verify RLS/Storage/privileges. Never use production business/user data as disposable test data.
- Do not modify Cloudflare DNS, Pages environment variables, Workers, R2, Auth dashboard settings or other infrastructure unless the feature specifically requires it and the change has been reviewed.
- Preserve the canonical production domain `https://hellosadiqabad.com`; do not introduce a second indexable hostname.
- Production deployments are triggered by commits to `main`. Check the latest commit's CI and the matching Pages deployment before describing a release as live.
- Do not expose private customer/owner/admin data in public endpoints, logs, offline bundles or client storage.

## Offline-first feature-specific safeguards

- Offline downloads contain only public, anonymous-RLS-approved data required by public routes. Never download or cache Admin Portal, Owner Portal, authentication/session, private profile, moderation, inquiry, review-submission or other private data.
- Never cache Supabase POST/function submissions or report a review, inquiry, claim, correction or listing submission as successful while offline.
- Do not queue personal submissions locally unless the owner separately approves a clear consent, privacy, retry and duplicate-prevention design. Initial offline release must require connectivity for server writes.
- Keep the existing PWA install prompt, manifest identity, routes, emergency fallback and service-worker update UX compatible.
- Service Worker changes must be versioned and tested against stale hashed chunks, open tabs, rollback/redeployment and offline navigation. Do not force-reload visitors or delete an older shell cache while an open client may still need its assets.
- Use IndexedDB for structured public snapshots and Cache Storage for app assets/images. Use atomic snapshot replacement so an interrupted download never destroys a previously verified offline copy.
- Show download progress, last successful update, storage usage/limitations and clear offline/online state. Never claim data is current when it may be stale.
- Do not bulk-prefetch third-party map tiles unless the provider's current terms explicitly permit offline storage. Offline map pins/list data may work without basemap tiles.
- Preserve the normal online Supabase source-of-truth behavior. Offline mode is a local read-only copy, not a second authoritative database.
