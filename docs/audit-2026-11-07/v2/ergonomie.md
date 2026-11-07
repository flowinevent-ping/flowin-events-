# Audit v2 — ERGONOMIE / UX / UI — Flowin Events (07/11/2026)

Méthode : Playwright (chromium, serveur local :3000), 2 viewports (mobile 390×844, ordinateur 1440×900), mesure DOM automatique par écran :
`inter` = éléments interactifs visibles, `fold` = interactifs au-dessus de la ligne de flottaison, `inputs` = champs de saisie, `small` = cibles tactiles < 44 px (boutons/liens), `emoji` = pictogrammes Unicode affichés dans le texte rendu.
Espace pro observé en lecture seule via `?pro=pro-nook` (faille IDOR déjà documentée, audit 1 `pro.md` P0-2). Aucun compte créé, aucune écriture.
Captures : `/tmp/flowin-audit-v2/shots/ergonomie/{m|d}_<route>.png`. Script de mesure : scratchpad session (`shot.js`).
Réutilisé de l'audit 1 (`/tmp/flowin-audit-2026-11-07/souscription-pro.md`) sans le refaire : chronométrage `/pro/premiere-fois`, densité de l'écran FIN de `/rejoindre` (P0-1), erreur prématurée (P0-3), 32 champs à l'étape Jeu (P0-2).

## Tableau de mesures (extrait)

| Écran | vp | hauteur px | mots | interactifs (dont visibles d'emblée) | champs | cibles <44px | emoji |
|---|---|---|---|---|---|---|---|
| /pro/premiere-fois (accueil) | m | 898 | 130 | 3 (3) | 0 | 2 | — |
| /pro (Mes animations) | d | 944 | 116 | 17 | 0 | 11 | — |
| /pro/nouvelle (choix) | m | 1142 | 136 | 15 | 0 | 2 | — |
| /pro/nouvelle?type=rejoindre (étape 1) | m | 2297 | 406 | 40 (24) | 7 | 20 | ↗ |
| /rejoindre?se=… (étape 1) | m | 2210 | 399 | 26 (11) | 7 | 16 | ↗ |
| /pro/operation onglet Lots | m | 1499 | 281 | 34 (23) | 3 | 21 | ⚙️ 🤝 |
| /pro/operation onglet Diffusion | m | 1205 | 180 | 34 (32) | 0 | 24 | ⬇ |
| /pro/operation onglet Gagnants | m | 3055 | 570 | 68 (21) | 0 | 58 | ↗ |
| /pro/super (ma participation) | m | 2186 | 187 | 17 | 2 | 5 | (© carte) |
| /pro/donnees | m | 2272 | 608 | 54 (30) | 5 | 11 | — |
| /pro/compte | d | 1083 | 389 | 33 | **21** | 7 | — |
| /dashboard/wizard-pro | m | 897 | 194 | 38 | 0 | 30 | **🧭 🏪 📣** |
| /dashboard/wizard-super-event (→ wizard-event) | m | 1489 | 151 | 33 | 4 | 27 | — |
| /dashboard/demandes-rattachement | m | 897 | 156 | 36 | 1 | 34 | — |
| /dashboard/super-events | m | 897 | 135 | 39 | 0 | 39 | — |
| /dashboard/gagnants | m | 6051 | **1899** | 72 | 3 | 69 | — |
| /dashboard/nds-lots | m | 8024 | 1068 | **244** | 0 | 244 | — |
| /dashboard/nds-carte | m | 911 | 193 | 48 | 0 | 48 | — |
| /dashboard/track-qr | m | 1771 | 264 | 20 | 0 | 20 | — |

Note : 1er chargement mobile de `/pro` renvoyé vide (compilation à froid du serveur dev) — non significatif ; la version ordinateur est valide.

---

## PARCOURS PRO

### P1. Première inscription — `/pro/premiere-fois` — **7/10**
- Constat : écran d'accueil exemplaire (3 interactifs, une seule action « C'est parti », 130 mots). Audit 1 : parcours compte clair, erreur seulement après tentative (`tente`). C'est le gabarit de référence.
- Trou : après le compte, accès bloqué tant que paiement non validé (audit 1 `pro.md` P0-5) → le pro ne voit pas la valeur avant de payer. Ergonomiquement c'est la rupture majeure de l'adhésion.
- P1 : mettre une « première animation en brouillon » accessible avant paiement (publication conditionnée au paiement), fichier `components/pro/AccesBloque.tsx`.

