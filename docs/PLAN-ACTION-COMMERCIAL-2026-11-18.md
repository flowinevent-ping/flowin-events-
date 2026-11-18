# Plan d'action commercial par profil (18/11/2026)

Sources : `docs/ARGUMENTAIRE-flowin-event.md` (formulations reprises sans paraphrase),
`docs/DECISIONS-flowin-event.md` (prix), `docs/SYNTHESE-arguments-2026-11-10.md`,
`docs/ETUDE-cout-emails-L14-2026-11-17.md`, `docs/PRIX-animation-99-analyse-2026-11-10.md`,
`admin/lib/outilsCommerciaux.ts` (catalogue des outils du super admin).

Règles : aucun chiffre inventé. Seuls chiffres utilisés : **56 % des participants souhaitent garder
le contact**, **plus de 70 lots distribués dans les commerces locaux**, **2 804 passages** (Nuits du
Sud 2026), et les prix tranchés. Tout le reste est **[à compléter]** par Romain.

Promesse (toujours) : **« Faites jouer, faites grandir votre fichier, faites-les revenir. »**
Signature : **« Flowin, l'animation plug and play. »**

---

## 1. Résumé sur une page

| Profil | Offre | Prix | Promesse clé (argumentaire) | Canal prioritaire | Porte d'entrée | KPI principal |
|---|---|---|---|---|---|---|
| 1. Commerce de proximité | Flowin Animation | 1re année 445 € HT, puis 990 € HT/an ou 110 € HT/mois ; quiz rédigé par Flowin 145 € (72,50 € la 1re année) ; 2 QR inclus, puis 10 € HT par QR (provisoire) | « Animez votre clientèle. Gagnez de nouveaux clients. Faites-les revenir. » | Terrain + plaquette Animation V3 | QR plaquette → `/pro/premiere-fois` → configurateur → bon de commande / virement | Bons de commande validés |
| 2. Organisateur d'événement | Flowin Super Event | Packs **à fixer** | « Démultipliez votre communication avec l'impact du réseau local. Boostez la visibilité. En proximité. » | Rendez-vous mairies / offices de tourisme / festivals, preuve Nuits du Sud | Plaquette Super Event V3 → rendez-vous → devis | Super Events signés |
| 3. Commerce partenaire d'un Super Event | Station jeu ou simple sponsor | **À fixer** (prix des packs non tranché) | « Connecte ton commerce aux événements locaux. Donne de la visibilité auprès des festivaliers et spectateurs. » | Terrain autour de l'événement + téléphone (pitch) | `/rejoindre` | Stations jeu inscrites par événement |
| 4. Participant (levier seulement) | Gratuit | — | « Gagne tes places, joue chez les commerces partenaires. » | QR en commerce, carte, parrainage, réseaux sociaux | QR → jeu → coordonnées → parrainage | Flashs par QR, part « garder le contact » |

---

## 2. Profil 1 — Commerce de proximité (Flowin Animation)

### Sous-segments à attaquer d'abord (ordre proposé, à valider par Romain)
1. **Restaurants / cafés** : clients fidèles, jamais remis en contact ; pas de fichier client.
2. **Coiffure / beauté** : récurrence naturelle, lots de service faciles (soin, remise).
3. **Contrôle technique / garages** : déjà des dépenses de pub mesurables (exemple de Romain : pub
   ticket de caisse) ; l'argument « un QR par support » parle directement.
4. **Salles de sport** : campagnes de rentrée, parrainage, temps forts.
5. **Commerces de centre-ville** : réseau Flowin, carte, commerce référent ; à travailler par rue ou
   par union commerciale.

### Cible et douleur
- Pas de fichier client, ou un fichier qu'on n'anime pas.
- Pas de mesure de ce que rapporte chaque support de pub.
- Pas de temps pour animer.
- « Aller chercher un nouveau client coûte 3 à 5 fois plus cher que de dynamiser sa clientèle. »

### Promesse
- **« Faites jouer, faites grandir votre fichier, faites-les revenir. »**
- « Animez votre clientèle. Gagnez de nouveaux clients. Faites-les revenir. Augmentez votre visibilité. »
- « Mieux qu'une carte de fidélité : une animation vivante qui vous permet de garder le contact, animé,
  avec vos clients, vos services, vos produits, votre marque. »
