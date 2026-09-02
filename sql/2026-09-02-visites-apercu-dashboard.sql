-- 02/09/2026 — Les aperçus du dashboard fabriquaient de VRAIS scans.
-- Appliqué en prod via Supabase MCP (migration archive_visites_apercu_dashboard_2026_09),
-- repris ici pour que le schéma du repo suffise à reconstruire la base.
--
-- CONSTAT (vérifié en base, pas supposé)
-- Les cadres téléphone du dashboard SA — ParcoursMobil (4 écrans depuis le 30/07)
-- et, depuis le 02/09, Diffusion — chargent le VRAI parcours dans une iframe.
-- Or `trackVisite()` (admin/lib/track.ts) ne testait jamais `preview` : chaque
-- ouverture d'un aperçu écrivait une ligne `visites` avec `etape IS NULL`,
-- c'est-à-dire un FLASH, sur l'event réel. Seul /parcours/nds2026 gérait
-- `preview` ; les 6 autres modules (quiz, quizsolo, quizmaster, spin, vote,
-- tombola) l'ignoraient complètement.
-- Repérées par leur `referrer`, qui pointe vers le dashboard.
--
-- CAUSE CORRIGÉE CÔTÉ CODE, pas seulement nettoyée ici :
--   admin/lib/track.ts -> `if (params.has('preview')) return`
-- posé une seule fois, dans le tronc commun, pour les 7 modules.
--
-- IMPACT MESURÉ, AVANT / APRÈS (RPC station_tracking sur se-nds-2026)
--   chiffre publiable (borné date_d..date_f) : 2 446 -> 2 445   (-1)
--   tout l'historique                        : 2 847 -> 2 799   (-48)
--   stations listées (tout l'historique)     :    21 ->    20   (-1)
-- Autrement dit : LES CHIFFRES PUBLIÉS ÉTAIENT JUSTES. Un seul aperçu était
-- tombé dans la période officielle. C'est l'historique complet qui était gonflé.
--
-- CORRECTION D'UNE AFFIRMATION DU 01/09 : le fix « toutes les dates » (0cb40c3)
-- annonçait 3 stations invisibles sur aucun écran. Après nettoyage :
--   NDS · Le Bar        21 flashs -> 14 réels   (7 étaient des aperçus)
--   NDS · Brigade Verte 18 flashs ->  5 réels  (13 étaient des aperçus)
--   NDS · Les Caisses    1 flash  ->  0 réel    (son UNIQUE flash était un aperçu)
-- « NDS · Les Caisses » n'a donc jamais eu la moindre activité réelle : sa
-- disparition de la liste est correcte, ce n'est pas une régression.
--
-- Les lignes sont ARCHIVÉES avant suppression : rien n'est perdu, la table
-- visites_archive_apercu_2026_09 permet de tout rejouer si besoin.
-- 110 lignes archivées au total (52 flashs + 58 étapes de parcours).

CREATE TABLE IF NOT EXISTS visites_archive_apercu_2026_09 (LIKE visites INCLUDING ALL);

INSERT INTO visites_archive_apercu_2026_09
SELECT * FROM visites
WHERE referrer ILIKE '%/dashboard%' OR referrer ILIKE '%/pro/parcours%';

DELETE FROM visites
WHERE referrer ILIKE '%/dashboard%' OR referrer ILIKE '%/pro/parcours%';
