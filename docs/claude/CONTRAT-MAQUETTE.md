# Contrat maquette : ce que l'application doit reproduire (agent gardien-fidelite)

Créé le 23/11/2026. Sources : les 6 maquettes de `docs/maquette/` (INDEX.md, statut « à confirmer par Romain »). Une ligne MANQUE ou VOULU reste dans ce tableau tant qu'elle n'est pas OK. Statuts : **OK** (en ligne, preuve en production), **OK (code)** (preuve dans le code de `main`), **MANQUE**, **VOULU** (écart décidé par Romain, décision citée), **NON VÉRIFIÉ**.

## Limite de preuve du 23/11/2026 (à lire avant le tableau)
- La production `https://flowin-events.vercel.app` répond **403 « Forbidden » (`x-vercel-mitigated: deny`) à tout `curl` depuis cet environnement** (pages, `robots.txt`, bundles, même avec un User-Agent navigateur). Le connecteur Vercel ne voit pas le projet (ACCES.md). Aucune ligne ne peut donc être « OK » (production) ; toutes les preuves ci-dessous sont **OK (code)** : texte ou classe retrouvé dans les fichiers de `origin/main` (déploiement automatique Vercel depuis `main`). Pour passer en OK : `curl` depuis une machine non bloquée, ou une exécution du contrôle `scripts/controle/` (niveau 2) côté GitHub Actions.
- Comptes de test manquants : **Super Admin de test** (dashboard connecté), **pro de test avec session** (`flowinevent+…@gmail.com`, validé), **appareil réel iPhone / Android** (caméra du scanner).
- Chaque texte cité est copié du code ; les chemins sont relatifs à `admin/`.

