# Circulation des données — Flowin Events — audit v4 (07/11/2026)

Complète `docs/audit-2026-11-07/v2/technique.md` (chaînes KO déjà établies : non reprises, sauf pour chiffrer).
Preuves : SQL lecture seule sur `ywcqtupgoxfzkddqkztk`, une requête à la fois. Code : grep sous `admin/app`, `admin/lib`, `admin/public/dashboard.html`. Rien n'a été écrit, en base comme dans le dépôt.

## 1. Carte des flux (objet par objet)

| Objet | Source (écran / fichier) | Écriture | Lecteurs | État |
|---|---|---|---|---|
| Pro | `app/rejoindre/[se]/RejoindreClient.tsx:113` (upsert anon), `app/dashboard/operations/[id]/OpsDetailClient.tsx:104` (SA), PremiereFois/`lib/inscriptionPro.ts` | `pros.*` (+ `auth_id`) | `app/pro/connexion/page.tsx:35` (par `auth_id`), `pro/scanner`, `pro/commandes`, dashboard SA | **Dupliqué** avec `partenaires` (nom, email, adresse, tel, siret, ville, cp). 17/18 pros **sans `auth_id`** : aucun ne peut se connecter via `pro/connexion`. 18/18 `acces_active_at` NULL |
| Partenaire | `app/nds/NdsClient.tsx:30`, `app/sponsor/[se]/SponsorClient.tsx:42` (upsert anon), dashboard SA | `partenaires.*` + `lots` jsonb + `lot_resume` + `code_pin` + `latitude/longitude` | `/se/[se]` et `/se/[se]/[event]` (filtre `statut_paiement='valide'`), `parcours/tombola`, `lib/operations.ts:306`, CRM | **Dupliqué** avec pros. Lien `pros.partenaire_id` 1-1 sans FK inverse |
| Établissement / adresse / GPS | demande de rattachement (`dashboard/demandes-rattachement/page.tsx:56` géocode navigateur), fiche partenaire | `demandes_*.lat/lng`, `events.lat/lng/adresse`, `partenaires.latitude/longitude/adresse`, `pros.adresse` | carte `/se`, géofence scan (`participations.scan_*`) | **4 sources d'adresse** ; aucune synchro |
| Super event | dashboard SA `super-events` | `super_events.*`, `pros[]`, `events[]` (text[]) | `/se/[se]`, `pro/super`, planning | `events[]`/`pros[]` = **cache dénormalisé** non maintenu (cf. §2) |
| Station | RPC d'approbation, `OpsDetailClient.tsx:114-116` (read-modify-write de `super_events.events`) | `events` (`super_event_id`) + append `super_events.events[]` | carte, `pro/super/page.tsx:29`, planning `participants` | Désynchronisée (§2) ; course possible (RMW non atomique) |
| Animation autonome | dashboard SA `events` | `events` (`super_event_id` NULL) | parcours joueurs, Pro | 8 events **sans pro** |
| Demande de rattachement | `RejoindreClient.tsx:123` | `demandes_rattachement_super_event` | `dashboard/demandes-rattachement`, `pro/super/page.tsx:38` | 2 lignes ; la `validee` a `lat` NULL **et** station `lat` NULL, 0 `qr_stations` |
| Lot | dashboard SA, formulaire partenaire | `lots` (table), `partenaires.lots` (jsonb), `partenaires.lot_resume`, `bons_commande.lot_*`, `demandes.lots` | `parcours/tombola/page.tsx:37`, `lib/parcours.ts:42`, `lib/superEventLots.ts:18`, `lib/operations.ts:310` | **5 endroits** pour la même info |
| Stock | `dashboard/nds-lots` | `lots_stock` | `lib/operations.ts:154-246`, nds-lots | 90/149 lignes orphelines (§3) |
| Tirage / gagnant / retrait | `TirageSuperEvent.tsx`, nds-lots, `lot.html` retrait | `tirages.statut/retire_at/notifie_at/retrait_token` | `pro/crm/[id]/page.tsx:108`, `dashboard/envoi-masse/page.tsx:31`, nds-lots:228, `/gagnants` (KO) | **Statuts incohérents** (§4) ; `events.gagnants` compteur dupliqué |
| Billet | parcours joueur | `participations.ticket_code`, `joueurs.ticket_code`, `tirages.ticket_code` | tirage, espace joueur (KO cf. v2) | 15 tirages avec un ticket absent de `participations` |
| QR | `lib/qrTraces.ts`, `cfg.qrUrl` | `qr_stations` (0 ligne), `events.qr_token`, `super_events.qr_token`, `cfg.qrUrl` | `app/q/[code]/route.ts:64` (colonne `code_court` absente), `lib/dashboard.ts:258` | **Jamais écrit** en prod ; 63 participations ont un `source_qr` qui ne pointe sur aucune ligne `qr_stations` |
| Joueur / participation | `lib/joueurs.ts:59`, `lib/landing.ts:43`, `lib/parcours.ts:468` | `joueurs.*`, `participations.*`, `joueurs.events/gains/lot_gagne` (dénormalisés) | `lib/pro.ts:45`, `lib/dashboard.ts:15`, dashboard.html | Champs doublés `genre/sexe`, `ddn/date_naissance`, `age_tranche/tranche_age` (0 conflit aujourd'hui) ; `events.participants` faux sur 20 events |
| Contact CRM / consentement | mêmes écrans joueur | `joueurs.optin`, `optin_date`, `optin_version`, `rgpd_at` | export Pro `lib/pro.ts:45`, envoi-masse | 115 optin sans date, 480 sans `rgpd_at` → preuve de consentement absente |
| Commande / bon / facture / paiement | `bon-commande-nds.html`, dashboard SA, `crm-retours/page.tsx:35` | `bons_commande.statut`, `partenaires.statut_paiement/facture_emise`, `factures`, `commandes_animation` (0), `events.paiement_statut` | `/se` (logos payés), `lib/operations.ts:476`, CRM | **3 statuts de paiement** non reliés (§4) |
| Notifications / emails | triggers + edge functions (cf. v2 §6) | `tirages.notifie_at`, `commandes_animation.accuse_envoye_le` | — | 171/236 tirages `notifie_at` NULL (tous annulés ou retirés) ; aucune notification demande/décision |

## 2. Données stockées en double sans synchronisation (écarts chiffrés)

| Doublon | Mesure | Écart |
|---|---|---|
| `pros` et `partenaires` (18 / 18) | 1 pro sans partenaire, 1 partenaire sans pro ; via `partenaire_id` : nom 0 écart, **email 1**, **adresse 4** | 1 email pro présent en double dans `pros` |
| `super_events.events[]` et `events.super_event_id` | `se-master-superevent` : tableau = 1, FK = **23** (22 stations absentes du tableau) ; NDS 22/22 OK | 22 |
| `super_events.pros[]` et `events.pro_id` des stations | NDS : tableau 12, pros réels 9, **4 ids du tableau sans station** ; master : 1 contre **10** | 4 + 9 |
| `partenaires.lots` jsonb et table `lots` | 7 partenaires / 11 lots jsonb ; table `lots` = 34 ; **2 partenaires** ont des lots en table mais un jsonb vide | non réconciliable (pas de clé commune) |
| `lots_stock.lot_id` et `lots.id` | **90 / 149** codes de stock pointent sur un lot inexistant | 60 % |
| `events.participants` et `count(participations)` | **20 events** faux, écart cumulé **921** | |
| `events.gagnants` et `count(tirages non annulés)` | **6 events** faux | |
| Adresse station et `pros.adresse` | **18 stations** avec une adresse ≠ celle du pro | |
| Facture et bon de commande | `factures.cible_id` = `p-bc-FL-2026-000x` (id fabriqué depuis le numéro de bon) : **5/5 factures sans partenaire réel**, **8/8 bons sans facture liée** ; **4 partenaires `facture_emise=true` sans facture** | |

## 3. Orphelins

| Orphelin | Nombre |
|---|---|
| Events sans pro (`pro_id` NULL) | 8 / 65 |
| Stations (event lié à un super event) sans GPS → invisibles sur la carte | 3 / 46 |
| Partenaires sans GPS | 9 / 18 |
| Demande `validee` sans GPS ni QR | 1 / 1 |
| Stock sans lot | 90 / 149 |
| Factures sans cible réelle | 5 / 5 |
| Participations sans joueur | 3 / 1034 |
| Tirages avec un ticket inconnu des participations | 15 / 236 |
| Pros sans compte Auth | 17 / 18 |
| Tirage sans event, station sans super event, lot sans partenaire, pros.auth_id orphelin | 0 (contrôlés) |

## 4. Statuts incohérents entre tables

1. **153 tirages `statut='annule'` avec `retire_at` renseigné** (153 sur 236). Or `dashboard/envoi-masse/page.tsx:31` teste `if (t.retire_at) return 'retire'` **avant** le statut → les annulés sont comptés comme « retirés », et `pro/crm/[id]/page.tsx:108` les affiche « Remis ». Le SA (nds-lots, qui lit `etat`) et le Pro voient donc deux chiffres différents.
2. **Paiement** : `bons_commande.statut` ∈ {brouillon, envoye} (aucun signé ni payé), mais 1 partenaire NDS est `statut_paiement='valide'`, et les 8 bons diffèrent tous du statut de leur partenaire. `events.paiement_statut` = `en_attente` partout. `/se/[se]/page.tsx:22` n'affiche que les partenaires `valide` → **1 logo affiché sur 11 partenaires NDS** (dont 7 avec station sur la carte).
3. **Accès Pro** : `pros.statut='valide'` pour les 18, mais `acces_active_at` est NULL pour les 18 et `auth_id` NULL pour 17 → « validé » sans accès possible.
4. **Demande `validee`** : la station existe, mais sans `lat/lng` ni `qr_stations` → acceptée mais absente de la carte et sans QR traçable.
5. **Consentement** : `optin=true` sans `rgpd_at` dans 480 cas ; l'export Pro (`lib/pro.ts:45`) les compte comme opt-in.

## 5. Même donnée, calcul différent selon le profil

| Indicateur | SA | Pro | Joueur / public |
|---|---|---|---|
| Participants | `planning/page.tsx:50` additionne `events.participants` (compteur faux) | stats calculées sur `participations` | — |
| Gagnant retiré | nds-lots : `etat` / `statut` | CRM : `retire_at` (annulé = « Remis ») | `/gagnants` KO |
| Lots | `lib/operations.ts:310` (table `lots`) | fiche partenaire : `partenaires.lots` jsonb / `lot_resume` | tombola : table `lots` par `event_id` |
| Partenaires d'un SE | SA : tous (`super_event_id`) | — | `/se` : seulement `valide` |
| Stations d'un SE | `events.super_event_id` (correct) | `pro/super` : `grouperOperations` (FK) | anciens écrans dashboard.html : `super_events.events[]` (incomplet pour master) |

## 6. Liste exhaustive des manques

- Aucune FK réelle (tous les liens sont du `text` comparé en `::text`) : rien n'empêche les orphelins ci-dessus.
- Aucun trigger de compteurs (`participants`, `gagnants`) ni de maintenance de `super_events.events[]/pros[]`.
- Pas de géocodage côté serveur (RPC) ; GPS copié à la main entre demande, partenaire et station.
- Le passage « tirage annulé » ne remet pas `retire_at` à NULL ; aucune contrainte CHECK.
- Pas de lien `factures` → `bons_commande` (pas de colonne `bon_id`) ; `facture_emise` est un booléen déclaratif.
- `qr_stations` n'est jamais écrit ; il manque `code_court` (déjà signalé en v2).
- Création de compte Auth jamais déclenchée pour les pros créés par le SA ou par `/rejoindre`.
- La preuve de consentement (`rgpd_at`, `optin_version`) n'est pas écrite par tous les chemins (`lib/joueurs.ts:59` n'écrit que `optin_date`).
- `joueurs.events`, `gains`, `lot_gagne`, `ticket_code` sont dénormalisés et sans source de recalcul.

