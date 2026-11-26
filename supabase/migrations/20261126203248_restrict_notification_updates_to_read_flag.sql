-- Owners may change only their own notification read/unread flag.
-- The existing notifications_update RLS policy continues to scope rows by auth.uid().
revoke update on table public.notifications from authenticated;
grant update (is_read) on table public.notifications to authenticated;
