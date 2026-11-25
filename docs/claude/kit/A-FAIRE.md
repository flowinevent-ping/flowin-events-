# À faire : Entrée → à faire
Lu au début de chaque session, filtré sur ton entrée. Une ligne par point. Preuves et statuts : `docs/claude/ETAT.md`. Mise à jour le 25/11/2026 depuis `ETAT.md`, `JOURNAL.md` et la conversation du 24/11.

| Entrée | À faire | Statut / source |
|---|---|---|
| Participant | Espace client complet (compte, mot de passe, événements, carte, historique, invitations) | descriptif `docs/SPEC-ESPACE-CLIENT-JOUEUR.md` (PR #96) ; décisions de Romain attendues |
| Participant | Appli installable `joueur-app.html` ouvre une démo : la faire ouvrir l'espace client | à faire |
| Participant | Points crédités et débités, historique | n'existe pas ; décision produit |
| Pro | Choix du pro pour créer une animation ou une banque au nom d'un pro (côté SA) | à construire |
| Pro | Trois jeux seulement (retirer le quiz solo) ; objectifs des jeux ; case parrainage ; roue à répartition libre ; curseur de date de fin | décidé le 25/11, à coder |
| Pro | Lots restants et utilisés ; vérifier l'attribution des tickets gagnants (`gains` vide) | à construire / à vérifier |
| Pro | Banque de questions personnelle, modèles de départ copiés | proposition à valider |
| Paiement | Facture animation, Wero, prix option Flowin (sens à confirmer), QR supplémentaire | voir `kit/NOTE-pro-vers-paiement-et-sa.md` |
| Super Admin | Rubriques Demandes de création et Demandes de participation | voir la note de transmission |
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
| Contenu | « 70 » peu lisible (vidéo organisateur) ; animation tirée de la plaquette | à décider |
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
