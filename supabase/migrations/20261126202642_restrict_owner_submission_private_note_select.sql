-- Remove table-wide read access so internal submission notes cannot be selected by Owners.
-- Preserve RLS and grant only the columns used by the Owner and Admin submission workflows.
revoke select on table public.submissions from authenticated;

grant select (
  id,
  type,
  business_id,
  payload,
  contact_name,
  contact_phone,
  submitted_by,
  status,
  assigned_to,
  created_at,
  updated_at
) on table public.submissions to authenticated;
