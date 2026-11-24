# Lot 7 : style pixel pour le quiz et la roue (maquette, 24/11/2026, 2e version)

Maquette seulement : aucun code d'application, aucune base touchée. Version claire dans la charte Flowin (retour de Romain : le fond sombre n'est pas retenu, il aime le style pixel et les sons 8 bits). Pas de mascotte ni de personnage. Textes, scores et noms marqués « exemple » sont fictifs. La première version sombre est gardée dans `variante-sombre/`, non mise en avant.

## Deux directions à comparer
- A, sobre-arcade : `lot7-A-quiz.html` (8 écrans), `lot7-A-roue.html` (7 écrans, ticket inclus).
- B, audacieuse : `lot7-B-quiz.html` (7 écrans), `lot7-B-roue.html` (6 écrans, ticket inclus).
- Séquences d'états (cascade, éclatement, combo, roue qui s'illumine, ticket imprimé) : `lot7-5-sequences.html`.
- Choix du style Classique / Pixel pour le pro : `lot7-3-choix-style.html`.
- Planche de style : `lot7-0-style.html` ; écoute des sons : `lot7-4-sons.html` (sons inchangés, `SONS.md`).
- Note de style : `NOTE-STYLE.md`. PNG : mêmes noms que les HTML, un par écran, plus `*-ensemble.png`.
- Sources : `_generer.py`, `_sprites.py`, `_extra.py`, `_css.css`, `_css2.css`, `_captures.py`.

## Décisions à demander à Romain
1. Direction A (sobre) ou B (audacieuse) pour le quiz, et pour la roue (on peut panacher) ?
2. Le pixel est-il une option du pro (Classique par défaut) ou remplace-t-il le Classique ?
3. Coeurs et croix : rouge vif #DC2626 (ajout hors charte) ou rouge Flowin #C2410C ?
4. Écran de fin : « INSERT COIN, prochain quiz : demain » suppose 1 quiz par jour et par station. Confirmer.
5. HIGH SCORE : afficher les initiales d'autres joueurs, ou seulement le meilleur score du jour sans nom ?
6. Le bandeau tramé orange derrière le cartouche suit la couleur du logo : OK, ou orange Flowin fixe ?
7. Lot d'exemple « Un café offert pour un bagel acheté » : à remplacer par le lot du jour réel.

## Non vérifié
Rendu sur téléphone réel et sons sur iPhone (pas de téléphone). Animations jouées seulement dans un navigateur d'ordinateur ; les PNG montrent les états fixes (mouvement réduit). Police pixel chargée depuis Google Fonts : prévoir un hébergement local. Roue de 315 px : à adapter sur écran de 320 px au codage.
