# Audit sévère — Dashboard SA (Flowin / Nuits du Sud 2026)

Auditeur extérieur, lecture seule (code + Supabase `select`), localhost:3000 (données Supabase réelles,
projet `ywcqtupgoxfzkddqkztk`). Playwright `playwright-core` + chromium local, desktop 1440×900 et mobile
390×844. Pas d'accès prod (`flowin-events.vercel.app` injoignable depuis cette session). Pas de connexion
SA testée (aucun identifiant fourni, aucun compte créé — voir plus bas : il n'y a en fait **aucune page de
connexion** à tester pour `/dashboard/*`).

Chaque constat est marqué **vérifié** (capture, requête SQL, ligne de code citée) ou **supposé**.

---

## Notes par axe (/10)

| Axe | Note | Justification (preuve) |
|---|---|---|
| Design | 7/10 | Palette conforme à `DESIGN-TOKENS-flowin.md` : `--sa-accent:#7A4FE0` = `--fl-violet`, `--sa-text:#1B3A5C` = `--fl-encre`, `--sa-bg:#F4F6F9` = `--fl-papier` (vérifié, `app/dashboard/globals.css:5-9`). Composants `sa-card`/`sa-kpi` homogènes sur tous les écrans visités. Pénalité : les tuiles KPI de la page d'accueil affichent des chiffres faux (voir Données), ce qui mine la confiance visuelle. |
| Ergonomie | 6/10 | Drawers Joueur et Event testés ouverts **et** fermés avec succès, aucun blocage constaté (captures `drawer_02/03`). Mais `/dashboard/prospection` n'offre **aucune action** (1 seul `onClick` dans tout le fichier, lignes de tableau en `cursor:'default'`) alors que `lib/commercial.ts` expose déjà `updateProspect()` jamais appelé — un CRM qu'on ne peut pas faire vivre. |
| Fluidité | 6/10 | 21 pages testées (desktop + mobile) chargent sans erreur bloquante, pas de crash console pendant la navigation normale. CLS non mesuré avec un outil rigoureux (voir non-vérifié). Un outil clé (`admin-commandes-animation.html`) expose un vrai risque de rupture de flux : session qui expire sans prévenir (voir Technique P0-4). |
| Compréhension | 5/10 | Vocabulaire incohérent : « Gains » (`app/dashboard/joueurs/page.tsx:65`), « Lot » (`app/dashboard/gagnants/page.tsx:114`), « Gagnants »/« Lots disponibles » (`app/dashboard/rapports/page.tsx:13,18`) désignent la même notion sans terme unique. Pire : la page d'accueil affirme « 0 gagnants » / « 0/33 lots utilisés » alors qu'à un clic de là, l'écran Gagnants liste 80 résultats réels — contradiction frontale sur le tout premier écran. |
| Fonctionnel | 4/10 | Pattern B (mauvaise source gagnants/lots) non corrigé sur l'accueil, les rapports et les statistiques malgré un correctif déjà appliqué ailleurs (`gagnants/page.tsx`). `nds-comm`/`nds-front`/`nds-media` ne sont atteignables que via un raccourci caché dans le volet Super Event, pas depuis le menu. `/dashboard/rapports` est une page orpheline qui duplique les mêmes chiffres faux. |
| Données | 3/10 | Preuve directe par SQL : `joueurs.gains` vaut 0 pour les 841 lignes (`select count(*) filter (where gains>0) from joueurs` → 0), alors que `tirages` compte 236 tirages et **162 gagnants distincts réels**. Même chose sur `lots.retire` (0/33) contre `tirages.retire_at` (189 retraits réels). C'est l'axe le plus sévèrement démontré de tout l'audit. |
| Engagement | 6/10 | Page « Contrôle » (auto-diagnostic, 15 contrôles, ex. « 16 Pros sans compte de connexion ») et badge d'alarme « 44 à relancer » cohérent entre la Sidebar et `/dashboard/gagnants` (vérifié, mêmes 44 des deux côtés) montrent un outil pensé pour boucler le travail. Mais la confiance quotidienne est minée par les chiffres faux de l'accueil. |
| Attractivité | 7/10 | Interface B2B propre, dense sans être surchargée, cohérente écran à écran (captures `desktop__dashboard*.png`). Rien d'exceptionnel mais rien de disqualifiant visuellement. |
| Accessibilité | 5/10 (partiellement vérifié) | Les `<img>` de `nds-front`/`nds-comm` ont bien un `alt` (vérifié ligne par ligne, un premier grep multi-lignes avait donné un faux positif). Tableaux denses (Prospection, Gagnants, Stock des lots) en 10–12.5px — à la limite du confortable. Pas de test clavier ni de contraste outillé, pas de Lighthouse exécuté (voir non-vérifié) → note prudente. |
| Technique | 3/10 | **Aucune authentification** sur `/dashboard/*` : pas de `middleware.ts`, `app/dashboard/layout.tsx` ne vérifie aucune session, le dashboard tourne en clé anonyme Supabase (`lib/supabase.ts`). Vérifié : `curl http://localhost:3000/dashboard` renvoie 200 et le HTML complet sans aucune redirection. Pattern F (token jamais rafraîchi) retrouvé **non corrigé** sur `admin-commandes-animation.html` malgré la mention « corrigé le 27-28/08 » dans `patterns-bugs-connus.md`. |

