-- Rangement par event / super event : les deux trous de schema.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- 1. `tirages` ne portait que `super_event_id`. Un tirage fait par un pro sur
--    SON event (autonome) ne pouvait etre rattache a rien : fetchProGains()
--    renvoyait tous les gains du commerce quel que soit l event choisi.
--    Colonne ajoutee, nullable, sans reprise : les 235 lignes existantes sont
--    toutes des tirages de super event (verifie : 235/235 ont super_event_id).
--
-- 2. `station_tracking()` exige un super event (p_se). Un event autonome n avait
--    aucun tracking. `evenement_tracking()` rend le MEME format (stations +
--    totaux) pour une liste d events, sur tout leur historique -- un event
--    autonome n a pas de periode officielle a laquelle se borner.

alter table tirages add column if not exists event_id text;
comment on column tirages.event_id is
  'Event (station) sur lequel le gagnant a ete tire. Renseigne pour les tirages faits sur un event du pro. Null pour les tirages de super event anterieurs au 16/09/2026.';
create index if not exists tirages_event_id_idx on tirages(event_id);

drop function if exists public.attribuer_gain_joueur(uuid, text, text, numeric, text);
create function public.attribuer_gain_joueur(
  p_joueur_id uuid, p_lot_nom text,
  p_partenaire_id text default null, p_valeur numeric default null,
  p_super_event_id text default null, p_event_id text default null)
returns setof tirages
language sql security definer
as $function$
  insert into tirages(type, partenaire_id, lot_nom, lot_valeur, joueur_id, joueur_nom, joueur_email, joueur_tel, ticket_code, retrait_token, super_event_id, event_id)
  select 'grand', p_partenaire_id, p_lot_nom, p_valeur, j.id,
    coalesce(nullif(trim(coalesce(j.prenom,'')||' '||coalesce(j.nom,'')),''), j.email), j.email, j.tel, j.ticket_code,
    replace(gen_random_uuid()::text,'-',''), p_super_event_id, p_event_id
  from joueurs j where j.id = p_joueur_id
  returning *;
$function$;
grant execute on function public.attribuer_gain_joueur(uuid, text, text, numeric, text, text) to public, anon, authenticated;

create or replace function public.evenement_tracking(p_events text[])
returns jsonb
language sql stable security definer
set search_path to 'public'
as $function$
with ev as (
  select e.id, e.nom, e.pro_id from events e where e.id = any(p_events)
),
f as (
  select v.event_id, count(*) flashs,
         count(*) filter (where v.source like 'reseaux-%') digital,
         count(*) filter (where v.source is null or v.source not like 'reseaux-%') physique
  from visites v where v.event_id in (select id from ev) and v.etape is null
  group by 1
),
pic as (
  select distinct on (t.event_id) t.event_id, t.h from (
    select v.event_id, extract(hour from v.created_at at time zone 'Europe/Paris')::int h, count(*) n
    from visites v where v.event_id in (select id from ev) and v.etape is null
    group by 1,2) t
  order by t.event_id, t.n desc
),
multi as (
  select pa.joueur_id from participations pa
  where pa.event_id in (select id from ev)
  group by 1 having count(*) > 1
),
p as (
  select pa.event_id, count(*) parties, count(distinct pa.joueur_id) joueurs,
         count(distinct pa.joueur_id) filter (where pa.joueur_id in (select joueur_id from multi)) rejoue
  from participations pa where pa.event_id in (select id from ev)
  group by 1
)
select jsonb_build_object(
  'stations', coalesce((
    select jsonb_agg(jsonb_build_object(
      'event_id', ev.id,
      'station', coalesce(nullif(btrim(ev.nom),''), ev.id),
      'type', 'event',
      'pro_id', ev.pro_id,
      'flashs', coalesce(f.flashs,0), 'physique', coalesce(f.physique,0), 'digital', coalesce(f.digital,0),
      'parties', coalesce(p.parties,0), 'joueurs', coalesce(p.joueurs,0), 'rejoue', coalesce(p.rejoue,0),
      'heure_pic', pic.h
    ) order by coalesce(f.flashs,0) desc)
    from ev left join f on f.event_id = ev.id left join p on p.event_id = ev.id left join pic on pic.event_id = ev.id
    where coalesce(f.flashs,0) > 0 or coalesce(p.parties,0) > 0), '[]'::jsonb),
  'totaux', jsonb_build_object(
    'flashs',   (select coalesce(sum(flashs),0) from f),
    'physique', (select coalesce(sum(physique),0) from f),
    'digital',  (select coalesce(sum(digital),0) from f),
    'parties',  (select coalesce(sum(parties),0) from p),
    'joueurs',  (select count(distinct pa.joueur_id) from participations pa where pa.event_id in (select id from ev)),
    'rejoue',   (select count(*) from multi))
);
$function$;
grant execute on function public.evenement_tracking(text[]) to public, anon, authenticated;

notify pgrst, 'reload schema';
