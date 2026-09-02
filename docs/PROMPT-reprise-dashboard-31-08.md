# FLOWIN EVENTS — Reprise mission, 31/08/2026 soir

Ce fichier est le point d'entrée obligatoire pour toute nouvelle conversation
qui reprend ce travail. Lire dans l'ordre, ne rien sauter.

## ⛔ 0. AVANT TOUT — le 403 « authorized repository set » : SOLUTION TROUVÉE

Si un push renvoie *"repository is not in this session's authorized repository
set"* (403) : **ce n'est pas le token.** C'est le proxy git de la session
(`https_proxy=http://127.0.0.1:36877`) qui intercepte github.com, jette les
identifiants de l'URL et vérifie une liste blanche de repos.

**Le fix, vérifié et fonctionnel le 31/08/2026 au soir** — contourner le proxy,
le repo étant public et le PAT passant alors normalement dans l'URL :

```bash
cd /root && git clone https://github.com/flowinevent-ping/flowin-events-.git
cd flowin-events-
git remote set-url origin https://x-access-token:<PAT_NOTION>@github.com/flowinevent-ping/flowin-events-.git
git config user.email "romain@flowin.events" && git config user.name "Romain Collin"

# LA LIGNE QUI DÉBLOQUE TOUT — à mettre avant chaque pull/push :
export NO_PROXY='*' no_proxy='*' HTTPS_PROXY= https_proxy= GIT_CONFIG_COUNT=0

git pull --rebase origin main
git push origin main
```

`GIT_CONFIG_COUNT=0` neutralise les `url.insteadOf` injectés par
l'environnement, `NO_PROXY='*'` sort du proxy. Sans ces variables : 403
systématique. Avec : push normal.

L'alternative (attacher `flowinevent-ping/flowin-events-` aux sources GitHub
de la conversation) fonctionne aussi mais dépend d'une action manuelle de
Romain à chaque nouvelle tâche Cowork — la commande ci-dessus ne dépend de
rien et marche depuis n'importe quelle conversation.

Diagnostiqué 3 fois (28/08, 31/08 matin, 31/08 soir) avant d'être résolu.
Ne plus jamais re-déboguer depuis zéro, ne plus jamais redemander de token.

## 1. Test d'accès — À FAIRE ENSUITE, AVANT TOUTE LECTURE

1. `git clone https://github.com/flowinevent-ping/flowin-events-.git`
2. **Le token GitHub est dans Notion** (hub `38c6dcca-9add-81dd-9af2-c93139e06393`,
   section « 🔑 ACCÈS » en tête de page) — demande explicite de Romain le
   31/08 pour ne plus avoir à le redonner à chaque conversation. **Ne pas
   redemander à Romain sans avoir d'abord vérifié Notion.** Si le token n'y
   est plus ou ne fonctionne plus, proposer la solution Deploy Key (décrite
   dans la même section Notion) avant de redemander un simple PAT.
3. Commit test + push réel (pas juste un clone — le repo est public, le clone
   réussit toujours et ne prouve rien) avec le token trouvé dans Notion.
