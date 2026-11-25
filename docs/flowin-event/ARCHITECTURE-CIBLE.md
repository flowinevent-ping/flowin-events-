# Architecture cible : 4 espaces, 1 noyau commun (25/11/2026)

Principe : chaque espace est une VUE et des DROITS différents sur le MÊME noyau. On corrige un bouton, une couleur, un formulaire de lot ou une règle de jeu à un seul endroit, dans le noyau.

```
 ESPACE 1 : SUPER ADMIN        ESPACE 2 : PRO / ANIMATION     ESPACE 3 : SUPER EVENT        ESPACE 4 : PARTICIPANT
 /dashboard/*                  /pro/*                         /se/*  /rejoindre  /sponsor   /jouer /moi /q /carte-commerces
 prospection, paiement,        jeu, lots, QR, carte,          univers propre, règles        scanner, jouer, billets,
 publication, vérification     CRM de SON fichier             proches de l'animation        profil, carte
        |                              |                              |                              |
        +--------------+---------------+--------------+---------------+------------------------------+
                       v                               v
        +---------------------------------- NOYAU COMMUN (lib/ + components/commun) ----------------------------+
        |  Création d'animation (1 écran, 1 fonction creerAnimation)   Moteur de jeu /jouer (lib/masters)       |
        |  Lots + tickets (1 formulaire, table lots / se_lots)         QR : /q/<code>, qr_stations, qrTraces     |
        |  Carte (components/carte, maplibre.ts)                       E-mails (supabase/functions/_shared)      |
        |  CRM : crm_pro (niveau pro) / crm_participants (niveau Flowin)   Design : charte.ts + masters/css.ts   |
        |  Règles par type : reglesEspaces (animation | super)  [à créer]                                       |
        +------------------------------------------------+-------------------------------------------------------+
                                                         v
        SUPABASE : events (+super_event_id) | super_events | lots | se_lots | qr_stations | pros | partenaires
                   joueurs | participations | se_tickets | tirages | visites | demandes_rattachement_super_event
                   RLS : SA voit tout ; pro voit SES events / SON CRM ; participant voit SES lignes
```

## Flux de données (de gauche à droite)
1. Le pro (ou le SA pour lui) crée une animation : `events` + `lots` + `qr_stations`, `pro_id` = le pro.
2. Le pro rejoint un Super Event : demande (`demandes_rattachement_super_event`), le SA approuve, la station reçoit `super_event_id` (RPC `approuver_demande_rattachement`).
3. Le participant scanne `/q/<code>`, arrive sur `/jouer` : `participations`, `visites`, et si `super_event_id` : `se_tickets`.
4. Le fichier client = `joueurs` + `participations` : lu par `crm_pro` (un pro) ou `crm_participants` (Flowin, SA seul).

## Tableau des espaces
| Espace | Qui | Règles propres | Écrans (dépôt actuel) | Tables principales |
|---|---|---|---|---|
| 1 Super Admin | Romain, administrateurs | prospection, paiements, publication, vérification, tirage Super Event, droits des pros | `app/dashboard/*` (56 pages, 9 760 lignes), `components/dashboard` (6 280), monolithe `public/dashboard.html` | `pros`, `commandes_animation`, `bons_commande`, `prospection`, `flowin_super_admins`, `controles_qualite` |
| 2 Pro / Animation | commerçant, association | un jeu par animation ; plusieurs animations ; tirage ou gain immédiat ; son CRM | `app/pro/*` (31 fichiers, 1 516 lignes), `components/pro` (5 970), `components/creation` (3 112) | `events`, `lots`, `qr_stations`, `partenaires`, `clients_commerce` |
| 3 Super Event | organisateur (pro) + commerces stations | TOUJOURS tirage ; 2 phases (sauf NDS) ; tirage piloté par Flowin ; stations rejoignent par demande | `app/se`, `app/rejoindre`, `app/sponsor`, `app/pro/super`, `components/operations` | `super_events`, `se_lots`, `se_tickets`, `se_reponses`, `demandes_rattachement_super_event`, `tirages` |
| 4 Participant | joueur, sans mot de passe | 1 ticket quiz + 1 bonus / station / jour ; consentement 3 cases | `app/jouer`, `app/moi`, `app/q`, `app/carte-commerces`, `lib/masters` (2 340 lignes) | `joueurs`, `participations`, `visites`, `parrainage`, `tirages` |

## Noyau commun : état et cible
| Brique | Aujourd'hui | Cible |
|---|---|---|
| Création d'animation | 2 écrans (Configurateur, ParcoursCreation), 1 écriture | 1 écran |
| Lots / tickets | 4 à 5 formulaires (voir ECARTS 4) | 1 formulaire |
| QR | `qrTraces.ts` + `QrTraces.tsx`, partagé | inchangé |
| Carte | 2 composants (`SuperEventMap`, `CarteCommerces`) sur 1 lib `maplibre.ts` | 1 composant à 2 modes |
| E-mails | `supabase/functions/_shared/mailer.ts` + 8 dossiers de fonctions dans le dépôt (7 déployées, `send-resultat-tirage` neutralisée) | inchangé, ajouter le suivi |
| CRM | 2 RPC fermées (23/11) | inchangé, voir CRM-ET-STATS.md |
| Design | `charte.ts`, `masters/css.ts`, `globals.css`, `flowin-tokens.css`, `flowin-theme.css`, `nds2026Design.ts` | 1 jeu de jetons, `nds2026Design.ts` intouché |
| Règles par type | dispersées | 1 fichier `reglesEspaces.ts` (REGLES-ESPACES.md) |

Contraintes respectées : `NDS2026Client.tsx` et `nds2026Design.ts` jamais touchés (extraction AUTOUR) ; miroir dashboard MD5 identique ; aucune baisse de sécurité ni de consentement.
