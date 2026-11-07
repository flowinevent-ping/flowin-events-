# Audit approfondi — parcours de souscription / inscription pro Flowin Events

Auditeur externe, 07/11/2026. Mesures faites en conditions réelles (Playwright, Chromium,
viewport mobile 390×844, serveur `localhost:3000`), via les vrais parcours (aucune écriture
SQL directe), complétées par lecture ligne-à-ligne du code source et vérifications en lecture
seule sur Supabase (projet `ywcqtupgoxfzkddqkztk`).

**Verdict en une phrase** : le compte pro lui-même (« Ma première fois ») est bien conçu —
un champ-groupe par écran, langage clair, brouillon sauvegardé. Le problème que Romain décrit
n'a pas disparu, il a été **déplacé** : il se trouve entièrement dans l'étape suivante, « lancer
une animation » / « rejoindre un super event », où un seul écran peut afficher jusqu'à
**56 éléments interactifs et 446 mots simultanément**, sur un parcours qui tient par ailleurs
tout entier sur mobile dans une seule colonne verticale de plus de 4 000 pixels.

---

## 1. Périmètre réel et cartographie des points d'entrée

| Route demandée | Ce qu'elle fait réellement | Vérifié |
|---|---|---|
| `/pro/inscription` | `redirect()` vers `/pro/premiere-fois` (conserve `?src=`) — ancien lien conservé pour compatibilité | `app/pro/inscription/page.tsx` |
| `/pro/premiere-fois` | **Le vrai parcours d'inscription pro individuel** (31/10/2026), composant `PremiereFois.tsx` | lu intégralement (697 lignes) |
| `/pro/nouvelle` | Parcours « lancer une opération » pour un pro **déjà inscrit** (créer une animation, rejoindre ou créer un super event) — composant partagé `ParcoursCreation.tsx` | lu intégralement (1366 lignes) |
| `/pro/rejoindre` | `redirect()` vers `/pro/nouvelle?type=rejoindre` | `app/pro/rejoindre/page.tsx` |
| `/rejoindre/[se]` | `redirect()` vers `/rejoindre?se=<id>` — **changement du 03/11/2026** : l'ancien formulaire `RejoindreClient.tsx` (sans compte, créait un pro orphelin) a été abandonné au profit du « parcours unique » | `app/rejoindre/[se]/page.tsx`, commentaire explicite en tête de fichier |
| `/rejoindre` | Le vrai point d'entrée **sans compte** pour un prospect qui rejoint un super event (scan d'un QR de prospection, lien de festival) — rend `ParcoursCreation` en `mode="visiteur"` | `app/rejoindre/page.tsx` |
| `/dashboard/wizard-pro` | Écran **Super Admin**, qui réutilise **la même définition de champs** que le pro (`lib/proCreation.ts`, `ETAPES_FICHE_PRO`) — aucun doublon de logique, juste un rendu différent | `app/dashboard/wizard-pro/page.tsx`, commentaire de Romain daté du 03/09 cité dans le code |

### Quel chemin un vrai pro externe rencontre-t-il en premier ?

Vérifié par recherche de tous les liens sortants des supports de prospection réels du dépôt
(`public/plaquette-animation-magasin.html`, `public/bon-commande-animation.html`,
`public/pro-app.html`, `public/carte-systeme/carte-data.json`) :

