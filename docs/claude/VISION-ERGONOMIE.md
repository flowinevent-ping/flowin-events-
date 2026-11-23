# Vision ergonomie : « clac, clac, boum, boum, c'est réglé » (23/11/2026)

Auteur : critique-ergonomie. Proposition, rien n'est modifié dans le code. Romain décide. Maquette : `docs/maquette/super-event-wow.html` (+ PNG).

## 1. La vision en une phrase
En quelques gestes, le pro a son animation, son fichier client chargé, son passage réglé, son Super Event intégré, il a payé, et il VOIT combien de passages attendre. Ça doit être vivant (un peu de jeu), jamais lourd.

## 2. Principes mesurables
1. Budget de gestes par parcours (section 3) : un geste = un toucher ou un champ saisi. Dépassement = refus.
2. Un écran = une idée, tient dans 1 hauteur (844 px à 390 px), moins de 40 mots hors saisie, police ≥ 13 px, zones ≥ 44 px.
3. Aucun écran sans décision : si l'écran n'a rien à choisir ni à saisir, il est fusionné ou supprimé.
4. Tout ce qui est connu est repris (profil, SIRET, adresse). On ne redemande jamais.
5. Chaque parcours finit sur un moment « c'est fait » : écran dédié, un résultat visible (QR, chiffre, ticket), une seule action suivante.
6. Le bon chiffre est visible sans chercher : avant achat (prévision), après achat (réel), en tête de l'espace pro.
7. Orange #C2410C = Super Event, bleu #3B5CC4 = animation. Pas de violet, pas d'emoji.

## 3. Budgets : mesuré aujourd'hui, cible, cause principale de l'écart
Mesure : Playwright, 390 x 844, `?demo=1`, build local de `main` (471b1aad), 0 requête non GET vers supabase.co. « Code » = lu dans le code, non rejoué.