---

## Corrections priorisées

### P0 — bloquant / faux

**P0-1. Page d'accueil (et 3 autres écrans) affichent 0 gagnant alors qu'il y en a 162**
- Fichiers : `admin/app/dashboard/page.tsx:109,118` ; `admin/app/dashboard/rapports/page.tsx:13` ;
  `admin/app/dashboard/joueurs/page.tsx:65` ; `admin/app/dashboard/statistiques/page.tsx:333,339`.
- Cause racine : Pattern B (`patterns-bugs-connus.md`) — lecture de `joueurs.gains`, colonne jamais
  alimentée. Le commentaire de `lib/dashboard.ts:301` le confirme explicitement (« 0 lignes > 0 vérifié en
  base ») et le correctif a déjà été fait sur `/dashboard/gagnants`, mais **pas** sur ces 4 écrans.
- Preuve SQL (vérifié) : `select count(*) filter (where gains>0) from joueurs` → **0** sur 841 lignes ;
  `select count(distinct joueur_id) from tirages` → **162**.
- Capture : `desktop__dashboard.png` (« 841 … 0 gagnants ») vs `desktop__dashboard_gagnants.png`
  (« 80 résultats »).
- Correctif : remplacer `joueurs.filter(j => j.gains > 0).length` par un comptage sur `tirages`
  (gagnants distincts, statut ≠ annulé), comme déjà fait dans `fetchAllGagnants` / la page Gagnants.

**P0-2. Même page d'accueil : « 0 / 33 lots utilisés » alors que 189 ont été retirés**
- Fichier : `admin/app/dashboard/page.tsx:115,123`.
- Cause racine : même Pattern B, lecture de `lots.retire` (table `lots`, pas pertinente ici puisque NDS
  passe par des partenaires) au lieu de `tirages.retire_at`.
- Preuve SQL (vérifié) : `lots` → 33 lignes, 0 à `retire=true` ; `tirages` → 189 à `retire_at` non nul.
- Correctif : même source que P0-1, `tirages` filtrée par `retire_at is not null`.

**P0-3. Dashboard SA Next.js entièrement sans authentification**
- Fichiers : `admin/app/dashboard/layout.tsx` (aucune vérification de session), absence de
  `middleware.ts` à la racine, `admin/lib/supabase.ts` (clé anonyme `sb_publishable_…`).
- Vérifié localement : `curl -s http://localhost:3000/dashboard` → code 200, page complète rendue
  (« Flowin Dashboard »), aucune redirection vers une page de connexion. Contrairement au legacy
  (`admin-connexion.html` + `flowin_admin_session`), aucun équivalent n'existe pour le dashboard Next.
- **Supposé** (non vérifiable depuis cette session) : une protection Vercel (mot de passe de déploiement)
  pourrait compenser en prod réelle — à confirmer par Romain, car le code applicatif, lui, n'a aucune
  barrière.
- Correctif : ajouter un vrai contrôle d'accès (middleware Next vérifiant une session Supabase
  `authenticated`, ou a minima un gate identique à `admin-connexion.html`) avant d'exposer 841 fiches
  CRM nominatives (email, tél.) et les données financières (bons de commande, sponsoring).

**P0-4. `admin-commandes-animation.html` : token de session jamais rafraîchi (Pattern F, régression)**
- Fichier : `admin/public/admin-commandes-animation.html:85-97`.
- `patterns-bugs-connus.md` classe ce fichier comme « corrigé le 27-28/08 » pour le Pattern F. Vérifié
  aujourd'hui : `grep -L "_authRefresh\|refresh_token" …` le liste comme **toujours dépourvu** du
  mécanisme. Le fichier lit `access_token` une seule fois à la ligne 86 (`var TOKEN = …`) et ne le
  renouvelle jamais (aucun `setInterval`, aucun `_authRefresh`), contrairement à `facture-nds.html` qui,
  lui, a bien le pattern.