### P2. Arrivée et navigation dans l'espace — `/pro`, `/pro/compte`, `/pro/donnees`… — **6/10**
- Positif : menu réduit à 5 entrées (`components/pro/ProShell.tsx` L.37-41), barre basse mobile, routes historiques (`/pro/lots`, `/pro/com`, `/pro/events`) redirigées vers `/pro` (`app/pro/lots/page.tsx` etc.) — pas de page orpheline. Action principale « + Nouvelle animation » bien visible (capture `d__pro_pro_pro_nook.png`).
- Constat : 1er bloc = « Participants ce mois-ci : 0 » alors que la carte en dessous affiche 9 parties / 16 gagnants — information contradictoire en apparence, valeur nulle en tête d'écran.
- Constat : vignette d'opération avec **5 puces** (Lots, Gagnants, Contacts, Trafic par QR, Bons — `app/pro/page.tsx` L.96-101) mais **pas de puce « Mon QR code »** : la tâche la plus fréquente d'un commerçant (imprimer son QR) n'a pas de raccourci.
- Constat : `/pro/compte` = **21 champs** sur un écran (entreprise, RIB, factures, lots). Trop pour un « Mon profil ».
- Constat : `/pro/donnees` 608 mots, 54 interactifs, 4 sous-onglets + 4 actions d'export sur le même écran.
- Jargon : « Super Admin » affiché au pro (`app/pro/super/page.tsx` L.147 ; `app/pro/super/[event]/page.tsx` L.121 expose même `super_event_rapport_points` en `<code>`).
- P1 : remplacer le compteur mensuel par « Prochaine action » (ex. « 14 lots à remettre ») ; ajouter puce « QR code » ; scinder `/pro/compte` en 3 sous-écrans (Entreprise / Paiement / Factures).
- P2 : retirer toute mention technique au pro.

### P3. Rejoindre un super event — `/pro/nouvelle?type=rejoindre`, `/rejoindre?se=` — **4/10**
- Constat (capture `m__pro_nouvelle_type_rejoindre_…png`) : étape 1 = 2297 px, 406 mots, 40 interactifs dont 20 cibles < 44 px, 7 champs. La carte Leaflet occupe le 1er écran mobile alors que le choix ne porte que sur **un seul** super event ouvert.
- Contradiction : texte « son jeu est déjà choisi par l'organisateur » mais l'étapier affiche une étape « 2 Jeu ». Étape inutile pour un rejoignant.
- Étapier en 2 lignes sur mobile (« Diffusion & QR » renvoyé à la ligne) ; titre logo SUPER EVENT + « Changer de choix » + étapier = ~270 px d'en-tête avant le contenu.
- Déjà prouvé (audit 1) : écran FIN ~3 900 px, 13 champs, grille tarifaire + compte + QR ensemble ; erreur rouge avant saisie (`components/creation/ParcoursCreation.tsx` L.1246-1358, L.1348).
- P0 (voir top) : retirer l'étape Jeu du mode rejoindre, scinder FIN.

### P4. Créer une animation — `/pro/nouvelle` — **5/10**
- Écran de choix correct (3 cartes, 15 interactifs). Ensuite même moteur `ParcoursCreation` : étape Jeu jusqu'à 32 champs + « Présentation du master » (audit 1 P0-2). Jargon « master », « banque ».
- P0 conservé de l'audit 1.

