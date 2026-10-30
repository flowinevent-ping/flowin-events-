# Animations explicatives Flowin — scénarios et audit

Vidéos verticales 1080 × 1920, 30 i/s, sans son nécessaire. Elles racontent **la même histoire** (Fête du Lac, Belrive) vue par les participants, les organisateurs et les commerces partenaires. La V3 (six coupes 15 s / 30 s) est décrite d'abord ; les audits V1 → V2 et la V1 restent documentés en dessous. Les prénoms Aminata et Mei des versions précédentes sont devenus Julie et Sophie.

## Style H — « typo + vrais écrans » : participants (41 s)

Style validé par Romain après les maquettes A → H : **plus de personnages dessinés**. Un aplat plein écran par scène (magenta, encre, violet, or, teal), un mot géant en Manrope 800 (−0,04 em) calé dans la zone sûre, un seul objet réel par scène (sticker « Station de jeu », téléphone fin avec les vrais écrans du quiz NDS, ticket), et un seul geste graphique : l'**anneau de flash** blanc qui ouvre chaque scène depuis l'objet de la précédente.

Scénario (paroles de Romain) : un guide du « comment ça marche ». On va dans chaque commerce Flowin, on joue au jeu du commerce (quiz + bonus, roue, tombola, vote), sans appli, en flashant le QR. On peut garder Flowin sur son écran d'accueil, et le même jeu continue au festival : Flowin relie culture et commerces.

Page : `participants-h.html`, au format storyboard (lecteur 9:16 à gauche, scènes horodatées cliquables à droite, scène courante surlignée). Vidéo : `participants-h.mp4`, 1080 × 1920, 30 i/s, 41 s. Planches : `planches/participants-h.png` et `planches/participants-h-toutes-scenes.png`.

| Temps | Scène | Fond | À l'écran |
|---|---|---|---|
| 0–3,5 s | Accroche | magenta | **TA VILLE / JOUE.** · Festival + commerces, un seul jeu. · sticker Station de jeu |
| 3,5–7,5 s | Cherche | encre | **CHERCHE.** · Dans chaque commerce Flowin. · vitrine + sticker |
| 7,5–11,5 s | Flashe | magenta | **FLASHE.** · Sans appli. Sans téléchargement. · téléphone en mode caméra sur le QR, anneaux |
| 11,5–16,5 s | Un jeu par commerce | violet | **À CHAQUE / PASSAGE, / JOUE.** · 4 cartes : Quiz + bonus, Roue, Tombola, Vote |
| 16,5–22,5 s | Joue | encre | **JOUE.** · 5 questions, puis des bonus. · vrai quiz (3/5, « Juillet » coché), puis écran « BONUS 1/2 » |
| 22,5–27 s | Gagne | or | **GAGNE.** · Un ticket pour le tirage au sort. · ticket PQ-2026-4128 qui sort du téléphone (5/5) |
| 27–31,5 s | Garde-le | teal | **GARDE-LE.** · Ajoute Flowin à ton écran d'accueil. · l'icône rejoint l'écran d'accueil |
| 31,5–36,5 s | Continue | encre | **CONTINUE.** · Commerces et festival : le même jeu. · plan de ville, boutiques qui s'allument puis la scène du festival |
| 36,5–41 s | Fin | encre | Culture + commerces. **Un seul jeu.** · QR réel · Flashez. Jouez. Gagnez. · logo Flowin |

Vérifié dans le code (`admin/`) :
- Jeux : parcours `quiz`, `spin` (roue), `tombola`, `vote` dans `app/parcours/` ; questions bonus du quiz (`QuizClient.tsx`, écran `bonus`).
- Ticket : `generateTicket` (`lib/ticket`), ticket de l'histoire commune `PQ-2026-4128` (`src/cast.js`), « Tirage au sort » sans date.
- Écran d'accueil : manifeste PWA (`public/manifest.json`, `display: standalone`, déclaré dans `app/layout.tsx`). L'ajout passe par le menu du navigateur ; il n'y a pas de bouton d'installation dans l'appli.
- QR de fin : même cible que la V3, `/parcours/quiz?ev=ev-demo-quiz&preview=1` (aperçu : aucun joueur ni participation enregistré, `lib/parcours.ts` `estApercu`). `/nds?preview=1` ouvre la page d'accueil NDS, pas le jeu : non retenu.

Écarts avec le scénario dicté, à valider :
- « Pour chaque achat fait, joue » → **« À chaque passage, joue »** : l'accueil du jeu affiche « Jeu gratuit · Sans achat obligatoire » ; afficher une obligation d'achat contredirait l'appli (et la règle des jeux-concours).
- « Enregistrer l'application en moins de 5 secondes » → **« Ajoute Flowin à ton écran d'accueil »**, sans chronomètre : le manifeste existe mais aucune mesure ni bouton d'installation ne permet d'affirmer une durée.
- L'écran bonus montre une question d'exemple (« Comment as-tu connu le festival ? ») : la banque bonus réelle dépend de chaque opération.
- Zones sûres : 0 avertissement (contrôle à 3 instants de chaque scène ; pour les mots géants, le haut visible est la hauteur des capitales).

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
