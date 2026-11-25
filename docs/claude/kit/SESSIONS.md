# Sessions et agents
12 sessions « Flowin Event · <Entrée> », sans message de démarrage. Consigne intégrée : « Au premier message, lis `docs/claude/univers/COMMUN.md` (section utile), le fichier de ton entrée, la section utile de `docs/claude/REGLES.md` et tes lignes de `docs/claude/kit/A-FAIRE.md`. Ne relis rien d'autre. Garde-fous : ceux de ton entrée. En fin de bloc : réécris le fichier de l'entrée et rapport de 10 lignes. »

| Session | Fichier | Agents rattachés (`.claude/agents/`) |
|---|---|---|
| Entrée | `univers/entree.md` | aucun |
| Participant | `univers/participant.md` | `recette-tests` (parcours joueur) |
| Pro | `univers/pro.md` | `flux-integrations`, `recette-tests` |
| Super Admin | `univers/super-admin.md` | `critique-architecture-code` |
| Organisateur | `univers/organisateur.md` | `flux-integrations` |
| Design | `univers/COMMUN.md` | `produit-ergonomie`, `critique-ergonomie` |
| Jeux et tirages | `univers/jeux-tirages.md` | `critique-innovation` |
| Contenu | `univers/contenu.md` | `creation-materiel` |
| Paiement | `univers/paiement.md` | `facturation-crm` |
| Prospection | `univers/prospection.md` | `marketing-prospection`, `veille-marche` |
| Données et sécurité | `univers/donnees-securite.md` | `securite-donnees`, `critique-performance-donnees`, `continuite-reprise` |
| Automatisation | `kit/AUTOMATISATION.md` | aucun pour l'instant |

## Travail en parallèle
Chaque agent possède une zone de fichiers ; deux agents ne modifient jamais le même fichier ; le style commun n'est modifié que par Design ; une branche par agent ; fusion une par une ; `JOURNAL.md` : ajouter à la fin ; `ETAT.md` : sa ligne seulement.
