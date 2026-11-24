# Mémoire : critique-innovation (créée le 21/11/2026 ; ≤120 lignes)

## Décidé ou rejeté : ne pas re-proposer (source)
- Accroche « Un événement. Tous ses partenaires. Un seul jeu. » rejetée (ARG, DEC 09/11). « Sonder son public, c'est avoir les moyens de répondre » rejeté comme titre.
- Pas de campagne d'acquisition : on travaille sur l'existant et le flux capté, en local (DEC 10/11). L'inscription gratuite des commerces (DEC 08/11) était « à intégrer à la réflexion » : ne pas la relancer sans Romain.
- Pas de pari sur la photo ; animation de qualité et vidéo interactive (DEC 08/11).
- Super Event = toujours tirage au sort ; tirage piloté par Flowin, pas de bouton orga (DEC 19-20/11). Gain immédiat : 1 lot par joueur et par jour. Tickets : 1 quiz + 1 bonus par station et par jour, +1 par parrainage.
- Les « +5 points d'assiduité » sont Flow-révision, autre produit : rien à ajouter (DEC 20/11).
- Prix : 445 € la 1re année, puis 990 €/an ou 110 €/mois ; pistes 99 € non tranchées, ne pas annoncer (PRIX 10/11). Super Event organisateur : pas de prix public.
- Données jamais vendues, échangées ni commercialisées ; 3 cases de consentement inchangées.
- Ne jamais faire jouer ni tester le jeu aux commerçants dans les plaquettes.

## Déjà existant (ne pas recréer)
- Offrir son lot à un ami ; parrainage ; carte des commerces ; import du fichier client ; QR de suivi par support ; annonces des commerces dans /moi (in-app) ; banque de questions bonus ; 2 phases Super Event.

## Mesures de référence (21/11/2026, SELECT)
- 842 joueurs, 480 optin (57 %), 10 parrainages (1,2 % des joueurs). Chiffres de communication à garder exacts : « 56 % », « Plus de 70 lots ».
- Données NDS : `docs/RESULTATS-NDS2026-cloture.md`, `docs/NDS2026_nouveaux_inscrits_par_station_par_jour.csv`.

## Format du pré-mortem
Chantier / 3 causes d'échec probables / 1 test bon marché / critère d'arrêt / coût en jours. Rapport seulement.

## Journal des passages
- 21/11/2026 : premier passage (voir AMELIORATIONS.md : AMEL-INN-01 à 03).

## Historique 6 mois (Notion, importé le 24/11/2026). Sources : voir SOURCES.md (PIL, HUB, REP27, REP03)
- 28/06 · Cap posé dans PIL : généraliser l'animation digitale RÉCURRENTE aux commerces, commerçants, producteurs ; NDS 2026 = vitrine. Une proposition « équipe d'agents » (orchestrateur + 5 rôles, config pack par projet) existait déjà, planifiée après le festival (PIL) : c'est l'ancêtre des agents actuels, ne pas la re-proposer.
- 14/07 · PWA installable proposée (90 % du ressenti pour 5 % de l'effort) : non validée à l'époque ; vérifier AMELIORATIONS.md avant de la re-proposer (HUB 14/07).
- 14/07 · Le gisement mesuré est l'abandon PENDANT le quiz (102 sur 198) : le formulaire ne perd personne (HUB 14/07).
- 27/07 · Demandes explicites de Romain jamais construites alors : page pro « super events en cours + simulation » (net-new, REP03 point 15), consultation de banques de 100+ questions sans scroll infini (REP27 point 5), 3 degrés d'insertion super event (non confirmés).
- 02/09 · Distinction posée par Romain : demande de participation, duplication d'édition, création directe par le SA : trois chemins à ne pas fusionner par une idée « simplificatrice » (HUB 02/09).
- 03/09 · Table `event_modeles` (modèles de jeu marque blanche) créée puis alimentée par `lib/modeles.ts` : idée déjà réalisée, ne pas la re-proposer (REP03).
