# Note de style : pixel dans la charte Flowin (lot 7, maquette, version claire)

Principe : on garde la charte Flowin (fond clair, cartes blanches, texte encre, boutons pastille, cartouche logo) et on ajoute des éléments pixel. Aucun personnage ni mascotte : uniquement des formes, des envahisseurs géométriques, pièces, étoiles, coeurs, coffres, jauges, pixels qui éclatent. Planche : `lot7-0-style.html`.

## Palette (charte existante, rien de violet)
Orange #B5471E (dégradé vers #D2631F), orange clair #E8872F, bleu animation #3B5CC4, encre #1B3A5C, vert OK #15803D, rouge Flowin #C2410C, jaune #F5B82E, orange pâle #FFF4EA, bleu pâle #E3E9F8, fond #FFFDFA. Seul ajout : un rouge vif #DC2626 pour les coeurs et la croix (à valider ; sinon #C2410C).
Accent du commerce : la variable `--a` (orange Flowin par défaut) prend la couleur dominante du logo quand il en a (exemple en framboise #BE123C). Boutons, mots clés, envahisseurs, aiguille et bandeau suivent. Règle de code : si le contraste du blanc sur cette couleur est inférieur à 4,5, retour à l'orange Flowin.

## Contrastes mesurés
Blanc sur orange #B5471E 5,4 ; blanc sur #D2631F 3,8 (texte gras 18 px, seuil gros texte 3) ; encre sur blanc 11,6 ; gris #52647A sur blanc 6,1 ; vert foncé #0F5A2B sur vert pâle 7,3 ; rouge #C2410C sur rouge pâle 4,5 ; blanc sur framboise 6,3.

## Typographie
Police pixel (Press Start 2P, Google Fonts) pour les titres et les chiffres de score seulement. Tout le reste en police du système, gras, 16 à 22 px ; 13 px minimum pour les petits textes.

## Pixel : grille 4 px, contour 2 px (4 px en B), ombre dure 4 px sans flou
- Sprites en SVG (un rectangle par suite de cases, contour encre ajouté automatiquement) : 3 envahisseurs, canon, explosion, pièce, coeur plein et vide, étoile, ticket, coffre, bonbon (inspiration gourmande, aucune marque), croix, coche, haut-parleur, 4 formes (carré, rond, triangle, losange). Sources dans `_sprites.py` et `_extra.py`.
- Tramage (dithering de Bayer 4 x 4) : bandeau d'en-tête sous le cartouche, rayons derrière la roue, dégradé des cases de la roue en B.
- Lignes de balayage : 2 px sur 4 à 3,5 % d'opacité sur tout l'écran (supprimables).
- Curseur carré qui clignote en fin de texte tapé.
- Éclatement : carrés de 4 et 8 px aux couleurs de la charte, bordés d'encre.

## Composants communs
Cartouche logo en haut à gauche sur tous les écrans (logo sur tuile blanche 56 x 40 comme le ticket du lot 6). Bouton son 52 px. Vies : 3 coeurs. Cases à cocher : 5 carrés, cochée verte, courante à la couleur d'accent. Chrono : 15 blocs, vert puis jaune sous 60 %, rouge sous 30 %, secondes écrites. Réponses : 60 px de haut minimum. L'état n'est jamais donné par la couleur seule (coche, croix, lettre).

## Les deux directions
- A, sobre-arcade : cartes carrées à contour 2 px, réponses en liste, score en chiffres pixel, rangée d'envahisseurs en bas (un par question), canon qui tire sur la bonne réponse, la rangée descend sur une erreur. Ticket du lot 6 avec touches pixel.
- B, audacieuse : coins en escalier, bandeau tramé orange plus dense, plaque de score encre, réponses en grandes tuiles carrées avec forme (carré, rond, triangle, losange), formation d'envahisseurs de 3 types en page de départ, jauge de combo x1 x2 x3 avec éclats, podium de score, fente INSERT COIN, rayons tramés derrière la roue, lampes, ticket imprimé en escalier. Boutons pastille à contour 4 px.

## Séquences d'états (`lot7-5-sequences.html`)
Texte tapé avec curseur puis réponses en cascade (0,12 s d'écart) ; appui puis éclatement de pixels, score qui passe de 0200 à 0300, +100 qui monte ; combo x1, x2, x3 ; roue dont les cases s'allument au passage de l'aiguille, un tick par case ; ticket qui sort d'une fente ligne par ligne (12 paliers en 2,4 s). Tout en `steps()`, jamais lissé. Les HTML jouent ces animations ; elles sont coupées sous `prefers-reduced-motion: reduce` (états finaux seulement). Rien ne clignote plus de 3 fois par seconde.

## Accessibilité
Contrastes ci-dessus. Cibles 56 à 60 px (44 px minimum partout, y compris légende de la roue). Roue : `aria-label` et légende icône + mot. Chrono en texte. Focus visible (contour bleu 4 px). Sons : voir `SONS.md`, bouton couper.
