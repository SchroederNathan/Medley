-- Nightly refresh via pg_net. Requires Vault secrets:
--   showtimes_cron_url = https://<ref>.supabase.co/functions/v1/showtimes-cron
--   showtimes_service_role_jwt = <service_role JWT>
-- Create via Supabase SQL (vault.create_secret) or Dashboard.

do $$
declare
  jid bigint;
begin
  select jobid into jid from cron.job where jobname = 'refresh-showtimes-nightly';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end $$;

select cron.schedule(
  'refresh-showtimes-nightly',
  '0 4 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'showtimes_cron_url'
      limit 1
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'showtimes_service_role_jwt'
        limit 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
