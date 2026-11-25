# Parcours vidéo → inscription → paiement → animation en ligne (état des lieux, 25/11/2026)

Rien n'est recréé. Tout ce qui est cité existe dans le dépôt. Les trous sont marqués **[à décider]**.
Textes : uniquement l'argumentaire (`docs/ARGUMENTAIRE-flowin-event.md`), sans paraphrase.

## 1. Ce qui existe en vidéo

| Famille | Fichiers | Cible | Son | Durée | Statut |
|---|---|---|---|---|---|
| Films à personnages (Alex, Léa, Max), v4 | `videos/v4/f1…f5` (+ versions 15 s) | f1 commerce, f2 participant Animation, f3 organisateur, f4 commerce Super Event, f5 participant Super Event | aucun (muet) | 30 à 53 s | anciens |
| Animations HTML + mp4 | `animations/anim-*.mp4` (+ `-courte`) | commerce, sponsors, organisateur, participants | aucun | 23 à 73 s | anciens |
| Films de présentation | `videos/flowin-*.mp4` (5 fichiers) | Animation, Super Event, pro, participant, parcours commerçant | aucun | 27 à 40 s | anciens |
| v6 | `videos/v6/l3…, l4…, l5se…` (15 s, 30 s, 16:9, 9:16) | L3 commerce, L4 organisateur, L5 participant Super Event | voix | 15 à 30 s | remplacée |
| v7 | `videos/v7/l3-animation-30s/45s` | L3 commerce | voix | 30 et 45 s | remplacée (« trop rapide, robotique ») |
| **v8 (la plus récente)** | `videos/v8/l3-animation-long/court`, `l4-super-event-long/court` (16:9 et 9:16) | L3 commerce (60 s / 42 s), L4 organisateur (53 s / 38 s) | voix Vivienne -5 %, -16 LUFS, pas de musique | 38 à 60 s | livrée, **écoute de Romain à confirmer** |
| Storyboards v16 | `storyboards-video/v16-*` | commerçants, organisateurs, partenaires, joueur | à valider | 22 à 47 s | scénarios seulement |

Constats :
- Il n'y a **aucune vidéo pour le participant** avec voix et QR dans la v8 (L5 existe seulement en v6).
- Il n'y a **pas de vidéo « pro » distincte de « participant »** dans la v8 : L3 = commerçant, L4 = organisateur.
- Les vidéos à personnages (v4) sont muettes. Les vidéos avec voix (v6 à v8) ont des écrans réels de l'application, pas de personnages. **Je ne sais donc pas laquelle est « le bonhomme avec le son derrière ».** Romain doit me dire laquelle (voir §5).

## 2. Pourquoi le texte « ne marche pas » (constat sur le script L3 v8)

Le texte v8 décrit des gestes, dans l'ordre de l'écran : « tu colles ton QR code », « tu l'invites à jouer », « tu scannes son billet », « tout est enregistré ». Les bénéfices (animer, faire revenir, fichier qui grandit) arrivent aux blocs 8 à 10 sur 12. Le seul appel à l'action est la signature + QR en fin de vidéo.

Ce que Romain demande : expliquer à quoi ça sert, encourager, mettre en avant les bénéfices, puis convertir (lien ou QR).
L'argumentaire contient déjà les phrases pour cela, sans rien inventer :

| Temps | Contenu | Phrases de l'argumentaire à reprendre telles quelles |
|---|---|---|
| 1. À quoi ça sert | Le problème et la promesse | « Animez votre clientèle. » · « Gagnez de nouveaux clients. » · « Faites-les revenir. » · « Augmentez votre visibilité. » |
| 2. Comment (court) | Plug and play | « Publiez en quelques clics votre animation 100 % automatisée. » · « Aussi simple que coller une affiche. » |
| 3. Bénéfices | Ce que le commerçant gagne | « Des lots qui font revenir. » · « Gardez le lien, gardez le contact. » · « Mesurez chaque action commerciale, chaque campagne. » · « Mieux qu'une carte de fidélité : une animation vivante… » |
| 4. Conversion | Un seul geste | Lien ou QR. QR actuel : `/pro/premiere-fois?src=video-tuto-animation`. Signature : « Flowin, l'animation plug and play. » |

Pour le Super Event, même ordre avec : « Connecte ton événement avec l'ensemble du réseau local. Diffuse, sois visible, sois présent, en proximité. » et « Démultipliez votre communication avec la force du réseau local. Boostez la visibilité. En proximité. »
Chiffres autorisés : « 56 % des participants souhaitent garder le contact », « Plus de 70 lots distribués dans les commerces locaux » (cités en justificatif seulement).
**[à décider]** Le « 70 » de la vidéo organisateur est déjà noté peu lisible (`kit/A-FAIRE.md`).

## 3. Parcours d'accès à la souscription : ce qui existe, écran par écran

