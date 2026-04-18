alter table public.popular_movies
  drop column if exists page,
  drop column if exists position;


