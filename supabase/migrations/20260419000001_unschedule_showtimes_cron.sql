do $$
declare
  jid bigint;
begin
  select jobid into jid from cron.job where jobname = 'refresh-showtimes-nightly';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end $$;
