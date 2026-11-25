# Contrats de données par profil : ce qui doit être conservé, isolé, tracé
Mesures du 25/11/2026 en base de production (lecture seule). « Clé publique » = lecture sans connexion. Statuts : OK mesuré, À VÉRIFIER, TROU. Entrée propriétaire : Données et sécurité ; chaque profil lit sa section.

## Contrôles de stabilité (à rejouer à chaque livraison risquée)
| Contrôle | Résultat 25/11 |
|---|---|
| Toutes les tables publiques ont la sécurité par lignes (RLS) | OK : aucune table sans RLS |
| Lecture sans connexion fermée sur les données personnelles | OK pour joueurs, pros, tickets, participations, tirages, gains, parrainage, notifications, visites, RIB, commandes, demandes de rappel |
| Lecture sans connexion ouverte (voulu pour afficher le jeu) | `events`, `partenaires`, `lots`, `qr_stations`, `banques` : À VÉRIFIER que tout leur contenu doit être public |
| Lecture sans connexion ouverte (non voulu ?) | `factures`, `bons_commande`, `comm_config` : À VÉRIFIER, décision de Romain |
| Ordre de rejeu des fichiers `sql/` | non vérifié : `sql/README-ORDRE.md` ne cite pas tous les fichiers (12, 14) |
| Contrôles qualité quotidiens (cron 03:17 UTC) | voir `ETAT.md` |

## Participant
| À conserver | Où | Isolation | État |
|---|---|---|---|
| Profil, consentement | `joueurs` (842) | lecture : lui, le pro concerné, le SA | OK |
| Événements auxquels il a participé | `participations` (1 035), `se_reponses` (979), `visites` | fermées sans connexion | OK ; `joueurs.events` n'est pas fiable, ne pas s'en servir |
| Tickets | `se_tickets` (1 065) | fermée | OK |
| Gains et cadeaux | `tirages` (237) ; `gains` et `se_gains` : 0 ligne | fermées | TROU : les deux tables dédiées sont vides, les gains vivent dans `tirages` |
| Utilisation d'un gain | `tirages.retire_at` (190 lignes) et `statut = retire` (37 lignes) | fermée | À VÉRIFIER : deux mesures du retrait qui ne concordent pas |
| Parrainage | `parrainage` (10) | fermée | TROU : aucun crédit de points |
| Points crédités et débités | aucune table | — | TROU : n'existe pas |
| Notifications | `joueur_notifications` (0) | fermée | rien reçu à ce jour |

## Pro
| À conserver | Où | Isolation | État |
|---|---|---|---|
| Coordonnées, droits | `pros` (21), `pros_droits_journal` (0), `pros_rib` (0) | fermées ; lecture : lui et le SA | OK |
| Animations lancées, personnalisations des maîtres de jeu | `events` (68), dont `events.cfg` | lisible sans connexion | À VÉRIFIER (voulu pour jouer) |
| Lots et stock | `lots` (35, lisible), `lots_stock` (149, fermée) | | OK |
| QR et passages | `qr_stations` (5), `participations`, `visites` | QR lisibles ; passages fermés | OK |
| Banques de questions | `banques` (44) | lisible sans connexion | À VÉRIFIER |
| Base client (traçabilité des clients) | `clients_commerce` (0) | fermée | TROU : vide ; import du fichier client incomplet |
| Commandes, factures | `commandes_animation` (0), `factures` (5), `bons_commande` (8) | commandes fermées ; factures et bons lisibles | À VÉRIFIER |

## Super Admin
| À conserver | Où | Isolation | État |
|---|---|---|---|
| Identité SA | `flowin_super_admins` (2 comptes) | fonction `est_super_admin()` | OK, lecture de toutes les tables vérifiée en simulant le SA |
| Visibilité de tout | dashboard, CRM | session SA | À VÉRIFIER après PR #99 (CRM vides avant) |
| Demandes de rappel | `demandes_rappel` (0) | dépôt public par fonction, lecture SA | OK testé le 03/11 ; page dans PR #94 |
| Prospection | `prospection` (1 966), `leads_landing` (0) | fermées | OK |
| Paiements | `PAIEMENT_ACTIF=false` ; prélèvement GoCardless non activé | — | pas en ligne, voulu |
| Automatisations (registre, interrupteur, plafond, file d'approbation) | aucune table | — | TROU : description seule dans `AUTOMATISATION.md` |
