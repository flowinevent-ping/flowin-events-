# Rubrique Jeux et tirages
Entrée : « Flowin Event · Jeux et tirages ».

## Ce qui est propre
Les 4 jeux (quiz + bonus, quiz solo, roue, tombola), vote, banques de questions (communes Flowin et personnelles), tickets, gains immédiats, tirages, retrait du lot, offrir à un ami.

## Règles
Un seul jeu par animation. Quiz : 1 ticket, +1 bonus ; 1 partie par jour et par station. Super Event : toujours tirage au sort. Banque : brouillon, puis validée par Romain avant partage aux pros. Détail des décisions : `docs/DECISIONS-flowin-event.md` (rubrique jeux), `docs/claude/REGLES.md`.

## Argent
Prix du quiz rédigé par Flowin : voir `paiement.md`.

## Code
`admin/lib/masters/` (moteur `engine.ts`, définitions `defs.ts`), `admin/app/jouer`, `admin/lib/banques.ts`, `banquesModeles/`, `admin/components/banques`, `masters`, `operations`, `lib/operations.ts`. Base : RPC `appliquer_regle_gain`, `tirage_super_event`, `valider_lot`, tables `tirages`, `se_tickets`, `banques`.

## Où ça vit
| Rôle | Profils |
|---|---|
| Jouent | Participant |
| Règlent | Pro (son jeu, ses lots), Organisateur (lots du Super Event) |
| Fournissent | Super Admin (masters, banques communes, tirage Super Event) |
| Consomment | Participant (tickets, gains) |
Lire aussi : `participant.md`, `pro.md`, `donnees-securite.md` pour l'intégrité des tirages.

## À faire et notes
Gains : 0 ligne dans `gains` et `se_gains` (historique joueur vide) ; points crédités / débités absents ; 16 banques communes à valider par Romain ; choix du pro pour créer une animation ou une banque en son nom. Détail : `kit/A-FAIRE.md`.
