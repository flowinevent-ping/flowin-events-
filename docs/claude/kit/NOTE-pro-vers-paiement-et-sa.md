# Note de transmission du 25/11/2026 : Pro vers Paiement et Super Admin
Aucun montant ici : tous les prix sont dans `REGLES.md` (rubrique Prix et offres) et `admin/lib/reglement.ts`.
Schémas : page « Super Event et offres » (artifact de la session Pro).

## Pour l'entrée Paiement
1. Offres : one-shot (une diffusion, flashs par QR) ou abonnement annuel (CRM, import clients, diffusion au CRM, rapport sexe et âge). Détail dans `REGLES.md`.
2. Facture à construire pour l'animation (1re animation, 1er abonnement), sur le modèle de la facture des Nuits du Sud : reprendre jeu, lots, dates, QR supplémentaires, option Flowin, RIB.
3. Virement : coder complet mais laisser `PAIEMENT_ACTIF=false`. Préparer Wero (sans frais) comme 2e moyen.
4. Grille de prix VALIDÉE le 25/11 dans `REGLES.md` : à coder. Copies à aligner : `lib/reglement.ts`, `public/bon-commande-pdf.js`, `bon-commande-animation.html`, `cgv-animation-magasin.html` (art. 4 et 6) et le trigger SQL `sql/2026-11-10-lot-a.sql` (SQL de production : accord de Romain d'abord). Seul point ouvert : lecture de l'option questions (150 € = première animation avec quiz).

## Pour l'entrée Super Admin
1. Rubrique « Demandes de création » (organisateur : identité, coordonnées, type d'événement, description, rappel).
2. Rubrique « Demandes de participation » (pro : nom du Super Event concerné).
3. Page commandes : « paiement à vérifier » existe, à garder.

## Pour l'entrée Jeux et tirages
Banques de questions : une par pro, non partagée ; les banques communes deviennent des modèles copiés. À valider avec Romain.

## Mise à jour du code des prix (préparée le 25/11, à faire en une seule livraison)
Pourquoi en une fois : le trigger SQL recalcule les prix à la facturation ; changer l'application seule fabriquerait des factures différentes du bon de commande.
1. `lib/reglement.ts` : `PRIX_ANIMATION` (lancement 445 vers 450 ; supprimer `mensuelle` ; quiz one-shot 150 ; tombola ou roue one-shot 90 ; option questions Flowin 150 ; remise 1re animation 50 %) ; `OFFRES_ANIMATION` sans « Mensuelle » ; `prixOptionQuiz` ; QR en plus 7 (one-shot) et 3,50 (abonné).
2. Consommateurs : `Configurateur.tsx` (écran Validation : choix « une fois » ou « abonnement » avant le récapitulatif), `animationMagasin.ts` (`mensuelleHt`), `app/dashboard/commercial/page.tsx`, `ParcoursCreation.tsx`.
3. Copies : `public/bon-commande-pdf.js` (PRIX), `bon-commande-animation.html` (boutons d'offre, prix de l'option), `cgv-animation-magasin.html` (art. 4 et 6 : texte juridique à faire relire par Romain).
4. Base de production : `sql/2026-11-10-lot-a.sql` à remplacer par un nouveau script (constantes c_lancement, c_mensuel, c_quiz). Jamais appliqué sans l'accord de Romain.
5. Écran de choix de formule : maquette « Maquettes Pro à valider », écran 1, à faire valider avant de coder.
