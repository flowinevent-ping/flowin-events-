# Lot 6 : maquettes à valider (24/11/2026)

Maquettes seulement : aucun code d'application, aucune écriture en base. Même style que le lot 5 (`lot5/lot5.css` repris). Format 390 x 844, logos réels (`admin/public/nds/partenaires/`, logo Super Event de `lot4/`). Chiffres, prénoms, noms, QR (dessinés, non scannables) = exemples. Pour chaque sujet : un HTML, un PNG « ensemble », un PNG par écran.

| Sujet | Fichier | Écrans |
|---|---|---|
| A. Lot avec aperçu du ticket | `lot6-A-lots` | roue (quoi, combien, lot suivant), quiz + bonus (2), tombola (2) |
| B. QR par support, Mes QR | `lot6-B-qr` | QR créés, Mes QR (flashs), un QR (imprimer, copier), confirmer le remplacement, nouveau QR |
| C. Accueil du commerce | `lot6-C-accueil` | animations, Super Event (statut), lots à retirer, statistiques, rejoindre en 3 écrans |
| G. Compte joueur sans mot de passe | `lot6-G-compte-joueur` | Mes tickets, e-mail, e-mail reçu, code, connecté, invitation écran d'accueil et rappels, vue ordinateur |

## A. Lot : champs réels et nouveauté
Existant (`Configurateur.tsx` 41, 430-442 ; `lib/pro.ts` 192-204) : intitulé, conditions, quantité, validité (sans limite, en jours, du … au …). Valeur : colonnes `lots.valeur` et `valeur_euros` existent, mais le configurateur envoie 0 (`Configurateur.tsx` 237) : jamais saisie aujourd'hui. Gain immédiat : un lot par joueur et par jour.
Nouveau : « cessible à un tiers » n'existe nulle part en base. Aujourd'hui le billet est au porteur et « en faire profiter un ami » marche pour tous ; `lot.html` 290 affiche « incessible » par défaut (contradiction à trancher). Il faudrait une colonne `lots.cessible`.
Un lot visible à la fois, deux volets (quoi, combien), lot suivant en carrousel. Ticket en direct : texte « à retirer tout de suite » pour roue et quiz (aucun mot « tirage »), « tirage le [date] » pour la tombola.

## B. QR
Existant : 3 QR par défaut et supports (`lib/qrTraces.ts` 27-45, 92-96), flashs par QR (`fetchStatsQr`, `visites.source`), permalien `/q/code`, page « QR désactivé » (`app/q/[code]/route.ts` 68, `publie = false`), création d'un QR (`creerQrTrace`). Le pro ne peut qu'archiver (le QR reste valable) ; masquer est réservé au Super Admin (`QrTraces.tsx` 261-264).
Nouveau : écran unique « Mes QR » côté pro, bouton « Remplacer ce QR » (désactiver + créer en un geste). À vérifier : droits de mise à jour du pro sur `qr_stations.publie`.

## C. Accueil
Existant : animations, scanner `/pro/scanner`, packs (`PACKS_DEMANDE`), statistiques du lot 5 E (maquette). Statuts demandé / accepté / en cours : à brancher sur `cfg.diffusion_demandee.statut` (non vérifié). Sons : le bouton couper reste en haut à droite des écrans joueur, rien côté commerçant.

## G. Compte joueur
Existant : lien e-mail sans mot de passe (`lib/connexionJoueur.ts`), identité gardée dans le téléphone. Nouveau : code à 6 chiffres dans le même e-mail (modèle d'e-mail à adapter, comportement d'envoi : accord de Romain requis), invitation écran d'accueil puis rappels, jamais bloquante.

## Décisions à demander à Romain
1. Cessible : oui ou non par défaut ? « Cessible : non » interdit « en faire profiter un ami » pour ce lot.
2. Valeur en euros : on la demande (facultative) ?
3. Désactiver un QR : le pro le fait seul, sans confirmation Flowin ?
4. Logo Marché U : seul « Utile Vence » existe dans le dépôt.
5. Code à 6 chiffres : accord pour modifier le modèle d'e-mail de connexion.
6. Rappel d'invitation écran d'accueil : une fois par semaine au plus, d'accord ?

## Non vérifié
Rendu sur téléphone réel, QR scannables, statuts Super Event en base, droits du pro sur `qr_stations`, e-mail à code.
