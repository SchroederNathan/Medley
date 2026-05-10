create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
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
  with check (auth.uid() = follower_id);

create policy "follows_delete_self"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

grant select, insert, delete on public.follows to authenticated;
