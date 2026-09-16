-- CRM COMPLET DU PRO — 16/09/2026 (nuit), demande de Romain :
-- « un CRM par event ok, mais un CRM ou il y a tous les events et actions
--   confondus, avec les origines, les gagnants, les participants, le nombre
--   de participations, pour envoyer des relances, des messages ».
--
-- Une ligne par joueur ayant joue sur une operation du pro (events du pro,
-- gabarit master exclu) OU ayant gagne un lot du pro (un gagnant du grand
-- tirage d un super event n a pas forcement joue chez ce commerce). Pour chaque joueur :
--   * ses coordonnees et son opt-in (table joueurs) ;
--   * ses origines : source du joueur + source_qr de chaque participation ;
--   * ses operations (event autonome ou super event), avec parties et derniere date ;
--   * ses gains (tirages non annules sur les events du pro ou du commerce du pro).
-- Lecture seule, meme exposition que crm_participants (cle anon, voir ce fichier).

create or replace function public.crm_pro(p_pro text)
returns table(
  joueur_id uuid, prenom text, nom text, email text, tel text,
  code_postal text, ville text, genre text, tranche_age text, optin boolean,
  source text, origines text[], operations jsonb,
  nb_parties bigint, nb_tickets bigint, nb_gains bigint, lots text[],
  premiere date, derniere date
)
language sql stable security definer
set search_path to 'public'
as $function$
  with ev as (
    select e.id, e.super_event_id,
           case when e.super_event_id is not null then 'se:' || e.super_event_id else 'ev:' || e.id end as cle,
           coalesce(se.nom, nullif(btrim(e.nom), ''), e.id) as op_nom
      from events e
      left join super_events se on se.id = e.super_event_id
     where e.pro_id = p_pro
       and e.super_event_id is distinct from 'se-master-superevent'
  ),
  pa as (
    select p.joueur_id, ev.cle, ev.op_nom, coalesce(p.tickets, 0) as tickets,
           coalesce(p.played_date, p.created_at::date) as jour, nullif(btrim(p.source_qr), '') as source_qr
      from participations p
      join ev on ev.id = p.event_id
     where p.joueur_id is not null
  ),
  gt as (
    select t.joueur_id, t.lot_nom, t.created_at::date as jour,
           coalesce('se:' || t.super_event_id, 'ev:' || t.event_id) as cle,
           coalesce(se.nom, nullif(btrim(e.nom), ''), t.super_event_id, t.event_id) as op_nom
      from tirages t
      left join super_events se on se.id = t.super_event_id
      left join events e on e.id = t.event_id
     where t.joueur_id is not null and t.statut <> 'annule'
       and (t.event_id in (select id from ev)
            or t.partenaire_id = (select partenaire_id from pros where id = p_pro))
  ),
  base as (select joueur_id from pa union select joueur_id from gt),
  ops as (
    select joueur_id, jsonb_agg(jsonb_build_object('cle', cle, 'nom', op_nom, 'parties', n, 'derniere', d) order by d desc nulls last) as operations
      from (
        select joueur_id, cle, max(op_nom) as op_nom, sum(n) as n, max(d) as d
          from (
            select joueur_id, cle, op_nom, count(*) as n, max(jour) as d from pa group by joueur_id, cle, op_nom
            union all
            select joueur_id, cle, op_nom, 0, max(jour) from gt group by joueur_id, cle, op_nom
          ) u
         group by joueur_id, cle
      ) x
     group by joueur_id
  ),
  gains as (
    select joueur_id, count(*) as n, array_agg(distinct lot_nom) filter (where lot_nom is not null) as lots
      from gt group by joueur_id
  ),
  agg as (
    select joueur_id, count(*) as nb_parties, sum(tickets) as nb_tickets, min(jour) as premiere, max(jour) as derniere,
           array_remove(array_agg(distinct source_qr), null) as origines_qr
      from pa group by joueur_id
  )
  select b.joueur_id, j.prenom, j.nom, j.email, j.tel, j.code_postal, j.ville,
         coalesce(nullif(j.genre, ''), nullif(j.sexe, '')),
         coalesce(nullif(j.tranche_age, ''), nullif(j.age_tranche, '')),
         j.optin, j.source,
         coalesce((select array_agg(distinct x) from unnest(array_remove(coalesce(a.origines_qr, '{}') || array[nullif(btrim(j.source), '')], null)) x), '{}'),
         o.operations, coalesce(a.nb_parties, 0), coalesce(a.nb_tickets, 0), coalesce(g.n, 0), coalesce(g.lots, '{}'),
         a.premiere, a.derniere
    from base b
    left join joueurs j on j.id = b.joueur_id
    left join agg a on a.joueur_id = b.joueur_id
    left join ops o on o.joueur_id = b.joueur_id
    left join gains g on g.joueur_id = b.joueur_id
   order by a.derniere desc nulls last
$function$;

grant execute on function public.crm_pro(text) to public;
grant execute on function public.crm_pro(text) to anon;
grant execute on function public.crm_pro(text) to authenticated;
grant execute on function public.crm_pro(text) to service_role;

notify pgrst, 'reload schema';
