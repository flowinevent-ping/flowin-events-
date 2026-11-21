# Erreurs connues : symptôme / cause / correction / garde-fou (une ligne par erreur)

Sources : `docs/E2E-verification-2026-11-20.md` (E2E), `docs/SECURITE-*.md` (SEC), `docs/audit-2026-11-17/RAPPORT-FINAL.md` (AUD), `docs/patterns-bugs-connus.md` (PAT). Ajouter en haut de section, datée.

## Sécurité et intégrité (17-21/11/2026)
- `pros` lisible par toute personne avec la clé publique ; TRUNCATE encore accordé sur `emails_compteur_jour` | politique `pros_anon_select` SELECT anon `true` (restée après les phases 1-2) ; table créée par migration avec les droits par défaut Supabase (contrôle quotidien du 21/11) | NON corrigés (consigne : constater seulement), décision de Romain | contrôles `anon_lecture_tables_sensibles` et `truncate_accorde` ; après toute table créée : revoke explicite
- Dashboard SA : tout part en anonyme | le reset « v30 » effaçait `flowin_admin_session` à chaque chargement | session conservée (SEC tirage 18/11) | après un changement du dashboard, vérifier l'en-tête `Authorization` des appels, pas le seul affichage
- Dashboard SA réécrit les events de prod avec les valeurs seed au chargement | upserts automatiques (pré-boot, boot, `saveData`) ; `?demo=1` sans effet | aucune écriture avant fin du boot ; `supaWriteEvent` refuse sans session SA (SEC events 19/11) | test Playwright : 0 non-GET vers supabase.co en `?demo=1`
- Tout visiteur modifie lots, events, super_events, joueurs, tirages | politiques `ALL true` à public/anon, TRUNCATE accordé à anon (SEC RLS 19/11) | RLS phases 1 et 2 appliquées le 19/11 | après toute nouvelle table : lire `pg_policies` et les grants avant de livrer
- Un visiteur se crée un billet gagnant ou lance un tirage | six fonctions de tirage exécutables par anon (SEC tirage 18/11) | `revoke … from public, anon`, contrôle d'accès SA / pro propriétaire (appliqué 19/11) | `appliquer_regle_gain` reste ouverte à anon (gain immédiat) ; contrôle des droits après chaque migration
- Lecture des e-mails et téléphones de tous les joueurs avec la clé publique | `joueurs/participations/tirages` en SELECT anon et authenticated `true` | RPC + politiques partie C (appliquée 20/11, SEC partie C) | une connexion joueur par lien e-mail crée un compte Auth : « authenticated » n'est pas « de confiance »
- Relais d'e-mail ouvert (destinataire pris dans le corps de la requête) | `send-ticket-gagnant` déployée = ANCIENNE version ; `notify-bon-commande` acceptait le destinataire de la requête (E2E 6) | v5 sécurisées, destinataire relu en base (20/11) | comparer la version DÉPLOYÉE au code du dépôt (`get_edge_function`), ne pas supposer qu'elles coïncident
- `rappel-tickets` déclenchable par n'importe qui | `verify_jwt` false sans jeton (E2E 11) | secret Vault + RPC `rappel_cron_verifier` + en-tête `x-flowin-cron` (appliqué 20/11, SEC rappel) | ne JAMAIS appeler la fonction en mode normal : elle enverrait aux vrais clients
- Fonction `send-resultat-tirage` : 404 / RPC `mes_resultats_tirage` absente | fonction jamais déployée | neutralisée (no-op), résultat de tirage dans l'application (SQL `resultats-tirage-inapp`, 20/11) | vérifier qu'une fonction appelée par le code existe en prod

## Comportement e-mail
- `notify-bon-commande` : la copie du bon n'arrivait plus au signataire | changement de comportement non demandé (20/11 : e-mail « client » redirigé vers Flowin, lecture trop large de « pas d'e-mail aux clients ») | restauré le 21/11 (`b810cd56`) : copie au signataire (adresse lue en base) + copie interne ; `ENVOI_CLIENT=non` redirige vers Flowin | demander à Romain avant tout changement d'envoi ; déployée en version 6 le 21/11 (confirmé)
- Aucun e-mail reçu hors boîte de Romain | expéditeur de test Resend sans domaine ; Resend refuse gmail.com (E2E 6, ETUDE L14) | envoi Gmail SMTP `flowinevent@gmail.com`, `_shared/mailer.ts`, plafond 450/jour (en service 20/11) | Gmail ≠ envoi en masse ; annonces de masse = domaine + service d'envoi (question ouverte)
- Gmail : mot de passe d'application | code de 16 lettres annulé si le mot de passe du compte Google change ; exige la validation en deux étapes ; ne jamais coller le code dans le chat | secrets `GMAIL_USER` / `GMAIL_APP_PASSWORD` posés dans Supabase par Romain | autres erreurs de saisie rencontrées : à compléter
- Mails de connexion Supabase avec mauvais expéditeur / site | Flowin Révision utilise la base de Flowin Event (flowrevis.vercel.app) (PLAN 10/11) | adresse de retour explicite ; réglages Supabase à faire par Romain | Flowin Révision est un AUTRE produit : ne jamais mélanger comptes, règles ni vocabulaire

