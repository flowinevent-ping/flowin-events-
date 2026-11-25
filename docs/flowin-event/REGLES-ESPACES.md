# Super Event contre Animation : commun et différent (25/11/2026)

Sources des règles : `docs/claude/REGLES.md` (jeux, tickets, tirages, 19-25/11), `docs/SUPER-EVENT-phases-2026-11-19.md`. Colonne « Code » = où la règle est appliquée AUJOURD'HUI (fichier:ligne).

## 1. Tableau des règles
| Règle | Animation | Super Event | Commun / différent | Code actuel |
|---|---|---|---|---|
| Donnée | ligne `events` (`super_event_id` vide) | `super_events` + stations = `events` avec `super_event_id` | COMMUN : même table de stations | `lib/types.ts`, base : 20 events sans, 48 avec |
| Jeu | un seul jeu ; roue permise | un jeu pour tout le Super Event ; pas de roue | différent | `ParcoursCreation.tsx:1149` (`JEUX.filter(j => j.m !== 'spin')`) |
| Récompense | tirage OU gain immédiat | TOUJOURS tirage au sort | différent | `ParcoursCreation.tsx:599, 665` (`aUnTirage`, `aUnInstant`) ; RPC `appliquer_regle_gain` ignore le Super Event |
| Qui lance le tirage | le pro (date + bouton) | Flowin (SA) ; pas de bouton organisateur | différent | `app/pro/tirage` ; `TirageSuperEvent.tsx`, RPC `tirage_super_event` |
| Ticket du joueur | `participations.tickets` | `se_tickets` (1 quiz + 1 bonus / station / jour, +1 parrainage) | différent (2 tables) | `lib/parcours.ts:179-215` (`attribuerSuperEvent`), RPC `se_attribuer_partie`, trigger `tg_parrainage_credit_ticket` |
| Lots | table `lots` (`type` tirage / instantané) | `se_lots` (organisateur, `rang`, `phase`) + `lots` des stations | différent (2 tables) | `lib/superEventLots.ts`, `ParcoursCreation.tsx:791-805` |
| Formulaire de lot | complet obligatoire (règle 24/11) | libellé + valeur (grand tirage) | à unifier | ECARTS E4 |
| Phases (avant / pendant) | sans objet | oui, sauf Nuits du Sud | Super Event seul | `lib/superEventPhases.ts` (`SE_SANS_PHASES = ['se-nds-2026']`) |
| Péremption des tickets | `date_limite_tirage` | aucune pour NDS | exception en dur | `lib/mesLots.ts:54, 129, 134`, SQL `date_limite_tirage` |
| Jouer sur place | non imposé (anti-fraude : 1 fois / jour / compte) | sur place par défaut ; géofence 150 m seulement sur la page carte | différent | `lib/parcours.ts:275-287` (`geofence_m`, `geo_controle`) |
| QR | 2 QR inclus puis 10 € HT (provisoire) ; QR suivis | QR des stations ; pas de QR de suivi dans la création | différent | `ParcoursCreation.tsx:601` (`qrPossibles`), `lib/qrTraces.ts` |
| Paiement | 445 € HT 1re année ; commande | sur étude, pas de prix public | différent | `ParcoursCreation.tsx:447` (`avecCommande`), `lib/reglement.ts` |
| Entrée du pro | crée | REJOINT par demande (le SA approuve), ou propose la création à Flowin ; le SA rattache direct | différent | RPC `approuver_demande_rattachement` ; `ParcoursCreation.tsx:322, 326` |
| Univers du joueur | couleurs du commerçant | comics (« t-super »), orange pour l'admin | différent | `lib/masters/engine.ts:454, 892`, `lib/masters/css.ts:463-479`, `lib/charte.ts` (`ACCENT_SUPER`) |
| Écran de jeu | `/jouer?ev=` | `/jouer?se=` + carte, tickets, « en cours » | COMMUN : même moteur | `app/jouer/page.tsx:49-109`, `JouerClient.tsx:157, 374-437` |
| Carte | carte publique des commerces | carte des stations | COMMUN : même lib | `components/carte/maplibre.ts` |
| CRM du pro | 1 ligne par animation `ev:<id>` | 1 ligne par Super Event `se:<id>` | COMMUN : même RPC `crm_pro` | `_crm_pro_interne` (clé `cle`) |
| Stats | RPC `operation_stats`, `pro_*` | une trentaine de RPC `super_event_*` (anon exécutable, agrégats) | différent, à comparer | liste en base, 25/11 |

## 2. Où la règle du Super Event est mélangée à celle de l'animation
| Lieu | Nature | Mesure |
|---|---|---|
| `components/creation/ParcoursCreation.tsx` | un composant, deux produits : `estSuper`, `rejoindre`, `sa` combinés | 50 `estSuper`, lignes 326-1584 |
| `lib/parcours.ts` | moteur historique : attribution, géofence, partenaires | `super_event_id` lignes 51, 179-215, 275-287, 611, 637, 805 |
| `lib/masters/engine.ts` + `app/jouer/*` | moteur actuel : écrans `sj-*` du Super Event dans le même fichier que l'animation | `engine.ts:454, 804-892` ; `JouerClient.tsx:157, 374-437` |
| `lib/mesLots.ts`, `lib/moiTicketsGains.ts`, `lib/masters/tickets.ts` | profil du joueur : lots et tickets des deux mondes | 8 + 7 + 6 occurrences |
| `lib/superEventPhases.ts`, `lib/nds.ts`, `lib/demoFetes.ts` | exceptions par identifiant (`se-nds-2026`, fêtes du Haut et Moyen Pays) | 44 occurrences dans 21 fichiers .ts/.tsx |
| `public/dashboard.html` | idem, côté monolithe | 12 `se-nds-2026` |
| SQL | 5 fonctions de règle distinctes + 5 fonctions `*attribu*` / `*gain*` | `appliquer_regle_gain`, `se_attribuer_partie`, `attribuer_lot` (2 versions), `attribuer_gain_joueur`, `_attribuer_gain_interne` |
| RLS | `flowin_est_pro_super_event(se)` = organisateur du Super Event (`super_events.pro_id`) lit TOUTES les participations de ses stations ; un pro simple lit les siennes | politiques `participations_lecture_sa_pro_moi`, `se_tickets_lecture_sa_pro`, `visites_lecture_sa_pro` |

## 3. Proposition : un seul fichier de règles (sans toucher NDS2026Client)
`admin/lib/reglesEspaces.ts` exporterait, pour `type = 'animation' | 'super'` :
`jeuxPermis`, `recompenses` (tirage / instantané), `lanceurTirage`, `table des lots`, `avecPhases`, `peremption`, `surPlace`, `qr`, `paiement`, `couleur`.
Chaque appelant lit ce fichier au lieu de recopier un test. Les valeurs exceptionnelles de NDS deviennent des réglages du Super Event (`super_events.cfg_jeu`), pas des identifiants. Ordre : écrire le fichier et ses tests, brancher `ParcoursCreation`, puis `lib/mesLots.ts`, puis `lib/parcours.ts`. `NDS2026Client.tsx` n'est jamais branché (il lit sa propre config).

Non vérifié : le détail des 30 RPC `super_event_*` (on a seulement vérifié qu'elles sont exécutables par `anon`, comme agrégats : leur contenu n'a pas été relu une à une) ; la page `/se/[se]` en production.
