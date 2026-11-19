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

---

# Phase 2 — toutes les autres tables `public` (préparée le 19/11, **NON appliquée**)

SQL : `sql/2026-11-19-securite-rls-phase2.sql` (idempotent, rollback complet en pied de fichier, à appliquer après la phase 1).
Confirmé par Romain : aucun Google Apps Script ni outil externe n'écrit en base (seuls : code du dépôt, edge functions en service_role, pg_cron).
Audit lecture seule : pg_policies, grants, pg_proc (aucune fonction SECURITY INVOKER n'écrit dans ces tables).

**Constat transversal** : TRUNCATE accordé à anon et authenticated sur toutes les tables `public` (TRUNCATE ignore les RLS). Phase 2 le retire partout (aucun code n'en fait).

| Table | Aujourd'hui | Après | Écrivains (jeton) |
|---|---|---|---|
| `config` | 5 politiques ALL/INSERT/UPDATE true à public | lecture publique conservée ; écriture SA | aucun dans le code |
| `landings` | 2 × ALL true à public | lecture publique ; écriture SA | `dashboard.html` (SA), `OpsDetailClient` (SA) |
| `banques` | ALL true à public | lecture publique (parcours joueurs) ; écriture SA ou pro de `pro_id` | `lib/banques.ts`, `BanqueEditor`, `Configurateur`, `ParcoursCreation` (pro), `dashboard.html`, `/dashboard/banques` (SA) |
| `event_modeles` | ALL true à public | lecture publique ; écriture SA | `lib/modeles.ts` (`/dashboard/jeux`, SA) |
| `se_gains` | ALL true à public | lecture publique ; INSERT anon limité (`type='immediat'`, non utilisé) ; reste SA / pro de l'event ou du super event | `lib/parcours.ts` (joueur anon), `dashboard.html` (SA) |
| `se_lots` | ALL true à public | lecture publique ; écriture SA ou pro du super event | `ParcoursCreation` (création super event, SA) |
| `se_reponses` | 2 × ALL true à public | lecture publique ; INSERT anon (`joueur_id` requis) ; UPDATE/DELETE SA | `lib/parcours.ts` (joueur anon) |
| `se_tickets` | ALL true à public | lecture publique ; INSERT anon (`type` quiz/bonus) ; UPDATE/DELETE SA | `lib/parcours.ts` upsert ignoreDuplicates (= INSERT) |
| `sondage_brigade` | ALL + INSERT true à public | INSERT anon (`converti=false`) ; lecture/écriture SA | `lib/parcours.ts`, `nds-brigade-verte*` (anon) |
| `visites` | ALL true à public | lecture publique (pages pro serveur) ; INSERT anon ; UPDATE/DELETE SA | `lib/track.ts` (anon) |
| `partenaire_clics` | ALL true anon+auth | lecture publique ; INSERT anon (`partenaire_id` requis) ; UPDATE/DELETE SA | `parcours-tracking`, `NDS2026Client`, `/r/[pid]` (anon) |
| `crm_retours` | ALL true à public (lecture des contacts comprise) | INSERT anon/pro limité (`etat='nouveau'`, drapeaux à false) ; lecture/écriture SA | `nds-partenaire.html` (anon), `lib/pro.ts` (pro), `dashboard.html` (SA) |
| `parrainage` | 2 × ALL true à public | lecture publique (dédoublonnage client) ; INSERT anon (`sender<>destinataire`, `pts_alloues<=1`) ; reste SA | `lib/parrainage.ts` (joueur anon) |
| `lots_stock` | 2 × ALL true (codes lisibles par tous) | SA ou pro du lot (`flowin_pro_gere_lot`) ; plus de lecture anon | `lib/stock.ts`, `lib/operations.ts` (SA ou pro) |
| `liens_ephemeres` | ALL true à anon | SA ou pro de l'event | `lib/dashboard.ts` (SA) |
| `prospection` | ALL true authenticated + UPDATE/SELECT anon | SA uniquement | `dashboard.html` (SA), `lib/commercial.ts` (SA), **`prospection.html` corrigé** : envoie le jeton de session SA (redirection `/admin-connexion.html` sinon) |
| `documents_legaux` | ALL true authenticated | lecture publique conservée ; écriture SA | `dashboard.html` (SA) |
| `packs_participation` | UPDATE true anon+auth | lecture conservée ; écriture SA | aucun |
| `lots_visuels` | ALL true authenticated | lecture conservée ; écriture SA | `lots-nds.html` (session SA) |
| `gains` | ALL true à public | `gains_select_own` conservée ; écriture SA | aucun (ancien modèle) |
| `votes`, `analytics_daily`, `analytics_events`, `analytics_kpi_snapshots`, `gas_backup_log` | ALL true à public | RLS on, aucune politique (service_role seulement) | aucun |

Nouvelles fonctions d'aide (SECURITY DEFINER, exécutables par authenticated) : `flowin_est_pro_super_event(se)`, `flowin_pro_gere_lot(lot)`.

## Laissés ouverts volontairement (risques résiduels)
- **INSERT anonymes** sur `se_gains`, `se_tickets`, `se_reponses`, `parrainage`, `visites`, `partenaire_clics`, `sondage_brigade`, `crm_retours`, `leads_landing` : le parcours joueur/visiteur écrit directement sous la clé publishable. Un tricheur peut toujours s'auto-attribuer un ticket ou un gain immédiat. Correction de fond : passer par des RPC SECURITY DEFINER (chantier séparé).
- **Lecture anonyme** de `se_reponses` (formulaire joueur), `se_gains` (nom/email/tel gagnant), `parrainage`, `visites`, `partenaire_clics` : lues par les pages joueurs (`/moi`, `/se`, historique) et par les pages pro rendues côté serveur sans session. Resserrer exige des RPC.
- `leads_landing` (« Anyone can insert », with check true) et `profils` (propres à l'utilisateur) : inchangés, déjà conformes.

## Tests phase 2
- Playwright (Chromium, serveur statique `admin/public`, non-GET supabase.co bloqués) : `/dashboard.html?demo=1` 0 non-GET (9 GET) 0 erreur JS ; `/static/dashboard.html?demo=1` idem ; `cgv-nds.html`, `nds-partenaire.html?demo=1` 0 non-GET 0 erreur ; `prospection.html` sans session → redirection connexion, avec session → GET avec `Bearer <jeton SA>`, 0 erreur.
- `dashboard.html` et code Next non modifiés (miroir MD5 inchangé, pas de build nécessaire). SQL vérifié au parseur Postgres (pglast, 148 instructions).

## Après application, vérifier
SA : éditer une landing, une banque, un document légal, la prospection (`prospection.html`). Pro : éditer sa banque, ajouter/retirer du stock de lot. Joueur anonyme : partie complète NDS (réponse, ticket, gain immédiat, clic partenaire, parrainage).

## Phase 2 appliquée en production le 19/11/2026
Vérifié : lectures publiques en 200 (config, landings, banques, event_modeles, se_lots, se_reponses, documents_legaux, packs_participation, lots_visuels, events, lots) ; pages /nds, /landing, /jouer en 200.
