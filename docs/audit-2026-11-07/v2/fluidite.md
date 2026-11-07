# Audit FLUIDITÉ — Flowin Events (07/11/2026)

Méthode : Playwright (chromium, playwright-core) sur le serveur dev `localhost:3000`, ordinateur 1440×900 et mobile 390×844. CLS mesuré par `PerformanceObserver('layout-shift')` injecté avant chargement, cumulé sur 7 s. Captures à t=0 (DOMContentLoaded), 500 ms et 2 s pour chaque page (`shots/fluidite/<page>-<d|m>-t0|t500|t2s.png`). Tiroirs testés par Échap, croix, clic sur le fond et retour arrière du navigateur. Pro lu en lecture seule : `?pro=pro-nook`. Super event : `se-nds-2026`. Aucune écriture (pas de SQL en écriture, pas de clic sur un bouton d'enregistrement).
Mode dev : les temps de DOMContentLoaded (137 à 1 620 ms) incluent la compilation à la demande. Ils ne sont donc pas retenus comme constats. Les décalages et les défauts de tiroir ci-dessous sont expliqués par le code et apparaîtraient aussi en production.

## Tableau page par page

| Page | CLS ordi | CLS mobile | Écran blanc/vide au chargement | Tiroirs / volets testés |
|---|---|---|---|---|
| /pro/premiere-fois | 0 | 0 | non | – |
| /pro (Mes animations) | 0 | 0 | **zone de contenu vide** à t=0 et t=500 : seul « Vérification de votre accès… » (`pro-d-t500.png`) | menu mobile : code, pas d'Échap |
| /pro/compte | 0 | 0 | contenu vide à t=0 (315 caractères = coque seule), plein à 500 ms | – |
| /pro/operation (sans id) | 0 | 0 | « Animation introuvable » (normal sans `?id=`) | – |
| /pro/donnees | 0 | 0 | vide à t=0, plein à 500 ms | – |
| /pro/nouvelle | 0 | 0 | vide à t=0 | – |
| /pro/nouvelle?type=rejoindre | 0,0004 | **0,0648** | vide à t=0 | – |
| /rejoindre?se=se-nds-2026 | 0 | **0,0642** | non | – |
| /pro/lots | 0 | 0 | vide à t=0 | Gérer les lots : bouton OK, fond OK, **Échap KO** (1er audit, `modal-lots-after-escape.png`) |
| /pro/tirage | 0 | 0 | vide à t=0 | – |
| /se/se-nds-2026 (carte publique) | 0 | 0 | non : la carte et 22 marqueurs s'affichent (`se-nds-d-t2s.png`) | volet du bas : non testé |
| /dashboard/wizard-pro | **0,0417** | 0 | non | **saisie cassée** (voir P0-2) |
| /dashboard/wizard-super-event | **0,0334** | **0,0635** | non | – |
| /dashboard/demandes-rattachement | **0,0417** | 0 | non | – |
| /dashboard/super-events | **0,0233** | 0,0033 | non | SuperEventDrawer : ouverture non obtenue par clic sur la carte (sélecteur), non vérifié |
| /dashboard/nds-lots | **0,0235** | **0,0126** | non | – |
| /dashboard/nds-carte | **0,0341** | **0,0821** (le pire) | non | carte écrasée sur mobile (voir P0-3) |
| /dashboard/track-qr | **0,0199** | 0,0018 | non | – |
| /dashboard/gagnants | **0,0211** | **0,0303** | non | clic sur une ligne : pas de tiroir ouvert dans les 8 s (non vérifié) |
| /dashboard/pros → tiroir Pro | – | – | – | ouverture 83 ms. Croix OK, fond OK, **Échap KO**, **Retour navigateur quitte la page**, **mobile : tiroir invisible** |
| /dashboard/joueurs → tiroir Joueur | – | – | – | ouverture 340 ms. Croix OK, fond OK, **Échap KO**, **Retour quitte la page**, **mobile : tiroir à y=40 630 px** |

Seuil 0,01 : **toutes les pages /dashboard testées le dépassent sur ordinateur**. Côté pro, aucun dépassement, sauf l'étape « rejoindre » sur mobile.

## P0

**P0-1 — Le tiroir SA (`sa-drawer`) n'est pas superposé : il est rendu dans le flux de la page. Sur mobile, il est invisible.**
- Fichier : `admin/components/dashboard/Drawer.tsx:82`, `style={{ position: 'relative', width: … }}`. Ce style en ligne écrase `position:fixed` de `.sa-drawer` (`app/dashboard/globals.css:118`). Introduit par le commit 55fba712 (« Fenêtre pop-up redimensionnable », 21/10) : `relative` servait à placer la poignée.
- Preuve : la position calculée vaut `relative` sur ordinateur comme sur mobile. Sur mobile, le tiroir Joueur s'affiche à `top=40630 px` et le tiroir Pro à `top=1112 px`. L'utilisateur ne voit que le fond grisé, qui bloque l'écran (`drawer-joueurs-m-open.png`). Sur ordinateur, le tiroir prend une colonne de la mise en page flex : le contenu de la page est écrasé à environ 200 px de large (`drawer-pros-d-open.png`, tableau « Pros » tronqué). C'est le saut de page constaté à chaque ouverture.
- Correctif : retirer `position:'relative'` du style en ligne. `.sa-drawer` en `position:fixed` sert déjà de bloc de référence pour la poignée en `position:absolute`. Ajouter aussi `body{overflow:hidden}` pendant l'ouverture (aujourd'hui `overflow: visible`, la page derrière défile).

