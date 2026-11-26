# Journal des livraisons (reconstruit de `git log`, 1 987 commits au 21/11/2026)

Une ligne par livraison : date | ce qui est livré | commit(s). Détail : `git show <hash>`. Mai à octobre sont résumés par période ; novembre est détaillé. Nouvelle livraison : ajouter en tête de la section du mois.
Ce journal n'est pas une preuve de production : l'état vérifié est dans `ETAT.md`.

## Mai à octobre 2026 (résumé)
- 11/05 | Dépôt créé « Flowin v28 » : admin, landing, parcours, sql | premiers commits
- 11-21/05 | Parcours joueur branchés sur Supabase, seeds Pâques (186 joueurs), parcours par module, Next.js de bout en bout, landing en Next.js | 342 commits en mai
- 06/2026 | Super Event Nuits du Sud : parcours NDS2026 (master React v24), carte, parrainage, opt-in, CRM landing, bon de commande OPConsult / BAITA EURL, CGV éditables | 557 commits
- 24-28/06 | Supports festival : forex, A4 « jouez ici », vidéo de présentation, SVG Canva, kit digital partenaires | charte cinétique
- 07/2026 | Festival NDS 9-18 juillet ; 19-20/07 audit de comptage, clôture, tirages, billets partenaires, 6 bugs corrigés | 440 commits ; HANDOFF 19-20/07
- 08/2026 | Dashboard SA : motifs de bugs récurrents (pattern A à K), navigation, gagnants sur `tirages`, multi-super-event, `tirage_lot` contrôle la quantité | 21-31/08 ; `docs/patterns-bugs-connus.md`
- 09/2026 | Espace pro simplifié, parcours de création unique, `/rejoindre` en 4 étapes, NDS 2026 devient gabarit marque blanche « Quiz + bonus », CRM pro | 02-20/09
- 28/10-01/11 | Jeux masters, parcours de création unique pro / SA, QR permanents `/q/<code>`, tirage programmé, bon de commande v2, outils commerciaux (lien, WhatsApp, `?src=`) | `b994e0fd`, `6680c71d`, `7623bfce`
- 02-03/11 | Applications installables, mot de passe oublié pro, banques de questions par métier, animations v16 à v22 dans le super admin | `45a8f5d7`, `1450c856`
- 07/11 | Sécurité des écritures (connexion admin), pictogrammes à la place des emojis + garde-fou, couleurs bleu #3B5CC4 / orange #C2410C | `1afc69ae`, `edf442da`, `883753c2`

## 08-09 novembre : refonte et plaquettes
- 08/11 | Fichier DECISIONS, cadrage de la refonte, visite guidée Flowin (démo cliquable), plaquettes en validation, audits et veille | `e8b76d80`, `cba173b5`, `e1ed23f8`
- 09/11 | Registre des livrables ; plaquettes V3 Animation et Super Event (audits, corrections) ; argumentaire de référence ; vidéos de présentation en brouillon | `1c33e074`, `d71e67a6`, `b5babcdb`, `7f9e0cd9`
- 09/11 | Espace pro aux couleurs plaquette ; choix d'offre et virement à la publication ; demande Super Event station / sponsor ; « Être recontacté » branché CRM | `9211ecd6`, `b92833c5`, `eaae315b`, `32e1da53`

