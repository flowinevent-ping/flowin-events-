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
