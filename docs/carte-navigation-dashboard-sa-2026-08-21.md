# Carte de navigation — dashboard SA (état réel au 21/08/2026)

Réponse directe à « où se trouve tout ça ? ». Chaque ligne = un système réellement en prod, avec son URL exacte. Rien de fabriqué ici : uniquement ce qui existe et a été vérifié dans le code pendant cette session.

## 1. Tirage au sort manuel + billets + gagnants + emails

| Système | Où | État |
|---|---|---|
| Tirer un nom manuellement (par pro/partenaire) | `/pro/tirage?pro=<id>` | Existe, fonctionne. Bug de fond connu et non corrigé cette session (voir "Reste à faire") |
| Visuel du billet gagnant (celui du joueur) | `nds/billets-partenaires.html?t=<retrait_token>` | OK |
| Retrait sur place (scan QR + PIN pro) | fonctions `consulter_lot` / `valider_lot` | OK, audité 01/08 |
| Liste de tous les gagnants (vue SA) | `/dashboard/gagnants` | Corrigé ce soir (lisait la mauvaise table) |
| Historique des lots gagnés par un joueur précis | Fiche Joueur → onglet **Lots gagnés** | Corrigé ce soir (même cause que ci-dessus) |
| Texte de l'email au gagnant | `nds/mail-gagnant.js` | OK, source unique déjà consolidée |

## 2. QR codes, liens trackés, visuels de diffusion par station/prestation

| Système | Où |
|---|---|
| Origines du trafic (clics par lien/QR, par partenaire) | `/dashboard/track-qr` |
| QR codes physiques des stations (fichiers réels) | `admin/public/nds/qr/*.png` |
| Génération de QR à la volée (billet, event) | `api.qrserver.com`, utilisé dans `ProClient.tsx` et `EventDrawer` |
| Lien digital + QR tracké + visuel par partenaire (Kit com) | `/dashboard/nds-comm` (QR + logo ajoutés ce soir) |

## 3. Liste des stations de jeu : joueurs, horaires, stats, réponses

| Système | Où |
|---|---|
| Résultat par jour et par station (festival + commerces) | `/dashboard/nds-resultat` — lignes cliquables depuis ce soir |
| Détail d'une station (participants, stats) | Cliquer une station → fiche event (onglets Stats/Participants) |
| Rapport détaillé (points, passages) | `/dashboard/rapport-points` |
| Statistiques & démographie (sexe/âge/origine) | `/dashboard/statistiques` |
| Liste brute des participants | `/dashboard/nds-participants` |

## 4. Docs commerciales et parcours de souscription (events / super event)

| Système | Où |
|---|---|
| Bons de commande (par partenaire) | `/dashboard/nds-bon-commande` — fiche détail ajoutée ce soir |
| Catalogue des packs (Visibilité/Animation/Sponsor officiel) | `/dashboard/nds-packs` |
| CGV & légal | `/dashboard/cgv` |
| Créer un nouvel event (« plug and play ») | `/dashboard/wizard-event` |
| Approuver une demande de participation à un super event | `/dashboard/demandes-rattachement` |
| Parcours pro réel — créer une animation | `/pro/jeu?pro=<id>` |
| Parcours pro réel — rejoindre un super event | `/pro/rejoindre` (connexion requise) |

## 5. Ce qui manque vraiment — pas retrouvé, à construire

La fiche d'un bon de commande (`/dashboard/nds-bon-commande`, panneau ajouté ce soir) ne contient **pas** :
- un aperçu de la facture/du devis en PDF
- un aperçu de l'email envoyé au client
- l'annonce réseaux sociaux liée à ce partenaire

Ces trois éléments existent ailleurs (Kit com partenaire pour l'email/réseaux) mais **pas rassemblés dans la même fiche**. C'est probablement ce qui donne l'impression que « tout a disparu » : dans l'ancien monolithe, une fiche partenaire réunissait sans doute tout ça au même endroit ; la migration Next.js a séparé ces briques en plusieurs pages distinctes. **Non corrigé ce soir** — chantier à part entière, pas une correction rapide.

## 6. CRM par type d'entité

| Entité | Où | Exemple |
|---|---|---|
| Joueurs | `/dashboard/joueurs` | liste + fiche complète |
| Pros (comptes SaaS, y compris organisateurs comme Service événementiel Ville de Vence = `pro-nds-2026`) | `/dashboard/pros` | fiche → onglets infos/events/tracking |
| Commerces partenaires (Allianz Charvolin, Nook, etc.) | `/dashboard/partenaires` | fiche dédiée par partenaire |

## Non résolu

- `/pro/tirage` (et les autres sous-onglets de `ProClient.tsx` : gains, participants, lots, export) utilisent encore une logique de filtrage par joueur reconnue comme peu fiable — signalé plus tôt ce soir, pas corrigé (composant partagé par tous les pros, trop risqué à modifier en fin de session sans test dédié).
- Le regroupement facture/devis/email/annonce dans une fiche unique par partenaire (point 5 ci-dessus) n'existe pas encore.
