# Audit transversal — patterns connus + cohérence globale
Flowin Events — 07/11/2026 — Agent "patterns connus" (Phase 1)

Méthode : chaque constat ci-dessous est soit (a) le résultat littéral d'une commande grep/SQL donnée dans
`docs/patterns-bugs-connus.md`, soit (b) une requête SQL en lecture seule sur le projet Supabase
`ywcqtupgoxfzkddqkztk`, soit (c) une lecture directe du code source avec chemin + ligne. Aucune supposition
n'est présentée comme un fait sans la preuve qui l'accompagne.

---

## PARTIE 1 — Les 13 patterns connus, un par un

### Pattern A — Liste/tableau sans clic
**État : pas de nouvelle occurrence. Les correctifs cités tiennent.**

- `grep -rl "<table" admin/app admin/components` → 17 fichiers. Sur ces 17, 5 ont 0 `onClick` :
  `admin/app/pro/super/[event]/page.tsx`, `admin/app/pro/super/page.tsx`,
  `admin/components/dashboard/AutresActivites.tsx`, `admin/components/pro/ListeFactures.tsx`,
  `admin/components/pro/SondageLandingPro.tsx`. Lecture de chacun : ce sont des tableaux de **lecture pure**
  (scores, stats, récap) sans fiche à ouvrir, ou (cas `pro/super/page.tsx` ligne 167) la navigation se fait
  par un `<Link>` dans la cellule, pas par un `onClick` sur la ligne — fonctionnel, juste un style différent.
  Aucun faux tableau mort trouvé.
- Variante "bouton `cursor:pointer` sans `onClick`" (24/08) : recherche ciblée (script Python) de tout
  `style={{...cursor:'pointer'...}}` inline sans `onClick`/`<Link>`/`href`/`<label>` à proximité, sur
  `admin/app` + `admin/components` entiers. 4 candidats bruts, les 4 vérifiés manuellement : tous ont en
  réalité un `onClick` sur la balise (hors de la fenêtre de recherche) ou sont un `<select>` (curseur
  pointeur légitime sans handler). **0 cas réel.**
- `EventDrawer.tsx` → onglet Export (ligne 737-754) : les 3 items passent toujours par `telechargerCsv()`
  avec un vrai `onClick={item.fn}` et génèrent un CSV réel en mémoire. Le correctif du 24/08 tient, pas de
  régression.

### Pattern B — Mauvaise source de données pour les gagnants/lots
**État : régression active, non détectée avant cet audit — P0.**

Preuve SQL (lecture seule) :
```sql
select count(*) as joueurs_gains_gt0, (select count(*) from tirages) as total_tirages
from joueurs j where j.gains > 0;
-- résultat : joueurs_gains_gt0 = 0 ; total_tirages = 236
```
La colonne `joueurs.gains` est à **0 pour 100 % des joueurs**, alors que `tirages` contient 236 lignes réelles.
Exactement le symptôme décrit par le pattern — sauf que le correctif n'a été appliqué qu'à
`/dashboard/gagnants` et `EventDrawer` → onglet Lots. `joueurs.gains` est encore lu comme source de vérité
dans :
- `admin/app/dashboard/page.tsx:109` — KPI d'accueil SA "X gagnants" (toujours 0)
- `admin/app/dashboard/rapports/page.tsx:13` — stat "Gagnants" (toujours 0)
- `admin/app/dashboard/joueurs/page.tsx:65` — colonne "Gains" du CRM Joueurs (toujours 0 pour tout le monde)
- `admin/app/dashboard/statistiques/page.tsx:333,339` — surlignage + colonne gains (jamais surligné, jamais de valeur)
- `admin/components/dashboard/JoueurDrawer.tsx:140` — `FieldRow label="Gains" value={j.gains ?? 0}` dans
  l'onglet Infos, **alors que le même drawer** charge par ailleurs les vrais tirages du joueur via
  `fetchJoueurTirages`/`fetchJoueurTicketsGains` (ligne 40-41, correctement basés sur `tirages`) — les deux
  onglets du même tiroir se contredisent.
- `admin/app/dashboard/operations/page.tsx` et `[id]/OpsDetailClient.tsx` utilisent `r.gains`/`se.gains`
  (colonnes à vérifier séparément — proviennent probablement d'un RPC, pas de `joueurs.gains` ; non
  incriminés ici).

