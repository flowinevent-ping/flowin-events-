# Audit COHÉRENCE DES EXPLICATIONS — Flowin Events — 07/11/2026 (v3)

Complète `docs/audit-2026-11-07/v2/ergonomie.md` (densité, cibles) et `coherence.md` (chiffres, vocabulaire, charte). Ici : est-ce que chaque écran dit **quoi faire, pourquoi, et ce qui se passe ensuite**, et est-ce **vrai** au regard du code et de la base.
Méthode : Playwright mobile 390×844 (texte rendu + captures `/tmp/flowin-audit-v3/shots/explications/`), lecture du code, SQL en lecture seule. Aucune écriture.

## Notes /10
| Parcours | Note | Motif principal |
|---|---|---|
| PRO | 5 | bonnes intros, mais des fins d'étape fausses (« en ligne » / « en attente » ensemble, carte promise sans GPS) et deux versions du délai de validation |
| ADMIN | 5 | écrans factuels, mais aucune explication des conséquences (que reçoit le pro quand j'approuve ?) |
| JOUEUR | 4 | « Comment jouer » clair, mais placeholders affichés au public, aucun règlement du jeu, retrait en boutique peu expliqué |

---

## PRO

### 1. `/pro/premiere-fois` — clair, une incohérence de chiffres
- Clair : promesse, 4 étapes numérotées, un seul bouton « C'est parti ».
- Incohérent : la liste montre **4 étapes** mais la ligne de bas dit « Environ 3 minutes · **7 étapes** ». L'étape 3 annonce « bon de commande, signature électronique, virement ou prélèvement » : impossible en 3 minutes.
- Manque le « et après ? » : rien ne dit que l'accès reste bloqué jusqu'à validation du paiement (`components/pro/AccesBloque.tsx` : « tout seul dès que le paiement est validé (virement : validation par l'équipe Flowin) »).
- Phrase cible : « 4 étapes, environ 10 minutes ; votre espace s'ouvre dès que le paiement est validé (virement : sous 48 h). »

### 2. Tableau de bord `/pro` — chiffre en tête non expliqué
- « Participants ce mois-ci : 0 — joueurs distincts en novembre 2026 » au-dessus d'une carte « 9 parties · 16 gagnants · 14 à remettre » : le texte est exact mais le pro lit une contradiction ; l'information utile (« 14 à remettre ») n'est pas présentée comme une action.
- `app/pro/page.tsx:53` « Votre fiche est en cours de validation par l'équipe Flowin. En attendant, préparez la suite » : pas de délai, pas de canal de prévenance.
- Phrase cible : « 14 lots à remettre : ouvrez Gagnants pour les valider en caisse. »

### 3. Rejoindre un super event — **deux parcours, deux discours** (P0)
- Parcours A `app/rejoindre/[se]/RejoindreClient.tsx` (L.221-280, 412) : « Demande envoyée ! Nous validons votre commerce **sous 24–48h**. Votre QR… et votre tableau de bord seront activés à ce moment-là. »
- Parcours B `components/creation/ParcoursCreation.tsx` (utilisé par `/rejoindre?se=` et `/pro/nouvelle?type=rejoindre`) L.711-736 : « Flowin valide votre participation… votre station apparaîtra alors sur la carte », statut « En attente de validation » — **aucun délai**, et L.1323 « Flowin vous **rappelle** pour valider » (troisième version : appel téléphonique).
- `app/pro/super/page.tsx:55` : « Flowin la valide avant qu'elle apparaisse ici » — encore sans délai ni notification annoncée.
- Faux : étape 1 « son jeu est **déjà choisi** par l'organisateur » alors que l'étapier affiche « 2 Jeu » et que l'encart visiteur (L.950) dit « Choisissez l'opération, **le jeu**, les lots… ».
- Faux (vu en base) : la promesse « votre station apparaîtra alors sur la carte » n'est pas tenue quand l'adresse n'a pas de GPS ; l'écran SA `/dashboard/demandes-rattachement` affiche justement « sans GPS : la station n'apparaîtra pas sur la carte » sur une demande **approuvée** (QA Station Tech, 07/11). Le pro n'en est jamais informé.
- Faux / non vérifié : `/rejoindre?se=se-nds-2026` n'affiche pas NDS mais « Fetes du haut et moyen pays » (paramètre ignoré ou NDS fermé) sans le dire au pro.
- Diffusion (L.1248) : « Cochez ce que Flowin doit préparer » — le pro ne sait pas quand ni comment il reçoit le QR imprimé (côté SA : « à produire par Flowin », sans suivi).
- Phrase cible (fin) : « Demande envoyée. Flowin la valide sous 48 h ouvrées ; vous recevrez un email, puis votre QR apparaîtra dans Mes animations. »

### 4. Créer une animation `/pro/nouvelle` — écran de fin contradictoire (P0)
- `ParcoursCreation.tsx:716` sous-titre : « En attente de validation par Flowin **avant mise en ligne** ».
- Même écran L.751 : « **Le jeu est en ligne** : vos QR tracés » (affiché dès que `fait.eventId` existe).
- Code `lib/pro.ts:117` : l'event est inséré `status: 'upcoming'` avec `qrUrl` actif ; seule `cfg.diffusion_demandee.statut = 'en_attente_sa'` attend Flowin. Ce qui attend réellement = la production de la diffusion, pas le jeu.
- Jargon : « QR tracés », « station de jeu », « master », « banque ».
- L.751 règle « Physique : 1 participation par jour ; digital : une seule fois par compte » — exacte, mais c'est la seule fois où le pro l'apprend ; le joueur lit « un tour par jour et par commerce » (voir Joueur).
- Phrase cible : « Votre jeu est en ligne dès la date de début. Flowin prépare l'affiche imprimée que vous avez demandée (sous 48 h). »

### 5. Lots — peu d'aide au moment de décider
- Pas d'explication de la différence « tirage » vs « instantané » au moment du choix (type dans `lib/pro.ts` L.102) ; le joueur, lui, lit « billet immédiat ou ticket pour le tirage ».
- Phrase cible : « Lot immédiat : gagné tout de suite, à retirer chez vous. Lot au tirage : tiré au sort à la date choisie. »

### 6. QR et affiche
- Déjà relevé v2 (introuvable). Explication manquante en plus : « Copier » ×5 sans dire quoi ; aucun texte « où coller ce QR / quel support choisir ».
- Phrase cible : « Imprimez l'affiche A4 et posez-la près de la caisse : chaque scan ouvre votre jeu. »

### 7. Carte `/pro/super`
- Jargon : « réservé à l'organisateur (**Super Admin**) », « Chiffres calculés comme côté Super Admin » (`app/pro/super/page.tsx:147`).
- « Corriger un point manuellement » : ni pourquoi ni conséquence (« visible par tous les joueurs »).
- « Gagnants & tirage — Tirage global mutualisé. » : jargon, ne dit pas qui tire ni quand.
- Phrase cible : « Votre commerce sur la carte des joueurs. Position fausse ? Corrigez-la : le changement est public immédiatement. »

### 8. Gagnants, PIN, relance (P0 sur la relance)
- Validation : « Saisissez votre code PIN à 4 chiffres — celui de votre **fiche de retrait** » (`components/pro/GagnantsClient.tsx:347`). Vrai sur la longueur (18/18 partenaires ont un PIN de 4 chiffres en base) ; « fiche de retrait » n'existe nulle part dans l'espace pro : le PIN est affiché par `EncartPin` (« PIN du commerce · validation en caisse ») dans `/pro/historique`, pas sur cet écran.
- **Faux état** : bouton « Relancer » (L.320-325) ouvre un brouillon Gmail **et** appelle `marquerRelance(g.id)` au clic ; si le pro ferme Gmail sans envoyer, la ligne affiche « Relancer à nouveau » comme si l'email était parti. Aucun texte ne dit que c'est le pro qui envoie depuis sa boîte.
- « Marquer remis sans PIN » : ne dit pas qu'il **ne décompte pas le stock** (le code le sait : badge « Stock non décompté » après coup).
- « Utilisé / À retirer » : mieux qu'avant, mais le pro, lui, « remet » ; boutons « Valider » vs badge « Utilisé » vs message « Billet validé » = 3 mots.
- Scanner `/pro/scanner` : bonne explication (caméra native, code imprimé sous le QR). Manque : quoi faire si le billet est expiré/déjà validé.
- Phrases cibles : « Le client montre son billet : tapez votre PIN (affiché en haut de cette page) pour le valider et décompter le stock. » / « Relancer ouvre un email prêt dans votre messagerie : envoyez-le pour prévenir le gagnant. »

## ADMIN

### A1. `wizard-pro`
- « Le même parcours que l'espace pro — 5 étapes, mêmes questions » : clair. « Choisissez un profil pour continuer. » affiché avant toute action (déjà v2).
- Manque la fin : le pro créé reçoit-il un email / un mot de passe ? Non dit.
- Phrase cible : « Le pro reçoit un email pour créer son mot de passe ; son espace s'ouvre après paiement. » (à confirmer par le code d'envoi, non vérifié).

### A2. `wizard-super-event`
- Écran de fin (`ParcoursCreation.tsx` estSuper) : « Les commerces le rejoignent depuis leur espace ou par ce lien : /rejoindre/<id> » → ce lien mène au parcours A (24–48h) alors que l'espace pro mène au parcours B : l'admin diffuse un discours que l'espace pro contredit.
- Phrase cible : « Super event créé. Partagez ce lien aux commerces ; leurs demandes arrivent dans Demandes de participation. »

### A3. `demandes-rattachement`
- Clair : résumé de chaque demande, avertissement GPS, diffusion « à produire par Flowin ».
- Manque : bouton d'approbation sans dire la conséquence (pro notifié ? station sur la carte ? QR généré ?). Une demande sans GPS reste approuvable sans blocage ni consigne.
- Phrase cible : « Approuver crée la station et l'affiche sur la carte (GPS requis) ; le pro voit sa participation dans son espace. »

### A4. Lots / gagnants / tirage SA
- Libellés hérités du monolithe « Retiré en caisse » vs « Utilisé » (v2). Relance groupée « 📣 Relancer les non utilisés » : même ambiguïté que côté pro (brouillon ≠ envoi).

## JOUEUR

### J1. Scan → `/jouer` accueil
- Clair : « Bienvenue chez X qui t'offre une partie gratuite » + « Découvrir le jeu ».
### J2. Présentation du jeu (capture `jouer_1.png`)
- Clair : « Comment jouer ? » en 3 points.
- **Placeholders publics** : sur un event live (`ev-demo-spin`) le joueur lit « [lots à compléter] », « Le commerce n'a pas encore saisi ses lots », « Tirage le [date du tirage à compléter] » **deux fois**. La règle « pas de données inventées » est respectée, mais un placeholder n'a rien à faire devant un joueur : masquer le bloc.
- Règle incomplète : « Un tour par jour et par commerce » — faux pour un QR digital (« une seule fois par compte », `components/parcours/ParcoursHero.tsx:150`, `ParcoursCreation.tsx:751`).
- Jargon : « billet » vs « ticket » vs « super ticket » sans définition.
- **Règlement du jeu absent** : aucune page ni lien « Règlement » dans `/jouer`, `/parcours/*` (grep : seul `RejoindreClient` emploie le mot, au sens paiement). Pour un jeu avec tirage au sort : obligation légale, et seul endroit où dates, lots, modalités de retrait et données personnelles sont expliqués.
### J3. Inscription
- Messages d'erreur clairs et tutoyés (« Ton email semble incomplet », « Coche la première case »). « Tes données servent uniquement au jeu » : à vérifier contre l'export « contacts consentants » côté pro (`/pro/donnees`) — si le pro reçoit les contacts, la phrase est fausse.
### J4. Résultat / billet / profil
- Profil (capture `jouer_2.png`) affiche « [email saisi] », « [téléphone saisi] », « [saisie] » en mode aperçu : à vérifier hors aperçu.
- Billet (`app/parcours/_components/ParcoursOutro.tsx:25`) : « À présenter au commerce pour retirer votre lot » — ne dit ni jusqu'à quand, ni qu'il faut montrer le QR (le commerçant tape son PIN), ni l'adresse.
- Phrase cible : « Montre ce billet chez [commerce] avant le [date] : le commerçant le valide et te remet ton lot. »

---

## Priorités

| # | Problème | Fichier | Cause | Correctif |
|---|---|---|---|---|
| P0-1 | Fin de création : « en attente avant mise en ligne » + « le jeu est en ligne » sur le même écran ; le jeu est réellement publié | `components/creation/ParcoursCreation.tsx:716` et `:751` ; `lib/pro.ts:117` | sous-titre écrit pour l'ancien flux « demande » | Sous-titre : « Jeu en ligne dès le [date]. Flowin prépare la diffusion demandée. » |
| P0-2 | Rejoindre : 3 versions de la suite (24–48h / sans délai / « on vous rappelle ») | `app/rejoindre/[se]/RejoindreClient.tsx:230,280,412` ; `ParcoursCreation.tsx:714,1323` ; `app/pro/super/page.tsx:55` | deux parcours de rejoindre coexistent | Une constante `TEXTE_SUITE_DEMANDE` dans `lib/commercial.ts` utilisée aux 3 endroits ; à terme un seul parcours |
| P0-3 | Pas de règlement du jeu côté joueur | `app/jouer/JouerClient.tsx`, `components/parcours/ParcoursHero.tsx` | absent | Page `/reglement?ev=` générée depuis cfg (lots, dates, tirage, retrait) + lien en pied de chaque écran de jeu |
| P0-4 | Placeholders « [… à compléter] » visibles par les joueurs sur un event live | `JouerClient.tsx` (bloc lots/tirage), `ParcoursHero.tsx` | placeholder conçu pour l'éditeur, rendu en public | Masquer le bloc lots/tirage si vide côté joueur ; garder le placeholder en aperçu pro |
| P1-1 | « Relancer » marque la relance faite au clic, avant envoi réel | `components/pro/GagnantsClient.tsx:320-325` | `marquerRelance` appelé à l'ouverture du brouillon | Libellé « Préparer l'email de relance » + aide « envoyez-le depuis votre messagerie » ; marquer « brouillon ouvert le … » plutôt que « relancé » |
| P1-2 | Promesse « station sur la carte » non tenue sans GPS | `ParcoursCreation.tsx:714` ; `app/dashboard/demandes-rattachement/page.tsx:148` | géocodage optionnel | Côté pro : dire « si l'adresse est localisée » ; côté SA : bloquer ou avertir à l'approbation |
| P1-3 | « déjà choisi » vs étape « Jeu » vs « choisissez le jeu » | `ParcoursCreation.tsx:947,950` + étapier | moteur unique | Retirer l'étape Jeu en mode rejoindre, corriger l'encart visiteur |
| P1-4 | PIN « de votre fiche de retrait » introuvable | `GagnantsClient.tsx:347` | référence à un document SA | Afficher `EncartPin` au-dessus de la liste gagnants côté pro |
| P1-5 | Règle « un tour par jour » fausse pour le digital | `JouerClient.tsx` / `ParcoursHero.tsx` | texte unique pour 2 règles | Texte selon `qr.digital` |
| P1-6 | Premiere-fois : 4 étapes affichées / « 7 étapes · 3 minutes » | `app/pro/premiere-fois` | compteur du formulaire, pas des étapes affichées | « 4 étapes » et durée réaliste ; annoncer le blocage avant paiement |
| P2-1 | Jargon pro : Super Admin, QR tracés, station, master, banque, tirage mutualisé | `app/pro/super/page.tsx:147`, `ParcoursCreation.tsx` | vocabulaire interne | Glossaire coherence.md §2 |
| P2-2 | « Marquer remis sans PIN » ne dit pas qu'il ne décompte pas le stock | `GagnantsClient.tsx` | conséquence affichée après coup | Sous-texte « ne décompte pas le stock » |
| P2-3 | Approbation SA sans conséquence affichée ; fin wizard-pro sans « et après » | `demandes-rattachement/page.tsx`, `wizard-pro` | — | Une ligne sous chaque bouton |
| P2-4 | Billet : pas de date limite ni de mode de retrait | `ParcoursOutro.tsx:25` | — | Phrase cible J4 |

## Phrases cibles (une ligne par étape)
- Inscription pro : « 4 étapes ; votre espace s'ouvre dès que le paiement est validé. »
- Tableau de bord : « Votre prochaine action : 14 lots à remettre. »
- Rejoindre (début) : « Choisissez l'événement : le jeu est fourni par l'organisateur, vous ajoutez vos lots. »
- Rejoindre (fin) : « Demande envoyée. Réponse par email sous 48 h ouvrées ; votre QR arrivera ensuite dans Mes animations. »
- Créer une animation (fin) : « Votre jeu est en ligne dès le [date] ; imprimez votre QR ci-dessous. »
- Lots : « Lot immédiat : gagné et retiré tout de suite. Lot au tirage : tiré au sort le [date]. »
- QR / affiche : « Imprimez l'affiche et posez-la à la caisse : chaque scan ouvre votre jeu. »
- Carte : « Votre commerce sur la carte des joueurs ; une correction est publique immédiatement. »
- Gagnants / PIN : « Le client montre son billet : tapez votre PIN pour le valider et décompter le stock. »
- Relance : « Prépare un email au gagnant dans votre messagerie : c'est vous qui l'envoyez. »
- SA créer un pro : « Le pro reçoit ses accès par email ; son espace s'ouvre après paiement. »
- SA super event : « Partagez ce lien ; les demandes des commerces arrivent dans Demandes de participation. »
- SA demande : « Approuver crée la station sur la carte (adresse localisée requise) et prévient le pro. »
- SA tirage : « Le tirage désigne les gagnants parmi les tickets ; ils sont prévenus par email. »
- Joueur accueil : « [Commerce] t'offre une partie gratuite, sans achat. »
- Joueur règles : « Une partie par jour chez ce commerce · règlement complet ici. »
- Joueur inscription : « Ton email sert à t'envoyer ton gain » (+ mention exacte du partage au commerçant).
- Joueur billet : « Montre ce billet chez [commerce] avant le [date] : il le valide et te remet ton lot. »

## Non vérifié
- Envoi réel d'un email au pro à l'approbation d'une demande ou à la création par le SA (non lu, aucune écriture).
- Écran de résultat/billet réel hors aperçu (pas de partie jouée : écriture interdite).
- Gating effectif d'un event `upcoming` côté joueur (jouable avant date ?).
- Contenu de l'email de relance (`/nds/mail-gagnant.js`) et des textes du tirage SA.
- Pourquoi `/rejoindre?se=se-nds-2026` présélectionne un autre super event.
