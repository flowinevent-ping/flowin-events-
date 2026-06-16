# NDS 2026 — WORKLOG / CONTRÔLE D'EXÉCUTION

> **RÈGLE ABSOLUE.** Un item n'est ✅ FAIT que s'il a : (1) un **hash de commit** + (2) une **preuve** (grep / view / requête DB / screenshot). Sans preuve → l'item reste ❌. On ne dit jamais « c'est fait » sans avoir collé la preuve ici. À chaque session : lire ce fichier EN PREMIER, reprendre les ❌/🟡 dans l'ordre, mettre à jour après chaque push.

Repo : `flowinevent-ping/flowin-events-` · prod `flowin-events.vercel.app` · dernière MAJ : 2026-06-16

---

## ✅ FAIT (prouvé)

| Item | Commit | Preuve |
|---|---|---|
| Landing partenaire — 3 packs (590/1490/3590) + bandeau « votre logo ici » | `750ce78`, `3f5a58d`, `5b6cff8` | grep packs/logoslot + screenshots mobile/desktop |
| Landing — packs en carrousel + typo d'origine restaurée (polices natives inchangées) | `3f5a58d` | CSS `.packs` scroll-snap + screenshot |
| Landing — contenus packs corrigés + lot (90/159/259 €) groupé au prix | `5b6cff8` | grep contenus + screenshot |
| Landing — suppression upsells « 6 lots » (offre+merci) + funnel sponsor orphelin | `5b6cff8` | grep `class="upsell"`=0, `id="sponsor"`=0 |
| Landing — suppression scarcity « limité » sur toute la page | `5b6cff8` | grep `limit`=0 |
| Landing — tagline Flowin « Animez votre lieu, créez du lien, faites revenir vos clients » | `5b6cff8` | grep lead |
| Landing — règle Grand Tirage : 1/jour 3 gagnants + 1 fin de festival 1 gagnant/partenaire | `65032f9` | grep + screenshot |
| Landing — visuel « carte du parcours » (aperçu app : point + fiche « votre logo ici ») | `65032f9` | grep `cmap/cfiche` + screenshot |
| **Prospection — fix Vence** : pagination (PostgREST plafonnait à 1000 ; 1063 lignes avant « Vence » sur 1152) | `ab5438e` | DB: `ville='Vence'`=50 ; Acorn 0 err |

> NB : le « visuel carte » ci-dessus est un **argument de vente sur la landing**. Ce n'est PAS la carte du parcours joueur (ci-dessous, item ❌).

---

## ❌ À FAIRE (parcours joueur + dashboard) — dans l'ordre

### 1. Carte du parcours (app joueur) — `admin/app/parcours/nds2026/NDS2026Client.tsx`
- [x] Afficher les **commerces partenaires actifs** (fetch `v_nds_commerces_carte`, déjà filtrée actif/visible) — commit `7ee8258`, tsc 0 err + next build OK
- [x] Points commerces **cliquables** → **fiche** bottom-sheet (nom, adresse, promo, tickets/scan, liens) — `7ee8258`
- [x] Pastilles stations : **vert = validé** / **jaune clignotant = à jouer** (+ ★ station courante) — `7ee8258`
- [ ] À VÉRIFIER SUR LE DÉPLOIEMENT (carte = tuiles + fetch live, pas screenshotable en local) : points s'affichent, clic ouvre la fiche, couleurs correctes

### 2. Parcours 1ʳᵉ page — `NDS2026Client.tsx` / `admin/lib/nds2026Design.ts`
- [ ] Bandeau de couleur manquant
- [ ] Image superposée
- [ ] Encart lot
- [ ] Trame grise qui masque le texte + le CTA (à corriger)
- [ ] **Couleurs** (reprendre les indications couleur)

### 3. Fiche partenaire
- [ ] La remonter (ne pas déborder la nav)

### 4. Question « Connu le festival comment ? » en roll (carrousel/roll)

### 5. Prospection — affiner
- [ ] Vérifier filtres en menus déroulants (✔ déjà déroulants à l'écran) + **croisement** type × ville × CP
- [ ] Vérifier KPIs après pagination (total doit passer à 1152)

### 6. Dashboard SA — `admin/public/dashboard.html` (+ miroir `static/dashboard.html`, MD5 identiques)
- [ ] Insérer éditeur nds2026 (`renderNdsStationEditor` / `renderNdsQuizQuestions` / `renderNdsBonus`)
- [ ] Éditeur logo partenaire · éditeur bandeau
- [ ] CRUD commerces (suppression via `actif/visible`)

### 7. Questions 25/station (line-up Kassav', Magic System, Danakil, V. Sanson, Ben l'Oncle Soul, Amadou & Mariam, Maya Kamaty, Kolinga, Bakermat, Breakbot & Irfane, Soom T, Luiza + Talents NDS) + Vence + genre

### 8. Tickets en base — écrire dans `se_tickets` (+ double chance premium = 2 lignes) au lieu de localStorage seul

### 9. Géocoder les 4 partenaires restants

### 10. Changer le PIN SA (encore « 1234 »)

---

## Workflow obligatoire (rappel)
modifier fichier → Acorn/tsc → (build si Next) → screenshot Chromium → commit → push → vérifier `HEAD == origin/main`. Dashboard SA : MD5 `dashboard.html` == `static/dashboard.html` avant push. Pour `prospection`/parcours : compter via `joueurs?events=cs.{ev}` (pas `participations`). Données pilote = rapport PDF, pas la DB.
