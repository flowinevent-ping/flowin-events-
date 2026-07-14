# Vidéo écran NDS 2026 — v2 (4 slides)

- `ecran-nds-4slides-SOURCE.pptx` — **la source éditable**, bloc par bloc (4 slides 9:16).
  C'est le master : toute modification se fait ici, puis on réexporte le MP4.
- `video-ecran-4slides-27s.mp4` — export final. 1080×1920, muet, 27 s (4 × ~7 s, fondus 0,4 s).

Contenu : Flash·Joue·Gagne → À gagner → Où jouer → Mur partenaires (7, ARA incluse).
QR : `https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-ecrans` (vérifié pyzbar sur les 4 slides).

## Réexporter le MP4 depuis le PPTX
```
soffice --headless --convert-to pdf ecran-nds-4slides-SOURCE.pptx
pdftoppm -jpeg -r 96 ecran-nds-4slides-SOURCE.pdf s
ffmpeg -y -loop 1 -t 7.05 -i s-1.jpg -loop 1 -t 7.05 -i s-2.jpg \
       -loop 1 -t 7.05 -i s-3.jpg -loop 1 -t 7.05 -i s-4.jpg \
  -filter_complex "[0:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[v0];[1:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[v1];[2:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[v2];[3:v]fps=30,scale=1080:1920,setsar=1,format=yuv420p[v3];[v0][v1]xfade=transition=fade:duration=0.4:offset=6.65[a];[a][v2]xfade=transition=fade:duration=0.4:offset=13.3[b];[b][v3]xfade=transition=fade:duration=0.4:offset=19.95[v]" \
  -map "[v]" -r 30 -c:v libx264 -crf 19 -pix_fmt yuv420p -an video-ecran-4slides-27s.mp4
```
Police requise : Manrope (sinon LibreOffice substitue et décale les textes).