**P0-2 — Assistant « Créer un pro » : le champ perd le focus à chaque touche.**
- Fichier : `admin/app/dashboard/wizard-pro/page.tsx:66` et `:96`. `function Champ` et `function Champs` sont des composants déclarés dans le rendu de la page. À chaque frappe, `setF` crée une nouvelle identité de composant : React démonte puis remonte l'`<input>`.
- Preuve : saisie de « Boulangerie » → valeur obtenue « B », `document.activeElement = BODY` (`wizard-pro-saisie.png`).
- Correctif : sortir `Champ` et `Champs` au niveau du module (avec `f`, `maj` et `id` en props), ou les appeler comme des fonctions (`{Champs({champs})}`) au lieu de `<Champs/>`.

**P0-3 — Carte du super event SA (`/dashboard/nds-carte`) inutilisable sur mobile.**
- Fichier : `admin/app/dashboard/nds-carte/page.tsx:223`. La grille `gridTemplateColumns:'minmax(0,1fr) 280px'` n'a pas de point de rupture.
- Preuve : à 390 px, la carte fait environ 80 px de large. Le `fitBounds` (l.171), calculé sur cette boîte, dézoome jusqu'à Cannes/Antibes. Les marqueurs se superposent et ne sont pas cliquables (`d-nds-carte-m-t2s.png`). CLS mobile 0,0821 : le conteneur Leaflet et les contrôles se placent après le chargement asynchrone de `import('leaflet')` (l.121).
- Correctif : `@media (max-width:900px)` → une seule colonne, carte au-dessus de la liste. Hauteur réservée dès le premier rendu (déjà 540 px). Appeler `invalidateSize()` puis `fitBounds` après la mise en page, comme le fait `app/se/_components/SuperEventMap.tsx:142`.

**P0-4 — Aucun volet ni aucune modale ne se ferme avec Échap, et le retour navigateur fait quitter la page.**
- Le seul `keydown` du dépôt est dans `app/jouer/JouerClient.tsx:447`. Sont concernés : `components/dashboard/Drawer.tsx` (5 tiroirs SA), `components/operations/ModalGererLots.tsx`, `ModalPartenaires.tsx`, `components/dashboard/ModalRelanceGlobale.tsx` et `components/pro/ProShell.tsx` (menu mobile).
- Preuve : Échap → « RESTE OUVERT » sur les tiroirs Pro et Joueur, sur ordinateur et sur mobile. L'ouverture d'un tiroir n'ajoute pas d'entrée d'historique (`contexts/DashboardContext` : pile interne seulement). Un Retour de l'utilisateur pour fermer le tiroir quitte donc `/dashboard/pros` (URL après : `about:blank` dans le test, en pratique la page précédente).
- Correctif : un hook commun `useFermeture(onClose)` qui écoute `keydown Escape` et `popstate`, avec `history.pushState({drawer:1})` à l'ouverture. Le brancher dans `Drawer.tsx` et dans les 4 modales.

