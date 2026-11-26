# SDK Jobs Phase 5 — Candidate Privacy, Security & Recruitment Operations Design

**Status:** Design-only; no Phase 5 application code, schema, migration, candidate data or fee ledger has been created.  
**Date:** 26 November 2026.  
**Scope source:** `docs/SDK_JOBS_RECRUITMENT_PLAN.md` §§5–9 and `archive/FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md` Phase 5.

## 1. Phase boundary and safety gate

Phase 5 covers candidate intake, consent, interview/suitability records, referrals, referral letters, fee ledger and Admin-configurable office settings.

- Do not collect or import real candidate personal data until the owner approves the consent wording, retention/deletion schedule, staff permission matrix and operational fee settings.
- No online CV upload in the initial release. Candidate brings a physical CV during the approved office hours; Admin records only the minimum structured details needed to process a vacancy.
- No candidate PII in public APIs/views, SEO/social metadata, sitemap, analytics, search indexes, offline downloads, browser storage or application logs.
- No employer login or direct employer access to candidate records. Share only the minimum referral data after separate, recorded candidate consent.
- No payment gateway in the initial release. Do not collect a fee unless an amount and collection policy are explicitly configured and approved.
- This document is an application security/operations design, not a statement of legal compliance. No statutory retention period is assumed here.

## 2. Proposed workflow

1. Candidate contacts the approved Admin WhatsApp number or visits the office during the published schedule.
2. Admin selects an active published SDK Job and records a new candidate intake only after presenting the approved privacy/consent notice.
3. Candidate gives explicit consent for the service to store and use the minimum intake details for that vacancy. Record the consent version, timestamp, method and Admin actor.
4. Admin records interview/screening outcomes and only job-relevant suitability notes.
5. If suitable, Admin requests separate consent to share the candidate's selected details with the specific linked employer for the named vacancy.
6. Only after that referral consent is recorded may the referral record and controlled referral letter be issued.
7. Admin records the referral outcome and closes the case.
8. Retention/deletion jobs act only on records whose owner-approved retention deadline has passed and which are not subject to an approved hold.

A candidate may decline or withdraw. The system must record the withdrawal event, stop future referral sharing and follow the owner-approved deletion/anonymisation schedule.

## 3. Proposed private data boundaries

All tables below are proposals only; names and columns must be reconciled with the live schema and migration ledger before implementation.

| Data area | Minimum proposed content | Access |
|---|---|---|
| Candidate | Internal UUID, name, phone, preferred contact method, area (optional), created/updated timestamps | Explicitly authorised recruitment staff only |
| Application/intake | Candidate ID, SDK Job ID, intake date, current stage, source channel, Admin actor | Explicitly authorised recruitment staff only |
| Consent events | Candidate/application IDs, consent type, exact notice version, timestamp, method, recording Admin, withdrawal timestamp/event | Read-only audit to authorised staff; append-only writes |
| Interview/suitability | Application ID, interview time, job-related notes, suitability outcome and reason, Admin actor | Explicitly authorised recruitment staff only |
| Referral | Application ID, employer/business link, consent event ID, minimum shared fields, referral date, outcome | Referral-authorised staff only; never employer self-service |
| Referral letter | Referral ID, template version, unique random reference, issued/revoked state, issued-by and timestamp | Issuing staff; controlled candidate copy |
| Fee ledger | Application ID, configured amount in minor currency units, currency, state, method/reference, paid/refunded/void timestamps, operator | Separate fee permission; never public |
| Recruitment settings | Free-period end, nullable fee amount, timezone, weekly schedule, WhatsApp contact | Explicit settings permission; changes audited |

Do not collect CNIC, passport, bank/card credentials, full home address, date of birth, health data, family details or unrelated sensitive information in the initial release. Add a field only where a documented operational need exists and the owner approves it.

The physical CV is not uploaded to Storage in this phase. If a later phase requests scanning/upload, it needs a separate threat model, retention schedule, file access design and owner approval.

## 4. Consent model

Consent must be specific, understandable in English and Urdu, and recorded as a versioned event rather than a mutable boolean.

Required separate purposes:
- **Intake/storage consent:** permission to record the minimum details and process the candidate for the selected vacancy.
- **Contact consent:** permission for the recruitment team to contact the candidate about that vacancy.
- **Referral-sharing consent:** permission to share the specifically listed candidate fields with the named employer for the named vacancy.

Do not treat consent to intake as consent to referral. The referral-sharing event must identify the destination employer, vacancy, exact field set, notice version, timestamp and Admin actor. A withdrawal event must stop future sharing and be auditable.

The final notice wording and whether paper, in-person or WhatsApp-recorded consent is accepted require owner approval before the form is built.

## 5. Permission and RLS proposal

The existing `sdk_jobs.manage` permission is for job moderation and employer linkage. Do not silently use it as blanket permission for candidate PII, fees or recruitment settings.

