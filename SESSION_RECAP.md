# FLOWIN — RECAP SESSION MAI 2026

## ACCÈS & CREDENTIALS

### Supabase
- Project ID : [SUPABASE_PROJECT_ID]
- Anon key : [SUPABASE_ANON_KEY]
- URL : https://[SUPABASE_PROJECT_ID].supabase.co
- Région : eu-west-1

### GitHub
- Repo : flowinevent-ping/flowin-events-
- Token : [GITHUB_TOKEN]
- Clone : https://[GITHUB_TOKEN]@github.com/flowinevent-ping/flowin-events-.git

### Vercel
- URL prod : https://flowin-events.vercel.app
- Auto-deploy sur push main (~2-3 min)
- Root : /admin

### Dashboard SA
- URL : https://flowin-events.vercel.app/dashboard.html
- Romain / SUPER ADMIN

---

## ARCHITECTURE STACK

```
admin/
  app/
    dashboard/        SA Next.js (8 pages)
    parcours/
      quiz/           QuizClient.tsx ✅ Next.js
      tombola/        TombolaClient.tsx ✅ Next.js
      spin/           SpinClient.tsx ✅ Next.js
      vote/           VoteClient.tsx ✅ Next.js
      quizsolo/       QuizsoloClient.tsx ✅ Next.js
      quizmaster/     QuizmasterClient.tsx ✅ Next.js
    pro/              ProClient.tsx ✅ Next.js
    landing/          LandingClient.tsx ✅ Next.js
  lib/
    supabase.ts       client singleton
    types.ts          FlowinEvent, FlowinJoueur...
    ticket.ts         generateTicket()
    parcours.ts       fetchParcoursData, writeJoueur, shuffle
    pro.ts            fetchProDashboard, getQrUrl
  public/
    dashboard.html    SA vanilla JS (~11500 lignes) — MIROIR → static/
    parcours/*.html   Fichiers HTML (preview Jeux global uniquement)
    landing/index.html Landing HTML originale (archivée, non servie)
```

---

## ÉTAT BASE DE DONNÉES

### Events
| ID | Nom | Module | Status |
|---|---|---|---|
| ev-paques | Fêtes de Pâques 2026 | quiz | past |
| ev-crf-2026 | Croix Rouge — Collecte Vence 2026 | quiz | upcoming |
| ev-1779134507335-s38y | Tombola Croix Rouge française | tombola | upcoming |
| ev-flowin-demo | Découvrez Flowin | spin | live |

### Pros
- pro-vence → Ville de Vence → /pro?pro=pro-vence
- pro-crf-vence → Croix Rouge Française — Délégation de Vence → /pro?pro=pro-crf-vence

### Joueurs : 211 total (dont 186 Pâques)

### Partenaires : 13 (dont Maison Palanque 🥐, CCDK Boutique 👗, Bijouterie Lorenzo 💎)

### Landings : ld-flowin-demo → "Landing Flowin — Prospection B2B"

---

## URLs CLÉS

```
Dashboard SA        : /dashboard.html
Pro Vence           : /pro?pro=pro-vence
Pro CRF             : /pro?pro=pro-crf-vence
Pro via event       : /pro?ev={evId}

Tombola CRF         : /parcours/tombola?ev=ev-1779134507335-s38y
Quiz CRF            : /parcours/quiz?ev=ev-crf-2026
Quiz Pâques         : /parcours/quiz?ev=ev-paques
Spin Démo           : /parcours/spin?ev=ev-flowin-demo

Landing             : /landing
Landing QR          : /landing?source=qr
```

---

## RÈGLES DE TRAVAIL (ABSOLUES)

1. **Acorn 0 erreur** avant tout push dashboard.html
2. **TypeScript 0 erreur** avant tout push Next.js
3. **Miroir synchronisé** : public/dashboard.html → public/static/dashboard.html (md5 identiques)
4. **Zéro hardcode** : tout depuis Supabase (ev.nom, ev.couleur, lots, partenaires)
5. **external_id** pour tous les upserts joueurs (jamais UUID fake)
6. **on_conflict=external_id** dans les URLs REST Supabase
7. **Scope discipline** : modifier uniquement ce qui est demandé
8. **Block work** : planifier HTML + CSS + JS + SQL alignés avant d'exécuter
9. **Validation stack** : Acorn → TypeScript → build → push
10. **Pas de patches** : recoder proprement en Next.js

---

## ERREURS MAJEURES RENCONTRÉES & SOLUTIONS

### 1. Index unique external_id partiel (CRITIQUE)
**Erreur** : `ON CONFLICT (external_id)` échoue silencieusement — index partiel WHERE external_id IS NOT NULL incompatible
**Solution** : `ALTER TABLE joueurs ADD CONSTRAINT joueurs_external_id_unique UNIQUE (external_id)` (non-partiel)
**Impact** : 0 prospect écrit en Supabase depuis la landing depuis le début

