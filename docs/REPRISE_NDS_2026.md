# REPRISE — NDS 2026 (Super Event)

Point de reprise au 11 juin 2026. À lire en premier à la prochaine session.

## ✅ FAIT (déployé / en base / archivé — permanent)

### Pipeline GitHub réparé
- L'ancien token avait **expiré le 5 juin 2026**. Nouveau token généré depuis le compte **`flowinevent-ping`** (propriétaire du repo — PAS `romaincollin-design` qui n'a pas les droits push). **Le push fonctionne.**
- ⚠️ Le token est un secret : il n'est PAS stocké ici ni en mémoire. À chaque session, Romain le redonne (ou en régénère un depuis `flowinevent-ping`).

### Supabase — 4 stations créées
4 comptes **pros** (tags `nds-2026 / station / se-nds-2026`) + 4 **events** (`module='nds2026'`, `super_event_id='se-nds-2026'`, `pro_visib={}` comme `ev-paques`) :

| Station | pro_id | event | qr_token |
|---|---|---|---|
| Les Caisses | `pro-nds-caisses` | `ev-nds-caisses` | `b0f5fd0f45` |
| Le Bar | `pro-nds-bar` | `ev-nds-bar` | `a89165ffd9` |
| L'Écran | `pro-nds-ecrans` | `ev-nds-ecrans` | `ed4971a290` |
| Tablette | `pro-nds-tablette` | `ev-nds-tablette` | `73e530f76f` |

Voie QR validée : **4 events séparés = 4 QR distincts** (archi existante `events.qr_token`), PAS de `?station=`. Chaque pro ne voit que ses joueurs.

### Mockups validés (archivés dans `docs/mockups/`)
- `flowin-se-user-parcours-v24.html` — parcours user NDS validé (hero typo + artwork en fond + carte verre, 9 écrans, 6 corrections appliquées : 0 emoji, quiz sélection neutre, score animé, infos sous « Double tes chances », « Participation enregistrée ! », « Il te reste 2 quiz… »).
- `flowin-nds-pro-v1.html` — dashboard pro NDS **validé** : KPIs fixes + **carrousel** des 8 panneaux **repris à l'identique de la landing** (donuts genre/découverte, jauge retour, barres âge/jours/pics/provenance), en-tête NDS violet, **sans tirage (SA only)**.
- `flowin-events-landing.html`, `flowin-nds-partenaire-v25.html` — landings de référence (live sur `/landing` et `/nds`).
- Preview pro déployé : **https://flowin-events.vercel.app/nds-pro.html** (page statique, testé mobile iOS/Android + tablette).

## ⬜ RESTE À FAIRE (le portage React)

### Bloc 3 — Master référent NDS 2026 (prérequis des QR)
Créer `admin/app/parcours/nds2026/` = parcours v24 porté en React, **sans toucher aux masters existants** (`quiz`, `spin`, etc.). Gabarit = lire un master existant. C'est le `module='nds2026'` des 4 events. Sans lui, scanner un QR → 404.

### Bloc 4 — Dashboard pro NDS dans React
Greffer le design validé (carrousel + donuts) dans **`admin/app/pro/ProClient.tsx`** (473 lignes — **composant PARTAGÉ avec `pro-vence`**).
- Rendu **conditionnel** : stations NDS (`super_event_id='se-nds-2026'`) → design carrousel ; `pro-vence` → inchangé (NE PAS régresser).
- Câbler chaque panneau aux vraies données Supabase, filtré par station (qr_token → ses joueurs). Données NDS vides jusqu'au festival (juillet) — normal.
- Couleurs/présentations : reprendre exactement `docs/mockups/flowin-nds-pro-v1.html`.

### Bloc 5 — Finalisation
URLs QR (dépend du module `nds2026`) → générer les 4 images QR → push → test des 4 QR par Romain.

## Règles à respecter (rappel)
- Ne jamais modifier les masters existants ; NDS = nouveau master dédié.
- Ne pas casser `pro-vence` (ProClient partagé).
- Mockups/livrables → toujours archivés dans le repo (permanence, le filesystem reset entre sessions).
- iOS Safari : `var`, `.indexOf` pas `.includes`, pas de spread/`Object.assign`.
- Validation avant push : tsc 0 erreur, `next build`, screenshot.

## ⬜ Chantier copy (demandé le 11/06)
Alléger / fluidifier le texte des 2 landings live (réduire le verbiage, phrases courtes, ton Flowin) :
- `admin/app/landing` (mockup `docs/mockups/flowin-events-landing.html`) — landing contact
- `admin/app/nds` (mockup `docs/mockups/flowin-nds-partenaire-v25.html`) — landing partenaire NDS
Règles : pas de jargon, pas de ClickFunnels, garder le sens. Travailler sur le code live (pas reconstruire), section par section, valider au screenshot avant push.

## ⬜ Chantier UX desktop landing (11/06)
La landing `/landing` est en format mobile figé (`.app{max-width:480px}`) + navigation par onglets → effet "colonne 2000" sur desktop.
FAIT : hero passé en desktop (`@media min-width:820px` dans le CSS de `LandingClient.tsx`, hero pleine largeur + typo agrandie).
RESTE : adapter les sections onglets (Pourquoi/Comment/Résultats/Tarifs) en version desktop large, section par section, validation screenshot. Même approche pour `/nds` si besoin.

## ⚠️ /nds — design corrigé, form à recâbler (11/06)
Le bon design partenaire = `flowin-nds-partenaire-v25.html` ("Rejoignez l'opération partenaires").
FAIT : rewrite `beforeFiles` dans `admin/next.config.js` → `/nds` sert `public/nds-partenaire.html` (l'ancien `NdsClient` "Prenez part au festival" est court-circuité, conservé dans le repo).
⚠️ RESTE : le formulaire "Devenir partenaire" de cette page statique n'est PAS câblé au CRM Supabase (le câblage était dans l'ancien NdsClient). À refaire : porter le design v25 en React DANS la route /nds + rebrancher l'upsert CRM (table `pros`/landing, source nds-landing, rattache se-nds-2026) qui existait dans l'ancien NdsClient.
