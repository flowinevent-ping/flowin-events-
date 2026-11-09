# Audit design vs information des plaquettes V3

Date : 09/11/2026. Auditeur extérieur (direction artistique et architecture de l'information). Aucun fichier modifié hors ce rapport.
Fichiers : `admin/public/validation/plaquette-super-event-v3.html` (8 écrans), `admin/public/validation/plaquette-animation-v3.html` (9 écrans).
Méthode : serveur local, captures Playwright de chaque écran `.pg` (navigation par `#id`) à 390 x 844 et 1280 x 800, mesures automatiques dans le navigateur : mots visibles, blocs (cartes, puces, étapes), part de surface du visuel (SVG, images, maquettes) et du texte (surface des lignes), tailles de police distinctes. Temps de lecture estimé à 200 mots / minute (lecture de plaquette, pas de survol).
Ne sont pas repris ici les points déjà corrigés depuis l'audit `audit-exterieur-plaquettes-v3.md` (boutons Animation en bleu, 56 % et 70 réunis, formulaire coordonnées côté Super Event, « Tarifs à confirmer », maquettes de jeu passées en placeholders).

Repère de lecture des mesures : « % visuel » = surface des dessins / surface de l'écran utile (mobile). Un écran « une idée » sain se situe autour de 20 à 40 mots, 1 visuel occupant 35 à 50 % de la surface, 3 tailles de police.

## 1. Diagnostic global

### Super Event V3
- Le design porte le message sur 4 écrans sur 8 (hero, organisateur, parcours, quiz) : titre + un dessin pédagogique, 20 à 29 mots, compris en 5 secondes. C'est exactement « mieux vaut un dessin qu'un long discours ».
- L'information écrase le design sur l'écran Commerce (103 mots, 13 blocs, 5 tailles de police, dessin réduit à un bandeau) et, à moindre degré, sur « Trois plans » (57 mots, 3 cartes à 4 niveaux de texte) et Mesure (47 mots, 2 chiffres + 4 tuiles).
- Décoratif sans informer : la loupe du dessin quiz, les pastilles « Diffuse / Sois visible / Sois présent / En proximité » (4 étiquettes qui répètent le titre), la barre dégradée sous chaque chiffre.
- Rythme : alternance fond nuit / fond blanc (1, 6, 8 nuit) qui casse la continuité ; les écrans 2, 4, 5 ont 15 à 20 % de vide en haut (contenu centré verticalement, titre qui « flotte »).
- Point fort à protéger : le gabarit « sur-titre + titre 2 couleurs + dessin dans un cadre nuit arrondi » est déjà un langage visuel ; il manque seulement aux écrans 3, 6, 7, 8.

### Animation V3
- Le design porte le message sur l'accueil (maquette roue, 60 % de surface), le fichier client (schéma supports vers fichier, très lisible) et les preuves (56 % / 70, focal évident).
- L'information écrase le design sur Le principe (72 mots : les 4 phrases ET le cycle dessiné disent deux fois la même chose), Offres (105 mots, 0 visuel), Contact (formulaire + 3 étapes + QR, 43 mots mais 6 actions).
- Décoratif ou bruyant : les bulles « À vos couleurs » répétées deux fois sur la même maquette, les sélecteurs dans l'écran Supports (onglets « Avec un logo / Vierge » + flèches + 6 vignettes = 3 niveaux de navigation dans un écran de carrousel).
- Hiérarchie plus faible que Super Event : titres à 24 px mobile pour un corps à 15 px (rapport 1,6, contre 2,1 pour l'accueil Super Event) ; beaucoup de cartes à bord fin identiques, peu de point focal.
- Les deux plaquettes ne partagent pas encore un gabarit d'écran : Super Event a des dessins en cadre sombre, Animation des dessins au trait sur fond lavande ; même produit, deux grammaires.

## 2. Tableau écran par écran

Mesures en mobile 390 x 844 (les mots sont identiques en ordinateur ; le % visuel baisse de 5 à 15 points en ordinateur faute de mise en deux colonnes sur certains écrans).

### Super Event V3

| # | Écran | Mots | Blocs | % visuel | Tailles police | Lecture | Point focal | Verdict | Proposition |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Hero | 29 | 2 boutons + 1 dessin | 38 | 3 | 9 s | Oui (titre) | Équilibré | Raccourcir l'étiquette du 2e bouton à « Je suis un commerce » (4 lignes actuellement, la phrase longue en sous-ligne de 13 px). Le dessin est second : acceptable sur un hero. |
| 2 | Organisateur | 20 | 4 pastilles + 1 dessin | 34 | 2 | 6 s | Oui (dessin) | Équilibré, un peu vide en haut | Supprimer les 4 pastilles ou les poser comme légendes sous le dessin (elles sont décoratives) ; caler le contenu en haut pour agrandir le dessin à 45 %. |
| 3 | Trois plans | 57 | 3 cartes | 18 | 4 | 17 s | Non (3 cartes égales) | Trop d'info | Garder par carte : sur-titre (Avant / Pendant / Après) + titre + vignette. Passer les sous-phrases (« Votre plan de campagne habituel… », « Devenez acteur… », « Pour communiquer après… ») en volet « En savoir plus » ; supprimer le chapeau « Une communication pour votre événement, avant, pendant, après » (redit le sur-titre). Cible 30 mots. |
| 4 | Parcours festivalier | 26 | 1 schéma | 34 | 2 | 8 s | Oui (cycle) | Équilibré, trop d'air en haut (environ 180 px vides) | Agrandir le schéma à pleine hauteur disponible (cible 50 %) ; c'est l'écran modèle. |
| 5 | Quiz | 22 | 3 pastilles + 1 dessin | 34 | 3 | 7 s | Oui (dessin bonus vers graphique) | Équilibré | Retirer la loupe (décorative). Les pastilles RSE / Sensibilisation / Sécurité peuvent devenir les trois étiquettes des barres du graphique : le dessin porte alors l'info. |
| 6 | Mesure Nuits du Sud | 47 | 2 chiffres + 4 tuiles | 1 | 5 | 14 s | Oui (56 % / 70) mais concurrencé | Légèrement trop d'info | Garder 56 % et 70 + titre. Remplacer les 4 tuiles « Ce que l'on restitue » par un mini-dessin de rapport (barres + carte + fichier) ou les déplacer à l'écran 3 « Après ». Supprimer les barres dégradées sous les chiffres. Une seule ligne de sur-titre (« Nuits du Sud 2026 · Alpes-Maritimes ») au lieu de sur-titre + nom + titre. |
| 7 | Commerce et formules | 103 | 13 (dessin, 3 cartes prix, 9 puces) | 20 | 5 | 31 s | Non | Trop d'info (écran le plus lourd) | Scinder en deux écrans : 7a « Connecte ton commerce » (titre + phrase + dessin jeu vers vitrine agrandi à 45 %) ; 7b « Les formules » (carrousel prix, 1 carte visible, 2 puces maximum par formule, le reste en « En savoir plus »). |
| 8 | Passer à l'action | 43 | 3 étapes, 3 champs, 4 boutons | 9 | 3 | 13 s | Oui (étape 1 encadrée) | Équilibré pour un écran d'action, dense | Retirer « Effacer ce que j'ai saisi » de l'en-tête (le déplacer sous le formulaire, en lien discret) ; l'URL brute du QR en 13 px plutôt qu'en lien jaune souligné qui attire l'œil plus que le bouton. |

### Animation V3

| # | Écran | Mots | Blocs | % visuel | Tailles police | Lecture | Point focal | Verdict | Proposition |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Accueil | 58 | 1 carte + 2 liens + maquette | 60 (47 ordinateur) | 3 | 17 s | Oui (Animer / Booster / Fidéliser) | Équilibré mais bavard | Garder le slogan + maquette ; les quatre phrases (« Animez votre clientèle… ») en une ligne de 13 à 15 mots maximum ; une seule bulle « À vos couleurs » (actuellement deux + une légende identique). |
| 2 | Le principe | 72 | 4 étapes + 1 schéma | 39 | 3 | 22 s | Non (texte et schéma se disputent) | Trop d'info (doublon texte / dessin) | Fusionner : poser chaque phrase de Romain comme légende courte de l'étape du cycle (Il flashe / Il joue / Il gagne / Il revient) et passer le texte intégral en « En savoir plus ». Cible 30 mots visibles, schéma à 50 %. |
| 3 | Multi-jeux | 50 | 4 onglets + 1 maquette | 40 | 5 | 15 s | Oui (maquette) | Équilibré | Titre : la liste des 4 jeux apparaît deux fois (titre + onglets). Titre court (« Quatre jeux, un seul outil ») et les onglets portent les noms. Réduire à 3 tailles de police. |
| 4 | Le quiz | 43 | 2 cartes + 1 dessin | 30 | 3 | 13 s | Moyen | Légèrement trop d'info | Supprimer la 2e carte « Développer ses produits… » ou en faire la légende sous le graphique (« Les indicateurs » devient « Pour améliorer vos offres »). Le dessin bonus vers graphique porte le message : l'agrandir à 45 %. |
| 5 | Supports et QR | 51 | 2 cartes + 2 onglets + carrousel + 6 vignettes | 42 | 4 | 15 s | Non (trop de commandes) | Trop d'info (en interface, pas en texte) | Garder le carrousel d'images comme point focal, supprimer l'interrupteur « Avec un logo / Vierge » (en « En savoir plus ») et les deux cartes « QR à imprimer / QR digital » (redondantes avec les vignettes Affiche … Post). |
| 6 | Preuves 56 % / 70 | 30 | 2 chiffres | 0 | 5 | 9 s | Oui | Trop vide en mobile (260 px vides en haut et en bas) | Garder le dépouillement, mais remonter le bloc et ajouter sous les chiffres un petit pictogramme (main levée « rester en contact », cadeau) pour lier le chiffre à son sens ; en ordinateur, le « % » réduit à 50 % de la taille du chiffre est trop décalé : aligner sur la ligne de base. |
| 7 | Fichier client | 43 | 3 pastilles + 1 schéma | 31 | 3 | 13 s | Oui (schéma) | Équilibré | Les 3 pastilles (Nombre de personnes, Hommes / femmes, Un QR par support) peuvent disparaître : « Un QR par support » redit l'écran 5. Agrandir le schéma. |
| 8 | Offres | 105 | 4 cartes prix + mention | 0 | 5 | 32 s | Oui (prix) mais 1 carte sur 4 visible | Trop d'info, aucun visuel | Retirer « Glissez pour voir chaque offre » (le carrousel le montre) ; montrer Mensuelle et Annuelle côte à côte en ordinateur ; options en une ligne. La carte affichée a un tiers de surface vide (hauteur fixe) : ajuster la hauteur au contenu ou y placer la miniature du jeu à vos couleurs. |
| 9 | Contact | 43 | 3 étapes, 3 champs, 4 boutons | 13 | 4 | 13 s | Oui (étape 1) | Équilibré, dense | Aligner sur l'écran 8 Super Event (même gabarit d'étapes numérotées) ; libellés des champs au-dessus (comme Super Event) plutôt qu'en placeholder entre crochets, qui se lit comme du texte manquant. |

Totaux : Super Event 347 mots (moyenne 43 / écran, 2 écrans au-dessus de 50) ; Animation 495 mots (moyenne 55 / écran, 4 écrans au-dessus de 50). Animation est 40 % plus bavarde pour un écran de plus.

## 3. Principes de mise en page à appliquer partout

1. **Règle 1-1-1 par écran** : un sur-titre, un titre (2 couleurs maximum), une phrase de 20 mots maximum, un visuel. Tout le reste va dans un volet « En savoir plus » replié (un seul par écran).
2. **Budget de mots** : 35 mots visibles par écran ; 50 pour l'écran prix et l'écran d'action. Au-delà, scinder l'écran ou replier.
3. **Hiérarchie en 3 niveaux, 3 tailles** : titre (24 mobile / 32 ordinateur), corps (15 / 18), légende (13). Les chiffres clés sont la seule exception (une 4e taille, réservée à l'écran preuves). Aujourd'hui 6 écrans utilisent 5 tailles.
4. **Le visuel occupe 40 à 50 % de l'écran et il porte une information** : chaque dessin doit être lisible sans le texte (tester en masquant le texte). Supprimer tout élément qui ne passe pas ce test (loupe, barres dégradées, bulles répétées, pastilles qui redisent le titre).
5. **Gabarit commun aux deux plaquettes** : contenu calé en haut (marge fixe de 32 px sous l'en-tête, pas de centrage vertical), même cadre de dessin (coins 16 px, fond nuit pour Super Event, fond bleu très clair pour Animation, même trait), même gabarit d'écran d'action à trois étapes numérotées, seule la couleur d'accent change (orange / bleu).

## 4. Propositions classées

### P0 (à faire avant la prochaine présentation à Romain)
- Super Event écran 7 : scinder en « Connecte ton commerce » (dessin agrandi) et « Les formules » (carrousel, 2 puces par formule).
- Animation écran 2 : fusionner les 4 phrases dans les légendes du cycle, texte complet en « En savoir plus ».
- Animation écran 8 Offres : retirer la consigne « Glissez… », hauteur de carte ajustée, deux offres côte à côte en ordinateur.
- Les deux plaquettes : caler le contenu en haut (supprimer le centrage vertical) et agrandir les dessins existants dans l'espace libéré (écrans SE 2, 4, 5 ; Animation 6, 7).

### P1
- Super Event écran 3 : sous-phrases des trois cartes en « En savoir plus », suppression du chapeau.
- Super Event écran 6 : remplacer les 4 tuiles par un mini-dessin de rapport ou les déplacer en « Après » ; retirer les barres dégradées.
- Animation écran 5 : retirer l'interrupteur logo / vierge et les deux cartes QR, garder le carrousel.
- Animation écran 4 : retirer la carte « Développer ses produits », la mettre en légende du graphique.
- Plafonner à 3 tailles de police (hors chiffres clés) dans les deux feuilles de style.

### P2
- Unifier le cadre des dessins entre les deux plaquettes (même rayon, même épaisseur de trait, fonds déclinés en orange / bleu).
- Super Event : réduire l'alternance nuit / blanc à deux écrans (hero et action) pour la continuité.
- Retirer les éléments décoratifs : loupe (quiz SE), bulle « À vos couleurs » en double (accueil Animation), pastilles de l'écran organisateur.
- Animation écran 9 : reprendre le gabarit d'action de Super Event (libellés au-dessus des champs, mêmes boutons).
- Animation écran 3 : titre court, la liste des jeux portée par les onglets seulement.
