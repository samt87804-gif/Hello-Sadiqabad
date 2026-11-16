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

## User-requested improvements (16 November 2026)

Batch 1 — completed (16 November 2026):
- [x] (1) Add News to the mobile bottom navigation.
- [x] (2) Support multiple images and a YouTube video URL in each News article.
- [x] (3) Standardize image-management previews as 16:9 cards with 40% image / 60% details; show name, phone and a Call action for helplines.

Batch 2 — pending:
- [ ] (4) Keep Admin edit sections and entered form data open when switching tabs or copying/pasting from another browser tab.
- [ ] (5) Route owner-created products, services and offers through Admin approval before public display.
- [ ] (6) Let owners choose which of their businesses appear on their public owner profile.

Batch 3 — pending:
- [ ] (7) Move category listing quantity to the far right of each category card and make it larger/bolder, without changing the existing card layout.
- [ ] (8) Use the supplied Hello Sadiqabad logo in the site header and as the installable PWA app icon.

## Remaining

- [ ] Sponsor Ads enhancements
- [ ] Government Helpline module
- [ ] Local Authorities module
- [ ] Read-only, Roman Urdu-first AI chatbot

## Existing functionality to preserve

- The 14 legacy imported listings with more than 2 English service entries currently have no linked owner. They were not trimmed or deleted. Admin can review them now; once a listing is linked to its owner, that owner can reduce the list to 2. Unchanged legacy arrays remain intact during unrelated owner edits; changed owner service arrays are capped at 2.
- Product catalogue starts empty; owners add and maintain their own products (up to 2 per business). Public visitors see only active products on published business listings.

- Offer limits continue to follow the configured plan values (Free 0, Basic 2, Premium 10 active offers); database enforcement now matches the active-offer count shown in the portal. A universal two-offer cap would be a separate confirmed rule change.

- Civic Announcements already exist at `/announcements`, with bilingual title/body, optional link, active date range, and Admin management permission `announcements.manage`.
- Do not replace or break Civic Announcements when adding a separate News feature unless explicitly requested.
- Keep public visibility and all approval decisions enforced by Supabase RLS/backend, not only frontend UI.

## Update rules

1. Mark a task `[x]` only after code, database/security checks (when applicable), build/tests, and deployment verification pass.
2. Keep incomplete sub-work unchecked and clearly labelled.
3. Commit roadmap updates to `main` alongside the completed task.
4. Work through user-requested improvements in batches of three; update this checklist after each verified batch and ask before starting the next batch.
