-- STATS UNIFORMES D UNE OPERATION (super event ou event autonome).
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk (migrations operation_stats puis operation_stats_sans_bonus -- ce fichier est l etat final).
--
-- Romain, 16/09 : « parties rejouees » = les deux (meme jour ET d un jour a
-- l autre) ; « pic de frequentation » = les deux (par heure ET par jour).
--
-- Une seule fonction, lue par les blocs Tracking de la fiche pro SA et du
-- dashboard pro (components/operations/BlocsOperations.tsx).
--   p_events : les stations de l operation (bornees au pro par l appelant)
--   p_se     : le super event, s il y en a un -> bornage aux dates officielles,
--              fuseau et heure de bascule de la journee d exploitation.
--              Null (event autonome) -> tout l historique, Europe/Paris, bascule 0.
-- Sources : participations (parties), joueurs (sexe = genre F/H, age_tranche).
-- Pas de compte de repondants bonus ici : le chiffre canonique (302 pour NDS)
-- vient de super_event_bonus_resultats (se_reponses) ; participations.bonus_answers
-- en donne un autre (338). Un second chiffre contradictoire ne doit pas exister.

create or replace function public.operation_stats(p_events text[], p_se text default null)
returns jsonb
language sql stable security definer
set search_path to 'public'
as $function$
with cfg as (
  select coalesce(max(s.fuseau), 'Europe/Paris') fz,
         coalesce(max(s.bascule_h), case when p_se is null then 0 else 6 end) bh,
         coalesce(max(s.date_d), '1900-01-01'::date) dd,
         coalesce(max(s.date_f), '2999-12-31'::date) df
  from (select 1) x left join super_events s on s.id = p_se
),
pa as (
  select p.joueur_id, p.bonus_answers,
         jour_exploitation(p.created_at, c.fz, c.bh) jour,
         extract(hour from p.created_at at time zone c.fz)::int heure
  from participations p cross join cfg c
  where p.event_id = any(p_events)
    and (p_se is null or (p.created_at at time zone c.fz)::date between c.dd and c.df)
),
j as (select distinct joueur_id from pa where joueur_id is not null),
mj as (select joueur_id from pa where joueur_id is not null group by joueur_id, jour having count(*) > 1),
aj as (select joueur_id from pa where joueur_id is not null group by joueur_id having count(distinct jour) > 1),
ph as (select heure, count(*) n from pa group by 1),
pj as (select jour, count(*) n from pa group by 1),
jo as (select jj.genre, jj.age_tranche from joueurs jj join j on j.joueur_id = jj.id)
select jsonb_build_object(
  'parties', (select count(*) from pa),
  'joueurs', (select count(*) from j),
  'rejoue_meme_jour', (select count(distinct joueur_id) from mj),
  'rejoue_autre_jour', (select count(*) from aj),
  'pic_heure', (select jsonb_build_object('heure', heure, 'parties', n) from ph order by n desc, heure limit 1),
  'pic_jour',  (select jsonb_build_object('jour', jour, 'parties', n) from pj order by n desc, jour limit 1),
  'par_heure', coalesce((select jsonb_agg(jsonb_build_object('heure', heure, 'parties', n) order by heure) from ph), '[]'::jsonb),
  'par_jour',  coalesce((select jsonb_agg(jsonb_build_object('jour', jour, 'parties', n) order by jour) from pj), '[]'::jsonb),
  'sexe', coalesce((select jsonb_agg(jsonb_build_object('valeur', v, 'n', n)) from (
            select case genre when 'F' then 'Femmes' when 'H' then 'Hommes' else 'Non renseigné' end v, count(*) n
            from jo group by 1) s), '[]'::jsonb),
  'age', coalesce((select jsonb_agg(jsonb_build_object('valeur', v, 'n', n) order by v) from (
            select coalesce(nullif(age_tranche, ''), 'Non renseigné') v, count(*) n
            from jo group by 1) a), '[]'::jsonb)
);
$function$;
grant execute on function public.operation_stats(text[], text) to public, anon, authenticated;
notify pgrst, 'reload schema';
