# Lot 5 : maquettes à valider (24/11/2026)

Maquettes seulement : aucun code d'application, aucune écriture en base. Format 390 x 844, CSS seul, style validé (orange dégradé #B5471E, cartouche logo, feuille à poignée, boutons pastille), logos réels de `admin/public/nds/partenaires/` (Nook Café en exemple). Chiffres, noms de lots, QR et banques = exemples (QR dessinés, non scannables). Animations coupées par `prefers-reduced-motion` (les PNG montrent l'état final).

Pour chaque sujet : `lot5-X-sujet.html`, `lot5-X-sujet-ensemble.png` et un PNG par écran.

| Sujet | Fichier | Écrans |
|---|---|---|
| A. Choix du jeu et des questions | `lot5-A-jeu` | type de jeu (3 cartes), banque ou « Demander à Flowin », banque, demande (thème, nombre, ton, délai), envoyé |
| B. Roue | `lot5-B-roue` | cases (3 types), lot et texte du jour, aujourd'hui / demain, récapitulatif, côté joueur |
| C. Tombola et lots immédiats | `lot5-C-tombola` | billets et date, lots à retirer tout de suite, jour du tirage |
| D. Quiz animé | `lot5-D-quiz-anime` | question, bonne réponse, série, presque, bonus un par écran, avance auto, fin (confettis), tirage tombola (confettis) + séquences en millisecondes |
| E. Statistiques pro | `lot5-E-stats` | flashs et opt-in, hommes / femmes, âges, code postal, zone de chalandise (carte à cercles) |
| F. Affiche | `lot5-F-affiche` | aperçu en direct, logo, couleur et texte, imprimer |

Colonnes utilisées (E) : `visites(event_id, created_at)` pour les flashs, `joueurs(optin, genre, tranche_age, code_postal, adresse)`, `participations(scan_distance_m)`. Pas de « passages attendus ».

## Décisions à demander à Romain
1. Roue : la case « Ticket pour le prochain tirage » mélange gain immédiat et tirage. Règle actuelle : un gain immédiat n'affiche jamais « tirage ». On autorise ce mélange : oui ou non ?
2. Texte du lot modifiable le jour même, avec texte prévu pour demain : champ « texte par date » à créer (plus tard). Accord ?
3. « Demander à Flowin de rédiger mes questions » : prix affiché 72,50 € HT la 1re année (réglage du code). Délais proposés (1 semaine, urgent, date) : à confirmer par Flowin.
4. Quiz animé : son activé au premier toucher avec bouton couper (mémorisé), ou coupé au départ ?
5. Série de 3 bonnes réponses : un ticket bonus (écran 7) : oui ou non (touche au nombre de tickets).
6. Statistiques : libellés des tranches d'âge à aligner sur le formulaire (la table a `tranche_age` et `age_tranche`). Zone de chalandise : accord pour géocoder l'adresse.
7. Couleur : ces écrans pro sont en orange (style validé) alors que la règle dit bleu = animation, orange = Super Event. On garde l'orange ?
8. Cartouche : le logo du commerce est affiché ; aucun logo vectoriel « Flowin Event » n'existe dans le dépôt pour les écrans pro.
9. Affiche : six couleurs (sans violet), 40 caractères maximum pour le texte court : accord.

## Non vérifié
Rendu sur téléphone réel ; vraies valeurs de `tranche_age` ; sons réels (aucun fichier audio) ; QR scannables.
