# Audit : la promesse Super Event (côté organisateur) face à l'application (19/11/2026)

Méthode : lecture du code, lectures seules en base (Supabase, SELECT), Playwright à 390 px sur `next start` d'une copie du build (port 4371), `?demo=1`. **0 requête d'écriture vers Supabase** pendant les tests. Décisions de Romain du 19/11 consignées dans `docs/DECISIONS-flowin-event.md`.

## Décisions appliquées

| Décision | Correction | Preuve |
|---|---|---|
| Quiz gain immédiat (animation) : 1 lot par joueur et par jour, dans la limite du stock | Aucune (règle déjà en place, `Configurateur.tsx`, `appliquer_regle_gain`) | — |
| Super Event = toujours tirage au sort | Déjà en place : roue retirée des jeux du Super Event, lots sans choix de mode, lots de station « verrouillés ». Trous fermés : (1) `?module=spin` en entrée d'un Super Event n'est plus repris, et la création refuse la roue ; (2) super admin, fiche animation : une roue ne peut plus être rattachée à un Super Event ; (3) « Gérer les lots » : un lot de station de Super Event est toujours enregistré en tirage au sort (même s'il portait « instantané ») | `ParcoursCreation.tsx`, `EventDrawer.tsx`, `ModalGererLots.tsx` |
| Scanner caméra iPhone + Android | `/pro/scanner` : caméra arrière (`getUserMedia`, `playsInline`, `muted`), BarcodeDetector s'il existe, sinon **jsQR 1.4.0** (MIT, chargé à la demande). Un geste : « Ouvrir la caméra ». Refus d'accès : message clair + code manuel. Validation inchangée vers `/lot.html` (seuls les liens Flowin sont ouverts) | Playwright, flux caméra simulé (canvas portant le QR `/lot.html?t=demo-CAMTEST`, BarcodeDetector retiré pour forcer jsQR) : navigation vers `/lot.html?t=demo-CAMTEST` ; refus simulé (`NotAllowedError`) : message affiché ; code manuel → `/lot.html?t=demo-ABCD` |
| 8 animations sans position | Rien (pas urgent) | — |

## Promesses de la vidéo Super Event (organisateur)

| # | Promesse | État avant | Correction | Reste à faire |
|---|---|---|---|---|
| 1 | L'organisateur crée l'événement et choisit les lots ; les commerces s'inscrivent | Existe : « Créer un super event » (`ParcoursCreation`, lots du grand tirage `se_lots`), lien d'inscription des commerces donné à la fin (`/rejoindre/[se]`), validation par Flowin | Aucune | — |
| 2 | Chaque commerce = une station, un QR par commerce | Existe : une station (`events.super_event_id`) et son QR par commerce | Aucune | — |
| 3 | Avant l'événement, le public joue pour gagner des places ou des lots | Partiel : le jeu tourne sur la période choisie par l'organisateur (elle peut commencer avant l'événement) ; les places se saisissent comme des lots. Pas de « phase avant / pendant » distincte | Aucune | **Décision Romain** : faut-il deux phases distinctes (lots différents avant / pendant) ? |
| 4 | Pendant l'événement, lots des commerces et jeu sur place | Existe : stations des commerces, lots par station, tirage | Aucune | — |
| 5 | L'organisateur garde les contacts et mesure les passages par station | **Trou** : un pro organisateur ne voyait que ses propres stations (et rien s'il n'en avait pas) | `/pro/super` : le pro organisateur (`super_events.pro_id`, colonne présente) voit son Super Event même sans station, un bloc « Organisateur · passages par station » (flashs QR, joueurs, parties de **toutes** les stations), boutons Contacts et Carte | Contacts : la fiche reste celle du pro (règles de consentement inchangées) |
| 6 | Infos RSE, mobilité, centres d'intérêt | Existe en partie : banque bonus `bq-nds-rse-mobilite` (tags rse, mobilite) ; réponses bonus listées question par question | Réponses bonus **rangées par thème** (RSE, Mobilité, Centres d'intérêt) sur la page station (`lib/themesBonus.ts`, d'après la clé de la question ; clé inconnue → Centres d'intérêt) | Pas de banque « centres d'intérêt » prête : à créer par l'organisateur (aucune question inventée) |
| 7 | Tirage en direct, gagnants prévenus dans l'application | Code prêt (`/pro/tirage`) | Aucune | **À appliquer** : `sql/2026-11-18-tirage-correctifs.sql` (fichier existant) |
| 8 | Impact sur le commerce local : carte des commerces participants | Carte limitée aux stations du pro | Organisateur : carte de toutes les stations du Super Event ; lien « Carte des commerces » | Stations sans position : pas de point (rien d'inventé) |

Non modifiés : dashboard SA (`dashboard.html` : réglages de jeux « gain instantané » hérités, hors création de Super Event), `NDS2026Client.tsx`, `nds2026Design.ts`, vidéos.

Contrôles : `npx tsc --noEmit` sans erreur ; `npm run build` « Compiled successfully » ; aucun SQL nouveau.
