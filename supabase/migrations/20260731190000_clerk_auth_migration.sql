-- Migrate identity from Supabase Auth to Clerk (third-party auth).
-- User id columns become text holding Clerk ids ("user_...").
-- RLS reads the Clerk JWT sub claim instead of auth.uid().
-- Fresh start: all user-scoped rows are wiped; auth.users is abandoned.

-- 1. Wipe user-scoped data.
truncate public.user_media, public.favourites, public.collection_items,
         public.collections, public.notifications restart identity cascade;
delete from public.profiles;

-- 2. Drop the auth.users trigger; Clerk owns user creation now.
--    Profile rows are created client-side during onboarding.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 3. Drop views that depend on user_media.user_id (recreated in step 8).
drop view if exists public.user_media_with_details;
drop view if exists public.user_media_with_genres;

-- 4. Drop policies that reference the columns being altered.
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

drop policy if exists "Users can view own media lists" on public.user_media;
drop policy if exists "Users can insert own media" on public.user_media;
drop policy if exists "Users can update own media" on public.user_media;
drop policy if exists "Users can delete own media" on public.user_media;

drop policy if exists "Users can view own collections" on public.collections;
drop policy if exists "Users can insert own collections" on public.collections;
drop policy if exists "Users can update own collections" on public.collections;
drop policy if exists "Users can delete own collections" on public.collections;

drop policy if exists "Users can manage own collection items" on public.collection_items;

drop policy if exists "favourites_select_authenticated" on public.favourites;
drop policy if exists "favourites_insert_self" on public.favourites;
drop policy if exists "favourites_update_self" on public.favourites;
drop policy if exists "favourites_delete_self" on public.favourites;

drop policy if exists "users can create their own notifications" on public.notifications;

-- 5. Drop foreign keys to auth.users (and the profiles-based one being retyped).
alter table public.profiles      drop constraint if exists profiles_id_fkey;
alter table public.user_media    drop constraint if exists user_media_user_id_fkey;
alter table public.collections   drop constraint if exists collections_user_id_fkey;
alter table public.notifications drop constraint if exists notifications_user_id_fkey;
alter table public.favourites    drop constraint if exists favourites_user_id_fkey;

-- 6. Convert uuid -> text.
alter table public.profiles      alter column id      type text using id::text;
alter table public.user_media    alter column user_id type text using user_id::text;
alter table public.collections   alter column user_id type text using user_id::text;
alter table public.notifications alter column user_id type text using user_id::text;
alter table public.favourites    alter column user_id type text using user_id::text;

-- 7. Re-point user foreign keys at profiles(id); never at auth.users.
alter table public.user_media
  add constraint user_media_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
alter table public.collections
  add constraint collections_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
alter table public.favourites
  add constraint favourites_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- 8. Recreate the dependent views (definitions unchanged).
create view public.user_media_with_details as
select um.id,
    um.user_id,
    um.media_id,
    um.status,
    um.user_rating,
    um.review as notes,
    um.progress_data,
    um.added_at,
    um.started_at,
    um.completed_at,
    m.title,
    m.media_type,
    m.poster_url,
    m.duration_minutes,
    m.year,
    m.genres,
    m.description,
    m.rating_average
   from user_media um
     join media m on um.media_id = m.id;

create view public.user_media_with_genres as
select um.id,
    um.user_id,
    um.media_id,
    um.status,
    um.user_rating,
    um.review as notes,
    um.progress_data,
    um.added_at,
    um.started_at,
    um.completed_at,
    m.title,
    m.media_type,
    m.poster_url,
    m.unified_genres,
    m.external_genre_ids,
    m.year,
    m.rating_average
   from user_media um
     join media m on um.media_id = m.id;

-- 9. Recreate policies on the Clerk sub claim.
create policy "Users can view own profile" on public.profiles
  for select to authenticated
  using ((select auth.jwt()->>'sub') = id);
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.jwt()->>'sub') = id);
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.jwt()->>'sub') = id);

create policy "Users can view own media lists" on public.user_media
  for select to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
create policy "Users can insert own media" on public.user_media
  for insert to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);
create policy "Users can update own media" on public.user_media
  for update to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
create policy "Users can delete own media" on public.user_media
  for delete to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

create policy "Users can view own collections" on public.collections
  for select to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
create policy "Users can insert own collections" on public.collections
  for insert to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);
create policy "Users can update own collections" on public.collections
  for update to authenticated
  using ((select auth.jwt()->>'sub') = user_id);
create policy "Users can delete own collections" on public.collections
  for delete to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

create policy "Users can manage own collection items" on public.collection_items
  for all to authenticated
  using (exists (
    select 1 from public.collections
    where collections.id = collection_items.collection_id
      and (select auth.jwt()->>'sub') = collections.user_id
  ));

