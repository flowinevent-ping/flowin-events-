# Audit dashboard SA — organisation, doublons, lacunes
10/08/2026 — audit seul, aucun code applicatif modifié (hors le fix ci-dessous, codé mais non poussé).

## 0. Pourquoi ça sature
3 systèmes tournent en parallèle, jamais fusionnés :
- `admin/public/dashboard.html` — legacy, 15 224 lignes, encore modifié le 31/07.
- Dashboard SA en Next.js (`admin/app/dashboard/*`) — 34 entrées de sidebar, 11 groupes.
- Dashboard Pro en Next.js (`admin/app/pro/*`) — 11 entrées, 5 groupes.

Dans le SA seul, doublons confirmés en lisant le code :
- **3 pages d'accueil** qui affichent quasi les mêmes compteurs : `Accueil` (`/dashboard`), `Pilotage` (`/dashboard/pilotage`), `Rapports` (`/dashboard/rapports`).
- **2 vues joueurs séparées** : `Joueurs` (CRM global, `/dashboard/joueurs`) et `Participants` (par super event, `/dashboard/nds-participants`) — aucune ne fait ce que tu demandes (fréquence par station).

## 1. Parcours mobil — la liste interminable du sélecteur

Cause du screenshot (sélecteur HTML natif `<select>` dans `ParcoursMobil.tsx`, alimenté par `admin/app/dashboard/parcours/page.tsx`) :

```ts
const evs = (events ?? [])
  .filter(e => e.module && e.super_event_id)   // aucun autre filtre
  .map(e => ({ id: e.id, module: e.module, nom: e.nom }))
```

**Cause A — mélange de plusieurs super events.** Le filtre ne restreint pas à un `super_event_id` précis. Or il existe au moins 2 super events avec le même jeu de stations : *Nuits du Sud 2026* et *Master — Super Event (marque blanche)* (créé par duplication complète de NDS 2026 via `dupliquer_super_event`, méthode validée en mémoire). Résultat : chaque station apparaît environ deux fois dans la liste — exactement le motif visible sur ton screenshot (Brigade Verte ×2, Les Caisses ×2, Le Bar ×2…).

**Cause B — entrées génériques jamais nettoyées après la numérotation.** Preuve trouvée dans le code et la doc :
- `NDS2026Client.tsx:72` redirige explicitement `ev-nds-tablette` → `ev-nds-tablette-1` : le générique est un id legacy connu et court-circuité côté joueur, mais **la ligne `events` correspondante existe toujours** et n'est filtrée nulle part côté admin.
- `docs/archive/HANDOFF-comm-nds2026.md` confirme l'existence parallèle de `ev-nds-bar` **et** `ev-nds-bar-1/2/3`, `ev-nds-caisses` **et** `ev-nds-caisse-1/2/3`.
- Le mockup `admin/public/schemas/flowin-pro-navigation.html` marque déjà ces génériques `etat:'archive'` (`ev-nds-bar`, `ev-nds-caisses`, `ev-nds-tablette`) face aux numérotées `etat:'passe'` — la distinction a déjà été pensée, jamais implémentée dans le vrai sélecteur. Attention : `etat` n'est pas un champ réel de la table `events` (`status` ne connaît que `upcoming/live/past`), c'est une catégorisation de mockup — donc pas de colonne à filtrer directement en base, il faut une liste de correspondance comme celle décrite en cause C.
- `ev-nds-digitale` (« NDS · Digital ») n'est pas un doublon : c'est le lien générique posté en bio Instagram/Facebook (`docs/.../reseaux-texte-nds.md`), un point d'entrée sans QR physique. Légitime, mais mal étiqueté au milieu des vraies stations physiques.

**Cause C — la solution existe déjà, dans le système legacy.** `dashboard.html` a déjà résolu exactement ce problème avec une allowlist + une table de libellés propres :
```js
var NDS_EVENT_IDS = ['ev-nds-2026','ev-nds-caisse-1','ev-nds-caisse-2','ev-nds-caisse-3','ev-nds-caisses',
  'ev-nds-bar','ev-nds-bar-1','ev-nds-bar-2','ev-nds-bar-3','ev-nds-ecrans','ev-nds-safer','ev-nds-digitale',
  'ev-nds-tablette','ev-nds-tablette-1','ev-nds-tablette-2','ev-nds-tablette-3','ev-nds-bergerie',
  'ev-nds-carrosserie-gp','ev-nds-charvolin','ev-nds-giordano','ev-nds-pegase','ev-nds-utile','ev-nds-nook',
  'ev-nds-cycles963'];
var m = {'ev-nds-caisse-1':'Caisse 1', ... 'ev-nds-tablette':'Brigade Verte', ...};
```
→ Correction proposée : porter cette même logique (allowlist canonique + libellés) dans `parcours/page.tsx`, **plus** filtrer par `seId` sélectionné (comme le font déjà `statistiques/page.tsx` et `track-qr/page.tsx` avec leur sélecteur de super event en boutons). Aucune modification de base de données nécessaire.

**Cause D — mise en page.** Le screenshot montre le téléphone collé à droite avec un grand vide au milieu. Dans `ParcoursMobil.tsx`, la colonne de gauche est `flex:1, minWidth:260` sans `maxWidth`, et le téléphone est `order:2` à largeur fixe : sur un écran large, la colonne de gauche s'étire et pousse le téléphone à l'extrême droite. Correction simple : plafonner la largeur du bloc gauche (ex. `maxWidth: 420`) ou centrer le conteneur global.

