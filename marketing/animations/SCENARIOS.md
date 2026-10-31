# Animations explicatives Flowin — scénarios et audit

Vidéos verticales 1080 × 1920, 30 i/s, sans son nécessaire. Elles racontent **la même histoire** (Fête du Lac, Belrive) vue par les participants, les organisateurs et les commerces partenaires. La V3 (six coupes 15 s / 30 s) est décrite d'abord ; les audits V1 → V2 et la V1 restent documentés en dessous. Les prénoms Aminata et Mei des versions précédentes sont devenus Julie et Sophie.

## v10 — s3-v10 « Installez Flowin dès maintenant » (78,5 s)

Retour client sur la v9 : orange, palette A et typographie Archivo élargie refusés. **Charte de la landing** (`admin/app/landing/LandingClient.tsx`) : encre `#1B3A5C`, bleu `#3B5CC4`, teal `#00B4A0`, fonds papier `#F4F6F9` et blanc en alternance, texte secondaire `#5a6b80` ; filets `#DCE3EC`. Police : celle de la landing (pile système `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`), rendue avec Roboto 500/700/900 intégrée (`@fontsource/roboto`, licence Apache 2.0) ; titres Roboto 900 à 48 sur tous les écrans de titre (mesuré), plus aucune Archivo ni Manrope. Logo de la landing : « Flow » encre + « in » bleu. Pilule Plug & Play teal plein, macaron à anneau bleu → teal, grands chiffres en contour avec bande teal, chiffres d'étape à bande bleu clair / teal clair. Aucun orange, corail, crème, pêche, prune ni fuchsia (relevé des couleurs du SVG toutes les 0,7 s sur tout le film). Les dessins reprennent la v9 ; `K10.charte()` convertit toute la sortie (palette A et polices → charte landing). Textes : `src/h/films-v10.js` ; briques : `src/h/kit-v10.js` ; scénario : `src/h/v10-s3.js`. QR de fin : page des offres (lu par jsQR).

Changements de contenu : nouvel écran « VOUS EN CAPTEZ DE NOUVEAUX. » après « VOUS CONNAISSEZ VOS CLIENTS. » (le fichier client se remplit, nouveaux contacts « NOUVEAU · A joué au quiz · opt-in » en tête) ; 55 % devient « DES JOUEURS SOUHAITENT RESTER EN CONTACT. » ; équaliseur en grille 2 × 2 (vignettes de 146 px au lieu de 104, barre verticale à droite de chacune) ; fin : bloc signature au centre, puis en bas la carte QR **carrée** (236 × 236) « Scannez pour voir les offres » à côté du macaron.

Scènes : fichier (0–4,5) · flux (4,5–9) · passage → contacts (9–14,5) · Plug & Play (14,5–19) · 01 (19–23,5) · 02 quiz à votre nom (23,5–28) · 03 (28–32,5) · 04 (32,5–37) · quiz, roue, tombola (37–41,5) · chaque support mesuré (41,5–46,5) · faites jouer, gardez le contact, faites revenir (46,5–51) · vous connaissez vos clients (51–55,5) · vous en captez de nouveaux (55,5–60) · tout depuis votre téléphone (60–64,5) · 55 % (64,5–69) · 70 % (69–73,5) · fin (73,5–78,5).

## v9 — s3-v9 « Installez Flowin dès maintenant » (74 s)

Retours client sur la v8 (« trop froid, trop blanc/gris, ambiance médicale ») : **palette A « Soleil du Sud »**. Fonds crème `#FFF6EC` et blanc en alternance stricte (scènes impaires blanches, paires crème), texte brun-encre `#3B2418` (plus aucun noir plein), filets et contours fins `#F3D9C4`, accent principal corail `#F26B4F` (mots mis en valeur, barres, boutons), orange `#F5A100` ; dégradé `#F5A100 → #EC5B45` réservé à la pilule Plug & Play et à la bande des grands chiffres 55 % / 70 % ; prune `#8E3B6E` et teal `#13A89E` en accents rares. Aucun fuchsia (seul le « in » du logo garde son dégradé magenta → or, vérifié sur toutes les images), aucun menthe ni bleu ciel. Le réchauffage passe par `K9.chaud()` (table de correspondance encre, gris, lilas, teal, ciel → palette A) appliqué à toute la sortie de chaque scène. Titres Archivo 44 sur tous les écrans de texte (mesuré : 44 partout ; 40 sur l'écran des trois verbes), une idée par écran, 4,5 s par écran (5 à 5,5 s pour le passage en contacts, l'équaliseur et la fin). Textes : `src/h/films-v9.js` ; briques : `src/h/kit-v9.js` ; scénario : `src/h/v9-s3.js`.

