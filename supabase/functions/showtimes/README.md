# showtimes

Authenticated edge function for local movie showtimes. Fetches directly from the [TMS Gracenote API](https://developer.tmsapi.com/docs/read/data_v1_1/movies/Movie_Showings) for the requested date, then enriches results with `media_id` by matching against Medley's `media` table.

Showtimes are no longer persisted in Supabase. Caching now lives in TanStack Query on the client.

## Request

```
GET /functions/v1/showtimes?lat={lat}&lng={lng}&date={YYYY-MM-DD}&windowStart={YYYY-MM-DD}&radius={number}&units={km|mi}
```

- `lat`, `lng` — required (real device coordinates).
- `date` — optional; defaults to **UTC today** if omitted (clients should pass the user’s local calendar date).
- `windowStart` — optional and currently ignored; retained for client compatibility.
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
