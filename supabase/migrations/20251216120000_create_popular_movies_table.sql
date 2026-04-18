create table if not exists public.popular_movies (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media(id) on delete cascade,
  tmdb_id integer not null,
  rank integer not null check (rank > 0),
  page integer not null check (page > 0),
  position integer not null check (position > 0 and position <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rank),
  unique (media_id),
  unique (tmdb_id)
);

alter table public.popular_movies enable row level security;

drop policy if exists "Popular movies are readable by everyone" on public.popular_movies;
create policy "Popular movies are readable by everyone"
  on public.popular_movies
  for select
  to public
  using (true);

drop policy if exists "Popular movies are writable by service role" on public.popular_movies;
create policy "Popular movies are writable by service role"
  on public.popular_movies
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists popular_movies_rank_idx on public.popular_movies (rank);
create index if not exists popular_movies_media_id_idx on public.popular_movies (media_id);
create index if not exists popular_movies_tmdb_id_idx on public.popular_movies (tmdb_id);