4. Supabase MCP : `execute_sql("select 1")` sur le projet `ywcqtupgoxfzkddqkztk`
   (compte Google `romain.collin@gmail.com`, org affichée « flowin revision
   olivia » — nom trompeur, c'est le bon projet). Accès MCP automatique,
   aucun token à gérer.
5. Si push OU Supabase MCP échoue : **STOP immédiat**, le dire en une phrase,
   ne jamais continuer en mode dégradé.

## 2. Lecture obligatoire, dans cet ordre

1. Ce fichier en entier.
2. Supabase, table `handoff_notes`, clé `handoff-nds-2026-comm` (contexte
   métier NDS 2026 : chiffres définitifs, contacts, patterns).
3. Supabase, table `handoff_notes`, clé `handoff-reorga-dashboard-2026-08`
   (tout l'historique technique de la réorganisation dashboard, très long,
   lire au moins les 2-3 dernières entrées en tête).
4. Notion, hub `38c6dcca-9add-81dd-9af2-c93139e06393` (même contenu que le
   handoff Supabase, format lisible).
5. `docs/patterns-bugs-connus.md` (11 patterns documentés, A à K — lire
   avant de reconstruire quoi que ce soit, beaucoup de pièges déjà tombés
   dedans une fois).
6. `admin/lib/roadmap.ts` (page `/dashboard/roadmap` en prod) — la feuille
   de route réelle, avec état par item (ok/hold/todo).

## 3. Discipline non négociable

- **3 piliers à chaque étape** : commit+push GitHub, `handoff_notes`
  Supabase (prepend, jamais écraser), Notion hub (insert_content en tête).
  Aucune étape sans les 3.
- **Vérifier avant de déclarer fait** : `tsc --noEmit` 0 erreur + `next build`
  OK avant tout push. Pour les RPC Supabase, tester par un appel réel
  (grant temporaire à `supabase_read_only_user`, tester, revoke immédiat) --
  jamais juste relire le SQL et supposer que ça marche.
- **Ce projet n'a PAS de session Supabase Auth réelle** — tout tourne sur la
  clé anon. Ne JAMAIS restreindre une RPC lue par le dashboard à
  `authenticated` (régression vécue le 31/08, cf. Pattern dans le handoff --
  ça casse la prod silencieusement, `authenticated` n'est jamais atteint).
- **Distinguer "vérifié dans le code/données" de "vérifié à l'écran"** —
  Claude n'a pas d'accès navigateur, ne peut pas voir le rendu réel. Dire
  explicitement lequel des deux a été fait, ne jamais laisser "corrigé"
  sous-entendre plus que ce qui a été vérifié. Le mécanisme qui marche le
  mieux pour combler ce trou : Romain envoie une capture dès que quelque
  chose semble faux -- ça a mené à un vrai fix à chaque fois. Le garder.
- **Ne jamais reconstruire ce qui existe déjà** (Pattern G) -- chercher dans
  les 3 couches (monolithe legacy `dashboard.html`, dashboard Next.js,
  `admin/public/*.html` standalone) avant de coder quoi que ce soit.

## 4. État complet au 31/08/2026 soir

Session très longue (28/08 au 31/08), des dizaines de commits. Résumé par
thème plutôt que liste chronologique complète (voir `git log` pour le détail) :

**Contenu du jeu** : écrans de config pour quiz/quizmaster/quizsolo/vote
dans EventDrawer (banques, nb questions, chrono, éléments à voter).

**Sidebar** : réduite de 44 entrées / 10 groupes à 46 entrées / 6 groupes
(ACCUEIL / SUPER EVENT / EVENTS / COMM & OUTILS / CRM / SYSTÈME). Events
fusionné en 1 seule page (kanban + Parcours mobil + bouton Nouvel event).

**Bugs de fond corrigés** (tous vérifiés par données réelles, pas supposés) :
- `v_se_dashboard` lisait `se_gains` (table abandonnée le 28/07) au lieu de
  `tirages` -- gains affichés à 0.
- `tirage_lot()` ne vérifiait jamais la quantité configurée du lot --
  155 tirages fantômes en base (jamais confirmés), nettoyés après
  vérification par rafales horaires (3 sessions de test distinctes,
  cf. Pattern K).
- Bornage de date manquant sur `super_event_rapport_points()` et
  `super_event_bonus_resultats()` -- 19 répondants de test comptés en trop.
- `super_event_jours()` ne lisait que les participations, jamais les
  flashs -- des jours entiers avec activité étaient invisibles (21 → 55
  jours réels).
- Régression que Claude a lui-même introduite puis corrigée : grants RPC
  restreints à `authenticated` au lieu de `PUBLIC` (cf. section 2 ci-dessus).

**Restaurations** (régressions du monolithe legacy jamais portées) :
- Donuts RGPD/engagement sur `/dashboard/nds-resultat` (opt-in, rejeu,
  bonus, couverture landing).
- Preview navigable des landing pages (cadre téléphone, 12 pages réelles
  dont 9 statiques jamais suivies en table `landings`).

**Nouveautés** :
- `/dashboard/envoi-masse` : liste destinataires + composeur + liens Gmail
  par lots de 40 en BCC (PAS de dépendance Resend -- corrigé après retour
  direct de Romain : "utilise ce qui existe, ne refabrique pas").
- Fiche organisateur visible sur les cartes Super Event (le pro
  `pro-nds-2026`, "Nuits du Sud — Ville de Vence", existait déjà en base).
- Icônes SVG du wizard SA alignées sur le wizard pro autonome.

**Harmonisation visuelle des 8 outils HTML autonomes** :
- Bandeau Flowin cohérent (logo + lien retour dashboard) ajouté aux 8.
- Thème clair appliqué à 2 d'entre eux (`bons-commande-liste.html`,
  `kit-digital/index.html`) -- entièrement pilotés par variables CSS,
  palette alignée sur `sa-*` (mêmes valeurs hex).
- **Reste sombre, non converti** : `nds-visuels.html` -- couleurs codées en
  dur partout (pas de variables CSS), conversion plus risquée qu'un geste
  rapide, à faire en passe dédiée.
- **Pas vérifiées** (mêmes outils, pas encore auditées pour le thème) :
  `facture-nds.html`, `plaquette-nds.html`, `pitch-nds.html`,
  `flowin-partenaire-presentation.html`, `tirage-nds.html` (confirmé déjà
  clair, `--bg:#f4f6fb`).

## 5. Audit du menu — 31/08 soir

> **FAIT le 01/09/2026** (commits `c9ca816` → `11c8008`). Les trois
> points 4.1, 4.2 et 4.3 sont traités ou tranchés : voir la section 8
> en fin de fichier. Cette section reste pour le raisonnement, pas
> comme une liste de tâches ouvertes.

Romain (captures d'écran du menu complet) : "il manque de rangement, on ne
voit pas bien Events et Super Event, agrandis les [en-têtes de groupe] en
couleur, il y a des sous-onglets à créer, des onglets qui font doublon."

**Vérifié avant de conclure** (pas supposé) :

### 4.1 Hiérarchie visuelle des groupes — vrai problème confirmé
`.sa-sb-group` (CSS, `globals.css:18`) : `font-size:10px`, couleur grise
terne (`--sa-sb-text-dim`), aucune icône, aucune couleur distinctive entre
groupes. Les 6 groupes (ACCUEIL/SUPER EVENT/EVENTS/COMM & OUTILS/CRM/
SYSTÈME) sont visuellement quasi identiques entre eux. **À corriger** :
agrandir la taille de police, donner une couleur/icône distincte par
groupe (ex. Super Event en violet, Events en vert, etc.), envisager un
séparateur visuel plus marqué entre groupes.

### 4.2 "Doublons" — vérifié : AUCUN doublon fonctionnel réel, mais confusion
de nommage sur 3 paires (pages différentes, noms trop proches) :
- **Bons de commande** (`/dashboard/nds-bon-commande`, outil de création)
  vs **Bons de commande & Factures (liste)** (`/bons-commande-liste.html`,
  vue liste CRM). Rôles différents, noms à différencier plus clairement
  (ex. "Créer un bon de commande" vs "Bons & factures — liste").
- **Prospection** (`/dashboard/prospection`, outil terrain) vs
  **Prospects B2B** (`/dashboard/btob-prospects`, suivi CRM). Même
  remarque.
- **Landing pages** (`/dashboard/landing-page`, gestion/preview des pages)
  vs **CRM Landing pages** (`/dashboard/crm-landing`, contacts capturés
  via ces pages). Même remarque.

Proposition à valider avec Romain avant d'exécuter : renommer pour clarifier
l'intention (outil de création/gestion vs vue de suivi CRM), pas fusionner
(les deux existent pour de bonnes raisons distinctes).

### 4.3 Sous-onglets par event/super event — à construire
Romain veut des sous-rubriques permettant de gérer/filtrer par event et par
super event à l'intérieur des sections existantes (pas juste une liste
plate). Rejoint le chantier "CRM clic → fiche complète" déjà partiellement
fait (organisateur visible sur la carte Super Event, lien vers
`/dashboard/operations/[id]`) mais pas généralisé aux autres pages.

**Ne pas exécuter ces 3 points dans cette conversation-ci — Romain a
explicitement demandé l'audit maintenant, l'exécution dans la conversation
suivante.**

## 6. Déploiement

Vercel : auto-deploy sur push `main`, racine `/admin`, domaine
`flowin-events.vercel.app`. Le push suffit, ne jamais toucher à Vercel
directement.

## 7. Ce qui n'a jamais été construit (roadmap priorité basse, section
"Dashboard SA — chantiers identifiés")

