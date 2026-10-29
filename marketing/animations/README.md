# Animations explicatives Flowin

Trois vidéos verticales 1080 × 1920 (30 i/s), une par public : participants, organisateurs, partenaires. Elles racontent la même histoire (la Fête du Lac à Belrive) vue de chaque côté. Les scénarios, le minutage, les légendes et l'audit sont dans [SCENARIOS.md](SCENARIOS.md).

## Contenu

| Fichier | Rôle |
|---|---|
| `participants.html`, `organisateurs.html`, `partenaires.html` | Pages autonomes : lecteur (lecture/pause, rejouer, barre de défilement, scènes cliquables). Ajouter `#record` à l'adresse pour n'afficher que la scène. |
| `participants.mp4`, `organisateurs.mp4`, `partenaires.mp4` | Vidéos exportées (H.264, CRF 18). |
| `planches/<vidéo>.png` | Planches de relecture : 8 images clés par vidéo. `planches/rapport.json` donne la durée, le contenu lu dans chaque QR et les éventuels textes réduits. |
| `src/engine.js` | Moteur commun : dessin SVG 540 × 960, personnages, décors, lecteur, `render(t)` déterministe et `window.ANIM = { duration, seek(t), ready }`. |
| `src/cast.js` | L'histoire commune (chiffres, lot, ticket, personnages) et les écrans de l'application redessinés. |
| `src/decor.js` | Scènes illustrées partagées (la fête, la boutique, le bureau, l'écran de fin). |
| `src/scenarios/*.js` | Le découpage de chaque vidéo : scènes, durées, légendes. |
| `build.mjs` | Assemble les pages HTML : polices Manrope en base64 et QR code de fin intégrés, sans ressource externe. |
| `render.mjs` | Planches, lecture des QR, puis export MP4 (Playwright à 30 i/s image par image, puis ffmpeg). |

## Régénérer

Prérequis : Node 18+, ffmpeg, Playwright avec Chromium.

```bash
cd marketing/animations
npm install
npm run all
```

`npm run all` lance `build.mjs`, puis `render.mjs`, qui produit les planches et exporte les trois MP4.

Autres commandes :
- `npm run build` : pages HTML seules.
- `npm run planches` : planches et contrôle des QR, sans export. Ajouter `--toutes` (`node render.mjs --planches --toutes`) pour une planche de toutes les scènes.
- `node render.mjs participants` : une seule vidéo.

Pour changer un chiffre, le lot ou un personnage, modifier `src/cast.js` : les trois vidéos restent cohérentes. Pour changer la cible d'un QR, modifier `VIDEOS` dans `build.mjs`.
