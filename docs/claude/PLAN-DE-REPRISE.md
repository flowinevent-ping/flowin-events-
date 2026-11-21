# Plan de reprise : revenir à un état sain (créé le 21/11/2026)

Pour Romain, sans jargon. Propriétaire : agent `continuite-reprise`. Règle d'or : on ne réécrit JAMAIS l'historique (pas de `push --force`), on ajoute un correctif par-dessus.
Ce qui a été TESTÉ : rien n'a encore été restauré. Tout ce plan est écrit, relu, mais NON rejoué. Chaque point dit « vérifié par outil » ou « à vérifier par Romain ».

## 0. Les points de retour (tags git)
| Tag | Commit | Ce que c'est |
|---|---|---|
| `prod-2026-11-21` | `f697f3d8` | Code en production au 21/11/2026 (sécurité, e-mails Gmail, contrôles qualité) |
| `sec-2026-11-20` | `1c221393` | Juste après la fin de la sécurité joueurs (partie C appliquée le 20/11) |
| `email-gmail-2026-11-20` | `6c909ddc` | Juste après la mise en service des e-mails Gmail |
ATTENTION : ces trois tags existent en local seulement. Le dépôt distant a refusé leur envoi depuis l'environnement de Claude (erreur 403). Pour qu'ils existent sur GitHub, sur ton poste, après `git fetch origin` : `git tag -a prod-2026-11-21 f697f3d8 -m "prod 21/11/2026"`, `git tag -a sec-2026-11-20 1c221393 -m "securite 20/11/2026"`, `git tag -a email-gmail-2026-11-20 6c909ddc -m "emails Gmail 20/11/2026"`, puis `git push origin prod-2026-11-21 sec-2026-11-20 email-gmail-2026-11-20` (ajout seulement, sans risque). Ou : GitHub > Releases > « Draft a new release » > « Choose a tag » > saisir le nom > cible = le commit. Lister : `git tag -n1` (local), `git ls-remote --tags origin` (GitHub).
Avant chaque migration risquée ou grosse livraison : nouveau tag `avant-<chantier>-AAAA-MM-JJ`.

