# Rapatriement sur un compte maître — GitHub + Supabase + Vercel

> But : tout le projet (code, base, déploiement) sous **UN seul email maître**, au lieu de 3 comptes différents aujourd'hui.
> Règle d'or : **JAMAIS pendant le festival (9–18 juillet)**. À froid, étape par étape, on teste après CHAQUE étape.
> Décision « go/no-go » selon le risque (cf. §0 ci-dessous).

## 0. État actuel (point de départ)
- **GitHub** : repo `flowin-events-` appartient au compte **`flowinevent-ping`**. ⚠️ Vérifié le 26/10 : ce n'est **pas une organisation GitHub**, c'est un **compte personnel** (login classique, dashboard "Good evening, flowinevent-ping!") — la page `github.com/orgs/flowinevent-ping/people` renvoie donc toujours 404, pour n'importe qui, ce n'est pas une erreur d'accès. Le compte `romaincollin-design` (celui de Romain) n'est que **collaborateur "Write"** sur le repo, pas Admin. Page de gestion : `github.com/flowinevent-ping/flowin-events-/settings/access` (max possible pour un collaborateur ici = **Admin**, il n'y a pas d'"Owner" à transférer sans redonner les identifiants du compte `flowinevent-ping` lui-même).
- **Supabase** : projet `ywcqtupgoxfzkddqkztk` (eu-west-1) sous le compte Google **romain.collin@gmail.com**, org « romain.collin@gmail.com's Org », nom de projet trompeur « flowin revision olivia » (c'est bien le projet NDS).
- **Vercel** : équipe `flowinevent-6745s-projects` (team id `team_q8jKowQF6mdJhLjWnG03U8Ur`), projet `flowin-events` (id `prj_lV4qVi0hyEsqFt27me5yE04LUhKo`). Auto-deploy depuis `main`, prod `flowin-events.vercel.app`. Propriétaire exact de l'équipe non confirmé au 26/10 (connecteur Claude systématiquement en échec d'autorisation sur cette équipe ce soir-là, cause non identifiée — pas forcément lié à la question du compte).
- Pièges : compte `flowinevent` → projet Supabase VIDE `atddutvzklcgiqxlpvla` (PAS le NDS). `3opconsult` → projet Nexto `wmiawwaxwlvascyflpba` + `Jeffrey-crm` (`pxqeelvavgzfyrwtgmib`).
- ⚠️ **Piège connecteur Claude (observé 26/10)** : les connecteurs Supabase/Vercel de la session Claude n'ont qu'**une seule identité active à la fois**. Comme Supabase/Vercel/Google partagent le même sélecteur de compte Google, ré-authentifier UN service (ex. Vercel) peut faire basculer silencieusement la connexion d'un AUTRE service (ex. Supabase passe de `ywcqtupgoxfzkddqkztk` à l'org 3opconsult) sans rien demander. Symptôme : des requêtes qui marchaient se mettent à échouer en "permission refusée" ou renvoient des projets inattendus. Réflexe : si une session Claude a soudain des résultats Supabase/Vercel qui ne correspondent plus à NDS, re-churcher via `list_projects` avant de rien écrire.

## 0bis. Risque immédiat à arbitrer AVANT le festival
- **Supabase free-tier = pause automatique après 7 jours d'inactivité.** Pendant le festival l'activité est massive (aucun risque), mais une période creuse AVANT pourrait le mettre en pause. → **Passer le projet en Pro** supprime ce risque (et débloque les transferts d'org). À décider en priorité.

## 1. Préalable : choisir l'email maître
- Recommandé : un email **pro stable** que Romain contrôle durablement (ex. `info@opconsult.co` ou `romain@flowin.events`), pas un gmail perso.
- Créer/identifier les comptes GitHub + Supabase + Vercel **sous cet email** (ou inviter cet email comme owner).

## 2. Ordre d'exécution (du moins risqué au plus critique)

### Étape A — Vercel (le moins risqué : le déploiement se reconstruit)
1. Transférer le projet Vercel vers l'équipe/compte maître **ou** recréer un projet Vercel sous le compte maître pointant sur le même repo GitHub (root `/admin`, framework Next.js).
2. Rebrancher le domaine `flowin-events.vercel.app` (ou domaine custom) sur ce projet.
3. **Vérif** : un push sur `main` déclenche bien un deploy ; la prod répond.

### Étape B — GitHub
- **Option A (recommandée, sans changer l'URL)** : garder le repo dans `flowinevent-ping`, **ajouter le compte maître comme owner/admin**, créer un **nouveau token fine-grained** (Contents R/W) depuis le compte maître, **passer le repo en privé**.
  → Avantage : l'URL `flowinevent-ping/flowin-events-` ne change pas → remote, Vercel et procédures restent valides. Seul le token change.
- **Option B (transfert du repo)** : transférer vers le compte maître → l'URL devient `MAITRE/flowin-events-` → il FAUT mettre à jour : (1) le remote local, (2) le token, (3) la connexion Git de Vercel (re-link). Plus risqué.
- **Vérif** : `git push` fonctionne avec le nouveau token ; Vercel redéploie.

### Étape C — Supabase (le plus critique = c'est la prod du jeu)
> **Atout clé** : transférer le PROJET vers une autre org **ne change PAS le ref `ywcqtupgoxfzkddqkztk`** → l'URL API, la **clé anon**, les **edge functions** et les **triggers** restent identiques → **AUCUN changement de code nécessaire**.
1. **Backup d'abord** : sauvegarde DB (console Supabase → Database → Backups, ou `pg_dump`).
2. Org cible : l'org sous l'email maître (compatible plan — un transfert peut exiger que l'org cible soit en payant).
3. Project Settings → General → **Transfer project** → vers l'org maître.
4. **Ré-autoriser le connecteur Claude/Supabase MCP** sur l'org maître (sinon les sessions Claude perdent l'accès DB).
5. (Recommandé) Passer le projet en **Pro** (supprime la pause auto).
6. **Vérif** : `select 1` via MCP ; le jeu charge ; un bon de commande s'insère ; un email de notif part (si domaine Resend vérifié).

## 3. Après le rapatriement (obligatoire)
- Mettre à jour ce repo : **HANDOFF §2 (accès)** + ce fichier.
- Mettre à jour la **mémoire projet Claude** : nouveau token GitHub, org Supabase maître, nouveau remote si Option B.
- Re-tester le **bootstrap auto-push** (clone + push) dans une conversation neuve.

## 4. Garde-fous
- Backup DB avant l'étape Supabase.
- Commit de référence avant de commencer (rollback possible).
- Tester service par service, jamais tout d'un coup.
- **Jamais pendant le festival.** En cas de doute sur le risque → reporter.
