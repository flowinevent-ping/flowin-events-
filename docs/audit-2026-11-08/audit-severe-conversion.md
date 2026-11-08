# Audit sévère conversion — supports Flowin Event (08/11/2026)

Critère unique : envie de s'inscrire (ou de prendre rendez-vous) après navigation, mesurée au
positionnement acté dans `docs/DECISIONS-flowin-event.md`. Part des audits `audit-2026-11-07/` et
`audit-2026-11-08/` sans les répéter. Captures réelles 390×844, DPR 1 (Playwright, serveur statique local).

## Mesures automatiques (premier écran, 390×844)

| Support | Textes < 13 px visibles | Zones tactiles < 44 px | Emojis |
|---|---|---|---|
| visite-guidee/index.html | 2 (bandeau « Démo · données fictives » 11,5 px, slogan 12 px) | 0 | 0 |
| validation/plaquette-super-event.html | 8 (CTA haut « Prendre rendez-vous » 11,5 px, puces 11 px) | 11 (CTA haut 31 px, croix 36 px, pastilles 43 px) | 0 |
| validation/plaquette-animation-magasin.html | 66 (CTA haut « Je crée mon jeu » 11,5 px, puces 11 px) | 28 | 0 |
| storyboards-video/v16-animation-commercants.html | 79 (tableaux 12–12,5 px) | 4 | 0 |
| storyboards-video/v16-super-event-partenaires.html | 58 | 4 | 0 |

Absences transverses (grep sur les 3 supports commerciaux) : « validité » 0, « centralis » 0,
« Vous testez » 0, « développement local » 0, « concurrent » 0. Les quatre piliers différenciants
du positionnement corrigé (lots avec dates de validité, centralisation, sponsors du développement local,
concurrents des partenaires officiels) ne sont **écrits nulle part**. C'est le défaut n°1, transverse.

Mots interdits : aucun « financent » ni « dort / dormant » en texte (les occurrences « doRT » des storyboards
sont dans des données encodées). Prix cohérents entre visite et plaquette (110 € HT/mois, 990 € HT/an ;
SE 500 / 1 331 / 3 331 € HT).

---

## 1. Visite guidée — `admin/public/visite-guidee/` — 6/10

Le meilleur support : un écran, un choix, trois boutons pleine largeur, lisible. Mais il trie au lieu de vendre.

1. **Écran 1 : aucun bénéfice en 5 s.** « Faites jouer vos clients. » décrit l'outil, pas le gain. Correction :
   titre « Gagnez des clients qui reviennent. », sous-titre « Un jeu à vos couleurs : fichier client, lots à
   retirer en boutique, chaque QR mesuré. Vous testez, vous essayez. »
2. **Écran 1 : moitié basse vide (≈ 270 px).** Correction : y placer un téléphone animé (jeu aux couleurs d'un
   commerce exemple qui tourne en boucle 4 s) — c'est la DA actée (« animation de qualité »).
3. **Couleur du bouton commerçant violette** (`index.html`/`visite.css`) alors que Animation = bleu #3B5CC4 ; le
   bouton « Je joue » est, lui, bleu. Correction : commerçant en bleu #3B5CC4, « Je joue » en neutre/ardoise.
4. **Bandeau « Démo · données fictives » 11,5 px et slogan 12 px** : sous le minimum de 13 px. Correction : 13 px.
5. **`visite.js:485-488` « Autre commerce », « Autres stations »** : sans problème de genre, mais
   `visite.js:172` `vous@exemple.fr` est une donnée d'exemple ; préférer `[email à compléter]` pour rester conforme.
   Les formules SE (`visite.js:160-165`) n'ont aucun argument « sponsor du développement local » : ajouter cette
   ligne au « Sponsor digital » (cas assurance, sans lot).

## 2. Plaquette Super Event — `validation/plaquette-super-event.html` — 5/10

1. **Écran 1 (`#hero`, l.390) : bénéfice organisateur absent.** On voit la promesse, une illustration, mais pas
   ce que l'organisateur gagne (suivi, contacts, où les gens ont joué). Correction : sous la promesse, une ligne
   « Vous savez qui a joué, où, et vous gardez le contact. »
2. **CTA haut l.337 « Prendre rendez-vous » 11,5 px / 31 px de haut** : trop petit pour le seul objectif de la
   page. Correction : 15 px, hauteur 44 px ; et rendre le bouton « Suivant » secondaire sur l'écran 7.
3. **Couleurs hors charte** : jaune/marine/bleu, alors que super event = orange #C2410C / #FF8A14. Le « Un seul
   jeu. » en bleu Animation brouille les deux produits. Correction : accent orange partout sur cette plaquette.
