-- 2026-11-20 : proteger le lot de relances rappel-tickets (mode normal). Idempotent.
-- Le secret est genere dans Postgres et vit UNIQUEMENT dans le Vault : jamais affiche, jamais dans le code,
-- jamais en clair dans cron.job. La fonction edge verifie l'en-tete x-flowin-cron via la RPC rappel_cron_verifier.

-- 1. Secret Vault (cree une seule fois)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'rappel_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'rappel_cron_secret');
  end if;
end $$;

-- 2. Verificateur : compare les empreintes SHA-256 (pas de comparaison directe du secret). service_role uniquement.
create or replace function public.rappel_cron_verifier(p_token text) returns boolean
language plpgsql security definer set search_path = public, vault, extensions as $$
declare s text;
begin
  if p_token is null or length(p_token) = 0 then return false; end if;
  select decrypted_secret into s from vault.decrypted_secrets where name = 'rappel_cron_secret' limit 1;
  if s is null then return false; end if;
  return encode(extensions.digest(p_token, 'sha256'), 'hex') = encode(extensions.digest(s, 'sha256'), 'hex');
end $$;
revoke all on function public.rappel_cron_verifier(text) from public, anon, authenticated;
grant execute on function public.rappel_cron_verifier(text) to service_role;

-- 3. Cron : meme horaire et meme URL, appel tickets_rappels_du_jour() conserve, en-tete lu dans le Vault.
select cron.alter_job(
  job_id   := (select jobid from cron.job where jobname = 'tickets-rappels'),
  schedule := '7 9 * * *',
  command  := $cmd$
    select public.tickets_rappels_du_jour();
    select net.http_post(
      url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/rappel-tickets',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1',
        'x-flowin-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'rappel_cron_secret' limit 1)
      ),
      body := '{}'::jsonb);
  $cmd$
);

-- Verification (aucune valeur de secret ne doit apparaitre) :
--   select jobname, schedule, command from cron.job where jobname = 'tickets-rappels';
--
-- ROLLBACK (retirer la protection) :
--   1. Redeployer l'ancienne version de rappel-tickets (sans le controle x-flowin-cron).
--   2. select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'tickets-rappels'), command := $c$
--        select public.tickets_rappels_du_jour();
--        select net.http_post(url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/rappel-tickets',
--          headers := '{"Content-Type":"application/json","apikey":"sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1"}'::jsonb,
--          body := '{}'::jsonb);
--      $c$);
--   3. Facultatif : drop function public.rappel_cron_verifier(text); delete from vault.secrets where name='rappel_cron_secret';
