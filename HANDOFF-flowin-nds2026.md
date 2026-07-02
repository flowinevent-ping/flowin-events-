### SESSION 02/07 — Nouveau partenaire Cycles 963 (commit 0d5c1c6)

- **Partenaires = 8** : bergerie, pegase(ARA), utile, carrosserie-gp, giordano, charvolin, nook, **cycles963**.
- **Cycles 963** créé pour de vrai : event `ev-nds-cycles963` (token d14f9d6130, cfg miroir charvolin, catégorie Vélo) + fiche `pt-cycles963` (102 av. Henri Giraud Vence, 06 34 64 47 16, Cycles963@gmail.com, lat 43.725079 lng 7.106230, tous supports=true). **Lots** : 1 journée location vélo 45€ × 5, non cumulable, validité 4 mois, dès 2 jours (dans `partenaires.lots`).
- Logo `partenaires/cycles963.png` (SVG fourni → PNG rogné). `nds_lib.PARTNERS`+`NAMES` mis à jour.
- Régénérés à **8 logos** : vidéo écran (QR 8/8), forex, montage. A4 design X généré + distribué (galerie + dossier pro). Dossier `kit-digital/cycles963/` (A4 + qr-station + qr-reseaux + README).
- **Bon de commande** : dynamique (lit `partenaires`) → Cycles 963 apparaît automatiquement avec ses lots. Listes hardcodées dashboard (NDS_EVENT_IDS + labels) mises à jour. Cache bumpé v2.
- Garde-fou : 35 OK / 0 WARN / 0 FAIL.

**Frictions repérées lors de l'insertion (utile pour le copilote self-service) :**
- Prérequis env manuels : symlink `/home/claude/repo`, copie `nds_lib.py`→`/home/claude/vid/`, génération des QR stations dans `/home/claude/vid/qr/`, police Anton à fetch.
- Listes **codées en dur** encore présentes hors `nds_lib` : `NDS_EVENT_IDS` + `ndsStationLabel` dans dashboard.html (à recâbler sur la base un jour).
- Manque pour cycles963 : **vidéo perso** `video-cycles963-9x16.mp4` (rendu lourd, pas produit) + **SVG A4** (PNG seulement).

RESTE : copilote self-service (upload manuel affiches/vidéos via Supabase Storage — attente choix sécurité a/b/c) ; ergonomie média par pro ; lots ; règlement+confidentialité ; repo privé + PITR avant 9/07.
### SESSION 02/07 (corrections) — retrait dekra/VIP/à la fût + Pégase→ARA + fix régressions (commit 802aad0)

**Fait & poussé :**
- **Partenaires : 7** (bergerie, pegase, utile, carrosserie-gp, giordano, charvolin, nook). **Retirés partout** : dekra, VIP, à la fût (archivés base + retirés nds_lib, dossiers kit, A4 galerie, listes hardcodées dashboard, vidéo écran, forex, montage, carte auto).
- **Pégase → « Auto-École de l'ARA »** : logo remplacé (PDF fourni → partenaires/pegase.png), nom màj (events+partenaires+nds_lib.NAMES+labels dashboard). **Slug, QR (ev-nds-pegase), coords et emplacement inchangés** comme demandé.
- **Nook agrandi** : logo source rogné (5,2% → plein cadre) — plus gros partout.
- **Régression A4 annulée** : `gen_a4_clean` (design X « STATION JEUX ») recâblé sur nds_lib et redistribué (galerie /visuels + dossiers pro). Fini le design pauvre gen_a4_pro.
- **Vidéo écran + forex + montage** régénérés à 7 logos (QR écran 8/8 OK).
- **Dashboard** : cockpit parallèle `gestion-diffusion.html` **supprimé** (doublon) ; onglet « Vidéo & média » nettoyé (listes hardcodées sans alafut/dekra, filtre archivés, Pégase→ARA) ; **cache VER bumpé 20260628→20260702v1** (débloque les 404 mis en cache + force les nouveaux visuels).
- **Garde-fou** verify-supports.py : 31 OK / 0 WARN / 0 FAIL.

**À VÉRIFIER / RESTE :**
- **404 téléchargements** : cause probable = 404 mis en cache sur l'ancienne version ; le bump VER doit régler. **Si ça persiste**, c'est un souci de service Vercel sur les gros mp4 (écran = 45 Mo) — à checker côté déploiement (les fichiers existent bien dans le repo, pas de LFS).
- **Ergonomie onglet média** : rangé « par pro » avec sélecteur (au lieu de tout dérouler) — pas encore fait, à améliorer.
- SVG A4 par pro pas régénérés (PNG seulement). Vidéos pro (nds-pro-*-9x16) : pegase à re-render avec logo ARA.
- Lots ; règlement+confidentialité ; repo privé + PITR avant 9/07.
### SESSION 02/07 (fin) — Socle + Cockpit Gestion & Diffusion (commit b93d61b)

**Livré & poussé :**
- **Recâblage source unique** : `nds_lib.NAMES` (noms d'affichage) ajouté ; `gen_a4_pro.py` boucle désormais sur `nds_lib.PARTNERS` (fini la liste en dur à 5). Les **9 A4** régénérés et rangés dans chaque `kit-digital/<slug>/`.
- **Garde-fou** `verify-supports.py` : 39 OK / 0 WARN / 0 FAIL (logos, dossiers pro + 2 QR décodés, orphelins, QR écran, A4 présents, générateur piloté par la source).
- **Cockpit** `admin/public/nds/gestion-diffusion.html` : lecture live Supabase (`partenaires`), 1 pro = 1 carte (logo, infos, statut, rattachement supports via flags logo_ecrans/forex/kit_comm/fiche_etab/bandeau, **2 QR physique/digital**, affiche A4, vidéo pro, dossier), + section supports partagés (écran-8, lancement, insta, fb, spot) prévisualisables/téléchargeables. Entrée **sidebar dashboard** « Gestion & Diffusion » (pattern `ext`).

**À savoir / RESTE :**
- Les **bascules de flags** du cockpit font un PATCH anon sur `partenaires` : si la **RLS** interdit l'écriture anon, elles ne persistent pas (message d'erreur affiché). → ajouter une policy d'update (ou passer par une edge function) pour les rendre persistantes.
- **Vidéo pro `vip-coiffure-9x16`** (rendu lourd) toujours non produite.
- Intégration plus profonde de l'onglet Communication *dans la fiche pro elle-même* (le cockpit le fait déjà par carte).
- Prérequis env des renders (symlink `/home/claude/repo` + QR stations `/home/claude/vid/qr/`) à encapsuler dans un script de bootstrap.
- Lots VIP en attente ; règlement jeu + politique confidentialité ; repo privé + PITR avant 9/07.

---
### SESSION 02/07 (suite) — Supports VIP régénérés + garde-fou (commit 5d1f4b0)

**Fait & poussé :**
- **Vidéo écran-8** `video-ecran-8-partenaires.mp4` régénérée via `ecran-8-partenaires/rebuild-video-ecran8.sh` → VIP à la place d'ALAFUT, **QR ev-nds-ecrans 8/8 OK** (résout le conflit : Notion pointait sur la version périmée, désormais à jour, même URL).
- **Forex** (caisses PNG/SVG/PPTX) + **montage kit** régénérés depuis `nds_lib` (9 logos, VIP inclus) via `rebuild_partenaires.sh`.
- **Dossier pro** `kit-digital/vip-coiffure/` créé au standard : `nds_a4_vip-coiffure.png` + `qr-station-vip-coiffure.png` (PHYSIQUE, 1/jour) + `qr-reseaux-vip-coiffure.png` (DIGITAL, 1×, `?source=reseaux-vip-coiffure`) + README. **`kit-digital/alafut/` retiré.**
- **Garde-fou** `visuels-src/verify-supports.py` : vérifie source unique↔logos, dossiers pro + 2 QR (physique/digital) qui décodent, orphelins, QR écran, dérives listes en dur. **Bilan : 28 OK · 1 WARN · 0 FAIL.**

**Prérequis env (à intégrer au socle) :** les scripts codent en dur `/home/claude/repo` (symlink requis) et attendent les QR stations dans `/home/claude/vid/qr/` (régénérables depuis la base). 

