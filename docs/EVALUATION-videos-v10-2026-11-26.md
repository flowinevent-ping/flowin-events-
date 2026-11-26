# Évaluation des vidéos v10 (26/11/2026)

Méthode : mesures sur les fichiers (durée, mots par seconde, longueur des plans), transcription automatique de la voix (faster-whisper), relecture image par image des planches de chaque film. **Les notes sont mon estimation ; je n'ai pas écouté les voix.** Critères de Romain : adapté, assez rythmé, bonne explication du produit, qualité de présentation.

| Vidéo | Durée | Mots/s | Plans | Note /10 (v9 → v10) | Ce qui marche | Ce qui manque pour 9 ou 10 |
|---|---|---|---|---|---|---|
| Commerces | 46 s | 2,7 | 10 voix, 14 plans | 5,5 → **7,5** | accroche = la promesse ; un jeu « que vous sélectionnez » est montré ; retour de Léa et offre flash créés ; texte de Romain presque entier | 46 s, c'est long pour un réseau social (coupe 25 s à faire) ; « mieux les connaître » montre un graphique côté commerçant ; pas de gag ni d'avant/après |
| Participants Super Event | 37 s | 2,8 | 8 voix, 13 plans | 5,5 → **7,5** | vraie scène de festival ; trait lumineux de la carte = « suis le flow » ; duel « Challenge tes potes » | le quiz montre une question générique ; « Remporte les lots du festival » reste une liste ; fin plutôt sage |
| Organisateurs | 54 s | 2,5 | 10 voix, 13 plans | 7 → **7,5** | fil avant / pendant / après ; les deux plans à côté sont corrigés (sources du trafic, trois étapes) | 54 s ; les barres RSE et les sources sont « exemple » sans vrai chiffre ; fin à retoucher |
| Participants Animation | 31 s | 3,1 | 8 voix, 14 plans | 5 → **7** | plus de trois « occasion » plaquées : trois temps rythmés par la scène ; signature « Suis le flow » | le quiz montre le sondage du commerçant ; plans f2 réutilisés ; peu de surprise |

## Voix
- « Flow in » reconnu partout (« Flow-in »). « Lots » maintenant bien transcrit dans les quatre films (il ne l'était pas). Restent : « roue » lu « roux » (a-com), « potes » = « pots » (homophone, pas une erreur).
- Intonation amplifiée ×1,5 : amplitude mesurée 7,7 → 11 demi-tons. À valider à l'oreille.

## Pourquoi pas 10 sur 10
Un 9 ou un 10 demande trois choses que je ne peux pas faire seul : (1) l'écoute de Romain, plan par plan ; (2) des scènes dessinées exprès pour chaque phrase au lieu de reprendre les scènes des films v4 (travail de plusieurs heures par film) ; (3) des coupes courtes (25 à 30 s) pour les réseaux sociaux.

## Corrections faites aujourd'hui (v10b)
- Commerces : ponctuation de la dictée (deux-points) pour que « quiz » soit bien lu.
- Participants Super Event : « lots à gagner, cadeaux liés au festival » et « Remporte les lots du festival » (lecture stable de « lots »).
- Participants Animation : vidéo créée (script `scripts10.json`, scènes `build-films-v10.py`).
- Texte « tirage au sort » (Animation) au lieu de « grand tirage » (terme Super Event).
