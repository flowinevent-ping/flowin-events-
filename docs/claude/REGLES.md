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