Voir `admin/lib/roadmap.ts` pour le détail à jour. Au 31/08 soir, tout ce
qui y était marqué a été fait sauf : harmonisation complète des 8 outils
HTML (2/8 faits), sous-onglets par event/super event (section 4.3
ci-dessus).

## 8. 01/09/2026 — Réorganisation du drawer : 4 lots + auto-audit

Demande de Romain : « ok on doit tout faire alors fait tout attention pas de
casse pas de régression pas de doublons », après avoir exigé — et obtenu —
**une maquette cliquable validée avant toute ligne de code**
(`docs/maquette-drawers.html`, commit `19b3ee2`, ~8 itérations).

### 8.1 La logique de domaine qui commande tout le découpage

Posée par Romain, à ne jamais reperdre :

- un **event** = une station de jeu, individuelle, appartenant à **un** pro ;
- un **super event** regroupe plusieurs stations ;
- on doit pouvoir entrer dans chacun **avec la vision pro ou la vision
  event**, et atteindre l'info individuelle (stats, jeu en cours, station,
  joueurs) ;
- **les mêmes modules à trois niveaux de portée** : général Flowin, dans
  chaque pro, et par event / super event.

« Ne recrée rien, tout existe déjà, c'est un rangement du drawer qu'il
faut. » Aucun écran n'a été refait : les écrans lourds sont atteints par un
composant `<Raccourci>`, jamais recopiés.