- Impact : la SA travaillant sur cet outil (atteint depuis la Sidebar, groupe « Comm & outils ») sera
  déconnectée en pleine session sans message clair (401 silencieux côté `fetch`).
- Correctif : reporter le mécanisme `_authRefresh()` de `dashboard.html`, déjà appliqué à
  `facture-nds.html` et `bon-commande-nds.html`.

### P1 — gêne forte

**P1-1. Prospection (`/dashboard/prospection`) : liste sans aucune action possible**
- Fichier : `admin/app/dashboard/prospection/page.tsx` — 1 seul `onClick` dans tout le fichier (les
  boutons de filtre), lignes de tableau en `cursor:'default'` (ligne 107), aucun drawer, aucune édition.
- `admin/lib/commercial.ts:143` expose déjà une fonction `updateProspect()` — jamais importée par la page.
- Impact : impossible de marquer un prospect « sans suite » ou de changer sa date de relance depuis
  l'écran dédié ; le texte de la page dit pourtant « un prospect marqué sans suite est un dossier fermé ».
- Correctif : brancher un drawer ou une édition inline sur la ligne, réutilisant `updateProspect()`.

**P1-2. Billets & kit com, Front NDS, Vidéo & média : absents du menu principal**
- Fichiers : `admin/app/dashboard/nds-comm/page.tsx` (184 lignes), `nds-front/page.tsx` (172),
  `nds-media/page.tsx` (198) — pages réelles et substantielles, pas des brouillons.
- Vérifié : aucune entrée dans `components/dashboard/Sidebar.tsx` (comparaison directe avec la liste des
  45 entrées du menu). Seuls points d'accès trouvés : `SuperEventDrawer.tsx:348-350` (section
  « Raccourcis », à faire défiler) et un lien dans `EventDrawer.tsx:727`.
- Forme atténuée du Pattern D : pas totalement orphelines, mais indécouvrables sans ouvrir le bon volet
  et savoir qu'elles existent.
- Correctif : ajouter ces 3 entrées dans le groupe « NDS 2026 » (ou équivalent) de la Sidebar.

**P1-3. `/dashboard/rapports` : page orpheline qui répète les chiffres faux**
- Fichier : `admin/app/dashboard/rapports/page.tsx`.
- Vérifié : `grep -rn "/dashboard/rapports"` dans `app`, `components`, `lib` ne retourne aucune référence
  en dehors du fichier lui-même — Pattern D pur, aucun lien nulle part.
- Double peine : si elle est atteinte par URL directe, elle réaffiche le même bug que P0-1
  (`joueurs.filter(j => j.gains > 0).length`, ligne 13) et P0-2 (`lots.filter(l => !l.retire)`, ligne 18).
- Correctif : soit la relier au menu après correction des chiffres, soit la supprimer si
  `/dashboard/statistiques` la remplace déjà (à trancher par Romain).

**P1-4. « Opérations (vue complète) » : une opération « marque blanche » non distinguée du réel**
- Fichier : `admin/app/dashboard/operations/page.tsx`.
- Capture : `ops_02_modal_maybe.png` — trois cartes affichées côte à côte, dont « Master — Super Event
  (marque blanche) » (`se-master-superevent`) avec 22 commerces mais 0 joueur / 0 billet, visuellement
  identique aux cartes réelles (« Fêtes du haut et moyen pays », « Nuits du Sud 2026 »), sans badge
  « test »/« gabarit ».
- Risque : une SA pressée peut la lire comme une opération réelle au point mort.
- Correctif : badge visuel distinct pour les super events gabarits/marque blanche sans activité réelle.

### P2 — finition

**P2-1. Vocabulaire « Gains » / « Lot » / « Gagnant » non unifié**
- `app/dashboard/joueurs/page.tsx:65` (colonne « Gains »), `app/dashboard/gagnants/page.tsx:114-115`
  (colonnes « Lot », « Valeur »), `app/dashboard/rapports/page.tsx:13,18` (« Gagnants », « Lots
  disponibles ») — même notion, trois mots différents selon l'écran.
- Correctif : choisir un terme canonique (ex. « lot gagné ») et l'appliquer partout.

