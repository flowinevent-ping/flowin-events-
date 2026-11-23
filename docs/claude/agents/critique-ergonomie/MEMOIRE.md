# Mémoire : critique-ergonomie (créée le 21/11/2026 ; ≤120 lignes)

## Déjà fait ou décidé : ne pas re-proposer (source)
- Carrousel, jamais de longue page ; peu de texte ; moins d'actions ; police ≥ 13 px, zones ≥ 44 px (DEC « RÈGLES D'INTERFACE », REGLES.md).
- Coordonnées en 2 volets sans défilement à 390 x 844 ; gestes jusqu'au ticket réduits : quiz + bonus 29 vers 21, quiz solo 22 vers 14, roue 13 vers 10, tombola vers 10 (audit 17/11, EXPERT-1).
- Parrainage en fin de parcours (décidé 17/11) ; profil /moi en 5 rubriques, QR plein écran en 1 toucher ; carte MapLibre avec itinéraire en un geste.
- Pro et SA mobiles : tableaux en cartes par 10, cibles 44 px, kanban en carrousel (EXPERT-5).
- Défauts E2E 20/11 corrigés : listes pro fraîches, QR « live », texte du bouton « Terminer le tirage », « Pas de lot cette fois ».

## Déjà ouvert chez produit-ergonomie (ne pas redoubler)
- Charte bleu / orange définitive (REGISTRE L11) ; filtres CRM pro repliables ; banques et lots NDS par rubrique ; conditions NDS « 25 octobre » sur `lot.html` ; « Commerce partenaire — » cosmétique.

## Mesures de référence (21/11/2026, SELECT, table `visites`, tous événements confondus, non filtré par événement : à préciser au prochain passage)
- Visiteurs distincts par étape : onboard 769, quiz 761, resultats 420, final 339, inscription 374, carte 162, bonus 158, tickets 54, partenaires 53, profil 35. 2943 lignes sans `etape`. `err:reprise-reseau` : 98 lignes, 37 visiteurs.
- joueurs 842, optin 480 (57 %), parrainages 10.

## Pièges
- La RPC `visites_entonnoir` existe ; vérifier ses paramètres avant de l'appeler. Une étape n'est pas forcément ordonnée : ne pas lire le tableau comme un entonnoir strict sans le dire.
- Ne pas tester sur de vrais clients ; `?demo=1` = aucune écriture.
- Appareils réels (iPhone, Android, caméra) : non testables ici, marquer « non vérifié ».

## Journal des passages
- 21/11/2026 : premier passage (4 propositions, voir AMELIORATIONS.md : AMEL-ERG-01 à 04).
- 23/11 : mesure par événement quiz vers résultats -23 % à -47 % sur 6 événements NDS (NDS seulement) ; `visites` vient de NDS2026Client et parcours-tracking, pas du moteur masters ; métiers de banques existants : restaurateur, pizzeria, boulanger, boucher, libraire ; AMEL-ERG-05 à 09 proposées.
