# Animations explicatives Flowin — scénarios et audit

Trois vidéos verticales (1080 × 1920, 30 i/s, sans son nécessaire), une par public. Elles racontent **la même histoire** vue de trois côtés.

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