**P2-2. Champ « Lieu » vide dans le volet Event alors que l'adresse existe ailleurs**
- Capture `modal_10_fiche.png` : fiche « Assurance Charvolin » (volet Event), champ LIEU vide, alors que
  la page Opérations affiche l'adresse complète pour le même partenaire. À clarifier : champ
  réellement distinct (adresse pro ≠ lieu de l'animation) ou lecture manquante — **supposé**, pas
  confirmé en base.

**P2-3. Densité typographique des tableaux (10–12.5px)**
- `prospection/page.tsx`, `gagnants/page.tsx`, `nds-lots/page.tsx` : texte de tableau régulièrement sous
  12px. Pas de mesure de contraste WCAG effectuée, mais à l'œil la taille est limite pour un usage
  prolongé — à vérifier avec un audit Lighthouse/axe dédié.

---

## Ce qui n'a pas pu être vérifié

- **Protection côté hébergement (Vercel)** sur le vrai prod — `flowin-events.vercel.app` injoignable
  depuis cette session (proxy réseau bloqué). Impossible de confirmer si une protection par mot de passe
  Vercel compense l'absence totale d'auth applicative constatée en P0-3.
- **Lighthouse mobile** (Performance/Accessibilité/Bonnes pratiques/SEO) non exécuté — hors budget de
  cette session, outil non lancé.
- **Connexion SA** : non testée, aucun identifiant fourni, aucun compte créé (conforme à la consigne).
  De fait, la question est partiellement sans objet pour `/dashboard/*` Next.js puisqu'aucune page de
  connexion n'y mène (voir P0-3) ; seuls les outils HTML legacy (`admin-connexion.html`) ont un vrai login,
  non testé non plus faute d'identifiants.
- **CLS mesuré rigoureusement** : seules des captures post-`networkidle` ont été prises (21 pages,
  desktop + mobile) ; aucun outil de mesure de layout-shift n'a été utilisé, donc un saut très bref au
  tout premier rendu ne serait pas visible dans ces captures.
- **QR codes** : génération confirmée dans le code (`components/dashboard/Diffusion.tsx`), mais aucun QR
  n'a été réellement scanné avec un lecteur pour vérifier l'URL cible.
- **Liens email préremplis** (`mail-gagnant.js`, `mailPartenaireUrl`) : non ouverts/inspectés champ par
  champ (destinataire, sujet, corps) faute de temps dans le budget imparti.
- **`ModalGererLots`** : localisé dans le code (`components/operations/BlocsOperations.tsx:217-221`,
  bouton « ⚙️ Gérer les lots ») mais son déclencheur n'a pas été retrouvé dans l'UI testée (dépend
  probablement d'une condition type partenaire/offre non réunie sur les données parcourues) — ouverture/
  fermeture non testée pour ce composant spécifique, contrairement à `JoueurDrawer`/`EventDrawer` qui
  l'ont été avec succès.
- **Couverture exhaustive des ~45 entrées de menu** : 21 pages testées avec Playwright (captures +
  erreurs console) sur les 45 de la Sidebar ; les pages non visitées (ex. `btob-prospects`, `crm-retours`,
  `wizard-event`, `wizard-pro`, `wizard-super-event`, `cgv`, `nds-packs`, `banques`, `jeux`,
  `demandes-rattachement`, `maintenance`) n'ont été vérifiées que par lecture de code (onClick/Pattern A),
  pas par capture d'écran.
- **Tutoiement/vouvoiement** : vérifié uniquement sur `CONTACT_PARTENAIRE`/signature email (coordonnées
  réelles, non inventées — conforme à la règle 5) ; pas d'audit systématique du vouvoiement du pro sur
  tous les écrans SA.
- **Real Safari iOS** : tests faits uniquement en émulation Chromium (viewport 390×844), pas sur un vrai
  moteur WebKit — pertinent surtout pour `dashboard.html` legacy (vanilla JS), hors périmètre direct de
  cet audit Next.js mais signalé pour information.

---

## Points positifs vérifiés (à ne pas perdre dans les corrections)

- Carte du super event (`/dashboard/nds-carte`) : Leaflet fonctionnel, « 22 placés sur 22 · 0 à placer »,
  pins réels affichés (capture `desktop__dashboard_nds-carte.png`).
- Drawers `JoueurDrawer` et `EventDrawer` : ouverture **et** fermeture testées avec succès, aucun volet
  resté coincé (captures `drawer_02/03`, `modal_10/20`).
- Page « Contrôle » : véritable outil d'auto-diagnostic (15 contrôles dont « Pros sans compte de
  connexion », « Events sans pro rattaché ») — bonne pratique à conserver et à étendre (par ex. y ajouter
  un contrôle pour P0-1/P0-2).
- Badge d'alarme « 44 à relancer » cohérent entre la Sidebar et `/dashboard/gagnants` (même valeur des
  deux côtés, vérifié).
- Palette et typographie conformes à `DESIGN-TOKENS-flowin.md`.
