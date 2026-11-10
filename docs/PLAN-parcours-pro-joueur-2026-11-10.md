# Plan avant production : parcours pro, publication d'animation, joueur (10/11/2026)

Source : retours de Romain du 10/11 (captures d'écran + remarques). Règle : on part de l'existant
(ParcoursCreation, PremiereFois, espace pro, parcours joueur), on simplifie, rien n'est recréé.
Graphisme et simplicité = ceux des films et des plaquettes V3.

## Lot 0 — Films (finir)
- Garder les 3 films Super Event (organisateur, commerce, participant) et les 2 Animation (commerce, participant), version 2.
- QR de fin :
  - commerce (Animation et Super Event) → plaquette Animation V3, écran de souscription ;
  - organisateur → plaquette Super Event V3, écran action / organisateur ;
  - participant → page « découvrir et s'inscrire » au jeu du commerce ou du super event (voir question 2).

## Lot 1 — Fin d'inscription et offres
- Écran « Bienvenue » : « Choisir mon offre et signer » → **« Découvrir nos offres »**.
- Offres en **carrousel** (mobile) / côte à côte sans défilement infini (ordinateur).
- Nouvelle grille (voir question 1) : offre d'essai 99 € HT, puis 990 € HT / an ou 110 € HT / mois.

## Lot 2 — Espace pro neutre et accueil
- **Bug** : un nouveau compte arrive sur « Assurance Charvolin » au lieu de son propre établissement : corriger la résolution du pro (session, paramètre `?pro=` ou rattachement).
- Accueil d'un nouveau pro : espace vide propre + guide « Complétez votre profil » (logo, coordonnées, horaires), puis « Publier ma première animation ».

## Lot 3 — « Publier une animation » (refonte du parcours existant)
1. **Point d'entrée en carrousel** (points en dessous) : Publier une animation · Rejoindre un super event · Demander la création d'un super event.
2. **Choix du jeu en carrousel**, un seul jeu à l'écran avec son aperçu : quiz, quiz + bonus, roue de la fortune, tombola. Pas de liste infinie, pas tous les jeux en même temps.
3. **Quiz / quiz + bonus** : trois boutons simples :
   - **« Je demande à Flowin »** (par défaut, mis en avant) : thème + description → demande envoyée par email à Flowin **avec les coordonnées du commerce** (à vérifier de bout en bout) ;
   - **« Je rédige moi-même »** : banque de questions, 4 propositions, 1 bonne réponse ; questions bonus (sondage) pour quiz + bonus ;
   - **« Assistance IA »** : préparée, désactivée (clé Anthropic API à brancher plus tard).
4. **Roue de la fortune** : éditeur simple des segments (lot, remise, « perdu »…).
5. **Lots** (manquant) : sélection des lots, quantité, **conditions de distribution** (gain immédiat ou tirage au sort, date du tirage, validité, période, avec ou sans achat).
6. **Publication** : « Publier mon animation » (règlement par virement déjà branché) → **QR généré automatiquement**.
7. **Statut visible** : « En ligne » sur l'animation.
8. **Gestion des QR par animation / par événement** : QR à imprimer ; QR digitaux par destination (vitrine, caisse, réseaux sociaux, site…) ; téléchargement / impression.
9. **Modifier / supprimer les lots** après publication, en corrigeant les tickets et QR associés ; **relancer** de nouveaux lots avec d'autres conditions quand le stock est épuisé.

## Lot 4 — Super Event : station jeu OU sponsor
- Choix **exclusif** : station jeu (fait participer ses clients, les gens viennent en boutique ou sur le site) **ou** sponsor (n'offre pas de lot, visible dans l'application).
- Explication courte de chaque statut. Le sponsor n'existe que dans Super Event (pas dans Animation).

## Lot 5 — Scanner (validation des lots)
- Explication simple : je flashe le ticket du client → je tape / vérifie le code → le lot est déstocké automatiquement.
- Fin de stock : bouton « Relancer des lots ».

## Lot 6 — Joueur
- **Bug** : la demande d'autorisation (caméra / données) apparaît deux fois.
- **Profil joueur** : « Mes jeux en cours », classés **par commerce / animation / super event**, avec la date d'échéance du tirage ; tickets **gagnants ou perdus** stockés immédiatement.
- **Géolocalisation** et **carte des lieux partenaires** (Flowin Animation).

## Lot 7 — Déjà inscrits au registre
- L13 import du fichier client (CSV, Excel) ; L14 calcul emails (en pause : pas d'email pour l'instant).

## Ordre proposé
Lot 0 → Lot 2 (bug Charvolin, bloquant) → Lot 1 → Lot 3 (cœur) → Lot 5 → Lot 4 → Lot 6 → Lot 7.
Chaque lot : maquette ou captures avant / après sur la vraie app, validation, puis mise en ligne.

## Questions à Romain
1. Offre d'entrée : **99 € HT pour une année** (lancement) **ou 99 € HT pour 3 mois d'essai** ? Puis 990 € HT / an ou 110 € HT / mois.
2. QR participant des films génériques : vers quelle page, puisque chaque commerce a son propre jeu ? Proposition : la carte / liste des commerces Flowin (à créer, lot 6) ; d'ici là, la page d'inscription joueur.
