# showtimes

Thin authenticated proxy to the [TMS Gracenote movies/showings API](https://developer.tmsapi.com/docs/read/data_v1_1/movies/Movie_Showings). No DB joins, no caching here — TanStack Query on the client owns the cache (`staleTime: 1h`, `gcTime: 6h`).

## Request

```
GET /functions/v1/showtimes?lat={lat}&lng={lng}&date={YYYY-MM-DD}&radius={number}&units={km|mi}
```

- `lat`, `lng` — required (real device coordinates).
- `date` — optional; defaults to **UTC today** if omitted (clients should pass the user's local calendar date).
- `radius` — default `15`. `units` — `km` (default) or `mi`.

Requires a valid Supabase **user** JWT (`Authorization: Bearer <access_token>`).

## Response

```
{
  "date": "2026-05-10",
  "movies": [
    {
      "tmsId": "...",
      "title": "...",
      "releaseYear": 2026,
      "runTimeMinutes": 132,
      "rating": "PG-13",
      "posterUrl": "https://...",
      "shortDescription": "...",
      "showtimes": [
        { "theaterId": "...", "theaterName": "...", "dateTime": "2026-05-10T19:30", "bargain": false }
      ]
    }
  ]
}
```

Showtimes are filtered server-side to `dateTime.slice(0,10) === date`. The client matches a specific `media` record to a returned movie by normalized title + release year.

## Errors

Non-2xx responses include `{ error, source?, upstreamStatus? }`:

- `502 + source: "tms"` — TMS returned non-2xx; `upstreamStatus` carries the TMS status.
- `502 + source: "tms-connection"` — `fetch` to TMS threw (DNS/TLS/refused).
- `500 + source: "server"` — local error (auth, missing secret, etc.).

The full upstream URL (with `api_key` redacted), status, and body are logged via `console.error` for debugging.

## Secrets

```bash
supabase secrets set TMS_API_KEY=...
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided by the platform.

## Deploy

```bash
supabase functions deploy showtimes
```
