# Refonte graphique du Dashboard SA — même tonalité que le Dashboard Pro

> **À LIRE EN PREMIER par la prochaine conversation qui refait le SA.**
> Objectif de Romain : donner au **Dashboard SA** (déjà codé en Next.js, poussé sur `origin/main`, 31 vues sous `admin/app/dashboard/`) **la même tonalité graphique** que la maquette **Dashboard Pro** (`admin/public/schemas/flowin-dashboard-pro.html`).
> **Homogénéité, SANS régression fonctionnelle.** On ne touche pas aux données, aux routes, ni à la logique — **uniquement la couche visuelle** (design tokens, composants d'UI, pictogrammes).

## Règle d'or
Refonte **cosmétique** : mêmes tokens, mêmes composants visuels, mêmes pictogrammes. **Aucune** modification de requêtes Supabase, de RPC, de logique métier ou de structure de données. Écran par écran, on valide qu'il n'y a **aucune régression** avant de passer au suivant.

## Design tokens (copier tels quels)
```css
:root{
  --sa-bg:#F1F5F9; --sa-card:#FFFFFF; --sa-border:#E2E8F0; --sa-text:#0F172A; --sa-muted:#64748B;
  --sa-subtle:#F8FAFC;
  /* sidebar sombre */
  --sa-sb-bg:#1E293B; --sa-sb-bg-2:#172033; --sa-sb-hover:rgba(255,255,255,.06);
  --sa-sb-text:rgba(255,255,255,.78); --sa-sb-text-dim:rgba(255,255,255,.48); --sa-sb-border:rgba(255,255,255,.08);
  /* accent violet */
  --sa-accent:#7C2D92; --sa-accent-light:#A855F7; --sa-accent-dark:#6B248A;
  /* etats */
  --ok:#15803D; --okbg:rgba(34,197,94,.12); --warn:#B45309; --warnbg:rgba(245,158,11,.12);
  /* super event = registre chaud orange (reserve aux super events) */
  /* hero: linear-gradient(135deg,#FF8A14 0%,#EA580C 55%,#C2410C 100%) */
  --f:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif;
}
```

## Principes visuels
- **Thème clair** partout, **sidebar sombre** (#1E293B), **accent violet** pour l'action/sélection.
- **Registre orange chaud réservé aux Super Events** (hero, badges SUPER) — ne pas l'étendre au reste.
- **Pictogrammes = sprite SVG trait** (`stroke:currentColor; fill:none; stroke-width:2; linecap/linejoin round`), classe `.ic-svg`, taille lisible (sidebar 21px dans une pastille 34px). **Zéro emoji** dans l'UI finale.
- Coins arrondis 10–16px, ombres discrètes, densité aérée. Formatage sobre (peu de gras, peu de traits).
- Composants d'UI de référence (repris de la maquette Pro) : `.sa-btn` (+ `.primary`/`.amber`/`.sm`), `.card`, `.kpi`, `.chip` (+ `live`/`warn`/`purple`/`muted`), `.hintbar`, `.seg`, `.stepper`, `.toggle`, `.qrow`/`.qcard`, `.banks`, `.kanban`/`.kcol`/`.kcard`, `.modal2`, `.donut`, `.age-cols`, `.survey-q`/`.sv-row`.

## Source de vérité UI
La maquette **`admin/public/schemas/flowin-dashboard-pro.html`** contient tous les composants stylés et validés (thème, sidebar, cartes, KPI, kanban par date, éditeurs quiz/roue, modales, donut, tracking). **S'en servir comme bibliothèque de styles** à porter en composants Next.js.

## Mapping écran → composant (Pro, à réutiliser/fusionner avec le SA)
- `accueil` → `/dashboard/pro` (KPI cliquables + campagne en cours + actions rapides)
- `entreprise` → `ProEntreprise` (coordonnées + **logo** + **liens digitaux** IG/FB/site/autres)
- `jeu` → `JeuConfig` : `QuizEditor` / `SpinEditor` / `VoteEditor` / `TombolaEditor` + `BanquesPicker` (lit tables `banques`/`questions`/`quiz_config`)
- `event` → `EventKanban` (colonnes **À venir / En cours / Terminé** déduites des dates, comme `super-events` côté SA) + carte super event
- `lots` → `LotsDistribution` (2 chemins immédiat/tombola)
- `crm` → `ProCRM` (vue filtrée de `joueurs` par `pro_id`, colonnes triables)
- `gagnants` → `GagnantsTickets` (`generateTicket` + RPC `valider_lot` ; email au pro **+ lien du jeu** quand tout est validé)
- `tracking` → `TrackingLiensQR` (sources d'acquisition via `super_event_track_qr` ; clics par lien = couche suivante, `partenaire_clics`)
- `super` → `SuperEvent` (`SuperEventMap` + acteurs `v_se_sponsors`/`v_nds_partenaires` + règles `super_events`)

## Points en attente / masqués (ne pas réafficher sans feu vert Romain)
- **Intégration Super Event payante + grille de prix** : **masquée** dans le Pro (pas solides sur les nouveaux events). Modale `mSuper` dormante dans le DOM (grille éditable + total live + brique de paiement câblée) — la réactiver quand décidé.
- **Grille tarifaire** : des prix ont déjà été communiqués dans le « dashboard prospection commerciale LinkedIn ». Cette grille existante est la **base** — ne pas s'en écarter. Seuls chiffres réels en base : `frais_pro=49`, `pct_flowin=20` (`super_events`).

## Rappels de sécurité (invariants du projet)
- La maquette est un **HTML autonome** : elle ne touche jamais la base.
- Ne **jamais** réinventer les règles : le Pro réutilise `joueurs`, `banques`/`questions`/`quiz_config`, `generateTicket`, les RPC de lots, les modèles email/QR du SA.
- Dette connue à unifier avant ouverture pros : le **retrait de lot** est tracé sur 3 champs (`tirages.retire_at`, `lots.retire`, `lots_stock.utilise`) → une seule source de vérité.
- Codes PIN partenaires **jamais** affichés. Chiffre « 8113 » **interdit** à la publication (lignes de visites, pas des scans).
