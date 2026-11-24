# Règles décidées par Romain (une ligne = une règle ; ne se redemandent jamais)

Source détaillée : `docs/DECISIONS-flowin-event.md` (DEC), `CLAUDE.md` (CLA), `docs/ARGUMENTAIRE-flowin-event.md` (ARG), `docs/REGISTRE-livrables-refonte.md` (REG). Format : règle | date | source | code qui l'applique.
Ajout : seulement une règle écrite ou confirmée par Romain. Modification : sur instruction explicite.

## Interface
- Carrousel, jamais de longue page à scroller ; une idée par écran | 10/11 | DEC « RÈGLES D'INTERFACE » | `admin/components/creation/Configurateur.tsx`, `lib/masters/engine.ts` (coordonnées en 2 volets), `app/moi/page.tsx` (5 rubriques)
- Peu de texte, phrases courtes, pas de pavés | 10/11 | DEC | toutes les pages de parcours
- Moins d'actions possible jusqu'à l'acquisition : tout champ ou clic inutile est retiré | 10/11 | DEC | `components/pro/PremiereFois.tsx`
- Police ≥ 13 px, zones tactiles ≥ 44 px | 08/11, 17/11 | DEC « Méthode » | `dashboard.html` (mobile), `components/pro/*`
- Pas d'emoji dans l'interface, pictogrammes uniquement | 07/11 | DEC | garde-fou `admin/scripts/verifier-emojis.mjs`, `lib/proicons.tsx`
- Bleu #3B5CC4 = Animation et actions ; orange #C2410C / #FF8A14 = Super Event ; jamais de violet | 07/11, 09/11 | DEC | `lib/charte.ts`, `lib/superEventPhases.ts` ; graphiques sans violet
- Pas de grands aplats de couleurs vives juxtaposées ; cartes blanches, texte encre #1B3A5C ; couleur de catégorie sur pictogramme, puce ou bouton | 08/11 | DEC | `lib/charte.ts`
- Pas d'étiquette « ancienne version / ancien format » sur les QR ni ailleurs | 10/11 | DEC | `lib/qrTraces.ts`
- Jeux : plus fluides et « gaming » au sens fonctionnel, design graphique validé inchangé | 17/11 | DEC | `lib/masters/engine.ts`, `app/jouer/JouerClient.tsx`
- Carte : gratuite, lisible, géolocalisation, itinéraire en un geste (Waze / Plans / Google Maps) | 17/11 | DEC | MapLibre + OpenFreeMap (carte publique des commerces)
- Profil participant /moi rangé par rubriques (lots, lots en jeu près de moi, lots qui expirent, notifications, compte) | 17/11 | DEC | `app/moi/page.tsx`
- Le jeu côté joueur prend les couleurs du commerçant ; palette Flowin pour pro et admin | 08/11 | DEC | `lib/parcoursTheme.ts`

## Vocabulaire et textes
- On dit « Valider mon bon de commande » (ou « Valider mon devis »), jamais « signer » | 10/11 | DEC | `components/creation/Configurateur.tsx`, `public/bon-commande-animation.html`
- Textes repris de l'argumentaire sans paraphrase, chiffres exacts : « 56 % des participants souhaitent garder le contact », « Plus de 70 lots distribués dans les commerces locaux » | 09/11 | ARG | supports, plaquettes, vidéos
- Promesse « Faites jouer, faites grandir votre fichier, faites-les revenir. » ; signature « Flowin, l'animation plug and play. » | 18/11 | ARG | vidéos v6 à v8, plaquettes V3
- Dire « animer votre fichier client / votre clientèle », « capter les passants » ; interdit : « fichier dormant », « financent », langage juridique (« qui y consent ») | 08/11, 09/11 | ARG « Interdit »
- Dire « l'impact du réseau local » (pas « la force ») ; « votre événement » (pas « votre festival ») ; « réseaux sociaux » (jamais un réseau nommé seul) | 09/11, 10/11 | ARG
- On publie une animation (on ne la crée pas) : « Publiez en quelques clics votre animation 100 % automatisée. » | 10/11 | ARG
- Marque : Flowin Event ; produits Flowin Animation et Flowin Super Event. Noms bannis : « Flowin GAMIFICATION », « FLOWIN.EVENTS », « Super event Flowin » | 08/11 | DEC
- Accroche « Un événement. Tous ses partenaires. Un seul jeu. » rejetée (09/11) | DEC, ARG
- Les partenaires diffusent l'événement, ils ne le financent jamais (ne jamais écrire « financent ») | 08/11 | DEC
- Ne jamais faire jouer ni « tester le jeu » aux commerçants dans les plaquettes ou la démo | 08/11, 09/11 | DEC
- Pas de logo à l'inscription ni au bon de commande (il se met dans « Mon profil ») | 10/11 | DEC | `components/pro/PremiereFois.tsx`

