# Audit design et ergonomie : parcours pro et organisateur (23/11/2026)

Auteur : critique-ergonomie. Proposition seulement : aucun code ni donnée modifié. Complète `VISION-ERGONOMIE.md` (budgets de gestes, AMEL-VIS-01 à 08) sans la reprendre : ici, écran par écran, les défauts de design mesurés et les gains de « c'est fait ».
Méthode : build `next build` d'une copie de `admin/` (HEAD 471b1aad), `next start` port 43871, Playwright Chromium 390 x 844, `?demo=1`. Script de mesure : débordement horizontal (scrollWidth), hauteur de page, mots visibles, polices < 13 px, cibles < 44 px, contraste (ratio WCAG), teintes violettes, emoji. 0 requête non GET vers supabase.co (vérifié par l'écouteur de requêtes : liste vide à chaque parcours). Captures : scratchpad `ergo/shots/` (non versionnées).
Lecture : « gestes » = touchers pour quitter l'écran ; « champs » = champs à remplir (obligatoires) ; « fait ? » = moment de complétion ; gravité 1 (mineur) à 3 (bloque ou casse une règle de Romain). Mesures fiables sauf : le texte blanc sur dégradé bleu sort en faux « contraste 1 » (fond en image, non résolu) : ignoré, le bleu #3B5CC4 sur blanc fait 5,9:1.

