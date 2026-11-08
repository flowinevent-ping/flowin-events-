# Audit vidéos Flowin Event (08/11/2026)

Audit seul, aucune production. Règle appliquée : audit, puis proposition, puis validation de Romain.
Référentiel : `docs/DECISIONS-flowin-event.md` (sections du 08/11), `docs/CADRAGE-refonte-flowin-event.md`,
`docs/audit-2026-11-08/audit-severe-conversion.md` (défaut n°1 « arguments distinctifs absents » retiré, non repris).
Positionnement et « Vous testez, vous essayez » = compréhension interne : leur absence à l'écran n'est pas un défaut.

## Méthode

- `ffprobe` (durée, format, flux), images extraites toutes les 4 s (`ffmpeg fps=1/4`, planches dans le scratchpad), examinées une à une.
- Grep des storyboards v16 : données de contact, mots interdits, termes du parcours (SEPA, virement, sexe, rapport).

| Fichier | Format | Durée | Son |
|---|---|---|---|
| validation/commercant.mp4 | 1080×1920 (9:16) | 38,5 s | aucune piste audio |
| validation/partenaire.mp4 | 1080×1920 (9:16) | 32,5 s | aucune piste audio |
| validation/organisateur.mp4 | 1080×1920 (9:16) | 47,5 s | aucune piste audio |
| validation/joueur.mp4 | 1080×1920 (9:16) | 22,5 s | aucune piste audio |
| nds/jeu-video-16x9.mp4 (référence) | 1920×1080 (16:9) | 30,8 s | aucune piste audio |
| nds/spot-nds2026-16x9.mp4 (référence) | 1920×1080 (16:9) | 37,0 s | aucune piste audio |

Constats transverses :
- **Aucune vidéo n'a de son** (ni musique, ni voix). Acceptable en lecture muette sur les réseaux, mais aucune version sonorisée n'existe ; les références de Romain (`nds/kit-digital/nds/refs-romain/LANCEMENT_capcut_montage-son_REF.mp4`) en ont une.
- **Aucun format 16:9 pour les vidéos Flowin Event** (seulement 9:16) ; aucun format 9:16 pour les deux références NDS listées (il en existe dans `kit-digital/`).
- **Parcours réel absent** des quatre vidéos et des storyboards : aucune occurrence de rapports (personnes venues, sexe, CRM, paramètres du jeu), de « publier » ni de paiement par virement SEPA. La vidéo reste une présentation, pas encore le « mi-présentation mi-tuto » acté.
- **0 emoji** constaté dans les images ; noms conformes (« Flowin Animation », « Flowin Super Event », signature « Flowin Event ») dans les quatre vidéos ; « diffusent » employé, aucun « financent ».
- Aucun commerçant n'est mis en situation de « tester le jeu » : conforme. Point de vigilance en P1 ci-dessous (ouverture commerçant).

---

## 1. commercant.mp4 (Flowin Animation) — 6/10

À garder :
- Ouverture 0–2 s : la roue « Café Exemple » aux couleurs d'un commerce, jeu en mouvement, compréhensible en 3 s.
- Slogan « Animer · Booster · Fidéliser » (4 s) et la promesse « Vos clients jouent, vous gardez le contact. »
- Plans bénéfices 8–16 s (fichier client, animer vos clients, capter le passage) : cartes blanches, texte encre, vocabulaire acté.
- Plan QR digital par support avec histogramme vitrine / caisse / réseaux (28 s) : bon passage « tuto ».
- Fin 36 s : « Je crée mon jeu », QR, « Scannez, créez, voyez votre jeu avant de payer. »

Défauts :
1. 16–36 s : rien entre « capter le passage » et « Je crée » sur le parcours réel (inscription, validation, dashboard, rapports personnes venues / sexe / CRM, publier = virement SEPA) ; le spectateur ne voit jamais ce qu'il obtient après inscription.
2. 24 s et 28 s : plan « Un QR digital par support » affiché deux fois (titre seul, puis avec graphique) ; 32 s : « JE CRÉE » seul en gris sur fond vide. Temps morts en 9:16.
3. 20 s : la carte « Affiche sur la porte » et la carte « Support de caisse » en dessous sont en opacité réduite ; textes de légende ≈ 9–10 px équivalents à 390 px de large, illisibles sur mobile.
4. 0–2 s : la phrase « Un tour offert. Un café à gagner. » s'adresse au joueur alors que la cible est le commerçant ; ambiguïté de public dans les 3 premières secondes.
5. Mobiles des plans 8–12 s : listes « Mes clients » en micro-texte (≈ 6–8 px équivalents), décoratives, aucun chiffre lisible.

