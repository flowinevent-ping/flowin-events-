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
| `build.mjs` | Assemble les pages HTML : polices Manrope en base64 et QR code de fin intégrés, sans ressource externe. |
| `render.mjs` | Planches, lecture des QR, puis export MP4 (Playwright à 30 i/s image par image, puis ffmpeg). |

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

Pour changer un chiffre, le lot ou un personnage, modifier `src/cast.js` : toutes les coupes restent cohérentes. Pour changer la cible d'un QR, modifier `VIDEOS` dans `build.mjs`.