| Parcours | Aujourd'hui (écrans / gestes) | Cible | Cause n°1 de l'écart |
|---|---|---|---|
| 1. Créer une animation, de l'inscription au QR | Inscription 10 écrans + fin, 10 touchers + ~11 champs ; connexion 3 ; configurateur Roue 7 écrans + fin, 7 touchers (Quiz 9 écrans, 10 touchers) ; puis ≥ 2 pour trouver le QR (code). Total ≈ 35 gestes, ≥ 23 écrans | ≤ 20 gestes, ≤ 12 écrans | Inscription en 7 étapes (secteur, produits, points de vente, adresse) alors que le SIRET préremplit presque tout ; l'écran final « Votre jeu est en ligne » (13 mots) n'affiche pas le QR |
| 2. Charger le fichier client | 5 écrans, 5 gestes (Contacts, Importer, fichier, Continuer, Importer) | 3 gestes, 3 écrans | L'écran « Vos colonnes » est imposé alors que les 5 colonnes de mon fichier test étaient devinées juste |
| 3. Régler un passage / une diffusion (QR, affiche) | Choix des supports : 0 geste si défauts (2 QR inclus), QR de 106 px ; obtenir l'affiche : ≥ 4 gestes (code, non rejoué) | 1 geste depuis « C'est en ligne » | Le QR et l'affiche ne sont pas sur l'écran final, il faut retourner les chercher |
| 4. Rejoindre un Super Event | 4 écrans de 3,1 / 1,9 / 2,6 / 3,7 hauteurs, 5 touchers + jusqu'à 7 champs à l'écran 1 (384 mots) ; l'écran 2 « Jeu » n'a aucune décision | ≤ 5 gestes, 3 écrans, aucun au-delà d'1 hauteur | Page d'identité (nom, catégorie, adresse, CP, ville, 2 dates) redemandée alors que le profil la contient ; 4 tarifs et un récapitulatif sur le dernier écran |
| 5. Payer (virement / bon de commande) | `PAIEMENT_ACTIF=false` : aucun paiement aujourd'hui. Bon de commande autonome : 9 écrans, 8 touchers, 15 champs (reprise du profil non rejouée). Après validation avec paiement actif : QR virement + lien SEPA, 1 geste (code) | 1 écran, ≤ 2 gestes, 0 champ | Le bon de commande est un 2e parcours qui redemande raison sociale, SIRET, adresse, contact |
| 6. Voir passages et vues attendus | Avant achat : rien. Après : rapport en carrousel (Contacts, Rapports, puis 4 écrans). En tête de /pro : seulement « Participants ce mois-ci » | Avant : 0 geste (sur l'écran prix / rejoindre). Après : 0 geste (en tête de /pro) | Aucune prévision n'existe ; les compteurs réels sont enterrés |
| 7. Joueur : scan jusqu'au ticket | Quiz solo : 9 écrans (accueil, règles, 3 questions, résultat, 2 volets de coordonnées, ticket), 13 touchers + saisie. Roue : 6 écrans, ≈ 9 touchers. Accueil 190 mots, règles 140 mots | Quiz ≤ 12 touchers, Roue ≤ 8 ; accueil < 40 mots | L'écran « Règles » séparé (sans décision) et un accueil chargé. Déjà optimisé le 17/11 : ne pas rouvrir les 2 volets de coordonnées |

Remarque : le Configurateur demande un SIRET valide alors que l'inscription le laisse facultatif (« Pas de SIRET ») : ces pros retombent sur l'écran de coordonnées (9 champs).

## 4. Ce que « fun » veut dire, pas cher
Seulement ce qui existe déjà ou se fait en CSS, sans bibliothèque ni jeu lourd :
- Retour immédiat : état « appuyé » sur chaque bouton, choix unique qui avance seul (déjà dans le Configurateur).
- Micro-animations de 0,3 à 0,9 s : apparition du logo, épingles qui sautent, barre d'étapes qui se remplit. `prefers-reduced-motion` respecté.
- Compteurs qui montent (CSS `@property`, voir la maquette) sur /pro, le rapport, la fin d'import.
- Anneau de progression : composant `Camembert` (dashboard) ; confettis : CSS `.confetti` + `@keyframes fall` du moteur masters (`lib/masters/css.ts`, `confetti()` de `engine.ts`).
- Un seul moment de récompense par parcours, avec confettis : animation en ligne, import terminé, station rejointe acceptée, ticket gagné (déjà côté joueur).
- Un moment « c'est fait » : écran dédié, titre court, résultat visible, un bouton.
Interdit : points, niveaux, classements, sons, mini-jeux pour les pros.

## 5. Règle d'acceptation (tout agent, avant tout travail de design)
1. Écrire le parcours touché, ses écrans et gestes actuels et la cible de la section 3.
2. Proposer une maquette qui tient la cible ; sinon dire pourquoi et ce que Romain arbitre.
3. Après la livraison, rejouer le parcours (Playwright 390 px, `?demo=1`, 0 écriture) et donner les nouveaux chiffres.
4. Refus si : gestes au-dessus du budget, un écran de plus d'une hauteur, plus de 40 mots, champ redemandé, écran sans décision.

## 6. « Voir le nombre de passages et de vues attendus » : écran de prévision
Données qui existent (lecture seule, agrégats) : `visites` (event_id, etape, visiteur_id, created_at, source, device), `participations`, RPC `evenement_tracking` (flashs, joueurs, parties), `operation_stats` (sexe, code postal, par jour), `stats_qr_evenement` (par QR), historique NDS 2026.
Mesure du 23/11 sur NDS 2026 (SELECT, 9 au 18 juillet, 18 stations `ev-nds-*`) : visiteurs distincts par station, min 1, 1er quartile 3,5, médiane 22, 3e quartile 67, max 221 ; lignes sans étape par station : médiane 68,5.
Ce que ça permet, honnêtement :
- Afficher une fourchette (1er au 3e quartile : « 4 à 67 visiteurs sur 10 jours »), jamais un chiffre unique, avec « Estimation d'après NDS 2026 » et le nombre de stations.
- Hors NDS : 9 animations en ligne sur 68 événements en base (beaucoup de tests) : pas assez de données, afficher « pas encore d'estimation », ne rien inventer.
Réserves : un visiteur = un navigateur ; une personne dans 2 stations compte deux fois ; ~35 % des lignes sans étape ont un sens flou (AMEL-PERF-04) ; l'écart est énorme (emplacement, animation) ; le festival dure 10 jours.
« Vues » n'est pas défini : décision de Romain (vue = flash, ou joueur ?). Mots utilisés : passages = flashs, joueurs = participants (DEC « Ce que voit et fait un pro »).
Après achat : les chiffres réels remplacent la fourchette (mêmes RPC, tuiles de `RapportPro.tsx`).

## 7. Les 8 changements, classés impact / effort
Détail et lignes du carnet : `docs/claude/AMELIORATIONS.md` (AMEL-VIS-01 à 08). Aucun ne touche au consentement ni aux e-mails.
1. VIS-01 Import : sauter « Colonnes » si les colonnes clés sont devinées ; carte « Importer mon fichier » en tête de /pro. Parcours 2 : 5 vers 3 gestes. (3/1)
2. VIS-02 Écran final « C'est en ligne » : confettis, QR en grand, Imprimer l'affiche, Partager, prévision. Parcours 1, 3, 6. (5/2)
3. VIS-03 Inscription en 3 écrans (Vous, Commerce par SIRET, Créer). Parcours 1. (5/3)
4. VIS-04 Rejoindre un Super Event : 2 écrans utiles, carte en tête, sans écran « Jeu », profil repris. Parcours 4. (5/3)
5. VIS-05 Super Event « wow » : plaque logo, carte, compteurs, anneau (maquette). Parcours 4 et 6. (4/2,5)
6. VIS-06 Prévision de passages (fourchette NDS) + compteurs réels en tête de /pro. Parcours 6. (4/3)
7. VIS-07 Configurateur 7 vers 4 écrans (supports + kit, récap + prix) ; dépend d'AMEL-ERG-05. Parcours 1. (4/3)
8. VIS-08 Paiement en 1 écran : bon de commande prérempli, QR virement, copier l'IBAN ; seulement si `PAIEMENT_ACTIF` passe à true. Parcours 5. (3/3)

## 8. Ce qu'il me faut de Romain
- L'autre application où l'interaction a été optimisée : 3 à 5 captures d'écran ou un lien, à déposer dans `docs/maquette/reference-autre-app/` (voir le README du dossier). Je mesurerai ses gestes avec la même méthode.
- Décisions : définition de « vues » ; accepter de retirer secteur, produits, points de vente de l'inscription (à reporter dans Mon profil) ; sortir les 4 tarifs du parcours « Rejoindre » ; confirmer qu'on affiche une fourchette NDS et pas un chiffre unique.
