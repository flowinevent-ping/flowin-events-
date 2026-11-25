# Mémoire : produit-ergonomie (créée le 21/11/2026 ; ≤120 lignes)

## Déjà fait et décidé (dates)
- 08/11 : méthode (cadrage, un écran à 10/10 validé sur téléphone puis reproduit), police ≥ 13 px, zones ≥ 44 px, cartes blanches, couleur de catégorie seulement sur pictogramme / puce / bouton (`docs/DECISIONS-flowin-event.md`).
- 09-10/11 : espace pro aux couleurs plaquette (bleu #3B5CC4, logo Flowin Event) ; configurateur en carrousel jusqu'à « Valider mon bon de commande » ; publication sans scroll ; QR SEPA ; moins de champs à l'inscription (`4bd55ea4`, `11bf48dc`).
- 10/11 : espace pro v2 / v3 : « Mon profil » en carrousel, rapport d'activité en carrousel (chiffres clés d'abord, Hommes / Femmes, chalandise en %, égaliseur des flashs par QR), plus de violet, super admin en bleu (`6514ace8`, `5617d00a`, `33a47d59`, `e173d7df`).
- 10/11 : mode démo global `?demo=1` (aucune écriture, champs « Démo », bandeau) et page de validation sans login (`5f89ff26`, `450bc57b`).
- 17/11 audit des 5 experts (`docs/audit-2026-11-17/`) : jeux (tombola débloquée, démo sans écriture, gestes du flash au ticket : quiz + bonus 29 vers 21, quiz solo 22 vers 14, roue 13 vers 10, tombola vers 10), coordonnées en 2 volets sans défilement, profil /moi en 5 rubriques (QR plein écran en 1 toucher), carte MapLibre + OpenFreeMap (Autour de moi, itinéraire Waze / Plans / Google Maps), cohérence app / films / plaquettes, pro et SA mobiles (tableaux en cartes par 10, cibles 44 px, kanban en carrousel).
- 17/11 : parrainage en fin de parcours et dans le profil ; connexion joueur par lien e-mail ; roue des films identique à l'app.
- 19/11 : scanner caméra dans /pro/scanner (jsQR), écran organisateur « Les phases » (carrousel), annonces des commerces (carrousel 3 écrans).
- 20/11 : correctifs de l'E2E : listes pro fraîches, historique à une animation, animation sans paiement en ligne, création de Super Event avec session, texte du bouton « Terminer le tirage », « Pas de lot cette fois » dans /moi.

