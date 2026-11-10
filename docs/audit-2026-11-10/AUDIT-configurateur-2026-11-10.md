# Audit du configurateur pro — 10/11/2026

Parcours pro de la première visite à « en ligne », avant et après le configurateur dicté par Romain le 10/11.
Mesures Playwright (390 × 844 et 1280 × 900), pro `pro-qa-tech-1`, écritures Supabase interceptées (aucune écriture en base).

## Avant (état au commit 11bf48dc)

Parcours `/pro/nouvelle` (ParcoursCreation) puis publication en carrousel ; mesures reprises de la vérification du 10/11 (e2e publication v2) et du code.

| # | Écran | Champs / clics | Défilement à 390 × 844 |
|---|---|---|---|
| 0 | Que voulez-vous faire ? (3 cartes) | 1 clic | — |
| 1 | L'animation : nom, dates début / fin | 3 champs + Suivant | page longue (aperçu du jeu dessous) |
| 2 | Jeu : grille de 5 jeux + banque de questions + bonus + aperçu | 2 à 4 clics + Suivant | page longue |
| 3 | Lots : nom, quantité, valeur, type, conditions, tirage, publication des gagnants | 2 à 6 champs + Suivant | **3 725 px** (4,4 écrans) |
| 4 | Publication · diffusion | Suivant | aucun |
| 5 | Publication · QR (formulaire QR tracé à remplir) | Suivant | aucun |
| 6 | Publication · logo (**bloquant**) | 2 clics (Précédent + fichier) | aucun |
| 7 | Récapitulatif + Publier | 1 clic | aucun |
| 8 | En ligne : QR | — | 852 px (léger) |
| 9-17 | Bon de commande (si PAIEMENT_ACTIF) : 9 écrans, SIRET / coordonnées ressaisis | ~15 champs | aucun |

- **Écrans** : 8 jusqu'à « en ligne » (17 avec le bon de commande).
- **Actions** : 17 au minimum avec une tombola sans quiz (e2e du 10/11), sans demande de quiz Flowin possible dans ce chemin.
- **Problèmes de design** : 3 étapes en pages longues (contraire à « carrousel, pas de scroll ») ; nom et dates d'animation demandés alors qu'inutiles à l'acquisition ; 5 jeux en grille avec aperçu ; logo bloquant ; quiz Flowin ouvert par un mail, sans SIRET ni adresse dans la demande (crm_retours) ; aucune validité de lot ; kit physique seulement dans le bon de commande ; coordonnées ressaisies dans le bon.

## Après (configurateur, `components/creation/Configurateur.tsx`)

Un écran = une idée, carrousel (points, Précédent / Suivant, glisser), choix uniques qui avancent seuls.

| # | Écran | Contenu | Défilement 390 × 844 |
|---|---|---|---|
| 1 | Vos coordonnées | prénom, nom, téléphone, email, commerce, SIRET, adresse, CP, ville — prérempli depuis le profil, **sauté si complet** | aucun |
| 2 | Choisissez votre jeu | 4 cartes illustrées (Quiz, Quiz + bonus, Roue, Tombola), une ligne chacune | aucun |
| 3 | Vos questions (quiz) | « Je rédige mes questions » / « Je demande à Flowin… » (~~145 €~~ 72,50 € HT) | aucun |
| 4 | L'équipe Flowin rédige votre quiz | thème, commerce (prérempli), à faire connaître / sonder | aucun |
| 4b | Vos questions (si je rédige) | banque existante ou « j'écris après » (3 exemples à remplacer) | aucun |
| 5 | Vos lots | exemples (remise, bon d'achat, produit offert), un lot à la fois : libellé, quantité, conditions, validité sans limite / en jours / du … au … | aucun |
| 6 | Où diffusez-vous votre jeu ? | supports à cocher, un QR « Flowin Animation » par support | aucun |
| 7 | Votre kit | Kit digital (inclus) / impression du kit physique (149 € HT par boutique) | aucun |
| 8 | Récapitulatif | jeu, quiz, lots, supports, kit — chacun avec « Modifier » (retour direct au récapitulatif) | aucun |
| 9 | Flowin vous remercie | ~~990 € HT/an~~ 445 € HT, ~~145 €~~ 72,50 € HT, kit, total — « Valider mon bon de commande » | aucun |
| 10 | Votre jeu est en ligne | facture par email, quiz sous 72 h ; si PAIEMENT_ACTIF : QR de virement + copier + SEPA | aucun |
| 11 | Espace pro | bloc de bienvenue, 3 messages | 910 px (page d'accueil existante) |

- **Écrans** : 9 jusqu'à la validation (10 avec les coordonnées), bon de commande inclus (il n'y a plus de bon séparé à remplir).
- **Actions** : 22 avec quiz + Flowin + 2 lots + 3 supports + kit physique + coordonnées incomplètes (24 avec un aller-retour « Modifier »), contre 17 + ~25 (bon de commande) avant pour un parcours plus pauvre.
- **Défilement** : 0 px sur les 12 écrans du configurateur à 390 × 844 (avant : 3 725 px à l'étape lots).
- À 1280 × 900 : +44 px sur toutes les pages pro, y compris hors configurateur (ProShell : barre de 54 px + filet), non lié au configurateur.

## QR avec logo

`lib/qrLogo.ts` : correction H, pastille « Flowin Animation » au centre (26 % de la largeur). Décodés par jsQR à 360 px : 6 / 6
(`…/parcours/quiz?ev=…&source=en-magasin`, `…&source=affiche`, `…&source=reseaux-instagram-2`). Appliqué aussi aux QR de Diffusion (PNG et SVG).

## Points pour Romain

- Pas de page d'import CSV du fichier client : le lien « importer votre fichier client » mène à « Mes données ».
- Validité « du … au … » : pas de colonne en base ; dates gardées dans `events.cfg.lots` (`validiteDu`, `validiteAu`), `lots.validite_jours` reste vide. Une colonne `lots.valide_du / valide_au` serait nécessaire pour que les billets l'appliquent.
- Kit physique : enregistré dans `events.cfg.commande.kit` et passé au bon de commande (`&kit=physique`) ; aucune demande d'impression n'est créée tant que PAIEMENT_ACTIF = false.
- Nom de l'animation : posé automatiquement (« Jeu <commerce> »), modifiable ensuite dans l'opération.