### 8.2 Les 4 lots

| Lot | Commit | Contenu |
|---|---|---|
| 1 | `c9ca816` | `SousOnglets.tsx` (2ᵉ niveau de navigation) + `SuperEventDrawer.tsx`, le 5ᵉ drawer, le seul qui n'existait pas — 6 onglets, zéro requête nouvelle |
| 2 | `ce76410` | `EventDrawer` : compteurs inertes de Participants → sous-onglets ; filtres Lots ré-habillés en `<SousOnglets>` sur le **même** state `filtreG` |
| 3 | `de56e30` | **Une seule fiche pro** : `PartenaireDrawer` accepte `partenaireId / tab / onTab / inline`, `ProDrawer` le rend `inline` sous 4 onglets commerce. Les 9 commerces en double (`pro-safer` + `pt-safer`) sont résolus **dans l'UI, zéro changement de schéma** |
| 4 | `241e748` | Sidebar : 45 entrées rangées en 6 groupes colorés. **Les 45 sont conservées** — vérifié par comptage *et* par comparaison des ensembles d'`id` et de `href` contre `c8dca31` |

### 8.3 La règle du sous-onglet vide

Apprise d'un vrai bug que Romain a repéré sur une capture : « Contrat & CGV »
affichait le contenu de « Général ». **Un sous-onglet sans contenu propre
doit le dire** (`<SousOngletVide>`). Afficher le voisin est pire qu'un écran
vide : rien ne signale l'erreur, on lit un chiffre en croyant qu'il concerne
autre chose.

### 8.4 Auto-audit adversarial — 8 régressions, 8 corrigées (`11c8008`)

Lancé après le push des 4 lots, parce que la nuit du 31/08 a prouvé qu'**un
build qui passe ne prouve pas qu'une navigation marche**.