## 2. partenaire.mp4 (Flowin Super Event, station jeu) — 6/10

À garder :
- Promesse 0 s « Un événement. Tous ses partenaires. Un seul jeu. » sur photo de foule, accent orange conforme.
- 4 s : mur de logos réels Nuits du Sud 2026 : preuve sociale forte.
- Carte du trafic 8 s (festival → librairie, hôtel, café, boutique) : illustre bien le bénéfice.
- Chiffre « plus de 70 lots distribués dans les commerces locaux » (28 s) mis en gros chiffre.
- Fin 32 s : « Je rejoins l'événement », QR, « Scannez pour devenir station jeu. »

Défauts :
1. 12 s et 16 s : plan « Visible en boutique et en ligne » répété à l'identique (doublon de 4 s) ; le mobile du plan est un quiz en micro-texte qui ne montre pas « votre nom dans le jeu ».
2. 28 s : grand aplat orange plein écran juste après les plans blancs et avant le blanc final ; avec le 4 s violet nuit, effet d'aplats juxtaposés que Romain refuse.
3. Parcours absent : rien sur la formule partenaire (2ᵉ écran), le choix digital / kit imprimé, la publication et le virement SEPA.
4. 36 s et au-delà : fin sur noir (≈ 0,5 s) sans carton de fin tenu ; le QR final dure environ 4 s, court pour un scan.
5. Pas de mention de la date ni du lieu de l'événement à rejoindre (Vence, 9–18 juillet) hors du sous-titre du plan 28 s.

## 3. organisateur.mp4 (Flowin Super Event) — 6,5/10

À garder :
- Même ouverture forte que partenaire (promesse, photo de foule).
- 4–8 s : schéma « Un seul jeu dans tous les commerces » (festival → café, boutique, hôtel, sponsor, même macaron).
- 12 s : « Vos partenaires diffusent votre événement. En boutique et en ligne. » : formulation actée.
- 16 s : « Association de commerçants : vous aussi, organisez ».
- 24 s : « Vous savez tout : où les gens ont joué, combien ont joué, les contacts, avec accord » : c'est le bon argument de vente (le suivi) ; 28–32 s : 56 % et 70 lots en gros chiffres ; 36 s : logos Nuits du Sud.

Défauts :
1. 28–36 s : enchaînement aplat bleu plein (56 %), aplat orange plein (70 lots), aplat violet nuit (logos) : exactement l'effet « mauvais PowerPoint » proscrit le 08/11.
2. 4 s : plan « Un seul jeu dans tous les commerces » avec la 3ᵉ ligne en fondu partiel, puis répété en entier à 8 s : 4 s perdues.
3. 24 s : mobile du tableau de bord en micro-texte, et la liste ne montre pas le sexe ni les paramètres du jeu ; le « tuto » du suivi reste abstrait.
4. Fin (≈ 40–47 s, selon le storyboard v16) : coordonnées **06 16 35 49 36** et **info@opconsult.co** affichées dans `v16-super-event-organisateurs.html` (2 et 3 occurrences) ; à faire **confirmer par Romain** avant toute diffusion (règle « données inventées interdites »). Le bouton attendu est « Prendre rendez-vous » par WhatsApp ou email.
5. 47,5 s : la plus longue des quatre ; la première décision d'appel arrive après 40 s, trop tard sur un réseau social.

## 4. joueur.mp4 (modèle joueur générique) — 5/10

À garder :
- Rythme « Flashe. Joue. Gagne. » clair en 3 s, tutoiement conforme.
- 0 s support de caisse « 1 partie offerte au moment de payer » ; 4 s quiz « Boulangerie Exemple » lisible ; 8 s « 2 tickets ».
- Carton final avec emplacement « QR de l'animation » : bon gabarit réutilisable.