## 7. Source unique de vérité recommandée

| Objet | Source unique | À dériver / supprimer |
|---|---|---|
| Identité légale du commerce | `pros` | colonnes identité de `partenaires` → vue `partenaires_v` jointe |
| Rôle sponsor / paiement d'un commerce sur un SE | `partenaires` (lignes par SE) | `pros.*` paiement |
| GPS / adresse du point de jeu | `events.lat/lng/adresse` (station) | `demandes.lat` = saisie temporaire ; `partenaires.latitude` → retirer |
| Appartenance d'une station à un SE | `events.super_event_id` | `super_events.events[]` et `pros[]` → vue |
| Lot | table `lots` | `partenaires.lots` jsonb, `lot_resume`, `bons_commande.lot_*` = copie figée contractuelle seulement |
| Stock | `lots_stock` avec FK vers `lots.id` | |
| Gagnant / retrait | `tirages.statut` (le statut prime ; `retire_at` NULL si annulé) | |
| Paiement | `bons_commande.statut` (puis `factures.statut`) | `partenaires.statut_paiement`, `facture_emise`, `events.paiement_statut` → dérivés |
| Compteurs | `participations` / `tirages` | `events.participants/gagnants` → vue ou trigger |
| Consentement | `joueurs.rgpd_at` + `optin_version` | `optin_date` |

