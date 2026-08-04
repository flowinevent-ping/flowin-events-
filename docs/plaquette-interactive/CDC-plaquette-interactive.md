# KICKOFF — Plaquette interactive Flowin Event / Super Event
_À coller tel quel en ouverture de la nouvelle conversation. Faits vérifiés au 04/08/2026._

Tu reprends un travail en cours sur la plaquette commerciale interactive de Flowin (SaaS gamification événementielle). Ne recrée rien à l'aveugle, lis d'abord le cahier des charges ci-dessous et le fichier existant en entier. La partie Event est quasi terminée — le vrai travail à faire est sur Super Event.

## 1) BOOTSTRAP (avant toute prod)
1. Demande le **PAT GitHub** courant (ne jamais le committer, repo public → secret-scanning révoque tout token détecté). Fine-grained, permission Contents = Read and write.
2. Clone `flowinevent-ping/flowin-events-` et vérifie DEUX accès : (a) `git fetch` + push OK, (b) Supabase MCP `select 1`. Si un manque → STOP, le signaler.
3. Lis dans l'ordre : ce fichier (`docs/plaquette-interactive/CDC-plaquette-interactive.md`), puis `docs/plaquette-interactive/flowin-plaquette-interactive.html` (le fichier lui-même, en entier — pas par extraits).
4. Lis aussi le handoff Supabase `handoff_notes` clé `handoff-nds-2026-comm` et le hub Notion (page `38c6dcca-9add-81dd-9af2-c93139e06393`) pour le diagnostic de la session précédente.

## 2) ACCÈS / IDs
- Repo : `flowinevent-ping/flowin-events-` (PUBLIC)
- Supabase (MCP, seul accès DB) : `ywcqtupgoxfzkddqkztk` (eu-west-1)
- Notion hub : `38c6dcca-9add-81dd-9af2-c93139e06393`
- Fichier de travail : `docs/plaquette-interactive/flowin-plaquette-interactive.html`
- Événement démo réel (couleurs/segments de la roue) : `ev-flowin-demo`
- Démo live roue : `https://flowin-events.vercel.app/parcours/spin?ev=ev-flowin-demo`

## 3) MÉTHODE — ce qui a raté la fois précédente, à ne pas reproduire
Le travail avait dérivé en qualité par accumulation de patchs ponctuels sans jamais reprendre une vue d'ensemble, amplifié par des demandes qui se sont contredites d'un tour à l'autre sans être signalées comme telles.
**Règle absolue pour cette session** : avant toute modification, relire le fichier HTML en entier et le comparer à ce CDC. Si une nouvelle demande contredit une décision déjà actée ici, le dire explicitement avant d'exécuter, pas l'appliquer silencieusement. Ne jamais faire un nouveau patch sans relecture globale préalable. Valider systématiquement (Acorn pour le JS, Playwright pour l'absence de débordement) avant chaque livraison.

## 4) OBJECTIFS DE LA PLAQUETTE
Un support commercial interactif (clic pour avancer, pas de slides statiques) qui fait *ressentir* le produit plutôt que le décrire — roue et quiz réellement jouables, popup de gain réaliste, avant de présenter l'argumentaire. Deux produits, deux parcours indépendants accessibles depuis l'accueil :

**Flowin Event** — le jeu à l'échelle d'un commerce seul
- Cible / persona : un commerçant individuel qui veut animer sa caisse simplement
- Attraits à faire ressentir : zéro friction (« clic, clic, clic »), plug & play, installation en quelques secondes, jeu qui capte des données client (CRM) sans formulaire imposé, fidélise par le lot à retirer en boutique (pas juste une remise — un vrai objectif : faire revenir, lancer un produit, faire une promotion, écouler un stock)
- Modules : Quiz, Roulette, Bonus — le commerçant choisit

**Flowin Super Event** — le réseau qui fédère plusieurs commerces autour d'un événement
- Cible / persona : un organisateur d'événement/festival (type Nuits du Sud) OU une association de commerçants qui veut dynamiser/unifier un territoire
- Attrait central à faire ressentir : l'**effet boule de neige** de la communication — voir section 5, c'est le point le plus important et le moins abouti visuellement à ce jour
- Deux façons de participer : en tant qu'annonceur/co-annonceur (profite du trafic et de la notoriété, sans rien gérer) ou en tant qu'acteur du trafic (diffuse sa propre offre, devient point de jeu)
- Mise en place : aussi simple qu'un sticker sur la porte + présentation en caisse + invitation à jouer ; retrait du lot en un scan (billet digital, employé avec téléphone + code)

## 5) LE SCHÉMA "EFFET BOULE DE NEIGE" — spec figée, ne plus faire varier sans accord explicite de Romain
C'est le point qui a le plus régressé. Voici le flux exact à représenter, validé :
- L'événement communique auprès du public
- Le commerce communique **aussi**, de son côté, auprès du public
- Le commerce communique **en plus** auprès de **ses propres clients** au sujet de l'événement — c'est précisément ce relais de proximité qui crée l'effet d'écho / boule de neige, pas juste la diffusion de l'événement seul
- Deux canaux concrets pour ce relais : **affichage physique** (en boutique) et **communication digitale** (prospection, mail, invitation, jeu concours pour gagner des places)
- Le commerce annonce sa participation à l'événement, puis pendant toute la durée de l'événement contribue à sa communication — il devient un support de communication additionnel pour l'événement, pas seulement un bénéficiaire

Le schéma doit rendre ce sens de circulation lisible et animé au premier coup d'œil — pas un diagramme statique avec juste des pictogrammes, un vrai flux qu'on voit circuler.

## 6) CONCEPTION VISUELLE — cohérence à préserver sur toutes les pages
- Palette de marque fixe : violet `#7C2D92`, magenta `#E0218A`, or `#F5A100`, bleu `#3B5CC4`, violet clair `#A855F7`, teal `#00B4A0` — Event utilise plutôt magenta/or, Super Event plutôt bleu/violet (déjà en place, à conserver)
- Un seul gabarit de présentation "argumentaire" partout où il s'applique : icône centrée + titre + description + séparateur + 3 vignettes — déjà utilisé sur plusieurs écrans, à répliquer fidèlement partout où un nouvel écran de ce type est nécessaire, pas réinventer à chaque fois
- Les éléments jouables (roue, quiz) doivent rester fidèles aux vrais composants de production (`SpinClient.tsx`, `NDS2026Client.tsx`) — ne pas réinterpréter leur style, les porter fidèlement
- Toujours vérifier avant de livrer : le JS est valide, aucun texte ne déborde sur la bande "cliquez pour continuer" en bas, le logo "Flowin" n'a jamais l'italique par défaut du `<em>` HTML (bug déjà rencontré, la règle CSS doit être générique, pas scopée à un seul écran)

## 7) RÈGLES DE LIVRAISON (héritées de la méthode générale du projet)
- 3 piliers à chaque étape significative : GitHub (commit + push) + Supabase `handoff_notes` (prepend) + Notion hub (`insert_content` position start)
- Pas d'emoji produit
- Français voice-to-text — interpréter par le contexte, ne pas hésiter à reformuler poliment ce qui semble incohérent plutôt que l'exécuter tel quel
- Un tag de version discret dans le HTML (`build YYYY-MM-DD-xxx`, coin bas droit) à chaque livraison, pour trancher immédiatement les cas de cache navigateur pendant les tests — technique qui a fait ses preuves