4. **Arguments actés manquants** : sponsors sans lots (« sponsor du développement local »), concurrents des
   partenaires officiels présents. Correction : écran `#gains` (l.415), une carte par profil de partenaire
   (commerce station jeu / sponsor sans lot / marque concurrente de l'officiel).
5. **7 écrans dont « Quiz et sondages » (l.441) et « Avant, pendant, après » (l.428)** : trop pour un organisateur
   qu'on veut amener à un rendez-vous. Correction : fusionner `#temps` et `#quiz`, finir à 6 écrans,
   l'écran NDS (l.472) devient la preuve chiffrée (56 %, plus de 70 lots) juste avant le CTA.

## 3. Plaquette Animation magasin — `validation/plaquette-animation-magasin.html` — 5,5/10

1. **Écran 1 : logo « Flowin » au lieu de « Flowin Event », et violet partout** au lieu du bleu #3B5CC4.
   Correction : marque et accent conformes.
2. **Écran 1 : quatre cartes + deux gros boutons + un lien = trois sujets et trois actions.** Le choix
   « J'organise un événement » n'a rien à faire dans une plaquette commerce. Correction : garder les 4 bénéfices,
   un seul bouton « Je crée mon jeu », passerelle super event en bas d'écran 6 uniquement.
3. **Lots sans dates de validité, ni retour en boutique chiffré** (0 occurrence « validité ») : c'est l'argument
   qui fait payer. Correction : carte « Ramenez du trafic » → « Des lots à retirer chez vous, valables aux dates
   que vous choisissez. »
4. **Tracking par QR digital par support et centralisation absents.** Correction : remplacer la carte « Captez le
   flux passant » par deux lignes : « Un QR par support (vitrine, Facebook, TikTok) : vous voyez lequel marche. »
   et ajouter « Toutes vos campagnes de jeu au même endroit » sur l'écran prix.
5. **66 textes < 13 px, 28 zones < 44 px** (puces 11 px, CTA haut 11,5 px / 31 px). Correction : passer les
   tokens de taille du cadrage (13 px minimum, 44 px) en variables globales du fichier.

## 4. Storyboards vidéo v16 — `storyboards-video/v16-*.html` — 5/10 (outil interne correct, message incomplet)

1. **Aucune vidéo ne porte « Vous testez, vous essayez »** ni le format mi-présentation mi-tuto : ce sont des
   pitchs. Correction : v16-animation-commercants, insérer un plan « écran réel : je crée mon jeu en 3 gestes »
   et finir sur la phrase actée.
2. **v16-animation-commercants : pas de lots datés ni de QR par support.** Correction : remplacer un des plans
   chiffre 56 % (cité 5 fois) par ces deux bénéfices.
3. **v16-super-event-partenaires : pas de sponsor sans lot ni de concurrent d'officiel** ; QR vers `/rejoindre`
   correct. Correction : un plan « Pas de lot ? Soyez sponsor du développement local. »
4. **v16-super-event-organisateurs l.32/39 : numéro WhatsApp en clair** (06 16 35 49 36, info@opconsult.co) :
   à faire confirmer par Romain comme coordonnées officielles, sinon `[à compléter]`.
5. Lisibilité des pages storyboard elles-mêmes (12 px) : secondaire, outil interne.

## 5. Jeu côté joueur — `admin/app/parcours/*` (quizsolo, quiz, spin, tombola, vote) et `app/jouer` — 6/10

1. **Couleur du commerçant bien branchée (`ev.couleur`) mais repli `#7C2D92`** (`QuizsoloClient.tsx:27`, idem
   autres) : un commerce sans couleur saisie joue en violet Flowin, pas « à ses couleurs ». Correction : rendre la
   couleur obligatoire à la création (pré-remplie depuis le logo) et repli bleu neutre.
2. **Textes 12 px dans le jeu** (`QuizsoloClient.tsx:161`, compteur de question ; `JouerClient.tsx:267`
   12,5 px). Correction : 13 px minimum.
3. **Aucun « privilège » visible côté joueur** (carte de fidélité interactive actée) : le lot gagné doit afficher
   en grand « À retirer chez [commerce] du … au … ». Correction : écran ticket (`components/ui/TicketScreen.tsx`)
   avec dates de validité en titre.
4. **Couleurs codées en dur `#1B3A5C` dans `app/jouer/JouerClient.tsx:193,267`** : le super event reste aux
   couleurs NDS, cohérent ; à ne pas étendre aux animations commerce.

---

## Liste priorisée globale (sur l'existant)

### P0 (bloque la conversion)
1. Écrire les piliers manquants dans les 3 supports : lots avec dates de validité et retour en boutique ; QR
   digital par support ; centralisation ; sponsor du développement local ; concurrents des officiels.
2. Visite guidée écran 1 : titre bénéfice + téléphone animé dans la zone vide + « Vous testez, vous essayez ».
3. Plaquette Animation écran 1 : un seul CTA « Je crée mon jeu », retirer le choix organisateur, marque
   « Flowin Event », accent bleu.
4. CTA principaux à 15 px / 44 px (plaquette SE l.337, plaquette Animation CTA haut).
5. Plaquette SE : charte orange, bénéfice organisateur (suivi, contacts) en écran 1.

### P1
6. Plaquette SE ramenée à 6 écrans, NDS en preuve avant le CTA.
7. Jeu joueur : couleur commerçant obligatoire, repli non violet ; ticket avec dates de validité en titre.
8. Storyboards : plan tuto « je crée mon jeu », phrase de fin actée, plan sponsor sans lot ; remplacer les
   répétitions du 56 %.
9. Tous textes ≥ 13 px (66 occurrences plaquette Animation, 8 plaquette SE, 2 visite).

### P2
10. Coordonnées WhatsApp/email du storyboard organisateur à faire confirmer par Romain.
11. `vous@exemple.fr` → `[email à compléter]` dans `visite.js:172,654`.
12. Taille des tableaux des pages storyboard (outil interne).

## Recommandation : le premier écran à porter à 10/10

**L'écran 1 de la visite guidée (`/visite-guidee/`)**. C'est le seul support déjà à une seule action par écran,
accessible depuis le dashboard SA, et c'est la démo cliquable qui incarne « Vous testez, vous essayez ».
À faire : titre bénéfice, sous-titre avec lots datés + QR par support, téléphone animé aux couleurs d'un
commerce exemple dans la moitié basse vide, bouton commerçant en bleu #3B5CC4, textes ≥ 13 px. Une fois validé
par Romain sur son téléphone, ses tokens (titre, animation, couleurs) se reportent sur l'écran 1 de la plaquette
Animation, puis de la plaquette Super Event.
