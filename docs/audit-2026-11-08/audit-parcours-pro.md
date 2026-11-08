# Audit v5 — Parcours pro « première fois → premier QR imprimé » (08/11/2026)

Auditeur UX/UI + growth. Lecture seule du code ; navigation Playwright (chromium, 390×844 prioritaire + 1440×900) sur `localhost:3000`, pro `pro-nook` via `?pro=` (faille IDOR connue). Captures : `/tmp/flowin-audit-v5/parcours/*.png` (`-m` mobile, `-d` ordinateur ; `cr-*` = création, `op-*` = fiche opération, `rj*` = /rejoindre).
S'appuie sans les refaire sur v1/souscription-pro (PremiereFois 9 écrans / 22 actions, P0 écran FIN 13 champs), v2/ergonomie (QR introuvable 4/10), v2/fluidite (coque remontée à chaque navigation), v3 (textes contradictoires), v4 (pas de segment digital/physique, 3 grilles de prix).

**INCIDENT À SIGNALER (écriture involontaire en base)** : la simple visite GET de `/pro/banques/nouvelle?pro=pro-nook` **crée une banque** (`app/pro/banques/nouvelle/page.tsx:14`, `creerBanque()` côté serveur au rendu, puis redirect). Mon passage a créé au moins `bq-nook-dhxy3p` (mobile) et une seconde (passage ordinateur, id non relevé) au nom « Nouvelle banque quiz » pour pro-nook. Non supprimées (lecture seule) : à nettoyer par Romain. C'est aussi un défaut produit : tout préchargement de lien, robot ou double clic crée des banques vides.

Légende : **[V]** vérifié (capture/mesure/fichier) · **[S]** supposé / non vérifié.

## Mesures clés (mobile 390×844)

| Écran | Hauteur px | Mots | Interactifs | Champs | Chargement |
|---|---|---|---|---|---|
| `/pro/premiere-fois` (accueil) | 898 | 130 | 3 | 0 | 2,6 s |
| `/pro` tableau de bord | 844 | 122 | 24 (13 < 44 px) | 0 | 6,0 s |
| `/pro/nouvelle` (choix 3 cartes) | 1142 | 136 | 15 | 0 | 9,2 s |
| Création › étape Jeu, Quiz cliqué | 2930 | 271 | 40 | 3 | — |
| `/pro/banques` (catalogue) | 5211 | 894 | 62 (50 < 44 px) | 0 | 4,0 s |
| Banque (éditeur) | — | 96 | 38 (28 < 44 px) | 13 | 6,1 s |
| Fiche op. › Lots | 1499 | 279 | 34 | 3 | — |
| Fiche op. › Gagnants | 3055 | 570 | 68 | 0 | — |
| Fiche op. › Diffusion (replié) | 1205 | 180 | 34 | 0 | — |
| Fiche op. › Trafic | 7659 | 835 | 22 | 0 | — |
| `/rejoindre` étape 1 | 2183 | 396 | 26 | 7 | 5,1 s |

---

## 1. Première fois : saisie puis arrivée sur le tableau de bord

**Bon**
- [V] `/pro/premiere-fois` : promesse claire (« Votre commerce, animé en quelques minutes. »), 3 interactifs, 1 CTA « C'est parti » (`pf-m.png`). Un champ-groupe par écran, SIRET pré-rempli (v1).
- [V] Tableau de bord visuellement propre, cohérent `CHARTE_PRO`, barre basse 5 entrées (`accueil-m.png`).

