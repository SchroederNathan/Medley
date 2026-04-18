-- Location buckets users have requested showtimes for (rounded ~2 decimals)
create table if not exists public.showtime_location_buckets (
  lat_bucket numeric(6, 2) not null,
  lng_bucket numeric(6, 2) not null,
  last_seen_at timestamptz not null default now(),
  primary key (lat_bucket, lng_bucket)
);

comment on table public.showtime_location_buckets is
  'Approximate map cells for TMS showtime caching; updated when any user fetches showtimes.';

create table if not exists public.showtime_fetches (
  lat_bucket numeric(6, 2) not null,
  lng_bucket numeric(6, 2) not null,
  show_date date not null,
  fetched_at timestamptz not null default now(),
  primary key (lat_bucket, lng_bucket, show_date)
);

comment on table public.showtime_fetches is
  'When TMS was last pulled for a bucket+date; used for cache-aside freshness.';

create table if not exists public.movie_showtimes (
  id uuid primary key default gen_random_uuid(),
  media_id uuid references public.media (id) on delete set null,
  tms_id text not null,
  root_id text not null default '',
  title text not null,
  release_year int,
  poster_url text,
  rating text,
  run_time_minutes int,
  genres text[] not null default '{}',
  directors text[] not null default '{}',
  top_cast text[] not null default '{}',
  short_description text,
  theater_id text not null,
  theater_name text not null,
  lat_bucket numeric(6, 2) not null,
  lng_bucket numeric(6, 2) not null,
  show_date date not null,
  date_time text not null,
  bargain boolean not null default false,
  fetched_at timestamptz not null default now()
);

create index if not exists movie_showtimes_media_lookup_idx
  on public.movie_showtimes (media_id, lat_bucket, lng_bucket, show_date);

create index if not exists movie_showtimes_bucket_date_idx
  on public.movie_showtimes (lat_bucket, lng_bucket, show_date);

alter table public.movie_showtimes enable row level security;
alter table public.showtime_fetches enable row level security;
alter table public.showtime_location_buckets enable row level security;

create policy "movie_showtimes_select_authenticated"
  on public.movie_showtimes for select
  to authenticated
  using (true);

grant select on public.movie_showtimes to authenticated;
