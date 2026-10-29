# Animations explicatives Flowin — scénarios et audit

Vidéos verticales 1080 × 1920, 30 i/s, sans son nécessaire. Elles racontent **la même histoire** (Fête du Lac, Belrive) vue par les participants, les organisateurs et les commerces partenaires. La V2 (six coupes 15 s / 30 s) est décrite d'abord ; la V1 reste documentée en dessous.

## V2 — six coupes pour TikTok, Instagram et Facebook

La V2 remplace les trois vidéos explicatives par **deux coupes par public** : une publicité réseaux sociaux de **15 s** et une explication de **30 s**. Même histoire, mêmes personnages, mêmes chiffres que la V1 (voir plus bas), mais chaque coupe commence par une accroche en très gros texte et finit sur un appel à l'action unique.

Règles appliquées aux six coupes :
- **Accroche 0–2 s** (0–3 s en 30 s) : 3 lignes en 52 px, un visuel lisible dès la première image (vignette de la vidéo).
- **Légendes** : 2 lignes au plus, 29 px gras, affichées toute la scène — 2,5 s minimum en 15 s, 3,2 s en 30 s (consigne : 2 s / 3 s).
- **Zones sûres** (interface TikTok/Reels) : aucun texte dans les 10 % du haut, les 20 % du bas ni les 15 % de droite. Un voile opaque masque le bas du téléphone. `render.mjs` vérifie chaque texte visible à 3 instants de chaque scène : 0 avertissement sur les six coupes (`planches/rapport.json`).
- **Fin 15 s (réseaux)** : logo, une phrase, un bouton d'appel à l'action, adresse courte, « Lien en bio ». **Pas de QR.**
- **Fin 30 s** : même accroche, QR réel petit et secondaire, lu par jsQR avant export.
- Vocabulaire : « Animation » (un commerce, chez lui) et « Super event » (plusieurs commerces, créé par Flowin).

### Participants 15 s
| Temps | Scène | Légende |
|---|---|---|
| 0–2 s | Accroche (kicker « JEU GRATUIT ») | **Un bon d'achat / à gagner en / 5 questions.** (bon d'achat 20 €, Boulangerie Les Tilleuls) |
| 2–4,5 s | Aminata flashe le QR du stand | Flashe le QR / de la station. |
| 4,5–7 s | Accueil du jeu | Gratuit, sans appli, / sans achat. |
| 7–9,5 s | Ticket PQ-2026-4128 | 5/5 : ton ticket / pour le tirage. |
| 9,5–12 s | Retrait chez Mei, « Billet validé » | Tirée au sort, Aminata / gagne 20 € chez Mei. |
| 12–15 s | Fin réseaux | « Joue chez tes commerçants. » · bouton **Cherche le QR Flowin** · flowin-events.vercel.app · Lien en bio |

### Participants 30 s
Accroche 3 s, puis 7 scènes de 3,2 s : « Aminata flashe le QR / d'une station. » · « Le jeu s'ouvre : / gratuit, sans appli. » · « 5 questions, / une à la fois. » · « Sans faute : / son ticket est acquis. » · « Ticket PQ-2026-4128 / Tirage dimanche. » · « Elle découvre les / commerces partenaires. » · « Tirée au sort, elle / gagne 20 € chez Mei. » — fin 4,6 s : « Joue chez tes commerçants. », QR **Scanne pour essayer le jeu**.

