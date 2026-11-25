# Écarts : actuel contre cible, ordre par gain (25/11/2026)

Légende : Impact et Effort de 1 à 5. « Tests avant » = à écrire AVANT de toucher au code. Tag de reprise avant toute étape de code : `git tag avant-<ecart>`.
Déjà au carnet, non re-proposés : AMEL-ARC-01 (3 fichiers morts), AMEL-ARC-02 (playwright en devDependencies), AMEL-PERF-01 (médias lourds), AMEL-CAR-01/02 (cartes).

## E1. Fonctions Super Event publiques et lectures trop larges (impact 5, effort 1)
- Preuve (base, 25/11) : `supprimer_super_event(text,text)`, `realigner_composition_super_events()`, `dupliquer_super_event(...)`, `enregistrer_resultats_tirage_super(text,text)` sont SECURITY DEFINER avec EXECUTE accordé à `anon` (`has_function_privilege`), sans `est_super_admin()` ni `auth.uid()` dans le corps lu. `sql/2026-09-02-supprimer-super-event.sql:72-75` : `GRANT ... TO PUBLIC, anon`. `supprimer_super_event` n'exige que le nom exact du Super Event et l'absence d'activité (0 participation, 0 tirage) : il supprime alors les `events` du Super Event.
- Preuve (base) : `demandes_rattachement_super_event` : politique `lecture demandes rattachement` = SELECT pour `public`, `true`, avec colonnes `note_sa`, `nom_commerce`, `adresse`, `lots`, `offre` lisibles par `anon` (26 colonnes).
- Preuve (base) : `joueurs` : le masquage « e-mail et téléphone seulement si consentement » n'existe que dans la RPC `crm_pro`. En lecture directe de la table, un pro qui a eu un participant (`flowin_pro_voit_joueur`) lit toutes les colonnes (SELECT accordé à `authenticated` sur 53 colonnes dont `email`, `tel`, `optin`). Contournable par un pro avec la clé publique et sa session.
- Bénéfice : un Super Event de démo ou futur ne peut pas être effacé ou altéré par un tiers ; l'isolation CRM devient réelle.
- Risque : casser le bouton « Supprimer » ou « Dupliquer » du dashboard (il appelle ces RPC avec la session SA) : ajouter `est_super_admin()` ne casse rien si la session SA est envoyée (à tester).
- Tests avant : appel anonyme refusé (42501), appel SA accepté, pour chaque RPC ; lecture directe `joueurs` par un pro : colonnes limitées (vue ou colonne retirée).
- Retour arrière : SQL de rollback en pied de fichier (comme `sql/2026-11-23-crm-pro-securise.sql`), tag avant.
- Dépend de Romain : oui (clic Supabase pour appliquer, règle REGLES.md du 21/11). Non vérifié : appels réels, par prudence ; aucune écriture faite. Confier à `securite-donnees`.

