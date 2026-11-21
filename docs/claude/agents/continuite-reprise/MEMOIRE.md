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
