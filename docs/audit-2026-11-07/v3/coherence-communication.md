# Audit COHÉRENCE DE LA COMMUNICATION — Flowin Events — 2026-11-07 (v3)

Méthode : lecture de code (grep fichier:ligne) sur `admin/` et `supabase/functions/`, MCP Supabase lecture seule (`list_edge_functions`, `get_edge_function`, 1 SELECT sur `packs_participation`). Aucun email envoyé, aucun fichier modifié. Complète v2/coherence.md (vocabulaire, KPI, charte : non refaits).

## 1. Inventaire des messages sortants

| # | Message | Déclencheur | Expéditeur | Reply-to | Destinataire | Objet | Signature / coordonnées | Statut |
|---|---|---|---|---|---|---|---|---|
| E1 | notify-souscription | souscription partenaire NDS | `NDS x Flowin <onboarding@resend.dev>` (`supabase/functions/notify-souscription/index.ts:26`) | email du contact (:155) | flowinevent@gmail.com (interne) | « 🤝 Nouvelle souscription NDS — nom (pack) » (:52, emoji) | — | déployée v3 |
| E2 | notify-bon-commande | signature bon de commande | `NDS x Flowin <onboarding@resend.dev>` (:12) | email client (:94) | interne + copie client | « Bon de commande - <client> » | « BAITA EURL · OPConsult · info@opconsult.co · 06 16 35 49 36 » (:132) | déployée v3 |
| E3 | send-ticket-gagnant | SA envoie le billet (`lib/dashboard.ts:464`, `public/dashboard.html:8194`) | `…<onboarding@resend.dev>` (:21) | flowinevent@gmail.com (:69) | joueur gagnant | ticket | « flowinevent@gmail.com · 06 16 35 49 36 » (:104) | déployée v3 |
| E4 | send-resultat-tirage | résultat tirage | onboarding@resend.dev (:31) | flowinevent@gmail.com (:140) | joueur | « Résultat du tirage — commerce » | — | **non déployée** (absente de la liste MCP) |
| E5 | notify-commande-animation | commande animation magasin (`lib/animationMagasin.ts:124`) | `Flowin <onboarding@resend.dev>` (:31) | — | interne | `m.sujet` + PDF | bon PDF : 04 93 59 91 37 · info@opconsult.co (`_shared/bon-commande-pdf.js:84`) | **non déployée → appel 404** |
| E6 | notify-rappel | formulaire « être rappelé » (`public/plaquette-super-event.html:860`, `plaquette-animation-magasin.html:1386`) | `Flowin <onboarding@resend.dev>` (:20) | email prospect | flowinevent@gmail.com | « Demande de prise de rendez-vous » | — | **non déployée → le prospect voit l'écran d'échec, la demande est perdue** |
| E7 | notify-migration-eleve | migration Flowin Révision | `Flowin Révision <onboarding@resend.dev>` | — | élève | « Flowin Révision a fait peau neuve… » | lien `flowin-revisions.vercel.app` | déployée, **absente du dépôt** (autre produit, même projet Supabase) |
| E8 | reset-partenaire-revision, cron-cloture-ligue, generer-ia | — | — | — | — | — | — | déployées, absentes du dépôt (non lues) |
| G1 | Mail gagnant / relance / merci (Gmail pré-rempli) `public/nds/mail-gagnant.js:52-170` | SA clique | boîte flowinevent@gmail.com (authuser) | — | joueur | « Nuits du Sud & Flowin — Ton lot t’attend toujours ! » / « Merci d’être passé ! » / hors NDS : « X & Flowin — **Vous** avez gagné ! » (:59) | « flowinevent@gmail.com · 04 93 59 91 37 » (:102,113,150) | OK sauf vouvoiement joueur hors NDS |
| G2 | `mailPartenaireUrl` `lib/nds.ts:125-150` | SA, nds-lots | flowinevent@gmail.com | — | pro | « Nouveau gagnant à valider — lot » | « Flowin & les Nuits du Sud / flowinevent@gmail.com · 04 93 59 91 37 » | « Hey, salut » + vous |
| G3 | `mailPartenaireRelanceUrl` `lib/nds.ts:160+` | SA | idem | — | pro | « … — Rappel envoyé à vos gagnants non retirés » | idem | idem |
| G4 | Textes legacy dashboard `public/dashboard.html:8410,8659,8671` | SA legacy | gmail | — | joueur | — | « L’équipe des Nuits du Sud & Flowin / flowinevent@gmail.com · 04 93 59 91 37 » | doublon de G1 |
| G5 | « Demande de modification » `public/dashboard.html:5911` | pro (legacy) | mailto | — | **romain@opconsult.fr** | « [Flowin] Demande de modification » | — | domaine différent (.fr vs .co) |
| G6 | CRM pro `components/pro/CrmPro.tsx:104`, `app/pro/crm/[id]/page.tsx:67` | pro | sa propre boîte | — | ses clients | nom du pro | — | OK |
| A1 | Supabase Auth : confirmation inscription (`components/pro/PremiereFois.tsx:245` signUp) + reset (`app/pro/connexion/page.tsx:55`) | pro | expéditeur Supabase par défaut (gabarit non lisible via MCP) | — | pro | gabarit Supabase | — | **non vérifié**, probablement gabarit anglais par défaut |
| — | Demande de rattachement (`app/rejoindre/[se]/RejoindreClient.tsx:123`, `ParcoursCreation.tsx:564`) | pro | **aucun email** (insert seul) | — | — | — | — | ni Flowin ni le pro ne sont notifiés |
| — | Validation / refus rattachement (`app/dashboard/demandes-rattachement/page.tsx:60,78`) | SA | **aucun email** ; le pro le découvre dans `/pro/super` (`app/pro/super/page.tsx:54`) | | | | | |
| W1 | Partage joueur wa.me `app/jouer/JouerClient.tsx:358`, `parcours/{vote,quiz,tombola,spin,nds2026}` | joueur | — | — | contacts | texte par module | — | 6 implémentations séparées |
| W2 | Texte type invitation (fin de création) `components/creation/ParcoursCreation.tsx:703-708` | pro | — | — | clients du pro | « Bonjour, Nous sommes heureux de vous inviter… » | aucune | vous OK |
| W3 | Contact WhatsApp landing `app/landing/LandingClient.tsx:472` (wa.me/33616354936), `/nds` `app/nds/NdsClient.tsx:72` (numéro config) | prospect | | | | | | |
| S1 | Écrans : « Demande envoyée » / « Flowin valide votre participation… » (`ParcoursCreation.tsx:711-715`), « Demande envoyée à Flowin » (:690), « Confirmez votre adresse email (message envoyé) » (:731) | | | | | | | promettent un suivi sans email de suivi |

