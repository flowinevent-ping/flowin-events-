# COMM NDS 2026 — Masters, règles de mise en page, chemins d'accès (06/07)

> But : ne plus jamais reperdre le temps perdu aujourd'hui. Toujours **partir des masters/gabarits validés**, décliner, et **vérifier au scan** (pyzbar) — jamais re-fabriquer.

## 1. MASTERS (ne jamais re-fabriquer, seulement décliner)
| Élément | Master / source | Décliner via |
|---|---|---|
| Vidéo réseau | `kit-digital/nds/masters/MASTER-reseau-CORRECT.mp4` (CapCut montage+SON + mur 7 + « FLASH AUX STATIONS JEUX ») | `visuels-src/gen_one.py` / `gen7.py` (overlay QR par pro, 5 fenêtres, audio `-c:a copy`) |
| Affiche station | `station_caisse-1_editable_A4_definitif.pptx` (gabarit validé Romain) | `visuels-src/gen_station_affiches.py` → A4 + 32×45 (PPTX+PDF+PNG) |
| Affiche partenaire | `kit-digital/<slug>/nds_a4_<slug>-editable.pptx` (6/7, nook absent) + `nds_a3_<slug>.pdf` + SVG | décline A4/A3/32×45 ; pied via `visuels-src/fix_partner_footer.py` |

La vidéo master n'est modifiable que sur **2 axes** : (1) le **QR** (par partenaire), (2) le **mur** partenaires (peut évoluer).

## 2. RÈGLES DE MISE EN PAGE (affiches) — validées
- **Bandeau logos = UN seul bandeau blanc** derrière les logos (indispensable à la lisibilité : logos sombres ARA/GP/Utile illisibles sans fond blanc → 5 % de clair sans, 53 % avec). **Pas** de pastilles individuelles (rejeté).
- **« NOS PARTENAIRES » descendu** (~21,9 cm en A4) sinon il mord sur « FLASH & JOUE ».
- **Pied affiche partenaire** : **pas** de `flowinevent@gmail.com · 06 16 35 49 36` ni de trait doré → seulement le **logo Flowin centré**. Garder « JEU GRATUIT · SANS OBLIGATION D'ACHAT ».
- **Mot « station »** : **affiches = « STATION JEU » (singulier)** ; **vidéos + textes Insta/FB = « stations de jeux » (pluriel)**.
- **Fond bord à bord** (0 % blanc aux bords).
- **À corriger (demandé 06/07 18h, non fait)** : (a) « STATION JEUX » → « STATION JEU » partout sur les affiches ; (b) retirer l'**encadré transparent autour des billets** « PLACES DE CONCERT »/« BONS D'ACHAT » (masque le logo, « moche ») sur toutes les affiches partenaires.

## 3. CHEMINS D'ACCÈS
- **Source unique partenaires** : `visuels-src/nds_lib.py` → `PARTNERS` + `NAMES`. Ajouter un pro : (1) logo `nds/partenaires/<slug>.png` (2) ajouter le slug à `PARTNERS` (3) relancer les générateurs.
- **QR** : `visuels-src/qr/ev-nds-<slug>.png` (partenaire=station), `ev-nds-<station>.png` (caisse-1/2, bar-1/2/3), `ev-nds-digitale` (NDS), `ev-nds-ecrans` (écran). `qr-reseaux-<slug>.png` (vidéo réseau, `source=reseaux-<slug>`). **Toujours vérifier au scan (pyzbar, pas cv2).**
- **Générateurs** : `build_master.py`, `gen7.py`, `gen_one.py` (vidéo) ; `gen_station_affiches.py` (affiche station) ; `fix_partner_footer.py` (pied partenaire) ; `gen_forex_32x45.py` (obsolète → remplacé par station-jeu).

## 4. ERREURS / RÉGRESSIONS DU JOUR (à ne pas refaire)
1. **Token GitHub** : celui de l'historique (`…YEoEXJu`) est **EXPIRÉ (401)**. Le valide est dans la fiche d'accès du 06/07 (`…01uSvFXg`). **Ne jamais stocker en clair** (repo public/Notion/base).
2. **Ne pas re-fabriquer un montage vidéo** (render_spot40 / master Python = montage « grand jeu » rejeté, **sans son**). Seul bon montage = le CapCut de Romain.
3. **Ne pas re-designer** un support : partir du gabarit validé, seulement décliner le format.
4. **Pastilles individuelles** derrière logos = rejeté → garder le bandeau unique.
5. **Aperçu image assistant instable** toute la session → faire **valider visuellement par Romain** + vérifier au scan/OCR/mesure.

## 5. 3 PILIERS (à chaque tâche)
GitHub (commit+push) + Supabase `handoff_notes` clé `handoff-nds-2026-comm` (prepend `$hf$…$hf$` puis `maj=now()`) + Notion hub `38c6dcca-9add-81dd-9af2-c93139e06393`.
