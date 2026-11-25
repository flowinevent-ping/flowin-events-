# Routage : « le point concerne… → session »
Sessions nommées « Flowin Event · <Entrée> ». Un point = une seule session. S'il touche plusieurs profils, il va dans la rubrique qui possède le code partagé, avec « voir aussi ». Sans réponse claire : « à classer » avec sa question, dans `A-FAIRE.md`.

| Le point concerne… | Session | Fichier |
|---|---|---|
| Un écran du joueur, son profil `/moi`, un QR joué | Participant | `univers/participant.md` |
| Inscription pro, espace pro, scanner, fichier client | Pro | `univers/pro.md` |
| Le dashboard, un CRM, une page SA | Super Admin | `univers/super-admin.md` |
| Créer ou rejoindre un Super Event, carte, stations | Organisateur | `univers/organisateur.md` |
| Style, clics, animations, sons, maquette | Design | `univers/COMMUN.md` |
| Un jeu, un ticket, un tirage, une banque | Jeux et tirages | `univers/jeux-tirages.md` |
| Plaquette, vidéo, texte, visuel | Contenu | `univers/contenu.md` |
| Prix, bon de commande, facture, CGV | Paiement | `univers/paiement.md` |
| Envoi, e-mail, annonce, réseaux | Prospection | `univers/prospection.md` |
| Droits d'accès, RLS, consentement, mineurs | Données et sécurité | `univers/donnees-securite.md` |
| Moteur automatique, file d'approbation | Automatisation | `kit/AUTOMATISATION.md` |
| Je ne sais pas, plusieurs sujets en vrac | Entrée | `univers/entree.md` |

L'entrée classe, écrit, indique la session ; elle ne corrige rien et ne réveille pas les autres.

## Test à blanc (3 défauts réalistes)
1. « Le bouton Ouvrir du scanner ne répond pas sur iPhone » : un seul profil, **Pro**.
2. « Les CRM sont vides et la fiche pro n'affiche pas les demandes de rappel » : touche Super Admin et Pro ; la cause est dans le chargement des données, donc **Super Admin** (code `app/dashboard`), voir aussi Pro et Données et sécurité.
3. « Les points du joueur ne montent pas après un parrainage » : pas de réponse claire (aucun système de points, décision produit) : **à classer** par l'Entrée, question « points : oui ou non, et à quoi servent-ils ? ».
