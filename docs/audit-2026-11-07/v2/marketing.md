# Audit MARKETING / ACQUISITION / ADHÉSION — Flowin Events (07/11/2026)

Méthode : Playwright Chromium 390×844 sur localhost:3000 (texte DOM + captures dans
`/tmp/flowin-audit-v2/shots/marketing/`), lecture du code, Supabase en lecture seule. Aucun compte créé, aucun fichier modifié.

## Verdict
Le produit sait promettre (« Animez votre lieu, créez du lien, faites revenir vos clients », très bon), mais
**l'acquisition fuit à trois endroits** : (1) le CTA principal « commerçant » de /landing mène à une 404 ;
(2) le prix d'un même pack NDS existe en **trois montants différents** selon l'écran ; (3) la seule « vitrine super event »
mise en avant (Nuits du Sud, juillet 2026) est terminée, et le super event proposé dans /rejoindre (17–19 oct.) aussi.
La valeur (voir son jeu, son QR) arrive **après** 9 écrans de compte + offre/signature pour un commerçant ; seul /rejoindre
montre un aperçu sans compte, mais en bas d'un écran de ~3 900 px.

## 1. Constats par point d'entrée (prouvés)

| Entrée | 5 s : quoi / combien / quoi faire | Preuve |
|---|---|---|
| `/landing` | Quoi : clair (hero + « Le monde passe. Vous ne gardez rien. »). Combien : **aucun prix**. Quoi faire : 2 CTA d'en-tête (« Contacter », « Demander une démo ») qui sont des `<a>` sans href (ouvrent un volet) ; carte « J'anime mon établissement » → **`/contact` = 404** ; « Intégrer un Super Event » → /nds (Nuits du Sud 2026, passé). Aucun lien vers /pro/premiere-fois ni vers les plaquettes. | `app/landing/LandingClient.tsx:434` `href="/contact"` ; GET /contact → 404 ; capture `_landing-full.png` |
| `/landing` « Résultats » | Bloc chiffré (192 participants, 43 ans, 61 % F, 74 % contact, CP 06140) présenté comme « Exemple réel… Vence (06140) » : **en dur dans le code**, non relié à un event identifiable en base → non vérifiable. « 100 % Conversion » peu crédible. | `LandingClient.tsx:298-398` |
| `/nds` | Fort en 5 s (« 24 000 festivaliers, 80 % de locaux, 60 % de femmes ») et prix visibles (500 / **1 490** / 3 590 € HT, lot inclus, « Sans engagement de durée »). Mais c'est l'édition **9–18 juillet 2026, passée** ; la page reste la seule preuve « super event » de /landing. 10 tuiles « VOTRE LOGO ICI » = mur vide, signal négatif. | capture `nds-Voir_les.png` |
| `plaquette-animation-magasin.html` (commerçant) | Meilleur support : promesse en 4 verbes, double aiguillage commerce/organisateur, prix (990 € HT/an, 110 € HT/mois, 149 €/boutique, garantie satisfait ou remboursé sur l'annuel), CTA unique « Je m'inscris » → `/pro/premiere-fois?offre=annuelle&kit=digital`. Preuve : « 56 % souhaitent garder le contact — bilan NDS 2026 ». | captures `_plaquette-animation-magasin_html-*.png`, `plaquette-magasin-offres.png` |
| `plaquette-super-event.html` (organisateur) | Pas de prix, pas de CTA d'inscription : seul « Être contacté » (formulaire rappel). Chiffres NDS en dur (`CHIFFRES_NDS = {contact:'56 %', lots:'Plus de 70'}`, l.581). | fichier l.458-582 |
| `plaquette-nds.html` | Ancienne plaquette : lien « ← Dashboard », lien « Découvrir le Super Event » → `#`, contact **flowinevent@gmail.com** alors que partout ailleurs info@opconsult.co → incohérence de marque. Données démo (54 % F) présentées comme « aperçu ». | texte DOM |
| `/pro/premiere-fois` | Très bon écran d'accueil (« Votre commerce, animé en quelques minutes », 4 étapes, « environ 3 minutes »). Mais l'étape 3 annonce offre + signature + paiement **avant** l'étape 4 « première animation » : la valeur vient après le mur de paiement. | capture `_pro_premiere-fois-fold.png` |
| `/rejoindre` | Seul parcours **sans compte** avec aperçu du vrai jeu (bien). Le seul super event listé est « Fêtes du haut et moyen pays · 17→19 oct. 2026 · DÉMO » (passé, étiqueté démo). Écran final = grille tarifaire + compte 8 champs (cf. audit souscription du 07/11 §2.2). Grille à **1 400 €** pour Animation. | capture `_rejoindre-full.png` ; `lib/commercial.ts:163-183` |
| `/demo` | Formulaire de 6 champs obligatoires (dont téléphone) **avant** de voir quoi que ce soit : démo = capture de lead, pas démonstration. | capture `_demo-fold.png` |
| `/` | Redirige vers `/dashboard` et, dans un navigateur neuf, affiche l'accueil Super Admin (841 joueurs, 8 508 € de sponsoring…). Un prospect qui tape le domaine nu ne voit pas /landing. (Contrôle d'accès → à confirmer par l'auditeur technique.) | capture `_-fold.png` |
| `/prospection.html` | Fichier de 1 966 commerces avec téléphones, servi publiquement et lié depuis `/demos.html`. Hors marketing pur, mais risque d'image/RGPD si un prospect tombe dessus. | capture `_prospection_html-fold.png` |

## 2. La promesse tient-elle ?
- Plaquette → /pro/premiere-fois : **oui**, vocabulaire repris (QR, jeu, lots, clients qui reviennent).
- /pro/premiere-fois → /pro/nouvelle : **non**, rupture : « banque de questions », « master », « marque blanche », 32 champs sur l'écran « Quel jeu ? » (audit souscription 07/11 §2.3, §3).
- /landing → inscription : **pas de pont** (aucun lien vers l'inscription, CTA 404).
- Les 3 mots de Romain (« outil de comm, jeu d'animation, support de comm ») sont dans la plaquette magasin, mais le mot « comm » est absent du hero /landing (« Fidélisez · Animez · Boostez »).

## 3. Moment de la valeur
| Persona | Premier jeu vu | Premier QR | Premier joueur |
|---|---|---|---|
| Commerçant (plaquette → premiere-fois) | Démo jouable dans la plaquette (bien) ; son **propre** jeu seulement dans /pro/nouvelle, après compte + offre | après création de l'animation | après publication |
| Organisateur | Jamais sans RDV (plaquette = « Être contacté ») | — | — |
| Commerce qui rejoint un SE | Aperçu en direct dans /rejoindre, sans compte (bien, mais en bas de page sur mobile) | après validation Flowin | — |
Démo sans compte : plaquettes (jeu cliquable) oui ; /demo non (formulaire d'abord).

## 4. Tarifs
| Pack NDS | `nds-partenaire.html` / `/nds` / `bon-commande-nds.html` | `lib/commercial.ts` (grille /rejoindre) | base `packs_participation.prix_ht` |
|---|---|---|---|
| Visibilité | 500 | 500 | 500 |
| Animation | **1 490** | **1 400** | **1 331** |
| Sponsor | 3 590 | 3 590 | **3 331** |
Le commentaire de `lib/commercial.ts:163-165` reconnaît l'écart 1 400/1 490 « volontairement non modifié ». Base : 3 331 + 259 (lot) = 3 590, donc la base stocke peut-être le net hors lot, mais 1 331 + 159 = 1 490 ≠ 1 400. Un prospect qui voit 1 490 € sur /nds puis 1 400 € dans /rejoindre puis 1 490 € sur le bon de commande perd confiance. **À trancher par Romain**, pas à deviner.
Côté commerçant, le prix est rassurant (110 €/mois, garantie, « sans engagement de durée » sur /nds) mais **invisible sur /landing**.

## 5. Preuves (base, lecture seule)
- `joueurs` : 841, dont 480 optin = **57,1 %** → cohérent avec « 56 % souhaitent garder le contact » (bilan NDS, l'écart d'1 point peut venir de joueurs ajoutés après le bilan). `v_nds_participants` : 641.
- `lots` : 33 lignes ; « Plus de 70 lots » (plaquette super event) **non retrouvé** en base (peut compter les quantités ou les lots partenaires, non vérifié).
- Sexe en base : 417 F / 224 H = 65 % F (= dashboard SA) ; /nds affiche « 60 % de femmes » (chiffre public festival, pas Flowin : source à afficher).
- « 24 000 festivaliers, 80 % locaux » : chiffres organisateur, non vérifiables en base ; aucune source citée sur /nds.
- Landing « 192 participants » : en dur, non rattaché.
- **Aucun témoignage**, aucun logo partenaire réel (mur « VOTRE LOGO ICI »), alors que 17 partenaires existent en base. Garantie satisfait ou remboursé : uniquement plaquette magasin, formule annuelle.

## 6. Concurrence (courte)
Vérifié par recherche web : **Adictiz** (jeux marketing roue/instant gagnant par QR, marques nationales), **Obypay** (roue de gamification au QR pour restaurants, intégrée au paiement), **Jotform / QR Code Tiger** (concours QR génériques, gratuits/self-service). Non vérifié (connaissance générale, à confirmer) : **Qualifio** (plateforme jeux-concours/collecte data pour médias et marques), solutions de « roue avis Google » pour commerces.
Ce qu'ils font mieux : self-service immédiat (compte → jeu en ligne en minutes, essai gratuit), prix publics sur le site, galeries de cas clients/logos.
Ce qui rend Flowin unique : **le Super Event** (un même jeu dans tous les commerces d'un territoire, carte des stations, tirage par commerce), la double cible organisateur + commerçants qui se financent mutuellement (packs partenaires), l'ancrage local réel (NDS). Aucun concurrent identifié ne vend l'animation collective de territoire. C'est ce qu'il faut mettre en tête.

## 7. Parcours d'adhésion cible (5 étapes max)
**Commerçant**
1. Plaquette / QR de prospection — « Vos clients jouent, vous gardez le contact, ils reviennent. 110 € HT/mois. »
2. Essai sans compte — choisir un jeu, voir *son* jeu avec son nom et son QR en aperçu (réutiliser l'aperçu de /rejoindre). « Voilà ce que vos clients verront. »
3. Compte en 3 champs (email, mot de passe, SIRET auto) — « Gardez votre jeu. »
4. Publier gratuitement en mode test (QR actif, X joueurs ou 7 jours) — « Votre premier client a joué » (notification).
5. Choisir l'offre + signature (bon de commande pré-rempli) — « Continuez, satisfait ou remboursé. »

**Organisateur (festival / asso de commerçants)**
1. Plaquette super event + un vrai cas (NDS : 641 participants, 57 % opt-in, partenaires nommés) — « Vos partenaires financent l'animation de votre événement. »
2. Simulateur : nombre de commerces × pack = budget autofinancé (prix uniques issus de la base) — « Combien ça vous rapporte. »
3. RDV / rappel (garder : vente accompagnée) — « On monte votre super event ensemble. »
4. Super event créé par Flowin, lien `/rejoindre?se=` + kit prospection remis — « Invitez vos commerçants. »
5. Tableau de bord live (stations, joueurs) — « Vos chiffres pour vos sponsors. »

## 8. Priorités
### P0
| # | Constat | Fichier | Cause | Correctif |
|---|---|---|---|---|
| P0-1 | CTA « J'anime mon établissement » → 404 | `app/landing/LandingClient.tsx:434` | route `/contact` inexistante | pointer vers `/pro/premiere-fois?src=landing` (ou le volet contact) |
| P0-2 | 3 prix différents pour le pack Animation (1 400 / 1 490 / 1 331) et Sponsor (3 590 / 3 331) | `lib/commercial.ts:180-183`, `public/nds-partenaire.html:652-666,818`, `public/bon-commande-nds.html:381-421`, table `packs_participation` | prix recopiés en dur dans 3 sources | Romain fixe le prix ; une seule source (`packs_participation`), lue par toutes les pages |
| P0-3 | Domaine nu `/` affiche le dashboard SA au lieu de /landing | redirection racine (`app/page.tsx`) | redirection vers /dashboard | rediriger `/` vers `/landing` ; contrôle d'accès à vérifier côté technique |
### P1
| # | Constat | Fichier | Correctif |
|---|---|---|---|
| P1-1 | Vitrine super event = NDS 2026 terminé ; /rejoindre ne propose qu'un SE passé « DÉMO » | `LandingClient.tsx` (carte SE), `/nds`, `super_events` | transformer /nds en **cas client** (bilan) et ouvrir un SE réel/à venir, ou masquer les SE passés |
| P1-2 | Aucun prix ni lien d'inscription sur /landing | `LandingClient.tsx` | bande « À partir de 110 € HT/mois · sans application » + CTA « Je crée mon animation » |
| P1-3 | Valeur après le paiement (étape 3 offre/signature avant étape 4 animation) | `app/pro/premiere-fois/PremiereFois.tsx` | publier un jeu test avant l'offre (cf. parcours cible) |
| P1-4 | /demo exige 6 champs avant toute démo | `app/demo` | montrer la roue d'abord, demander le contact pour recevoir le lot |
| P1-5 | Preuves non sourcées / non vérifiables (192 participants, 24 000 festivaliers, « Plus de 70 lots », « 100 % conversion ») | `LandingClient.tsx:298-398`, `plaquette-super-event.html:581`, `/nds` | sourcer chaque chiffre (« bilan NDS 2026, base Flowin au … ») ; retirer « 100 % » ; publier les chiffres réels base (641 participants, 57 % opt-in) avec l'accord de Romain |
| P1-6 | Mur de « VOTRE LOGO ICI » ×10, zéro témoignage | `/nds` (`nds-partenaire.html`) | logos des partenaires réels (avec accord) + 2 citations recueillies `[à compléter]` |
| P1-7 | Organisateur : aucun prix ni étape après « Être contacté » | `plaquette-super-event.html` | ajouter le modèle économique (packs partenaires) et un CTA RDV daté |
### P2
| # | Constat | Fichier | Correctif |
|---|---|---|---|
| P2-1 | Contact incohérent (flowinevent@gmail.com vs info@opconsult.co), lien `#` mort, lien « ← Dashboard » | `public/plaquette-nds.html` | archiver la plaquette ou aligner |
| P2-2 | Jargon après inscription (« master », « banque », « marque blanche ») | `components/creation/ParcoursCreation.tsx` | vocabulaire commerçant (cf. audit souscription §3) |
| P2-3 | Fichier de prospection public lié depuis le hub démo | `public/prospection.html`, `public/demos.html` | retirer du public (à traiter avec technique) |
| P2-4 | Hero /landing sans le mot « comm » de Romain | `LandingClient.tsx` | sous-titre : « Un jeu d'animation qui devient votre support de comm. » |

## 9. Non vérifié
- Clics réels de soumission (compte, demande /rejoindre, rappel) : volontairement non faits.
- Tarifs et fonctionnalités des concurrents : non trouvés en ligne ; Qualifio non vérifié.
- Origine des chiffres « 24 000 festivaliers / 80 % locaux / 60 % femmes » et « Plus de 70 lots ».
- Rendu production Vercel (seul localhost testé), iOS Safari réel.
- Lien entre `packs_participation.prix_ht` et les prix affichés (net hors lot ?) : à confirmer par Romain.

Sources web : [Obypay – roue de la fortune](https://intercom.help/obypay/fr/articles/15272838-roue-de-la-fortune) · [Adictiz – instant win](https://www.adictiz.com/en/blog/project_category/instant-win/) · [QR Code Tiger – concours QR](https://www.qrcode-tiger.com/fr/contest-qr-codes) · [Jotform – concours QR](https://www.jotform.com/fr/blog/concours-de-code-qr/)
