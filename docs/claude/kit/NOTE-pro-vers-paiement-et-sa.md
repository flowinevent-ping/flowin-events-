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