Correctif : remplacer partout `j.gains > 0` / `j.gains` par un comptage réel sur `tirages` (jointure ou RPC),
comme déjà fait pour `/dashboard/gagnants`.

### Pattern C — `joueurs.events` (array containment) au lieu de `participations`
**État : pas de régression ; les deux usages "pas corrigés" documentés sont toujours là, inchangés.**

`grep -rn "contains('events'\|\.events ??" admin/lib admin/app admin/components` :
- `admin/lib/joueurs.ts:19,29` (`checkDuplicate()`) — toujours `.contains('events', [eventId])` pour
  l'anti-doublon email/tel. Toujours documenté comme non corrigé (risque anti-doublon en jeu réel).
- `admin/lib/pro.ts:47` (`fetchProDashboard()`) — toujours `.contains('events', [eid])` comme requête
  principale, mais une **mitigation existe déjà** (lignes 55-63) : les joueurs manquants (dont le tableau
  `events` n'a pas pu être mis à jour en anonyme) sont rattrapés via `participations`. Reste un correctif
  partiel, pas la bascule complète documentée comme souhaitable.
- `admin/app/pro/ProClient.tsx` (`evJoueurs`, cité dans le document) : **ce fichier n'existe plus** — la
  refonte du 16/09 (voir `REFERENTIEL-fonctionnel-flowin.md` §7) a éclaté l'espace pro en
  `/pro/operation`, `/pro/donnees`, etc. Le document `patterns-bugs-connus.md` référence un fichier obsolète ;
  à mettre à jour (P2, hygiène de doc).

### Pattern D — Page orpheline jamais reliée
**État : pas de nouvelle orpheline détectée.**

Comparaison de chaque `admin/public/*.html` (racine) contre toutes les références dans
`admin/app`, `admin/components`, `admin/lib`, `admin/public`, `docs` : tous les fichiers ont au moins une
référence. Les 3 ex-orphelines majeures (`kit-digital/index.html`, `facture-nds.html`,
`bons-commande-liste.html`) restent toutes atteignables via les drawers SA (`SuperEventDrawer.tsx`,
`EventDrawer.tsx`, `PartenaireDrawer.tsx`) ou la Sidebar. `nds-partenaire-presentation.html` et
`flowin-partenaire-presentation.html` sont bien listées dans `admin/lib/outilsCommerciaux.ts` (source de
`/dashboard/landing-page`). `bon-achat-template.html`, dont le retrait était annoncé (référentiel §8, P4),
a bien été supprimé du dépôt — vérifié.
Les 3 fichiers à 1 seule référence (`admin-app.html`, `joueur-app.html`, `pro-app.html`) sont les
`start_url` de PWA manifests (legit, pas des pages de menu) ; `login-test.html` est un outil de dev listé
comme tel dans l'inventaire — pas des orphelines au sens du pattern.

### Pattern E — RLS sans policy anon/public
**État : les 4 nouvelles tables trouvées ne sont PAS des occurrences du pattern — fausses alertes qualifiées.**

Requête SQL fournie par le document, exécutée telle quelle sur tout le schéma `public` :
```
commandes_animation_journal | anon_ok=false
demandes_rappel             | anon_ok=false
factures_animation          | anon_ok=false
pros_rib                    | anon_ok=false
```
Vérification approfondie (policies détaillées + code appelant) : les 4 tables ont des policies `authenticated`
qui exigent un vrai `auth.uid()` (`est_super_admin()` ou appartenance du pro via `auth_id`). Ce n'est **pas**
le bug du pattern (un dashboard anonyme qui a besoin d'une lecture publique et n'a pas la policy) : c'est une
protection **volontaire** de données sensibles (RIB bancaire, factures). Le code appelant gère explicitement
le cas "pas de session" avec un repli UX propre :
- `admin/components/pro/CoordonneesBancaires.tsx:43-44` → `supabase.auth.getSession()` puis état
  `'sans-session'` → message "connectez-vous avec votre compte pro" + lien `/pro/connexion`.
- `admin/lib/commandesPro.ts:91-92` → même garde, état `'sans-session'`.

Pas de régression sur la correction d'origine : `tirages` a toujours sa policy `tirages_anon_select` (SELECT,
rôle `anon`), vérifié (`select policyname,cmd,roles from pg_policies where tablename='tirages'`).

### Pattern F — Token de session non rafraîchi
**État : 1 nouvelle occurrence, non documentée — P1.**

