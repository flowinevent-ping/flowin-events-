# Flowin Event en clair (25/11/2026)

Ce document explique l'organisation sans jargon. Il corrige le modèle après les précisions de Romain du 25/11.

## Les 4 espaces

| Espace | Qui | Ce qu'on y fait |
|---|---|---|
| 1. Super Admin | Flowin Event (Romain, administrateurs) | Prospecter, créer des comptes, lancer des animations pour un commerce, créer et piloter les Super Events, contrôler paiements et publications |
| 2. Pro | Le commerçant | Choisir un jeu, le régler, publier, imprimer ses QR, suivre ses flashs, rejoindre un Super Event |
| 3. Super Event | Créé par Flowin Event uniquement | Un grand jeu commun (ex. Nuits du Sud 2026) : jeu, tirage au sort et lots choisis par Flowin. Les pros le REJOIGNENT, ils ne le créent pas |
| 4. Participant | Le joueur | Flasher, jouer, voir ses billets, voir la carte des commerces en ligne |

CORRECTION : un pro n'est jamais « organisateur » d'un Super Event. L'organisateur, c'est Flowin Event.

## Les 4 phrases de l'audit, expliquées

1. « Une seule table pour une animation et une station de Super Event, avec un champ qui les distingue. » Dans la base de données, il n'y a qu'une seule liste, « events ». Une animation de Nook Café et la station de Nook Café dans les Nuits du Sud sont dans cette même liste. Un champ (« super_event_id ») dit si la ligne appartient à un Super Event. Avantage : un seul endroit à corriger. Inconvénient : les règles des deux sont mélangées dans le code.
2. « Une seule fonction qui enregistre l'animation. » Quand on valide la création, le même petit programme écrit toujours l'animation dans la base, que ce soit un pro ou le Super Admin qui crée. Donc le résultat est identique. Ce qui diffère, ce sont les deux ÉCRANS qui mènent à ce programme.
3. « Deux accès CRM déjà fermés. » Le CRM est le fichier de clients. Il y en a deux accès : un pour le pro, qui ne voit que SES clients, et un pour Flowin, qui voit TOUS les participants. « Fermés » veut dire : personne d'autre ne peut les lire.
4. « Deux écrans de création. » Le pro a un parcours soigné (le configurateur). Le Super Admin en a un autre, plus ancien et plus gros. Romain veut le MÊME parcours des deux côtés.

## Ce que Romain veut (cible)

- Le Super Admin crée une animation avec LE MÊME parcours que le pro.
- Scénario téléphone : Flowin appelle un commerçant, lui crée son compte et lance son animation, en direct, sans changer d'écran.
- Au début du parcours, une question « Pour qui ? » : un pro qui existe déjà, un nouveau pro à créer, ou un pro qui existe mais n'a pas encore d'animation.
- Le Super Event est créé par Flowin Event seulement (jeu, tirage au sort, lots, distribution). Les pros demandent à le rejoindre, comme pour NDS 2026.

## Ce qui reste à décider (par Romain)

1. Comment prévenir le pro créé par Flowin (lien d'invitation, mot de passe temporaire ou « mot de passe oublié » guidé) : à décider.
2. Le rôle « organisateur pro » d'un Super Event existe encore dans le code (écrans /pro/super) : on le retire, on le laisse en sommeil, ou on le garde pour plus tard ? Non vérifié : à qui il sert aujourd'hui.

## Avant toute mise en production

1. Romain valide ce document et ARCHITECTURE-CIBLE.md.
2. Maquette du parcours unique (pro et Super Admin) avec l'écran « Pour qui ? ».
3. Romain valide la maquette.
4. Seulement ensuite : codage par petits lots, un lot, un arrêt, Romain regarde.