**RESTE :**
- WARN garde-fou : `gen_a4_pro.py` liste **5 pros en dur** vs 9 dans `nds_lib` → recâbler sur `nds_lib` (A4 pégase/utile/carrosserie/giordano OK mais charvolin/dekra/nook/vip pas régénérés par ce script).
- Vidéo pro `video-vip-coiffure-9x16.mp4` (rendu lourd) non produite — dossier VIP sans sa vidéo pour l'instant.
- **Cockpit « Gestion & Diffusion »** (onglet dashboard) + **onglet Communication par pro** : à construire (étapes 2-3). Le socle (régé unifiée + garde-fou) est posé.
- Lots VIP en attente ; règlement jeu + politique confidentialité ; repo privé + PITR avant 9/07.

---
### SESSION 02/07 — VIP Coiffure remplace À la Fût (commit d21ee82)

**Fait & poussé :**
- Supabase : créé `ev-nds-vip-coiffure` (cfg miroir d'`ev-nds-alafut`, qr_token `79085447cc`, lot « 2 places de concert », lotClause, quiz/RSE) + fiche `pt-vip-coiffure` (164 av. Émile Hugues, Vence 06140 · 04 93 24 72 23 · lat 43.721689 lng 7.108601 · logo_ecrans/forex/kit_comm/fiche_etab=true, bandeau=false car lots en attente). ALAFUT **archivé** (réversible) : `ev-nds-alafut.status='archived'`, `pt-alafut.actif=false/visible=false`. 0 participation → sans perte.
- Webapp carte : **auto** via table `partenaires` (VIP visible, ALAFUT masqué) — aucun code TS à changer.
- `nds_lib.PARTNERS` : `alafut` → `vip-coiffure` (source unique).
- Logo `partenaires/vip-coiffure.png` (image VIP Vence rognée).
- Vidéo **lancement 9x16** re-rendue (VIP à la place d'ALAFUT) — + refonte complète v4→v6 : Flash sans e, police intro agrandie, bandeau « plus tu joues », scène Où jouer en pastilles, logos partenaires agrandis (trim), QR **centré → ev-nds-ecrans**. Script versionné : `visuels-src/render_lancement_9x16.py` (+ font `visuels-src/fonts/Manrope-var.ttf`).

**RESTE À FAIRE (débloqué par le swap nds_lib, non fait cette session) :**
- Re-render **vidéo écran 8 partenaires** (`render_kref40`) avec VIP — ⚠️ traîne le bug pré-existant chevauchement logo/QR (Charvolin) à régler dans la même passe.
- Re-générer **forex** (`gen_forex_layers`) + **A4** (`gen_a4_clean`) + **kit pro** VIP — via `rebuild_partenaires.sh` (lit nds_lib).
- **Lots VIP** : en attente de confirmation (bandeau=false pour l'instant).
- Toujours en suspens (hors VIP) : règlement de jeu + politique de confidentialité (documents_legaux = CGV seule), traçabilité RGPD (rgpd_at/optin_version), repo GitHub privé + PITR avant 9/07.

---
## 🟢 SESSION 01/07 — Nook, corrections dashboard, anti-triche, vidéos, hub demos.html

**Nouveau partenaire NOOK CAFÉ** (rue Louis Funel, Vence — FB/Insta fournis) : `ev-nds-nook` + `pt-nook` créés (module nds2026, cfg jeu copiée d'Utile), logo intégré + `nds_lib.PARTNERS` (9 partenaires), QR station + réseaux (one-shot) identifiés dans `kit-digital/nook/`. Lots volontairement EN SUSPENS (Romain). Adresse exacte + GPS + tél restent à fournir.

**Logo Utile Vence** : fichier officiel fourni par Romain (`utile_vence.svg`) intégré partout — dashboard/front, montage, A4 (PNG+PDF), ticket PDF, montage-écran zip, ET mur de logos vidéo (via `rebuild-video-ecran8.sh`).

**RECETTE DURABLE inscrite** : `admin/public/nds/RECETTE-LOGOS-PARTENAIRES.md` + `visuels-src/ecran-8-partenaires/rebuild-video-ecran8.sh` (1 commande = mur logos + composition finale + vérif QR/durée). Master plat CapCut désormais **versionné** dans `visuels-src/sources-video/bergerie-video-complete-TEST.mp4` — plus jamais à re-uploader.

**Fix chevauchement QR video-ecran-8** : le master CapCut exposait brièvement (27.51-27.7s) son propre QR erroné (`ev-nds-bergerie`) avant la carte de recouvrement. Fenêtres avancées à 27.3s. Vérifié exhaustif (80 échantillons). Bonus : Nook intégré au mur (9 logos).

**Collecte de données (objectif : visuel précis par station)** :
- `participations.source_qr` ajouté (digital `reseaux-<slug>` vs physique) — canal enfin capté.
- `participations.started_at` ajouté (heure de connexion, calcule le temps de jeu).
- Règle confirmée : **digital = one-shot 1ère connexion** (écran de refus « rends-toi sur le lieu » si compte déjà connu) ; **physique = 1×/jour/station** (pas 1×/vie).
- 2 index anti-triche posés : `uniq_participation_digital_oneshot`, `uniq_participation_physique_jour`. Erreurs d'écriture désormais surfacées (`writeJoueur` + `claimJoueur`) → plus de risque de ticket fantôme.

**Dashboard, corrections réelles (pas de mock)** :
- Fiche joueur Historique : vraies participations (date/heure/score/tickets/réponses), fini le mock appareil iPhone/Samsung inventé.
- Fiche joueur Stats : canal réel (digital/physique) + plages horaires réelles, fini le mock device.
- Bloc Parrainage & filleuls ajouté (table `parrainage`, jointure `external_id`).
- Page Participants NDS : inclut les 8 commerces partenaires (vue `v_nds_participants`), recherche (bug focus corrigé GLOBALEMENT dans `render()`), clic ligne → fiche, colonnes tickets/parrainages, bouton suppression totale (`admin_delete_joueur` RPC, cascade, double confirmation).
- Fiche event onglet QR : 3e bloc QR RÉSEAUX (digital, distinct de station et Accès Pro) ajouté, anti-confusion.
- 7 comptes de test nettoyés (baitaenergie, will@*, Francis seed) — 0 résidu vérifié.

**Vidéos** :
- `nds-lancement-jeux-9x16.mp4` : repris à l'identique du fichier fourni par Romain (AUCUN contenu changé — vérifié pixel par pixel, écart 1.9/255 hors QR), juste vertical + logo NDS haut + signature Flowin + QR corrigé (`ev-nds-2026`).
- Les deux vidéos (lancement + écran-8) ajoutées dans le **hub `demos.html`** (https://flowin-events.vercel.app/demos.html), section « Vidéos écrans NDS ».

**Notion** : rubrique permanente « 💡 Idées & options techniques — Parking » créée (id `3906dcca-9add-81e4-81e6-dd443f0d27eb`) pour stocker les options étudiées non-actives (1ère entrée : QR physique GP en fiche, dépend de `geo_controle`).

**RESTE / reste-à-faire prioritaire** :
- Nook : adresse exacte + GPS + tél + lots (Romain doit fournir).
- Tâche 1 (CGV + conditions bons par partenaire, même cadre) : en attente du wording de Romain.
- Tâche 2 (bonus quiz 4Q ≠ brigade RSE, différent par station) : contenu RSE/accès/satisfaction à fournir par Romain.
- Tâche 3 (UX maraudeur mode sondage tablette) : faisable dans l'archi actuelle, à cadrer.
- Message dédié refus digital strict (aujourd'hui backstop DB générique) : finition mineure possible.
- Sécurité `admin_delete_joueur` + dashboard SA sans login : durcissement post-festival prévu (déjà documenté).

**Dernier commit : `bb069ca`. Repo propre, rien en attente (vérifié local == origin/main).**

---


- **nds-insta-9x16 = render_spot40 SANS audio** (variante Insta silencieuse — confirmé via frame : titre « JOUE CHEZ NOS PARTENAIRES » + badge « Flash le QR » identiques au spot). Régénéré à 8 logos depuis les frames spot40 (déjà rendues à 8). QR ev-nds-digitale vérifié. Commit `4dd45d8`.
- **TOUTES les vidéos festival à mur de logos = 8 logos** : parcours ✅, nds-fb-16x9 ✅, nds-spot-9x16 ✅, nds-ecrans-9x16 ✅, nds-insta-9x16 ✅.
- Doc `docs/recette-insertion-partenaire.md` : mapping vidéo↔script complété (render_social1x1 = carré obsolète ; nds-partenaire-16x9 = présentation upload 34s sans mur de logos → hors recette).
- **Recette d'insertion 100% bouclée** côté supports auto : forex PNG/SVG/PPTX + montage + 5 vidéos (pres16x9/spot40/ecran40) pilotés par nds_lib.PARTNERS via logo_grid.
## 🟢 SESSION 30/06 (suite 10) — DEKRA dans les vidéos festival + Notion

- **render_spot40 (nds-spot-9x16)** + **render_ecran40 (nds-ecrans-9x16)** : scènes commerces converties au helper `L.logo_grid(L.PARTNERS)` (DRY) → **8 logos** (DEKRA inclus). Re-rendus 960 frames chacun. spot = avec audio (bergerie-capcut-source-40s), ecran = sans audio. QR ev-nds-digitale vérifié (pyzbar). Commit `4cd09b6`.
- **Récap vidéos à 8 logos** : parcours-jeu-flowin-nds ✅, nds-fb-16x9 ✅, nds-spot-9x16 ✅, nds-ecrans-9x16 ✅. → Toutes les vidéos festival qui montrent le mur de logos sont à jour.
- **Recette d'insertion COMPLÈTE** : tous les supports (forex PNG/SVG/PPTX, montage, + vidéos pres16x9/spot40/ecran40) lisent désormais `nds_lib.PARTNERS` via `logo_grid`. Ajout partenaire = 1 ligne + rebuild (+ re-render vidéos).
- **Notion** : (1) page redondante « BRIEF parcours v2 » vidée + renommée « 🗑️ obsolète à supprimer » (38f6dcca…8143) — suppression dure = geste manuel Romain (API ne supprime pas) ; (2) hub : bloc vidéos DEKRA 8 logos avec liens ; (3) page Kit complet : ligne vidéos mise à jour (8 logos + spot ajouté).
- **Reste** (mineur, vidéos sans mur de logos visible ou source incertaine) : nds-insta-9x16 (source script à confirmer), nds-partenaire-16x9 (34s, présentation) / nds-partenaire-9x16.
## 🟢 SESSION 30/06 (suite 9) — RECETTE D'INSERTION (source unique partenaires)

**Fini le drift de la liste partenaires (dupliquée dans ~15 fichiers).**
- **Source unique** : `nds_lib.PARTNERS` (8 slugs, ordre canonique). + helper `L.logo_grid(slugs, cx, cy, w, h, cols)` (grille auto, renvoie positions, l'appelant anime).
- **Branchés sur L.PARTNERS** : `gen_forex` (slots), `render_kref40` (LOGOS), `build_montage_kit` (loop), `render_pres16x9` (scène commerces via logo_grid → 0 coordonnée à toucher).
- **Commande de rebuild** : `bash admin/public/nds/visuels-src/rebuild_partenaires.sh` → régénère forex PNG/SVG/PPTX + montage. Smoke-test OK (8 logos).
- **Doc** : `docs/recette-insertion-partenaire.md` (procédure 3 étapes + mapping vidéo↔script qui manquait).
- **Sorties régénérées** ordre canonique : forex PNG/SVG (3 caisses) + PPTX (6) + nds-fb-16x9 (auto-grille) + montage zip. Commit `8fc12d0`.
- **Reste pour finir la recette** : convertir `render_spot40.py` et `render_ecran40.py` (scène commerces tuiles codées en dur) au helper `L.logo_grid(L.PARTNERS)` — ensuite nds-spot-9x16 et nds-ecrans-9x16 seront aussi pilotés par la source unique. (nds-insta-9x16 : source à confirmer ; render_social1x1 carré = aucun fichier kit.)

**Procédure ajout partenaire = 3 étapes** : 1) logo `partenaires/<slug>.png` 2) `"<slug>"` dans `nds_lib.PARTNERS` 3) `bash rebuild_partenaires.sh` (+ étapes métier : Supabase pt-/ev-, A4, kit, index, Notion).
## 🟢 SESSION 30/06 (suite 8) — DEKRA : forex PPTX + 2 dernières vidéos

- **Forex PPTX éditables** (caisses+bars+festival, 6 fichiers) régénérés à **8 logos** (chaîne plate→manifest→pptxgenjs). Commit `f6be282`.
- **nds-fb-16x9** (render_pres16x9) : scène commerces re-grillée 5→**8 logos** (2×4, DEKRA inclus), re-rendu 960 frames, copié dans kit. `dekra` ajouté au registre LOGOS de render_kref40 (lib partagée).
- **Kit montage écran** (montage-ecran-nds2026.zip) : `logo-dekra.png` ajouté aux elements. Commit `4cb7582`.
- ⚠️ **Mapping vidéos↔scripts non documenté** (source de la fragilité) : render_social1x1 est carré 1080×1080 (ne correspond à aucun fichier kit) ; nds-insta-9x16 (9×16) source incertaine. Restent encore en 7 logos : nds-spot-9x16 (spot40), nds-ecrans-9x16 (ecran40), nds-insta-9x16, nds-partenaire-16x9 (34s).
- 🔧 **À restructurer (recette d'insertion)** : centraliser la liste partenaires dans UN seul module partagé (ex. nds_lib.PARTNERS) + un build_kit unique mappant script→fichier, pour qu'ajouter un partenaire = 1 ligne + 1 commande.
## 🟢 SESSION 30/06 (suite 7) — DEKRA : supports complétés (forex + A4 + index)

- **Forex 70×70** : `dekra` ajouté aux slots de `gen_forex.py` (bandeau 8 logos). 3 forex caisses régénérés (PNG+SVG) → `kit-digital/nds/forex_70x70_caisse-1/2/3`. QR station vérifié.
- **Affiche A4** : `nds_a4_dekra` généré via `gen_a4_clean.py` (logo DEKRA Vence en station-lockup, gains festival, QR station ev-nds-dekra vérifié). PNG + PDF + SVG → `kit-digital/dekra/` + `kit-digital/svg/`. Police Anton téléchargée dans `/home/claude/vid/fonts/`.
- **Index kit** : bloc DEKRA ajouté dans `kit-digital/index.html` (A4 PNG/PDF/SVG, QR station/réseaux, lien tracké, lots, adresse, tél « à compléter »).
- Commit `748927a` poussé main → Vercel.
- **RESTE** : (1) **téléphone DEKRA** toujours manquant (placeholder partout) ; (2) A4 **éditable PPTX** + **zip kit** + **vidéo partenaire dédiée 9×16** DEKRA non générés (deps Node/CapCut) ; (3) valeurs lots auto 80€/moto 50€ à confirmer.
## 🟢 SESSION 30/06 (suite 6) — DEKRA Vence ajouté comme 8e partenaire

Romain : intégrer DEKRA Vence (contrôle technique) comme partenaire, sur tous les supports + kit digital. Auth distributeur confirmée par Romain.
- **Logo** : extrait de la capture fournie (vert RGB 16,129,71), fond blanc, « Vence » dessous (Manrope) → `admin/public/nds/partenaires/dekra.png` + `/home/claude/vid/logos/dekra.png`.
- **Supabase** : `pt-dekra` (couleur #109247, adresse 1956 Rte de Cagnes 06140 Vence, 3 lots) + `ev-nds-dekra` (module nds2026, qr_token 98863bc1b3, super-event se-nds-2026, cfg copiée du festival + lots DEKRA). categorie « Controle technique ».
- **Lots** : 2 CT auto offerts, 2 CT moto offerts, 15 bons de 10€ (valeurs auto 80€ / moto 50€ = estimations à valider).
- **Kit digital** : `admin/public/nds/kit-digital/dekra/` → qr-station-dekra.png + qr-reseaux-dekra.png (pyzbar OK) + README. {TÉL à compléter}.
- **Vidéo spot** : DEKRA ajouté comme 8e logo dans la scène partenaires (réagencement 3+3+2 : bergerie/pegase/utile · charvolin/carrosserie-gp/giordano · alafut/dekra). Re-rendu 888 frames, audio bergerie, QR ev-nds-digitale OK. `kit-digital/nds/parcours-jeu-flowin-nds.mp4` (7,99 Mo).
- Script render MAJ (8 logos) committé + Supabase `script-render-parcours-flowin-v2`. Commit `46da57d` poussé main → Vercel.
- **EN ATTENTE / RESTE À FAIRE** : (1) téléphone DEKRA manquant → bloque fiche/README final ; (2) forex_70x70 à régénérer avec 8 logos ; (3) affiche A4 nds_a4_dekra (PPTX/PDF/PNG/SVG) ; (4) vidéo partenaire dédiée DEKRA 9×16 ; (5) entrée DEKRA dans kit-digital/index.html ; (6) valeurs lots auto/moto à confirmer.

## ✨ SESSION 30/06 (suite 5) — FX dynamiques sur parcours-jeu-flowin-nds v2

Romain : retirer la ligne teal qui balaie le QR + dynamiser le spot façon vidéo kinetic. Effets ajoutés (montage/structure/contenu inchangés) :
- **QR** : ligne de scan qui circule SUPPRIMÉE → remplacée par un **halo teal qui respire** autour du badge (sin pulse).
- **Faisceaux animés** (teal/magenta/amber) qui dérivent en continu dans le fond → fond vivant (`beams()`, layers blurés précalculés).
- **Flash de coupe « BOOM »** à chaque transition de scène (t=6/12/18/24/31, fenêtre 0,3 s) → cuts punchy (`cut_flash()`).
- **Glow** doux derrière tous les gros titres (`title_pop` + GaussianBlur).
- **Scintillements** (étoiles teal/amber qui twinklent) sur « À GAGNER » et « GRAND TIRAGE FINAL » (`sparkles()`).
- Vidéo re-rendue (888 frames, chunks ≤220), audio bergerie, **7,98 Mo** (bitrate ↑ vs 4,31 Mo précédent à cause des FX). QR pyzbar OK sur 6 scènes.
- Script FX = source de vérité : `render_parcours_flowin.py` (13183 o) committé + mis à jour dans Supabase `handoff_notes` clé `script-render-parcours-flowin-v2` (octet_length identique).
- Commit `b86a38e` poussé main → Vercel auto-deploy. Invariants respectés (SpinClient/QuizClient/NDS2026Client intacts, render_kref40 non utilisé).

## 🎬 SESSION 30/06 (suite 4) — RENDU FINAL livré parcours-jeu-flowin-nds v2

Le montage v2 (script `render_parcours_flowin.py` stocké dans handoff Supabase `script-render-parcours-flowin-v2`) a été **rendu et livré**. Aucune modification du montage (déjà validé), uniquement rendu + intégration.

- ✅ Script récupéré depuis Supabase → écrit dans `admin/public/nds/visuels-src/render_parcours_flowin.py` (committé, syntaxe OK).
- ✅ Rendu 888 frames (0→888, 3 chunks ≤300) en PIL, 1080×1920 24fps ; assemblage ffmpeg libx264 crf19 ; audio **bergerie** muxé `-shortest`.
- ✅ `parcours-jeu-flowin-nds.mp4` : **1080×1920, 37s, H264+AAC, 4.31 Mo** (remplace v1 2.24 Mo).
- ✅ QR vérifié pyzbar sur 6 timestamps (toutes scènes) → `https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-digitale`.
- ✅ Copié dans `kit-digital/nds/parcours-jeu-flowin-nds.mp4` (md5 identique au master) ; commit `218ab06` poussé sur main → Vercel auto-deploy.
- 6 scènes conformes : Flash.Joue.Gagne (Flash sans e) + ×Flowin / Comment ça marche (1-2-3) / À gagner / Où jouer (carte) / EN GAGNANT LE JEU CONTINUE + 7 logos (bergerie, pegase, utile, charvolin, carrosserie-gp, giordano, alafut) + signature Flowin / GRAND TIRAGE FINAL. QR fixe + ligne de scan teal sur toutes les scènes, fond animé.
- ⚠️ Invariants respectés : aucune touche à SpinClient/QuizClient/NDS2026Client ; render_kref40 NON utilisé ; pas de régénération d'une autre vidéo.

## 🎬 SESSION 30/06 (suite 3) — refonte verticale du spot → parcours-jeu-flowin-nds

Romain voulait modifier SON spot (`nds-spot-nds2026-16x9`, 37s, muet), pas une autre vidéo. Mes 2 tentatives précédentes (render_kref40) étaient un AUTRE montage → rejetées. Le script source du spot n'existe plus (montage antérieur à la refonte charte). Le passage en vertical imposait une recomposition.

- 🆕 `kit-digital/nds/parcours-jeu-flowin-nds.mp4` (1080×1920, 37s, musique bergerie) : recompose **fidèlement les 6 scènes du spot** en vertical — intro « Flash. Joue. Gagne. » / Comment ça marche (1-2-3) / À gagner / Où jouer (carte) / Nos partenaires / Grand tirage + Flowin.
- Corrections demandées appliquées : **Flash sans e** (intro + « FLASH & JOUE »), **7 vrais logos** (remplacent Work'n Fun/Util/Alafut erronés), **fusion** partenaires + grand tirage + signature « Flowin — partenaire jeux des Nuits du Sud », **musique bergerie**, QR `ev-nds-digitale` (pyzbar OK).
- Source `render_parcours_flowin.py` committée (PIL, 6 scènes, deps: logo_nds.png + /home/claude/vid/logos + Manrope). index.html mis à jour.
- ⚠️ Méthode : valider le contenu AVEC Romain (storyboard) AVANT de rendre — ne pas régénérer une autre vidéo.
- HEAD repo : `92b87bf`.

---

## 🎬 SESSION 30/06 (suite 2) — spot + partenaire en 9×16 (refonte)

Constat : les mp4 `nds-spot-nds2026-16x9` et `nds-partenaire-16x9` étaient des **rendus périmés** (ancien QR `nds-parcours.html`, « Flashe » avec E, noms texte erronés type « Work'n Fun / Util », scène « pas de téléphone » = fausse info). Les scripts étaient déjà corrigés ; seuls les rendus manquaient.

- 🆕 `kit-digital/nds/nds-spot-9x16.mp4` (1080×1920, 40s, musique bergerie) : intro **FLASH** (sans E), 7 **logos** partenaires, finale **« Et un grand tirage final à la clôture »** + signature **« Flowin — partenaire jeux des Nuits du Sud »**. Source `render_spot40.py` (dérive `render_kref40`, finale custom — le maître n'est PAS touché).
- 🆕 `kit-digital/nds/nds-partenaire-9x16.mp4` (1080×1920, 40s, musique bergerie) : charte verticale, page partenaire (7 logos), **sans** « pas de téléphone ». Base `render_kref40`.
- QR `ev-nds-digitale` (cohérent insta/fb), pyzbar vérifié sur les 2. Musique = audio de `bergerie-video-complete-TEST.mp4` (libre de droit).
- `index.html` : spot 9×16 + partenaire 9×16 ajoutés ; lien `nds-partenaire-16x9` (périmé) retiré.
- ⚠️ Fichier `nds-partenaire-16x9.mp4` toujours sur disque (non listé) — à supprimer si Romain confirme.
- HEAD repo : `c1d9e46`.

---

## 🎬 SESSION 30/06 (suite) — vidéo charvolin + kits 7/7

- 🆕 `kit-digital/charvolin/video-charvolin-9x16.mp4` (1080×1920, 24fps, 40s, muette comme les 6 autres). QR réseaux `ev-nds-charvolin&source=reseaux-charvolin` (pyzbar OK badge+finale). Pipeline = `render_kref40` base 960f + `composite_qr` (QR charvolin). README + zip charvolin régénérés.
- ✅ **Les 7 kits partenaires ont désormais leur vidéo 9×16** (bergerie, pegase, utile, carrosserie-gp, giordano, alafut, charvolin). Le point « 1 vidéo par partenaire » est clos.
- 🧹 `kit-digital/index.html` : section charvolin était **en DOUBLON** (2e occurrence avec liens QR cassés `qr-station.png`/`qr-reseaux.png`) → unifiée + bloc vidéo ajouté. Audit index : 0 doublon d'id, 0 lien QR cassé, 7/7 vidéos présentes.
- ℹ️ Forex festival vérifié : bandeau « NOS PARTENAIRES » à jour avec les **7 logos** (charvolin inclus). Demande « forex par commerce » soulevée puis **annulée par Romain** (30/06) — non traitée.
- HEAD repo : `9ca3ae8`.

---

## 🧭 SESSION 30/06 (réorganisation navigation) — à lire EN PREMIER

**Objectif tenu** : rendre le projet lisible par un humain qui arrive « à froid ». Avant : ~10 docs HANDOFF/RECAP/REPRISE en vrac à la racine, README vide (9 o). Après : **un point d'entrée unique**.

- 🆕 **`README.md`** = porte d'entrée. Tableau « je cherche… → je vais là ». Ne duplique pas, il pointe.
- 🆕 **`docs/ARCHITECTURE-flowin.md`** = comment Flowin marche (schéma, parcours joueur de bout en bout, glossaire) — lisible sans le code.
- 🆕 **`docs/INDEX-LIVRABLES-nds2026.md`** = carte **sources → maîtres → téléchargeables** : pour chaque visuel, où est le fichier final, sa source, comment le régénérer.
- 🧹 **Nettoyage** : 11 docs périmés déplacés dans **`docs/archive/`** (avec table « remplacé par »). Racine = `README` + `HANDOFF` + `CLAUDE` uniquement. `CDC-editeur` et `NDS2026-questions-a-valider` rangés dans `docs/`.
- 🔗 Liens internes **tous vérifiés** (0 mort). `CLAUDE.md`, `SPEC-TECHNIQUE`, `SOURCES-MAITRES.md` (public) repointés vers la nouvelle carte.
- ✅ Découverte au passage : les **4 logos ex-404** (bergerie, carrosserie-gp, pegase, utile) **sont présents** dans `admin/public/nds/partenaires/` → à confirmer côté affichage du mur de logos.

> Aucune modification de code applicatif, de mécanique de jeu, de base ou de module maître. Pur travail de doc + rangement `.md` (0 risque deploy).

---

## 🔁 RÉCAP REPRISE — sessions 28→30/06/2026 (à lire EN PREMIER)

> HEAD repo au moment du handoff : **`2c186df`** (toujours revérifier via `git log`). Source canonique = table Supabase `handoff_notes` clé `handoff-nds-2026-comm` (synchronisée avec ce bloc).

### A. BOOTSTRAP (ouverture obligatoire, dans l'ordre)
1. `git clone https://github.com/flowinevent-ping/flowin-events-.git` puis `git pull --ff-only origin main` → HEAD attendu **`2c186df`**. Branche `main`, app à la racine `/admin`, Vercel auto-deploy sur push.
2. Identité commit : `git -c user.email=romain@flowin.events -c user.name="Romain Collin"`.
3. Push auth : `https://x-access-token:<PAT>@github.com/flowinevent-ping/flowin-events-.git` — **PAT en mémoire projet, jamais en clair dans Notion/public**.
4. Supabase via MCP uniquement, ref `ywcqtupgoxfzkddqkztk`, bootstrap `select 1`.
5. Notion hub Comm : page id `38c6dcca-9add-81dd-9af2-c93139e06393`.
6. Si `git push` OU Supabase échoue → **STOP**, signaler, pas de mode dégradé.

### B. CE QUI A ÉTÉ FAIT (28→30/06)

**B1. Brigade Verte — module sondage-only** (commit `c0bea33`)
- Module `/parcours/nds2026`. Events `ev-nds-tablette` / `-1` / `-2` / `-3`, tous `super_event_id = se-nds-2026`, `gain_ticket = true`, `geo_controle = false`.
- Mécanique : `quizBanques: []` + `quizNbQuestions: 0` + `sondageAnonyme: true` ⇒ quiz sauté, `quizTk=false`, `bonusTk=true` ⇒ **1 ticket** par sondage. Cumul festival via `ndsLedgerAdd`.
- Géoloc : `captureScanGeo` ⇒ `onSite=true` si `geo_controle=false` OU pas de lat/lng ⇒ **ticket toujours accordé sur site, sans coordonnées**.
- Stockage anonyme **VÉRIFIÉ** : `writeSondageBrigade(evId, bonusAnswers)` → table `sondage_brigade` (`event_id` + `reponses` jsonb, **0 PII, 0 coordonnée**). Déclenché dans `finishBonus` dès la fin du sondage, que la personne s'inscrive ensuite ou non. Anti-double via `sondageAnonSaved`.
- Anti-rejeu : `localStorage` 1 participation/jour/station.
- Stations culture (quiz présent) inchangées. Seuls changements globaux : optin désormais **facultatif** + texte optin RGPD reformulé.
- **Non touché** : `SpinClient.tsx` / `QuizClient.tsx` (masters), banque dormante `bq-nds-rse-mobilite`.

**B2. Bug routage QR (critique) — RÉSOLU** (commits `be95f22` + `c319b8f`)
- Symptôme : QR station tombait sur l'écran générique « Jouer gratuitement » (QuizClient) au lieu de l'écran NDS brandé « À GAGNER / Comment jouer » (NDS2026Client).
- Cause : anciens QR pointaient `/parcours/quiz?ev=…` au lieu de `/parcours/nds2026?ev=…`.
- Fix code `be95f22` : garde-fou serveur dans `admin/app/parcours/quiz/page.tsx` → si l'event a un module canonique (`nds2026`…), redirige vers `/parcours/<module>` en conservant `source`. Rattrape tout ancien QR imprimé/vidéo/forex. N'altère pas QuizClient. `tsc 0` + `next build` OK.
- Fix sources `c319b8f` : 6 QR commerce `visuels-src/qr/ev-nds-{alafut,bergerie,carrosserie-gp,giordano,pegase,utile}.png` régénérés en `nds2026`, scan vérifié.
- Inventaire impression : A4 + kit-digital déjà `nds2026` → ce qui s'imprime/se distribue est bon.

**B3. Vidéo Bergerie test + anti-perte** (commits `5f06ed9`, `91984c8`, `7b1e5f3`, `2c186df`)
- Clip partenaires v2 (7 logos + Allianz Charvolin, QR remonté/agrandi) : `admin/public/nds/kit-digital/nds/clips/5-partenaires-bergerie-allianz.mp4` + source `render_partners_v2.py`.
- Logo Allianz Charvolin committé (`partenaires/allianz-charvolin.png`).
- Recette montage complète : `admin/public/nds/visuels-src/build_bergerie_video_test.py` (delogo « CE SOIR » + badge QR agrandi/remonté + splice scène partenaires xfade + grain). Recopie l'audio source. Vérifiée : sortie 40,54 s, QR `nds2026` scanné.
- **Musique confirmée libre de droit par Romain (30/06)** → exception « ne pas committer la musique » LEVÉE. Source + rendu committés :
  - source CapCut : `admin/public/nds/visuels-src/sources-video/bergerie-capcut-source-40s.mp4`
  - rendu final test : `admin/public/nds/visuels-src/sources-video/bergerie-video-complete-TEST.mp4`
  - script branché par défaut sur la source committée → reproductible **sans ré-upload**.

### C. TRAVAIL À SUIVRE (prochaine conversation)
1. **CGV** : faire valider par juriste → coller texte validé via Dashboard CGV/Légal + passer statut `validé`. Page `/cgv-nds.html`.
2. **Règles du jeu** : valider/figer le wording public (4/4 = 1 ticket, +1 si bonus ; brigade = 1 ticket sondage ; 1 participation/jour/station ; cumul festival). **Mécanique gelée — ne pas changer la logique**, seulement publier/clarifier le texte joueur.
3. **Kits digitaux par partenaire** (6 commerces) : compléter/valider A4, cartes QR, vidéo, READMEs. Index `https://flowin-events.vercel.app/nds/kit-digital/index.html`.
4. **Stations Brigade Verte « sondage seulement »** : tester un QR brigade réel (intro → sondage → 1 ticket). Options : 6ᵉ question, ajouter PMR, peaufiner `intro`.
5. **Stockage connexions + réponses même sans coordonnées** (pour traiter les résultats) :
   - ✅ VÉRIFIÉ : réponses sondage stockées sans coordonnée ni PII (`sondage_brigade`) dès la fin du sondage.
   - ⚠️ **GAP À TRAITER** : une connexion (scan QR) abandonnée *avant* la fin du sondage n'est PAS tracée ; réponses partielles non capturées. À implémenter si besoin : log scan/connexion indépendant + capture partielle (ex. table `connexions` ou insert au `mount` avec `session_id`).
   - Colonne `converti` (sondage→inscription) : présente, non alimentée → implémenter si besoin (`session_id` + policy UPDATE).
   - Lecture stats = `service_role` via MCP (anon ne peut PAS lire `sondage_brigade`).
6. **Passe stabilité des règles + sauvegarde** :
   - Vérifier mécanique inchangée (4/4=1, brigade=1) ; fonctions `add_points` / `attribuer_lot_auto` / `valider_parrainage` toujours `REVOKE`'d.
   - Sauvegarde : `config_backups` snapshot à jour ; **backup manuel juste avant le 9/07** ; activer **PITR** ; rendre **repo privé** (actions owner Romain).
   - Vérifier **domaine Resend** (bloqueur email : n'envoie qu'à flowinevent@gmail.com).

### D. RÈGLE PERMANENTE — logos partenaires (À CONSERVER)
- Insérer **systématiquement** les logos partenaires dans TOUS les supports visuels : **vidéo, forex, A4, présentation**. Raison : les partenaires se confirment dans les jours qui viennent → mettre à jour le mur de logos à **chaque nouveau partenaire signé**.
- Forex = version finale **AVEC** logos (bloc « Nos partenaires », grille « Votre logo ici »). Vidéo = mur 7 logos incl. Allianz Charvolin (régénérable via `render_partners_v2.py`).
- **Bloqueur Romain** : fournir PNG/SVG pour `admin/public/nds/partenaires/{bergerie,carrosserie-gp,pegase,utile}.png` (4 liens 404).
- Anti-cache images : incrémenter `?v=YYYYMMDDx` à chaque remplacement de PNG.
- Batch « 1 vidéo par partenaire » (commande permanente) : 1 vidéo/partenaire, QR `/parcours/nds2026?ev=ev-nds-<slug>&source=reseaux-<slug>` sur toutes les scènes, nommage `<Nom> video.mp4`, mur logos à jour.

### E. ANTI-CONFLIT / ANTI-PERTE (impératif)
- `git pull --ff-only` avant tout travail ; jamais `reset --hard` sans avoir committé.
- Committer **source + rendu ensemble**, même session (`/home/claude` éphémère).
- Ne pas toucher `QuizClient.tsx` / `SpinClient.tsx` (config via Supabase `cfg` uniquement).
- Next.js : `tsc --noEmit` + `next build`, puis `git checkout -- admin/tsconfig.tsbuildinfo` avant push.

---

# HANDOFF — Flowin / Nuits du Sud 2026

> Document de reprise. Dernière mise à jour : **23/06/2026** (session présentation/visuels/bon de commande). HEAD au moment du handoff : `b8dfcc6` (toujours revérifier via `git log` — ne pas supposer).
> Objectif : reprendre le projet dans une nouvelle session SANS dégradation ni perte des tâches accomplies.

> ⚠️ **SOURCE À JOUR = table Supabase `handoff_notes` clé `handoff-nds-2026-comm`** (maj 29/06). Ce .md racine n'est pas resynchronisé intégralement.
>
> **Session 29/06 (suite)** — HEAD `158248e`. Supports éditables PPTX livrés car les SVG ne sont pas éditables dans Canva :
> - **A4 éditables** (6 commerces) `e31705f` : `kit-digital/<slug>/nds_a4_<slug>-editable.pptx` (décor image + 10 zones de texte ; 'GRAND TIRAGE' exclu car brûlé dans le plate). Repro : `visuels-src/extract_a4_pptx.py` + `gen_pptx_a4.js`.
> - **Tickets tombola éditables** (7 lots) `158248e` : `visuels/tickets/nds_ticket_<lot>-editable.pptx` (lot/partenaire-valeur/n° série éditables). Repro : `visuels-src/gen_ticket_plate.py` + `gen_pptx_tickets.js`.
> - Pièges PPTX : `writeFile` async → `Promise.all` avant rezip (sinon fichiers tronqués 512Ko) ; recompresser via `pptx/scripts/rezip.py` ; installer Manrope en police système pour un QA fidèle.
> - Mail Lucie (Giordano) corrigé + liens. 3 points à trancher par Romain : 6×42=252 (pas 256), pack 2000€ HT ou TTC, articulation fiche/carte 500HT vs pack 2000.

## 0. SESSION 23/06/2026 — ÉTAT LE PLUS RÉCENT (à lire EN PREMIER)

> Prod toujours gelée (festival 9–18 juil). Tout passe par : édition fichier → Acorn/MD5 (dashboard) ou screenshot Chromium (pages) → commit auteur Romain → push `main` → Vercel auto-deploy. DB via Supabase MCP uniquement.

### 0.1 Ce qui a été fait cette session (tout poussé sur `main`)
- **Bon de commande** (`admin/public/bon-commande-nds.html`) : émetteur affiché **OPConsult** (BAITA en mention légale). Champ **Date éditable** (défaut = aujourd'hui) qui se reporte en direct dans l'en-tête « N° / Date » (fini le `__/__/2026`) ; la date saisie sert de `date_signature`. Champ « envoyer le bon signé à cette adresse ». Sur un bon signé (`?id=`) : boutons « Copier le lien » + « Envoyer par email au client » (mailto), pour transmettre **sans Resend**.
- **Version A4 papier** : `admin/public/bon-commande-nds-a4.html` (impression, à remplir main).
- **Présentation partenaire** (`admin/public/nds-partenaire-presentation.html`) — page commerciale clé qui répond à « **on achète quoi ?** » :
  - Section **« Concrètement, vous achetez quoi ? »** montrant les **VRAIS visuels** reçus : forex 70×70 (boutique) + carré/story (réseaux), images servies depuis `/nds/visuels/`.
  - Lot **Pass Nuits du Sud 2027** ajouté (en plus de places + bons d'achat).
  - **Carte slide-1 refaite** en plan clair OSM (cohérente avec la mini-carte placemap) : 3 stations **Les Caisses / Le Bar / L'Écran** en marqueurs ronds **mis en valeur**, commerce ambre en héros, joueur bleu.
  - **Écrans jeux = 2 stations** (1·2). Total « 12 stations » retiré (devenait faux). **⚠️ RESTE : vrai décompte par poste** (Caisses/Bars/Brigade) à confirmer par Romain pour réafficher un total exact.
- **Visuels** (`admin/public/nds/visuels/`, sources éditables dans `visuels-src/`) : forex/carré/story regénérés avec « Flashe. Joue. Gagne. », lots (places + Pass 2027 + bons d'achat dans ce commerce), QR réel.
  - **Forex** = version finale **AVEC 6 logos partenaires** (bloc « Nos partenaires », 2×3 « Votre logo ici ») — c'est l'état voulu par Romain (cf. journal §0.3).
  - **Anti-cache images** : les PNG sont versionnés `?v=YYYYMMDDx`. **Version courante = `?v=20260623c`** (dans `nds-visuels.html` + `nds-partenaire-presentation.html`). **À CHAQUE remplacement d'un PNG, INCRÉMENTER la lettre** sinon Romain revoit l'ancien (cause n°1 des « rien n'a changé »). Règle Vercel `Cache-Control:no-cache` sur `/nds/visuels/(.*)` déjà en place.
- **Dashboard** : les 2 landings NDS injectées affichent une icône **🎡** (avant : « ? ») ; la carte landing lit `ld.emoji` en priorité.

### 0.2 Visuels & pages — chemins exacts (aucun lien cassé)
- Présentation : `flowin-events.vercel.app/nds-partenaire-presentation.html`
- Offres / devenir partenaire : `/nds-partenaire.html` (rewrite `/nds`→jeu festivalier ; `/nds-partenaire`→offres)
- Bon de commande digital : `/bon-commande-nds.html` · A4 : `/bon-commande-nds-a4.html`
- Hub visuels : `/nds-visuels.html` · fichiers : `/nds/visuels/{carre_1080x1080,story_1080x1920,forex_700x700}.png` + `forex_700x700_print.pdf`
- CGV : `/cgv-nds.html`

### 0.3 JOURNAL DES CONFUSIONS (à garder — ne pas re-déclencher la boucle)
Trois points ont tourné en rond et fait perdre du temps. État figé ici pour ne pas recommencer :

1. **« Insérer la landing dans le dashboard ».** Les 2 landings NDS **SONT** déjà injectées dans le dashboard (Landing Pages → colonne **Actives** : « Présentation partenaire » + « Jeu festivalier ») — visible sur les captures de Romain. Injection idempotente dans `migrateData()` de `dashboard.html` (objets `lp-nds-presentation` / `lp-nds-entry`). Donc **l'insertion est faite**. Le « ? » d'icône (corrigé → 🎡) faisait croire à un bug. **Ambiguïté NON tranchée** : si Romain veut **ÉDITER le contenu** de la présentation DEPUIS le dashboard, ce n'est PAS possible en l'état — ces pages sont **codées à la main**, l'éditeur de landing ne sait modifier que les landings construites dans l'éditeur. → **NE PAS re-deviner. Demander à Romain le comportement exact attendu** (carte présente ? éditer le HTML depuis le dash ? autre ?) AVANT de toucher.
2. **Logos sur le forex.** Aller-retour : « enlève les logos » puis « il faut les logos ». **État final voulu = AVEC 6 logos partenaires** (bloc « Nos partenaires »). C'est la version en ligne. Ne pas re-supprimer sans instruction explicite.
3. **Carte de présentation.** Itérée plusieurs fois. État voulu = **plan clair cohérent avec stations mises en valeur** (fait). Si nouvelle demande « plus proche du réel » : demander une **capture de la carte réelle de l'app** à reproduire, ne pas redeviner.

### 0.4 BLOQUEUR EMAIL (Resend) — action Romain
Bon signé → trigger `trg_notify_bon_commande` → edge function `notify-bon-commande` (Resend). **Resend n'a AUCUN domaine vérifié** → l'expéditeur test `onboarding@resend.dev` ne peut livrer QU'À `flowinevent@gmail.com` (propriétaire du compte). Tout envoi vers un client/autre adresse = **403 bloqué**. **Action Romain** : vérifier un domaine (`flowin.events` ou `opconsult.co`) sur resend.com/domains (~10 min DNS), PUIS Claude met à jour `NOTIFY_FROM` dans l'edge function → envoi auto possible. **En attendant** : utiliser les boutons « Copier le lien » / « Envoyer au client » sur le bon signé (transmission manuelle).

### 0.5 COMPTES — rapatriement sur un compte maître (action Romain, À FROID APRÈS LE FESTIVAL)
Aujourd'hui le projet est éclaté sur **3 comptes/emails différents** → fragile :
- **GitHub** : org `flowinevent-ping` (repo `flowin-events-`).
- **Supabase** : projet `ywcqtupgoxfzkddqkztk` sous le compte **Google `romain.collin@gmail.com`**, org affichée « romain.collin@gmail.com's Org », **nom trompeur du projet = « flowin revision olivia »** (c'est BIEN le projet NDS : prospection + events ev-nds + migrations sécu). Pièges connus : le compte `flowinevent` ne contient qu'un projet Supabase **VIDE** (`atddutvzklcgiqxlpvla`) ; `3opconsult` → projet Nexto (`wmiawwaxwlvascyflpba`).
- **Vercel** : auto-deploy `main`, prod `flowin-events.vercel.app`.
→ **À faire par Romain, à froid après le 9 juillet** : choisir UN email maître et y rapatrier GitHub + Supabase + Vercel. **Procédure détaillée prête : `docs/rapatriement-compte-maitre.md`** (rapatriement prévu ~24/06 au soir selon arbitrage du risque). **NE PAS migrer pendant le festival** (risque de casser le jeu pour 24 000 joueurs). Free-tier Supabase = **pause auto après 7 j d'inactivité** → vérifier l'activité / passer Pro avant le festival.

### 0.6 CONTINUITÉ AUTO-PUSH d'une conversation à l'autre (vérifié 23/06)
Romain veut pouvoir, dans **toute nouvelle conversation**, demander une modif et qu'elle soit **commitée + pushée automatiquement** sans qu'il intervienne. Conditions réunies :
- Le **token GitHub** (fine-grained, Contents R/W, exp ~17/09/2026) est conservé dans la **mémoire du projet Claude** (PAS dans le repo : public + push protection). Donc une nouvelle conversation **du même projet** l'a déjà.
- Auth push vérifiée le 23/06 (`git ls-remote` authentifié OK, API GitHub 200, HEAD `b21bb52`).

**BOOTSTRAP À LANCER EN PREMIER dans chaque nouvelle conversation** (conteneur neuf à chaque fois → re-cloner) :
```
TOKEN=<token en mémoire projet>
git clone https://x-access-token:$TOKEN@github.com/flowinevent-ping/flowin-events-.git
cd flowin-events- && git log --oneline -3        # noter le HEAD réel
# … modifs …
git -c user.email=romain@flowin.events -c user.name="Romain Collin" commit -m "..."
git push origin main                              # remote déjà authentifié via l'URL de clone
```
Puis Vérif DB : Supabase MCP `execute_sql` → `select 1` sur `ywcqtupgoxfzkddqkztk`.
- Push rejeté (non-fast-forward) : `git fetch origin && git reset --hard origin/main`, réappliquer, repush.
- Clone/push **401** = token périmé → demander le courant à Romain UNE fois, MAJ mémoire + ce bloc.
→ Tant que le token est en mémoire projet, **l'auto-push continue tout seul** entre conversations. Si un jour le rapatriement (§0.5) change le repo/owner, mettre à jour ce bloc + la mémoire.

## 1. Projet
- Flowin = SaaS de gamification événementielle (marque OPConsult / société BAITA EURL, Vence 06140), opérateur unique : Romain Collin.
- Déploiement actif : **Nuits du Sud 2026** (festival 9–18 juillet 2026, Place du Grand Jardin, Vence).
- Coordonnées commerciales OFFICIELLES (ne jamais inventer/substituer) : info@opconsult.co · 06 16 35 49 36.

## 2. Stack & accès
- Repo GitHub : `flowinevent-ping/flowin-events-` (**public**) → Vercel auto-deploy depuis `main`, root `/admin`.
- Dashboard SA : monolithe vanilla JS `admin/public/dashboard.html` (~12 5xx lignes) + **miroir MD5-identique** `admin/public/static/dashboard.html`.
- Front joueur + pro : Next.js 14 App Router sous `admin/`.
- Supabase : project_id `ywcqtupgoxfzkddqkztk` (eu-west-1).
- Clé anon **publique par design** : `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`.
- Remote push : `https://x-access-token:<TOKEN_GITHUB>@github.com/flowinevent-ping/flowin-events-.git`
  - **<TOKEN_GITHUB>** = token fine-grained (Contents R/W, expire ~17 sep 2026). **JAMAIS en clair dans le repo** (public + GitHub Push Protection). Conservé dans la mémoire du projet Claude et chez Romain. Si push 401 → token périmé, demander le courant à Romain.
- Commits : auteur `Romain Collin <romain@flowin.events>`.

## 3. Bootstrap obligatoire à chaque session
1. `git clone` + `git log` + push fonctionnel (vérifier `git ls-remote`).
2. `execute_sql` trivial (`select 1`) via Supabase MCP.
→ Si l'un des deux manque : STOP, signaler, ne pas continuer en mode dégradé.

## 4. État au 22/06/2026 — TÂCHES ACCOMPLIES (ne pas refaire)
### Sécurité (appliqué en prod, sans risque)
- Vues `SECURITY DEFINER` → `security_invoker` (v_parrainage_commerce, v_nds_commerces_carte, v_bons_achat_nds).
- RLS activée sur `documents_legaux`.
- `search_path` verrouillé sur toutes les fonctions `public`.
- Anti-triche : `EXECUTE` révoqué (anon/authenticated) sur toutes les fonctions `SECURITY DEFINER` SAUF `crm_landing_flowin_upsert`, `search_ecoles`, `upsert_ecole`.
- Résultat scan : **0 ERROR** (était 4).
- Migrations appliquées : `harden_security_safe_step1`, `harden_revoke_secdef_functions`, `bons_commande_add_cgv_tracking`.

### CGV (complet — validé)
- En base : `documents_legaux` id=`cgv-nds-2026`, **statut `valide`, version `v1`** (longueur ~5872 car.). Le brouillon a été remplacé par le texte validé.
- **Greffe RCS confirmé (22/06)** : la mention « RCS de **Grasse**, SIREN 512 026 907 (SIRET 512 026 907 00018), TVA FR82512026907 » est **correcte**. BAITA SARL (nom commercial OP CONSULT), 40 rue des Arcs 06140 Vence, gérant Romain Collin, capital 5000 € ; Vence relève de l'arrondissement/Tribunal de commerce de Grasse (annonce de constitution parue dans *Le Cannois*, ressort de Grasse). Vérifié via societe.com / annuaire officiel.
- Colonnes ajoutées à `bons_commande` : `cgv_version`, `cgv_acceptee_at`.
- Page publique : `admin/public/cgv-nds.html` (charge les CGV depuis la base).
- Bon de commande `admin/public/bon-commande-nds.html` : case « j'accepte les CGV » + lien, **bloquante** avant signature ; enregistre version + date.
- Dashboard : section **SYSTÈME → CGV / Légal** (renderCgv/loadCgv/cgvSave) — édition contenu + version + statut, écriture directe en base.

### Mécanique de jeu (vérifiée, conforme, NE PAS changer)
- NDS2026Client.tsx : **4/4 = 1 ticket** + 1 ticket si question bonus faite ; max 2/station/jour ; cumul par station/jour pour le tirage manuel. Décision Romain confirmée.

### Prospection (table public.prospection)
- Nettoyée : doublons supprimés ; **28 fiches fictives** (seed « Type+Ville », ids ~1459–1487) marquées note=`SEED a verifier/remplacer...`.
- ~178 fiches sans tél : dont **129 réelles** (adresse présente) à compléter, + 28 seed.
- Compléter tél/email = via bouton **Scraping Maps** (collages Romain) → upsert qui complète les tél vides.
- Règles : jamais inventer ; champ non sourcé = NULL ; CP 06xxx ; etat défaut `a_contacter` ; id GENERATED ALWAYS (ne pas fournir).

### Doc préparée
- `docs/sql/securite-durcissement-post-festival.md` : plan complet de durcissement (à dérouler APRÈS le 9 juillet).

## 5. RESTE À FAIRE
### Dépend de Romain
- **CGV** : ✅ validée en base (statut `valide`, v1) — greffe RCS Grasse confirmé le 22/06. Plus d'action requise sauf modif de fond ultérieure.
- **Prospection** : Scraping Maps ville par ville → coller les sorties pour compléter tél/email.
- **Repo GitHub → privé** (Settings GitHub) : retire l'exposition publique du code + clé anon. PRIORITAIRE.
- **Supabase Auth** : activer « Leaked Password Protection » (2 clics console).

### Sécurité — accès dashboard (à décider)
- Le dashboard n'a **aucun login** : accessible par URL directe, s'ouvre en Super Admin. Aucun lien depuis le jeu/pro n'y mène, mais l'URL est devinable.
- Mesure rapide possible : mot de passe d'accès client-side (bloque les curieux, pas une sécurité absolue car clé anon dans le source).
- Vraie protection = séparer l'accès admin de la clé anon (étape 1 du plan post-festival).

### Post-festival (NE PAS toucher avant le 9 juillet — gel)
- Durcissement RLS avancé : séparer admin/joueurs (le dashboard fait INSERT/UPDATE/DELETE en anon → verrou), puis restreindre anon. Voir `docs/sql/securite-durcissement-post-festival.md`.
- Test de charge (connexions massives) : non fait.
- Skills / sous-agents Claude Code : après le 9 juillet.

## 5bis. Chantiers UI commande/partenaire (session 22/06 — EN GRANDE PARTIE FAITS le 23/06, voir §0)
> ⚠️ Plusieurs de ces points (bon de commande digital + A4, carte présentation, visuels) ont été RÉALISÉS le 23/06. **§0 fait foi.** Garder ci-dessous pour historique.
> Constats faits par lecture directe du code au HEAD `4d67750`. Prod gelée (festival) → chaque modif = BLOC validé (Acorn + miroir MD5 + screenshot Chromium) avant push.

1. **Fiche partenaire détail (logo / infos / docs) — accès.** Dans `dashboard.html`, `drawerPartner()` (≈ l.6218) ouvre via `openDrawerFor('partenaire',id)` avec onglets **Infos · Stats · Lots · Events · Contrat** — **pas d'onglet Documents**. Le mode édition gère logo (upload + URL + emoji fallback). À cadrer avec Romain : surface visée (drawer SA, page Pro commerçant `nds-pro.html`/`pro-nds-live.html`, ou page partenaire publique) + symptôme exact d'« inaccessible » (drawer ne s'ouvre pas ? vue lecture seule vide ? section docs absente ?). NB : `pro-nds-live.html` ne contient pas de loader de fiche docs (les `document.` repérés = DOM, pas des documents partenaire).
2. **Carte de présentation à la charte.** Mini-carte refaite au dernier commit (`4d67750`, plan de ville + place du Grand Jardin) dans la présentation partenaire. Tokens charte dispo en `:root` (--ink #1B3A5C, --blue #3B5CC4, --teal #00B4A0, --orange #E85D04, --amber, --violet ; thème sombre --d1/--d2/--d3/--dk). À cadrer : quelle charte cible (sombre nds2026 vs présentation claire) et quel écart visuel précis.
3. **Bandeau logo bord-à-bord.** À cadrer : quelle page + quel bandeau (hero présentation ? bandeau partenaires ? fiche ?).
4. **Bon de commande pré-rempli digital.** `admin/public/bon-commande-nds.html` (26 KB) existe ; à la soumission, statut='signe' → `fn_bon_commande_chain` (crée fiche partenaire/pro + facture + lead CRM). À cadrer : source du pré-remplissage (params URL depuis la landing/CRM ? fiche prospection ? lien nominatif par commerce ?).
5. **Bon de commande papier A4 (PDF).** À produire. À cadrer : génération client (print CSS A4 sur `bon-commande-nds.html`) ou PDF serveur ; coordonnées officielles à figer = info@opconsult.co / 06 16 35 49 36, BAITA SARL / OP CONSULT, RCS Grasse 512 026 907.


- Fichiers NO-TOUCH : `nds2026Design.ts`, `SpinClient.tsx`, `QuizClient.tsx` (modules maîtres ; config via `cfg` en base).
- Dashboard : validation **Acorn ES2020 = 0 erreur** + miroir `static/dashboard.html` **MD5-identique** avant tout push.
- Next.js : `tsc --noEmit` + `next build` (lire le log).
- Gros fichiers : édition par **Python `str.replace()` + assertions** (pas de sed multiligne).
- Push rejeté (non-fast-forward) : `git fetch origin && git reset --hard origin/main`, réappliquer, repush. Vérifier via `git ls-remote`.
- Supabase MCP : `execute_sql` ne renvoie que le résultat de la DERNIÈRE requête ; PostgREST cap 1000 lignes (paginer) ; découverte colonnes via `jsonb_object_keys(to_jsonb(row))`.
- Formulaires : sexe = Homme / Femme (+ vide), jamais « Autre ».
- Gel total de l'architecture pendant le festival (9–18 juillet).
- Communication Romain : français direct, voice-to-text (fautes à interpréter par contexte), ton factuel, pas d'anthropomorphisme.