QR de fin : page des offres `https://flowin-events.vercel.app/plaquette-animation-magasin.html#offres` (champ `qr` du film, pris en compte par `build-v3.mjs` ; relu par jsQR sur l'image finale). Le même QR figure dans les macarons du film.

Scènes : fichier client dans un téléphone, « EN SOMMEIL » (contacts grisés, « Aucune visite depuis 8 mois ») qui devient « ACTIF » (0–4,5) · devanture « Boulangerie Exemple » avec macaron en vitrine, passants sans visage qui défilent (4,5–9) · devant la vitrine, trois passants s'arrêtent, flashent le macaron, jouent (bulle ? puis ✓), deviennent des fiches contact qui s'empilent, « +3 CONTACTS » (9–14,5) · Plug & Play : grand macaron et nouvelle affiche « JOUEZ ICI » crème et corail, assortie au macaron (14,5–19) · 01 ils flashent, sans appli (19–23,5) · 02 ils jouent, quiz au nom du commerce « Quelle farine pour la tradition ? » (T45, T65, T110, T150) (23,5–28) · 03 ils gagnent (28–32,5) · 04 ils reviennent (32,5–37) · quiz, roue, tombola : animer et garder le lien (37–41,5) · chaque support mesuré : affiche scotchée sur un mur de briques, flyer tenu en main, post dans un téléphone, bus avec visuel « JOUEZ ICI ! », barres corail, orange, teal, prune (41,5–46,5) · faites jouer, gardez le contact, faites revenir (46,5–51) · vous connaissez vos clients, sans sous-titre (51–55,5) · tout depuis votre téléphone (55,5–60) · 55 % (Nuits du Sud 2026) (60–64,5) · 70 % (Données Flowin) (64,5–69) · fin : carte QR « Scannez pour voir les offres », grand macaron, bloc signature (69–74).

## v8 — s3-v8 « Installez Flowin dès maintenant » (73,5 s)

Charte claire demandée par le client : **plus de fuchsia** (sauf le « in » du logo, qui garde son dégradé magenta → or), **aucun fond sombre** (téléphones blancs à contour fin, écrans clairs, pilules blanches), plus de jaune beurre. Fonds blanc, blanc cassé `#F6F7F5`, menthe, bleu ciel ; accents teal `#00B4A0` et orange `#F5A100 → #EC5B45` ; texte encre. Mots mis en valeur en teal ; macaron à anneau teal → orange. Harmonie : une seule taille de titre (44) pour tous les écrans, mêmes marges, même grille, même pilule. Écrans joueur redessinés en clair (`src/h/kit-v8.js`) avec les mêmes contenus que l'app ; écrans pro avec en-tête blanc. Textes : `src/h/films-v8.js` ; scénario : `src/h/v8-s3.js`.

Scènes (4 à 6 s) : réveiller le fichier client · capter le flux qui passe · le jeu transforme le passage en contacts (passants stylisés → téléphone → fiches qui s'empilent) · Plug & Play (macaron grand) · 01 flashent · 02 jouent · 03 gagnent · 04 reviennent · quiz, roue, tombola (une seule scène jeux, quiz au centre) · chaque support mesuré (affiche, post réseau, flyer, bus reliés à leur barre) · renforcez votre image · vous connaissez vos clients · tout depuis votre téléphone · 55 % (Nuits du Sud 2026) · 70 % (Données Flowin) · fin (grande carte QR, macaron, bloc signature). Écran « – de 3 € » supprimé.

## v7 — s3-v7 « Installez Flowin dès maintenant » (72 s)

Retour client sur la v6 (« on régresse ») : nouvelle direction « esprit Macadam » sans personnage, d'après le style G : titres en capitales Archivo extra-large ultra-grasses (wdth 125, wght 900, police intégrée `assets/fonts/archivo-125-900-latin.woff2`, licence OFL), chiffres 01–04 en contour noir avec bande pastel décalée, pilules à contour fin, filets noirs, fonds blanc / beurre / pastels, une image forte par écran, taches seulement en accent sans coulure, aucun pictogramme. Vrai logo Flowin (« in » dégradé magenta → or, `public/nds/assets/flowin_logo.png`), bloc signature Flowin · ANIMATION · Plug & Play (accueil de `plaquette-nds.html`), nouveau macaron vitrine (anneau dégradé, texte circulaire « FLASHEZ · JOUEZ · GAGNEZ », logo, petit QR). Écrans de téléphone en palette Flowin (fond encre au lieu des dégradés violets). Le quiz passe devant (02) et a son écran « LE QUIZ QUI SONDE ET CRÉE DU LIEN ». Textes : `src/h/films-v7.js` ; briques : `src/h/kit-v7.js` ; scénario : `src/h/v7-s3.js`.

Scènes : fichier qui dort (0–4 s) · Flowin capte le flux (4–8) · et mesure l'impact (8–12) · **équaliseur** Affiche / Réseaux / Flyer / Campagne (12–18) · Plug & Play (18–22,5) · 01 ils flashent (22,5–26,5) · 02 ils jouent (26,5–30,5) · le quiz qui sonde (30,5–34,5) · 03 ils gagnent (34,5–38,5) · 04 ils reviennent (38,5–42,5) · renforcez votre image (42,5–46,5) · vos clients (46,5–51) · tout depuis votre téléphone (51–55) · 55 % souhaitent garder le contact, « Dernier événement : Nuits du Sud 2026 » (55–59) · 70 % d'opt-in sur l'événement local, « Données Flowin » (59–63) · – de 3 € par jour, « Abonnement annuel » (63–67) · fin (67–72).

## v6 — s3-v6 « Et vous, on installe Flowin quand ? » (64 s)

Structure d'une pub de référence analysée par le client : problème → solution → comment ça marche (01 à 04) → résultat → preuves chiffrées → action ; une phrase par écran, grands chiffres peints comme temps forts. Visuels de la v4 (objets dessinés, vrais écrans), taches nettes de la v5, jauges, macaron Plug & Play, carte QR de la v5 ; **aucun pictogramme**, plus de cadran. Textes : `src/h/films-v6.js` ; briques : `src/h/kit-v6.js` (chiffres peints, numéro d'étape, source).

| Temps | Scène | À l'écran |
|---|---|---|
| 0–5 s | Le problème | 1 CLIENT SUR 3 NE REVIENT PLUS. · Et les passants ? Ils passent. · « 1/3 » peint · source e-marketing.fr |
| 5–9,5 s | La solution | UNE ANIMATION PLUG & PLAY. · Le temps de coller une affiche. |
| 9,5–13,5 s | 01 | ILS FLASHENT. · Sans appli. |
| 13,5–18 s | 02 | ILS JOUENT. · Quiz, roue, tombola. |
| 18–22 s | 03 | ILS GAGNENT. |
| 22–26,5 s | 04 | ILS REVIENNENT. · Le lot se retire chez vous. |
| 26,5–31 s | Le passage capté | VOUS CAPTEZ LE PASSAGE. · Chaque joueur devient un contact, avec son accord. |
| 31–36 s | Chaque support suivi | CHAQUE SUPPORT, SUIVI. · jauges, supports sans QR |
| 36–40,5 s | Vos clients | VOUS CONNAISSEZ VOS CLIENTS. · Âge, sexe, provenance, avis. |
| 40,5–44,5 s | Le téléphone | TOUT DEPUIS VOTRE TÉLÉPHONE. · Lots, tirage, billets. |
| 44,5–48,5 s | Preuve | « 2 449 » FLASHS AU FESTIVAL NUITS DU SUD. · source Nuits du Sud 2026, Vence |
| 48,5–52,5 s | Preuve | « + DE 55 % » DES JOUEURS ACCEPTENT D'ÊTRE RECONTACTÉS. · source Nuits du Sud 2026, Vence |
| 52,5–56,5 s | Preuve | « 70 % » D'OPT-IN SUR L'OPÉRATION DE PÂQUES. · source Opération Pâques, données Flowin |
| 56,5–60 s | Le coût | « – DE 3 € » PAR JOUR. · Le prix d'un café pour capter et faire revenir vos clients. · « Abonnement annuel » (≈ 990 € HT / an, soit ≈ 2,71 € par jour) |
| 60–64 s | Fin | ET VOUS, ON INSTALLE FLOWIN QUAND ? · Commandez votre macaron. · carte QR, logo, Plug & Play |

Chiffres et sources fournis par le client, affichés tels quels avec leur source (le nombre de contacts n'est pas affiché) ; je ne les ai pas recalculés dans la base. L'écran « 6 Français sur 10 » a été retiré à la demande du client.

## v5 — s3-v5 « Et si vous pouviez mesurer votre pub ? » (55 s)

Retours client sur la v4 (« images beaucoup mieux, couleurs et fonds pastel bien ») : taches plus propres (contour vectoriel lisse, une ou deux coulures franches, trois gouttes : `K5.tache`), pictos dans une pastille ronde blanche à contour fin et ombre douce (`K5.pastille`), le « ? » remplacé par un cadran de mesure dont l'aiguille hésite puis se fixe (`K5.cadran`), QR de fin dans une carte arrondie « Scannez pour essayer » composée avec le logo et le macaron Plug & Play (`K5.carteQR`). Textes du client (`src/h/films-v5.js`) ; la mécanique « un QR par support » n'est plus montrée : les supports sont reliés à un rapport.

| Temps | Scène | À l'écran |
|---|---|---|
| 0–4,5 s | Mesurer | ET SI VOUS POUVIEZ MESURER VOTRE PUB ? · L'impact de chaque action marketing. (cadran) |
| 4,5–9 s | Plug & Play | UNE SOLUTION PLUG & PLAY. · Une affiche, un macaron : c'est parti. |
| 9–14 s | On trace | ON TRACE VOTRE COMMUNICATION. · Affiches, réseaux, campagnes… et un rapport simple. |
| 14–19 s | La mesure | CHAQUE PUB, MESURÉE. (jauges) |
| 19–23,5 s | L'animation | CHOISISSEZ VOTRE ANIMATION. · Quiz, roue, tombola. (vrais écrans) |
| 23,5–28 s | La marque | RENFORCEZ VOTRE MARQUE. · Faites jouer. Faites-vous connaître. Faites-les revenir. |
| 28–32,5 s | Les lots | VOS LOTS, VOS LEVIERS. · Écouler un stock, lancer une nouveauté, une remise après achat. |
| 32,5–37,5 s | Vos clients | CONNAISSEZ VOS CLIENTS. · Âge, sexe, provenance… et leur avis grâce aux questions bonus. |
| 37,5–42 s | Le fichier | UN FICHIER CLIENT QUI GRANDIT. · Des contacts avec leur accord, prêts à relancer. |
| 42–47 s | La gestion | UNE GESTION SIMPLE, AVEC UN TÉLÉPHONE. · Tirage en un clic, billets et stock automatiques. Le gagnant revient, vous scannez. *(écart)* |
| 47–51 s | Tout-en-un | TOUT-EN-UN. · ANIMATION / FICHIER CLIENT / MESURE + Plug & Play |
| 51–55 s | Fin | INSTALLEZ FLOWIN. · Le temps de coller une affiche. · carte QR, logo, Plug & Play |

Écart : « Tirage, billets, stock : automatiques » devient « Tirage en un clic, billets et stock automatiques » (le tirage se lance d'un clic, `GagnantsClient.tsx` ; l'envoi du billet et le décompte du stock sont automatiques).

## v4 — vidéo test s3-v4 « Vous saurez enfin quelle pub vous rapporte des clients » (51 s)

Retours client sur la v3 : plus de silhouettes ni de façades à triangles (« ça fait IA »), style inspiré (sans copie) des grands chiffres à débordement de peinture, couleurs Flowin (magenta, or, violet, teal) sur pastels ; on garde les vrais écrans, les jauges de mesure et le macaron Plug & Play ; rythme ralenti (plans de 4 à 5,5 s) ; le bénéfice doit frapper. Cible terrain : supermarché, auto-école, garage. Claire la fleuriste est abandonnée.

Fichiers : `s3-v4.html`, `s3-v4.mp4`, `planches/s3-v4.png`, `src/h/v4-s3.js`, `src/h/films-v4.js` (texte et minutage), `src/h/kit-v4.js` (taches de peinture, chiffres peints, supports avec QR, pictos, jauges animées), `voix-off/s3-v4.txt` / `.srt`.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–5 s | La question | rose | **VOTRE PUB MARCHE ?** · Bus, affiche, Facebook… impossible à savoir. · « ? » géant peint |
| 5–9,5 s | Pour qui | menthe | **SUPERMARCHÉ. AUTO-ÉCOLE. GARAGE.** · Les commerces qui veulent du monde. · trois pastilles peintes |
| 9,5–14 s | Jour 1 | beurre | **ON BRANCHE, ON JOUE.** · Un QR, une affiche. Rien à installer. · « 1 » peint, affiche, support de caisse, Plug & Play |
| 14–19 s | Un QR par support | bleu ciel | **UN QR PAR SUPPORT.** · arrière de bus, set de table, pub Facebook, affiche en caisse |
| 19–23,5 s | Vos clients jouent | lilas | **VOS CLIENTS JOUENT.** · quiz et roue réels |
| 23,5–27,5 s | Jour 7 | rose | **VOUS MESUREZ.** · « 7 » peint |
| 27,5–33 s | La mesure | menthe | **CHAQUE PUB, MESURÉE.** · quatre jauges qui montent, hésitent et se posent |
| 33–37,5 s | Ce qui rapporte | beurre | **VOUS SAUREZ ENFIN** · quelle pub vous rapporte des clients. · écran Trafic réel, source d'arrivée par QR de suivi |
| 37,5–42 s | Le fichier client | lilas | **UN FICHIER CLIENT QUI GRANDIT.** · écran CRM réel (opt-in) |
| 42–46 s | Tout-en-un | bleu ciel | **TOUT-EN-UN.** · Animation. Fichier client. Mesure. |
| 46–51 s | Fin | menthe | **Installez Flowin.** · QR démo · logo + Plug & Play |

Vérité : les QR par support sont les « QR de suivi par support » de l'app (le pro les demande, Flowin les prépare et les publie ; `DiffusionOperation.tsx`) ; leurs sources apparaissent telles quelles dans « Source d'arrivée » (`pub-arriere-bus`, `set-de-table`…, noms d'exemple). Les jauges n'ont pas de chiffre ; l'écran Trafic porte « Valeurs d'illustration ». Les supports (bus, set de table, publication sponsorisée) sont des dessins génériques, sans logo de marque.

## v3 — neuf films validés par le client (style H pastel, 20 à 44 s)

Neuf vidéos 9:16 (SVG 540 × 960, MP4 1080 × 1920, 30 i/s, **muettes**) fabriquées à partir des scénarios validés (`src/h/films-v3.js`, copie conforme du fichier client : temps de début, titre, description, texte écran « gros titre · petit texte », voix off). Image d'abord, son ensuite : la voix off et la musique sont livrées à part dans `voix-off/` (un `.srt` horodaté et un `.txt` lisible par film, `voix-off/README.md` avec la direction de voix et la note musique de chaque film).

**Direction de voix (toutes les vidéos)** : voix féminine, cool, posée, suave, chaleureuse, un peu « waouh », pas ultra dynamique ; tutoiement côté joueurs, vouvoiement côté pros.

**Direction artistique** : un fond pastel uni par scène (jaune beurre `#FDF6B2`, rose pâle `#F9D5E5`, menthe `#D9F2EA`, bleu ciel `#D7EEF9`, lilas `#E6DDF7`), texte encre `#150C1C`, gros titre Manrope 800 serré, magenta `#E0218A` en accent seulement, vrais écrans Flowin comme image principale, anneau de flash aux transitions, silhouettes pleines sans visage. Rythme du fichier client (plans de 2,5 à 5 s) ; un gros titre reste au moins 2,5 s à l'écran. Chaque film finit sur le logo Flowin + le **macaron Plug & Play** (pilule dégradée `#F5A100 → #EC5B45` de `plaquette-nds.html`, `.ss-pill`) + le QR démo `/parcours/quiz?ev=ev-demo-quiz&preview=1` (aperçu qui n'enregistre rien), lu par jsQR sur les neuf fins. Zones sûres (haut 10 %, bas 20 %, droite 15 %) : 0 avertissement.

**Sources** : `src/h/kit-v3.js` (briques et écrans v3), `src/h/v3-<id>.js` (dessin de chaque film), `src/h/ecarts-v3.js` (écarts de véracité), `build-v3.mjs` (pages, voix off), `assets/` (affiches réelles du kit digital NDS, QR de station remplacé par le QR démo, nom d'une personne masqué dans le bandeau partenaires). `npm run build:v3` puis `node render.mjs s1-v3 … s9-v3`.

### Écrans reproduits (vérifiés dans `admin/`)
- **Quiz, bonus** : écrans du quiz NDS (`app/parcours/nds2026`), quiz d'un commerce (`QuizClient`, en-tête générique). **Roue** : `SpinClient.tsx` (« Faire tourner la roue », « Tu as gagné ! »). **Tombola** : `TombolaClient.tsx` (« Tu es dans la course ! », « Ton ticket tombola »). **Vote** : `VoteClient.tsx` (« Votez ! », « Sélectionné », « Valider mon vote → »).
- **Email gagnant** : objet et phrases de `supabase/functions/send-ticket-gagnant` (« Nuits du Sud & Flowin — Grand Jeu Concours — Vous avez gagné ! », « Waouh, bravo ! », « >>> TON BILLET EST ICI <<< », les 3 étapes). **Billet** : `public/nds/billets-partenaires.html` (en-tête violet, filet or, « Commerce partenaire », QR, « Le commerçant scanne ce code pour valider »).
- **Retrait** : `public/lot.html` (« Code professionnel » à 4 chiffres, « Accéder à la validation », « Billet valable », « Valider le retrait du lot », « Retrait validé — Le lot peut être remis au client. », un billet ne sert qu'une fois).
- **Espace pro** (charte `CHARTE_PRO`) : « Mes super data » onglets CRM / Gagnants & tirage / Trafic ; Trafic = `flashs QR`, `dont physique`, `dont digital`, `parties`, `joueurs`, « Source d'arrivée » (sources des QR de suivi par support : `affiche-vitrine`, `support-caisse`, `Réseaux · instagram`) ou liste des stations ; statistiques = camemberts Sexe / Tranches d'âge / Codes postaux, pic journalier et horaire (`components/operations/BlocsOperations.tsx`) ; CRM = tuiles contacts et « opt-in (relançables) », filtre « Opt-in seulement », « Envoyer un email » (`components/pro/CrmPro.tsx`) ; tirage = « Lancer le tirage » → « Gagnant proposé » → « Confirmer et envoyer le billet » (`components/pro/GagnantsClient.tsx`) ; résultats des questions (« Réponses aux questions »).
- **Création (s9)** : parcours unique de la branche `feat/parcours-creation-unique` (`components/creation/ParcoursCreation.tsx`, pas encore sur `main`) : « Que voulez-vous faire ? » (Créer une animation / Rejoindre un super event / Proposer un super event), étapes « Votre animation · Jeu · Lots · Diffusion & QR », « Quel jeu ? » (Quiz + bonus — marque blanche, Roue de la fortune, Tombola, Vote), « Vos lots » (nom, quantité, valeur, Tirage au sort / Gain immédiat, conditions), fin « Animation créée — En attente de validation par Flowin avant mise en ligne » avec « 3 QR, un par usage » (En magasin, Réseaux sociaux, Tracking) et le bouton « Affiche A4 ».
- **Affiches** : `public/nds/kit-digital/nds/station-jeu_32x45_caisse-1.png` (bandeau « Nos partenaires » imprimé) pour s1 et s4.
- **Sponsor (s7)** : pack « Sponsor officiel » (`public/bon-commande-nds-a4.html`) : présence sur tous les supports et stations, bandeau défilant de l'app (`NDS2026Client.tsx`, partenaires `bandeau=true`), lot mis en jeu. « VOTRE MARQUE » = emplacement générique.
- **Chiffres** : tous les écrans chiffrés portent « Valeurs d'illustration » ; les jauges « + de vues / passages / visibilité » n'ont pas de chiffre. Lots : « Lots donnés à titre d'exemple » (places de concert, pass VIP, soin capillaire, massage… fournis par le client). Prénoms et commerces fictifs (Claire, « Les Fleurs de Claire »), noms de joueurs masqués (« M•••• D. »).

### Écarts avec les scénarios validés (véracité)
- **s3, Dimanche** : écran « DIMANCHE. TIRAGE EN UN CLIC. · Le billet part tout seul. » et voix off ajustée au lieu de « tirage automatique, la liste des gagnants est diffusée » : le tirage se lance d'un clic (pas de tirage programmé) ; seul l'envoi du billet est automatique ; aucune diffusion automatique de la liste des gagnants.
- **s3, La relance** : pas de bouton « Relancer » ; l'écran réel montre « Opt-in seulement » puis « Envoyer un email ».
- **s3 et s4, QR de fin** : QR démo (consigne) au lieu d'un QR « compte pro » / « rejoindre ».
- **s9** : le parcours réel a une étape « Votre animation » (nom, dates) avant le jeu, propose aussi le Vote, et une animation créée par un pro attend la **validation de Flowin** avant mise en ligne ; l'app génère l'affiche **A4** (les A5/A3 sont produites par Flowin quand le pro coche « QR code imprimé »). Le film montre l'affiche A4.
- **s4, L'affiche** : affiche station 32 × 45 cm (format proche de l'A3) avec le bandeau des partenaires imprimés.

### Non vérifiable dans l'app
Le macaron vitrine et le support de caisse (matériel physique du kit, dessin indicatif) ; le « pass VIP », le soin capillaire, le massage (lots indicatifs du client) ; le « lot RSE » de s7 (le pack sponsor prévoit un lot mis en jeu, l'étiquette RSE n'est pas dans le code) ; les publications sur les réseaux de la commerçante (s3, illustrées sans compte réel).

### s1 — Flowin, le jeu de ton festival (36 s)
À qui : les festivaliers. But : comprendre Flowin et jouer pendant le festival. Page `s1-v3.html`, vidéo `s1-v3.mp4`, planche `planches/s1-v3.png`, voix off `voix-off/s1.srt` / `.txt`. Musique : Pop électro festive, 118–124 BPM, montée sur l'accroche, drop au moment des cadeaux. Bibliothèque libre de droits (Epidemic Sound, Artlist, ou la bibliothèque commerciale TikTok/Instagram).

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3 s | Accroche | beurre | CE SOIR, TU JOUES AUSSI. |
| 3–5,5 s | Flowin | rose | FLOWIN, C’EST QUOI ? |
| 5,5–8,5 s | Le principe | lilas | UN FLASH. UN JEU. UN CADEAU. |
| 8,5–11,5 s | Le téléphone | menthe | TON TÉLÉPHONE SUFFIT. · Rien à télécharger. |
| 11,5–14,5 s | Les stations | bleu ciel | REPÈRE LES STATIONS DE JEU. |
| 14,5–17,5 s | Les jeux | rose | QUIZ. ROULETTE. TOMBOLA. |
| 17,5–20,5 s | Le quiz | beurre | RÉPONDS. GAGNE DES TICKETS. |
| 20,5–25 s | Les cadeaux | lilas | À GAGNER : · Places de concert, pass VIP, lots des commerçants. |
| 25–29 s | Le gain | menthe | LE BILLET ARRIVE SUR TON TÉLÉPHONE. |
| 29–36 s | Fin | beurre | FLASHE UNE STATION. RÉPONDS AU QUIZ. |

### s2 — Chaque commerce, une occasion de gagner (36 s)
À qui : les clients des commerces de proximité. But : repérer Flowin, jouer et découvrir les commerces. Page `s2-v3.html`, vidéo `s2-v3.mp4`, planche `planches/s2-v3.png`, voix off `voix-off/s2.srt` / `.txt`. Musique : Pop acoustique enjouée (ukulélé, claquements de mains), 110–116 BPM.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3 s | Accroche | bleu ciel | TA RUE CACHE DES CADEAUX. |
| 3–5,5 s | Le macaron | beurre | REPÈRE LE MACARON FLOWIN. |
| 5,5–8 s | Flashe | menthe | FLASHE. C’EST GRATUIT. |
| 8–11,5 s | Chaque commerçant a son jeu | rose | CHAQUE COMMERÇANT A SON JEU. |
| 11,5–15 s | La révélation | lilas | GAGNÉ ? DÉCOUVRE-LE TOUT DE SUITE. |
| 15–19 s | Une occasion de gagner | bleu ciel | CHAQUE COMMERCE, UNE OCCASION DE GAGNER. |
| 19–23 s | Les cadeaux | beurre | DES CADEAUX PRÈS DE CHEZ TOI. |
| 23–27 s | Le retrait | menthe | MONTRE TON BILLET. REPARS AVEC. |
| 27–30,5 s | Découvre | rose | ET DÉCOUVRE TES COMMERCES. |
| 30,5–36 s | Fin | bleu ciel | JOUE CHEZ TES COMMERÇANTS. |

### s3 — La semaine où la boutique de Claire a changé (44 s)
À qui : les commerçants. But : vivre, en une semaine, le bénéfice de Flowin dans une boutique. Narratif : on suit Claire, fleuriste. Page `s3-v3.html`, vidéo `s3-v3.mp4`, planche `planches/s3-v3.png`, voix off `voix-off/s3.srt` / `.txt`. Musique : Groove funk-pop optimiste, 100–108 BPM, basse marquée ; montée progressive jusqu'au bilan.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3 s | Lundi | rose | LUNDI. LA BOUTIQUE EST CALME. |
| 3–5,5 s | Le kit | menthe | LE KIT FLOWIN ARRIVE. |
| 5,5–9 s | On colle | bleu ciel | ON COLLE. C’EST TOUT. |
| 9–12 s | Mardi | lilas | MARDI. ELLE LE DIT SUR SES RÉSEAUX. |
| 12–15 s | Les passants | beurre | LES PASSANTS S’ARRÊTENT. |
| 15–17,5 s | Ils jouent | rose | ILS JOUENT. |
| 17,5–21,5 s | Les lots | menthe | SES LOTS, SES OBJECTIFS. |
| 21,5–25 s | Dimanche | bleu ciel | DIMANCHE. TIRAGE EN UN CLIC. · Le billet part tout seul. *(écart, voir plus bas)* |
| 25–29 s | Le gagnant revient | beurre | UN FLASH = UN NOUVEAU CLIENT. |
| 29–32,5 s | Le bilan | lilas | ELLE SAIT CE QUI MARCHE. |
| 32,5–35,5 s | La relance | menthe | ELLE RELANCE SES CLIENTS. *(écart, voir plus bas)* |
| 35,5–39 s | Animation = visibilité | rose | ANIMATION = COMMUNICATION = VISIBILITÉ. |
| 39–44 s | Fin | menthe | INSTALLEZ FLOWIN. |

### s4 — Le festival passe par votre boutique (36 s)
À qui : les commerçants. But : comprendre le super event et le rejoindre. Page `s4-v3.html`, vidéo `s4-v3.mp4`, planche `planches/s4-v3.png`, voix off `voix-off/s4.srt` / `.txt`. Musique : Électro-pop lumineuse, 120 BPM, ambiance festival.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3,5 s | Accroche | lilas | LE FESTIVAL PASSE PAR VOTRE BOUTIQUE. |
| 3,5–7,5 s | Le super event | beurre | UN SUPER EVENT : · Un même jeu, le festival et les commerces. |
| 7,5–10,5 s | Station de jeu | rose | DEVENEZ STATION DE JEU. |
| 10,5–14 s | L’affiche | menthe | VOTRE NOM SUR L’AFFICHE. |
| 14–17,5 s | Plus de tout | bleu ciel | + DE VUES. + DE PASSAGES. + D’ÉCHANGES. |
| 17,5–21 s | Vos lots | lilas | PRÉSENTEZ VOS LOTS. |
| 21–24,5 s | Le gagnant vient | beurre | LE GAGNANT VIENT CHEZ VOUS. |
| 24,5–28 s | Vos chiffres | rose | VOS CHIFFRES EN DIRECT. |
| 28–36 s | Fin | lilas | REJOIGNEZ UN SUPER EVENT. |

### s5 — Le jeu de toute votre rue (36 s)
À qui : associations de commerçants, associations multi-points, organisateurs d’événements. But : créer une opération commune. Page `s5-v3.html`, vidéo `s5-v3.mp4`, planche `planches/s5-v3.png`, voix off `voix-off/s5.srt` / `.txt`. Musique : Pop entraînante et fédératrice, 112 BPM, chœurs légers.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3,5 s | Accroche | menthe | RASSEMBLEZ TOUTE LA RUE. |
| 3,5–7 s | Fédérer | bleu ciel | UN OUTIL POUR FÉDÉRER. |
| 7–11 s | Un thème, une date | beurre | UN THÈME. UNE DATE. |
| 11–14,5 s | Plug & Play | rose | PLUG & PLAY. |
| 14,5–17 s | Sonder | lilas | SONDEZ. |
| 17–19,5 s | Mesurer | menthe | MESUREZ. |
| 19,5–23 s | Origine | bleu ciel | SACHEZ D’OÙ ILS VIENNENT. |
| 23–27,5 s | Sur un an | beurre | UNE OPÉRATION LISIBLE SUR UN AN. |
| 27,5–36 s | Fin | menthe | CRÉEZ VOTRE SUPER EVENT. |

### s6 — Votre festival, partout en ville (40 s)
À qui : organisateurs de festivals. But : faire de Flowin le lien de diffusion avec les commerces, et l’outil de mesure et de fichier client. Page `s6-v3.html`, vidéo `s6-v3.mp4`, planche `planches/s6-v3.png`, voix off `voix-off/s6.srt` / `.txt`. Musique : Électro cinématique, 124 BPM, montée continue, impact final.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3,5 s | Accroche | beurre | VOTRE FESTIVAL, PARTOUT EN VILLE. |
| 3,5–7 s | Le lien | lilas | FLOWIN, VOTRE LIEN DE DIFFUSION. |
| 7–10,5 s | Les relais | bleu ciel | CHAQUE STATION EST UN RELAIS. |
| 10,5–14 s | Visibilité | rose | + DE VISIBILITÉ. + DE FRÉQUENTATION. |
| 14–17 s | Animer | menthe | ANIMEZ CHAQUE PASSAGE. |
| 17–20 s | Sensibiliser | beurre | SENSIBILISEZ. |
| 20–23 s | Mesurer | lilas | MESUREZ LE PASSAGE. |
| 23–26,5 s | Les personas | bleu ciel | CONNAISSEZ VOTRE PUBLIC. |
| 26,5–30 s | Le fichier | rose | DÉVELOPPEZ VOTRE FICHIER. |
| 30–33,5 s | Interagir | menthe | INTERAGISSEZ EN DIRECT. |
| 33,5–40 s | Fin | beurre | DEVENEZ UN SUPER EVENT. |

### s7 — Votre marque au cœur du jeu (25 s)
À qui : sponsors et marques. But : comprendre la visibilité du pack Sponsor. Page `s7-v3.html`, vidéo `s7-v3.mp4`, planche `planches/s7-v3.png`, voix off `voix-off/s7.srt` / `.txt`. Musique : Pop élégante, 108 BPM.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3,5 s | Accroche | lilas | VOTRE MARQUE AU CŒUR DU JEU. |
| 3,5–7 s | Partout | rose | SUR TOUTES LES STATIONS. |
| 7–10 s | Le bandeau | menthe | DANS CHAQUE PARTIE. |
| 10–13,5 s | Le lot RSE | beurre | UN LOT À VOTRE NOM. |
| 13,5–18 s | Moment heureux | lilas | ASSOCIÉE À UN MOMENT HEUREUX. |
| 18–25 s | Fin | rose | DEVENEZ SPONSOR DU SUPER EVENT. |

### s8 — Gagné : simple pour le client, simple pour le commerce (20 s)
À qui : gagnants et commerçants. But : montrer la simplicité du retrait des deux côtés. Page `s8-v3.html`, vidéo `s8-v3.mp4`, planche `planches/s8-v3.png`, voix off `voix-off/s8.srt` / `.txt`. Musique : Jingle joyeux, 120 BPM.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–2,5 s | Gagné | menthe | TU AS GAGNÉ ! |
| 2,5–5,5 s | Le billet | beurre | TON BILLET EST SUR TON TÉLÉPHONE. |
| 5,5–9 s | En boutique | rose | TU LE MONTRES. IL LE SCANNE. |
| 9–12 s | Côté commerce | lilas | UN TÉLÉPHONE SUFFIT. |
| 12–15,5 s | Validé | menthe | RETRAIT VALIDÉ. |
| 15,5–20 s | Fin | beurre | RÉCUPÈRE TON CADEAU. |

### s9 — Votre animation en quelques étapes (30 s)
À qui : les pros qui démarrent. But : prouver le Plug & Play en tuto animé, sur les vrais écrans de création. Page `s9-v3.html`, vidéo `s9-v3.mp4`, planche `planches/s9-v3.png`, voix off `voix-off/s9.srt` / `.txt`. Musique : Lo-fi pop douce, 95 BPM.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–4 s | Accroche | bleu ciel | VOTRE ANIMATION EN QUELQUES ÉTAPES. |
| 4–8,5 s | Le jeu | menthe | CHOISISSEZ VOTRE JEU. |
| 8,5–13 s | Les lots | beurre | AJOUTEZ VOS LOTS. |
| 13–18 s | Le QR | lilas | VOTRE QR ET VOS AFFICHES SONT PRÊTS. |
| 18–23,5 s | Collez | rose | COLLEZ. C’EST PARTI. |
| 23,5–30 s | Fin | menthe | PLUG & PLAY. |

## Style H pastel — deux vidéos participants (commerces 45 s, festival 33 s)

Retour de Romain sur le guide en 4 étapes : il manquait l'introduction (« c'est quoi Flowin ? »), le festival était mélangé aux commerces, le rythme était trop rapide, et il manquait la carte des stations, les deux issues (gain immédiat ou tirage), le retrait du cadeau et les super events. Couleurs jugées trop agressives. D'où **deux vidéos séparées**, même moteur H (mot géant Manrope 800, un seul objet réel, anneau de flash, désormais encre sur pastel), **palette pastel** : jaune beurre, rose pâle, menthe, bleu ciel, lilas, texte encre, magenta seulement en accent (« in » du logo, fin, piste). Environ 4,5 s par scène, une idée par scène.

Pages storyboard : `participants-commerces-h.html`, `participants-festival-h.html`. Vidéos 1080 × 1920, 30 i/s : `participants-commerces-h.mp4` (45 s), `participants-festival-h.mp4` (33 s). Planches : `planches/participants-commerces-h.png`, `planches/participants-festival-h.png` (et `-toutes-scenes`). Briques communes : `src/h/kit-h.js`.

### Vidéo A — Flowin chez tes commerçants (45 s, étapes 1 → 5)
| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–4,5 s | Intro | beurre | **C'EST QUOI / FLOWIN ?** · Des jeux gratuits chez tes commerçants. Des cadeaux à gagner. · logo |
| 4,5–9 s | ① Carte | bleu ciel | **TROUVE LES / STATIONS DE JEU.** · Sur la carte Flowin, près de chez toi. · plan, stations qui apparaissent |
| 9–13 s | ② Entre | rose | **ENTRE CHEZ TON / COMMERÇANT.** · Repère le sticker en caisse. · vitrine + sticker |
| 13–17 s | ③ Flashe | menthe | **FLASHE / LE QR.** · Avec ton téléphone. Rien à installer. |
| 17–23 s | ④ Joue | lilas | **JOUE.** · Quiz, roue, tombola, vote : chaque commerce a son jeu. · 4 cartes puis le quiz (3/5, « Juillet ») |
| 23–27,5 s | Gain immédiat | beurre | **GAGNÉ TOUT / DE SUITE !** · Selon le jeu : lot gagné sur place… · écran « Tu as gagné ! », « Voir mon billet » |
| 27,5–32 s | Tirage | bleu ciel | **OU TU ES DANS / LE TIRAGE.** · …ou un ticket pour le tirage au sort. · ticket PQ-2026-4128 |
| 32–36,5 s | ⑤ Retrait | menthe | **RÉCUPÈRE / TON CADEAU.** · Montre ton billet en boutique. · billet « Billet valable » → « Retrait validé » |
| 36,5–41 s | Super events | lilas | **DÉCOUVRE LES / SUPER EVENTS.** · Plusieurs commerces, un même jeu. Des cadeaux chez chacun. |
| 41–45 s | Fin | beurre | **Joue chez tes commerçants.** · QR démo · Flashez. Jouez. Gagnez. · logo |

### Vidéo B — Flowin à ton festival (33 s)
| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–4,5 s | Intro | lilas | **TON FESTIVAL / JOUE AVEC / FLOWIN.** · Flowin : des jeux gratuits pour gagner des cadeaux. · sticker |
| 4,5–9 s | Festival | bleu ciel | **RENDS-TOI / AU FESTIVAL.** · Regarde si Flowin y est. · fanions, scène, public (silhouettes sans visage) |
| 9–13,5 s | Repère | rose | **REPÈRE / FLOWIN.** · Des stations sur le site et chez les commerçants partenaires. · sticker + Caisses, Bars, Stands, Commerces |
| 13,5–18,5 s | Piste | menthe | **SUIS LA / PISTE.** · Le plan, station par station. · piste pointillée entre stations numérotées et la scène |
| 18,5–23,5 s | Joue | beurre | **JOUE ET / GAGNE.** · Le quiz du festival, sur ton téléphone. · quiz NDS 3/5 |
| 23,5–28,5 s | Lots | rose | **À GAGNER :** · Places de concert · Cadeaux · Goodies · Cadeaux chez tes commerçants |
| 28,5–33 s | Fin | lilas | **Rends-toi à ton festival.** · QR démo · Flashez. Jouez. Gagnez. · logo |

### Vérifié dans le code (`admin/`)
- **Carte des stations** : l'écran `carte` du parcours NDS (`NDS2026Client.tsx`) montre les 9 stations numérotées du festival (Caisses 1–3, Bars 1–2, Brigade Verte 1–3…, positions réelles) et les commerces partenaires (vue `v_nds_commerces_carte`) ; la page super event `/se/[se]` a sa carte (`SuperEventMap.tsx`). `public/carte.html` est une carte de visite, pas une carte des stations.
- **Gain immédiat ou tirage** : roue (`SpinClient.tsx`) : chaque case a un mode `immediat`, `tirage` ou `voisin` (« Tu as gagné ! », « Ce lot est un bon inscrit pour un tirage au sort ») ; quiz : sans faute = ticket pour le tirage, et règle de gain immédiat `appliquerRegleGain` (`lib/parcours.ts`) avec « Voir mon billet » ; tombola : inscription au tirage. D'où « Selon le jeu ».
- **Retrait** : `public/lot.html` (billet ouvert par son QR) : « Commerce partenaire », « Billet valable », « Bon cadeau », « N° de billet », « Présentez ce billet au commerce » ; le commerçant saisit son **code professionnel** puis « Valider le retrait du lot » → « Retrait validé, le lot peut être remis au client ». Un billet ne sert qu'une fois.
- **Super events** : relient plusieurs commerces (stations) autour d'un même jeu (`/se/[se]`, `lib/superEventLots.ts`). « Plus de cadeaux » n'est pas défendable tel quel : écrit « Des cadeaux chez chacun ».
- **Gratuit** : les jeux affichent « sans achat obligatoire ». Aucune condition d'achat, aucun cumul de tickets promis, aucune durée affichée.
- **Lots festival** : places de concert attestées (`NDS2026Client.tsx`, « 3 places pour ton prochain concert »). **Goodies** et « cadeaux » : non trouvés dans le code, gardés car ce sont les lots annoncés par Romain.
- QR de fin : `/parcours/quiz?ev=ev-demo-quiz&preview=1` (aperçu sans écriture, lu par jsQR sur les deux vidéos). Zones sûres : 0 avertissement.

La vidéo `participants-h` (guide en 4 étapes, couleurs vives) reste dans le dépôt pour mémoire ; elle est remplacée par ces deux vidéos.

## Style H — « typo + vrais écrans » : participants, le guide du joueur (38,5 s)

Style validé par Romain après les maquettes A → H : **pas de personnages dessinés**. Un aplat plein écran par scène (magenta, encre, violet, or, teal), un mot géant en Manrope 800 (−0,04 em) dans la zone sûre, un seul objet réel par scène (sticker « Station de jeu », téléphone fin avec les vrais écrans du quiz NDS, ticket), et un seul geste graphique : l'**anneau de flash** blanc qui ouvre chaque scène depuis l'objet de la précédente.

V2 du texte (retour de Romain : « design OK, wording pas OK ») : les impératifs abstraits de la première version (TA VILLE JOUE, CHERCHE, GARDE-LE, CONTINUE) sont remplacés par un **guide numéroté en 4 étapes**, au tutoiement, en phrases simples. Chaque étape porte une pastille (cercle blanc, chiffre encre) et une barre « Étape n/4 » discrète en bas, sous la zone sûre.

Page : `participants-h.html`, au format storyboard (« Comment on joue avec Flowin », « Le guide du joueur en 4 étapes. », lecteur 9:16 à gauche, scènes horodatées cliquables à droite). Vidéo : `participants-h.mp4`, 1080 × 1920, 30 i/s, 38,5 s. Planches : `planches/participants-h.png` et `planches/participants-h-toutes-scenes.png`.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3 s | Accroche | magenta | **COMMENT / ON JOUE ?** · Flowin, le jeu de tes commerçants et de ton festival. · sticker Station de jeu |
| 3–7,5 s | Étape 1 | encre | ① **VA CHEZ TES / COMMERÇANTS.** · Repère le QR Flowin en caisse. · vitrine + sticker |
| 7,5–11,5 s | Étape 2 | magenta | ② **FLASHE / LE QR.** · Avec ton téléphone. Rien à installer. · téléphone en mode caméra, anneaux |
| 11,5–16,5 s | Étape 3 | violet | ③ **JOUE AU JEU / DU COMMERCE.** · Chaque commerce a son jeu. · cartes Quiz + bonus, Roue, Tombola, Vote |
| 16,5–20,5 s | Le quiz | encre | **5 QUESTIONS.** · Le vrai quiz du festival. · quiz NDS 3/5, « Juillet » coché |
| 20,5–25 s | Étape 4 | or | ④ **TENTE DE / GAGNER.** · Bons d'achat, lots, places de concert. · ticket PQ-2026-4128 « Tirage au sort » |
| 25–29,5 s | Astuce | teal | ASTUCE · **FLOWIN SUR TON / ÉCRAN D'ACCUEIL.** · Pour rejouer en un geste. |
| 29,5–34 s | Au festival aussi | encre | **AU FESTIVAL / AUSSI.** · Culture et commerces : un seul jeu. · plan : boutiques puis scène du festival |
| 34–38,5 s | Fin (4,5 s) | encre | **Joue chez tes commerçants.** · QR réel · Flashez. Jouez. Gagnez. · logo Flowin |

Vérifié dans le code (`admin/`) :
- Jeux : parcours `quiz`, `spin` (roue), `tombola`, `vote` dans `app/parcours/` ; questions bonus du quiz (`QuizClient.tsx`, écran `bonus`).
- Pas de condition d'achat : l'accueil des jeux affiche « sans achat obligatoire » (`QuizClient.tsx`, `SpinClient.tsx`, `TombolaClient.tsx`). Aucun cumul de tickets entre commerces n'est promis, aucune durée n'est affichée.
- Lots : **places de concert** attestées pour NDS (`NDS2026Client.tsx` : lot par défaut « 3 places pour ton prochain concert », message de partage « tente de gagner des places de concert ») ; **bons d'achat** : lot offert par le commerçant à l'inscription (`app/rejoindre/[se]/RejoindreClient.tsx`, exemple « 1 bon d'achat »), lot de l'histoire commune « Bon d'achat 20 € » (`src/cast.js`). D'où « Bons d'achat, lots, places de concert. » La base n'a pas pu être interrogée (accès refusé au connecteur) : le contrôle porte sur le code.
- Ticket : `generateTicket` (`lib/ticket`), numéro de l'histoire commune `PQ-2026-4128`, « Tirage au sort » sans date.
- Écran d'accueil : manifeste PWA (`public/manifest.json`, `display: standalone`, `app/layout.tsx`). L'ajout passe par le menu du navigateur ; pas de bouton d'installation dans l'appli, donc pas de durée affichée.
- QR de fin : même cible que la V3, `/parcours/quiz?ev=ev-demo-quiz&preview=1` (aperçu : rien n'est enregistré, `lib/parcours.ts` `estApercu`).
- Zones sûres : 0 avertissement (contrôle à 3 instants de chaque scène).

## V3 — six coupes : déroulé complet, arguments, « vous » pour les commerçants

La V3 corrige la V2 après la relecture de Romain : prénoms classiques, commerçants interpellés directement (« vous », « votre boutique »), **déroulé réel** de chaque public visible étape par étape, arguments explicites (seulement ceux que le code confirme). Mêmes chiffres, mêmes écrans, même histoire (Fête du Lac, Belrive).

Personnages : **Julie** (participante, pseudo à l'écran Lune_42), **Hugo** (organisateur), **Sophie** (Boulangerie Les Tilleuls). Apparence inchangée.

Règles communes :
- **Accroche** : 1,5 s en 15 s, 2 s en 30 s ; 3 lignes en 52 px, visuel lisible dès l'image 0.
- **Déroulé** : sous chaque légende, un bandeau « ÉTAPE n/N » et une pastille par étape (faites : cochées ; en cours : pleine). 15 s = déroulé résumé en 4 étapes, 30 s = déroulé complet (7 ou 8 étapes).
- **Légendes** : 2 lignes, 29 px gras ; 2,5 s par étape en 15 s, 3 s (3,4 s organisateurs) en 30 s.
- **Zones sûres** contrôlées automatiquement (haut 10 %, bas 20 %, droite 15 %) : 0 avertissement sur les six coupes.
- Fin 15 s : logo, phrase, bouton, adresse courte, « Lien en bio », sans QR. Fin 30 s : QR réel (lu par jsQR).

### Participants 15 s — déroulé résumé (4 étapes)
| Temps | Étape | Écran | Légende |
|---|---|---|---|
| 0–1,5 s | Accroche « JEU GRATUIT » | Bon d'achat 20 € | **Un bon d'achat / à gagner en / 5 questions.** |
| 1,5–4 s | 1/4 QR | Julie flashe le QR du stand | Flashe le QR / chez ton commerçant. |
| 4–6,5 s | 2/4 Quiz | Question 3/5 | Joue : 5 questions, / gratuit, sans appli. |
| 6,5–9 s | 3/4 Ticket | « Bravo ! Score : 5/5 », ticket PQ-2026-4128 | Inscris-toi : ton / ticket pour le tirage. |
| 9–11,5 s | 4/4 Lot | Retrait en boutique, « Billet validé » | Julie, tirée au sort, / retire ses 20 €. |
| 11,5–15 s | Fin | — | « Joue chez tes commerçants. » · **Cherche le QR Flowin** · Lien en bio |

### Participants 30 s — déroulé complet (8 étapes, 3 s chacune)
Accroche 2 s · 1/8 « Flashe le QR / chez ton commerçant. » (stand) · 2/8 « Les lots, les règles : / gratuit, sans appli. » (accueil : « À gagner », « Comment jouer ? », puis défilement jusqu'à « Jouer gratuitement » et « Jeu gratuit · Sans achat obligatoire ») · 3/8 « 5 questions, / une à la fois. » · 4/8 « 5/5 : sans faute, / ton ticket est acquis. » · 5/8 « Inscris-toi pour / recevoir ton ticket. » (« Crée ton compte », case RGPD) · 6/8 « Ticket PQ-2026-4128, / tirage dimanche. » · 7/8 « Tirage au sort : / Julie gagne ! » (tirage, Lune_42) · 8/8 « Elle retire ses 20 € / chez le commerçant. » (« Billet validé ») · fin 4 s : « Joue chez tes commerçants. », QR **Scanne pour essayer le jeu** (`?preview=1`, rien n'est enregistré).

### Organisateurs 15 s — déroulé résumé (4 étapes)
| Temps | Étape | Écran | Légende |
|---|---|---|---|
| 0–1,5 s | Accroche « SUPER EVENT » | Contacts qui s'ajoutent | **163 contacts / récoltés en / un week-end.** |
| 1,5–4 s | 1/4 Demande | « Que voulez-vous faire ? » → « Demander la création d'un super event à Flowin » | Hugo demande, Flowin / crée le super event. |
| 4–6,5 s | 2/4 Stations | La fête, trois stands à QR | Chaque commerce / devient une station. |
| 6,5–9 s | 3/4 Direct | « Mes opérations », 214 parties | En direct : / 214 parties mesurées. |
| 9–11,5 s | 4/4 Contacts | « Mes super data » · CRM, 163 | Après le tirage : / 163 contacts gardés. |
| 11,5–15 s | Fin | — | « Un super event pour votre ville. » · **Créez votre compte pro** · Lien en bio |

### Organisateurs 30 s — déroulé complet (7 étapes, 3,4 s chacune)
Accroche 2 s · 1/7 « Hugo demande son / super event à Flowin. » · 2/7 « Flowin le crée : / jeu, tirage, QR. » (carte « À venir », 0 partie) · 3/7 « Chaque commerce / devient une station. » · 4/7 « En direct : / 214 parties mesurées. » · 5/7 « Dimanche : tirage / au sort en un clic. » · 6/7 « Le billet part / par email au gagnant. » · 7/7 « 163 contacts gardés, / à relancer. » · fin 4,2 s : « Un super event pour votre ville. », QR **Scannez : compte pro**.

### Commerçants 15 s — déroulé résumé (4 étapes), en « vous »
| Temps | Étape | Écran | Légende |
|---|---|---|---|
| 0–1,5 s | Accroche « COMMERÇANTS » | Carte à tampons barrée | **Fini la carte / de fidélité / papier.** |
| 1,5–4 s | 1/4 Inscription | « Votre lot pour le tirage » | Inscrivez-vous et / offrez un lot. |
| 4–6,5 s | 2/4 Station | Le stand et son QR, un client flashe | Votre boutique devient / une station de jeu. |
| 6,5–9 s | 3/4 Chiffres | « MA PARTICIPATION · BILAN » | Vos chiffres : 51 / joueurs, 96 flashs. |
| 9–11,5 s | 4/4 Contacts | CRM, 51 contacts « joueurs de votre boutique » | 51 contacts clients, / avec leur accord. |
| 11,5–15 s | Fin | — | « Animez votre boutique, captez de nouveaux clients. » · **Devenez partenaire** · Lien en bio |

### Commerçants 30 s — déroulé complet (8 étapes, 3 s chacune), en « vous »
Accroche 2 s · 1/8 « Inscrivez votre / boutique en 4 étapes. » (« Rejoindre en 4 étapes » : votre commerce, votre contact, votre lot) · 2/8 « Vous offrez un lot : / bon d'achat de 20 €. » · 3/8 « Validé sous 24–48 h : / votre QR à afficher. » (« Demande envoyée ! ») · 4/8 « Votre boutique devient / une station de jeu. » · 5/8 « Vos clients jouent / et vous découvrent. » (« Nos partenaires » côté joueur) · 6/8 « Vos chiffres : 51 / joueurs, 96 flashs. » · 7/8 « 51 contacts clients, / avec leur accord. » · 8/8 « Le gagnant du tirage / vient chez vous. » (validation en caisse par PIN, « Billet validé ») · fin 4 s : « Animez votre boutique, captez de nouveaux clients. », QR **Scannez : devenir partenaire**.

## Audit V2 → V3

| # | Critique de Romain | Correction V3 |
|---|---|---|
| 1 | Commerces : récit à la 3e personne sur Sophie. | Toutes les légendes commerçants en « vous / votre boutique » ; Sophie n'est plus que l'image. |
| 2 | Prénoms « exotiques ». | Aminata → **Julie**, Mei → **Sophie**, Hugo inchangé (légendes, écran « Merci Sophie ! », sources). Apparence et pseudos (Lune_42…) inchangés. |
| 3 | Il manque le déroulé : des moments isolés. | Bandeau « ÉTAPE n/N » ; 30 s = parcours complet de chaque public (joueur 8 étapes, organisateur 7, commerçant 8) ; 15 s = résumé en 4 étapes. Ajouts : inscription joueur, tirage côté joueur, validation Flowin et QR à afficher, contacts du commerçant, retrait du lot en caisse. |
| 4 | Il manque les arguments. | Arguments écrits dans les légendes (liste ci-dessous). |

### Arguments ajoutés (vérifiés dans le code)
- **Gratuit, sans appli, sans achat** (joueur) : accueil « Jouer gratuitement », « Jeu gratuit · Sans achat obligatoire » ; parcours web, aucune application.
- **Contacts avec consentement** (« avec leur accord ») : la création de compte Quiz exige la case « J'accepte que mes coordonnées soient utilisées pour ce jeu… RGPD » (`QuizClient.tsx`, `optin: true`) ; le CRM pro affiche « Opt-in : relançable ».
- **Le commerçant récupère les contacts de ses joueurs** : RPC `crm_pro` = joueurs ayant joué aux opérations dont le pro est propriétaire, stations de super event comprises.
- **Contacts à relancer** (organisateur) : CRM pro, actions de relance email / SMS / export (`CrmPro.tsx`).
- **Chiffres mesurés** : parties (« Mes opérations »), joueurs / parties / flashs QR par station (bilan).
- **Juste un QR à afficher** : « Votre QR à afficher en boutique » (`RejoindreClient.tsx`), « QR et PIN à télécharger ou imprimer » (`HistoriqueClient.tsx`), diffusion « QR imprimé ».
- **Validation Flowin sous 24–48 h** et **Flowin crée le super event** (organisateur).
- **Trafic en boutique** : le joueur flashe le QR sur place et le gagnant vient retirer son lot en caisse (validation PIN).

### Arguments écartés
- **« Gratuit » pour le commerçant** : faux — la page « Devenez commerce partenaire » affiche des frais de participation (« … € HT de participation »).
- **« Accompagnement Flowin »** au sens large : seuls la validation sous 24–48 h et la création du super event par Flowin sont dans l'app ; pas de promesse d'accompagnement générale.
- **Parcours multi-commerces / cumul de tickets entre stations** : non montré par le gabarit Quiz actuel (voir audit V1).
- **Durée d'une partie, taux d'opt-in, panier moyen, retour en boutique mesuré** : aucune mesure dans l'app.
- Rappel : l'écran « Que voulez-vous faire ? » / « Demander la création d'un super event à Flowin » vient de la maquette de refonte, pas encore en ligne.

### Corrigé après relecture des planches V3
1. Écran « Demande envoyée ! » : « Flowin » coupé sous la barre d'état → défilement ajusté (36).
2. Carte de fidélité : le trait de rature démarrait trop tard pour une accroche de 1,5 s → avancé à 0,3 s.

## Audit marketing V1 → V2 (historique)

| # | Critique de la V1 | Correction V2 |
|---|---|---|
| 1 | Pas d'accroche : les 2 premières secondes posaient le décor, la vignette ne disait rien. | Accroche en 52 px dès l'image 0, avec un visuel du bénéfice (bon d'achat, contacts, carte de fidélité barrée). |
| 2 | 35–37 s : trop long pour une publicité sociale, trop court pour tout expliquer. | Deux coupes par public : 15 s (pub) et 30 s (explication). |
| 3 | Légendes descriptives (« ce qui se passe ») plutôt que vendeuses. | Légendes qui portent un bénéfice réel : commerces = fidélisation sans carte papier, contacts, visites mesurées (flashs) ; joueurs = gratuit, sans appli ; organisateurs = 163 contacts, trafic chez les commerces. |
| 4 | **Histoire organisateur fausse** : Hugo créait lui-même le super event. Un pro ne peut pas créer un super event. | Hugo **demande** son super event à Flowin (écran « Que voulez-vous faire ? » : « Créer mon animation » / « Intégrer un super event » / « Demander la création d'un super event à Flowin »), Flowin le crée, les commerces rejoignent, direct, tirage, contacts. |
| 5 | Fin : gros QR, plusieurs messages ; le QR participants menait au vrai jeu (création de compte réelle). | Fin réseaux sans QR (logo, une phrase, un bouton, adresse courte, « Lien en bio ») ; QR réel petit seulement en 30 s ; QR participants en `?preview=1`. |
| 6 | Textes sous l'interface TikTok/Reels (bas, droite). | Zones sûres imposées et contrôlées automatiquement ; voile en bas du téléphone ; contenu d'écran décalé (`scroll`) pour garder l'essentiel au-dessus. |
| 7 | Vocabulaire flottant (opération, jeu, event). | « Animation » / « Super event » partout. |

### Promesses retenues, promesses écartées
- **Retenu** : « Gratuit, sans appli, sans achat » (texte de l'accueil du jeu) ; « 5 questions » (réglage par défaut du Quiz) ; 214 parties, 163 contacts, 51 joueurs / 58 parties / 96 flashs (chiffres de l'histoire commune, cohérents avec ce que montrent les écrans pro) ; « validée sous 24 à 48 h » (texte de « Demande envoyée ! ») ; « Animez votre boutique, captez de nouveaux clients » (texte de l'app).
- **« Fini la carte de fidélité papier »** : positionnement, pas une fonction « carte de fidélité » ; il s'appuie sur ce qui existe (contacts récoltés, CRM, visites mesurées en flashs QR). À valider par Romain.
- **Écarté** : « en 30 secondes » (durée de partie jamais mesurée) → remplacé par « 5 questions » ; tout prix ou frais ; tout chiffre de clics vers les sites partenaires (non affiché côté pro).
- **À savoir** : l'écran « Que voulez-vous faire ? » et le choix « Demander la création d'un super event à Flowin » reprennent la maquette de la refonte en cours ; ils ne sont **pas encore en ligne**. Ne pas publier la coupe organisateurs avant la mise en ligne de ce parcours (ou accepter l'écart).

### Corrigé après relecture des planches V2
1. Textes qui glissaient sous le voile du bas (« Jeu gratuit · Sans achat obligatoire », « Mon compte & mes gains », « Validé par l'équipe Flowin sous 24–48h », « Ouvrir le tirage → ») : contenu d'écran remonté (`scroll`) scène par scène.
2. Vignette faible (visuel d'accroche absent à l'image 0) : les visuels démarrent avant t = 0.
3. Coche de sélection posée sur le titre « Demander la création d'un » : la coche remplace l'icône de la carte.
4. Résultat du tirage lisible 0,6 s seulement : scène accélérée (k 1,6), validation en caisse aussi (k 1,4).
5. Écrans remontés : lettres coupées sous l'encoche → bande de barre d'état redessinée par-dessus.
6. Compteurs (214, 163, 51/58/96) et saisie du lot pas terminés en 2,5 s : animations accélérées dans les coupes 15 s.

---

# V1 (archivée — sources dans `src/scenarios/v1/`)

## L'histoire commune

| Élément | Valeur (identique dans les 3 vidéos) |
|---|---|
| Événement | **Fête du Lac**, à **Belrive** : super event fictif, 6 stations, dates 13 – 14 juin |
| Jeu | Quiz, 5 questions, tirage au sort |
| Station suivie | **Boulangerie Les Tilleuls** (commerce fictif) |
| Lot | **Bon d'achat 20 €**, offert par la boulangerie |
| Ticket gagnant | **PQ-2026-4128** (format réel `PQ-AAAA-NNNN`, `lib/ticket.ts`) |
| Tirage | « Tirage dimanche 14 juin » |
| Chiffres de la fête | 214 parties · 163 joueurs (CRM : 163 contacts) |
| Chiffres de la station | 96 flashs QR · 58 parties · 51 joueurs |

Personnages (prénoms dans les légendes, jamais sur les écrans) :
- **Julie**, participante : peau foncée, cheveux en chignon. Pseudo à l'écran : **Lune_42**.
- **Hugo**, organisateur : peau claire, cheveux courts.
- **Sophie**, boulangère partenaire : peau mate, queue de cheval portée en arrière.

Visages toujours dégagés, aucun signe religieux, ni genre ni orientation abordés.

## Vidéo 1 — Participants (37,1 s)

| Temps | Scène | Légende | Écran montré (source) |
|---|---|---|---|
| 0,0 – 4,1 | Le QR de la station | À la Fête du Lac, Julie / flashe le QR d'une station. | Illustration : stand + panneau « STATION » |
| 4,1 – 8,2 | Le jeu s'ouvre | Rien à installer : le jeu / s'ouvre dans le navigateur. | Accueil Quiz : « À gagner », « Comment jouer ? » (Flashe le QR code / Réponds au quiz), « Jouer gratuitement → », « Jeu gratuit · Sans achat obligatoire », « Propulsé par Flowin » — `QuizClient.tsx`, `ParcoursHero.tsx` |
| 8,2 – 12,3 | Le quiz | Cinq questions, / une réponse à la fois. | « Question 3/5 », barre de progression, réponses A–D, bonne réponse en vert — `QuizClient.tsx` (5 questions par défaut : `quizNbQuestions ?? 5`) |
| 12,3 – 16,4 | Le score | Sans faute : son ticket / pour le tirage est acquis. | « TON SCORE 5/5 », « Sans faute ! Ton ticket est acquis. » — `QuizClient.tsx` |
| 16,4 – 20,5 | Le compte | Elle crée son compte une fois. / Ses données ne sont pas vendues. | « Crée ton compte », Prénom/Nom/Email/Téléphone (masqués), texte RGPD exact, « Valider → » — `QuizClient.tsx`, `RGPD_TEXT` |
| 20,5 – 24,6 | Le ticket | Son ticket : PQ-2026-4128. / Tirage dimanche 14 juin. | « Bravo ! Score : 5/5 », code ticket, « Découvrir nos partenaires », « Parraine un ami & gagne un ticket », « Mon compte & mes gains », « Retour à l'opération » — `QuizClient.tsx`, `ParcoursOutro.tsx` |
| 24,6 – 28,7 | Les partenaires | Elle découvre les commerces / partenaires de la fête. | « Nos partenaires », grille de commerces — `ParcoursPartenairesGrid` |
| 28,7 – 32,8 | Le lot | Tirée au sort, elle retire / son bon d'achat chez Sophie. | Illustration boutique, « Billet validé » |
| 32,8 – 37,1 | Fin | — | Logo, « Jouez gratuitement, sans achat obligatoire. », QR, « Scannez pour essayer le jeu » |

## Vidéo 2 — Organisateurs (35,5 s)

| Temps | Scène | Légende | Écran montré (source) |
|---|---|---|---|
| 0,0 – 3,9 | Hugo | Hugo organise la Fête du Lac / avec les commerçants de Belrive. | Illustration bureau, affiche de la fête |
| 3,9 – 7,8 | Nouvelle opération | Dans son espace pro : / « Créer un super event ». | « Nouvelle opération / Créer ou rejoindre », 3 cartes « Créer une animation / Rejoindre un super event / Créer un super event » avec leurs textes — `NouvelleOperation.tsx`, `ProShell` |
| 7,8 – 11,7 | Le super event | Un même jeu et un tirage / au sort pour toute la fête. | « Récapitulatif » : Opération, Nom, Dates, Jeu, Diffusion ; bouton « Créer le super event » puis « Enregistrement… » — `NouvelleOperation.tsx` (super event = tirage au sort uniquement) |
| 11,7 – 15,6 | Les stations | Les commerçants de Belrive / deviennent des stations de jeu. | Illustration : stands avec panneau « STATION » |
| 15,6 – 19,5 | Suivi en direct | Pendant la fête, il suit / les parties en direct. | « Mes opérations », filtres Toutes / Animations / Super events, section « En cours », carte compacte : parties · gagnants · à remettre, puces Lots / Gagnants / CRM / Trafic / Bons — `app/pro/page.tsx`, `GrilleOperations.tsx` |
| 19,5 – 23,4 | Le tirage | Dimanche soir, il lance / le tirage au sort. | « Mes super data », onglets CRM / Gagnants & tirage / Trafic, « Tirage au sort », « Lancer le tirage », « Gagnant proposé » — `app/pro/donnees`, `GagnantsClient.tsx` |
| 23,4 – 27,3 | Le billet | Le billet du gagnant / part par email. | « Confirmer et envoyer le billet », « Billet envoyé par email au gagnant. » — `GagnantsClient.tsx` |
| 27,3 – 31,2 | Les résultats | Après la fête, il garde / ses contacts et ses chiffres. | « Mes super data » onglet CRM, nombre de contacts, liste en pseudos — `app/pro/donnees`, `CrmPro` |
| 31,2 – 35,5 | Fin | — | Logo, « Animez votre lieu, créez du lien. », QR, « Scannez pour créer votre compte pro » |

## Vidéo 3 — Partenaires / sponsors (35,5 s)

| Temps | Scène | Légende | Écran montré (source) |
|---|---|---|---|
| 0,0 – 3,9 | Sophie | Sophie tient la Boulangerie / Les Tilleuls, à Belrive. | Illustration boutique |
| 3,9 – 7,8 | Rejoindre | Elle rejoint la Fête du Lac / en 4 étapes. | « DEVENEZ COMMERCE PARTENAIRE », nom de l'opération, « Animez votre boutique, captez de nouveaux clients et offrez-leur une chance de gagner. », « Rejoindre en 4 étapes », « Commencer » — `app/rejoindre/[se]/RejoindreClient.tsx` |
| 7,8 – 11,7 | Son offre | Son offre : un bon d'achat / de 20 € pour le tirage. | « Votre lot pour le tirage », « Jeu choisi par l'organisateur, gagnants désignés par tirage au sort. », « Lot offert », « Quantité », « Conditions d'utilisation » — `RejoindreClient.tsx` |
| 11,7 – 15,6 | Validation | Sa demande part chez Flowin, / validée sous 24 à 48 h. | « Demande envoyée ! », « Merci Sophie ! La demande de … pour l'opération … est enregistrée. », « Nous validons votre commerce sous 24–48h. Votre QR à afficher en boutique et votre tableau de bord seront activés à ce moment-là. » — `RejoindreClient.tsx` |
| 15,6 – 19,5 | La fête | Pendant la fête, les joueurs / flashent le QR de sa station. | Illustration (même scène que la vidéo participants) |
| 19,5 – 23,4 | Nos partenaires | Sa boutique apparaît dans / « Nos partenaires ». | Même écran que la vidéo participants — `ParcoursPartenairesGrid` |
| 23,4 – 27,3 | Ses chiffres | Elle mesure sa station : / 96 flashs QR, 58 parties. | « MA PARTICIPATION · BILAN », « Mes stations » : Joueurs / Parties / Flashs QR, « Gagnants & tirage », « Tirage global mutualisé. », « Ouvrir le tirage → » — `app/pro/super/page.tsx` |
| 27,3 – 31,2 | Le retrait | Julie, tirée au sort, retire / son lot : billet validé en caisse. | « À retirer », « Voir le billet ↗ », « Validation en caisse », code PIN, « Valider le billet », « Billet validé. Le lot est décompté du stock. » — `GagnantsClient.tsx` (RPC `verifier_pin_pro` puis `valider_lot`) |
| 31,2 – 35,5 | Fin | — | Logo, « Animez votre boutique, captez de nouveaux clients. », QR, « Scannez pour devenir partenaire » |

Chaque légende fait 2 lignes au plus et reste toute la durée de sa scène (3,9 s minimum). L'écran de fin dure 4,3 s.

## Cibles des QR codes de fin

Chaque QR est lu par `render.mjs` (jsQR) sur l'image finale avant export : les trois décodent correctement.

| Vidéo | Cible | Pourquoi |
|---|---|---|
| Participants | `https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz` | Un joueur n'a pas de page d'inscription séparée : il s'inscrit **dans le jeu** (écran « Crée ton compte »). `ev-demo-quiz` est l'event de démonstration du Quiz, en statut `live` en base. |
| Organisateurs | `https://flowin-events.vercel.app/pro/inscription` | Page réelle « Espace pro Flowin — Créez votre compte », d'où l'on crée ensuite une animation ou un super event. |
| Partenaires | `https://flowin-events.vercel.app/pro/inscription` | La page « Devenez commerce partenaire » (`/rejoindre/<super event>`) est propre à **une** opération réelle : en choisir une ferait la promotion d'un vrai client. Le chemin générique d'un commerce passe par le compte pro, puis « Rejoindre un super event ». |

## Audit

### Montré parce que réel (vérifié dans le code)
- Parcours joueur Quiz : accueil, « À gagner », « Comment jouer ? », 5 questions par défaut, score, « Sans faute ! Ton ticket est acquis. », création de compte avec le texte RGPD exact, ticket au format `PQ-AAAA-NNNN`, « Découvrir nos partenaires », « Parraine un ami & gagne un ticket », « Mon compte & mes gains » (super event).
- Grille « Nos partenaires » côté joueur.
- Espace pro : « Nouvelle opération » et ses 3 choix, récapitulatif et bouton « Créer le super event », « Mes opérations » (cartes compactes, compteurs parties / gagnants / à remettre), « Mes super data » (CRM, Gagnants & tirage, Trafic), tirage au sort (« Lancer le tirage », « Gagnant proposé », « Confirmer et envoyer le billet », « Billet envoyé par email au gagnant. »).
- Commerce partenaire : page « Devenez commerce partenaire » en 4 étapes, lot pour le tirage, « Demande envoyée ! » avec validation sous 24–48h, bilan « MA PARTICIPATION · BILAN » (joueurs, parties, flashs QR), validation du billet en caisse par code PIN.
- « Mesurer les visites » = les **flashs QR** (ouvertures du QR), parties et joueurs de la station : c'est ce que l'espace pro affiche réellement (`ContenuTracking`, `app/pro/super`).

### Écarté parce que pas réel, pas fini ou trompeur
- **Prix et frais de participation** (« … € HT de participation ») : montant configuré par opération et par pack, pas un tarif Flowin universel.
- **Clics vers les liens des partenaires** (`partenaire_clics`, redirection `/r/<id>`) : enregistrés, mais aucun écran pro ne les affiche aujourd'hui (table vide en base). Pas montré comme une mesure disponible.
- **Carte des stations et cumul de tickets entre stations** : le gabarit Quiz actuel affiche toujours 2 étapes et pas de bannière de cumul, même dans un super event ; la version NDS2026 le fait mais reste propre à Nuits du Sud. Non montré.
- **Vue globale « toutes stations » pour l'organisateur** : côté pro, elle est masquée (`masquerGlobal`) ; seul le Super Admin la voit. On montre la carte « Mes opérations » et le CRM, pas un tableau global.
- **Contrôle de position (« périmètre de jeu »)** : existe dans le code mais jamais activé.
- **Gain immédiat** (roue, carte « Gagné tout de suite ») : réel, mais hors de cette histoire qui suit un tirage au sort ; écarté pour garder une seule mécanique.
- **Promesses marketing** : seules des accroches tirées des textes de l'application sont utilisées (« Jeu gratuit · Sans achat obligatoire », « Animez votre lieu, créez du lien », « Animez votre boutique, captez de nouveaux clients »).
- **Noms réels de clients et données personnelles** : tout est fictif ; les écrans montrent des pseudos et des champs masqués.

### Choix d'anonymisation (consigne, pas une fonction de l'app)
L'application réelle affiche le prénom saisi. Les vidéos remplacent tout nom à l'écran par un pseudo (Lune_42, Soleil_7…) et masquent les champs du formulaire, conformément à la consigne « l'app reste anonyme ».

### Corrigé après relecture des planches
1. Bulle « QR flashé » posée sur le panneau QR (texte « Fête du Lac » caché) : déplacée à droite, sur le lac.
2. Confettis par-dessus « Ton ticket est acquis. » : dessinés derrière le texte.
3. Récapitulatif de création : lignes inventées (« Lieu », « Gagnants », « Lot de la station ») et confirmation « Super event créé » remplacées par les vraies lignes du code (Opération, Nom, Dates, Jeu, Diffusion) et l'état réel « Enregistrement… ».
4. « Merci Sophie ! La demande de la … » : texte ramené au libellé exact (« La demande de … »).
5. Légende « Six commerces deviennent des stations » alors que trois stands étaient visibles : reformulée (« Les commerçants de Belrive deviennent des stations de jeu »).
6. Légende « Validée par Flowin, elle reçoit son QR » sur l'écran « Demande envoyée » (validation pas encore faite) : reformulée (« Sa demande part chez Flowin, validée sous 24 à 48 h »).
7. Carte « Mes opérations » : « en cours » et la puce « Bons » sortaient de la carte ; compteurs resserrés, puces sur deux lignes.
8. Enseignes des petits stands illisibles : police agrandie.
9. Écrans de téléphone trop petits pour un mobile : téléphone agrandi et contenu zoomé ×1,12.
10. Queue de cheval de Sophie qui longeait la joue : placée en arrière et en haut, visage entièrement dégagé.
11. Mention « Coordonnées masquées dans cette vidéo » ajoutée dans un écran : retirée (elle n'existe pas dans l'app).
12. Accroche, texte du héros « Devenez commerce partenaire » collé à la carte blanche : espacement corrigé.
