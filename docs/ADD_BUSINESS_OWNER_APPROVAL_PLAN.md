# Add Business & Owner Approval Plan

**Owner-approved decisions:** 25 November 2026.

## Public Add Business fields
- Business Name English; Business Name Urdu.
- Primary Phone; WhatsApp Number.
- Category (controlled dropdown).
- Area (controlled dropdown).
- Business Description.
- Facilities (controlled checkbox options).
- Business Address English; Business Address Urdu.
- Nearby Landmark.
- Google Maps Location URL.
- Opening hours for every day.
- Business Logo/Profile image.
- Business Banner/Cover image.
- Business Owner Name.
- Gmail.

Do not collect Password or Confirm Password. Supabase invitation flow is used after Admin review; owner sets password through the secure Supabase link.

## Missing taxonomy values
If Category or Area is not present, show bilingual instructions to WhatsApp Admin, request the taxonomy addition, then return and retry. Do not auto-create taxonomy values from public input or accept them as verified categories/areas. Preserve existing IDs and references.

## Field-level Admin moderation
Each submitted field independently supports Pending Review, Approved & Published, Rejected and Unpublished. Admin can approve one field while keeping another hidden; later publish previously unpublished fields. Rejection/unpublishing does not delete submitted values or history. A safe minimum listing rule must prevent incomplete/unsafe public cards.

Private owner/submitter contacts remain Admin-only unless a separately approved public field exists. Every review/status change records actor, timestamp, old/new status and audit context.

## Media
Initial Logo and Cover uploads stay private in pending storage. Admin approves each media asset before it is publicly served. Keep the current approved image visible until a replacement is approved. Validate MIME, size, path, uploader and ownership. Avoid public bucket URLs for pending media.

## Owner monthly image cap
Maximum two image-change requests per business per calendar month for profile/logo and cover images combined. Enforce in database/RPC/Edge Function, not only UI. Use Pakistan-time calendar month boundaries. Show remaining allowance. Admin review is still required; Admin moderation is not blocked by this owner quota. Do not count unrelated gallery/product images unless owner explicitly expands the policy.

## Owner account creation
1. Owner submits business and owner details.
2. Submission remains pending; no Auth user/password is created.
3. Admin reviews all fields and media separately.
4. Admin approves selected public fields.
5. Admin explicitly sends Supabase owner invitation through the existing secure server-side owner registration workflow after inspecting it.
6. Owner follows secure confirmation/invitation link and sets their password with Supabase.
7. Server-side process associates the authenticated owner with only the intended approved business.
8. Failure/rollback and duplicate-invitation cases must be tested.

Preserve existing anti-spam, honeypot, phone validation, moderation submission, permissions, audit logs and rate limits. Do not save private partial form values to local storage.

## Acceptance
- No public password field or password storage.
- No account at initial public submission.
- Pending media cannot be fetched publicly.
- Every field status controls public visibility independently.
- Owner invite is Admin-authorized and audited.
- Monthly image quota is enforced server-side.
- Existing business/submission data and workflows remain intact.