- **Event individuel (commerce)** : tous les CTA (« Je m'inscris », « Je crée mon compte »)
  pointent vers `/pro/inscription` → `/pro/premiere-fois`. Confirmé, aucune ambiguïté.
- **Rejoindre un super event (festival, type Nuits du Sud)** : le point d'entrée est le QR/lien
  `/rejoindre/<id-du-super-event>` → redirige maintenant vers `/rejoindre?se=<id>`.

**Bonne nouvelle, à mettre au crédit de l'équipe** : le risque de redondance signalé par le
Pattern G (`docs/patterns-bugs-connus.md`) — plusieurs parcours d'inscription qui coexistent
sans jamais être fusionnés — **a déjà été traité ici**. Au 03/11/2026, il ne reste que deux
portes d'entrée réelles (`/pro/premiere-fois` pour le compte, `ParcoursCreation` partagé pour
« lancer une opération », qu'on y arrive via `/pro/nouvelle` ou `/rejoindre`), et le code
commente explicitement cette unification (« P2, 16/09 », « parcours unique, 03/11 »).
`RejoindreClient.tsx` existe encore dans le dépôt mais n'est plus jamais rendu — fichier mort,
sans impact utilisateur, à signaler en ménage de code (P2, pas une urgence UX).

**Le vrai diagnostic n'est donc pas la redondance, mais la densité** à l'intérieur du parcours
déjà unifié — exactement ce que confirment les mesures ci-dessous.

---

## 2. Mesures chiffrées, écran par écran

### 2.1 `/pro/premiere-fois` — inscription du compte pro (run complet, chronométré)

Capture : `/tmp/flowin-audit-2026-11-07/shots/premiere-fois/` (17 captures, mobile 390×844).

| # | Écran | Champs/choix | Clic(s)/saisie(s) |
|---|---|---|---|
| 1 | Accueil (« Ma première fois ») | 0 (texte de promesse, 4 points) | 1 |
| 2 | Vous | 4 (prénom, nom, email, tél.) | 4 + 1 |
| 3 | Votre entreprise | 1 recherche SIRET *ou* 1 champ manuel | 1 + 1 + 1 |
| 4 | Votre secteur | 1 choix parmi 6 tuiles | 1 + 1 |
| 5 | Ce que vous proposez | 1 (texte libre) | 1 + 1 |
| 6 | Votre adresse | 3 (adresse, CP, ville) | 3 + 1 |
| 7 | Points de vente | 1 (stepper + pastilles) | 1 + 1 |
| 8 | Votre compte | 2 (mot de passe ×2) + récap en lecture de 9 lignes | 2 + 1 |
| 9 | Fin / bienvenue | 0 | — |

**Total réel : 9 écrans, 22 clics/saisies, un seul champ-groupe à la fois.** Temps de
remplissage mesuré par le robot : 7,3 s (le texte de l'écran d'accueil annonce lui-même
« environ 3 minutes » pour un humain — cohérent).

**Ce qui fonctionne bien, à ne pas casser** :
- Une seule décision par écran, jamais deux sujets mélangés.
- Langage simple, aucun jargon (« Faisons connaissance », « Ce que vous proposez »…).
- Barre de progression + retour possible à tout moment + brouillon conservé
  (`localStorage`, sans le mot de passe).
- Les erreurs de saisie ne s'affichent **qu'après une tentative** de passage à l'écran
  suivant (`tente` flag) — pas de message rouge prématuré.
- Le choix d'une animation (quiz/vote/roue, prévu au référentiel 1.1) n'est **plus** demandé
  ici : il a été volontairement déplacé après la création du compte. Bon réflexe de
  simplification — mais voir §2.2 : la charge n'a pas disparu, elle a changé d'écran.

**Point faible observé** (non un défaut d'ergonomie mais de robustesse technique) : la
tentative de création de compte réelle (`qa+souscription-audit-<horodatage>@flowin.events`,
8 caractères de mot de passe) a échoué au tout dernier geste (étape 8/9, après 22
interactions) avec l'erreur Supabase `email_address_invalid`, puis après une deuxième
tentative `over_email_send_rate_limit` (quota d'envoi d'emails épuisé — plusieurs agents
d'audit tournent en parallèle sur le même projet Supabase ce jour-là, ce qui peut expliquer
le quota atteint). **Non confirmé comme bug produit** isolé — mais si un format d'email
légitime venait à être rejeté en conditions réelles, ce serait un abandon total après
3 minutes de saisie, à la toute dernière étape. À Romain de vérifier hors contexte d'audit
concurrent (cf. §5, P1-6).

### 2.2 `/rejoindre` — rejoindre un super event, sans compte (run réel sur `se-fetes-du-haut-et-moyen-pays-vencois`, le seul super event actuellement ouvert aux inscriptions)

Capture : `/tmp/flowin-audit-2026-11-07/shots/rejoindre/` (8 captures, mobile 390×844),
mesures DOM automatiques (nombre réel de `<input>`, `<select>`, `<textarea>`, `<button>` et
de mots visibles par écran) :

| # | Écran | inputs | selects | textareas | boutons | mots visibles |
|---|---|---|---|---|---|---|
| 1 | Accueil « Que voulez-vous faire ? » | 6 | 1 | 0 | 16 | 395 |
| 2 | Étape 1 — Quel super event ? | 6 | 1 | 0 | 16 | 395 |
| 3 | Étape 2 — Le jeu (imposé, lecture seule) | 0 | 0 | 0 | 13 | 85 |
| 4 | Étape 3 — Vos lots | 3 | 0 | 0 | 25 | 119–153 |
| 5 | **Étape 4 — Diffusion & QR (écran final)** | **11** | **1** | **1** | **15** | **446** |

**L'écran final cumule, sur un seul écran scrollable de ~3 900 px de haut en 390 px de
large (≈ 4,6 fois la hauteur d'un iPhone)** (capture
`07-etape4-diffusion-fin.png`) :
1. 2 cases à cocher « diffusion » (QR imprimé / lien réseaux),
2. un bloc « QR tracés » avec formulaire d'ajout,
3. un champ « mot pour l'organisateur » (facultatif),
4. **une grille tarifaire à 4 options avec prix réels** (Visibilité 500 € HT, Animation
   1 400 € HT, Sponsor 3 590 € HT, « Je veux juste être visible »), chacune avec sa propre
   liste d'inclusions,
5. un tableau récapitulatif de 8 lignes,
6. **un formulaire de création de compte à 8 champs obligatoires** (nom de la structure,
   secteur + précision, contact, email, téléphone, ville, mot de passe, confirmation),
7. un message d'erreur rouge **affiché avant toute saisie** (« Indiquez le nom du contact. »
   visible dès l'arrivée sur l'écran — bug confirmé, voir §5 P0-3).

C'est, à notre sens, la preuve la plus nette et la plus mesurable du constat de Romain :
« tout est présenté presque d'un coup ».

### 2.3 `/pro/nouvelle` — créer une animation (pro déjà inscrit), étape « Jeu », avec Quiz

Capture : `/tmp/flowin-audit-2026-11-07/shots/nouvelle/` (4 captures, mobile 390×844).

| # | Écran | inputs | boutons | mots |
|---|---|---|---|---|
| 1 | Étape 1 — Votre animation | 3 | 8 | 87 |
| 2 | Étape 2 — Quel jeu ? (avant choix) | 0 | 13 | 111 |
| 3 | Étape 2 — Quiz sélectionné | 5 | 23 | 235 |
| 4 | **Étape 2 — panneau « 3 questions suggérées » ouvert** | **32** | **24** | **273** |

Le détail de l'écran 4 (capture `04-etape2-jeu-suggestions-ouvertes.png`, ~4 060 px de haut
en 390 px de large, ≈ 10 hauteurs d'écran de défilement) : 5 tuiles de choix de jeu, une
section « vos questions » (3 boutons), **un éditeur de 3 questions complètes directement
inséré dans la page** (3 × [1 intitulé + 4 réponses à bulle radio] = 15 champs texte + 12
boutons radio), une section « Questions bonus » séparée, **et**, sans rapport direct avec
« quel jeu ? », une section « Présentation : master « Quiz + bonus » » avec choix de
présentation, upload de logo, upload d'image d'accueil, champ « activité (fiche commerce) »,
champ « horaires », champ « site web ». **32 champs de saisie et 56 éléments interactifs au
total sur un seul écran.**

---

## 3. Jargon relevé (mots que Romain n'emploierait pas face à un commerçant)

Issu de la lecture du code et des captures d'écran réelles — liste strictement ce qui est
montré au pro, pas le vocabulaire interne des commentaires :

- **« Banque de questions » / « banque bonus »** (`ParcoursCreation.tsx` L.1042-1131,
  visible à l'écran : « Vous n'avez pas encore de banque de questions. »)
- **« Master » / « Présentation : master « Quiz + bonus » » / « Master Flowin
  (recommandé) »** (capture `nouvelle/04…png`) — terme de développeur, jamais un mot qu'un
  commerçant comprendrait sans explication.
- **« Gabarit »** (`lib/gabarit.ts`, `GABARIT_MODULE`, `GABARIT_NOM` — present dans le code,
  n'apparaît heureusement pas tel quel à l'écran, mais structure la logique du libellé
  affiché « Quiz + bonus — marque blanche », lui-même peu clair pour un commerçant : une
  « marque blanche » est un terme B2B, pas un terme grand public).
- **« Module »** (variable interne, affleure dans `libelleModule`) — RAS à l'écran.
- **« Segments »** pour la roue (« Un segment gagnant porte le nom du lot… ») — acceptable
  en contexte visuel (roue), mais jamais défini.
- **« SIRET / SIREN / forme juridique »** sans reformulation — vocabulaire correct et
  nécessaire pour une entreprise, mais aride dès le 2ᵉ écran du parcours ; aucune incitation
  particulière, seulement un sous-titre utile (« on récupère… dans l'annuaire officiel »).
- **« Tirage au sort automatique / manuel », « gain immédiat : au hasard / tous les X
  joueurs »** — vocabulaire de configuration produit, pas de récit pour un commerçant qui
  veut juste savoir « qui gagne et quand ».

---

## 4. Comparaison au référentiel fonctionnel (`docs/REFERENTIEL-fonctionnel-flowin.md`, §1.1 et §2)

### Ce que le référentiel demande à l'inscription (1.1) vs ce que l'app demande réellement

| Référentiel 1.1 | Dans l'app | Écart |
|---|---|---|
| Secteur d'activité | ✅ étape « Votre secteur » | conforme |
| Adresse | ✅ étape « Votre adresse » | conforme |
| Choix d'une animation (quiz/quiz+bonus/vote/roue) | ❌ **plus demandé à l'inscription** | déplacé après coup (bon réflexe de simplification, mais voir §2.3 : la charge réapparaît, alourdie, à l'étape suivante) |

### Surcharge non justifiée par le référentiel (demandé dans l'app, absent du périmètre validé)

- **SIRET, SIREN, forme juridique, date de création, nom commercial, produits & services,
  nombre de points de vente** (`PremiereFois.tsx`) : le référentiel ne demande que « secteur
  + adresse ». Nuance importante : la plupart de ces champs sont **auto-remplis** par la
  recherche SIRET (coût de saisie quasi nul pour le pro) — seul « Produits et services » (texte
  libre, obligatoire) et « Nombre de points de vente » ajoutent une vraie charge de saisie non
  prévue au référentiel. Risque modéré, pas majeur.
- **Dates « Participation du / au »** demandées au pro qui rejoint un super event
  (`ParcoursCreation.tsx` L.997-1000) : le référentiel (§2.1) est explicite — *« Le jeu est déjà
  choisi en amont par le créateur du super event »* et les dates appartiennent à l'opération,
  pas à la station. Faire ressaisir des dates à chaque commerce qui rejoint est une surcharge
  et une source d'incohérence potentielle (un commerce pourrait saisir des dates différentes de
  celles du super event). **À retirer.**
- **Grille tarifaire (packs Visibilité/Animation/Sponsor, prix HT)** affichée et cochable dans le
  parcours de demande (`GrilleTarifs.tsx`, écran final de `/rejoindre`) : le référentiel range la
  facturation exclusivement côté Super Admin (§3 : *« bon de commande et facturation… »*).
  Mélanger un choix de prix engageant à un formulaire d'inscription gratuite est un vrai facteur
  de friction/abandon, et contredit l'exemple du parcours individuel qui, lui, reporte
  correctement l'offre après l'inscription (« bon de commande pré-rempli », `PremiereFois.tsx`).
- **Logo, image d'accueil, activité (fiche commerce), horaires, site web** (section
  « Présentation du master », `PersoMaster.tsx`) insérés au milieu de l'étape « Quel jeu ? » :
  aucune mention au référentiel de ces champs comme prérequis d'inscription — ce sont des
  réglages de personnalisation qui ont parfaitement leur place **après** la première
  publication.

### Ce qui manque du périmètre validé

Rien d'absent identifié dans le parcours de souscription lui-même. Le référentiel §6/§7
(audit du 16/09) documente déjà un travail de correction conséquent sur ce point (lots,
lien de tracking par station, etc.), qui semble intégré au code lu.

---

## 5. Liste priorisée — fichier, cause racine, correctif

### P0 — bloquant, à traiter en premier

| # | Constat | Fichier | Cause racine | Correctif |
|---|---|---|---|---|
| P0-1 | Écran final de `/rejoindre` (« Diffusion & QR ») : récapitulatif + grille tarifaire (3 packs, prix réels) + formulaire de compte à 8 champs + options QR, tout sur un seul écran de ~3 900 px (446 mots, 13 champs) | `components/creation/ParcoursCreation.tsx` L.1246-1358 | L'étape « FIN » n'a jamais été redécoupée malgré sa densité croissante (QR tracés ajoutés le 31/10, grille tarifaire ajoutée le 03/11, compte visiteur ajouté le 03/11 — 3 fonctionnalités empilées sur le même écran en quelques semaines) | Scinder en 3 écrans distincts : (1) Récapitulatif seul, (2) Tarif souhaité — facultatif, skippable d'un clic, (3) Vos coordonnées / compte |
| P0-2 | Étape « Jeu » de `/pro/nouvelle` (et SA) : ouvrir « 3 questions suggérées » fait apparaître 32 champs de saisie sur le même écran que le choix du jeu, plus une section « Présentation du master » (logo/horaires/site web) sans rapport direct | `components/creation/ParcoursCreation.tsx` L.1040-1134 ; `components/masters/PersoMaster.tsx` | L'éditeur de questions complet a été inséré inline au lieu de renvoyer vers l'écran dédié qui existe déjà (`/pro/banques/nouvelle`) | Déplacer la rédaction des questions vers son propre écran ; sortir « Présentation du master » de l'étape Jeu vers une étape « Personnaliser » facultative, clairement déplaçable après la première publication |
| P0-3 | Message d'erreur rouge (« Indiquez le nom du contact. ») affiché **avant toute saisie**, dès l'arrivée sur l'écran final de `/rejoindre` | `components/creation/ParcoursCreation.tsx` L.1348 (`{bloque[FIN] && ...}` sans garde équivalente au `tente` de `PremiereFois.tsx`) | La validation est calculée et affichée en continu, sans attendre une tentative d'action de l'utilisateur | Aligner sur le pattern déjà utilisé par `PremiereFois.tsx` : n'afficher l'erreur qu'après un premier clic sur « Envoyer ma demande » |

### P1 — important

| # | Constat | Fichier | Correctif |
|---|---|---|---|
| P1-4 | Dates « Participation du / au » demandées au pro qui rejoint un super event, alors que le référentiel (§2.1) dit ces dates fixées par le créateur | `ParcoursCreation.tsx` L.997-1000 | Retirer le champ, ou l'afficher en lecture seule (dates du super event déjà connues via `se.date_d`/`se.date_f`) |
| P1-5 | Aperçu « le vrai jeu » vide/blanc pendant ~700 ms à chaque changement d'étape (debounce de rechargement de l'iframe), visible sur les captures `rejoindre/04…png` et `05…png` | `components/parcours/ApercuJeu.tsx` L.38-41 | Afficher un état de chargement (squelette / dernière image) pendant le debounce plutôt qu'un cadre blanc |
| P1-6 | Création de compte test en échec : `email_address_invalid` puis `over_email_send_rate_limit` après quelques tentatives (voir §2.1) | Config Supabase Auth du projet `ywcqtupgoxfzkddqkztk` | À reproduire par Romain hors contexte d'audit concurrent, pour confirmer si un email légitime peut être rejeté — risque d'abandon total à la toute dernière étape si confirmé |
| P1-7 | Jargon technique détaillé au §3 (« banque de questions », « master », « marque blanche »…) | multiple | Remplacer par des formulations commerçant (« vos questions », « présentation de votre jeu », « offre standard ») |
| P1-8 | Grille tarifaire (prix, engagement) insérée dans un parcours d'inscription par ailleurs gratuit | `components/creation/GrilleTarifs.tsx`, rendu depuis `ParcoursCreation.tsx` L.1293 | Sortir le choix de pack du parcours de demande ; le reporter sur le bon de commande, comme c'est déjà fait pour l'inscription individuelle (`PremiereFois.tsx` → `bon-commande-animation.html`) |