## E2. Deux écrans de création d'animation (impact 5, effort 3)
- Preuve : pro = `app/pro/nouvelle/page.tsx:60-64` rend `Configurateur` (575 lignes, 4 groupes Jeu, Lots, Diffusion, Validation) ; SA = `components/creation/ParcoursCreationSA.tsx` rend `ParcoursCreation mode="sa"` (1 867 lignes, étapes « Votre animation, Jeu, Lots, Diffusion & QR », `ParcoursCreation.tsx:1144-1148`). Les deux appellent `creerAnimation` (`lib/pro.ts:145`) mais avec leur propre état, leurs propres lots (`lotVide` défini 2 fois : `ParcoursCreation.tsx:112`, `LotFormulaire.tsx`), leur propre diffusion. La décision de Romain du 29/10 (« même interface chez le pro et chez le SA ») est rompue depuis le 10/11 : le pro a le Configurateur, le SA a l'ancien parcours. `ParcoursCreation` ne sert plus le pro que pour « rejoindre » et « proposer un Super Event ».
- Bénéfice : un bug ou un changement de design = 1 écran (Configurateur) au lieu de 2 ; `ParcoursCreation` se réduit à Super Event (création et rejoindre).
- Risque : le SA a des droits en plus (rattachement direct, création de Super Event, pas de commande) : à porter par un paramètre `droits`, pas par un second composant. Une régression se verrait sur le QR final.
- Tests avant : test de caractérisation de `creerAnimation` (entrées SA et pro, lignes `events`, `lots`, `qr_stations` attendues) ; Playwright 390 px : créer une animation quiz avec 2 lots, mode pro puis mode SA, comparer les lignes créées (base de test ou démo `?demo=1`, 0 écriture).
- Retour arrière : tag, `git revert` du seul commit de bascule ; l'ancien écran SA reste en place derrière un paramètre jusqu'à validation.
- Dépend de Romain : oui (validation de la maquette du SA, règle « maquette d'abord »).

## E3. Parcours Super Admin plus long et sans accès créé (impact 4, effort 2)
- Preuve : `app/dashboard/pros/page.tsx` : aucune action « animation » sur la ligne d'un pro (grep `wizard-event` : seulement Sidebar, jeux, events, super-events, wizard-pro). `app/dashboard/wizard-pro/page.tsx:105-112` : `upsertPro(lignePro(f,'sa',statut))` écrit la fiche, sans compte Auth ni invitation ; base : 18 pros sur 21 sans `auth_id`, 6 sans aucun event. Le texte d'aide dit « Un pro n'a pas encore de station ». `lib/proCreation.ts:1-30` promet « une seule définition » (03/09) mais le pro a désormais 3 écrans (`lib/inscriptionPro.ts:77`) et le SA 5 étapes (`ETAPES_FICHE_PRO`).
- Bénéfice : les 3 cas du SA (PARCOURS-CREATION.md) passent par le même écran de création, en 1 point d'entrée ; le pro invité peut se connecter.
- Risque : l'invitation envoie un e-mail : règle « aucun envoi sans go de Romain » et « pas d'e-mail aux clients » (c'est un pro, pas un client, mais à confirmer). Ne pas changer `notify-*`.
- Tests avant : liste des états d'un pro (valide / en attente, avec / sans auth) et de l'écran attendu pour chacun ; test que le lien « Lancer une animation » porte `?pro=`.
- Retour arrière : bouton retiré par `git revert` ; pas de SQL.
- Dépend de Romain : oui (mode d'invitation : lien magique, mot de passe temporaire ou « Mot de passe oublié » guidé). Rejoint AMEL-ERG-08 (déjà au carnet : bouton « Créer son animation »).

## E4. Le formulaire de lot existe en 4 à 5 exemplaires (impact 4, effort 3)
- Preuve : (1) `components/creation/LotFormulaire.tsx` (206 lignes, utilisé seulement par `Configurateur`) ; (2) formulaire de lots dans `ParcoursCreation.tsx` (type `Lot` propre, ligne 86 ; lots du Super Event dans `se_lots`, lignes 791-805) ; (3) `components/operations/ModalGererLots.tsx` (édition, champ `conditions` ligne 335) ; (4) `public/dashboard.html:3947-3978` (formulaire `tk-*` et 3 `prompt()` pour les lots partenaires) ; (5) `components/masters/SelecteurLot.tsx` (choix côté jeu). La règle du 24/11 (formulaire complet obligatoire : intitulé, conditions, quantité, valeur, aperçu ticket, jamais de simples boutons) doit donc être appliquée 4 fois.
- Bénéfice : une règle de lot = un fichier ; le prompt() du dashboard disparaît du chemin du pro.
- Risque : `lots` (animation) et `se_lots` (Super Event) n'ont pas les mêmes colonnes (`se_lots` : `libelle`, `valeur`, `rang`, `phase`) : unifier l'écran, pas la table.
- Tests avant : test pur de `verifierLot` / `lotVide` ; capture des 4 écrans actuels pour comparaison.
- Retour arrière : `git revert` par écran, un écran à la fois.
- Dépend de Romain : non (règle déjà décidée le 24/11).

## E5. Règles du Super Event dispersées, Nuits du Sud en dur (impact 4, effort 3)
- Preuve : voir REGLES-ESPACES.md : 210 `super_event_id` dans 59 fichiers (`app`, `components`, `lib`) ; 50 `estSuper` dans `ParcoursCreation.tsx` ; 44 occurrences de `se-nds-2026` / `ev-nds-` dans 21 fichiers .ts/.tsx (dont `lib/superEventPhases.ts` `SE_SANS_PHASES = ['se-nds-2026']`, `lib/mesLots.ts` `SANS_PEREMPTION`, `BilletApercu.tsx`) et 12 dans `dashboard.html`. Côté base : 5 fonctions de règle différentes (`appliquer_regle_gain` animation, `se_attribuer_partie` Super Event, `tirage_super_event`, `tirage_lot`, `tirage_soir`), chacune lit `super_event_id` à sa façon.
- Bénéfice : ajouter un 2e Super Event (hors NDS) sans copier des `if` ; une règle lue au même endroit pour le code et pour les tests.
- Risque : moyen : NDS fonctionne, `NDS2026Client.tsx` intouchable. On ajoute le fichier de règles et on y branche les appelants un par un, jamais NDS2026Client.
- Tests avant : un test par ligne du tableau de REGLES-ESPACES.md (fonctions pures), plus lecture de `lirePhases` sur 3 Super Events réels.
- Retour arrière : tag ; chaque appelant migré dans son propre commit.
- Dépend de Romain : non pour le code ; oui pour l'exception NDS (confirmer que « sans phases » devient un réglage du Super Event, pas un identifiant).

## E6. Deux interfaces Super Admin (impact 3, effort 4)
- Preuve : `public/dashboard.html` 15 665 lignes (1 164 821 octets), miroir MD5 identique `2da91ded…` ; Next : 56 pages dans `app/dashboard` (9 760 lignes) + `components/dashboard` (6 280). Commits depuis le 01/11 : 46 sur la partie Next, 6 sur le monolithe (dernier 24/11). `app/dashboard/maintenance/page.tsx:138` : « le monolithe reste en production en parallèle ». La mémoire de l'agent note que les KPI du monolithe perdus à la migration sont une régression à corriger AVANT retrait.
- Bénéfice : un seul SA à corriger. Gain réel seulement après E2 à E4 : ne pas commencer par là.
- Risque : élevé (contraintes Acorn 2020, miroir). Aucun retrait sans Romain ni liste de vues restantes.
- Tests avant : inventaire vue par vue (monolithe contre Next) avec statut ; Playwright `?demo=1` des deux côtés.
- Retour arrière : le monolithe n'est pas supprimé ; seulement masqué du menu, tag avant.
- Dépend de Romain : oui. Proposition : ne PAS lancer maintenant ; seulement geler les nouvelles fonctions côté monolithe.

## E7. Design : pas de jeton unique (impact 3, effort 3)
- Preuve : couleurs définies dans `lib/charte.ts` (110 lignes), `app/dashboard/globals.css` (5 variables `--`), `lib/masters/css.ts` (66 `--fl-`), `public/flowin-tokens.css`, `public/flowin-theme.css`, `lib/nds2026Design.ts` (intouchable) ; 41 pages `public/*.html` avec leur propre `:root` ; 4 519 `style={{` dans `app` + `components` ; le bleu `#3B5CC4` apparaît dans 58 fichiers .ts/.tsx ; l'orange `#C2410C` dans 21. `docs/DESIGN-TOKENS-flowin.md` documente encore `--fl-violet` (interdit par la règle du 09/11, AMEL-DES-01 ouverte).
- Bénéfice : changer une couleur ou un bouton = 1 fichier ; cohérence entre pro, SA, joueur.
- Risque : visuel : le joueur « prend les couleurs du commerçant » (`parcoursTheme.ts`) : ne pas fusionner joueur et admin.
- Tests avant : capture 390 px des 10 écrans les plus vus avant/après (règle « fait = preuves »).
- Retour arrière : `git revert`.
- Dépend de Romain : non pour les jetons admin ; oui pour toute valeur de couleur nouvelle.

## E8. Code et pages sans trafic (impact 2, effort 1)
- Preuve : `masterOff` : 0 animation sur 68 (`events.cfg->>'masterOff'`), donc les 5 anciens clients `QuizClient` 320, `SpinClient` 487, `TombolaClient` 358, `VoteClient` 311, `QuizsoloClient` 188 = 1 664 lignes ne sont atteints par aucun QR actuel. Tous les `qrUrl` pointent vers `/parcours/<module>`, qui redirige vers `/jouer` (`lib/masters/redirection.ts`) sauf `nds2026` (54 events) et `quizmaster` (1). Attention : `SPEC-TECHNIQUE` §6 interdit de modifier `SpinClient` et `QuizClient` : à retirer seulement sur instruction de Romain. Doublon `admin/parcours/*.html` identique à `admin/public/parcours/*.html` (diff : aucun écart).
- Bénéfice : moins de surface à lire et à corriger ; faible.
- Risque : un ancien QR imprimé avec `masterOff`. Aucun en base ; le contrôle quotidien peut le surveiller.
- Tests avant : requête `masterOff` à 0 la veille ; smoke des 7 URL `/parcours/*` et de `/q/<code>`.
- Retour arrière : tag puis `git revert`.
- Dépend de Romain : oui (zone « modules maîtres »).

## E9. Pas de filet de tests (impact 4, effort 2)
- Preuve : aucun fichier `*.test.*` ni `*.spec.*` (find) ; `admin/package.json` : scripts `dev`, `build`, `start`, `verifier:emojis` seulement ; `.github/workflows/controle-qualite.yml` = smoke + types + Acorn + secrets, une seule exécution possible sur le dépôt. `tsconfig` : `strict: false` (mémoire 21/11).
- Bénéfice : condition de E2, E4, E5. Les `lib/*.ts` pures (`lib/pro.ts` lignes de `creerAnimation`, `lib/superEventPhases.ts`, `lib/masters/tickets.ts` `composerGroupes`, `lib/proCreation.ts`) se testent sans réseau.
- Risque : nul (ajout seul). Éviter d'ajouter un lourd framework : un runner léger suffit.
- Tests avant : sans objet (c'est le filet).
- Retour arrière : supprimer le dossier de tests.
- Dépend de Romain : non.

## E10. Automatisations : 2 tâches planifiées, des trous (impact 3, effort 2)
- Preuve (base) : `cron.job` : `tickets-rappels` (09:07 UTC, appelle `tickets_rappels_du_jour()` et la fonction `rappel-tickets`) et `controle-qualite-quotidien` (03:17 UTC). Dernier passage 25/11 03:17 : 19 vert, 6 orange, 5 rouge (`tirages_depassent_lots`, `tirages_sans_joueur`, `test_events`, `test_super_events`, `test_comptes_auth`). 11 fonctions Edge actives, 4 sans source dans le dépôt (`notify-migration-eleve`, `reset-partenaire-revision`, `cron-cloture-ligue`, `generer-ia`, probablement Flow-révision, non prouvé). `push-envoyer` déployée mais notifications push non implémentées côté application (REGLES 24/11).
- Trous : (a) aucune alerte automatique quand un contrôle passe au rouge (lecture manuelle) ; (b) aucune tâche pour relancer un pro dont la demande est `en_attente` ou qui n'a pas d'animation (6 pros sans event) ; (c) aucune clôture automatique de Super Event (tirage manuel par Flowin, voulu) ; (d) la comparaison fonctions déployées / dépôt n'est pas automatisée (PLAN-DE-REPRISE).
- Bénéfice : détecter sans lire ; ne rien envoyer à un client.
- Risque : tout envoi demande le go de Romain. Les contrôles restent en lecture seule.
- Tests avant : exécution à blanc, sortie dans `controles_qualite` uniquement.
- Retour arrière : `cron.unschedule` du seul job ajouté.
- Dépend de Romain : oui (qui reçoit l'alerte, par quel canal).

## Propositions retenues pour le carnet (5 au plus)
AMEL-ARC-03 (E2 + E3 en un seul chantier de maquette), AMEL-ARC-04 (E4), AMEL-ARC-05 (E5), AMEL-ARC-06 (E9), AMEL-ARC-07 (E1 : transmise à `securite-donnees`, pas une proposition d'architecture). E6 à E8 et E10 : restent ici, hors carnet, tant que E9 n'existe pas.
