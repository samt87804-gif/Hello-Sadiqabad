# Hello Sadiqabad — Project Roadmap

This is the live project checklist. Update it on `main` whenever a task is verified complete. A phase is checked only after implementation and verification.

## Completed

- [x] Homepage hero banner
- [x] Owner registration request flow and Admin approval/rejection workflow
- [x] Public owner profiles with Admin-controlled field-level privacy

## In progress

- [ ] News Module — requirements clarification pending; the existing Civic Announcements feature is separate and already implemented.

## Remaining

- [ ] Enhanced Owner Portal (multiple-business management and remaining owner workflows)
- [ ] Sponsor Ads enhancements
- [ ] Government Helpline module
- [ ] Local Authorities module
- [ ] Read-only, Roman Urdu-first AI chatbot

## Existing functionality to preserve

- Civic Announcements already exist at `/announcements`, with bilingual title/body, optional link, active date range, and Admin management permission `announcements.manage`.
- Do not replace or break Civic Announcements when adding a separate News feature unless explicitly requested.
- Keep public visibility and all approval decisions enforced by Supabase RLS/backend, not only frontend UI.

## Update rules

1. Mark a task `[x]` only after code, database/security checks (when applicable), build/tests, and deployment verification pass.
2. Keep incomplete sub-work unchecked and clearly labelled.
3. Commit roadmap updates to `main` alongside the completed task.
4. Work on one phase at a time and ask before starting the next phase.
