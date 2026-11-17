# Expert 1 — Jeux (fluidité, effet « gaming ») — audit du 17/11/2026

Périmètre : parcours joueur des masters (`/jouer`, vers lequel redirigent `/parcours/{quiz,quizsolo,spin,tombola,vote}`),
`lib/masters/engine.ts`, `lib/masters/css.ts`, `lib/masters/redirection.ts`, `app/jouer/JouerClient.tsx`.
NDS2026Client.tsx et nds2026Design.ts non modifiés. Design graphique validé conservé (seuls les points de l'expert 4 appliqués).

Méthode : Playwright sur un `next start` de copie (port 3471), mobile 390 x 844, chargement mesuré en « Fast 3G »
(562 ms de latence, 1,44 Mb/s) et CPU ralenti x4, parcours joué automatiquement du flash QR jusqu'au ticket.
Événements : `ev-demo-tombola`, `ev-demo-quiz` (quiz + bonus), `ev-demo-quizsolo`, `ev-demo-spin`, `ev-flowin-demo`.
Captures : `scratchpad/audit17/jeux/` (avant-*, apres-*, planche.png).

## Chiffres avant / après

| Jeu | Prêt à jouer (Fast 3G, CPU x4) | Gestes du flash au ticket | Écrans | Écritures Supabase en `?demo=1` |
|---|---|---|---|---|
| Tombola | 4,5 s → 4,1 s | **bloqué** (impasse sur le parrainage) → 10 | 8 (sans fin) → 9 | 0 → 0 |
| Quiz + bonus (5 questions, 4 bonus) | 4,4 s → 4,1 s | 29 → 21 | 20 → 20 | **3 → 0** |
| Quiz solo (5 questions) | 4,2 s → 4,1 s | 22 → 14 | 17 → 17 | **2 → 0** |
| Roue | 4,4 s → 4,1 s | 13 → 10 | 9 → 9 | 0 → 0 |
| Roue (ev-flowin-demo) | 4,2 s → 4,2 s | 14 → 10 | 9 → 9 | **3 → 0** |

Les gestes comptent aussi les 4 champs du formulaire et la case obligatoire. Le temps de chargement reste dominé par
le réseau (4 s en Fast 3G) : pas de régression. Le défilement du formulaire de coordonnées (587 px avant, environ
760 px après) augmente avec les deux choix « rester en contact » demandés par Romain ; les champs collectés sont inchangés.

## Constats et corrections

| Gravité | Jeu | Constat | Preuve | Correction faite |
|---|---|---|---|---|
| Bloquant | Tombola | Après « Valider mon ticket », l'écran Parrainage n'offre aucun bouton vers les coordonnées : le ticket est tiré avant l'inscription, donc `r.ticket` est déjà rempli et l'étape « Continuer : mes coordonnées » disparaît. Le joueur ne peut jamais enregistrer sa participation. | avant-tombola-07-c-parrainage-390.png | Nouvel état `inscrit` : le parrainage mène aux coordonnées tant que la partie n'est pas validée. Parcours complet jusqu'au ticket (apres-tombola-09-c-ticket-390.png). |
| Bloquant | Tous | `?demo=1` est perdu par la redirection `/parcours/<jeu>` → `/jouer` : la démo écrivait en base (PATCH joueurs, RPC, POST participations). Les lignes de test créées pendant l'audit (1 joueur `demo@example.invalid`, 3 participations, 1 réponse) ont été supprimées. | avant.json (`ecrituresSupabase`) | `demo` conservé dans `versMasterSiBesoin` ; vérifié : 0 requête non-GET vers supabase.co sur les 5 parcours. |
| Majeur | Tous | Une erreur d'envoi (téléphone incomplet, réseau) réaffiche le formulaire avec toutes les cases décochées, sexe et « comment nous as-tu connus » perdus : le bouton redevient grisé. | avant.json (VALIDER-DESACTIVE) | Cases et choix conservés dans l'état de la partie et réaffichés. |
| Majeur | Tous | Choix « rester en contact avec Flowin Event » et « rester en contact avec ce commerce » absents (seulement « participer à ses animations ») ; phrase « jamais vendues, échangées ni commercialisées » absente. | apres-quiz-19-c-inscription-390.png | Case obligatoire du jeu inchangée ; « Je souhaite rester en contact avec Flowin Event : offres, bons deals, prochains events. » (= optin) ; « Je souhaite rester en contact avec ce commerce : <nom>. » ; mention « Tes données sont utilisées par Flowin ou par le commerce choisi. Elles ne sont jamais vendues, échangées ni commercialisées. » Aucune case cochée par défaut. Choix commerce tracé dans `se_reponses` (`optin_commerce`), sans migration. Version `flowin-consentement-2026-11-17`. |
| Majeur | Quiz, solo | Après chaque réponse, un geste « Question suivante » obligatoire (5 gestes de plus). | avant-quiz-05-q-bonne-390.png | Enchaînement automatique : 2,2 s après une bonne réponse, 3,6 s après une erreur (le temps de lire la correction). Le bouton reste pour aller plus vite. |
| Moyen | Tous | Écran d'accueil « Bienvenue chez » : un geste sans décision. | avant-*-01-s-flash | Passage automatique à l'accueil après 2,6 s. |
| Moyen | Roue, tombola, vote | Après l'animation (roue 4,6 s, impression 3 s, urne 2 s), il faut toucher « Recevoir mon gain » / « Découvrir le résultat » / « Continuer ». | avant-spin-05-r-tourne-390.png | Enchaînement automatique à la fin de l'animation (6 s, 3,7 s, 2,9 s), bouton conservé. |
| Moyen | Tous | Aucun retour tactile. | — | `navigator.vibrate` (ignoré là où il n'existe pas, iOS) : toucher d'une réponse, bonne / mauvaise réponse, gain immédiat, ticket bonus, billet, ticket validé. |
| Moyen | Quiz | Pas de retour immédiat sur la réponse touchée (expert 4, point 3). | apres-quiz-04 | La réponse touchée passe en couleur pleine 260 ms avant le verdict vert / rouge ; double toucher ignoré. |
| Moyen | Tous | « Et après ? » faible après le ticket ou le billet : seul « Parrainer mes amis ». | apres-quiz-20-c-ticket-390.png | Ajout « Voir mes tickets dans mon profil » (ticket) et « Voir mon lot dans mon profil » + « Gagne d'autres tickets chez les commerces partenaires » (billet). |
| Mineur | Tous | Cibles tactiles < 44 px : barre de navigation (43 px), liens « Passer » / « Plus tard » (37 px), tranches d'âge (42 px). | avant.json `petitesCibles` | Hauteur minimale 44 px. Reste : bouton « Quitter » du bandeau démo (hors app réelle). |
| Mineur | Roue | Pointeur peu lisible, légende éclatée en colonnes (expert 4, points 1 et 2). | avant-spin-04-r-roue-390.png | Triangle rouge #E5322D cerné #0F172A, jante et moyeu cernés #0F172A, 6 secteurs inchangés ; légende sur une ligne centrée, date incluse. |
| Mineur | Quiz | Commerce peu visible pendant la question (expert 4, point 4). | apres-quiz-04 | Monogramme + nom du commerce dans la barre « QUESTION 1 / 5 », sans ligne de plus. |
| Mineur | Tombola | Fente vide, disques verts coupés en bas (expert 4, points 5 et 6). | avant-tombola-04-t-tirer-390.png | Amorce du billet (« Ticket n° », code-barres pointillé) sous la fente ; disques supprimés. |
| Mineur | Tous | Bouton principal violet (#7A4FE0 par défaut) au lieu du bleu des films (expert 4, point 7). | avant-quiz-05 | `--cta` des jeux = #3B5CC4. |
| Info | Tous | En démo, `appliquer_regle_gain` répond 400 (identifiant joueur fictif) ; 2 images 404 sur la tombola de démo. | apres.json | Sans effet joueur, laissé tel quel. |

## Non modifié, à arbitrer par Romain
- **Ordre parrainage → coordonnées** (décision du 31/10) : gardé. Le passer après le ticket ferait gagner 1 geste par jeu.
- **Écran « Avant de jouer »** (règles) : gardé (information obligatoire du jeu), 1 geste.
- Anciennes présentations (`cfg.masterOff`, composant `ParcoursConsentement`) : textes de consentement inchangés ; seuls les masters (tous les QR actuels) portent les nouveaux choix.

## Captures de la plaquette
`admin/public/validation/captures/app-jeu-{quiz,quiz-bonus,tombola,roue}.jpg` régénérées à 390 (520 px, `?demo=1`, bandeau démo masqué) après corrections.
