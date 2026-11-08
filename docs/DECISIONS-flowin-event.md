# Décisions Flowin Event — à lire par chaque session et chaque agent

Ce qui est écrit ici est tranché par Romain. On ne le redemande jamais. On ajoute
une ligne datée quand une nouvelle décision est prise ; on ne modifie une ligne
que sur instruction explicite de Romain.

## Méthode de travail (retour d'expérience Flowin Révision, 08/11/2026)

1. Cadrage d'abord, sur une page (`docs/CADRAGE-refonte-flowin-event.md`) : public,
   ton, palette, tailles minimales (police ≥ 13 px, zones tactiles ≥ 44 px), boutons,
   cartes, états. Ce sont des variables appliquées partout, jamais écran par écran.
2. Un seul écran fini à 10/10 d'abord, validé par Romain sur son téléphone. On ne
   reproduit sur les autres écrans qu'après son feu vert.
3. La maquette validée est la source unique. Le style de l'app en découle ; on ne
   corrige pas la cosmétique à la main écran par écran.
4. Les décisions vivent dans ce fichier, pas dans la conversation.
5. « Fait » exige des preuves : captures avant/après des vraies pages à 360, 390 et
   430 px avec de vraies données, et rejeu des captures envoyées par Romain.
6. Un parcours de bout en bout à la fois, prouvé avant de passer au suivant.
7. Peu d'agents en parallèle, tests ciblés à chaque changement, contrôle complet
   seulement avant une livraison.
8. Les confirmations externes (modifications de la base de production, qui exigent
   un clic de Romain) sont regroupées et annoncées à l'avance : Romain reste devant
   l'application à ce moment-là.
9. Indicateurs commerciaux définis avant de coder, puis mesurés.
10. Ne jamais recréer une maquette ou un support de zéro : on modifie l'existant.
    Deux tours de retours maximum par support, regroupés. Retours au format
    « écran n° + une phrase ».

## Marque et produits (08/11/2026)

- Marque : **Flowin Event**.
- Produit 1 : **Flowin Animation** — le jeu dans son commerce (« créer une animation »).
- Produit 2 : **Flowin Super Event** — participer à un super event (le commerce
  devient **station jeu**), ou en créer un (organisateur).
- Une association de commerçants peut être organisatrice.
- Noms à ne plus utiliser : « Flowin GAMIFICATION », « FLOWIN.EVENTS », « Super event Flowin ».

## Message (08/11/2026)

- Slogan : **Animer · Booster · Fidéliser**.
- Promesse super event : **« Un événement. Tous ses partenaires. Un seul jeu. »**
- Organisateur : les partenaires **diffusent** l'événement, en boutique et en ligne
  (physique et digital). Les partenaires **ne financent pas** l'événement : ne jamais
  l'écrire.
- Chiffres autorisés à publier : **56 % des participants souhaitent garder le contact** ;
  **plus de 70 lots distribués dans les commerces locaux** (à mettre en forme lisible).

## Prix (08/11/2026)

- Organisateur : **pas de prix public**, sur étude. On vend le suivi (où les gens ont
  joué, contacts, base de données). Le prix sert à négocier l'intégration à l'événement.
- Grille commerce et partenaires : proposition à faire par Claude, à valider par Romain.

## Boutons d'action (08/11/2026)

- Organisateur : prise de rendez-vous par **WhatsApp ou email**. Pas d'agenda en ligne.

## QR code (08/11/2026)

- Chaque animation a un QR à imprimer et un QR digital à diffuser.
- On peut créer un QR digital supplémentaire par support (Facebook, TikTok…) pour
  suivre d'où viennent les joueurs.

## Parcours (08/11/2026)

- Le pro crée et voit son jeu avant de payer ; le paiement arrive à la publication.
- L'écran final de la création est le QR prêt à imprimer ; bouton « Mon QR » sur
  chaque animation.
- Super event : formules partenaire proposées en 2ᵉ écran ; choix « digital » ou
  « kit imprimé » dans la création d'animation (deux choix distincts).

## Interface (07/11/2026)

- Pas d'emoji dans l'interface : pictogrammes uniquement.
- Couleur super event : orange #C2410C / #FF8A14. Couleur animation : bleu #3B5CC4.
- Formulaires : genre Homme / Femme / vide uniquement.
- Jamais de données inventées (téléphone, email, SIRET, adresse) : placeholder
  `[… à compléter]`.

