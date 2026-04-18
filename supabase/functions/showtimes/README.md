# showtimes

Authenticated edge function: **cache-aside** local movie showtimes. Reads/writes `movie_showtimes`, `showtime_fetches`, and `showtime_location_buckets`. Calls the [TMS Gracenote API](https://developer.tmsapi.com/docs/read/data_v1_1/movies/Movie_Showings) only when the bucket+date cache is older than **6 hours** or missing.

On a cache miss for any date in the upcoming 7-day window, the function issues a **single** TMS call with `numDays=7` starting at UTC today, populating all seven dates in `movie_showtimes` and `showtime_fetches`. Requests for dates outside that window fall back to a single-day fetch.

## Request

```
GET /functions/v1/showtimes?lat={lat}&lng={lng}&date={YYYY-MM-DD}&windowStart={YYYY-MM-DD}&radius={number}&units={km|mi}
```

- `lat`, `lng` — required (real device coordinates; rows are keyed by rounded buckets ~2 decimals).
- `date` — optional; defaults to **UTC today** if omitted (clients should pass the user’s local calendar date).
- `windowStart` — optional; the client’s local “today” used to decide whether to warm the full 7-day tab window.
- `radius` — default `15` (km), `units` — default `km`.

Requires a valid Supabase **user** JWT (`Authorization: Bearer <access_token>`).

## Response

Same JSON shape as before: `date`, `location`, `theaters[]`, `movies[]` with `media_id` matched from `media` via normalized title + release year.

## Secrets

```bash
supabase secrets set TMS_API_KEY=...
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform.

## Deploy

```bash
supabase functions deploy showtimes
```

Bundle includes `index.ts` and `cache-logic.ts`.

## Related

- Nightly refresh for **today only**: [../showtimes-cron/README.md](../showtimes-cron/README.md)
- DB tables: migration `create_showtimes_cache_tables` (`movie_showtimes`, `showtime_fetches`, `showtime_location_buckets`).

## Quota

TMS calls are amortized per **(lat_bucket, lng_bucket, date)** and shared by all users in that cell. A 6-hour freshness window plus client prefetch keeps detail screens fast without hammering TMS.
