# PROMPT CLAUDE CODE — Déploiement Flowin v28
# OPConsult BAITA EURL · Romain Collin · 11/05/2026
# Coller ce prompt dans Claude Code après avoir navigué dans le dossier flowin_repo_v2/

---

## CONTEXTE

Projet **Flowin** — SaaS gamification événementiel.
Stack : HTML/CSS/JS vanilla · Supabase eu-west-1 · Vercel · GitHub
Repo GitHub : https://github.com/flowinevent-ping/flowin-events-.git

Architecture 3 dossiers = 3 déploiements Vercel séparés :
- `/admin`    → Dashboard SA+PRO (accès privé)
- `/landing`  → Landing B2B (accès public)
- `/parcours` → Parcours joueur (accès public via QR)

---

## ÉTAPE 1 — VÉRIFICATION STRUCTURE

```bash
ls -la
# Doit afficher : admin/ landing/ parcours/ sql/ docs/ README.md .gitignore

grep "flowin_v28_data" admin/index.html
# Doit retourner 1 ligne
```

---

## ÉTAPE 2 — PUSH GITHUB

```bash
git init
git add .
git commit -m "Flowin v28 — structure 3 dossiers admin/landing/parcours"
git branch -M main
git remote add origin https://github.com/flowinevent-ping/flowin-events-.git
git push -u origin main
```

---

## ÉTAPE 3 — 3 DÉPLOIEMENTS VERCEL SÉPARÉS

```bash
npm install -g vercel
vercel login
```

### 3A — Déployer /admin (dashboard)
```bash
cd admin
vercel --prod --yes --name flowin-admin
cd ..
# Noter l'URL : https://flowin-admin.vercel.app
```

### 3B — Déployer /landing
```bash
cd landing
vercel --prod --yes --name flowin-landing
cd ..
# Noter l'URL : https://flowin-landing.vercel.app
```

### 3C — Déployer /parcours
```bash
cd parcours
vercel --prod --yes --name flowin-parcours
cd ..
# Noter l'URL : https://flowin-parcours.vercel.app
```

---

## ÉTAPE 4 — SUPABASE SETUP

### 4.1 Créer le projet
- https://supabase.com → New project
- Nom : flowin · Région : **eu-west-1 (Paris)** · Mot de passe fort
- Attendre ~2 min
- Copier : **Project URL** + **anon public key** (Settings → API)

### 4.2 Exécuter les schemas SQL dans l'ordre
Supabase → SQL Editor :

**PREMIER — schema_supabase_v2.sql** (tables de base)
```sql
-- Copier-coller le contenu de sql/schema_supabase_v2.sql
-- Cliquer RUN
```

**DEUXIÈME — schema_supabase_v3.sql** (B2B + RLS)
```sql
-- Copier-coller le contenu de sql/schema_supabase_v3.sql
-- Cliquer RUN
```

**Vérification :**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
-- Attendu : banques, events, joueurs, lots, partenaires, pros
```

### 4.3 Créer les comptes Auth
Supabase → Authentication → Users → Add user :

| Email | Rôle |
|-------|------|
| romain@opconsult.fr | SA |
| animation@ville-vence.fr | PRO |

```sql
INSERT INTO profiles (id, role, pro_id) VALUES
  ((SELECT id FROM auth.users WHERE email='romain@opconsult.fr'), 'sa', null),
  ((SELECT id FROM auth.users WHERE email='animation@ville-vence.fr'), 'pro', 'pro-vence');
```

---

## ÉTAPE 5 — RLS SUPABASE (sécurité données)

Les policies RLS sont déjà dans schema_supabase_v3.sql.
Vérifier qu'elles sont actives :

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
-- Doit lister les policies pour joueurs, events, pros, lots
```

**Ce que ça garantit :**
- `/landing` et `/parcours` = écriture joueurs uniquement, lecture interdite
- `/admin` = accès complet selon rôle SA/PRO
- Un joueur ne peut jamais lire les données d'un autre joueur

---

## ÉTAPE 6 — CONFIGURER LE DASHBOARD

Ouvrir https://flowin-admin.vercel.app dans le navigateur :

1. Se connecter SA
2. Paramètres → Connecteurs
3. Saisir URL Supabase + anon key
4. Cliquer **Sauvegarder et tester** → vérifier ✅
5. Cliquer **Lancer la migration Pâques → Supabase**

Vérifier dans Supabase :
```sql
SELECT COUNT(*) FROM joueurs;
-- Attendu : 186
SELECT COUNT(*) FROM joueurs WHERE optin = true;
-- Attendu : 124
```

---

## ÉTAPE 7 — METTRE À JOUR LES URLS QR

Dans le dashboard admin :
- ev-paques → onglet QR → URL : https://flowin-parcours.vercel.app?ev=ev-paques
- ev-nds    → onglet QR → URL : https://flowin-parcours.vercel.app?ev=ev-nds
- ev-flowin-demo → onglet QR → URL : https://flowin-landing.vercel.app

---

## ÉTAPE 8 — TEST COMPLET

```bash
# Checklist sécurité
echo "Admin  :" && curl -s -o /dev/null -w "%{http_code}" https://flowin-admin.vercel.app
echo "Landing:" && curl -s -o /dev/null -w "%{http_code}" https://flowin-landing.vercel.app
echo "Parcours:" && curl -s -o /dev/null -w "%{http_code}" https://flowin-parcours.vercel.app
```

Test manuel iPhone (CRITIQUE — iOS Safari) :
1. Ouvrir https://flowin-admin.vercel.app en navigation privée → login SA → tester events
2. Ouvrir https://flowin-landing.vercel.app → parcours B2B complet → vérifier prospect dans Supabase
3. Ouvrir https://flowin-parcours.vercel.app?ev=ev-nds → parcours joueur → vérifier joueur dans Supabase

---

## RÉCAPITULATIF URLS

| Service | URL |
|---------|-----|
| Dashboard admin | https://flowin-admin.vercel.app |
| Landing B2B | https://flowin-landing.vercel.app |
| Parcours joueur | https://flowin-parcours.vercel.app |
| GitHub repo | https://github.com/flowinevent-ping/flowin-events- |
| Supabase | https://supabase.com/dashboard/project/[ID] |

---

## EN CAS D'ERREUR

**CORS Supabase**
→ Supabase → Settings → API → Redirect URLs
→ Ajouter les 3 URLs Vercel

**RLS bloque l'écriture depuis landing/parcours**
→ Vérifier que l'anon key est bien celle du projet
→ Vérifier les policies INSERT dans pg_policies

**localStorage.clear() au boot**
→ `grep "localStorage.clear()" admin/index.html` doit retourner 0
→ Déjà corrigé en v24 — si 1 résultat, alerter Romain

**Push GitHub échoue (auth)**
→ Générer un token : GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) → cocher "repo" → copier le token
→ Utiliser le token comme mot de passe lors du push