## 1. Code (GitHub puis Vercel)
Vercel déploie tout seul chaque push sur `main` (équipe `flowinevent-6745s-projects`, projet `flowin-events`, racine `/admin`).
Cas A : un commit a cassé le site, le reste va bien.
1. Trouver le commit : `git log --oneline -15`.
2. Annuler SANS effacer l'histoire : `git revert <commit>` puis `git push origin main`. Vercel redéploie.
Cas B : plusieurs commits à annuler, ou on veut revoir un état ancien.
1. Regarder sans rien casser : `git switch -c reprise-test prod-2026-11-21` (crée une branche depuis le tag).
2. Si l'état est bon et qu'on veut le remettre en production : `git revert` des commits fautifs sur `main`, jamais `reset --hard` + force.
Cas C : urgence, besoin du site tout de suite (avant tout git).
1. Vercel > projet `flowin-events` > Deployments > choisir le dernier déploiement qui marchait > menu « ... » > « Instant Rollback » (libellé à vérifier : l'interface bouge). Retour immédiat sans rebuilder.
2. Ensuite seulement, corriger dans git (cas A). Attention : tant que le rollback est actif, Vercel peut cesser d'auto-déployer `main` (comportement à vérifier ; ré-activer en promouvant le bon déploiement).
Accès : le connecteur Vercel de Claude ne voit pas l'équipe (ACCES.md) : l'action Vercel est faite par Romain.
Contrôle après tout retour : `node scripts/controle/smoke.mjs` ou le workflow GitHub « Contrôle qualité » (CONTROLES.md), et ouvrir `/landing`, `/nds`, `/dashboard.html`.

## 2. Base de données (Supabase `ywcqtupgoxfzkddqkztk`)
Vérifié par outil (21/11) : projet ACTIVE_HEALTHY, Postgres 17, région eu-central-1 ; aucune branche de test (`list_branches` vide) : une migration part directement en production ; `list_migrations` répond, dernière = `controles_qualite_2026_11_21`.
NON vérifiable par outil, à vérifier par Romain : sauvegardes quotidiennes, PITR (retour à la minute), plan du projet (gratuit = pause après 7 jours d'inactivité, voir `docs/rapatriement-compte-maitre.md`).
Chemin exact : supabase.com > projet « Flowin event » > Database > Backups > onglets « Scheduled backups » et « Point in time » : noter la date de la dernière sauvegarde et la durée de rétention. Si l'onglet propose de passer au plan payant : le noter, ne rien acheter sans décision. Écrire le résultat dans `agents/continuite-reprise/MEMOIRE.md`.
Fichiers `sql/` : schéma de référence : `docs/SPEC-TECHNIQUE-flowin.md` et `sql/SEED_COMPLET.sql` (à confirmer, non relu) ; les migrations 2026-11 sont dans `sql/2026-11-*.sql`.
Blocs « ROLLBACK » (commentaires en pied de fichier, jamais rejoués) présents dans ces fichiers appliqués : securite-ecritures (11-07), import-fichier-client, lot-a, tickets-animation (11-10), annonces-pro, tirage-correctifs (11-18), banque-interets, securite-events-rls, securite-joueurs-partie-c, securite-joueurs-rpc, securite-rls-phase2, securite-rls-tables, super-event-phases (11-19), rappel-tickets-secret, resultats-tirage-inapp, super-events-insert-pro-orga, valider-lot-pro-proprietaire (11-20), controles-qualite (11-21).
Sans bloc ROLLBACK détecté (recherche du mot) : tirage-auto-liste-gagnants, controle, finitions, qr-stations, sa-carte-relance, carte-commerces-publique-v2, joueur-connexion-email, joueur-consentements, emails-compteur-jour. Pour ceux-là, le retour arrière se prépare au cas par cas.
Procédure en cas de mauvaise migration :
1. Arrêter : ne rien rejouer (`apply_migration` est persistant).
2. Lire le bloc ROLLBACK du fichier ; le faire valider par `securite-donnees` ; l'appliquer par un agent avec ton go.
3. Si les données sont touchées : voir la sauvegarde (Backups ci-dessus). Une restauration écrase les données récentes : à décider par Romain seul.

## 3. Fonctions Edge (`supabase/functions`)
Déployées (vérifié par outil le 21/11) : notify-souscription v5, notify-bon-commande v6, notify-commande-animation v6, notify-rappel v1, rappel-tickets v4, send-ticket-gagnant v6 ; hors dépôt : cron-cloture-ligue v3, generer-ia v2, notify-migration-eleve v2, reset-partenaire-revision v2 (probable Flow-révision, à confirmer). `send-resultat-tirage` : dans le dépôt, non déployée (voulu).
Revenir à une version précédente : le code d'une version ancienne est dans git (`git log -- supabase/functions/<nom>`). Récupérer le fichier d'un commit sain : `git show <tag>:supabase/functions/<nom>/index.ts`, le faire relire, puis le redéployer (agent avec ton go ; le numéro de version avance, il ne revient pas en arrière). Comparer version déployée et dépôt : NON fait.
Ne JAMAIS appeler `rappel-tickets` pour tester : il enverrait aux vrais clients.

## 4. Tâches planifiées (cron)
Définitions dans `sql/` : `tickets-rappels` (09:07 UTC, `sql/2026-11-10-tickets-animation.sql`, mise à jour par `2026-11-20-rappel-tickets-secret.sql`), `tirage-auto-animations` (toutes les 15 min), `controle-qualite-quotidien` (03:17 UTC). Les voir : `select jobname, schedule from cron.job;`.
Le jeton du cron est dans le coffre Supabase (Vault) sous le nom `rappel_cron_secret` ; il n'apparaît jamais en clair dans le cron. Ne jamais afficher ni copier sa valeur. Pour le remettre : bloc ROLLBACK / rotation de `sql/2026-11-20-rappel-tickets-secret.sql`.
Pause d'urgence d'un cron : le fichier SQL indique la commande de retrait ; la faire faire par un agent avec ton go.

## 5. Secrets : où ils sont (jamais leur valeur)
| Nom | Rangé dans | Sert à |
|---|---|---|
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Supabase > Edge Functions > Secrets | envoi des e-mails (Gmail) |
| `RESEND_API_KEY` | Supabase > Edge Functions > Secrets | ancien envoi (Resend), peu utilisé |
| `NOTIFY_*`, `ENVOI_CLIENT` | Supabase > Edge Functions > Secrets | destinataires internes et mode d'envoi |
| `rappel_cron_secret` | Supabase > Vault | protège `rappel-tickets` |
| variables de build Vercel | Vercel > Settings > Environment Variables | à vérifier par Romain (liste inconnue) |
La clé Supabase « publishable » est publique par conception. Les clés « secret / service_role » ne vont jamais dans git.
Rotation, pour chaque secret : 1) créer la nouvelle valeur chez le fournisseur (Google : nouveau mot de passe d'application, validation en deux étapes requise ; Resend : nouvelle clé) ; 2) la saisir toi-même dans Supabase > Edge Functions > Secrets (jamais dans le chat) ; 3) attendre le prochain envoi ou faire un envoi de test avec un compte TEST ; 4) révoquer l'ancienne valeur chez le fournisseur ; 5) noter la date dans `ETAT.md`. Pour `rappel_cron_secret` : rotation par le SQL du fichier Vault, par un agent avec ton go.
Si un secret a fuité : 1) révoquer chez le fournisseur tout de suite ; 2) faire la rotation ci-dessus ; 3) si c'est dans git : le retirer du dernier commit ne suffit pas (l'historique le garde), considérer la valeur comme brûlée, voir `gitleaks` (CONTROLES.md).

