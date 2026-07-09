# 2026-07-09 — Parcours jeu : champs obligatoires + suppression écran d'accueil au flash

Demande Romain (règle canonique, valable pour TOUTES les stations, pilotée par config) :
- Première connexion -> accès DIRECT au quiz -> quiz -> bonus -> coordonnées EN TOTALITÉ (chaque champ obligatoire) -> valider.
- Reconnexion (flash autre station) -> reconnexion email OU persistance (service worker) -> direct au quiz de la station.
- Brigade Verte tablette = pareil (compte créé, reconnexion email).

Correctifs (NDS2026Client.tsx) :
1. SKIP ÉCRAN D'ACCUEIL : au montage, si on arrive par un flash (QR ?ev=) ou par la carte, et que la station
   n'est pas déjà jouée aujourd'hui + a un quiz -> setScreen('quiz') direct (plus d'écran d'accueil « Je joue »).
   Exceptions conservées : place=1 (carte), reseaux-*+joueur local (refusdigital), station déjà jouée (récap « déjà flashé »).
   Pas de perte : toutes les stations ont un quiz -> impossible d'atteindre le ticket sans jouer.
2. CHAMPS OBLIGATOIRES : submitInscription exige désormais prénom, nom, email, TÉLÉPHONE, CODE POSTAL, ÂGE, GENRE.
   Seul l'opt-in marketing reste facultatif (RGPD). Messages d'erreur ajoutés sous tél/sexe/âge/CP (comme prénom/nom/email).
   (Champ « comment tu as connu le festival » laissé facultatif = enquête, pas une coordonnée — à confirmer si Romain le veut obligatoire.)

Config déjà en place (vérifiée) : 17 stations (bars, caisses, écran/digital, brigade verte, 7 partenaires) ont toutes
  quizBanques + 4 questions + 5 bonus en base. Parcours 100% piloté par events.cfg, pas codé en dur.
Validé : tsc --noEmit 0 erreur + next build OK.