**P0-5 — Espace pro : coque remontée et contrôle d'accès rejoué à chaque navigation (écran vide puis contenu qui surgit).**
- Fichier : `admin/components/pro/ProShell.tsx:99-107` et `:224-226`. `ProShell` est rendu par chaque `page.tsx` et non par un `app/pro/layout.tsx`, qui n'existe pas. À chaque changement d'onglet, l'état `acces` repart à `'verif'`. Les enfants ne sont montés qu'après la réponse Supabase, puis lancent leurs propres requêtes : deux allers-retours en cascade.
- Preuve : à t=0 et à t=500 ms, la zone de contenu ne contient que « Vérification de votre accès… » sur `/pro` (`pro-d-t500.png`). Toutes les pages pro n'ont qu'environ 320 caractères (la coque) à t=0. Le CLS reste à 0 seulement parce que le contenu est inséré sous un bloc vide : visuellement, la page « saute ».
- Correctif : déplacer `ProShell` dans `app/pro/layout.tsx` (monté une seule fois), garder `acces` en cache (contexte ou `sessionStorage`), monter les enfants pendant la vérification et afficher un squelette à la hauteur prévue.

## P1

- **Menu latéral SA qui se déplie après le chargement, sur toutes les pages /dashboard (CLS ordinateur de 0,019 à 0,034, sources `sa-sb-bloc`).** Fichier : `components/dashboard/Sidebar.tsx:242-258`. `ouverts` vaut `new Set()` au premier rendu et le groupe actif n'est ouvert que dans un `useEffect`. Le comptage asynchrone `aRelancer` (l.109) déplie ensuite le groupe « gagnants » et crée un second décalage environ 200 ms plus tard. Correctif : initialiser `useState(() => groupes actifs calculés depuis pathname)`, et ouvrir le groupe porteur d'alerte sans décaler (badge seul, ou groupe ouvert par défaut).
- **Police Bangers chargée par `@import` dans une chaîne CSS de composant (`components/masters/SelecteurLot.tsx:120`, `display=swap`).** Elle provoque un décalage lors du changement de police (`fm-se-word`), aggravé sur mobile par `pc-grille` : 0,064 sur `/rejoindre`, `/pro/nouvelle?type=rejoindre` et `/dashboard/wizard-super-event`. Correctif : `next/font/google` (Bangers) avec `adjustFontFallback`, ou réserver une largeur ou une hauteur fixe au logo « super event ».
- **`/dashboard/gagnants` mobile, CLS 0,030 (sources `sa-input`) et `/dashboard/nds-lots` 0,0126/0,0235 (`sa-muted`).** Des blocs de filtres et des textes d'état apparaissent après les données sans hauteur réservée. Correctif : réserver la ligne de filtres et l'en-tête de compteur dès le rendu initial.
- **Sur ordinateur, le tiroir ouvert réduit le contenu de la page** : conséquence de P0-1, disparaît avec ce correctif.
- **Double clic.** `wizard-pro` protège l'envoi (`occupe`), de même que `ParcoursCreation` et `ModalGererLots` (`disabled` sur un drapeau). Rien n'a été déclenché réellement. Le risque n'est donc pas mesuré. Les actions de `demandes-rattachement` (accepter/refuser) ont 2 `disabled` : à confirmer.

## P2

- `/dashboard/super-events` : bouton `sa-btn primary` décalé après le rendu (0,004).
- `/se/se-nds-2026` : carte publique fluide (CLS 0, 22 marqueurs, `scrollWheelZoom:false`). La molette ne zoome pas sur ordinateur, ce qui est voulu mais peut dérouter. Clic sur un marqueur et volet du bas : non testés.
- `ModalGererLots` : émoticônes et absence d'Échap (déjà dans le 1er audit).

## Non vérifié

- Ouverture du tiroir Super Event depuis `/dashboard/super-events`, du tiroir Event depuis `/dashboard/events` et du tiroir depuis `/dashboard/gagnants` : mes sélecteurs n'ont pas trouvé l'élément cliquable, il ne faut pas en conclure à une panne. La cause P0-1 étant commune (`Drawer.tsx`), les 5 tiroirs ont le même défaut.
- Obtenir et modifier un QR (`track-qr`) et publier des lots : actions en écriture, non déclenchées.
- Clic sur un marqueur et glisser-déposer sur `nds-carte` : non testés (écriture de coordonnées).
- Temps de réponse en production : le mode dev fausse les mesures.
