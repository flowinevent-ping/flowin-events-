# Décisions Flowin Event — à lire par chaque session et chaque agent

Ce qui est écrit ici est tranché par Romain. On ne le redemande jamais. On ajoute
une ligne datée quand une nouvelle décision est prise ; on ne modifie une ligne
que sur instruction explicite de Romain.

## Méthode de travail (retour d'expérience Flowin Révision, 08/11/2026)

1. Cadrage d'abord, sur une page (`docs/CADRAGE-refonte-flowin-event.md`) : public,
   ton, palette, tailles minimales (police ≥ 13 px, zones tactiles ≥ 44 px), boutons,
   cartes, états. Ce sont des variables appliquées partout, jamais écran par écran.
2. Un seul écran fini à 10/10 d'abord, validé par Romain sur son téléphone. On ne
   reproduit sur les autres écrans qu'après son feu vert.
3. La maquette validée est la source unique. Le style de l'app en découle ; on ne
   corrige pas la cosmétique à la main écran par écran.
4. Les décisions vivent dans ce fichier, pas dans la conversation.
5. « Fait » exige des preuves : captures avant/après des vraies pages à 360, 390 et
   430 px avec de vraies données, et rejeu des captures envoyées par Romain.
6. Un parcours de bout en bout à la fois, prouvé avant de passer au suivant.
7. Peu d'agents en parallèle, tests ciblés à chaque changement, contrôle complet
   seulement avant une livraison.
8. Les confirmations externes (modifications de la base de production, qui exigent
   un clic de Romain) sont regroupées et annoncées à l'avance : Romain reste devant
   l'application à ce moment-là.
9. Indicateurs commerciaux définis avant de coder, puis mesurés.
10. Ne jamais recréer une maquette ou un support de zéro : on modifie l'existant.
    Deux tours de retours maximum par support, regroupés. Retours au format
    « écran n° + une phrase ».

## Marque et produits (08/11/2026)

- Marque : **Flowin Event**.
- Produit 1 : **Flowin Animation** — le jeu dans son commerce (« créer une animation »).
- Produit 2 : **Flowin Super Event** — participer à un super event (le commerce
  devient **station jeu**), ou en créer un (organisateur).
- Une association de commerçants peut être organisatrice.
- Noms à ne plus utiliser : « Flowin GAMIFICATION », « FLOWIN.EVENTS », « Super event Flowin ».

## Message (08/11/2026)

- Slogan : **Animer · Booster · Fidéliser**.
- Promesse super event : **« Un événement. Tous ses partenaires. Un seul jeu. »**
- Organisateur : les partenaires **diffusent** l'événement, en boutique et en ligne
  (physique et digital). Les partenaires **ne financent pas** l'événement : ne jamais
  l'écrire.
- Chiffres autorisés à publier : **56 % des participants souhaitent garder le contact** ;
  **plus de 70 lots distribués dans les commerces locaux** (à mettre en forme lisible).

## Prix (08/11/2026)

- Organisateur : **pas de prix public**, sur étude. On vend le suivi (où les gens ont
  joué, contacts, base de données). Le prix sert à négocier l'intégration à l'événement.
- Grille commerce et partenaires : proposition à faire par Claude, à valider par Romain.

## Boutons d'action (08/11/2026)

- Organisateur : prise de rendez-vous par **WhatsApp ou email**. Pas d'agenda en ligne.

## QR code (08/11/2026)

- Chaque animation a un QR à imprimer et un QR digital à diffuser.
- On peut créer un QR digital supplémentaire par support (Facebook, TikTok…) pour
  suivre d'où viennent les joueurs.

## Parcours (08/11/2026)

- Le pro crée et voit son jeu avant de payer ; le paiement arrive à la publication.
- L'écran final de la création est le QR prêt à imprimer ; bouton « Mon QR » sur
  chaque animation.
- Super event : formules partenaire proposées en 2ᵉ écran ; choix « digital » ou
  « kit imprimé » dans la création d'animation (deux choix distincts).

## Interface (07/11/2026)

- Pas d'emoji dans l'interface : pictogrammes uniquement.
- Couleur super event : orange #C2410C / #FF8A14. Couleur animation : bleu #3B5CC4.
- Formulaires : genre Homme / Femme / vide uniquement.
- Jamais de données inventées (téléphone, email, SIRET, adresse) : placeholder
  `[… à compléter]`.

## Supports (08/11/2026)

