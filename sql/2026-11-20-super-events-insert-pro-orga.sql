-- 20/11/2026 — E2E prod : un pro auquel le Super Admin a donne le droit « creer_super_event » (pros.droits)
-- ne peut plus creer son super event depuis /pro/nouvelle?type=super : POST /rest/v1/super_events -> 403
-- (42501, RLS). Cause : la politique super_events_insert_sa (securite 19/11) n'autorise que est_super_admin().
-- Les ecritures qui suivent (se_lots via flowin_est_pro_super_event, events via qr_est_proprietaire) sont deja
-- ouvertes au pro proprietaire : seule l'insertion de la ligne super_events manque.
-- Correctif : le pro INSERE seulement une ligne dont pro_id = lui-meme ET dont le droit creer_super_event est actif.
-- A APPLIQUER par Romain (non applique par l'agent). Idempotent.
-- Rollback : drop policy super_events_insert_sa_ou_pro ...; create policy super_events_insert_sa on public.super_events
--            for insert to authenticated with check (public.est_super_admin());

drop policy if exists super_events_insert_sa on public.super_events;
drop policy if exists super_events_insert_sa_ou_pro on public.super_events;
create policy super_events_insert_sa_ou_pro on public.super_events
  for insert to authenticated
  with check (
    public.est_super_admin()
    or (
      pro_id is not null
      and public.flowin_est_pro_proprietaire(pro_id)
      and exists (select 1 from public.pros p
                   where p.id = pro_id
                     and coalesce((p.droits ->> 'creer_super_event')::boolean, false))
    )
  );
