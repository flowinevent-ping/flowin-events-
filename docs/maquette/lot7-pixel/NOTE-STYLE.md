# Note de style : pixel arcade (lot 7, maquette)

Variante à part du style Classique, pour le quiz et la roue seulement. Planche visuelle : `lot7-0-style.html` / `lot7-0-style-ensemble.png`.

## Références analysées (ref-1 à ref-3, sans copier le contenu)
Fond très sombre avec étoiles pixel ; police pixel ; étiquettes à contour 2 px (menthe, jaune, rouge) ; cases à cocher en haut qui se cochent ; sprites 16 bits ; flèches pointillées ; texte qui se révèle bloc par bloc ; gros titre blanc dans un cadre, un mot clé en jaune. Tout cela est repris dans le principe, avec nos propres dessins.

## Palette (hex), contraste mesuré sur le fond bleu nuit
| Rôle | Hex | Contraste |
|---|---|---|
| Fond (bleu nuit) | #0B1230 | |
| Panneaux, réponses | #16214F | crème dessus 13,6 |
| Décor, cases vides, sol | #24336E | pas de texte dessus |
| Contours et ombres dures | #05081A | |
| Texte, contour clair | #F7F1DC | 16,2 |
| Accent, mot clé, bouton | #FFD23F | 12,7 |
| Bonne réponse, ticket | #5CE6A8 | 11,7 |
| Erreur, vie, aiguille | #FF6B6B | 6,6 |
| Texte secondaire | #A9B4E0 | 9,0 |
| Bouton secondaire (bleu Flowin) | #3B5CC4 | crème dessus 5,3 |

Fond : le bleu nuit (teinte 229°) respecte la règle « jamais de violet ». L'aubergine de la référence (#26122B, teinte 283°) est un violet sombre : écartée, montrée seulement en variante (quiz écran 8).
Couleur du commerçant : la variable `--accent` (jaune par défaut) prend la couleur du commerce (règle « le jeu prend les couleurs du commerçant »), à condition que son contraste sur le fond soit d'au moins 4,5 ; sinon retour au jaune.

## Polices (Google Fonts, libres)
- Press Start 2P : titres, score, boutons. 14 px minimum.
- Silkscreen gras : questions et réponses (18 à 21 px), textes secondaires 13 px minimum.
- Repli : `Courier New`, monospace.

## Grille et formes
- Tout est un multiple de 4 px (marges, hauteurs, sprites à 3, 4, 6 ou 8 px la case).
- Contour 2 px, ombre dure 4 px (`4px 4px 0 #05081A`), aucun flou, aucun dégradé, coins carrés.
- Fond : étoiles de 4 px, 20 à 50 % d'opacité. Sol en briques de 32 px, ligne crème de 4 px.

## Composants
- Bouton : jaune, hauteur 60 px, texte noir, bande sombre de 6 px en bas (effet relief). Secondaire : bleu Flowin. Neutre : contour crème.
- Réponse : 60 px de haut, pastille lettre 44 px. Bonne : fond vert sombre, pastille menthe, coche. Mauvaise : fond rouge sombre, croix. Les autres s'éteignent. L'état n'est jamais donné par la couleur seule.
- Étiquette : contour 2 px colorié, 13 px.
- Vies : 3 coeurs 7x6 (plein rouge, vide bleu sombre). Score : 4 chiffres. Cases à cocher : 5 carrés de 24 px (cochée menthe, courante jaune). Chrono : 15 blocs, vert puis jaune sous 60 %, rouge sous 30 %, avec les secondes écrites.
- Cartouche du commerce : en haut à gauche, logo sur tuile blanche 44 px + nom. Reste sur tous les écrans.
- Bouton son : 48 px, en haut à droite, pictogramme haut-parleur / barré.

## Sprites (SVG pixel, un rectangle par suite de cases, contour noir ajouté automatiquement)
Héros 10x14, pièce 8x8, coeur 7x6, étoile 7x7, ticket 12x8, tasse (logo exemple) 11x9, coffre 14x10, croix 7x6, coche 8x5, aiguille 9x5, haut-parleur 10x8. Source : `_sprites.py` (grilles en texte, modifiables). Aucun emoji.
La roue : disque de 45 cases à 7 px généré par `_sprites.py` (8 cases de 45°, lampes sur le bord). Les icônes (pièce, croix, ticket) restent droites pendant la rotation.

## Mouvement (coupé si `prefers-reduced-motion: reduce`)
Tout par paliers (`steps()`), jamais lissé : clignotement INSERT COIN (1 s), pièces qui sautillent (2 positions), tremblement 0,4 s sur erreur, +100 qui monte en 6 paliers, roue qui ralentit. Révélation de la question lettre à lettre (30 ms par lettre, tick léger) : affichage immédiat si mouvement réduit. Rien de clignotant plus de 3 fois par seconde.

## Accessibilité
Contrastes ci-dessus (tous au-dessus de 4,5). Cibles 44 px minimum (réponses et boutons 60 px). Coche et croix en plus de la couleur. Roue : `aria-label` et légende icône + mot. Chrono : secondes en texte. Focus visible (contour crème 4 px). Texte pixel jamais en dessous de 13 px.
