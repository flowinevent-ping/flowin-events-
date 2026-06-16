# HANDOFF — Flowin / Nuits du Sud 2026 (parcours jeu)

> Objectif de ce document : permettre à une nouvelle session (ou un dev) de **reprendre et terminer** la version définitive du parcours jeu, sans rien redécouvrir.
> Le cahier des charges de l'éditeur d'événement est un document **séparé** (`CDC-editeur-event-flowin.md`) — ne pas le mélanger ici.
> État vérifié le 16/06/2026. `HEAD = origin/main = 41c8ca1`.

---

## 0. État réel du déploiement (important)

- Le code que l'on édite **est bien celui déployé** : `HEAD local = origin/main = 41c8ca1`, et les textes des captures (« Station validée », « Les points de jeu », « À gagner chaque soir »…) sont tous dans `NDS2026Client.tsx`. Vercel auto-déploie depuis `main` (~2-3 min). Donc « aucune modif enregistrée » = les écrans pointés ne correspondaient pas aux écrans modifiés, **pas** un problème de déploiement.
- Si après un push l'app ne change pas sur le téléphone : c'est du **cache PWA / navigateur** (hard-refresh ou désinstaller la PWA), pas le repo.

---

## 1. Accès & autorisations

| Ressource | Valeur |
|---|---|
| **Repo GitHub** | `flowinevent-ping/flowin-events-` |
| **Remote (push)** | `https://<TOKEN>@github.com/flowinevent-ping/flowin-events-.git` |
| **Token (PAT, scope repo)** | `ghp_*** (token retiré du repo par push-protection — voir le handoff téléchargé, et le ROTER)` — **expire ~sept. 2026. À ROTER : ce token est dans ce doc, le régénérer après usage.** |
| **Auteur commits** | `romain@flowin.events` / `Romain Collin` |
| **Vercel** | auto-deploy depuis `main` → prod `flowin-events.vercel.app` |
| **Supabase project_id** | `ywcqtupgoxfzkddqkztk` (eu-west-1) |
| **Supabase anon key** (publishable, publique par design) | `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1` |
| **Supabase MCP** | `apply_migration` (DDL), `execute_sql` (DML/SELECT) sur le project_id ci-dessus |
| **Working dir** | `/home/claude/flowin` (re-cloner si besoin) · Next.js root : `admin/` |
| **PIN dashboard SA** | encore `1234` — **à changer** (valeur à fournir par Romain) |

---

## 2. Stack & architecture

- **Parcours joueur + Pro dashboard** : Next.js 14 App Router sous `admin/`, déployé Vercel.
- **Dashboard SA** : monolithe vanilla JS `admin/public/dashboard.html` (+ miroir `admin/public/static/dashboard.html`, **MD5 doit rester identique** avant tout push).
- **Base** : Supabase (Postgres + PostgREST + RLS anon).

### Carte des fichiers clés (parcours)
| Fichier | Rôle |
|---|---|
| `admin/app/parcours/nds2026/page.tsx` | server component, fetch `{ev, lots, partenaires, banques}` puis passe à `NDS2026Client` |
| `admin/app/parcours/nds2026/NDS2026Client.tsx` | **tout le parcours** (écrans onboard / inscription / quiz / résultats / bonus / final / tickets / carte / partenaires / profil). ~720 l. |
| `admin/lib/nds2026Design.ts` | CSS du parcours exporté en string (~27 KB) |
| `admin/lib/parcours.ts` | couche data : `writeJoueur`, attribution ticket → `se_tickets` (l.125), gains, géofence |
| `admin/lib/supabase.ts` | client anon (utilisable côté client) |

### Conventions / pièges (à respecter absolument)
- **Ne jamais modifier les master modules** (`SpinClient.tsx`, `QuizClient.tsx`, …) — toute config event passe par `events.cfg`.
- **iOS Safari** : `var` only, pas de spread/`Object.assign` (utiliser `_flowinMerge`), `.indexOf()` pas `.includes()`, fonctions `function` (pas arrow) côté vanilla, iframe POST pour CORS.
- **Validation avant push** : vanilla JS → Acorn (`ecmaVersion:2020`, 0 err) ; Next.js → `npx tsc --noEmit` + `npx next build` (lire le **log** « Compiled successfully », pas le code retour qui peut être ≠0 à cause du pipe shell ; les warnings *Failed to minify font* sont pré-existants et ignorables).
- **Git** : modifier → valider → commit → push `main` → Vercel déploie. Pour `dashboard.html` : **resynchroniser le miroir** `static/dashboard.html` (MD5 identique) avant push.
- **Compter les participants** via `joueurs?events=cs.{ev}` — `participations` reste à 0.
- `joueurs.email_lower` est **générée** : ne jamais l'insérer. Utiliser `ts` (pas `created_at`) sur `joueurs`.