## Données et consentement
- Jamais de donnée inventée (téléphone, e-mail, SIRET, TVA, coordonnées, handles) : placeholder `[… à compléter]` | 07/11 | CLA 5, DEC | tous supports
- Genre : Homme / Femme / vide uniquement, jamais « Autre » | 07/11 | CLA 6 | `lib/masters/engine.ts`, `components/parcours/ParcoursChampsStandard.tsx`, RPC `joueur_inscrire` (Autre devient vide)
- Consentement inchangé : 3 cases (jeu obligatoire, rester en contact avec Flowin Event, avec ce commerce), aucune cochée par défaut, phrase « Tes données sont utilisées par Flowin ou par le commerce choisi. Elles ne sont jamais vendues, échangées ni commercialisées. » | 17/11 | DEC | `lib/parcours.ts` (`CONSENTEMENT_MENTION`), `lib/masters/engine.ts`
- Vocabulaire « fichier client », « contact autorisé » (plus de « consentants ») | 09/11 | REG | espace pro, super admin
- Parrainage à la FIN du parcours (après coordonnées et résultat) et dans le profil | 17/11 | DEC | `lib/masters/engine.ts`, `app/moi/page.tsx`
- Données jamais vendues, échangées ni commercialisées | 17/11 | DEC | mention ci-dessus

## E-mails, SMS, envois
- Pas d'e-mail ni de SMS aux clients : tout passe par l'application ; l'e-mail sert uniquement aux relances | 10/11 | DEC « Communication » | `supabase/functions/rappel-tickets`, `_shared/mailer.ts`
- Rappels de tickets 1 mois / 15 jours / 48 h ; « en faire profiter un ami » | 10/11 | DEC | `rappel-tickets`, `lib/relanceLots.ts`
- Annonces des commerces : dans l'application seulement (/moi > Alertes), aucun e-mail ni SMS | 17/11 | `docs/ANNONCES-PRO-2026-11-18.md` | `lib/annoncesPro.ts`
- Ne pas changer le comportement d'envoi d'e-mail sans demander à Romain (voir ERREURS : notify-bon-commande) | 21/11 | conversation | `supabase/functions/notify-*`
- Tout envoi de prospection (e-mail, SMS, WhatsApp, courrier) exige le go explicite de Romain | 21/11 | consigne agents | marketing-prospection
- Pas de campagne d'acquisition : on travaille sur l'existant et le flux capté, en local | 10/11 | DEC

## Prix et offres
- Tester Flowin : 445 € HT la 1re année, présenté en premier ; ensuite 990 € HT/an ou 110 € HT/mois (3 mois minimum) | 10/11 | DEC | `lib/reglement.ts`, `lib/documentsAnimation.ts`
- Quiz rédigé par Flowin : 145 € (72,50 € la 1re année) | 10/11 | DEC | `lib/reglement.ts`
- Ne pas montrer ce qui sera payé l'année suivante à la commande | 10/11 | DEC
- 2 QR inclus puis 10 € HT par QR de suivi (PROVISOIRE, à confirmer) | 17/11 | DEC | `lib/qrTraces.ts` (`QR_INCLUS`)
- Super Event organisateur : pas de prix public, sur étude | 08/11 | DEC
- Paiement : virement SEPA (QR + IBAN copiable) ; `PAIEMENT_ACTIF=false` ; le jeu est visible avant paiement, paiement à la publication | 08/11, 10/11 | DEC | `lib/reglement.ts`
- Piste 99 € HT/an et 2e année 99 €/mois : non tranchées, ne pas annoncer | 10/11 | `docs/PRIX-animation-99-analyse-2026-11-10.md`

