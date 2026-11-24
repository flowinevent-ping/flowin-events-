# Mémoire : critique-performance-donnees (créée le 21/11/2026 ; ≤120 lignes)

## Déjà fait ou décidé : ne pas re-proposer
- Listes dépendant d'une écriture récente en `no-store` côté serveur (`fetchOperationsPro`, `superEventsOuverts`) : voulu (ERREURS.md, E2E 2 et 8).
- Archivage de `visites` déjà pratiqué : tables `visites_archive_2026_06` et `visites_archive_apercu_2026_09` existent (advisors 21/11).
- Sécurité RLS / RPC appliquée 19-20/11 : ne jamais proposer de la relâcher (« authenticated » n'est pas « de confiance »).
- Miroir `dashboard.html` / `static/dashboard.html` MD5 identique : règle CLAUDE.md, ne pas proposer de le supprimer sans Romain.
- Mailer Gmail plafonné à 450/jour (ACCES.md) : sujet e-mail traité par `flux-integrations`.

## Mesures de référence (21/11/2026)
- Base `ywcqtupgoxfzkddqkztk` (nom « Flowin event », région eu-central-1 selon `list_projects`, alors que CLAUDE.md dit eu-west-1 : écart à signaler à Romain). Plus grosses tables : visites 3,8 Mo (8 426 lignes), joueurs 1,3 Mo (842), se_reponses 1,3 Mo, prospection 1,2 Mo. Stockage non préoccupant à ce volume.
- Advisors performance (21/11) : 13 politiques RLS `auth_rls_initplan`, 8 clés étrangères sans index, 30 index jamais utilisés, 37 politiques permissives multiples, 1 table sans clé primaire (`prospection_staging`).
- Dépôt : `admin/public` = 856 Mo (`nds` 668 Mo, `videos` 131 Mo, `animations` 20 Mo) ; pack git 2,04 Gio ; fichiers > 14 Mo : 5 kits ZIP NDS, `nds-dossier-festival.zip` 75 Mo, `kit-nds.zip` 31 Mo, `nds-spot-player.html` 12 Mo.
- Pages en production (curl, Accept-Encoding br) : `/dashboard.html` 286 Ko transférés en 0,30 s (1,16 Mo non compressé) ; `/landing` 17 Ko en 0,22 s ; `/nds-spot-player.html` 9,16 Mo en 1,45 s.

## Pièges
- Ne pas appeler les fonctions d'envoi ni les crons. SELECT seul, une requête à la fois, colonnes scalaires.
- Un index « jamais utilisé » peut servir à NDS 2027 ou au cron : ne pas proposer de suppression sans mesure sur une période pleine.

## Journal des passages
- 21/11/2026 : premier passage (voir AMELIORATIONS.md : AMEL-PERF-01 à 04).

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (HUB)
- 18/07 · `limit=500` sur la sidebar « Joueurs » alors que la table en contenait 769 ; plafonds relevés (500 vers 20000, participations 5000 vers 50000). Le compteur affiché n'est jamais la longueur d'une liste paginée (HUB 18/07). Re-contrôler ce risque à mesure que les tables grossissent.
- 18/07 · Scans `visites` en fire-and-forget sous réseau saturé : 22 à 29 lignes en base le 17/07 là où le comptage physique dépassait 100. Correctif : file localStorage (`flowin_visites_wq`) rejouée au retour réseau, dédup anti-rafale inférieure à 10 s. Les participations avaient déjà une file durable (`flowin_nds_wq`). Ne pas proposer de retirer ces files (HUB 18/07).
- 18/07 · Le service worker sert l'ancien bundle tant que le téléphone n'a pas rechargé : l'effet d'un correctif de comptage n'est pas immédiat ni rétroactif (HUB 18/07).
- 19/07 · `visiteur_id` absent à 100 % des flashs les 09 et 10/07 : « visiteurs uniques » valides seulement à partir du 12/07 ; non corrigeable après coup (HUB 19/07).
- 31/08 · Écran « Résultat journalier » : 21 jours affichés pour 55 réels ; restructuré en jours du festival (10, visibles) et jours de test (45, repliés) pour ne pas aggraver la lenteur (HUB 31/08).
- 01/09 · « Toutes les dates » écartait 401 flashs (2 446 contre 2 847), 43 jours (10 contre 53) et 3 stations ; la RPC gagne `p_tout` à défaut `false`, les chiffres publiables restent bornés au 09-18/07 (HUB 01/09). Toujours écrire la période couverte à côté du total.
- 02/09 · 110 lignes d'aperçu gonflaient l'historique (2 847 vers 2 799) sans toucher le chiffre publiable (2 446 vers 2 445) ; archivées dans `visites_archive_apercu_2026_09` (HUB 02/09). Archiver plutôt que supprimer.
- 02/09 · QR : service tiers `api.qrserver.com` = dépendance externe et 200 px étirés ; génération locale PNG 1024 px et SVG (HUB 02/09).
- 19/07 · Chiffres de référence NDS 2026 (clôture 18/07, audit 19/07) : 2 449 flashs, 617 joueurs uniques, 986 jeux ; 887 parties à la date du 18/07 ; ne pas confondre avec les chiffres publiables bornés (HUB 18-19/07).
