# Lot 3 : maquettes à valider (23/11/2026)

Méthode de Romain : audit, maquette, validation, puis construction. Ici : maquettes seulement, aucun code d'application, aucune écriture en base. Format 390 x 844, CSS seul, animations légères (coupées si `prefers-reduced-motion`). Chaque fichier a ses PNG (un par écran + un d'ensemble). Les chiffres marqués « exemple » sont fictifs ; SIRET et téléphone restent `[… à compléter]`.

## Ce que change chaque maquette
1. `lot3-1-inscription.html` : inscription pro en 3 écrans (Vous + SIRET, Activité, Compte), progression 1/3 à 3/3, coche à chaque étape, fin « Configurer mon jeu » en 1 toucher. Secteur détaillé, produits, points de vente, logo : dans « Mon profil », rien supprimé (AMEL-VIS-03, DES-07, DES-08).
2. `lot3-2-rejoindre.html` : rejoindre un Super Event en 3 écrans d'une hauteur (Station, Pack, Envoi). Identité reprise du profil, 4 tarifs en accordéon, résultat avec QR (AMEL-VIS-04, DES-05).
3. `lot3-3-passages-attendus.html` : bloc « Passages attendus » en fourchette « 4 à 67 · estimation d'après NDS 2026 » (écran Rejoindre et tête de l'espace pro) ; hors NDS « pas assez de données » ; après achat, le réel remplace (AMEL-VIS-06).
4. `lot3-4-configurateur.html` : liste des écrans avant et après, puis 4 écrans pré-remplis (Jeu, Lots, Diffusion, Validation) (AMEL-VIS-07, DES-03, dépend d'ERG-05).

## Les gestes avant / après (VISION-ERGONOMIE.md, mesure Playwright 23/11, démo)
| Parcours | Avant | Après (maquette) |
|---|---|---|
| Inscription pro | 10 écrans + fin, 10 touchers, environ 11 champs | 3 écrans + fin, 3 touchers + 1 (fin), 5 champs (téléphone facultatif) |
| Rejoindre | 4 écrans de 3,1 / 1,9 / 2,6 / 3,7 hauteurs, 5 touchers, 7 champs, 384 mots | 3 écrans d'une hauteur, 3 touchers, 0 champ, moins de 50 mots par écran |
| Configurateur Roue | 7 écrans + fin, 7 touchers | 4 écrans + fin, 5 touchers |
| Configurateur Quiz | 9 écrans, 10 touchers | 5 écrans, 7 touchers |
| Prévision | rien avant achat | lue sans toucher, sur l'écran Rejoindre et en tête de /pro |

Mesure à refaire après construction (règle d'acceptation, section 5 de VISION).

## À ne pas casser
- Consentement : 3 cases, aucune cochée, e-mails inchangés. L'inscription pro n'a pas de case : rien n'est ajouté ni retiré.
- Droits pro `en_attente`, validation Flowin, brouillon d'inscription, e-mail de confirmation ; `crm_retours` et données du bon de commande (mêmes colonnes).
- « Valider mon bon de commande » (jamais « signer »), mention « Tarif à confirmer par Flowin », prix du code (445 € HT).
- Prévision : toujours une fourchette, jamais un chiffre seul ; hors NDS « pas assez de données ». Réserves : visiteurs distincts par navigateur, très grand écart selon l'emplacement.
- Ne pas toucher `NDS2026Client.tsx`, `nds2026Design.ts`, `SpinClient.tsx`. Orange = Super Event, bleu = animation, ni violet ni emoji.

## Décisions pour Romain
1. Un seul champ mot de passe avec œil (maquette) ou garder les deux champs.
2. Retirer secteur détaillé, produits, points de vente de l'inscription (reportés dans Mon profil).
3. Sortir « Jeu » et « Lots » du parcours Rejoindre (le lot du pack est affiché ; la saisie des lots passe après validation) : oui ou non.
4. « Passages » = visiteurs distincts (mesure) ; faut-il aussi parler de « vues » ? Définition attendue.
5. Fusionner « Collectivité » et « Collectivité / Festival » (liste de secteurs).

## Non vérifié
QR de station actif avant validation ; confirmation d'e-mail à l'inscription (réglage non lisible) ; appareils réels. La RPC de prévision doit être validée par securite-donnees.
