# Audit du 17/11/2026 — Rapport final (contrôleur)

Pour Romain. Cinq experts ont audité l'app (jeux, profil, carte, cohérence, pro et super admin). J'ai refait les
vérifications sur une copie fraîche de `main` (build de production, téléphone 390 x 844, mode démo `?demo=1`),
contrôlé qu'aucune fonction n'avait disparu, puis terminé ce qui restait.

Les planches sont dans **Validation → onglet « Audit 17/11 »** (`/validation/index.html#audit17`).
Les captures du profil et de l'espace pro / SA ne sont **pas** publiées : elles montrent des données réelles.

## Sécurité des tests : rien n'est écrit en base
- Toutes les pages testées en `?demo=1` : **0 requête d'écriture** vers Supabase (contrôle automatique, chaque écriture
  aurait été bloquée et comptée).
- Les anciennes adresses `/parcours/quiz|quizsolo|spin|tombola|vote` redirigent vers `/jouer` **en gardant `demo=1`** (vérifié).
- **Corrigé** : un QR permanent `/q/<code>?demo=1` perdait le mode démo à la redirection. Il le garde maintenant.
- `/pro/rejoindre` et `/rejoindre` : formulaires d'inscription pro, rien n'est écrit sans envoi du formulaire.

## Jeux
- Trouvé par l'expert 1 : tombola bloquée (impossible d'enregistrer sa participation), démo qui écrivait en base,
  gestes inutiles, cases perdues après une erreur, choix « rester en contact » absents.
- Vérifié : quiz, quiz solo, roue jouent du flash au ticket en démo, sans erreur, sans écriture.
  Gestes du flash au ticket : quiz + bonus 29 → 21, quiz solo 22 → 14, roue 13 → 10, tombola bloquée → 10.
- **Fait par moi** : le formulaire de coordonnées tenait sur environ 760 px de défilement. Il est maintenant en
  **2 volets (carrousel)**, chacun **sans défilement à 390 x 844** :
  1. prénom, nom, e-mail, téléphone, code postal, sexe (Homme / Femme) ;
  2. tranche d'âge, « comment nous as-tu connus », les 3 cases (jeu obligatoire, « rester en contact avec Flowin
     Event », « rester en contact avec ce commerce ») et la phrase « jamais vendues, échangées ni commercialisées ».
  Mêmes champs, mêmes cases, aucune cochée par défaut. « Continuer » vérifie le volet 1 ; « Modifier mes coordonnées » y revient.
- **Fait par moi** : les anciennes présentations de jeu (`masterOff`, `ParcoursConsentement`) reprennent le nouveau texte :
  « Je souhaite rester en contact avec Flowin Event : offres, bons deals, prochains events. » + la phrase « jamais
  vendues… ». Donnée collectée inchangée (`joueurs.optin`), version `flowin-consentement-2026-11-17`.
- Reste : la case « rester en contact avec ce commerce » n'existe pas dans ces anciennes présentations (l'ajouter
  changerait les données collectées) ; tous les QR actuels utilisent les nouveaux jeux, qui l'ont.

## Profil participant (/moi)
- Trouvé par l'expert 2 : les lots Nuits du Sud s'affichaient « Expiré » et sans QR (bloquant), choix de contact
  invisibles, aucune aide pour retrouver son compte.
