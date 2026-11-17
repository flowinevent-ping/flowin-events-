# Expert 5 — Espace pro & Super Admin : ergonomie / responsive (17/11/2026)

Périmètre : 27 écrans pro (`/pro/**`, mode démo `?demo=1&pro=pro-charvolin`) + 51 écrans SA (`/dashboard/**`, session SA simulée, écritures interceptées) + `dashboard.html`, en 390×844 et 1280×900.
Outil : Playwright sur un `next start` d'une copie de build (scratchpad). Captures avant/après et `planche.png` : `scratchpad/audit17/pro-sa/`.
Aucune fonction retirée (règle « pas de régression »).

## Constats (avant)
- **Grave** — Tableaux SA illisibles sur téléphone : colonnes coupées au bord (Joueurs, Pros, Gagnants, Prospection, Participants NDS, Rapport points, CRM pro…) et listes interminables : Joueurs **40 654 px**, Prospection **42 796 px**, Participants NDS **51 701 px** de défilement.
- **Moyen** — Cibles tactiles < 44 px : bouton menu pro 18×18, fermeture du menu 27×24, burger SA 28×28, points du carrousel 9×9, puces/onglets/champs à 31–36 px.
- **Moyen** — Colonnes kanban (Rapports pro, Historique, Pilotage) de 268 px coupées au bord de l'écran.
- **Mineur** — Emails de connexion : plantage `e.filter is not a function` si la réponse n'est pas une liste.
- Pas de débordement horizontal du document (0 px partout). Charte bleue cohérente pro/SA.
- `dashboard.html` (vanilla) : pas de débordement ; 52 cibles < 44 px sur téléphone (outil desktop) — non modifié pour ne pas toucher au monolithe sans validation.

