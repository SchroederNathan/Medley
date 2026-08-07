-- Follow-up to 20260731190000_clerk_auth_migration.sql.
-- Three RLS gaps found while auditing the Clerk cutover.

-- 1. Step 8 of the Clerk migration recreated these views without
--    security_invoker, so they run as their owner (postgres). user_media does
--    not force RLS, and the owner bypasses it, so selecting through a view
--    skipped the user_media policies. Both views grant select to
--    `authenticated`, so any signed-in user could read every user's library,
--    ratings, and notes. security_invoker makes a view apply the caller's
--    policies instead. Needs PostgreSQL 15 or later; the project runs 17.4.
alter view public.user_media_with_details set (security_invoker = true);
alter view public.user_media_with_genres set (security_invoker = true);

-- 2. profiles had no delete policy, so a user could never remove their own row.
--    Clerk allows self-serve account deletion
--    (user_settings.actions.delete_self), which left an orphaned profile and
--    all of its child rows behind. Every user-scoped foreign key is
--    `on delete cascade`, so this one delete also clears user_media,
--    collections, collection_items, favourites, follows, and notifications.
--    It does NOT remove the avatar in the profile-images bucket. Delete that
--    storage object first.
create policy "Users can delete own profile" on public.profiles
  for delete to authenticated
  using ((select auth.jwt()->>'sub') = id);

-- 3. notifications only had an insert policy, so a user could write a row and
--    never read it back. The table has no read/seen column, so select is the
--    only access a client needs today.
create policy "Users can view own notifications" on public.notifications
  for select to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