## 10 novembre : espace pro, configurateur, films v4
- 10/11 | Scénarios V2 à V4, 5 films réseaux sociaux v4 (rythme lent, versions 15 s, QR par cible) | `37911ba7`, `3d14e42d`, `0f50d800`
- 10/11 | Règles d'interface absolues, offres 445 / 990 / 110, quiz Flowin 145, bon de commande « Valider mon bon de commande », QR SEPA | `b6801446`, `88c42a83`, `11bf48dc`
- 10/11 | Configurateur pro en carrousel, import du fichier client (CSV, Excel), tickets gagnants dans le profil (offrir à un ami, rappels), caisse : billet expiré | `4bd55ea4`, `aea8a69e`, `12a2cffa`, `6d02da95`
- 10/11 | Espace pro v3 (rapport en carrousel, Hommes/Femmes, chalandise, égaliseur), QR = métrique par support, plus de violet, mode démo global `?demo=1`, page de validation sans login | `5617d00a`, `2c113413`, `33a47d59`, `5f89ff26`, `450bc57b`
- 10/11 | Fonction `notify-commande-animation` (aucun e-mail client), super admin en bleu, exception NDS sans péremption, constat Révision / Supabase | `05f828ba`, `e173d7df`, `c0188800`, `f482b0e6`

## 17 novembre : audit des 5 experts
- 17/11 | Jeux (tombola, démo sans écriture, gestes), profil /moi en 5 rubriques, carte MapLibre, cohérence app / films / plaquettes, pro et SA mobile (cartes, 44 px) | `8842ce42`, `b0ba7b1c`, `27983214`, `c3798924`, `55a07660`
- 17/11 | Rapport final d'audit et contrôle de non-régression ; coordonnées en 2 volets ; parrainage en fin de parcours et dans le profil ; connexion joueur par lien e-mail | `e292c06a`, `31c22456`, `d4607327`
- 17/11 | Films v4 : roue identique à l'app ; démo : billet de la roue montré ; étude L14 coût et tenue des e-mails ; décision 10 € HT par QR au-delà de 2 | `ab91188b`, `da714262`, `989af956`, `45153860`
- 17-18/11 | Annonces des commerces dans l'application ; modèles d'e-mails Supabase FR | `0dd3afb8`

## 18 novembre : tirage, vidéos v6, plan commercial
- 18/11 | Vidéos L3 / L4 / L5 en 9:16 et 16:9, brouillons au super admin ; storyboards v2 et v3 | `147c799b`, `2bd5a08b`, `4161f68e`, `3c20f7bf`
- 18/11 | Promesse et signature dans l'argumentaire ; plan d'action commercial par profil ; scripts de voix off ; fin L3 + voix Vivienne sur les 12 vidéos | `9caed853`, `8591354d`, `f8c1d075`, `35f53f77`
- 18/11 | Vidéo L3 v7 « Bienvenue sur Flowin » (45 s et 30 s) | `e988cba5`
- 18/11 | Tirage : test de bout en bout, un gain par joueur ; écritures fermées à anon (SQL) | `cc52bdd4`, `f09e123d`

