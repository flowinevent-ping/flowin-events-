# Cahier des charges — Plaquette interactive Flowin Event / Super Event

Fichier de référence : `docs/plaquette-interactive/flowin-plaquette-interactive.html` (commit `30b5d08`)

## Diagnostic de la session précédente (à lire avant de reprendre)
Le travail a dérivé en qualité à force de patchs ponctuels successifs sans relecture
globale régulière. **Ne pas reprendre en mode patch.** À la prochaine session : relire
tout le fichier, comparer à ce cahier des charges, et refaire un passage cohérent plutôt
que d'empiler un nouveau correctif.

---

## Structure générale
- Fichier HTML/CSS/JS autonome, navigation type "story" (clic pour avancer, flèche retour
  visible en haut à droite sauf sur l'accueil, points de progression en bas)
- Un tag de version discret en bas à droite (`build YYYY-MM-DD-xxx`) pour détecter les
  problèmes de cache navigateur pendant les tests — technique à garder
- Écran d'accueil : logo "Flowin" (pas d'accroche en dessous), puis signature verticale
  (« Animation digitale » / pastille « Plug & Play »), puis 2 boutons de parcours :
  **Flowin Event** et **Super Event** (le mot "Super" en police Bangers façon comic-book,
  "Event" en texte simple — appliqué aussi au badge permanent en haut à côté du logo,
  visible uniquement pendant le parcours Super Event)

## Parcours Flowin Event
1. **« Il joue »** — toggle Roulette / Quiz
   - Roulette : roue canvas fidèle au vrai composant `SpinClient.tsx` (jante chromée,
     LED ambrées, dégradés radiaux par segment, pointeur chromé, moyeu vert texte
     "FLOWIN"), segments/couleurs repris de l'event réel `ev-flowin-demo`
   - Quiz : vraie question de la banque NDS 2026 (Danakil/Marly-le-Roi), style exact
     repris de `NDS2026Client.tsx` (`.opt.correct` vert + ✓, `.opt.wrong` rouge + ✕,
     encart d'explication), bouton "Voir mon gain" après réponse → déclenche le popup
   - Popup de gain : format billet réaliste (ex. café gourmand offert), conditions,
     bouton téléchargement fonctionnel (génère un vrai fichier), bouton fermer
2. **« Vous captez, vous fidélisez »** — 3 widgets façon tableau de bord : donut
   répartition sexe, barres tranches d'âge, graphique horaire (pic de fréquentation)
3. **« Des lots qui ont du sens »** — 4 cartes (faire revenir / lancer un produit /
   promotion / écouler un stock), pas de texte d'intro redondant
4. **« En trois mots »** — Animez / Fidélisez / Boostez, disposition horizontale,
   Boostez en orange, lien vers Super Event

## Parcours Super Event
1. Intro « Rejoignez l'événement » — générique, pas de référence à un client nommé
2. **« L'effet boule de neige »** — LE POINT DE FRICTION DE LA SESSION PRÉCÉDENTE.
   Spécification la plus récente et validée par Romain (à ne plus faire varier sans
   son accord explicite) :
   - L'événement communique auprès du public
   - Le commerce communique aussi auprès du public
   - **Le commerce communique en plus auprès de SES PROPRES clients** au sujet de
     l'événement — c'est ce relais qui crée l'effet d'écho/boule de neige
   - Deux canaux de ce relais : **affichage physique** + **communication digitale**
     (prospection, mail, invitation, jeu concours pour gagner des places)
   - Le commerce annonce sa participation, puis pendant toute la durée de l'événement,
     contribue à sa communication — devenant un support de communication additionnel
   - Le schéma doit rendre visible ce sens de circulation précis, animé, pas juste
     des pictogrammes statiques
3. **« Deux façons de participer »** — toggle Annonceur / Acteur du trafic, chaque
   panneau : icône centrée + titre + description + séparateur + 3 vignettes
4. **« À qui ça s'adresse »** — toggle Organisateur / Commerce (pas 2 cartes côte à
   côte — une seule info affichée à la fois), même gabarit icône+titre+description+
   vignettes, plus un schéma illustrant le flux propre à chaque profil

## Écran final (CTA, partagé, atteint depuis les deux parcours)
- Logo "Flowin" (pas de titre texte à la place)
- Sous-texte : rappel qu'on vient de jouer, comme un vrai client
- 3 icônes valeurs : Capter / Visualiser / Fidéliser
- Bouton **« Nous contacter »** → ouvre un popup avec lien mail cliquable et lien
  téléphone cliquable (pas de bloc contact en clair sur l'écran)
- Signature Animation digitale / Plug & Play
- Lien retour à l'accueil

## Règles transverses
- Toujours valider le JS (Acorn) et vérifier l'absence de débordement (Playwright,
  bounding boxes) avant de livrer — a évité plusieurs régressions cette session
- Pas d'emoji produit
- Cohérence des couleurs de marque : violet `#7C2D92`, magenta `#E0218A`,
  or `#F5A100`, bleu `#3B5CC4`, violet clair `#A855F7`, teal `#00B4A0`