- Corrigé : 5 rubriques sans scroll, lots NDS « Sans date limite », QR plein écran en 1 toucher, consentements modifiables.
- **Régression trouvée et corrigée** : le détail des tickets **par opération et par commerce** (présent avant l'audit)
  avait été réduit à un simple total. Il est rétabli dans « Mon compte ».
- À trancher : connexion par lien magique e-mail (aujourd'hui : « rejoue avec le même e-mail »).

## Carte
- Trouvé par l'expert 3 : carte peu lisible, pas d'itinéraire en un geste.
- Corrigé : MapLibre + OpenFreeMap (gratuit), « Autour de moi », carrousel synchronisé, itinéraire Waze / Plans / Google Maps.
- **Fait par moi** : erreur console `g.map` sur la carte du super admin. Cause probable : réponse de la base pas sous
  forme de liste, ou `jeux` / GPS vides. Les données sont maintenant nettoyées avant affichage (carte SA et carte publique).
  Non revérifié connecté en super admin (pas de session SA dans l'environnement de test).
- Reste : d'autres cartes sont encore en Leaflet (NDS2026, interdit de modification ; `nds-carte`, `dashboard.html`,
  `nds-parcours.html`). La carte s'enrichira quand les commerces auront GPS, logo, lots et horaires.

## Cohérence app / films / plaquettes
- Trouvé par l'expert 4 : roue, quiz, tombola différents entre l'app, les films et les plaquettes ; bouton violet.
- Corrigé : plaquette animation V3 = vraies captures de l'app ; roue (pointeur rouge, jante sombre), quiz (réponse en
  couleur pleine, commerce visible), tombola (billet visible) ; bouton principal bleu #3B5CC4 (plus de violet).
- À trancher : re-rendre la scène « roue » des films 2 et 5 avec la roue de l'app (non bloquant).

## Pro & super admin
- Trouvé par l'expert 5 : tableaux coupés sur téléphone, listes interminables, petites cibles.
- Corrigé : tableaux en cartes par 10 (« Afficher 10 de plus »), cibles 44 px (ex. /pro/banques 51 → 1 petite cible,
  /pro/compte 24 → 1), kanban en carrousel ; ordinateur inchangé.
- **Fait par moi** : `dashboard.html` (+ miroir identique) : sur téléphone, boutons, champs, menus à 44 px minimum et
  aucun débordement horizontal ; page de connexion : 3 → 0 petite cible, largeur 390 sans débordement.
  Acorn 2020 : 0 erreur ; MD5 des deux fichiers identique.
- Reste (proposé par l'expert 5) : filtres du CRM pro repliables ; banques et lots NDS regroupés par rubrique.

## Contrôle de non-régression (avant audit : commit 2c113413)
- `dashboard.html` : 154 colonnes de tableau, 494 boutons, 612 actions : identiques avant / après.
- Cases « rester en contact avec Flowin Event », « rester en contact avec ce commerce », phrase « jamais vendues… » :
  présentes dans les jeux et dans le profil.
- Plaquette V3 : les maquettes dessinées des jeux ont été remplacées par des captures réelles (voulu).
- Seule régression trouvée : détail des tickets du profil (rétabli, voir plus haut).

## Décisions pour Romain
1. `lot.html` : les conditions NDS des partenaires disent « valable jusqu'au 25 octobre 2026 », alors que NDS n'a pas
   de date limite. **Non modifié** (décision en attente).
2. Ordre parrainage → coordonnées : **tranché le 17/11 : parrainage en fin de parcours (fait)**.
3. Connexion participant par lien magique e-mail : oui / non.
4. Films : re-rendre la roue ou garder les films tels quels.

## 17/11/2026 (suite) : parrainage en fin de parcours et dans le profil

Décision de Romain appliquée (remplace l'ordre du 31/10, point 2 ci-dessus tranché) : le parrainage vient **à la fin**, comme NDS 2026.

- **Ordre des jeux masters** (`admin/lib/masters/engine.ts`) : jeu → résultat → coordonnées (formulaire en 2 volets inchangé, consentements inchangés) → ticket / billet → « Parrainer mes amis » → écran de parrainage (WhatsApp, SMS, email ; récompense existante `v.parrain`). Le retour depuis les coordonnées revient à l'écran précédent (repli : accueil). Déroulés et aperçu mis dans le même ordre (`apercu.ts`).
- **Sortie de l'écran de parrainage** : barre Jouer / Commerces / Partenaires / Profil (aucune impasse). Roue perdue : « Parrainer 3 amis » ouvre toujours le parrainage (règle de relance inchangée).
- **Anciens parcours** (`app/parcours/*`) : le partage est déjà sur l'écran ticket, rien à changer. NDS 2026 non modifié.
- **Profil `/moi`** : carte « Parrainer mes amis » dans la rubrique Compte (5 onglets conservés, pas de défilement de page). Même mécanisme (`buildInviteLink`, `ref` = `external_id` du joueur, `source=parrainage`, partage natif sinon WhatsApp, SMS, email). Avec `?demo=1` sans compte : profil fictif, aucune lecture ni écriture, message « lien prêt, rien n'est envoyé ».
- **Fuite corrigée** : `/parcours/quizmaster?ev=…&demo=1` renvoyait vers le bon jeu en perdant `demo=1` (`versBonJeuSiAutre`), d'où des tentatives d'écriture `joueurs`. `demo` est désormais conservé.

Contrôle Playwright (390 px, build local, `?demo=1`) : quiz, quiz + bonus, quiz solo, roue (ev-demo-spin, ev-flowin-demo), tombola, vote (`/jouer?m=vote`), quizmaster (renvoyé vers quiz) : tous arrivent jusqu'au ticket puis au parrainage, sortie vers le profil vérifiée ; **0 requête non-GET vers supabase.co**. Gestes jusqu'au ticket : **1 de moins** par jeu (le passage obligé « Continuer : mes coordonnées » sur l'écran de parrainage disparaît). `/moi?demo=1` : carte parrainage OK, 5 onglets, pas de défilement.

## 17/11/2026 (fin) : chemins de jeu restants vérifiés de bout en bout

Build local de `main` (copie de travail, `next start`, 390 x 844), toujours avec `?demo=1`, données fictives
(« Prénom Exemple », `prenom.exemple@example.com`). Toutes les requêtes non-GET vers supabase.co étaient
enregistrées et bloquées : **0 sur l'ensemble des parcours**.

| Chemin | Résultat | Écrans parcourus |
|---|---|---|
| Roue, gain immédiat → billet (`ev-demo-spin`) | **corrigé puis validé** | flash, accueil, règles, roue, ça tourne, gain immédiat, coordonnées (2 volets), billet, parrainage, profil |
| Roue, gain immédiat → billet (`ev-flowin-demo`, « Découvrez Flowin ») | **corrigé puis validé** | idem ; lot « Mon 1er event offert » |
| « Découvrez Flowin », case perdue | validé | roue → « Pas cette fois » → « Parrainer 3 amis » → parrainage (règle de relance, pas de formulaire) ; cette roue n'a pas de case « ticket » |
| Tombola (`ev-demo-tombola`) | validé | flash, accueil, règles, tirer, impression, résultat, coordonnées (2 volets), ticket, parrainage, profil |
| Quiz + bonus (`ev-demo-quiz`) | validé | 5 questions, résultat, bonus : **les 4 questions répondues**, « +1 ticket », coordonnées, ticket, parrainage, profil |
| `/moi?demo=1` après la roue | **corrigé puis validé** | lot « Surprise » dans Mes lots (Démo · Roue, À utiliser, QR, n° de billet) ; QR plein écran en 1 toucher ; carte « Parrainer mes amis » (« lien prêt, rien n'est envoyé ») ; pas de défilement de page |

Billet de la roue : nom du commerce (en-tête du billet et « Où »), lot, QR, n° de billet, « Valable jusqu'au »
(placeholder `[date du tirage à compléter]` sur les events de démo sans date), « Voir mon lot dans mon profil ».
Pas de logo sur le billet : le modèle n'en prévoit pas (monogramme dans l'en-tête des écrans de jeu) ; non modifié.

Corrections :
- **Billet jamais montré en démo** : sur un event de démonstration existant en base, `?demo=1` coupe les écritures,
  donc la base ne renvoie jamais de gain ; la case « gain immédiat » finissait sur le ticket de tirage. En mode démo,
  le billet de la case est maintenant montré (rien n'est écrit) ; condition affichée « Gain immédiat » au lieu de
  « le commerce n'a pas encore saisi ses lots » (`app/jouer/JouerClient.tsx`, `lib/masters/engine.ts`).
- **`/moi?demo=1` vide après une partie** : la partie de démo laisse un identifiant local fictif (`demo-…`), le profil
  cherchait alors en base et n'affichait rien. Ce cas est traité comme la démo (profil fictif, aucune lecture) et le
  lot gagné pendant la démo, rangé dans l'onglet, apparaît dans « Mes lots » (`app/moi/page.tsx`).

Aucune redirection ne perd `demo=1` sur ces chemins. Captures : `tests-fin/` et `planche.png` (dossier de travail).