**Pas bon**
- [V] Le premier bloc du tableau de bord est **« PARTICIPANTS CE MOIS-CI : 0 »** : pour un nouveau pro, le premier chiffre vu est un zéro, pas une action. Le CTA « + Nouvelle animation » arrive en 2e position, à côté d'« Aperçu mobile » de même poids visuel.
- [V] Aucun état « premier pas » : pas de checklist (1. créer l'animation, 2. ajouter un lot, 3. imprimer le QR), pas d'exemple de jeu.
- [V] Titre de vignette tronqué « Nuits du … » à 390 px ; 13/24 cibles < 44 px.
- [V] 6,0 s jusqu'à `networkidle` en dev ; coque remontée à chaque navigation (v2/fluidite P0-5).
- [V] Accès bloqué tant que paiement non validé (`components/pro/ProShell.tsx:227` → `AccesBloque`) : le pro ne voit pas la valeur avant de payer (v2 P1). C'est le principal décrochage d'adhésion.
- [V] Le choix « kit digital / kit physique » n'existe dans `PremiereFois.tsx:71-72` **que s'il arrive par URL** (`?kit=`) ; il n'est pas choisi dans le parcours.

**Notes** : ergonomie 6 · simplicité 6 · fluidité 5 · adhésion 4. Le « c'est vraiment simple » est tenu jusqu'au compte, puis perdu à l'arrivée (zéro + mur de paiement).

## 2. Créer une animation (jeu, formule, QR/tracking)

**Bon**
- [V] Choix initial lisible : 3 cartes (Créer / Rejoindre / Proposer un super event), 15 interactifs (`nouvelle-m.png`).
- [V] Étape Jeu : 5 jeux en cartes avec une ligne d'explication chacun ; aperçu en direct du vrai jeu (`cr-jeu.png`).
- [V] QR complets une fois trouvés : lien, PNG, SVG, Affiche A4, + « QR tracés » par support (Entrée/vitrine, Caisse, Facebook, Instagram, TikTok…, physique/digital), stats par QR dans « Trafic par support » (49 flashs, 17 physiques / 32 digitaux) (`op-diffusion-ouvert.png`, `components/operations/DiffusionOperation.tsx`, `QrTraces.tsx`). Partage email / WhatsApp / SMS prêt.

**Pas bon**
- [V] Étape 1 : la validation affiche « Donnez un nom à l'animation. » et bloque ; rien de pré-rempli (nom = nom du commerce + mois possible).
- [V] Cliquer « Quiz » fait passer l'écran de 1876 à **2930 px**, 40 interactifs : banques, « 3 questions suggérées », bonus, **« Présentation : master »** avec logo/image/horaires/site web — tout sur l'étape Jeu (déjà v1 P0-2, toujours présent). Jargon « marque blanche », « master », « banque ».
- [V] Suivant bloqué : « Choisissez une banque de questions, ou demandez-la à Flowin. » → le pro sans questions est arrêté à l'étape 2 sur 4.
- [V] **Formule digital vs kit physique + digital : absente du parcours de création.** La seule trace est le type de QR physique/digital (`QrTraces.tsx:93`) et le `kit` des commandes (`lib/animationMagasin.ts:40`, `HistoriqueCommandes.tsx:41`). Le pro ne choisit jamais « je veux les affiches imprimées par Flowin ».
- [V] QR enfoui : Mes animations → fiche → onglet « Diffusion » (3e) → liste « Supports » (6 × Ouvrir/Copier, aucun libellé QR) → bouton replié « ▼ Texte, QR & partage » → PNG/Affiche. **4 clics + 1 dépliage** depuis l'accueil, sans jamais lire « QR code » avant la 4e action.
- [V] Message piège sous le QR principal : « Ce lien contient le jeu : le QR changerait si vous changiez de jeu. Pour un QR à imprimer, utilisez les QR tracés » → le QR affiché en premier est celui **à ne pas imprimer** ; il faut descendre et déplier « ▼ Lien, PNG, SVG, affiche » d'un QR tracé.
- [V] L'étapier annonce « 4 Diffusion & QR » mais le QR définitif n'est pas remis en fin de création (v1/v3 : écran FIN = récap + demandes).

**Notes** : ergonomie 4 · simplicité 3 · fluidité 4 · adhésion 3.

## 3. Assistance IA pour générer un quiz

**Bon**
- [V] Route `app/api/pro/generer-questions/route.ts` : thème + nombre (1-12) + contexte libre (6 000 car.), quiz ou bonus ; message 503 explicite si clé absente.
- [V] Branchée dans `components/pro/BanqueEditor.tsx:96-112` (panneau « ia ») ; les questions générées sont versées dans l'éditeur, donc relisibles/modifiables avant enregistrement (validation implicite).
- [V] Catalogue `/pro/banques` filtré par métier (Restaurateur, Pizzeria, Boulanger…), « Voir les questions » / « Ajouter à mes banques ».

**Pas bon**
- [V] **Non fonctionnelle en local** : `POST /api/pro/generer-questions` → 503 « ANTHROPIC_API_KEY absente ». Production : [S] non testé (pas d'appel payant).
- [V] **Absente du parcours de création** : le commentaire de la route dit « utilisée par l'étape 2 du wizard », mais `grep generer-questions` ne trouve que `BanqueEditor.tsx`. Dans le wizard : « + Créer une banque » (sortie du parcours) ou « Je n'ai pas de questions : demander à Flowin ».
- [V] Pour générer : quitter la création → éditeur de banque (38 interactifs, 28 < 44 px, étapier « 1 2 3 4 Récapitulatif ») → ouvrir le panneau IA → thème → générer → enregistrer → revenir au wizard. ≈ 7 actions + perte de contexte. Pas d'écran « valider ces questions » (cocher / rejeter / régénérer une question).
- [V] `/pro/banques` : 5 211 px, 894 mots, 62 interactifs sur mobile : catalogue trop long pour un choix rapide.

**Notes** : ergonomie 4 · simplicité 3 · fluidité 3 · adhésion 3 (la fonction la plus « wow » est cachée).

## 4. Lots (plusieurs lots, visuel, gagnants, historique)

**Bon**
- [V] Plusieurs lots par animation, chacun : titre, valeur, quantité, station, conditions (« offre non cumulable · soumise à conditions · valable 4 mois »), badge stock (`op-lots.png`, `components/operations/BlocsOperations.tsx`).
- [V] Sous chaque lot : « ▸ N gagnants » dépliable + Réapprovisionner / Retirer (perte/casse). Tableau de synthèse : engagés, valeur, stock, tirés, remis.
- [V] Onglet Gagnants : billet, « Valider » (remis), relance.

**Pas bon**
- [V] **Aucun visuel par lot** (ni image, ni logo du partenaire sur la ligne lot ; les logos sont dans une modale séparée « Partenaires & logos », L.218-219).
- [V] Incohérence affichée : « Café gourmand… ▸ 10 gagnants » avec **stock 10/10** ; synthèse « 16 tirés / 2 remis / 14 à remettre » mais pas d'état par gagnant visible sous le lot sans déplier.
- [V] Statut de remise non visible sous le lot : l'historique « gagné → remis (date) » est dans l'onglet Gagnants (3 055 px, 68 interactifs, « Relancer à nouveau » × 16).
- [V] Champ quantité « 1 » + 2 boutons sous chaque lot : actions de stock mises au même niveau que la lecture → bruit pour un pro qui veut juste voir qui a gagné.
- [V] Emoji ⚙️/🤝 relevés en v2 désormais remplacés par icônes (`Ico`) — corrigé.

**Notes** : ergonomie 5 · simplicité 5 · fluidité 5 · adhésion 5.

## 5. « Je veux participer à un super event »

**Bon**
- [V] Existe : `/rejoindre` (sans compte) et `/pro/nouvelle?type=rejoindre` ; choix persona « J'accueille une station de jeu » / « Je suis annonceur, sans station » ; bandeau honnête « Vous parcourez sans compte… votre saisie sera conservée » (`rj2.png`).
- [V] Les 3 niveaux voulus par Romain existent sous forme de packs `lib/commercial.ts:177-189` : **Visibilité** (≈ sponsor digital : liste partenaires + réseaux depuis le jeu), **Animation** (station de jeu sur place + carte), **Sponsor** (« présence sur tous les supports et stations », bandeau, quiz à la marque = partenaire premium) + « simplement visible » (prix à définir). Grille `components/creation/GrilleTarifs.tsx`, page `/sponsor/[se]` pour les sponsors.

**Pas bon**
- [V] Les libellés ne parlent pas la langue de Romain : « Visibilité / Animation / Sponsor » au lieu de « Digital (appli) / Digital + sur place / Premium (tous supports) ». L'axe support n'est pas explicite (v4 §3).
- [V] Le choix du pack arrive **au dernier écran** (FIN, ~3 900 px, 13 champs, v1 P0-1) et n'est qu'une préférence « Tarif à confirmer » — rien n'est payé ni engagé.
- [V] `ParcoursCreation.tsx:330` `void packs` : les packs de la base (`packs_participation`, édités par le SA) sont **ignorés** ; 3 grilles divergentes 1331/1400/1490 (v4).
- [V] Carte : à l'étape 1 un seul super event ouvert (« Fêtes du haut et moyen pays · DÉMO ») ; étapier « 2 Jeu » affiché alors que le jeu est imposé (v2 P0-2). Suivant bloqué tant que nom + catégorie (select de ~25 catégories) ne sont pas remplis.
- [V] `/pro/super` « Ma participation » : un seul SE, page station 4 371 px dont ~40 boutons de dates « (hors période) » (`super-station.png`).
- [V] Trois discours sur la suite (24-48 h / sans délai / on vous rappelle) — v3 P0-2, non corrigé [S : non recontrôlé ligne à ligne].

**Notes** : ergonomie 4 · simplicité 4 · fluidité 4 · adhésion 3.

## 6. Un clic, adhésion réelle : actions jusqu'au premier QR imprimable

Comptage mesuré (pro déjà connecté, compte actif, animation autonome Quiz) :

| Segment | Écrans | Actions |
|---|---|---|
| Accueil → Nouvelle → « Créer une animation » | 2 | 2 |
| Étape 1 nom + 2 dates + Suivant | 1 | 4 |
| Étape 2 Quiz + banque (sans questions : sortie vers banque ou « demander à Flowin ») | 1 (+1 éditeur) | 2 à 9 |
| Étape 3 Lots (titre, valeur, qté, conditions) [S : non saisi] | 1 | ≈ 5 |
| Étape 4 FIN + publier [S : non cliqué, écriture] | 1 | ≈ 2 |
| Retour accueil → fiche → Diffusion → déplier → QR tracé → déplier → Affiche A4 | 3 | 6 |
| **Total** | **9-10** | **≈ 21 à 28** (+ 22 de l'inscription v1 = **43-50 depuis zéro**) |

Points de décrochage, par ordre de probabilité :
1. **Mur de paiement après le compte** (`AccesBloque`) — avant toute valeur vue. [V]
2. **Étape Jeu sans questions** : bloquée, IA absente du wizard. [V]
3. **QR introuvable après publication** (4 clics, libellés « Supports », QR principal déconseillé). [V]
4. Démarché pour un super event : **écran FIN** à 13 champs + prix non engageants. [V v1]

**Notes** : ergonomie 4 · simplicité 3 · fluidité 4 · adhésion 3.

## Synthèse des notes

| Point | Ergonomie | Simplicité | Fluidité | Adhésion |
|---|---|---|---|---|
| 1 Première fois | 6 | 6 | 5 | 4 |
| 2 Créer / QR | 4 | 3 | 4 | 3 |
| 3 Quiz IA | 4 | 3 | 3 | 3 |
| 4 Lots | 5 | 5 | 5 | 5 |
| 5 Super event | 4 | 4 | 4 | 3 |
| 6 Un clic | 4 | 3 | 4 | 3 |

---

## Préconisations pour la refonte (classées par impact sur l'adhésion)

### P0
| # | Fichier | Écran cible |
|---|---|---|
| P0-1 | `components/pro/ProShell.tsx:227`, `components/pro/AccesBloque.tsx` | Le pro non payé accède à la création et à l'aperçu ; seul « Publier / imprimer le QR » demande la signature/paiement, avec le QR flouté visible derrière. |
| P0-2 | `components/creation/ParcoursCreation.tsx` (fin de parcours, après publication) | L'écran final de création **est** le QR : grand QR tracé « En magasin », 3 boutons « Imprimer l'affiche A4 », « Télécharger PNG », « Envoyer par WhatsApp/email ». |
| P0-3 | `ParcoursCreation.tsx` étape Jeu + `app/api/pro/generer-questions/route.ts` + `ANTHROPIC_API_KEY` (Vercel) | Sous « Quiz » : un seul champ « Thème de votre quiz » (pré-rempli avec le métier) + « Générer 3 questions » → cartes question à valider (garder / régénérer / modifier), sans quitter le wizard. « Présentation master » sortie de l'étape. |
| P0-4 | `app/pro/page.tsx`, `components/pro/GrilleOperations.tsx` | Puce « Mon QR » sur chaque vignette d'animation (1 clic → affiche A4) ; nouveau pro : bloc « 3 étapes pour lancer votre jeu » à la place du compteur « 0 participant ». |
| P0-5 | `app/pro/banques/nouvelle/page.tsx:14` | Ne plus créer en GET : bouton « Créer » (POST/action serveur) ; nettoyer les banques vides créées par les visites. |

### P1
| # | Fichier | Écran cible |
|---|---|---|
| P1-1 | `components/operations/DiffusionOperation.tsx`, `QrTraces.tsx` | Onglet renommé « QR & partage », ouvert par défaut ; en tête le QR tracé à imprimer ; le lien « contient le jeu » relégué en « lien avancé ». |
| P1-2 | `lib/commercial.ts:177-189`, `components/creation/GrilleTarifs.tsx`, `ParcoursCreation.tsx:330` | Packs renommés « Digital (appli) / Digital + sur place / Premium tous supports », lus depuis `packs_participation`, choisis en **2e écran** de « rejoindre » (avant les lots), avec ce qui est imprimé pour chacun. |
| P1-3 | `ParcoursCreation.tsx` étape 4 (création autonome) | Choix « 100 % digital (je télécharge mes QR) / Kit imprimé livré par Flowin » en 2 cartes, branché sur `kit` existant (`lib/animationMagasin.ts`). |
| P1-4 | `ParcoursCreation.tsx` mode rejoindre | Étapes réduites : Super event (présélectionné si un seul) → Formule → Lots → Coordonnées ; pas d'étape « Jeu ». |
| P1-5 | `components/operations/BlocsOperations.tsx` (bloc lots) | Carte lot = image/logo + titre + conditions + jauge « 10 à gagner · 7 gagnés · 3 remis » ; dépliage = liste gagnants avec date gagné / date remis ; actions stock dans un menu « … ». |
| P1-6 | Étape 1 création | Nom pré-rempli « Jeu [Commerce] — [mois] », dates par défaut (aujourd'hui → +30 j). |

### P2
| # | Fichier | Écran cible |
|---|---|---|
| P2-1 | `app/pro/banques/page.tsx` | Catalogue replié par métier du pro (le sien ouvert, les autres en liste), cibles ≥ 44 px. |
| P2-2 | `app/pro/super/[event]/page.tsx` | Masquer les dates « hors période » ; frise compacte. |
| P2-3 | `components/pro/GagnantsClient.tsx` | Filtre « à remettre / remis », « Préparer l'email » (v3 P1-1). |
| P2-4 | `app/pro/page.tsx` | Titres de vignettes sur 2 lignes, pas de troncature. |

---

## Parcours idéal : du premier contact au premier QR imprimé

| # | Écran | Clics / saisies |
|---|---|---|
| 1 | Lien démarchage → `/pro/premiere-fois` « C'est parti » | 1 |
| 2 | SIRET → fiche pré-remplie, confirmer | 2 |
| 3 | Email + mot de passe (ou lien magique) | 3 |
| 4 | « Quel jeu ? » 3 cartes, Quiz présélectionné ; thème pré-rempli → « Générer » → valider les 3 questions | 3 |
| 5 | Lot : titre + quantité (+ photo facultative), conditions par défaut | 3 |
| 6 | Formule : « Digital » / « Kit imprimé » | 1 |
| 7 | Aperçu + « Publier » (signature/paiement ici seulement) | 1-2 |
| 8 | **Votre QR** : Imprimer A4 / PNG / WhatsApp | 1 |

**Cible : 8 écrans, ≈ 15 actions, < 5 min** — contre ≈ 13 écrans et 43-50 actions aujourd'hui, avec un mur de paiement avant la valeur.

## Non vérifié
- Publication réelle, écran FIN de création et saisie des lots (écriture interdite) : comptages estimés.
- Génération IA en production (clé Vercel) : non appelée.
- Inscription `/pro/premiere-fois` complète : reprise de v1, non rejouée (aucun compte créé).
