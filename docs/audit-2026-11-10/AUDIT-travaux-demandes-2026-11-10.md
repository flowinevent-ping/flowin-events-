# Audit des travaux demandés (10/11/2026, soir)

Ce document vérifie, point par point, si ce que Romain a demandé (plan du 10/11 et audit lots A à H) est bien en place dans l'application, et si cela tient debout.

Méthode : lecture du code, puis l'application lancée en vrai sur un ordinateur de test, avec le compte de test `pro-qa-tech-1`. Pendant l'essai, **aucune écriture n'est partie vers la base de production** (toutes les demandes d'enregistrement étaient interceptées et simulées).

Légende de l'état : **fait** / **partiel** / **pas fait**.

## 1. Plan du 10/11 (Lots 0 à 8)

| Demandé | État | Preuve | Correction faite aujourd'hui | Reste à faire |
|---|---|---|---|---|
| Lot 0 · 5 films, QR de fin | partiel | Registre L15 « En cours » | — | Finir les films (hors code) |
| Lot 1 · « Découvrir nos offres » sur l'écran Bienvenue | fait | `components/pro/PremiereFois.tsx:593` | — | Deux autres boutons gardent « Choisir mon offre et signer » (`AccesBloque.tsx:45`, `HistoriqueCommandes.tsx:109`) : ils mènent au bon de commande, libellé à confirmer par Romain |
| Lot 1 · Offres en carrousel / côte à côte | partiel | Côte à côte sur ordinateur (`ParcoursCreation.tsx`, bloc `data-reglement`) ; pas de carrousel mobile | — | Carrousel mobile |
| Lot 1 · Grille 445 / 990 / 110 | fait | `lib/reglement.ts:15-23`, bon de commande `bon-commande-animation.html:489`, CGV `cgv-animation-magasin.html:63,79` ; vérifié à l'écran : 445 / 990 / 110 / 72,50 / 145 € HT | — | — |
| Lot 2 · Bug « Charvolin » (mauvais établissement) | fait | `components/pro/ProShell.tsx:115-133` : si la session appartient à un autre pro, bascule sur le bon | — | Vérifier avec un vrai nouveau compte |
| Lot 2 · Guide « Complétez votre profil » pour un nouveau pro | pas fait | Aucun texte « Complétez votre profil » dans `app/`, `components/` ; l'espace vide affiche « Aucune animation pour le moment » | — | Ajouter le guide |
| Lot 3.1 · Point d'entrée en carrousel | partiel | `/pro/nouvelle` : 3 cartes côte à côte (Créer une animation · Rejoindre un super event · Proposer un super event), pas de carrousel | — | Carrousel avec points |
| Lot 3.2 · Choix du jeu, un seul à la fois | partiel | Liste de 5 jeux visibles ensemble + aperçu à droite (constaté à l'écran) | — | Carrousel un jeu à la fois |
| Lot 3.3 · Quiz : trois boutons (Flowin / moi-même / IA) | partiel | « Je n'ai pas de questions : demander à Flowin », « 3 questions suggérées », « + Créer une banque » existent ; pas de bouton « Assistance IA » ; demande Flowin = ligne CRM, pas d'email (`lib/pro.ts` `enregistrerDemandeQuiz`) | — | Trois boutons nommés comme le plan ; bouton IA désactivé |
| Lot 3.4 · Roue : éditeur de segments | fait | `ParcoursCreation.tsx` éditeur segments, contrôle `segmentsOk` | — | — |
| Lot 3.5 · Lots et conditions | partiel | `components/masters/SelecteurLot.tsx` (nom, quantité, mode, conditions) ; pas de date de validité structurée | Couleurs passées au bleu | Date de validité du lot |
| Lot 3.6 · Publier → QR automatique | fait | `qrUrl` dans `lib/pro.ts` ; QR ajoutés `enregistrerQr` (`ParcoursCreation.tsx:670`) ; QR par défaut `lib/qrTraces.ts:106` (créés à l'affichage) | — | Créer les QR par défaut dès la publication |
| Lot 3.7 · Statut « En ligne » | partiel | Statut `pending` puis `upcoming` à la déclaration du virement (`lib/pro.ts`, `bon-commande-animation.html:914-960`) | — | Vérifier l'étiquette sur la vraie animation |
| Lot 3.8 · QR par destination, impression | fait (à vérifier en vrai) | `components/operations/QrTraces.tsx` (lien, PNG, SVG, affiche) | Couleurs passées au bleu | Recette impression et scan |
| Lot 3.9 · Modifier / supprimer lots, relancer | partiel | `FicheOperationPro.tsx` (gérer les lots) ; pas de « Renommer » ni d'archivage des QR | — | Renommer / archiver un QR ; blocage suppression d'un lot déjà gagné |
| Lot 4 · Station jeu OU sponsor | partiel | Choix persona dans `ParcoursCreation.tsx` (rejoindre un super event) | — | Vérifier le choix exclusif et les textes courts |
| Lot 5 · Scanner + explication | fait | `/pro/scanner` : « Le client présente son billet : scannez-le, vérifiez, validez la remise. Le stock se met à jour tout seul. » | — | — |
| Lot 5 · Bouton « Relancer des lots » | pas fait | Aucun texte « Relancer des lots » dans le code | — | Ajouter |
| Lot 6 · Une seule demande d'autorisation | partiel | `app/jouer/JouerClient.tsx:229-233` (écran Flowin puis demande du téléphone) | — | Une seule explication, mémoriser l'accord |
| Lot 6 · Profil joueur, jeux en cours par commerce, gagnés / perdus | partiel | `app/moi/page.tsx:28-46` lit seulement les tickets super event et les gains | — | Animations, perdus, date du tirage |
| Lot 6 · Carte des partenaires (GPS) | partiel | `/jouer` « autour de moi », carte par super event | — | Carte commune |
| Lot 7 · Import fichier client (L13) | pas fait | Aucun import dans `components/pro/CrmPro.tsx` | — | À faire |
| Lot 7 · Calcul emails (L14) | pas fait | En pause (décision) | — | — |
| Lot 1 bis · Commande au moment de publier | fait | Écran « Nos offres » + options quiz Flowin et customisation, bon pré-rempli, « Signer mon bon de commande » (`ParcoursCreation.tsx`, commit ed04f289) | — | Recette complète avec un vrai virement |
| Lot 1 bis · Alerte « paiements à vérifier » au super admin | fait | `admin-commandes-animation.html:126-148` ; fonction `notify-commande-animation` déployée | — | — |
| Lot 1 bis · Mandat SEPA | partiel | `app/api/paiement/gocardless/route.ts` ; dépend de la configuration GoCardless | — | Vérifier GoCardless |
| Lot 1 bis · CGV (reconduction, défaut de paiement, prorata 110 €/mois) | fait | `cgv-animation-magasin.html:63-82` | — | Relecture par Romain |
| Lot 8 · Carte des commerces (bleu / orange / violet) au super admin | pas fait | `app/dashboard/nds-carte/page.tsx` : carte Nuits du Sud seulement | — | À faire |

## 2. Audit du 10/11 (lots A à H)

| Demandé | État | Preuve | Correction faite aujourd'hui | Reste à faire |
|---|---|---|---|---|
| A · Prix uniques sur les trois documents | fait | `lib/reglement.ts`, `bon-commande-animation.html:489`, CGV ; vérifié à l'écran | — | — |
| A · « Tarifs à confirmer » retiré | fait | Plus présent dans le parcours d'animation | — | — |
| A · Bouton « Signer mon bon de commande » | fait | `ParcoursCreation.tsx` (`data-signer-bon`) | — | — |
| A · Déclaration du virement → en ligne + alerte + email | fait | `bon-commande-animation.html:914-960`, SQL `sql/2026-11-10-lot-a.sql` appliqué | — | — |
| B · Logo du commerce dans le jeu | partiel → **corrigé** | Avant : le logo n'était repris que pour un super event (`ParcoursCreation.tsx:536,612`) | Le logo du profil pré-remplit le jeu et est enregistré dans l'animation (`ParcoursCreation.tsx`, chargement du logo et appel `creerAnimation`) | Vérifier sur une vraie animation |
| B · Bloc logo du profil toujours visible | partiel | `/pro/compte` affiche « Logo de l'établissement » ; `EntrepriseForm.tsx:50` ne fait rien sans fiche partenaire | Couleurs violettes retirées (`EntrepriseForm.tsx:108,111`) | Message si pas encore de fiche commerce |
| C · QR créés à la publication | partiel | `QrTraces.tsx:130` (création à l'affichage) | — | Appel juste après la publication |
| C · Renommer / archiver un QR | pas fait | Aucun « Renommer » | — | À faire |
| D · Sécurité de l'adresse `?pro=` | **à décider** | `ProShell.tsx` : sans session, l'espace du pro de l'adresse s'ouvre (c'est ce qui permet le compte de test et l'aperçu super admin) | Pas de correction possible sans changer la base | Voir « À décider » |
| D · Bandeau « consultation super admin » | pas fait | — | — | À faire |
| E · Carrousels, date de validité, contrôle suppression de lot | partiel | Voir Lot 3 | — | À faire |
| F · Plus de violet dans l'espace pro | partiel → **corrigé** | Violets restants dans les écrans lots, diffusion, tirage, QR, banques | Remplacés par le bleu #3B5CC4 : `SelecteurLot.tsx`, `DiffusionOperation.tsx`, `ReglageTirage.tsx`, `QrTraces.tsx`, `BlocsOperations.tsx`, `DataOperation.tsx`, `ModalGererLots.tsx`, `ModalPartenaires.tsx`, `ModelesBanques.tsx`, `CopierCommune.tsx`, `EntrepriseForm.tsx` | Couleur du super admin : décision Romain |
| G · Joueur (autorisation, /moi, carte) | partiel | Voir Lot 6 | — | À faire |
| H · Carte SA et import client | pas fait | Voir Lots 7 et 8 | — | À faire |

## 3. Essai en vrai (application lancée)

- 30 pages ouvertes (espace pro complet, création d'animation jusqu'au choix du jeu, bon de commande, CGV, page joueur, landing, Nuits du Sud) : **aucun plantage, aucun lien cassé**.
- Une seule erreur répétée sur toutes les pages pro : lecture d'une colonne « droits » qui n'existe pas encore en base (`ProShell.tsx`, `lireDroitsPro`). Sans gravité : tout le menu reste visible. Elle disparaîtra quand le SQL `06-droits-pro` sera appliqué.
- Vitesse : toutes les pages se chargent en moins de 3,2 s sur la machine de test ; les plus lentes sont `/pro/nouvelle` (3,1 s), `/pro` (2,8 s), `/pro/rejoindre` (2,8 s). Aucune page ne dépasse 300 kB de code (la plus lourde : `/pro/nouvelle`, 245 kB). Rien à corriger en urgence.
- Le bon de commande ouvert seul (sans passer par l'espace pro) affiche « à compléter » : normal, le pré-remplissage vient de l'espace pro.

## Corrigé aujourd'hui
1. Le logo du commerce est repris automatiquement dans le jeu publié (`admin/components/creation/ParcoursCreation.tsx`).
2. Plus de violet dans les écrans de l'espace pro : lots, diffusion, tirage, QR, banques de questions, profil (11 fichiers listés plus haut).

## À décider par Romain
1. **Sécurité** : aujourd'hui, quelqu'un qui connaît l'identifiant d'un pro peut ouvrir son espace par l'adresse `?pro=` sans être connecté, et la page du bon de commande met à jour l'animation avec la clé publique. Le corriger demande de changer les règles d'accès de la base (connexion obligatoire, exception pour le super admin et le compte de test). À valider avant toute modification.
2. Libellé des boutons « Choisir mon offre et signer » restants (accès bloqué, historique) : garder ou passer à « Découvrir nos offres ».
3. Couleur du super admin : garder le violet comme identité du super admin, ou passer au bleu.
4. Ordre des chantiers restants : carrousels (Lot 3), guide « Complétez votre profil », « Relancer des lots », profil joueur, carte des commerces, import fichier client.
5. Méga bug Révision : réglages Supabase / Vercel à faire par Romain (voir le plan).