### P5. Choisir et publier ses lots — onglet Lots de la fiche — **5/10**
- Constat (`m__…onglet_lots.png`) : l'en-tête orange de la fiche (4 tuiles chiffrées empilées verticalement) occupe **~430 px sur 844** en mobile ; l'onglet n'apparaît qu'à mi-écran, son contenu sous la ligne de flottaison. Même en-tête répété sur tous les onglets.
- Onglet Lots : 6 tuiles de chiffres (lots engagés, valeur engagée, valeur distribuée, stock, tirés, remis) **avant** la liste des lots ; 2 boutons d'action en tête.
- **Emoji dans l'interface** : « ⚙️ Gérer les lots », « 🤝 Partenaires & logos » (rendu mesuré), « 📣 Relancer les non utilisés » (`components/operations/ModalGererLots.tsx` L.206).
- Barre d'onglets à **7 onglets** (Jeu, Lots, Diffusion, Gagnants & tirage, Trafic par support, Participants, Bons de commande & factures) qui défile horizontalement : 3 onglets invisibles sur mobile.
- P1 : en mobile, en-tête de fiche en bandeau compact 1 ligne (4 chiffres en ligne, 80 px max) ; liste des lots d'abord, chiffres repliés.

### P6. Se voir sur la carte du super event — `/pro/super` — **6/10**
- Constat (`d__pro_super_pro_pro_nook.png`) : bilan clair, mais 3 donuts (sexe, âge, origine) passent avant la carte ; la carte est sous la ligne de flottaison sur ordinateur aussi.
- Risque UX : « Glissez un point pour corriger sa position — enregistré immédiatement » : déplacement sans confirmation ni annulation, sur un écran consulté surtout pour regarder. Une erreur de glisser au doigt (mobile) déplace la station publique.
- P1 : mode lecture par défaut, bouton « Corriger ma position » qui déverrouille le glisser + « Enregistrer / Annuler ».

### P7. Son QR code (obtenir, éditer, imprimer) — **4/10**
- Constat : aucun point d'entrée nommé « QR code » dans le menu ni sur la vignette. Il faut : Mes animations → ouvrir l'opération → onglet « Diffusion » (3e onglet) → liste de supports « Billets / Visuel bilan / Affiche A4 / Planche de tickets / Kit digital » chacun avec « Ouvrir » + « Copier » (34 interactifs, 24 cibles < 44 px). **≥ 3 clics + lecture d'une liste pour trouver l'affiche à QR**, sans libellé « QR ».
- Le mot « QR » n'apparaît que dans « Trafic par QR » (statistiques), donc le pro qui cherche son QR va au mauvais endroit.
- « Copier » ×5 répété sans préciser quoi (lien) : ambigu.
- Édition des QR tracés (`components/operations/QrTraces.tsx`) uniquement dans le parcours de création, pas visible en post-publication côté pro (non vérifié en clic — voir liste finale).
- P0 (voir top).