Défauts :
1. 12 s : plan « TON LOT » en gris, sans visuel du lot ni du retrait en boutique : le moment le plus désirable du jeu est vide.
2. 8 s : « GAGNE. » en orange #C2410C (couleur Super Event) et « FLASHE. » en violet, « JOUE. » en bleu : trois couleurs de marque juxtaposées sur trois plans, alors que le jeu joueur doit prendre les couleurs du commerçant.
3. 16–22 s : carton final violet plein écran tenu 6 s, puis noir : aplat vif et fin trop longue pour 22 s.
4. 8 s : le mobile « 2 tickets » est en micro-texte ; le bouton « Valider mes tickets » est illisible.
5. Pas de nom de commerce variable au carton final (seulement « QR de l'animation ») : le modèle n'indique pas où insérer logo et couleur du commerçant.

## 5. Références Nuits du Sud (déjà produites, pour comparaison)

### nds/jeu-video-16x9.mp4 — 7/10
À garder : QR fixe à droite pendant toute la vidéo (scan possible à tout instant), étapes numérotées, lots, carte, partenaires ; univers sombre cohérent avec l'affiche NDS.
Défauts : 12 s et 28 s plans « en cours d'apparition » quasi vides (≈ 4 s chacun) ; textes secondaires (« aux caisses, aux bars… ») trop petits pour un écran vu de loin ; pas de son ; pas de version 9:16 à côté.

### nds/spot-nds2026-16x9.mp4 — 5,5/10
À garder : « Scanne. Joue maintenant. » avec QR et dates (20 s) ; lots en cartes sobres.
Défauts : 24 s plan vide (logo seul) ; 0 s « Flashe. Joue. » sans « Gagne » au premier plan ; fin 28 s avec **ancien nom « FLOWIN.EVENTS »** sous le logo « Flowin » (nom à ne plus utiliser, décision du 08/11) ; 32–37 s noir ; pas de son.

---

## Doublons et fichiers à archiver (proposition, rien n'est déplacé)

- Doublons internes aux vidéos : plans répétés à commercant 24/28 s, partenaire 12/16 s, organisateur 4/8 s.
- `admin/public/nds/kit-digital/nds/` : plusieurs versions du même message (`nds-spot-9x16.mp4`, `nds-insta-9x16.mp4`, `nds-lancement-jeux-9x16.mp4`, `masters/MASTER-reseau-CORRECT.mp4`, `masters/master-lancement-reseau-noqr.mp4`, `clips/base-40s-complete.mp4`, `clips/5-partenaires.mp4` et `clips/5-partenaires-bergerie-allianz.mp4`) ; `refs-romain/` contient des références de travail exposées en public. À trier avec Romain : garder un master par format, archiver le reste hors de `public/`.
- `spot-nds2026-16x9.mp4` (ancien nom) et `jeu-video-16x9.mp4` couvrent le même message : en garder un comme référence.

---

## Proposition d'améliorations (à soumettre à Romain, sur l'existant)

### P0 — bloquant avant diffusion
1. Organisateur : faire confirmer par Romain `06 16 35 49 36` et `info@opconsult.co` (storyboard v16 organisateurs) ; à défaut, remplacer par `[téléphone à compléter]` / `[email à compléter]` et un bouton « Prendre rendez-vous » (WhatsApp ou email).
2. Organisateur 28–36 s, partenaire 28 s, joueur 16–22 s : remplacer les aplats pleins par des cartes blanches, chiffre en encre, couleur de catégorie seulement sur la puce ou le pictogramme.
3. Commerçant et partenaire : ajouter 2 à 3 plans « tuto » courts du parcours réel, montés à partir des écrans existants du dashboard : validation de l'inscription → rapports (personnes venues, sexe, CRM, paramètres du jeu) → « Publier » avec mention virement SEPA `[RIB à compléter]`. Sans faire jouer le commerçant.
4. Spot NDS : retirer « FLOWIN.EVENTS » du carton final (ancien nom) si le fichier reste diffusé.

### P1 — qualité et conversion
5. Supprimer les plans doublons (commercant 24 s, partenaire 12 s, organisateur 4 s) et les plans vides (commercant 32 s « JE CRÉE », NDS 12/24/28 s) : gain de 4 à 8 s par vidéo ; organisateur sous 40 s.
6. Lisibilité mobile : agrandir les mobiles et légendes pour un texte ≥ 13 px équivalent à 390 px de large (commercant 8–20 s, partenaire 12 s, organisateur 24 s, joueur 8 s) ; montrer un seul chiffre clé lisible par mobile plutôt que des listes.
7. Commerçant 0–2 s : garder la roue, mais remplacer la phrase joueur par une phrase commerçant (ex. « Votre jeu, à vos couleurs ») pour lever l'ambiguïté de public.
8. Joueur : remplir le plan « TON LOT » (lot retiré en boutique, date de validité) et passer les couleurs en variables du commerçant (logo, couleur principale) avec emplacement nommé.
9. Fins : carton final tenu 5–6 s avec QR, sans noir après.

### P2 — confort
10. Bande son libre de droits (sans voix) en version alternative, sur le modèle de la référence CapCut de Romain ; garder la version muette sous-titrée pour les réseaux.
11. Déclinaison 16:9 des trois vidéos Flowin Event (écrans, site, salon) à partir des mêmes plans.
12. Tri des doublons de `nds/kit-digital/nds/` et sortie de `refs-romain/` du dossier public (archivage, après accord).
