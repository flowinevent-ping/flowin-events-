# NDS — Robustesse réseau / hors-ligne (diagnostic 08/07)

## Contexte
Sur mauvaise connexion : logos qui n'apparaissent pas, pages lentes/blanches. Le jeu = app Next.js 14 (App Router)
déployée sur Vercel (`framework: nextjs`, output `.next`, SSR). `images.unoptimized=true` → logos = `<img>` bruts
depuis le stockage Supabase. Aucun service worker aujourd'hui.

## FAIT (quick wins, sûrs) — commit de la session
1. **Logos robustes au réseau lent** (`NDS2026Client.tsx` / `PartnerLogo`) : `loading="lazy"` + `decoding="async"`
   + timeout 6 s → si le logo n'a pas chargé, on affiche le repli (placeholder) au lieu d'un blanc.
   (Le repli 404 existait déjà ; il manquait le cas « réseau lent ».)
2. **File d'attente durable des écritures** (`parcours.ts` : `ndsQueueWrite` / `ndsFlushQueue`, clé LS `flowin_nds_wq`) :
   si l'enregistrement d'un jeu échoue (réseau coupé), le job est stocké en local et rejoué automatiquement
   au montage + à l'événement `online`. Sûr / idempotent : `claimJoueur` dédup par jour/station,
   `writeJoueur` rejoue le même `ticket_code`. C'est l'automatisation durable du réessai manuel déjà existant.

## Option 3 — Service worker / PWA : ÉVALUATION DU RISQUE
Puissant (cache l'app → après 1er chargement réussi, tout marche depuis le cache, rejeu quasi instantané),
MAIS le risque n'est pas la complexité, c'est le RAYON D'IMPACT + le TIMING :
- **Écran blanc « app périmée »** : le HTML/RSC Next référence des chunks à hash. Un SW qui sert un HTML en cache
  pointant vers d'anciens hash (après un redéploiement) → chunks disparus → écran cassé. Risque GLOBAL.
  → Parade : SW chirurgical = cache-first UNIQUEMENT sur `/_next/static/*` (immuable, hashé) + médias statiques
    (logos, polices, image héro) ; **network-first** sur les navigations/HTML et **network-only** sur Supabase ;
    jamais de cache sur POST/écritures. Cache versionné + nettoyage à l'`activate`.
- **Un SW buggé casse le site pour tout le monde** (il intercepte tout, persiste dans le navigateur).
  → Parade obligatoire : **kill-switch** (sw.js re-vérifié à chaque navigation, version auto-désinstallante),
    `skipWaiting` + `clients.claim`, test sur 2-3 appareils, déploiement en **fenêtre calme** (pas le soir d'ouverture).
- **Fraîcheur des données** : ne jamais servir en cache les réponses Supabase (tickets, anti-répétition).

### Verdict
- SW **chirurgical + kill-switch + bon timing** = risque FAIBLE, ~80 % du bénéfice (logos + assets en cache, reload rapide).
- SW **naïf** (cache HTML/app) = risque ÉLEVÉ (écrans blancs, global).
- Réversibilité : avec kill-switch, on peut pousser une version qui se désinstalle. Sans, un mauvais SW est pénible à annuler.
- **Recommandation : ne PAS déployer un SW le soir de l'ouverture.** Quick wins 1+2 maintenant ; SW en second temps,
  fenêtre à faible trafic, scope chirurgical + kill-switch, testé.
