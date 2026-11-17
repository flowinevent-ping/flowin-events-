# Expert 3 — Carte et commerces (audit 17/11/2026)

Règle appliquée (DECISIONS, 17/11) : la meilleure carte gratuite, lisible, géolocalisation, itinéraire en un geste (Waze / Google Maps / Plans). Argumentaire : la carte Flowin, « mieux qu'un Google Maps », lots flash.

## 1. Audit de l'existant
| Point | Constat avant |
|---|---|
| Moteur / fond | Leaflet 1.9.4 (cdnjs) + tuiles raster `tile.openstreetmap.org`. Ces tuiles sont un service bénévole dont la politique d'usage déconseille l'usage applicatif commercial à fort trafic. Rendu chargé (beaucoup de couleurs, noms de rues petits). |
| Temps (390 px, réseau limité 1,6 Mb/s, 150 ms) | carte visible en 3,9 s (prod). |
| Géolocalisation | pages `/se` : demande de position **au chargement** (`showPosition`), sans geste du joueur. `/carte-commerces` : aucune géolocalisation, aucune distance. |
| Regroupement | aucun (peu de points : sans objet pour Vence). |
| Fiche commerce | logo/initiale, type, adresse, jeux en texte ; pas de lot, pas de bouton Jouer, pas de distance, pas d'horaires. Fiches sous la carte (page qui s'allonge). |
| Itinéraire | un seul bouton « Itinéraire » vers Google Maps, quel que soit le téléphone. |
| Filtre | 3 pastilles sur 2 lignes en mobile, « Les deux » en violet ambigu (filtre = tous). |

## 2. Choix : MapLibre GL JS 4.7.1 + OpenFreeMap (style « liberty »)
- **Gratuit, sans clé, usage commercial autorisé** (openfreemap.org), sans quota ; attribution OpenFreeMap / OpenMapTiles / OpenStreetMap affichée par la carte (bouton « i » compact en mobile).
- **Vectoriel** : texte net à tout zoom, rues, arrêts de bus, monuments lisibles ; marqueurs de couleur bien visibles sur fond clair.
- Rejetés : CARTO Voyager (licence commerciale payante au-delà de l'usage non commercial), tuiles OSM (politique d'usage), Google/Mapbox (clé + facturation).
- Coût : la bibliothèque pèse plus que Leaflet (≈ 790 Ko min., ≈ 210 Ko compressés) mais est chargée paresseusement depuis cdnjs et mise en cache. Mesuré à 390 px réseau limité : carte visible en 4,2 à 5,9 s (contre 3,9 s avant) ; en 1280 : 1,3 à 1,9 s (1,4 s avant). Le surcoût est le premier chargement seulement.
- Repli : si le script ne charge pas, message « Carte indisponible » et le carrousel des fiches reste utilisable.

## 3. Ce qui a été fait
- `admin/components/carte/maplibre.ts` (nouveau) : chargement MapLibre, style, distance, minutes à pied, détection iOS, liens d'itinéraire.
- `admin/components/carte/CarteCommerces.tsx` (réécrit) : carte plein cadre, filtres en surimpression sur une ligne (Tous / Animation / Super Event), bouton **« Autour de moi »** (géolocalisation au geste seulement, point bleu, distances, tri par distance, recentrage sur vous + les 3 plus proches, puis « Recentrer »), **carrousel horizontal synchronisé** (toucher un marqueur centre sa fiche ; faire défiler les fiches recentre la carte et grossit le marqueur).
- Marqueurs : bleu Animation, orange Super Event, violet les deux ; **halo animé** quand le jeu est en cours (respecte « réduire les animations »).
- Fiche : logo ou initiale, type, pastille « En cours », distance + minutes à pied, **« Lot du moment »** (pictogramme cadeau), jeux (pictogramme manette), adresse · horaires, bouton **Jouer** (lien du jeu en cours) sinon « QR en magasin », et **itinéraire en un geste** : iOS = Plans + Waze ; Android / ordinateur = Google Maps + Waze.
- `admin/app/carte-commerces/CarteCommercesPublique.tsx` : page plein écran (plus de longue page), commerces « Commerce démo A–D » ajoutés **uniquement en ?demo=1**, nommés comme tels (horaires en placeholder `[horaires à compléter]`).
- `admin/app/se/_components/SuperEventMap.tsx` : même moteur et même fond, API inchangée (vitrine, jeu, sélection, marqueurs déplaçables pour le pro). Plus de demande de position au chargement : si l'autorisation est déjà donnée la position s'affiche, sinon bouton « Autour de moi ». Popups avec Waze + Plans/Google Maps.
- `admin/app/dashboard/carte-reseau/page.tsx` : hauteur de carte adaptée à l'écran.
- `admin/lib/carteReseau.ts` : champs `lien_jeu`, `lot`, `horaires`, `en_cours` ; appel de la v2 avec repli sur la v1.
- Base : **`carte_commerces_publique_v2()`** (CREATE OR REPLACE, aucune suppression ; la v1 reste intacte). Données publiques seulement : nom commercial, adresse, GPS, logo, type, jeux, lien du jeu en cours, titre du lot (ou gain immédiat), horaires, en cours. Aucune donnée joueur ni contact. Script : `sql/2026-11-17-carte-commerces-publique-v2.sql`.

## 4. Preuves
Playwright (Chromium, émulation iPhone 13 390 px réseau limité + 1280 px, géolocalisation accordée à Vence 43.7225, 7.1117), `next start` d'une copie de build, `/carte-commerces?demo=1` :
- 0 requête non-GET vers supabase.co (avant comme après).
- 5 marqueurs ; après « Autour de moi » : tri 20 m, 100 m, 170 m, 290 m ; toucher un marqueur sélectionne « Commerce démo A ».
- Liens 390 (iOS) : `maps://?daddr=…`, `https://waze.com/ul?ll=…&navigate=yes` ; 1280 : `https://www.google.com/maps/dir/?api=1&destination=…` + Waze.
- `npx tsc --noEmit` OK, `npm run build` « ✓ Compiled successfully ».
- Captures (scratchpad audit17/carte) : avant-390, avant-1280, apres-390, apres-390-autour, apres-390-marqueur, apres-1280(-autour, -marqueur), planche.png.

## 5. Reste à faire / limites
- Une seule fiche réelle aujourd'hui (Nuits du Sud, sans lot ni adresse) : la carte s'enrichira dès que les commerces auront GPS, logo, lots et horaires.
- Le lien « Jouer » d'une animation ouvre `/jouer?ev=` ; si Romain veut que le jeu ne s'ouvre qu'en magasin (QR), retirer `lien_jeu` côté animation dans la v2.
- Autres cartes hors périmètre encore en Leaflet + tuiles OSM : `parcours/nds2026/NDS2026Client.tsx` (interdit de modification), `dashboard/nds-carte`, `public/dashboard.html`, `public/nds-parcours.html`.
- Regroupement de marqueurs non ajouté (inutile sous ~30 points) ; à prévoir si le réseau grossit.