## 6. Scénarios : les 3 premières actions
- Suppression accidentelle de données : 1) ne plus rien écrire (pas de DELETE, pas de migration) ; 2) Supabase > Database > Backups : noter la dernière sauvegarde et le PITR ; 3) demander à un agent un SELECT pour mesurer ce qui manque, puis décider de la restauration.
- Mauvaise migration : 1) stopper les livraisons ; 2) lire le bloc ROLLBACK du fichier (section 2) ; 3) contrôle `select public.controle_qualite_dernier();` après correction.
- Clé qui a fuité : 1) révoquer ; 2) rotation (section 5) ; 3) lire les journaux d'usage chez le fournisseur et prévenir Romain.
- Panne de l'hébergeur (Vercel) : 1) vérifier le statut Vercel et un autre réseau ; 2) si un déploiement récent est en cause : Instant Rollback (section 1 cas C) ; 3) sinon attendre, rien à redéployer ; les données sont dans Supabase, pas chez Vercel.
- Panne ou pause de Supabase : 1) Supabase > projet : statut (pause ? « Restore project ») ; 2) vérifier le plan et la facturation (à vérifier par Romain) ; 3) les pages publiques restent affichées mais les jeux n'enregistrent plus : prévenir les commerces.

## 7. Si tout va mal : une page
1. Respirer. Ne rien supprimer, ne rien forcer, ne rien rejouer.
2. Noter l'heure et ce qui ne marche pas (écran, message).
3. Le site est cassé juste après une livraison ? Vercel > Deployments > Instant Rollback (section 1 cas C).
4. Les données sont fausses ou manquantes ? Stop aux écritures ; Supabase > Database > Backups ; ne PAS restaurer sans avoir mesuré (une restauration efface les données récentes).
5. Un secret est exposé ? Révoquer chez le fournisseur d'abord (section 5).
6. Demander à Claude : « agent continuite-reprise, état et prochaine action », en donnant l'heure et le symptôme.
7. Pour le festival (9-18 juillet) : aucune migration ni changement de compte pendant les dates.

## 8. Tests de reprise : état
- Fait : liste des tags, des fonctions et des migrations (lecture, 21/11/2026) ; lecture du code des blocs ROLLBACK : non rejouée.
- NON fait : restauration d'une sauvegarde sur copie, rollback SQL rejoué sur copie, redéploiement d'une fonction ancienne, Instant Rollback Vercel, comparaison fonctions déployées / dépôt, push des tags sur GitHub.
- Échéances : vérification des sauvegardes tous les trimestres (prochaine 21/02/2027) ; premier test de restauration sur copie à planifier avec Romain.