create policy "favourites_select_authenticated" on public.favourites
  for select to authenticated
  using (true);
create policy "favourites_insert_self" on public.favourites
  for insert to authenticated
  with check ((select auth.jwt()->>'sub') = user_id);
create policy "favourites_update_self" on public.favourites
  for update to authenticated
  using ((select auth.jwt()->>'sub') = user_id)
  with check ((select auth.jwt()->>'sub') = user_id);
create policy "favourites_delete_self" on public.favourites
  for delete to authenticated
  using ((select auth.jwt()->>'sub') = user_id);

create policy "users can create their own notifications" on public.notifications
  for insert to authenticated
  with check (user_id = (select auth.jwt()->>'sub'));

-- 10. Storage: path-scoped policies on the sub claim. The old policies used
--     owner = auth.uid(); storage sets owner from auth.users, which Clerk
--     sessions never populate, so ownership moves to the path convention
--     profiles/<userId>/avatar.jpg.
drop policy if exists "Allow authenticated users to upload profile images" on storage.objects;
drop policy if exists "Allow authenticated users to update their own profile images" on storage.objects;
drop policy if exists "Allow authenticated users to delete their own profile images" on storage.objects;

create policy "Allow authenticated users to upload profile images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.jwt()->>'sub')
  );
create policy "Allow authenticated users to update their own profile images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.jwt()->>'sub')
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.jwt()->>'sub')
  );
create policy "Allow authenticated users to delete their own profile images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = 'profiles'
    and (storage.foldername(name))[2] = (select auth.jwt()->>'sub')
  );

-- 11. The follows table from 20260510160154 was never applied to the live
--     database; create it in its Clerk-era shape.
create table if not exists public.follows (
  follower_id  text not null references public.profiles (id) on delete cascade,
  following_id text not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

comment on table public.follows is
  'Directed follow edges: follower_id follows following_id.';

create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_follower_id_idx  on public.follows (follower_id);

alter table public.follows enable row level security;

create policy "follows_select_authenticated"
  on public.follows for select
  to authenticated
  using (true);

create policy "follows_insert_self"
  on public.follows for insert
  to authenticated
  with check ((select auth.jwt()->>'sub') = follower_id);

create policy "follows_delete_self"
  on public.follows for delete
  to authenticated
  using ((select auth.jwt()->>'sub') = follower_id);

grant select, insert, delete on public.follows to authenticated;

-- 12. RPC: target_user_id becomes text. Signature changes, so drop first.
drop function if exists public.get_cross_media_recommendations(uuid, text, integer);

create function public.get_cross_media_recommendations(target_user_id text, target_media_type text, recommendation_limit integer default 10)
 returns table(id uuid, title text, media_type text, poster_url text, unified_genres text[], year integer, rating_average numeric, recommendation_score numeric)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  user_genre_preferences JSONB;
  compatible_genres TEXT[];
BEGIN
  SELECT jsonb_object_agg(genre, avg_rating)
  INTO user_genre_preferences
  FROM (
    SELECT
      g AS genre,
      AVG(
        CASE WHEN um.user_rating IS NOT NULL THEN um.user_rating::numeric / 5.0
             ELSE 0.6
        END
      ) AS avg_rating
    FROM user_media um
    JOIN media m ON m.id = um.media_id
    JOIN LATERAL unnest(COALESCE(m.unified_genres, ARRAY[]::text[])) g ON true
    WHERE um.user_id = target_user_id
      AND um.status IN ('completed','watching','reading','playing')
      AND m.unified_genres IS NOT NULL
    GROUP BY g
    HAVING COUNT(*) >= 1
  ) gp;

  SELECT COALESCE(array_agg(ug.id), ARRAY[]::text[])
  INTO compatible_genres
  FROM unified_genres ug
  WHERE ug.cross_media_compatible = true;

  IF user_genre_preferences IS NULL OR jsonb_typeof(user_genre_preferences) <> 'object' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    m.id,
    m.title,
    m.media_type,
    m.poster_url,
    m.unified_genres,
    m.year,
    m.rating_average,
    COALESCE((
      SELECT AVG((user_genre_preferences->>g)::numeric)
      FROM unnest(COALESCE(m.unified_genres, ARRAY[]::text[])) g
      WHERE g = ANY(compatible_genres)
        AND user_genre_preferences ? g
    ), 0) AS recommendation_score
  FROM media m
  WHERE m.media_type = target_media_type
    AND COALESCE(m.unified_genres, ARRAY[]::text[]) && compatible_genres
    AND NOT EXISTS (
      SELECT 1 FROM user_media um2
      WHERE um2.user_id = target_user_id
        AND um2.media_id = m.id
    )
  ORDER BY recommendation_score DESC, m.rating_average DESC NULLS LAST
  LIMIT recommendation_limit;
END;
$function$;
