-- LOT 3 — referentiel 34 et 35 : tirage au sort d un super event, depuis sa fiche.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- Le seul tirage de super event etait tirage_lot(), ecrit pour Nuits du Sud
-- (tranches d age et codes postaux par commerce en dur) et appele par
-- tirage-nds.html. tirage_super_event() est le tirage generique :
--   - le lot est une ligne de `lots`, sur une station du super event ;
--   - vivier : les joueurs ayant joue sur le super event (tirage global) ou sur
--     la station du lot (tirage par station, super_events.tirage_global = false),
--     ponderes par leurs tickets ; comptes de test exclus (memes regles que
--     fetchJoueursEligibles) ; un joueur deja gagnant sur l operation n est pas
--     retire ;
--   - quantite plafonnee au reste du lot ;
--   - le gagnant est ecrit avec event_id (station) ET super_event_id, en
--     « a confirmer » : le SA appelle, puis confirme (marquer_notifie).

create or replace function public.tirage_super_event(p_lot_id text, p_nb integer default 1)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  l record; se record; v_restant int; v_nb int;
begin
  select lo.*, e.super_event_id as se_id into l
    from lots lo join events e on e.id = lo.event_id
   where lo.id = p_lot_id;
  if not found or l.se_id is null then return; end if;
  select id, coalesce(tirage_global, true) as global into se from super_events where id = l.se_id;

  select greatest(coalesce(l.quantite, 1) - count(*), 0) into v_restant
    from tirages
   where event_id = l.event_id and lot_nom = coalesce(l.titre, l.nom) and statut <> 'annule';
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
  select 'grand', l.partenaire_id, coalesce(l.titre, l.nom), coalesce(l.valeur_euros, l.valeur), j.id,
         coalesce(nullif(btrim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')), ''), j.email),
         j.email, j.tel, j.ticket_code, replace(gen_random_uuid()::text, '-', ''), l.se_id, l.event_id
    from pick k join joueurs j on j.id = k.joueur_id
  returning *;
end;
$function$;
grant execute on function public.tirage_super_event(text, integer) to public, anon, authenticated;

notify pgrst, 'reload schema';