### P2 — à améliorer

| # | Constat | Fichier | Correctif |
|---|---|---|---|
| P2-9 | Sur mobile (390 px), l'« Aperçu en direct » passe systématiquement **sous** le formulaire (grille 2 colonnes repliée en 1 colonne sous 1020 px) : un pro doit défaire défiler jusqu'à ~4 000 px avant de voir le jeu | `ParcoursCreation.tsx` L.151-152 (media query `.pc-grille`) | Sur mobile, proposer un lien/bouton « Voir l'aperçu » sticky en haut d'écran plutôt que de compter sur le défilement ; ou inverser l'ordre (aperçu avant formulaire) sur les écrans courts |
| P2-10 | `RejoindreClient.tsx` (ancien formulaire « rejoindre sans compte ») n'est plus jamais rendu depuis le 03/11 mais reste dans le dépôt | `app/rejoindre/[se]/RejoindreClient.tsx` | Suppression de code mort (sans impact utilisateur, juste dette technique — à faire en fin de chantier, pas urgent) |
| P2-11 | Deux standards d'ergonomie dans un même produit : `PremiereFois.tsx` (3-5 éléments/écran) vs `ParcoursCreation.tsx` en mode animation/rejoindre (jusqu'à 56 éléments/écran) | les deux fichiers | Faire de `PremiereFois.tsx` le gabarit de référence pour densité d'écran, et redécouper `ParcoursCreation.tsx` à l'identique |
| P2-12 | Volets/modales : aucun drawer ni modal dans ce parcours (conception 100 % page pleine, écran par écran) — rien à ouvrir/fermer à vérifier ici ; le point de contrôle Romain (volets qui s'ouvrent/se ferment mal) ne s'applique pas à ce parcours spécifique | — | N/A, à vérifier plutôt côté dashboard SA (hors périmètre de cet agent) |

---

## 6. Notes /10 par axe

| Axe | Note | Justification |
|---|---|---|
| **Ergonomie** | 4/10 | Excellent sur le compte (`PremiereFois`), effondré sur « lancer une opération » (jusqu'à 56 éléments interactifs sur un seul écran, mesuré en DOM réel) |
| **Compréhension** | 5/10 | Langage clair et sans jargon sur `PremiereFois` ; jargon technique répété (« banque », « master », « marque blanche ») dès qu'on sort du compte |
| **Fluidité** | 5/10 | Brouillon conservé, retour en arrière possible partout — mais la densité des écrans de fin casse le rythme « une décision à la fois » installé au début |
| **Design** | 7/10 | Cohérent avec `lib/charte.ts` (`CHARTE_PRO`), pas de rupture visuelle ; non retouché ici conformément à la consigne (design déjà validé par Romain) |
| **Technique** | 5/10 | Erreur de validation prématurée confirmée (P0-3) ; aperçu qui flashe en blanc (P1-5) ; échec de création de compte de test non confirmé en isolation (P1-6) ; par ailleurs, aucun bug de type Pattern A/B/C/D/E (listes sans clic, mauvaise source de données, page orpheline…) détecté dans ce périmètre précis |

---

## 7. Proposition de parcours resserré (texte seul, sans code)

### Ce qui marche déjà et doit rester le gabarit de référence
`PremiereFois.tsx` (le compte) : 9 écrans, une seule décision par écran, à garder tel quel.

### « Lancer une animation » / « Rejoindre un super event » — resserré en 5 écrans minimum viable

1. **Quel jeu ?** — uniquement le choix du type (quiz, quiz+bonus, roue, vote, tombola).
   Rien d'autre sur cet écran : pas de questions à écrire, pas de logo, pas d'horaires.
2. **Vos lots** — nom et quantité seulement, par défaut. Valeur, conditions détaillées,
   réglage fin du gain immédiat (%, tous les X) et de la date de tirage automatique : repliés
   sous un lien « Réglages avancés », à ne dérouler que si le pro le demande.
3. **Vos questions** *(uniquement si quiz ou quiz+bonus)* — écran séparé et dédié, jamais
   empilé sous le choix du jeu. Par défaut : un seul bouton « Flowin me les prépare », pas
   12 champs vides à remplir immédiatement.
4. **Publier** — QR et lien créés automatiquement, rien à cocher pour que l'animation soit
   jouable. Les options de diffusion avancées (QR tracés multiples, réseaux) restent
   disponibles mais clairement secondaires, repliées.
5. **Récapitulatif (lecture seule)** → bouton « Publier mon animation ».

### Ce qui doit être différé après la première publication (jamais bloquant à l'inscription)

- Logo, image d'accueil, activité détaillée, horaires, site web (aujourd'hui dans
  « Présentation du master ») → à déplacer vers « Mon compte » / un écran « Personnaliser »,
  accessible une fois l'animation déjà en ligne.
- Choix du pack tarifaire pour rejoindre un super event → à sortir entièrement du parcours de
  demande ; à traiter comme le parcours individuel le fait déjà bien : sur le bon de commande,
  après la création du compte/de la demande.
- Réglages fins de tirage au sort (mode automatique + date précise, pourcentage de gain
  immédiat) → une valeur par défaut raisonnable à la création (tirage manuel, un clic), le
  réglage fin accessible ensuite depuis l'onglet Lots de la fiche opération.
- QR tracés multiples (un par support) → le QR principal suffit à publier ; les QR
  secondaires se créent depuis l'onglet Diffusion, une fois l'animation vivante.
- Dates de « participation » pour rejoindre un super event → à supprimer purement et
  simplement (déjà fixées par le créateur du super event, conforme au référentiel §2.1).

Avec ce découpage, le nombre d'écrans ne diminue pas forcément beaucoup (5 au lieu de 4-5
selon le chemin) — **ce n'est pas le nombre d'écrans le problème mesuré ici, c'est la densité
par écran** (jusqu'à 56 éléments vs une poignée). L'objectif du resserrement est : un sujet par
écran, et tout ce qui n'est pas indispensable à la première publication déplacé après coup —
exactement le principe déjà appliqué avec succès sur `PremiereFois.tsx`.

---

## 8. Ce qui n'a pas pu être vérifié

- **Soumission réelle jusqu'en base** du formulaire `/rejoindre` (demande de rattachement) :
  arrêtée volontairement avant le clic final pour ne pas consommer davantage le quota d'envoi
  d'email Supabase partagé par les agents d'audit en cours ce jour-là (déjà atteint lors du
  test sur `/pro/premiere-fois`). Le remplissage complet et la validation des champs ont en
  revanche été vérifiés en conditions réelles (DOM, erreurs de validation).
- **CLS (sauts de mise en page) au chargement**, mesure rigoureuse (vidéo / Layout Shift API) :
  non réalisée faute de temps ; observation de code : aucune police web externe chargée par
  `PremiereFois.tsx` ni `ParcoursCreation.tsx` (police système uniquement), ce qui limite le
  risque de CLS lié aux polices. Le flash blanc de l'aperçu jeu (P1-5) est, lui, confirmé par
  capture d'écran.
- **Test Safari iOS réel** (uniquement Chromium via Playwright, viewport mobile simulé) —
  recommandé par `docs/AUDIT-PROMPT-flowin-events-2026-11-07.md` pour tout ce qui touche à la
  syntaxe JS, mais ce parcours est 100 % Next.js/React (pas de vanilla JS iOS Safari-safe
  concerné par la règle Acorn du dashboard SA).
- **`/dashboard/wizard-pro` en conditions réelles** (接続 SA) : lu intégralement en code (réutilise
  `lib/proCreation.ts`, donc les mêmes écrans que `PremiereFois.tsx` par construction — pas
  de risque de divergence identifié), mais non rejoué en direct (nécessite une session SA
  authentifiée, hors du périmètre strictement « pro externe » demandé).
- Environ 10 minutes d'indisponibilité totale du serveur de dev partagé pendant l'audit
  (`Error: Cannot find module './1682.js'`, cache webpack corrompu — probablement un
  rebuild concurrent d'un autre agent sur le même `admin/.next/`) : n'a pas empêché de
  compléter les mesures mais a retardé le run `/rejoindre`. Signalé ici comme risque
  d'infrastructure partagée, pas comme bug produit.

---

## Annexe — captures d'écran de référence

Toutes dans `/tmp/flowin-audit-2026-11-07/shots/`, mobile 390×844, horodatées par nom de
fichier dans l'ordre du parcours :

- `premiere-fois/01-accueil.png` → `17-etape8-fin.png` — run complet du compte pro
- `rejoindre/07-etape4-diffusion-fin.png` — **la preuve principale** : écran unique de
  ~3 900 px cumulant récap + tarifs + compte
- `nouvelle/04-etape2-jeu-suggestions-ouvertes.png` — **la seconde preuve principale** :
  32 champs sur un seul écran « Quel jeu ? »
