# Audit COHÉRENCE — Flowin Events — 2026-11-07 (v2)

Méthode : lecture de code (grep fichier:ligne), 4 requêtes SQL lecture seule (Supabase ywcqtupgoxfzkddqkztk), comparaison avec /tmp/flowin-audit-2026-11-07/. Pas de captures Playwright produites (voir « Non vérifié »).
Listes brutes : /tmp/flowin-audit-v2/emo.txt (1023 lignes, tous symboles), /tmp/flowin-audit-v2/emoji-pictos.txt (776 vrais emojis).

## 1. Écarts chiffrés Pro / SA / base (se-nds-2026)

Base (`tirages`, groupé par statut) :

| Station | actif | annule | retire | total brut | `retire_at` non nul |
|---|---|---|---|---|---|
| ev-nds-nook (pt-nook) | 14 | 52 | 2 | 68 | 54 |
| ev-nds-utile (pt-utile) | 9 | 40 | 12 | 61 | 51 |
| ev-nds-bergerie (pt-bergerie) | 7 | 21 | 1 | 29 | 22 |

Constat clé : **les tirages annulés (re-tirage) gardent `retire_at` rempli** (52/52, 39/40, 21/21). Or l'état « Utilisé » est dérivé de `retire_at` (`lib/operations.ts:208`) et le legacy aussi (`public/dashboard.html:5369`).

Ce qu'affiche chaque écran (dérivé du code + chiffres base) :

| Écran | Règle | nook gagnants / utilisés | utile | bergerie |
|---|---|---|---|---|
| Vérité métier (hors annulés, statut) | `statut<>'annule'`, `statut='retire'` | **16 / 2** | **21 / 12** | **8 / 1** |
| Pro `/pro/super/[event]` KPI « gains émis / gains retirés » (`lib/dashboard.ts:345-351`, `app/pro/super/[event]/page.tsx:132-133`) | aucun filtre annulé, `statut='retire'` | **68** / 2 | **61** / 12 | **29** / 1 |
| Pro `/pro/gagnants` (GagnantsClient, `lib/operations.ts:320` filtre annulé, état via `retire_at`) | | 16 / 2 | 21 / 12 | 8 / 1 |
| SA `/dashboard/gagnants` (`lib/dashboard.ts:326` filtre annulé) | | 16 / 2 | 21 / 12 | 8 / 1 |
| SA fiche joueur (`fetchJoueurTirages`, `lib/dashboard.ts:289-296`, pas de filtre) | annulés affichés « Utilisé » | +52 lignes fausses | +39 | +21 |
| Legacy `dashboard.html` Lots NDS (`:5369`, RPC `partenaire_gagnants` filtre bien annulé) | | 16 / 2 (OK) | | |

Écart : **Pro KPI super event = ×4,25 (nook), ×2,9 (utile), ×3,6 (bergerie) par rapport à la liste Gagnants du même pro et du SA.** Une ligne SE « se-nds-2026 » (21 tirages grand tirage, tous `retire`) n'apparaît que côté SA.

## 2. Vocabulaire — écarts (libellés affichés)

| Notion | Mots rencontrés | fichier:ligne |
|---|---|---|
| Lot remis | « Utilisé » (`lib/operations.ts:220`, `GagnantsClient.tsx:320`, `nds-lots/page.tsx:52`), « gains retirés » (`app/pro/super/[event]/page.tsx:133`), « Gain marqué comme remis » (`GagnantsClient.tsx:290`), « ✓ Retiré en caisse » (`public/dashboard.html:5401`), « ✅ utilisé » (`ModalGererLots.tsx:194`) | 5 formulations pour un même état |
| Lot / gain | « Gains » colonne (`CrmPro.tsx:247`), « gains émis » (`super/[event]:132`), « Lot » (`dashboard/gagnants`), « Lots disponibles » (rapports) | lot vs gain mélangés à l'écran |
| Event | « Animation(s) » (13 libellés), « Opération » (`ListeFactures.tsx:141`, `CrmPro.tsx:306`), « Event offert » (`app/demo/DemoClient.tsx:29`), « Aucune operation » sans accent (`dashboard/planning/page.tsx:72`) | |
| Pro / station | « Station » (19), « Partenaire » (17), « Enseigne » (3, tableaux SA prospection/crm), « Établissement » (5) ; `pros/page.tsx:69` titre « Ouvrir la fiche partenaire » sur la liste des pros ; `partenaires/page.tsx:57` « Ouvrir le compte pro » sur la liste partenaires (libellés croisés) | |
| Super event | « Super event » / « Super Admin (organisateur) » (`app/pro/super/page.tsx:147` : dit que le bilan global est réservé à « l'organisateur (Super Admin) » alors que le référentiel 2.2 prévoit qu'un pro puisse créer/organiser un super event) ; « hors festival » (`nds-resultat/page.tsx:139`) ; « opération » (`ParcoursMobil.tsx:156`) | |