`grep -rl "flowin_admin_session" admin/public --include="*.html"` → 10 fichiers ; sur ces 10,
`grep -L "_authRefresh\|refresh_token"` en isole **1** : **`admin/public/admin-commandes-animation.html`**.
Lecture du fichier (lignes 85-86, 116) : le token est lu une seule fois au chargement
(`JSON.parse(localStorage.getItem('flowin_admin_session'))`) et jamais renouvelé ; en cas de 401 le code
redirige proprement vers la reconnexion (ligne 116) mais ne tente jamais un refresh silencieux comme
`dashboard.html` (`_authRefresh()`, toutes les 45 min). Conséquence concrète : si Romain reste sur l'écran
"Commandes Animation" plus longtemps que la durée de vie du token (généralement 1h côté Supabase Auth), il
est déconnecté alors que sa session `flowin_admin_session` (rafraîchie ailleurs, dans un autre onglet
`dashboard.html`) serait pourtant valide. Ce fichier n'apparaît dans AUCUNE des deux listes du document
(ni "corrigé le 27-28/08", ni "déjà présent") — c'est un outil plus récent qui n'a jamais reçu le mécanisme.
Correctif : copier le bloc `_authRefresh()` de `dashboard.html` (ligne ~15182) dans ce fichier.

### Pattern G — 3 systèmes dashboard jamais fusionnés (méta)
**État : toujours vrai, pas d'action requise au-delà de la méthode appliquée dans cet audit** (recherche
systématique dans `admin/public` + `admin/app` + `admin/components` pour chaque pattern ci-dessus, pas
seulement une des 3 couches).

### Pattern H — `lib/types.ts` désynchronisé du composant réel
**État : conforme au document pour les champs morts ; tableau quiz/quizmaster/quizsolo partiellement
amélioré depuis — document à rafraîchir (P2).**

- `voteSections`, `tombolaChamps` : toujours déclarés dans `lib/types.ts` (lignes 24, 42), toujours lus
  **nulle part** (`grep -rn "voteSections\|tombolaChamps" admin/app admin/components` → aucun résultat hors
  déclaration). Pas de régression, juste toujours mort.
- `quizCustomQuestions` : déjà marqué `@deprecated` dans le code lui-même (commentaire ligne 30) — cohérent.
- Tableau mis à jour par lecture directe des 3 `*Client.tsx` :

  | Clé cfg | quiz | quizmaster | quizsolo |
  |---|---|---|---|
  | `customQuestions` | ✅ | **✅ (corrigé depuis la rédaction du doc — ligne 28 de `QuizmasterClient.tsx`)** | ✅ |
  | `quizNbQuestions` | ✅ | ✅ | ✅ |
  | `quizTimer` | ✅ | ❌ jamais lu (inchangé) | ❌ toujours `const timerSec = 30` en dur (ligne 30 de `QuizsoloClient.tsx`, inchangé) |

  `quizmaster` lit désormais `cfg.customQuestions` (`QuizmasterClient.tsx:28`) — ce n'était plus vrai au
  moment de cet audit, mais le document patterns-bugs-connus.md n'a pas été mis à jour pour le refléter.

### Pattern I — Bornage de date oublié sur une seule CTE
**État : les 2 corrections documentées tiennent. 1 nouvelle occurrence trouvée, non documentée — P0, chiffre
public probablement faux.**

- `super_event_rapport_points()` (CTE `bo`) et `super_event_bonus_resultats()` (CTE `base`) : lecture complète
  via `pg_get_functiondef` — les deux CTE citées comme corrigées le 29/08 portent toujours leur bornage
  (`r.jour between se.date_d and se.date_f`). Pas de régression.