## 19 novembre : audit promesse, sécurité, e-mails
- 19/11 | Audit promesse L3 (choix du gain, animation sur la carte) et vidéos L3 v8 (voix lente) | `0632a585`, `65a29ae9`
- 19/11 | Audit promesse L4 (scanner caméra, Super Event toujours en tirage), vidéos L4 v8, Super Event en deux phases | `3116d24f`, `b07e3e58`, `0cb9ba37`
- 19/11 | Sécurité events (plus d'upsert seed au chargement, `?demo=1`) et RLS tables (lots, super_events, qr_stations, participations, joueurs, tirages) | `b4a0e1a3`, `b8011603`
- 19/11 | E-mails par Gmail SMTP avec garde-fou 450/jour ; RLS phase 2 (SQL, `prospection.html` sous jeton SA) | `15c73d94`, `5b5b8363`
- 19/11 | Sécurité joueurs : tickets, gains, réponses, parrainage par RPC (parties A et B) ; docs « appliqué en prod » | `579b6f8e`, `6e2b0bf4`, `010b81a0`, `082c795b`
- 19/11 | Sécurité joueurs partie C (lectures par RPC) : code et SQL | `b55d4346`

## 20 novembre : E2E de production et correctifs
- 20/11 | Partie C appliquée en prod ; e-mails Gmail en service (`rappel-tickets` v3, `notify-commande-animation` v6) | `1c221393`, `6c909ddc`
- 20/11 | Décisions : assiduité = Flow ; qui lance le tirage | `ca5c22f5`, `bfff3443`, `7662ab0a`, `c8367256`
- 20/11 | Pro : listes fraîches (no-store), historique à une animation ; animation sans paiement en ligne ; `lot.html` jeton pro ; mailer Gmail sur `send-ticket-gagnant` | `f6037979`, `e419f5f5`, `04bdba19`, `d57e5a2a`
- 20/11 | SQL super_events pro orga ; `/rejoindre` no-store ; rapport E2E et SQL de nettoyage TEST | `238a2ac7`, `b3af34ae`, `eff16897`
- 20/11 | Gain immédiat sans texte de tirage ; `rappel-tickets` protégé par secret Vault (appliqué) | `fa367482`, `4aebe4e4`
- 20/11 | Notifications sur le mailer Gmail, résultat de tirage dans l'application ; Super Event créé par un pro : lots avec sa session ; rejeu E2E 5 et 7 | `1689dcf2`, `cc0c17f3`, `47854e12`

## 21 novembre
- 21/11 | `notify-bon-commande` : copie du bon signé de nouveau envoyée au signataire (comportement v2 voulu) | `b810cd56`
- 21/11 | Prompt « mémoire et agents » (version légère) | `99fc4beb`
- 21/11 | Mémoire partagée et agents dédiés : `docs/claude/`, `.claude/agents/` | ce commit
- 21/11 | Règle « mémoire à jour à chaque travail » ajoutée à CLAUDE.md (demande de Romain) | ce commit
- 21/11 | Sécurité appliquée en prod 19-20/11 (tirage, RLS lots/events/tables, RPC joueurs parties A/B/C1/C2, phases Super Event, annonces, banque intérêts) ; e-mails via Gmail (Auth + fonctions) ; nettoyage TEST-2 en attente de Romain | voir ETAT.md
- 21/11 | Équipe critique : agents critique-ergonomie, critique-innovation, critique-performance-donnees, veille-marche ; mémoires ; carnet AMELIORATIONS.md ; premier passage (16 propositions) | ce commit
- 21/11 | Contrôles automatiques niveau 2 : `scripts/controle/`, workflow `controle-qualite.yml`, rapport PDF `docs/rapports/`, `docs/claude/CONTROLES.md` | ce commit
- 21/11 | Contrôles qualité niveau 1 appliqués en prod (tables, 6 fonctions, cron 03:17 UTC), premier passage : 30 contrôles, 4 rouges (pros lisible par anon, TRUNCATE emails_compteur_jour, lot tiré au-delà du stock, tirage sans joueur) | `sql/2026-11-21-controles-qualite.sql`
- 21/11 | Agents `critique-architecture-code` et `continuite-reprise`, `PLAN-DE-REPRISE.md`, tags `prod-2026-11-21`, `sec-2026-11-20`, `email-gmail-2026-11-20` (locaux : push refusé 403) | ce commit
- 21/11 | Prompt maître v3 : alertes courtes, zone d'autonomie, pas de rapports périodiques | ce commit
- 21/11 | Sécurité `pros` : partie A en prod (4 RPC), code `bd844bdc` déployé (21 pages démo : 200, 0 non-GET, 0 erreur JS) ; partie B (drop de `pros_anon_select`) en attente de confirmation de Romain (timeout) | `sql/2026-11-21-pros-lecture-publique.sql`, `docs/SECURITE-pros-2026-11-21.md`
- 21/11 | Règle d'accès et de sécurité inscrite dans la feuille de route du Super Admin (lib/roadmap.ts) et REGLES.md | ce commit
- 23/11 | Romain recadre les priorités (fonctionnement de bout en bout, ergonomie, CRM, banques) ; nettoyage des tests non prioritaire ; stock baisse au retrait | ce commit
- 23/11 | Fuite crm_pro / crm_participants fermée (migration + code a9db7a3f) ; audits import fichier client et ergonomie ; premier passage du gardien (PR #97) ; mémoire mise à jour | ce commit
- 23/11 | CRM pro : cellules vides et infos décalées corrigées (Contact non partagé, cartes mobiles alignées, session SA expirée dite clairement) ; vérifié Playwright 390 et 1440 px en démo, 0 requête non-GET ; prod et téléphone réel NON vérifiés | ce commit
- 23/11 | Vision « clac clac boum boum » : budgets de clics par parcours (VISION-ERGONOMIE.md), maquette Super Event wow, AMEL-VIS-01 à 08 ; CRM pro corrigé (cases vides, lignes décalées, session expirée) | ce commit
- 23/11 | Lot ergonomie 1 : écran « C'est en ligne » (coche animée, confettis CSS, QR, affiche A4, partage), fin d'inscription vers le Configurateur en 1 toucher, violet retiré du code application, un seul vert de succès, cibles 44 px et police 12 px dans l'espace pro, progression stable en 4 groupes | commit lot ergonomie 1
- 23/11 | Lot ergonomie 2 : page Super Event publique en orange avec logo, éclat et carrousel des commerces ; joueur reconnu (formulaire replié, 3 cases intactes) ; ticket validé avec confettis et n° sur une ligne ; violet retiré du moteur ; /moi avec « Mes tickets » en tête et bouton bleu ; vérifié en démo 390 et 1440 px, production non vérifiée | commit lot ergonomie 2
- 23/11/2026 · Maquette lot 4 (page publique Super Event : bandeau réduit, carte centrale, carrousel de logos, repères = logos, « vous êtes ici », progression) : docs/maquette/lot4/, en attente de validation de Romain, aucun code.
- 23/11/2026 · Maquette lot 4 v2 (retour Romain : bandeau plus grand et cliquable, carte riche comme la page actuelle, moins plate) : docs/maquette/lot4/se-page-publique-v2.*, en attente de validation, aucun code.
- 24/11/2026 · Sécurité : accès public fermé sur 5 fonctions d'export (migration securite_fermer_exports_anon, retour arrière = grant). Suppression de pros_anon_select validée par Romain mais confirmation Supabase sans réponse (timeout), à relancer. Page /se/[se] codée (branche worktree, non poussée), règle jeu sur place en cours.
- 24/11/2026 · Page /se/[se] lot 4 mise en ligne (repères logo, carrousel, jeu sur place 150 m) ; audit jeux/pro/carte : 3 techno de carte (MapLibre 7 écrans, Leaflet 4), gains pro encore en maquette. tsc OK, build lu par l'agent.
- 24/11/2026 · Une seule carte : repère commun admin/components/carte/repere.ts, nds-carte et dashboard.html en MapLibre, lien carte des commerces sur /se ; non vérifié avec vrai compte SA ni iPhone.
- 24/11/2026 · Maquettes lot 5 (jeu, roue, tombola, quiz animé, stats, affiche) dans docs/maquette/lot5, en attente de validation de Romain (9 décisions dans lot5-LISEZMOI.md), aucun code.
- 24/11/2026 · Retour Romain lot 5 : validé sauf formulaire de lot complet et QR de traçabilité par support avec nombre de flashs ; lot 6 de maquettes lancé (lots, Mes QR, tableau de bord commerce). Aucun code.
- 24/11/2026 · Maquettes lot 6 (lots avec ticket en direct, Mes QR, accueil commerce, compte joueur sans mot de passe) dans docs/maquette/lot6, en attente de validation de Romain, aucun code.
- 24/11/2026 · Historique 6 mois (Notion + git) injecté dans les mémoires des 13 agents, ERREURS.md (+22), REGLES.md (+9) ; 4 points À TRANCHER (base Révision, région Supabase, prix, signature) ; pages Notion non lues : SPEC, Technique, Produit, Commercial, Suivi des tâches.
- 24/11/2026 · Décision Romain : compte joueur téléphone d'abord, rappels activés par défaut, pas d'invitation écran d'accueil ; maquette lot 6 G à simplifier avant tout code.
- 24/11/2026 · Notifications push par défaut : agent lancé (code, VAPID privée à déposer par Romain dans les secrets Supabase), non poussé.
- 24/11/2026 · Lot 3 validé, codage lancé en parallèle (inscription+rejoindre, configurateur+lots+QR, jeux animés+sons) ; maquette pixel art arcade (lot 7) lancée ; disque libéré (10 worktrees retirés, déjà publiés).
- 24/11/2026 · Rappels Web Push : migration push_abonnements appliquée, code fusionné (be7db9a2). Secret VAPID, déploiement push-envoyer et cron : à faire.
- 24/11/2026 · Maquettes lot 7 pixel arcade (quiz, roue, choix du style, sons 8 bits) livrées dans docs/maquette/lot7-pixel, en attente de validation de Romain, aucun code.
- 24/11/2026 · Lot 5 D codé et fusionné (44ec73ce) : quiz animé avec série, bonus une question par écran, roue image par image, sons Web Audio avec bouton couper ; tsc OK, démo 390 px, sons non écoutés, non vérifié en production.
- 24/11/2026 · Configurateur 4 écrans, formulaire de lot complet (aperçu ticket), Mes QR avec flashs et remplacement, affiche perso : codés et fusionnés (4 commits agent a94d67fd) ; migration lots_cessible_qr_remplacer appliquée ; texte du lot par date stocké mais non appliqué par le jeu ; non vérifié en production ni sur téléphone.
- 24/11/2026 · Lot 3 codé et fusionné (488b21ba) : inscription pro 3 écrans, rejoindre Super Event 3 écrans ; tsc, build, 20 tests OK ; aucune inscription réelle testée ; à valider : accueil des offres supprimé, choix commerce/annonceur supprimé, pack Animation non décochable.
- 24/11/2026 · Maquettes lot 7 pixel refaites en charte claire, directions A et B, sans mascotte (docs/maquette/lot7-pixel), en attente du choix de Romain, aucun code.
- 24/11/2026 · Accueil commerce en carrousel et statistiques pro codés et fusionnés (ed871cb5) ; RPC stats_pro_audience non appliquée (écran affiche Bientôt sauf flashs). Connexion joueur lien+code : code prêt dans la branche agent-a7b74f213046daf97, migration en attente de confirmation de Romain dans Supabase, NON fusionné.
- 25/11/2026 · Structure « profils + rubriques » installée (docs/ESSENTIEL.md, docs/claude/univers/, docs/claude/kit/) ; ancien CLAUDE.md conservé dans docs/claude/ancien-CLAUDE.md ; documentation seule, aucun code touché. Sessions : voir kit/SESSIONS.md.
- 26/11/2026 · Dashboard SA Next sur téléphone : page Animations et Super Events ne débordent plus (en-tête qui s'empile, colonnes en carrousel aimanté, grilles de 4 chiffres en 2). Fichiers : app/dashboard/globals.css, events/page.tsx, super-events/page.tsx. tsc 0 erreur, build OK. Non vérifié sur vrai téléphone.
- 24/11/2026 · Audit dashboard (capture de Romain : CRM Pro 0 fiches, CRM Utilisateurs 0 joueurs) : cause = app/dashboard/layout.tsx lit joueurs et pros côté serveur avec la clé publique, lecture anonyme fermée depuis la sécurisation ; base OK (842 joueurs, 21 pros lus en tant que SA). Correctif ChargeurDonneesSA (rechargement navigateur avec jeton SA) sur branche fix/dashboard-donnees-sa ; production NON vérifiée. Constats : factures et bons_commande lisibles en anonyme, vue export_crm_animation absente (SQL 08 non appliqué), prix non modifiables (lib/reglement.ts), aucun choix de pro dans Nouvelle animation / Banques.
