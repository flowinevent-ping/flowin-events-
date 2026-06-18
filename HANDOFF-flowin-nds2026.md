# HANDOFF — Flowin / Nuits du Sud 2026

> Source de vérité inter-sessions. Mis à jour le 18/06/2026. HEAD = `c015686`.
> CDC éditeur = `CDC-editeur-event-flowin.md` — **EN SUSPENS, ne pas rouvrir sans instruction explicite de Romain.**

---

## ⚠️ MÉTHODE OBLIGATOIRE — appliquer à CHAQUE tour

1. **Bootstrap avant tout** : clone + `git log` (HEAD attendu = `c015686` ou plus récent) + push dry-run + Supabase `select 1`. Si l'un manque → STOP.
2. **Token GitHub** : `<TOKEN_GITHUB>` (scope repo, expire ~sept. 2026). Le mettre dans le remote : `git remote set-url origin https://<TOKEN_GITHUB>@github.com/flowinevent-ping/flowin-events-.git`. **Ne jamais committer ce token en clair** (push-protection le bloque).
3. **Preuve obligatoire** pour tout « fait » : commit-hash + grep/view/DB.
4. **Travail en BLOC** (HTML+CSS+JS+SQL alignés), validé avant push.
5. **iOS-safe** : `var`, `.indexOf()`, `function` — jamais spread, `.includes()`, template literals dans innerHTML.
6. **Miroir dashboard** : avant tout push touchant `dashboard.html` → copier vers `admin/public/static/dashboard.html` → vérifier MD5 identiques.
7. **Checklist complète** exécutée sans interruption — Romain ne reprend la main qu'une fois TOUT coché ✅.

---

## 1. Accès & autorisations

| Ressource | Valeur |
|---|---|
| **Repo GitHub** | `flowinevent-ping/flowin-events-` (public) |
| **Remote (push)** | `https://<TOKEN_GITHUB>@github.com/flowinevent-ping/flowin-events-.git` |
| **Token PAT** | `<TOKEN_GITHUB>` — scope `repo`, expire ~sept. 2026 → régénérer à l'échéance sur `github.com/settings/tokens` |
| **Auteur commits** | `romain@flowin.events` / `Romain Collin` |
| **Vercel** | auto-deploy depuis `main` → prod `https://flowin-events.vercel.app` |
| **Supabase project_id** | `ywcqtupgoxfzkddqkztk` (eu-west-1) |
| **Supabase anon key** | `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1` (publique par design) |
| **Supabase MCP** | `apply_migration` (DDL), `execute_sql` (DML/SELECT) |
| **Working dir** | `/home/claude/flowin` (re-cloner si besoin) · Next.js root : `admin/` |
| **PIN dashboard SA** | `1234` — **à changer** |

---

## 2. Stack & architecture

- **Parcours joueur** : Next.js 14 App Router sous `admin/`, déployé Vercel.
- **Dashboard SA** : monolithe vanilla JS `admin/public/dashboard.html` (miroir `admin/public/static/dashboard.html`, MD5 identiques obligatoires).
- **Hub démos** : `admin/public/demos.html` → `flowin-events.vercel.app/demos.html`
- **Base** : Supabase (Postgres + PostgREST + RLS anon).
- **Présentation partenaire** (mockup) : `docs/mockups/flowin-partenaire-presentation.html` (source) + `admin/public/nds-partenaire-presentation.html` (servi par Vercel).
- **Landing partenaire prod** : `admin/public/nds-partenaire.html` → `flowin-events.vercel.app/nds-partenaire.html`

---

## 3. Ce qui a été fait (session 18/06/2026)

### Présentation partenaire NDS — `e9e15bf`
Fichier : `docs/mockups/flowin-partenaire-presentation.html` + copie `admin/public/nds-partenaire-presentation.html`

| Item | Preuve |
|---|---|
| ✅ Barre de nav bas (Profil/Carte/Tickets/Partenaires, actif magenta) sur 5 écrans | navbar=5, nv on=5 |
| ✅ Bandeau « Votre logo ici » déplacé EN BAS au-dessus de la nav | inapp-band=5, amarq haut retiré |
| ✅ Nouvel écran PROFIL : 4 tickets + 3 places concert/soir + bons d'achat 1 gagnant/commerce | prof=1, slide 5 |
| ✅ Bandeau in-app ralenti 40s + slots agrandis + dots 4→5 | animation 40s, dots=5 |
| ✅ En ligne | `https://flowin-events.vercel.app/nds-partenaire-presentation.html` HTTP 200 |

### Hub demos — `c015686`
Fichier : `admin/public/demos.html`

