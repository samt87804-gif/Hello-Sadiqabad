# Owner Gallery Management — Phase 4B

**Owner approval:** 27 November 2026. Scope: let Owners of published businesses add gallery photos through the existing private-media and Admin-review lifecycle, and request removal of managed gallery photos without changing the currently public photo before Admin approval.

## Practical outcome

- Owners can upload gallery photos from Owner Portal → My Businesses → Edit Listing → Preview → Manage photo gallery.
- Every upload is compressed/re-encoded to WebP before upload. If compression cannot produce a smaller file, upload is blocked.
- Photos upload only to the private pending-media bucket using a server-issued signed upload URL.
- The database verifies authenticated business ownership, published business status, actual Storage MIME/size metadata and the active plan's gallery limit.
- Admin reviews photos through the existing Admin → Business Field Approval media area / other business-media review cards. No separate queue is created.
- Approved photos are copied to the existing public business-media bucket and added to `businesses.gallery_urls`. Rejected uploads are not published.
- Owners can request removal of a managed, already-approved gallery photo. It stays public until Admin approves the removal. Admin processes it from the same existing media review area.
- Legacy gallery URLs are preserved. Existing photos that do not have a matching managed media-asset record cannot yet be removed by the Owner through this new request button; Admin can still manage them through the existing business tools.
- Existing plan limits remain authoritative: Free 0, Basic 5, Premium 15. The feature does not modify plan prices or limits.
- Existing logo/cover monthly replacement allowance (2 combined per Pakistan calendar month) remains separate and unchanged.

## Implementation checklist

- [x] Read permanent working rules, roadmap, handoff, active Add Business approval plan and relevant source files.
- [x] Inspect live Hello Sadiqabad migration ledger, schema constraints, RLS policies, plan entitlements and media workflow before changes.
- [x] Additive migration `20261127110000_owner_gallery_moderation`: permit `gallery` media assets, add Owner-only read policy for their own uploaded assets, and enforce plan gallery limits plus ownership, published status, signed-object metadata and private path in the existing request RPC.
- [x] Additive migration `20261127120000_owner_gallery_removal_requests`: add Owner-authorized removal request RPC and `removal_requested` media state; Admin finalization remains service-role-only.
- [x] Extend the existing signed upload function to authorize plan-limited gallery uploads; deployed to the existing Supabase project (function version 4).
- [x] Extend the existing media review function to promote approved gallery photos, defer when plan capacity is unavailable, remove approved gallery photos after Admin approval, and roll back a failed publication; deployed to the existing Supabase project (function version 7).
- [x] Add Owner gallery upload, status history and managed-photo removal request controls to Listing Editor.
- [x] Add gallery media and Owner removal requests to the existing Admin business-media review cards; no parallel approval queue.
- [ ] Fix all CI failures and confirm the latest main commit passes TypeScript, tests, production build and Edge Function checks.
- [ ] Confirm the latest matching Cloudflare Pages production deployment succeeds.
- [ ] Owner manual acceptance: upload/approve/reject/remove a gallery photo and verify plan limits and public visibility.
- [ ] Optional follow-up: extend Owner removal requests to older legacy gallery URLs that have no media-asset record, after a safe asset-linking design.

## Release evidence

- Live Supabase project: existing Hello Sadiqabad project only; no new project created.
- Applied live migrations: `20261127110000_owner_gallery_moderation`, `20261127120000_owner_gallery_removal_requests`.
- Edge Functions deployed: `create-business-media-upload` version 4; `review-business-media` version 7.
- Main commits during implementation: `ef766d4753495bce19a49644549660f376bf9e59`, `3c0b451b2ee702e709a4edd9b59c63aa4d183bd1`, `5f9c1b0a561209a176f2f80739cc6666fcde64d9`, `bd35cbd0c7a21d88ad437b4b91c7d52656a8f3c8`, `fe660c8460a6a94b621f09c74e9419080d24985c`, `8f115d7abc8ba7f9470a2be309b6c1ab70c63269`, `63e60f7dc9c121e414df651baa19742d9e9bcd42`, `2a44794f5e0c266f4541805e04d781b05e7001d3`, `29b05bdaadfffbc733900565fdd7c6ea69527a4f`, `4aa304959a399db8280ee158f7346a8bdfd1dcf7`, `634c484168e28cb076c337b97a0e2f2c81090340`, `93485a011db2a7571a9793f244e8636d3dab8e77`, `7ce52bbb8c14392affe0c41f6cb7a4a148ae6663`, `0b510799652d5b5e810682c89011d74be6f5acc1`.
- An intermediate CI run `45897237220` failed on the Admin media status TypeScript union; the type was corrected in commit `0b510799652d5b5e810682c89011d74be6f5acc1`. The corrected commit's CI/deployment are still pending at this checkpoint.
- No existing business gallery URL, Owner account, business record or uploaded media object was modified during implementation. The two schema migrations add constraints/policies/functions only.

## Owner manual acceptance — do not mark complete until confirmed

1. Open `https://hellosadiqabad.com` and sign in as an Owner who has a published Basic or Premium business.
2. Go to Owner Portal → My Businesses → choose that business → Edit Listing → Preview.
3. In Manage photo gallery, upload one JPG/PNG/WebP image smaller than 5 MB. Wait for the success message that it was sent for Admin approval. It must not appear publicly yet.
4. Sign in as Super Admin → Admin → Business Field Approval and find the new gallery photo in the existing business-media review area. Approve it.
5. Refresh the public business profile. The new photo should now appear in its gallery. Return to Owner Portal; its status should say approved/published.
6. Upload a second photo and reject it in Admin. It must never appear on the public profile; Owner history should show rejected.
7. On a managed approved photo, click Request removal. It must remain public while status says removal requested.
8. In Admin's existing business-media review cards, click Approve Owner removal. Refresh the public profile; only that photo should be removed.
9. Check Free plan: gallery upload is unavailable. Basic permits at most 5 and Premium at most 15, counting existing published photos and pending submissions. The server must block attempts beyond the limit.
10. Verify logo/cover change requests still retain their existing 2-per-Pakistan-month combined allowance and current public image remains visible until Admin approval.

**Acceptance status:** implementation is in progress until the corrected CI and matching Pages deployment are green and the Owner confirms the manual tests.
