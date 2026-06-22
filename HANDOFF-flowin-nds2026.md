# HANDOFF — Flowin / Nuits du Sud 2026

> Document de reprise. Dernière mise à jour : 22/06/2026. HEAD au moment du handoff : voir `git log`.
> Objectif : reprendre le projet dans une nouvelle session SANS dégradation ni perte des tâches accomplies.

## 1. Projet
- Flowin = SaaS de gamification événementielle (marque OPConsult / société BAITA EURL, Vence 06140), opérateur unique : Romain Collin.
- Déploiement actif : **Nuits du Sud 2026** (festival 9–18 juillet 2026, Place du Grand Jardin, Vence).
- Coordonnées commerciales OFFICIELLES (ne jamais inventer/substituer) : info@opconsult.co · 06 16 35 49 36.

## 2. Stack & accès
- Repo GitHub : `flowinevent-ping/flowin-events-` (**public**) → Vercel auto-deploy depuis `main`, root `/admin`.
- Dashboard SA : monolithe vanilla JS `admin/public/dashboard.html` (~12 5xx lignes) + **miroir MD5-identique** `admin/public/static/dashboard.html`.
- Front joueur + pro : Next.js 14 App Router sous `admin/`.
- Supabase : project_id `ywcqtupgoxfzkddqkztk` (eu-west-1).
- Clé anon **publique par design** : `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`.
- Remote push : `https://x-access-token:<TOKEN_GITHUB>@github.com/flowinevent-ping/flowin-events-.git`
  - **<TOKEN_GITHUB>** = token fine-grained (Contents R/W, expire ~17 sep 2026). **JAMAIS en clair dans le repo** (public + GitHub Push Protection). Conservé dans la mémoire du projet Claude et chez Romain. Si push 401 → token périmé, demander le courant à Romain.
- Commits : auteur `Romain Collin <romain@flowin.events>`.

## 3. Bootstrap obligatoire à chaque session
1. `git clone` + `git log` + push fonctionnel (vérifier `git ls-remote`).
2. `execute_sql` trivial (`select 1`) via Supabase MCP.
→ Si l'un des deux manque : STOP, signaler, ne pas continuer en mode dégradé.

## 4. État au 22/06/2026 — TÂCHES ACCOMPLIES (ne pas refaire)
### Sécurité (appliqué en prod, sans risque)
- Vues `SECURITY DEFINER` → `security_invoker` (v_parrainage_commerce, v_nds_commerces_carte, v_bons_achat_nds).
- RLS activée sur `documents_legaux`.
- `search_path` verrouillé sur toutes les fonctions `public`.
- Anti-triche : `EXECUTE` révoqué (anon/authenticated) sur toutes les fonctions `SECURITY DEFINER` SAUF `crm_landing_flowin_upsert`, `search_ecoles`, `upsert_ecole`.
- Résultat scan : **0 ERROR** (était 4).
- Migrations appliquées : `harden_security_safe_step1`, `harden_revoke_secdef_functions`, `bons_commande_add_cgv_tracking`.

### CGV (complet)
- Brouillon en base : `documents_legaux` id=`cgv-nds-2026`, statut `draft`, version `v1-draft` (À VALIDER PAR JURISTE).
- Colonnes ajoutées à `bons_commande` : `cgv_version`, `cgv_acceptee_at`.
- Page publique : `admin/public/cgv-nds.html` (charge les CGV depuis la base).
- Bon de commande `admin/public/bon-commande-nds.html` : case « j'accepte les CGV » + lien, **bloquante** avant signature ; enregistre version + date.
- Dashboard : section **SYSTÈME → CGV / Légal** (renderCgv/loadCgv/cgvSave) — édition contenu + version + statut, écriture directe en base.

### Mécanique de jeu (vérifiée, conforme, NE PAS changer)
- NDS2026Client.tsx : **4/4 = 1 ticket** + 1 ticket si question bonus faite ; max 2/station/jour ; cumul par station/jour pour le tirage manuel. Décision Romain confirmée.

### Prospection (table public.prospection)
- Nettoyée : doublons supprimés ; **28 fiches fictives** (seed « Type+Ville », ids ~1459–1487) marquées note=`SEED a verifier/remplacer...`.
- ~178 fiches sans tél : dont **129 réelles** (adresse présente) à compléter, + 28 seed.
- Compléter tél/email = via bouton **Scraping Maps** (collages Romain) → upsert qui complète les tél vides.
- Règles : jamais inventer ; champ non sourcé = NULL ; CP 06xxx ; etat défaut `a_contacter` ; id GENERATED ALWAYS (ne pas fournir).

### Doc préparée
- `docs/sql/securite-durcissement-post-festival.md` : plan complet de durcissement (à dérouler APRÈS le 9 juillet).

## 5. RESTE À FAIRE
### Dépend de Romain
- **CGV** : faire valider par un juriste → Dashboard CGV/Légal : coller le texte validé, statut `validé`, version à jour.
- **Prospection** : Scraping Maps ville par ville → coller les sorties pour compléter tél/email.
- **Repo GitHub → privé** (Settings GitHub) : retire l'exposition publique du code + clé anon. PRIORITAIRE.
- **Supabase Auth** : activer « Leaked Password Protection » (2 clics console).

### Sécurité — accès dashboard (à décider)
- Le dashboard n'a **aucun login** : accessible par URL directe, s'ouvre en Super Admin. Aucun lien depuis le jeu/pro n'y mène, mais l'URL est devinable.
- Mesure rapide possible : mot de passe d'accès client-side (bloque les curieux, pas une sécurité absolue car clé anon dans le source).
- Vraie protection = séparer l'accès admin de la clé anon (étape 1 du plan post-festival).

### Post-festival (NE PAS toucher avant le 9 juillet — gel)
- Durcissement RLS avancé : séparer admin/joueurs (le dashboard fait INSERT/UPDATE/DELETE en anon → verrou), puis restreindre anon. Voir `docs/sql/securite-durcissement-post-festival.md`.
- Test de charge (connexions massives) : non fait.
- Skills / sous-agents Claude Code : après le 9 juillet.

## 6. Conventions & règles
- Fichiers NO-TOUCH : `nds2026Design.ts`, `SpinClient.tsx`, `QuizClient.tsx` (modules maîtres ; config via `cfg` en base).
- Dashboard : validation **Acorn ES2020 = 0 erreur** + miroir `static/dashboard.html` **MD5-identique** avant tout push.
- Next.js : `tsc --noEmit` + `next build` (lire le log).
- Gros fichiers : édition par **Python `str.replace()` + assertions** (pas de sed multiligne).
- Push rejeté (non-fast-forward) : `git fetch origin && git reset --hard origin/main`, réappliquer, repush. Vérifier via `git ls-remote`.
- Supabase MCP : `execute_sql` ne renvoie que le résultat de la DERNIÈRE requête ; PostgREST cap 1000 lignes (paginer) ; découverte colonnes via `jsonb_object_keys(to_jsonb(row))`.
- Formulaires : sexe = Homme / Femme (+ vide), jamais « Autre ».
- Gel total de l'architecture pendant le festival (9–18 juillet).
- Communication Romain : français direct, voice-to-text (fautes à interpréter par contexte), ton factuel, pas d'anthropomorphisme.