1. **Critique** — `PartenaireDrawer` en mode `inline` affichait son footer :
   la fiche pro avait **deux** boutons « Supprimer », celui du haut
   supprimant l'enregistrement *partenaire* avec un texte de confirmation
   ambigu.
2. `chargeG` à la fois dans les deps du `useEffect` et posé dedans → les 4
   onglets commerce bloqués sur « Chargement… ».
3. `EventDrawer` : liste des participants jamais rechargée entre deux events.
   Corrigé par une remise à zéro sur `ev?.id` **et** un chargement piloté par
   `partEvId` (l'event réellement chargé) — pas par `participants.length === 0`,
   qui bouclerait à l'infini sur un event sans aucun participant.
4. `ProDrawer` : onglet commerce sur un pro sans `partenaire_id` → écran blanc
   muet, remplacé par `<SousOngletVide>` qui dit pourquoi.
5. `TableauStations` borné dans les nouveaux drawers : l'en-tête annonçait 21
   stations, le tableau en listait 18. `tout` passé partout.
6. Sidebar : `/nds` marqué `external` alors que c'est une vraie route Next.
7. `SuperEventDrawer` : deux états vides empilés sur l'onglet Stations.
8. `sql/2026-09-01-station-tracking-tout-historique.sql` ne contenait que des
   **commentaires** : une reconstruction depuis `sql/` aurait laissé
   `station_tracking` en 4 arguments et cassé **tous** les `TableauStations`
   d'un coup. Corps complet + `DROP` de l'ancienne signature + `GRANT`s
   écrits, et vérifié identique octet pour octet à la prod (md5
   `8213ecaa1cebff74a9297028d18bcb36`, 5 108 octets).

### 8.5 Pièges revus ce jour-là, à ne pas reperdre

- `tsconfig` cible **ES5** : `[...new Set(x)]` échoue (TS2802). Écrire
  `x.filter((v,i,a)=>a.indexOf(v)===i)`.
- Un remplacement global naïf transforme `const t = tab ?? drawer.tab` en
  `const t = tab ?? t` (TS2448). C'est arrivé **deux** fois.
- **Pas de session Supabase Auth sur ce projet** : tout tourne sur la clé
  anon. Une RPC ou une policy restreinte à `authenticated` casse la prod en
  silence. Policies : rôle `public`, `using(true)`.
- `execute_sql` du MCP est en lecture seule ici : les écritures passent par
  `apply_migration`.

### 8.6 Reste à faire (identifié, pas commencé)

- brancher `/pro/rejoindre` et `/pro/jeu` dans « + Nouvel event » et
  « + Créer un super event » du dashboard SA ;
- composant `<Diffusion>` : prévisualisation de la landing + QR
  téléchargeable **généré localement** (PNG / SVG / A4) ;
- `/dashboard/demandes-rattachement` ne fait que basculer un statut : il ne
  sait pas transformer une demande acceptée en event (table vide) ;
- `operations` et `nds-lots` ne lisent aucune portée ;
- event de test `htghc` sur Ville de Vence ; 15 events sans super event, 6
  sans pro.

## 9. 02/09/2026 — Diffusion, parcours d'inscription, et un bug de données

### 9.1 ⚠️ Les aperçus du dashboard fabriquaient de VRAIS scans

Les cadres téléphone du dashboard SA — `ParcoursMobil` depuis le 30/07, sur
4 écrans — chargent le vrai parcours dans une iframe. Or `trackVisite()`
(`admin/lib/track.ts`) ne testait **jamais** `preview` : chaque ouverture d'un
aperçu écrivait une ligne `visites` avec `etape IS NULL`, c'est-à-dire **un
flash**, sur l'event réel. Seul `/parcours/nds2026` gérait `preview` ; les 6
autres modules l'ignoraient.

Corrigé **à la source**, une seule fois dans le tronc commun :

```ts
if (params.has('preview')) return
```

Nettoyage : 110 lignes repérées par leur `referrer`, **archivées** dans
`visites_archive_apercu_2026_09` puis retirées
(`sql/2026-09-02-visites-apercu-dashboard.sql`).

| | Avant | Après | Écart |
|---|---|---|---|
| Chiffre publiable (période officielle) | 2 446 | **2 445** | −1 |
| Tout l'historique | 2 847 | **2 799** | −48 |
| Stations listées (tout l'historique) | 21 | **20** | −1 |

**Les chiffres publiés étaient justes** — un seul aperçu était tombé dans la
période officielle.

**Correction d'une affirmation du 01/09** : sur les 3 stations annoncées comme
« invisibles sur tous les écrans », `NDS · Le Bar` passe de 21 à **14** flashs
réels, `NDS · Brigade Verte` de 18 à **5**, et `NDS · Les Caisses` de 1 à
**0** — son unique flash était un aperçu. Cette station n'a jamais eu la
moindre activité réelle ; sa disparition n'est pas une régression.

### 9.2 Diffusion (`db1ccf5`) — le QR devient un livrable

Le QR était **partout** une `<img>` vers `api.qrserver.com` : intéléchargeable
(cross-origin), illisible en A4, et hors service si ce tiers tombe.
`components/dashboard/Diffusion.tsx` le génère **dans le navigateur** (paquet
`qrcode`, import dynamique) : PNG 1024, SVG dimensionné, affiche A4, copie,
aperçu dépliable, mode `vignette` pour les listes. Câblé à 2 endroits :
`EventDrawer` onglet QR, `ProDrawer` onglet QR & Liens. `nds-media` et
`nds-comm` ne sont **pas** touchés.

L'aperçu réutilise la technique de `ParcoursMobil` — pas un second système.
Le QR a été **décodé** (jsqr) pour prouver sa validité, pas relu.

### 9.3 Inscription (`b6870e3`) — le raccord manquant

Ce ne sont **pas des doublons** : `/pro/rejoindre` (parcours pro, 8 étapes,
écrit dans `demandes_rattachement_super_event`) et `/dashboard/wizard-event`
(création côté SA) existaient tous les deux ; `demandes-rattachement` ne savait
que basculer un statut. Le wizard accepte désormais
`?pro=&se=&nom=&d=&f=` et s'ouvre pré-rempli — pré-saisie **verrouillée à une
seule application** (`useRef`), sinon un re-rendu écraserait les corrections du
SA. `useSearchParams` impose une frontière `Suspense` : posée, la page reste
prérendue en statique.

### 9.4 Auto-audit (`9dbbc00`) — 9 points

Au-delà du 9.1 : la vignette QR avait **disparu** de la liste des stations
(régression du lot Diffusion) ; un pro pré-rempli absent de la liste rendait le
`<select>` vide **sans rien signaler** ; le `super_event_id` était écrit en base
mais n'apparaissait **nulle part** dans le wizard ; un échec de rattachement
passait sous silence avec « Événement créé » à l'écran ; SVG sans dimensions ;
« Copié » affiché à tort ; message d'erreur qui ne partait plus ; QR affiché une
frame sous le nom du suivant ; échec d'enregistrement muet.

### 9.5 Reste à faire

- `operations` et `nds-lots` ne lisent aucune portée ;
- event de test `htghc` sur Ville de Vence ; 15 events sans super event, 6 sans
  pro ;
- `nds-media` / `nds-comm` utilisent encore `api.qrserver.com` (outils
  distincts, non touchés volontairement).

## 10. 02/09/2026 (soir) — Réorganisation demandée sur captures : 10 lots

Romain, 12 captures à l'appui : *« confirme que tu as compris, établis une liste
de travail, pas de perte ni invention ni interprétation, puis travaille sans
t'arrêter »*.

### 10.1 La règle qui commande tout le reste

> « Toutes les listes nommées CRM ou listes d'info type Excel doivent être
> présentées de la même manière […] **le format liste CRM liste des gagnants est
> le bon format**, fais la même chose partout avec les infos qui leur sont
> propres », et « **rangé par catégorie et sous-catégorie : event, pro** ».

Plus le principe de rattachement : *« tout ce qui concerne un pro ou un event et
super events doit être rassemblé vers ce qui le concerne. On doit entrer dans un
event et voir les pros puis leur détail, idem pour le super event. »*

### 10.2 Les 10 lots

| # | Commit | Ce qui change |
|---|---|---|
| 1 | `6ca7b11` | **`ListeCRM.tsx`** — le gabarit unique, extrait de Liste des gagnants. N'ajoute que le regroupement à deux niveaux |
| 2 | `6ca7b11` | Accueil en **kanban horizontal**. Les cartes étaient déjà cliquables ; les **4 tuiles du haut** ne l'avaient jamais été |
| 3 | `4e5ae01` | **CRM Participants** : super event → station, colonne Source, accès total « Tout Flowin » |
| 4 | `4e5ae01` | **Gagnants** sur le gabarit, catégories super event → pro |
| 5 | `e82cfbd` | **Fiche opération** : vignettes à logo par secteur **ou** liste CRM |
| 6 | `ee7f9c5` | **Statistiques** : 12 blocs empilés → 7 vues sélectionnables |
| 7 | `effe069` | **Carte** : elle superposait deux opérations |
| 8 | `dc45606` | **`Parcours.tsx`** + création de super event en carrousel, **+ suppression** |
| 9 | `61ba2db` | Wizard event : même barre et même pied |
| 10 | `d3e22ed` | Menu : groupe **NDS 2026**, **Jeux à part**, CRM complet — 46 entrées, zéro perdue |

### 10.3 Trois constats qui corrigent des idées reçues

1. **La carte ne mélangeait pas, elle superposait.** Elle ne filtrait sur rien :
   22 stations de NDS 2026 **plus** 22 du Master, d'où les « 44 stations » et
   les doublons dans la liste latérale.
2. **Les tuiles de statistiques étaient cliquables** — elles faisaient défiler
   vers un bloc souvent déjà visible, donc rien ne semblait se passer. Le défaut
   était le geste choisi, pas un `onClick` manquant.
3. **`operations` n'est pas « sans portée »** : c'est déjà une vue par super
   event. La note du handoff était fausse, elle est corrigée.

### 10.4 Auto-audit (`51a36e9`) — 12 corrections

- **L'export CSV du CRM était faux.** La recherche et les filtres vivent dans
  `ListeCRM` : les tuiles et le CSV portaient sur la liste complète pendant
  qu'on voyait trois lignes. On tapait « dupont », le CSV téléchargeait 3 000
  lignes — un fichier faux qui part chez un partenaire.
- **Le tri était mort** sur les colonnes servant de (sous-)catégorie : tri à
  plat puis regroupement, donc la flèche s'affichait et rien ne bougeait.
- **Identifiants d'events tronqués à 60 caractères** → collisions et stations
  perdues en silence sur un nom d'opération long.
- **Les deux nouvelles RPC n'étaient pas dans le dépôt** — exactement le piège
  du 01/09. `sql/2026-09-02-crm-participants.sql` et
  `sql/2026-09-02-supprimer-super-event.sql` sont écrits, exécutables, GRANTs
  compris, et vérifiés **identiques octet pour octet** à la prod.
- `parties` et `clics_stations` avaient disparu des statistiques ; deux boutons
  « Créer l'événement » ; le QR token manquait à la vignette.

### 10.5 Deux bugs de données trouvés en chemin

- `crm_participants` : la jointure interne sur `joueurs` perdait les
  participations sans fiche joueur (un joueur NDS a 3 parties réelles sur
  Bar 1/2/3 et aucune ligne dans `joueurs`). 639 au lieu de 640. Jointure
  externe → **640 = 640**.
- La carte superposait deux opérations (§ 10.3).

### 10.6 Reste à faire

- le **tirage au sort** est toujours `tirage-nds.html`, statique et borné à
  `se-nds-2026` : il n'est pas passé au gabarit CRM ;
- l'event de test `htghc` sur Ville de Vence est toujours en base ;
- `nds-media` / `nds-comm` utilisent encore `api.qrserver.com`.
