# KICKOFF — Nouvelle conversation (Flowin · parcours master + mode démo)
_À coller tel quel en ouverture de la nouvelle conversation. Faits vérifiés au 31/07/2026._

Tu reprends un travail en cours sur Flowin (SaaS gamification événementielle). Ne recrée rien, cherche l'existant d'abord. Zéro régression sur NDS 2026.

## 1) BOOTSTRAP (à faire en premier, avant toute prod)
1. Demande-moi le **PAT GitHub** courant (ne jamais le committer, repo public → secret-scanning révoque).
2. Clone `flowinevent-ping/flowin-events-` et vérifie DEUX accès : (a) `git fetch` + push OK, (b) Supabase MCP `select 1`. Si un manque → STOP.
3. Lis le handoff : Supabase `handoff_notes` clé `handoff-nds-2026-comm` + le fichier `docs/HANDOFF-parcours-demo.md`.
4. Établis la liste FAIT / RESTE dès l'ouverture.

## 2) ACCÈS / IDs
- Repo : `flowinevent-ping/flowin-events-` (PUBLIC). Vercel auto-deploy `main`, root `/admin`, domaine `flowin-events.vercel.app`. Latence deploy 1-2 min.
- Supabase (MCP, seul accès DB) : `ywcqtupgoxfzkddqkztk` (eu-west-1). Anon key `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`.
- Notion hub : `38c6dcca-9add-81dd-9af2-c93139e06393`.
- Module maître parcours : `admin/app/parcours/nds2026/NDS2026Client.tsx` (variable `MB` ~l.180).
- Onglet preview : `admin/components/pro/ParcoursMobil.tsx` ; pages `/pro/parcours` + `/dashboard/parcours`.

## 3) LIENS DE PRÉVISUALISATION (vrais, cliquables)
- Parcours d'un event du master (mode preview, nav tous écrans) :
  `https://flowin-events.vercel.app/parcours/nds2026?ev=ev-master-superevent-bar&preview=1`
- Page super event master : `https://flowin-events.vercel.app/se/se-master-superevent`
- Onglet « Parcours mobil » dashboard SA : `https://flowin-events.vercel.app/dashboard/parcours`
- Onglet « Parcours mobil » profil pro : `https://flowin-events.vercel.app/pro/parcours?pro=<id_pro>`
- Events démo existants : `/parcours/quiz?ev=ev-demo-quiz`, `/parcours/quizmaster?ev=ev-demo-quizmaster`, `/parcours/quizsolo?ev=ev-demo-quizsolo`, `/parcours/tombola?ev=ev-demo-tombola`, `/parcours/vote?ev=ev-demo-vote`, `/parcours/spin?ev=ev-flowin-demo`, page `/landing`.

## 4) POUSSÉ cette session (mais À VALIDER VISUELLEMENT par Romain)
Tout ci-dessous est **en ligne** sur le master (gaté `MB = preview || cfg.mbLayout`), NDS live inchangé. **Aucun de ces écrans n'a encore été validé visuellement par Romain** — première action de la nouvelle conv : les faire valider via les liens preview.
- Page **Fin** : grille pictogrammes (fait=vert `.coll-b.mbf.on`, à-faire=gris) + emojis retirés. (commits `91e8b96`, `f31217a`)
- **Pop-up bonus** vert + icône ticket + « Gagne un ticket supplémentaire » + « Ce n'est pas maintenant ». (`b41e66a`)
- **Fusion Tickets → Profil** : Profil = 2 sous-onglets (Mes tickets / Mes coordonnées), Tickets retiré de la nav basse. (`38b6ad6`)
- Master super event `se-master-superevent` (22 events, `cfg.mbLayout=true`+`cfg.bonusPopup=true`).

## 5) RESTE À FAIRE — parcours (gaté MB, NDS intact)
1. Emojis restants des AUTRES écrans (resultats, onboard, victoryPopup…) → pictogrammes unifiés (sprite `#i-*`).
2. Page **Partenaires** : bug en-tête/nom absent ; emplacements logos ; logos **cliquables vers la fiche partenaire**.
3. **Tickets par jour** (multi-jours 10-30j) — câbler l'historique tickets/jour (donnée).
4. Anti-scroll : réduire espacements (pas la taille) ; CTA jamais cachés derrière bandeau défilant ni nav basse.
5. **MASTER EVENT (basé Pâques) : PAS encore créé** — dupliquer, branding neutralisé par cfg. Scénario A (jeu→déjà inscrit?Non→quiz→résultat→pop-up bonus→bonus→résultat→règles) ; Scénario B (déjà inscrit→email→infos+tickets→direct règles). Bonus optionnel. 1×/jour.
6. Branding configurable du master (nom/logo/couleurs/textes via cfg).

## 6) OBJECTIF NOUVEAU — MODE DÉMO (vente du jeu)
But : démo one-click **SANS enregistrement** (zéro écriture DB) pour séduire commerçants + organisateurs de festival. UX/UI « vitrine ».
- **Existe déjà, réutiliser** : events `ev-demo-quiz/quizmaster/quizsolo/tombola/vote` (`cfg.demo=true`, live), `ev-flowin-demo` (spin), page `/landing`, mode `preview`.
- **1re étape** : vérifier ce que fait déjà `cfg.demo` dans CHAQUE module (qu'est-ce qui est déjà no-save) AVANT d'étendre.
- Puis étendre `cfg.demo`/`?demo` au parcours `nds2026` (super event) + au master event ; garantir zéro écriture (pas de tirages/joueurs/participations) ; page d'entrée démo listant les modules.

## 7) DÉCISIONS EN ATTENTE (gagnants NDS)
- Bergerie — **Mathis Diquero** (mineur -18, DÉJÀ notifié) : remplacer ou garder ?
- Nook — « 1 bagel offert pour 1 bagel acheté » : **4 gagnants pour 3 places** (pré-existant) : retirer 1 ou passer à 4 ?
- ARA — BSR : manque 1 (ARA laissé volontairement). Cycles963 : manque 1 (archivé).

## 8) RÈGLES (méthode)
- 3 piliers à chaque livrable : GitHub (commit+push) + Supabase `handoff_notes` (prepend) + Notion hub.
- Validation avant push : `tsc --noEmit` + `next build` (puis `git checkout -- admin/tsconfig.tsbuildinfo`) ; HTML via node/vm/Acorn ; `dashboard.html` ⇔ `static/dashboard.html` MD5 identique.
- Pas d'emoji produit. Pas d'opinions non sollicitées. Français voice-to-text.
- Ne jamais dire « regarde » avant d'avoir confirmé que le déploiement Vercel est passé.
- **Précision absolue** : ne rien affirmer sans l'avoir vérifié (grep/view/requête). Distinguer « poussé » de « validé ». Si incertain, le dire.

## 9) PIÈGES RENCONTRÉS (ne pas reproduire)
- Apostrophe dans un `onclick` → casse le JS silencieux → encoder `'` en `%27`.
- `CREATE OR REPLACE` d'une fonction perd le grant `anon` → re-GRANT anon + `NOTIFY pgrst 'reload schema'` (concerne `tirage_lot`, `tirage_soir`).
- Changements gatés `cfg` invisibles en preview → `MB = preview || cfg.mbLayout`.
- Vue lots : valeur parfois « 225 € » (texte) → parser avant cast numeric.
- Échange manuel de gagnant contourne la RPC → vérifier âge + zone du remplaçant vs critère partenaire.
