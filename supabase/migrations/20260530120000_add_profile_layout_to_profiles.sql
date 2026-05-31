-- Adds a per-user profile layout document driving the customizable profile blocks.
-- Stored as JSONB alongside the existing media_preferences JSONB on profiles.
-- Nullable: the app supplies a default layout when this is null, so defaults can
-- change without a backfill.

alter table public.profiles
  add column if not exists profile_layout jsonb;

comment on column public.profiles.profile_layout is
  'Ordered list of customizable profile blocks: { version, blocks: [{ id, kind, enabled }] }.';
