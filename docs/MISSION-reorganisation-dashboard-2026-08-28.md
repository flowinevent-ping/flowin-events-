# Mission — Réorganisation du dashboard (à partir du 28/08/2026)

> ⚠️ **Si cette session tourne dans Cowork** : le repo `flowinevent-ping/flowin-events-`
> doit être attaché comme **source de la tâche au moment de sa création**, dans
> l'UI, avant de coller ce document. Un git push échouant avec
> `access denied by the git proxy: ... is not in this session's authorized
> repository set → 403` n'est PAS un problème de token — c'est ce réglage,
> et aucune information textuelle ne peut le contourner. Rencontré et
> documenté le 28/08.

Ce document remplace la logique "réagir signalement par signalement" par une
mission de fond, donnée directement par Romain le 28/08. Toute session qui
reprend ce travail doit lire ce fichier + `docs/patterns-bugs-connus.md` +
`docs/audit-dashboard-organisation-2026-08.md` avant de coder quoi que ce
soit.

## 1. État des problèmes signalés le 27-28/08 — persistants ou non

### Corrigés et vérifiés (poussés sur `main`, à l'unité — voir hash)
- CRM sans tri/clic : `btob-prospects`, `crm-retours`, `gagnants`, `nds-bon-commande`, `nds-participants` (`f4a1105`, `4b15f60`, `90a80c7`)
- Bug de fond scroll bloqué (`.sa-main` avait `overflow:hidden` au lieu de `overflow-y:auto`) — `613c30d`
- Liens morts sur Vidéo & média (Affiche A4 inexistante, QR de mauvaise nature) — `613c30d`
- Token de session non rafraîchi sur 3 outils HTML (`bons-commande-liste.html`, `facture-nds.html`, `bon-commande-nds.html`) — `92a91df`
- Facture réelle jamais reliée à la page Bons de commande (existait déjà via `fetchFacturePartenaire`, juste jamais appelée ici) — `4b15f60`
- Vue quotidienne des scans/clics sur Origines du trafic (point #4 de l'audit du 10/08) — `1bb5cda`
- **Bug majeur** : `joueurs` vide dans QUASIMENT TOUT le dashboard SA et le dashboard Pro — `select('*')` échoue silencieusement pour `anon` sur la table `joueurs` (droit table-level retiré lors d'un durcissement sécurité antérieur, uniquement colonne par colonne désormais). Corrigé sur `fetchAllJoueurs`, `fetchEventParticipants` (lib/dashboard.ts) et `fetchProDashboard` (lib/pro.ts) — `218c9f7`. **Probablement la cause de la plupart des "rien ne marche" remontés ce week-end.**
- RLS `prospection` sans policy `anon` (table à 0 résultat malgré des données réelles)

### Vérifiés comme déjà fonctionnels (pas de bug malgré le signalement)
- Sélecteur Parcours mobil (doublons stations) : déjà résolu le 26/08 avec Romain (regroupement par pro), antérieur à cette session
- Page "Landing pages" (`/dashboard/landing-page`) : clic → panneau → aperçu iframe déjà codé et fonctionnel. Le signalement "pas ouvrable" est très probablement lié au bug de scroll d'avant le fix `613c30d` (tab resté ouvert avant le correctif)

### Non résolu, cause identifiée précisément
- **Wizard "Nouvel événement"** ne correspond pas à la réalité de l'app : crée bien l'event (identité/module/dates/lots/visibilité) mais **il n'existe nulle part d'écran pour configurer le contenu de jeu après création** (segments de roue, candidats de vote, questions de quiz...). Le code le dit littéralement : *"la configuration fine du parcours passe par `cfg` et se règle après création"* — sauf que cet écran n'existe pas. C'est la même cause que "les jeux sont vides" signalé plus tôt : un event créé par le wizard est une coquille sans contenu.
  **⏳ En cours, 28/08 (commit `a5522b7`)** : premier écran construit — onglet "Contenu du jeu" dans EventDrawer, module `spin` uniquement (segments : ajouter/retirer/couleur/perdant). Vérifié sur données réelles (`ev-flowin-demo`). Au passage : `lib/types.ts` déclarait `spinSegments` avec des champs (`proba`, `couleur`) que le vrai composant `SpinClient.tsx` n'utilise pas — type jamais synchronisé avec la réalité, corrigé.
  **Reste à faire, même chantier** : vote (`voteItems`), tombola (`partenaires`), quiz/quizmaster/quizsolo (`customQuestions` ou banques). **Vérifier `lib/types.ts` AVANT de construire chaque écran** — `voteSections`/`quizBanques`/`quizCustomQuestions`/`tombolaChamps` sont probablement, eux aussi, désynchronisés du composant réel (même erreur que `spinSegments`), à ne pas prendre pour argent comptant.
- Roadmap (`/dashboard/roadmap`) : liste statique maintenue à la main (`lib/roadmap.ts`), ne reflète pas automatiquement l'avancement réel (ex. les points de l'audit du 10/08 cochés ailleurs ne remontent pas ici)

### En attente de confirmation de Romain
- Scroll sur `/dashboard/rapport-points` : fix vérifié 3x dans le code et poussé (`613c30d`), mais signalé encore cassé le 28/08 au matin. Pas d'accès Vercel pour cette session pour vérifier le déploiement réel (connecteur Vercel de cette session ne voit que le projet "nexto", pas "flowin-events"). **Demandé à Romain : tester en navigation privée pour écarter un cache navigateur avant de chercher une autre cause.**

## 2. Nouvelle mission — vision de Romain (verbatim reformulé, ne pas réinterpréter)

Objectif : dashboard plus simple et plus fluide. Structure cible en 4 zones (à
valider/affiner avec Romain avant construction, ne pas foncer sans repasser
par lui sur la maquette globale — même règle que pour la proposition en 8
blocs du 10/08, qui reste une référence mais n'est pas identique à celle-ci) :

### A. Onglet Super Event
(à préciser avec Romain — probablement l'équivalent de l'actuel "Super Events"
+ "Aperçu Pro", vue d'ensemble du super event actif)

### B. Onglet Events
Kanban des events **passés / en cours / à venir**, avec pour chacun :
nom, date, heure, accès direct à la fiche, visuel en cours.
→ Se rapproche de l'actuel "Animations (par pro)" mais structuré en kanban
par statut temporel plutôt qu'en liste groupée par pro.

### C. Onglet Comm & outils
Regroupe ce qui est aujourd'hui éclaté sur plusieurs pages :
- **Landing pages** avec visualisation navigable (déjà fait, cf. §1 — vérifier
  que ça correspond bien à "visualisation navigation" demandé, sinon préciser)
- Flyers, plaquette digitale, autre matériel de comm
- **Factures, devis, templates** (déjà en grande partie construits ailleurs —
  `facture-nds.html`, `bon-commande-nds.html` — à rassembler ici, pas à
  recréer, cf. `docs/patterns-bugs-connus.md` Pattern G)
- **Système de vérification des billets** (`consulter_lot`/`valider_lot`,
  déjà construit et audité le 01/08 selon la carte de navigation du 21/08)
- **Stockage/déstockage** des lots pour pros et gagnants (`valider_lot`
  consomme 1 unité de `lots_stock` — déjà fait selon Feuille de route,
  7/7 sur "Opérationnel NDS 2026")
- **Emails types + envoi** pro/gagnants (3 emails éditables par partenaire —
  déjà fait selon Feuille de route ; `nds/mail-gagnant.js` = source unique
  du texte gagnant)

### D. CRM
Quatre vues distinctes, clairement séparées (pas fusionnées) :
1. **Par events et super events** — activité/participation scopée à un
   event ou super event précis
2. **Globale participants** — l'actuel CRM Joueurs, tous events confondus
3. **Pro** — fiche complète par pro (voir ci-dessous)
4. **Organisateur super events** — probablement distinct de "Pro" simple,
   à clarifier avec Romain (ex. Ville de Vence = organisateur de NDS,
   `pro-nds-2026`, différent d'un partenaire commerce classique)

### Fiches pro complètes
Romain insiste : "avoir des fiches pro complètes" — la fiche d'un pro doit
regrouper tout ce qui le concerne (voir §1 Pattern G : c'est précisément ce
qui manque aujourd'hui, chaque brique existe séparément).

## 3. Corrections apportées par une autre session (28/08, vérifiées code + base)

À prendre en compte, ces 4 points corrigent des éléments écrits plus haut
dans ce document ou dans le handoff précédent :

1. **`/nds` n'est pas un lien mort.** Le contrôleur qui l'avait signalé ne
   scannait que `/dashboard` et `/pro` ; en scannant tout `admin/app`, 0 lien
   mort réel trouvé.
2. **`cfg` n'est vide pour aucun des 59 events** — le wizard écrit toujours
   `qrUrl`. Le vrai problème reste néanmoins celui décrit en §1 : le wizard
   dit lui-même (ligne ~240) que "la configuration fine se règle après
   création", et cet écran n'existe pas. Les 49 events NDS ont leur `cfg`
   peuplé par SQL directement, pas par le wizard ; `quizmaster` et
   `quizsolo` sortent nus. **Le chantier ne change pas**, juste sa
   description technique précise.
3. **`cfg.spinSegments` a un écrivain** : `rejoindre/[se]/RejoindreClient.tsx:67`
   (valeurs par défaut côté pro).
4. **`nds-resultat` / `nds-participants` ne sont pas câblées en dur.**
   `lib/nds.ts` est déjà générique — `SE_DEFAUT` n'est qu'une valeur par
   défaut de paramètre. Les 2 pages appellent `fetchJours()`/`fetchParticipants()`
   sans passer `se`. Correctif : coller le sélecteur déjà présent sur
   `statistiques`. Environ 1h, pas un chantier. **✅ Fait 28/08, commit `a97da3c`.**

Écarts de comptage de routes (36 vs 37, 14 vs 18 selon les sessions) :
pure question de convention (avec ou sans les segments `[id]`), rien n'a
changé dans le code entre les deux relevés.

## 4. Comment reprendre ce travail

1. Lire ce fichier en entier + les 2 docs référencés en intro.
2. Ne pas commencer à construire la nouvelle structure sans avoir fait
   valider par Romain la correspondance entre les 4 zones ci-dessus et les
   pages/composants RÉELS déjà existants (beaucoup de briques existent déjà
   éparpillées — inventaire avant construction, toujours, cf. Pattern G).
3. Traiter §1 "non résolu" et "en attente de confirmation" avant de se
   lancer dans la construction de la nouvelle structure — ce sont des
   fondations, pas des à-côtés.
4. Mettre à jour ce fichier à chaque avancée, comme `patterns-bugs-connus.md`.