- « Publiez en quelques clics votre animation 100 % automatisée. » Aussi simple que coller une affiche,
  tout est géré ensuite.
- « Mesurez chaque action commerciale, chaque campagne. »

### Offre et prix (décisions uniquement)
- **Tester Flowin : 445 € HT la 1re année** (présenté en premier).
- Ensuite : **990 € HT / an** ou **110 € HT / mois** (ne pas montrer l'année suivante au moment de la commande).
- Option : **le premier quiz rédigé par Flowin : 145 €**, **72,50 € la 1re année**.
- **2 QR inclus**, puis **10 € HT par QR de tracking supplémentaire** (provisoire, à confirmer).
- Piste « 99 € HT / an » : **non décidée** (`docs/PRIX-animation-99-analyse-2026-11-10.md`), ne pas l'annoncer.

### Canaux
- **Prospection terrain** : passage en boutique avec la plaquette Animation V3 (QR suivi).
- **Téléphone** : pitch existant (ci-dessous), puis envoi de la plaquette.
- **Réseaux sociaux** : vidéo v6 Animation en 30 s et 15 s.
- **WhatsApp** : partage de la plaquette depuis le super admin (catalogue Outils commerciaux, lien suivi `?src=`).
- **Partenariats** : CCI, unions commerciales, mairies (réunions de commerçants) [contacts à compléter].
- **Preuve** : Nuits du Sud 2026.

### Outils déjà prêts (catalogue super admin `admin/lib/outilsCommerciaux.ts`)
| Outil | Id catalogue | Chemin |
|---|---|---|
| Plaquette Flowin Animation V3 | `plaquette-animation-v3` | `/validation/plaquette-animation-v3.html` |
| Vidéo v6 Animation (16:9, 30 s, 15 s) | `video-v6-l3-animation` | `/videos/v6/l3-animation-16x9.mp4`, `-30s.mp4`, `-15s.mp4` |
| Film v4 Animation · commerce | `film-v4-f1-commerce` | canal `video-commerce` |
| Animation v22 Plug & Play | `anim-commerce-plug-play` | canal `video-commerce` |
| Inscription « Ma première fois » | `premiere-fois` | `/pro/premiere-fois` |
| Visite guidée | `visite-guidee` | `/visite-guidee/index.html` |
| Bon de commande Animation | `bon-commande-animation` | `/bon-commande-animation.html` |
| CGV Animation | `cgv-animation` | `/cgv-animation-magasin.html` |
| Carte de visite Romain | `carte` | `/carte.html` |
| Landing Flowin | `landing-flowin` | `/landing` |
| Page de validation / maquette cliquable | `validation-hub`, `maquette-cliquable` | `/validation/index.html#maquette` |

### Script d'approche (30 s)
« Bonjour, Romain Collin, Flowin. Tu installes Flowin, tu fais jouer tes clients. Ils connaissent
mieux ton magasin, ton métier : renforcement de marque. Ils font participer leurs amis : tu agrandis
ton réseau. Ils gagnent des lots, des remises, ce que tu veux. Ils reviennent : tu augmentes ta
visibilité et ta fréquentation. C'est plug and play : aussi simple que coller une affiche. Je te
laisse la plaquette, le QR te montre tout. »

### 3 objections
| Objection | Réponse |
|---|---|
| « J'ai déjà une carte de fidélité. » | « Mieux qu'une carte de fidélité : une animation vivante qui vous permet de garder le contact, animé, avec vos clients, vos services, vos produits, votre marque. » |
| « Je n'ai pas le temps. » | « Publiez en quelques clics votre animation 100 % automatisée. » Aucune charge en plus : tout est géré ensuite. |
| « C'est cher. » / « Ça rapporte quoi ? » | 445 € HT la 1re année. « Aller chercher un nouveau client coûte 3 à 5 fois plus cher que de dynamiser sa clientèle. » Et vous mesurez chaque campagne : un QR par support. |

### Parcours de conversion
Plaquette V3 (QR suivi) → `/pro/premiere-fois` → configurateur (configurer le jeu) → « Valider mon bon
de commande » → virement (QR SEPA, IBAN copié en un clic) → mise en ligne.

### KPIs (suivi de l'application)
- Scans par source : `src=` des plaquettes et des vidéos (`video-commerce`, `video-tuto-animation`).
- Entrées CRM landing (`/landing`) et `crm_retours`.
- Inscriptions `/pro/premiere-fois`, configurations terminées, bons de commande validés, virements reçus.
- Objectifs chiffrés : [à compléter par Romain].

### Calendrier 30 / 60 / 90 jours
| Période | Actions hebdomadaires | Volume cible |
|---|---|---|
| J1–J30 | Restaurants / cafés et coiffure / beauté à Vence : passages terrain, appels, partage WhatsApp, post vidéo 30 s | [à compléter] visites/sem., [à compléter] appels/sem., [à compléter] bons de commande |
| J31–J60 | Ajouter contrôle technique / garages et salles de sport ; 1 réunion CCI ou union commerciale | [à compléter] |
| J61–J90 | Centre-ville rue par rue (argument réseau et carte Flowin) ; relance des inscrits non convertis | [à compléter] |

---

## 3. Profil 2 — Organisateur d'événement (Flowin Super Event)

### Cibles
Festivals, mairies / offices de tourisme, associations, comités des fêtes (Alpes-Maritimes d'abord).

### Cible et douleur
- Communication qui ne touche pas assez le local ; partenaires peu activés.
- Pas de chiffres utiles après l'événement pour les partenaires et institutions.
- Pas de contact gardé avec le public.

### Promesse
- **« Faites jouer, faites grandir votre fichier, faites-les revenir. »**
- « Démultipliez votre communication avec l'impact du réseau local. Boostez la visibilité. En proximité. »
- « Flowin Super Event, c'est la super diffusion locale. »
- Avant : **« Augmentez la visibilité avant l'événement »**. Pendant : favorisez le réseau local.
  Après : détenez des chiffres utiles pour communiquer après votre événement.
- Dire « votre événement », pas « votre festival ».

### Offre et prix
- Packs Super Event : **à fixer** (prix non tranchés par Romain). Ne rien annoncer ; proposer un rendez-vous et un devis.

### Canaux
- **Rendez-vous** mairies, offices de tourisme, festivals, comités des fêtes [contacts à compléter].
- **Téléphone** : pitch NDS (`/pitch-nds.html`) adapté à « votre événement ».
- **Réseaux sociaux** : vidéo v6 Super Event en 30 s et 15 s.
- **WhatsApp** : plaquette Super Event V3 depuis le super admin.
- **Preuve** : « Dernier événement local, Alpes-Maritimes : Nuits du Sud 2026 » — 2 804 passages,
  plus de 70 lots distribués dans les commerces locaux, 56 % des participants souhaitent garder le contact.

### Outils déjà prêts
| Outil | Id catalogue | Chemin |
|---|---|---|
| Plaquette Flowin Super Event V3 | `plaquette-super-event-v3` | `/validation/plaquette-super-event-v3.html` |
| Vidéo v6 Super Event (16:9, 30 s, 15 s) | `video-v6-l4-super-event` | `/videos/v6/l4-super-event-16x9.mp4`, `-30s.mp4`, `-15s.mp4` |
| Film v4 Super Event · organisateur | `film-v4-f3-organisateur` | canal `video-organisateur` |
| Le Super Event Flowin | `super-event-pro` | `/nds-super-event-pro.html` |
| NDS Pro (présentation) | `nds-pro` | `/nds-pro.html` |
| Visite guidée | `visite-guidee` | `/visite-guidee/index.html` |
| Landing NDS (preuve) | `landing-nds` | `/nds` |

### Script d'approche (30 s)
« Bonjour, Romain Collin, Flowin. Connecte ton événement avec l'ensemble du réseau local. Diffuse,
sois visible, sois présent, en proximité. Avant, on augmente la visibilité avec des lots : places,
invitations, goodies. Pendant, ton événement devient station jeu et les commerces partenaires aussi.
Après, tu as des chiffres utiles pour tes partenaires et tes institutions. Dernier événement local :
Nuits du Sud 2026, 2 804 passages. On se voit 20 minutes ? »

### 3 objections
| Objection | Réponse |
|---|---|
| « On a déjà notre communication. » | « Votre plan de campagne habituel, plus le réseau Flowin. » Votre communication démultipliée par les commerces. |
| « Quel résultat concret ? » | Nuits du Sud 2026 : 2 804 passages, plus de 70 lots distribués dans les commerces locaux, 56 % des participants souhaitent garder le contact. |
| « Combien ça coûte ? » | Devis selon l'événement (packs à fixer) : [à compléter]. |

### Parcours de conversion
Plaquette Super Event V3 → rendez-vous → devis / bon de commande Super Event [format à compléter] →
ouverture des inscriptions commerces via `/rejoindre`.

### KPIs
- Scans `src=video-organisateur`, `src=video-super-event`, plaquette V3 ; `crm_retours`.
- Rendez-vous obtenus, devis envoyés, Super Events signés : [à compléter].

### Calendrier 30 / 60 / 90 jours
| Période | Actions | Volume cible |
|---|---|---|
| J1–J30 | Liste des événements 2027 du département ; appels mairies / offices de tourisme ; envoi plaquette | [à compléter] |
| J31–J60 | Rendez-vous, présentation preuve Nuits du Sud, devis (dès que les packs sont fixés) | [à compléter] |
| J61–J90 | Signature des premiers Super Events ; recrutement des commerces (profil 3) | [à compléter] |

---

## 4. Profil 3 — Commerce partenaire d'un Super Event (station jeu / sponsor)

### Cible et douleur
Commerces de proximité autour d'un événement, absents de la visibilité des festivals (souvent trop chère pour eux).

### Promesse
- **« Faites jouer, faites grandir votre fichier, faites-les revenir. »**
- « Connecte ton commerce aux événements locaux. Donne de la visibilité auprès des festivaliers et spectateurs. »
- Visible sur les supports physiques de l'événement et sur la carte Flowin comme station jeu et partenaire.
- Les partenaires **diffusent** l'événement (jamais « financent »).

### Offre et prix
- Station jeu ou simple sponsor : prix **à fixer**.
- Une animation du commerce et sa station d'un Super Event peuvent tourner **en parallèle** :
  passerelle naturelle vers l'offre Animation (profil 1, 445 € HT la 1re année).

### Canaux
- Terrain dans le périmètre de l'événement ; téléphone avec le pitch NDS ; WhatsApp (plaquette
  Super Event V3, film commerce Super Event) ; union commerciale locale.

### Outils déjà prêts
| Outil | Id catalogue | Chemin |
|---|---|---|
| Film v4 Super Event · commerce | `film-v4-f4-commerce-super-event` | canal `video-partenaire-se` |
| Pitch NDS (téléphone) | `pitch-nds` | `/pitch-nds.html` |
| Flowin partenaire | `flowin-partenaire` | `/flowin-partenaire-presentation.html` |
| Kit digital partenaires | `kit-digital` | `/nds/kit-digital/index.html` |
| Pro NDS live (preuve) | `pro-nds-live` | `/pro-nds-live.html?ev=` |
| Inscription partenaire | — | `/rejoindre` |

### Script d'approche (30 s)
« Bonjour, Romain Collin, Flowin. [Nom de l'événement] arrive près de chez vous. Connecte ton
commerce aux événements locaux. Tu deviens station jeu : on joue chez toi, les gagnants reviennent
chez toi, tu es sur la carte Flowin et sur les supports de l'événement. Ton fichier client grandit.
Aux Nuits du Sud 2026 : plus de 70 lots distribués dans les commerces locaux. »

### 3 objections
| Objection | Réponse |
|---|---|
| « Je n'ai rien à voir avec le festival. » | Justement : rendre visibles et visitables les commerces de proximité. La carte est un jeu de piste qui amène trafic et clients. |
| « Ça va me prendre du temps. » | Plug and play : aussi simple que coller une affiche, tout est géré ensuite. |
| « Je ne veux pas tenir une station. » | Vous pouvez être simple sponsor. |

### Parcours de conversion
QR / lien suivi → `/rejoindre` → choix station jeu ou sponsor → lot proposé → validation. Après
l'événement : proposition Animation (profil 1).

### KPIs
- Inscriptions `/rejoindre` par événement ; flashs par station (`pro-nds-live`) ; `src=video-partenaire-se`.
- Taux de passage station → Animation : [à compléter].

### Calendrier 30 / 60 / 90 jours
Suit le calendrier du profil 2 : recrutement dès qu'un Super Event est signé. Volumes : [à compléter].
En attendant : rappel des partenaires Nuits du Sud 2026 pour leur proposer Flowin Animation.

---

## 5. Profil 4 — Participant (levier pour 1 à 3 uniquement)

- **But** : faire venir du flux chez les commerces et l'organisateur, pas un objectif en soi.
- **Leviers** : QR en commerce (un QR par support), carte Flowin, parrainage en fin de parcours et
  dans le profil, effet cadeau (offrir son lot), réseaux sociaux.
- **Outils** : vidéo v6 participant Super Event (`video-v6-l5se-participant`, `/videos/v6/l5se-participant-30s.mp4`, `-15s.mp4`),
  films v4 participant (`film-v4-f2-participant-animation`, `film-v4-f5-participant-super-event`),
  animation v22 participant (`anim-participant-commerces`), carte commerces.
- **KPIs** : flashs par QR et par source `src=video-participant*`, part « garder le contact »
  (référence Nuits du Sud : 56 %), parrainages, tickets gagnants utilisés.
- **Usage commercial** : chaque chiffre participant devient une preuve pour les profils 1 à 3.

---

## 6. Ce qui manque pour vendre

| Manque | Impact | Qui |
|---|---|---|
| **Domaine d'envoi Resend vérifié** (`flowin.events`, SPF/DKIM/DMARC) — `docs/ETUDE-cout-emails-L14-2026-11-17.md` | Sans lui, les commerces et joueurs ne reçoivent aucun email (bons de commande, tickets, rappels) | Romain (DNS) |
| **Prix des packs Super Event** | Impossible de chiffrer un devis organisateur ou partenaire | Romain |
| **Confirmation du prix QR supplémentaire** (10 € HT, provisoire) | Bon de commande à figer | Romain |
| **Charte graphique** (bleu / orange, prédominance à définir) | Cohérence plaquettes, vidéos, réseaux sociaux | Romain |
| **Annonces d'activation** (textes de posts réseaux sociaux, message WhatsApp type) | Diffusion des vidéos v6 | [à compléter] |
| **Validation des vidéos v6** (statut brouillon dans le catalogue) | Diffusion publique | Romain |
| **Liste de prospects** (commerces, événements, contacts CCI / mairies / unions) | Calendrier inexécutable sans elle | [à compléter] |
| **Format du devis / bon de commande Super Event** | Conversion organisateur | [à compléter] |
| **Objectifs chiffrés** (visites, appels, signatures) | Pilotage | Romain |

---

## 7. Premières 10 actions cette semaine

1. Vérifier le domaine `flowin.events` dans Resend (DNS SPF/DKIM/DMARC) et basculer l'expéditeur.
2. Valider les vidéos v6 (Animation, Super Event, participant) dans le catalogue du super admin.
3. Fixer (ou décider de la date pour fixer) les prix des packs Super Event.
4. Dresser la liste des 20 premiers commerces de Vence : restaurants / cafés et coiffure / beauté [noms à compléter].
5. Faire [à compléter] visites terrain avec la plaquette Animation V3 (QR suivi).
6. Rappeler les commerces partenaires de Nuits du Sud 2026 pour leur proposer Flowin Animation (445 € HT la 1re année).
7. Publier la vidéo v6 Animation 30 s sur les réseaux sociaux, lien suivi `src=`.
8. Partager la plaquette par WhatsApp depuis le super admin à [à compléter] contacts.
9. Demander un rendez-vous à la CCI, à l'union commerciale et à la mairie / office de tourisme de Vence [contacts à compléter].
10. Lister les événements 2027 du département et appeler les 5 premiers organisateurs avec la preuve Nuits du Sud 2026.

Bilan de fin de semaine : scans par source, inscriptions `/pro/premiere-fois`, `crm_retours`,
bons de commande validés (objectifs : [à compléter]).
