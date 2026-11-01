# Audit des QR codes et QR permanents — 01/11/2026

Branche `feat/qr-stables-audit`. Rapport en français simple pour Romain. Tout ce qui est dit « testé » l'a été sur une base locale jetable reconstruite à partir de `sql/` (aucune base distante touchée, aucun SQL appliqué en prod).

## 1. La réponse à la question

**Peut-on garder le MÊME QR physique et changer de jeu derrière, sans réimprimer ? Oui, une fois le SQL 08 appliqué.**

- Un QR n'est qu'une adresse web. Ce qui compte, c'est ce que cette adresse contient. Avant, elle contenait le jeu (`/parcours/spin?ev=…`). Maintenant, le QR contient seulement `https://flowin-events.vercel.app/q/<code>` : un code court de 12 caractères pris au hasard. Notre serveur lit alors, au moment du scan, le jeu ACTUEL de l'animation et envoie le joueur au bon endroit (redirection 302).
- On peut donc changer de quiz, de jeu (quiz, roue, tombola, vote, Quiz Master), de lots ou de dates : le QR collé en boutique ne bouge pas. Testé : même QR, roue puis quiz puis Quiz Master puis tombola, et à chaque fois le joueur arrive sur le bon jeu.
- Un QR reste attaché à UNE station (un commerce) pour toujours. On ne peut pas le « déplacer » vers un autre commerce : il faut en créer un autre (c'est voulu, pour ne jamais mélanger).
- Les anciens QR déjà imprimés continuent de marcher. Ils suivent maintenant aussi le jeu actuel (nouveau : avant, un vieux QR « roue » affichait la roue pour une animation devenue Quiz Master). Mais ils restent liés à l'identifiant de l'animation et aux noms de routes `/parcours/<jeu>` : on ne peut ni les désactiver proprement, ni les limiter. Pour les prochaines impressions, utiliser les QR « Permanent ».

**Les limites techniques réelles** (il n'y en a pas d'autre) :
1. Le serveur et le domaine doivent exister. Le domaine est figé dans le code (`flowin-events.vercel.app`). Un futur domaine se règle par la variable `NEXT_PUBLIC_FLOWIN_BASE_URL`, mais les QR déjà imprimés resteront sur l'ancien domaine : il faudra alors le garder actif avec une redirection vers le nouveau.
2. Le nouveau jeu doit être prêt (questions, lots, cases de la roue). Sinon le joueur voit le contenu d'exemple. Le bouton « Changer le jeu » le rappelle avant de valider.
3. Les règles suivent la station, pas le jeu : « 1 partie par jour et par QR physique » et « digital : 1 fois par compte ». Un joueur qui a joué le matin à la roue ne rejoue pas l'après-midi au quiz sur le même QR. Les statistiques par QR (flashs, parties, joueurs) restent rattachées au QR après un changement de jeu.
4. Nuits du Sud (`nds2026`) est exclu du changement de jeu, dans les deux sens (sa mécanique est à part, et on ne touche pas à ses fichiers).

## 2. Comment la chaîne QR fonctionne (carte)

| Étape | Où | Ce que ça fait |
|---|---|---|
| Création d'un QR | `admin/components/operations/QrTraces.tsx`, `admin/lib/qrTraces.ts` | Un QR = une ligne `qr_stations` (animation, nom, support, type, slug `source_qr`). Slug `reseaux-…` = digital (convention NDS 2026). 3 QR par défaut (magasin, réseaux, tracking) non stockés avant ce lot. |
| Lien encodé (avant) | `lienQr()` | `/parcours/<jeu>?ev=<animation>&source=<slug>` : le JEU et l'identifiant de l'animation sont dans l'URL. |
| Lien encodé (maintenant) | `lib/qrPermalien.ts` | `/q/<code>` seulement. |
| Images | `components/dashboard/Diffusion.tsx` (paquet `qrcode`, dans le navigateur) | PNG 1024 px, SVG, affiche A4 (impression navigateur), lien copiable. Plus d'appel à un site tiers. |
| Kit digital / physique | Aucun générateur dans le code | La plaquette et le bon de commande promettent « affiches, macarons, support de caisse en fichiers, QR inclus » : ces fichiers sont faits à la main hors du code. Le seul vrai fichier généré est l'affiche A4 + PNG + SVG de Diffusion. Voir risque 14. |
| Scan | `app/q/[code]/route.ts` (nouveau) | Code → station → animation → jeu actuel → 302. Puis `/jouer` (masters) ou `/parcours/<jeu>`. |
| Anciennes routes | `app/parcours/*/page.tsx`, `lib/masters/redirection.ts`, `next.config.js` | `/parcours/<jeu>?ev=` redirige vers `/jouer` pour les masters ; `.html` réécrit ; nouveau : renvoi vers le jeu actuel si le jeu a changé. |
| Règles par QR | `lib/parcours.ts` (`controleRegleQr`) + index SQL | Côté code pour tous les jeux ; côté base via les index de `2026-11-01-…` (à appliquer). |
| Statistiques par QR | `stats_qr_evenement` (SQL) / `fetchStatsQr` | Clés sur `source_qr`, jamais sur le jeu. |

## 3. Tableau des risques

| # | Risque | Constat | Corrigé / reste |
|---|---|---|---|
| 1 | Le jeu est dans l'URL du QR : si on change de jeu, le QR « casse » | Vrai : `/parcours/<jeu>?ev=…`. | **Corrigé** par les QR permanents `/q/<code>` (SQL 08 à appliquer). Sans le SQL : mode dégradé, ancien format avec pastille orange « Ancien format ». |
| 2 | Un ancien QR affiche le mauvais jeu après changement | Vrai : `/parcours/spin?ev=X` affichait la roue pour une animation devenue Quiz Master. | **Corrigé** (`versBonJeuSiAutre`) : renvoi vers le jeu actuel, `source` conservée. Testé. |
| 3 | Deux animations avec le même slug | Vrai et voulu : `magasin`, `caisse`, `tracking`, `reseaux-instagram` existent dans chaque animation. Seul `ev=` les distingue dans l'ancien format. | **Corrigé** : un code unique par QR, 0 chevauchement sur 87 fichiers. Deux QR de même slug dans UNE animation : refusé par index unique (dans 08). |
| 4 | QR d'une autre animation sur un support | Aucun cas trouvé : 0 fichier sur 87 contient le QR d'une autre animation. | **Prouvé par test** (section 4). |
| 5 | Un QR digital utilisé en physique, ou l'inverse | Le type se déduit du slug `reseaux-…`. Rien n'empêchait un type et un slug incohérents. | **Corrigé** pour les nouveaux QR (contrainte `NOT VALID` dans 08). **Reste** : rien n'empêche d'IMPRIMER un QR digital ; la règle « 1 fois par compte » s'applique alors. |
| 6 | URL de preview / staging dans un QR imprimé | Le domaine de production était écrit en dur à une douzaine d’endroits (aucun cas de preview trouvé). | **Corrigé** : domaine unique `BASE_CANONIQUE`. Une variable invalide, `localhost`, une IP ou une URL de preview Vercel est ignorée (testé). |
| 7 | Domaine non figé | Idem. | **Corrigé** + variable `NEXT_PUBLIC_FLOWIN_BASE_URL` pour un futur domaine. |
| 8 | QR par défaut sans identité en base | Les 3 QR par défaut n'étaient pas stockés. | **Corrigé** : `qr_assurer_defauts()` les crée sans doublon (sauf Nuits du Sud, où on n'écrit rien). |
| 9 | QR difficile à identifier à l'impression | L'affiche portait seulement « animation — nom du QR » ; le fichier `qr-<animation>.png` ne distinguait pas deux QR d'une animation. | **Corrigé** : affiche = commerce + « QR « nom » · support · réf. code » + lien imprimé ; fichiers `qr-<commerce>-<qr>-<support>-<code>.png/.svg` ; titre de la page d'impression (nom du PDF) idem. |
| 10 | Animation terminée / brouillon / inexistante | Gérée par les pages de jeu, SAUF `/parcours/quizmaster` (jouable même terminée). | **Corrigé** pour Quiz Master. QR masqué ou code inconnu : page claire, aucun jeu, aucune écriture. |
| 11 | `source` falsifiable dans l'URL | Valeur libre écrite telle quelle ; `source=RESEAUX-x` contournait la règle digitale. | **Corrigé en partie** : minuscules + caractères autorisés. **Reste** : voir risque 12. |
| 12 | Contourner « digital 1 fois par compte » | Index en base (à appliquer) : un 2e compte digital est refusé, y compris sur un autre QR digital. Mais en retirant `source` du lien, la partie compte comme « lien principal » (physique, 1/jour). Autre email = autre compte. | **Reste ouvert, à décider** (section 6, décision 4). Constaté par test. |
| 13 | Énumération / copie d'un QR | Ancien format : `ev` et slug sont devinables. Nouveau : 48 bits aléatoires (pas d'incrément), format vérifié avant tout accès base, paramètres ajoutés ignorés (`?ev=autre&source=…`), plafond de 8 codes inconnus / 5 min / IP et 90 scans / min / IP, réponse 429. | **Corrigé**, avec une limite : le plafond est en mémoire de chaque instance Vercel. **Recommandé** : une règle Vercel Firewall (limite de débit sur `/q/*`). Un QR photographié reste scannable par tout le monde : c'est le principe d'un QR, d'où règles par QR et géolocalisation existante. |
| 14 | Kit « fichiers à imprimer » (macarons, caisse) | Pas de générateur dans le code, donc production manuelle (risque d'erreur). Le QR dessiné sur la plaquette est un VRAI QR mais mène à la plaquette (`#offres`), pas à une station : sans danger de confusion. | **Reste** : décision 5. Le script `audit-kit-nds.js` sert à décoder un dossier de fichiers avant envoi. |
| 15 | Changer de jeu sans contrôle ni trace | Aucun écran ni journal. | **Corrigé** : fonction `changer_jeu_station`, verrou (propriétaire ou Super Admin), journal `qr_jeu_journal` (qui, quand, avant/après, ancienne configuration complète). Testé (tests SQL). |
| 16 | Lien principal / fiche SA / historique pro : QR avec le jeu dans l'URL | 3 endroits affichent encore un QR « principal » sans `source` (donc sans statistique par QR). | **Signalé** à l'écran (avertissement). **Reste** : à remplacer par un QR permanent (décision 3). |
| 17 | `dashboard.html` (vanilla) : `cfg.qrUrl` au format `…/parcours/quiz.html?ev=` (13 endroits) | Non modifié (règles Acorn et miroir MD5 : lot à part). | **Reste**. Ces liens marchent grâce à la réécriture `.html`. |
| 18 | Kit imprimable Nuits du Sud (lecture seule, rien modifié) | 148 fichiers sur 153 décodés (PNG et PDF) : aucune incohérence nom de fichier / QR. Anomalies : (a) `kit-digital/nds-digital/qr-reseaux-nds-digital.png` et `qr-station-nds-digital.png` portent le MÊME QR (`source=affiche-digitale`, pas `reseaux-…`) : le fichier « réseaux » n'est donc pas lu comme digital ; (b) les affiches A4/forex de station n'ont pas de `source`, alors que `nds/qr/qr_*.png` ont `source=affiche-<station>` : deux variantes du même QR, statistiques scindées. | **Signalé seulement** (zone interdite). Détail : `kit-nds.json`. |
| 19 | Statistiques par jeu | Les stats sont par QR, pas par jeu. | Le journal donne la date de chaque changement pour découper « avant / après ». Pas de découpage automatique. |

## 4. Preuve par test

Lancement : `QA_DIR=… OUT=… bash admin/scripts/qa-qr/run-e2e.sh` (Postgres local jetable + mini-API locale + Next + Playwright + jsQR).

- **Tests SQL : 41/41.** Codes uniques, 12 caractères, non incrémentaux ; refus de changer slug / animation / code d'un QR ; refus du changement de jeu sans session, par un autre pro, par écriture directe ; acceptation par le propriétaire et le Super Admin ; module et master synchronisés ; journal complet ; règles 1/jour/QR et digital 1/compte intactes après changement de jeu ; statistiques conservées.
- **Tests navigateur : 502/502.** 4 animations (quiz, roue, tombola, Quiz Master), 29 QR (physiques et digitaux, avec des slugs identiques d'une animation à l'autre). Pour CHAQUE QR : lien affiché = lien copié ; PNG, SVG et affiche A4 décodés avec jsQR (87 fichiers) = même lien ; la station retrouvée en base est la bonne ; le lien ouvre la bonne animation ; l'affiche porte commerce, nom du QR, support et référence ; nom de fichier lisible ; aucune URL partagée entre deux QR ; aucun fichier d'une animation ne contient le QR d'une autre.
- Aussi testés : changement de jeu derrière le même QR (roue → quiz → Quiz Master → tombola), anciens QR (jeu changé, `.html`), animation terminée / brouillon / QR masqué / code inconnu, bouton « Changer le jeu » (refusé sans droit, accepté pour le propriétaire et journalisé), mode grille de fin de création, paramètres falsifiés, codes mal formés (dont injection d'en-tête), énumération (bloquée au 9e essai), plafond de scans (429 au 61e scan avec un plafond de test à 60).
- `test-domaine.js` : 22 contrôles sur le domaine figé et les adresses cibles.
- `tsc --noEmit` : 0 erreur. `npm run build` : « ✓ Compiled successfully » (les erreurs `fetchAllJoueurs … fetch failed` du build sont dues à l'absence de réseau du bac à sable, comme avant ce lot).
- Captures et fichiers décodés : `…/scratchpad/qr-audit/` (`captures/`, `fichiers/`, `decodes.json`, `kit-nds.json`).

## 5. À appliquer (rien n'est appliqué)

Dans l'ordre, section par section (chaque fichier est rejouable) :
1. `sql/01-identite-super-admin.sql` (si pas déjà fait) : prérequis du verrou Super Admin.
2. `sql/2026-11-01-tirage-auto-liste-gagnants.sql`, sections 1 à 3 : colonnes `support` / `type_qr`, index des règles par QR, statistiques par QR.
3. **`sql/08-qr-permaliens.sql`** (nouveau) : code court, garde-fous, QR par défaut, journal, verrou, `changer_jeu_station`.
4. Vérifications en fin de fichier 08 (aucun QR sans code, aucun doublon).
5. Variables Vercel (facultatives) : `NEXT_PUBLIC_FLOWIN_BASE_URL` (futur domaine), `FLOWIN_QR_LIMITE_SCANS` (défaut 90/min/IP), `FLOWIN_QR_LIMITE_INCONNUS` (défaut 8 / 5 min / IP).
6. Recommandé : règle de limite de débit Vercel Firewall sur `/q/*`.

Après application : ouvrir chaque animation en cours (onglet QR et diffusion) pour que les 3 QR par défaut reçoivent leur code, puis **réimprimer une dernière fois** ce qui doit l'être avec les QR « Permanent » (étiquette bleue).

## 6. Décisions pour Romain

1. **Appliquer le SQL 08** (et les sections 1 à 3 du fichier 2026-11-01) : tant que ce n'est pas fait, rien n'est permanent.
2. **Réimprimer** les supports déjà collés ? Les anciens QR marchent et suivent le jeu actuel ; seul l'inconvénient de ne pouvoir ni les désactiver ni les limiter. Proposition : ne rien réimprimer sauf supports à longue durée de vie.
3. **Remplacer** les 3 QR « principaux » (fiche SA, historique pro, lien du texte de diffusion) par un QR permanent.
4. **Règle digitale** : aujourd'hui un lien sans `source` compte comme physique. Durcir (tout lien sans station connue = digital, 1 fois par compte) casserait les anciens QR imprimés sans `source`. À trancher.
5. **Kit macarons / caisse** : faut-il un générateur de fichiers dans le code (affiche, macaron, caisse, chacun avec nom et référence) pour supprimer la production manuelle ?
6. **Nuits du Sud** : corriger les 2 anomalies du kit (fichiers `nds-digital`, variantes avec/sans `source`) ? Zone interdite à ce lot.