### 2. vercel.json rewrite /pro bloquait ProClient
**Erreur** : `/pro` → `/static/pro_mobile.html` interceptait toutes requêtes avant Next.js
**Solution** : Supprimé le rewrite — Next.js app/pro/page.tsx gère maintenant

### 3. wizTogglePV ne sauvegardait pas
**Erreur** : `state.wiz.draft.id` = undefined (l'id est dans `state.wiz.editingId`)
**Solution** : Utiliser `state.wiz.editingId` + `supaUpsert('events', {pro_visib:...})`

### 4. postMessage flèches preview
**Erreur** : Composants React ne recevaient pas les flowinNav messages
**Solution** : `useEffect(() => window.addEventListener('message', onMsg))` dans les 6 modules

### 5. Preview tab Front ≠ parcours réel
**Erreur** : Tab Front chargeait `/parcours/tombola.html?ev=` (old HTML)
**Solution** : `_ifrUrl = '/parcours/'+module+'?ev='` (Next.js)

### 6. Colonne tags inexistante
**Erreur** : Landing écrivait `tags: ['btob',...]` → erreur SQL silencieuse
**Solution** : `ALTER TABLE joueurs ADD COLUMN tags text[] DEFAULT '{}'`

### 7. proVisib toggles display-only
**Erreur** : Inline JS `!state.wiz.draft.proVisib.KEY` avec KEY=undefined → `!undefined=true` → toggle bloqué ON
**Solution** : Fonction `wizTogglePV(key)` avec gestion undefined + save immédiat

### 8. setExistingTicket manquant
**Erreur** : Après inscription, CTA partenaires restait rouge
**Solution** : `setExistingTicket(tc)` ajouté dans handleSubmit de tous les modules

### 9. Emoji vide `??` vs `||`
**Erreur** : `p.emoji ?? '🤝'` = `'' ?? '🤝'` = `''` (chaîne vide est truthy pour ??)
**Solution** : `p.emoji || '🤝'` (falsy check)

### 10. Route Next.js /landing écrasait vercel.json rewrite
**Erreur** : app/landing (Next.js) interceptait avant le rewrite → servait funnel incomplet
**Solution** : Landing recodée en Next.js propre (LandingClient.tsx, 100% Supabase)

---

## ÉTAT DES MODULES — CHECKLIST PROCHAINE SESSION

### ✅ FAIT
- [x] 6 parcours migrés Next.js (quiz, tombola, spin, vote, quizsolo, quizmaster)
- [x] Dashboard Pro Next.js (ProClient.tsx)
- [x] Landing page Next.js (LandingClient.tsx) — 6 personas, Supabase
- [x] Anti-doublon localStorage + Supabase sur tous les modules
- [x] proVisib toggles fonctionnels + save Supabase
- [x] QR Pro dans tab QR du dashboard
- [x] Partenaires avec bottom sheet + liens sociaux
- [x] Rapport PDF colonnes complètes
- [x] Contrainte UNIQUE external_id corrigée

### ⬜ À FAIRE (prochaine session)

**JEUX & PARCOURS**
- [ ] Tester inscription réelle chaque parcours → vérifier données SQL
- [ ] ev-flowin-demo spin : tester le parcours complet
- [ ] Vérifier que ev-crf-2026 (quiz) écrit correctement
- [ ] Questions banque bq-paques-vence + bq-croix-rouge → valider en jeu

**SUPER EVENTS**
- [ ] Tester la création d'un super event
- [ ] Vérifier le lien super event → events
- [ ] Dashboard SA : page Super Events fonctionnelle

**LANDING FUNNEL**
- [ ] Section démo spin dans la landing (modal ou inline)
- [ ] ev-flowin-demo intégré au tunnel landing
- [ ] Plaquette modules animée (5 cartes après démo)
- [ ] Offres pricing (Free/9.99/19.99/99€) dans la landing
- [ ] Form btob → Supabase source='landing_demo'

**PROSPECTION**
- [ ] Scraping entreprises par persona (6 profils)
- [ ] Export CSV fichier de prospection
- [ ] Outil ou script de recherche par géo + secteur

---

## TARIFS FLOWIN (EN COURS DE DÉFINITION)

| Offre | Prix | Limites |
|---|---|---|
| Free | 0€ | 300 contacts, data exploitée Flowin |
| Solo | 9,99€/mois | Modules custom, pas d'export ni stockage |
| Studio | 19,99€/mois | Export CSV, 1 500 contacts |
| Pro | 99€/mois | Full dashboard, white label |

**Concurrent principal** : Drimify (Edinburgh, 2006, ~660K$ CA, 9 salariés, 0 levée)
**Avantage Flowin** : seul à combiner jeu + CRM + dashboard Pro client pour TPE française

---

## COMMANDE DE DÉMARRAGE PROCHAINE SESSION

```bash
cd /home/claude/flowin
git pull origin main
# Vérifier état
cat SESSION_RECAP.md
# Puis auditer avant de toucher quoi que ce soit
```

