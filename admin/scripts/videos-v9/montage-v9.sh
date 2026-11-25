#!/bin/sh
# Assemble une video v9 : montage-v9.sh <film v9acom|...> <dossier_images> <voix.wav> <sortie.mp4>
set -e
ffmpeg -y -loglevel error -framerate 24 -i "$2/f%05d.jpg" -i "$3" -c:v libx264 -crf 19 -pix_fmt yuv420p -vf "scale=1080:1920:flags=lanczos" -c:a aac -b:a 128k -ar 48000 -ac 1 -movflags +faststart -shortest "$4"