---

## 3. Schéma base (réel, audité)

### `events` (1 ligne par event / station)
`id` (text), `pro_id`, `nom`, `module`, `status`, `date_d/date_f`, `h_start/h_end`, `lieu`, `adresse`, `couleur`, `score_min`, **`cfg` jsonb**, `stats` jsonb, `pro_visib` jsonb, `super_event_id`, `lat/lng`, `gain_immediat`, `gain_ticket`, `qr_token`, `categorie`, …

**Stations NDS réelles** (super_event `se-nds-2026`) :
| id | nom | module | lat,lng |
|---|---|---|---|
| `ev-nds-2026` | Nuits du Sud 2026 (général) | quiz | 43.7225, 7.1118 |
| `ev-nds-caisses` | NDS · Les Caisses | nds2026 | 43.72325, 7.1112 |
| `ev-nds-bar` | NDS · Le Bar | nds2026 | 43.72372, 7.11205 |
| `ev-nds-ecrans` | NDS · L'Écran | nds2026 | 43.72405, 7.11158 |
| `ev-nds-tablette` | NDS · Tablette | nds2026 | 43.7236, 7.1118 |
| `ev-nds-demo-1` | Démo commerce | spin | 43.7223, 7.1121 |

### `joueurs` (profil + stats)
Clés stats : `ts` (timestamptz = **heure**), `source` (**origine**), `decouverte` (« connu le festival par »), `ville`, `code_postal`, `age_tranche`, `genre`, `score_moy`, `pts_total`, `events` (ARRAY des events/stations joués), `ticket_code`, `gains`, `lot_gagne`, `optin`/`optin_date`/`optin_version`, `tags` (ARRAY). `email_lower` générée.
⚠️ **Pas de colonne pour les réponses détaillées** (le `bonus_reponses` passé par le code n'a **aucune destination**). Voir §5-E.

### `se_tickets` (cumul tickets — **fonctionne**)
`id`, `super_event_id`, `joueur_id`, `event_id`, `jour` (date), `created_at`. Upsert `onConflict: joueur_id,event_id,jour` (1 ticket / station / jour). **Le cumul = `count(*)` des lignes du joueur.** Vérifié : 3 plays test → 3 tickets.

### `banques` (questions) + `questions`
`banques` : `id`, `nom`, `event_ids` (ARRAY → rattachement aux events), `questions` (jsonb), `tags`, `pro_id`.
**État réel NDS** : seulement **2 banques**, toutes deux sur `ev-nds-2026` :
- `bq-nds-artistes` (quiz « Festival & artistes ») — **14 questions**
- `bq-nds-rse-mobilite` (bonus RSE & mobilité) — **4 questions**
⚠️ Les stations `bar/caisses/ecrans/tablette` **n'ont AUCUNE banque rattachée**. Voir §5-C.

### Autres tables/vues utiles
`partenaires` (logo, promo, réseaux, position carte, `en_avant`, `actif`/`visible`, `source`, `prenom`, `entreprise`), `partenaire_clics`, `lots`/`se_lots`/`lots_stock`, vues `v_nds_commerces_carte` (déjà filtrée actif/visible — utilisée par la carte), `v_nds_partenaires`, `v_se_*`, `v_partenaire_trafic[_horaire]`.

---

## 4. Ce qui est FAIT (commits, en prod)

- Carte : markers commerces partenaires (vue `v_nds_commerces_carte`) + clic → fiche ; pastilles station vert=validé / jaune clignotant=à jouer (`7ee8258`).
- 1ʳᵉ page : `.stage` passé en fond couleur (dégradé violet) + suppression image base64 & filtre sombre (`acb9e3c`).
- Fiche partenaire : z-index 1300 > nav 1200 (ne déborde plus) + scroll (`41c8ca1`).
- Question « connu le festival » en roll horizontal (`41c8ca1`).
- Bandeau « Merci à nos partenaires » (statique) sur l'écran final (`41c8ca1`).
- `se_tickets` écrit par station (`parcours.ts` l.125).
- Dashboard SA : pagination prospection (fix Vence) `9d5f2b7`.
- Landing partenaire : 3 packs 590/1490/3000 + **bandeau logos défilant** + funnel/paiement dynamique (`750ce78`…).

---

## 5. LES MANQUES (à terminer pour la version définitive)

### Parcours joueur — UI / UX
- **A1. Présentation carte** : revoir selon consignes (cards station empilées **par-dessus** la map → lisibilité, hiérarchie, markers). État actuel = liste de cards sur fond map. *Consigne précise à re-confirmer avec Romain.*
- **A2. Bandeau défilant logos partenaires DANS le parcours** : aujourd'hui seul un bandeau **statique** « Merci à nos partenaires » existe (écran final). Manque le **marquee défilant avec logos** (réutiliser le pattern `.logoband`/`.logotrack` de `nds-partenaire.html`, l'alimenter depuis `partenaires`).
- **A3. UI « bandeau color » du front selon le fichier d'origine** : l'onboard du joueur **récurrent (saved)** affiche un fond blanc (cards sur blanc) au lieu du fond couleur. Vérifier quel conteneur rend l'onboard `saved` (≠ `.stage`) et appliquer le bandeau/fond couleur de la **maquette d'origine** (Romain a le fichier de référence — à fournir/identifier).
- **A4. Texte lot codé en dur** : « À gagner chaque soir / 3 places offertes / Pour ton prochain concert » est **hardcodé** dans `NDS2026Client.tsx` (l.402-406 et l.550). Le rendre **pilotable via `events.cfg`/`lots`** (et corriger le wording voulu).
- **A5. UX « le jeu continue chez nos partenaires »** : ajouter un message/CTA clair invitant à continuer le jeu chez les partenaires → renvoi vers la map / l'écran partenaires.

