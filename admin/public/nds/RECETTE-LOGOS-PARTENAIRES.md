# RECETTE — Ajouter / retirer / changer un logo partenaire (NDS 2026)

> But : ne plus JAMAIS reperdre le master ni la methode. Tout est versionne dans le repo.
> Une modif de logo = remplacer 1 fichier + lancer 1 (ou 2) commande(s). Plus de re-upload.

---

## 1. SOURCE UNIQUE (le seul endroit a editer)

- **Liste des partenaires** : `admin/public/nds/visuels-src/nds_lib.py` -> variable `PARTNERS` (1 ligne).
  Ajouter/retirer un slug ici suffit : toutes les grilles refluent seules.
- **Logo de chaque partenaire** :
  - raster : `admin/public/nds/partenaires/<slug>.png`  (PNG transparent HD)
  - vectoriel source : `admin/public/nds/partenaires/src/<slug>.svg`

Pour CHANGER un logo : remplacer `partenaires/<slug>.png` (et le `.svg` source).
Pour AJOUTER : deposer `partenaires/<slug>.png` + ajouter `<slug>` dans `PARTNERS`.
Pour RETIRER : enlever `<slug>` de `PARTNERS`.

---

## 2. MASTER VIDEO (versionne, ne plus jamais re-uploader)

- **Master plat CapCut** (source du rebuild video) :
  `admin/public/nds/visuels-src/sources-video/bergerie-video-complete-TEST.mp4`
  (1080x1920, ~40.54s, audio) — c'est LUI que build_ecran8 delogo/overlay.
- **Sources d'edition** (overlays, coords, delogos) :
  `admin/public/nds/visuels-src/ecran-8-partenaires/` (assets/, build_ecran8.sh, HANDOFF.md)

---

## 3. REBUILD PAR SUPPORT (apres avoir touche un logo)

### VIDEO — `video-ecran-8-partenaires.mp4`  (1 commande)
```bash
bash admin/public/nds/visuels-src/ecran-8-partenaires/rebuild-video-ecran8.sh
```
Fait tout : mur des logos (render_partners_v2, NOQR) -> composition finale (master plat committe)
-> verif QR 8/8 + duree -> ecrit `admin/public/nds/kit-digital/nds/video-ecran-8-partenaires.mp4`.
Puis `git add … && commit && push`.

### DOCUMENTS — affiches A4 + tickets + kit montage
```bash
cd admin/public/nds/visuels-src
python3 gen_a4_clean.py        # affiches A4 (PNG) -> /home/claude/vid/a4/nds_a4_<slug>.png
python3 gen_tickets.py         # tickets (PDF)     -> /home/claude/vid/tickets/nds_tickets_<slug>.pdf
```
Prerequis polices : `Manrope.ttf` + `Anton.ttf` dans `/home/claude/vid/fonts/`,
QR HD par partenaire dans `/home/claude/vid/qr/<slug>_hd.png` (copies depuis kit-digital/<slug>/qr-station-<slug>.png).
Puis copier les sorties `<slug>` vers :
- `admin/public/nds/kit-digital/<slug>/nds_a4_<slug>.png` (+ `.pdf`)
- `admin/public/nds/visuels/nds_a4_<slug>.png`
- `admin/public/nds/visuels/tickets/nds_tickets_<slug>.pdf`
Kit montage-ecran (zip) : voir la partie 3 de `rebuild_partenaires.sh`.

### APPLICATION / DASHBOARD / FRONT
Aucune regeneration : le dashboard, la carte partenaires et le montage lisent
directement `admin/public/nds/partenaires/<slug>.png`. Remplacer le PNG suffit
(push -> Vercel redeploie -> Cmd+Shift+R).

---

## 4. VERIFICATIONS
- Video : duree ~= 40.54 s ; `pyzbar` doit lire **8/8** `ev-nds-ecrans`.
- QR cible partout : `https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-ecrans`.
- Regarder la scene mur (t~=38 s) : les 8 logos a jour + Flowin en bas.

---

## 5. RESUME "en 10 secondes"
1. remplace `partenaires/<slug>.png` (+ edite `PARTNERS` si ajout/retrait)
2. `bash …/ecran-8-partenaires/rebuild-video-ecran8.sh`   (video)
3. `python3 gen_a4_clean.py && python3 gen_tickets.py`      (documents)
4. `git add -A && git commit && git push`                   (dashboard/app auto via Vercel)
