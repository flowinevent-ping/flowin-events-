# HANDOFF — Parcours super event / event + Mode Démo (marque blanche)
_Dernière mise à jour : 31/07/2026_

## 0. RÈGLES ABSOLUES (méthode — à respecter à chaque fois)
- **Zéro régression sur NDS 2026** (édition intouchable). Tout nouveau comportement est gaté par `cfg` (flag) OU par le mode `preview`/`demo`. NDS live non-preview ne bouge jamais.
- **On ne recrée RIEN** : chercher l'existant d'abord, puis dupliquer/étendre.
- **3 piliers à chaque livrable** : GitHub (commit+push) + Supabase `handoff_notes` (clé `handoff-nds-2026-comm`, prepend) + Notion hub (`38c6dcca-9add-81dd-9af2-c93139e06393`).
- **Bootstrap** : cloner `flowinevent-ping/flowin-events-`, vérifier (a) git push, (b) Supabase MCP `select 1`, lire ce handoff. Si un accès manque → STOP.
- **PAT GitHub** : demander à Romain à chaque session, **JAMAIS committer** (repo public → secret-scanning révoque). Push : `https://x-access-token:<TOKEN>@github.com/flowinevent-ping/flowin-events-.git`.
- **Validation avant push** : Next.js `tsc --noEmit` + `next build` (puis `git checkout -- admin/tsconfig.tsbuildinfo`) ; HTML via `node --check`/vm/Acorn ; `dashboard.html` ⇔ `static/dashboard.html` MD5 identique.
- **Pas d'opinions/réflexions non sollicitées. Pas d'emoji produit.**
- Environnement : bash ne joint PAS `*.supabase.co` ni Vercel. web_fetch bloqué sur URL non issue d'une recherche. Supabase MCP = seul accès DB. Multi-statements `execute_sql` = seul le dernier résultat.

## 1. FAIT cette session (poussé sur main)
### Parcours master marque blanche
- **Master super event créé** : `se-master-superevent` ("Master — Super Event (marque blanche)"), 22 events dupliqués de NDS via RPC `dupliquer_super_event`. NDS intact (hash super_event identique avant/après, 100% non-destructif = INSERT only).
- Flags sur les 22 events master : `cfg.mbLayout=true` + `cfg.bonusPopup=true`.
- **Variable `MB = preview || cfg.mbLayout`** (`NDS2026Client.tsx` ~l.180) : le nouveau layout s'affiche en preview ET sur le master ; NDS live non-preview inchangé.
- **Page Fin** : grille pictogrammes type Tickets (fait=vert `.coll-b.mbf.on`, à-faire=gris) au lieu de la liste verte ; emojis retirés (ticket→`#i-ticket`, 🎉/📷 retirés).
- **Pop-up bonus** : vert (`#16a34a→#3ED598`) + icône ticket + « Gagne un ticket supplémentaire » + « Ce n'est pas maintenant ». Se relance à chaque station (chaque scan = reload = ref reset).
- **Fusion Tickets→Profil** : Profil = page unique, 2 sous-onglets (Mes tickets = compteur hero + collection stations ; Mes coordonnées = prénom/email/tel + opt-in). Bouton Tickets retiré de la nav basse sous MB.
- **Onglet « Parcours mobil »** (dashboard SA `/dashboard/parcours` + profil pro `/pro/parcours`, composant `ParcoursMobil.tsx`) : iframe du vrai parcours en mode preview (`&preview=1`) + sélecteur d'événement + `/se/<seId>`.
- Commits : `da69daa`, `3b295e9`, `a4a7e9e`, `91e8b96`, `f31217a`, `b41e66a`, `38b6ad6`.

### Emails gagnants / tirages
- Signature « Flowin en premier, sans "et" » → « Flowin, les Nuits du Sud, la Ville de Vence » (`mail-gagnant.js`, `dashboard.html` ×2 miroir, `lots-nds.html`) + mail pro « Flowin & les Nuits du Sud » (`tirage-nds.html`). Commits `73ec277`, `406a0c8`.
- Lien billet téléchargeable confirmé (mail gagnant « >>> TON BILLET EST ICI <<< » + `billets-partenaires.html?t=<token>`) + double-envoi pro (`tirage-nds.html` l.182). RPC `consulter_lot` testée OK.
- **FIX MAJEUR bouton « Tirer le reste »** (commit `671aefa`) : le nom de lot « Bon d'achat » contient une **apostrophe** qui cassait le `onclick` (encodeURIComponent n'encode pas `'`) → bouton silencieux sur GP/Bergerie/Utile/Giordano (Nook/ARA marchaient car sans apostrophe). Correctif : encoder `'` en `%27` (redécodé par `tirerLot`).
- Grant `anon` ré-accordé sur `tirage_lot` + `tirage_soir` (perdu lors des CREATE OR REPLACE) + `NOTIFY pgrst reload`.
- Critères tirage : **Utile → toutes tranches d'âge** ; **ARA laissé tel quel** (décision Romain).

