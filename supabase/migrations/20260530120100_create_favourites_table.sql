-- A user's hand-picked favourite media (up to 5, ordered) featured on their profile.
-- Mirrors the collection_items shape (media_id + position) but is keyed directly by
-- user_id since each user has a single, flat favourites list.
-- Saved via a replace-all flow (delete then re-insert), so no unique(user_id, position)
-- constraint is used; it would block any future in-place reorder.

create table if not exists public.favourites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  media_id   uuid not null references public.media (id) on delete cascade,
  position   smallint not null check (position between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, media_id)
);

comment on table public.favourites is
  'Up to 5 ordered favourite media items per user, featured on their profile.';

create index if not exists favourites_user_id_idx on public.favourites (user_id);

alter table public.favourites enable row level security;

-- Publicly readable so favourites can appear on other users' profiles.
create policy "favourites_select_authenticated"
  on public.favourites for select
  to authenticated
  using (true);

create policy "favourites_insert_self"
  on public.favourites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "favourites_update_self"
  on public.favourites for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "favourites_delete_self"
  on public.favourites for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.favourites to authenticated;
