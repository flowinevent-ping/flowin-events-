-- LOT 2 — referentiel 8 : « gain immediat / apres tirage » enfin applique par les jeux.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk (+ garde roue : appliquer_regle_gain_roue).
--
-- Le parcours « Creer mon animation » enregistrait la regle (cfg.regleRecompense :
-- mode tousLesX / aleatoire, everyX, probabilite) et le type de chaque lot
-- (lots.note « Type : gain instantané »), mais aucun jeu ne la lisait.
--
-- appliquer_regle_gain(joueur, event, lot_nom) est appelee par les parcours juste
-- apres l enregistrement de la participation :
--   - super event : rien (tirage au sort uniquement, referentiel 34) ;
--   - p_lot_nom renseigne (roue : segment gagnant) : ce lot est attribue s il
--     reste en quantite ;
--   - sinon, si l event a des lots « gain instantané » : regle appliquee
--     (tous les X joueurs, ou probabilite en %), premier lot encore disponible.
-- Le gain part dans `tirages` via attribuer_gain_joueur() : meme billet
-- (lot.html?t=), meme validation par PIN, meme liste de gagnants.

create or replace function public.appliquer_regle_gain(p_joueur_id uuid, p_event_id text, p_lot_nom text default null)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  e record; r jsonb; v_mode text; v_x int; v_p numeric; v_n int;
  l record; t record; v_gagne boolean := false;
begin
  select id, super_event_id, cfg, pro_id, module into e from events where id = p_event_id;
  if not found or e.super_event_id is not null then
    return jsonb_build_object('gagne', false);
  end if;

  -- Un joueur ne gagne qu une fois par jour sur un event.
  if exists (select 1 from tirages where event_id = p_event_id and joueur_id = p_joueur_id
               and statut <> 'annule' and created_at::date = current_date) then
    return jsonb_build_object('gagne', false);
  end if;

  if p_lot_nom is not null and btrim(p_lot_nom) <> '' then
    select lo.* into l from lots lo
     where lo.event_id = p_event_id and lower(btrim(coalesce(lo.titre, lo.nom))) = lower(btrim(p_lot_nom))
       and coalesce(lo.quantite, 1) > (select count(*) from tirages ti where ti.event_id = p_event_id
                                        and ti.lot_nom = coalesce(lo.titre, lo.nom) and ti.statut <> 'annule')
     limit 1;
    if not found then return jsonb_build_object('gagne', false); end if;
    v_gagne := true;
  else
    -- Roue : seul le segment gagnant attribue un lot (jamais la regle).
    if e.module = 'spin' then return jsonb_build_object('gagne', false); end if;
    r := e.cfg -> 'regleRecompense';
    if r is null or jsonb_typeof(r) <> 'object' then return jsonb_build_object('gagne', false); end if;
    v_mode := coalesce(r->>'mode', 'aleatoire');
    select lo.* into l from lots lo
     where lo.event_id = p_event_id and coalesce(lo.note, '') ilike '%instantan%'
       and coalesce(lo.quantite, 1) > (select count(*) from tirages ti where ti.event_id = p_event_id
                                        and ti.lot_nom = coalesce(lo.titre, lo.nom) and ti.statut <> 'annule')
     order by lo.id
     limit 1;
    if not found then return jsonb_build_object('gagne', false); end if;

    if v_mode = 'tousLesX' then
      v_x := greatest(coalesce(nullif(r->>'everyX', '')::int, 10), 1);
      select count(*) into v_n from participations where event_id = p_event_id;
      v_gagne := v_n > 0 and v_n % v_x = 0;
    else
      v_p := least(greatest(coalesce(nullif(r->>'probabilite', '')::numeric, 0), 0), 100);
      v_gagne := random() * 100 < v_p;
    end if;
  end if;

  if not v_gagne then return jsonb_build_object('gagne', false); end if;

  select * into t from attribuer_gain_joueur(
    p_joueur_id, coalesce(l.titre, l.nom), l.partenaire_id,
    coalesce(l.valeur_euros, l.valeur), null, p_event_id) limit 1;
  if t.id is null then return jsonb_build_object('gagne', false); end if;

  return jsonb_build_object('gagne', true, 'lot', coalesce(l.titre, l.nom),
                            'conditions', l.conditions,
                            'ticket_code', t.ticket_code, 'retrait_token', t.retrait_token);
end;
$function$;
grant execute on function public.appliquer_regle_gain(uuid, text, text) to public, anon, authenticated;

notify pgrst, 'reload schema';