## Jeux, tickets, tirages
- Un seul jeu par animation ; un pro peut lancer plusieurs animations | 10/11 | DEC
- Super Event = TOUJOURS tirage au sort (aucun gain immédiat, pas de roue) ; tirage piloté par Flowin (super admin), l'organisateur n'a pas de bouton de tirage (voulu) | 19/11, 20/11 | DEC | `components/dashboard/TirageSuperEvent.tsx`, RPC `tirage_super_event`
- Animation en tirage : le pro fixe la date et lance le tirage | 20/11 | DEC | `app/pro/tirage`
- Animation en gain immédiat : jamais de tirage ; aucun texte « tirage », « date du tirage », « ticket pour le tirage » côté joueur | 20/11 | DEC | `lib/masters/engine.ts`
- Gain immédiat : un lot par joueur et par jour, tant qu'il reste du stock | 19/11 | DEC | RPC `appliquer_regle_gain`
- Un gain par joueur et par animation au tirage pro | 18/11 | `docs/SECURITE-tirage-2026-11-18.md` | `_tirage_un_gain_par_joueur`
- Tickets : 1 quiz + 1 bonus par station et par jour, +1 par parrainage ; les « +5 points d'assiduité » sont Flow-révision (autre produit), rien à ajouter | 20/11 | DEC
- Super Event en deux phases (avant : lots organisateur ; pendant : lots des commerces) ; exception Nuits du Sud : pas de phases | 19/11 | DEC | `lib/superEventPhases.ts` (`SE_SANS_PHASES`)
- Nuits du Sud 2026 : pas de péremption ni de refus en caisse des tickets | 10/11 | DEC | SQL `date_limite_tirage` (null pour se-nds-2026)
- Ticket gagnant : stocké dans le profil joueur et l'espace pro, déstocké du stock ; scanner caméra sur /pro/scanner (jsQR) | 10/11, 19/11 | DEC
- Une animation du commerce et sa station Super Event peuvent tourner en parallèle (gains et suivi séparés) | 17/11 | DEC