## 2. RESTE À FAIRE — parcours (sur le MASTER, gaté MB ; NDS intact)
1. Retirer les emojis restants des AUTRES écrans (resultats 🎟️, onboard, victoryPopup 🎉/📷…) → pictogrammes unifiés (sprite `#i-*`, set page Tickets).
2. Page Partenaires : corriger le bug en-tête/nom de page absent ; ajouter les emplacements logos partenaires ; rendre les logos CLIQUABLES vers la fiche partenaire.
3. Page Tickets/Profil : cumul tickets PAR JOUR (multi-jours 10-30j) — nécessite de câbler l'historique des tickets par jour (donnée).
4. Réduire les espacements (pas la taille) anti-scroll ; CTA jamais cachés derrière le bandeau défilant ni la nav basse.
5. **MASTER EVENT (basé Pâques) : PAS encore créé.** Dupliquer un event Pâques en marque blanche, branding neutralisé par cfg. Déroulé figé : Scénario A (jeu → « Déjà inscrit ? » Non → quiz → résultat → pop-up bonus → bonus → résultat → règles/tirage-ou-gain) ; Scénario B (déjà inscrit → email → infos+tickets → direct règles, ne rejoue PAS). Question bonus optionnelle. 1×/jour conservé.
6. Branding configurable du master (nom, logo, couleurs, textes) via cfg — définir le mécanisme.

## 3. NOUVEAU — MODE DÉMO (vente du jeu en réel)
- **Objectif** : démonstration du jeu en réel pour SÉDUIRE commerçants + organisateurs de festival. Interaction **one-click à chaque fois, SANS enregistrement** (aucun tirage/joueur/participation créé en base). Nom : « démo ».
- **EXISTANT à réutiliser (NE PAS recréer)** :
  - Events démo en base (super_event_id=null, status live) : `ev-demo-quiz`, `ev-demo-quizmaster`, `ev-demo-quizsolo`, `ev-demo-tombola`, `ev-demo-vote` (tous `cfg.demo=true`), `ev-flowin-demo` (spin, « Découvrez Flowin »).
  - Page `/landing` (référencée dans `SpinClient.tsx` : retour accueil si `ev-flowin-demo`).
  - Mode `preview` (`?preview`) = navigation sans save → base d'un mode démo.
- **À FAIRE** : vérifier d'abord ce que fait `cfg.demo` dans CHAQUE module (quoi est déjà "no-save") avant d'étendre. Étendre le mode démo (`cfg.demo`/`?demo`) au parcours `nds2026` (super event) + au master event ; garantir zéro écriture en base ; UX/UI « vitrine » séduisante. Éventuellement une page d'entrée démo listant les modules.

## 4. DÉCISIONS EN ATTENTE (gagnants)
- Bergerie — Mathis Diquero (mineur -18, DÉJÀ notifié) : remplacer ou garder ?
- Nook — « 1 bagel offert pour 1 bagel acheté » : 4 gagnants pour 3 places (pré-existant) : retirer 1 ou passer le lot à 4 ?
- ARA — BSR : manque 1 (ARA laissé volontairement ; cible réelle BSR = mineurs exclus → lot problématique).
- Cycles963 : manque 1 (archivé, laissé).

## 5. PROBLÉMATIQUES RENCONTRÉES (ne pas reproduire)
- **Apostrophe dans un nom interpolé dans un `onclick`** → casse le JS silencieusement. Toujours encoder `'` en `%27` (ou éviter l'interpolation onclick).
- **CREATE OR REPLACE peut faire perdre le grant `anon`** → toujours re-GRANT anon + `NOTIFY pgrst 'reload schema'` après recréation de `tirage_lot`/`tirage_soir`.
- Changements gatés `cfg` invisibles en preview → `MB = preview || cfg.mbLayout`.
- Latence déploiement Vercel (1-2 min) → ne jamais dire « regarde » avant confirmation du déploiement.
- Échange manuel de gagnants contourne la RPC → toujours vérifier âge + zone du remplaçant vs critère du partenaire.
- Vue lots : la valeur peut être « 225 € » (texte) → parser avant cast numeric.

## 6. RESSOURCES / IDs
- Repo : `flowinevent-ping/flowin-events-` (PUBLIC), Vercel auto-deploy `main`, root `/admin`, domaine `flowin-events.vercel.app`.
- Supabase : `ywcqtupgoxfzkddqkztk` (eu-west-1). Anon key `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`.
- Master super event : `se-master-superevent` (events `ev-master-superevent-*`, module `nds2026`). Aperçu : `/parcours/nds2026?ev=ev-master-superevent-bar&preview=1` ; `/se/se-master-superevent`.
- Module maître parcours : `admin/app/parcours/nds2026/NDS2026Client.tsx`. 11 écrans. `MB` ~l.180.
- `ParcoursMobil` : `admin/components/pro/ParcoursMobil.tsx`. Pages `/pro/parcours` + `/dashboard/parcours`.
- Events démo : `ev-demo-*` + `ev-flowin-demo`. Page `/landing`.
- Handoff : Supabase `handoff_notes` clé `handoff-nds-2026-comm` ; Notion hub `38c6dcca-9add-81dd-9af2-c93139e06393`.
