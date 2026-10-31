# Animations explicatives Flowin

Vidéos verticales 1080 × 1920 (30 i/s) pour TikTok, Instagram et Facebook, par public : participants, organisateurs, partenaires. **V3 : deux coupes par public**, avec le déroulé étape par étape, une publicité de 15 s (fin sans QR, « Lien en bio ») et une explication de 30 s (QR réel en fin). Toutes racontent la même histoire (la Fête du Lac à Belrive) vue de chaque côté. Les scénarios, le minutage, les légendes et l'audit sont dans [SCENARIOS.md](SCENARIOS.md).

## Contenu

| Fichier | Rôle |
|---|---|
| `<public>-15.html`, `<public>-30.html` (`participants`, `organisateurs`, `partenaires`) | Pages autonomes V2 : lecteur (lecture/pause, rejouer, barre de défilement, scènes cliquables). Ajouter `#record` à l'adresse pour n'afficher que la scène. |
| `participants.html`, `.mp4` (et organisateurs, partenaires) | V1 (35–37 s), conservée jusqu'à l'export V2 : les MP4 V2 seront produits après validation des planches et remplaceront ces fichiers. |
| `planches/<vidéo>.png` | Planches de relecture : image 0 (vignette), scènes clés et fin. `planches/rapport.json` donne la durée, le QR lu (coupes 30 s) et les avertissements : texte hors zone sûre, légende trop courte, texte réduit. |
| `src/engine.js` | Moteur commun : dessin SVG 540 × 960, personnages, décors, lecteur, `render(t)` déterministe et `window.ANIM = { duration, seek(t), ready }`. |
| `src/cast.js` | L'histoire commune (chiffres, lot, ticket, personnages) et les écrans de l'application redessinés. |
| `src/decor.js` | Scènes illustrées partagées (la fête, la boutique, le bureau, l'écran de fin). |
| `src/scenarios/*-15.js`, `*-30.js` | Le découpage de chaque coupe : accroche, scènes, durées, légendes, fin. V1 dans `src/scenarios/v1/` (référence, non construite ; anciens prénoms). |
| `participants-h.html`, `.mp4` | **Style H** (« typo + vrais écrans », 38,5 s, guide du joueur en 4 étapes) : page storyboard (lecteur + scènes horodatées cliquables). Sources `src/h/engine-h.js` et `src/h/participants-h.js`, assemblées par `build-h.mjs`. |
| `participants-commerces-h.*`, `participants-festival-h.*` | **Style H pastel** : vidéo A « Flowin chez tes commerçants » (45 s) et vidéo B « Flowin à ton festival » (33 s), pages storyboard. Briques communes `src/h/kit-h.js`. |
| `build.mjs` | Assemble les pages HTML : polices Manrope en base64 et QR code de fin intégrés, sans ressource externe. |
| `render.mjs` | Planches, lecture des QR, puis export MP4 (Playwright à 30 i/s image par image, puis ffmpeg). |

## v3 — neuf films validés (style H pastel)

Neuf vidéos tirées des scénarios validés par le client (à ne pas confondre avec l'ancienne « V3 » des six coupes 15 s / 30 s) : s1 participants festival, s2 participants commerces, s3 commerce animation (« la semaine de Claire »), s4 commerce super event, s5 associations, s6 festivals, s7 sponsors, s8 gagnant, s9 tuto pro. MP4 **muets** : voix off et musique livrées à part dans `voix-off/`. Détail, écrans vérifiés et écarts : [SCENARIOS.md](SCENARIOS.md#v3--neuf-films-validés-par-le-client-style-h-pastel-20-à-44-s).

| Fichier | Rôle |
|---|---|
| `s1-v3.html` … `s9-v3.html` | Pages storyboard autonomes : lecteur 9:16 (Lecture, Rejouer, barre, temps) et scènes horodatées cliquables (titre, description, texte écran, voix off, écart éventuel). `#record` = scène seule. |
| `s1-v3.mp4` … `s9-v3.mp4` | 1080 × 1920, 30 i/s, H.264 crf 18, sans son. |
| `planches/s<n>-v3.png` | Planches de relecture (image 0, scènes clés, fin) ; `planches/rapport.json` : durée, QR lu, avertissements. |
| `voix-off/<id>.srt`, `.txt`, `README.md` | Voix off horodatée (une réplique par scène), script lisible avec direction de voix et note musique ; README : direction de voix commune et musique de chaque film. |
| `src/h/films-v3.js` | Scénarios validés (source de vérité des textes et du minutage). |
| `src/h/ecarts-v3.js` | Écarts volontaires (véracité), repris dans les pages et la voix off. |
| `src/h/kit-v3.js`, `src/h/v3-<id>.js` | Briques v3 (macaron Plug & Play, écrans pro, billet, retrait, tirage, CRM, création…) et dessin de chaque film. |
| `assets/` | Affiches réelles du kit digital NDS (QR de station remplacé par le QR démo). |

Régénérer : `npm run build:v3` (pages + voix off), puis `npm run render:v3` (planches, contrôle des QR, MP4) ou `node render.mjs s3-v3` pour un seul film ; `node render.mjs --planches --toutes s3-v3` pour la planche de toutes les scènes.

## Régénérer

Prérequis : Node 18+, ffmpeg, Playwright avec Chromium.

```bash
cd marketing/animations
npm install
npm run all
```

`npm run all` lance `build.mjs`, puis `render.mjs`, qui produit les planches et exporte les six MP4.

Autres commandes :
- `npm run build` : pages HTML seules.
- `npm run planches` : planches et contrôle des QR, sans export. Ajouter `--toutes` (`node render.mjs --planches --toutes`) pour une planche de toutes les scènes.
- `node render.mjs participants-15` : une seule coupe.
- Style H : `npm run build:h` puis `node render.mjs participants-commerces-h participants-festival-h` (planches, QR, MP4).

Pour changer un chiffre, le lot ou un personnage, modifier `src/cast.js` : toutes les coupes restent cohérentes. Pour changer la cible d'un QR, modifier `VIDEOS` dans `build.mjs`.
