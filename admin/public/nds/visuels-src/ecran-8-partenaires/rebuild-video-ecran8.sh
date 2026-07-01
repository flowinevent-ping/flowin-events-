#!/usr/bin/env bash
# =====================================================================
# RECETTE DURABLE — rebuild de video-ecran-8-partenaires.mp4 EN 1 COMMANDE.
#
# Pour AJOUTER / RETIRER / CHANGER un logo partenaire :
#   1) editer la liste PARTNERS dans nds_lib.py (1 ligne)  -> la grille reflue seule
#      ET/OU remplacer le PNG   admin/public/nds/partenaires/<slug>.png
#   2) lancer :  bash admin/public/nds/visuels-src/ecran-8-partenaires/rebuild-video-ecran8.sh
#
# Ce script fait TOUT : mur des logos (NOQR) -> composition finale (master plat committe)
#   -> verif QR 8/8 + duree -> ecrit la video dans le kit.
# AUCUN fichier a re-uploader : le master plat est VERSIONNE dans le repo.
# =====================================================================
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRCDIR="$(cd "$HERE/.." && pwd)"                                   # visuels-src
REPO="$(cd "$SRCDIR/../../../.." && pwd)"                          # racine repo
VID="${VID:-/home/claude/vid}"

# --- chemins CANONIQUES (inscrits definitivement) ---
FLAT_MASTER="$SRCDIR/sources-video/bergerie-video-complete-TEST.mp4"   # master plat CapCut (versionne)
PARTENAIRES="$REPO/admin/public/nds/partenaires"                       # logos sources <slug>.png
WALL_OUT="$REPO/admin/public/nds/kit-digital/nds/clips/mur-logos-8-noqr.mp4"
VIDEO_OUT="$REPO/admin/public/nds/kit-digital/nds/video-ecran-8-partenaires.mp4"

echo "== 0. Prerequis (logos, QR, police, symlink) =="
mkdir -p "$VID/logos" "$VID/qr" "$VID/fonts" "$VID/partners_frames"
ln -sfn "$REPO" /home/claude/flowin-events-        # render_partners_v2.py pointe vers ce chemin
python3 - "$PARTENAIRES" "$VID" <<'PY'
import sys,os,shutil; sys.path.insert(0, os.path.join(sys.argv[1],'..','visuels-src'))
import nds_lib as L
part, vid = sys.argv[1], sys.argv[2]
for s in L.PARTNERS:
    src=f"{part}/{s}.png"
    if os.path.exists(src): shutil.copy(src, f"{vid}/logos/{s}.png")
print("  logos ->", ", ".join(L.PARTNERS))
PY
# QR requis a l'import de render_partners_v2 (meme en NOQR)
[ -f "$VID/qr/bergerie_reseaux_hd.png" ] || cp "$REPO/admin/public/nds/kit-digital/bergerie/qr-reseaux-bergerie.png" "$VID/qr/bergerie_reseaux_hd.png"
[ -f "$VID/fonts/Manrope.ttf" ] || curl -sL -o "$VID/fonts/Manrope.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf"

echo "== 1. Mur des logos (render_partners_v2, NOQR, 156 frames en 2 chunks) =="
cd "$SRCDIR"
rm -f "$VID/partners_frames"/*.jpg
NOQR=1 python3 render_partners_v2.py 0 80
NOQR=1 python3 render_partners_v2.py 80 156
ffmpeg -y -v error -framerate 24 -i "$VID/partners_frames/f%04d.jpg" \
  -c:v libx264 -crf 19 -preset veryfast -pix_fmt yuv420p "$WALL_OUT"
echo "  mur -> $WALL_OUT"

echo "== 2. Composition finale (master plat committe + mur) =="
SRC="$FLAT_MASTER" WALL="$WALL_OUT" OUT="$VIDEO_OUT" bash "$HERE/build_ecran8.sh"

echo "== 3. Verification =="
DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO_OUT")
echo "  duree = $DUR (attendu ~40.54)"
python3 - "$VIDEO_OUT" <<'PY'
import sys,subprocess,tempfile,os
from pyzbar.pyzbar import decode; from PIL import Image
v=sys.argv[1]; ok=0
for t in (3,9,12,18,22,28,33,38):
    p=tempfile.mktemp(suffix=".png")
    subprocess.run(["ffmpeg","-y","-v","error","-ss",str(t),"-i",v,"-frames:v","1",p],check=True)
    d=decode(Image.open(p)); os.remove(p)
    if d and "ev-nds-ecrans" in d[0].data.decode(): ok+=1
print(f"  QR ev-nds-ecrans : {ok}/8", "OK" if ok==8 else "!! A VERIFIER")
PY
echo "== OK : $VIDEO_OUT (commit + push ensuite) =="