### Glossaire cible (un mot par notion)
- **Animation** (affiché) = event d'un pro. Jamais « opération », « event », « jeu » pour l'objet (« jeu » = la mécanique : quiz, vote, roue).
- **Super event** = festival/regroupement. « Opération » réservé à la facturation interne, non affiché.
- **Pro** = le compte ; **Station** = le pro sur la carte d'un super event ; **Partenaire** = fiche commerce SA uniquement. Supprimer « Enseigne »/« Établissement » des en-têtes, ou n'utiliser qu'« Établissement » pour l'adresse.
- **Lot** = l'objet offert ; **Gagnant** = la personne ; état : **À appeler / Confirmé / Utilisé** (source `lib/operations.ts:220`) — bannir « retiré », « remis », « gain ».

## 3. Ton
- Pro vouvoyé partout dans `app/pro` et `components/pro` (0 « tu/ton/tes » en JSX — confirme audit 1). OK.
- Joueur tutoyé (`mail-gagnant.js`, parcours). OK. Non contrôlé : textes en base (`events.cfg` messages personnalisés).

## 4. Charte
- **Couleur super event contradictoire** : `lib/charte.ts:97` dit « comics rouge #E2231A / jaune #FFD23F — remplace l'orange » ; mais `app/dashboard/globals.css:301` documente et code orange **#C2410C** = super event, utilisé encore dans `app/pro/super/page.tsx` (2), `app/rejoindre/[se]/RejoindreClient.tsx`, `app/se/[se]/SuperEventClient.tsx`, `components/parcours/BandeauEtapes.tsx`, `components/creation/GrilleTarifs.tsx`, `public/dashboard.html` (3). Et même commentaire appelle « bleu » le violet #7A4FE0. Bleu pro #2746A6 / #3B82F6 hors palette (`--fl-bleu` #3B5CC4).
- **Verts hors tokens** (seul vert autorisé `--fl-ok` #0B7A4F) : #15803D dans 13 fichiers (GagnantsClient 6, BanqueEditor 5, ParcoursCreation 4, CrmPro 3, ModalGererLots 3…), #2f7d4f (`dashboard/gagnants:128`, `nds-packs:130`), #16a34a (ParcoursCreation). Orange alerte #b4791f (cgv, nds-comm, gagnants), étoile #E0A52E (`pro-nds-live.html:136`).
- **Emojis affichés** (Romain : interdits) — hors `EmptyState` dont l'emoji est converti en pictogramme (`components/dashboard/DashboardUI.tsx:130-134`, OK) :
  - Pro + SA (composant partagé `components/operations/`) : `BlocsOperations.tsx:217` « ⚙️ Gérer les lots », `:219` « 🤝 Partenaires » ; `ModalGererLots.tsx:194` ✅📞, `:206` 📣, `:212` 🙏, `:226` 💬, `:259` ✉️💬.
  - Pro : `app/pro/connexion/page.tsx:70` ✋ (SuccessScreen) ; symboles ✓/✕/↗ (`PremiereFois.tsx:567,573`, `pro/super/page.tsx:50`, `GagnantsClient.tsx:307`).
  - Joueur : `components/parcours/AnimationIndisponible.tsx:22` ⏳🏁🔎⛔ (44 px).
  - SA Next : `EventDrawer.tsx:489,507,535` 🎤 (emoji de manche saisi), `wizard-super-event/ancien/page.tsx:164` ⚠, `OpsDetailClient.tsx:203` ☰, `PartenairesScreen.tsx:61` ★, + ~30 « ✓ » dans des boutons/chips.
  - Legacy `public/dashboard.html` : **748 lignes** avec emoji (ex. `:5358` ℹ️).
- Rayons / boutons : `--fl-pilule` 100px respecté dans `PageMasters.tsx:75` ; non audité écran par écran.

## 5. Promesses des textes vs app
- `app/pro/super/page.tsx:147` « Le bilan global… réservé à l'organisateur (Super Admin) » : contredit le référentiel §2.2 (un pro peut créer un super event) — ou fonctionnalité absente côté pro.
- KPI pro « gains émis » inclut les re-tirages annulés : le texte promet des gains, la donnée compte des annulations (cf. §1).
- `GagnantsClient.tsx:185` « le gain portera le nom de l'animation » si aucun lot — non vérifié en base.

## 6. Doublons de couches encore accessibles
- Gestion lots/gagnants NDS : `public/dashboard.html` (onglet Lots NDS, libellé « Retiré en caisse », lien depuis `app/dashboard/jeux/PageMasters.tsx:77` vers `/dashboard.html#masters`) **et** `app/dashboard/nds-lots` + `app/dashboard/gagnants` (« Utilisé »). Deux règles d'état (`retire_at` brut vs `etatTirage`).
- Création super event : `app/dashboard/wizard-super-event` **et** `wizard-super-event/ancien/` toujours routé.
- `maintenance/page.tsx:138` assume que le monolithe reste en production en parallèle.
- MD5 miroir OK (9db2761d…, identiques).

## Priorités

**P0-1** KPI pro super event faux — `lib/dashboard.ts:345` (`fetch…TicketsGains`) : ajouter `.neq('statut','annule')` et calculer « utilisés » via `etatTirage`. Affichage : `app/pro/super/[event]/page.tsx:132-133` → « gagnants » / « lots utilisés ».
**P0-2** Annulés avec `retire_at` rempli (113 lignes sur 3 stations) → tout écran sans filtre affiche « Utilisé ». Correctif : `fetchJoueurTirages` (`lib/dashboard.ts:289`) filtrer annulé ou afficher « Annulé » ; `etatTirage` (`lib/operations.ts:207`) tester `statut==='annule'` en premier. Cause probable : RPC `annuler_tirage` pose `retire_at` (à vérifier, non lu).
**P1-1** Libellé d'état unique « Utilisé » : `GagnantsClient.tsx:290`, `dashboard.html:5401`, `ModalGererLots.tsx:194`, `super/[event]:133`.
**P1-2** Emojis du composant partagé Pro/SA (`BlocsOperations.tsx:217,219`, `ModalGererLots.tsx`) et `AnimationIndisponible.tsx:22`, `connexion/page.tsx:70` → pictos `Ico`.
**P1-3** Charte super event : trancher orange #C2410C vs comics (`lib/charte.ts:97` vs `globals.css:301`), aligner les 7 fichiers.
**P2-1** Verts #15803D/#2f7d4f/#16a34a → `--fl-ok`. **P2-2** Glossaire (Opération, Enseigne, Event offert, libellés croisés pros/partenaires). **P2-3** Retirer `wizard-super-event/ancien` et le lien vers `dashboard.html#masters`. **P2-4** 748 lignes emoji legacy (si conservé).

## Non vérifié
- Pas de captures Playwright (dossier shots/coherence vide) : chiffres écran déduits du code + SQL, pas lus à l'écran.
- Carte (positions stations Pro vs SA), QR, inscription /pro/premiere-fois non comparés.
- Une 3e opération hors se-nds-2026 non comparée (seules les stations NDS ont des tirages significatifs).
- Définition de la RPC `annuler_tirage` (pose de `retire_at`) non lue.
