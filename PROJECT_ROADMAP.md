# Hello Sadiqabad — Project Roadmap

This is the live project checklist. Update it on `main` whenever a task is verified complete. A phase is checked only after implementation and verification.

## Completed

- [x] Homepage hero banner
- [x] Owner registration request flow and Admin approval/rejection workflow
- [x] Public owner profiles with Admin-controlled field-level privacy
- [x] News Module — bilingual public feed/article pages, Admin draft/publish editor, database RLS, and production deployment verified
- [x] Enhanced Owner Portal — My Businesses management, owner-only approval/request history, secure plan-upgrade submissions, and database-enforced active-offer limits
- [x] Owner Products & Services Catalogue — bilingual owner-managed products (max 2 per business), public display on published profiles, and database/UI service limits (max 2 for owner edits)

## In progress

- None

## Remaining

- [ ] Sponsor Ads enhancements
- [ ] Government Helpline module
- [ ] Local Authorities module
- [ ] Read-only, Roman Urdu-first AI chatbot

## Existing functionality to preserve

- The 14 legacy imported listings that currently have more than 2 English service entries were not automatically trimmed or deleted. The owner-edit trigger permits unrelated edits while preserving unchanged legacy arrays; owners can review and reduce services to 2 before changing them. New/changed owner service arrays are capped at 2.
- Product catalogue starts empty; owners add and maintain their own products (up to 2 per business). Public visitors see only active products on published business listings.

- Offer limits continue to follow the configured plan values (Free 0, Basic 2, Premium 10 active offers); database enforcement now matches the active-offer count shown in the portal. A universal two-offer cap would be a separate confirmed rule change.

- Civic Announcements already exist at `/announcements`, with bilingual title/body, optional link, active date range, and Admin management permission `announcements.manage`.
- Do not replace or break Civic Announcements when adding a separate News feature unless explicitly requested.
- Keep public visibility and all approval decisions enforced by Supabase RLS/backend, not only frontend UI.

## Update rules

1. Mark a task `[x]` only after code, database/security checks (when applicable), build/tests, and deployment verification pass.
2. Keep incomplete sub-work unchecked and clearly labelled.
3. Commit roadmap updates to `main` alongside the completed task.
4. Work on one phase at a time and ask before starting the next phase.