## Corrections livrées
1. **`components/dashboard/TablesMobiles.tsx`** (monté dans `DashboardShell` et `ProShell`) : sous 760 px, tout tableau ≥ 4 colonnes (ou plus large que l'écran) devient une **pile de cartes** (une carte par ligne, libellé de colonne à gauche, valeur à droite). En-tête conservé en bandeau défilant (**tri conservé**), clics de ligne conservés, recherche inchangée. **10 lignes puis « Afficher 10 de plus (N restants) »** : fin des listes interminables. Ordinateur inchangé. Exclusion possible : `data-garder-table`.
2. Zones de toucher ≥ 44 px sur téléphone : boutons, listes, champs (pro et SA), menu/fermeture, burger SA, points du carrousel (zone 44 px, point visuel inchangé).
3. Kanban sur téléphone : une colonne = un écran, glissement aimanté (carrousel).
4. Emails de connexion : garde `Array.isArray`.

## Nombre de gestes pour les actions clés (téléphone)
| Action | Chemin | Gestes |
|---|---|---|
| Publier (pro) | barre basse « Nouvelle » → configurateur carrousel | 1 + étapes du configurateur (inchangé) |
| Créer un QR (pro) | Animations → carte animation → onglet Diffusion → Ajouter | 4 (inchangé) |
| Voir son rapport (pro) | Contacts → Rapports | 2 |
| Valider un lot (scanner) | barre basse « Scanner » → code → Ouvrir | 1 + saisie |
| Exporter ses contacts (pro) | Contacts → Export CSV | 2 (bouton visible sans défiler la liste désormais repliée) |
| Relancer des lots (pro) | Contacts → Gagnants & tirage → Relancer | 3 |
| Créer un pro (SA) | menu → Pros → Créer | 3 |
| Voir les gagnants (SA) | menu → Gagnants | 2 ; liste lisible en cartes (avant : tableau coupé) |
| Envoyer en masse (SA) | menu → Envoi en masse | 2 |

## Métriques par écran (390×844)
Note : « cibles < 44 » avant comptait aussi les éléments du menu replié hors écran ; la mesure après les exclut. Hauteur = hauteur du document (sur ordinateur, le SA défile dans un panneau interne ; 0 débordement horizontal partout, aux deux tailles). Certaines pages pro/SA grandissent légèrement : les cartes montrent toutes les colonnes qui étaient auparavant coupées.

| Écran | 390 scroll avant→après | 390 cibles<44 avant→après | tableaux coupés avant→après | erreurs console 390 avant→après |
|---|---|---|---|---|
| /pro/banques/nouvelle | 844 → 1105 | 24 → 9 | 0 → 0 | 0 → 0 |
| /pro/banques | 5571 → 5870 | 51 → 1 | 0 → 0 | 0 → 0 |
| /pro/com | 1952 → 1961 | 25 → 23 | 0 → 0 | 0 → 0 |
| /pro/commandes | 844 → 844 | 3 → 1 | 0 → 0 | 0 → 0 |
| /pro/compte | 1152 → 1155 | 24 → 1 | 0 → 0 | 0 → 0 |
| /pro/connexion | 868 → 868 | 3 → 3 | 0 → 0 | 0 → 0 |
| /pro/contrat | 859 → 1560 | 8 → 3 | 1 → 0 | 0 → 0 |
| /pro/crm | 1250 → 1879 | 18 → 3 | 1 → 0 | 0 → 0 |
| /pro/donnees/import | 844 → 844 | 3 → 1 | 0 → 0 | 0 → 0 |
| /pro/donnees | 1250 → 1879 | 18 → 3 | 1 → 0 | 0 → 0 |
| /pro/entreprise | 1152 → 1155 | 24 → 1 | 0 → 0 | 0 → 0 |
| /pro/events | 1952 → 1961 | 25 → 23 | 0 → 0 | 0 → 0 |
| /pro/historique | 844 → 844 | 3 → 1 | 0 → 0 | 0 → 0 |
| /pro/inscription | 868 → 868 | 5 → 5 | 0 → 0 | 0 → 0 |
| /pro/jeu | 844 → 844 | 19 → 8 | 0 → 0 | 0 → 0 |
| /pro/lots | 1952 → 1961 | 25 → 23 | 0 → 0 | 0 → 0 |
| /pro/nouveau-mot-de-passe | 868 → 868 | 2 → 2 | 0 → 0 | 0 → 0 |
| /pro/nouvelle | 844 → 844 | 19 → 8 | 0 → 0 | 0 → 0 |
| /pro/operation | 844 → 844 | 4 → 2 | 0 → 0 | 0 → 0 |
| /pro | 1952 → 1961 | 25 → 23 | 0 → 0 | 0 → 0 |
| /pro/parcours | 1285 → 1295 | 7 → 4 | 0 → 0 | 0 → 0 |
| /pro/premiere-fois | 868 → 868 | 5 → 5 | 0 → 0 | 0 → 0 |
| /pro/rejoindre | 2296 → 2385 | 21 → 7 | 0 → 0 | 0 → 0 |
| /pro/scanner | 844 → 844 | 4 → 2 | 0 → 0 | 0 → 0 |
| /pro/super | 844 → 844 | 5 → 3 | 0 → 0 | 0 → 0 |
| /pro/tirage | 937 → 938 | 4 → 1 | 0 → 0 | 0 → 0 |
| /pro/tracking | 937 → 938 | 4 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/apercu-pro | 2671 → 2708 | 37 → 3 | 0 → 0 | 0 → 0 |
| /dashboard/banques | 9436 → 11983 | 214 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/btob-prospects | 921 → 921 | 33 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/carte-reseau | 916 → 916 | 2 → 2 | 0 → 0 | 1 → 1 |
| /dashboard/cgv | 921 → 921 | 28 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/commandes-animation | 844 → 844 | 6 → 6 | 1 → 1 | 1 → 1 |
| /dashboard/commercial | 2216 → 4031 | 33 → 6 | 2 → 0 | 0 → 0 |
| /dashboard/controle | 1039 → 1039 | 28 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/crm-landing | 2570 → 2992 | 73 → 11 | 2 → 0 | 0 → 0 |
| /dashboard/crm-pro | 921 → 921 | 34 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/crm-retours | 921 → 1163 | 35 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/demandes-rattachement | 970 → 1053 | 40 → 2 | 0 → 0 | 0 → 0 |
| /dashboard/emails-connexion | 916 → 921 | 2 → 1 | 0 → 0 | 1 → 0 |
| /dashboard/envoi-masse | 1326 → 1417 | 41 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/events | 921 → 968 | 53 → 8 | 0 → 0 | 0 → 0 |
| /dashboard/gagnants | 6663 → 3183 | 76 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/jeux | 5195 → 5214 | 32 → 5 | 0 → 0 | 0 → 0 |
| /dashboard/joueurs | 40654 → 3911 | 2465 → 29 | 1 → 0 | 0 → 0 |
| /dashboard/landing-page | 9147 → 9258 | 198 → 154 | 0 → 0 | 0 → 0 |
| /dashboard/maintenance | 1552 → 1552 | 57 → 31 | 0 → 0 | 0 → 0 |
| /dashboard/nds-bon-commande | 921 → 2543 | 32 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/nds-carte | 1371 → 1425 | 52 → 26 | 0 → 0 | 0 → 0 |
| /dashboard/nds-comm | 2559 → 2631 | 30 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/nds-front | 3753 → 4264 | 45 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/nds-lots | 8193 → 10097 | 248 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/nds-media | 3153 → 3592 | 91 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/nds-packs | 1663 → 1795 | 46 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/nds-participants | 51701 → 7149 | 43 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/nds-resultat | 3524 → 3603 | 36 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/operations | 1549 → 900 | 25 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/outils-commerciaux | 9147 → 9258 | 198 → 154 | 0 → 0 | 0 → 0 |
| /dashboard | 1894 → 1894 | 24 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/parametres | 1565 → 1565 | 27 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/parcours | 1158 → 1168 | 26 → 4 | 0 → 0 | 0 → 0 |
| /dashboard/partenaires | 1150 → 2843 | 52 → 11 | 1 → 0 | 0 → 0 |
| /dashboard/pilotage | 1067 → 1067 | 34 → 5 | 0 → 0 | 0 → 0 |
| /dashboard/planning | 921 → 921 | 24 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/pros | 1301 → 4460 | 58 → 12 | 1 → 0 | 0 → 0 |
| /dashboard/prospection | 42796 → 2900 | 39 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/rapport-points | 5364 → 8656 | 27 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/rapports | 921 → 921 | 22 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/roadmap | 9742 → 9760 | 31 → 2 | 0 → 0 | 0 → 0 |
| /dashboard/statistiques | 1505 → 1705 | 64 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/super-events | 921 → 921 | 43 → 9 | 0 → 0 | 0 → 0 |
| /dashboard/theme-parcours | 921 → 921 | 26 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/track-qr | 2200 → 2655 | 24 → 1 | 1 → 0 | 0 → 0 |
| /dashboard/wizard-event | 985 → 985 | 31 → 2 | 0 → 0 | 0 → 0 |
| /dashboard/wizard-pro | 921 → 921 | 34 → 1 | 0 → 0 | 0 → 0 |
| /dashboard/wizard-super-event/ancien | 1957 → 1993 | 31 → 4 | 0 → 0 | 0 → 0 |
| /dashboard/wizard-super-event | 1488 → 1532 | 32 → 1 | 0 → 0 | 0 → 0 |
| /dashboard.html | 844 → 844 | 64 → 52 | 0 → 0 | 0 → 0 |

## Reste à faire (proposé)
- Remplacer les filtres empilés du CRM pro par un bouton « Filtres » repliable.
- Banques (pro/SA) et Lots NDS : grilles de cartes longues → regroupement par rubrique repliable.
- `dashboard.html` : mêmes règles 44 px sur téléphone (après validation Romain).
- Carte réseau SA : erreur `g.map` (fichier en cours de modification par un autre expert, non touché).