Proposed explicit staff permissions (final names to be confirmed against the current permission registry):
- `sdk_jobs.candidates.view` — view candidate intake and interview records.
- `sdk_jobs.candidates.manage` — create/update intake, record consent and screening, close/withdraw cases.
- `sdk_jobs.referrals.issue` — create referrals and issue/revoke referral letters.
- `sdk_jobs.fees.manage` — configure fee policy and record fee/waiver/refund ledger entries.
- `sdk_jobs.settings.manage` — update office schedule and recruitment settings.

Super Admin retains existing administrative authority. Staff access must be explicit; no staff-type default grant. Every endpoint must independently verify the actor and permission server-side. RLS must deny anon, ordinary authenticated users, Owners and staff without the exact permission. No broad profile/business grants are permitted to make the Admin UI work.

Use user-scoped database writes under RLS where practical. Use narrowly scoped Edge Functions/RPC for controlled document generation, referral issuance, deletion and privileged workflows. Any server-side authorization token must be short-lived, one-time and consumed by a DB trigger, following the proven Phase 4 pattern. Do not put service-role credentials in frontend code.

## 6. Referral letter and verification design

- Generate a controlled bilingual document from an approved template and immutable referral record.
- Reference must be cryptographically random and non-sequential; never expose an internal database UUID as the public verification secret.
- Record template version, issuer, issue time, referral consent event and revocation state.
- The public verification page should reveal only whether a reference is valid/revoked, the issue date and generic service identity. It must not reveal candidate name, phone, CV, interview notes, employer contact or application history.
- The candidate's own copy may contain only the fields approved for the specific referral. Do not claim placement or employment is guaranteed.
- Letter correction/reissue must preserve the original audit trail and reference status.

## 7. Fee and office settings

- Free service remains in effect through **31 January 2027 inclusive**.
- From **1 February 2027**, a fee may apply only if an authorised Admin has configured an owner-approved amount and policy. Until then, display “fee to be confirmed/contact Admin”; do not invent an amount or collect money.
- Candidate alone may pay; no business-owner fee. No payment gateway in the initial release.
- Store amounts as integer minor units (e.g. paisa) with explicit currency; never use floating-point amounts.
- Ledger states should distinguish free-period, waived, pending, paid, refunded and void. Every adjustment records operator, timestamp, reason and reference. Never store card/bank credentials.
- Office schedule defaults to Monday–Friday, 10:00 AM–2:00 PM, Asia/Karachi; Saturday/Sunday closed. Store timezone explicitly and use it consistently for display and boundary checks.
- Admin schedule/fee changes require a dedicated permission and audit event. No office street address may be invented.

## 8. Retention, deletion and withdrawal — owner decision required

No retention duration is set by the current plan. The following must be approved before candidate intake goes live:
- Retention duration for candidates who withdraw before interview.
- Retention duration for unsuccessful/closed applications.
- Retention duration for referred candidates and completed referrals.
- Whether fee-ledger evidence is retained separately from candidate profile data, and for how long.
- Whether an approved dispute/legal hold can pause deletion, who can apply/remove it and how that is audited.

Implementation must support a configurable retention policy, a scheduled deletion/anonymisation process, an auditable deletion event and a dry-run report before any bulk deletion. Do not silently delete a candidate's financial/audit record with the profile; separate personal details from the minimum ledger evidence where appropriate. No automatic destructive retention job until the owner approves the exact policy and a dry-run is reviewed.

## 9. Required acceptance tests before Phase 5 release

- Unauthorised staff, Owners, anon and ordinary authenticated users cannot read candidate, consent, interview, referral or fee records.
- Each permission grants only its own workflow; referral permission cannot edit fee settings and fee permission cannot read interview notes unless separately granted.
- Consent version, method, time, Admin actor and separate referral destination are recorded; withdrawal blocks later sharing.
- Employer receives no candidate data before the specific referral consent; public routes and verification endpoint reveal no PII.
- Referral letter reference is random, unique, revocable and auditable; verification reveals no candidate identity.
- Fee amount unset means no collection action; free-period boundary is tested in Asia/Karachi; only candidate fee is possible.
- Office schedule is correct for weekdays/weekends and daylight/timezone boundaries; the same settings appear on all public instructions.
- Retention dry-run identifies exactly the records proposed for deletion/anonymisation; no deletion occurs before owner approval.
- No candidate data enters offline caches, analytics, search, logs, metadata or public sitemap.
- CI, RLS/privilege tests, Edge Function tests, deployment and authenticated browser acceptance pass.

## 10. Owner approvals required before implementation

1. Exact retention periods for withdrawn, unsuccessful, referred and completed candidates.
2. Final bilingual intake, contact and referral-sharing consent wording/method.
3. Staff permission matrix: which named staff roles may view, intake, interview, refer, issue letters, manage fees and change office settings.
4. Fee amount and collection methods before 1 February 2027; until then amount remains unset.
5. Referral letter template and the exact fields permitted on the letter and public verification page.
6. Confirmation of any physical office address before displaying one.

**Current phase status:** Read-only design proposal only. No Phase 5 database objects, migrations, UI, candidate records, uploaded CVs, fee entries or operational settings have been created.