- Plaquette commerce : réduite à 6 écrans (proposition à faire).
- Vidéos : produire les 3 vidéos (commerçant, partenaire, organisateur) ; modèle de
  vidéo joueur générique ; nettoyage des doublons.
- Archiver les pages internes exposées publiquement.
- Visite guidée Flowin (`/visite-guidee/`) : démo cliquable, outil commercial, accessible
  depuis le dashboard SA (menu Comm & outils).

## Objectif de la refonte (08/11/2026)

- Mesure du succès : la **conversion**, c'est-à-dire l'envie de s'inscrire après navigation.
  Chaque écran, chaque support est jugé sur ce critère.

## Cahier des charges design de Flowin Animation (08/11/2026)

- Flowin Animation doit avoir **l'effet d'un jeu** : animation, innovation, simplicité, mouvement.
- **Aux couleurs du commerçant** (et non aux seules couleurs Flowin) : comme sa propre carte de
  fidélité, mais un outil vraiment interactif où le client a de **vrais privilèges** et une
  interaction avec son commerce.
- But : créer l'**attractivité**, accrocheuse au premier coup d'œil.
- Le cadrage (`docs/CADRAGE-refonte-flowin-event.md`) doit être corrigé en conséquence : la palette
  Flowin reste celle de la marque et des écrans pro/admin ; le jeu côté joueur prend les couleurs du
  commerçant.

## Constat de Romain sur la présentation Super Event (08/11/2026)

- Pas assez probante ni simple à comprendre au premier coup d'œil ; trop d'images ; couleurs et
  tailles d'images pas optimales ; navigation peu actuelle ; manque possible d'animation et de
  dynamique. À traiter par un audit design / ergonomie / architecture avant toute nouvelle production.

## Campagne d'inscription gratuite des commerces (08/11/2026, à intégrer à la réflexion)

- Une campagne d'inscription **gratuite** est envisagée : le commerce s'inscrit sur Flowin et
  attend le prochain événement ou la prochaine animation.
- But : rassembler les commerces autour d'actions de communication **locales et hyper locales**.
- Le commerce s'enregistre (coordonnées, SIRET), **accepte d'être contacté** et est contacté au
  prochain événement. Aucun frein à l'inscription : pas de paiement, pas de refus.
- Une fois les informations validées : la fiche remplit le **CRM** et le commerce est inscrit
  sur la **carte des partenaires Flowin**, même s'il ne prend pas d'animation (prix ou autre).