## Code et livraison (CLAUDE.md)
- Jamais de secret dans un commit ni dans le chat | CLA 1
- Miroir dashboard : MD5 identique de `admin/public/dashboard.html` et `static/dashboard.html` ; Acorn ecmaVersion 2020, 0 erreur ; var, indexOf, pas de spread | CLA 2-3
- Ne jamais modifier `NDS2026Client.tsx` ni `nds2026Design.ts` | CLA 4
- Travail en bloc cohérent (HTML + CSS + JS + SQL) ; build Next lu (« Compiled successfully ») ; pull --ff-only avant push | CLA 7
- Ne jamais recréer l'existant : chercher d'abord, modifier ; aucune ligne du registre supprimée sans Romain | 09/11 | DEC, REG
- Audit d'abord, Claude propose, Romain valide, Claude exécute ; deux tours de retours maximum par support | 08/11 | DEC « Méthode »
- Confirmations de base de production regroupées et annoncées (Romain devant l'écran) | 08/11 | DEC « Méthode » 8
- Les contrôles automatiques n'écrivent jamais en base et n'envoient aucun message ; ils ne demandent aucun secret | 21/11 | consigne | `scripts/controle/`, `.github/workflows/controle-qualite.yml`
- Un tag git de version avant toute migration risquée ou grosse livraison ; sauvegardes Supabase vérifiées chaque trimestre (prochaine : 21/02/2027) ; jamais de réécriture d'historique | 21/11 | consigne agent principal (demande de Romain : pouvoir reprendre si ça casse) | `docs/claude/PLAN-DE-REPRISE.md`, agent `continuite-reprise`
- Pas de rapport ni de PDF périodique : alerte courte en 4 lignes seulement quand il y a un problème (problème, cause, solution faite ou proposée, ce que Romain décide) ; PDF seulement sur demande | 21/11 | Romain | `PROMPT-MAITRE-multi-projets.md`, CONTROLES.md
- Toute nouvelle table ou fonction créée par migration : revoke explicite des droits par défaut à anon/authenticated (y compris TRUNCATE), puis lire le contrôle quotidien controle_qualite_dernier() | 21/11 | consigne | `sql/2026-11-21-controles-qualite.sql`, contrôles `anon_lecture_tables_sensibles`, `truncate_accorde`
- Accès : Super Admin et administrateurs gardent tous les accès ; Claude modifie l'application par le chemin le plus sécurisé et travaille seul sur l'additif et le réversible ; suppression ou retrait de droit : annoncée, regroupée, confirmée par Romain dans Supabase, jamais contournée | 21/11 | Romain | roadmap SA, `ACCES.md`
- La clé publique (publishable) n'est pas un secret et ne se « tourne » pas : la protection vient des règles d'accès de la base, vérifiées chaque nuit ; la clé de service reste côté serveur | 21/11 | Romain / Claude | contrôle qualité niveau 1
- Nettoyage de test : aperçu des lignes visées d'abord, uniquement préfixes de test (ev-test-, se-test-super-event-e2e, pro-test-, flowinevent+…) ; ev-paques, se-nds-2026 et leurs participants jamais touchés | 21/11 | Romain | scripts `sql/2026-11-20-e2e-nettoyage-TEST*.sql`
- Nettoyage des données de test : PAS une priorité ; ne plus en parler à Romain sauf si cela bloque quelque chose (le contrôle nocturne le garde en orange) | 23/11 | Romain | ETAT.md
- Priorités de Romain : (1) tout fonctionne de bout en bout côté participant, pro, organisateur ; (2) ergonomie et design ; (3) le jeu placé chez les commerçants remplit le CRM (coordonnées, consentements) ; (4) banques de questions (créées par le pro ou par Flowin). La sécurité ne passe devant que si elle bloque ces points | 23/11 | Romain | ETAT.md
- Stock des lots : lots.quantite BAISSE au retrait (pour tous les événements) ; le contrôle `tirages_depassent_lots` doit compter quantite + retirés (faux positif Bergerie 8/7) | 23/11 | Romain | `sql/2026-11-21-controles-qualite.sql`
- 24/11/2026 · Super Event : on joue SUR PLACE (objectif = trafic en commerce). Réglage futur par station : sur_place (défaut) ou distance (sponsors) avec 1 fois par jour et par compte. Réglage = maquette d'abord. Compteur du bandeau = commerces visibles (8 pour NDS), c'est voulu. Version « test » à prévoir pour présenter la carte aux futurs commerces.
- 24/11/2026 · Import fichier client = option A : le pro envoie lui-même l'invitation (lien/QR tracé), Flowin n'écrit pas aux contacts importés.
- 24/11/2026 · Une seule carte partout (MapLibre/OpenFreeMap, composant commun) : à vérifier par l'audit en cours.
- 24/11/2026 · Romain n'a pas de téléphone pour tester : les tests réels sur iPhone restent « non vérifié ».
- 24/11/2026 · QR : on accepte le jeu à distance (anti-fraude = 1 fois par jour et par compte). La règle 150 m reste sur la page carte seulement, pas de blocage serveur. Si un QR fuit : on le change dans la journée. Sons autorisés dans les jeux (bouton pour couper). Stats pro = nombre de FLASHS (visites via QR), opt-in, H/F, tranches d'âge, code postal, zone de chalandise si adresse ; pas de 'passages attendus'.
- 24/11/2026 · Lots (tous jeux) : formulaire complet obligatoire = intitulé, conditions d'utilisation (règle d'obtention libre, cessible oui/non), quantité, valeur éventuelle, aperçu ticket. Jamais de simples boutons présélectionnés. Exemples : Nook Café « un café offert pour un bagel acheté » ; Marché U « bon de 10 € pour 30 € d'achat ».
- 24/11/2026 · Roue : case « ticket pour le prochain tirage » autorisée (idée de Romain). Texte du lot du jour modifiable par date (champ à créer). Lot 5 validé « dans la totalité » sauf lots et QR (lot 6).
- 24/11/2026 · Compte joueur sans mot de passe : premier flash = jeu direct + profil créé automatiquement (historique inclus) ; retrouver son compte = e-mail + lien magique ET code à 6 chiffres (iOS : l'appli écran d'accueil a un stockage séparé de Safari) ; accès depuis ordinateur par le même e-mail ; invitation douce écran d'accueil + rappels. Mot de passe seulement si le lien/code ne suffit pas (décision Romain). Notifications push : NON implémentées (manifest + sw.js existent, pas d'abonnement push) ; iOS exige l'appli installée.

