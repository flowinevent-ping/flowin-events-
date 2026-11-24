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

## Contrôles automatiques (21/11/2026, niveau 2)
- Mode d'emploi complet : `docs/claude/CONTROLES.md`. Scripts : `scripts/controle/` (`smoke.mjs`, `verifier-acorn.mjs`, `resume-ci.mjs`, `rapport-pdf.mjs`, `_playwright.mjs`). Workflow : `.github/workflows/controle-qualite.yml`.
- Premier smoke réel : 8 pages en 200, 0 erreur JS, 0 écriture supabase.co en `?demo=1`, 8 vidéos v8 en 200/206, miroir dashboard identique (MD5 f82bd8ed) : 12 vert.
- Piège : Playwright 1.60 attend Chromium 1223 mais l'environnement n'a que 1243 ; `_playwright.mjs` bascule sur le Chromium présent.
- Premier rapport : `docs/rapports/controle-2026-11-21.pdf` (6 pages, signets + PDF balisé OK). Contrôles de la base absents : la fonction SQL n'était pas encore appliquée en prod (`controles_qualite` inexistante le 21/11).

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (HUB, REF, REP27, REP03)
- 01/09 · Un build qui passe ne prouve pas qu'une navigation marche : 7 lots poussés sans validation à l'écran, tout annulé (revert `c8dca31`). Règle : pour tout rendu, écrire « vérifié dans le code / build / données, pas à l'écran » plutôt que « corrigé » (HUB 31/08 et 01/09).
- 31/08 · Auto-audit adversarial APRÈS chaque lot : 8 régressions (01/09), 11 (lot 8), 12 (02/09), 9 (02/09 lot Diffusion), dont : deux boutons « Supprimer » sur une fiche, chargement infini quand le sélecteur est retiré (`else setCharge(false)` supprimé), liste du participant précédent sous le nom du nouveau, tableau borné (21 annoncées, 18 listées), impression blanche (CSS `@media print` global). À refaire à chaque lot (HUB).
- 01/09 · Sous-onglet sans contenu propre : « Contrat & CGV » montrait « Général ». Test : ouvrir CHAQUE sous-onglet d'une fiche à données différentes ; un onglet sans contenu doit le dire (`SousOngletVide`) (HUB 01/09).
- 02/09 · Compter les éléments ET comparer les ensembles d'identifiants avant / après un réarrangement de menu (45 entrées conservées, vérifié par `id` et `href` contre `c8dca31`), pas seulement le nombre (HUB 01/09).
- 30/08 · Quand Romain dit « disparu » : comparer d'abord avec le monolithe legacy (donuts, preview landing) avant de conclure « jamais construit » (HUB 30/08).
- 31/08 · Scroll bloqué corrigé deux fois : le premier fix (`min-height:0`) était insuffisant, la vraie cause était `overflow:hidden` dur sur `.sa-page`. Chercher toutes les règles `overflow:hidden` de la chaîne de conteneurs avant de dire « corrigé » (HUB 31/08).
- 31/08 · Une RPC se teste par appel réel dans chaque mode (défaut, `p_tout=true`, jour précis : 2446 / 2847 / 329), avec grant temporaire révoqué ensuite ; lire le SQL ne suffit pas (HUB 01/09).
- 18/07 · Fixer un test sur des chiffres : écart de comptage Events −18 % (730 vs 887) trouvé en comparant la carte à `participations` station par station (HUB 18/07). Reprendre cette comparaison à chaque test de compteur.
- 14/07 · Mode preview (`preview=1`, `docs/METHODE-mode-preview.md`) : vrai jeu, écritures coupées. Boucle : capture de Romain, lecture du code réel, cause nommée, `tsc` + build + miroir MD5, push. 4 garde-fous : héros intact, barre ancrée, aucun bouton masqué (`padding-bottom:200px` sur la section), on ajoute on ne retire pas (HUB 14/07).
- 17/09 · Le bac à sable de l'époque n'avait aucun accès réseau externe : l'audit visuel des 50 requêtes du référentiel n'était pas faisable (HUB 17/09). Aujourd'hui : Playwright local, et Vercel répond 403 aux agents (ERREURS.md) ; preuve = statut du commit + vérification à la main sur téléphone.
- 28/06 · QR : toujours DÉCODER (pyzbar) pour confirmer la bonne station avant commit, ne pas relire (AUTO28, HUB 02/09).
- 25/07 · Faux constats à ne pas refaire : « Instagram bloque le stockage local » (en réalité les flashs d'avant le 11/07 n'avaient aucun `visiteur_id`) ; « 53 visuels sans source » (convention, pas défaut). Un zéro = rien ne s'est passé OU rien n'a été mesuré : distinguer par la date, jamais par le contexte (HUB 25/07).
- 27/07 · Valider depuis `dashboard.html` > « VOIR COMME PRO » = valider le simulateur du vieux monolithe, pas l'app. Toujours donner l'URL `/pro/...` exacte (REP27).
- 27/07 · Romain : « régressions et divergences fréquentes » : avant d'ajouter une fonction, auditer les écrans `/pro/*` non touchés (`/pro/events`, `/entreprise`, `/jeu`, `/crm`, `/lots`, `/tracking`) (REP27).
