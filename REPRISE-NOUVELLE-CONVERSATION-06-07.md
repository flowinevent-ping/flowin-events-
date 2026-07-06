# 🔁 REPRISE — NOUVELLE CONVERSATION (06/07/2026, soir)

> But : reprendre en AUTO dans une conversation où l'aperçu image marche, et FINIR sans se retromper de vidéo.
> Contexte : festival NDS 2026 ouvre le 9 juillet. On n'a plus de temps.

## 0) BOOTSTRAP (à faire en premier, sans demander)
1. **Repo** : `flowinevent-ping/flowin-events-` (public), branche `main`, root Vercel `/admin`.
   - Clone : `git clone https://github.com/flowinevent-ping/flowin-events-.git`
   - **Token GitHub (push)** : PAS dans la mémoire littérale. Le récupérer via `conversation_search` dans les chats du PROJET (conversations bootstrap 24-27/06) — motif `github_pat`. Il est valide (exp ~17/09/2026), push:True vérifié. Ne jamais le stocker en clair (repo public/Notion/base).
   - Push : `git push https://x-access-token:<PAT>@github.com/flowinevent-ping/flowin-events-.git HEAD:main`. Identité `git -c user.email=romain@flowin.events -c user.name="Romain Collin"`.
2. **Supabase MCP** : projet `ywcqtupgoxfzkddqkztk` (NE PAS confondre avec le projet vide `atddutvzklcgiqxlpvla`). `select 1` d'abord.
3. **Handoff** : lire `handoff_notes` clé `handoff-nds-2026-comm` (Supabase) + hub Notion `38c6dcca-9add-81dd-9af2-c93139e06393`.
4. Si aperçu image OK : régénérer une frame et la voir pour confirmer.

## 1) LA VIDÉO RÉSEAU — CE QUI A FAIT PERDRE DU TEMPS (à ne PAS refaire)
- La vidéo réseau de référence de Romain est un **MONTAGE CAPCUT AVEC LE SON** — AUCUN script Python ne la reproduit. NE PAS re-rendre depuis render_spot40/kref40/etc : ça donne un autre montage (« GRAND JEU » sur scène) que Romain rejette.
- Réf CapCut (montage + SON) persistée : `admin/public/nds/kit-digital/nds/refs-romain/LANCEMENT_capcut_montage-son_REF.mp4` (512×768, 40,5s, AUDIO inclus, md5 e01af165).
  - Son montage (OCR) : Flowin → **FLASH.** → **CUMULE TES POINTS / REMPORTE** → **JOUE CHEZ NOS PARTENAIRES** (mur) + « pendant toute la durée du festival ».
  - **PROBLÈME de ce fichier** : (a) son **mur partenaires est PÉRIMÉ** (mauvais partenaires, VIP/DEKRA au lieu de Nook) ; (b) son **QR = ev-nds-ecrans** (celui de l'écran) et apparaît dans PLUSIEURS scènes à des positions différentes (t≈1,9,18s).
- **CE QUE ROMAIN VEUT** : garder le **montage + son** de sa vidéo CapCut, MAIS :
  1. **Remplacer le mur** par **le mur des 7 de l'écran** (Bergerie, Auto-École de l'ARA, Utile, Giordano, Charvolin, Nook, **Carrosserie GP à la place de Nook** = ordre `bergerie,pegase,utile,nook,giordano,charvolin,carrosserie-gp`). Mur écran correct persisté : `refs-romain/MUR-ECRAN-CORRECT_7_GP-nook.png`.
  2. **Remplacer le QR par le QR RÉSEAUX de chaque partenaire** (`ev=ev-nds-<slug>&source=reseaux-<slug>`), 1 vidéo par partenaire (7).
- **MÉTHODE recommandée** (à valider avec aperçu qui marche) :
  - Option A (la + propre) : Romain ré-exporte de CapCut un master AVEC SON et AVEC le mur des 7 → puis `stamp_pro.py` appose le QR réseaux par pro (garde l'audio `-c:a copy`, auto-vérifie au scan). 7 passes rapides.
  - Option B (si on reste sur son fichier actuel) : overlay ffmpeg pour COUVRIR l'ancien mur (sur la fenêtre du mur) par le mur des 7, + overlay QR réseaux sur CHAQUE fenêtre où le QR apparaît. Fenêtres/positions à mapper précisément (le QR n'est pas persistant). Vérifier visuellement (aperçu) avant de déployer.
  - Faire un **TEST 1 partenaire (bergerie)** d'abord, le faire valider par Romain, PUIS les 6 autres.
- **Déployer** : remplacer `admin/public/nds/kit-digital/<slug>/video-<slug>-9x16.mp4`, bump cache-buster (`var VER` dans dashboard.html, actuellement 20260708 → +1), miroir `static/dashboard.html` MD5-identique, push. Liens TÉLÉCHARGEABLES (pas juste visionnables).

