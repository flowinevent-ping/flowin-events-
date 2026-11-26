# Rubrique Contenu et argumentaire
Entrée : « Flowin Event · Contenu ». Agent : `creation-materiel`.

## Ce qui est propre
Plaquettes (Animation, Super Event), vidéos et animations, voix off, visuels de prospection, textes. Index de tous les visuels : `kit/MAQUETTES.md`.

## Règles
Tout texte reprend `docs/ARGUMENTAIRE-flowin-event.md` sans paraphrase. Chiffres exacts de Nuits du Sud : cités seulement en justificatif. Jamais « signer », « financent », « fichier dormant ». Pas de « tester le jeu » proposé aux commerçants dans les plaquettes. Pas de voix off sans demande de Romain.

## Argent
Les prix cités viennent de `paiement.md`. Aucune copie ici.

## Code
`admin/public/plaquette-*.html`, `admin/public/animations/`, `admin/public/videos/`, `admin/public/storyboards-video/`, `admin/public/validation/`, `admin/lib/outilsCommerciaux.ts`. Scripts et scénarios : `docs/SCRIPT-*.md`, `docs/SCENARIOS-videos-*.md`.

## Où ça vit
| Rôle | Profils |
|---|---|
| Jouent | Super Admin (catalogue d'outils, envoi groupé) |
| Règlent | Super Admin |
| Fournissent | cette rubrique |
| Consomment | Pro, Organisateur, Participant (QR de fin de vidéo) |
Lire aussi : `prospection.md` pour tout envoi.

## À faire et notes
**État au 26/11/2026 (fin du bloc 1 vidéos)**
- Vidéos v10 en ligne (brouillon au catalogue) : `/videos/v10/{a-com,a-part,se-part,se-org}.mp4`. Script `docs/SCRIPT-v10-2026-11-26.md`, évaluation `docs/EVALUATION-videos-v10-2026-11-26.md` (7 à 7,5 sur 10, estimation sans écoute). Sources : `admin/scripts/videos-v9/` (`scripts10.json`, `voix.py`, `build-films-v10.py`, `rendu-v9.mjs`, `montage-v9.sh`, `timing10/`).
- **Référence qualité : la vidéo organisateurs** (Romain : la meilleure, images, texte, cohérence). Les trois autres doivent l'égaler : fil annoncé en trois ou quatre temps, une image dessinée par phrase, texte centré sur le gain du client.
- **En attente de Romain** : correction des 4 textes dans le document « Textes des vidéos à corriger (26/11) » (lien dans la conversation), choix de l'échantillon de voix (`/videos/v10/echantillons/`, intonation ×1,0 / ×1,25 / ×1,5 ; accent « espagnol » signalé sur la v10 commerces, suspect : ×1,5), phrase « aimée » à redonner.
- Vidéo commerces « version accroche » (essai, 38 s) : `/videos/v10/a-acc.mp4`, texte dans le document de correction (vidéo 5), `scripts11.json`, débit de voix +0 % (plus dynamique). Points à confirmer par Romain listés dans le document.
- **Bloc 2 : à faire dans l'ordre** : (1) lire les corrections de Romain dans le document ; (2) mettre à jour `scripts10.json` et `build-films-v10.py` ; (3) dessiner les scènes manquantes (commerces : choix du jeu avec gain immédiat ou tirage au sort, « mieux les connaître » sans graphique commerçant, image de marque ; participants : scan et jeu entre amis, gain immédiat contre tirage animé, quiz sans question du commerçant, trait lumineux de la carte jusqu'au QR) ; (4) refaire voix (`SCRIPTS=scripts10.json voix.py`, `K_INTO` et `PITCH` selon l'échantillon choisi) puis rendu (`CHROMIUM=/opt/pw-browsers/chromium node rendu-v9.mjs`) puis `montage-v9.sh` ; (5) catalogue, `tsc`, `build`, PR. Pas de 16:9 ni de coupe courte tant que Romain ne les demande pas.
- Règles de contenu décidées par Romain (voir `REGLES.md`) : « Flow in » dit deux fois au plus par vidéo ; « scanne le QR code et joue » et « gain immédiat, ou tirage au sort » dans chaque vidéo ; « renforce votre image de marque » ; tickets (pas points) ; signature pro « l'animation jeu plug and play » ; signature participants « Flow in, suis le flow, découvre ce que tu gagnes ».
- Autres : le « 70 » de la vidéo organisateur est peu lisible ; animation tirée de la plaquette : à décider ; boutons violets des pages d'installation admin, pro, joueur : à passer en bleu. Détail : `kit/A-FAIRE.md`.
