-- 02/09/2026 — Supprimer un super event cree par erreur.
-- Applique en prod via Supabase MCP, repris ici EN ENTIER ET EXECUTABLE.
--
-- Romain : « il faut ajouter la fonction supprimer ce super event en cas
-- d erreur ».
-- CONSTAT AVANT D ECRIRE : aucune suppression de super_events n existait dans
-- le repo (zero `.delete()` sur cette table). Ce n est pas une regression, c est
-- a creer — et c est l acte le plus destructeur du dashboard, d ou les
-- garde-fous.
--
-- REFUS, jamais contournables :
--   * l operation porte des PARTICIPATIONS -> on effacerait de l activite
--     joueur reelle ;
--   * elle porte des TIRAGES -> on effacerait des gagnants, donc des
--     engagements pris envers des personnes ;
--   * le nom de confirmation ne correspond pas exactement.
-- Dans ces cas la fonction ne supprime RIEN et dit pourquoi, avec les comptes.
--
-- Les `pros` NE SONT PAS supprimes : un pro existe independamment de
-- l operation a laquelle il a participe, et il peut en avoir d autres.
--
-- VERIFIE PAR APPEL REEL, pas par relecture — les 4 chemins :
--   mauvais nom          -> {ok:false, raison:confirmation, attendu:'Nuits du Sud 2026'}
--   NDS 2026             -> {ok:false, raison:activite, participations:1022, tirages:235}
--   identifiant inconnu  -> {ok:false, raison:introuvable}
--   super event jetable  -> {ok:true, events_supprimes:1}, et plus rien en base

CREATE OR REPLACE FUNCTION public.supprimer_super_event(p_id text, p_confirmation text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_nom text;
  v_participations bigint;
  v_tirages bigint;
  v_events bigint;
BEGIN
  SELECT nom INTO v_nom FROM super_events WHERE id = p_id;
  IF v_nom IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'introuvable');
  END IF;

  IF btrim(coalesce(p_confirmation, '')) <> btrim(v_nom) THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'confirmation',
      'attendu', v_nom);
  END IF;

  SELECT count(*) INTO v_participations
    FROM participations pa JOIN events e ON e.id = pa.event_id
   WHERE e.super_event_id = p_id;

  SELECT count(*) INTO v_tirages FROM tirages WHERE super_event_id = p_id;

  IF v_participations > 0 OR v_tirages > 0 THEN
    RETURN jsonb_build_object('ok', false, 'raison', 'activite',
      'participations', v_participations, 'tirages', v_tirages);
  END IF;

  SELECT count(*) INTO v_events FROM events WHERE super_event_id = p_id;

  DELETE FROM events WHERE super_event_id = p_id;
  DELETE FROM super_events WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'nom', v_nom, 'events_supprimes', v_events);
END;
$function$;

-- PUBLIC obligatoire : ce projet n a AUCUNE session Supabase Auth, tout le
-- dashboard tourne sur la cle anon.
GRANT EXECUTE ON FUNCTION public.supprimer_super_event(text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.supprimer_super_event(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.supprimer_super_event(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.supprimer_super_event(text, text) TO service_role;