| # | Étape | Écran existant | Fichier | Preuve / statut |
|---|---|---|---|---|
| 1 | Vidéo, fin : QR ou lien | QR décodé (jsQR) sur les 4 fichiers v8, `?src=video-tuto-animation` | `videos/v8/*` | vérifié 19/11 |
| 2 | Inscription | 3 écrans : Vous et votre commerce (SIRET remplit nom et adresse), Votre activité, Votre compte. Puis « Compte créé » | `components/pro/PremiereFois.tsx`, `app/pro/premiere-fois` | codé et fusionné 24/11 ; **aucune inscription réelle testée** |
| 3 | Configurateur (carrousel, 0 px de défilement) | Vos coordonnées (sauté si complet) → Choisissez votre jeu → Vos questions → Vos lots → Où diffusez-vous (un QR par support) → Votre kit → Récapitulatif | `components/creation/Configurateur.tsx` | audit 10/11 : 12 écrans, 0 px |
| 4 | Conversion | « Flowin vous remercie » : prix, total, bouton « Valider mon bon de commande » | idem | codé |
| 5 | Paiement | Facture par e-mail ; QR de virement + IBAN copiable **seulement si** `PAIEMENT_ACTIF=true` (aujourd'hui `false`) | `lib/reglement.ts`, `QrVirement.tsx` | **non vérifié de bout en bout** |
| 6 | Mise en ligne | « Votre jeu est en ligne » : les clients peuvent jouer ; le jeu est visible avant paiement, paiement à la publication | `components/creation/EnLigne.tsx` | règle Romain 08/11, 10/11 |
| 7 | Espace pro | Accueil commerce en carrousel, scanner, statistiques | `components/pro/*` | scanner caméra non vérifié sur appareils réels |

Le fil existe : vidéo → QR → inscription → configurateur → bon de commande → facture/virement → jeu en ligne.
Ruptures à regarder :
- L'étape 2 n'a **pas été testée en conditions réelles** depuis le lot 3 (24/11).
- L'étape 5 est **hors service par choix** (`PAIEMENT_ACTIF=false`) : « animation quasi immédiate » = vrai pour la mise en ligne, mais le paiement reste un virement, facture par e-mail.
- Le message « Flowin, votre animation en quelques clics » n'est écrit **nulle part dans le parcours** comme fil conducteur. La phrase de l'argumentaire est « Publiez en quelques clics votre animation 100 % automatisée. » **[à décider : où l'afficher (entête du configurateur ? écran Compte créé ?)]**.
- Validation de Flowin manuelle à l'inscription (réserve du 20/11) : à confirmer si elle freine l'« immédiat ».

## 4. Le kit d'impression : ce qui est écrit, ce qui ne l'est pas

Ce qui existe (configurateur, écran « Votre kit ») :
- **Kit digital (inclus)** : « Affiches et QR à imprimer vous-même. » C'est le cas par défaut. Les affiches avec QR sont générées par l'application (affiche A4 vérifiée en prod le 20/11). Maquette de l'écran affiche : `docs/maquette/lot5/lot5-F-affiche.html`.
- **Kit imprimé en option** : « Support de caisse, 3 affiches, 3 macarons », 149 € HT par boutique (`PRIX_KIT_PHYSIQUE`). Le choix crée une demande d'impression envoyée à Flowin (`enregistrerDemandeKit`), même sans paiement.

Ce qui n'existe pas :
- **Aucun délai de livraison de 72 h pour le kit** n'est écrit, ni dans le code, ni dans les décisions. Les « 72 h » trouvés concernent : le **quiz rédigé par Flowin** (« retour sous 72 h », Configurateur, EnLigne, page pro) et la **facture sous 72 h** (pitch NDS). Je n'ai donc pas la preuve que « kit livré en 72 h » ait été décidé.
- **Aucune suite à la demande d'impression** : pas de suivi, pas d'e-mail de confirmation du kit, pas de fournisseur ni de coût d'impression documentés. Tant que `PAIEMENT_ACTIF=false`, la demande part mais rien ne l'exécute.

**[à décider par Romain]** (une seule réponse suffit) :
1. Le kit est-il **imprimé et expédié par Flowin sous 72 h** (option payante, à confirmer avec un imprimeur) ou **à imprimer par le commerçant** (inclus) ? Ou les deux comme aujourd'hui, avec la promesse « 72 h » ajoutée à l'option imprimée ?
2. Si 72 h : à compter de quel moment (validation du bon, réception du virement) ?

## 5. Questions à Romain pour valider

1. Quelle vidéo est « le bonhomme avec le son derrière » : les films v4 (personnages, muets) ou les v6/v7/v8 (voix, écrans réels) ? Je ne peux pas deviner.
2. Valides-tu la structure de texte du §2 (4 temps, phrases de l'argumentaire) avant que je prépare un script ? Pas de voix off sans ton accord.
3. Kit : réponse au §4.
4. Veux-tu une vidéo participant (QR vers le jeu) dans la v8 ? Aujourd'hui seule la v6 L5 existe.
5. Où apparaît « votre animation en quelques clics » dans le parcours (§3) ?

Non vérifié : aucun des écrans du §3 n'a été rejoué aujourd'hui ; les statuts viennent de `ETAT.md`, des audits et du code lu.
