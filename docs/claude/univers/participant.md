# Profil Participant (le joueur)
Entrée : « Flowin Event · Participant ». Voir aussi `COMMUN.md` (Design).

## Ce qui est propre
Il scanne un QR (animation ou Super Event), joue, reçoit un ticket ou un lot, le retrouve dans son profil `/moi`, peut l'offrir à un ami, parraine à la fin du parcours.

## Règles
Consentement : 3 cases, aucune cochée par défaut (`docs/claude/REGLES.md`, rubrique Données). Rappels de ticket 1 mois, 15 jours, 48 h. Le jeu prend les couleurs du commerçant. Pas d'e-mail ni de SMS : tout passe par l'application.

## Argent
Aucun prix côté participant. Pour tout montant : `paiement.md`.

## Code
`admin/app/jouer`, `moi`, `parcours`, `q`, `r`, `se`, `nds` (archive) ; `admin/components/joueur`, `masters`, `parcours` ; `admin/lib/masters/`, `moiTicketsGains.ts`, `parrainage.ts`.

## Si ton sujet touche une rubrique
| Sujet | Rubrique à lire aussi |
|---|---|
| Jeu, ticket, tirage, banque de questions | `jeux-tirages.md` |
| Consentement, données, mineurs | `donnees-securite.md` |
| Style, écrans, animations | `COMMUN.md` (Design) |
| Texte, argumentaire | `contenu.md` |

## À faire et notes
Espace client complet (compte, mot de passe, événements en cours, carte, historique, invitations) : descriptif `docs/SPEC-ESPACE-CLIENT-JOUEUR.md` (PR #96, non fusionnée). Points crédités / débités : n'existent pas. Appli installable `joueur-app.html` : pointe vers une démo, à corriger. Détail : `kit/A-FAIRE.md`.