## 2) SOURCE UNIQUE PARTENAIRES (verrouillée)
`admin/public/nds/visuels-src/nds_lib.py` → `PARTNERS = [bergerie, pegase, utile, nook, giordano, charvolin, carrosserie-gp]` (7, GP↔Nook). Tous les générateurs lisent cette liste. cycles963 SUSPENDU (retiré partout : event archivé, fiche actif/visible=false, docs+fichiers supprimés).

## 3) DÉJÀ FAIT + DÉPLOYÉ (ne pas régresser)
- **Vidéo écran** : `video-ecran-8-partenaires.mp4` = version animée 30s (render_ecran_anim.py) OU montage fondu — QR `ev-nds-ecrans`, mur 7 GP↔Nook. Corrections Romain intégrées : À GAGNER sans « tickets tombola » (2 pastilles agrandies) ; OÙ JOUER → « Rendez-vous aux stations de jeux » + « Aux écrans scène » + « Chez les partenaires participants ». (À reconfirmer visuellement si Romain veut l'animée vs fondue.)
- **Affiches** : 7 A4 partenaires + 7 stations (caisses/bars/brigade) → QR vérifiés OK (station → ev-nds-<slug> ; brigade → tablette-1/2).
- **Events** : dates posées 2026-07-09 → 2026-07-18 (fini le « 1 JANV »). cycles963 event archivé.
- Masters vidéo écran sans-QR sauvés dans `nds/masters/`.

## 4) MOT « STATION » (validé par Romain)
- **Affiches** : « Station de jeu » (singulier).
- **Vidéos + textes Insta/FB** : « stations de jeux » (pluriel).
- Appliquer PARTOUT (pas encore fait sur affiches/forex/textes).

## 5) RESTE À FAIRE (checklist Romain « n'oublie rien », POUSSER PARTOUT, TÉLÉCHARGEABLE)
1. **Vidéos réseau** (7) : cf. §1 — montage CapCut + mur écran des 7 + QR réseaux par pro. TEST bergerie d'abord.
2. **Forex** : garder 70×70 + AJOUTER **32×45 cm** (même contenu), éditable PPTX + PNG/PDF, par station.
3. **Affiches partenaires** : garder A4 + AJOUTER **A3 (297×420 mm)** — « imprimeur du coin » — éditables PPTX bloc-par-bloc + PDF. NE PAS recréer l'A4.
4. **Rubrique MASTERS** (dashboard + page kit-digital Vercel) : visionner les 4 masters SANS QR (écran, réseau, forex, affiche) — référence anti-régression pour que Romain pointe l'origine.
5. **Dashboard — complétude par partenaire** : Romain signale qu'il ne voit QUE l'A4 ; il faut que CHAQUE kit montre vidéo réseau (téléchargeable) · **texte Insta/FB** (`reseaux-texte.md`) · A4 · A3 · QR station/réseaux.
6. **SYNC PARTOUT** : dashboard, kit-digital index.html, hub Notion, cockpit `gestion-diffusion.html`, kit-controle — liens téléchargeables, mot station singulier/pluriel.

## 6) OUTILS/ENV DE RENDU (déjà éprouvés cette session)
- Police Manrope variable → `/home/claude/vid/fonts/Manrope.ttf` et `/home/claude/work/fonts/Manrope-ExtraBold.ttf` (download raw.githubusercontent google/fonts `Manrope[wght].ttf`).
- Symlinks attendus par les scripts : `ln -sfn <repo> /home/claude/repo` et `ln -sfn <repo> /home/claude/flowin-events-`.
- Logos : `/home/claude/vid/logos/<slug>.png` (copie de `admin/public/nds/partenaires/`).
- QR à générer pour l'import de certains scripts : `/home/claude/vid/qr/ecrans_hd.png`.
- `stamp_pro.py <master.mp4> <slug> <out.mp4> --mode reseaux` : appose le QR réseaux + auto-vérifie au scan + garde l'audio.
- pyzbar (pas cv2) pour vérifier les QR. tesseract pour OCR (logos peu fiables).
- Valider dashboard : Acorn ES2020 (installer `npm i acorn`), extraire inner `<script>` correctement (le validate.sh du repo a un bug de regex qui skippe tout).

## 7) 3 PILIERS (obligatoire à chaque tâche)
GitHub (commit+push) + Supabase `handoff_notes` (prepend, dollar-quote `$hf$...$hf$`, puis `maj=now()`) + Notion hub `38c6dcca-9add-81dd-9af2-c93139e06393` (insert_content position start). Notion souvent oublié → checklist.