- Variante à étudier : saisir les coordonnées du commerce directement dans l'application
  (par l'équipe ou un prospecteur), puis validation.
- **Demande portée par les clients** : sur la carte, un client peut envoyer un email ou une
  demande au commerce pour qu'il adhère à Flowin (ou rejoigne une animation). La demande d'adhésion
  vient aussi des clients.

## Positionnement produit (08/11/2026, corrigé par Romain)

- **Flowin Animation** est un outil commercial, pas un simple jeu :
  1. **Acquérir un CRM** et **animer votre fichier client / votre clientèle**.
  2. **Distribution automatisée des lots** qui fait **revenir le client** en boutique : retrait du lot
     avec validation, dates de validité, calées sur les meilleures périodes pour activer le commerce.
  3. **Attirer du trafic** dans le commerce et chez les partenaires Flowin alentour.
  4. **Outil de tracking** : chaque support a son QR digital, toutes les campagnes de communication
     sont quantifiées.
  5. **Centraliser** toutes les campagnes de jeu du commerce.
- **Flowin Super Event** permet :
  1. aux sponsors sans lots à offrir (ex. assurance) d'être visibles comme **sponsors du
     développement local** auprès des festivaliers ;
  2. aux petits commerces de rejoindre des événements habituellement hors de portée (levier,
     pas forcément argument affiché) ;
  3. aux concurrents des partenaires officiels d'être présents.
  - Exemple de référence : **Nuits du Sud, Vence**.
- **Direction artistique** : pas de pari sur la photo (difficile à obtenir). On mise sur une
  **animation de qualité** et la **vidéo interactive**, à mi-chemin entre présentation produit et
  tuto. Messages : simplicité, bénéfice, immédiateté, plug and play — **« Vous testez, vous essayez. »**

## Vocabulaire et règle de production (08/11/2026)

- Formulations à employer : **« animer votre fichier client »**, **« animer votre clientèle »**,
  **« capter les passants / les flux de passage »**.
- Formulations interdites : « réveiller un fichier qui dort », « fichier dormant », tout terme
  qui dévalorise le fichier du commerçant.
- **On ne repart jamais de zéro.** Le matériel existant (visite guidée, plaquettes, storyboards v16,
  vidéos, maquettes) est la base : on l'améliore jusqu'à une qualité professionnelle en appliquant
  ce fichier, le cadrage et les audits (`docs/audit-2026-11-07/`, `docs/audit-2026-11-08/`).

## Statut du positionnement (08/11/2026, précision de Romain)

- Les sections « Positionnement produit » et « Direction artistique » ci-dessus sont la
  **compréhension interne** du produit, issue de nos échanges. Ce ne sont **pas des textes ni des
  slogans à insérer** dans les supports, et leur absence mot pour mot n'est pas un défaut.
- « Vous testez, vous essayez » est une intention de ton pour les vidéos, pas un argument à afficher.
- Les lots à gagner (quiz, bonus, tombolas) sont déjà présents dans les supports.
- Sponsors et présence au côté des partenaires officiels : déjà réalisé sur Nuits du Sud 2026 ;
  ne pas en faire un argument nouveau à ajouter.

## Couleurs à l'écran (08/11/2026, retour de Romain)

- Pas de grands aplats de couleurs vives juxtaposés (effet « mauvais PowerPoint »). Cartes blanches,
  texte encre ; la couleur de catégorie (bleu Animation, orange Super Event) seulement sur le
  pictogramme, une puce ou le bouton d'action.

## Parcours commerçant à finaliser et règle d'exécution (08/11/2026, recadrage de Romain)

- **Interdit** : faire jouer ou « tester le jeu » aux commerçants dans les supports ou la démo. Ce
  n'a jamais été demandé. Ne rien inventer hors des consignes.
- **Parcours à finaliser (Flowin Animation)** : choix du persona → inscription → validation
  (apparition sur la future carte des partenaires, Animation et Super Event — à ne pas produire
  maintenant) → jusqu'à l'animation → découverte du dashboard : créer son animation, puis les
  rapports (nombre de personnes venues, sexe, constitution du CRM, tous les paramètres du jeu) →
  **publier l'animation = moment du paiement**.
- **Paiement** : pas d'intégration définitive. Virement SEPA avec le RIB de l'entreprise
  (`[RIB à compléter]`) ; le mode de paiement définitif viendra plus tard.
- **Même finalisation pour « intégrer un super event »**, sur la base de ce qui est déjà fait. On ne
  reproduit pas tout : on termine l'existant.
- **Règle d'exécution** : audit d'abord → Claude propose → Romain valide → Claude exécute.
  Aucune production avant validation.

## Verdict qualité et direction visuelle (08/11/2026, Romain)

- Précision de Romain : sa critique portait sur les **couleurs**. Le contenu et la mise en page des derniers documents sont de bien meilleure qualité et se gardent (modifier pour fusion et mise à jour, ne pas reconstruire).
- Le **violet** comme couleur principale n'est **pas** la couleur de Flowin. Référence couleurs :
  la **landing page** (`/landing`) — encre #1B3A5C, turquoise #00B4A0, bleu #3B5CC4, orange, ambre
  sur les chiffres. Fond blanc.
- Ça doit **faire outil, propre et organisé**. Logo bien placé, mise en page alignée, tailles de
  police cohérentes.
- **Trop d'infos tue l'info** (ex. écran RSE / quiz de la plaquette Super Event : fouillis).
- Charte Super Event : bien mais **trop décalée** ; garder quelque chose de propre.
- Proposition de règles (charte de la landing, 5 tailles de police, logo à gauche, 40 mots max par
  écran, style BD limité au logo Super Event) : dans `docs/audit-2026-11-08/visuel/`, **à valider**.

## Parcours immersif (08/11/2026, Romain)

- Pas d'emoji, pictogrammes uniquement. Parcours immersif pour la souscription et la création
  d'animation (choix du jeu, mise en place, QR…). Plaquettes cliquables et navigables.
- Ne rien construire de trop lourd à mettre en place ; on modifie l'existant (fusion et mise à jour).

## Retours de Romain du 09/11/2026 (plaquettes et visite)

- **Couleurs** : turquoise + bleu = effet « pharmacie », pas assez animation/jeu. Direction : entre le
  **bleu et l'orange** (prédominance à définir ; Romain cherche une charte). Fond blanc et
  typographie : OK. Super Event = **orange**.
- **Jamais faire jouer / tester** le jeu dans les plaquettes : hors script.
- À **remettre** : la notion **plug and play** ; le **multi-jeux** (quiz, quiz + bonus, tombola,
  roue de la fortune).
- **La plaquette présente l'application** : on y retrouve le parcours réel jusqu'à l'**inscription**
  et au **tableau de bord** complet, la **création / mise en place d'un jeu**, le QR.
- **Trop d'infos sur une page = agressif** (prix compris) : présenter en **carrousel** (ou deux
  images), pas tout sur la même page.
