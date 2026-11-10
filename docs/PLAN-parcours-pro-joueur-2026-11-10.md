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

## Ajouts de Romain (10/11, suite) — validés

### Offres et prix (décidé)
- **Première année à moitié prix : 445 € HT** (offre de lancement), puis **990 € HT / an** ou **110 € HT / mois**.
- **Customisation totale : sur demande** (couleurs, thématique, jeu 100 % personnalisable et modifiable, lancement de campagne).
- **Édition des quiz par Flowin** : 30 questions quiz + 5 questions bonus, **forfait 145 € HT** ; **-50 % la première année** (72,50 € HT).

### Lot 1 bis — Commande au moment de publier
- Au moment de « Publier mon jeu » : écran **Nos offres** (offre première année 445 €, options : quiz rédigés par Flowin -50 %, customisation sur demande).
- **Bon de commande pré-rempli** (nom de l'entreprise, options), **signature électronique**, **paiement par virement**.
- Paiement déclaré → **publication**, email au pro « paiement effectué, contrôle sous 3 à 5 jours », et **alerte « paiements à vérifier »** dans le super admin pour Romain.
- **Mandat SEPA** pour le prélèvement mensuel, **contrat à tacite reconduction** (990 €/an ou 110 €/mois).
- CGV : arrêt pour **défaut de paiement** ou sur **simple résiliation** ; résiliation en cours d'année : **décompte au prorata des mensualités sur la base de 110 €/mois**.

### Lot 8 — Carte des commerces
- QR participant des films → **carte des commerces Flowin** (page commune).
- Super admin : visuel de la carte **Flowin Animation** au même endroit que la carte Super Event, avec un **sélecteur** : **bleu** = animation en cours, **orange** = super event en cours, **violet** = les deux.
- Joueur : accès à la **liste des partenaires** et aux **coordonnées GPS** des partenaires sur la carte.

## Critères de livraison (Romain, 10/11) — rien n'est « livré » sans vérification de bout en bout
- [ ] Édition des QR codes faite et vérifiée (impression + digitaux par destination).
- [ ] Édition et enregistrement du commerce vérifiés (profil, logo, coordonnées).
- [ ] UX / UI de sélection et de publication des animations conformes (carrousels, un jeu à la fois).
- [ ] QR codes rattachés au bon établissement.
- [ ] Logo du commerce présent dans le jeu, présentation aux couleurs du jeu.
- [ ] Interface joueur conforme (profil, jeux en cours par commerce, tickets gagnants / perdus, une seule autorisation).
- [ ] Liste des partenaires et carte avec coordonnées GPS accessibles au joueur.
- [ ] Commande : bon pré-rempli, signature, virement, email, alerte paiements à vérifier, SEPA.

## Questions à Romain (réglées)
1. Offre d'entrée : réglé, 445 € HT la première année.
2. QR participant des films : réglé, la carte des commerces.
