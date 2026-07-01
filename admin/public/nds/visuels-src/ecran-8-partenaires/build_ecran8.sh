#!/usr/bin/env bash
# =====================================================================
# Rendu de video-ecran-8-partenaires.mp4  (VERSION VALIDEE 01/07/2026)
# Edition sur video a plat (CapCut) par overlays/delogo ffmpeg, 1 passe.
# Etat = "Flash" seul (le QR retire) + nouveau sous-titre + petit logo NDS efface.
#
# PRE-REQUIS :
#   - SRC = master plat CapCut de Romain :
#       redpandacompress_bergerie-video-complete-TEST__2_.mp4
#       (1080x1920, 30fps, 40.53s, audio aac). A RE-UPLOADER dans
#       /mnt/user-data/uploads/ (fichier ephemere, pas dans le repo).
#   - wall8 = mur logos 8 (DEKRA) SANS QR, deja dans le repo :
#       admin/public/nds/kit-digital/nds/clips/mur-logos-8-noqr.mp4
#   - assets/ = PNG d'overlay (dans ce meme dossier, versionnes)
#
# ffmpeg 6.x. TOUJOURS -preset veryfast (medium depasse le timeout bash 145s).
# Audio bit-perfect : -map 0:a -c:a copy.
# QR cible partout : ev-nds-ecrans -> flash-events.vercel.app/parcours/nds2026?ev=ev-nds-ecrans
# Verif : pyzbar doit lire 8/8 "ev-nds-ecrans" ; duree = 40.54.
# =====================================================================
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
A="$HERE/assets"
SRC="${SRC:-/mnt/user-data/uploads/redpandacompress_bergerie-video-complete-TEST__2_.mp4}"
WALL="${WALL:-$HERE/../../kit-digital/nds/clips/mur-logos-8-noqr.mp4}"
OUT="${OUT:-/mnt/user-data/outputs/video-ecran-8-partenaires.mp4}"

timeout 145 ffmpeg -y -v error \
 -i "$SRC" -i "$WALL" \
 -i "$A/cover_s1.png" -i "$A/cover_s2.png" -i "$A/cover_s3.png" -i "$A/cover_s4b.png" -i "$A/cover_s5.png" \
 -i "$A/flowin_s.png" -i "$A/cover_wall.png" -i "$A/flowin_s.png" \
 -i "$A/nds_grandjeu.png" -i "$A/nds_mots.png" -i "$A/nds_mots.png" -i "$A/nds_mots.png" -i "$A/subtitle.png" \
 -filter_complex "\
[0:v]trim=0:34.9,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1,\
delogo=x=388:y=498:w=312:h=86:enable='between(t,0,0.9)',\
delogo=x=358:y=1048:w=384:h=112:enable='between(t,0,8.2)',\
delogo=x=812:y=1556:w=214:h=74:enable='between(t,0.7,7.9)',\
delogo=x=800:y=1598:w=222:h=96:enable='between(t,8.6,10.6)',\
delogo=x=806:y=1603:w=190:h=74:enable='between(t,17.9,28.0)',\
delogo=x=842:y=1746:w=200:h=62:enable='between(t,10.4,18.4)',\
delogo=x=130:y=1435:w=820:h=95:enable='between(t,27.7,34.9)'[b0];\
[b0][2:v]overlay=382:1328:enable='between(t,0.7,7.9)'[b1];\
[b1][3:v]overlay=378:1388:enable='between(t,8.6,10.6)'[b2];\
[b2][4:v]overlay=716:1685:enable='between(t,10.4,18.4)'[b3];\
[b3][5:v]overlay=343:1348:enable='between(t,17.9,28.0)'[b4];\
[b4][6:v]overlay=110:592:enable='between(t,27.7,34.9)'[b5];\
[b5][14:v]overlay=137:1462:enable='between(t,27.7,34.9)'[sub];\
[sub][10:v]overlay=305:420:enable='between(t,0,8.0)'[n1];\
[n1][11:v]overlay=350:400:enable='between(t,10.7,12.7)'[n2];\
[n2][12:v]overlay=350:400:enable='between(t,12.8,15.0)'[n3];\
[n3][13:v]overlay=350:400:enable='between(t,15.2,18.8)'[n4];\
[n4][7:v]overlay=425:1797[h];\
[1:v]trim=0:6.04,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1,noise=alls=9:allf=t,fade=t=out:st=5.6:d=0.44[w0];\
[w0][8:v]overlay=250:1169:enable='between(t,0.3,5.7)'[w1];\
[w1][9:v]overlay=425:1797[m];\
[h][m]xfade=transition=fade:duration=0.4:offset=34.5[outv]" \
 -map "[outv]" -map 0:a -c:a copy \
 -c:v libx264 -crf 19 -preset veryfast -pix_fmt yuv420p -movflags +faststart \
 "$OUT"
echo "OK -> $OUT"
