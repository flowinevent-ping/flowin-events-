# Passation — video-ecran-8-partenaires.mp4 (NDS 2026)

Dernière mise à jour : 01/07/2026. Édition de la vidéo écran (scène « L'Écran »)
par overlays/delogo ffmpeg sur le **master plat CapCut** de Romain (pas de re-render CapCut).

## État livré (VALIDÉ, commité)
- `admin/public/nds/kit-digital/nds/video-ecran-8-partenaires.mp4` (1080x1920, 40.54s, audio intact).
- QR → **ev-nds-ecrans** partout (8/8 pyzbar), URL `flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-ecrans`.
- Contenu :
  - petit logo NDS du bas **effacé** (delogo) sur GRAND JEU
  - logo NDS **ajouté au-dessus** de GRAND JEU / FLASH / JOUE / GAGNE (assets `nds_grandjeu.png`, `nds_mots.png`)
  - **« CE SOIR » retiré** (delogo)
  - texte à côté du QR = **« Flash » seul** (« le QR » retiré par delogo, pas d'ajout → pas de débordement)
  - sous-titre scène FLASH remplacé : « ce soir & dans les commerces ! » → **« Pendant le festival & dans les commerces partenaires »** (`subtitle.png`, 2 lignes, sous la carte)
  - mur partenaires **8 logos dont DEKRA** (clip `mur-logos-8-noqr.mp4`), wordmark **Flowin** en bas.

## Rebuild
```bash
# 1) Romain re-upload le master plat dans /mnt/user-data/uploads/ :
#    redpandacompress_bergerie-video-complete-TEST__2_.mp4
# 2) depuis le repo :
bash admin/public/nds/visuels-src/ecran-8-partenaires/build_ecran8.sh
# sortie -> /mnt/user-data/outputs/video-ecran-8-partenaires.mp4
```
Vérif : `ffprobe` durée=40.54 ; pyzbar 8/8 « ev-nds-ecrans » ; QC visuel bas de l'écran.

## Carte des scènes (timeline 0-based, coords 1080x1920)
| scène | t (s) | QR (cache card-only) | texte cuit traité |
|---|---|---|---|
| CE SOIR | 0–0.9 | — | delogo 388,498,312,86 |
| GRAND JEU | 0–8 | cover_s1 @382,1328 ; QR baked cx589 cy1535 | delogo « le QR » 812,1556,214,74 ; petit logo bas delogo 358,1048,384,112 |
| LE GRAND JEU DU FESTIVAL | 8.5–10.6 | cover_s2 @378,1388 ; cx579 cy1589 | delogo 800,1598,222,96 |
| FLASH / JOUE / GAGNE (mots) | 10.7–18.8 | cover_s3 @716,1685 (petit, cx797 cy1766) | delogo « le QR » 842,1746,200,62 ; logo NDS `nds_mots` @350,400 |
| FLASH AUX STATIONS + CUMULE | 17.9–28 | cover_s4b @343,1348 ; cx578 cy1583 | delogo 806,1603,190,74 |
| FLASH LE QR (grande carte) | 27.7–34.9 | cover_s5 @110,592 (card 861) ; cx540 cy1022 | sous-titre : delogo 130,1435,820,95 + `subtitle.png` @137,1462 |
| Mur partenaires (DEKRA) | 34.5–40.5 | cover_wall @250,1169 ; xfade offset 34.5 | clip `mur-logos-8-noqr.mp4` |

Gros titre doré « FLASH LE QR » : n'apparaît qu'à t≈27–27.5 (cx537 cy592). **Laissé tel quel** (non modifié).

## EN ATTENTE (décisions Romain)
1. **QR agrandi/centré** dans FLASH/JOUE/GAGNE : demandé puis mis en pause (« on verra plus tard »).
   - Assets prêts : `badge_flash_big.png` (QR 280 + « Flash », @287,1420, fenêtre 10.4–18.4) + `patch_dark.png` (cache sombre fondu du mini QR cuit, @687,1647, fenêtre 10.2–18.6, remplace le delogo 842,1746…).
   - ⚠️ Le delogo ne nettoie PAS un QR dense (bavure) → il FAUT le `patch_dark` pour masquer le mini QR d'origine.
   - ⚠️ Le dernier essai de cette variante a produit un flux h264 corrompu (scan tombé à 7/8). **Re-render propre + vérif 8/8 obligatoire** avant livraison.
2. **Titre doré « FLASH LE QR » → « FLASH » seul** : proposé, non tranché. Asset prêt : `title_flashqrcode.png` (« FLASH LE QR CODE » doré) — À NE PAS utiliser tel quel (contient « CODE », abandonné). Pour « FLASH » seul il faudra délogo le titre (250,556,580,74 @26.5–28.2, fond dégradé violet) + retexter centré.
3. **« code » dans le texte** : ABANDONNÉ (débordait à droite, dédoublait). Remplacé par « Flash » seul.

## Principe anti-recommencer (à répéter à Romain)
La vraie clé : Romain **réexporte un master SANS QR + textes déjà finaux** depuis CapCut →
`stamp_complete.py` pose QR/logos/DEKRA/Flowin en 1 passe propre, et changer un QR = 30 s.
Chaque retouche de texte cuit sur le master à plat est coûteuse et imparfaite.

## Limites connues de l'édition sur vidéo à plat
- delogo : OK sur fond lisse/sombre (logos, petites lignes de texte). **Bavure sur un QR dense** → couvrir par un cache opaque/fondu.
- Ajouter du texte à droite d'un texte cuit déjà collé au bord → déborde hors cadre. Retirer (delogo) est sûr ; ajouter ne l'est pas.
- Couvrir un QR par une carte blanche = OK.
