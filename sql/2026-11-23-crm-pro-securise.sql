-- =============================================================================
-- SÉCURITÉ : CRM du pro (crm_pro) et participants (crm_participants) fermés à l'anonyme (23/11/2026)
-- Doc : docs/SECURITE-crm-pro-2026-11-23.md
--
-- Le trou : crm_pro(p_pro) est SECURITY DEFINER, exécutable par anon, sans contrôle de l'appelant.
-- Avec la clé publique et un identifiant de pro, n'importe qui lit prénom, nom, e-mail, téléphone,
-- code postal, ville de tous les joueurs passés chez ce pro (dont les vrais participants des Nuits du Sud).
-- crm_participants(p_se) a le même défaut, pour TOUS les joueurs (p_se = null).
--
-- Correction (méthode en deux temps, comme `pros`) :
--   - le corps actuel passe dans une fonction interne non exposée (_crm_pro_interne, _crm_participants_interne) ;
--   - crm_pro garde la MÊME signature mais exige : super admin, OU pro propriétaire (pros.auth_id = auth.uid()).
--     Sinon erreur 42501. Les coordonnées (e-mail, téléphone, nom complet) d'un joueur qui n'a pas consenti
--     sont masquées CÔTÉ SERVEUR (même règle que le masquage navigateur limiterAuConsentement : décision du
--     31/10, RGPD) ; le super admin voit tout ;
--   - crm_participants devient réservée au super admin (seul appelant : /dashboard/nds-participants) ;
--   - EXECUTE accordé à authenticated et service_role seulement (plus anon, plus public).
--   - crm_pro_consentants (sql/05, jamais appliquée en production) est retirée de l'usage : crm_pro masque
--     désormais elle-même. Ne pas appliquer la phase 1c de sql/05.
--
-- À APPLIQUER APRÈS le déploiement Vercel du code qui attend une session (le code appelle crm_pro avec la
-- session du navigateur ; avant l'application il continue de marcher, avec masquage navigateur).
-- Idempotent (create or replace ; revoke / grant rejouables). Rollback en pied de fichier.
-- Après l'application : select public.schema_reference_rafraichir();  (changement de droits voulu)
-- =============================================================================

-- ═════════════════════════════ PARTIE A ═════════════════════════════════════
-- PARTIE A DÉBUT

-- A1. Fonction interne : corps ACTUEL de crm_pro (relu en production le 23/11), jamais exposée.
create or replace function public._crm_pro_interne(p_pro text)
 returns table(joueur_id uuid, prenom text, nom text, email text, tel text, code_postal text, ville text, genre text, tranche_age text, optin boolean, source text, origines text[], operations jsonb, nb_parties bigint, nb_tickets bigint, nb_gains bigint, lots text[], premiere date, derniere date)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  with ev as (
    select e.id, e.super_event_id,
           case when e.super_event_id is not null then 'se:' || e.super_event_id else 'ev:' || e.id end as cle,
           coalesce(se.nom, nullif(btrim(e.nom), ''), e.id) as op_nom
      from events e left join super_events se on se.id = e.super_event_id
     where e.pro_id = p_pro and e.super_event_id is distinct from 'se-master-superevent'
  ),
  pa as (
    select p.joueur_id, ev.cle, ev.op_nom, coalesce(p.tickets, 0) as tickets,
           coalesce(p.played_date, p.created_at::date) as jour, nullif(btrim(p.source_qr), '') as source_qr
      from participations p join ev on ev.id = p.event_id where p.joueur_id is not null
  ),
  gt as (
    select t.joueur_id, t.lot_nom, t.created_at::date as jour,
           coalesce('se:' || t.super_event_id, 'ev:' || t.event_id) as cle,
           coalesce(se.nom, nullif(btrim(e.nom), ''), t.super_event_id, t.event_id) as op_nom
      from tirages t left join super_events se on se.id = t.super_event_id left join events e on e.id = t.event_id
     where t.joueur_id is not null and t.statut <> 'annule'
       and (t.event_id in (select id from ev) or t.partenaire_id = (select partenaire_id from pros where id = p_pro))
  ),
  cc as (select c.joueur_id, array_agg(distinct c.source) as sources, min(c.created_at)::date as jour, bool_or(c.optin) as optin
           from clients_commerce c where c.pro_id = p_pro group by c.joueur_id),
  base as (select joueur_id from pa union select joueur_id from gt union select joueur_id from cc),
  ops as (
    select joueur_id, jsonb_agg(jsonb_build_object('cle', cle, 'nom', op_nom, 'parties', n, 'derniere', d) order by d desc nulls last) as operations
      from (select joueur_id, cle, max(op_nom) as op_nom, sum(n) as n, max(d) as d
              from (select joueur_id, cle, op_nom, count(*) as n, max(jour) as d from pa group by joueur_id, cle, op_nom
                    union all
                    select joueur_id, cle, op_nom, 0, max(jour) from gt group by joueur_id, cle, op_nom) u
             group by joueur_id, cle) x
     group by joueur_id
  ),
  gains as (select joueur_id, count(*) as n, array_agg(distinct lot_nom) filter (where lot_nom is not null) as lots from gt group by joueur_id),
  agg as (
    select joueur_id, count(*) as nb_parties, sum(tickets) as nb_tickets, min(jour) as premiere, max(jour) as derniere,
           array_remove(array_agg(distinct source_qr), null) as origines_qr
      from pa group by joueur_id
  )
  select b.joueur_id, j.prenom, j.nom, j.email, j.tel, j.code_postal, j.ville,
         coalesce(nullif(j.genre, ''), nullif(j.sexe, '')),
         coalesce(nullif(j.tranche_age, ''), nullif(j.age_tranche, '')),
         (coalesce(j.optin, false) or coalesce(c.optin, false)), j.source,
         coalesce((select array_agg(distinct x) from unnest(array_remove(coalesce(a.origines_qr, '{}') || array[nullif(btrim(j.source), '')] || coalesce(c.sources, '{}'), null)) x), '{}'),
         o.operations, coalesce(a.nb_parties, 0), coalesce(a.nb_tickets, 0), coalesce(g.n, 0), coalesce(g.lots, '{}'),
         coalesce(a.premiere, c.jour), coalesce(a.derniere, c.jour)
    from base b
    left join joueurs j on j.id = b.joueur_id
    left join agg a on a.joueur_id = b.joueur_id
    left join ops o on o.joueur_id = b.joueur_id
    left join gains g on g.joueur_id = b.joueur_id
    left join cc c on c.joueur_id = b.joueur_id
   order by coalesce(a.derniere, c.jour) desc nulls last
$function$;

revoke all on function public._crm_pro_interne(text) from public, anon, authenticated;

-- A2. crm_pro : même signature, mêmes colonnes ; contrôle de l'appelant + masquage serveur.
create or replace function public.crm_pro(p_pro text)
 returns table(joueur_id uuid, prenom text, nom text, email text, tel text, code_postal text, ville text, genre text, tranche_age text, optin boolean, source text, origines text[], operations jsonb, nb_parties bigint, nb_tickets bigint, nb_gains bigint, lots text[], premiere date, derniere date)
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
#variable_conflict use_column
declare
  v_sa boolean := coalesce(public.est_super_admin(), false);
begin
  /* Super admin, ou pro propriétaire de p_pro. Anonyme, autre pro, id inconnu : refusé. */
  if not v_sa and (
       auth.uid() is null
       or not exists (select 1 from public.pros pr where pr.id = p_pro and pr.auth_id = auth.uid())
     ) then
    raise exception 'acces refuse' using errcode = '42501';
  end if;

  return query
  select c.joueur_id,
         c.prenom,
         case when v_sa or c.optin is true then c.nom
              when nullif(btrim(c.nom), '') is null then null
              else upper(left(btrim(c.nom), 1)) || '.' end,
         case when v_sa or c.optin is true then c.email end,
         case when v_sa or c.optin is true then c.tel end,
         c.code_postal, c.ville, c.genre, c.tranche_age, c.optin,
         c.source, c.origines, c.operations,
         c.nb_parties, c.nb_tickets, c.nb_gains, c.lots, c.premiere, c.derniere
    from public._crm_pro_interne(p_pro) c;
end
$function$;

revoke all on function public.crm_pro(text) from public, anon;
grant execute on function public.crm_pro(text) to authenticated, service_role;

-- A3. crm_participants : coordonnées de TOUS les joueurs, réservée au super admin.
create or replace function public._crm_participants_interne(p_se text default null::text)
 returns table(joueur_id uuid, nom text, prenom text, email text, tel text, code_postal text, ville text, optin boolean, source text, super_event_id text, super_event_nom text, event_id text, event_nom text, pro_id text, pro_nom text, nb_parties bigint, nb_tickets bigint, premiere date, derniere date)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  SELECT
    pa.joueur_id,
    j.nom, j.prenom, j.email, j.tel,
    j.code_postal, j.ville, j.optin, j.source,
    e.super_event_id,
    coalesce(se.nom, '(hors super event)'),
    coalesce(e.id, pa.event_id),
    coalesce(nullif(btrim(e.nom), ''), e.id, pa.event_id, '(station supprimée)'),
    e.pro_id,
    p.nom,
    count(*),
    coalesce(sum(coalesce(pa.tickets, 0)), 0),
    min(coalesce(pa.played_date, pa.created_at::date)),
    max(coalesce(pa.played_date, pa.created_at::date))
  FROM participations pa
  LEFT JOIN joueurs j ON j.id = pa.joueur_id
  LEFT JOIN events  e ON e.id = pa.event_id
  LEFT JOIN super_events se ON se.id = e.super_event_id
  LEFT JOIN pros p ON p.id = e.pro_id
  WHERE p_se IS NULL OR e.super_event_id = p_se
  GROUP BY pa.joueur_id, j.nom, j.prenom, j.email, j.tel, j.code_postal, j.ville,
           j.optin, j.source, e.super_event_id, se.nom, e.id, e.nom, e.pro_id, p.nom, pa.event_id
$function$;

revoke all on function public._crm_participants_interne(text) from public, anon, authenticated;

create or replace function public.crm_participants(p_se text default null::text)
 returns table(joueur_id uuid, nom text, prenom text, email text, tel text, code_postal text, ville text, optin boolean, source text, super_event_id text, super_event_nom text, event_id text, event_nom text, pro_id text, pro_nom text, nb_parties bigint, nb_tickets bigint, premiere date, derniere date)
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
#variable_conflict use_column
begin
  if not coalesce(public.est_super_admin(), false) then
    raise exception 'acces refuse' using errcode = '42501';
  end if;
  return query select * from public._crm_participants_interne(p_se);
end
$function$;

revoke all on function public.crm_participants(text) from public, anon;
grant execute on function public.crm_participants(text) to authenticated, service_role;

notify pgrst, 'reload schema';
-- PARTIE A FIN

-- ═════════════════════════════ ROLLBACK (jamais exécuté automatiquement) ═════════
-- Remet le trou : à n'utiliser que si le CRM pro ou /dashboard/nds-participants cassent et que le code ne peut pas être corrigé.
-- drop function if exists public.crm_pro(text);
-- alter function public._crm_pro_interne(text) rename to crm_pro;
-- grant execute on function public.crm_pro(text) to anon, authenticated, service_role;
-- drop function if exists public.crm_participants(text);
-- alter function public._crm_participants_interne(text) rename to crm_participants;
-- grant execute on function public.crm_participants(text) to anon, authenticated, service_role;
-- notify pgrst, 'reload schema';
-- select public.schema_reference_rafraichir();