## 2. Variantes de coordonnées

| Élément | Variantes | Où |
|---|---|---|
| Email | **flowinevent@gmail.com** (≈90 occurrences : emails, kit digital SVG, signatures) | `lib/comm.ts:42`, `mail-gagnant.js`, kit-digital/*.svg |
| | **info@opconsult.co** (≈40 : landing, bon de commande, PDF, facture) | `LandingClient.tsx:481`, `_shared/bon-commande-pdf.js:84`, `notify-bon-commande:132` |
| | **romain@opconsult.fr** (domaine .fr) | `public/dashboard.html:5911,7019` (+ miroir static) |
| | `nflowinevent@gmail.com` (7, artefact `\n` + email dans des chaînes, à vérifier rendu) | grep brut |
| | flowin.events : **0 occurrence dans les messages** (OK, domaine sans DNS) | |
| Téléphone | **04 93 59 91 37** (49) — fixe, signature par défaut `lib/comm.ts:43` | mail-gagnant, nds.ts, facture, plaquette |
| | **06 16 35 49 36** (13 + 7 au format +33) — mobile | `send-ticket-gagnant:104`, `notify-bon-commande:132`, kit-digital README/SVG, `LandingClient.tsx:471-472`, bons-prets |
| | Même signature « flowinevent@gmail.com · » suivie tantôt du 04 (mail-gagnant.js:102) tantôt du 06 (send-ticket-gagnant:104, kit-digital) | |
| Raison sociale | « BAITA EURL - Flowin » (PDF :82), « BAITA EURL · OPConsult » (notify-bon-commande:132), « OPConsult (BAITA EURL) », « OPConsult / BAITA EURL » (dashboard.html:7019), « Flowin, produit commercial de BAITA EURL » (PDF :133) | 5 formulations |
| Adresse | « 40 rue des Arcs, 06140 Vence » (PDF, facture, landing) vs « Vence 06140 » seul (dashboard.html:7019) | cohérent sur le fond |
| Signature joueur | « L’équipe des Nuits du Sud & Flowin » (dashboard legacy) vs « Flowin & les Nuits du Sud » (nds.ts) | |

## 3. Prix (base : `packs_participation` animation 1 331 € HT, sponsor 3 331 € HT, visibilité 500 € HT)

| Source | Visibilité | Animation | Sponsor |
|---|---|---|---|
| Base `packs_participation` | 500 | **1 331** | **3 331** |
| `lib/commercial.ts:178-183` (défauts Next) | 500 | 1 400 | 3 590 |
| `public/nds-partenaire.html:652,666,818` (prod) | 500 | 1 490 | 3 590 |
| `public/bon-commande-nds.html:381,413` (data-ht) | — | 1 490 | 3 590 |
| `components/creation/GrilleTarifs.tsx:7` (commentaire) | 500 | 1 49x | 3 590 |
| Nom du pack sponsor | « Sponsor officiel » (base, bon de commande) vs « Sponsor » (`lib/commercial.ts:183`) | | |

Trois prix différents pour le même pack Animation (1 331 / 1 400 / 1 490) ; aucun support visible n'affiche le prix en base. Le bon de commande (document contractuel) et l'email E2 calculent sur 1 490 / 3 590.

## 4. Ton
- Pro : vouvoyé partout (OK), mais ouverture « Hey, salut X ! » (`lib/nds.ts:137`) incohérente avec le registre des autres emails pro (« Bonjour »).
- Joueur : tutoyé (mail-gagnant NDS), **sauf** objet hors NDS « Vous avez gagné ! » (`mail-gagnant.js:59`).
- E1 objet avec emoji 🤝 (interdit côté affichage selon v2).

## 5. Expéditeur / délivrabilité
- **Tous** les emails Resend partent de `onboarding@resend.dev` : adresse de test Resend, qui n'envoie qu'au propriétaire du compte (flowinevent@gmail.com). Donc E2 copie client, E3 billet gagnant, E4 → **les destinataires externes ne reçoivent rien** tant que `NOTIFY_FROM(_ADDR)` ne pointe pas vers un domaine vérifié (secret non lisible ici : à confirmer dans Resend). Aucun domaine utilisable : flowin.events sans DNS, opconsult.co non vérifié dans le code.
- Deux noms d'expéditeur : « NDS x Flowin » (E1, E2) vs « Flowin » (E5, E6) vs nom d'opération (E3). Reply-to : client (E2), flowinevent@gmail.com (E3, E4), aucun (E5).
- Le même projet Supabase envoie aussi pour « Flowin Révision » (E7) avec le même secret Resend : risque de mélange de marque.

## 6. Liens dans les messages
- `https://flowin-events.vercel.app/bon-commande-nds.html`, `/cgv-nds.html`, `/dashboard.html` : routes existantes dans `admin/public/` (OK).
- Billets : `lienBillet(...)` (`lib/nds.ts`) → `/lot.html` présent (OK).
- E7 pointe `flowin-revisions.vercel.app/premiere-connexion` : hors dépôt, non vérifié.
- Fonctions appelées mais non déployées (E5, E6) : liens « morts » côté serveur.

## Note : 4/10

**Ce qui marche** : signature unique centralisée dans `lib/comm.ts:42-80` côté Next ; tutoiement joueur / vouvoiement pro globalement tenu ; aucun envoi depuis flowin.events ; liens internes valides ; Gmail pré-rempli depuis la vraie boîte flowinevent@gmail.com (seul canal qui atteint réellement les destinataires).

**Ce qui ne marche pas** : expéditeur de test Resend ; 2 fonctions appelées non déployées (rappel prospect perdu) ; aucun email sur rattachement / validation ; 3 prix pour un même pack ; 2 emails et 2 téléphones de contact alternés sans règle ; 5 formulations de raison sociale.

## Priorités

**P0-1 Expéditeur** — `supabase/functions/*/index.ts` (`NOTIFY_FROM` / `NOTIFY_FROM_ADDR` défaut `onboarding@resend.dev`). Cause : pas de domaine vérifié. Correctif : vérifier un domaine réel dans Resend (ex. opconsult.co, ou acheter/configurer flowin.events avec SPF/DKIM), poser le secret, puis tester un envoi vers une adresse externe. Sinon basculer billet gagnant sur Gmail pré-rempli.
**P0-2 notify-rappel / notify-commande-animation non déployées** — appelées par `public/plaquette-super-event.html:860`, `plaquette-animation-magasin.html:1386`, `lib/animationMagasin.ts:124`. Correctif : déployer (avec le P0-1) ou retirer le formulaire ; idem décider pour send-resultat-tirage.
**P0-3 Prix** — `lib/commercial.ts:178-183`, `public/nds-partenaire.html:652,666,818`, `public/bon-commande-nds.html:381-421`. Correctif : lire `packs_participation` partout (ou faire trancher Romain sur la valeur correcte et aligner la base) ; aucun document contractuel ne doit diverger de la base.
**P1-1 Rattachement muet** — `RejoindreClient.tsx:123`, `ParcoursCreation.tsx:564`, `demandes-rattachement/page.tsx:60,78`. Correctif : edge function (ou trigger) envoyant M2a/M2b/M3 ci-dessous.
**P1-2 Coordonnées** — choisir un couple unique (email + téléphone) et le mettre dans `lib/comm.ts` + `_shared/flowin-config.js` ; remplacer `romain@opconsult.fr` (`dashboard.html:5911,7019` + miroir), le 06 dans `send-ticket-gagnant:104`, `notify-bon-commande:132`, kit-digital. Raison sociale unique : « Flowin — BAITA EURL (OPConsult), 40 rue des Arcs, 06140 Vence ».
**P1-3 Gabarits Supabase Auth** — vérifier dans le dashboard Supabase (Auth > Templates, SMTP) : passer en français, même expéditeur que P0-1.
**P2-1** Objet « Vous avez gagné ! » → « Tu as gagné ! » (`mail-gagnant.js:59`). **P2-2** « Hey, salut » pro → « Bonjour » (`lib/nds.ts:137`, relance). **P2-3** Emoji objet E1 (`notify-souscription:52`). **P2-4** Expéditeur nommé unique « Flowin » (+ nom d'opération dans l'objet). **P2-5** Factoriser les 6 textes wa.me joueur. **P2-6** Séparer le compte Resend / projet de Flowin Révision (E7).

## Jeu de messages cible unifié

Règles : expéditeur `Flowin <contact@[domaine vérifié à compléter]>`, reply-to `flowinevent@gmail.com` (ou adresse unique retenue), signature unique :
> L’équipe Flowin — [email unique à choisir] · [téléphone unique à choisir]
> Flowin, produit de BAITA EURL (OPConsult) · 40 rue des Arcs, 06140 Vence

**M1 Inscription pro** — Objet : « Bienvenue sur Flowin — confirmez votre adresse email »
> Bonjour {prénom},
> Votre compte pro Flowin pour {commerce} est créé. Confirmez votre adresse en cliquant ici : {lien}. Vous pourrez ensuite créer votre animation ou rejoindre une opération depuis votre espace : https://flowin-events.vercel.app/pro
> [signature]

**M2a Demande de rattachement → Flowin** — Objet : « Nouvelle demande de participation — {commerce} → {super event} »
> {commerce} ({contact}, {email}, {tel}) demande à rejoindre {super event}. Pack choisi : {pack} ({prix base} € HT). Lots : {lots}. À traiter : https://flowin-events.vercel.app/dashboard/demandes-rattachement

**M2b Accusé de réception → pro** — Objet : « {super event} — nous avons bien reçu votre demande »
> Bonjour {prénom},
> Merci ! Votre demande de participation de {commerce} à {super event} est enregistrée (pack {pack}, {prix} € HT, tarif confirmé par Flowin). Nous la validons sous [délai à compléter] ; votre station apparaîtra alors sur la carte. Suivi : https://flowin-events.vercel.app/pro/super
> [signature]

**M3 Validation** — Objet : « {super event} — votre participation est validée »
> Bonjour {prénom},
> Bonne nouvelle : {commerce} participe à {super event}. Votre station est sur la carte et votre QR est prêt dans votre espace : {lien}. Prochaine étape : le bon de commande {lien bon}.
> [signature]
(Refus — Objet : « {super event} — votre demande de participation » ; corps : motif `note_sa`, invitation à nous appeler.)

**M4 Gagnant (joueur, tu)** — Objet : « {opération} & Flowin — Tu as gagné ! »
> Bravo {prénom} !
> Tu as gagné {lot} chez {commerce}. Ton billet : {lien billet} (n° {code}). Présente-le en boutique avant le {date limite à compléter} : le commerçant scanne le QR et te remet ton lot.
> L’équipe {opération} & Flowin — [coordonnées uniques]

**M5 Relance (joueur)** — Objet : « {opération} & Flowin — Ton lot t’attend toujours ! »
> Salut {prénom}, ton lot {lot} t’attend chez {commerce}. Ton billet : {lien}. Pense à passer avant le {date}.
> [signature joueur]
Relance (info pro) — Objet : « {opération} — rappel envoyé à vos gagnants » ; corps : « Bonjour {commerce}, nous avons relancé {n} gagnant(s) : {liste}. Rien à faire de votre côté : scannez le QR du billet à leur passage. » [signature]

## Non vérifié
- Valeurs réelles des secrets NOTIFY_FROM/NOTIFY_TO (non lisibles) : si un domaine vérifié est déjà configuré, P0-1 tombe.
- Gabarits et SMTP Supabase Auth (non exposés par MCP).
- Contenu de reset-partenaire-revision, cron-cloture-ligue, generer-ia ; textes personnalisés en base (`events.cfg`).
- Rendu des 7 occurrences `nflowinevent@gmail.com`.
