-- =====================================================================================
-- CONTROLE QUALITE DU 10/11/2026 -- SQL A APPLIQUER (NON APPLIQUE PAR LE CONTROLE)
-- =====================================================================================
-- Le controle n'a rien ecrit en base. Trois objets attendus par le code manquent en
-- production (constate en lecture seule, information_schema / pg_proc, 10/11 soir) :
--
--   1. colonne pros.droits                       -> sql/06-droits-pro.sql (idempotent)
--   2. fonction public.joueurs_uniques_par_mois  -> sql/2026-11-01-tirage-auto-liste-gagnants.sql
--   3. fonction public.stats_qr_evenement        -> sql/2026-11-01-tirage-auto-liste-gagnants.sql
--
-- Effet tant que ce n'est pas applique (le code fonctionne quand meme) :
--   * 1 requete en erreur 400 par session sur l'espace pro (droits par defaut, tout visible) ;
--     le code memorise desormais l'absence de la colonne pour la session (lib/droitsPro.ts).
--   * compteur mensuel et statistiques par QR : calcul de repli cote navigateur.
--
-- Ordre : appliquer sql/06-droits-pro.sql, puis les deux fonctions du fichier du 01/11
-- (relire ce fichier avant : il contient aussi d'autres objets).
-- Compatible avec la migration QR en cours (qr_stations support / type_qr / code_court /
-- cree_par) : aucun conflit, le code lit qr_stations en select('*').
--
-- Verification apres application (lecture seule) :
select 'pros.droits' as objet, exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pros' and column_name = 'droits') as present
union all select 'joueurs_uniques_par_mois', exists(select 1 from pg_proc where proname = 'joueurs_uniques_par_mois')
union all select 'stats_qr_evenement', exists(select 1 from pg_proc where proname = 'stats_qr_evenement');