- **Langage organisateur / événement culturel** : « Connecte ton événement avec l'ensemble du réseau
  local. Diffuse, sois visible, sois présent, en proximité. »
- **Langage commerce (Super Event)** : « Connecte ton commerce aux événements locaux. Donne de la
  visibilité auprès des festivaliers / spectateurs. »
- **Arguments communs** : créer son fichier client, rester en contact, avec au milieu le chiffre
  **56 % des participants ont coché « Je souhaite rester en contact »**.
- **Présentation commerces + événement** : très bonne chose, à garder.
- **Trois conversions**, dans cet ordre : 1) laisser ses coordonnées ; 2) s'inscrire sur la carte /
  se déclarer intéressé par le prochain super event de la ville ou des villes alentour ;
  3) conversion prix Flowin Animation (solution autogérée).
- **Pitch Flowin Animation** : « Tu installes Flowin, tu fais jouer tes clients. Ils connaissent mieux
  ton magasin et ton métier (renforcement de marque). Ils font participer leurs amis : tu agrandis
  ton réseau. Ils gagnent des lots, des remises, ce que tu veux. Ils reviennent : tu augmentes ta
  visibilité et ta fréquentation. »
- **Niveau attendu** : travail complet d'expert (design, ergonomie, stratégie de conversion), sans
  que Romain ait à dicter page par page. Ne rien supprimer de l'existant sans le dire.

## Règle absolue : ne pas recréer l'existant (09/11/2026, Romain)

- Ne jamais recréer ce qui marche déjà dans l'application. Tout existe : connexions, données
  Supabase, tableaux de bord, souscription / première connexion, création d'animation, jeux et leur
  design, matériel. **D'abord chercher l'existant**, puis redesigner, améliorer ou changer le parcours
  si nécessaire. Jamais repartir de zéro.
- Plaquettes : on est en V2, on produit la **V3**, poussée dans le super admin (Outils et
  communication), comme les vidéos de présentation.
- L'app (souscription, création) est redesignée aux couleurs de la plaquette : même rendu des deux côtés.

## Retour plaquette Super Event V3 (09/11/2026, Romain)