- Balayage élargi : liste de toutes les fonctions dont le corps mentionne `date_d` et `date_f`
  (22 fonctions), lecture complète des 10 plus volumineuses (`super_event_rapport`, `station_tracking`,
  `super_event_chiffres`, `controle_incoherences`, `super_event_optin`, `super_event_demographie`,
  `operation_stats`, `super_event_engagement`, `super_event_bonus`, `super_event_sondage`,
  `super_event_repondants`, `nds_export_joueurs_uniques`). Toutes bornent systématiquement chaque CTE
  touchant `participations`/`visites`/`se_reponses`, **sauf une** :

  **`super_event_rapport()`, bloc `meilleurs_joueurs`** (le "Top joueurs" du rapport global NDS 2026) :
  ```sql
  (SELECT count(*) FROM tirages g WHERE g.joueur_id = p.joueur_id AND g.super_event_id = p_se) AS gains
  ```
  Aucun bornage par `date_d`/`date_f`, alors que la CTE englobante (`participations p ... BETWEEN c.date_d
  AND c.date_f`) l'est. Vérifié en base :
  ```sql
  select se.id, se.date_d, se.date_f, count(*) as tirages_hors_dates
  from tirages t join super_events se on se.id = t.super_event_id
  where (t.created_at at time zone 'Europe/Paris')::date not between se.date_d and se.date_f
  group by se.id, se.date_d, se.date_f;
  -- se-nds-2026 | 2026-07-09 | 2026-07-18 | tirages_hors_dates = 215
  ```
  **215 des 236 tirages existants (91 %) sont hors des dates officielles du festival** (répartition par jour :
  rafales de 15 à 76 lignes les 20/07, 28/07, 31/07, 03/08 et même 26/10 — signature de données de test,
  méthode Pattern K). Le "gains" affiché dans le Top joueurs du rapport public compte donc presque
  exclusivement du test comme si c'était réel — exactement le type d'écart silencieux (321 vs 302) que le
  pattern décrit. Correctif : ajouter `AND (g.created_at at time zone 'Europe/Paris')::date BETWEEN c.date_d
  AND c.date_f` à cette sous-requête.
  (`super_event_chiffres()`, lui, expose au contraire un modèle exemplaire : `ecarts.parties_hors_bornes`
  calculé et publié explicitement plutôt que mélangé en silence — à prendre comme référence pour corriger
  `super_event_rapport`.)

### Pattern J — Page orpheline rebranchée sans vérifier le style
**État : le cas documenté (29/08, `/dashboard/operations`) semble résolu ; pas de nouvelle occurrence
trouvée par le test de densité de style.**

`/dashboard/operations` est de nouveau un lien actif de la Sidebar (`Sidebar.tsx:160`, "Opérations (vue
complète)"), alors que le document dit qu'il avait été retiré le 29/08 en attendant restylage. Lecture de
`admin/app/dashboard/operations/page.tsx` (83 lignes) et `admin/app/dashboard/operations/[id]/OpsDetailClient.tsx`
(302 lignes, la vraie page de détail) : **0 couleur hexadécimale en dur**, tout passe par les classes
`sa-*`/variables CSS (32 références `sa-*` sur 302 lignes) — cohérent avec le système partagé, pas de palette
one-off violette/rose comme avant. Le rebranchement a bien été accompagné du restylage annoncé comme
condition.
Test élargi : densité `style={{` vs classes `sa-*` sur les 36 pages liées depuis la Sidebar + recherche de
pages à forte densité de couleurs hexadécimales propres (plus de 3 couleurs distinctes) — aucune page ne
présente de palette étrangère au système (`landing-page`, `demandes-rattachement`, `pros` utilisent les
mêmes teintes de badge statut vert/ambre/rouge réutilisées partout, conformes à la charte).

### Pattern K — Distinguer données de test de données réelles
**État : le principe du pattern (répartition par heure/jour) a été réappliqué dans cet audit et a servi à
qualifier la découverte du Pattern I ci-dessus — la masse de `tirages` hors-dates (215/236) est bien un
artefact de test, pas une anomalie de retrait, confirmé par la répartition en rafales (15 à 76 lignes par
jour, jours non consécutifs) plutôt qu'un étalement irrégulier compatible avec un usage réel.**

### Pattern L — Écran « par pro » délégué à un composant d'une seule opération
**État : correctif tenu, pas de régression.**

`grep -rln "PartenaireDrawer" admin/app/pro admin/components/pro` → seul `GagnantsClient.tsx` le mentionne,
et uniquement dans un **commentaire** expliquant la correction du 14/09 (ligne 253), pas un import réel —
confirmé par `grep -n "PartenaireDrawer"` ciblé. `fetchOperationsPro` (`lib/operations.ts`) est bien le point
d'entrée de tous les écrans "par pro" actuels (`pro/page.tsx`, `pro/operation`, `pro/donnees`,
`pro/historique`, `pro/compte`, `pro/crm/[id]`, `dashboard/crm-pro`, `FicheOperationPro.tsx`,
`HistoriqueClient.tsx`, `GagnantsClient.tsx`, `BlocsOperations.tsx`) — règle respectée partout.