## Supports (08/11/2026)

- Plaquette commerce : réduite à 6 écrans (proposition à faire).
- Vidéos : produire les 3 vidéos (commerçant, partenaire, organisateur) ; modèle de
  vidéo joueur générique ; nettoyage des doublons.
- Archiver les pages internes exposées publiquement.
- Visite guidée Flowin (`/visite-guidee/`) : démo cliquable, outil commercial, accessible
  depuis le dashboard SA (menu Comm & outils).

## Objectif de la refonte (08/11/2026)

- Mesure du succès : la **conversion**, c'est-à-dire l'envie de s'inscrire après navigation.
  Chaque écran, chaque support est jugé sur ce critère.

## Cahier des charges design de Flowin Animation (08/11/2026)

- Flowin Animation doit avoir **l'effet d'un jeu** : animation, innovation, simplicité, mouvement.
- **Aux couleurs du commerçant** (et non aux seules couleurs Flowin) : comme sa propre carte de
  fidélité, mais un outil vraiment interactif où le client a de **vrais privilèges** et une
  interaction avec son commerce.
- But : créer l'**attractivité**, accrocheuse au premier coup d'œil.
- Le cadrage (`docs/CADRAGE-refonte-flowin-event.md`) doit être corrigé en conséquence : la palette
  Flowin reste celle de la marque et des écrans pro/admin ; le jeu côté joueur prend les couleurs du
  commerçant.

## Constat de Romain sur la présentation Super Event (08/11/2026)

- Pas assez probante ni simple à comprendre au premier coup d'œil ; trop d'images ; couleurs et
  tailles d'images pas optimales ; navigation peu actuelle ; manque possible d'animation et de
  dynamique. À traiter par un audit design / ergonomie / architecture avant toute nouvelle production.

## Campagne d'inscription gratuite des commerces (08/11/2026, à intégrer à la réflexion)

- Une campagne d'inscription **gratuite** est envisagée : le commerce s'inscrit sur Flowin et
  attend le prochain événement ou la prochaine animation.
- But : rassembler les commerces autour d'actions de communication **locales et hyper locales**.
- Le commerce s'enregistre (coordonnées, SIRET), **accepte d'être contacté** et est contacté au
  prochain événement. Aucun frein à l'inscription : pas de paiement, pas de refus.
- Une fois les informations validées : la fiche remplit le **CRM** et le commerce est inscrit
  sur la **carte des partenaires Flowin**, même s'il ne prend pas d'animation (prix ou autre).
- Variante à étudier : saisir les coordonnées du commerce directement dans l'application
  (par l'équipe ou un prospecteur), puis validation.
- **Demande portée par les clients** : sur la carte, un client peut envoyer un email ou une
  demande au commerce pour qu'il adhère à Flowin (ou rejoigne une animation). La demande d'adhésion
  vient aussi des clients.

## Positionnement produit (08/11/2026, corrigé par Romain)

- **Flowin Animation** est un outil commercial, pas un simple jeu :
  1. **Acquérir un CRM**, ou réveiller un fichier clients existant souvent dormant faute d'animation.
  2. **Distribution automatisée des lots** qui fait **revenir le client** en boutique : retrait du lot
     avec validation, dates de validité, calées sur les meilleures périodes pour activer le commerce.
  3. **Attirer du trafic** dans le commerce et chez les partenaires Flowin alentour.
  4. **Outil de tracking** : chaque support a son QR digital, toutes les campagnes de communication
     sont quantifiées.
  5. **Centraliser** toutes les campagnes de jeu du commerce.
- **Flowin Super Event** permet :
  1. aux sponsors sans lots à offrir (ex. assurance) d'être visibles comme **sponsors du
     développement local** auprès des festivaliers ;
  2. aux petits commerces de rejoindre des événements habituellement hors de portée (levier,
     pas forcément argument affiché) ;
  3. aux concurrents des partenaires officiels d'être présents.
  - Exemple de référence : **Nuits du Sud, Vence**.
- **Direction artistique** : pas de pari sur la photo (difficile à obtenir). On mise sur une
  **animation de qualité** et la **vidéo interactive**, à mi-chemin entre présentation produit et
  tuto. Messages : simplicité, bénéfice, immédiateté, plug and play — **« Vous testez, vous essayez. »**
