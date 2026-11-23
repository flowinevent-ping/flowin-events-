# Audit design et ergonomie des parcours joueur (23/11/2026)

Auteur : critique-ergonomie. Lecture seule : aucune modification de code, aucune écriture en base. Romain décide. Complète `VISION-ERGONOMIE.md` (parcours 7) et `AMEL-VIS-05` (Super Event « wow », maquette `docs/maquette/super-event-wow.html`).

## 1. Méthode et limites
- Build local du dépôt rebasé sur `main` (`118cbdfe`), copie en scratchpad, `next start` port 4377. Playwright 390 x 844, `?demo=1`, tactile. Toutes les requêtes non GET vers supabase.co sont avortées par le script : 0 tentative. Pages Super Event lues en GET côté serveur (données réelles NDS, lecture seule).
- Script de mesure par écran : mots utiles (hors bandeau partenaires, navigation, barre d'état factice) / mots totaux, hauteur de défilement, cibles < 44 px, textes < 13 et < 14 px, contraste WCAG (fonds unis seulement), violet, emoji, débordement. Une vingtaine de captures regardées une à une, les autres analysées par le script seul.
- Geste = un toucher ou un champ saisi. Les attentes automatiques (animations, enchaînements) ne comptent pas.
- Faux positifs écartés : « labels 17 px » du formulaire (les champs font 53 px), « 1,00:1 » pendant une transition de réponse, barre « 9:41 » (aperçu seulement, absente en vrai).
- Mesure d'abandon déjà connue (21/11, tous événements) : quiz 761 visiteurs, inscription 374, tickets 54. Pas de nouvelle requête.

## 2. Tableau de bord par parcours
| Parcours | Écrans | Touchers | Champs | Gestes | Mots accueil (utiles/total) | Moments de récompense | Défilement > 1 écran |
|---|---|---|---|---|---|---|---|
| E1 Quiz + bonus (QR, ticket) | 15 | 16 | 5 | 21 | 92 / 192 | 5 sur 15 (+1 partiel) | accueil 1,41 ; bonus 1,40 ; ticket 1,15 ; parrainage 1,27 ; profil 2,0 |
| E2 Quiz solo | 11 | 9 | 5 | 14 | 90 / 189 | 4 sur 11 (+1 partiel) | idem |
| E3 Roue | 10 | 7 | 5 | 12 | 93 / 197 | 3 sur 10 | billet 1,08 |
| E4 Tombola | 10 | 7 | 5 | 12 | 92 / 196 | 2 sur 10 (+1 partiel) | idem |
| E5 Retour, même téléphone (quiz solo) | 11 | 9 | 0 (mais 2 volets affichés) | 9 | idem | idem | idem |
| F1 Page publique `/se/[se]` | 3 vues | 1 à 2 | 0 | 1 à 2 | 47 (carte fermée) / 321 (feuille) | 0 sur 3 | feuille 4,43 (22 lignes) |
| F2 Hub comics `/jouer?se=` | 5 | 3 | 0 | 3 | 62 / 148 | 2 sur 5 | 1,14 |
| G2 Retour, autre appareil | 4 vues | 4 + courriel | 1 | 5 | 56 | 0 | 1 |
| G3 Parrainage (après ticket) | 2 | 2 | 0 | 2 | 96 / 122 | 0 (points 0/3 seulement pour la roue) | 1,27 |
Réf. 17/11 (`EXPERT-1`) : quiz+bonus 21, solo 14, roue 10, tombola 10 : quiz+bonus concorde ; roue et tombola : 12 ici contre 10 (je compte 5 champs saisis, leur décompte de champs est inconnu). VISION compte 13 touchers au quiz solo : écart probable = les 3 « Question suivante » que le jeu enchaîne seul. Un joueur connu sur le même téléphone garde 9 touchers (quiz solo) : le formulaire rempli est quand même montré en 2 volets.
Moment de récompense = un écran où quelque chose se passe (confettis, vibration, anneau, tampon, compteur) et que le joueur ressent comme « fini ». Compté oui / non au vu des captures et du code (`AUTO_SUITE`, `VIBRATIONS`).

## 3. Parcours E : joueur dans un commerce (animation)
| Écran | Gestes pour sortir | Champs | Mots | Récompense | Retour | À préremplir ou automatiser | Défauts mesurés | Gravité |
|---|---|---|---|---|---|---|---|---|
| s-flash (QR) | 0 (auto 2,6 s) | 0 | 16 | oui : logo qui pop, carte | animation d'entrée | rien | aucun | - |
| s-accueil | 1 | 0 | 92/192 | non | bouton qui pulse | passer si déjà joué (c-demain existe) | défile 1,41 ; 20 textes < 14 px (unités « € », « offert » à 9,5 px) ; partenaires + nav + bouton = 40 % de la hauteur | faible |
| s-regles | 1 | 0 | 51/135 | non, aucune décision | aucun | fusionner avec l'accueil (VIS parcours 7) | 4 lignes de règles lues seulement pour cocher « C'est parti » | moyenne |
| Question x3 | 1 chacune | 0 | 25/104 | oui : confettis, vibration 35 ms, explication, avance seule à 2,2 s (3,6 s si faux) | très bon | - | anneau du chrono déborde de 26 px (x 362 à 416 sur 390) ; 7 textes < 14 px (min 9 px) | moyenne |
| q-resultat | 1 | 0 | 32/116 | oui : anneau de score, « Sans faute ! », ticket | bon | - | « ✓ » (glyphe texte) dans la barre d'étapes ; 14 textes < 14 px | faible |
| q-bonusintro | 1 | 0 | 22/33 | léger (+1 ticket) | - | fusionner avec le résultat | écran presque sans décision (Je réponds / Plus tard) | faible |
| q-bonus | 5 (4 choix + valider) | 4 | 62/93 | non, pas de compteur 2/4 | bouton grisé jusqu'à 4/4 | une question par écran, avance seule | 4e question sous le pli (1,40) ; « Valider » à ajouter à chaque fois | moyenne |
| q-bonusok | 1 | 0 | 24/33 | oui : +1 ticket, confettis | bon | - | confettis violets | faible |
| c-inscription volet 1 | 1 + 5 saisies | 5 | 44 | non (« Étape 1 sur 2 » en texte) | bouton « Continuer » | tout, si joueur connu (mesuré : 5 champs remplis mais écran montré) ; e-mail en premier pour retrouver un compte | aucune barre de progression visible ; 5 textes < 14 px | haute |
| c-inscription volet 2 | 1 case obligatoire + 1 valider (+ 4 choix facultatifs) | 0 | 66 | non | bouton grisé « Coche la première case » | âge pré-choisi si connu ; « source » jamais utile au 2e passage | chips 13,5 px ; 16 textes < 14 px | moyenne |
| c-ticket | 1 | 0 | 73/94 | partiel : ticket, n°, vibration 40 ms ; PAS de confettis (c-billet en a) | statique | - | n° coupé en 2 lignes (« PQ-2026- / 7846 ») ; carte « autres tickets » cachée sous le bouton (1,15) ; icône violette | moyenne |
| c-parrainage | 1 + 1 canal | 0 (e-mail seulement si non inscrit) | 96/122 | non | ouvre WhatsApp / SMS / mail | message prêt (existe) | 1,27 ; 11 textes < 13 px ; 1,2 % de parrainages (10 sur 842, 21/11) | moyenne |
| c-profil (moteur) | 1 | 0 | 111/170 | non | liste | - | 2,0 écrans de long (1 684 px) ; carte « résultats de tirage » en violet ; rond décoratif sur le nom | haute (règle carrousel) |
| c-demain | 0 | 0 | 29 | compte à rebours « 5 h 44 » | bon | - | aucun | - |
Roue : lancer 1 geste, résultat auto à 6 s (chip du résultat, confettis si gain, vibration 60-50-120 ms) : le meilleur moment de jeu. Tombola : « Tirer » puis impression automatique 3,7 s : bon. Les 3 jeux gardent accueil + règles + 2 volets identiques.
Contraste : monogramme commerçant blanc sur teal 3,94:1 (Café) et 3,43:1 (Fleuriste) à 15 px ; pastilles d'étapes 3,94:1 à 11 px.
Violet hors charte dans l'UI joueur (script) : confettis #7C5CC4 (`engine.ts` l. 152 et 214), `--fl-accent` #7A4FE0 (carte « résultats à découvrir », icône « autres commerces »), `.g-remise` et `.g-service` #F1ECFA. La roue (case -10 %) et le quiz solo en prune #8E3B6E : design validé 17/11, à ne pas toucher sans Romain.

## 4. Parcours F : joueur d'un Super Event
Deux interfaces sans lien visuel : la page publique `/se/[se]` (carte + feuille, bleu/blanc) et le hub comics `/jouer?se=` (logo, éclat, barre, pins numérotés, « BOUM ! +1 SUPER TICKET »).
| Vue | Gestes | Mots | Récompense | Défauts mesurés | Gravité |
|---|---|---|---|---|---|
| `/se/se-nds-2026` carte fermée | 1 (ouvrir) | 47 | non (point vert qui pulse) | aucun logo ni badge Super Event ; bandeau bleu (charte : orange) ; 22 épingles de 28 px, ~6 empilées au centre-ville ; zoom 29 px, « Autour de moi » 34 px, crédits 15 px ; lots invisibles tant que la feuille est fermée | haute |
| Feuille ouverte | 1 par station | 321 | non | carte cachée à 70 % ; 22 lignes identiques (2 621 px, 3,1 écrans) avec badge brut « nds2026 » ; 1 seul lot en carte or ; textes 2,62:1 (« ▴ », « Les lots à rafler »), 1,68:1 (« › ») | haute |
| Fiche station | 1 (Y aller) | ~60 (88 sur le SE test, liste cachée dessous) | non | « Fermer » 36 px ; consigne « scanne son QR » : pas de bouton jouer ; module affiché « nds2026 » | moyenne |
| `/se/[se]/[event]` (QR station) | 1 (« On joue ») | 284 | non | carte verte #0F9E73 (charte : orange) ; « ▸ » glyphe ; mène à `/parcours/nds2026` | moyenne |
| Onglets Avant / Pendant | 1 | - | non | NON RENDUS (aucune donnée de phase) ; code : 12,5 px, ~33 px de haut | non vérifié |
| Hub comics, 5 écrans | 3 | 62 | oui : « BOUM ! », barre « 4 stations sur 12 · +8 tickets possibles » | 11 textes < 13 px ; confettis violets | faible |
Jugement : la page publique est plate, vraiment. Le « wow » existe déjà dans le moteur (logo SVG `flowin-super-event-logo.svg`, éclat « 12 STATIONS », barre rayée de progression, pins numérotés, confettis `.confetti`) mais n'est pas réutilisé par la page que le public ouvre en premier. Logo et badge : absents. Carte : visible 1 seconde puis cachée par la feuille. Lots : cachés. Interactivité : 1 geste ouvre une liste. Progression vers le grand tirage : existe dans le hub comics (`sj-carte`), absente de `/se`.
Améliorations pas chères, hors `AMEL-VIS-05` (qui couvre logo, compteurs, anneau, orange) :
1. Feuille en carrousel (scroll-snap) des 5 stations les plus proches (la position est déjà lue), « Voir les 22 » en lien : plus de liste de 3,1 écrans.
2. Ligne du lot en tête de la feuille fermée (« 3 places de concert, tirage chaque soir ») pour que le grand tirage se voie sans geste.
3. Barre de progression `sj-carte` réutilisée : « N stations, +1 ticket par station » ; « x sur N · K tickets » si joueur connu.
4. Épingles : `@keyframes pop` du moteur avec `animation-delay` (i x 35 ms), zone tactile 44 px, `prefers-reduced-motion`.
5. Étiquette module : « nds2026 » vers « Jeu » (clé manquante dans `MODULE_UI`) ; carte « Te voilà chez » en orange.
6. Compteur de tickets visible aussi hors connexion : « 1 ticket par commerce et par jour ».

## 5. Parcours G : joueur qui revient
- Même téléphone : `getJoueurLocal` préremplit prénom, nom, e-mail, téléphone, code postal, âge (mesuré), mais l'écran de 5 champs reste affiché, puis le volet 2 aussi. Gain possible : 1 écran, 1 geste, sans toucher aux 3 cases.
- Autre appareil ou stockage vidé : aucune reconnaissance dans le moteur `/jouer`. La reconnaissance par e-mail (« Content de te revoir, Camille », formulaire sauté) n'existe que dans `NDS2026Client` (`lookupJoueurByEmail`, `lib/parcours.ts` l. 734, non protégé). Chemin actuel : `/moi`, onglet Compte (dernier), « Utiliser un autre compte », e-mail, bouton, courriel : 5 gestes + la boîte mail.
- Deux voies concurrentes : lien e-mail dans `/moi` (`ConnexionEmail`) et connexion avec mot de passe dans le moteur (`c-connexion`, carte « Créer un mot de passe »). À trancher.
- « Reviens demain » (c-demain) : bon : compte à rebours, un seul bouton utile.

## 6. `/moi` : placement des données (5 rubriques décidées 17/11)
- Entête bleu utile : compteurs lots / commerces / tickets + badges. Mais les compteurs ne se touchent pas, les badges (« Premier lot », « 3 commerces ») sont pâles, coupés à droite (« 10 tic ») et sans progression (0/3).
- Les TICKETS de tirage et leurs résultats, promesse n°1 du jeu, sont en bas de l'onglet Compte (carte grise 13 px). Le moteur les montre en tête de son profil. Les résultats de tirage arrivent dans « Alertes ».
- « Mes lots » vide : texte seul, aucun bouton « Trouver un commerce ».
- Onglets : étiquettes 11 px, gris #7A8091 à 3,94:1 ; cibles faibles : « Me localiser » 40 px, « Voir la carte (0) » et « Voir l'animation » 16 px de haut. Bouton « Me connecter » fuchsia #E8336B (jeton : fuchsia ponctuel, actions en bleu). Fond beige, pas le papier #F4F6F9.
- Deux profils : `/moi` (5 onglets, bleu foncé, beige) et `c-profil` du moteur (2,0 écrans, clair, violet) : aucune cohérence entre les deux.

## 7. Dix gains rapides, classés (reportés dans `AMELIORATIONS.md` : AMEL-DES-11 à 18)
| N° | Quoi | Fichier | Impact / effort / risque | À ne pas casser |
|---|---|---|---|---|
| 1 | Joueur connu : volet 1 replié (« Camille Exemple · Modifier »), volet 2 réduit aux 3 cases ; e-mail d'abord + `lookupJoueurByEmail` sur autre appareil | `lib/masters/engine.ts` `c-inscription` (l. 340-366), `JouerClient.tsx` `lireForm` | 5 / 3 / moyen | 3 cases, aucune cochée, case jeu obligatoire, `CONSENTEMENT_MENTION`, Homme/Femme, anti-doublon `writeJoueur`, `NDS2026Client.tsx` intact |
| 2 | Ticket validé : confettis + pop du ticket + n° sur une ligne (`nowrap`) | `engine.ts` `c-ticket` l. 387-404 (réutiliser `confetti()`), `css.ts` `.tk .num` | 4 / 1 / faible | vibration 40 ms, texte « On te prévient par email », `prefers-reduced-motion` |
| 3 | Chrono : anneau dans l'écran (26 px de débord) ; bonus : une question par écran, avance seule | `css.ts` `.qtop` l. 144 et `.timer` l. 150, `engine.ts` `q-bonus` l. 308 | 4 / 2 / faible | bouton « Passer », clés `bonus_i` de `reponsesBonus`, règle 3/3 = 1 ticket |
| 4 | Fusionner accueil + règles : 3 lignes à pictos sur l'accueil, bouton lance la question 1 | `engine.ts` `s-accueil`, `s-regles` (`PREMIER_ECRAN`) | 4 / 2 / moyen | « sans obligation d'achat » et date de tirage restent visibles avant de jouer ; règlement `lib/reglement.ts` |
| 5 | `/moi` : carte « Mes tickets » en tête de Mes lots (ou 6e onglet, décision Romain), compteurs touchables, badges avec progression, bouton connexion bleu | `app/moi/page.tsx`, `components/joueur/ConnexionEmail.tsx` (HERO) | 4 / 2 / faible | 5 rubriques décidées le 17/11, `data-rubrique`, notifications, consentements du compte |
| 6 | Page Super Event : carrousel des 5 stations proches + ligne du lot + étiquette « nds2026 » + orange | `app/se/[se]/SuperEventClient.tsx`, `SuperEventMap.tsx` | 4 / 3 / faible | mode `focus`, onglets phases, exception NDS (pas de phases), `chargerTicketsGainsJoueur`, mode `editable` du tableau de bord |
| 7 | Retirer le violet du joueur : confettis, carte « résultats », glyphes remise / service | `engine.ts` l. 152, 214 ; `css.ts` l. 97, 99, 561, 578 | 3 / 1 / faible | roue et quiz solo prune : décision Romain (design validé 17/11) ; `SpinClient.tsx` intact |
| 8 | Épingles : pop-in décalé + zone tactile 44 px ; `Fermer`, zoom, `Autour de moi` à 44 px | `SuperEventMap.tsx`, `SuperEventClient.tsx` | 3 / 1 / faible | marqueurs déplaçables du dashboard, couleurs `vitrine` / `jeu` |
| 9 | Contraste et taille : #7A8091 vers #5A6071, #9AA0AD vers #6B7385, textes 9-12 px à 13 px minimum, monogramme sur teal assombri | `css.ts`, `moi/page.tsx`, `SuperEventClient.tsx` | 3 / 1 / faible | couleurs de marque du commerçant (règle « le jeu prend les couleurs du commerçant ») |
| 10 | Profil du moteur en onglets comme `/moi`, ou lien direct vers `/moi` | `engine.ts` `c-profil` l. 465-480 | 4 / 4 / moyen | `mesTickets`, pastille de résultats, billets QR |

## 8. Non vérifié
- iPhone et Android réels (clavier qui réduit la zone, haptique, partage natif) ; QR réel `/q/<code>` (code lu seulement) ; courriel de connexion reçu.
- Onglets Avant / Pendant et état « joueur identifié » de `/se` (la RPC de lecture est un POST : interdit ici) ; tuiles de la carte absentes sur 3 captures feuille ouverte (réseau du bac à sable ou défaut : à revoir sur téléphone).
- Contrastes sur fonds dégradés (script limité aux fonds unis) ; lecteur d'écran ; `prefers-reduced-motion` ; temps réel de chargement 4G.
- Résultat réel de tirage (`c-resultat-*`) : maquette seulement.
- Hausse de conversion attendue : aucune mesure avant / après possible ici ; chiffres d'abandon par événement hors moteur (visites vient de NDS2026Client et du suivi des parcours, pas des masters).

## 9. Décisions pour Romain
1. Joueur connu : accepter qu'il ne voie plus le formulaire rempli (3 cases inchangées) ? Avis juridique conseillé sur la case « jeu » à chaque partie.
2. `/moi` : un 6e onglet « Tickets » ou une carte dans « Mes lots » ?
3. Une seule voie de reconnexion : lien e-mail (recommandé) ou mot de passe ?
4. Règles de jeu : fusion avec l'accueil acceptable si les mentions légales restent visibles ?
5. Prune de la roue et du quiz solo : garder (design validé) ou passer au bleu / teal ?
