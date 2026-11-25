# Organisation des conversations (25/11/2026)

But : consommer moins de tokens, éviter les croisements de règles, travailler plus vite. Décision demandée à Romain : voir la fin.

## Le problème mesuré
- Une conversation longue (plus de 20 minutes d'échanges) relit tout son historique à chaque message : le coût grimpe à chaque tour et la qualité baisse (oublis, répétitions).
- Un agent qui démarre lit environ 95 Ko de mémoire (~27 000 tokens, estimé) alors qu'il lui faut 3 fichiers.
- Les règles de plusieurs espaces sont mélangées : on applique la règle d'un espace à un autre.

## Le schéma retenu : 1 conversation = 1 espace = 1 chantier

```
                 CONVERSATION PILOTAGE (courte, Romain + moi)
          décisions, priorités, validations de maquettes, état global
                         |  confie un chantier à ...
   +---------------+---------------+----------------+----------------+
   | SUPER ADMIN   | PRO           | SUPER EVENT    | PARTICIPANT    |
   | prospection,  | création,     | créé par       | jeu, profil,   |
   | comptes,      | jeux, lots,   | Flowin seul,   | billets,       |
   | paiements,    | QR, CRM, stats| tirage, lots   | carte          |
   | publication   |               |                |                |
   +-------+-------+-------+-------+--------+-------+--------+-------+
           \               |                |               /
            +---- SERVICES TRANSVERSAUX (appelés comme agents, pas comme conversations) ----+
            | Design (charte, composants)   Règles du jeu (tirage, tickets, lots)           |
            | Facturation (bons de commande, Jeffrey CRM)   Sécurité et données   Recette   |
            +-------------------------------------------------------------------------------+
```

- Chaque conversation d'espace ne lit que : l'INDEX de son espace, ses règles, son état, plus le NOYAU COMMUN (design, règles du jeu). Pas le reste.
- Les services transversaux (design, règles, facturation, sécurité, recette) ne sont PAS des conversations : ce sont des agents, appelés depuis la conversation d'espace avec un brief court. Leur mémoire reste dans leur carnet.
- Raison du choix « par espace » plutôt que « par thème » : les erreurs viennent du croisement des règles entre profils. Un espace a SES règles ; un thème (design, facturation) traverse tous les espaces et se traite en agent.

## Règles de conduite d'une conversation
1. Une conversation = un chantier. Chantier fini : on ferme, on ouvre une nouvelle.
2. Limite : environ 25 échanges ou 90 minutes. Au-delà, on termine avec la fiche de passage (ci-dessous) et on repart propre.
3. Le travail lourd (lire du code, auditer, coder) part dans des agents ; la conversation ne garde que le résultat court.
4. Les images, journaux et gros textes ne restent pas dans la conversation : fichier, puis résumé.
5. Fin de conversation : journal, état, erreurs, règles, mémoire de l'agent (règle de CLAUDE.md), puis la FICHE DE PASSAGE : 5 lignes (fait / en cours / bloqué par Romain / prochain pas / fichiers à lire).

## Démarrage d'une conversation (prompt court à coller)
```
Espace : <SUPER ADMIN | PRO | SUPER EVENT | PARTICIPANT | PILOTAGE>
Chantier : <une phrase>
Lis seulement : docs/flowin-event/espaces/<espace>/INDEX.md puis ce qu'il indique.
Règle : maquette, validation de Romain, puis code ; un lot, un arrêt.
```

## Budget cible par conversation
| Conversation | Lecture au départ | Agents typiques |
|---|---|---|
| Pilotage | ETAT + fiche de passage (~2 000 tokens) | tous, en brief court |
| Super Admin | INDEX + règles SA + noyau (~4 000) | facturation-crm, marketing-prospection, securite-donnees |
| Pro | INDEX + règles Pro + noyau | produit-ergonomie, creation-materiel |
| Super Event | INDEX + règles Super Event + noyau | flux-integrations, recette-tests |
| Participant | INDEX + règles Participant + noyau | produit-ergonomie, securite-donnees |

Mesure à faire : tokens réellement consommés avant / après (non mesuré aujourd'hui, estimations).

## Mise en place (sans rien supprimer)
1. Créer docs/flowin-event/espaces/<espace>/ avec INDEX.md, REGLES.md, ETAT.md, ERREURS.md, par COPIE depuis docs/claude (matrice dans ORGANISATION-MEMOIRE-AGENTS.md). Les fichiers actuels restent, marqués « remplacé » seulement après accord de Romain.
2. Corriger les lignes périmées dans les copies (CLAUDE.md : 13 agents, pas 11 ; pixel : mis de côté ; région Supabase : à vérifier).
3. Ajouter à CLAUDE.md un paragraphe « Comment démarrer une conversation » qui renvoie vers ce fichier.
4. Premier essai : une conversation Pro courte, comparer les tokens.

## Décision de Romain
Valides-tu : 1 conversation par espace + services transversaux en agents ? Sinon, variante : 1 conversation par thème (design, règles, facturation).