### Données / back (tâches dictées par Romain)
- **B. Audit dashboards + parcours pro live** : vérifier que chaque **station** enregistre bien les données user, et **alimenter le parcours pro** (`public/pro-nds-live.html`, route `/pro-nds`) en **stats live** (comptage via `joueurs?events=cs.{ev}`, trafic via `partenaire_clics`, tickets via `se_tickets`).
- **C. Banques par station** : ⚠️ aujourd'hui **les 4 stations n'ont pas de banque**. Décider la règle : soit rattacher la banque quiz + bonus aux `event_ids` de chaque station (`ev-nds-bar/caisses/ecrans/tablette`), soit fallback explicite sur la banque du super-event. **Vérifier que chaque station sert bien des questions + le bonus.**
- **D. Profil user indépendant + cumul tickets conservés** : `se_tickets` cumule correctement par `joueur_id`. **Vérifier l'identité persistante** du joueur entre sessions (clé locale `user_id`/email côté app) pour que le cumul ne se perde pas / ne se mélange pas entre profils.
- **E. Stats conformes + réponses** : `ts` (heure) et `source`/`decouverte` (origine) sont OK, mais ⚠️ **les réponses détaillées ne sont stockées nulle part** (pas de colonne `bonus_reponses`/`reponses` sur `joueurs`, pas de table réponses). **À créer** : soit colonnes jsonb (`reponses`, `bonus_reponses`) sur `joueurs`, soit table `se_reponses(joueur_id, event_id, question_id, reponse, correct, ts)`. + remplir `source` systématiquement (aujourd'hui rempli pour 8 joueurs seulement).

### Dashboard SA — éditeur (NON commencé)
- **F. Éditeur d'événement générique** : 0 ligne aujourd'hui. **Ne pas coder avant validation du CDC séparé** (`CDC-editeur-event-flowin.md`). Inclut aussi : éditeur logo partenaire, éditeur bandeau, CRUD commerces.

### Bloqueurs (input requis)
- **G1. 25 questions/station + bonus** : contenu (line-up Kassav'/Magic System/Danakil/V. Sanson/Ben l'Oncle Soul/Amadou & Mariam/Maya Kamaty/Kolinga/Bakermat/Breakbot & Irfane/Soom T/Luiza + Talents NDS, + Vence, + genre) — **domaine Romain**.
- **G2. Géocoder les 4 derniers partenaires** — nécessite une API de géocodage (hors domaines réseau autorisés en bash).
- **G3. Nouveau PIN SA** — valeur à fournir.

---

## 6. Plan de reprise conseillé (ordre)

1. **E + D** (intégrité données) : créer le stockage des réponses + vérifier identité/cumul joueur — *socle indispensable avant insertion jeu définitif.*
2. **C** (banques par station) : garantir que chaque station sert questions + bonus.
3. **B** (parcours pro live) : brancher les stats réelles.
4. **A1→A5** (UI/UX parcours) en **une passe** par sujet, avec capture/preview avant push.
5. **F** (éditeur) seulement après validation du CDC.

---

## 7. Commandes utiles

```bash
# clone
git clone https://<TOKEN>@github.com/flowinevent-ping/flowin-events-.git /home/claude/flowin
cd /home/claude/flowin/admin && npm install
# valider parcours
npx tsc --noEmit && npx next build   # lire "Compiled successfully" dans le log
# valider dashboard vanilla
node -e "const a=require('acorn');/*parse chaque <script>*/"
# miroir dashboard (avant push)
cp admin/public/dashboard.html admin/public/static/dashboard.html && md5sum admin/public/dashboard.html admin/public/static/dashboard.html
# push
git -c user.email=romain@flowin.events -c user.name="Romain Collin" add -A && git commit -m "..." && git push origin main
```
