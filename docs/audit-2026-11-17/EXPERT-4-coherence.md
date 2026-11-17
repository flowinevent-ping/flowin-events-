# EXPERT 4 — Cohérence visuelle des jeux (app · films · plaquettes V3) — 17/11/2026

Captures : app réelle en prod (`/jouer?ev=…&preview=1`, 390×844, 0 requête non-GET vers supabase.co),
films V4 (`videos/v4/f2-participant-animation.mp4`, scènes de `videos/scenes/films-v4.html`), animations v22,
plaquettes V3. Planches app | film | plaquette : scratchpad `audit17/coherence/planche-*.jpg` (non versionnées).

## Différences relevées
| Jeu | Élément | App (réelle) | Film V4 | Plaquette V3 (avant) |
|---|---|---|---|---|
| Quiz | Fond | Plein écran dégradé bleu nuit, pas d'en-tête commerce | Écran blanc, bandeau bleu « B Boutique » | Carte blanche + en-tête « BE Boulangerie Exemple » |
| Quiz | Progression | « QUESTION 1 / 5 » + 5 barres + minuteur rond 30 s + croix | « QUIZ · 1 / 3 » texte seul | « Question 1 / 1 » |
| Quiz | Réponses | 4 cartes blanches arrondies, pastille lettre A–D | 3 réponses, bord gris, sans lettre ; choisie = bleu plein | 3 réponses A–C |
| Quiz | Retour | Carte « Bonne réponse ! » verte + confettis + « Question suivante » violet | Réponse passe en bleu plein | absent |
| Quiz + bonus | Écran | Page « Questions bonus », pastille « +1 ticket supplémentaire », 4 cartes BONUS n/4 à puces-choix, bouton « Valider mes réponses » | Absent des films | Une carte « Question bonus · +1 ticket » + 3 choix |
| Tombola | Écran | « TOMBOLA DU JOUR / Ton ticket t'attend », fente d'imprimante, gros bouton rond vert « Tirer mon ticket », étapes Jouer › Résultat › Mon ticket, couleur verte | Billet orange/jaune « Ticket n° … TOMBOLA » (v22 : billet jaune « 0427 Ticket gagnant ») | Ticket papier statique « [N°] », thème bleu |
| Roue | Secteurs | 6 secteurs couleurs vives libellés (Surprise vert, Rejoue gris, −10 % orange, +1 ticket bleu, Pas cette fois gris, Cadeau rouge) | 8 secteurs bleu/bleu nuit/blanc sans texte, points blancs | 10 secteurs bleus libellés |
| Roue | Pointeur / moyeu | Épingle blanche à point teal, moyeu teal, ampoules orange | Triangle rouge cerné noir, moyeu blanc cerné noir, jante noire épaisse | Épingle blanche point bleu clair |
| Roue | Bouton | « Lancer la roue » violet pleine largeur | aucun | aucun |
| Toutes | Bouton principal | Violet #7C4DDB environ, pleine largeur | Bleu Flowin | Bleu |

## Référence retenue
- **Plaquettes : l'app fait foi.** Les 4 onglets Multi-jeux de `plaquette-animation-v3.html` montrent désormais
  des **captures réelles** de l'app (`validation/captures/app-jeu-{quiz,quiz-bonus,tombola,roue}.jpg`, 520 px, 40–70 Ko)
  dans un cadre de téléphone. Le JS de la roue CSS est neutralisé proprement (`if (wheel)`), Acorn 2020 OK,
  390 et 1280 sans défilement horizontal.
- `plaquette-super-event-v3.html` : pas d'écran de jeu (illustration « bonus → graphique », conceptuelle) : inchangée.
- **Films : pas de re-rendu.** Écarts non bloquants (les films sont des illustrations stylisées), sauf la roue
  (couleurs et pointeur différents) : à reprendre si l'app adopte la spec ci-dessous, sinon re-rendre la scène 2
  du film 2 et la scène « jeu » du film 5 avec la roue de l'app. Gravité : moyenne, non bloquante.

## Pour l'expert jeux (EXPERT 1 — admin/app/jouer, admin/components/parcours)
Le design des films est jugé très bon par Romain. Points où le film est meilleur, à appliquer dans l'app :
1. **Roue — lisibilité du pointeur** : remplacer l'épingle blanche/teal par un **triangle rouge #E5322D cerné #0F172A
   (trait 4 px), pointe vers le bas**, posé à cheval sur la jante ; **jante sombre #0F172A** (anneau 4–6 px) autour
   des secteurs ; moyeu **blanc cerné #0F172A (6 px)**. Garder les 6 secteurs libellés et couleurs actuelles.
2. **Roue — bug d'affichage** : la ligne « Case « Ticket » : 1 ticket pour le tirage du [date…] » est éclatée en
   deux colonnes (icône · texte · date à droite). La mettre sur une seule ligne centrée, date inline.
3. **Quiz — réponse choisie** : comme le film, la réponse touchée passe immédiatement en **fond plein couleur
   de marque, texte blanc** (avant le verdict vert/rouge), pour un retour tactile net.
4. **Quiz — en-tête commerce** : le film montre le nom du commerce (bandeau « B Boutique ») pendant la question ;
   l'app ne montre que « DÉMO · QUIZ » en petit. Ajouter le monogramme + nom du commerce dans la barre supérieure
   (à gauche de « QUESTION 1 / 5 »), sans ajouter de ligne.
5. **Tombola** : le film matérialise le **billet** (couleur, « Ticket n° », code) dès l'écran de jeu ; l'app affiche
   une fente vide. Afficher sous la fente l'amorce du billet (bord haut avec code-barres pointillé), qui sort au tirage.
6. **Décor tombola** : les deux disques verts décoratifs en bas d'écran (dont un coupé) paraissent être des
   artefacts ; les supprimer ou les rendre très pâles.
