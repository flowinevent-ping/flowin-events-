# À faire : Entrée → à faire
Lu au début de chaque session, filtré sur ton entrée. Une ligne par point. Preuves et statuts : `docs/claude/ETAT.md`. Mise à jour le 25/11/2026 depuis `ETAT.md`, `JOURNAL.md` et la conversation du 24/11.

| Entrée | À faire | Statut / source |
|---|---|---|
| Participant | Espace client complet (compte, mot de passe, événements, carte, historique, invitations) | descriptif `docs/SPEC-ESPACE-CLIENT-JOUEUR.md` (PR #96) ; décisions de Romain attendues |
| Participant | Appli installable `joueur-app.html` ouvre une démo : la faire ouvrir l'espace client | à faire |
| Participant | Formulaire « Où t'envoyer ton gain ? » : la tranche d'âge est à l'étape 2 (Romain, 25/11) ; vérifier que tout champ déjà connu est prérempli | à vérifier |
| Participant | Points crédités et débités, historique | n'existe pas ; décision produit |
| Pro | Choix du pro pour créer une animation ou une banque au nom d'un pro (côté SA) | à construire |
| Pro | Case roue « parraine un ami, +1 ticket » : choix côté pro à ajouter ET affichage côté joueur (`SpinClient.tsx`, `engine.ts`) pour éviter un message « perdu » trompeur | décidé le 25/11 ; partie joueur à faire par Jeux et tirages |
| Pro | Trois jeux, objectifs des jeux, curseur de durée (dates début et fin) | FAIT le 25/11 (tsc et build lus, rendu navigateur non vérifié) |
| Pro | Lots restants et utilisés par lot dans l'espace pro (l'accueil affiche déjà « X restants sur Y » pour un lot) ; attribution des tickets gagnants : la table `gains` n'est écrite par aucun code, donc vide sans bug apparent ; lecture réelle en base à faire avec l'accord de Romain | à construire / à vérifier |
| Pro | Banque de questions personnelle, modèles de départ copiés | proposition à valider |
| Paiement | Aligner le code sur la grille validée le 25/11 (`reglement.ts`, bon de commande, CGV, trigger SQL) ; facture animation ; Wero | voir `kit/NOTE-pro-vers-paiement-et-sa.md` |
| Super Admin | Rubriques Demandes de création et Demandes de participation | voir la note de transmission |
| Pro | Maquettes à valider (formule, lot, suivi des lots, Super Event, création au nom d'un pro) | publiées le 25/11, réponse de Romain attendue |
| Pro | Bouton unique « Je contacte Flowin » (WhatsApp, téléphone, e-mail, rappel) sur plaquette et création ; capture « laissez-nous votre e-mail » rangée dans le CRM en « Contacté, pas abouti » (consentement exigé, aucun envoi sans go) | décidé le 25/11, à construire |
| Paiement | Facture simple en 3 lignes (Animation, Outils d'animation commerciale, Mesure de trafic), hébergée dans le profil du pro en lecture seule (ni effaçable ni modifiable), Jeffrey CRM y puise ; un seul émetteur du numéro légal à trancher | décidé le 25/11 |
| Paiement | Relance avant la date anniversaire (modèle fixe avec logo, sans IA, à valider par Romain une fois) ; renouvellement à 990 € | décidé le 25/11 |
| Pro | Compte de test prérempli depuis le hub (données marquées TEST) ; étape paiement : message « paiement en cours de branchement, contactez Flowin » tant que `PAIEMENT_ACTIF=false` | décidé le 25/11, à construire |
| Pro | Import fichier client incomplet (attestation, adresse) | `ETAT.md` |
| Pro | Scanner caméra iPhone et Android | non vérifié |
| Super Admin | CRM vides : fusionner et vérifier la PR #99 | PR #99 en attente |
| Super Admin | Hub installable `hub.html` : EN LIGNE le 25/11 (adresse à enregistrer sur le téléphone : https://flowin-events.vercel.app/hub.html). Reste : rubrique « Hub et démos » dans le dashboard, compte de test à créer avec l'accord de Romain | propriétaire : entrée Super Admin |
| Super Admin | Page de visualisation et d'édition des bons de commande et factures | à construire |
| Super Admin | Demandes de rappel : alerte, page, fiche pro | PR #94 (SQL 14 appliqué le 03/11) |
| Organisateur | Phases avant / pendant à vérifier de bout en bout | non vérifié |
| Organisateur | E-mail de tirage Super Event écrit pour NDS ; lot organisateur validable par le SA seul | `ETAT.md` |
| Design | Boutons violets des pages `admin-app`, `pro-app`, `joueur-app` | à décider |
| Jeux et tirages | 16 banques communes à valider par Romain | en attente de Romain |
| Jeux et tirages | Gains : 0 ligne en base ; chercher pourquoi | audit à faire |
| Contenu | Bloc 2 vidéos : réponses de Romain (canal, se filmer, échantillon de voix), puis scénario à valider avant toute production | `univers/contenu.md` |
| Paiement | SQL 08 (export CRM) non appliqué ; prix non modifiables | décisions de Romain |
| Paiement | Facturation automatique et Jeffrey CRM | feu vert attendu |
| Prospection | Page « Annonces des commerces » vide ; historique d'envois NDS 2026 | définir avec Romain |
| Données et sécurité | Factures, bons de commande et `comm_config` lisibles sans connexion | décision attendue (`CONTRATS-DONNEES.md`) |
| Données et sécurité | Retrait des gains : 190 lignes avec date, 37 avec statut retiré ; gains et se_gains vides | à vérifier |
| Données et sécurité | `pros_anon_select` : confirmation de Romain | en attente |
| Données et sécurité | Nettoyage des données TEST | bloqué |
| Automatisation | Décisions en attente (voir `AUTOMATISATION.md`) | rien construit |
| Entrée | Classer les points « à classer » | permanent |

## Carnet des notes ouvertes
Une note par ligne : `[Entrée] titre : texte (date)`. Statut : ouverte, répondue, fermée.
- [Entrée] Points joueur : faut-il un système de points ? À quoi servent-ils ? (25/11, ouverte)