### P8. Gagnants et relance — onglet « Gagnants & tirage » — **4/10**
- Constat : mobile 3055 px, 570 mots, **68 interactifs dont 58 cibles < 44 px** ; chaque ligne gagnant porte « Relancer à nouveau » + « Valider » côte à côte (risque d'erreur de doigt entre une action d'envoi d'email et une action de remise).
- Pas d'action groupée visible en tête côté pro (« Relancer tous les non remis »), elle n'existe que dans la modale lots SA avec emoji 📣.
- Jargon : « tirage », « remis/retiré ».
- P1 : liste par statut (À remettre / Remis), une action principale en tête « Relancer les 14 gagnants non venus », actions par ligne dans un menu, cibles ≥ 44 px.

---

## PARCOURS ADMIN (SA, `/dashboard/*`)

Transversal : la barre latérale SA sur mobile expose **25 à 30 entrées** (ACCUEIL, SUPER EVENTS, Opérations, Stock, Gagnants, Résultat journalier, Rapport détaillé, Statistiques, Origines du trafic, Carte…) ; sur chaque écran mesuré, 70-100 % des cibles font < 44 px. Le SA est un outil de bureau : acceptable sur ordinateur, inutilisable au téléphone pendant un festival (usage terrain réel).

### A1. Créer un pro — `/dashboard/wizard-pro` — **5/10**
- Constat (`m__dashboard_wizard_pro.png`) : **emoji 🧭 🏪 📣** affichés comme icônes de section et de cartes (source `lib/proCreation.ts` L.90 `icone: '🏪'`, L.193 `icone: '🧭'`, annonceur 📣). Écart à la règle « pictogrammes seulement ».
- Étapier 5 étapes tronqué sur mobile (« De quel pro… », « L'identit », « Où il se trouve »), 4e/5e hors écran.
- Message orange « Choisissez un profil pour continuer. » affiché dès l'arrivée, avant toute action (même défaut que P0-3 audit 1).
- Positif : 1 décision par étape, mêmes questions que le pro.
- P1 : remplacer `icone` emoji par clés du jeu `Icon` (le mapping existe déjà `components/dashboard/DashboardUI.tsx` L.130 → l'utiliser) ; afficher l'aide seulement après clic sur Suivant ; étapier « Étape 1/5 » + titre seul sur mobile.

### A2. Créer un super event — `/dashboard/wizard-super-event` — **5/10**
- Redirige vers `/dashboard/wizard-event?type=super` (`app/dashboard/wizard-super-event/page.tsx`) = même `ParcoursCreation` que le pro : hérite donc des P0 de densité (étape Jeu, écran FIN). L'ancien assistant reste à `/ancien` → deux chemins.
- P2 : supprimer `/ancien` une fois validé.

### A3. Intégrer un pro à un super event — `/dashboard/demandes-rattachement` + fiche — **5/10**
- Écran court (156 mots) mais 34/36 cibles < 44 px ; pas de compteur de demandes en attente visible dans la navigation (« Liste des gagnants 44 » a un badge, pas les demandes) — la tâche ne se signale pas.
- P1 : badge « Demandes (n) » dans le menu et sur l'accueil SA ; bouton Accepter/Refuser par ligne ≥ 44 px.

### A4. Lots, carte, QR, gagnants côté SA — **3/10**
- `/dashboard/nds-lots` : **244 interactifs, 8 024 px, 1 068 mots** sur un seul écran. Aucun filtre par pro en tête mesuré.
- `/dashboard/gagnants` : **1 899 mots, 6 051 px**, 72 interactifs — liste non paginée.
- `/dashboard/nds-carte` : 48 interactifs tous < 44 px.
- `/dashboard/track-qr` : 264 mots, pas de lien direct « imprimer le QR de ce pro ».
- Rappel audit 1 `sa.md` P0-1/P0-2 : compteurs gagnants/lots faux sur l'accueil.
- P1 : lots et gagnants regroupés par pro (accordéon fermé, 1 ligne = pro + compteur), recherche en tête, pagination.

---

## Notes /10 par parcours

| Parcours | Note |
|---|---|
| Pro 1 — inscription | 7 |
| Pro 2 — tableau de bord | 6 |
| Pro 3 — rejoindre un super event | 4 |
| Pro 4 — créer une animation | 5 |
| Pro 5 — lots | 5 |
| Pro 6 — carte | 6 |
| Pro 7 — QR code | 4 |
| Pro 8 — gagnants / relance | 4 |
| SA 1 — créer un pro | 5 |
| SA 2 — créer un super event | 5 |
| SA 3 — rattachement | 5 |
| SA 4 — lots/carte/QR/gagnants | 3 |

## TOP 5 P0

| # | Problème | Fichier | Cause | Correctif |
|---|---|---|---|---|
| P0-1 | Écran FIN de rejoindre/créer = récap + tarifs + compte + QR (~3 900 px, 13 champs) | `components/creation/ParcoursCreation.tsx` L.1246-1358 | fonctionnalités empilées | 3 écrans : Récap → Tarif (passable) → Coordonnées ; QR après publication |
| P0-2 | Mode « rejoindre » affiche une étape « Jeu » alors que le jeu est imposé ; étape 1 = carte + 40 interactifs pour 1 seul super event | `ParcoursCreation.tsx` (étapier, étape Super event) | moteur unique non élagué par mode | Mode rejoindre = 3 étapes (Super event → Lots → Publier) ; carte repliée si 1 seul choix, présélection |
| P0-3 | QR code introuvable : aucun libellé « QR code », caché dans onglet 3 « Diffusion » parmi 5 supports × 2 boutons | `app/pro/page.tsx` L.96-101 ; `components/pro/FicheOperationPro.tsx` L.130 | QR traité comme un « support » parmi d'autres | Puce « Mon QR code » sur la vignette + 1er bloc de Diffusion = aperçu QR + « Imprimer l'affiche » |
| P0-4 | Étape Jeu : 32 champs inline + « Présentation du master » | `ParcoursCreation.tsx` L.1040-1134, `components/masters/PersoMaster.tsx` | éditeur complet inséré inline | Questions suggérées par défaut, édition différée ; personnalisation après publication |
| P0-5 | Emoji affichés dans l'interface (règle Romain) | `lib/proCreation.ts` L.90, L.193 (+ annonceur) ; boutons « ⚙️ Gérer les lots », « 🤝 Partenaires & logos » (BoutonGererLots / ContenuLots, `components/operations/`) ; `ModalGererLots.tsx` L.206 « 📣 » | emoji utilisés comme icônes | Remplacer par `Icon`/`Ico` (mapping déjà présent `DashboardUI.tsx` L.130) ; ajouter un contrôle grep `\p{Extended_Pictographic}` en CI |

P1 (résumé) : en-tête de fiche opération mobile ~430 px (P5) ; gagnants 58 cibles < 44 px et « Relancer »/« Valider » adjacents (P8) ; glisser de station enregistré sans confirmation (P6) ; `/pro/compte` 21 champs (P2) ; messages d'aide/erreur avant action (wizard-pro, rejoindre) ; SA nds-lots 244 interactifs / gagnants 1 899 mots (A4) ; badge demandes de rattachement (A3) ; « Super Admin » et nom de table affichés au pro.
P2 : compteur « 0 participant ce mois » en tête ; 7 onglets défilants ; « Copier » ambigu ; `/dashboard/wizard-super-event/ancien` ; étapiers tronqués mobile.

---

## Enchaînements cibles (un sujet par écran)

**Pro — première adhésion (avant 1re publication)**
1. Accueil (existant, garder) → 2. Compte (existant `PremiereFois`, garder) → 3. « Que voulez-vous faire ? » (Créer / Rejoindre, 2 cartes) → 4. (Rejoindre) Super event présélectionné, confirmer → 5. Vos lots (1 lot minimum, liste simple) → 6. Récap + Publier → 7. Écran succès = **votre QR code** + « Imprimer l'affiche ».
Différé après publication : tarif/pack (si non imposé), personnalisation (logo, horaires, site), QR tracés multiples, questions personnalisées, RIB/factures, position fine sur la carte, partenaires & logos.

**Pro — créer une animation** : Type de jeu (questions suggérées incluses) → Dates & lieu → Lots → Récap/Publier → QR. Éditeur de questions = écran séparé depuis la fiche.

**Pro — tableau de bord** : Accueil = « Prochaine action » (1 carte : lots à remettre / QR à imprimer / demande en attente) + liste des opérations. Fiche opération : bandeau compact + 4 onglets max (Mon QR, Lots, Gagnants, Stats) ; Contacts, Bons/factures dans Profil.

**Pro — gagnants** : Liste « À remettre » → action groupée « Relancer » en tête → détail gagnant (Valider la remise) sur écran/volet séparé.

**SA — créer un pro** : identique, sans emoji, étapier compact. **Super event** : Nom & dates → Lieu/carte → Jeu → Lots communs → Publier ; ouverture aux pros = écran séparé après publication. **Intégrer un pro** : badge demande → fiche demande (1 écran : pro, station, Accepter/Refuser) → retour liste. **Lots/gagnants SA** : vue par pro repliée + recherche.

---

## Non vérifié
- Clics réels de bout en bout dans `ParcoursCreation` jusqu'à publication (aucune écriture autorisée) ; nombre de clics de publication repris de l'audit 1.
- Impression réelle du QR / rendu PDF « Affiche A4 », « Planche de tickets ».
- Édition des QR tracés après publication côté pro.
- Envoi effectif d'une relance (email interdit) ; contenu de l'email.
- Écran succès post-inscription et écran « accès bloqué » avec un vrai compte non payé (pas de compte créé).
- `/pro` mobile au 1er chargement (vide dû à la compilation à froid ; ordinateur vérifié).
- Fiche super event SA détaillée (`/dashboard/super-events/<id>`) et acceptation d'une demande de rattachement (écriture).
- Mesures de contraste et lecteur d'écran (hors périmètre mesuré).