## Règles de conception retenues
- Carrousel ou rubriques, jamais de longue page ; une idée par écran ; moins de 40 mots par écran (proposition `docs/audit-2026-11-08/visuel/`, à valider).
- Jeux : gagner en fonctionnel (moins d'étapes, réactivité, effet de gain) sans changer le graphisme validé ; haptique ajoutée.
- Consentement et collecte des coordonnées : inchangés (3 cases, aucune cochée, phrase « jamais vendues… »).
- Dashboard SA vanilla : boutons, champs, menus ≥ 44 px sur téléphone, aucun débordement horizontal ; miroir MD5 identique ; Acorn 2020, `var`, `.indexOf()`.
- Le jeu côté joueur prend les couleurs du commerçant ; pro et admin gardent la palette Flowin.

## Pièges connus
- Mode démo : toute redirection doit conserver `demo=1` ; en démo montrer le résultat sans écrire (billet de la roue, profil fictif).
- Data Cache Next : liste vide ou périmée après création = `no-store` côté serveur.
- Inventaire avant / après : une régression de l'audit (détail des tickets par commerce réduit à un total) a été retrouvée par comparaison.
- Listes sans clic et boutons `cursor:pointer` sans `onClick` (`docs/patterns-bugs-connus.md`) ; compteur = table de faits, jamais longueur d'une liste paginée.
- `NDS2026Client.tsx` et `nds2026Design.ts` intouchables ; surcharges white-theme seulement dans `NDS2026Client.tsx` (`!important` sous `.ndsbody`).
- Textes de tirage affichés sur un jeu à gain immédiat (corrigé dans le code, non revérifié).
- Pas d'emoji (garde-fou `admin/scripts/verifier-emojis.mjs`).

## Sources et standards utiles
- WCAG 2.2 : cible tactile 24 px minimum (nous visons 44 px, recommandation Apple HIG) ; contraste AA ; Material / HIG pour carrousels et gestes.
- Tokens : `docs/DESIGN-TOKENS-flowin.md`, `admin/lib/charte.ts`.

## Ouvert
- Valider une charte couleurs définitive bleu / orange (REGISTRE L11, attente Romain).
- Restent proposés (expert 5) : filtres du CRM pro repliables ; banques et lots NDS regroupés par rubrique.
- Autres cartes encore en Leaflet (`nds-carte`, `dashboard.html`, `nds-parcours.html`) ; NDS2026 intouchable.
- `lot.html` : conditions NDS « valable jusqu'au 25 octobre 2026 » alors que NDS n'a pas de date limite : décision de Romain en attente.
- Affichage « Commerce partenaire — » sur `lot.html` pour un pro sans partenaire (cosmétique).
- 8 animations sans position sur la carte : pas urgent (19/11), rien à faire.
- Parcours d'inscription pro : validation par Flowin manuelle (voulu) : message clair à vérifier.
- 23/11 CRM pro : une cellule de tableau = un seul bloc (TablesMobiles la met en grille titre / valeur sur téléphone) ; coordonnées masquées = « Contact non partagé » (TEXTE_NON_PARTAGE, lib/crmPro.ts) ; normaliserContact() nettoie les lignes de crm_pro ; écrans SA qui lisent des coordonnées : SessionSAExpiree, jamais une liste vide ; sa-alert + gras = classe texte.
- 23/11 lot ergonomie 1 : `EnLigne.tsx` (écran final ; `Celebration` réutilisable), `lib/afficheQr.ts` (affiche A4 extraite de Diffusion), progression Configurateur en 4 groupes, `VERT_OK` #15803D unique, `BTN` min 44 px. Restent : flowin-tokens.css violet (plaquettes/CGV), violet landing/NDS/engine, bandeau démo « Quitter » 24 px, attributions carte, AMEL-DES-03/05/07/08/09.
- 23/11 lot ergonomie 2 : `/se/[se]` = en-tête orange (`ENTETE_SE`), plaque logo `/flowin-super-event-logo.svg`, carrousel `.se-car` des 6 plus proches puis liste groupée par jeu (`data-liste-groupee`), animations CSS coupées par `prefers-reduced-motion` ; `/jouer` : `r.connu` (profil complet local) replie le volet 1, `r.reco` + `lookupJoueurByEmail` sur sortie du champ e-mail (e-mail en premier, RPC ne renvoie que le prénom), les 3 cases et le texte de consentement ne changent JAMAIS ; `.fm` redéfinit `--fl-accent` en bleu (plus de violet) ; `.tk .num` taille par `--n` ; `/moi` : carte `data-mes-tickets` en tête de Mes lots, connexion en bleu #3B5CC4. Restent : accueil + règles non fusionnés (mentions légales), bonus une question par écran (DES-13), `/moi` compteurs touchables et badges avec progression, épingles pop-in 44 px, prune roue / quiz solo (décision Romain), étiquettes 11,5 px du bas de navigation du moteur. Test local : `pkill -f next-server` avant chaque build.
- 24/11 lot 4 : /se/[se] = bandeau a[data-se-entete] 88 px ; SuperEventMap reperes/selId/decalageBas/geoHaut ; separerReperes() regroupe les points sans logo < 80 m ; carrousel [data-carrousel], fiche [data-fiche-courte], pastille [data-progression-pastille] ; règle sur place RAYON_SUR_PLACE_M=150, MODE_JEU_DEFAUT='sur_place' (SuperEventClient.tsx), démo l'ignore. Logo station : partenaires.event_id -> events.id, image_url.
- 24/11 une seule carte : composant commun SuperEventMap + components/carte/repere.ts (rond 44 px, anneau #B5471E, vert si joué). nds-carte et dashboard.html en MapLibre. Restent Leaflet : nds-parcours.html et NDS2026Client (décision Romain : on garde).
- Piège : clé de reconstruction de SuperEventMap ignore les positions en mode éditable (sinon recadrage à chaque dépôt). Ne pas pkill next : port libre dédié.
- 24/11 lot 5 maquettes (docs/maquette/lot5/) : choix du jeu et questions (banque ou Flowin rédige), roue à 3 types de case, tombola, quiz animé (sons autorisés par Romain, bouton couper), stats pro (flashs, opt-in, genre, âge, CP, chalandise), affiche avec logo. Décisions en attente : lot5-LISEZMOI.md.
- 24/11 lot 6 maquettes (docs/maquette/lot6/) : formulaire de lot + ticket en direct, QR par support et Mes QR, accueil commerce, compte joueur sans mot de passe. Décisions : lot6-LISEZMOI.md.

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (HUB, REF, REP27, REP03, PIL)
- 01/09 · Logique de domaine posée par Romain, à ne jamais perdre : un event = une station individuelle appartenant à UN pro ; un super event regroupe des stations ; entrer par la vision pro ou la vision event ; mêmes modules à 3 portées (Flowin, pro, event / super event). « Ne recrée rien, tout existe déjà, c'est un rangement » (HUB 01/09).
- 02/09 · Trois choses distinctes : `/pro/rejoindre` = demande de participation validée ensuite ; `/dashboard/super-events` = duplication d'une édition ; `wizard-super-event` = le SA crée et rattache des pros sans demande (HUB 02/09).
- 02/09 · Règle de présentation de Romain : toutes les listes CRM / type Excel au même format (celui de la liste des gagnants), rangées par catégorie et sous-catégorie ; tout ce qui concerne un pro ou un event rassemblé vers lui. Gabarit unique `ListeCRM.tsx` (HUB 02/09).
- 16/09 · Référentiel fonctionnel écrit par Romain (50 requêtes ; Event, Super event, SA) : toute correction se mesure à lui. 7 lots faits le 16/09, 3 constats hors lots : comptes pro, events sans pro, GPS manquants. Source Notion REF, copie `docs/REFERENTIEL-fonctionnel-flowin.md`.
- 16/09 · Super event = tirage au sort uniquement, jeu choisi une fois sur le super event et hérité par les stations ; gain immédiat jamais sur un super event ; une opération = un bloc, une donnée à un seul endroit (REF lots 1-2).
- 16/09 · Menu pro à 4 entrées (Mes opérations, Nouvelle opération, Mes données, Mon compte) ; un seul parcours de création ; aperçu = le vrai jeu en cadre téléphone, rien n'est écrit ; charte espace pro de l'époque Manrope violet (#7C2D92) : REMPLACÉE par le bleu #3B5CC4 en novembre (voir mémoire et ERREURS 23/11) (REF).
- 27/07 · Autonomie quasi complète du pro (formulation de Romain) : inscription, logo, jeu, banques, période ; distribution des lots par tirage manuel OU retrait quasi immédiat ; reprendre ce qui existe côté SA, ne pas recoder. Hors de portée alors : consultation de 100+ questions sans scroll infini (REP27).
- 27/07 · À confirmer avec Romain (jamais validé) : mot de passe pro (reset côté SA), 3 degrés d'insertion super event. Ne pas les présenter comme décidés (REP27).
- 03/09 · Parcours de création : liste de secteurs INVENTÉE qui aurait écrasé le vrai secteur d'un pro ; une seule source `lib/proCreation.ts`. Le champ « périmètre de jeu » (géofencing) ne faisait rien : le rendre réel ou le retirer, jamais un champ qui ment (retiré, commit `1f4ac4b8`) (REP03).
- 03/09 · `pros.partenaire_id` sans chemin d'écriture : cause racine de « créer un pro » incomplet (logo, site, réseaux vivent sur `partenaires`) ; SIRET en double pros / partenaires (REP03). État actuel à revérifier.
- 03/09 · Cinq entrées de menu sortent de l'app vers des pages HTML statiques (tirage, bons, facture, visuels, plaquette) : à intégrer ou à signaler à l'écran, décision Romain en attente (REP03).
- 31/08 · Romain frustré : plusieurs heures sans retour sur « Events en 1 page ». Règle : point d'avancement explicite sur CHAQUE chantier ouvert, pas seulement celui en cours (HUB 31/08).
- 14/07 · Entonnoir mesuré : arrivée 202, quiz 198, résultats 96 : la fuite (102 sur 198) est PENDANT le quiz, le formulaire ne perd personne ; libellé « Bravo, ton ticket est là ! » ; PWA installable jugée le meilleur rapport effet / effort (HUB 14/07).
- 28/06 · Cap produit (PIL) : outil d'animation digitale RÉCURRENTE pour commerces, commerçants, producteurs ; NDS 2026 = vitrine. Mécanique 4/4 = 1 ticket (+1 bonus), 1 partie par jour et par station.
- 24/11 · Flowin Hub : accès administrateur / pro / participant en carrousel + liens de démo `/jouer?m=quiz|tombola|spin|quizsolo` (aucun enregistrement selon ETAT 17/11). Les pages d'installation admin-app, pro-app, joueur-app utilisent encore un bouton violet (#7A4FE0), contraire à la règle « jamais de violet » : à corriger en bleu #3B5CC4 si Romain valide.
