# Profil Pro (commerçant ou partenaire)
Entrée : « Flowin Event · Pro ». Voir aussi `COMMUN.md` (Design).

## Ce qui est propre
Il s'inscrit (parcours en 3 écrans), configure et publie une animation, suit passages et joueurs, scanne les lots, voit sa base client, envoie des annonces à ses contacts, rejoint un Super Event comme station.

## Règles
Un seul jeu par animation, plusieurs animations possibles. Pas de logo à l'inscription (dans « Mon profil »). On dit « Valider mon bon de commande », jamais « signer ». Le jeu est visible avant paiement ; paiement à la publication.

## Argent
Voir `paiement.md` (source unique des prix). Aucun montant n'est écrit ici.

## Code
`admin/app/pro`, `admin/components/pro`, `admin/components/creation` ; `admin/lib/pro.ts`, `inscriptionPro.ts`, `commandesPro.ts`, `crmPro.ts`, `annoncesPro.ts`, `droitsPro.ts`, `statsPro.ts`, `operations.ts`.

## Si ton sujet touche une rubrique
| Sujet | Rubrique à lire aussi |
|---|---|
| Prix, bon de commande, facture | `paiement.md` |
| Jeu, lots, banques de questions | `jeux-tirages.md` |
| Fichier client, droits, consentement | `donnees-securite.md` |
| Plaquette, vidéo, texte | `contenu.md` |

## À faire et notes
Fait le 25/11 : trois jeux (quiz solo retiré de la création), objectifs affichés, curseur de durée. Grille de prix provisoire dans `REGLES.md` (pas encore dans `reglement.ts`). À faire : case parrainage de la roue (pro et joueur), lots restants et utilisés par lot, attribution des tickets à vérifier en base (accord de Romain), choix du pro côté Super Admin, import du fichier client, scanner caméra non vérifié. Hub : voir Super Admin. Détail : `kit/A-FAIRE.md`.
