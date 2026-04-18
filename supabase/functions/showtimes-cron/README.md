# showtimes-cron

Internal edge function invoked by **pg_cron** (via `pg_net.http_post`) nightly to refresh the next 7 days of TMS showtimes for every location bucket seen in the last 30 days, in one TMS call per bucket.

## Auth

`Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` must match the project service role JWT exactly. `verify_jwt` is disabled so the gateway does not require an end-user JWT; the handler still rejects missing or wrong bearer tokens.

## Behavior

1. Load rows from `showtime_location_buckets` where `last_seen_at >= now() - 30 days`.
2. For each `(lat_bucket, lng_bucket)`, call `syncShowtimesFromTms` with `startDate = UTC today`, `numDays = 7`, radius **15 km**, units `km`, using bucket coordinates as the TMS `lat`/`lng`. TMS returns schedules for the full week in a single response, which is split per-date into `movie_showtimes` and recorded per-date in `showtime_fetches`.

## Deploy

```bash
supabase functions deploy showtimes-cron --no-verify-jwt
```

(Or deploy with `verify_jwt: false` in the dashboard.)

## pg_cron + Vault

The migration `schedule_showtimes_nightly_cron` registers job `refresh-showtimes-nightly` at **04:00 UTC** daily. It expects two Vault secrets:

| Secret name | Value |
|-------------|--------|
| `showtimes_cron_url` | `https://<project-ref>.supabase.co/functions/v1/showtimes-cron` |
| `showtimes_service_role_jwt` | Service role JWT (same as `SUPABASE_SERVICE_ROLE_KEY`) |

Create them in the SQL editor, for example:

```sql
select vault.create_secret('https://YOUR_REF.supabase.co/functions/v1/showtimes-cron', 'showtimes_cron_url');
select vault.create_secret('YOUR_SERVICE_ROLE_JWT', 'showtimes_service_role_jwt');
```

Until both secrets exist, the cron job’s HTTP call will fail (check `net._http_response` / logs).
