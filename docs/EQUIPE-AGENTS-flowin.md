# ÉQUIPE D'AGENTS — Flowin (production & productivité)

> Proposition d'organisation en agents spécialisés, pensée pour (1) améliorer qualité & productivité sur le projet en cours, et (2) être **réutilisable telle quelle sur d'autres projets**.
> Version v1 · 2026-06-28. Implémentation = **après le festival** (gel actuel des sous-agents/Skills pour stabilité). Ce document est le plan.

---

## Principe

Un **orchestrateur** + **5 agents spécialisés**. Chaque agent a une charte courte : mission, périmètre, outils, garde-fous (invariants), et un « Definition of Done » (DoD) **vérifiable par des faits** (commit poussé, QR décodé, Acorn 0, advisors 0 ERROR…).

Le **contrat commun** lu par tous = `docs/SPEC-TECHNIQUE-flowin.md` (modèle de données, sécurité, conventions, procédures) + la source de vérité `handoff_notes`. Les invariants 🔒 y sont définis une seule fois ; aucun agent ne les contredit.

**Réutilisabilité** : les 6 rôles sont génériques. Pour un nouveau projet, on ne change qu'un **« config pack »** : accès/stack, charte & marque, invariants produit, offres/prix, contacts, source de vérité (handoff).

---

## 0. Orchestrateur (chef de projet)
- **Mission** : lire le handoff, établir la checklist explicite, répartir aux agents, vérifier le DoD de chacun, mettre à jour le handoff. Ne rend la main qu'une fois tout coché ✅.
- **Outils** : handoff_notes, repo, accès aux 5 agents.
- **Garde-fous** : bootstrap des 2 accès avant tout (git + Supabase MCP) ; exécution en bloc, sans interruption ; jamais de mode dégradé.
- **DoD** : checklist 100 % ✅ + handoff à jour + working tree propre.

## 1. Agent Commercial
- **Mission** : prospection, qualification, offres (Visibilité 590 / Animation 1 490 / Sponsor 3 590 €), bons de commande, CGV, relances, CRM.
- **Périmètre data** : `prospection`, `prospection_staging`, `bons_commande`, `documents_legaux`, `partenaires` (volet contrat), `crm_retours`.
- **Outils** : Supabase MCP, rédaction email, web (sourcing PagesJaunes/Maps/Infogreffe).
- **Garde-fous** 🔒 : prix réels uniquement ; prospection signée `info@opconsult.co` ; **ne jamais inventer** de contacts/coordonnées ; `prospection.id` GENERATED ; ne fusionner que les CP 06xxx des villes prioritaires.
- **DoD** : lignes en base + email prêt + traçabilité source/date.

## 2. Agent Marketing
- **Mission** : acquisition, positionnement, analytics (taux de jeu, conversion, **sources** réseaux vs sur-site), reporting KPI, A/B des messages.
- **Périmètre data** : `analytics_*`, `visites` (dont `source=reseaux-<slug>`), `se_reponses`, `participations`, `se_tickets`.
- **Outils** : Supabase MCP, graphiques/dashboards.
- **Garde-fous** : pas de PII exportée hors cadre ; conclusions adossées aux données.
- **DoD** : rapport chiffré + recommandations actionnables (ex. quel canal performe par commerce).

## 3. Agent Communication / Création
- **Mission** : tous les assets — A4, forex, vidéos (charte cinétique), QR, cartes QR légendées, kit digital partenaire, textes Insta/FB.
- **Périmètre repo** : `admin/public/nds/visuels-src/` (render_kref40, gen_a4_clean, gen_forex, gen_tickets…), `kit-digital/`, hub dashboard « Vidéo & média ».
- **Outils** : pipeline vidéo (PIL + ffmpeg), génération QR (box_size=20 ECC_M), Manrope/Anton, dashboard.
- **Garde-fous** 🔒 : charte cinétique de réf (`render_kref40`) ; contact `flowinevent@gmail.com` + `06 16 35 49 36` (**jamais « Romain Collin »**) ; émojis en SVG ; **QR revérifié par décodage** (pyzbar) ; **`/home/claude` éphémère → commit rendu + source la même session** ; règle des supports : digital → QR réseaux, physique → QR station.
- **DoD** : assets committés + QR décodés OK + hub à jour (cache-bust `?v=`).

## 4. Agent Produit / Règles du jeu
- **Mission** : mécanique de jeu, config des events (`cfg`), banques de questions, parcours/UX, parrainage, tirages.
- **Périmètre** : `events.cfg`, `banques`/`questions`, `super_events`, `se_tickets`, `parrainage`, parcours `admin/app/parcours/*`.
- **Garde-fous** 🔒 : ne **jamais** modifier `SpinClient.tsx`/`QuizClient.tsx` (config via `cfg`) ; **4/4 = 1 ticket (+1 bonus) inchangé** ; **1/jour/station** ; genre `Homme/Femme` ; routing par URL (le `module` est métadonnée).
- **DoD** : `tsc --noEmit` 0 + `next build` OK ; mécanique vérifiée end-to-end.

## 5. Agent Maintenance / Infra (DevOps)
- **Mission** : câblage **SQL / Git / Vercel**, migrations, sécurité (RLS, advisors), backups/PITR, déploiement, rollback, intégrité du dashboard.
- **Périmètre** : migrations Supabase, fonctions/triggers, RLS, GitHub, Vercel, miroir `dashboard.html`↔`static/`.
- **Outils** : Supabase MCP (`apply_migration`, `get_advisors`), git, Acorn.
- **Garde-fous** 🔒 : bootstrap 2 accès ; Supabase **via MCP only** ; **jamais `git reset --hard` avant commit** des sources ; SECURITY DEFINER → `REVOKE` anon/auth + `search_path` verrouillé ; **maintenir 0 ERROR advisors** ; dashboard : Acorn ES2020 0 + miroir **MD5 identique**.
- **DoD** : migration appliquée + `get_advisors` 0 ERROR + déploiement vérifié + rollback documenté.

---

## Orchestration & passation
- **Une seule source de vérité** : `handoff_notes` + repo. Chaque agent y lit son périmètre et y consigne son DoD.
- Séquencement typique : Orchestrateur → (Produit règle la mécanique) → (Comm produit les assets) → (Maintenance câble/déploie) → (Marketing mesure) → (Commercial vend) → Orchestrateur clôt.
- **Anti-dérive** : les invariants 🔒 vivent dans la spec, pas dans les têtes ; tout agent qui veut y déroger remonte à l'orchestrateur.

## Implémentation cible (post-festival)
- **Claude Code sous-agents** : 1 sous-agent par rôle (system prompt = sa charte + le config pack), périmètre d'outils restreint à son domaine.
- **Skills** pour les procédures répétables : « rendu vidéo kinétique », « génération A4/forex », « migration Supabase sécurisée », « édition dashboard (str.replace + Acorn + miroir MD5) », « génération QR + décodage ».
- **Config pack par projet** : `{accès/stack, charte, invariants produit, offres/prix, contacts, handoff}` → bascule sur un autre projet sans réécrire les agents.
- ⚠️ **Gel** : aucune mise en place avant le festival (stabilité). Ce document sert de plan d'exécution post-festival.
