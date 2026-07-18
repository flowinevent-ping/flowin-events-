# RUNBOOK — Comptage des scans & fiabilité des données (NDS 2026)

## 1. Règle d'attribution d'un scan à une station (référence)

- Un scan = une ligne `visites` avec `etape IS NULL`, écrite à l'ouverture de la page parcours.
- La station est l'`event_id` **repris verbatim** du paramètre `?ev=` du QR scanné
  (`useParcoursTracking(page, evId)` → `trackVisite(page, evId)` dans `admin/lib/track.ts`).
- **Aucun remap au moment du log.** Le seul remap existant (`ndsFamily` dans `NDS2026Client.tsx`)
  ne concerne QUE le ledger de tickets (`ev-nds-caisses`→`ev-nds-caisse-1`, `ev-nds-bar`→`ev-nds-bar-1`,
  `ev-nds-tablette`→`ev-nds-tablette-1`), pour la règle « 1 ticket / station / jour ». Il n'affecte
  pas le comptage des scans/jeux.
- Le dashboard compte via la RPC `super_event_stations` : scans = `visites` (`etape IS NULL`,
  `event_id ∈ events` du super-event), jeux = `participations` (même filtre event_id).
  **Conséquence** : une station dont l'`event_id` n'existe pas dans `events` est invisible
  (cf. incident Caisse 3, 18/07, commit 7010ee4).
- Journée festival : décalage `-6h` (une action avant 06:00 compte sur la veille).

**Verdict audit 17/07** : pas d'erreur d'attribution. Les scans sont sur la bonne station.
Le problème est une **perte** de scans, pas une mauvaise station.

## 2. Cause racine du sous-comptage des scans (QR)

`trackVisite` (`admin/lib/track.ts`) insère le scan en **fire-and-forget** :

```
try { await supabase.from('visites').insert({...}) } catch { /* best-effort */ }
```

Aucun retry, aucune file offline, aucun `sendBeacon`. Le service worker sert la **page**
depuis le cache (les gens jouent), mais l'écriture du scan a besoin du réseau → sous réseau
saturé au festival elle **échoue en silence**. Les scans non écrits sont **définitivement perdus**
(jamais persistés, non reconstructibles).

**Asymétrie importante — les JEUX ne sont PAS touchés** : l'enregistrement d'une partie
(`admin/lib/parcours.ts`) est protégé par une **file d'attente durable** (`flowin_nds_wq`,
localStorage) rejouée au retour du réseau (`online`) et re-tentée au chargement suivant, avec
dédup par jour/station et même `ticket_code` (pas de double comptage). D'où : les jeux en base
sont fiables (885 jeux NDS complets au 18/07 00:16), seuls les **scans** sont sous-comptés.

## 3. Impact sur le Google Sheet « backup flowin »

Le classeur est alimenté par un **Google Apps Script** lié au classeur (déclencheur horaire,
écrit « Dernier backup : … »), hors dépôt GitHub. La source de vérité reste la **base** :
- Jeux NDS en base = **885** (tous `completed`). Export autoritaire complet fourni :
  `NDS2026_jeux_complets_885_backup-DB.csv` (16 colonnes, tri par horodatage).
- Si le sheet affiche moins de 885 lignes de jeux, l'écart vient du script de backup
  (cap de lignes / append partiel), pas d'une perte de jeux. Réimporter l'export ci-dessus
  rend l'onglet complet.

## 4. Correctif recommandé (scans résilients)

Donner à l'insertion du scan la même robustesse que l'écriture d'un jeu :
1. `keepalive: true` sur la requête (survit à la navigation).
2. En cas d'échec, empiler un job minimal en localStorage (`flowin_visites_wq`) et le rejouer
   sur `window.online` + au prochain `trackVisite`.
3. Dédup best-effort (visiteur_id + event_id + minute) pour éviter les rafales de re-render.

Point n°3 corrige aussi le **double-fire** observé (Caisse 2, 17/07 : 5 scans en 10 s pour
un même visiteur → 4 scans fantômes).

**Déploiement** : change le tracking en prod. Vu le gel de stabilité de fin de festival,
à déployer sur validation explicite (bénéfice limité à la dernière soirée du 18/07 ;
à défaut, à poser à froid post-festival).

## 4 bis. RÈGLE — les compteurs sont DÉRIVÉS, jamais incrémentés à la main

**Incident 18/07 (audit depuis le 09/07)** : les cartes Events affichaient des chiffres faux
sur TOUTES les stations. Total affiché 730 parties vs **887 réelles** (−157, soit **−18 %**).
Exemples : Caisse 2 123→149, Caisse 1 96→121, Bar 3 55→74, Brigade Verte 1 2→12.

**Cause** : `events.participants` était un compteur dénormalisé incrémenté (`participants + 1`)
**à l'intérieur d'une RPC** appelée sur le chemin nominal du jeu. Toute écriture de participation
hors de ce chemin — en particulier le **rejeu de la file offline** (`flowin_nds_wq`, qui insère
directement dans `participations`) — n'incrémentait pas le compteur. La dérive était donc
proportionnelle aux coupures réseau, et **définitive** (jamais rattrapée).

**Règle appliquée (migration `fix_events_participants_derive_trigger`)** :
- `events.participants` = `count(*)` des `participations` de l'event. **Point.**
- Maintenu par le trigger `trg_sync_event_participants`
  (`AFTER INSERT OR DELETE OR UPDATE OF event_id ON participations`), donc correct
  quel que soit le chemin d'écriture (RPC, rejeu offline, insert direct, suppression).
- Backfill effectué sur tous les events : écart ramené à 0 partout.
- **Interdit désormais** : tout `UPDATE events SET participants = participants + 1`.
  Si un tel code subsiste dans une RPC, il est redondant et doit être retiré (le trigger
  recalcule la vraie valeur derrière, mais l'incrément fausse transitoirement l'affichage).

**Généralisation** : tout compteur agrégé (participants, gagnants, tickets) doit être dérivé
de sa table de faits, jamais maintenu par incrément côté client ou RPC.

## 4 ter. Plafonds de requête dashboard (chiffres tronqués)

La sidebar affichait « Joueurs 500 » alors que la table en contient **769** : la requête
portait un `limit=500`, et le compteur affiché = longueur du tableau reçu. Trois plafonds relevés
dans `dashboard.html` : `joueurs` 500→20000, `joueurs` Brigade Verte 500→20000,
`participations` 5000→50000.

**Règle** : un compteur affiché ne doit jamais être la longueur d'une liste paginée.
Vérifier le `limit` avant d'interpréter tout total du dashboard.

## 5. Métrique fiable côté pilotage

Le compteur « scans » est un **nombre de flashs bruts** (gonflé par re-scans/itinérance,
dégonflé par pertes réseau) : peu fiable en absolu. Pour le pilotage, préférer :
- **jeux** (`participations`, durables) et **joueurs uniques** par station,
- scans en tendance/relatif uniquement.
