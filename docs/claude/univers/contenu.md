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
- Romain a répondu « 2 » en fin de bloc 1 : compris comme l'**échantillon de voix 2** (intonation modérée ×1,25, déjà le réglage de `voix.py`). À confirmer au début du bloc 2 : il pouvait aussi viser l'orientation 2 (le calcul).
- **Questions ouvertes à Romain :** (1) canal de diffusion principal (e-mail ou message, réseaux sociaux, rendez-vous) ; (2) accepte-t-il de se filmer 30 s ; (3) choix de l'échantillon de voix (1, 2 ou 3) ; (4) accent « espagnol » à localiser.
- **Bloc 2 commence par :** relire ce fichier et le document de correction (lecture `sinceRev` 30), obtenir les réponses aux questions ci-dessus, écrire un scénario à valider, ne produire qu'après validation. Outillage prêt : `admin/scripts/videos-v9/` (voix `voix.py` avec `SCRIPTS`, `RATE` ; scènes `build-films-v10.py` ; rendu `CHROMIUM=/opt/pw-browsers/chromium node rendu-v9.mjs` ; `montage-v9.sh`).
- Règles vidéo (voir `REGLES.md`) : « Flow in » deux fois au plus ; scanne le QR code et joue ; gain immédiat ou tirage au sort ; « image de marque » ; tickets ; signature pro « l'animation jeu plug and play » ; signature participants « Flow in, suis le flow, découvre ce que tu gagnes ».
- Autres : « 70 » peu lisible (vidéo organisateur) ; boutons violets des pages d'installation à passer en bleu. Détail : `kit/A-FAIRE.md`.

**État au 26/11/2026, fin du bloc 2**
- Branche `contenu/video-probleme-2026-11-26`, PR #114 en brouillon (non fusionnée, rien publié). tsc et build OK le 26/11 après-midi. Contient : `a-pb2.mp4` (test 20 s), `a-flash.mp4` (vidéo courte gros titres 13,6 s, hors charte, à ne pas publier), `flash-v11.html`, `scripts12.json`, dictées dans l'argumentaire.
- Maquette à valider : https://claude.ai/artifact/9x8rbGhByDBAHqPdGXTpmZ (audit, charte unifiée, aperçu animé de la vidéo « multicommerce » en 8 plans, offres en 3 propositions). Page d'offre plus ancienne : https://claude.ai/artifact/DTabKZ9Qi9oA1BLvz4LW2S.
- Décisions de Romain : signature « Flowin, l'animation du commerce de proximité » ; « multicommerce » ; pas « la première » ; preuve 56 % ; première animation offerte puis offre complète et options. Le gratuit n'est pas l'argument premier.
- **Bloc 3 commence par :** relire la maquette (section 3) ; obtenir le go de Romain sur la vidéo multicommerce, la phrase « Votre première animation est offerte », le nom et le prix de l'offre complète ; puis produire la vidéo avec les scènes à personnages (`build-films-v10.py`, voix `voix.py` RATE -3 %), pas avec `flash-v11.html`.
- Outillage : `voix.py` demande `pip install edge-tts praat-parselmouth numpy` ; `rendu-v9.mjs` accepte `SCENE=<fichier>` ; `build-films-v10.py` ignore les films sans voix.
- Le parcours de souscription (offre gratuite) relève d'une autre entrée (produit), après validation de l'offre.
- **Mise à jour 26/11 soir :** Romain juge la maquette trop plate (manque la carte, le réseau multicommerce, les jeux quiz / question bonus / tombola / spin roulette, l'effet waouh, la voix). Nouvel aperçu animé et sonore (voix Vivienne -3 % + battement de synthèse provisoire, 28 s, 8 plans) : https://claude.ai/artifact/KVQ1947uyeohBotjPaenY9 ; source `docs/apercus/multicommerce/` (expose `window.render(t)` et `DUREE`, réutilisable par `rendu-v9.mjs` pour produire la vidéo) ; voix `scripts12.json` film `a-multi`, `timing10/a-multi.json`. En attente du go de Romain. Musique réelle à choisir.
- **v2 (26/11 soir) :** style Super Event (Bangers, contours, ombres décalées, fond pointillé), façades de commerces reliées, 37 s, plans de 3 s minimum, jeux synchronisés sur la voix (film `a-multi2`, phrases découpées). Même lien d'aperçu. En attente de l'écoute de Romain (prononciation de « tombola » non vérifiée par moi).
