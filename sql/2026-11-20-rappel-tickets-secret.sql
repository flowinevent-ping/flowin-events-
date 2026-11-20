-- 2026-11-20 : protéger le lot de relances rappel-tickets (mode normal).
-- NON APPLIQUÉ. Idempotent. Aucune valeur de secret dans ce fichier.
--
-- ORDRE OBLIGATOIRE (sinon les rappels de demain 09:07 UTC échouent en 403) :
--   1. Choisir une valeur aléatoire longue (ex. 48 caractères) ; ne pas la coller dans le chat ni dans git.
--   2. Supabase > Edge Functions > Secrets : créer RAPPEL_CRON_SECRET = cette valeur.
--   3. Créer le même secret dans le Vault (Dashboard > Vault, nom : rappel_cron_secret), ou en SQL :
--        select vault.create_secret('<la valeur>', 'rappel_cron_secret');   -- à lancer dans l'éditeur SQL, sans l'enregistrer
--   4. Déployer rappel-tickets (version qui exige l'en-tête x-flowin-cron).
--   5. Exécuter CE fichier (met à jour le cron ; la commande lit le secret dans le Vault, rien en clair dans cron.job).
-- Garde-fou : le script s'arrête si le secret Vault n'existe pas.

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'rappel_cron_secret') then
    raise exception 'Secret Vault rappel_cron_secret absent : le créer avant (voir en-tête).';
  end if;
end $$;

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

-- Vérification (ne doit montrer aucune valeur de secret) :
--   select jobname, schedule, command from cron.job where jobname = 'tickets-rappels';
--
-- ROLLBACK (retirer l'en-tête côté cron) :
--   select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'tickets-rappels'), command := $c$
--     select public.tickets_rappels_du_jour();
--     select net.http_post(url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/rappel-tickets',
--       headers := '{"Content-Type":"application/json","apikey":"sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1"}'::jsonb,
--       body := '{}'::jsonb);
--   $c$);
