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
**État au 26/11/2026, fin du bloc 1 (contexte à 65 %)**
- En ligne (catalogue, brouillon) : `/videos/v10/{a-com,a-part,se-part,se-org,a-acc}.mp4` + 3 échantillons de voix `/videos/v10/echantillons/`. La vidéo organisateurs est la référence qualité selon Romain.
- Non publié (branche `contenu/video-probleme-2026-11-26`, sans PR) : `a-pb.mp4` (version « problème », 20 s) et le script « bénéfices » (`scripts11.json`, film `a-ben`, production arrêtée à la demande de Romain).
- Document de correction des textes (vidéos 1 à 6) : https://claude.ai/artifact/WXz1hUQqWHMRnwgdzSZrLx. Romain a commencé à corriger la vidéo 1 ligne 1 ; rien d'autre corrigé.
- **Décision de Romain le 26/11 : on arrête de produire, on brainstorme une autre orientation.** Objectif : accrocher le commerçant, axer sur ses bénéfices et le problème résolu, faire contacter.
- Sept orientations proposées (avant/après, calcul « un client coûte 3 à 5 fois plus cher », preuve Nuits du Sud, démo réelle sans voix, format réseaux sociaux, Romain face caméra, questions au commerçant). Recommandation : Romain face caméra + démo réelle ; sinon démo réelle + preuve, sans voix.
- **Questions ouvertes à Romain :** (1) canal de diffusion principal (e-mail ou message, réseaux sociaux, rendez-vous) ; (2) accepte-t-il de se filmer 30 s ; (3) choix de l'échantillon de voix (1, 2 ou 3) ; (4) accent « espagnol » à localiser.
- **Bloc 2 commence par :** relire ce fichier et le document de correction (lecture `sinceRev` 30), obtenir les réponses aux questions ci-dessus, écrire un scénario à valider, ne produire qu'après validation. Outillage prêt : `admin/scripts/videos-v9/` (voix `voix.py` avec `SCRIPTS`, `RATE` ; scènes `build-films-v10.py` ; rendu `CHROMIUM=/opt/pw-browsers/chromium node rendu-v9.mjs` ; `montage-v9.sh`).
- Règles vidéo (voir `REGLES.md`) : « Flow in » deux fois au plus ; scanne le QR code et joue ; gain immédiat ou tirage au sort ; « image de marque » ; tickets ; signature pro « l'animation jeu plug and play » ; signature participants « Flow in, suis le flow, découvre ce que tu gagnes ».
- Autres : « 70 » peu lisible (vidéo organisateur) ; boutons violets des pages d'installation à passer en bleu. Détail : `kit/A-FAIRE.md`.