| Item | Preuve |
|---|---|
| ✅ Carte « Présentation partenaire NDS » ajoutée | cartes 11→12 |
| ✅ Bouton Partager sur chaque carte (WhatsApp/Mail/Copier) | 1 bouton/carte, 12=12 |
| ✅ URL absolue dynamique (origin+href, pas d'URL en dur) | buildUrl() |
| ✅ iOS-safe (spread/includes/backtick = 0), ferme au clic extérieur | audit OK |
| ✅ En ligne | `https://flowin-events.vercel.app/demos.html` HTTP 200 |

---

## 4. RESTE À FAIRE — checklist exhaustive

> Légende : ✅ fait · ☐ à faire · 🔍 à vérifier · 🔒 bloqué (input Romain) · ⏸ en suspens

| # | Item | État |
|---|---|---|
| 1 | **Landing partenaire prod** `nds-partenaire.html` : reporter vrais chiffres (60% femmes, 20% touristes, 6 dates) | ☐ |
| 2 | Carte parcours : markers commerces + fiche | ✅ |
| 3 | 1ère page onboard : fond couleur | ✅ |
| 4 | Fiche partenaire au-dessus de la nav + scroll | ✅ |
| 5 | `se_tickets` écrit par station | ✅ |
| 6 | Bandeau défilant logos DANS le parcours (réutiliser `.logoband`) | ☐ |
| 7 | Texte lot « 3 places » → pilotable via `cfg` | ☐ |
| 8 | UX « continuer chez nos partenaires → map » | ☐ |
| 9 | Réponses détaillées stockées (table `se_reponses` ou colonnes jsonb) | ☐ |
| 10 | `source`/`decouverte` rempli systématiquement (8/220 aujourd'hui) | ☐ |
| 11 | Banques par station (4 stations sans banque câblée) | ☐ |
| 12 | Profil user persistant + cumul tickets conservé entre sessions | 🔍 |
| 13 | Parcours pro stats live (`pro-nds-live.html`) | ☐ |
| 14 | 25 questions/station + bonus RSE validées | 🔒 |
| 15 | Géocoder 4 derniers partenaires | 🔒 |
| 16 | Nouveau PIN SA (encore `1234`) | 🔒 |
| 17 | Paiement réel + facture tunnel partenaire | 🔍 |
| 18 | **Éditeur event générique** (CDC séparé) | ⏸ EN SUSPENS |
| 19 | Validation bout-en-bout parcours sur device iOS Safari | 🔍 |
| 20 | Test QR ultime pré-event (deadline juillet 2026) | ☐ |

---

## 5. URLs en production

| Page | URL |
|---|---|
| Hub démos | `https://flowin-events.vercel.app/demos.html` |
| Présentation partenaire | `https://flowin-events.vercel.app/nds-partenaire-presentation.html` |
| Landing partenaire | `https://flowin-events.vercel.app/nds-partenaire.html` |
| Dashboard SA | `https://flowin-events.vercel.app/dashboard.html` |
| Parcours NDS | `https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-caisses` (+ bar/ecrans/tablette) |

---

## 6. Commandes utiles

```bash
# Clone + config token
git clone https://<TOKEN_GITHUB>@github.com/flowinevent-ping/flowin-events-.git /home/claude/flowin
cd /home/claude/flowin

# Vérif accès push
git push --dry-run origin main

# Commit + push standard
git -c user.email=romain@flowin.events -c user.name="Romain Collin" add -A && \
git -c user.email=romain@flowin.events -c user.name="Romain Collin" commit -m "..." && \
git push origin main

# Miroir dashboard (avant tout push dashboard.html)
cp admin/public/dashboard.html admin/public/static/dashboard.html
md5sum admin/public/dashboard.html admin/public/static/dashboard.html

# Validation JS vanilla
node /home/claude/.acorn/node_modules/acorn/bin/acorn --ecma2020 --silent fichier.js

# Validation Next.js
cd admin && npx tsc --noEmit && npx next build

# Supabase diagnostic NDS
# SELECT cfg?'tirage', jsonb_array_length(cfg->'quizBonusList'), cfg->'quizBanques' FROM events WHERE super_event_id='se-nds-2026'
```

---

## 7. Contexte NDS

- **Super Event** : `se-nds-2026` | Client : `pro-nds-2026` (Ville de Vence)
- **Contacts ville** : Cécile (événementiel), Anne-Lou et Camille (RSE et lots)
- **Stations** : `ev-nds-caisses`, `ev-nds-bar`, `ev-nds-ecrans`, `ev-nds-tablette`
- **Festival** : 9→18 juillet 2026, 6 dates, Vence, 24 000 festivaliers, 60% femmes, 80% locaux 06+Var
- **Prix principal** : 3 places de concert tirées chaque soir à 22h30 | 1 bon d'achat par commerce partenaire
- **Banques** : `bq-nds-bar` / `bq-nds-caisses` / `bq-nds-ecrans` / `bq-nds-tablette` + 6 questions bonus RSE communes

