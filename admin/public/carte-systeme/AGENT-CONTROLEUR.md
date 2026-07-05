# Agent « Contrôleur » — cartographie Flowin / NDS 2026

## Rôle
Le Contrôleur est l'agent chargé de **maintenir la cartographie synchronisée avec le projet réel**.
Il n'invente rien : il **extrait** l'inventaire depuis les vraies sources et **signale les raccords manquants**.

## Sources lues (vérité)
- `admin/public/dashboard.html` : le **menu** (rubriques + fonctions) et le **tableau des landings** (`lp-*`, avec `deployUrl` + `moduleJeu`).
- `admin/public/*.html` : l'inventaire des **pages** du produit.
- `admin/supabase/functions/` : les **edge functions**.
- (Étape suivante) Supabase : comptes réels par table, triggers, RPC.

## Ce qu'il produit
- `carte-data.json` : l'inventaire réel (menu, landings, pages, edge functions).
- Un rapport console des **raccords à vérifier** : pages non reliées au menu ni aux landings (ex. `demos.html` = hub Vercel, variantes de bons, `pitch-nds.html`…).

## Exécution
```bash
python3 admin/public/carte-systeme/controleur.py
```

## Principe (à ne plus oublier)
La carte (`index.html`) doit refléter `carte-data.json`. Toute page/fonction présente dans les sources
mais absente de la carte = un **raccord manquant** que le Contrôleur doit lever.
Ne jamais lister les éléments de mémoire : les extraire, puis enrichir (rôle, règles, connexions).