### Organisateurs 15 s
| Temps | Scène | Légende |
|---|---|---|
| 0–2 s | Accroche (kicker « SUPER EVENT ») | **163 contacts / récoltés en / un week-end.** (avatars qui s'ajoutent) |
| 2–4,5 s | Écran « Que voulez-vous faire ? » : Hugo choisit « Demander la création d'un super event à Flowin » | Hugo demande son / super event à Flowin. |
| 4,5–7 s | La fête, trois stands | Chaque commerce / devient une station. |
| 7–9,5 s | « Mes opérations », compteur 214 parties | En direct : / 214 parties. |
| 9,5–12 s | « Mes super data », CRM | Après la fête : / 163 contacts gardés. |
| 12–15 s | Fin réseaux | « Un super event pour votre ville. » · bouton **Créez votre compte pro** · flowin-events.vercel.app · Lien en bio |

### Organisateurs 30 s
Accroche 3 s, puis : « Hugo demande son / super event à Flowin. » · « Flowin le crée : / un jeu, un tirage. » (carte « À venir », 0 partie) · « Chaque commerce / devient une station. » · « En direct : / 214 parties. » · « Dimanche, le tirage / au sort en un clic. » · « Le billet du gagnant / part par email. » · « Après la fête : / 163 contacts gardés. » — fin : « Un super event pour votre ville. », QR **Scannez : compte pro**.

### Partenaires 15 s
| Temps | Scène | Légende |
|---|---|---|
| 0–2 s | Accroche (kicker « COMMERÇANTS ») | **Fini la carte / de fidélité / papier.** (carte à tampons barrée) |
| 2–4,5 s | « Devenez commerce partenaire » | Mei rejoint le super / event en 4 étapes. |
| 4,5–7 s | Lot pour le tirage | Elle offre un bon / d'achat de 20 €. |
| 7–9,5 s | La fête, QR de la boutique | Les joueurs flashent / le QR de sa boutique. |
| 9,5–12 s | Bilan station | 51 joueurs, 96 flashs / de son QR. |
| 12–15 s | Fin réseaux | « Animez votre boutique, captez de nouveaux clients. » · bouton **Devenez partenaire** · flowin-events.vercel.app · Lien en bio |

### Partenaires 30 s
Accroche 3 s, puis : « Mei rejoint le super / event en 4 étapes. » · « Elle offre un bon / d'achat de 20 €. » · « Validée par Flowin / sous 24 à 48 h. » · « Les joueurs flashent / le QR de sa boutique. » · « Sa boutique dans / « Nos partenaires ». » · « 51 joueurs, 96 flashs / de son QR. » · « Lot retiré chez Mei : / billet validé. » — fin : accroche, QR **Scannez : devenir partenaire**.

### Cibles des QR (coupes 30 s)
| Coupe | Cible | Pourquoi |
|---|---|---|
| Participants 30 s | `https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz&preview=1` | `?preview=1` : mode aperçu (`lib/parcours.ts` `estApercu()`, garde dans `lib/track.ts`) — scanner le QR depuis la vidéo **ne crée ni joueur, ni participation, ni visite**. |
| Organisateurs 30 s, Partenaires 30 s | `https://flowin-events.vercel.app/pro/inscription` | Inchangé (voir V1). |

## Audit marketing V1 → V2

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
- **Aminata**, participante : peau foncée, cheveux en chignon. Pseudo à l'écran : **Lune_42**.
- **Hugo**, organisateur : peau claire, cheveux courts.
- **Mei**, boulangère partenaire : peau mate, queue de cheval portée en arrière.

Visages toujours dégagés, aucun signe religieux, ni genre ni orientation abordés.

## Vidéo 1 — Participants (37,1 s)

| Temps | Scène | Légende | Écran montré (source) |
|---|---|---|---|
| 0,0 – 4,1 | Le QR de la station | À la Fête du Lac, Aminata / flashe le QR d'une station. | Illustration : stand + panneau « STATION » |
| 4,1 – 8,2 | Le jeu s'ouvre | Rien à installer : le jeu / s'ouvre dans le navigateur. | Accueil Quiz : « À gagner », « Comment jouer ? » (Flashe le QR code / Réponds au quiz), « Jouer gratuitement → », « Jeu gratuit · Sans achat obligatoire », « Propulsé par Flowin » — `QuizClient.tsx`, `ParcoursHero.tsx` |
| 8,2 – 12,3 | Le quiz | Cinq questions, / une réponse à la fois. | « Question 3/5 », barre de progression, réponses A–D, bonne réponse en vert — `QuizClient.tsx` (5 questions par défaut : `quizNbQuestions ?? 5`) |
| 12,3 – 16,4 | Le score | Sans faute : son ticket / pour le tirage est acquis. | « TON SCORE 5/5 », « Sans faute ! Ton ticket est acquis. » — `QuizClient.tsx` |
| 16,4 – 20,5 | Le compte | Elle crée son compte une fois. / Ses données ne sont pas vendues. | « Crée ton compte », Prénom/Nom/Email/Téléphone (masqués), texte RGPD exact, « Valider → » — `QuizClient.tsx`, `RGPD_TEXT` |
| 20,5 – 24,6 | Le ticket | Son ticket : PQ-2026-4128. / Tirage dimanche 14 juin. | « Bravo ! Score : 5/5 », code ticket, « Découvrir nos partenaires », « Parraine un ami & gagne un ticket », « Mon compte & mes gains », « Retour à l'opération » — `QuizClient.tsx`, `ParcoursOutro.tsx` |
| 24,6 – 28,7 | Les partenaires | Elle découvre les commerces / partenaires de la fête. | « Nos partenaires », grille de commerces — `ParcoursPartenairesGrid` |
| 28,7 – 32,8 | Le lot | Tirée au sort, elle retire / son bon d'achat chez Mei. | Illustration boutique, « Billet validé » |
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
| 0,0 – 3,9 | Mei | Mei tient la Boulangerie / Les Tilleuls, à Belrive. | Illustration boutique |
| 3,9 – 7,8 | Rejoindre | Elle rejoint la Fête du Lac / en 4 étapes. | « DEVENEZ COMMERCE PARTENAIRE », nom de l'opération, « Animez votre boutique, captez de nouveaux clients et offrez-leur une chance de gagner. », « Rejoindre en 4 étapes », « Commencer » — `app/rejoindre/[se]/RejoindreClient.tsx` |
| 7,8 – 11,7 | Son offre | Son offre : un bon d'achat / de 20 € pour le tirage. | « Votre lot pour le tirage », « Jeu choisi par l'organisateur, gagnants désignés par tirage au sort. », « Lot offert », « Quantité », « Conditions d'utilisation » — `RejoindreClient.tsx` |
| 11,7 – 15,6 | Validation | Sa demande part chez Flowin, / validée sous 24 à 48 h. | « Demande envoyée ! », « Merci Mei ! La demande de … pour l'opération … est enregistrée. », « Nous validons votre commerce sous 24–48h. Votre QR à afficher en boutique et votre tableau de bord seront activés à ce moment-là. » — `RejoindreClient.tsx` |
| 15,6 – 19,5 | La fête | Pendant la fête, les joueurs / flashent le QR de sa station. | Illustration (même scène que la vidéo participants) |
| 19,5 – 23,4 | Nos partenaires | Sa boutique apparaît dans / « Nos partenaires ». | Même écran que la vidéo participants — `ParcoursPartenairesGrid` |
| 23,4 – 27,3 | Ses chiffres | Elle mesure sa station : / 96 flashs QR, 58 parties. | « MA PARTICIPATION · BILAN », « Mes stations » : Joueurs / Parties / Flashs QR, « Gagnants & tirage », « Tirage global mutualisé. », « Ouvrir le tirage → » — `app/pro/super/page.tsx` |
| 27,3 – 31,2 | Le retrait | Aminata, tirée au sort, retire / son lot : billet validé en caisse. | « À retirer », « Voir le billet ↗ », « Validation en caisse », code PIN, « Valider le billet », « Billet validé. Le lot est décompté du stock. » — `GagnantsClient.tsx` (RPC `verifier_pin_pro` puis `valider_lot`) |
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
4. « Merci Mei ! La demande de la … » : texte ramené au libellé exact (« La demande de … »).
5. Légende « Six commerces deviennent des stations » alors que trois stands étaient visibles : reformulée (« Les commerçants de Belrive deviennent des stations de jeu »).
6. Légende « Validée par Flowin, elle reçoit son QR » sur l'écran « Demande envoyée » (validation pas encore faite) : reformulée (« Sa demande part chez Flowin, validée sous 24 à 48 h »).
7. Carte « Mes opérations » : « en cours » et la puce « Bons » sortaient de la carte ; compteurs resserrés, puces sur deux lignes.
8. Enseignes des petits stands illisibles : police agrandie.
9. Écrans de téléphone trop petits pour un mobile : téléphone agrandi et contenu zoomé ×1,12.
10. Queue de cheval de Mei qui longeait la joue : placée en arrière et en haut, visage entièrement dégagé.
11. Mention « Coordonnées masquées dans cette vidéo » ajoutée dans un écran : retirée (elle n'existe pas dans l'app).
12. Accroche, texte du héros « Devenez commerce partenaire » collé à la carte blanche : espacement corrigé.