### Pattern M — Retour de RPC lu avec la mauvaise forme / mauvais paramètre
**État : correctif tenu, confirmé par les types réels des deux RPC.**

`pg_get_function_result` : `verifier_pin_pro` → `boolean`, `valider_lot` → `jsonb`. Les deux seuls appelants
actuels (`admin/public/lot.html:443,465` et `admin/components/pro/GagnantsClient.tsx:267,273`) lisent bien
`verifier_pin_pro` comme un booléen strict (`pinOk !== true`) et `valider_lot` comme un objet
(`{ok, raison, avertissement}`), dans cet ordre (PIN vérifié d'abord, puis validation par token seul — jamais
l'inverse). Conforme au chemin documenté comme correct.

---

## PARTIE 2 — Cohérence transversale

### Build / typecheck
- `npx tsc --noEmit` : **0 erreur**. ✅
- `npm run build` : `✓ Compiled successfully` (compilation et vérification de types OK), **mais l'export a
  échoué** sur `/dashboard` (`Error: Cannot find module './chunks/vendor-chunks/next.js'`) pendant la
  génération statique. Cause identifiée : un `next dev` tourne en permanence sur cette même machine
  (processus vus : `next dev` + `next-server`, PID 270, actif depuis le début de session) et partage le même
  dossier `.next` que ce `npm run build` — conflit d'écriture classique dev/build sur le même répertoire de
  sortie, pas une erreur de code. **Ce point n'a donc pas pu être vérifié de façon concluante** dans cet
  environnement (je n'ai pas arrêté le serveur dev, comme demandé) ; seul le typecheck (propre) constitue un
  signal fiable. À revérifier avec un `npm run build` isolé (dossier `.next` dédié ou aucune session dev
  concurrente).

### npm audit — vulnérabilités au-delà de next@14.2.29
`npm audit` dans `admin/` : **1 critique, 6 hautes** (7 au total), pas seulement next.

| Paquet | Version installée | Gravité | Nature |
|---|---|---|---|
| `next` | 14.2.29 | **Critique** | Déjà connu — RCE non authentifiée (Image Optimization AVIF/SVG), SSRF Server Actions, DoS, cache poisoning... (liste longue, cumul de CVE non patchées) |
| `postcss` | 8.4.31 | Haute | XSS via `</style>` non échappé, divulgation de fichiers via `sourceMappingURL` |
| `source-map-js` | 1.2.1 | Haute | DoS boucle d'événements |
| `zod` | 3.25.76 | Haute | Épuisement mémoire sur collections contraintes surdimensionnées |
| `nanoid` | 3.3.12 | Haute | Boucle infinie sur générateurs non sécurisés |
| `puppeteer-core` | 25.1.0 | Haute | (dépendance transitive vulnérable) |
| `chromium-bidi` | 16.0.1 | Haute | (dépendance transitive vulnérable) |

Point notable : `puppeteer-core`/`chromium-bidi` sont des **dépendances de production** déclarées dans
`package.json` (pas seulement dev), donc potentiellement exécutées côté serveur en prod (génération de
visuels/PDF) — surface d'attaque réelle, pas juste un confort de build. Correctif : `npm audit fix`
(avec test de non-régression du build) puis mise à jour ciblée de `next` vers un correctif de sécurité
(bloqué par la contrainte "versions connues" du projet, à planifier avec Romain compte tenu du risque RCE).

### Fichiers protégés (`NDS2026Client.tsx`, `nds2026Design.ts`) — git log du dernier mois
**1 modification de fond, hors du cadre "surcharges `.ndsbody` en `!important`" défini par la règle 4 — mais
explicitement autorisée par Romain dans le message de commit.**

`git log -p --since="1 month ago"` sur les deux fichiers → commit `5a0b32d` (29/10, "Incohérences de
l'audit : NDS2026, pictogrammes, tirage global, joueur déjà connu (#71)"). Le diff touche
`NDS2026Client.tsx` pour :
- déplacer des lectures de `window`/tirage aléatoire du rendu vers `useEffect` (fix d'hydratation SSR),
- préfixer des clés React dupliquées (`fly-`, `cf-`),
- remplacer des émojis par des pictogrammes.

Ce ne sont pas des règles `!important` scopées `.ndsbody` (seule exception prévue par CLAUDE.md) — ce sont
de vraies corrections de logique dans le fichier "logique maître" protégé. Le message de commit note
explicitement *"Autorisé par Romain : tout point d'incohérence relevé est corrigé."* : donc une dérogation
ponctuelle consciente, pas un accroc d'une session qui aurait ignoré la règle. **Mais CLAUDE.md ne documente
aucune exception "bugfix avec accord explicite"** — à clarifier (P2) : soit on consigne cette dérogation
comme précédent accepté, soit on rappelle qu'elle ne vaut que pour ce cas précis, pour qu'une session future
ne généralise pas à tort ("Romain a dit oui une fois, donc je peux retoucher ce fichier librement").
Aucune autre modification des deux fichiers sur la période.

### Miroir du dashboard SA — MD5
`md5sum admin/public/dashboard.html admin/public/static/dashboard.html` → **identiques**
(`9db2761dd46ca8f4b008f56402e3d768`). ✅ Conforme à la règle 2 de CLAUDE.md.

### Vocabulaire
- "lot" / "gain" / "tirage" : distinction cohérente et stable dans tout le dépôt (lot = l'article en
  catalogue, gain = une ligne de tirage gagnée, tirage = l'action/le mécanisme) — pas d'incohérence trouvée,
  "cadeau" n'est utilisé nulle part en UI.
- "pro" / "partenaire" / "commerçant" : "commerçant" n'apparaît dans aucun libellé d'interface ; "partenaire"
  désigne systématiquement la fiche commerce/sponsor (logo, contrat), "pro" le compte opérateur — distinction
  stable, pas de confusion trouvée en UI (le libellé Sidebar "Partenaires (fiche commerce)" explicite même la
  nuance).
- "event" / "jeu" / "animation" : 1 écart mineur — `admin/app/demo/DemoClient.tsx:29`, libellé `'Event offert'`
  (mot anglais au lieu d'"Animation offerte"), sur une page de démo. Impact faible (P2).
- Tutoiement / vouvoiement : recherche de tournures en "tu/ton/ta/tes" dans les libellés JSX de `admin/app/pro`
  et `admin/components/pro` → aucune occurrence. Cohérent avec la règle "le pro est vouvoyé partout" (à
  l'inverse du joueur, tutoyé dans `mail-gagnant.js`).

### Règles métier CLAUDE.md — vérification automatique
- Genre dans les formulaires : seul point d'entrée partagé `ParcoursChampsStandard.tsx` (— / Homme / Femme),
  confirmé aussi dans le fichier protégé `NDS2026Client.tsx` (même 3 options, ligne 1007). Aucune occurrence
  de "Autre" comme option de genre trouvée nulle part dans le dépôt (`grep -rn "'Autre'" admin/app
  admin/components` ne renvoie que des usages "secteur d'activité" et "source de découverte", sans rapport
  avec le genre).
- Données inventées : le SIRET/IBAN/BIC/TVA en dur dans `facture-nds.html`, `bon-commande-nds.html` et
  `admin/lib/documentsAnimation.ts` sont les coordonnées légales d'OPConsult/BAITA EURL **elle-même**
  (l'émetteur), identiques dans les 3 fichiers — ce n'est pas une donnée fabriquée pour un tiers (pro,
  partenaire, joueur), donc hors du périmètre de la règle 5. Aucune coordonnée inventée trouvée pour un tiers
  dans les fichiers inspectés.

---

## Notes /10 (axes couverts par cette mission, éléments à charge uniquement — les autres agents de profil
complètent les axes Design/Ergonomie/Attractivité non traités ici)

| Axe | Note | Justification principale |
|---|---|---|
| Données | **3/10** | `joueurs.gains` à 0 pour tout le monde en prod alors que 236 tirages existent (Pattern B, régression P0) ; `super_event_rapport().meilleurs_joueurs.gains` compte 215 tirages de test comme réels (91 % du total, Pattern I, P0) |
| Technique | **5/10** | Typecheck propre, mais 1 vulnérabilité critique + 6 hautes en dépendances (dont 2 en prod réelle), build export non vérifiable dans cet environnement, 1 nouvelle régression Pattern F non documentée |
| Fonctionnel (patterns connus) | **7/10** | 11 des 13 patterns tiennent sans régression ; 2 montrent une occurrence nouvelle non triviale (B élargi, I nouveau cas), bien identifiées et bornées |
| Cohérence transversale (vocabulaire, protection fichiers, miroir) | **8/10** | Vocabulaire et règles métier globalement respectés ; MD5 miroir OK ; 1 dérogation consciente mais non documentée sur un fichier protégé |

---

## Liste priorisée

### P0
1. **`joueurs.gains` toujours à 0 en prod, lu comme source de vérité à 5 endroits** (Pattern B élargi) —
   `admin/app/dashboard/page.tsx:109`, `admin/app/dashboard/rapports/page.tsx:13`,
   `admin/app/dashboard/joueurs/page.tsx:65`, `admin/app/dashboard/statistiques/page.tsx:333,339`,
   `admin/components/dashboard/JoueurDrawer.tsx:140`. Cause : colonne jamais alimentée par le vrai système de
   tirage (confirmé : 0 lignes avec `gains>0` sur toute la table, alors que `tirages` en a 236). Correctif :
   remplacer par un comptage réel sur `tirages` partout, comme déjà fait pour `/dashboard/gagnants`.
2. **`super_event_rapport()` → `meilleurs_joueurs.gains` compte des tirages hors festival** (Pattern I,
   nouvelle occurrence) — RPC `super_event_rapport`, sous-requête sur `tirages` sans bornage de date. Preuve :
   215/236 tirages (91 %) sont hors des dates `2026-07-09`→`2026-07-18`, en rafales caractéristiques de test.
   Correctif : ajouter le bornage `BETWEEN c.date_d AND c.date_f` sur cette sous-requête, comme le reste de la
   fonction.
3. **1 vulnérabilité critique (next, RCE non authentifiée incluse) + 6 hautes** dans les dépendances — dont 2
   (`puppeteer-core`, `chromium-bidi`) en dépendance de production réelle. Correctif : `npm audit fix` puis
   plan de montée de version de `next` avec Romain (risque sécurité réel sur un déploiement public).

### P1
4. **`admin-commandes-animation.html` n'a pas le mécanisme de rafraîchissement de token** (Pattern F, nouvelle
   occurrence non documentée) — ligne 85-86 : lecture unique du token au chargement, pas de `_authRefresh()`.
   Correctif : reprendre le bloc de `dashboard.html` (ligne ~15182).
5. **`npm run build` n'a pas pu être validé de façon concluante** dans cette session (conflit avec un `next
   dev` concurrent partageant `.next`) — à revérifier dans un environnement isolé avant tout déploiement basé
   sur cette session.

### P2
6. Document `docs/patterns-bugs-connus.md` désynchronisé en 2 points : référence `admin/app/pro/ProClient.tsx`
   (fichier supprimé depuis la refonte du 16/09) pour le Pattern C ; tableau du Pattern H obsolète sur
   `quizmaster`/`customQuestions` (corrigé depuis, mais pas noté). À mettre à jour pour rester fiable comme
   checklist future.
7. Dérogation à la règle "fichiers protégés" (CLAUDE.md règle 4) sur `NDS2026Client.tsx`, commit `5a0b32d`
   (29/10) : modifications de logique réelle (pas seulement `.ndsbody` `!important`), explicitement
   autorisées par Romain dans le message de commit, mais la règle elle-même ne mentionne pas d'exception
   "bugfix avec accord". À clarifier pour éviter une généralisation abusive par une session future.
8. `admin/app/demo/DemoClient.tsx:29` — libellé `'Event offert'` (mot anglais) au lieu d'« Animation offerte »,
   incohérence de vocabulaire mineure sur une page de démonstration.

## Ce qui n'a pas pu être vérifié
- `npm run build` jusqu'à son terme (export statique) — conflit d'environnement avec un `next dev` concurrent,
  non résolu volontairement (consigne de ne pas arrêter le serveur dev partagé).
- Les 12 autres RPC listées comme candidates au Pattern I n'ont pas toutes été relues ligne à ligne dans le
  détail au-delà de la vérification de bornage par CTE (vérification structurelle, pas une relecture complète
  de chaque expression) — un passage plus fin reste possible mais n'a rien montré de plus dans le temps
  disponible.
- Le reste du périmètre de l'AUDIT-PROMPT (QR scannés réellement, Lighthouse, liens email générés,
  drawers ouverts/fermés un par un) relève des agents de profil (SA/Pro/Joueur), pas de cette mission
  transversale "patterns connus".