## Parcours A : inscription pro puis animation (Quiz rédigé par Flowin, coordonnées connues)
| Étape | Gestes | Champs | Mots | Fait ? | Automatique possible | Défauts de design mesurés | Gr. |
|---|---|---|---|---|---|---|---|
| Intro 1-3 (promesse, 445 €, offres) | 3 | 0 | 78/63/70 | non (3 écrans de lecture) | « C'est parti » dès l'écran 1 (ordre des offres figé par Romain : on garde les écrans) | « Déjà un compte ? » 107x32 et passe sur 2 lignes (« ? » seul) ; pastilles 30x44 ; page 868 px (24 px de scroll) ; 7 textes < 13 px (Espace pro 10,5) | 1 |
| 1 Vous | 1 | 3 (+2 facultatifs) | 59 | non | email vu en 1er champ si lien venu d'un mail | 931 px de haut : bouton Continuer collé au bord bas ; 5 barres de retour 47x6 px (cibles) ; 14 textes < 13 px | 1 |
| 2 Entreprise (recherche) | 3 (saisie, Rechercher, choix) | 1 | 104 | non | choisir « Commerce » par défaut est déjà fait | après choix : 5 champs éditables, page 1284 px (1,5 écran) au lieu d'une carte « C'est bien vous ? » ; liste de résultats 1452 px | 2 |
| 3 Secteur | 2 | 0 | 70 | non | NAF 10.71C (boulangerie) affiché « Industrie manufacturière », aucune suggestion, rien de présélectionné | « Collectivité » et « Collectivité / Festival » en double ; jargon « code NAF » | 2 |
| 4 Produits | 1 (+saisie) | 1 | 61 | non | thème et produits déduits du secteur (AMEL-ERG-05) | RAS | 1 |
| 5 Adresse | 1 | 3 repris de l'annuaire | 66 | non | déjà repris | RAS | 0 |
| 6 Points de vente | 1 | 0 (1 par défaut) | 65 | non | écran sans décision : mettre dans le profil (AMEL-VIS-03) | 15 cibles < 44 px (puces 1/2/3/5/10, − et +) | 2 |
| 7 Compte | 1 | 2 (mot de passe x2) | 116 | non | récapitulatif de 9 lignes + 9 « Modifier » repris à l'écran : inutile si 3 écrans | page 1137 px ; 18 cibles < 44 ; 29 textes < 13 px | 2 |
| Fin inscription | 1 | 0 | 95 | OUI : coche bleue, « Bienvenue chez Flowin », « Inscription : faite » | aller directement au Configurateur (aujourd'hui : accueil pro puis 2e bouton) | si pas de session : « Me connecter » après « cliquez le lien de l'e-mail » : l'élan casse ; « Découvrir nos offres » 178x43 (1 px sous 44) | 3 |
| Accueil pro (bienvenue) | 1 | 0 | 155 | partiel (carte 3 étapes) | bouton « 1. Créer ma première animation » = lien direct | 3 boutons 36 px de haut ; « Animations et super events », « Configurer mon jeu » en 11 px (sous-titres du menu), « Établissement » 10 px ; chip « Rejoindre un Super E… » coupée | 2 |
| Config. 0 Coordonnées (si SIRET ou téléphone manquants) | 1 | 9 vides ou presque | 87 | non | n'afficher que les champs manquants : l'inscription laisse téléphone et SIRET facultatifs, le Configurateur les exige (`coordKo`) | 9 champs : redemande ce qui est connu | 3 |
| Config. 1 Jeu | 1 (avance seul) | 0 | 76 | non (la carte s'allume 160 ms) | Quiz présélectionné (jeu majoritaire) | pastilles de progression 30x44 | 1 |
| 2 Gain, 3 Qui rédige | 1 + 1 (avancent seuls) | 0 | 48/54 | non | idem : choix « Flowin rédige » par défaut | RAS | 0 |
| 4 Thème du quiz | 1 + saisie | 1 (+1 facultatif) | 41 | non | thème prérempli par le secteur (AMEL-ERG-05) | « Suivant » grisé sans dire pourquoi avant le toucher ; **dénominateur de progression : 7, puis 9, puis 10 écrans** selon les choix | 2 |
| 5 Lots | 2 (exemple + Suivant) | 1-3 | 52 | non | 3 exemples cliquables = bien ; quantité 10 et « Sans limite » repris | RAS (cibles 44) | 0 |
| 6 Supports et QR | 1 | 0 (2 précochés) | 63 | partiel : vrais QR visibles, « 2 QR inclus » | QR en grand (106 px aujourd'hui) | 11 puces ; QR 106 px non scannables à l'écran en confort | 1 |
| 7 Kit, 8 Récap | 1 + 1 | 0 | 52/63 | non | kit digital par défaut = déjà ; fusionner kit et récap | 6 « Modifier » : texte lien sans zone de 44 px de haut | 1 |
| 9 Prix | 1 | 0 | 72 | non | | « Flowin vous remercie. » AVANT d'avoir validé ; bouton « Valider mon bon de commande » et « ← Précédent » cassés sur 2 lignes | 2 |
| Fin « Votre jeu est en ligne » | 1 | 0 | 42 | OUI (coche verte) mais pauvre : 1 titre, 1 phrase, 1 bouton « Mon espace pro » ; aucun QR, aucune affiche | QR et affiche à cet écran (AMEL-VIS-02) | vert #15803D différent du vert « ok » de la charte #00897A et des jetons #0B7A4F : 3 verts de succès ; 844 px vide en dessous | 3 |
| Après publication (carte de bienvenue) | 1 | 0 | 125 | non | la carte dit « Votre QR code est utilisable dès maintenant » mais n'a aucun lien vers le QR (seulement « importer votre fichier client » 318x37 et « ajouter votre logo » 122x17) | liens trop petits ; page 1045 px | 3 |
| Affiche et QR dans l'animation (code, non capturé) | ≥ 4 | 0 | n/a | non | un bouton « Affiche A4 » au premier niveau | `QrTraces.tsx` : boutons 12 px de police, 6+6 px de marge (≈ 29 px de haut), 22 occurrences de texte 10-12 px, glyphes ▲ ▼ comme icônes | 2 |

## Parcours B : organisateur (Super Event). Partiel : l'assistant SA exige une connexion Super Admin
| Étape | Gestes | Champs | Mots | Fait ? | Automatique possible | Défauts de design | Gr. |
|---|---|---|---|---|---|---|---|
| `/pro/nouvelle?type=super` (3 cartes + demande à Flowin) | 1 carte puis 1 envoi | 6 (nom, période, projet, personne, téléphone, email) | 83 | inconnu (confirmation non parcourue) | personne, téléphone, email = déjà dans le profil : 3 champs en moins | **page de 1971 px** (3 cartes empilées + formulaire) : contraire à « carrousel, jamais de scroll » ; sous-titre « avec à droite le jeu tel que vos clients le verront » faux sur mobile (pas de « droite ») | 3 |
| `/pro/super` sans Super Event | 0 | 0 | 44 | non | bouton « Rejoindre un super event » dans l'état vide | cul-de-sac : « Vous ne participez à aucun super event. » sans action | 2 |
| Assistant SA `wizard-super-event`, phases, lots, participants | | | | | | NON VÉRIFIÉ (connexion SA requise) ; relu dans `ParcoursCreation.tsx` (1608 lignes) seulement | |

## Parcours C : rejoindre un Super Event comme station (`/rejoindre`, visiteur sans compte)
| Étape | Gestes | Champs | Mots | Fait ? | Automatique possible | Défauts de design | Gr. |
|---|---|---|---|---|---|---|---|
| 1 Super event | 2 (carte + Suivant) | 0 | 126 | non | un seul Super Event ouvert : présélection ; carte qui avance seule | **2439 px**, **largeur 395 px (5 px de débordement horizontal)** ; encadré bleu de 7 lignes « Vous parcourez sans compte… » ; pastilles d'étape 36 px de haut, 10 px de police ; contraste « Super » jaune sur blanc 1,3:1 (logo comics, décoratif) | 3 |
| 2 Jeu | 1 | 0 | 90 | non | écran sans décision (AMEL-VIS-04) | 1472 px | 2 |
| 3 Lots | 2 | 1-3 | 97 | non | exemples de lots cliquables comme dans le Configurateur | 1921 px ; bonne idée : étapes faites passent en coche verte | 2 |
| 4 Diffusion et QR | 1 (Envoyer) | 9 dont 8 obligatoires + 2 mots de passe + 4 cases | 112 | non | commerce, ville déjà connus après 1re saisie | **3890 px** : création de compte noyée dans la page ; 14 cibles < 44 px | 3 |
| Fin « Demande envoyée » | 1 | 0 | 101 | partiel : texte vert, statut « En attente (24-48 h) » ; pas de coche, pas de QR de station | afficher « Votre QR sera prêt à la validation » et un bouton clair | « Message » en fond lavande = violet #7A4FE0 à 10 % (`ParcoursCreation.tsx:169`) ; « Message », « Appeler » 35 px de haut, 12,5 px ; « Participer à un autre » 217x16 | 2 |

## Parcours D : fichier client et premier regard CRM
| Étape | Gestes | Champs | Mots | Fait ? | Automatique possible | Défauts de design | Gr. |
|---|---|---|---|---|---|---|---|
| 1 Fichier | 2 (Choisir + sélecteur système) | 0 | 65 | non | glisser-déposer inutile sur mobile | « 1. Fichier » en 11 px (barre d'étapes) ; 20 textes < 13 px | 1 |
| 2 Colonnes | 1 | 8 listes, 4 déjà devinées (Prénom, Nom, Email, Téléphone) | 59 | non | sauter l'écran quand tout est deviné (AMEL-VIS-01) | 8 listes affichées dont 4 « Aucune » | 2 |
| 3 Aperçu | 1 (« Importer 3 contacts ») | 0 | 68 | non | | bouton avec le chiffre = bon retour | 0 |
| 4 Fin | 1 (« Voir mes contacts ») | 0 | 49 | OUI : « Fichier importé » + 2 compteurs (0 et 0 en démo, effet de la démo) | compteur qui monte (AMEL-VIS-01) | titre vert #00897A (teal) ≠ vert #15803D du Configurateur | 1 |
| CRM, première vue (`/pro/donnees?onglet=crm`) | 1 | 0 | 64 | non | en démo : « Connectez-vous pour voir vos contacts » (lecture avec session du pro, correctif 98c2f58d) : liste NON VÉRIFIÉE | lien « Me connecter » en bleu navigateur #0000EE souligné (hors charte), 96x17 ; onglet « Rapports d'activité » coupé sans repère de défilement ; `/pro/crm` redirige en perdant `?pro=` | 2 |

## Fiches de notes (mesures de l'ensemble)
- Polices < 13 px : barre du bas du pro (« Animations, Nouvelle, Scanner, Contacts, Profil ») 11,5 px sur TOUTES les pages pro ; sous-titres du menu 11 px ; étiquettes d'étape 10 à 12,5 px.
- Cibles < 44 px relevées : 36 (boutons de bienvenue, pastilles d'étape /rejoindre), 35 (aide), 32-17 (liens), 30 de large (pastilles de progression), 6 de haut (barres de retour de l'inscription).
- Violet : 0 occurrence rendue dans les pages parcourues, MAIS 1 rendue sur /rejoindre (fond lavande) hors du script (teinte trop peu saturée) et, par `grep` : `ParcoursCreation.tsx:169`, `BanqueEditor.tsx` (rgba(122,79,224) x4 + ACC), `PartenaireSheet.tsx:42`, `app/pro/super/[event]/page.tsx:101`, `CarteCommerces.tsx:253`, `lib/documentsAnimation.ts:210`, `lib/carteReseau.ts:39`. `docs/DESIGN-TOKENS-flowin.md` et `public/flowin-tokens.css` définissent encore `--fl-violet` #7A4FE0 comme « accent ». `SpinClient.tsx` (#7C3AED dans la roue) et `NDS2026Client.tsx` : protégés, signalés seulement.
- Emoji : 0 (le « ✓ » est un caractère typographique, accepté par le garde-fou). Débordement horizontal : 1 page (`/rejoindre`, +5 px). Longueur : 9 pages parcourues dépassent 1 hauteur (jusqu'à 3890 px).

## Fiche de score par parcours
| Parcours | Écrans | Gestes (touchers) | Champs obligatoires | Moments « fait » forts / écrans | Pages > 1 hauteur |
|---|---|---|---|---|---|
| A inscription (Compte + Config.) | 11 + fin ; 10 + fin | 13 + 2 de liaison ; 10 (+1 et 9 champs si coordonnées) | 7 ; 1 | 2 forts (inscription, en ligne) + 1 partiel (QR) sur 22 | 6 sur 22 |
| B demande de Super Event | 1 page | 2 | 3 (+3 connus) | ? (non parcouru) | 1 sur 1 |
| C rejoindre (visiteur) | 4 + fin | 7 | 8 + compte | 0 fort + 1 partiel sur 5 | 5 sur 5 |
| D import et CRM | 4 + CRM | 5 | 0 (4 listes préremplies) | 1 fort sur 5 | 0 sur 5 |

## Les 10 gains rapides (impact 1-5 / effort 1-5 / risque), classés
| N° | Gain | Fichier à changer | À ne pas casser | I/E/R |
|---|---|---|---|---|
| 1 | Violet résiduel #7A4FE0 vers bleu #3B5CC4 (lavande vers #E3E9F8) ; corriger `DESIGN-TOKENS` et `flowin-tokens.css` | `ParcoursCreation.tsx:169`, `BanqueEditor.tsx`, `PartenaireSheet.tsx`, `super/[event]/page.tsx`, `CarteCommerces.tsx`, `documentsAnimation.ts`, `carteReseau.ts`, `docs/DESIGN-TOKENS-flowin.md` | ne pas toucher `SpinClient.tsx`, `NDS2026Client.tsx`, `nds2026Design.ts` ; plaquettes et CGV qui chargent `flowin-tokens.css` : garder le nom `--fl-violet` en alias vers le bleu | 3/1/faible |
| 2 | Fin d'inscription vers `/pro/nouvelle?type=animation&pro=…` (1 geste au lieu de 2) ; sans session : bouton « Ouvrir ma boîte mail » | `PremiereFois.tsx` (bloc `etape === 7`) | e-mail de confirmation inchangé ; droits pro `en_attente` ; brouillon effacé | 4/1/faible |
| 3 | Écran Coordonnées du Configurateur : ne montrer que les champs manquants ; le SIRET manquant n'empêche pas de continuer | `Configurateur.tsx` (`coordKo`, `coordConnues`) | 3 cases de consentement et sécurité ; ne rien inventer (placeholders) ; commandes `crm_retours` | 4/2/faible |
| 4 | Progression fixe en 4 groupes (Jeu, Quiz, Lots, Diffusion) avec coche verte comme `/rejoindre`, au lieu de 7→10 pastilles | `Configurateur.tsx`, `components/pro/Carrousel.tsx` (NavCarrousel) | glisser et boutons ; choix qui avancent seuls | 3/2/faible |
| 5 | Demande de Super Event : 2 écrans (choix, puis 3 champs ; contact repris du profil) ; supprimer « à droite » sur mobile | `ParcoursCreation.tsx` (bloc `demande`) | création réservée à Flowin ; envoi vers `crm_retours` inchangé | 4/2/faible |
| 6 | Zones tactiles ≥ 44 px et police ≥ 13 px : barre du bas, boutons de bienvenue, pastilles `/rejoindre`, aide, `QrTraces` | `ProShell.tsx`, `app/pro/page.tsx`, `ParcoursCreation.tsx` (CSS), `QrTraces.tsx`, `PremiereFois.tsx` (`.pf-lien`) | mise en page du menu ; pas de nouvel élément | 3/2/faible |
| 7 | Entreprise trouvée : carte « C'est bien vous ? » (nom, adresse) + « Modifier » au lieu de 5 champs | `PremiereFois.tsx` (étape entreprise) | rien d'inventé ; champs restent modifiables ; SIRET facultatif | 3/2/faible |
| 8 | Secteur : table NAF vers secteur (boulangerie 10.71C = Commerce) présélectionnée ; fusionner « Collectivité » et « Collectivité / Festival » après accord | `lib/entreprise.ts` (`secteurSuggere`), `lib/proCreation.ts` | liste fermée de secteurs côté SA ; colonne `pros.secteur` | 3/2/faible |
| 9 | Cul-de-sac : état vide `/pro/super` avec « Rejoindre un super event » ; liens « Me connecter » aux couleurs de la charte ; `/pro/crm` garde `?pro=` | `app/pro/super/page.tsx`, `CrmPro.tsx`, `app/pro/crm/page.tsx` | sécurité CRM (lecture avec session) intacte | 2/1/faible |
| 10 | Un seul vert de succès ; écran Prix : « Flowin vous remercie » seulement après validation ; boutons sur 1 ligne | `Configurateur.tsx` (écran `prix`, bloc `fait`), `lib/charte.ts` (`ok`) | libellé « Valider mon bon de commande » (décision Romain) | 2/1/faible |
Déjà couvert par VISION, non re-proposé : écran final avec QR et affiche (AMEL-VIS-02), inscription en 3 écrans (VIS-03), rejoindre en 2-3 écrans (VIS-04), colonnes d'import sautées (VIS-01), Configurateur 7 vers 4 (VIS-07).

## Non vérifié
- Assistant SA (`wizard-super-event`, `wizard-event`), phases, lots et participants de l'organisateur : connexion Super Admin requise ; pas de Super Event rattaché au pro de démo.
- Liste de contacts du CRM (session du pro nécessaire), page animation avec QR et affiche (le pro de démo n'a aucune animation) : défauts lus dans le code, non mesurés.
- Écran de confirmation de la demande de Super Event ; e-mail de confirmation à l'inscription (réglage Supabase non lisible : `fin.session` vrai ou faux en production inconnu) ; iPhone et Android réels ; contraste sur dégradés (faux positifs écartés à la main).
- Taux d'abandon par étape de `/pro/premiere-fois` : aucune étape par écran écrite dans `visites` pour ce parcours (non vérifié ; à ajouter avant de trancher sur les écrans).

## Décisions pour Romain
1. Garder les 3 écrans d'accueil de l'inscription (ordre 445 € puis offres) mais avec « C'est parti » dès le 1er : oui ou non.
2. Fusionner « Collectivité » et « Collectivité / Festival » dans la liste des secteurs : oui ou non.
3. Valider qu'on supprime tout violet, y compris dans les plaquettes et CGV chargeant `flowin-tokens.css`.
