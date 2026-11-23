# Mémoire : gardien-fidelite (120 lignes max, une ligne par élément, date « vérifié le »)

## Acquis
- Les maquettes de référence sont dans `docs/maquette/` (INDEX.md) ; 6 fichiers copiés des originaux, statut « à confirmer par Romain » | 23/11
- Le contrat `docs/claude/CONTRAT-MAQUETTE.md` est la liste des éléments à reproduire : OK / MANQUE / VOULU / NON VÉRIFIÉ | 23/11
- Production : https://flowin-events.vercel.app ; se prouve par `curl` SAUF depuis le cloud Claude : 403 `x-vercel-mitigated: deny` sur toute URL le 23/11 (voir Pièges) | 23/11
- Les décisions de Romain citables pour un écart VOULU sont dans `docs/DECISIONS-flowin-event.md` et `docs/claude/REGLES.md` | 23/11

## Pièges
- Une maquette hors du dépôt n'existe pas pour les agents : première cause d'écart maquette / application | 23/11
- Une page Next.js peut afficher une liste périmée (cache de données) : prouver sur la production, pas dans le code seul ; « OK (code) » si la preuve est dans le code | 21/11 (ERREURS.md)
- Le mode démo `?demo=1` écrit zéro ligne en base ; ne jamais tester sans lui avec un vrai compte | 17/11
- Les captures de la maquette peuvent contenir des emojis ou des noms de test ; la règle de Romain est « pas d'emoji, pas de violet » | 23/11
- Le dashboard a un miroir identique ; un écart entre les deux copies est un MANQUE | 17/11

## À ne pas refaire
- Ne pas relire tout le dépôt : lire seulement ce qui a changé depuis la dernière ligne du journal | 23/11
- Ne pas lancer un navigateur quand un `curl` ou une classe CSS suffit | 23/11
- Ne pas corriger : écrire l'écart et passer à la ligne suivante | 23/11
- Ne pas redemander à Romain une décision déjà écrite dans DECISIONS ou REGLES | 23/11

## Premier passage du 23/11 (contrat créé)
- `CONTRAT-MAQUETTE.md` : 131 lignes (78 OK (code), 35 MANQUE, 11 VOULU, 7 NON VÉRIFIÉ) + tableau des 20 demandes de Romain du 19-23/11 | 23/11
- Aucune ligne « OK » production : 403 Vercel (pare-feu) depuis le cloud ; le connecteur Vercel ne voit pas le projet (404) ; preuves = code de `origin/main` | 23/11
- Comptes de test manquants pour prouver : Super Admin de test (dashboard connecté), pro de test avec session, appareil iPhone / Android (scanner) | 23/11
- Éditeur d'événement (maquette `flowin-editeur-mockup.html`) : entièrement absent du code (0 résultat « Mettre en forme », « hérité », « surchargé ») | 23/11
- Navigation SA : la maquette (19 entrées, barre de contexte `?se=&ev=`, pages `/dashboard/super-event/[id]`) n'est pas faite ; la sidebar garde ~50 entrées en 8 groupes | 23/11
- `public/dashboard.html` (= miroir, MD5 `f82bd8ed…`) contient 884 emojis : le garde-fou `scripts/verifier-emojis.mjs` ne couvre que `app`, `components`, `lib` | 23/11
- Demande du 23/11 « `lots.quantite` baisse au retrait » : non trouvée dans le dépôt (`valider_lot` décompte `lots_stock` seulement) ; base de prod non lue | 23/11
- La maquette de création utilise violet et emojis : écarts VOULU (REGLES 07/11 et 09/11), ne pas les remonter comme MANQUE | 23/11
- Gaps de création à trancher par Romain : Lieu, Quiz Master dans le choix de jeu, jeu par station, périmètre et tirage par station, description du Super Event | 23/11

## Pièges ajoutés
- `curl` depuis le cloud Claude sur flowin-events.vercel.app : 403 Vercel ; ne pas insister (ni User-Agent ni autre chemin ne change) : passer par le contrôle GitHub Actions ou une machine de Romain | 23/11
- Un libellé de maquette absent du code n'est pas toujours un manque : le code a souvent un équivalent (« Flashe une autre station » pour « Flasher un QR & jouer ») ; noter l'équivalent dans la Note | 23/11

