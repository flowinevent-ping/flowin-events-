# RUNBOOK — Service worker NDS (cache hors-ligne du jeu)

> Procédure de secours. Si le SW pose problème, **suivre « DÉSACTIVER »** ci-dessous. ~2 min pour se propager.

## Ce qui a été mis en place (08/07, commit 014dfe6)
- Fichier : `admin/public/sw.js` (service worker chirurgical).
- Activation : `admin/app/parcours/nds2026/NDS2026Client.tsx` → `const ENABLE_SW = true` +
  `navigator.serviceWorker.register('/sw.js', { scope: '/parcours/' })`.
- Portée : **le jeu uniquement** (`/parcours/*`). Dashboard / brigade / carte NON contrôlés.
- Cache : `/_next/static/*` (immuable) + médias (logos, polices, images). HTML = réseau natif. Supabase / POST = jamais touchés.
- Header : `/sw.js` servi en `no-cache` (`admin/vercel.json`) → le navigateur récupère vite toute nouvelle version.

## DÉSACTIVER (kill-switch) — à faire en cas de souci
1. Éditer `admin/public/sw.js` : passer `const KILL = false;` → `const KILL = true;`
2. Commit + push sur `main` (Vercel déploie tout seul).
3. Attendre ~2 min. Grâce au `no-cache` sur `/sw.js`, chaque téléphone récupère la version KILL à la prochaine
   navigation : le SW **se désinstalle seul**, **vide ses caches**, et **recharge** les pages ouvertes.
4. (Ceinture + bretelles) passer aussi `const ENABLE_SW = false` dans `NDS2026Client.tsx` pour que les nouveaux
   chargements ne ré-enregistrent pas un SW.

Commande type (token à ne jamais committer en clair) :
```
cd admin && sed -i 's/const KILL = false;/const KILL = true;/' public/sw.js
cd .. && git add -A && git commit -m "kill-switch: desactivation service worker" && git push origin main
```

## RÉACTIVER
- `KILL = false` dans `admin/public/sw.js` **et** `ENABLE_SW = true` dans `NDS2026Client.tsx` → commit + push.

## VÉRIFIER
- Ouvrir `/parcours/nds2026?ev=…`, charger une fois, recharger (doit être quasi instantané).
- Test « réseau coupé » : après 1er chargement, mode avion + reload → l'app et les logos s'affichent depuis le cache.
- Après un kill : recharger le jeu ; en DevTools (Application > Service Workers) il ne doit plus y avoir de SW actif.

## Limite assumée
Le SW n'aide PAS un tout premier chargement sur réseau déjà pourri ; il aide les reloads / la suite de session
une fois la page chargée au moins une fois.
