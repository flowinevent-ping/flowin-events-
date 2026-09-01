-- 01/09/2026 — « Toutes les dates » doit vouloir dire toutes les dates.
-- Applique en prod via Supabase MCP le 01/09/2026 (migration
-- station_tracking_option_tout_historique), repris ici EN ENTIER et EXECUTABLE
-- pour que le schema du repo suffise a reconstruire la base.
--
-- CONSTAT (verifie en base, pas suppose) : le tableau « Tracking par station »
-- clippait TOUJOURS sur date_d..date_f du super event des que p_jour etait NULL,
-- y compris apres un clic sur « Toutes les dates ». Sur NDS 2026 :
--   flashs   2 446 affiches  vs 2 847 reels   (401 invisibles)
--   jours       10 affiches  vs    53 reels
--   stations    18 listees   vs    21 reelles
-- Les trois manquantes (NDS · Le Bar, NDS · Brigade Verte, NDS · Les Caisses)
-- ont toute leur activite hors periode : elles retombaient a 0 flash et etaient
-- ecartees par le WHERE final. Elles n apparaissaient sur AUCUN ecran.
--
-- CORRECTIF : nouveau parametre p_tout (defaut false). Les appels existants
-- (fiches pro et partenaire) gardent exactement le comportement d avant ; seul
-- l appelant qui veut dire « tout l historique » passe p_tout => true.
-- Les « chiffres publiables » ne passent pas par cette RPC : ils restent bornes.
--
-- L ancienne signature a 4 arguments est supprimee : la garder rendrait un appel
-- a 4 arguments ambigu avec la nouvelle (dont le 5e a un defaut).
--
-- VERIFIE PAR APPEL REEL, pas par relecture :
--   station_tracking('se-nds-2026')                          -> 2446 flashs, 18 stations (inchange)
--   station_tracking('se-nds-2026',null,null,null,true)      -> 2847 flashs, 21 stations
--   station_tracking('se-nds-2026',null,null,'2026-07-18')   ->  329 flashs, 13 stations (inchange)
--
-- POINTS DE VIGILANCE :
--   * les grants ci-dessous doivent etre reappliques apres tout DROP : PUBLIC est
--     obligatoire, ce projet n a pas de session Supabase Auth, tout le dashboard
--     tourne sur la cle anon. Restreindre a `authenticated` casse la prod en
--     silence (regression vecue le 31/08 sur 2 RPC).
--   * p_tout n a d effet que si p_jour est NULL : un jour precis reste un jour
--     d exploitation borne par bascule_h.

DROP FUNCTION IF EXISTS public.station_tracking(text, text, text, date);

