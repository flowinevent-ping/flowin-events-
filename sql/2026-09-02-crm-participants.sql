-- 02/09/2026 — CRM Participants : range par super event, sous-categorie event,
-- avec l identifiant SOURCE.
-- Applique en prod via Supabase MCP, repris ici EN ENTIER ET EXECUTABLE pour que
-- le schema du repo suffise a reconstruire la base. (Le 01/09, une migration
-- n avait ete deposee ici qu en COMMENTAIRES : une reconstruction depuis sql/
-- aurait laisse une RPC dans son ancienne signature et casse tous les ecrans qui
-- l appellent. Ne plus jamais deposer un fichier non executable.)
--
-- Romain : « participants super events doit etre range par super event en
-- sous-categorie par event, ou acces total appele CRM participants avec les
-- identifiants sources (nds, paques, etc.) ».
--
-- La RPC existante `super_event_participants` ne porte NI l event NI la source :
-- elle agrege par joueur sur un seul super event. Elle sert les rapports et
-- N EST PAS TOUCHEE. Celle-ci est une seconde lecture, cote CRM :
--   * une ligne par (joueur, event) — ce qui permet de repondre a « qui est
--     passe a la Caisse 2 » ;
--   * p_se NULL = acces total, chaque ligne portant son operation d origine ;
--   * les events sans super event (Paques, Croix Rouge) ne sont pas perdus :
--     ils forment leur propre categorie, « (hors super event) ».
--
-- LE JOIN SUR `joueurs` EST VOLONTAIREMENT EXTERNE. En interne, il perdait les
-- participations dont le joueur n a pas de fiche : un joueur de NDS 2026
-- (e350e79d…) a 3 participations reelles sur Bar 1/2/3 et AUCUNE ligne dans
-- `joueurs` — le CRM affichait 639 la ou l ecran existant affiche 640. Une
-- participation sans fiche joueur est une anomalie a voir, pas a escamoter.
-- Verifie apres correctif : 640 = 640.
--
-- Aucun chiffre publiable ne passe par ici : c est une liste, pas un rapport.

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
    e.id,
    coalesce(nullif(btrim(e.nom), ''), e.id),
    e.pro_id,
    p.nom,
    count(*),
    coalesce(sum(coalesce(pa.tickets, 0)), 0),
    min(coalesce(pa.played_date, pa.created_at::date)),
    max(coalesce(pa.played_date, pa.created_at::date))
  FROM participations pa
  LEFT JOIN joueurs j ON j.id = pa.joueur_id
  JOIN events  e ON e.id = pa.event_id
  LEFT JOIN super_events se ON se.id = e.super_event_id
  LEFT JOIN pros p ON p.id = e.pro_id
  WHERE p_se IS NULL OR e.super_event_id = p_se
  GROUP BY pa.joueur_id, j.nom, j.prenom, j.email, j.tel, j.code_postal, j.ville,
           j.optin, j.source, e.super_event_id, se.nom, e.id, e.nom, e.pro_id, p.nom
$function$;

-- PUBLIC obligatoire : ce projet n a AUCUNE session Supabase Auth, tout le
-- dashboard tourne sur la cle anon. Restreindre a `authenticated` casse la prod
-- en silence (regression vecue le 31/08 sur 2 RPC).
GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO anon;
GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_participants(text) TO service_role;