## 8. Correctifs priorisés

### P0
1. **Tirages annulés comptés comme retirés** : dans `admin/app/dashboard/envoi-masse/page.tsx:31` et `admin/app/pro/crm/[id]/page.tsx:108`, tester `statut==='annule'` avant `retire_at`. En SQL (à faire valider) : `update tirages set retire_at=null where statut='annule'` (153 lignes) + `CHECK (statut<>'annule' or retire_at is null)`.
2. **Logos `/se` vides** : `admin/app/se/[se]/page.tsx:22` et `[event]/page.tsx:23` filtrent `statut_paiement='valide'` alors que le paiement n'est jamais relié au bon. Il faut soit dériver le statut du bon, soit filtrer sur `actif/visible`, puis faire décider le métier.
3. **Accès Pro impossible (17/18 sans `auth_id`)** : créer ou inviter le compte Auth à la validation (RPC d'approbation + `OpsDetailClient.tsx:104`) et écrire `acces_active_at`.
4. **3 stations sans GPS et demande validée sans GPS** : géocoder dans la RPC d'approbation ; refuser `validee` si `lat` est NULL.
5. **Factures sans cible réelle** : ajouter `factures.bon_id` (FK `bons_commande.id`) et remettre `cible_id` sur le vrai `partenaires.id` (5 lignes).

### P1
6. Remplacer `super_events.events[]/pros[]` par une vue dérivée de `events.super_event_id` ; supprimer le read-modify-write de `OpsDetailClient.tsx:114-116` ; corriger `se-master-superevent` (22 manquants).
7. `lots_stock` : purger ou rattacher les 90 orphelins, puis ajouter une FK `lot_id → lots.id`.
8. Faire de la table `lots` la seule lecture (`lib/operations.ts`, fiche partenaire, tombola) ; `partenaires.lots` en lecture seule, migré en table (2 partenaires sans jsonb, 7 avec).
9. Recalculer `events.participants/gagnants` par trigger ou vue (20 et 6 events faux, écart 921) ; `planning/page.tsx:50` doit lire la vue.
10. Consentement : écrire `rgpd_at` et `optin_version` dans `lib/joueurs.ts:59`, `lib/landing.ts:43`, `lib/parcours.ts:468` ; exclure les 480 lignes sans preuve des exports Pro et des envois de masse.

### P2
11. Fusionner `pros` et `partenaires` (vue d'identité), réconcilier les 4 adresses et l'email divergents, dédoublonner l'email pro en double.
12. Ajouter les FK sur `events.pro_id`, `participations.joueur_id` (3 orphelins), `tirages.event_id` ; affecter un pro aux 8 events sans pro.
13. Supprimer les colonnes doublées de `joueurs` (`sexe`, `date_naissance`, `tranche_age`) une fois les lecteurs migrés (`lib/pro.ts:45`).
14. Écrire `qr_stations` à la création d'une station (déjà prévu en v2) et rattacher les 63 `source_qr`.

## 9. Non vérifié
Contenu des RPC d'approbation (corps PL/pgSQL non relu), écrans vanilla `dashboard.html` au-delà des comptages grep, données `auth.users` au-delà de l'existence.
