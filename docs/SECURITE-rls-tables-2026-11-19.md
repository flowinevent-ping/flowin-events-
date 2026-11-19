# Sécurité RLS des tables — 19/11/2026

SQL : `sql/2026-11-19-securite-rls-tables.sql` (idempotent, rollback en pied de fichier).
**Ordre d'application** : `2026-11-18-tirage-correctifs.sql` → `2026-11-19-securite-events-rls.sql` → ce fichier.
**Non appliqué** : audit en lecture seule (pg_policies, pg_class.relrowsecurity, information_schema grants, pg_proc).

## Méthode
- Lecture prod du 19/11 : politiques de toutes les tables `public`, RLS activée ou non, grants anon/authenticated.
- Recherche de tous les écrits dans `admin/` (lib, components, app, public/*.html dont `dashboard.html`).
- Vérifié : aucune fonction SQL *non* SECURITY DEFINER n'écrit dans ces tables (pas de RPC cassée par les nouvelles politiques).

## Contexte d'authentification des écrivains
| Écrivain | Jeton envoyé |
|---|---|
| `dashboard.html` (`supaUpsert`, `supaFetch`, fetch directs) | `FLOWIN_AUTH` = jeton de la session SA (porte de connexion) |
| Next `/dashboard/*` (`lib/supabase.ts`, `fetchAvecJetonSA`) | jeton SA injecté sur toutes les requêtes |
| Next `/pro/*`, création d'animation | session Supabase du pro (`signInWithPassword`) |
| Parcours joueurs (`lib/parcours.ts`, `lib/joueurs.ts`, `public/parcours/*.html`) | clé anon |

Conclusion : **aucune modification de code nécessaire** — chaque écrit direct restant est déjà fait sous le bon jeton.

## Tables prioritaires (corrigées par le SQL)
| Table | Politique aujourd'hui | Risque | Proposé | Écrivains impactés |
|---|---|---|---|---|
| `lots` | `flowin_anon_all_lots` ALL public true/true | Tout visiteur crée/modifie/supprime les lots | Lecture publique ; écriture SA, pro propriétaire de l'event (`qr_est_proprietaire`), ou pro lié au partenaire si le lot n'a pas d'event | `dashboard.html` supaUpsert + DELETE (SA ✓), `lib/wizard.ts` (SA ✓), `lib/pro.ts` insert (pro de l'event ✓), `ModalGererLots`, `ReglesDiffusion` (SA ou pro ✓) |
| `super_events` | `flowin_anon_all_super_events` ALL public true/true | Tout visiteur modifie le festival | Lecture publique ; insert/delete SA ; update SA ou pro de `pro_id` | `dashboard.html` (SA ✓), `lib/nds.ts`, `lib/wizard.ts`, `super-events/page`, `OpsDetailClient` (tous `/dashboard`, SA ✓) |
| `qr_stations` | `qr_stations_anon_all` ALL anon true/true | Tout visiteur détourne un QR | Lecture anon conservée (`/q/[code]`) ; écriture par la politique existante SA / `qr_est_proprietaire` | `lib/qrTraces.ts` (pro connecté ou SA ✓) |
| `participations` | anon SELECT/INSERT/UPDATE true ; authenticated ALL true | Réécriture des scores/tickets par n'importe qui | SELECT/INSERT anon et authenticated conservés (flux joueur) ; UPDATE/DELETE SA ou pro de l'event | Aucun UPDATE direct dans le code ; inserts joueurs inchangés |
| `joueurs` | anon SELECT/INSERT true ; authenticated ALL true | Tout compte connecté modifie/supprime tout joueur | SELECT et INSERT conservés ; UPDATE/DELETE SA uniquement | `lib/dashboard.ts` update/delete (SA ✓), `dashboard.html` supaUpsert (SA ✓), `lib/parcours.ts` update → repli déjà codé sur `joueur_marquer_partie` |
| `tirages` | authenticated ALL true ; anon SELECT | Tout pro réécrit n'importe quel gain | SELECT conservé ; insert/delete SA (les tirages passent par RPC) ; update SA, pro de l'event ou pro du partenaire | `marquerRelance`, `marquerGainUtilise`, `annulerTiragePro` (SA ou pro ✓) |
| `comm_config`, `comm_templates` | RLS **désactivée**, grants complets anon (TRUNCATE compris) | Effacement du kit com | RLS on ; lecture publique ; écriture SA ; TRUNCATE retiré | Lecture seule (`lib/comm.ts`, RPC `comm_kit`) |
| `visites_archive_2026_06`, `visites_archive_apercu_2026_09` | RLS désactivée, grants complets anon | Lecture/effacement des archives | RLS on sans politique (service_role seulement) ; TRUNCATE retiré | Aucun |

Déjà sains (non modifiés) : `pros`, `partenaires`, `clients_commerce` (RLS on, aucune politique → accès via RPC seulement), `bons_commande`, `commandes_animation`, `factures*`, `pros_rib`, `demandes_rappel`.

## Risques résiduels assumés (documentés, non traités ici)
- `joueurs` / `participations` / `tirages` : **lecture** ouverte à tout compte authentifié (et SELECT anon). Les pros lisent leurs joueurs en direct (`lib/pro.ts`, `DataOperation`, `DiffusionOperation`). Resserrer exige une politique « joueur d'un event du pro » ou des RPC : phase 2.
- `joueurs_anon_insert` / `participations_anon_insert` (with check true) : voulus, flux joueur anonyme.

## Phase 2 — autres tables ouvertes en écriture à anon/public (true)
| Table | Écrivains trouvés dans admin/ | Note |
|---|---|---|
| `config` (7 politiques ALL/INSERT/UPDATE true) | aucun | écrivain externe possible : à confirmer avec Romain avant verrouillage |
| `landings` | `OpsDetailClient` (SA), `dashboard.html` (SA) | verrouillable SA |
| `banques` | `BanqueEditor` (pro), `lib/banques.ts`, `dashboard.html` | pro propriétaire à définir |
| `event_modeles` | `lib/modeles.ts` | contexte à vérifier |
| `se_gains`, `se_reponses`, `se_tickets`, `sondage_brigade`, `visites`, `partenaire_clics`, `crm_retours` | parcours joueurs anon (`lib/parcours.ts`, `lib/track.ts`, `NDS2026Client.tsx`, `nds-partenaire.html`) | garder INSERT anon, retirer UPDATE/DELETE |
| `se_lots` | `ParcoursCreation` (supabasePublic) | |
| `parrainage` | `lib/parrainage.ts`, `dashboard.html` | |
| `lots_stock` | `lib/stock.ts` | |
| `liens_ephemeres` | `lib/dashboard.ts` | |
| `prospection`, `documents_legaux` (authenticated ALL true) | `dashboard.html`, `cgv-nds.html` | restreindre à SA |
| `packs_participation` (UPDATE anon true) | aucun | |
| `gains`, `votes`, `analytics_*`, `gas_backup_log` | aucun | écrivains externes probables (GAS, cron) : à confirmer |

## Tests
- Playwright (Chromium, serveur statique `admin/public`, écritures supabase.co interceptées) :
  `/dashboard.html?demo=1` → 0 non-GET (9 GET), 0 erreur JS ; `/static/dashboard.html?demo=1` → 0 non-GET (25 GET), 0 erreur JS.
- Aucun fichier de code modifié : miroir MD5 inchangé (`f82bd8ed4dbf95e408dea01ea6b0a1fb` ×2), pas de build Next nécessaire.

## Après application, vérifier
SA : modifier un lot et un super event depuis le dashboard ; pro : relancer un gagnant, marquer un lot remis, créer un QR ;
joueur anonyme : jouer une animation de bout en bout (inscription + participation + ticket).

## Appliqué en production le 19/11/2026 (accord de Romain : les 18 pros sans accès sont des comptes de test)
Ordre appliqué : tirage-correctifs → super-event-phases → banque-interets (brouillon privé) → annonces-pro (sans `offrir_ticket_ami_contact`, déjà à jour en prod) → securite-events-rls → securite-rls-tables.
Vérifié après application : anon refusé sur les 6 fonctions de tirage, `appliquer_regle_gain` ouverte à anon, lectures publiques (events, lots, super_events, qr_stations, tirages, participations) en 200.