## 1. Parcours de création (maquette-parcours-creation.html) : priorité 1
| Écran ou onglet | Élément | Statut | Note |
|---|---|---|---|
| Création : accueil | Choix du type : créer un event / créer un super event / souscription pro | OK (code) | `components/creation/ParcoursCreation.tsx` l.945 « Que voulez-vous faire ? », cartes « Créer une animation », « Rejoindre un super event » / « Intégrer un super event » (SA), « Créer un super event » (SA) ou « Proposer un super event » (pro) |
| Création : toutes étapes | Barre d'étapes numérotée, cliquable en arrière | OK (code) | `PastillesEtapes` (`onAller`), l.174 et l.1032 |
| Création : toutes étapes | Bouton « Changer de choix » (retour à l'accueil) | OK (code) | l.1029 |
| Event : Identité | Nom de l'animation * | OK (code) | `Champ label={estSuper ? 'Nom du super event' : 'Nom de l’animation'}` |
| Event : Identité | Pro client * (vignettes de choix du pro) | OK (code) | côté SA le pro est choisi avant (`ParcoursCreationSA.tsx`, bouton « Changer de pro », l.950) ; côté pro il est implicite |
| Event : Identité | Début * et Fin | OK (code) | champs « Du » / « Au » (l.1353) |
| Event : Identité | Lieu | MANQUE | aucun champ « Lieu » dans la création d'animation ; seul « Adresse » existe dans le parcours commerce |
| Event : Le jeu | Gabarit de référence « Quiz + bonus » en tête et par défaut | OK (code) | `JEUX[0]` = `GABARIT_NOM` (`lib/gabarit.ts`), l.98 |
| Event : Le jeu | Quiz, Quiz solo | OK (code) | `JEUX` l.98-99 ; « Quiz » est fusionné dans le gabarit (« bonus de rattrapage optionnel ») |
| Event : Le jeu | Quiz Master | MANQUE | absent de `JEUX` ; le jeu existe côté joueur (`app/parcours/quizmaster`) mais ne se choisit pas dans la création |
| Event : Le jeu | Roue, Tombola, Vote | OK (code) | `JEUX` l.100-102 (roue exclue du Super Event, voir §Super Event) |
| Event : Le jeu | Étape conditionnelle « Questions » : choix d'une banque pour les jeux à questions | OK (code) | pas d'étape séparée : la banque se choisit dans l'étape Jeu ; contrôle l.500 « Choisissez une banque de questions, ou demandez-la à Flowin. » |
| Event : Questions | Statut de la banque affiché (Validée / Brouillon) et nombre de questions | MANQUE | `banquesQuizBase` filtre les banques vides ; aucun libellé « Validée » / « Brouillon » dans `ParcoursCreation.tsx` |
| Event : Questions | « Demander à Flowin de réaliser un quiz » | OK (code) | `Configurateur.tsx` l.377 « L’équipe Flowin rédige votre quiz. » ; prix `LignePrix « Quiz rédigé par Flowin »` l.505 |
| Event : Récompense | Nom du lot, quantité, retirer, « + Ajouter un lot » | OK (code) | `ParcoursCreation.tsx` l.1299 « + Ajouter un lot », bouton « Retirer » |
| Event : Récompense | Type par lot : tirage au sort / gain immédiat | OK (code) | `lotVide('instantane' \| 'tirage')` l.1299 |
| Event : Récompense | Probabilité de gain immédiat | OK (code) | `Champ label="Chances de gagner (%)"` l.1313 et « Un gagnant tous les … joueurs » |
| Event : Diffusion | Sur place / En ligne | OK (code) | l.1422-1423 « QR code imprimé », « Lien pour les réseaux » |
| Event : Diffusion | QR généré sur l'identifiant définitif, après création | OK (code) | `QrTraces` dans l'écran de fin (l.881), table `qr_stations` ; E2E 20/11 : QR en Diffusion après création (`docs/E2E-verification-2026-11-20.md`) |
| Event : Récapitulatif | Récapitulatif avant écriture (nom, dates, jeu, lots, diffusion) | OK (code) | l.1516 `Titre t="Récapitulatif"`, lignes l.1521-1535 |
| Event : toutes étapes | Aperçu du vrai parcours joueur à côté, mis à jour par la saisie | OK (code) | `<ApercuJeu … titre="Aperçu en direct" />` l.1603 ; masqué pendant la publication en carrousel (l.1601) |
| Event : structure | 6 étapes de la maquette (Identité, Jeu, Questions, Récompense, Diffusion, Récap) regroupées en 4 + récap | OK (code) | `ETAPES = ['Votre animation', 'Jeu', 'Lots', 'Diffusion & QR']` l.994 ; regroupement cohérent avec « moins d'actions » (DEC 10/11) mais non confirmé par Romain |
| Event : publication pro | Publication en carrousel (un écran par idée) | OK (code) | l.371 et l.1411 « publication en carrousel » (10/11/2026, Romain) |
| Super Event : L'opération | Nom * | OK (code) | `Champ label={estSuper ? 'Nom du super event' …}` |
| Super Event : L'opération | Identifiant déduit du nom | OK (code) | `Champ label="Identifiant"` (`ParcoursCreationSA.tsx`, `ParcoursCreation.tsx` l.1 occurrence) |
| Super Event : L'opération | Début * / Fin | OK (code) | champs « Du » / « Au » |
| Super Event : L'opération | Description | MANQUE | `dDescription` n'existe que dans la demande « Proposer un super event » du pro (`Champ label="Votre projet"`) ; la création SA n'a que « Logo du super event (facultatif) » |
| Super Event : Les pros | Choix des pros participants, une station par pro cochée | OK (code) | l.1383 `Titre t="Les pros participants"` « Chaque pro coché reçoit sa station tout de suite » + recherche ; « le super event peut être créé vide » |
| Super Event : Les jeux | Un jeu différent par station | MANQUE | le code impose un jeu pour tout le super event (l.1147 « Choisi une fois pour tout le super event ») ; aucune décision écrite de Romain : à trancher |
| Super Event : Les jeux | Pas de roue (Super Event = toujours tirage au sort) | VOULU | `jeuxProposes = JEUX.filter(j => j.m !== 'spin')` l.997 ; REGLES « Super Event = TOUJOURS tirage au sort (aucun gain immédiat, pas de roue) » (DEC 19/11) |
| Super Event : Réglages | Périmètre de jeu (mètres) | MANQUE | `geofenceM: null` écrit en dur à la création (l.663) ; le réglage existe dans la fiche opération (`app/dashboard/operations/[id]/OpsDetailClient.tsx`), pas dans le parcours |
| Super Event : Réglages | Tirage global | VOULU | `tirageGlobal: true` en dur ; tirage piloté par Flowin (REGLES, DEC 20/11 « Qui lance le tirage », `TirageSuperEvent.tsx`) |
| Super Event : Réglages | Tirage par station (chaque pro tire chez lui) | MANQUE | absent ; l'organisateur n'a pas de bouton de tirage (voulu) mais « par station » n'est ni refusé ni décidé |
| Super Event : Phases (hors maquette) | Écran « Les phases » (avant / pendant) | OK (code) | l.1370 `Titre t="Les phases"`, `ETAPES` avec phases l.993 ; DEC 19/11 ; SQL `sql/2026-11-19-super-event-phases.sql` |
| Super Event : Récapitulatif | Pros rattachés, stations créées | OK (code) | l.1516-1535, écran de fin « Super event créé » l.786 |
| Pro (souscription) : Vous êtes | Commerce / Annonceur | OK (code) | `persona === 'commerce'` : « Nom du commerce (affiché sur la carte) » / « Nom de la structure » |
| Pro (souscription) : Opération | Opérations ouvertes aux nouvelles participations | OK (code) | l.1075 `Titre t="Quel super event ?"` |
| Pro (souscription) : Votre commerce | Enseigne * et adresse | OK (code) | `Champ label="Adresse"`, catégorie via `SelectActivite.tsx` |
| Pro (souscription) : Vos lots | Nom, quantité | OK (code) | l.1275 `Titre t={… 'Vos lots'}` ; en plus valeur et conditions (l.619) |
| Pro (souscription) : Pack | Choix de l'offre | OK (code) | l.1486 `Titre t="Nos offres"`, l.1500 « Une option ? » (prix `lib/reglement.ts`) |
| Pro (souscription) : fin | Bon de commande : « Valider mon bon de commande » | OK (code) | `Configurateur.tsx` l.6 et l.522 (`data-valider`), `public/bon-commande-animation.html` l.434 |
| Toute la maquette | Emojis comme pictogrammes (🎬 🎮 🎁 📣 ✅ 🏢 ⭐) | VOULU | REGLES « Pas d'emoji dans l'interface, pictogrammes uniquement » (07/11, DEC) ; le code utilise `Ico` / `lib/proicons.tsx` |
| Toute la maquette | Accent violet #7C2D92 | VOULU | REGLES « jamais de violet », bleu #3B5CC4 (09/11) ; `lib/charte.ts` l.67-71 (`violet` = nom conservé, valeur bleue) |
| Toute la maquette | Étiquettes explicatives « Doublon / Complémentaire / Ce qui est partagé » (texte d'architecture) | VOULU | texte de présentation de la maquette, pas un écran produit ; REGLES « Peu de texte » |

## 2. Éditeur d'événement (flowin-editeur-mockup.html)
Le cahier des charges `docs/CDC-editeur-event-flowin.md` (validé 17/06) décrit le module ; aucun fichier de `app/`, `components/`, `public/dashboard.html` ne contient « Mettre en forme », « hérité » ou « surchargé ».
| Écran ou onglet | Élément | Statut | Note |
|---|---|---|---|
| Bibliothèque | Liste Super Events / Événements / « Front & Partenaire » avec « Mettre en forme » | MANQUE | recherche `Mettre en forme` : 0 résultat dans `app`, `components`, `lib`, `public` |
| Template du Super Event | Propriétés partagées : accent, thème, police, co-brand Flowin | MANQUE | pas de niveau « template super event » ; seul le niveau B par event existe (`app/dashboard/theme-parcours/page.tsx`, `events.cfg.theme`) |
| Template du Super Event | Écrans communs hérités par les stations (accueil, opt-in, lots, clause) | MANQUE | aucune notion d'héritage dans le code (recherche « hérit » / « surcharg » : seulement des commentaires) |
| Station : édition page à page | Badges « hérité du template » / « surchargé (station) » par champ | MANQUE | idem |
| Station : écrans | Accueil, Quiz, Bonus RSE, Opt-in, Lots, Carte, Bandeau, Page partenaire | MANQUE | les écrans du jeu se règlent par `ConfigJeu.tsx` (jeu seulement), pas page à page |
| Station : thème | Palettes Festival / Sobre / Chaud / Bleu nuit | OK (code) | éditeur de thème par event `app/dashboard/theme-parcours/page.tsx` ; les noms de palettes ne sont pas retrouvés : à comparer à l'écran (NON VÉRIFIÉ pour les noms) |
| Front & Partenaire | Logos du bandeau, image de fond, artwork, bandeau défilant | OK (code) | `app/dashboard/nds-front/page.tsx` « Front NDS — logos, fiche et bandeau des partenaires » (lecture de complétude, pas d'édition d'image de fond ni d'artwork) |
| Front & Partenaire | Carte des points (ajout d'un point) | OK (code) | `app/dashboard/nds-carte`, `carte-reseau` (+ `components/carte/CarteCommerces.tsx`) ; « Ajouter un point » non retrouvé |
| Front & Partenaire | Page partenaire : accroche, CTA, lots partenaires | OK (code) | `public/nds-partenaire.html`, `components/dashboard/PartenaireDrawer.tsx` |
| Barre d'actions | « Enregistrer » et « Enregistrer les positions » | MANQUE | liés à l'éditeur absent |
| Maquette | Emojis (🌙 🎁 📍 💾 👁) | VOULU | REGLES « Pas d'emoji » (07/11) |

## 3. Super Event, refonte UX navigable (mockup-super-event-navigable.html) : écrans joueur et pro
Joueur : `app/parcours/nds2026/NDS2026Client.tsx` (fichier maître, ne jamais modifier). Pro : `app/rejoindre/[se]`, `app/se/[se]`.
| Écran ou onglet | Élément | Statut | Note |
|---|---|---|---|
| Accueil joueur | Titre « Ton aventure commence ici. » et accroche « Explore Vence… » | MANQUE | recherche `aventure`, `Explore` : 0 résultat dans le code |
| Accueil joueur | Bandeau « À gagner chaque soir » (lots partenaires) | OK (code) | `NDS2026Client.tsx` : « À gagner » (2 occurrences) |
| Accueil joueur | Bouton « Flasher un QR & jouer » | OK (code) | `NDS2026Client.tsx` l.351 scanner QR in-app (caméra + jsQR) ; libellé exact différent (« Flashe une autre station », l.1179) |
| Quiz | Quiz 1 / 3 puis « Sans faute — 1 ticket » | OK (code) | `NDS2026Client.tsx` l.1093 « Sans faute — 1 ticket » |
| Quiz | « Rattrape ton ticket » + question bonus 15 s chrono | OK (code) | `NDS2026Client.tsx` (« Rattrape ton ticket », 4 occurrences « question bonus ») |
| Quiz | « Valider et recevoir mon ticket → » | OK (code) | `NDS2026Client.tsx`, `lib/masters/engine.ts` : « Valider mon ticket » |
| Coordonnées | « Dernière étape / Bravo, ton ticket est là. » | OK (code) | l.981 « Bravo, ton ticket est là&nbsp;! » ; l.989 « Laisse-nous tes coordonnées : on te prévient si tu gagnes » |
| Coordonnées | Message « Content de te revoir ! On a pré-rempli tes infos » | OK (code) | l.1000-1001 |
| Coordonnées | Prénom, Nom, Email, Téléphone | OK (code) | formulaire `form.*` (l.1007 et suivantes) |
| Coordonnées | Sexe : Homme / Femme uniquement | OK (code) | l.1007 `<option value="">—</option><option value="H">Homme…` ; aucun « Autre » dans les champs de genre (recherche sexe / genre) |
| Coordonnées | Tranche d'âge (6 tranches), code postal | OK (code) | `NDS2026Client.tsx` « Tranche d'âge », « Code postal » |
| Coordonnées | « Tu as connu le festival par… » (Instagram, Affiche, Bouche à oreille, Autre) | OK (code) | l.17 `const SRC = ['Instagram', 'Affiche', 'Bouche à oreille', 'Autre']` (source d'acquisition, pas le genre) |
| Coordonnées | Case de contact : « rester en contact avec les infos de mes prochains événements et de Flowin » | VOULU | le code garde `OPTIN_TEXT` l.23 « …rester en contact avec les infos des Nuits du Sud et de Flowin. Mes coordonnées ne sont ni vendues ni cédées. » ; consentement inchangé (DEC 17/11, REGLES) ; la formulation de la maquette est à confirmer |
| Coordonnées | Libellés de consentement Flowin Event / ce commerce (autres parcours) | OK (code) | `lib/masters/engine.ts` l.336-337 : « Je souhaite rester en contact avec Flowin Event : offres, bons deals, prochains events. » et « Je souhaite rester en contact avec ce commerce » ; `lib/parcours.ts` l.939 |
| Confirmation | « 1 ticket gagné. Scanne d'autres commerces pour cumuler tes chances. » | OK (code) | l.1179 « Flashe une autre station → +1 ticket, plus de chances au tirage » ; l.954 « chacune = 1 ticket de plus » |
| Confirmation | Boutons « Voir les autres stations » / « Aller à mon profil » | MANQUE | libellés absents ; équivalents : « Voir mon profil » (engine.ts), « File vers une autre station » (l.834) |
| Carte | « Toutes les stations. » + statut Joué | OK (code) | `NDS2026Client.tsx` « Toutes les stations » |
| Navigation basse | Carte, Scanner, Mon profil, Partenaires | OK (code) | `NDS2026Client.tsx` « Mon profil » (2), « Nos partenaires » |
| Profil | « Mes tickets », « Mes favoris » (cœur sur une fiche partenaire) | OK (code) | « Mes tickets » l.1, « Mes favoris » (grep NDS2026Client) |
| Profil | « Partager & gagner un ticket », « Partager à un ami » | OK (code) | « Partager » (1 occurrence) ; parrainage en fin de parcours (DEC 17/11, `lib/masters/engine.ts`) |
| Partenaires | Fiche : lots proposés, Facebook, Site web, Fermer | OK (code) | « Lots proposés / Lot : », « Facebook » (2), « Site web » (2) dans `NDS2026Client.tsx` |
| Commerçant | « Vous êtes commerçant ? Rejoignez le Super Event… » + « Faire souscrire mon commerce » / « Réserver un espace pro » | MANQUE | recherche de ces libellés : 0 résultat ; la souscription existe ailleurs (`app/rejoindre/[se]/RejoindreClient.tsx`, `app/pro/rejoindre`) |
| Commerçant | Formulaire « Je souscris au Super Event » (nom du commerce, e-mail) puis « On revient vers vous sous 24h » | MANQUE | libellés absents ; remplacé par le parcours `RejoindreClient.tsx` (demande de rattachement) |
| Question bonus | « Participe à la question bonus, gagne un point supplémentaire ! 15 secondes chrono. » | MANQUE | libellé exact absent ; la mécanique « +1 ticket » existe (l.755) |
| Déjà joué | « Avez-vous déjà joué ? » / « Une station par jour suffit pour garder ton ticket. » | MANQUE | libellés absents ; remplacés par « Ton ticket est bien gardé. File vers une autre station… » (l.834) |
| Station avant la date de début | Station jouable avant date_d (phases avant / pendant) | MANQUE | E2E 20/11 n°9 : « une station ne s'ouvre qu'à la date de début du super event » ; AMEL-ERG-04 ; hors NDS (exception `SE_SANS_PHASES`) |
| Joueur (Next, hors NDS) | Pages `/se/[se]` : deux onglets Avant / Pendant au-dessus des lots | OK (code) | `app/se/[se]/SuperEventClient.tsx`, `lib/superEventPhases.ts` ; E2E de bout en bout NON VÉRIFIÉ (ETAT : « Super Event en 2 phases ») |
| Maquette | Violet #7C2D92 / dégradé magenta du gabarit NDS | VOULU | thème propre à Nuits du Sud, fichier maître protégé (CLAUDE.md règle 4) ; les surcharges white-theme vivent dans `NDS2026Client.tsx` |

## 4. Tiroirs du dashboard SA (maquette-drawers.html)
Code : `components/dashboard/` (SuperEventDrawer, EventDrawer, ProDrawer / PartenaireDrawer, JoueurDrawer, Drawer). Dashboard SA connecté : NON VÉRIFIÉ en production (compte Super Admin de test manquant) ; vérification faite dans le code.
| Écran ou onglet | Élément | Statut | Note |
|---|---|---|---|
| Tiroir (commun) | Tiroir par-dessus le menu, « ← Retour » entre tiroirs empilés, fermeture × / Échap | OK (code) | `Drawer.tsx` l.66 « Echap + Retour ferment le tiroir », l.92 « ← Retour » |
| Tiroir Super Event | Onglets Vue d'ensemble, Stations de jeu, Joueurs, Lots & tirages, Pros & partenaires | OK (code) | `SuperEventDrawer.tsx` l.37-60 |
| Tiroir Super Event | Sous-onglets de Vue d'ensemble : Chiffres clés, Activité par jour, Kanban | OK (code) | « Chiffres clés », « Informations » présents ; « Activité par jour » absent (voir ligne suivante) |
| Tiroir Super Event | Sous-onglet « Activité par jour » | MANQUE | recherche `Activité par jour` dans `SuperEventDrawer.tsx` : 0 ; page voisine `components/dashboard/CourbeQuotidienne.tsx` |
| Tiroir Super Event | Stations : Toutes, Stations NDS, Chez les partenaires, Kanban | OK (code) | l.41-45 (« Du super event » au lieu de « Stations NDS ») |
| Tiroir Super Event | Joueurs : Tous, Opt-in, Fidèles | MANQUE | code : un seul sous-onglet « Où les trouver » (l.48) avec raccourci `nds-participants` |
| Tiroir Super Event | Lots & tirages : Stock, Tirage au sort, Gagnants | OK (code) | l.50-53 « Lots », « Tirage au sort », « Stock et gagnants » |
| Tiroir Super Event | Pros & partenaires : Tous, Pros, Commerces | OK (code) | l.55-58 « Tous », « Organisateur », « Partenaires » |
| Tiroir Super Event | Onglet « Landing & QR » (page publique, rejoindre, sponsor, toutes les pages) | MANQUE | remplacé par « Rapports » et « Outils NDS » (l.60, 66) ; raccourcis vers `crm-landing`, `rapport-points` |
| Tiroir Event (station) | Onglets Infos, Jeu, Stats, Joueurs, Lots, QR | OK (code) | `EventDrawer.tsx` l.232-243 : Infos, Contenu du jeu, Stats, Participants, Lots, QR, Aperçu, Export |
| Tiroir Event (station) | Sous-onglets Infos : Général, Rattachement, Visibilité pro | NON VÉRIFIÉ | non cherchés dans `EventDrawer.tsx` (onglet Infos non détaillé) ; ouvrir un tiroir avec un compte Super Admin de test |
| Tiroir Event (station) | Joueurs : Liste, Opt-in | OK (code) | l.574-576 « Tous », « Opt-in », « Sans opt-in » |
| Tiroir Event (station) | Lots : Lots, Gagnants (Tous / Non utilisés / Utilisés) | OK (code) | l.631-633 |
| Tiroir Pro | Onglets Infos, Ses stations, Lots & stock, Gagnants & billets, QR & liens | OK (code) | `components/operations/BlocsOperations.tsx` l.823 `ONGLETS_FICHE` |
| Tiroir Pro | Onglet Souscription (sa demande, pack souscrit, parcours suivi) | MANQUE | absent de `ONGLETS_FICHE` ; demandes dans `app/dashboard/demandes-rattachement` |
| Tiroir Pro | Onglet Devis & facturation (devis, bon, factures, règlement) | MANQUE | absent ; `PartenaireDrawer.tsx` l.70 charge la vraie facture (`fetchFacturePartenaire`) ; pas de devis |
| Tiroir Pro | Onglet Stats | OK (code) | `ONGLETS_FICHE` : « Tracking » |
| Tiroir Pro | Onglet Kit & com (dossier partenaire, visuels, e-mails types) | OK (code) | `ONGLETS_FICHE` : « Emails & com » (visuels non vérifiés) |
| Tiroir Pro | Onglets supplémentaires non dans la maquette : Contrat, CRM, Droits | OK (code) | `ONGLETS_FICHE` + `ProDrawer.tsx` l.70 « Droits » |
| Tiroir Joueur | Onglets Infos, Historique de jeu, Lots gagnés (+ tickets) | OK (code) | `JoueurDrawer.tsx` l.104-108 : Infos, Historique de jeu, Lots, Lots gagnés, Tickets |
| Tiroir Joueur | Sous-onglet Opt-in & RGPD | NON VÉRIFIÉ | 3 occurrences « RGPD / Opt-in » dans `JoueurDrawer.tsx`, rendu non ouvert |
| Menu latéral | Entrées de la maquette (Vue d'ensemble, Mes super events, Stations de jeu, Bibliothèque de jeux, Pros & partenaires, CRM participants, Communication, Prospection & B2B, Facturation & admin, Stats globales, Landing pages, Plaquettes & pitchs, Toutes les pages, Feuille de route) | MANQUE | `components/dashboard/Sidebar.tsx` garde 8 groupes et une cinquantaine d'entrées (« Super events », « Animations », « Jeux », « CRM », « Commercial », « Comm & outils », « Système ») ; pas de « Vue d'ensemble » / « Toutes les pages » |
| Menu latéral | « Feuille de route » | OK (code) | `Sidebar.tsx` l.248 `{ id: 'roadmap', label: 'Feuille de route' }` |
| Maquette | Emojis dans le menu (🏠 ⭐ 🎬 🏢 👥) | VOULU | REGLES « Pas d'emoji » (07/11) ; le menu Next utilise `SbIcon` |

## 5. Architecture de navigation SA (architecture-navigation-sa.html)
| Écran ou onglet | Élément | Statut | Note |
|---|---|---|---|
| Sidebar | Barre de contexte globale : sélecteur super event puis event, écrite dans l'URL `?se=&ev=` | MANQUE | seul `components/dashboard/BandeauFiltreSE.tsx` lit `?se=` sur quelques pages (« Tout afficher ») ; pas de sélecteur global, pas de `ev=` |
| Sidebar | Trois pôles (Super events, Events, Général, Outils) avec une couleur par pôle | OK (code) | `Sidebar.tsx` : groupes avec `ton` (`ton-se`, `ton-ev`, `ton-crm`, `ton-out`, `ton-sys`) ; styles `app/dashboard/globals.css` l.30-34 |
| Sidebar | De 46 entrées à 19 (le reste en sous-onglets) | MANQUE | `Sidebar.tsx` : environ 50 `href` ; accordéon par groupe (l.262) |
| Sidebar | Page « Toutes les pages » (index A à Z des entrées et destinations) | MANQUE | recherche « Toutes les pages » : seulement `app/dashboard/landing-page/page.tsx` et `public/dashboard.html` (autre sujet) |
| Espace Super Event | Pages `/dashboard/super-event/[id]/[onglet]` (Vue d'ensemble, Participants, Pros, Lots & tirages, Landing & diffusion, Résultats, Communication) | MANQUE | `app/dashboard/` ne contient que `super-events/page.tsx` ; la fiche se fait par `SuperEventDrawer.tsx` |
| Espace Event | Pages `/dashboard/event/[id]/[onglet]` (Infos, Contenu du jeu, Lots & gagnants, Stats, Export) | MANQUE | seulement `EventDrawer.tsx` (tiroir) |
| Pôle Général | 6 pages à onglets (CRM pros, CRM participants, Communication, Facturation, Prospection, Stats globales) | MANQUE | les entrées sont encore séparées (`crm-pro`, `joueurs`, `nds-participants`, `crm-landing`, `crm-retours`…) |
| Règle de non-régression | Aucune route supprimée ; anciennes URLs répondent toujours (`/dashboard/gagnants`, `/tirage-nds.html`, `/dashboard/nds-comm`) | OK (code) | `app/dashboard/gagnants`, `app/dashboard/nds-comm`, `public/tirage-nds.html` présents |
| Dashboard monolithe | Miroir `dashboard.html` identique | OK (code) | `md5sum` : `f82bd8ed4dbf95e408dea01ea6b0a1fb` pour `public/dashboard.html` et `public/static/dashboard.html` (23/11) |
| Maquette | Emojis dans la sidebar proposée | VOULU | REGLES « Pas d'emoji » (07/11) |

## 6. Maquette et rapport d'audit du 07/11 (maquette-et-rapport-2026-11-07.html)
La maquette est un rapport d'audit (« Éléments manquants » à reproduire) avec une démo Pro / Admin / Joueur ; on suit les éléments attendus.
| Écran ou onglet | Élément | Statut | Note |
|---|---|---|---|
| Parcours pro : rejoindre un festival | Paiement à la fin du parcours « rejoindre » | VOULU | « Paiement : virement SEPA ; `PAIEMENT_ACTIF=false` ; paiement à la publication » (DEC 08/11, 10/11) ; `lib/reglement.ts` |
| Parcours pro : rejoindre un festival | Liste « Mes festivals » avec le statut des demandes | NON VÉRIFIÉ | `app/pro/super/page.tsx` et `/pro/rejoindre` existent ; contenu non lu (pro de test avec session manquant) |
| Parcours pro | Pont « Rattacher ce jeu à un festival » | MANQUE | recherche du libellé : 0 résultat |
| Carte | Carte des commerces de la ville (MapLibre, itinéraire en un geste) | OK (code) | `components/carte/CarteCommerces.tsx`, `app/carte-commerces/CarteCommercesPublique.tsx` ; DEC 17/11 |
| Inscription pro | Géocodage à l'inscription | NON VÉRIFIÉ | non cherché ; ETAT : seed de GPS non listé |
| Facturation | Devis | MANQUE | aucune page de devis dans `app/` ; seulement bons de commande et factures (`nds-bon-commande`, `facture-nds.html`) |
| Facturation | Numérotation attribuée par la base (FL), facture immuable, avoir | NON VÉRIFIÉ | ACCES.md : numérotation `FL-AM-AAAA-NNNNN` ; intégration Jeffrey CRM non faite (ETAT) ; vérification en base non faite |
| Joueur | Règlement du jeu côté joueur | NON VÉRIFIÉ | non cherché ; AMEL-VEI-01 (juriste) |
| Joueur | Résultats visibles du joueur (« Pas de lot cette fois ») | OK (code) | `sql/2026-11-20-resultats-tirage-inapp.sql` l.117 `'Pas de lot cette fois'` ; `components/operations/ReglageTirage.tsx` l.20 ; ETAT : testé en local, NON vérifié en prod |
| Cohérence graphique | Super event orange, animation bleue | OK (code) | `lib/charte.ts` (bleu #3B5CC4), `lib/superEventPhases.ts` (orange) ; DEC 07/11, 09/11 |
| Cohérence graphique | Pictogrammes à la place des emojis | OK (code) | `node scripts/verifier-emojis.mjs` : « Aucun emoji dans admin/app, admin/components, admin/lib » (23/11) |
| Cohérence graphique | Emojis dans le dashboard monolithe | MANQUE | `public/dashboard.html` (= `static/dashboard.html`) contient 884 emojis (plage U+1F300-1FAFF), hors du garde-fou qui ne couvre que `app`, `components`, `lib` |
| Sécurité | Écriture publique fermée sur `pros` | NON VÉRIFIÉ | ETAT : partie B (drop `pros_anon_select`) en attente de Romain |
| Emails | Envoi depuis une adresse réelle | OK (code) | ACCES.md : Gmail SMTP `_shared/mailer.ts` ; envoi test VÉRIFIÉ PROD le 20/11 (ETAT) |

# Demandes de Romain du 19 au 23/11/2026 contre la production

Définitions : **faite** = Romain l'a demandée ; **en ligne** = livrée sur `origin/main` (commit présent, déploiement Vercel automatique) ; la production n'est pas joignable depuis cet environnement (403, voir plus haut), donc « en ligne » = sur `main`, pas prouvé à l'écran ; **manquante** = non livrée, partielle ou en attente d'une décision.

| # | Demande (source) | Faite | En ligne | Manquante | Preuve ou écart |
|---|---|---|---|---|---|
| 1 | Carrousel, jamais de longue page à scroller (DEC 10/11, rappelée 23/11) | oui | oui (code) | non | pro : `components/pro/Carrousel.tsx`, `PremiereFois.tsx` l.363, `Configurateur.tsx` l.521 (`NavCarrousel`), publication en carrousel `ParcoursCreation.tsx` l.371 ; joueur : /moi en 5 rubriques `app/moi/page.tsx` l.28-39 ; listes du dashboard SA non concernées |
| 2 | Pas de violet (DEC 09/11) | oui | partiel | oui, en partie | espace pro propre (aucun hex violet dans `components/pro`) ; `lib/charte.ts` l.69 `violet: '#3B5CC4'` ; reste : parcours joueur (`lib/parcours.ts`, dégradé `#8E2E9E` → `#E0218A`, `components/parcours/ParcoursHero.tsx`), NDS (maître protégé), `ConfigJeu.tsx` (palette de segments `#7C2D92`), `public/dashboard.html` (14 occurrences) |
| 3 | Pas d'emoji dans les écrans produit (DEC 07/11) | oui | partiel | oui, en partie | Next : `verifier-emojis.mjs` = 0 ; reste : `public/dashboard.html` 884 emojis, `public/parcours/*.html` (anciennes pages redirigées par `next.config.js` l.15 vers les pages Next) |
| 4 | Genre : Homme / Femme / vide uniquement (CLAUDE.md règle 6) | oui | oui (code) | non | `NDS2026Client.tsx` l.1007 ; aucun « Autre » dans un champ de genre (seul « Autre » : source d'acquisition et activité) |
| 5 | Consentement inchangé : « rester en contact avec Flowin Event » / « avec ce commerce » (DEC 17/11) | oui | oui (code) | non | `lib/masters/engine.ts` l.336-337, `lib/parcours.ts` l.939 ; NDS garde son propre `OPTIN_TEXT` (« …avec les infos des Nuits du Sud et de Flowin ») |
| 6 | « Valider mon bon de commande », jamais « signer » (DEC 10/11) | oui | oui (code) | non | `Configurateur.tsx` l.522, `public/bon-commande-animation.html` l.434 ; restes hors parcours : `lib/documentsAnimation.ts` l.217 « signez votre mandat » (mandat SEPA) et statuts « Signé » du tableau SA `nds-bon-commande` (écrans internes) |
| 7 | Gain immédiat : aucun texte « tirage » côté joueur (DEC 20/11) | oui | oui (code) | non | `lib/masters/engine.ts` l.220 (`if (v.immediat) return ''`), l.391 (écran dédié), l.441 ; commit `fa367482` sur `main` ; ETAT : NON revérifié en prod |
| 8 | Super Event en 2 phases avant / pendant jouables (DEC 19/11) | oui | partiel | oui, en partie | création, onglets Avant / Pendant, tirage par phase : sur `main` ; **écart connu** : une station ne s'ouvre qu'à `date_d` (E2E 20/11 n°9, AMEL-ERG-04) ; de bout en bout NON VÉRIFIÉ (ETAT) |
| 9 | Perdants : « Pas de lot cette fois » dans /moi (20/11) | oui | oui (SQL appliqué, code) | non | `sql/2026-11-20-resultats-tirage-inapp.sql` l.117, `ReglageTirage.tsx` l.20-129, `TirageSuperEvent.tsx` l.165 ; ETAT : NON VÉRIFIÉ en prod (tirage réel avec un non-tiré nécessaire) |
| 10 | Scanner caméra (iPhone / Android) sur `/pro/scanner` (DEC 19/11) | oui | oui (code) | non | `components/pro/ScannerBillet.tsx` l.9 et l.33-34 (getUserMedia, BarcodeDetector, jsQR) ; commit `3116d24f` sur `main` ; **NON VÉRIFIÉ sur appareils réels** (ETAT) |
| 11 | Banques de questions créées par le pro | oui | oui (code) | non | `app/pro/banques/nouvelle/page.tsx`, `components/pro/BanqueEditor.tsx`, `app/pro/banques/[id]` ; session pro de test nécessaire pour la prod |
| 12 | Banques de questions créées par Flowin (communes validées, ou « Flowin rédige votre quiz ») | oui | oui (code) | non | `app/pro/banques/page.tsx` l.89-92 « Banques communes Flowin… Proposées et validées par Flowin » ; `Configurateur.tsx` l.377 ; SA : `app/dashboard/banques`, `components/banques/ModelesBanques.tsx` |
| 13 | CRM : contacts visibles dans l'espace pro (priorité 3 du 23/11) | oui | oui (code) | non | `/pro/crm` redirige vers `/pro/donnees?onglet=crm` (`app/pro/crm/page.tsx`) ; `components/pro/CrmPro.tsx` vues « Contacts », « Origines », « Opérations », « Stats » ; fiche `app/pro/crm/[id]` ; import `app/pro/donnees/import` |
| 14 | Vidéos v8 L3 et L4 en ligne (19/11) | oui | oui (fichiers sur `main`) | non | `public/videos/v8/` : 8 fichiers mp4 (`l3-animation-court/long`, `l4-super-event-court/long`, 16x9 et 9x16), commit `b07e3e58` ; scripts `docs/SCRIPT-L3-v8-…`, `SCRIPT-L4-v8-…` ; ETAT : écoute de Romain à confirmer |
| 15 | Stock des lots : `lots.quantite` BAISSE au retrait, pour tous les événements (23/11) | oui | non | oui | `valider_lot` ne décompte que `lots_stock` (`sql/2026-11-20-valider-lot-pro-proprietaire.sql` l.124-131) ; aucun SQL de décrément de `lots.quantite` sur `main` après le 23/11 ; base de production non lue ici |
| 16 | Super Event : toujours tirage au sort, pas de roue, tirage piloté par Flowin (19-20/11) | oui | oui (code) | non | `ParcoursCreation.tsx` l.997 (roue exclue) ; `TirageSuperEvent.tsx` (SA) ; le pro (`app/pro/super/page.tsx` l.235) renvoie vers `/pro/tirage` pour ses animations |
| 17 | Animation en tirage : le pro fixe la date et lance le tirage (20/11) | oui | oui (code) | non | `app/pro/tirage/page.tsx`, `ReglageTirage.tsx` ; E2E 20/11 n°6 VÉRIFIÉ PROD |
| 18 | Rappels de tickets 1 mois / 15 jours / 48 h (10/11, activés 20/11) | oui | oui (code, cron) | non | `supabase/functions/rappel-tickets`, `lib/relanceLots.ts` ; ETAT : premier passage protégé du 21/11 NON VÉRIFIÉ |
| 19 | Règle de mémoire à jour à chaque travail (21/11) | oui | oui | non | CLAUDE.md « Règle de mise à jour de la mémoire » ; `docs/claude/JOURNAL.md` à jour au 23/11 |
| 20 | Priorité 1 du 23/11 : tout fonctionne de bout en bout (participant, pro, organisateur) | oui | partiel | oui, en partie | E2E 20/11 : 10 parcours VÉRIFIÉ PROD ; restent NON VÉRIFIÉ : phases de bout en bout, résultat de tirage, scanner réel, rappels |

**Compte (20 demandes) : faites 20 ; en ligne sur `main` 15 entières (dont 4 avec réserve « non prouvé à l'écran » : 7, 9, 10, 18) + 4 partielles (2, 3, 8, 20) ; manquantes 1 entière (15) + la part restante des 4 partielles.** Aucune preuve n'est « OK » en production (403 depuis cet environnement).
