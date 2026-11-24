# Sons 8 bits (lot 7, maquette)

Écoute : ouvrir `lot7-4-sons.html` dans un navigateur d'ordinateur (un bouton par son, bouton Couper). Tout est produit par Web Audio, aucun fichier son.

## Règles
- Un oscillateur par note, forme `square` (carrée) ou `triangle`. Enveloppe : montée 5 ms, tenue 70 %, descente jusqu'à zéro (pas de clic).
- Volume maximal 0,2 (0,1 par voix pour les accords). Aucun son plus long que 1,5 s.
- Le contexte audio ne démarre qu'au premier toucher du joueur (obligatoire sur téléphone). Bouton son en haut à droite (48 px), état retenu sur l'appareil (`localStorage`, avec repli si indisponible). Son actif par défaut après le premier toucher (décision du 24/11 : sons autorisés, bouton pour couper).
- Mode « mouvement réduit » : les animations s'arrêtent, les sons restent (le bouton couper suffit).
- Aucun son quand l'onglet est caché.

## Tableau
| Son | Forme | Notes (Hz) | Durée | Quand |
|---|---|---|---|---|
| Démarrage | carrée | 523,25 · 659,25 · 783,99 · 1046,5 | 90 + 90 + 90 + 260 ms | bouton JOUER |
| Pièce | carrée | 987,77 puis 1318,51 | 70 + 300 ms | point gagné, ticket reçu |
| Bonne réponse | carrée | 659,25 · 783,99 · 1046,5 | 80 + 80 + 220 ms | réponse juste |
| Erreur | triangle | 220 glissé vers 110 | 380 ms | réponse fausse |
| Combo | carrée | 783,99 · 1046,5 · 1318,51 · 1567,98 | 60 + 60 + 60 + 240 ms | 3 bonnes de suite |
| Tick de roue | triangle | 880 | 30 ms | un tick par case qui passe l'aiguille |
| Perdu | triangle | 392 · 329,63 · 261,63 | 160 + 160 + 300 ms | case perdu |
| Jackpot | carrée + accord | 523,25 · 659,25 · 783,99 · 1046,5 · 1318,51 · 1567,98 puis accord 1046,5 + 1318,51 + 1567,98 | 6 x 70 ms, 2 x 220 ms, 500 ms (≈ 1,5 s) | lot gagné, case ticket |

Tick de roue : l'intervalle grandit de 60 ms à environ 700 ms (x1,16 à chaque tick, 20 ticks) pour suivre la roue qui ralentit ; en vrai, on déclenche un tick à chaque passage d'une frontière de case, pas sur un minuteur.

## Limites
Non vérifié sur iPhone (pas de téléphone pour tester). Sur iPhone, le commutateur « silencieux » peut couper Web Audio : à tester avant de promettre quoi que ce soit.
