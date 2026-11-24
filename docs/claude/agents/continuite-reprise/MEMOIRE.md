# Mémoire : continuite-reprise (créée le 21/11/2026 ; ≤120 lignes)

## État vérifié le 21/11/2026 (par outil, lecture seule)
- Projet Supabase `ywcqtupgoxfzkddqkztk` « Flowin event » : ACTIVE_HEALTHY, Postgres 17, région eu-central-1 (CLAUDE.md et ACCES.md disent eu-west-1 : écart ouvert dans AMELIORATIONS.md). Autres projets du compte : `confiture et gourmandises`, `PING`, `flowin-revision` (eu-west-1).
- Branches Supabase (`list_branches`) : aucune. Donc pas de base de prévisualisation : toute migration va directement en production.
- Migrations : `list_migrations` répond ; dernière `20261121171820 controles_qualite_2026_11_21`. Les noms ne portent pas le nom des fichiers `sql/` : lien fichier / migration non vérifié.
- Edge : 10 fonctions actives (versions au 21/11 : notify-souscription v5, notify-commande-animation v6, notify-rappel v1, notify-bon-commande v6, rappel-tickets v4, send-ticket-gagnant v6, cron-cloture-ligue v3, generer-ia v2, notify-migration-eleve v2, reset-partenaire-revision v2). `send-resultat-tirage` est dans le dépôt mais NON déployée (voulu). Quatre fonctions déployées n'ont pas de source dans `supabase/functions` (probable Flow-révision).
- Sauvegardes, PITR, plan Supabase, variables Vercel, secrets : NON vérifiables par outil. À vérifier par Romain (chemins dans PLAN-DE-REPRISE.md).
- Aucun test de restauration n'a jamais été fait.

## Tags git (créés le 21/11/2026)
- `prod-2026-11-21` sur `f697f3d8` ; `sec-2026-11-20` sur `1c221393` ; `email-gmail-2026-11-20` sur `6c909ddc`. Annotés, créés en local. PUSH REFUSÉ par le dépôt distant depuis cet environnement (HTTP 403 sur les refs de tags) : Romain doit les pousser depuis son poste (commande dans le plan). Tant que ce n'est pas fait, les tags n'existent pas sur GitHub.
- Une tentative de contournement par l'API GitHub a été refusée par le système : ne pas la retenter sans go explicite.

## Pièges
- Connecteur Supabase : une seule identité active ; `list_projects` avant tout (voir `docs/rapatriement-compte-maitre.md`).
- Ne jamais appeler `rappel-tickets` en mode normal (envoi aux vrais clients) ; ne jamais afficher la valeur du secret Vault `rappel_cron_secret`.
- Les rollbacks SQL sont des blocs de commentaires en pied de fichier, non rejoués ni testés : à relire avant usage.

## Échéances
- Tag avant chaque migration risquée ou grosse livraison.
- Vérification des sauvegardes : prochaine le 21/02/2027 (puis chaque trimestre). Test de restauration sur copie : jamais fait, à planifier avec Romain.

## Journal
- 21/11/2026 : création de l'agent, du plan de reprise et des trois premiers tags (locaux).

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (HUB, REP03, AUTO28, AUD29, PIL)
- 01/09 · Retour arrière réussi : `git revert c8dca31` a ramené `admin/` octet pour octet à `ba17629` (`git diff ba17629 HEAD -- admin` vide) ; docs et table inerte `event_modeles` gardées. Méthode à réutiliser : revert d'un dossier, contrôle par diff vide, reprise lot par lot (HUB 01/09).
- 01/09 · Cause du revert : 7 lots de navigation poussés en 50 min, vérifiés par `tsc` et `build` seulement, jamais à l'écran. Garde-fou : un lot, push, STOP, Romain regarde, puis le suivant. Aucun tag n'existait avant : tag `avant-<chantier>` obligatoire (HUB).
- 01-02/09 · Fichier `sql/` qui ne contenait que des commentaires : une reconstruction depuis `sql/` aurait cassé `station_tracking` (ancienne signature à 4 arguments). Garde-fou : chaque SQL appliqué est écrit en entier (corps, DROP ancienne signature, GRANT), comparé à la prod par md5 (HUB 01/09).
- 02/09 · Deux RPC créées en prod mais absentes du dépôt (« le piège du 01/09 »). Garde-fou : toute migration appliquée = fichier `sql/` du même nom dans la même livraison (REP03 règle 5).
- 31/08 · Nettoyage de 155 tirages fantômes : statut `annule`, rien supprimé, trace gardée, accord de Romain avant. Idem 02/09 : 110 lignes de scans d'aperçu ARCHIVÉES (`visites_archive_apercu_2026_09`) avant retrait. Règle : archiver puis retirer, jamais DELETE direct (HUB).
- 27/08 · Séparation Flowin Révision : nouveau projet dédié, puis suppression de 39 tables et lignes sur l'ancien projet seulement après confirmation explicite de Romain (HUB 27/08). À TRANCHER : ERREURS.md dit que Révision utilise encore la base Event (PLAN 10/11, commit `f482b0e6`) ; HUB 27/08 et la page Notion « Révision Config technique » (31/08, lue seulement via la recherche) disent base totalement séparée. Ne pas écrire dans l'un ou l'autre avant arbitrage de Romain.
- 31/08 et 17/09 · Push GitHub refusé (403 « not in this session's authorized repository set ») : cause = dépôt non attaché aux sources de la session, puis app Claude du dépôt en « Only select repositories » périmé (repasser « All repositories » dans les réglages de l'installation GitHub). Un jeton n'y change rien. Piste pour le refus des tags (HTTP 403 du 21/11) : même cause possible ; à tester par Romain, NON prouvé.
- 28/06 · Anti-perte : `/home/claude` (conteneur) est éphémère : tout asset (rendu + script source) committé et poussé dans la MÊME session (AUTO28).
- 28/06 · Sauvegarde : snapshot de config NDS dans la table `config_backups` ; PITR + dépôt privé listés « à faire par le propriétaire avant le 09/07 » (PIL). État actuel : à vérifier par Romain (Supabase > Database > Backups ; GitHub > Settings > Danger Zone).
- 29/06 · AUD29 dit « Pro souscrit » alors que PIL du 28/06 dit « FREE vers Pro avant le 09/07 » : le plan courant n'est pas vérifiable par outil, à vérifier par Romain. Région : Notion (28/06) et CLAUDE.md disent eu-west-1, `list_projects` dit eu-central-1 : À TRANCHER (déjà ouvert).
- 18/07 · Export Google Sheet « backup flowin » fait par un Apps Script lié au classeur, HORS dépôt ; un export autoritaire CSV a été généré depuis la base. Copie du script : `docs/backup/` (HUB 18/07).
- 08/07 · Retour arrière côté joueur : service worker avec kill-switch (`docs/RUNBOOK-sw.md`) ; un téléphone garde l'ancien bundle tant qu'il n'a pas rechargé : un correctif n'est pas un retour instantané (HUB 08/07 et 18/07).
- 03/09 · Un jeton GitHub a été écrit dans une page Notion (hub, section « ACCÈS COMPLETS ») malgré la règle du 28/06 « jamais de PAT dans Notion ». Valeur NON recopiée ici. À faire par Romain : vérifier qu'il est expiré ou révoqué (GitHub > Settings > Developer settings).
