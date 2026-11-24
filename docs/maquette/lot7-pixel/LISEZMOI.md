# Lot 7 : variante pixel arcade, quiz et roue (maquette, 24/11/2026)

Maquette seulement : aucun code d'application, aucune base touchée. Variante à part, le style Classique reste le défaut. Textes, scores et noms marqués « exemple » sont fictifs ; code ticket : `[à générer]`.

## Fichiers
- `NOTE-STYLE.md` : palette, polices, grille, composants, sprites, accessibilité. `SONS.md` : spécification des sons.
- `lot7-0-style.html` : planche de style. `lot7-1-quiz.html` : 9 écrans (départ, question, bonne, mauvaise, COMBO x3, bonus, fin INSERT COIN / HIGH SCORE, variante aubergine, accent commerce). `lot7-2-roue.html` : 6 écrans (roue prête, tourne, lot, perdu, case ticket, ticket gagné). `lot7-3-choix-style.html` : choix du style pour le pro (2 états). `lot7-4-sons.html` : écoute des sons.
- PNG 390 px : `lot7-1-quiz-*.png`, `lot7-2-roue-*.png`, `lot7-3-choix-*.png`, plus `*-ensemble.png` par page.
- Sources : `_generer.py`, `_sprites.py`, `_css.css`, `_captures.py` (relancer : `python3 _generer.py && python3 _captures.py`).

## Ce qui est respecté
Logo du commerce dans le cartouche de chaque écran ; textes courts ; aucun emoji (sprites SVG) ; 44 px de cibles (60 px en pratique) ; contrastes mesurés ; animations coupées sous `prefers-reduced-motion` ; bouton couper le son ; pas de « tirage » côté gain immédiat (seule la case ticket de la roue en parle, autorisée par Romain le 24/11).

## Violet : quel fond respecte la règle
Le bleu nuit #0B1230 (teinte 229°) respecte « jamais de violet ». L'aubergine de la vidéo de référence (#26122B, teinte 283°) est un violet sombre : elle ne respecte pas la règle. Recommandation : bleu nuit. L'aubergine reste montrée en variante (écran 8) pour comparer.

## Décisions à demander à Romain
1. Fond : bleu nuit (recommandé) ou aubergine malgré la règle « jamais de violet » ?
2. Faire du pixel arcade un choix du pro (Classique par défaut, Pixel arcade en option, un toucher) ou le remplacer partout ?
3. Accent : couleur du commerçant (comme le Classique) ou jaune fixe pour toutes les marques ?
4. Écran de fin : « INSERT COIN » avec « Prochain quiz : demain » suppose 1 quiz par jour et par station. Confirmer cette phrase.
5. Écran de perte de la roue : « Pas de lot cette fois. » suffit-il, ou faut-il une phrase de relance ?
6. Sons : actifs par défaut après le premier toucher (bouton pour couper) : confirmé comme prévu le 24/11 ?
7. Les scores HIGH SCORE affichent des initiales d'autres joueurs : a-t-on le droit de les montrer, ou seulement le meilleur score du jour sans nom ?
8. Le texte « Un café offert pour un bagel acheté » est un exemple tiré de ta note ; à remplacer par le lot du jour réel du commerçant.

## Non vérifié
Rendu sur un vrai téléphone et sons sur iPhone (pas de téléphone). Polices chargées depuis Google Fonts : prévoir un hébergement local si le réseau les bloque. Taille de la roue sur petits écrans (320 px) : roue de 315 px, à adapter au codage.
