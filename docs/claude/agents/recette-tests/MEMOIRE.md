# Mémoire : recette-tests (créée le 21/11/2026 ; ≤120 lignes)

## Méthode éprouvée
- Production réelle : https://flowin-events.vercel.app, base `ywcqtupgoxfzkddqkztk`. Comptes TEST par plus-addressing Gmail `flowinevent+...@gmail.com` : pro-test, joueur-test, ami-test, orga-test (adresses exactes à compléter, non consignées dans le dépôt). Toute ligne créée est préfixée `TEST-` / `test-`.
- Mobile 390 px (et 360, 430), ordinateur pour les pages pro. Captures nommées `sNN-*.png` dans le dossier de travail (hors dépôt, perdues si le dossier est nettoyé).
- En local : Playwright sur `next start` d'une copie, `?demo=1`, toute requête non-GET vers supabase.co bloquée et comptée (attendu : 0).
- Preuve = requêtes HTTP (statut), lignes en base, captures ; sans preuve : « non vérifié ».
- Nettoyage : jamais de DELETE sans confirmation de Romain.

## Scénarios et derniers verdicts (E2E du 20/11/2026, `docs/E2E-verification-2026-11-20.md`)
1. Pro : inscription, connexion, mot de passe oublié : PASS (2 réserves : validation manuelle, e-mail de confirmation chez Romain).
2. Animation quiz, 2 lots gain immédiat, affiche A4 / QR : FAIL puis PASS (statut live ; listes no-store ; historique à 1 animation).
3. Joueur : QR, quiz, gain immédiat, ticket dans /moi, consentement : PASS ; textes de tirage sur gain immédiat corrigés dans le code, non revérifiés.
4. Offrir le lot à l'ami : PASS.
5. Scanner pro / lot.html, retrait, stock : FAIL puis PASS après SQL (pro sans partenaire valide sans PIN) ; reste « Commerce partenaire — ».
6. Seconde animation en tirage : jeu, tirage, gagnant, notification : PASS après redéploiement `send-ticket-gagnant` v5.
7. Super Event orga : 2 phases, lots, tombola : FAIL puis PASS (RLS super_events, puis `se_lots` avec session).
8. Pro inscrit son commerce comme station : PASS (approbation SA simulée par SQL).
9. Joueur joue à la station : PASS (la station ne s'ouvre qu'à la date de début).
10. Tirage Super Event, gagnant prévenu, retrait : PASS avec réserves (lot organisateur validable par le SA seul ; e-mail en dur NDS).
11. Relance e-mail : revue de code seulement (rien envoyé) ; protégée depuis par secret (`docs/SECURITE-rappel-tickets-2026-11-20.md`).
12. Nettoyage : BLOQUÉ (confirmation DELETE sans réponse, 230 s, deux fois) ; Romain exécute `sql/2026-11-20-e2e-nettoyage-TEST-2.sql`.

## Autres recettes passées
- 17/11 : audit des 5 experts en local `?demo=1` : jeux, profil, carte, pro et SA mobile, 0 écriture (`docs/audit-2026-11-17/RAPPORT-FINAL.md`).
- 18/11 : test de tirage de bout en bout (`docs/audit-2026-11-17/TEST-TIRAGE-2026-11-18.md`).
- 19-20/11 : tests sécurité locaux (PostgreSQL 16 stub) puis vérifications prod (lecture anonyme vide, pages en 200).

## Pièges connus
- Pro « Ma première fois » : pas de ligne `partenaires` ni de PIN ; une inscription pro exige une validation Flowin (ligne mise à la main sur le compte TEST).
- Station Super Event fermée avant la date de début : régler les dates du super event à aujourd'hui pour le test.
- Data Cache Next périmé : une liste vide après création n'est pas forcément un bug de données.
- Appeler une fonction d'envoi avec un destinataire réel = envoi réel : utiliser les adresses TEST ; jamais `rappel-tickets` en mode normal.
- Connecteur Supabase : confirmer le projet (`list_projects`) avant d'écrire.
- Vérifier la version DÉPLOYÉE d'une fonction Edge, pas seulement le dépôt.

## Ouvert (à rejouer ou à faire)
- Contrôler le premier passage du cron `tickets-rappels` (21/11 09:07 UTC).
- Rejouer le scénario 3 (textes gain immédiat), un envoi `notify-bon-commande` TEST (déploiement de `b810cd56` non confirmé), annonces des commerces, phases Super Event, résultat de tirage « Pas de lot cette fois ».
- Test caméra scanner sur iPhone et Android réels (non fait).
- Nettoyage TEST-2 par Romain ; puis vérifier qu'aucune ligne `TEST-` ne reste.