CREATE OR REPLACE FUNCTION public.station_tracking(p_se text DEFAULT 'se-nds-2026'::text, p_pro text DEFAULT NULL::text, p_partenaire text DEFAULT NULL::text, p_jour date DEFAULT NULL::date, p_tout boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH cfg AS (
  SELECT coalesce(fuseau,'Europe/Paris') fz, coalesce(bascule_h,6) bh,
         coalesce(date_d, '1900-01-01'::date) AS date_d,
         coalesce(date_f, '2999-12-31'::date) AS date_f
  FROM super_events WHERE id = p_se
),
ev AS (
  SELECT e.id, e.nom, e.pro_id,
         'pt-' || regexp_replace(e.id,'^ev-[a-z0-9]+-','') AS pt_probable
  FROM events e
  WHERE e.super_event_id = p_se
    AND (p_pro IS NULL OR e.pro_id = p_pro)
    AND (p_partenaire IS NULL
         OR 'pt-' || regexp_replace(e.id,'^ev-[a-z0-9]+-','') = p_partenaire)
),
-- Trois modes : un jour d exploitation precis (bascule_h incluse) si p_jour est
-- fourni ; sinon tout l historique si p_tout ; sinon la periode officielle.
f AS (
  SELECT v.event_id, count(*) flashs,
         count(*) FILTER (WHERE v.source LIKE 'reseaux-%') digital,
         count(*) FILTER (WHERE v.source IS NULL OR v.source NOT LIKE 'reseaux-%') physique
  FROM visites v CROSS JOIN cfg c
  WHERE v.event_id IN (SELECT id FROM ev) AND v.etape IS NULL
    AND (
      (p_jour IS NULL AND (p_tout OR (v.created_at AT TIME ZONE c.fz)::date BETWEEN c.date_d AND c.date_f))
      OR (p_jour IS NOT NULL AND jour_exploitation(v.created_at, c.fz, c.bh) = p_jour)
    )
  GROUP BY 1
),
pic AS (
  SELECT DISTINCT ON (t.event_id) t.event_id, t.h, t.n FROM (
    SELECT v.event_id,
           extract(hour FROM v.created_at AT TIME ZONE c.fz)::int h, count(*) n
    FROM visites v CROSS JOIN cfg c
    WHERE v.event_id IN (SELECT id FROM ev) AND v.etape IS NULL
      AND (
        (p_jour IS NULL AND (p_tout OR (v.created_at AT TIME ZONE c.fz)::date BETWEEN c.date_d AND c.date_f))
        OR (p_jour IS NOT NULL AND jour_exploitation(v.created_at, c.fz, c.bh) = p_jour)
      )
    GROUP BY 1,2) t
  ORDER BY t.event_id, t.n DESC
),
multi AS (
  SELECT pa.joueur_id FROM participations pa CROSS JOIN cfg c
  WHERE pa.event_id IN (SELECT id FROM events WHERE super_event_id = p_se)
    AND (
      (p_jour IS NULL AND (p_tout OR (pa.created_at AT TIME ZONE c.fz)::date BETWEEN c.date_d AND c.date_f))
      OR (p_jour IS NOT NULL AND jour_exploitation(pa.created_at, c.fz, c.bh) = p_jour)
    )
  GROUP BY 1 HAVING count(*) > 1
),
p AS (
  SELECT pa.event_id, count(*) parties, count(DISTINCT pa.joueur_id) joueurs,
         count(DISTINCT pa.joueur_id) FILTER (WHERE pa.joueur_id IN (SELECT joueur_id FROM multi)) rejoue
  FROM participations pa CROSS JOIN cfg c
  WHERE pa.event_id IN (SELECT id FROM ev)
    AND (
      (p_jour IS NULL AND (p_tout OR (pa.created_at AT TIME ZONE c.fz)::date BETWEEN c.date_d AND c.date_f))
      OR (p_jour IS NOT NULL AND jour_exploitation(pa.created_at, c.fz, c.bh) = p_jour)
    )
  GROUP BY 1
)
SELECT jsonb_build_object(
  'stations', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'event_id', ev.id,
      'station',  coalesce(nullif(btrim(ev.nom),''), ev.id),
      'type',     CASE WHEN EXISTS (SELECT 1 FROM partenaires pa WHERE pa.id = ev.pt_probable)
                       THEN 'partenaire' ELSE 'nds' END,
      'pro_id',   ev.pro_id,
      'flashs',   coalesce(f.flashs,0),
      'physique', coalesce(f.physique,0),
      'digital',  coalesce(f.digital,0),
      'parties',  coalesce(p.parties,0),
      'joueurs',  coalesce(p.joueurs,0),
      'rejoue',   coalesce(p.rejoue,0),
      'heure_pic', pic.h
    ) ORDER BY coalesce(f.flashs,0) DESC)
    FROM ev LEFT JOIN f ON f.event_id = ev.id
            LEFT JOIN p ON p.event_id = ev.id
            LEFT JOIN pic ON pic.event_id = ev.id
    WHERE coalesce(f.flashs,0) > 0 OR coalesce(p.parties,0) > 0), '[]'::jsonb),
  'totaux', jsonb_build_object(
    'flashs',   (SELECT coalesce(sum(flashs),0)   FROM f),
    'physique', (SELECT coalesce(sum(physique),0) FROM f),
    'digital',  (SELECT coalesce(sum(digital),0)  FROM f),
    'parties',  (SELECT coalesce(sum(parties),0)  FROM p),
    'joueurs',  (SELECT count(DISTINCT pa.joueur_id) FROM participations pa CROSS JOIN cfg c
                  WHERE pa.event_id IN (SELECT id FROM ev)
                    AND (
                      (p_jour IS NULL AND (p_tout OR (pa.created_at AT TIME ZONE c.fz)::date BETWEEN c.date_d AND c.date_f))
                      OR (p_jour IS NOT NULL AND jour_exploitation(pa.created_at, c.fz, c.bh) = p_jour)
                    )),
    'rejoue',   (SELECT count(DISTINCT pa.joueur_id) FROM participations pa CROSS JOIN cfg c
                  WHERE pa.event_id IN (SELECT id FROM ev)
                    AND pa.joueur_id IN (SELECT joueur_id FROM multi)
                    AND (
                      (p_jour IS NULL AND (p_tout OR (pa.created_at AT TIME ZONE c.fz)::date BETWEEN c.date_d AND c.date_f))
                      OR (p_jour IS NOT NULL AND jour_exploitation(pa.created_at, c.fz, c.bh) = p_jour)
                    )))
);
$function$;

-- Grants : PUBLIC est obligatoire (pas de session Supabase Auth sur ce projet).
GRANT EXECUTE ON FUNCTION public.station_tracking(text, text, text, date, boolean) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.station_tracking(text, text, text, date, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.station_tracking(text, text, text, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.station_tracking(text, text, text, date, boolean) TO service_role;
