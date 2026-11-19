# Super Event en deux phases (19/11/2026)

Décision de Romain : « avant l'événement ils gagnent des places ou des lots que tu choisis (organisateur) ; pendant, ils jouent aux lots des commerces et jouent sur place ». Consignée dans `docs/DECISIONS-flowin-event.md`.

## Fonctionnement

| | Avant | Pendant |
|---|---|---|
| Période | début du jeu → veille de l'événement | dates de l'événement (`date_d` → `date_f`) |
| Lots par défaut | lots de l'organisateur (`se_lots`) | lots des stations des commerces (`lots`) |
| Tirage | tirage au sort parmi les joueurs de la période | tirage au sort parmi les joueurs de la période |

- **Activation** : `super_events.cfg_jeu.phases.debutJeu` renseigné et antérieur à `date_d`. Sinon une seule phase, comme avant. `se-nds-2026` est toujours exclu (pas d'échéance).
- **Phase d'un lot** : colonne `phase` (`avant` / `pendant`) si renseignée, sinon déduite de l'origine du lot. Règle unique : `admin/lib/superEventPhases.ts` (code) et `public._se_phases` + `tirage_super_event` (SQL).
- **Avant le SQL** : la colonne `phase` n'existe pas, l'écran « Les phases » et le tirage par phase restent masqués. Tout fonctionne comme avant.

## Écrans

- **Création (organisateur, SA)** : `ParcoursCreation` — nouvel écran « Les phases » entre Lots et Participants. Deux cartes, dates reprises de l'événement (début du jeu prérempli à aujourd'hui), un geste pour passer un lot d'une phase à l'autre, bouton « Une seule phase ».
- **Joueur** : `/se/[se]` et `/se/[se]/[event]` — deux onglets Avant / Pendant au-dessus des lots, phase en cours sélectionnée, podium filtré.
- **SA, tirage** (`TirageSuperEvent`) : lots rangés par phase ; les lots de l'organisateur deviennent tirables (même RPC).
- **Organisateur** (`/pro/super`) : passages et tickets par phase, toutes stations (participations réelles, coupées à `date_d`).
- **SA, dashboard.html** : fiche partenaire, onglet Lots — puce de phase sur les lots de station d'un Super Event à phases actives.
- **Démo (`?demo=1`)** : les deux phases s'affichent même sans configuration, marquées « DÉMO ».

## SQL — ordre d'application

1. `sql/2026-11-18-tirage-correctifs.sql` (sécurité du tirage, pas encore appliqué).
2. `sql/2026-11-19-super-event-phases.sql` (refuse de s'exécuter si l'étape 1 manque).
3. `sql/2026-11-19-banque-interets.sql` (indépendant, après validation des questions par Romain).

Les trois sont idempotents. Le fichier phases est additif (ADD COLUMN IF NOT EXISTS, contraintes si absentes, create or replace) ; rollback commenté en fin de fichier.

## Banque « Centres d'intérêt » — à valider par Romain

Id `bq-bonus-centres-interets`, statut brouillon, privée jusqu'à validation. Clés `ci_*` rangées dans « Centres d'intérêt » (`lib/themesBonus.ts`).

1. **Quelle musique écoutez-vous le plus ?** — Musiques du monde · Pop / rock · Jazz / blues · Électro · Chanson française · Classique
2. **Vous sortez le plus souvent pour…** — Des concerts · Des spectacles · Des expositions · Le cinéma · Les marchés et fêtes locales
3. **Vos loisirs préférés ?** (plusieurs choix) — Sport · Cuisine · Lecture · Nature, randonnée · Jeux · Jardin, bricolage
4. **Dans un commerce près de chez vous, vous cherchez surtout…** — Des produits locaux · Des bons plans · Du conseil · Des nouveautés
5. **Comment apprenez-vous les événements près de chez vous ?** — Réseaux sociaux · Bouche-à-oreille · Affiches · Presse, radio · Office de tourisme

## Plan de test

- SQL sur PostgreSQL 16 local (tables bouchons) : garde-fou d'ordre, double application, tirage avant / pendant, NDS et Super Event sans phases inchangés, anon refusé.
- Playwright sur `next start` (copie du build), `?demo=1`, 0 requête d'écriture vers Supabase :
  - `/se/se-nds-2026?demo=1` : onglets Avant / Pendant, lots filtrés ; sans démo : podium d'origine.
  - `/dashboard/wizard-super-event?demo=1` : écran « Les phases », un clic fait passer un lot de Avant à Pendant ; sans démo ni SQL : écran absent.
- Après application en prod : créer un Super Event de test à deux phases, vérifier `select * from _se_phases('<id>')`, tirer un lot de chaque phase depuis le SA.
