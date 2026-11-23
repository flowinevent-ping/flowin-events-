# Mémoire : critique-ergonomie (créée le 21/11/2026 ; ≤120 lignes)

## Déjà fait ou décidé : ne pas re-proposer (source)
- Carrousel, jamais de longue page ; peu de texte ; moins d'actions ; police ≥ 13 px, zones ≥ 44 px (DEC « RÈGLES D'INTERFACE », REGLES.md).
- Coordonnées en 2 volets sans défilement à 390 x 844 ; gestes jusqu'au ticket réduits : quiz + bonus 29 vers 21, quiz solo 22 vers 14, roue 13 vers 10, tombola vers 10 (audit 17/11, EXPERT-1).
- Parrainage en fin de parcours (décidé 17/11) ; profil /moi en 5 rubriques, QR plein écran en 1 toucher ; carte MapLibre avec itinéraire en un geste.
- Pro et SA mobiles : tableaux en cartes par 10, cibles 44 px, kanban en carrousel (EXPERT-5).
- Défauts E2E 20/11 corrigés : listes pro fraîches, QR « live », texte du bouton « Terminer le tirage », « Pas de lot cette fois ».

## Déjà ouvert chez produit-ergonomie (ne pas redoubler)
- Charte bleu / orange définitive (REGISTRE L11) ; filtres CRM pro repliables ; banques et lots NDS par rubrique ; conditions NDS « 25 octobre » sur `lot.html` ; « Commerce partenaire — » cosmétique.

## Mesures de référence (21/11/2026, SELECT, table `visites`, tous événements confondus, non filtré par événement : à préciser au prochain passage)
- Visiteurs distincts par étape : onboard 769, quiz 761, resultats 420, final 339, inscription 374, carte 162, bonus 158, tickets 54, partenaires 53, profil 35. 2943 lignes sans `etape`. `err:reprise-reseau` : 98 lignes, 37 visiteurs.
- joueurs 842, optin 480 (57 %), parrainages 10.

## Pièges
- La RPC `visites_entonnoir` existe ; vérifier ses paramètres avant de l'appeler. Une étape n'est pas forcément ordonnée : ne pas lire le tableau comme un entonnoir strict sans le dire.
- Ne pas tester sur de vrais clients ; `?demo=1` = aucune écriture.
- Appareils réels (iPhone, Android, caméra) : non testables ici, marquer « non vérifié ».

## Journal des passages
- 21/11/2026 : premier passage (4 propositions, voir AMELIORATIONS.md : AMEL-ERG-01 à 04).
- 23/11 : mesure par événement quiz vers résultats -23 % à -47 % sur 6 événements NDS (NDS seulement) ; `visites` vient de NDS2026Client et parcours-tracking, pas du moteur masters ; métiers de banques existants : restaurateur, pizzeria, boulanger, boucher, libraire ; AMEL-ERG-05 à 09 proposées.
- 23/11 (soir, demande de Romain : « clac, clac, boum, boum ») : `docs/claude/VISION-ERGONOMIE.md` = budgets de gestes par parcours (mesurés Playwright 390 px `?demo=1`, build local, 0 écriture), règle d'acceptation, définition du « fun » ; maquette `docs/maquette/super-event-wow.html` ; AMEL-VIS-01 à 08 proposées. Ne pas re-proposer.

## Mesures de référence 23/11 (gestes = touchers + champs)
- Inscription pro : 3 écrans d'accueil + 7 étapes, 10 touchers, ~11 champs. Configurateur : Roue 7 écrans, 7 touchers ; Quiz 9 écrans, 10 touchers ; écran final 13 mots, sans QR.
- Import fichier : 5 gestes ; l'écran « Colonnes » est imposé même si tout est deviné. Rejoindre un Super Event : hauteurs 3,1 / 1,9 / 2,6 / 3,7 écrans, 5 touchers. Bon de commande autonome : 9 écrans, 8 touchers, 15 champs.
- Joueur (démo `/jouer?m=`) : quiz solo 9 écrans, 13 touchers ; roue 6 écrans, ≈ 9 touchers ; accueil ≈ 190 mots.
- NDS 2026 (SELECT, 9-18 juillet, 18 stations `ev-nds-*`) : visiteurs distincts par station min 1, Q1 3,5, médiane 22, Q3 67, max 221. Hors NDS : pas assez de données (9 animations en ligne sur 68 événements).
- Outils : le script de marche des masters doit cliquer `[data-go]` / `.btn` / `.opt` ; les textes contiennent des espaces insécables (regex avec `.`), pas de `getByText` fiable.
- 23/11 (audit design pro et organisateur, `docs/claude/AUDIT-ERGO-PRO-ORGA-2026-11-23.md`) : AMEL-DES-01 à 10. Mesures : barre du bas pro 11,5 px ; `/rejoindre` 2439 à 3890 px et 395 px de large ; `/pro/nouvelle?type=super` 1971 px ; Configurateur dénominateur 7 puis 9 puis 10. Violet résiduel #7A4FE0 : ParcoursCreation:169, BanqueEditor, PartenaireSheet, CarteCommerces, documentsAnimation, carteReseau ; tokens doc encore violet. 3 verts de succès. NON VÉRIFIÉ : assistant SA, liste CRM (session), page animation avec QR, confirmation e-mail.
- Outils : build copie `scratchpad/ergo/admin` (node_modules en lien), Chromium `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (le Playwright du dépôt veut 1223) ; `curl` direct vers Supabase refusé par l'auto-mode : lire via les pages en démo seulement. Recherche entreprise (GET api.gouv) joignable.
