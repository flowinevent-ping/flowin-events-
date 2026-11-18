-- =============================================================================
-- sql/2026-11-18-tirage-correctifs.sql — Correctifs du tirage au sort (audit 18/11/2026)
-- NON APPLIQUÉ EN BASE. À relire par Romain puis appliquer section par section.
-- Constats : docs/audit-2026-11-17/TEST-TIRAGE-2026-11-18.md
--
-- AVANT D'APPLIQUER : vérifier que l'appelant web de chaque fonction est bien un
-- utilisateur connecté (pro ou SA). Le tirage pro (GagnantsClient) et le tirage SA
-- (TirageSuperEvent) passent par supabase-js avec la session : auth.uid() est rempli.
-- Les pages vanilla (tirage-nds.html, dashboard.html) doivent aussi être connectées,
-- sinon elles perdront l'accès (à contrôler avant la section 1).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ÉCRITURES DE GAGNANTS FERMÉES À anon (constat A et E : un visiteur anonyme
--    peut créer un gagnant avec billet valable, ou annuler un gagnant).
-- -----------------------------------------------------------------------------
revoke execute on function public.attribuer_gain_joueur(uuid, text, text, numeric, text, text) from public, anon;
revoke execute on function public.tirage_super_event(text, integer) from public, anon;
revoke execute on function public.annuler_tirage(bigint) from public, anon;
revoke execute on function public.marquer_notifie(bigint, boolean) from public, anon;
revoke execute on function public.tirage_lot(text, text, numeric, integer) from public, anon;
revoke execute on function public.tirage_soir(date, integer, text) from public, anon;
-- Restent ouverts à anon (lecture / caisse protégée par PIN) : billet_par_token, valider_lot,
-- date_limite_tirage, date_debut_tirage, lot_du_tirage, partenaire_du_tirage.

-- -----------------------------------------------------------------------------
-- 2. attribuer_gain_joueur : garde-fous en base (constat B).
--    - un seul gain non annulé par joueur et par animation (event_id) ou super event ;
--    - quantité du lot (table lots, même nom) respectée ;
--    - verrou par animation (pg_advisory_xact_lock) : deux onglets / deux clics
--      simultanés ne dépassent plus la quantité.
--    Signature et colonnes renvoyées inchangées : lib/dashboard.ts reçoit 0 ligne
--    si le gain est refusé, et affiche déjà « Le tirage n'a pas pu être enregistré ».
--    ATTENTION : appliquer_regle_gain (gains immédiats) appelle aussi cette fonction.
--    Si un même joueur peut gagner plusieurs gains immédiats sur une animation,
--    garder la règle « un gain » uniquement pour type = 'grand' tiré au sort, ou
--    passer un paramètre. À trancher par Romain avant application.
-- -----------------------------------------------------------------------------
create or replace function public.attribuer_gain_joueur(
  p_joueur_id uuid, p_lot_nom text, p_partenaire_id text default null, p_valeur numeric default null,
  p_super_event_id text default null, p_event_id text default null)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