## Historique juin-septembre 2026 (écrit ou confirmé par Romain dans Notion ; importé le 24/11/2026)
- Toute refonte de navigation : maquette cliquable validée AVANT la moindre ligne de code (exigée et obtenue, ~8 itérations) ; « pas de casse, pas de régression, pas de doublons » | 01/09 | HUB 01/09
- Domaine : un event = une station individuelle appartenant à UN pro ; un super event regroupe des stations ; entrer par la vision pro ou event ; mêmes modules à trois portées (Flowin, pro, event / super event) | 01/09 | HUB 01/09
- Les stations d'infrastructure (bars, caisses, écran, Brigade Verte) appartiennent AU PRO organisateur (règle confirmée par Romain) | 27/07 | REP27
- Listes CRM ou type Excel : même présentation partout, « le format liste CRM liste des gagnants est le bon format », rangées par catégorie et sous-catégorie ; tout ce qui concerne un pro ou un event rassemblé vers lui | 02/09 | HUB 02/09
- Trois chemins distincts à ne pas fusionner : demande de participation (pro, validée ensuite) ; duplication d'une édition ; création directe par le SA avec rattachement des pros | 02/09 | HUB 02/09
- Référentiel fonctionnel rédigé par Romain (Event, Super event, SA) = point de référence de tout audit et de toute correction ; super event = tirage au sort uniquement | 16/09 | REF, `docs/REFERENTIEL-fonctionnel-flowin.md`
- Dashboard pro : autonomie quasi complète du pro ; tirage manuel conservé, retrait quasi immédiat pour le gain immédiat ; vérifier l'existant avant de produire, ne pas dupliquer la logique SA, donner l'URL exacte `/pro/...` à chaque étape validée | 27/07 | REP27 (méthode imposée par Romain)
- 24/11/2026 · Compte joueur, version téléphone d'abord : le profil reste en mémoire dans le téléphone, aucune étape de création en plus, minimum de clics. « Rappels » ACTIVÉS PAR DÉFAUT (pas de bouton à cliquer) ; pas d'écran « Ajouter à l'écran d'accueil » (le terme ne parle pas à Romain). Limites techniques : la permission de notification du téléphone reste une demande système unique, et sur iPhone les notifications exigent l'appli installée ; consentement des rappels = à faire valider par un juriste. Accès depuis un ordinateur : possible par e-mail (lien), secondaire.
- 24/11/2026 · Notifications joueur : PAR DÉFAUT, case décochable. Romain ne veut plus qu'on lui parle de juriste sur ce sujet. Ne pas le rappeler.
- 24/11/2026 · Signature retenue : « Flowin, l'animation plug and play » (remplace « Animez · Fidélisez · Boostez »).
- 24/11/2026 · Maquettes lot 3 VALIDÉES : tout coder (inscription pro 3 écrans, rejoindre Super Event 3 écrans, configurateur raccourci). « Passages attendus » abandonné : Romain veut le nombre de FLASHS. Décisions lot 3 prises par défaut : un seul champ mot de passe avec œil ; secteur/produits/points de vente déplacés dans Mon profil ; Jeu et Lots sortis de Rejoindre ; fusion Collectivité et Collectivité/Festival.
- 24/11/2026 · Style visuel souhaité pour quiz et roue (variante à part, maquette d'abord) : pixel art arcade années 90 (Donkey Kong, Minecraft), sons 8 bits, références dans docs/maquette/reference-retours/pixel-art/. Fond aubergine sombre, étiquettes à contour, sprites, révélation séquentielle.
- 24/11/2026 · Méthode : plusieurs agents codent en parallèle chacun dans son périmètre de fichiers ; SQL en fichiers sql/ appliqués seulement par l'agent principal après relecture ; relecture croisée avant fusion ; retirer les worktrees fusionnés (disque).