**Cause E — pas de mode « pro ».** `ParcoursMobil.tsx` n'a que deux onglets : `event` et `super` (`type Screen = 'event' | 'super'`). Ce que tu décris (« il n'y a que celui de l'utilisateur pour le super event ») est exact : il n'y a aucun mode prévisualisant le parcours **côté pro** (ce que voit un partenaire dans son propre espace). Confirmé par ton message : c'est un chantier pas encore fait, pas un bug. À ajouter comme 3ᵉ onglet quand vous vous y attaquerez.

## 2. Stations & trafic

- `Statistiques & résultats` (`TableauStations`) et la fiche partenaire (`PartenaireDrawer`, onglet Stats) donnent des **totaux agrégés** par station (flashs/parties/joueurs/rejoué/pic) — pas de détail jour par jour.
- Fix déjà codé cette session (`tsc` + `next build` OK, **non poussé** — attente du PAT) : sur `Origines du trafic`, cliquer une source « Réseaux · X » ou une ligne « Clics sortants » ouvre maintenant la fiche de la station correspondante (onglet Stats). Corrige l'accès manquant que tu signalais, mais reste un agrégat, pas un détail par jour.
- **Lacune confirmée** : la vue « nombre de clics par jour » que tu décris comme ayant déjà existé correspond à `renderTrackQr()` dans `dashboard.html` (legacy) — une timeline brute de scans horodatés (`ts: p.created_at`) par station. Cette vue n'a **jamais été portée** dans le dashboard Next.js. C'est un vrai manque, pas un problème de navigation.

## 3. Joueurs / CRM

- `Joueurs` (CRM global) : liste tous les joueurs, recherche par nom/email/ville. OK, pas de doublon fonctionnel avec le reste.
- `Participants` (NDS 2026) : liste les joueurs d'un super event avec leur activité, mais pas structuré par station.
- **Ce que tu demandes** (fréquence de jeu par joueur × par station, réponses au quiz, usage du parrainage) **n'existe dans aucune vue actuelle**, SA ou Pro. Piste : `fetchJoueurHistory()` (`lib/parcours.ts:471`) existe déjà mais ne renvoie que `{answeredQuizIds, bonusDone}` pour un joueur, usage strictement côté joueur (éviter de rejouer une question) — pas exploitable tel quel pour une vue admin. Les données brutes par joueur × station semblent exister dans la table `participations` (cf. principe déjà noté : « toujours utiliser `participations`, pas `joueurs.events`, pour le filtrage par station ») mais aucune page ne les expose. À vérifier précisément dès que Supabase est de nouveau accessible — je ne veux pas deviner la structure exacte sans la lire en base.

## 4. Doublons de navigation (rappel)
- `Accueil` / `Pilotage` / `Rapports` : 3 pages, mêmes KPI globaux (joueurs, events, opt-in, gagnants), 3 emplacements différents dans la sidebar.
- `Joueurs` / `Participants` : périmètres différents mais jamais reliés (pas de lien croisé).

## 5. Proposition de réorganisation (8 blocs, alignés sur ta demande)
Contenu déjà existant à 90 %, seule la navigation (11 groupes → 8 blocs) et les doublons ci-dessus sont à corriger :
1. Events / Super events (planning passé-présent-avenir)
2. Stations jeux
3. Profil pro (events, super event, jeux, sélections, QR, comm par date, stock lots, visuels)
4. Joueurs (CRM global + détail par station — **partie détail à construire**)
5. Stats par jour / events / super events / stations
6. Parcours mobil (event, super event, pro **à construire**, utilisateur)
7. Dashboard pro accès depuis SA (déjà fait : `Aperçu Pro`)
8. Landing pages prospection + parcours enquêtes

## 6. Corrections — liste priorisée
| # | Correction | Ampleur | État |
|---|---|---|---|
| 1 | Fiche station cliquable depuis Origines du trafic (Camembert + tableaux) | Petit | ✅ Fait et poussé (vérifié dans le code au 28/08, la note "non poussé" ci-dessus était donc caduque) |
| 2 | Sélecteur Parcours mobil : filtrer par super event choisi + allowlist canonique (porter `NDS_EVENT_IDS` + libellés depuis dashboard.html) | Moyen | ✅ Fait différemment le 26/08 (groupement par pro, pas allowlist — décision prise avec Romain, ne pas revenir dessus) |
| 3 | Mise en page Parcours mobil : plafonner la colonne gauche pour éviter le téléphone collé à droite | Petit | ✅ Fait (maxWidth déjà en place, vérifié au 28/08) |
| 4 | Vue « clics par jour » par station (porter `renderTrackQr()` timeline) | Moyen-grand | ✅ Fait 28/08 (RPC `super_event_track_qr_quotidien` + `CourbeQuotidienne.tsx`, courbe pas timeline brute — répond à la question "combien par jour", pas au détail ligne par ligne) |
| 5 | Fusionner Accueil / Pilotage / Rapports en une seule page | Moyen | À faire |
| 6 | Relier ou fusionner Joueurs / Participants | Moyen | À faire |
| 7 | Vue fréquence joueur × station × réponses | Grand — nécessite vérif Supabase d'abord | À investiguer |
| 8 | Mode « pro » dans Parcours mobil | Grand — chantier déjà identifié par Romain | À construire |
| 9 | Réorganiser la sidebar SA en 8 blocs | Moyen | À faire, après validation de Romain |

Rien dans cette liste n'a été poussé sur `main`. Prochaine étape : validation de Romain point par point avant exécution.