declare v_qte integer;
begin
  perform pg_advisory_xact_lock(hashtext('tirage:' || coalesce(p_event_id, '') || ':' || coalesce(p_super_event_id, '')));

  if exists (select 1 from tirages t
              where t.joueur_id = p_joueur_id and t.statut <> 'annule'
                and ((p_event_id is not null and t.event_id = p_event_id)
                  or (p_super_event_id is not null and t.super_event_id = p_super_event_id))) then
    return;
  end if;

  if p_event_id is not null then
    select sum(coalesce(lo.quantite, 1)) into v_qte
      from lots lo where lo.event_id = p_event_id and coalesce(nullif(btrim(lo.nom), ''), lo.titre) = p_lot_nom;
    if v_qte is not null and (select count(*) from tirages t
         where t.event_id = p_event_id and t.lot_nom = p_lot_nom and t.statut <> 'annule') >= v_qte then
      return;
    end if;
  end if;

  return query
  insert into tirages(type, partenaire_id, lot_nom, lot_valeur, joueur_id, joueur_nom, joueur_email, joueur_tel,
                      ticket_code, retrait_token, super_event_id, event_id)
  select 'grand', p_partenaire_id, p_lot_nom, p_valeur, j.id,
         coalesce(nullif(trim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')), ''), j.email), j.email, j.tel, j.ticket_code,
         replace(gen_random_uuid()::text, '-', ''), p_super_event_id, p_event_id
    from joueurs j where j.id = p_joueur_id
  returning *;
end;
$function$;
grant execute on function public.attribuer_gain_joueur(uuid, text, text, numeric, text, text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. tirage_super_event : verrou par lot (deux SA qui cliquent en même temps
--    dépassaient la quantité) et nom du lot aligné sur le reste du code
--    (lots.nom d'abord, comme lib/operations.ts et tirage_auto_animations ;
--    la fonction actuelle prend lots.titre d'abord : le compteur « restant » de
--    l'écran pro ne voit pas ces gagnants si titre <> nom).
--    Corps identique à la prod pour le reste.
-- -----------------------------------------------------------------------------
create or replace function public.tirage_super_event(p_lot_id text, p_nb integer default 1)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  l record; se record; v_restant int; v_nb int; v_nom text;
begin
  perform pg_advisory_xact_lock(hashtext('tirage-lot:' || coalesce(p_lot_id, '')));
  select lo.*, e.super_event_id as se_id into l
    from lots lo join events e on e.id = lo.event_id
   where lo.id = p_lot_id;
  if not found or l.se_id is null then return; end if;
  v_nom := coalesce(nullif(btrim(l.nom), ''), l.titre);
  select id, coalesce(tirage_global, true) as global into se from super_events where id = l.se_id;

  select greatest(coalesce(l.quantite, 1) - count(*), 0) into v_restant
    from tirages
   where event_id = l.event_id and lot_nom in (v_nom, l.titre) and statut <> 'annule';
  v_nb := least(greatest(coalesce(p_nb, 1), 0), v_restant);
  if v_nb <= 0 then return; end if;

  return query
  with vivier as (
    select pa.joueur_id, greatest(sum(coalesce(pa.tickets, 1)), 1) as tk
      from participations pa
      join events e on e.id = pa.event_id
     where pa.joueur_id is not null
       and e.super_event_id = l.se_id
       and (se.global or pa.event_id = l.event_id)
     group by pa.joueur_id
  ), elig as (
    select v.joueur_id, v.tk
      from vivier v join joueurs j on j.id = v.joueur_id
     where lower(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')) not like '%collin%'
       and lower(btrim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,''))) <> 'lucie giordano'
       and v.joueur_id not in (select t.joueur_id from tirages t
                                where t.super_event_id = l.se_id and t.statut <> 'annule' and t.joueur_id is not null)
  ), pick as (
    select joueur_id from elig order by power(random(), 1.0 / tk) desc limit v_nb
  )
  insert into tirages (type, partenaire_id, lot_nom, lot_valeur, joueur_id, joueur_nom, joueur_email, joueur_tel,
                       ticket_code, retrait_token, super_event_id, event_id)
  select 'grand', l.partenaire_id, v_nom, coalesce(l.valeur_euros, l.valeur), j.id,
         coalesce(nullif(btrim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')), ''), j.email),
         j.email, j.tel, j.ticket_code, replace(gen_random_uuid()::text, '-', ''), l.se_id, l.event_id
    from pick k join joueurs j on j.id = k.joueur_id
  returning *;
end;
$function$;
grant execute on function public.tirage_super_event(text, integer) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4. Rappel (pas de DDL ici) : le tirage programmé n'existe pas en prod.
--    tirage_auto_animations() et le job pg_cron (sql/2026-11-01-tirage-auto-liste-gagnants.sql,
--    sections 6 et 7) ne sont pas appliqués ; pg_cron est maintenant présent.
--    sql/10-resultats-tirage.sql (table tirage_resultats, e-mail « pas tiré ») non appliqué.
-- -----------------------------------------------------------------------------

notify pgrst, 'reload schema';
