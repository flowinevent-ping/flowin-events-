# Sécurité table `events` — 19/11/2026

## Problème
`admin/public/dashboard.html` (miroir `static/`) envoyait **au chargement** des `POST /rest/v1/events`
(upsert `resolution=merge-duplicates`) :
- pré-boot « garantie ev-crf-2026 » : `supaWriteEvent(ev-crf-2026)` + `supaWritePro(pro-crf-vence)` ;
- boot : réécriture des events locaux absents de Supabase (seed `ev-paques`, `ev-crf-2026`…) ;
- `saveData()` (appelé pendant le boot) : upsert de **tous** les events / lots / pros / partenaires.
Avec une vraie session SA, ces lignes de prod étaient réécrites avec les valeurs seed.
`?demo=1` n'avait aucun effet (flowin-demo.js non chargé, et la porte de connexion redirigeait).

Preuve (Playwright, ancienne version, session factice, écritures interceptées et annulées) :
**4 × POST /rest/v1/events au chargement**. Nouvelle version : **0**.

## Correctifs dashboard (`dashboard.html` = `static/dashboard.html`, MD5 identique, Acorn 2020 : 0 erreur)
1. Aucune écriture Supabase automatique au chargement : `saveData()` n'écrit qu'après la fin du boot
   (`FLOWIN_BOOT_FINI`) et ne réécrit que les events lus depuis Supabase ou écrits avec succès
   dans la session (`FLOWIN_EV_SUPA`). Un event seed resté local n'écrase jamais la prod.
2. Écritures automatiques pré-boot (CRF) et boot (events locaux) supprimées.
3. Nouveau bouton SA (Paramètres › Supabase) : « Insérer les events seed manquants » —
   lit l'id, insère seulement s'il est absent (`resolution=ignore-duplicates`), jamais d'écrasement.
   La migration Pâques utilise aussi cette insertion-si-absente pour `ev-paques` / `ev-nds`.
4. `supaWriteEvent` refuse d'écrire sans session SA (jamais avec la clé anon en repli) et renvoie
   désormais `true/false` (la migration comptait des erreurs à tort).
5. `?demo=1` : `/flowin-demo.js` chargé en premier ; la porte de connexion laisse passer en démo.

## Tests (Playwright, serveur statique sur `admin/public`)
| Scénario | non-GET vers supabase.co | Erreurs JS |
|---|---|---|
| `/dashboard.html?demo=1` | 0 (25 GET) | 0 |
| `/static/dashboard.html?demo=1` | 0 (25 GET) | 0 |
| Sans session | 0 (redirigé vers /admin-connexion.html) | 0 |
| Session factice, sans démo | 0 (9 GET) | 0 |

## Prod (lecture seule, 19/11) — non corrigé
- `pg_policies` : une seule politique `flowin_anon_all_events`, `ALL` à `public`, `true/true`.
- `ev-paques` prod ≠ seed : participants 0 / gagnants 0 / opt-in 0 / score_min 3 / description
  « Vence · Source d'inspiration » (seed : 186 / 8 / 124 / 14 / « Quiz Pâques 3 jours · 8 lots à gagner »).
- `ev-crf-2026` prod ≠ seed : status `past` (seed `upcoming`), h_start 09:00 ; qrUrl au format
  `/parcours/quiz?ev=` (celui que recalcule `supaWriteEvent`, signe d'au moins une écriture par le dashboard).
- Pas de colonne `updated_at` : impossible de dater un éventuel écrasement. Les valeurs actuelles
  ne sont pas celles du seed : pas d'écrasement par le seed visible à ce jour. À vérifier par Romain.

## Écrivains de `events` recensés (admin/)
- Dashboard SA `dashboard.html` : `FLOWIN_AUTH` (jeton SA ; repli clé anon si pas de session →
  désormais bloqué côté code pour events, et la porte de connexion impose une session).
- Next `lib/supabase.ts` client `supabase` : jeton SA injecté sur `/dashboard/*`, session pro
  supabase-js sur `/pro/*` → `lib/dashboard.ts`, `lib/wizard.ts`, `lib/nds.ts`, `lib/pro.ts`,
  `app/dashboard/operations/[id]/OpsDetailClient.tsx`, `components/operations/*`,
  `components/pro/*`, `components/dashboard/ReglesDiffusion.tsx`.
- `lib/superEventsOuverts.ts` (géocodage lat/lng, appelé par `/pro/nouvelle` et `/rejoindre`) :
  sur `/rejoindre` sans session, l'update sera refusé après RLS — cache best-effort, sans effet bloquant.
- `public/bon-commande-animation.html` (PATCH cfg.paiement / status) : jeton pro si session,
  sinon clé anon → après RLS, la déclaration exige la session pro (cas nominal : vient de l'espace pro).
- Toutes les autres pages publiques (parcours, landing, pro_mobile, admin-commandes) : GET uniquement.

## SQL — À APPLIQUER
`sql/2026-11-19-securite-events-rls.sql`, **après** `sql/2026-11-18-tirage-correctifs.sql`.
Lecture publique conservée ; insert/update/delete réservés à `est_super_admin()` ou au pro
propriétaire (`pros.auth_id = auth.uid()`). Idempotent, rollback documenté en fin de fichier.

## Reste (hors périmètre)
Après le boot, `saveData()` réécrit toujours lots / pros / partenaires (comportement existant) ;
mêmes politiques ouvertes probables sur ces tables à auditer.
