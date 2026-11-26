-- Staff assignment is internal metadata and is not required by current Owner/Admin client queries.
revoke select (assigned_to) on table public.submissions from authenticated;