## Mode démo et données
- Mode démo écrit en production | redirections qui perdent `?demo=1` (`/q/<code>`, `versBonJeuSiAutre` quizmaster) (AUD 17/11) | `demo` conservé à chaque redirection | tout nouveau lien ou redirection : tester `?demo=1` avec écritures bloquées
- `/moi?demo=1` vide ; billet de la roue jamais montré en démo | identifiant local fictif `demo-…` cherché en base ; écritures coupées donc aucun gain | cas traités comme démo (AUD 17/11 fin) | en démo, montrer le résultat attendu sans rien écrire
- Compteur NDS à 0 après la partie B | `NDS2026Client.tsx` (non modifiable) compte `se_tickets` en direct | le composant garde son cumul local (SEC joueurs RPC) | festival terminé, sans effet

## Données périmées et parcours
- « Mes animations » et « Rejoindre » vides ou obsolètes | Data Cache Next périmé (`fetchOperationsPro`, `superEventsOuverts`) (E2E 2 et 8) | lectures `no-store` côté serveur | toute liste dépendant d'une écriture récente : `no-store`
- QR « pas encore commencée » alors que l'écran dit « en ligne » | animation sans paiement créée `upcoming` sans date (E2E 2) | status `live` sans paiement à déclarer (`lib/pro.ts`) | retester QR + affiche A4 après tout changement de statut
- Pro « Ma première fois » ne peut jamais valider un lot (`pin_requis`) | pas de ligne `partenaires`, donc pas de PIN (E2E 5) | SQL `valider-lot-pro-proprietaire` appliqué, `lot.html` envoie le jeton pro (20/11) | rejouer avec un pro sans partenaire
- Un orga ne peut pas créer un Super Event (403) puis `se_lots` en 401 | politique insert réservée au SA ; insertion des lots avec le client anonyme sans session (E2E 7) | SQL `super-events-insert-pro-orga` + client avec session (`cc0c17f3`) | tester la création avec une session pro, pas le SA
- Texte de tirage affiché sur un jeu à gain immédiat | gabarit unique des textes joueur (E2E 3) | corrigé dans le code (`fa367482`), NON revérifié en prod | voir ETAT
- Textes d'e-mail Super Event en dur « Nuits du Sud » | gabarit NDS réutilisé | non corrigé (E2E 10, point 4 « À faire ») | relire tout gabarit avec un autre événement
- Jeux : tombola bloquée, démo qui écrit, cases perdues après erreur | AUD 17/11 expert 1 | corrigés le 17/11 | rejouer quiz, roue, tombola en `?demo=1`
- `/moi` : lots NDS « Expiré », détail des tickets par commerce réduit à un total | régression de l'audit 17/11 | rétablis | comparer les blocs avant / après (inventaire du registre)
- Liste ou bouton sans clic (fiche jamais branchée, `cursor:pointer` sans `onClick`) ; gagnants lus sur la mauvaise table | PAT A et B (`tirages` = vraie source des gains) | corrigés fin 08/2026 | `grep -c onClick` ; compteurs dérivés de la table de faits

## Outils et procédure
- Le connecteur Supabase bascule sur un autre compte ou projet | un connecteur n'a qu'une identité active ; ré-authentifier Vercel ou Google peut faire changer Supabase de `ywcqtupgoxfzkddqkztk` (docs/rapatriement-compte-maitre.md, observé 26/10) ; autres projets : `atddutvzklcgiqxlpvla` vide, `pxqeelvavgzfyrwtgmib` Jeffrey CRM, `wmiawwaxwlvascyflpba` Nexto | `list_projects` et contrôle du ref avant TOUTE écriture | ne jamais écrire dans un projet non confirmé
- Questions répétées à Romain (accès, faits déjà écrits) | mémoire non relue ; des jours perdus | `docs/claude` lu en premier | avant de demander : `grep` dans `docs/claude` puis `docs`
- Nettoyage des données TEST impossible | un `DELETE` par `execute_sql` demande la confirmation de Romain ; sans réponse, timeout 230 s (E2E 12, deux fois) | arrêt, rien supprimé, Romain exécute `sql/2026-11-20-e2e-nettoyage-TEST-2.sql` | annoncer les DELETE à l'avance, Romain devant l'écran ; ne jamais contourner
- Requêtes Supabase en échec | `select *` sur colonnes jsonb larges ; colonne `tel` (pas `telephone`) ; `email_lower` générée (CLA) | projeter les colonnes ; ne jamais insérer `email_lower` | une requête à la fois
- Migration rejouée par erreur | `apply_migration` = DDL persistant en prod (CLA) | SQL idempotents avec rollback en pied | ne pas rejouer
- Confusion avec « Flow-révision » (assiduité +5, élèves, enseignants) | autre produit (DEC 20/11) | rien à ajouter à Flowin Event | Flowin Event = BAITA EURL, commerces et événements
- Statut HTTP d'un cron introuvable | `net.http_post` est asynchrone | lire `net._http_response` ou les journaux Edge (SEC rappel) | ne pas conclure sur `cron.job_run_details`
