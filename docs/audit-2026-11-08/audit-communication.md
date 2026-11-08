# Audit du matériel de communication Flowin (v5, 08/11/2026)

Méthode : rendu Playwright (Chromium) sur localhost:3000 en 390×844 et 1440×900, page par page (bouton « Suivant → ») ; texte DOM extrait ; storyboards lus ; vidéos MP4 : ffprobe + planches d'images (1 image / 2,5 s). Lecture seule, aucun fichier du dépôt modifié.
Captures : `/tmp/flowin-audit-v5/marketing/` (`anim-{m,d}-p1..10.png`, `se-{m,d}-p1..8.png`, `interactive-{m,d}-p*.png`, `*_html-{m,d}-{fold,full}.png`, textes `*.txt`, planches vidéo `vid/*-sheet.png`).
Ne refait pas v2/marketing.md ni v3/coherence-communication.md (prix 1 331/1 400/1 490, coordonnées, notify-rappel non déployée) : ces constats sont repris seulement quand ils touchent le message.

## Verdict en 5 lignes
1. **Le meilleur support est la plaquette commerce** (`plaquette-animation-magasin.html`) : aiguillage par persona dès l'écran 1, démo jouable, prix, configurateur. Mais 10 écrans et 3 CTA concurrents.
2. **L'atout unique (le Super event) est vendu comme une fonction, pas comme une histoire** : aucune image de foule, aucun gagnant, aucun partenaire nommé, deux chiffres seulement (« 56 % », « Plus de 70 lots ») ; le seul support émotionnel (`/nds`, vidéos NDS) parle d'une édition **terminée** (« pour l'édition 2026 », 9-18 juillet).
3. **Les trois vidéos « persona » n'existent pas** : il n'y a que des storyboards v14/v15 (« Rendu : aucun MP4 avant validation »), de ~2 min chacun ; les 14 MP4 réels sont tous des vidéos **joueur Nuits du Sud** (dont une nommée `nds-partenaire-9x16.mp4` qui s'adresse au joueur).
4. **Les CTA ne correspondent pas aux personas** : les 3 storyboards (commerçant, organisateur, partenaire de super event) finissent sur le même QR `/pro/premiere-fois` (page « Votre commerce, animé… ») ; l'organisateur n'a qu'« Être contacté », dont la fonction `notify-rappel` n'est pas déployée (v3) : le prospect le plus précieux tombe sur un formulaire mort.
5. **Le nom du produit varie** : « Flowin Animation » (plaquette), « Flowin Event » (plaquette interactive, plaquette-nds), « Super event / Super Event / SUPER EVENT », « Event & Super Event » (carrousel), « Flowin GAMIFICATION » (`/nds`), signature vidéo « FLOWIN.EVENTS » (domaine sans DNS, v3).

---

## 1. Plaquette Flowin Animation (commerce) — `admin/public/plaquette-animation-magasin.html` (+ `plaquette-demo.js`)
Captures : `anim-m-p1..p10.png`, `anim-d-p1..p10.png`.

**Bon**
- Écran 1 (`anim-m-p1.png`) : 4 bénéfices en verbes d'action (« Constituez votre fichier client », « Animez votre fichier client », « Captez le flux passant », « Ramenez du trafic ») puis aiguillage « J'ai un commerce / J'organise un événement ». C'est la meilleure entrée du dépôt.
- Démo jouable par métier (Boulanger, Boucher, Restaurateur, Libraire, Festival) : le prospect voit son jeu (« Quel secret fait la croûte de notre baguette ? »).
- Supports en situation (Affiche, Macaron, Support de caisse, Écran, Post, Flyer) avec « Voir avec un logo / Voir vierge » : rend le « physique + digital » concret.
- Configurateur de prix honnête et lisible (`anim-d-p9.png`) : « 990 € HT / an », « 110 € HT / mois », « 12 × 110 € = 1 320 € HT … 330 € HT d'économie », TTC affiché « 1 188 € TTC ».
- Preuve sourcée : « 56 % des participants souhaitent garder le contact. Source : bilan Nuits du Sud 2026 ».

**Pas bon**
- 3 CTA permanents dans l'en-tête (« Je m'inscris », « Être contacté », menu) + « Voir directement les offres » + en fin 3 voies (« Je commande », « Je crée mon compte », « Être contacté ») : le prospect doit choisir entre commander, s'inscrire et être rappelé. Aucune n'est désignée comme LA suite.
- Écran 6 « Mesure » (`anim-m-p6.png`) : équaliseur abstrait étiqueté « Illustration », promesse vague (« Flowin vous permet de quantifier le retour ») sans exemple de rapport réel. Écran le plus faible.
- Écran 7 « Chiffres » : un seul chiffre (56 %), pas de nombre de joueurs, de lots retirés, de retours en boutique : la preuve du bénéfice n°4 (« Ramenez du trafic ») manque.
- Écran 4 « Le réseau » : « Quand vous participez, vous rejoignez un réseau : tout le monde a cette animation » — faux pour un commerçant seul (le réseau n'existe que dans un super event) et formulé comme un défaut (« tout le monde a cette animation » = pas de différenciation).
- Écran 8 « Super event » : bon contenu (« Devenez station-jeu », « bons de remise à gagner chez vous ») mais son seul CTA est « Être contacté » → formulaire dont l'envoi échoue (`notify-rappel` appelé l.1386, non déployé selon v3).
- « garantie » (« 330 € HT économisés · garantie ») non explicitée à l'écran des offres.
- Étiquette « Démo » flottante en bas à gauche sur toutes les pages (`anim-m-p1.png`) : fait « maquette ».
- 10 écrans pour un commerçant qui lit sur mobile : trop long ; « Plug & Play » (anglicisme) en titre principal au lieu du bénéfice.

| Ergonomie | Compréhension 5 s | Simplicité | Utilité perçue | Conversion | Impact |
|---|---|---|---|---|---|
| 7 | 7 | 5 | 7 | 5 | 5 |

## 2. Plaquette interactive — `docs/plaquette-interactive/flowin-plaquette-interactive.html` et `admin/public/plaquette-nds.html`
Captures : `interactive-m-p1.png`, `plaquette-nds_html-m-full.png`.
**Bon** : accueil en 2 cartes « Flowin Event · Le jeu qui anime chaque passage en caisse » / « Super Event · Le réseau qui fédère un territoire » (la meilleure phrase du dépôt sur le super event) ; « Le retrait du lot : simple comme un scan » ; « Des lots qui ont du sens : Faire revenir un client / Lancer un produit / Écouler un stock ».
**Pas bon** : charte sombre fuchsia ≠ charte bleue des plaquettes actuelles ; produit nommé « Flowin Event » ; données démo présentées comme réelles (« Femmes 54 % », « Pic entre 19h et 21h ») sans mention d'exemple ; `plaquette-nds.html` : « ← Dashboard », « Découvrir le Super Event » → `#`, « ← Retour à l'accueil » → `#`, contact flowinevent@gmail.com. Trace de build visible « build 2026-08-06-ev4retrait ». **Support obsolète, à archiver** (ses 3 bonnes idées sont à reprendre).
| 5 | 7 | 6 | 6 | 2 | 5 |

## 3. Plaquette Super event (organisateur) — `admin/public/plaquette-super-event.html`
Captures : `se-m-p1..p8.png`, `se-d-p1..p8.png`.
**Bon**
- Univers BD jaune/rouge distinct et mémorable ; écran 1 (`se-m-p1.png`) illustre l'idée en une image : festival au centre, « Café · Boutique · Hôtel · Sponsor », « Même macaron, même jeu ».
- Écran 2 « Avant, pendant, après » : bon cadre pour un organisateur.
- Écran 4 « Quiz et sondages » (RSE, Sécurité, Mobilité) : angle institutionnel/collectivité pertinent et différenciant.
**Pas bon**
- Titre « Animez vos futurs participants. » : le bénéfice n°1 d'un organisateur (financer et diffuser son événement grâce aux partenaires) n'apparaît nulle part. Aucun mot sur l'argent : ni prix organisateur, ni recettes des packs partenaires.
- Écran 7 (`se-d-p7.png`) : toute la preuve tient en « 56 % » et « Plus de 70 lots distribués » ; « Plus de 70 » non retrouvé en base (v2). Ni participants (641), ni nombre de partenaires (17 en base), ni logos, alors que les logos existent dans les vidéos NDS (Utile, Allianz, Giordano, Nook…).
- Écran 8 (`se-m-p8.png`) : « Solution Plug & Play. » répété deux fois (sur-titre et titre), puis CTA unique « Parlons de votre prochain événement » → formulaire rappel non opérant (l.860).
- Écran 3 « Gagnant-gagnant » : schéma en flèches « Festival → Stations-jeux → Public » abstrait ; pas de scène vécue (un festivalier qui joue chez le boulanger et revient chercher son lot).
- Pas de lien vers une démo jouable du jeu super event (la plaquette commerce en a une).
| 7 | 6 | 7 | 4 | 3 | 5 |

## 4. Présentation super event NDS (intégrer un super event) — `nds-partenaire.html` (/nds), `nds-partenaire-presentation.html`, `nds-super-event-pro.html`, `flowin-partenaire-presentation.html`, `pitch-nds.html`
Captures : `nds-partenaire_html-m-fold.png` et `*_html-{m,d}-full.png`.
**Bon** : `/nds` est le support le plus vendeur : photo de foule, « 24 000 festivaliers, 80% de locaux, 60% de femmes, sur 6 soirées. De la visibilité, des contacts qualifiés, un lot à offrir. », CTA unique « Voir les offres partenaires ».
**Pas bon**
- Périmé : « 29e ÉDITION · 9 → 18 JUILLET 2026 », « Participation ouverte … pour l'édition 2026 » (nous sommes le 08/11/2026) ; aucun bilan, aucune transformation en cas client.
- Prix « 1 490 € » / « 3 590 € » (l.652, 666) ≠ base 1 331 / 3 331 (v3).
- En-tête « Flowin GAMIFICATION » + « Contact » + menu à 5 entrées : 2e nom de marque.
- 5 pages pour la même cible partenaire NDS (carrousel `lib/outilsCommerciaux.ts:77-97`, toutes « brouillon ») : `nds-super-event-pro.html` (CTA « Devenir partenaire → » = `mailto:info@opconsult.co`, + flowinevent@gmail.com sur la même page), `flowin-partenaire-presentation.html` et `pitch-nds.html` avec « ← Dashboard » (supports internes exposés), `nds-partenaire-presentation.html` (6 085 px, vidéos ouvertes via URL de prod absolue). Aucune version **générique** « rejoindre un super event » réutilisable pour le prochain événement.
| 6 | 8 (NDS) | 5 | 7 | 6 | 7 |

## 5. Storyboards vidéo — `admin/public/storyboards-video/` (aussi dans le carrousel « Outils commerciaux » du dashboard, `lib/outilsCommerciaux.ts:101-113`)
| Fichier | Durée / écrans | Cible | Fin |
|---|---|---|---|
| v15-animation-commercants | 114 s · 14 écrans · 9:16 | commerçants | QR `/pro/premiere-fois?src=video-commerce` |
| v14-animation-commercants (remplacé) | 117,5 s · 15 | commerçants | idem |
| v14-super-event-partenaires | 113,5 s · 14 | commerces d'un SE | QR `/pro/premiere-fois?src=video-partenaire-se` |
| v14-super-event-organisateurs | 118 s · 14 | organisateurs | QR `/pro/premiere-fois?src=video-organisateur` |
**Bon** : calcul de lecture rigoureux (« durée d'écran = max(6 s ; mots ÷ 2 + 1,5 s) »), v15 aligné mot pour mot sur la plaquette (4 bénéfices), aucun chiffre inventé, tuto en vrais écrans.
**Pas bon**
- Durée ~2 min en 9:16 : format réseau social où l'attention se joue en 3 s ; 7 écrans de bénéfices avant de montrer le jeu.
- Ouverture commerçant v15 « FLOWIN, ANIMATION PLUG & PLAY. » : nom + anglicisme, pas d'accroche. La v14 (« Et si votre commerce animait ses clients ? ») était meilleure.
- Organisateur, à l'écran : « Source : Romain (Nuits du Sud 2026). » (`v14-super-event-organisateurs.html:32`) — inacceptable en public.
- Organisateur et partenaire SE : le QR final mène à `/pro/premiere-fois`, parcours d'inscription **commerce** (« Votre commerce, animé… », offre + signature) : l'organisateur n'a pas de commerce ; le partenaire doit aller sur `/rejoindre?se=`.
- Partenaire SE : 9 bénéfices empilés (intégrer, apparaître, station-jeu, lots, mis à l'honneur, revenir, visible, communication…) : aucun ne domine ; pas de prix ni de nom d'événement.
- **Aucun storyboard joueur générique** (le 3e interlocuteur de la commande).
| Ergonomie | Compréhension | Simplicité | Utilité | Conversion | Impact |
|---|---|---|---|---|---|
| commerçant v15 : 6 | 6 | 6 | 7 | 5 | 4 |
| partenaire SE : 6 | 6 | 4 | 6 | 3 | 5 |
| organisateur : 6 | 5 | 5 | 5 | 2 | 4 |

## 6. Vidéos MP4 (joueur, Nuits du Sud) — `admin/public/nds/` (14 fichiers + refs)
Planches : `vid/jeu-video-16x9-sheet.png` (30,8 s, 1920×1080), `vid/nds-partenaire-9x16-sheet.png` (40 s), `vid/parcours-jeu-flowin-nds-sheet.png` (37 s), `spot-nds2026-16x9` (37 s), `video-ecran-8-partenaires` (36,7 s), `nds-lancement-jeux-9x16` (37 s).
**Bon** : format juste (30-40 s), rythme verbe par écran (« Flash. Joue. Gagne. »), QR permanent à l'écran, lots concrets (« Des places de concert », « Des bons d'achat », « Grand tirage final »), vrais logos partenaires (« JOUE CHEZ NOS PARTENAIRES pendant toute la durée du festival ! ») : c'est la meilleure démonstration du super event qui existe, et elle n'est pas réutilisée pour vendre aux pros.
**Pas bon** : orthographe instable « Flash » / « Flashe » / « Flash le QR » ; « COMMENT CA MARCHE », « A GAGNER », « a la cloture » sans accents (`parcours-jeu-flowin-nds`) ; nom de fichier `nds-partenaire-9x16.mp4` pour une vidéo joueur ; fin `jeu-video-16x9` « Flowin · L'expérience de jeu qui fait vivre vos événements · FLOWIN.EVENTS » (domaine non actif) ; les premières secondes de `nds-partenaire-9x16` et `jeu-video` sont quasi vides (titre en fondu sur fond flou) ; doublons de versions (`MASTER-reseau-CORRECT.mp4`, `video-ecran-partenaires-maj.mp4`, `refs-romain/`) servis publiquement.
| 7 | 8 | 8 | 8 (joueur) | 8 | 7 |

---

## 7. Analyse croisée
**Le message est-il le même partout ?** Non sur le nom, oui sur le fond commerce.
- Promesse commerce : cohérente plaquette ↔ storyboard v15 (4 mêmes bénéfices). Mais `/landing` dit « Fidélisez · Animez · Boostez », plaquette-nds « Animez. Fidélisez. Boostez. », plaquette « Constituez · Animez · Captez · Ramenez » : 3 triptyques.
- Le mot « communication » (positionnement demandé : « outil de communication ») n'est en titre sur **aucun** support ; il apparaît en sous-texte (« Relayez sa communication », « RASSEMBLEZ VOTRE COMMUNICATION »).
- Super event : 4 promesses différentes — « Animez vos futurs participants » (plaquette SE), « Un événement. Tous ses partenaires. Un seul jeu. » (storyboard partenaire, la meilleure), « Le réseau qui fédère un territoire » (plaquette interactive), « Un jeu au thème de votre événement, avec tous ses partenaires » (SE p1).

**Chaque persona a-t-il son support et son CTA ?**
| Persona | Plaquette | Vidéo | CTA actuel | Problème |
|---|---|---|---|---|
| Commerçant (animation seule) | oui (meilleure) | storyboard v15, pas de MP4 | Je m'inscris / Je commande / Être contacté | 3 CTA |
| Commerçant qui intègre un SE | écran 8 de la plaquette commerce + /nds (périmé) | storyboard v14, pas de MP4 | Être contacté (cassé) / /pro/premiere-fois | aucun support générique, aucun lien `/rejoindre` |
| Organisateur | plaquette SE | storyboard v14, pas de MP4 | Être contacté (cassé) / QR vers parcours commerce | CTA cassé + mauvaise cible |
| Joueur | — | 14 MP4 NDS | Flash le QR | aucune vidéo générique réutilisable |

**Chiffres et prix**
- Pack Animation SE : 1 490 (`nds-partenaire.html:652`) / 1 400 (`lib/commercial.ts`) / 1 331 (base) ; Sponsor 3 590 / 3 331 (v3).
- Commerce : 990 € HT/an, 110 € HT/mois, kit 149 € HT, options 180 € HT : présents **uniquement** dans la plaquette commerce ; aucun storyboard ni `/landing` ne donne un prix.
- Preuves : « 56 % » partout (cohérent avec 57,1 % en base) ; « Plus de 70 lots » non vérifié ; « 24 000 festivaliers / 80 % / 60 % » sans source ; « 54 % femmes » (plaquette-nds, démo) contredit 65 % F en base.
- Organisateur : aucun prix, aucun modèle économique, nulle part.

**Le super event est-il traité comme l'atout unique ?** Non. Il est l'écran 8/10 de la plaquette commerce, une plaquette de 8 écrans sans chiffre d'argent, et sa seule preuve vivante (vidéos NDS avec logos partenaires, foule /nds) n'est utilisée que pour les joueurs.

---

## 8. Prérogatives pour la refonte

### Règles transverses (P0)
- **Un nom** : « Flowin » (marque) + « Flowin Animation » (commerce seul) + « Super Event Flowin » (événement). Supprimer « Flowin Event », « GAMIFICATION », « FLOWIN.EVENTS ».
- **Un CTA par persona** : commerçant → « Je crée mon jeu » (`/pro/premiere-fois`) ; commerçant d'un SE → « Je rejoins [événement] » (`/rejoindre?se=`) ; organisateur → « Je réserve 20 min » (créneau daté, canal qui marche : wa.me ou Gmail, tant que `notify-rappel` n'est pas déployée) ; joueur → « Flashe et joue ».
- **Une grille de prix** lue en base, affichée identique partout.
- **Preuves** : un bloc « Nuits du Sud 2026 en chiffres » unique et sourcé (participants, opt-in 57 %, partenaires nommés avec accord, lots retirés), réutilisé tel quel.

### Plaquette Animation (commerce)
- Message : « Vos clients jouent chez vous, vous gardez le contact, ils reviennent. »
- Structure cible (6 écrans) : 1 promesse + aiguillage · 2 jouez la démo (votre métier) · 3 vos supports en vitrine/caisse/réseaux · 4 preuve chiffrée NDS · 5 prix (110 €/mois, garantie expliquée) · 6 CTA.
- CTA unique : « Je crée mon jeu ». « Être contacté » en lien texte secondaire.
- Supprimer : écran « Mesure » abstrait (P1), « tout le monde a cette animation » (P0), étiquette « Démo » (P0), doublon « Je commande / Je crée mon compte » (P0).
- Ajouter : titre avec le mot « communication » (P1) ; un vrai extrait de rapport (P1) ; garantie explicite (P1) ; passerelle « Un événement près de chez vous ? Rejoignez-le » vers `/rejoindre` (P1).

### Plaquette Super Event (organisateur)
- Message : « Un seul jeu dans tous les commerces de votre territoire : vos partenaires diffusent et financent votre événement. »
- Structure (7 écrans) : 1 promesse + illustration actuelle · 2 le parcours d'un festivalier (scène vécue) · 3 ce que vos partenaires paient et gagnent (packs, recettes simulées) · 4 avant/pendant/après · 5 quiz & sondages (RSE, sécurité) · 6 cas Nuits du Sud (chiffres + logos + vidéo 30 s) · 7 CTA.
- CTA unique : « Je réserve 20 min » avec un canal qui fonctionne (P0).
- Supprimer : « Solution Plug & Play » doublé (P2), « Plus de 70 » non vérifié (P0).
- Ajouter : modèle économique et prix organisateur `[à compléter]` (P0), démo jouable du jeu super event (P1), simulateur partenaires × pack (P2).

### Présentation « rejoindre un super event » (commerçant partenaire)
- Message : « Un événement, tous ses partenaires, un seul jeu : les visiteurs viennent jouer chez vous. »
- Structure : gabarit générique paramétré par événement (nom, dates, public, packs) : 1 événement + public sourcé · 2 votre station-jeu · 3 lots et retour en boutique · 4 packs (prix base) · 5 CTA.
- CTA : « Je rejoins [événement] » → `/rejoindre?se=`.
- Supprimer / archiver (P0) : `nds-super-event-pro.html`, `flowin-partenaire-presentation.html`, `pitch-nds.html` publics, `plaquette-nds.html`, mentions « ← Dashboard ». Transformer `/nds` en cas client « bilan 2026 » (P1).
- Ajouter : logos réels avec accord (P1), témoignage `[à compléter]` (P1).

### Vidéos (3 personas + joueur)
- Commerçant (30-45 s) : « Vos clients jouent, vous gardez le contact. » Séquence : 0-3 s jeu à l'écran + lot · 4 bénéfices en 4 plans · supports en situation · prix d'appel · QR « Je crée mon jeu ». Supprimer l'ouverture « FLOWIN, ANIMATION PLUG & PLAY » (P1), mesure abstraite (P2).
- Partenaire SE (30-40 s) : réutiliser les plans NDS existants (foule, « Joue chez nos partenaires », logos) ; 3 bénéfices max (trafic, visibilité, client qui revient) ; QR `/rejoindre?se=` (P0, aujourd'hui `/pro/premiere-fois`).
- Organisateur (45-60 s) : retirer « Source : Romain » (P0) ; QR vers RDV et non vers l'inscription commerce (P0) ; ajouter l'argent (partenaires qui financent) (P1).
- Joueur : décliner `parcours-jeu-flowin-nds` en gabarit générique (P1) ; corriger accents et « Flash/Flashe » (P1) ; renommer `nds-partenaire-9x16.mp4` (P2) ; retirer `refs-romain/` et versions « CORRECT/maj » du public (P2) ; signature sans « FLOWIN.EVENTS » (P1).
- Produire les MP4 après ces corrections : aujourd'hui aucune vidéo pro/organisateur n'est diffusable (P0 pour la prospection).

## Non vérifié
- Son des vidéos (non exploitable) ; durée réelle de lecture des storyboards (lecteur non lancé jusqu'au bout).
- Rendu iOS Safari réel, production Vercel.
- Contenu complet de `nds-partenaire.html` après navigation par étapes (SPA) au-delà de la première vue.
