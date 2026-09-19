-- 19/09/2026 — CRM Participants : LEFT JOIN sur `events` (au lieu d'INNER).
-- APPLIQUE EN PROD le 19/09/2026 (projet flowin-events, ywcqtupgoxfzkddqkztk)
-- via Supabase MCP. Verification prealable (requete ci-dessous) : aucune
-- participation orpheline aujourd'hui -- pas de sous-comptage actif, cette
-- migration est une securite pour l'avenir (une station supprimee plus tard
-- ne fera plus disparaitre ses participations du CRM).
--
-- Romain (19/09) : « je veux voir les gagnants, il y avait des participants
-- qui ont joue 10/15/20 fois ou plus, il y a une erreur ». Un des deux sujets
-- est un defaut d angle de vue (une ligne = une station, pas un total joueur --
-- corrige cote front dans nds-participants/page.tsx par une colonne "Total
-- joueur"). L autre est un vrai risque de sous-comptage cote SQL : `crm_participants`
-- (sql/2026-09-02-crm-participants.sql) joint `events` en INNER JOIN. Le meme
-- fichier documente deja EXACTEMENT ce bug pour le join sur `joueurs` (un
-- joueur sans fiche disparaissait entierement, 639 au lieu de 640) et l a
-- corrige en LEFT JOIN -- le join sur `events` n a jamais recu le meme
-- traitement. Consequence potentielle : toute participation dont l `event_id`
-- ne correspond plus a une ligne `events` existante (station renommee, fusionnee
-- ou supprimee apres coup) disparait ENTIEREMENT de cette liste, y compris
-- toutes les autres participations du meme joueur agregees dans la meme ligne
-- GROUP BY -- exactement le genre d ecart qui ferait passer un joueur a 20
-- parties reelles pour un joueur a 15, ou le ferait disparaitre d une station
-- specifique. A verifier concretement avant d appliquer :
--   SELECT pa.joueur_id, pa.event_id, count(*)
--   FROM participations pa
--   LEFT JOIN events e ON e.id = pa.event_id
--   WHERE e.id IS NULL
--   GROUP BY pa.joueur_id, pa.event_id;
-- Si cette requete renvoie des lignes, le sous-comptage est confirme et cette
-- migration le corrige. Si elle est vide, `events` n a aucune reference
-- orpheline aujourd'hui et le vrai sujet est uniquement l angle de vue
-- (deja traite cote front) -- cette migration reste alors une securite pour
-- l avenir (une station supprimee ne fera plus disparaitre ses participations).

CREATE OR REPLACE FUNCTION public.crm_participants(p_se text DEFAULT NULL::text)
 RETURNS TABLE(joueur_id uuid, nom text, prenom text, email text, tel text, code_postal text, ville text, optin boolean, source text, super_event_id text, super_event_nom text, event_id text, event_nom text, pro_id text, pro_nom text, nb_parties bigint, nb_tickets bigint, premiere date, derniere date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO anon;
GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO service_role;