- « Un événement. Tous ses partenaires. Un seul jeu. » : **rejeté** comme accroche (ne dit rien,
  pas d'impact). Écrire des accroches qui disent la force et le bénéfice du Super Event.
- Chiffres clés (56 % / 70) : même taille, alignés.
- Pas de pavés de couleur sans continuité ; homogénéité visuelle.
- Illustrations : « mieux vaut un dessin qu'un long discours ». Dessins pédagogiques, compris en un
  coup d'œil, qui expliquent le bénéfice. Moins de texte.
- Couleurs Super Event V3 : un peu mieux (base à garder).
- Niveau attendu : design exceptionnel, artistique, marketing, impactant, puissant, esthétique ; un
  produit présenté comme une vraie révolution. Ne pas demander d'explications déjà données.

## Retour plaquette Super Event V3, 2e passage (09/11/2026)
- Beaucoup mieux. Couleurs un peu mieux. Garder la présentation Nuits du Sud et le dessin de
  l'écran quiz (question bonus → graphique).
- À retirer : le « théâtre » devant la ville (incompréhensible), les arcs en pointillés, les halos
  lumineux, les bonhommes (mauvaise qualité).

## Communication et prix (10/11/2026, Romain)
- **Pas d'envoi d'email ni de SMS** pour l'instant : tout passe par l'application de jeu Flowin.
  Pas de campagne d'acquisition : on travaille sur l'existant et le flux capté, en local.
- Piste prix : 1re année 99 € HT/an ; **2e année éventuellement 99 €/mois**, avec envoi d'**offres
  flash** instantanées aux clients de proximité. (Réflexion en cours, non tranchée.)

## RÈGLES D'INTERFACE ABSOLUES (Romain, 10/11/2026 soir — répétées de nombreuses fois, ne plus jamais les redemander)
- **CARROUSEL, PAS DE SCROLL.** Tout parcours (pro, publication, souscription, joueur, Super Event) se présente
  en écrans successifs (carrousel / étapes), jamais en longue page à faire défiler. Une idée par écran.
- **Peu de texte.** Phrases courtes ; pas de pavés dans le règlement ou les explications.
- **Moins d'actions possible jusqu'à l'acquisition.** Chaque champ ou clic non indispensable est retiré.
- **On ne dit pas « signer »** : on dit **« Valider mon bon de commande »** (ou « Valider mon devis »).
- **Pas d'étiquette « ancienne version / ancien format »** sur les QR codes ni ailleurs.
- **Ne pas montrer ce qui sera payé l'année suivante** au moment de la commande.
- Première connexion : présenter d'abord **« Tester Flowin : 445 € HT la 1re année »**, puis seulement ensuite
  les offres mensuelle et annuelle. Option quiz : « le premier quiz rédigé par Flowin » à son prix.
- Ordre de publication : **configurer le jeu, puis payer pour mettre en ligne**.
- Inscription / bon de commande : **pas de logo** (il se met plus tard dans « Mon profil »). Champs utiles
  seulement : SIRET, nom, prénom, adresse, téléphone, objet de l'entreprise, lots proposés, conditions
  d'utilisation des lots (avec un exemple).
- Virement : un bouton qui ouvre la banque avec l'IBAN prêt (QR de virement SEPA + copier en un clic).
- **Validation par Romain sans login** : une page de consultation (maquette cliquable) donne accès à tout
  ce qui est livré (plaquettes, films, carte, parcours pro, joueur, souscription Super Event).

## Tickets gagnants dans le profil (Romain, 10/11/2026 soir)
- Animations comme Super Events : le ticket gagnant validé est **stocké dans le profil du participant**
  (téléphone) et **dans l'espace du pro**, et **déstocké** du stock du pro. Passe par Supabase, visible
  dans le super admin. **Email uniquement pour une relance.**
- Durée de validité ; rappels **1 mois, 15 jours, 48 h** avant expiration.
- **« En faire profiter un ami »** : envoyer le ticket à un ami (effet cadeau).

## Exception Nuits du Sud 2026 (Romain, 10/11/2026)
- Pas de date de péremption ni de refus en caisse pour les tickets Nuits du Sud 2026 (se-nds-2026), pour l'instant. Appliqué en base (date_limite_tirage renvoie null pour se-nds-2026).

## Ce que voit et fait un pro (Romain, 10/11/2026 soir — référence de l'espace pro)
- Publie une animation ; **un seul jeu par animation** ; peut lancer **plusieurs animations**.
- Voit : **passages globaux = nombre de flashs** ET **nombre de joueurs** ; les personnes qui **souhaitent rester en contact** ; **sa base client existante** (import).
- Peut intégrer **un ou plusieurs Super Events**, en **sponsor** ou en **station jeu** ; y voit le **nombre de flashs total de l'événement** + **sa station**.
- Dans les deux cas (animation / super event) : voit **les gagnants**, accède au **fichier CRM**, peut **exporter** (pour envoyer des emails).
- Répartitions avec **beaux graphiques comme dans le super admin** : donuts, « égaliseur » (barres), **hommes / femmes**, **zone de chalandise par code postal en %**.
- **Rappel** au pro : « invitez vos clients à jouer » — plus ils jouent, plus ils partagent, plus le commerce est visible.
- Objectifs affichés : constituer son fichier client, animer ses clients, augmenter son panier et son chiffre d'affaires.

## QR codes = métrique de chaque support de communication (Romain, 10/11/2026 soir)
- Le pro ajoute autant de QR que de supports, avec un **intitulé libre** (ex. « Arrière de bus · campagne salle de sport »)
  et un **type de support à pictogramme** (bus, Instagram, Facebook, affiche, flyer, ticket de caisse, vitrine, site, presse…).
- Même jeu, mêmes questions, mêmes lots derrière tous les QR : on mesure **d'où viennent les flashs** et on distribue
  les lots là où l'on touche le plus de monde.
- Affichage comme la première animation (graphismes jugés très bons) : **égaliseur** des flashs par QR avec le **pictogramme**
  du support ; côté pro et côté super admin.
- Argument client (ex. contrôle technique : 5 000 € de pub ticket de caisse, ~15 % de retour) : savoir d'où vient chaque
  campagne, ce que les gens gagnent, piloter en autonomie, récupérer les coordonnées ; ticket offert = coordonnées du
  donneur ET du bénéficiaire.
- **Piste de prix (non tranchée)** : 2 QR inclus, QR de tracking supplémentaire payant (5, 10 ou 15 € — à décider).
